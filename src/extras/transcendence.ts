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

	function doTranscend(): void {
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

	/** Purchase + re-render the Doctrine tree (for use from the prompt UI). */
	function buyInTree(nodeId: number): void {
		const G = window.Game;
		if (!G) return;
		if (purchaseDoctrineNode(nodeId)) {
			G.ClosePrompt();
			showDoctrineTree();
		}
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

	/** Show the Doctrine tree in a prompt overlay. */
	function showDoctrineTree(): void {
		const G = window.Game;
		if (!G) return;

		let html = '<div style="min-width:400px;min-height:300px;text-align:center;">';
		html += '<h3>Doctrine of the Eternal Oven</h3>';
		html += '<div class="line"></div>';
		html += '<div style="font-size:11px;margin-bottom:8px;">';
		html += 'Eternal Essence: <b>' + state.ee + '</b> | ';
		html += 'Nodes: ' + state.doctrine.length + '/' + DOCTRINE.length;
		html += '</div>';

		// Render each branch
		const branches = ['glutton', 'idler', 'fatebinder', 'rebuilder'];
		const branchLabels = ['Glutton (click)', 'Idler (production)', 'Fatebinder (golden)', 'Rebuilder (economy)'];
		const branchColors = ['#c44', '#48c', '#c84', '#4a4'];

		for (let b = 0; b < branches.length; b++) {
			const branchId = branches[b];
			const nodes = DOCTRINE.filter((n) => n.branch === branchId);
			html += '<div style="margin:8px 0;padding:4px;border:1px solid ' + branchColors[b] + ';border-radius:4px;">';
			html += '<div style="font-weight:bold;color:' + branchColors[b] + ';font-size:12px;">' + branchLabels[b] + '</div>';

			for (const n of nodes) {
				const owned = doctrineHas(n.id);
				const canAfford = state.ee >= n.cost;
				const parentsMet = n.parents.every((pid) => doctrineHas(pid));
				const canBuy = !owned && canAfford && parentsMet;

				html += '<div style="display:inline-block;margin:4px;padding:8px;border:1px solid ' +
					(owned ? branchColors[b] : '#555') + ';border-radius:4px;' +
					'background:' + (owned ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)') + ';' +
					'width:160px;vertical-align:top;text-align:center;' +
					(canBuy ? 'cursor:pointer;' : 'opacity:0.6;') + '"' +
					(canBuy ? ' onclick="window.__cc3Transcendence.buyInTree(' + n.id + ');"' : '') +
					' title="' + n.desc + '">';
				html += '<div style="font-size:10px;font-weight:bold;">' + n.name + '</div>';
				html += '<div style="font-size:10px;margin-top:2px;">' + n.cost + ' EE</div>';
				if (owned) html += '<div style="color:' + branchColors[b] + ';font-size:10px;">&#10003;</div>';
				html += '</div>';
			}
			html += '</div>';
		}

		html += '<div class="line"></div>';
		html += '<a class="option framed small" style="font-size:11px;cursor:pointer;" onclick="window.__cc3Transcendence.respecAndRedraw();">Respec</a>';

		html += '</div>';

		G.Prompt(html, [['Close', 0]], 0, 'widePrompt');
	}

	/** Respec and re-render the tree. */
	function respecAndRedraw(): void {
		const G = window.Game;
		if (!G) return;
		respecDoctrine();
		G.ClosePrompt();
		showDoctrineTree();
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