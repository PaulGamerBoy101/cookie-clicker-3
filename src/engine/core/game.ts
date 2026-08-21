/**
 * core/game.ts — the engine's `Game` singleton, now a real class (Phase 3).
 *
 * The 2.048 engine built `Game` at runtime as `var Game = {}` (top of
 * engine/main.ts) and attached every property to that bare object. The
 * singleton is now an instance of the `GameCore` class below: the engine
 * imports it and keeps assigning the exact same properties, and the window
 * shim publishes the same object, so the runtime surface is unchanged
 * (same identity, same assignment sequence, same window.Game).
 *
 * The class is an index-signature shell for now on purpose: the named
 * surface of the `Game` object (lifecycle, economy, save/load, shimmers, …)
 * is the Phase 4 systems work. Those will land here as real methods/fields
 * and types.ts can then alias the class the same way Phase 3 does for
 * Building/Upgrade/Achievement. Until then the `Game` interface in
 * types.ts remains the description and `GameCore` the implementation.
 */
export class GameCore {
	[key: string]: any;
}

/** The engine's `Game` singleton (was `var Game={}` in engine/main.ts). */
export const Game = new GameCore();
