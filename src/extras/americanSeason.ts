/* American Season — a CC3 extras mod (native port of klattmose's
 * "American Season" v1.8, a CCSE mod listed at
 * https://sushi8756.github.io/Cookie-Clicker-Guide/).
 *
 * This is a faithful, self-contained re-implementation built on the engine's
 * OWN content constructors (Game.Upgrade / Game.Achievement) and the mod API
 * (Game.registerMod / registerHook). It does NOT depend on the CCSE framework:
 * the CCSE helpers the original used were thin wrappers around these same
 * engine functions plus the CCSE-era extension surfaces the engine provides
 * natively — Game.customStatsMenu / Game.customOptionsMenu (dispatched in
 * ui/menu.ts after the menu DOM is replaced), the mod hooks 'logic', 'reset',
 * 'cps' (runModHookOnValue in main.ts), 'check' and 'ticker' (the vanilla
 * modHooks['ticker'] dispatch in systems/ticker.ts) — and the vanilla season
 * system (Game.seasons + Game.computeSeasons/computeSeasonPrices in
 * systems/seasons.ts), which CCSE.NewSeason used by calling exactly those two
 * functions after adding Game.seasons[name].
 *
 * How it works: "Explosive biscuit" triggers the American season for 24
 * hours (and the season is the calendar base season July 1-7, as in the
 * original). While the season is on, rockets fly up from the bottom of the
 * screen (a new 'rocket' shimmer type); clicking one earns a minute of cookie
 * production (or more, with "High explosive") and sometimes unlocks one of
 * the 11 firework upgrades, which also drop on the vanilla Keepsakes
 * heavenly-upgrade roll (the upgrades were appended to Game.seasonDrops, as
 * in the original). While the season is on, a canvas in the left panel
 * renders a full fireworks simulation (hold the mouse down in the left panel
 * to launch one manually; "inhibits clicking wrinklers" exactly as the
 * original, since the canvas covers the left panel). Four achievements
 * reward popping rockets and collecting the upgrades.
 *
 * The content is declared in init(), which runs at launchMods() — AFTER the
 * vanilla content exists (so 'Bunny biscuit', "Santa's dominion", 'Starburst'
 * anchors, 'Keepsakes' and 'Hide & seek champion' are present) and BEFORE
 * BeautifyAll(), so dname/ddesc get filled in by the engine exactly like
 * vanilla content. The mod's own save()/load() carries the fireworks config
 * (the original's 28-key defaultConfig, verbatim) + rocketsPopped as JSON;
 * the seasonal trigger state itself persists through the vanilla save
 * (Game.season / Game.seasonT are vanilla save fields).
 *
 * Assets: img/customIcons.png (the upgrade/achievement icon sheet),
 * img/rocket.png (the shimmer sprite) and snd/rocketLaunch.mp3 /
 * snd/rocketBoom.mp3 are klattmose's original artwork, vendored into
 * public/ (the original referenced the same files on klattmose.github.io).
 * The original's explicit `Sounds[url]=new Audio(url)` preload is omitted:
 * the engine's PlaySound creates the Audio on first use, and the files are
 * local. Everything else is verbatim logic.
 *
 * Credit: content, design and assets by klattmose (original CCSE mod).
 */
(function () {
	if (window.__cc3AmericanSeason) return;
	window.__cc3AmericanSeason = 1;

	const NAME = 'American Season';
	const VERSION = '1.8';
	/* The original referenced its assets on klattmose.github.io; the CC3
	 * port vendors them (public/img/customIcons.png, public/img/rocket.png,
	 * public/snd/rocket*.mp3) and points at the local copies. */
	const ICONS_URL = 'img/customIcons.png';
	/* 3-cell icon [x, y, url] — tinyIcon accepts the url cell, but the
	 * Notify() typing only allows number[], so pass an any[] handle. */
	const ICON_NOTIFY: any[] = [0, 4, ICONS_URL];

	/* ------------------------------------------------------------------ */
	/* State.                                                              */
	/* ------------------------------------------------------------------ */
	const state = {
		config: defaultConfig(),
		rocketsPopped: 0,
		upgrades: [] as string[],
		fireworkTypes: [] as string[],
		shimmerModifiers: [] as string[],
		canvas: null as HTMLCanvasElement | null,
		context: null as CanvasRenderingContext2D | null,
		fireworks: [] as any[],
		stars: [] as any[],
		hue: 120,
		ticksSinceFirework: 0,
		isLoaded: 0,
		announced: 0,
	};

	function defaultConfig() {
		return {
			SHOW_CANVAS: true, // Display fireworks in the left panel.

			FIREWORK_ACCELERATION: 1.1, // Base firework acceleration. // 1.0 causes fireworks to travel at a constant speed. // Higher number increases rate firework accelerates over time.
			FIREWORK_BRIGHTNESS_MIN: 50, // Minimum firework brightness.
			FIREWORK_BRIGHTNESS_MAX: 70, // Maximum firework brightness.
			FIREWORK_SPEED: 10, // Base speed of fireworks.
			FIREWORK_TRAIL_LENGTH: 3, // Base length of firework trails.

			STAR_BRIGHTNESS_MIN: 50, // Minimum star brightness.
			STAR_BRIGHTNESS_MAX: 80, // Maximum star brightness.
			STAR_COUNT: 100, // Base star count per firework.
			STAR_DECAY_MIN: 0.015, // Minimum star decay rate.
			STAR_DECAY_MAX: 0.03, // Maximum star decay rate.
			STAR_FRICTION: 0.9, // Base star friction. // Slows the speed of particles over time.
			STAR_GRAVITY: 1.4, // Base star gravity. // How quickly particles move toward a downward trajectory.
			STAR_HUE_VARIANCE: 20, // Variance in star coloration.
			STAR_TRANSPARENCY: 1, // Base star transparency.
			STAR_SPEED_MIN: 2, // Minimum star speed.
			STAR_SPEED_MAX: 20, // Maximum star speed.
			STAR_TRAIL_LENGTH: 5, // Base length of explosion star trails.

			CANVAS_CLEANUP_ALPHA: 0.2, // Alpha level that canvas cleanup iteration removes existing trails. // Lower value increases trail duration.
			HUE_STEP_INCREASE: 1, // Hue change per loop, used to rotate through different firework colors.

			TICKS_PER_FIREWORK_MIN: 5, // Minimum number of ticks per manual firework launch.
			STROKE_WIDTH: 1, // Line width for canvas strokes.
			GLOBAL_COMPOSITE_OPERATION: 'default', // Override for globalCompositeOperation
		} as Record<string, any>;
	}

	function randBetween(min: number, max: number) {
		// Get a random number within the specified range.
		return Math.random() * (max - min) + min;
	}
	function calculateDistance(aX: number, aY: number, bX: number, bY: number) {
		// Calculate the distance between two points.
		const xDistance = aX - bX;
		const yDistance = aY - bY;
		return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
	}
	function getHowManyFireworkDrops() {
		let num = 0;
		for (const name of state.upgrades) if (Game.Has(name)) num++;
		return num;
	}

	/* ------------------------------------------------------------------ */
	/* Content: the season + trigger upgrade. CCSE.NewSeason did exactly   */
	/* Game.seasons[name] = season; + Game.computeSeasons();               */
	/* Game.computeSeasonPrices(); (plus the calendar-window check for     */
	/* Game.baseSeason and the on-load announcement, reproduced here).     */
	/* ------------------------------------------------------------------ */
	function createSeason() {
		const Game2 = Game;
		const trigger = new Game2.Upgrade(
			'Explosive biscuit',
			loc('Triggers <b>American season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.<q>Hold my beer and watch this</q>'),
			Game2.seasonTriggerBasePrice,
			[0, 4, ICONS_URL]
		);
		trigger.season = 'american';
		trigger.pool = 'toggle';
		trigger.order = 2 * Game2.Upgrades['Bunny biscuit'].order - Game2.Upgrades["Fool's biscuit"].order;
		trigger.descFunc = function (this: any) {
			const desc =
				'<div style="text-align:center;">' +
				Game2.listTinyOwnedUpgrades(state.upgrades) +
				'<br><br>' +
				loc("You've purchased <b>%1</b> firework upgrades.", getHowManyFireworkDrops() + '/' + state.upgrades.length) +
				'<div class="line"></div>' +
				Game2.saySeasonSwitchUses() +
				'<div class="line"></div></div>' +
				this.ddesc;
			return desc;
		};

		/* The calendar base season (July 1-7), as in the original: if today is
		 * inside the window, the American season is the base season. The
		 * vanilla Init date-scan already ran (July is not one of its windows),
		 * and this init() still runs before LoadSave, so Game.season picks the
		 * saved season or baseSeason afterwards, vanilla behavior. */
		const now = Date.now();
		const firstDay = new Date(new Date().getFullYear(), 7 - 1, 1).getTime();
		const lastDay = new Date(new Date().getFullYear(), 7 - 1, 7).getTime() + 24 * 60 * 60 * 1000; // lastDay is inclusive
		if (now >= firstDay && now <= lastDay) Game2.baseSeason = 'american';

		//CCSE.NewSeason('american', …, {name, start, over, trigger}, announcement);
		Game2.seasons['american'] = {
			name: loc('American season'),
			start: loc('American season has started!'),
			over: loc('American season is over.'),
			trigger: 'Explosive biscuit',
		};
		Game2.computeSeasons();
		Game2.computeSeasonPrices();

		/* The original announced "Independence Day!" on load when the season
		 * was active as the base season (CCSE.customLoad). Our engine has no
		 * postload hook, so the first logic tick after LoadSave settles the
		 * season — same observable result. */
		Game2.registerHook('logic', function () {
			if (!state.announced && Game2.ready && Game2.season == 'american' && Game2.season == Game2.baseSeason) {
				state.announced = 1;
				Game2.Notify(loc('Independence Day!'), loc("It's <b>American season</b>!<br>Set off some fireworks and have a barbecue!"), ICON_NOTIFY, 60 * 3);
			}
		});

		/* News ticker (vanilla modHooks['ticker'], dispatched in
		 * systems/ticker.ts): each hook returns an array of news strings. */
		Game2.registerHook('ticker', function () {
			const list: any[] = [];
			if (Game2.season == 'american' && Game2.cookiesEarned >= 1000)
				list.push(
					choose([
						'News : flocks of eagles spotted circling over wig stores!',
						'News : debate rages across the county over whether grilling burgers and steaks counts as barbecue; militias prepare for combat.',
						'News : strange lights spotted at night over rivers and parks; official explanation satisfies few.',
						'News : continual loud noises disrupting sleep patterns for children of all ages; "things just keep exploding" exhausted mother says.',
					])
				);
			return list;
		});
	}

	/* ------------------------------------------------------------------ */
	/* Content: the firework + shimmer upgrades, Grand finale, Starburst.  */
	/* CCSE.NewUpgrade === new Game.Upgrade + registration bookkeeping;    */
	/* the drops are plain store upgrades (default pool '', like the       */
	/* vanilla season drops such as 'Increased merriness').                */
	/* ------------------------------------------------------------------ */
	function createUpgrades() {
		const Game2 = Game;
		state.upgrades = [];
		state.fireworkTypes = [];
		state.shimmerModifiers = [];

		let last: any;
		const order = Game2.Upgrades["Santa's dominion"].order + 1 / 1000;
		const upPrice = 999999999999;
		const upPrice2 = 99999999999999;

		const burst = (name: string, desc: string, icon: [number, number, string]) => {
			last = new Game2.Upgrade(name, desc, upPrice, icon);
			state.fireworkTypes.push(last.name);
		};
		burst('Ring burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>O say can you see, by the dawn's early light</q>"), [1, 4, ICONS_URL]);
		burst('Peony burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>What so proudly we hailed at the twilight's last gleaming</q>"), [2, 4, ICONS_URL]);
		burst('Palm burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>Whose broad stripes and bright stars through the perilous fight</q>"), [3, 4, ICONS_URL]);
		burst('Bees burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>O'er the ramparts we watched, were so gallantly streaming?</q>"), [4, 4, ICONS_URL]);
		burst('Crossette burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>And the rockets' red glare, the bombs bursting in air</q>"), [5, 4, ICONS_URL]);
		burst('Waterfall burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>Gave proof through the night that our flag was still there</q>"), [6, 4, ICONS_URL]);
		burst('Pearl burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>O say does that star-spangled banner yet wave</q>"), [7, 4, ICONS_URL]);
		burst('Pistil burst', loc("Cookie production multiplier <b>+1%</b>.<br>Cost scales with how many firework upgrades you own.<q>O'er the land of the free and the home of the brave?</q>"), [8, 4, ICONS_URL]);

		const mod = (name: string, desc: string, icon: [number, number, string]) => {
			last = new Game2.Upgrade(name, desc, upPrice2, icon);
			state.shimmerModifiers.push(last.name);
		};
		mod('Short fuse', loc('Fireworks appear <b>twice as frequently</b>.<br>Cost scales with how many firework upgrades you own.<q>Swish</q>'), [0, 5, ICONS_URL]);
		mod('Slow burn', loc('Fireworks fly <b>half as fast</b>.<br>Cost scales with how many firework upgrades you own.<q>Fwoosh</q>'), [1, 5, ICONS_URL]);
		mod('High explosive', loc('Fireworks give <b>twice as much</b>.<br>Cost scales with how many firework upgrades you own.<q>BOOM!</q>'), [2, 5, ICONS_URL]);

		state.upgrades = state.fireworkTypes.concat(state.shimmerModifiers);
		/* The vanilla Keepsakes heavenly upgrade rolls Game.seasonDrops on
		 * ascension; the original appended its upgrades so they can be kept. */
		Game2.seasonDrops = Game2.seasonDrops.concat(state.upgrades);

		for (let i = 0; i < state.upgrades.length; i++) {
			const me = Game2.Upgrades[state.upgrades[i]];
			me.order = order + i / 1000;
		}

		for (const name of state.fireworkTypes) {
			Game2.Upgrades[name].priceFunc = function (this: any) {
				return Math.pow(2, getHowManyFireworkDrops()) * 999;
			};
		}
		for (const name of state.shimmerModifiers) {
			Game2.Upgrades[name].priceFunc = function (this: any) {
				return Math.pow(3, getHowManyFireworkDrops()) * 999;
			};
		}

		// Other upgrades
		last = new Game2.Upgrade('Grand finale', loc('Rockets spawn much more frequently.<q>Fireworks and flamethrowers: a match made in hell.</q>'), 7, [0, 4, ICONS_URL], function () {
			// Simulate Game.killShimmers
			const me = Game2.shimmerTypes['rocket'];
			if (me.reset) me.reset();
			me.n = 0;
			if (me.spawnsOnTimer) {
				me.time = 0;
				me.spawned = 0;
				me.minTime = me.getMinTime(me);
				me.maxTime = me.getMaxTime(me);
			}
		});
		last.order = Game2.Upgrades['Reindeer season'].order + 0.0001;
		last.pool = 'debug';

		/* Starburst: heavenly upgrade. CCSE.NewHeavenlyUpgrade ===
		 * new Game.Upgrade + push to Game.PrestigeUpgrades + pool 'prestige'
		 * + posX/posY + order=id + parent NAMES converted to upgrade objects. */
		last = new Game2.Upgrade('Starburst', loc('Firework upgrades drop <b>5%</b> more often.<br>Rockets appear <b>5%</b> more often.'), 111111, [0, 4, ICONS_URL]);
		Game2.PrestigeUpgrades.push(last);
		last.pool = 'prestige';
		last.posX = -630;
		last.posY = 111;
		last.order = last.id;
		last.parents = [Game2.Upgrades['Season switcher']];
		Game2.Upgrades['Keepsakes'].parents.push(last);

		const rearrangeUps = (up: any, fraction: number) => {
			const anchor = Game2.Upgrades['Season switcher'];
			const ref = Game2.Upgrades['Starsnow'];
			const dx = ref.posX - anchor.posX;
			const dy = ref.posY - anchor.posY;
			const r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			const theta = Math.atan(dy / dx);

			const theta2 = theta - Math.PI * fraction;
			const dx2 = Math.cos(theta2) * r;
			const dy2 = Math.sin(theta2) * r;

			up.posX = anchor.posX + dx2;
			up.posY = anchor.posY + dy2;
		};

		rearrangeUps(Game2.Upgrades['Starlove'], 1 / 5);
		rearrangeUps(Game2.Upgrades['Starterror'], 2 / 5);
		rearrangeUps(Game2.Upgrades['Startrade'], 3 / 5);
		rearrangeUps(Game2.Upgrades['Starspawn'], 4 / 5);
		rearrangeUps(Game2.Upgrades['Starburst'], 5 / 5);
	}

	/* ------------------------------------------------------------------ */
	/* Content: the rocket shimmer. The engine's spawn loop iterates       */
	/* every Game.shimmerTypes entry with spawnsOnTimer + spawnConditions  */
	/* (systems/shimmer.ts), so registering the type is all that's needed; */
	/* CCSE.ReplaceShimmerType is reproduced by the killShimmers-style     */
	/* reset below.                                                        */
	/* ------------------------------------------------------------------ */
	function createShimmer() {
		const Game2 = Game;
		const shimmerTypeName = 'rocket';

		const shimmer: any = {
			reset: function () {},
			initFunc: function (me: any) {
				if (!this.spawned && Game2.chimeType == 1 && Game2.ascensionMode != 1) PlaySound('snd/rocketLaunch.mp3');

				const b: any = Game2.bounds; // the layout rect (0 before the first pass)
				me.x = Math.floor(Math.random() * Math.max(0, b.right - b.left - 256) + b.left + 128) - 128;
				me.y = b.bottom;
				me.l.style.width = '74px';
				me.l.style.height = '244px';
				me.l.style.backgroundImage = 'url("' + 'img/rocket.png' + '")';
				me.l.style.backgroundSize = '74px 244px';
				me.l.style.opacity = '0';
				me.l.style.display = 'block';

				let dur = 2.5; // Base time in seconds to travel across the screen
				if (Game2.Has('Slow burn')) dur *= 2;
				me.dur = dur;
				me.life = Math.ceil(Game2.fps * me.dur);
				me.sizeMult = 1;
			},
			updateFunc: function (me: any) {
				const curve = 1 - Math.pow((me.life / (Game2.fps * me.dur)) * 2 - 1, 12);
				me.l.style.opacity = String(curve);
				const top: any = (Game2.bounds as any).top;
				me.l.style.transform = 'translate(' + me.x + 'px,' + (me.y + (top - me.y - 244 * 2) * (1 - me.life / (Game2.fps * me.dur))) + 'px) scale(' + (me.sizeMult * (1 + Math.sin(me.id * 0.53) * 0.1)) + ')';
				me.life--;
				if (me.life <= 0) {
					this.missFunc(me);
					me.die();
				}
			},
			popFunc: function (me: any) {
				if (me.spawnLead) {
					state.rocketsPopped++;
				}

				const val = Game2.cookiesPs * 60;
				let moni = Math.max(25, val); //1 minute of cookie production, or 25 cookies - whichever is highest
				if (Game2.Has('High explosive')) moni *= 2;
				Game2.Earn(moni);

				let upgrade = '';
				let failRate = 0.8;
				if (Game2.HasAchiev('Full barrage')) failRate = 0.6;
				failRate *= 1 / Game2.dropRateMult();
				if (Game2.Has('Starburst')) failRate *= 0.95;
				if (Game2.hasGod) {
					const godLvl = Game2.hasGod('seasons');
					if (godLvl == 1) failRate *= 0.9;
					else if (godLvl == 2) failRate *= 0.95;
					else if (godLvl == 3) failRate *= 0.97;
				}
				if (Math.random() > failRate) {
					// fireworks upgrades drops
					upgrade = choose(state.upgrades);
					if (!Game2.HasUnlocked(upgrade) && !Game2.Has(upgrade)) {
						Game2.Unlock(upgrade);
					} else upgrade = '';
				}

				if (Game2.prefs.popups)
					Game2.Popup(choose(['Ooooh!', 'Aaaah!']) + '<br>The rocket gives you ' + Beautify(moni) + ' cookies.' + (upgrade == '' ? '' : '<br>You are also rewarded with ' + upgrade + '!'));
				else Game2.Notify(choose(['Ooooh!', 'Aaaah!']), 'The rocket gives you ' + Beautify(moni) + ' cookies.' + (upgrade == '' ? '' : '<br>You are also rewarded with ' + upgrade + '!'), ICON_NOTIFY, 6);

				const popup = '<div style="font-size:80%;">+' + Beautify(moni) + ' cookies!</div>';

				if (popup != '') Game2.Popup(popup, Game2.mouseX, Game2.mouseY);

				//sparkle and kill the shimmer
				Game2.SparkleAt(Game2.mouseX, Game2.mouseY);
				PlaySound('snd/rocketBoom.mp3');
				me.die();
			},
			missFunc: function (_me: any) {},
			spawnsOnTimer: true,
			spawnConditions: function () {
				if (Game2.season == 'american') return true;
				else return false;
			},
			spawned: 0,
			time: 0,
			minTime: 0,
			maxTime: 0,
			getTimeMod: function (_me: any, m: number) {
				if (Game2.Has('Short fuse')) m /= 2;
				if (Game2.Has('Starburst')) m *= 0.95;
				if (Game2.hasGod) {
					const godLvl = Game2.hasGod('seasons');
					if (godLvl == 1) m *= 0.9;
					else if (godLvl == 2) m *= 0.95;
					else if (godLvl == 3) m *= 0.97;
				}
				if (Game2.Has('Grand finale')) m = 0.01;
				return Math.ceil(Game2.fps * 60 * m);
			},
			getMinTime: function (me: any) {
				const m = 3;
				return this.getTimeMod(me, m);
			},
			getMaxTime: function (me: any) {
				const m = 6;
				return this.getTimeMod(me, m);
			},
		};

		Game2.shimmerTypes[shimmerTypeName] = shimmer;
		//CCSE.ReplaceShimmerType(shimmerTypeName);

		// Simulate Game.killShimmers
		const me = Game2.shimmerTypes[shimmerTypeName];
		if (me.reset) me.reset();
		me.n = 0;
		if (me.spawnsOnTimer) {
			me.time = 0;
			me.spawned = 0;
			me.minTime = me.getMinTime(me);
			me.maxTime = me.getMaxTime(me);
		}

		/* The original preloaded its (remote) sounds into the Sounds table;
		 * here the files are local and PlaySound creates the Audio on first
		 * use, so the preload is a no-op and omitted. */
	}

	/* ------------------------------------------------------------------ */
	/* Content: achievements.                                              */
	/* ------------------------------------------------------------------ */
	function createAchievements() {
		const Game2 = Game;
		let last: any;
		let order = Game2.Achievements['Hide & seek champion'].order + 0.001;

		last = new Game2.Achievement('Pyrotechnics', loc('Explode <b>1 rocket</b>'), [0, 5, ICONS_URL]);
		last.order = order;
		order += 0.001;
		last = new Game2.Achievement('July 4th', loc('Explode <b>74 rockets</b>'), [1, 5, ICONS_URL]);
		last.order = order;
		order += 0.001;
		last = new Game2.Achievement('Pyromaniac', loc('Explode <b>1776 rockets</b>'), [2, 5, ICONS_URL]);
		last.pool = 'shadow';
		last.order = order;
		order += 0.001;

		last = new Game2.Achievement('Full barrage', loc('Unlock <b>every fireworks upgrade.</b><div class="line"></div>Owning this achievement makes fireworks upgrades drop more frequently in future playthroughs.'), [0, 4, ICONS_URL]);
		last.order = order;
		order += 0.001;

		Game2.registerHook('check', function () {
			if (state.rocketsPopped >= 1) Game2.Win('Pyrotechnics');
			if (state.rocketsPopped >= 74) Game2.Win('July 4th');
			if (state.rocketsPopped >= 1776) Game2.Win('Pyromaniac');

			let haveAll = true;
			for (const name of state.upgrades) {
				if (!Game2.Has(name)) haveAll = false;
			}
			if (haveAll) Game2.Win('Full barrage');
		});
	}

	/* ------------------------------------------------------------------ */
	/* The fireworks canvas in the left panel. Verbatim from the original. */
	/* ------------------------------------------------------------------ */
	function createCanvas() {
		const canvas = document.createElement('canvas');
		canvas.id = 'AmericanSeasonFireworksDisplay';
		canvas.style.zIndex = '100';
		canvas.style.position = 'absolute';
		canvas.style.left = '0px';
		canvas.style.top = '0px';
		const section = l('sectionLeft');
		if (section) section.appendChild(canvas);

		const parent: HTMLElement | null = canvas.parentNode as HTMLElement | null;
		canvas.width = parent ? parent.offsetWidth : 0;
		canvas.height = parent ? parent.offsetHeight - 21 : 0;

		state.canvas = canvas;
		state.context = canvas.getContext('2d');

		window.addEventListener('resize', function () {
			if (!state.canvas || !state.canvas.parentNode) return;
			const p: HTMLElement = state.canvas.parentNode as HTMLElement;
			state.canvas.width = p.offsetWidth;
			state.canvas.height = p.offsetHeight - 21;
		});
	}

	function initFireworks() {
		state.fireworks = [];
		state.stars = [];
		state.hue = 120;
		state.ticksSinceFirework = 0;
	}

	class Firework {
		[key: string]: any;
		x = 0;
		y = 0;
		startX = 0;
		startY = 0;
		endX = 0;
		endY = 0;
		globalCompositeOperation: string;
		distanceToEnd = 0;
		distanceTraveled = 0;
		trail: any[] = [];
		angle = 0;
		speed = 0;
		acceleration = 0;
		brightness = 0;
		lineWidth = 0;
		lineCap = 'round';

		constructor(startX: number, startY: number, endX: number, endY: number) {
			this.x = startX;
			this.y = startY;
			this.startX = startX;
			this.startY = startY;
			this.endX = endX;
			this.endY = endY;
			this.globalCompositeOperation = state.config.GLOBAL_COMPOSITE_OPERATION == 'default' ? 'lighter' : state.config.GLOBAL_COMPOSITE_OPERATION;

			this.distanceToEnd = calculateDistance(startX, startY, endX, endY);
			this.distanceTraveled = 0;

			this.trail = [];
			const trailLength = state.config.FIREWORK_TRAIL_LENGTH;
			for (let i = 0; i < trailLength; i++) {
				this.trail.push([this.x, this.y]);
			}

			this.angle = Math.atan2(endY - startY, endX - startX);
			this.speed = state.config.FIREWORK_SPEED;
			this.acceleration = state.config.FIREWORK_ACCELERATION;
			this.brightness = randBetween(state.config.FIREWORK_BRIGHTNESS_MIN, state.config.FIREWORK_BRIGHTNESS_MAX);
			this.lineWidth = state.config.STROKE_WIDTH;
			this.lineCap = 'round';
		}

		update(index: number) {
			this.trail.pop(); // Remove the oldest trail star.
			this.trail.unshift([this.x, this.y]); // Add the current position to the start of trail.

			this.speed *= this.acceleration; // Increase speed based on acceleration rate.

			const xVelocity = Math.cos(this.angle) * this.speed;
			const yVelocity = Math.sin(this.angle) * this.speed;

			this.distanceTraveled = calculateDistance(this.startX, this.startY, this.x + xVelocity, this.y + yVelocity);

			if (this.distanceTraveled >= this.distanceToEnd) {
				state.fireworks.splice(index, 1);
				createParticles(this.endX, this.endY);
			} else {
				this.x += xVelocity;
				this.y += yVelocity;
			}
		}

		draw() {
			if (!state.context) return;
			state.context.beginPath();

			const trailEndX = this.trail[this.trail.length - 1][0];
			const trailEndY = this.trail[this.trail.length - 1][1];

			state.context.globalCompositeOperation = this.globalCompositeOperation as any;
			state.context.lineWidth = this.lineWidth;
			state.context.lineCap = this.lineCap as any;
			state.context.moveTo(trailEndX, trailEndY);
			state.context.lineTo(this.x, this.y);
			state.context.strokeStyle = `hsl(${state.hue}, 100%, ${this.brightness}%)`;
			state.context.stroke(); // Draw stroke.
		}
	}

	class Star {
		[key: string]: any;
		x = 0;
		y = 0;
		type: string;
		age = 0;
		angle = 0;
		hue = 0;
		brightness = 0;
		friction = 0;
		gravity = 0;
		decay = 0;
		speed = 0;
		transparency = 0;
		trailLength = 0;
		lineWidth = 0;
		lineCap = 'round';
		globalCompositeOperation = 'lighter';
		trail: any[] = [];

		constructor(x: number, y: number, itr: number, type: string, override?: Record<string, any>) {
			this.x = x;
			this.y = y;
			this.type = type;
			this.age = 0;
			this.angle = randBetween(0, Math.PI * 2);
			this.hue = randBetween(state.hue - state.config.STAR_HUE_VARIANCE, state.hue + state.config.STAR_HUE_VARIANCE);
			this.brightness = randBetween(state.config.STAR_BRIGHTNESS_MIN, state.config.STAR_BRIGHTNESS_MAX);
			this.friction = state.config.STAR_FRICTION;
			this.gravity = state.config.STAR_GRAVITY;
			this.decay = randBetween(state.config.STAR_DECAY_MIN, state.config.STAR_DECAY_MAX);
			this.speed = randBetween(state.config.STAR_SPEED_MIN, state.config.STAR_SPEED_MAX);
			this.transparency = state.config.STAR_TRANSPARENCY;
			this.trailLength = state.config.STAR_TRAIL_LENGTH;
			this.lineWidth = state.config.STROKE_WIDTH;
			this.lineCap = 'round';
			this.globalCompositeOperation = 'lighter';
			// Chrysanthemum type is default

			if (type == 'ring') {
				this.angle = (Math.PI * 2 * itr) / 100 * 4;
				this.speed = state.config.STAR_SPEED_MAX;
				this.trailLength = Math.ceil(state.config.STAR_TRAIL_LENGTH / 5);
				this.lineWidth = state.config.STROKE_WIDTH * 5;
			} else if (type == 'peony') {
				this.angle = (Math.PI * 2 * itr) / 100 * 2;
				this.speed = state.config.STAR_SPEED_MAX;
				this.transparency = state.config.STAR_TRANSPARENCY / 2;
				this.brightness = state.config.STAR_BRIGHTNESS_MAX;
				this.lineWidth = state.config.STROKE_WIDTH * 2;
			} else if (type == 'palm') {
				this.lineWidth = state.config.STROKE_WIDTH * 10;
				this.speed = randBetween(Math.max(state.config.STAR_SPEED_MIN, state.config.STAR_SPEED_MAX / 2), state.config.STAR_SPEED_MAX);
				this.trailLength *= 1.5;
				this.globalCompositeOperation = 'source-over';
			} else if (type == 'bees') {
				this.lineWidth = state.config.STROKE_WIDTH * 2;
				this.trailLength = Math.ceil(state.config.STAR_TRAIL_LENGTH / 5);
			} else if (type == 'crossette') {
				this.lineWidth *= 2;
				this.speed = randBetween(state.config.STAR_SPEED_MIN + (state.config.STAR_SPEED_MIN + state.config.STAR_SPEED_MAX) / 2, state.config.STAR_SPEED_MAX);
			} else if (type == 'waterfall') {
				this.decay /= 3;
			} else if (type == 'pearl') {
				this.gravity *= -1;
				this.angle = randBetween(Math.PI, Math.PI * 2);
				this.lineWidth = state.config.STROKE_WIDTH * 10;
				this.decay /= 3;
			} else if (type == 'pistil') {
				this.angle = (Math.PI * 2 * itr) / 100 * 2;
				this.trailLength *= 2;
				if (itr % 2 == 0) {
					this.speed = state.config.STAR_SPEED_MAX;
					this.transparency = state.config.STAR_TRANSPARENCY / 2;
					this.brightness = state.config.STAR_BRIGHTNESS_MAX;
					this.lineWidth = state.config.STROKE_WIDTH * 2;
				} else {
					this.speed = state.config.STAR_SPEED_MAX / 2;
					this.trailLength = Math.ceil(state.config.STAR_TRAIL_LENGTH / 5);
					this.lineWidth = state.config.STROKE_WIDTH * 5;
				}
			}

			for (const item in override || {}) {
				this[item] = (override as any)[item];
			}

			if (state.config.GLOBAL_COMPOSITE_OPERATION != 'default') this.globalCompositeOperation = state.config.GLOBAL_COMPOSITE_OPERATION;

			this.trail = [];
			for (let i = 0; i < this.trailLength; i++) {
				this.trail.push([this.x, this.y]);
			}
		}

		update(index: number) {
			this.age++;
			this.trail.pop();
			this.trail.unshift([this.x, this.y]);

			this.speed *= this.friction;

			if (this.type == 'bees' && this.age > Game.fps / 2 && Math.random() < 5 / Game.fps) {
				this.age = 0;
				this.speed = randBetween(state.config.STAR_SPEED_MIN, state.config.STAR_SPEED_MAX);
				this.angle = randBetween(0, Math.PI * 2);
			} else if (this.type == 'crossette' && this.age > Game.fps / 2 && Math.random() < 0.1) {
				this.transparency = this.decay;
				state.stars.push(new Star(this.x, this.y, 0, '', { angle: 0, speed: state.config.STAR_SPEED_MAX / 3 }));
				state.stars.push(new Star(this.x, this.y, 0, '', { angle: Math.PI / 2, speed: state.config.STAR_SPEED_MAX / 3 }));
				state.stars.push(new Star(this.x, this.y, 0, '', { angle: Math.PI, speed: state.config.STAR_SPEED_MAX / 3 }));
				state.stars.push(new Star(this.x, this.y, 0, '', { angle: (Math.PI * 3) / 2, speed: state.config.STAR_SPEED_MAX / 3 }));
			} else if (this.type == 'waterfall' && this.age > Game.fps / 2) {
				this.trail.unshift([this.x, this.y]);
			}

			this.x += Math.cos(this.angle) * this.speed;
			this.y += Math.sin(this.angle) * this.speed + this.gravity;

			this.transparency -= this.decay;
			if (this.transparency <= this.decay) {
				state.stars.splice(index, 1);
			}
		}

		draw() {
			if (!state.context) return;
			state.context.beginPath();

			const trailEndX = this.trail[this.trail.length - 1][0];
			const trailEndY = this.trail[this.trail.length - 1][1];

			state.context.globalCompositeOperation = this.globalCompositeOperation as any;
			state.context.lineWidth = this.lineWidth;
			state.context.lineCap = this.lineCap as any;
			state.context.moveTo(trailEndX, trailEndY);
			state.context.lineTo(this.x, this.y);
			state.context.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.transparency})`;
			state.context.stroke();
		}
	}

	function launchManualFirework() {
		if (state.ticksSinceFirework >= state.config.TICKS_PER_FIREWORK_MIN) {
			if (Game.mouseDown && Game.mouseX < state.canvas!.width) {
				const startX = state.canvas!.width / 2;
				const startY = state.canvas!.height;

				const endX = Game.mouseX;
				const endY = Game.mouseY;

				state.fireworks.push(new Firework(startX, startY, endX, endY));
				state.ticksSinceFirework = 0;
			}
		} else {
			state.ticksSinceFirework++;
		}
	}

	function Draw() {
		for (let i = state.fireworks.length - 1; i >= 0; --i) {
			state.fireworks[i].draw();
			state.fireworks[i].update(i);
		}

		for (let i = state.stars.length - 1; i >= 0; --i) {
			state.stars[i].draw();
			state.stars[i].update(i);
		}

		state.hue += state.config.HUE_STEP_INCREASE;
	}

	function Logic() {
		if (Game.season == 'american' && state.config.SHOW_CANVAS && state.canvas && state.context) {
			state.canvas.style.display = 'block';
			launchManualFirework();
			cleanCanvas();
			Draw();
		} else if (state.canvas && state.context) {
			state.context.clearRect(0, 0, state.canvas.width, state.canvas.height);
			state.canvas.style.display = 'none';
		}
	}

	function createParticles(x: number, y: number) {
		const types = ['chrysanthemum', 'chrysanthemum', 'chrysanthemum']; // Most common
		if (Game.Has('Ring burst')) types.push('ring');
		if (Game.Has('Peony burst')) types.push('peony');
		if (Game.Has('Palm burst')) types.push('palm');
		if (Game.Has('Bees burst')) types.push('bees');
		if (Game.Has('Crossette burst')) types.push('crossette');
		if (Game.Has('Waterfall burst')) types.push('waterfall');
		if (Game.Has('Pearl burst')) types.push('pearl');
		if (Game.Has('Pistil burst')) types.push('pistil');

		const type = choose(types);

		let count = state.config.STAR_COUNT;
		if (type == 'ring') count /= 4;
		if (type == 'peony') count /= 2;
		if (type == 'palm') count /= 10;
		if (type == 'bees') count /= 2;
		if (type == 'crossette') count /= 7;
		if (type == 'waterfall') count /= 2;
		if (type == 'pearl') count /= 20;
		if (type == 'pistil') count /= 2;

		for (let i = 0; i < count; i++) {
			state.stars.push(new Star(x, y, i, type));
		}
	}

	function cleanCanvas() {
		if (!state.context || !state.canvas) return;
		state.context.globalCompositeOperation = 'destination-out';
		state.context.fillStyle = `rgba(0, 0, 0, ${state.config.CANVAS_CLEANUP_ALPHA})`;
		state.context.fillRect(0, 0, state.canvas.width, state.canvas.height);
	}

	/* ------------------------------------------------------------------ */
	/* Hooks.                                                              */
	/* ------------------------------------------------------------------ */
	function getModifiedCPS(currentCpS: number) {
		let mult = 1;
		for (const name of state.fireworkTypes) if (Game.Has(name)) mult *= 1.01;
		return currentCpS * mult;
	}

	function onReset() {
		state.rocketsPopped = 0;
	}

	/* ------------------------------------------------------------------ */
	/* Menu/config. CCSE.MenuHelper.InputBox/ActionButton/ToggleButton and */
	/* CCSE.AppendCollapsibleOptionsMenu reproduced natively: the engine   */
	/* dispatches customOptionsMenu after l('menu').innerHTML is set, so   */
	/* we append a collapsible DOM section there. Inline handlers need     */
	/* the namespace on window (as the original's inline handlers used the */
	/* original's global).                                                 */
	/* ------------------------------------------------------------------ */
	let collapsed = 0;

	function inputBoxListing(prefName: string, prefDisplayName: string, desc?: string) {
		let listing = '<div class="listing">';
		listing +=
			'<input type="text" id="AS_' + prefName + '" class="option" style="width:65px;" value="' + state.config[prefName] + '" onChange="AmericanSeason.UpdatePref(\'' + prefName + '\', this.value)">';
		listing += '<label>' + prefDisplayName + (desc ? ' : ' + desc : '') + '</label>';
		listing += '</div>';
		return listing;
	}

	function getMenuString() {
		let str = '<div class="listing"><a class="smallFancyButton option" ' + Game.clickStr + "=\"AmericanSeason.config = AmericanSeason.defaultConfig(); Game.UpdateMenu();\">Restore Default</a></div>";
		str +=
			'<div class="listing"><a id="SHOW_CANVASButton" class="smallFancyButton prefButton option' +
			(state.config.SHOW_CANVAS ? '' : ' off') +
			'" ' +
			Game.clickStr +
			"=\"AmericanSeason.Toggle('SHOW_CANVAS','SHOW_CANVASButton','Canvas ON','Canvas OFF','0');PlaySound('snd/tick.mp3');\">" +
			(state.config.SHOW_CANVAS ? 'Canvas ON' : 'Canvas OFF') +
			'</a><label>Display fireworks in the left panel. Inhibits clicking wrinklers.</label></div>';

		str += '<div class="subsection"><div class="title">' + loc('Projectiles') + '</div></div>';
		str += inputBoxListing('FIREWORK_ACCELERATION', 'Base firework acceleration', '1.0 causes fireworks to travel at a constant speed');
		str += inputBoxListing('FIREWORK_BRIGHTNESS_MIN', 'Minimum firework brightness');
		str += inputBoxListing('FIREWORK_BRIGHTNESS_MAX', 'Maximum firework brightness');
		str += inputBoxListing('FIREWORK_SPEED', 'Base speed of fireworks');
		str += inputBoxListing('FIREWORK_TRAIL_LENGTH', 'Base length of firework trails');

		str += '<div class="subsection"><div class="title">' + loc('Stars') + '</div></div>';
		str += '<div class="listing"><label>The pretty lights that explode out of a firework are called stars</label></div>';
		str += inputBoxListing('STAR_BRIGHTNESS_MIN', 'Minimum star brightness');
		str += inputBoxListing('STAR_BRIGHTNESS_MAX', 'Maximum star brightness');
		str += inputBoxListing('STAR_COUNT', 'Base star count per firework');
		str += inputBoxListing('STAR_DECAY_MIN', 'Minimum star decay rate');
		str += inputBoxListing('STAR_DECAY_MAX', 'Maximum star decay rate');
		str += inputBoxListing('STAR_FRICTION', 'Base star friction', 'Slows the speed of particles over time');
		str += inputBoxListing('STAR_GRAVITY', 'Base star gravity', 'How quickly particles move toward a downward trajectory');
		str += inputBoxListing('STAR_HUE_VARIANCE', 'Variance in star coloration');
		str += inputBoxListing('STAR_TRANSPARENCY', 'Base star transparency');
		str += inputBoxListing('STAR_SPEED_MIN', 'Minimum star speed');
		str += inputBoxListing('STAR_SPEED_MAX', 'Maximum star speed');
		str += inputBoxListing('STAR_TRAIL_LENGTH', 'Base length of explosion star trails');

		str += '<div class="subsection"><div class="title">' + loc('Other') + '</div></div>';
		str += inputBoxListing('CANVAS_CLEANUP_ALPHA', 'Cleanup rate', 'Lower value increases trail duration');
		str += inputBoxListing('HUE_STEP_INCREASE', 'Hue change per loop', 'Used to rotate through different firework colors');
		str += inputBoxListing('STROKE_WIDTH', 'Line width for canvas strokes');
		str += inputBoxListing('TICKS_PER_FIREWORK_MIN', 'Minimum number of ticks per manual firework launch');
		str += inputBoxListing('GLOBAL_COMPOSITE_OPERATION', 'Override for globalCompositeOperation', 'See <a href="https://www.w3schools.com/tags/canvas_globalcompositeoperation.asp" target="_blank">here</a>.');

		return str;
	}

	function updatePref(prefName: string, value: string) {
		const val = parseFloat(value);
		if (!isNaN(val)) state.config[prefName] = val;
		if (prefName == 'GLOBAL_COMPOSITE_OPERATION') state.config[prefName] = value;
		Game.UpdateMenu();
	}

	function toggle(prefName: string, button: string, on: string, off: string, invert: string) {
		if (state.config[prefName]) {
			l(button).innerHTML = off;
			state.config[prefName] = 0;
		} else {
			l(button).innerHTML = on;
			state.config[prefName] = 1;
		}
		l(button).className = 'smallFancyButton prefButton option' + ((state.config[prefName] ^ (invert == '1' ? 1 : 0)) ? '' : ' off');
	}

	function appendCollapsibleOptionsMenu(title: string, body: string) {
		//CCSE.AppendCollapsibleOptionsMenu, reproduced.
		const menu = l('menu');
		if (!menu) return;

		const titleDiv = document.createElement('div');
		titleDiv.className = 'title';
		titleDiv.appendChild(document.createTextNode(title + ' '));

		const span = document.createElement('span');
		span.style.cursor = 'pointer';
		span.style.display = 'inline-block';
		span.style.height = '14px';
		span.style.width = '14px';
		span.style.borderRadius = '7px';
		span.style.textAlign = 'center';
		span.style.backgroundColor = '#C0C0C0';
		span.style.color = 'black';
		span.style.fontSize = '13px';
		span.style.verticalAlign = 'middle';
		span.textContent = collapsed ? '+' : '-';
		span.addEventListener('click', function () {
			collapsed = collapsed ? 0 : 1;
			Game.UpdateMenu();
		});
		titleDiv.appendChild(span);

		const bodyDiv = document.createElement('div');
		bodyDiv.innerHTML = body;

		const wrap = document.createElement('div');
		wrap.style.padding = '0px';
		wrap.style.margin = '8px 4px';
		wrap.appendChild(titleDiv);
		if (!collapsed) wrap.appendChild(bodyDiv);

		menu.appendChild(wrap);
	}

	function appendStatsVersionNumber(name: string, version: string) {
		//CCSE.AppendStatsVersionNumber, reproduced.
		const general = l('statsGeneral');
		if (!general || !general.parentNode) return;
		const div = document.createElement('div');
		div.className = 'listing';
		div.innerHTML = '<b>' + name + ':</b> ' + version;
		general.parentNode.appendChild(div);
	}

	function appendStatsSpecial(html: string) {
		//CCSE.AppendStatsSpecial, reproduced.
		const special = l('statsSpecial');
		if (!special) return;
		const div = document.createElement('div');
		div.innerHTML = html;
		special.appendChild(div);
	}

	/* ------------------------------------------------------------------ */
	/* Mod save/load. The original saved {config, rocketsPopped} as JSON   */
	/* inside the CCSE config; our port carries the same JSON through the  */
	/* vanilla mod save section (Game.safeSaveString escapes | and ;).     */
	/* ------------------------------------------------------------------ */
	function save() {
		return JSON.stringify({
			config: state.config,
			rocketsPopped: state.rocketsPopped,
		});
	}

	function load(str: string) {
		if (!str) return;
		let obj: any;
		try {
			obj = JSON.parse(str);
		} catch (e) {
			return;
		}
		if (obj.config) {
			for (const pref in obj.config) {
				state.config[pref] = obj.config[pref];
			}
		}
		if (obj.rocketsPopped !== undefined) state.rocketsPopped = obj.rocketsPopped;
	}

	/* ------------------------------------------------------------------ */
	/* Registration.                                                       */
	/* ------------------------------------------------------------------ */
	function init() {
		const Game2 = Game;

		createSeason();
		createUpgrades();
		createAchievements();
		createShimmer();
		createCanvas();
		initFireworks();

		Game2.registerHook('logic', Logic);
		Game2.registerHook('reset', onReset);
		Game2.registerHook('cps', getModifiedCPS);

		Game2.customStatsMenu.push(function () {
			appendStatsVersionNumber(NAME, VERSION);
			if (state.rocketsPopped) appendStatsSpecial('<div class="listing"><b>' + loc('Rockets exploded :') + '</b> ' + state.rocketsPopped + '</div>');
		});
		Game2.customOptionsMenu.push(function () {
			appendCollapsibleOptionsMenu(NAME, getMenuString());
		});

		// Announce completion (as in the original)
		if (Game2.prefs.popups) Game2.Popup(NAME + ' loaded!');
		else Game2.Notify(NAME + ' loaded!', '', '', 1, 1);

		state.isLoaded = 1;

		// Expose the namespace (as the original's global) so the inline menu
		// handlers — and other mods — can use it.
		window.AmericanSeason = {
			name: NAME,
			version: VERSION,
			/* getter + setter: the menu's "Restore Default" button does
			 * `AmericanSeason.config = AmericanSeason.defaultConfig()` (as in
			 * the original), which must replace the state object itself. */
			get config() {
				return state.config;
			},
			set config(value: Record<string, any>) {
				state.config = value;
			},
			get rocketsPopped() {
				return state.rocketsPopped;
			},
			get upgrades() {
				return state.upgrades;
			},
			get canvas() {
				return state.canvas;
			},
			defaultConfig,
			UpdatePref: updatePref,
			Toggle: toggle,
		};
	}

	function register() {
		const G = window.Game;
		if (!G || typeof G.registerMod !== 'function') return false;
		G.registerMod(NAME, {
			name: NAME,
			version: VERSION,
			init: init,
			save: save,
			load: load,
		});
		return true;
	}

	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () {
			window.clearInterval(t);
		}, {once: true});
	}
})();
