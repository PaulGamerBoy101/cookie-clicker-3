/**
 * systems/heavenlyLayout.ts — deterministic layout for the heavenly (prestige)
 * upgrade DAG, plus a small library of selectable *presets* the player can
 * click to re-arrange the tree.
 *
 * The default layout (computeHeavenlyLayout) is a Sugiyama-style layered
 * auto-layout derived from each upgrade's parents[] graph — see the long
 * comment on that function for the algorithm. The presets build on the same
 * graph primitives to offer alternative, hand-pickable arrangements:
 *
 *   - auto        : the Sugiyama layered layout (the default / reset target)
 *   - branch      : cluster upgrades by their heavenly "family" (the layer-1
 *                   ancestor they descend from) into separate vertical bands
 *   - generations : line every upgrade up by its depth from the root (a ladder)
 *   - grid        : pack all upgrades into a compact uniform grid by id
 *
 * applyHeavenlyPreset writes the chosen arrangement into the same
 * Game.ArrangeLayout override slot the drag-to-arrange mode uses (and persists
 * it to localStorage), so a preset behaves like a bulk drag: it survives
 * reloads and ascensions, and ResetHeavenlyLayout clears it back to the
 * derived default.
 */
import type { Game as EngineGame } from "../types";

/** Horizontal spacing between sibling upgrades within a layer. */
const NODE_GAP = 84;
/** Vertical spacing between layers. */
const LAYER_GAP = 150;
/** Number of barycenter ordering sweeps for the Sugiyama layout. */
const SWEEPS = 4;
/** Horizontal spacing between family "branches" in the branch preset. */
const BRANCH_GAP = 200;

interface Graph {
	nodes: any[];
	byId: Record<number, any>;
	parents: Record<number, any[]>;
	children: Record<number, any[]>;
}

/** Resolve parent/child adjacency, restricted to the prestige set. */
function buildGraph(g: any): Graph {
	const nodes: any[] = (g.PrestigeUpgrades || []).slice();
	const byId: Record<number, any> = {};
	for (const n of nodes) byId[n.id] = n;
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
	return { nodes, byId, parents, children };
}

/** Longest path from a root → layer; returns the rank map and empty layers. */
function longestPathLayers(g: Graph): { rankMemo: Record<number, number>; layers: number[][] } {
	const rankMemo: Record<number, number> = {};
	const inStack: Record<number, boolean> = {};
	function rank(n: any): number {
		if (rankMemo[n.id] !== undefined) return rankMemo[n.id];
		if (inStack[n.id]) return 0;
		inStack[n.id] = true;
		let r = 0;
		for (const p of g.parents[n.id]) r = Math.max(r, rank(p) + 1);
		inStack[n.id] = false;
		rankMemo[n.id] = r;
		return r;
	}
	for (const n of g.nodes) rank(n);
	let maxLayer = 0;
	for (const n of g.nodes) if (rankMemo[n.id] > maxLayer) maxLayer = rankMemo[n.id];
	const layers: number[][] = [];
	for (let l = 0; l <= maxLayer; l++) layers.push([]);
	for (const n of g.nodes) layers[rankMemo[n.id]].push(n.id);
	return { rankMemo, layers };
}

/** Barycenter sweeps to untangle edge crossings (see computeHeavenlyLayout). */
function orderLayers(g: Graph, layers: number[][]) {
	const orderIndex: Record<number, number> = {};
	function reindex() {
		for (let l = 0; l < layers.length; l++)
			for (let i = 0; i < layers[l].length; i++) orderIndex[layers[l][i]] = i;
	}
	for (const layer of layers) layer.sort((a: number, b: number) => a - b);
	reindex();
	function bary(id: number, nbrs: any[]): number {
		if (nbrs.length === 0) return orderIndex[id];
		let sum = 0;
		for (const nb of nbrs) sum += orderIndex[nb.id];
		return sum / nbrs.length;
	}
	for (let s = 0; s < SWEEPS; s++) {
		if (s % 2 === 0) {
			for (let l = 1; l < layers.length; l++) {
				layers[l] = layers[l]
					.slice()
					.sort((a: number, b: number) => bary(a, g.parents[a]) - bary(b, g.parents[b]));
				reindex();
			}
		} else {
			for (let l = layers.length - 2; l >= 0; l--) {
				layers[l] = layers[l]
					.slice()
					.sort((a: number, b: number) => bary(a, g.children[a]) - bary(b, g.children[b]));
				reindex();
			}
		}
	}
}

/** Sugiyama placement: x by in-layer order, y by layer, layers shifted to sit under parents. */
function assignSugiyama(g: Graph, layers: number[][]): Record<number, [number, number]> {
	const orderIndex: Record<number, number> = {};
	for (let l = 0; l < layers.length; l++)
		for (let i = 0; i < layers[l].length; i++) orderIndex[layers[l][i]] = i;
	const positions: Record<number, [number, number]> = {};
	for (let l = 0; l < layers.length; l++) {
		const ids = layers[l];
		for (let i = 0; i < ids.length; i++) orderIndex[ids[i]] = i;
		let shift = 0;
		if (l > 0 && ids.length > 0) {
			let parentSumX = 0;
			let parentCount = 0;
			for (const id of ids)
				for (const p of g.parents[id]) {
					parentSumX += orderIndex[p.id] * NODE_GAP;
					parentCount++;
				}
			let layerSumX = 0;
			for (let i = 0; i < ids.length; i++) layerSumX += i * NODE_GAP;
			if (parentCount > 0) shift = parentSumX / parentCount - layerSumX / ids.length;
		}
		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			positions[id] = [Math.round(i * NODE_GAP + shift), Math.round(l * LAYER_GAP)];
		}
	}
	return positions;
}

/**
 * Compute and assign the default Sugiyama layout, mutating each upgrade's
 * posX/posY in place and populating Game.UpgradePositions. Called once at Init.
 */
export function computeHeavenlyLayout(Game: EngineGame) {
	const g = Game as any;
	const graph = buildGraph(g);
	const { layers } = longestPathLayers(graph);
	orderLayers(graph, layers);
	const positions = assignSugiyama(graph, layers);
	for (const idStr in positions) {
		const id = +idStr;
		const u = g.UpgradesById[id];
		if (u) {
			u.posX = positions[id][0];
			u.posY = positions[id][1];
		}
	}
	g.UpgradePositions = positions;
}

/** The selectable presets, in display order. */
export const HEAVENLY_PRESETS: { id: string; label: string; desc: string }[] = [
	{ id: "auto", label: "Auto", desc: "Re-derive the layered layout from the upgrade graph." },
	{ id: "branch", label: "By branch", desc: "Cluster upgrades by their heavenly family." },
	{ id: "generations", label: "By generation", desc: "Line every upgrade up by its depth from the root." },
	{ id: "grid", label: "Grid", desc: "Pack every upgrade into a compact uniform grid." },
];

/** Uniform grid packed by id. */
function layoutGrid(g: Graph): Record<number, [number, number]> {
	const ids = g.nodes.map((n) => n.id).sort((a: number, b: number) => a - b);
	const n = ids.length;
	const cols = Math.max(1, Math.ceil(Math.sqrt(n * (LAYER_GAP / NODE_GAP))));
	const positions: Record<number, [number, number]> = {};
	ids.forEach((id, i) => {
		positions[id] = [Math.round((i % cols) * NODE_GAP), Math.round(Math.floor(i / cols) * LAYER_GAP)];
	});
	return positions;
}

/** Ladder: one column per generation (depth from root). */
function layoutGenerations(g: Graph, rankMemo: Record<number, number>): Record<number, [number, number]> {
	const byLayer: Record<number, number[]> = {};
	for (const n of g.nodes) {
		const r = rankMemo[n.id];
		(byLayer[r] = byLayer[r] || []).push(n.id);
	}
	const positions: Record<number, [number, number]> = {};
	for (const rStr in byLayer) {
		const r = +rStr;
		const ids = byLayer[r].slice().sort((a: number, b: number) => a - b);
		ids.forEach((id, i) => {
			positions[id] = [Math.round(r * NODE_GAP * 1.4), Math.round(i * LAYER_GAP * 0.7)];
		});
	}
	return positions;
}

/** Family clustering: each upgrade stacks under its layer-1 ancestor. */
function layoutBranch(g: Graph, rankMemo: Record<number, number>): Record<number, [number, number]> {
	// The "founder" of a node is the layer-1 ancestor it descends from (or itself
	// for Legacy / layer-1 nodes). Every upgrade traces to Legacy (layer 0), so we
	// group by the *first* step off the root instead, which yields real families.
	function founderOf(id: number): number {
		const seen = new Set<number>();
		const stack = [id];
		const roots: number[] = [];
		while (stack.length) {
			const cur = stack.pop()!;
			if (seen.has(cur)) continue;
			seen.add(cur);
			if (rankMemo[cur] === 1) {
				roots.push(cur);
				continue;
			}
			for (const p of g.parents[cur]) stack.push(p.id);
		}
		return roots.length ? Math.min(...roots) : id;
	}
	const branchIndex: Record<number, number> = {};
	const branchIds: number[] = [];
	const branchNodes: Record<number, number[]> = {};
	for (const n of g.nodes) {
		const f = founderOf(n.id);
		if (branchIndex[f] === undefined) {
			branchIndex[f] = branchIds.length;
			branchIds.push(f);
		}
		(branchNodes[f] = branchNodes[f] || []).push(n.id);
	}
	const positions: Record<number, [number, number]> = {};
	for (const f of branchIds) {
		const ids = (branchNodes[f] || []).slice().sort((a: number, b: number) => a - b);
		const bx = branchIndex[f] * BRANCH_GAP;
		ids.forEach((id, i) => {
			const stagger = (i % 2 === 0 ? 1 : -1) * (8 + 4 * Math.min(i, 4));
			positions[id] = [Math.round(bx + stagger), Math.round(i * LAYER_GAP)];
		});
	}
	return positions;
}

/**
 * Compute the position map (id -> [x, y]) for a named preset. Pure: does not
 * mutate upgrade state. Falls back to the Sugiyama layout for unknown ids.
 */
export function computePresetLayout(Game: EngineGame, presetId: string): Record<number, [number, number]> {
	const g = Game as any;
	const graph = buildGraph(g);
	const { rankMemo, layers } = longestPathLayers(graph);
	if (presetId === "grid") return layoutGrid(graph);
	if (presetId === "branch") return layoutBranch(graph, rankMemo);
	if (presetId === "generations") return layoutGenerations(graph, rankMemo);
	// default: auto (Sugiyama)
	orderLayers(graph, layers);
	return assignSugiyama(graph, layers);
}

/**
 * Apply a preset as the active arrangement: write it into Game.ArrangeLayout
 * (so it persists to localStorage like a drag), update each upgrade's posX/posY,
 * remember which preset is active, and re-render the tree.
 */
export function applyHeavenlyPreset(this: any, presetId: string) {
	// Called as Game.ApplyHeavenlyPreset(id) (a method), so `this` is Game; fall
	// back to the global for any non-method call site.
	const g = this || (typeof window !== "undefined" ? (window as any).Game : null);
	if (!g) return;
	const positions = computePresetLayout(g, presetId);
	g.ArrangeLayout = {};
	for (const idStr in positions) {
		const id = +idStr;
		const u = g.UpgradesById[id];
		if (!u) continue;
		const x = Math.round(positions[id][0]);
		const y = Math.round(positions[id][1]);
		u.posX = x;
		u.posY = y;
		g.ArrangeLayout[id] = [x, y];
	}
	try {
		window.localStorage.setItem("cc3_heavenly_layout", JSON.stringify(g.ArrangeLayout));
	} catch (e) {}
	g.heavenlyPreset = presetId;
	if (g.UpdateHeavenlyPresetButtons) g.UpdateHeavenlyPresetButtons();
	if (g.BuildAscendTree) g.BuildAscendTree();
}

/**
 * Re-derive the heavenly layout if prestige upgrades were added after init.
 * Mods (casino, destiny, american season...) register their own prestige
 * upgrades by pushing into Game.PrestigeUpgrades once the base engine layout
 * has already run, so those never appear in the init-time defaults. When the
 * defaults no longer cover every prestige upgrade this recomputes the full
 * Sugiyama layout, refreshes _heavenlyLayoutDefaults, and re-applies any
 * player ArrangeLayout overrides on top (drags survive a re-layout). Cheap
 * no-op (a size comparison) when the defaults are already complete.
 * Returns true when a re-sync actually happened.
 */
/**
 * Fold prestige upgrades that appeared after the base-engine layout ran into
 * the layout bookkeeping WITHOUT moving them. Mods (casino, destiny, american
 * season...) register their own heavenly upgrades by pushing into
 * Game.PrestigeUpgrades and give them hand-placed positions, so re-running the
 * full Sugiyama layout over everything would clobber those coordinates. This
 * instead only records the missing upgrades in _heavenlyLayoutDefaults (the
 * Reset target) and in Game.UpgradePositions (the debug copy/export map),
 * leaving their positions untouched. The "auto" preset is the explicit way to
 * re-derive a clean full-tree layout over mod upgrades too.
 * Cheap no-op when the defaults already cover every prestige upgrade.
 * Returns true when upgrades were added to the bookkeeping.
 */
export function syncHeavenlyLayoutIfStale(this: any): boolean {
	const Game = this || (typeof window !== "undefined" ? (window as any).Game : null);
	if (!Game) return false;
	const defaults = Game._heavenlyLayoutDefaults || (Game._heavenlyLayoutDefaults = {});
	let added = 0;
	for (const u of Game.PrestigeUpgrades || []) {
		if (defaults[u.id] === undefined) {
			defaults[u.id] = [u.posX, u.posY];
			added++;
		}
	}
	if (Game.UpgradePositions && typeof Game.UpgradePositions === "object") {
		for (const u of Game.PrestigeUpgrades || []) {
			if (Game.UpgradePositions[u.id] === undefined) Game.UpgradePositions[u.id] = [u.posX, u.posY];
		}
	}
	return added > 0;
}
