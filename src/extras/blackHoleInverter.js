/* Black Hole Inverter — a CC3 extras mod (native port of klattmose's "Black hole
 * inverter", listed at https://sushi8756.github.io/Cookie-Clicker-Guide/).
 *
 * This is a faithful, self-contained re-implementation built on the engine's OWN
 * content constructors (Game.Object / Game.TieredUpgrade / Game.SynergyUpgrade /
 * Game.GrandmaSynergy / Game.TieredAchievement / Game.ProductionAchievement /
 * Game.Achievement) and the mod API (Game.registerMod / registerHook). It does NOT
 * depend on the CCSE framework: the CCSE helpers the original used (CCSE.NewBuilding,
 * CCSE.NewAchievement, CCSE.AppendStatsVersionNumber) were thin wrappers around these
 * same engine functions and are reproduced here directly.
 *
 * Content (all declared with Game.vanilla=0, i.e. in the 'create' hook, which runs
 * AFTER the vanilla content and BEFORE LoadSave):
 *   - one new building: "Black hole inverter" (the 20th building; vanilla has 19,
 *     id 0-18, so this is id 19)
 *   - 14 tiered upgrades, 1 grandma synergy, 2 synergy upgrades
 *   - 14 tiered achievements, 3 production achievements, 1 level achievement (M87)
 *
 * The vanilla save format deliberately skips vanilla=0 content, so this mod persists
 * its OWN content (building amount/level, purchased upgrades, won achievements) via
 * the mod save()/load() hooks, which the engine wires into WriteSave/LoadSave.
 *
 * Art: the original's real 64x64 sprite is vendored at img/blackholeinverter.png and
 * used for both the building canvas and the store icon. Tiered content uses the
 * vanilla icon grid (icon column 2). The original's custom upgrade/achievement icon
 * sheet (customIcons.png) and store-icon sheet (customBuildings.png) are NOT used:
 * the vanilla icons render correctly for the pilot and keep this self-contained.
 */
(function () {
	if (window.__cc3Binverter) return;
	window.__cc3Binverter = 1;

	const NAME = 'Black hole inverter';
	const DESC = 'Inverts the flow of gravity to get the infinitely delicious cookies from an infinitely dense singularity.';
	const COMMON = 'black hole inverter|black hole inverters|extracted|[X]% larger event horizon|[X]% larger event horizon';
	const STORE_ICON = 'img/blackholeinverter.png';
	const CANVAS_PIC = 'blackholeinverter.png';
	const CANVAS_BG = 'antimattercondenserBackground.webp';
	const ORDER_BASE = 100000;

	// The exact content this mod declares, so save()/load() can target it by name.
	const TIERED_UPGRADES = [
		['Blacker holes', 'Blacker than black!'],
		['More Mass', 'Big holes.'],
		['Stronger Pull', 'No escape.'],
		['Dead Space', 'You stare into the abyss and the abyss stares back at you.'],
		['Cookiefication', 'Yum!'],
		['White Hole Inverters', 'How does this one even make sense?'],
		['Merging', 'Combine!'],
		['Worm holes', 'You go in one end, you come out the other. Easy as that.'],
		['Micro black holes', 'Tiny, but deadly.'],
		['Radio-Rings', 'Insanely radioactive, and extremely deadly!'],
		['Reality-Bending Holes', 'Now you can see how close you are to certain doom! Two of them put together!'],
		['Singularity', 'There is no coming back from this.'],
		['The Big Crunch', 'Everything, all at once.'],
		['Event Horizon', 'Not even light escapes.'],
	];
	const GRANDMA_UPGRADE = 'Heavy grandmas';
	const SYNERGY_UPGRADES = ['Daring pilots', 'General relativity'];
	const UPGRADE_NAMES = TIERED_UPGRADES.map((t) => t[0]).concat([GRANDMA_UPGRADE]).concat(SYNERGY_UPGRADES);

	const TIERED_ACHIEVEMENTS = [
		'Single singularity', 'Accretion disk', 'Photon sphere', 'Spaghettified', 'Tidal forces',
		'Hawking radiation', 'Quark-gluon plasma', 'Neutron star', 'Black dwarf', 'White dwarf',
		'Redshifted', 'Blueshifted', 'Gravitational lens', 'Supernova',
	];
	const PRODUCTION_ACHIEVEMENTS = ['Relativistic jets', 'Primordial black holes', 'Naked singularity'];
	const LEVEL_ACHIEVEMENT = 'M87';
	const ACHIEVEMENT_NAMES = TIERED_ACHIEVEMENTS.concat(PRODUCTION_ACHIEVEMENTS).concat([LEVEL_ACHIEVEMENT]);

	const declared = { done: false };

	/* ------------------------------------------------------------------ */
	/* Content declaration — runs in the 'create' hook (before LoadSave). */
	/* ------------------------------------------------------------------ */
	function declare(Game) {
		if (declared.done || Game.Objects[NAME]) return;
		declared.done = true;

		// A complete art object (pic + bg set directly, no `base`) so the vanilla
		// canvas renderer lazy-loads the vendored sprite and a valid background.
		const art = {
			pic: CANVAS_PIC,
			bg: CANVAS_BG,
			xV: 8, yV: 8, w: 64, h: 64, x: 0, y: 16, rows: 1, frames: 1,
		};

		const me = new Game.Object(
			NAME,
			COMMON,
			DESC,
			0,   // icon (store row; the image is overridden, so the row is unused)
			2,   // iconColumn (tiered content icon column — the Farm column)
			art,
			0,   // price (ignored: the n=19 auto-curve sets basePrice/baseCps)
			function (m) {
				let mult = 1;
				mult *= Game.GetTieredCpsMult(m);
				mult *= Game.magicCpS(m.name);
				return m.baseCps * mult;
			},
			function () {
				// Unlock this building's tiered upgrades + tiered achievements when bought,
				// and the grandma synergy once the SpecialGrandmaUnlock threshold is met.
				Game.UnlockTiered(this);
				if (this.amount >= Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount > 0) Game.Unlock(this.grandma.name);
			}
		);

		// Store icon: force the "on" cell to (0,0); the actual image is re-asserted in a
		// draw hook (the vanilla rebuild() resets backgroundPosition every tick).
		me.iconFunc = function () { return [0, 0]; };
		// Shrink the (long) name in the store, as the original did.
		me.displayName = '<span style="font-size:80%;position:relative;bottom:4px;">Black hole inverter</span>';

		// 14 tiered upgrades (Game.SetTier attaches each to me.tieredUpgrades[tier]).
		for (let i = 0; i < TIERED_UPGRADES.length; i++) {
			const up = Game.TieredUpgrade(TIERED_UPGRADES[i][0], '<q>' + TIERED_UPGRADES[i][1] + '</q>', NAME, i + 1);
			up.order = ORDER_BASE + i;
		}

		// Grandma synergy (sets me.grandma).
		Game.GrandmaSynergy(GRANDMA_UPGRADE, 'A dense grandma to accrete more cookies.', NAME).order = ORDER_BASE + 100;

		// Two synergy upgrades (attach to me.synergies and the partner's).
		Game.SynergyUpgrade('Daring pilots', '<q>Nothing says cookie like a one-way ticket into a black hole.</q>', NAME, 'Shipment', 'synergy1').order = ORDER_BASE + 200;
		Game.SynergyUpgrade('General relativity', '<q>Space is time. Time is space.</q>', NAME, 'Time machine', 'synergy2').order = ORDER_BASE + 201;

		// 14 tiered achievements (Game.SetTier attaches each to me.tieredAchievs[tier]).
		for (let i = 0; i < TIERED_ACHIEVEMENTS.length; i++) {
			Game.TieredAchievement(TIERED_ACHIEVEMENTS[i], '', NAME, i + 1).order = ORDER_BASE + 300 + i;
		}

		// 3 production achievements (attach to me.productionAchievs).
		for (let i = 0; i < PRODUCTION_ACHIEVEMENTS.length; i++) {
			Game.ProductionAchievement(PRODUCTION_ACHIEVEMENTS[i], NAME, i + 1, '').order = ORDER_BASE + 400 + i;
		}

		// Level achievement — won at level 10 by the check hook below.
		const m87 = new Game.Achievement(LEVEL_ACHIEVEMENT, 'Reach level <b>10</b> black hole inverters.', [1, 26]);
		m87.order = ORDER_BASE + 500;
		me.levelAchiev10 = m87;

		// The vanilla localization pass (LocalizeUpgradesAndAchievs) already ran before the
		// 'create' hook, so our new content hasn't had dname/ddesc set — and BeautifyAll()
		// (which runs right after 'create') dereferences ddesc. Re-run the pass now, exactly
		// as the original CCSE.NewUpgrade/NewAchievement wrappers did.
		if (typeof window.LocalizeUpgradesAndAchievs === 'function') window.LocalizeUpgradesAndAchievs();

		// Build the store row + canvas for this building (the vanilla ones were built at
		// module-eval, before we existed).
		setupBuildingDom(Game, me);

		Game.recalculateGains = 1;
	}

	/* ------------------------------------------------------------------ */
	/* Store/canvas DOM. The vanilla store rows and building canvases are    */
	/* built at module-eval time (before the 'create' hook), so this         */
	/* building has no store row / canvas yet. Rebuild the store (a full      */
	/* innerHTML rebuild, so existing rows are discarded — no duplicate       */
	/* handlers) and wire up this building's canvas + hover + mute icon,      */
	/* exactly as CCSE.NewBuilding does.                                     */
	/* ------------------------------------------------------------------ */
	function setupBuildingDom(Game, me) {
		Game.BuildStore();
		if (me.id <= 0) return;
		me.canvas = window.l('rowCanvas' + me.id);
		me.ctx = me.canvas.getContext('2d', { alpha: false });
		me.pics = [];
		if (window.AddEvent) {
			window.AddEvent(me.canvas, 'mouseover', function () { me.mouseOn = true; });
			window.AddEvent(me.canvas, 'mouseout', function () { me.mouseOn = false; });
			window.AddEvent(me.canvas, 'mousemove', function (e) {
				var box = me.canvas.getBounds();
				me.mousePos[0] = e.pageX - box.left;
				me.mousePos[1] = e.pageY - box.top;
			});
		}
		// Mute-bar icon so a muted inverter can be unmuted from the bottom bar.
		if (Game.clickStr) {
			var icon = [0 * 64, me.icon * 64];
			var host = window.l('buildingsMute');
			if (host && !window.l('mutedProduct' + me.id)) {
				host.insertAdjacentHTML('beforeend',
					'<div class="tinyProductIcon" id="mutedProduct' + me.id + '" style="display:none;background-position:-' + icon[0] + 'px -' + icon[1] + 'px;" ' +
					Game.clickStr + '="Game.ObjectsById[' + me.id + '].mute(0);PlaySound(Game.ObjectsById[' + me.id + '].muted?\'snd/clickOff2.mp3\':\'snd/clickOn2.mp3\');"></div>');
			}
		}
	}

	/* ------------------------------------------------------------------ */
	/* Presentation: re-assert the custom store icon each draw tick.       */
	/* ------------------------------------------------------------------ */
	function drawIcon(Game) {
		const me = Game.Objects[NAME];
		if (!me) return;
		const url = 'url(' + STORE_ICON + ')';
		const on = document.getElementById('productIcon' + me.id);
		const off = document.getElementById('productIconOff' + me.id);
		if (on) { on.style.backgroundImage = url; on.style.backgroundPosition = '0px 0px'; }
		if (off) { off.style.backgroundImage = url; off.style.backgroundPosition = '0px 0px'; }
	}

	/* ------------------------------------------------------------------ */
	/* Logic: win the level achievement.                                   */
	/* ------------------------------------------------------------------ */
	function check(Game) {
		const me = Game.Objects[NAME];
		if (me && me.levelAchiev10 && !me.levelAchiev10.won && me.level >= 10) Game.Win(LEVEL_ACHIEVEMENT);
	}

	/* ------------------------------------------------------------------ */
	/* Persistence — vanilla=0 content is not saved by the engine, so we   */
	/* save/restore our own building + upgrades + achievements.            */
	/* ------------------------------------------------------------------ */
	function save(Game) {
		const me = Game.Objects[NAME];
		if (!me) return '';
		const boughtUpgs = [];
		for (let i = 0; i < UPGRADE_NAMES.length; i++) {
			const u = Game.Upgrades[UPGRADE_NAMES[i]];
			if (u && u.bought) boughtUpgs.push(u.name);
		}
		const wonAch = [];
		for (let i = 0; i < ACHIEVEMENT_NAMES.length; i++) {
			const a = Game.Achievements[ACHIEVEMENT_NAMES[i]];
			if (a && a.won) wonAch.push(a.name);
		}
		// Three sections joined by '@' (no content name contains '@' or ','):
		//   version|amount|bought|totalCookies|level|highest|muted @ boughtUpgradeNames @ wonAchievementNames
		return [
			[1, me.amount, me.bought ? 1 : 0, Math.floor(me.totalCookies), me.level, me.highest, me.muted ? 1 : 0].join('|'),
			boughtUpgs.join(','),
			wonAch.join(','),
		].join('@');
	}

	function load(Game, str) {
		if (!str) return;
		const me = Game.Objects[NAME];
		if (!me) return;
		const parts = String(str).split('@');
		const nums = (parts[0] || '').split('|');
		// parts[0] nums: [version, amount, bought, totalCookies, level, highest, muted]
		me.amount = parseInt(nums[1] || '0', 10) || 0;
		me.bought = parseInt(nums[2] || '0', 10) || 0;
		me.totalCookies = parseFloat(nums[3] || '0') || 0;
		me.level = parseInt(nums[4] || '0', 10) || 0;
		me.highest = parseInt(nums[5] || '0', 10) || 0;
		me.muted = parseInt(nums[6] || '0', 10) || 0;
		Game.BuildingsOwned = (Game.BuildingsOwned || 0) + me.amount;

		const boughtUpgs = (parts[1] || '').split(',').filter(Boolean);
		for (let i = 0; i < boughtUpgs.length; i++) {
			const u = Game.Upgrades[boughtUpgs[i]];
			if (u) {
				u.unlocked = 1;
				u.bought = 1;
				if (typeof u.buyFunction === 'function') u.buyFunction.call(u);
			}
		}
		const wonAch = (parts[2] || '').split(',').filter(Boolean);
		for (let i = 0; i < wonAch.length; i++) {
			const a = Game.Achievements[wonAch[i]];
			if (a && !a.won) {
				a.won = 1;
				if (Game.CountsAsAchievementOwned(a.pool)) Game.AchievementsOwned++;
			}
		}
		me.refresh();
		Game.recalculateGains = 1;
	}

	/* ------------------------------------------------------------------ */
	/* Registration. The engine module is imported before this one, so      */
	/* Game.registerMod exists at module-eval time; the game hasn't booted  */
	/* yet, so init() runs at launchMods() during Game.Load().              */
	/* ------------------------------------------------------------------ */
	function register() {
		const Game = window.Game;
		if (!Game || typeof Game.registerMod !== 'function') return false;
		Game.registerMod('Black Hole Inverter', {
			name: 'Black Hole Inverter',
			version: '1.0-cc3',
			init: function () {
				Game.registerHook('create', function () { declare(Game); });
				Game.registerHook('draw', function () { drawIcon(Game); });
				Game.registerHook('check', function () { check(Game); });
			},
			save: function () { return save(Game); },
			load: function (str) { load(Game, str); },
		});
		return true;
	}

	// Register as soon as the engine is present. Normally that's immediately (the
	// engine module evaluates first); the tiny poll is a safety net for load order.
	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () { window.clearInterval(t); }, { once: true });
	}
})();
