/* Decide Your Destiny — a CC3 extras mod (native port of klattmose's
 * "Decide Your Destiny" v1.3, listed at https://sushi8756.github.io/Cookie-Clicker-Guide/).
 *
 * This is a faithful, self-contained re-implementation built on the engine's OWN
 * content constructors (Game.Upgrade / Game.Achievement) and the mod API
 * (Game.registerMod / registerHook). It does NOT depend on the CCSE framework:
 * the CCSE helpers the original used (CCSE.NewUpgrade, CCSE.NewHeavenlyUpgrade,
 * CCSE.NewAchievement, CCSE.AppendStatsVersionNumber, CCSE.AppendStatsSpecial)
 * were thin wrappers around these same engine functions plus the CCSE-era
 * extension surfaces (Game.customStatsMenu,
 * Game.customShimmerTypes['golden'].customListPush), which the engine provides
 * natively — see setupModding in systems/modding.ts; the engine invokes those
 * surfaces in ui/menu.ts (after the menu DOM is replaced) and in the golden
 * popFunc in systems/shimmerTypes.ts (at the start of effect-list construction).
 *
 * How it works: the heavenly "Destiny: Decided" upgrade unlocks a new
 * sugar-lump upgrade, the "Destiny decider". Opening it lets you pick the
 * outcome of the next NATURAL golden cookie (it costs 2^decisions sugar
 * lumps; the negative fates Ruin and Clot GIVE one lump instead). When that
 * golden cookie is popped, the chosen effect is forced and the decision is
 * cleared. Eight more heavenly upgrades (a chain after "Destiny: Decided")
 * expand the pool of choices. Four achievements reward deciding.
 *
 * The content is declared in init(), which runs at launchMods() — AFTER the
 * vanilla content exists (so 'Background selector' and 'Thick-skinned' are
 * present) and BEFORE BeautifyAll(), so dname/ddesc get filled in by the
 * engine exactly like vanilla content. Heavenly upgrades persist through the
 * vanilla save (pool 'prestige' upgrades are saved by name); the mod's own
 * save()/load() carries decidedDestiny + timesDecided in the original string
 * format "1.3;<name>,<count>" (the pre-1.3 numeric-index format is also read).
 *
 * Credit: content and design by klattmose (original CCSE mod); no assets are
 * used — everything renders from the vanilla icon sheet.
 */
import type { Game as EngineGame, Upgrade } from '../engine/types';

(function () {
	if (window.__cc3DecideDestiny) return;
	window.__cc3DecideDestiny = 1;

	const NAME = 'Decide Your Destiny';
	const VERSION = '1.3';
	const DECIDER = 'Destiny decider';

	/* A destiny: effect is a vanilla golden-cookie effect string (see the
	 * popFunc in systems/shimmerTypes.ts); prereq is the heavenly upgrade
	 * name that adds the destiny to the pool; negative = the destiny GIVES a
	 * lump instead of costing one; an = the article is "an". */
	interface Destiny {
		name: string;
		icon: [number, number];
		effect: string;
		prereq?: string;
		negative?: number;
		an?: number;
		id?: number;
	}

	const AllDestinies: Destiny[] = [
		{name: 'Undecided', icon: [0, 7], effect: ''},
		{name: 'Frenzy', icon: [10, 14], effect: 'frenzy'},
		{name: 'Lucky', icon: [27, 6], effect: 'multiply cookies'},
		{name: 'Building special', icon: [5, 6], effect: 'building special', prereq: 'Destiny: Architecture'},
		{name: 'Dragon Harvest', icon: [10, 25], effect: 'dragon harvest', prereq: 'Destiny: Agriculture'},
		{name: 'Cookie chain', icon: [20, 0], effect: 'chain cookie', prereq: 'Destiny: Scattershot'},
		{name: 'Cookie storm', icon: [22, 6], effect: 'cookie storm', prereq: 'Destiny: Scattershot'},
		{name: 'Click frenzy', icon: [0, 14], effect: 'click frenzy', prereq: 'Destiny: Carpal tunnel'},
		{name: 'Cursed finger', icon: [12, 17], effect: 'cursed finger', prereq: 'Destiny: Carpal tunnel'},
		{name: 'Ruin', icon: [11, 7], effect: 'ruin cookies', prereq: 'Destiny: Misfortune', negative: 1},
		{name: 'Clot', icon: [15, 5], effect: 'clot', prereq: 'Destiny: Misfortune', negative: 1},
		{name: 'Dragonflight', icon: [0, 25], effect: 'dragonflight', prereq: 'Destiny: Altitude'},
		{name: 'Elder frenzy', icon: [29, 6], effect: 'blood frenzy', prereq: 'Destiny: Apocalypse', an: 1},
		{name: 'Blab', icon: [29, 8], effect: 'blab', prereq: 'Destiny: Whimsy'},
	];
	AllDestinies.forEach((d, i) => { d.id = i; });
	const AllDestiniesByName: Record<string, Destiny> = {};
	AllDestinies.forEach((d) => { AllDestiniesByName[d.name] = d; });

	const state = { decidedDestiny: AllDestinies[0].name, timesDecided: 0 };

	/* CCSE.AppendStatsVersionNumber / CCSE.AppendStatsSpecial, reproduced:
	 * append a line to the freshly rendered Stats menu (the engine calls our
	 * customStatsMenu entries right after the menu DOM is replaced). */
	function appendStatsVersionNumber(name: string, version: string) {
		const general = window.l('statsGeneral');
		if (!general || !general.parentNode) return;
		const div = document.createElement('div');
		div.className = 'listing';
		div.innerHTML = '<b>' + name + ':</b> ' + version;
		general.parentNode.appendChild(div);
	}
	function appendStatsSpecial(html: string) {
		const special = window.l('statsSpecial');
		if (!special) return;
		const div = document.createElement('div');
		div.innerHTML = html;
		special.appendChild(div);
	}

	const calcCost = () => Math.pow(2, state.timesDecided);
	const rectifyDecision = () => (AllDestiniesByName[state.decidedDestiny] ? state.decidedDestiny : AllDestinies[0].name);
	const decided = () => rectifyDecision() !== AllDestinies[0].name;
	const undecide = () => { state.decidedDestiny = AllDestinies[0].name; };

	function hideSelectorBox(Game: EngineGame) {
		if (Game.choiceSelectorOn == Game.Upgrades[DECIDER].id) Game.Upgrades[DECIDER].buy();
	}

	/* ------------------------------------------------------------------ */
	/* Content. Declared in init() (launchMods): the vanilla content exists */
	/* by then, and BeautifyAll() runs right after launchMods, so          */
	/* dname/ddesc are filled in like vanilla content.                     */
	/* ------------------------------------------------------------------ */
	function declareContent(Game: EngineGame) {
		// The decider itself: a sugar-lump "toggle" upgrade with a choice
		// selector, ordered just after the vanilla 'Background selector'.
		const upgrade = new Game.Upgrade(
			DECIDER,
			loc("Spend sugar lumps to choose the outcome of the next natural golden cookie."),
			0,
			[22, 11]
		);
		upgrade.pool = 'toggle';
		upgrade.order = Game.Upgrades['Background selector'].order + 1 / 1000;
		upgrade.priceLumps = calcCost();

		upgrade.descFunc = function (this: Upgrade) {
			const choice = AllDestiniesByName[rectifyDecision()];
			return '<div style="text-align:center;">' +
				loc("Current:") + ' ' + tinyIcon(choice.icon) + ' <b>' + choice.name + '</b>' +
				'</div><div class="line"></div>' +
				(this.ddesc ? this.ddesc : this.desc);
		};

		upgrade.choicesFunction = function (this: Upgrade) {
			const choices: any[] = [];
			for (let i = 0; i < AllDestinies.length; i++) {
				const temp = AllDestinies[i];
				if (!temp.prereq || Game.Has(temp.prereq)) {
					const neg = temp.negative ? true : false;
					if (temp.name == rectifyDecision()) {
						choices[i] = {name: temp.name, icon: temp.icon, selected: 1};
						if (i) choices[i].name = 'Destiny Decided: ' + choices[i].name;
					} else if (decided()) {
						choices[i] = 0;
					} else {
						choices[i] = {
							name: temp.name + ' - ' + (neg ? 'gains ' : 'costs ') +
								'<span class="price lump' + ((neg || this.priceLumps <= Game.lumps) ? '' : ' disabled') + '">' +
								Beautify(Math.round(neg ? 1 : this.priceLumps)) + '</span>',
							icon: temp.icon,
							selected: 0,
						};
					}
				} else {
					choices[i] = 0;
				}
			}
			return choices;
		};

		upgrade.choicesPick = function (this: Upgrade, id: number) {
			// Don't do things for Undecided or if already decided
			if (id > 0 && !decided()) {
				const choice = AllDestinies[id];
				if (choice.negative) {
					Game.gainLumps(1);
					state.decidedDestiny = choice.name;
					Game.Win('Tradeoff');
					hideSelectorBox(Game);
				} else {
					// spendLump returns the confirmation closure — invoking it
					// spends the lumps (or asks, if the preference is on).
					Game.spendLump(
						calcCost(),
						'decide your destiny will be a' + (choice.an ? 'n' : '') + ' ' + choice.name,
						function () {
							state.decidedDestiny = choice.name;
							state.timesDecided++;
							upgrade.priceLumps = calcCost();
							Game.Win('Decisive');
							if (state.timesDecided >= 10) Game.Win('Control freak');
							if (choice.name == 'Blab') Game.Win('Whimsical');
							hideSelectorBox(Game);
						}
					)();
				}
			}
		};

		// The heavenly chain (9 upgrades): CCSE.NewHeavenlyUpgrade semantics —
		// push to Game.PrestigeUpgrades first, pool 'prestige', order = id,
		// parents are upgrade NAMES (empty parents means ['Legacy']).
		const PLACEMENT: [number, number][] = [
			[276, -205], [367, -290], [500, -300], [577, -410], [710, -420],
			[787, -530], [920, -540], [997, -650], [1130, -660],
		];
		const HEAVENLY: Array<[string, string, number, [number, number], string[]]> = [
			['Destiny: Decided', loc("Unlocks the <b>Destiny decider</b>, letting you spend sugar lumps to choose the outcome of the next natural golden cookie."), 1e3, [22, 11], []],
			['Destiny: Architecture', loc("Adds the <b>Building special</b> effect to the pool of choices."), 1e4, [5, 6], ['Destiny: Decided']],
			['Destiny: Agriculture', loc("Adds the <b>Dragon Harvest</b> effect to the pool of choices."), 1e5, [10, 25], ['Destiny: Architecture']],
			['Destiny: Scattershot', loc("Adds the <b>Cookie chain</b> and <b>Cookie storm</b> effects to the pool of choices."), 1e6, [22, 6], ['Destiny: Agriculture']],
			['Destiny: Carpal tunnel', loc("Adds the <b>Click frenzy</b> and <b>Cursed finger</b> effects to the pool of choices."), 1e8, [0, 14], ['Destiny: Scattershot']],
			['Destiny: Misfortune', loc("Adds the <b>Ruin</b> and <b>Clot</b> effects to the pool of choices, which will <b>give</b> sugar lumps."), 1e9, [15, 5], ['Destiny: Carpal tunnel']],
			['Destiny: Altitude', loc("Adds the <b>Dragonflight</b> effect to the pool of choices."), 1e10, [0, 25], ['Destiny: Misfortune']],
			['Destiny: Apocalypse', loc("Adds the <b>Elder frenzy</b> effect to the pool of choices."), 1e12, [29, 6], ['Destiny: Altitude']],
			['Destiny: Whimsy', loc("Adds the <b>Blab</b> effect to the pool of choices."), 1e15, [29, 8], ['Destiny: Apocalypse']],
		];
		for (let i = 0; i < HEAVENLY.length; i++) {
			const me = new Game.Upgrade(HEAVENLY[i][0], HEAVENLY[i][1], HEAVENLY[i][2], HEAVENLY[i][3]);
			Game.PrestigeUpgrades.push(me);
			me.pool = 'prestige';
			me.posX = PLACEMENT[i][0];
			me.posY = PLACEMENT[i][1];
			me.order = me.id;
			const names = HEAVENLY[i][4].length > 0 ? HEAVENLY[i][4] : ['Legacy'];
			me.parents = names.map((p) => Game.Upgrades[p]);
		}

		// Achievements, ordered just after the vanilla 'Thick-skinned'.
		let order = Game.Achievements['Thick-skinned'].order + 1 / 1000;
		const ACHIEVEMENTS: Array<[string, string, [number, number], string?]> = [
			['Decisive', loc("Decided destiny <b>1 time</b>."), [22, 11]],
			['Control freak', loc("Decided destiny <b>10 times</b> in one ascension."), [22, 11], 'shadow'],
			['Tradeoff', loc("Accepted a negative fate for material gain."), [15, 5]],
			['Whimsical', loc("Decided your destiny would be a <b>Blab</b>."), [29, 8]],
		];
		for (const [name, desc, icon, pool] of ACHIEVEMENTS) {
			new Game.Achievement(name, desc, icon);
			Game.last.order = order;
			if (pool) Game.last.pool = pool;
			order += 0.001;
		}

		Game.upgradesToRebuild = 1;
	}

	/* The golden-cookie hook: when the mod has a decision pending and the
	 * popped cookie is a NATURAL one (no forced effect, not in a chain),
	 * force the chosen effect, clear the wrath, and undecide. Runs at the
	 * start of effect-list construction (see systems/shimmerTypes.ts). */
	function injectIntoGoldenCookie(Game: EngineGame) {
		Game.customShimmerTypes['golden'].customListPush.push(function (me: any, _list: string[]) {
			if (decided() && !me.force && !Game.shimmerTypes['golden'].chain) {
				me.force = AllDestiniesByName[rectifyDecision()].effect;
				me.wrath = 0;
				undecide();
				hideSelectorBox(Game);
			}
		});
	}

	/* ------------------------------------------------------------------ */
	/* Lifecycle                                                           */
	/* ------------------------------------------------------------------ */
	function onReset(Game: EngineGame, hard: boolean) {
		if (hard) undecide();
		state.timesDecided = 0;
		Game.Upgrades[DECIDER].priceLumps = calcCost();
	}
	function onCheck(Game: EngineGame) {
		if (Game.Has('Destiny: Decided')) Game.Unlock(DECIDER);
	}

	/* Save format: "<version>;<decidedDestiny>,<timesDecided>"
	 * (the pre-1.3 format "<index>,<timesDecided>" is still readable). */
	function save(): string {
		let str = VERSION;
		str += ';' + state.decidedDestiny;
		str += ',' + state.timesDecided;
		return str;
	}
	function load(str: string) {
		if (!str) return;// corrupt/empty Custom-section entry: keep the live state
		const Game = window.Game as EngineGame;
		let spl = str.split(';');
		if (spl.length == 1) {
			// Old save format
			spl = str.split(',');
			let idx = parseInt(spl[0] || '0', 10);
			if (isNaN(idx)) idx = 0;
			if (idx < 0 || idx >= AllDestinies.length) idx = 0;
			state.decidedDestiny = AllDestinies[idx].name;
			state.timesDecided = parseInt(spl[1] || '0', 10) || 0;
		} else {
			const data = spl[1].split(',');
			// Unknown fate name (corrupt entry or a save from a future version):
			// fall back to the first destiny instead of carrying a dead name.
			state.decidedDestiny = AllDestiniesByName[data[0]] ? data[0] : AllDestinies[0].name;
			state.timesDecided = parseInt(data[1] || '0', 10) || 0;
		}
		Game.Upgrades[DECIDER].priceLumps = calcCost();
	}

	function init() {
		const Game = window.Game as EngineGame;
		injectIntoGoldenCookie(Game);
		declareContent(Game);
		onReset(Game, false);

		Game.customStatsMenu.push(function () {
			appendStatsVersionNumber(NAME, VERSION);
			if (state.timesDecided)
				appendStatsSpecial('<div class="listing"><b>' + loc("Times decided destiny :") + '</b> ' + state.timesDecided + '</div>');
		});

		Game.registerHook('reset', function (hard: any) { onReset(window.Game as EngineGame, !!hard); });
		Game.registerHook('check', function () { onCheck(window.Game as EngineGame); });

		if (Game.prefs.popups) Game.Popup(NAME + ' loaded!');
		else Game.Notify(NAME + ' loaded!', '', '', 1, 1);
	}

	/* ------------------------------------------------------------------ */
	/* Registration. The engine module is imported before this one, so     */
	/* Game.registerMod exists at module-eval time; the game hasn't booted */
	/* yet, so init() runs at launchMods() during Game.Load().             */
	/* ------------------------------------------------------------------ */
	function register() {
		const Game = window.Game;
		if (!Game || typeof Game.registerMod !== 'function') return false;
		Game.registerMod(NAME, {
			name: NAME,
			version: VERSION,
			init: init,
			save: save,
			load: load,
		}, true);
		return true;
	}

	// The original exposed the DecideDestiny global so other mods could add
	// custom fates ("RECURSIVE MODDING?!") — kept for compatibility.
	window.DecideDestiny = {
		name: NAME,
		version: VERSION,
		AllDestinies: AllDestinies,
		AllDestiniesByName: AllDestiniesByName,
		NewDestiny: function (name: string, icon: [number, number], effect: string, other?: Partial<Destiny>) {
			// name, icon, and effect are required
			if (!name || !icon || !effect) return;
			const dest: Destiny = {name: name, icon: icon, effect: effect, id: AllDestinies.length};
			if (other) {
				for (const k in other) (dest as any)[k] = (other as any)[k];
			}
			AllDestinies.push(dest);
			AllDestiniesByName[name] = dest;
		},
	};

	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () { window.clearInterval(t); }, { once: true });
	}
})();
