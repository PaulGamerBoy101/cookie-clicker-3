/**
 * systems/heavenlyLayout.ts — deterministic Sugiyama-style auto-layout for the
 * heavenly (prestige) upgrade DAG.
 *
 * The original engine stored a hand-authored id -> [x, y] position table
 * (content/heavenlyPositions.ts). That table was fragile: every new upgrade
 * needed a manually chosen coordinate, and the coordinates carried no
 * information that the `parents[]` graph didn't already encode. This module
 * derives the layout from the DAG instead:
 *
 *   1. Layer every node by its longest path from a root (Legacy, or any
 *      parentless node). Roots sit in layer 0.
 *   2. Order nodes within each layer by a barycenter (median-of-neighbors)
 *      sweep — top-down using parents, bottom-up using children, repeated a
 *      few times — to untangle edge crossings.
 *   3. Assign x by in-layer order and y by layer, then shift each layer
 *      horizontally so its centroid sits under the centroid of its parents.
 *
 * The result is deterministic (no randomness, stable tie-breaks by id), so it
 * is safe to treat as the canonical default: player drags still override it
 * via Ascend.SaveHeavenlyLayout and ResetHeavenlyLayout restores it.
 */
import type { Game as EngineGame } from "../types";

/** Horizontal spacing between sibling upgrades within a layer. */
const NODE_GAP = 84;
/** Vertical spacing between layers. */
const LAYER_GAP = 150;
/** Number of barycenter ordering sweeps (more = fewer crossings, more cost). */
const SWEEPS = 4;

/**
 * Compute and assign positions for every prestige upgrade from the parents DAG.
 * Mutates each upgrade's posX/posY in place and populates Game.UpgradePositions.
 */
export function computeHeavenlyLayout(Game: EngineGame) {
	const g = Game as any;
	const nodes: any[] = (g.PrestigeUpgrades || []).slice();
	if (nodes.length === 0) return;

	const byId: Record<number, any> = {};
	for (const n of nodes) byId[n.id] = n;

	// Resolve parent/child adjacency, restricted to the prestige set. parents[]
	// may contain resolved Upgrade objects, the sentinel -1, or (defensively)
	// leftover string ids; we keep only in-set Upgrade objects and de-dupe.
	const parents: Record<number, any[]> = {};
	const children: Record<number, any[]> = {};
	for (const n of nodes) {
		parents[n.id] = [];
		children[n.id] = [];
	}
	for (const n of nodes) {
		const ps = n.parents || [];
		for (const p of ps) {
			if (p === -1 || p == null || typeof p !== "object") continue;
			if (!byId[p.id] || p.id === n.id) continue; // unknown or self-loop
			if (parents[n.id].indexOf(p) === -1) parents[n.id].push(p);
			if (children[p.id].indexOf(n) === -1) children[p.id].push(n);
		}
	}

	// Layer = longest path from a root. Memoized DP with a cycle guard: a node
	// already on the current recursion stack is treated as a root (avoids
	// infinite recursion and keeps the layer finite).
	const rankMemo: Record<number, number> = {};
	const inStack: Record<number, boolean> = {};
	function rank(n: any): number {
		if (rankMemo[n.id] !== undefined) return rankMemo[n.id];
		if (inStack[n.id]) return 0;
		inStack[n.id] = true;
		let r = 0;
		for (const p of parents[n.id]) r = Math.max(r, rank(p) + 1);
		inStack[n.id] = false;
		rankMemo[n.id] = r;
		return r;
	}
	for (const n of nodes) rank(n);

	// Group ids by layer (0..maxLayer).
	let maxLayer = 0;
	for (const n of nodes) if (rankMemo[n.id] > maxLayer) maxLayer = rankMemo[n.id];
	const layers: number[][] = [];
	for (let l = 0; l <= maxLayer; l++) layers.push([]);
	for (const n of nodes) layers[rankMemo[n.id]].push(n.id);

	// Initial in-layer order: by id (stable, deterministic).
	for (const layer of layers) layer.sort((a: number, b: number) => a - b);

	// orderIndex: id -> position within its layer (used for barycenters).
	const orderIndex: Record<number, number> = {};
	function reindex() {
		for (let l = 0; l < layers.length; l++)
			for (let i = 0; i < layers[l].length; i++) orderIndex[layers[l][i]] = i;
	}
	reindex();

	function bary(id: number, nbrs: any[]): number {
		if (nbrs.length === 0) return orderIndex[id];
		let sum = 0;
		for (const nb of nbrs) sum += orderIndex[nb.id];
		return sum / nbrs.length;
	}

	// Barycenter sweeps: alternate top-down (align under parents) and bottom-up
	// (align above children). Each sweep re-sorts a layer by its neighbors'
	// barycenters; the sort is stable on equal keys so ties break by id.
	for (let s = 0; s < SWEEPS; s++) {
		if (s % 2 === 0) {
			for (let l = 1; l < layers.length; l++) {
				layers[l] = layers[l]
					.slice()
					.sort((a: number, b: number) =>
						bary(a, parents[a]) - bary(b, parents[b])
					);
				reindex();
			}
		} else {
			for (let l = layers.length - 2; l >= 0; l--) {
				layers[l] = layers[l]
					.slice()
					.sort((a: number, b: number) =>
						bary(a, children[a]) - bary(b, children[b])
					);
				reindex();
			}
		}
	}

	// Final pass: assign coordinates. Per non-root layer, shift the whole layer
	// horizontally so its centroid lands under the centroid of its parents.
	const positions: Record<number, [number, number]> = {};
	for (let l = 0; l < layers.length; l++) {
		const ids = layers[l];
		for (let i = 0; i < ids.length; i++) orderIndex[ids[i]] = i;

		let shift = 0;
		if (l > 0 && ids.length > 0) {
			let parentSumX = 0;
			let parentCount = 0;
			for (const id of ids)
				for (const p of parents[id]) {
					parentSumX += orderIndex[p.id] * NODE_GAP;
					parentCount++;
				}
			let layerSumX = 0;
			for (let i = 0; i < ids.length; i++) layerSumX += i * NODE_GAP;
			if (parentCount > 0) shift = parentSumX / parentCount - layerSumX / ids.length;
		}

		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			const x = Math.round(i * NODE_GAP + shift);
			const y = Math.round(l * LAYER_GAP);
			const node = byId[id];
			node.posX = x;
			node.posY = y;
			positions[id] = [x, y];
		}
	}

	g.UpgradePositions = positions;
}
