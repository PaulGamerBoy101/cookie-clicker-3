/**
 * types.ts — the typed surface of the Cookie Clicker 3 engine.
 *
 * The 2.048 engine (src/engine/main.ts) is a 16k-line 2022-era script: one
 * runtime-built `Game` object plus a bag of globals. This file defines the
 * TypeScript surface that all CC3-owned code (entry, config, extras, language
 * modules, build tooling) compiles against — and, in the phased rewrite, the
 * surface the class-based engine is built to.
 *
 * Conventions:
 *  - The legacy engine uses numbers where modern code uses booleans
 *    (`bought: 0/1`, `ready: 1`). Those are typed as `number`, not `boolean`,
 *    so the types describe the real engine, not an idealized one.
 *  - Index signatures (`[key: string]: any`) mark the genuinely dynamic
 *    corners of the legacy engine (objects built at runtime, string-keyed
 *    maps, ad-hoc mod properties). Named members are typed and checked; the
 *    index signature only covers what the engine really treats dynamically.
 */
import type { Building as BuildingClass } from './core/building';
import type {
	Upgrade as UpgradeClass,
	TieredUpgrade as TieredUpgradeFn,
	SynergyUpgrade as SynergyUpgradeFn,
} from './core/upgrade';
import type {
	Achievement as AchievementClass,
	TieredAchievement as TieredAchievementFn,
	ProductionAchievement as ProductionAchievementFn,
	BankAchievement as BankAchievementFn,
	CpsAchievement as CpsAchievementFn,
} from './core/achievement';

/* ====================================================================== */
/* Language data (src/engine/loc/*.ts)                                    */
/* ====================================================================== */

/**
 * Gettext/PO-catalog header metadata, stored under the reserved `""` key of
 * every loc table (language tag + the plural-forms expression the engine's
 * plural lookup evaluates).
 */
export interface LanguageHeader {
	language: string;
	'plural-forms': string;
	[key: string]: string;
}

/** A value in a loc table: a plain string, `string[]` plural forms (selected
 * by count at lookup time), or the PO header under `""`. */
export type LanguageString = string | string[] | LanguageHeader;

/**
 * One localized language module. `id` is the engine language code (e.g. 'EN'),
 * `name` the display name, and `strings` the translation table.
 */
export interface LanguageData {
	id: string;
	name: string;
	strings: Record<string, LanguageString>;
}

/* ====================================================================== */
/* Content primitives                                                     */
/* ====================================================================== */

/**
 * A building's sprite sheet description. `pic`/`bg` are resolved directly, or
 * from `base` (`base + '.webp'` / `base + 'Background.webp'`) by the engine.
 * `xV`/`yV` are the tile grid dimensions; `x`/`y` the offset of the first
 * frame; `rows`/`frames` the animation layout.
 *
 * Every field is optional: the engine fills defaults at draw time
 * (art.h||48, art.rows||1, art.frames||1, …) and some buildings (Cursor)
 * pass a bare `{}` because they draw from the icon grid instead.
 */
export interface Art {
	/**
	 * Sprite path, or (Grandma) a function of the icon "type" that picks the
	 * procedural sprite name at draw time. `base` resolves both when set.
	 */
	pic?: string | ((i: string) => string);
	bg?: string;
	base?: string;
	xV?: number;
	yV?: number;
	w?: number;
	h?: number;
	x?: number;
	y?: number;
	rows?: number;
	frames?: number;
	[key: string]: unknown;
}

/**
 * A store upgrade. Phase 3 slice 3: the real class (core/upgrade.ts) — the
 * engine assigns `Game.Upgrade = Upgrade`; call sites are unchanged.
 * `buildingTie`/`buildingTie1`/`buildingTie2` reference the building(s) the
 * upgrade applies to (set by the Tiered/Synergy/Grandma wrappers); `tier` is
 * the tier key (numeric tier, or 'synergy1'/'synergy2'/'fortune'). The class
 * also declares the ctor-assigned data the old interface left to the index
 * signature (`power`, `unlockAt`, `techUnlock`, `parents`, `type`), and it
 * types `buildingTie` as `Building | Upgrade | 0` to match the ctor's 0
 * sentinel (the old optional type never matched it).
 */
export type Upgrade = UpgradeClass;

/**
 * A store achievement. Phase 3 slice 4: the real class
 * (core/achievement.ts) — `content/achievements.ts` assigns
 * `Game.Achievement = Achievement`; call sites are unchanged. `won` is
 * 0/1 (legacy numeric-boolean). The class also declares the ctor-assigned
 * data the old interface left to the index signature (`disabled`, `type`).
 */
export type Achievement = AchievementClass;

/**
 * A building (the engine's `Game.Object` content primitive). Phase 3 slice 2
 * turned this from a description into an implementation: `BuildingClass`
 * (src/engine/core/building.ts) *is* the `Building` type. The member list
 * moved onto the class — `declare`d there (erased at compile time, so the
 * runtime instance shape is unchanged from the original plain object).
 * Documented deltas vs the old interface: `muted` is `boolean | number`
 * (the ctor initializes it to `false`, the engine assigns 0/1), `canvas`
 * and `ctx` are `any` (the engine's `fillPattern` polyfill is not part of
 * the lib `CanvasRenderingContext2D` type), and `baseCps` keeps its `number`
 * contract although the ctor mirrors `cps` 1:1 (a function for the dynamic
 * n=0 buildings) — the cast lives on the class side.
 */
export type Building = BuildingClass;

/** A buff entry in `Game.buffs` (e.g. 'Frenzy'). `arg1` is the primary argument. */
export interface Buff {
	name?: string;
	arg1?: number;
	arg2?: number;
	[key: string]: any;
}

/** An on-screen shimmer (golden/white/dark cookie). `pop()` dismisses it. */
export interface Shimmer {
	l?: HTMLElement;
	force?: string;
	forceObj?: Record<string, unknown>;
	wrath?: number;
	noWrath?: number;
	pop(event?: unknown): void;
	[key: string]: any;
}

/**
 * A Grandmapocalypse wrinkler crawling the cookie. `phase` 0 = gone, 2 = fully
 * visible (sucking 5% of CpS via `Game.cpsSucked`); `sucked` accumulates the
 * swallowed cookies refunded (+10%) on the pop (`hp <= 0.5`).
 */
export interface Wrinkler {
	phase: number;
	close: number;
	sucked: number;
	hp: number;
	[key: string]: any;
}

/**
 * A tier definition from `Game.Tiers`. Numeric tiers 1-14 are the standard
 * content tiers; `'synergy1'`/`'synergy2'`/`'fortune'` are special tiers. The
 * engine appends `.upgrades` to each tier as tiered content is declared.
 */
export interface ContentValidationIssue {
	severity: 'error' | 'warning';
	code: string;
	message: string;
	item?: string;
}

export interface ContentValidationReport {
	valid: boolean;
	errors: number;
	warnings: number;
	buildingCount: number;
	upgradeCount: number;
	issues: ContentValidationIssue[];
}

export interface EconomyBuildingReport {
	name: string;
	storeOrder: number;
	amount: number;
	baseCps: number;
	cpsPerBuilding: number;
	totalCps: number;
	share: number;
	nextPurchaseCost: number;
	marginalCps: number;
	paybackSeconds: number;
}

export interface EconomyReport {
	totalCps: number;
	buildings: EconomyBuildingReport[];
}

export interface EconomySimulationPoint {
	amounts: Record<string, number>;
	totalCps: number;
	buildings: EconomyBuildingReport[];
}

export type EconomyUpgradeCategory = 'passive' | 'click' | 'mixed' | 'prestige' | 'seasonal' | 'toggle' | 'tech' | 'debug' | 'utility';

export interface EconomyUpgradeReport {
	name: string;
	id: number;
	pool: string;
	category: EconomyUpgradeCategory;
	buildingNames: string[];
	basePrice: number;
	currentPrice: number;
	bought: boolean;
	unlocked: boolean;
	ownedCps: number;
	purchaseCps: number;
	ownedClickCps: number;
	purchaseClickCps: number;
	paybackSeconds: number;
	clickPaybackSeconds: { one: number; five: number; ten: number };
	balanceWarning?: string;
}

export interface EconomyMilestoneReport {
	label: string;
	buildingAmounts: Record<string, number>;
	totalInvestment: number;
	totalCps: number;
	clickCps: number;
	leadingBuildings: string[];
}

export interface EconomyBuildingBalanceMilestone {
	level: number;
	totalInvestment: number;
	totalCps: number;
	nextPurchaseCost: number;
	marginalCps: number;
	paybackSeconds: number;
	/** Payback relative to the geometric curve formed by neighboring buildings. */
	paybackRatioToCurve: number;
	balanceWarning?: string;
}

export interface EconomyBuildingBalanceReport {
	name: string;
	storeOrder: number;
	basePrice: number;
	baseCps: number;
	milestones: EconomyBuildingBalanceMilestone[];
	warnings: string[];
}

export interface EconomyAnalysisOptions {
	/** Explicit milestone scenarios. Omit to use levels 1/10/25/50/100/250/500 for every building. */
	scenarios?: Array<{ label: string; buildings: Record<string, number>; upgrades?: string[] }>;
	/** Ownership levels used by the default milestone set. */
	levels?: number[];
}

export type EconomyStrategyName = 'cheapest' | 'bestPayback' | 'upgradesFirst';

export interface EconomyStrategyOptions {
	strategy?: EconomyStrategyName;
	durationSeconds?: number;
	clicksPerSecond?: number;
	sampleEverySeconds?: number;
	maxPurchases?: number;
}

export interface EconomyStrategySample {
	elapsedSeconds: number;
	cookies: number;
	cookiesEarned: number;
	cps: number;
	clickCps: number;
	buildingAmounts: Record<string, number>;
	upgradesBought: number;
}

export interface EconomyStrategyReport {
	strategy: EconomyStrategyName;
	durationSeconds: number;
	elapsedSeconds: number;
	cookies: number;
	cookiesEarned: number;
	cps: number;
	clickCps: number;
	buildingAmounts: Record<string, number>;
	upgradesBought: string[];
	purchases: number;
	stoppedReason?: string;
	samples: EconomyStrategySample[];
}

export interface FullEconomyReport {
	buildingCount: number;
	upgradeCount: number;
	baselineCps: number;
	baselineClickCps: number;
	buildings: EconomyBuildingReport[];
	buildingBalance: EconomyBuildingBalanceReport[];
	upgrades: EconomyUpgradeReport[];
	milestones: EconomyMilestoneReport[];
	warnings: string[];
}

export interface Tier {
	name: string;
	/** Building level at which the tier unlocks (-1 = special/always). */
	unlock: number;
	/** Building level at which the tier's achievements unlock (standard tiers only). */
	achievUnlock?: number;
	/** Row in the icon sheet for this tier's content icons. */
	iconRow: number;
	color: string;
	/** 1 for the special (synergy/fortune) tiers. */
	special?: number;
	/** Upgrade name required to unlock a special tier. */
	req?: string;
	price: number;
	/** Filled by the engine as tiered upgrades are declared for this tier. */
	upgrades?: Upgrade[];
	/** Upgrade name that "unshackles" the tier (extra production), if any. */
	unshackleUpgrade?: string;
	[key: string]: any;
}

/**
 * A third-party mod (registered via `Game.registerMod`). The engine wires
 * `init`/`create`/`draw`/`check` as lifecycle hooks and `save`/`load` into the
 * save format. `init` is reset to `0` after it runs once.
 */
export interface Mod {
	id?: string;
	name?: string;
	version?: string;
	init?: (() => void) | 0;
	create?: (game: Game) => void;
	draw?: (game: Game) => void;
	check?: (game: Game) => void;
	save?: () => string;
	load?: (str: string) => void;
	[key: string]: any;
}

/** Player preferences (`Game.prefs`). Legacy sparse object: numeric 0/1 flags. */
export interface Prefs {
	particles: number;
	numbers: number;
	autosave: number;
	autoupdate: number;
	milk: number;
	fancy: number;
	warn: number;
	cursors: number;
	focus: number;
	popups: number;
	format: number;
	notifs: number;
	monospace?: boolean | number;
	screenreader?: number;
	[key: string]: any;
}

/* ====================================================================== */
/* The Game object                                                        */
/* ====================================================================== */

/**
 * The engine's `Game` object — runtime-built in 2.048, typed here as the
 * canonical surface. Named members are the checked contract; the index
 * signature covers the rest of the legacy runtime surface (methods assigned
 * dynamically, ad-hoc state) so typed callers can still reach it honestly.
 */
export interface Game {
	/* --- identity / environment --- */
	version: number;
	beta: number;
	mobile: number;
	touchEvents: boolean;
	https: number;
	season: string;
	baseSeason: string;
	clickStr: string;
	vanilla: number;

	/* --- lifecycle / timing --- */
	ready: number | boolean;
	visible: boolean;
	T: number;
	drawT: number;
	loopT: number;
	fps: number;
	currentFps: number;
	previousFps: number;
	time: number;
	lastDate: number;
	lastActivity: number;
	accumulatedDelay: number;
	delayTimeouts: number;
	catchupLogic: number;
	fpsStartTime: number;
	frameNumber: number;
	toSave: boolean;

	/* --- economy state --- */
	cookies: number;
	cookiesd: number;
	cookiesEarned: number;
	lumps: number;
	heavenlyChips: number;
	prestige: number;
	resets: number;
	cookiesPs: number;
	cpsSucked: number;
	recalculateGains: number;
	priceIncrease: number;
	buyMode: number;
	buyBulk: number;
	elderWrath: number;
	wrinklersPopped: number;
	/** Frames remaining on an active Elder Pact (0 = none). */
	pledgeT: number;
	noteId: number;
	cookieClicks: number;

	/* --- ascend / prestige --- */
	OnAscend: number;
	AscendBrowse: number; // CC3: 1 while viewing the heavenly tree without ascending
	ascendButtonHTML: string; // CC3: original Reincarnate label, restored by AscendBrowseClose
	ascendInfoHTML: string; // CC3: original ascend info text, restored by AscendBrowseClose
	AscendTimer: number;
	AscendBreakpoint: number;
	AscendDuration: number;
	ascensionMode: number;
	SpecialGrandmaUnlock: number;
	/** Building-amount threshold that unlocks the building's cat synergy upgrade (set in content/buildings.ts). */
	SpecialCatUnlock: number;

	/* --- layout / DOM --- */
	l: HTMLElement | null;
	wrapper: HTMLElement | null;
	/* Runtime rect from Element.getBounds() (main.ts: Game.bounds=Game.l.getBounds()),
	 * or 0 before the first layout pass (main.ts: Game.bounds=0). */
	bounds: { x: number; y: number; width: number; height: number; top: number; bottom: number; left: number; right: number } | 0;
	scale: number;
	minLayoutW: number;
	cssClasses: string[];

	/* --- content maps --- */
	Objects: Record<string, Building>;
	ObjectsById: Building[];
	ObjectsN: number;
	Upgrades: Record<string, Upgrade>;
	UpgradesN: number;
	Achievements: Record<string, Achievement>;
	AchievementsN: number;
	AchievementsOwned: number;
	BuildingsOwned: number;
	/** Upgrade names in the grandma-synergy pool (set by Game.GrandmaSynergy). */
	GrandmaSynergies: string[];
	/** Upgrade names in the cats-synergy pool (set by Game.CatSynergy). */
	CatSynergies: string[];
	/** Upgrades grouped by store pool ('kitten', 'cookie', 'prestige', …). */
	UpgradesByPool: Record<string, Upgrade[]>;
	/**
	 * The most recently declared content item (Object/Upgrade/Achievement
	 * constructors set it); vanilla content declarations use it to attach
	 * per-building extras (minigameUrl, displayName, iconFunc, …).
	 */
	last: any;
	Tiers: Record<number | string, Tier>;
	buffs: Record<string, Buff>;
	shimmers: Shimmer[];
	/** The `#shimmers` DOM layer (`l('shimmers')`); truthy once the DOM is built. */
	shimmersL: HTMLElement | null;
	wrinklers: Wrinkler[];
	prefs: Prefs;

	/* --- seasonal specials (Santa + Dragon tabs) --- */
	specialTabs: string[];
	santaLevel: number;
	dragonLevel: number;

	/* --- modding --- */
	mods: Record<string, Mod>;
	sortedMods: Mod[];
	modSaveData: Record<string, string>;
	/* CCSE-era extension surfaces (set up by setupModding in
	 * systems/modding.ts). The custom menu arrays are invoked by UpdateMenu
	 * (ui/menu.ts) after the menu DOM is replaced; customShimmerTypes
	 * carries the golden shimmer hook arrays invoked from the golden
	 * popFunc (systems/shimmerTypes.ts) — customListPush at the start of
	 * effect-list construction, customEffectDurMod/customMult/customBuff
	 * right after the vanilla `var buff=0;`. */
	customMenu: Array<() => void>;
	customOptionsMenu: Array<() => void>;
	customStatsMenu: Array<() => void>;
	customInfoMenu: Array<() => void>;
	customShimmerTypes: {
		golden: {
			customListPush: Array<(me: any, list: string[]) => void>;
			customEffectDurMod: Array<(me: any) => number>;
			customMult: Array<(me: any) => number>;
			customBuff: Array<(me: any, buff: any, choice: string, effectDurMod: number, mult: number) => any>;
		};
	};

	/* --- lifecycle methods --- */
	Init(): void;
	Loop(): void;
	Load(): void;
	LoadSave(data?: any, ignoreVersionIssues?: any): any;
	Resume(): void;
	WriteSave(type?: number): string;
	ImportSaveCode(save: string): boolean;
	ExportSaveCode(): string;
	/* CC3 rolling save backups (systems/backup.ts): CaptureSave is called from
	 * WriteSave; ListBackups/RestoreBackup/DownloadBackup/RefreshBackupList
	 * drive the Options menu history. The backup entry shape is
	 * `{ timestamp, save }`. */
	CaptureSave(saveData: string): void;
	ListBackups(): Array<{ timestamp: number; save: string }>;
	RestoreBackup(timestamp: number): boolean;
	DownloadBackup(timestamp: number): boolean;
	RefreshBackupList(): void;
	CalculateGains(): void;
	ValidateContent(): ContentValidationReport;
	GetEconomyReport(): EconomyReport;
	SimulateEconomy(scenarios: Record<string, number>[]): EconomySimulationPoint[];
	AnalyzeEconomy(options?: EconomyAnalysisOptions): FullEconomyReport;
	SimulateStrategy(options?: EconomyStrategyOptions): EconomyStrategyReport;
	ClickCookie(e: MouseEvent | null, amount?: number): void;
	/* pic accepts an [iconColumn, iconRow] pair, a bare icon column/row, or a
	 * sound name — the engine handles all of these at runtime. */
	Notify(title: string, desc: string, pic?: [number, number] | number | number[] | string, quick?: number, noLog?: number | boolean): void;
	Ascend(force?: number): void;
	AscendBrowseView(): void;
	AscendBrowseClose(): void;
	Reincarnate(force?: number): void;
	LoadMinigames(): void;
	scriptLoaded(me: Building): void;
	isMinigameReady(me: Building): boolean;
	BuildStore(): void;
	resize(): void;
	addClass(what: string): void;
	updateClasses(): void;
	getFps(): number;

	/* --- shimmers / wrinklers --- */
	shimmer: new (type: string, obj?: unknown, noCount?: number) => Shimmer;
	SpawnWrinkler(me: Wrinkler): void;
	/** Pop all on-screen wrinklers at once (e.g. when the Elder Pact resolves). */
	CollectWrinklers(): void;

	/* --- seasonal specials --- */
	UpdateSpecial(): void;
	UpgradeSanta(): void;
	UpgradeDragon(): void;

	/* --- content / unlock API --- */
	Unlock(name: string | string[]): void;
	Lock(name: string): void;
	UnlockTiered(me: Building): void;
	/* A name, or a record of names (the legacy else-branch iterates it). */
	Win(name: string | Record<string, string>): void;
	GetTieredCpsMult(me: Building): number;
	magicCpS(name: string): number;
	/** Aura multiplier for a named aura (0 when the aura is not active). */
	auraMult(what: string): number;
	/** Read a mod-registered effect value by tag (falls back to 1, or `def`). */
	eff(name: string, def?: number): number;
	/** Core CpS curve: `base * 2^mult + bonus`. */
	ComputeCps(base: number, mult: number, bonus?: number): number;
	/** 0/1 numeric: the engine does arithmetic on the result (`bought`). */
	Has(upgrade: string | Upgrade): number;
	SetTier(building: string | Building, tier: number | string): void;
	GetIcon(building: string, tier: number | string): number[];
	CountsAsAchievementOwned(pool: string): boolean;
	CountsAsBuildingOwned(me: Building): boolean;
	modifyBuildingPrice(me: Building, price: number): number;

	/* --- mod registration --- */
	registerMod(id: string, mod: Mod): boolean;
	/* `func` may receive the hook parameter (e.g. 'reset' is called with
	 * `true` for a hard reset, `false` for an ascension) — the vanilla
	 * registerHook passes whatever runModHook forwards. */
	registerHook(hook: string, func: (...args: any[]) => void): void;

	/* --- content constructors (modding API) --- */
	/* Phase 3 slice 2: the real class (core/building.ts) — the engine
	 * assigns `Game.Object = Building`; call sites are unchanged. */
	Object: typeof BuildingClass;
	/* Phase 3 slice 3: the real class (core/upgrade.ts) — the engine
	 * assigns `Game.Upgrade = Upgrade`; call sites are unchanged. */
	Upgrade: typeof UpgradeClass;
	/* Phase 3 slice 4: the real class (core/achievement.ts) — the content
	 * layer assigns `Game.Achievement = Achievement`; call sites are
	 * unchanged. Closes the Phase-1 `any` (tsgo rejects function
	 * expressions for construct signatures — a real class has none of
	 * those problems). */
	Achievement: typeof AchievementClass;
	/* tier is numeric, or the special 'fortune' tier for the golden cookies.
	 * Phase 3 slice 3: real factory functions from core/upgrade.ts. */
	TieredUpgrade: typeof TieredUpgradeFn;
	SynergyUpgrade: typeof SynergyUpgradeFn;
	GrandmaSynergy: (name: string, desc: string, building: string) => Upgrade;
	/* Phase 3 slice 4: real factory functions from core/achievement.ts. */
	TieredAchievement: typeof TieredAchievementFn;
	/* q is a quote string, or 0/omitted for "no quote" (falsy check). */
	ProductionAchievement: typeof ProductionAchievementFn;
	BankAchievement: typeof BankAchievementFn;
	CpsAchievement: typeof CpsAchievementFn;

	/* --- misc engine surface --- */
	/* Tooltip object (state + methods: draw/update/hide/wobble — Phase 6
	 * slice 4 moved the methods to ui/tooltip.ts). `any`: the verbatim
	 * engine and the extracted methods mutate it with heterogeneous fields
	 * (text/x/y/origin/on/tt/tta/shouldHide/dynamic/from) exactly as the
	 * original 2.048 object literal did. */
	tooltip: any;
	ClosePrompt(): void;
	CloseNote(id: number): void;

	/* The 2.048 engine assigns methods and state at runtime beyond this named
	 * surface; the index signature keeps those reachable for typed callers
	 * without pretending they don't exist. */
	[key: string]: any;
}

/* ====================================================================== */
/* Window-boundary engine functions (published on `window`)               */
/* ====================================================================== */

/** `loc(id, params, baseline)` — localize a string; `params` fills `%1..%n`.
 * The engine accepts a single value (string or number), an array of values,
 * or an object of named values — the vanilla content uses all three. */
/* `id` is `string | undefined` on purpose: the engine indexes its string
 * tables with the raw key (`locStrings[id]`), so a missing key from
 * FindLocStringByPart flows through — `loc(undefined)` finds nothing and
 * returns `baseline||id` (falsy when both are absent), which the verbatim
 * call sites rely on (`loc(FindLocStringByPart(…)) || fallback`, and one
 * unguarded engine call). */
export type LocFn = (
	id: string | undefined,
	params?: string | number | (string | number)[] | Record<string, string | number>,
	baseline?: unknown,
) => string;

/** `Beautify(val, floats)` / `LBeautify(val, floats)` — number formatting. */
export type BeautifyFn = (val: number, floats?: number | boolean) => string;

/** `PlaySound(url, vol, pitchVar)` — audio playback. */
export type PlaySoundFn = (url: string, vol?: number, pitchVar?: number) => void;

/**
 * `AddEvent(el, ev, func)` — legacy event binding (addEventListener, with an
 * attachEvent fallback). Returns `[el, ev, func]` for `RemoveEvent`, or `false`.
 */
export type AddEventFn = (el: EventTarget, ev: string, func: (e?: any) => void) => [EventTarget, string, (e?: any) => void] | false;

/** `l(id)` — `document.getElementById` shorthand. */
export type LFn = (what: string) => HTMLElement | null;

/** `AddLanguage(id, name, strings, mod)` — register a language (loc files);
 * `strings` is the full table including the `""` PO header. */
export type AddLanguageFn = (
	id: string,
	name: string,
	strings: Record<string, LanguageString>,
	mod?: boolean,
) => boolean;

/** `LocalizeUpgradesAndAchievs()` — re-run the dname/ddesc localization pass. */
export type LocalizeContentFn = () => void;

/* ====================================================================== */
/* CC3-specific types (owned by this project, not the 2.048 engine)       */
/* ====================================================================== */

/**
 * CC3's reduced-motion instrumentation stats, kept on `window.__cc3Anim` and
 * read by the QA suite. The 2.048 engine knows nothing about it.
 */
export interface Cc3AnimStats {
	motion: boolean;
	noMotionClass: boolean;
	counter: {
		active: boolean;
		frames: number;
		anchors: number;
		writes: number;
	};
	ascendFlashes: number;
	notesSeen: number;
}
