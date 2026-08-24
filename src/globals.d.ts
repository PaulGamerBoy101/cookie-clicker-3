/* Cookie Clicker 3 — the typed global boundary.
 *
 * The engine (src/engine/main.ts, a port of the 2.048 classic script) is a
 * runtime-built `Game` object plus a bag of globals. The modern glue code
 * (src/main.ts, config.ts, engine/base64.ts, extras/) talks to it through
 * `window` and one bare global. This file declares that boundary against the
 * canonical engine surface defined in src/engine/types.ts, so the glue stays
 * fully type-checked.
 *
 * Where the legacy engine extends the DOM at runtime (Element.prototype
 * .getBounds) or assigns to bare globals (Game), that is declared here too.
 */
import type {
	AddEventFn,
	AddLanguageFn,
	BeautifyFn,
	Cc3AnimStats,
	Game as GameSurface,
	LocFn,
	LocalizeContentFn,
	PlaySoundFn,
} from './engine/types';

declare global {
	/* The engine's global object: published on window by engine/main.ts and
	 * read bare (unqualified) by the extras mods, the way the original
	 * classic-script game read its globals. Typed as the canonical Game
	 * surface (named members checked; dynamic legacy surface via index sig). */
	const Game: GameSurface;

	/* Bare engine globals the typed content modules read unqualified (the
	 * engine publishes them on window via its Object.assign(window, …) shim,
	 * which is also what makes them resolve at runtime inside ESM modules). */
	const loc: LocFn;
	/* Engine lookup of a localized-string key by its "… name/desc/quote"
	 * suffix (engine/main.ts, published on window): the stored key, or
	 * `undefined` when the current language file has no such entry — the
	 * verbatim call sites pair it with a `||` fallback. */
	const FindLocStringByPart: (match: string) => string | undefined;
	/* Non-generic on purpose: the content passes `any`-typed arrays (Game
	 * index signature), and one verbatim 2.048 tombola line indexes `choose`
	 * with a comma expression (`choose['red','orange',…]` — a faithful 2.048
	 * quirk that resolves to `undefined` at runtime); the index signature
	 * keeps that expression type-checkable. (Tested: generic `<T>(arr:
	 * readonly T[]) => T` infers `unknown` from `any` arrays under tsgo.) */
	const choose: { (arr: readonly any[]): any; [key: string]: any };
	/* Platform config: falsy on the desktop build, else a bridge object
	 * (the achievements module calls App.gotAchiev) — hence `any`. */
	const App: any;
	/* Version config (src/config.ts, published on window before the engine
	 * evaluates; the engine reads them bare). */
	const VERSION: number;
	const BETA: number;
	/* Optional preload hook set by the CC3 glue before Game.Load runs (the
	 * engine guards it with typeof). */
	const PRELOAD: any;
	/* AdBlock-detection global referenced bare by the engine (guarded with
	 * typeof); set by ad blockers at runtime, hence `any`. */
	const showAds: any;
	const Beautify: BeautifyFn;
	const BeautifyInText: (str: string) => string;
	/* Engine event-binding helper (engine var, published on window). */
	const AddEvent: AddEventFn;
	/* Engine script-injection helper (engine var, published on window):
	 * loads a JS file, optionally calling back on load/error — `any` for
	 * the optional callbacks, matching the verbatim engine signature. */
	const LoadScript: (url: string, callback?: any, error?: any) => void;
	/* Engine string substitution helper (published on window): replaces
	 * every occurrence of `find` in `str`. */
	const replaceAll: (find: string, replace: string, str: string) => string;
	/* Current-language string table (engine var, published on window): the
	 * parsed loc file's keys. `any` — the localization code indexes it with
	 * dynamic keys. */
	const locStrings: any;
	/* Patch-note table (engine var, published on window): the parsed loc
	 * file's `[patch]` entries, consumed by the changelog builder. */
	const locPatches: any[];
	/* Localized number formatter: returns {n: floored value, b: beautified}. */
	const LBeautify: (val: number, floats?: number | boolean) => { n: number; b: string };
	/* Engine number formatter (engine/main.ts, published on window): returns
	 * a zero-padded string for sub-1 magnitudes, else the input number
	 * unchanged (legacy quirk) — hence the string | number return. */
	const toFixed: (n: number) => string | number;
	const cap: (str: string) => string;
	const EN: number;
	/* A music system loaded at runtime (tracks, …), or false when none is
	 * loaded — the engine keeps it `false` in the current build, so the
	 * content's `if (Music)` guards stay dead exactly as in master. `any`:
	 * the jukebox methods dereference `Music.tracks` without a guard, the
	 * way the original untyped code did. */
	const Music: any;
	/* AMD define used by the legacy FileSaver stub (engine/main.ts; the
	 * `typeof define!=='undefined'` guard means it's never actually called
	 * in the ESM build — declared so the guard type-checks). */
	const define: any;
	const PlaySound: PlaySoundFn;
	/* Engine music-cue + sound helpers (engine vars/functions, published on
	 * window); `any` — the jukebox surface is untyped legacy. */
	const PlayCue: any;
	const PlayMusicSound: any;
	const SimpleBeautify: (val: number) => string;
	/* Last heavenly upgrade the player clicked in the ascend tree (engine
	 * var, published on window); `any` — read for its posX/posY. */
	/* Declared `let`: the engine reassigns it (heavenly-tree reference point). */
	let LASTHEAVENLYSELECTED: any;
	/* Engine floor-to-integer helper (engine function, published on window). */
	const randomFloor: (n: number) => number;
	/* Engine number-condenser (engine var, published on window): the input
	 * number unchanged below 1e6, else its rounded 5-digit scientific
	 * notation — always a number. */
	const shortenNumber: (val: number) => number;
	const getUpgradeName: (name: string) => string;
	const tinyIcon: (icon: number | number[], css?: string) => string;
	/* Icon CSS generator (engine function declaration, published on window):
	 * [x,y] (or [x,y,url]) → background-image/position CSS string. */
	const writeIcon: (icon: number | number[]) => string;
	/* Asset accessor (engine var, published on window): the loaded Image for
	 * `what`, loaded-on-demand if unknown, else the blank placeholder
	 * canvas — `any` for both the mixed return and the occasional
	 * non-string key the legacy code passes. */
	const Pic: (what: any) => any;
	/* The per-language width factors; `Langs[locId].w` scales the
	 * "long product name" threshold in the building refresh. */
	const Langs: Record<string, any>;
	/* Current engine language id ('NONE' until a language is loaded). */
	const locId: string;
	/* Top-bar height offset in px (32 normally, 0 in 'offWeb' mode); read by
	 * the building ctor's levelUp closure when placing sparkles. */
	const TopBarOffset: number;
	/* Engine shorthand for document.getElementById. `any`: the verbatim
	 * content dereferences the returned element (`.value`, `.innerHTML`)
	 * without null guards or input-casts, as the original code did. */
	const l: (id: string) => any;
	const triggerAnim: (element: any, anim: string) => void;
	/* Engine per-frame profiler (engine var, published on window): `clean()`
	 * + `track()` used by DrawBackground to label frame-time slices. */
	const Timer: any;
	/* Locale suffix strings (' ON' / ' OFF') built at Init and consumed by the
	 * preferences buttons in UpdateMenu (engine vars, published on window). */
	const ON: string;
	const OFF: string;

	/* --- save-system globals (engine/main.ts, published on window) --- */
	const utf8_to_b64: (str: string) => string;
	const b64_to_utf8: (str: string) => string;
	/* Legacy no-op passthrough ("too many save corruptions, darn it to heck"):
	 * returns its input unchanged. */
	const pack3: (values: any) => any;
	/* Legacy bitfield packers/unpackers (engine, published on window); the
	 * save loader feeds them save strings and gets strings/arrays back. */
	const unpack: (values: any) => any;
	const unpack2: (values: any) => any;
	const UncompressLargeBin: (values: any) => any;
	const BeautifyAll: () => void;
	const localStorageGet: (key: string) => string | null;
	const localStorageSet: (key: string, str: string) => any;
	/* FileSaver.js (bundled verbatim by the engine): triggers a download. */
	const saveAs: (data: Blob, filename?: string, options?: any) => any;

	/* The engine's classic code passes numbers to parseInt everywhere
	 * (parseInt(Game.time), parseInt(Math.floor(…)), …); add a numeric
	 * overload merging with lib.es5's string-only one. Same for parseFloat
	 * (parseFloat(Math.floor(…)) in the save writer). */
	function parseInt(value: any, radix?: number): number;
	function parseFloat(value: any): number;

	/* Shared vanilla-content bookkeeping, live-bridged (slice 3). The content
	 * modules (content/upgrades.ts; later content/achievements.ts) read and
	 * write order/pool/power as bare globals; engine/main.ts keeps the real
	 * state in module-level vars and bridges the window properties onto them
	 * with accessors, so the engine's Game.Upgrade / Game.Achievement ctors —
	 * which read these names unqualified, exactly as they read the original
	 * Init-scoped closure vars — and the content modules observe one shared
	 * state. Declared `let` because the content assigns to them. */
	let order: number;
	let pool: string;
	let power: number;

	/* The engine attaches the classic-script seedrandom PRNG polyfill to
	 * Math at module eval (it rewrites Math.random with a seedable one);
	 * the vanilla content calls Math.seedrandom(…) at Init time. */
	interface Math {
		seedrandom(seed?: any, hard?: any): void;
	}

	/* The engine polyfills Element.prototype.getBounds (scaled, plain-object
	 * rect) at module eval; declare that DOM extension. */
	interface Element {
		getBounds(): {
			x: number;
			y: number;
			width: number;
			height: number;
			top: number;
			bottom: number;
			left: number;
			right: number;
		};
	}

	/* The legacy save loader round-trips possibly-null localStorage values
	 * back into setItem unguarded (beta-save migration block); loosen
	 * getItem's return to match the engine's untyped usage. */
	interface Storage {
		getItem(key: string): any;
	}

	interface Window {
		/* --- config.ts (must be on window before the engine evaluates) --- */
		VERSION: number;
		BETA: number;
		App: any;

		/* --- engine core surface (engine/main.ts) --- */
		Game: GameSurface;
		AddLanguage: AddLanguageFn;
		Beautify: BeautifyFn;
		loc: LocFn;
		PlaySound: PlaySoundFn;
		AddEvent: AddEventFn;
		/* engine shorthand: document.getElementById */
		l: (id: string) => HTMLElement | null;
		LocalizeUpgradesAndAchievs: LocalizeContentFn;

		/* --- engine/base64.ts --- */
		Base64: { encode(input: string): string; decode(input: string): string };

		/* --- glue module loaders (defined in src/main.ts, called by the engine) --- */
		loadLangModule?: (file: string, done: () => void, fail?: (err: unknown) => void) => void;
		loadMinigameModule?: (url: string) => Promise<unknown>;

		/* --- CC3 flags --- */
		/* The polish stats object published by src/main.ts's animation pass
		 * (motion / counter / ascendFlashes / …). */
		__cc3Anim?: Cc3AnimStats;
		/* Set by extras/blackHoleInverter.ts once it has registered. */
		__cc3Binverter?: number;
		/* Set by extras/decideDestiny.ts once it has registered. */
		__cc3DecideDestiny?: number;
		/* Set by extras/americanSeason.ts once it has registered. */
		__cc3AmericanSeason?: number;
		/* The American Season namespace (extras/americanSeason.ts): the
		 * original mod's global, kept so the mod's inline menu handlers
		 * (UpdatePref / Toggle / `config = defaultConfig()`) and other mods
		 * can call it. `config` is a get/set pair: "Restore Default"
		 * replaces the state object, so it must assign, not just read. */
		AmericanSeason?: {
			name: string;
			version: string;
			config: Record<string, any>;
			rocketsPopped: number;
			upgrades: string[];
			canvas: HTMLCanvasElement | null;
			defaultConfig: () => Record<string, any>;
			UpdatePref: (pref: string, value: string) => void;
			Toggle: (pref: string, button: string, on: string, off: string, invert: string) => void;
		};
		/* The Decide Your Destiny namespace (extras/decideDestiny.ts): the
		 * original mod's global, kept so other mods can call
		 * DecideDestiny.NewDestiny to add custom fates. */
		DecideDestiny?: {
			name: string;
			version: string;
			AllDestinies: unknown[];
			AllDestiniesByName: Record<string, unknown>;
			NewDestiny: (name: string, icon: [number, number], effect: string, other?: Record<string, unknown>) => void;
		};
	}
}
