/**
 * content/tiers.ts — the vanilla tier table.
 *
 * Ported verbatim from the 2.048 engine's inline `Game.Tiers` object literal
 * (engine/main.ts). This is the first slice of the architectural rewrite's
 * typed content layer: pure data, no behavior.
 *
 * The engine assigns `Game.Tiers = TIERS` inside `Game.Init` (which the
 * asset-Loader guarantees runs exactly once per page load, so the module
 * singleton's lifetime matches the original once-created literal) and then
 * appends `.upgrades` to each tier as tiered content is declared.
 *
 * Keys: numeric tiers 1-14 are the standard content tiers; `'synergy1'`,
 * `'synergy2'` and `'fortune'` are the special tiers.
 */
import type { Tier } from '../types';

export const TIERS: Record<number | string, Tier> = {
	1: { name: 'Plain', unlock: 1, achievUnlock: 1, iconRow: 0, color: '#ccb3ac', price: 10 },
	2: { name: 'Berrylium', unlock: 5, achievUnlock: 50, iconRow: 1, color: '#ff89e7', price: 50 },
	3: { name: 'Blueberrylium', unlock: 25, achievUnlock: 100, iconRow: 2, color: '#00deff', price: 500 },
	4: { name: 'Chalcedhoney', unlock: 50, achievUnlock: 150, iconRow: 13, color: '#ffcc2f', price: 50000 },
	5: { name: 'Buttergold', unlock: 100, achievUnlock: 200, iconRow: 14, color: '#e9d673', price: 5000000 },
	6: { name: 'Sugarmuck', unlock: 150, achievUnlock: 250, iconRow: 15, color: '#a8bf91', price: 500000000 },
	7: { name: 'Jetmint', unlock: 200, achievUnlock: 300, iconRow: 16, color: '#60ff50', price: 500000000000 },
	8: { name: 'Cherrysilver', unlock: 250, achievUnlock: 350, iconRow: 17, color: '#f01700', price: 500000000000000 },
	9: { name: 'Hazelrald', unlock: 300, achievUnlock: 400, iconRow: 18, color: '#9ab834', price: 500000000000000000 },
	10: { name: 'Mooncandy', unlock: 350, achievUnlock: 450, iconRow: 19, color: '#7e7ab9', price: 500000000000000000000 },
	11: { name: 'Astrofudge', unlock: 400, achievUnlock: 500, iconRow: 28, color: '#9a3316', price: 5000000000000000000000000 },
	12: { name: 'Alabascream', unlock: 450, achievUnlock: 550, iconRow: 30, color: '#c1a88c', price: 50000000000000000000000000000 },
	13: { name: 'Iridyum', unlock: 500, achievUnlock: 600, iconRow: 31, color: '#adb1b3', price: 500000000000000000000000000000000 },
	14: { name: 'Glucosmium', unlock: 550, achievUnlock: 650, iconRow: 34, color: '#ff89e7', price: 5000000000000000000000000000000000000 },
	'synergy1': { name: 'Synergy I', unlock: 15, iconRow: 20, color: '#008595', special: 1, req: 'Synergies Vol. I', price: 200000 },
	'synergy2': { name: 'Synergy II', unlock: 75, iconRow: 29, color: '#008595', special: 1, req: 'Synergies Vol. II', price: 200000000000 },
	'fortune': { name: 'Fortune', unlock: -1, iconRow: 32, color: '#9ab834', special: 1, price: 77777777777777777777777777777 },
};
