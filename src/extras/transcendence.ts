/* Transcendence — a second prestige layer for Cookie Clicker 3.
 *
 * Eternal Essence (EE) is earned by performing a Transcendence, which
 * resets everything from layer 1 (heavenly upgrades, prestige, buildings,
 * sugar lumps) in exchange for a log-based currency. A respec-able Doctrine
 * tree of 12 transformative nodes is bought with EE and changes how the game
 * is played. Milestones at lifetime-EE thresholds gate what survives the next
 * Transcendence.
 *
 * Design doc:   docs/second-prestige-layer.md
 * Asset audit:  docs/asset-audit.md
 *
 * Follows the CC3 extras pattern (dailyCrumb.ts, crackingCookie.ts):
 *   - IIFE with Game.registerMod(MOD_ID, {init, save, load}, true)
 *   - State persisted in the mod-save-data section (no vanilla format changes)
 *   - window.__cc3Transcendence test/inspection surface for QA
 */

(function () {
	if (window.__cc3Transcendence) return;

	/* ================================================================
	 * CONSTANTS
	 * ================================================================ */

	const MOD_ID = 'CC3Transcendence';

	/** Unlock gate: the full ascend meter (1e29 cookiesReset) or 10k prestige. */
	const GATE_COOKIES = 1e29;
	const GATE_PRESTIGE = 10000;

	/** EE formula: floor(log₁₀(cookiesTotal / 1e¹²) − offset). */
	const EE_LOG_BASE = 10;
	const EE_OFFSET = 8;

	/* The 12 Doctrine nodes. parents[] references node ids to build the DAG.
	 * Icon slots are *existing* art from the icons.webp sprite sheet —
	 * see the asset audit for rationale. */
	const DOCTRINE = [
		// ── Glutton's Path (click-focused) ──
		{
			id: 1, name: 'Persistent Hand', branch: 'glutton',
			desc: 'Clicking the cookie gains +0.5% of your CpS per 100 Cursors owned.',
			icon: [0, 13], cost: 1, parents: [],
		},
		{
			id: 2, name: 'Echoing Click', branch: 'glutton',
			desc: 'Each click triggers 0.5 seconds of passive CpS.',
			icon: [0, 0], cost: 3, parents: [1],
		},
		{
			id: 3, name: 'Cascade', branch: 'glutton',
			desc: 'Golden cookie clicks have a 10% chance to spawn another golden cookie.',
			icon: [22, 6], cost: 8, parents: [2],
		},

		// ── Idler's Path (production-focused) ──
		{
			id: 4, name: 'Lazy Oven', branch: 'idler',
			desc: '+5% offline CpS per Idler node owned (including this one).',
			icon: [17, 0], cost: 1, parents: [],
		},
		{
			id: 5, name: 'Warm Embers', branch: 'idler',
			desc: 'The shimmering veil starts on by default and costs 50% less to reactivate.',
			icon: [21, 14], cost: 3, parents: [4],
		},
		{
			id: 6, name: 'Ambient Baking', branch: 'idler',
			desc: 'Wrinklers spawn 20% faster and hold 10% more cookies.',
			icon: [15, 12], cost: 8, parents: [5],
		},

		// ── Fatebinder's Path (golden-cookie / wrath-focused) ──
		{
			id: 7, name: "Fortune's Favor", branch: 'fatebinder',
			desc: 'Golden cookies appear 10% more often and last 10% longer.',
			icon: [23, 6], cost: 1, parents: [],
		},
		{
			id: 8, name: "Elder's Whisper", branch: 'fatebinder',
			desc: 'Wrath cookies can still spawn in Ascetic runs.',
			icon: [29, 8], cost: 3, parents: [7],
		},
		{
			id: 9, name: 'Strange Attractor', branch: 'fatebinder',
			desc: 'Natural golden cookies have a 5% chance to be a cluster (spawns n more).',
			icon: [27, 6], cost: 8, parents: [8],
		},
		{
			id: 10, name: 'Double Dip', branch: 'fatebinder',
			desc: 'Golden cookie effects have a 15% chance to double on expiry (trigger again).',
			icon: [24, 7], cost: 15, parents: [9],
		},

		// ── Rebuilder's Path (economy-shaping) ──
		{
			id: 11, name: 'Frugal Start', branch: 'rebuilder',
			desc: 'Buildings are 2% cheaper per Transcendence performed (max -20%).',
			icon: [21, 7], cost: 1, parents: [],
		},
		{
			id: 12, name: 'Measured Growth', branch: 'rebuilder',
			desc: 'Upgrades are 2% cheaper per Transcendence performed (max -20%).',
			icon: [18, 7], cost: 3, parents: [11],
		},
		{
			id: 13, name: 'Legacy Echo', branch: 'rebuilder',
			desc: 'Start each run with 1 free building of the type you owned the most of last run.',
			icon: [17, 7], cost: 8, parents: [12],
		},
	];

	/** Milestone thresholds (lifetime EE → unlock). */
	const MILESTONES = [
		{ threshold: 1, name: 'First Light',
			desc: 'Keep 1 cosmetic heavenly upgrade (milk/bg/sound selector) across Transcendence.' },
		{ threshold: 10, name: 'Inner Fire',
			desc: 'Start each run with 3 free Cursors.' },
		{ threshold: 25, name: 'Steady Hand',
			desc: 'Keep 1 heavenly upgrade of your choice across Transcendence.' },
		{ threshold: 50, name: "Elder's Grace",
			desc: 'Start each run with 5 free Grandmas.' },
		{ threshold: 100, name: 'Relentless',
			desc: 'Keep building levels across Transcendence.' },
		{ threshold: 250, name: 'Unbroken',
			desc: 'Keep sugar lumps across Transcendence.' },
		{ threshold: 500, name: 'Timeless',
			desc: 'Keep 2 heavenly upgrades of your choice across Transcendence.' },
		{ threshold: 1000, name: 'Omega',
			desc: 'Keep all permanent-upgrade slots. Doctrine effects work in Born-again runs.' },
	];

	/** Achievement data. */
	const ACHIEVEMENTS = [
		{ name: 'First Glimpse', desc: 'Perform your first Transcendence.', icon: [1, 26] },
		{ name: 'The Long View', desc: 'Perform 10 Transcendences.', icon: [2, 26] },
		{ name: 'Steady as She Goes', desc: 'Earn the Steady Hand milestone.', icon: [3, 26] },
		{ name: 'Eternal', desc: 'Perform 100 Transcendences.', icon: [4, 26] },
		{ name: 'Omega', desc: 'Earn the Omega milestone.', icon: [5, 26] },
	];

	/* ================================================================
	 * STATE
	 * ================================================================ */

	const state = {
		ee: 0,                      // spendable Eternal Essence
		eeSpent: 0,                // lifetime EE spent on Doctrine nodes
		eeEarned: 0,               // lifetime EE earned (determines milestones)
		transcendences: 0,         // number of Transcendences performed
		totalPrestigeAllTime: 0,   // running total of prestige ever earned (updated on ascension)
		milestones: [] as number[], // threshold values that have been reached
		doctrine: [] as number[],   // ids of bought Doctrine nodes
	};

	/* Internal tracking for prestige deltas. */
	let _prestigeSeen = 0;

	/* ================================================================
	 * EE FORMULA
	 * ================================================================ */

	function computeEE(cookiesTotal: number): number {
		if (cookiesTotal <= 0) return 0;
		// Relative epsilon fixes log() floating-point drift (e.g. log10(1e18)
		// computes to 17.999999999999996 and would floor to 9 instead of 10).
		const raw = Math.log(cookiesTotal / 1e12) / Math.log(EE_LOG_BASE) - EE_OFFSET;
		return Math.max(0, Math.floor(raw + 1e-9 * Math.max(1, Math.abs(raw))));
	}

	/* ================================================================
	 * GATE CHECK
	 * ================================================================ */

	function canTranscend(): boolean {
		const G = window.Game;
		if (!G) return false;
		return G.cookiesReset >= GATE_COOKIES || state.totalPrestigeAllTime >= GATE_PRESTIGE;
	}

	/* ================================================================
	 * DOCTRINE HELPERS
	 * ================================================================ */

	function doctrineHas(id: number): boolean {
		return state.doctrine.indexOf(id) !== -1;
	}

	/* ================================================================
	 * MILESTONE HELPERS
	 * ================================================================ */

	function hasMilestone(threshold: number): boolean {
		return state.milestones.indexOf(threshold) !== -1;
	}

	function checkMilestones(): void {
		let changed = false;
		for (const m of MILESTONES) {
			if (state.eeEarned >= m.threshold && !hasMilestone(m.threshold)) {
				state.milestones.push(m.threshold);
				changed = true;
			}
		}
		if (changed) {
			state.milestones.sort((a, b) => a - b);
		}
	}

	/* ================================================================
	 * TRANSCENDENCE FLOW
	 * ================================================================ */

	/** Track the most-owned building type before a reset (for Legacy Echo). */
	let _lastMostOwnedBuilding = 0;

	/* The crumbling-cookie ascend intro is driven by Game.AscendTimer in
	 * drawBackground.ts (the `else` of `if (Game.AscendTimer==0)` at line 173)
	 * and animated by Game.UpdateAscendIntro. Rather than duplicating the
	 * effect, Transcendence reuses it wholesale: it temporarily swaps
	 * Game.UpdateAscendIntro so the intro plays identically, but the
	 * completion runs the transcendence (EE + reset) instead of the vanilla
	 * ascension (heavenly chips + ascend screen). */
	let _origUpdateAscendIntro: (() => void) | null = null;
	let _transcendIntroRunning = false;

	/** Entry point. With bypass (QA probes, fast path) skip the animation. */
	function doTranscend(bypass?: boolean): void {
		const G = window.Game;
		if (!G || !canTranscend()) return;
		if (!bypass) {
			startTranscendIntro();
			return;
		}
		doTranscendCore();
	}

	/** Play the crumbling-cookie intro (same setup as Ascend(1)), then run
	 *  the actual transcendence at the end of the animation. */
	function startTranscendIntro(): void {
		const G = window.Game;
		if (!G || _transcendIntroRunning) return;

		// Take over the ascend intro updater for the duration of the intro.
		_origUpdateAscendIntro = G.UpdateAscendIntro;
		G.UpdateAscendIntro = transcendIntro;
		_transcendIntroRunning = true;

		// Replicate Ascend(1)'s visual setup so the cookie crumbles the same
		// way: zoom in from 0.2, add the ascendIntro class, kill shimmers.
		G.OnAscend = 0; G.removeClass('ascending');
		G.addClass('ascendIntro');
		G.AscendTimer = 1;
		G.killShimmers();
		const toggleBox = document.getElementById('toggleBox');
		if (toggleBox) { toggleBox.style.display = 'none'; toggleBox.innerHTML = ''; }
		G.choiceSelectorOn = -1;
		G.ToggleSpecialMenu(0);
		G.AscendOffX = 0; G.AscendOffY = 0; G.AscendOffXT = 0; G.AscendOffYT = 0;
		G.AscendZoomT = 1; G.AscendZoom = 0.2;
		G.jukebox.reset();
		PlayCue('preascend');
	}

	/** Stands in for Game.UpdateAscendIntro while the intro runs: same sounds
	 *  and timer, but the completion transcends instead of ascending. */
	function transcendIntro(): void {
		const G = window.Game;
		if (!G) return;
		if (G.AscendTimer === 1) PlaySound('snd/charging.mp3');
		if (G.AscendTimer === Math.floor(G.AscendBreakpoint)) PlaySound('snd/thud.mp3');
		G.AscendTimer++;
		if (G.AscendTimer > G.AscendDuration) {
			// End of the animation — hand the updater back and transcend.
			G.AscendTimer = 0;
			G.removeClass('ascendIntro');
			if (_origUpdateAscendIntro) G.UpdateAscendIntro = _origUpdateAscendIntro;
			_origUpdateAscendIntro = null;
			_transcendIntroRunning = false;

			// Fanfare, mirroring UpdateAscendIntro's completion cues.
			PlayCue('ascend');
			PlayMusicSound('snd/cymbalRev.mp3');
			if (typeof App === 'undefined' || G.volumeMusic === 0) PlaySound('snd/choir.mp3');

			doTranscendCore();
		}
	}

	/** The actual reset + EE grant. Runs at the end of the intro (or
	 *  immediately when the intro is bypassed). */
	function doTranscendCore(): void {
		const G = window.Game;
		if (!G || !canTranscend()) return;

		// 1. Compute EE earned from this Transcendence
		const eeGain = computeEE(G.cookiesReset + G.cookiesEarned);
		if (eeGain <= 0) {
			G.Notify('Transcendence', 'Not enough cookies to gain Eternal Essence.', [19, 7], 4);
			return;
		}

		// 2. Record the most-owned building before reset (for Legacy Echo)
		let bestId = 0, bestAmt = 0;
		for (const idStr in G.ObjectsById) {
			const o = G.ObjectsById[idStr];
			if (o.amount > bestAmt) { bestAmt = o.amount; bestId = o.id; }
		}
		_lastMostOwnedBuilding = bestId;

		// 3. Hard reset — clears buildings, non-prestige upgrades, buffs, seasons, etc.
		// (Reset(1) also clears prestige upgrades because hard=1 bypasses the
		//  pool='prestige' gate at reset.ts line 116.)
		G.Reset(1);

		// 4. Reset prestige state
		G.prestige = 0;
		G.heavenlyChips = 0;
		G.heavenlyChipsSpent = 0;
		G.heavenlyCookies = 0;

		// 5. Conditionally clear building levels and sugar lumps
		if (!hasMilestone(100)) {
			for (const idStr in G.ObjectsById) {
				G.ObjectsById[idStr].level = 0;
			}
		}
		if (!hasMilestone(250)) {
			G.lumps = -1;
			G.lumpsTotal = -1;
			G.lumpT = Date.now();
			G.lumpRefill = 0;
		}

		// 6. Update state
		state.ee += eeGain;
		state.eeEarned += eeGain;
		state.transcendences++;
		_prestigeSeen = 0; // prestige was reset
		checkMilestones();

		// 7. Apply milestone bonuses
		if (hasMilestone(10)) {
			G.Objects['Cursor'].getFree(3);
		}
		if (hasMilestone(50)) {
			G.Objects['Grandma'].getFree(5);
		}

		// 8. Apply Legacy Echo (free building of most-owned type from last run)
		if (doctrineHas(13) && _lastMostOwnedBuilding > 0) {
			const o = G.ObjectsById[_lastMostOwnedBuilding];
			if (o) o.getFree(1);
		}

		// 9. Check achievements
		checkAchievements();

		// 10. Notify
		G.Notify(
			'Transcendence complete!',
			'+' + eeGain + ' Eternal Essence (lifetime: ' + state.eeEarned + ').<br>Transcendences: ' + state.transcendences,
			[19, 7],
			6
		);
		G.recalculateGains = 1;
		G.storeToRefresh = 1;
	}

	/* ================================================================
	 * DOCTRINE PURCHASE
	 * ================================================================ */

	function purchaseDoctrineNode(nodeId: number): boolean {
		const G = window.Game;
		if (!G) return false;
		const node = DOCTRINE.find((n) => n.id === nodeId);
		if (!node) return false;
		if (doctrineHas(nodeId)) return false;
		if (state.ee < node.cost) return false;

		// Check parent gating
		for (const pid of node.parents) {
			if (!doctrineHas(pid)) return false;
		}

		state.ee -= node.cost;
		state.eeSpent += node.cost;
		state.doctrine.push(nodeId);

		// Apply immediate effects & sound
		PlaySound('snd/shimmerClick.mp3');
		G.recalculateGains = 1;
		return true;
	}

	/* ================================================================
	 * RESPEC
	 * ================================================================ */

	function respecDoctrine(): void {
		if (state.doctrine.length === 0) return;
		const refund = state.doctrine.reduce((sum, id) => {
			const n = DOCTRINE.find((d) => d.id === id);
			return sum + (n ? n.cost : 0);
		}, 0);
		state.ee += refund;
		state.eeSpent -= refund;
		state.doctrine = [];
		const G = window.Game;
		if (G) {
			PlaySound('snd/tick.mp3');
			G.recalculateGains = 1;
		}
	}

	/* ================================================================
	 * GAME HOOKS
	 * ================================================================ */

	/** CpS hook: apply Doctrine production bonuses. */
	function cpsHook(cps: number): number {
		const G = window.Game;
		if (!G) return cps;
		// Born-again disables Doctrine unless the Omega milestone is earned
		if (G.ascensionMode === 1 && !hasMilestone(1000)) return cps;

		let mult = 1;

		// Lazy Oven: +5% offline CpS per Idler node owned
		let idlerCount = 0;
		for (const id of state.doctrine) {
			const n = DOCTRINE.find((d) => d.id === id);
			if (n && n.branch === 'idler') idlerCount++;
		}
		if (idlerCount > 0) {
			mult *= (1 + 0.05 * idlerCount);
		}

		return cps * mult;
	}

	/** Click hook: every click on the big cookie. */
	function clickHook(): void {
		const G = window.Game;
		if (!G) return;
		// Echoing Click: each click triggers 0.5 seconds of passive CpS
		if (doctrineHas(2)) {
			// Skip Born-again unless Omega
			if (G.ascensionMode === 1 && !hasMilestone(1000)) return;
			const bonus = G.cookiesPs * 0.5 / G.fps;
			if (bonus > 0) {
				G.cookies += bonus;
				G.cookiesEarned += bonus;
			}
		}
	}

	/** Reset hook: record prestige delta and most-owned building before reset. */
	function resetHook(_hard: boolean): void {
		const G = window.Game;
		if (!G) return;
		// Track running total of prestige ever earned
		if (G.prestige > _prestigeSeen) {
			state.totalPrestigeAllTime += (G.prestige - _prestigeSeen);
			_prestigeSeen = G.prestige;
		}
		// Record most-owned building for Legacy Echo
		if (doctrineHas(13)) {
			let bestId = 0, bestAmt = 0;
			for (const idStr in G.ObjectsById) {
				const o = G.ObjectsById[idStr];
				if (o.amount > bestAmt) { bestAmt = o.amount; bestId = o.id; }
			}
			_lastMostOwnedBuilding = bestId;
		}
	}

	/** Reincarnate hook: apply bonuses after ascension. */
	function reincarnateHook(): void {
		const G = window.Game;
		if (!G) return;

		// Legacy Echo: grant 1 free building of the most-owned type from the previous run
		if (doctrineHas(13) && _lastMostOwnedBuilding > 0) {
			const o = G.ObjectsById[_lastMostOwnedBuilding];
			if (o) o.getFree(1);
		}

		// Milestone: free cursors / grandmas
		if (hasMilestone(10)) {
			G.Objects['Cursor'].getFree(3);
		}
		if (hasMilestone(50)) {
			G.Objects['Grandma'].getFree(5);
		}

		// Warm Embers: shimmering veil starts on by default
		if (doctrineHas(5)) {
			// The shimmering veil is the "Wrinkler pact" toggle. If it's available,
			// start it. The game stores this as Game.pledges (0 = not pledged).
			// Vanilla start: pledges=0. We override with a min pledge.
			// Actually, this is complex — the veil is the Elder Pledge.
			// For the draft, this effect is noted as a TODO.
		}
	}

	/** Check hook: periodic checks. */
	function checkHook(): void {
		const G = window.Game;
		if (!G) return;

		// Safety: if the intro was interrupted (AscendTimer zeroed by an
		// external path — Esc, reincarnate, load), hand the updater back.
		if (_transcendIntroRunning && G.AscendTimer === 0) {
			if (_origUpdateAscendIntro) G.UpdateAscendIntro = _origUpdateAscendIntro;
			_origUpdateAscendIntro = null;
			_transcendIntroRunning = false;
		}

		// Track prestige running total
		trackPrestige();

		// Update the Transcend button on the ascend screen
		if (G.OnAscend) {
			updateTranscendButton();
		}

		// Check for the unlock condition (only once per visit)
		checkUnlock();

		// Check achievements
		checkAchievements();
	}

	/** Create hook: declare achievements (runs once per page load). */
	function createHook(): void {
		declareAchievements();
	}

	/* ================================================================
	 * PRESTIGE TRACKING
	 * ================================================================ */

	function trackPrestige(): void {
		const G = window.Game;
		if (!G) return;
		if (G.prestige > _prestigeSeen) {
			state.totalPrestigeAllTime += (G.prestige - _prestigeSeen);
			_prestigeSeen = G.prestige;
		}
	}

	/* ================================================================
	 * COST DISCOUNT (Game.eff patching)
	 * ================================================================
	 * Frugal Start (node 11) and Measured Growth (node 12) reduce building
	 * and upgrade costs. The engine computes these via Game.eff('buildingCost')
	 * and Game.eff('upgradeCost'). We patch Game.eff to apply the discounts. */

	let _origEff: ((name: string, def?: number) => number) | null = null;

	function patchEff(): void {
		const G = window.Game;
		if (!G || _origEff) return;
		_origEff = G.eff.bind(G);
		G.eff = function (name: string, def?: number) {
			let v = _origEff!(name, def);
			if (name === 'buildingCost' && doctrineHas(11)) {
				v *= Math.max(0.8, 1 - 0.02 * state.transcendences);
			}
			if (name === 'upgradeCost' && doctrineHas(12)) {
				v *= Math.max(0.8, 1 - 0.02 * state.transcendences);
			}
			return v;
		};
	}

	/* ================================================================
	 * UI: TRANSCEND BUTTON (on the ascend screen)
	 * ================================================================ */

	function updateTranscendButton(): void {
		const G = window.Game;
		if (!G || !G.OnAscend) return;
		const btn = document.getElementById('transcendButton');
		if (!btn) return;
		const eeGain = computeEE(G.cookiesReset + G.cookiesEarned);
		const canDo = canTranscend() && eeGain > 0;
		btn.style.display = canDo ? 'block' : 'none';
		if (canDo) {
			btn.innerHTML = '<span class="fancyText" style="font-size:16px;">Transcend</span><br>' +
				'<small>+' + eeGain + ' EE</small>';
		}
	}

	function addTranscendButton(): void {
		const G = window.Game;
		if (!G) return;
		const container = document.getElementById('ascendBox');
		if (!container) return;
		if (document.getElementById('transcendButton')) return;

		const btn = document.createElement('a');
		btn.id = 'transcendButton';
		btn.className = 'option framed large';
		btn.style.cssText = 'display:none;font-size:20px;margin-top:4px;';
		btn.onclick = function () {
			PlaySound('snd/tick.mp3');
			const eeGain = computeEE(G.cookiesReset + G.cookiesEarned);
			if (eeGain <= 0) return;
			const msg = 'Are you ready to Transcend?<div class="line"></div>' +
				'You will lose everything — prestige, heavenly upgrades, building levels, sugar lumps.<div class="line"></div>' +
				'You will gain <b>+' + eeGain + ' Eternal Essence</b> (lifetime: ' + (state.eeEarned + eeGain) + ').<br>' +
				'Transcendences: ' + (state.transcendences + 1);
			G.Prompt(
				'<h3>Transcend</h3><div class="block">' + msg + '</div>',
				[
					['Yes', 'Game.ClosePrompt();window.__cc3Transcendence.doTranscend();'],
					['No', 0],
				]
			);
		};
		container.appendChild(btn);
	}

	/* ================================================================
	 * UI: DOCTRINE TREE TOGGLE
	 * ================================================================ */

	function addDoctrineToggle(): void {
		const G = window.Game;
		if (!G) return;
		const container = document.getElementById('ascendBox');
		if (!container) return;
		if (document.getElementById('doctrineToggle')) return;

		const toggle = document.createElement('a');
		toggle.id = 'doctrineToggle';
		toggle.className = 'option framed small';
		toggle.style.cssText = 'font-size:11px;margin-top:4px;cursor:pointer;';
		toggle.textContent = 'Doctrine';
		toggle.onclick = function () {
			PlaySound('snd/tick.mp3');
			showDoctrineTree();
		};
		container.appendChild(toggle);
	}

	/** Show the Doctrine tree as a 3D solar system overlay. Planets orbit
	 *  around the central EE sun; inner orbits hold cheaper nodes, outer
	 *  orbits hold expensive ones. The layout has infinite room for future
	 *  nodes. */
	function showDoctrineTree(): void {
		const G = window.Game;
		if (!G) return;
		if (document.getElementById('doctrineOverlay')) return;

		_injectSolarCSS();

		const overlay = document.createElement('div');
		overlay.id = 'doctrineOverlay';
		overlay.onclick = function (e: MouseEvent) { if (e.target === overlay) closeDoctrineTree(); };

		const system = document.createElement('div');
		system.id = 'doctrineSystem';
		system.setAttribute('aria-label', 'Doctrine solar system');

		// Planet nodes are rendered here; the sun is rendered separately.
		_renderSun(system);
		_renderSolarSystem(system);

		overlay.appendChild(system);
		document.body.appendChild(overlay);
	}

	/** Close the Doctrine solar system overlay. */
	function closeDoctrineTree(): void {
		const overlay = document.getElementById('doctrineOverlay');
		if (overlay) overlay.remove();
	}

	/* Orbit radii for the solar system (innermost to outermost). */
	const ORBIT_RADII = [100, 175, 260, 350];
	const ORBIT_BY_COST: Record<number, number> = { 1: 0, 3: 1, 8: 2, 15: 3 };

	/** Inject the solar system CSS once. */
	function _injectSolarCSS(): void {
		if (document.getElementById('doctrineSolarCSS')) return;
		const s = document.createElement('style');
		s.id = 'doctrineSolarCSS';
		s.textContent = `
#doctrineOverlay {
  position: fixed; top:0; left:0; width:100vw; height:100vh;
  background:rgba(0,0,0,0.85); z-index:9999;
  display:flex; align-items:center; justify-content:center;
  perspective:900px; cursor:pointer;
}
#doctrineSystem {
  transform-style:preserve-3d; transform:rotateX(14deg);
  cursor:default; position:relative;
  width:800px; height:800px; flex-shrink:0;
  filter:drop-shadow(0 0 60px rgba(100,140,255,0.08));
}
.doctrine-sun {
  position:absolute; top:50%; left:50%;
  width:80px; height:80px; margin:-40px; border-radius:50%;
  background:radial-gradient(circle at 30% 30%, #ffd700, #b8860b);
  box-shadow:0 0 40px rgba(255,215,0,0.6),0 0 80px rgba(255,215,0,0.2);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  z-index:10; transform:translateZ(40px);
  color:#000; font-weight:bold; font-size:13px; cursor:default;
  line-height:1.2;
}
.doctrine-sun .sun-ee { font-size:20px; }
.doctrine-sun .sun-label { font-size:10px; opacity:0.8; }
.doctrine-close {
  position:absolute; top:10px; right:10px; z-index:20;
  width:36px; height:36px; border-radius:50%;
  background:rgba(255,255,255,0.1);
  color:#fff; font-size:18px; line-height:36px;
  text-align:center; cursor:pointer;
  transition:background 0.15s;
}
.doctrine-close:hover { background:rgba(255,255,255,0.25); }
.doctrine-respec {
  position:absolute; bottom:20px; left:50%; transform:translateX(-50%);
  font-size:11px; color:#888; cursor:pointer; z-index:20;
  padding:4px 12px; border-radius:4px;
  border:1px solid rgba(255,255,255,0.15);
  transition:color 0.15s, border-color 0.15s;
}
.doctrine-respec:hover { color:#f84; border-color:rgba(255,136,68,0.4); }
.doctrine-planet {
  position:absolute; width:96px; height:96px; margin:-48px;
  border-radius:50%;
  background:radial-gradient(circle at 30% 30%, #2a2a3a, #1a1a2a);
  border:2px solid rgba(255,255,255,0.12);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  transition:transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor:default; pointer-events:auto;
  box-shadow:0 0 10px rgba(0,0,0,0.5);
  transform:translateZ(var(--z,0px));
}
.doctrine-planet.buyable:hover {
  transform:translateZ(var(--z,0px)) scale(1.22);
  box-shadow:0 0 28px rgba(100,170,255,0.6);
}
.doctrine-planet .planet-icon {
  width:24px; height:24px; image-rendering:pixelated;
  background-size:auto;
}
.doctrine-planet .planet-name {
  font-size:9px; color:#bbb; text-align:center;
  line-height:1.1; margin-top:2px; max-width:80px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.doctrine-planet .planet-cost {
  font-size:10px; font-weight:bold; margin-top:1px;
}
.doctrine-planet.locked {
  opacity:0.35; filter:grayscale(0.8);
  cursor:default;
}
.doctrine-planet.buyable {
  border-color:#6af;
  cursor:pointer;
  box-shadow:0 0 14px rgba(100,170,255,0.3);
}
.doctrine-planet.owned {
  border-color:#4a4;
  box-shadow:0 0 14px rgba(68,170,68,0.3);
}
.doctrine-planet.owned .planet-cost { color:#4a4; }
`;
		document.head.appendChild(s);
	}

	/** Render the central sun (EE display). */
	function _renderSun(container: HTMLElement): void {
		let el = container.querySelector('.doctrine-sun') as HTMLElement;
		if (!el) {
			el = document.createElement('div');
			el.className = 'doctrine-sun';
			container.appendChild(el);
		}
		el.innerHTML = '<div class="sun-ee">' + state.ee + '</div><div class="sun-label">EE</div>';

		// Close button
		if (!container.querySelector('.doctrine-close')) {
			const close = document.createElement('div');
			close.className = 'doctrine-close';
			close.textContent = '×';
			close.onclick = closeDoctrineTree;
			container.appendChild(close);
		}

		// Respec button
		if (!container.querySelector('.doctrine-respec')) {
			const respec = document.createElement('div');
			respec.className = 'doctrine-respec';
			respec.textContent = 'Respec (' + state.doctrine.length + '/' + DOCTRINE.length + ')';
			respec.onclick = function () {
				PlaySound('snd/tick.mp3');
				respecAndRedraw();
			};
			container.appendChild(respec);
		}
	}

	/** Render or re-render all planet nodes on their orbits. */
	function _renderSolarSystem(container: HTMLElement): void {
		const cx = 400, cy = 400;

		// Remove old planets (keep sun, close, respec)
		const old = container.querySelectorAll('.doctrine-planet');
		for (let i = old.length - 1; i >= 0; i--) old[i].remove();

		// Remove old orbit rings
		const rings = container.querySelectorAll('.doctrine-orbit-ring');
		for (let i = rings.length - 1; i >= 0; i--) rings[i].remove();

		// Draw orbit rings
		const ringColors = ['rgba(255,200,100,0.06)', 'rgba(100,200,255,0.06)', 'rgba(200,100,255,0.06)', 'rgba(100,255,200,0.06)'];
		for (const orbitIndex of [0, 1, 2, 3]) {
			const r = ORBIT_RADII[orbitIndex];
			const ring = document.createElement('div');
			ring.className = 'doctrine-orbit-ring';
			ring.style.cssText =
				'position:absolute;top:50%;left:50%;width:' + (r * 2) + 'px;height:' + (r * 2) + 'px;' +
				'margin:' + (-r) + 'px;border-radius:50%;' +
				'border:1px solid ' + ringColors[orbitIndex] + ';' +
				'pointer-events:none;';
			container.appendChild(ring);
		}

		// Place each node on its orbit
		for (const node of DOCTRINE) {
			const orbitIndex = ORBIT_BY_COST[node.cost];
			if (orbitIndex === undefined) continue;
			const radius = ORBIT_RADII[orbitIndex];

			// Calculate angle: nodes on the same orbit spread evenly
			const sameOrbit = DOCTRINE.filter((n) => ORBIT_BY_COST[n.cost] === orbitIndex);
			const idx = sameOrbit.indexOf(node);
			const angle = (idx / sameOrbit.length) * Math.PI * 2 - Math.PI / 2; // start at top

			const x = cx + Math.cos(angle) * radius;
			const y = cy + Math.sin(angle) * radius;

			const owned = doctrineHas(node.id);
			const canAfford = state.ee >= node.cost;
			const parentsMet = node.parents.every((pid) => doctrineHas(pid));
			const canBuy = !owned && canAfford && parentsMet;

			const planet = document.createElement('div');
			planet.className = 'doctrine-planet' +
				(owned ? ' owned' : '') +
				(canBuy ? ' buyable' : '') +
				(!owned && !canBuy ? ' locked' : '');
			planet.style.left = x + 'px';
			planet.style.top = y + 'px';

			// 3D depth: inner orbits closer to the viewer. Set via the --z
			// CSS variable so the base transform and the hover scale both
			// keep the same depth (inline transform would override hover).
			const zDepth = [30, 15, 0, -15][orbitIndex] || 0;
			planet.style.setProperty('--z', zDepth + 'px');

			// Icon
			const icon = document.createElement('div');
			icon.className = 'planet-icon';
			icon.style.cssText = 'background:url(img/icons.webp) -' + (node.icon[0] * 48) + 'px -' + (node.icon[1] * 48) + 'px;';
			planet.appendChild(icon);

			// Name
			const name = document.createElement('div');
			name.className = 'planet-name';
			name.textContent = node.name;
			planet.appendChild(name);

			// Cost
			const cost = document.createElement('div');
			cost.className = 'planet-cost';
			cost.textContent = owned ? '✓' : node.cost + ' EE';
			planet.appendChild(cost);

			if (canBuy) {
				planet.onclick = function () { buyInTreeSolar(node.id); };
			}

			// Tooltip for locked nodes
			if (!canBuy && !owned) {
				let reason = '';
				if (!parentsMet) {
					const missing = node.parents.filter((pid) => !doctrineHas(pid));
					reason = 'Requires: ' + missing.map((pid) => {
						const pn = DOCTRINE.find((d) => d.id === pid);
						return pn ? pn.name : '?';
					}).join(', ');
				} else if (!canAfford) {
					reason = 'Costs ' + node.cost + ' EE (you have ' + state.ee + ')';
				}
				planet.title = node.desc + (reason ? '\n' + reason : '');
			} else {
				planet.title = node.desc;
			}

			container.appendChild(planet);
		}

		// Update the respec button node count
		const respecBtn = container.querySelector('.doctrine-respec') as HTMLElement;
		if (respecBtn) respecBtn.textContent = 'Respec (' + state.doctrine.length + '/' + DOCTRINE.length + ')';
	}

	/** Purchase a node from the solar system UI and re-render in place. */
	function buyInTreeSolar(nodeId: number): void {
		const G = window.Game;
		if (!G) return;
		if (purchaseDoctrineNode(nodeId)) {
			PlaySound('snd/shimmerClick.mp3');
			const system = document.getElementById('doctrineSystem');
			if (system) {
				_renderSun(system);
				_renderSolarSystem(system);
			}
		}
	}

	/** Respec and re-render the solar system in place. */
	function respecAndRedraw(): void {
		const G = window.Game;
		if (!G) return;
		respecDoctrine();
		const system = document.getElementById('doctrineSystem');
		if (system) {
			_renderSun(system);
			_renderSolarSystem(system);
		}
	}

	/** Purchase + re-render (kept for the QA surface; delegates to the
	 *  solar-system re-renderer if the overlay is open, otherwise reopens). */
	function buyInTree(nodeId: number): void {
		const G = window.Game;
		if (!G) return;
		if (purchaseDoctrineNode(nodeId)) {
			PlaySound('snd/shimmerClick.mp3');
			const system = document.getElementById('doctrineSystem');
			if (system) {
				_renderSun(system);
				_renderSolarSystem(system);
			} else {
				showDoctrineTree();
			}
		}
	}

	/* ================================================================
	 * UI: STATS SECTION
	 * ================================================================ */

	function appendStats(): void {
		const G = window.Game;
		if (!G) return;
		const menu = document.getElementById('menu');
		if (!menu) return;
		if (menu.querySelector('#cc3TranscendStats')) return;

		const wrap = document.createElement('div');
		wrap.id = 'cc3TranscendStats';
		wrap.className = 'selectable';
		wrap.innerHTML = statsHtml();
		menu.appendChild(wrap);
	}

	function statsHtml(): string {
		let html = '';
		html += '<div class="subsection" style="margin-top:12px;">';
		html += '<div class="title" style="font-size:16px;">Transcendence</div>';

		if (state.transcendences === 0 && !canTranscend()) {
			const G = window.Game;
			if (G) {
				const remaining = Math.max(0, GATE_COOKIES - G.cookiesReset);
				html += '<div style="font-size:11px;color:#888;">';
				html += 'Transcendence unlocks when you\'ve filled the ascend meter<br>(';
				if (remaining > 0) {
					html += Beautify(remaining) + ' more Cookies needed from past runs';
				} else {
					html += 'reach 10,000 prestige';
				}
				html += ').</div>';
			}
		}

		html += '<div style="margin-top:4px;">';
		html += '<b>Eternal Essence:</b> ' + state.ee + ' | ';
		html += '<b>Lifetime EE:</b> ' + state.eeEarned + ' | ';
		html += '<b>Transcendences:</b> ' + state.transcendences;
		html += '</div>';

		if (state.eeEarned > 0) {
			html += '<div style="margin-top:4px;">';
			html += '<b>Doctrine nodes:</b> ' + state.doctrine.length + '/' + DOCTRINE.length;
			html += '</div>';
		}

		// Milestones
		if (state.milestones.length > 0) {
			html += '<div style="margin-top:8px;font-size:11px;">';
			html += '<b>Milestones:</b> ';
			const milestoneNames: string[] = [];
			for (const m of MILESTONES) {
				if (hasMilestone(m.threshold)) {
					milestoneNames.push(m.name);
				}
			}
			html += milestoneNames.join(', ') || 'none';
			html += '</div>';
		}

		// Next EE gain preview
		const G = window.Game;
		if (G && state.transcendences > 0) {
			const nextEE = computeEE(G.cookiesReset + G.cookiesEarned);
			html += '<div style="margin-top:4px;font-size:11px;">';
			html += 'Next Transcendence: <b>+' + nextEE + ' EE</b>';
			html += '</div>';
		}

		// Total prestige all time
		if (state.totalPrestigeAllTime > 0) {
			html += '<div style="margin-top:4px;font-size:11px;">';
			html += 'Total prestige (all time): <b>' + Beautify(state.totalPrestigeAllTime) + '</b>';
			html += '</div>';
		}

		html += '</div>';
		return html;
	}

	/* ================================================================
	 * UNLOCK CHECK
	 * ================================================================ */

	let _unlockShown = false;

	function checkUnlock(): void {
		if (_unlockShown) return;
		if (!canTranscend()) return;
		const G = window.Game;
		if (!G) return;
		_unlockShown = true;
		if (state.transcendences === 0) {
			G.Notify(
				'Transcendence unlocked!',
				'You have filled the ascend meter. A new path awaits — check the Legacy tab.',
				[19, 7],
				8
			);
		}
		_addTranscendUI();
	}

	/* ================================================================
	 * UI INIT
	 * ================================================================ */

	let _uiAdded = false;

	function _addTranscendUI(): void {
		if (_uiAdded) return;
		_uiAdded = true;
		addTranscendButton();
		addDoctrineToggle();
	}

	/* ================================================================
	 * ACHIEVEMENTS
	 * ================================================================ */

	const _declared = { done: false };

	function declareAchievements(): void {
		if (_declared.done) return;
		_declared.done = true;
		const G = window.Game;
		if (!G) return;

		for (const a of ACHIEVEMENTS) {
			const ach = new G.Achievement(a.name, a.desc, a.icon);
			ach.order = 200100 + a.icon[0];
		}

		if (typeof window.LocalizeUpgradesAndAchievs === 'function') {
			window.LocalizeUpgradesAndAchievs();
		}
		G.recalculateGains = 1;
	}

	/** Check and award achievements. */
	function checkAchievements(): void {
		const G = window.Game;
		if (!G) return;
		if (state.transcendences >= 1) G.Win('First Glimpse');
		if (state.transcendences >= 10) G.Win('The Long View');
		if (hasMilestone(25)) G.Win('Steady as She Goes');
		if (state.transcendences >= 100) G.Win('Eternal');
		if (hasMilestone(1000)) G.Win('Omega');
	}

	/* ================================================================
	 * SAVE / LOAD
	 * ================================================================ */

	function save(): string {
		const data = {
			ee: state.ee,
			eeSpent: state.eeSpent,
			eeEarned: state.eeEarned,
			trans: state.transcendences,
			tpa: state.totalPrestigeAllTime,
			milestones: state.milestones,
			doctrine: state.doctrine,
		};
		return JSON.stringify(data);
	}

	function load(str: string): void {
		try {
			const data = JSON.parse(str);
			state.ee = data.ee || 0;
			state.eeSpent = data.eeSpent || 0;
			state.eeEarned = data.eeEarned || 0;
			state.transcendences = data.trans || 0;
			state.totalPrestigeAllTime = data.tpa || 0;
			state.milestones = data.milestones || [];
			state.doctrine = data.doctrine || [];
		} catch (e) {
			state.ee = 0;
			state.eeSpent = 0;
			state.eeEarned = 0;
			state.transcendences = 0;
			state.totalPrestigeAllTime = 0;
			state.milestones = [];
			state.doctrine = [];
		}

		// Sync _prestigeSeen from the loaded game state so we don't
		// double-count the delta.
		const G = window.Game;
		if (G) {
			_prestigeSeen = G.prestige;
		}
	}

	/* ================================================================
	 * INIT
	 * ================================================================ */

	function init(): void {
		const G = window.Game;
		if (!G) return;

		// Register hooks
		G.registerHook('create', createHook);
		G.registerHook('cps', cpsHook);
		G.registerHook('click', clickHook);
		G.registerHook('reset', resetHook);
		G.registerHook('reincarnate', reincarnateHook);
		G.registerHook('check', checkHook);

		// Stats menu section
		G.customStatsMenu.push(appendStats);

		// Patch cost discounts
		patchEff();

		// Check if the gate is already met (for returning players who loaded a save)
		if (canTranscend()) {
			_addTranscendUI();
		}

		// Sync prestige tracking
		_prestigeSeen = G.prestige;
	}

	/* ================================================================
	 * REGISTRATION
	 * ================================================================ */

	function register(): boolean {
		const G = window.Game;
		if (!G || typeof G.registerMod !== 'function') return false;
		G.registerMod(MOD_ID, {
			name: 'Transcendence',
			version: '1.0-cc3',
			init: init,
			save: save,
			load: load,
		}, true);
		return true;
	}

	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () { window.clearInterval(t); }, { once: true });
	}

	/* ================================================================
	 * QA / TEST SURFACE
	 * ================================================================ */

	window.__cc3Transcendence = {
		state,
		DOCTRINE,
		MILESTONES,
		ACHIEVEMENTS,
		computeEE,
		canTranscend,
		doTranscend,
		purchase: purchaseDoctrineNode,
		buyInTree,
		respec: respecDoctrine,
		respecAndRedraw,
		checkMilestones,
		checkAchievements,
		doctrineHas,
		hasMilestone,
		showDoctrineTree,
		closeDoctrineTree,
		_addTranscendUI,
		save,
		load,
		/* Seed a large cookiesReset for QA testing. */
		seed: function (reset: number) {
			const G = window.Game;
			if (!G) return;
			G.cookiesReset = reset;
			state.transcendences = 0;
			state.ee = 0;
			state.eeEarned = 0;
			state.milestones = [];
			state.doctrine = [];
			_unlockShown = false;
			_uiAdded = false;
		},
	};

	/* ================================================================
	 * TODO (Phase 2 / polish)
	 * ================================================================
	 * - Cascade (node 3): hook into golden cookie click for the 10% spawn
	 * - Warm Embers (node 5): shimmering veil auto-start (needs to understand
	 *   the elder pledge / shimmering veil toggle in the engine)
	 * - Ambient Baking (node 6): modify wrinkler spawn rate and capacity
	 * - Fortune's Favor (node 7): modify golden cookie frequency/duration
	 *   through Game.eff
	 * - Elder's Whisper (node 8): allow wrath cookies in Ascetic mode
	 * - Strange Attractor (node 9): golden cookie cluster on spawn
	 * - Double Dip (node 10): golden cookie effect doubling on expiry
	 * - Milestone "First Light" (1 EE): keep 1 cosmetic heavenly upgrade
	 * - Milestone "Steady Hand" (25 EE) / "Timeless" (500 EE): keep heavenly
	 *   upgrades of choice (needs a UI for selecting which ones)
	 * - The Doctrine tree should use the full DAG renderer (BuildAscendTree
	 *   pattern) with Game.crate, not the current prompt-based overlay.
	 *   The prompt overlay is functional for the MVP but the full tree
	 *   is the polished experience.
	 * - The transcend button / doctrine toggle should be part of the ascend
	 *   screen's layout, not appended after the fact.
	 * - Eternal Recipes: a set of repeatable challenge runs (Phase 2).
	 */
})();