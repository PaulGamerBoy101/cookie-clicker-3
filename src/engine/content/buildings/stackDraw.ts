/**
 * content/buildings/stackDraw.ts — shared "1-per-row, staggered, overlapping"
 * vertical-stack layout used by every building except Grandma and Cats (and
 * Farm / Mine, which layer their own sprite rendering on top of this layout).
 *
 * The earlier per-building canvas draws spread sprites horizontally in a grid.
 * This module replaces that with a bottom-anchored column: one building per
 * row, each offset left/right of the one below it (a stagger) and overlapping
 * the one below by STACK_OVERLAP of its height, so the buildings read as a
 * fanned, slightly-overlapping stack — like a hand of cards leaning back.
 *
 * It is pure layout: callers still own how each sprite is cropped/drawn, they
 * just ask `stackPosition` where sprite `i` should sit.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Fraction of a building's height the one above overlaps onto the one below. */
export const STACK_OVERLAP = 0.35;
/** Target on-screen sprite height (px); sprites scale down to fit ~3 rows. */
export const STACK_TARGET_H = 54;
/** Max horizontal left/right offset between alternating rows (px). */
export const STACK_STAGGER = 16;
/** Random positional jitter so the stack doesn't look mechanically placed. */
export const STACK_JITTER = 3;

export interface StackOpts {
	overlap?: number;
	stagger?: number;
	jitter?: number;
}

/**
 * Where should sprite `i` (0 = front/bottom row) sit in a bottom-anchored
 * vertical stack of `count` sprites? Returns top-left x/y plus z (== y, so
 * the sort-by-z draw order paints back rows first and the front row on top).
 *
 * `drawW`/`drawH` are the on-screen (already scaled) sprite dimensions, used to
 * center the column and to compute the vertical step between rows.
 *
 * Callers must seed Math.random (e.g. Math.seedrandom) before calling so the
 * jitter is deterministic per sprite; positions are stored on the pic and only
 * recomputed when the building count changes.
 */
export function stackPosition(
	i: number,
	canvasW: number,
	canvasH: number,
	drawW: number,
	drawH: number,
	opts: StackOpts = {}
): { x: number; y: number; z: number } {
	const overlap = opts.overlap ?? STACK_OVERLAP;
	const stagger = opts.stagger ?? STACK_STAGGER;
	const jitter = opts.jitter ?? STACK_JITTER;

	// Vertical distance between consecutive rows: smaller than a full sprite so
	// the upper building overlaps the lower one by `overlap` of its height.
	const vStep = Math.max(1, drawH * (1 - overlap));
	// Bottom-anchored: the front/bottom sprite sits flush with the canvas floor.
	const yBase = canvasH - drawH - 2;
	// Center the single column horizontally.
	const cx = (canvasW - drawW) / 2;

	const row = i;
	// Alternate the stagger direction per row and let it widen slightly with
	// depth, so the fan opens up as it recedes.
	const dir = row % 2 === 0 ? 1 : -1;
	const amp = stagger * (0.5 + 0.5 * Math.min(row, 4) / 4);

	const x = cx + dir * amp + (Math.random() - 0.5) * jitter;
	const y = yBase - row * vStep + (Math.random() - 0.5) * jitter;
	return { x, y, z: y };
}

/**
 * Build a `draw` function for a building whose sprites live on a horizontal
 * frame-strip sheet (the common case: `art.pic` is the sheet, `art.frames` the
 * number of equal-width cells). Each visible sprite is scaled to
 * STACK_TARGET_H and placed by `stackPosition`.
 *
 * Buildings with a `pic` function (Grandma) or bespoke rendering (Farm, Mine,
 * Cats) do NOT use this — they keep their own draw routines.
 */
export function makeStackDraw(Game: EngineGame) {
	return function (this: Building) {
		if (this.amount <= 0 || !this.canvas || !this.ctx) return false;
		if (this.toResize) {
			this.canvas.width = this.canvas.clientWidth;
			this.canvas.height = this.canvas.clientHeight;
			this.pics = []; // canvas re-sized: recompute centred positions next
			this.toResize = false;
		}
		const ctx = this.ctx;
		ctx.globalAlpha = 1;
		const bg: any = this.art.bg;
		if (typeof bg === 'string') ctx.fillPattern(Pic(bg), 0, 0, this.canvas.width, this.canvas.height, 128, 128);
		else if (typeof bg === 'function') bg(this, ctx);

		const sheet = Pic(this.art.pic);
		// The first draw can race the sprite-sheet load: Pic() returns a tiny
		// placeholder (Game.Loader.blank) until the real sheet arrives, so pics
		// built then would carry the placeholder's dimensions forever. If the
		// sheet's size changes (placeholder -> loaded), drop the stale pics so the
		// next block rebuilds them at the correct size.
		if (sheet.width !== this._stackSheetW || sheet.height !== this._stackSheetH) {
			this.pics = [];
			this._stackSheetW = sheet.width;
			this._stackSheetH = sheet.height;
		}
		const frames = this.art.frames || 1;
		const nativeW = sheet.width / frames;
		const nativeH = sheet.height;
		const scale = Math.min(1, STACK_TARGET_H / nativeH);
		const drawW = nativeW * scale;
		const drawH = nativeH * scale;

		const canvasW = this.canvas.width;
		const canvasH = this.canvas.height;
		const vStep = Math.max(1, drawH * (1 - STACK_OVERLAP));
		const maxRows = Math.max(1, Math.floor((canvasH - drawH) / vStep) + 1);
		const iT = Math.min(this.amount, maxRows);

		let i = this.pics.length;
		if (i !== iT) {
			while (i < iT) {
				Math.seedrandom(Game.seed + ' ' + this.id + ' ' + i);
				const pos = stackPosition(i, canvasW, canvasH, drawW, drawH);
				let frame = -1;
				if (frames > 1) frame = Math.floor(Math.random() * frames);
				this.pics.push({
					x: Math.floor(pos.x), y: Math.floor(pos.y), z: pos.z,
					pic: this.art.pic, id: i, frame: frame,
					drawW, drawH, born: Game.T
				});
				i++;
			}
			while (i > iT) {
				this.pics.sort(Game.sortSpritesById);
				this.pics.pop();
				i--;
			}
			this.pics.sort(Game.sortSprites);
		}

		for (let k = 0; k < this.pics.length; k++) {
			const pic: any = this.pics[k];
			const p = Pic(pic.pic);
			if (pic.frame !== -1 && pic.frame != null) {
				const cw = p.width / frames;
				ctx.drawImage(p, pic.frame * cw, 0, cw, p.height, pic.x, pic.y, pic.drawW, pic.drawH);
			} else {
				ctx.drawImage(p, pic.x, pic.y, pic.drawW, pic.drawH);
			}
		}
		return true;
	};
}
