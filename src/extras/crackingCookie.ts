/* Cracking cookie — a CC3-native extras mod (not in 2.048).
 *
 * An incentive to buy Cursors: with enough of them, the Cursors slowly
 * scratch and crack the big cookie. The crack is drawn procedurally (no new
 * assets) and grows over time; the more Cursors you own, the faster it
 * spreads. Once the cookie is fully cracked it glows gold and clicks on it
 * fire a payoff — a lump of cookies scaled to your CpS plus a short Click
 * frenzy — then the cookie reforms and the cycle starts again.
 *
 * Design:
 *   - Cracking requires at least MIN_CURSORS Cursors (10 — the "Ambidextrous"
 *     milestone). Below that, the crack sits where it is (it never heals).
 *   - Crack speed scales sub-linearly with Cursor count: with C as the count,
 *     progress/second = BASE_CRACK_SPEED * (C / MIN_CURSORS)^CURSOR_SPEED_EXP.
 *     Doubling your Cursors cuts the time to the next crack by ~30%. The
 *     cycle is floored at MIN_CYCLE_SECONDS — derived from the Click frenzy
 *     length plus a hard downtime — so a payoff can never recur while the
 *     previous frenzy is still running (the ×777 window is never permanent).
 *   - Cracking is wall-clock driven (Date.now() deltas in the logic hook), so
 *     it keeps working while the tab is throttled or the game is closed; a
 *     single logic tick can catch up at most MAX_OFFLINE_MS (4 h) so a long
 *     absence doesn't insta-crack dozens of cycles.
 *   - Payoff (clicking the fully-cracked cookie): a burst of cookies equal to
 *     max(MIN_BURST, CpS * BURST_SECONDS) (2 minutes of production), plus a
 *     Click frenzy (×777, CLICK_FRENZY_SECONDS) so the payoff feels juicy,
 *     plus a sparkle + sound + notification. The crack then resets.
 *   - Ascensions/hard resets reform the cookie: the 'reset' hook clears the
 *     crack (the lifetime trigger count and achievements survive, like other
 *     mod data).
 *
 * Persistence: registered mod save()/load() (the "Custom" save section), so
 * the crack progress, lifetime trigger count and the wall-clock anchor
 * survive save import/export and ascension. UI: a "Cracking cookie" section
 * on the Stats menu (cursor count, live progress bar, time to next crack,
 * lifetime cracks) plus a notification when the cookie becomes ready.
 * Three achievements (first / 10 / 50 cracks).
 *
 * New strings use loc() with English source text. CC3's loc() substitutes
 * %N params into the source text of ids missing from the language tables,
 * so these render correctly until a translator adds them.
 */
import type { Game as EngineGame } from '../engine/types';

(function () {
	if (window.__cc3CrackingCookie) return;

	const MOD_ID = 'CC3CrackingCookie';

	/* --- tuning knobs --- */
	/* Cursors needed before the crack starts spreading. */
	const MIN_CURSORS = 10;
	/* Progress fraction gained per second at exactly MIN_CURSORS (~50 s per
	 * crack cycle at the threshold). */
	const BASE_CRACK_SPEED = 0.02;
	/* speed = BASE_CRACK_SPEED * (C / MIN)^EXP — sub-linear so early purchases
	 * are very visible and the tail gently tapers. */
	const CURSOR_SPEED_EXP = 0.5;
	/* Cap the wall-clock catch-up per logic tick (4 h) — a single tick may
	 * only advance the crack this far even if the game was closed for days. */
	const MAX_OFFLINE_MS = 4 * 3600 * 1000;
	/* Payoff: burst = max(MIN_BURST, CpS * BURST_SECONDS); Click frenzy. */
	const BURST_SECONDS = 120;
	const MIN_BURST = 1000;
	const CLICK_FRENZY_SECONDS = 7;
	const CLICK_FRENZY_POW = 777;
	/* Never-permanent guarantee: the crack cycle is floored so a payoff can
	 * never recur before the previous Click frenzy has expired plus a hard
	 * FRENZY_DOWNTIME of downtime. Because MIN_CYCLE_SECONDS is DERIVED from
	 * CLICK_FRENZY_SECONDS, the ×777 window can never be permanently active
	 * at any cursor count — even thousands — and the invariant holds even if
	 * the frenzy length is tweaked later. The cap bites at ~175 cursors. */
	const FRENZY_DOWNTIME = 5;
	const MIN_CYCLE_SECONDS = CLICK_FRENZY_SECONDS + FRENZY_DOWNTIME; // 12

	const ACH_FIRST = "It's cracked!";
	const ACH_TEN = 'Crumbs underfoot';
	const ACH_FIFTY = 'Cookie fault line';
	const ACH_ICON: [number, number] = [0, 27];

	interface CrackState {
		/* 0..1 — how far the crack has spread across the big cookie. */
		progress: number;
		/* Lifetime payoff count (survives ascension, like the achievements). */
		totalTriggers: number;
		/* Wall-clock anchor for the delta-driven crack speed (ms epoch). */
		lastTickMs: number;
		/* True once the "ready to click" notification fired for this cycle. */
		notified: boolean;
	}
	const state: CrackState = { progress: 0, totalTriggers: 0, lastTickMs: Date.now(), notified: false };

	/* ------------------------------------------------------------------ */
	/* Crack geometry — a fixed set of jagged radial cracks, generated once  */
	/* per session so the crack visibly grows instead of reshuffling.        */
	/* ------------------------------------------------------------------ */
	interface CrackBranch { t: number; off: number; len: number }
	interface CrackDef { angle: number; reach: number; seed: number; branches: CrackBranch[] }

	const CRACK_COUNT = 22;

	function makeCracks(): CrackDef[] {
		const list: CrackDef[] = [];
		for (let i = 0; i < CRACK_COUNT; i++) {
			const angle = Math.random() * Math.PI * 2;
			const reach = 0.35 + Math.random() * 0.6;
			const seed = Math.random() * 100;
			const branches: CrackBranch[] = [];
			const r = Math.random();
			const nB = r < 0.4 ? 1 : r < 0.75 ? 2 : 0;
			for (let b = 0; b < nB; b++) {
				branches.push({
					t: 0.4 + Math.random() * 0.45,
					off: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.55),
					len: 0.2 + Math.random() * 0.45,
				});
			}
			list.push({ angle, reach, seed, branches });
		}
		return list;
	}
	const CRACKS = makeCracks();

	/* Angular jitter along a crack: 0 at the edge, growing toward the tip so
	 * the fracture gets more jagged as it digs in. */
	function wig(seed: number, t: number): number {
		return Math.sin(seed + t * 9) * 0.13 * t + Math.sin(seed * 2.7 + t * 23) * 0.07 * t;
	}

	/* Trace one crack from the cookie edge inward to depth (0..1 of its
	 * reach), with a sub-branch that grows alongside it. */
	function traceCrack(ctx: any, cx: number, cy: number, r: number, crack: CrackDef, depth: number): void {
		if (depth <= 0.01) return;
		const n = 7;
		ctx.beginPath();
		for (let k = 0; k <= n; k++) {
			const t = k / n;
			const dist = r * (1 - depth * t);
			const a = crack.angle + wig(crack.seed, t);
			const px = cx + Math.cos(a) * dist;
			const py = cy + Math.sin(a) * dist;
			if (k === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.stroke();
		/* sub-branches fork off the main crack and continue inward */
		for (const b of crack.branches) {
			const bt = b.t;
			const d0 = r * (1 - depth * bt);
			const a0 = crack.angle + wig(crack.seed, bt);
			const aB = a0 + b.off;
			const len = r * b.len * depth;
			ctx.beginPath();
			for (let k = 0; k <= 4; k++) {
				const t = k / 4;
				const dist = d0 - len * t;
				const a = aB + Math.sin(crack.seed * 3 + t * 12) * 0.12 * t;
				const px = cx + Math.cos(a) * dist;
				const py = cy + Math.sin(a) * dist;
				if (k === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.stroke();
		}
	}

	/* Crumbs/specks shed from the crack tips at high progress. */
	function drawSpecks(ctx: any, cx: number, cy: number, r: number, g: number): void {
		const n = Math.floor(34 * g);
		ctx.fillStyle = 'rgba(40,30,18,0.5)';
		for (let i = 0; i < n; i++) {
			const a = (i * 2.399 + 1.7) % (Math.PI * 2);
			const dd = (0.18 + ((i * 0.137) % 0.82)) * r * g;
			const px = cx + Math.cos(a) * dd;
			const py = cy + Math.sin(a) * dd;
			ctx.beginPath();
			ctx.arc(px, py, 1.2 + (i % 3) * 0.8, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	/* Golden pulsing halo + ring around the fully-cracked, clickable cookie. */
	function drawReadyGlow(ctx: any, cx: number, cy: number, r: number, T: number): void {
		const pulse = 0.5 + 0.5 * Math.sin(T * 0.1);
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		/* soft radial glow */
		const grd = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.5);
		grd.addColorStop(0, 'rgba(255,200,90,0)');
		grd.addColorStop(0.7, 'rgba(255,180,60,' + (0.16 + 0.1 * pulse).toFixed(3) + ')');
		grd.addColorStop(1, 'rgba(255,180,60,0)');
		ctx.globalAlpha = 1;
		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
		ctx.fill();
		/* pulsing ring just outside the cookie */
		ctx.globalAlpha = 0.4 + 0.3 * pulse;
		ctx.strokeStyle = 'rgba(255,200,80,1)';
		ctx.lineWidth = 3 + 2 * pulse;
		ctx.beginPath();
		ctx.arc(cx, cy, r * (1.045 + 0.015 * pulse), 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	}

	/* ------------------------------------------------------------------ */
	/* Draw — overlay the crack onto the big cookie (LeftBackground).       */
	/* The draw hook runs after DrawBackground, so the cookie is already on */
	/* the canvas and we just paint on top, clipped to its circle.          */
	/* ------------------------------------------------------------------ */
	function drawCracks(G: EngineGame): void {
		if (!G.ready || G.OnAscend || G.AscendTimer > 0) return;
		if (state.progress <= 0) return;
		const ctx = G.LeftBackground;
		if (!ctx || !ctx.canvas) return;
		const cx = G.cookieOriginX;
		const cy = G.cookieOriginY;
		const r = 128 * (G.BigCookieSize || 1);
		if (typeof cx !== 'number' || typeof cy !== 'number' || !isFinite(cx) || !isFinite(cy) || r <= 0) return;

		const p = Math.min(1, state.progress);
		const g = p;

		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.clip();
		ctx.lineCap = 'round';
		for (const crack of CRACKS) {
			const depth = crack.reach * g;
			if (depth <= 0.01) continue;
			/* dark fracture shadow under the crack highlight */
			ctx.strokeStyle = 'rgba(25,18,10,0.6)';
			ctx.lineWidth = Math.max(2, r * 0.016);
			traceCrack(ctx, cx, cy, r, crack, depth);
			/* thin light crack line on top */
			ctx.strokeStyle = 'rgba(255,242,214,0.22)';
			ctx.lineWidth = Math.max(0.8, r * 0.0045);
			traceCrack(ctx, cx, cy, r, crack, Math.max(0, depth - r * 0.02));
		}
		/* at very high progress, a few fine radial hairline cracks + crumbs */
		if (g > 0.7) {
			ctx.strokeStyle = 'rgba(40,30,18,0.45)';
			ctx.lineWidth = 1;
			for (let i = 0; i < 6; i++) {
				const a = ((i * 2.61 + 0.6) % (Math.PI * 2));
				const depth = (0.35 + 0.5 * g) * r * 0.9;
				ctx.beginPath();
				for (let k = 0; k <= 4; k++) {
					const t = k / 4;
					const dist = r - depth * t;
					const aa = a + Math.sin(i * 7 + t * 31) * 0.05 * t;
					const px = cx + Math.cos(aa) * dist;
					const py = cy + Math.sin(aa) * dist;
					if (k === 0) ctx.moveTo(px, py);
					else ctx.lineTo(px, py);
				}
				ctx.stroke();
			}
			drawSpecks(ctx, cx, cy, r, g);
		}
		ctx.restore();

		if (p >= 1) drawReadyGlow(ctx, cx, cy, r, G.T);
	}

	/* ------------------------------------------------------------------ */
	/* Payoff — clicking the fully-cracked cookie.                          */
	/* ------------------------------------------------------------------ */
	function firePayoff(G: EngineGame): void {
		const burst = Math.max(MIN_BURST, (G.cookiesPs || 0) * BURST_SECONDS);
		G.Earn(burst);
		G.gainBuff('click frenzy', CLICK_FRENZY_SECONDS, CLICK_FRENZY_POW);
		state.totalTriggers++;
		state.progress = 0;
		state.notified = false;
		if (state.totalTriggers === 1) G.Win(ACH_FIRST);
		else if (state.totalTriggers === 10) G.Win(ACH_TEN);
		else if (state.totalTriggers === 50) G.Win(ACH_FIFTY);
		if (typeof G.SparkleAt === 'function') G.SparkleAt(G.cookieOriginX, G.cookieOriginY);
		PlaySound('snd/cookieBreak.mp3', 0.8);
		PlaySound('snd/cashIn.mp3', 0.6);
		G.Notify(loc('Cracked!'), loc('+%1 cookies and a Click frenzy!', [Beautify(Math.round(burst)), '×777']), ACH_ICON, 1, 1);
		G.toSave = true;
	}

	/* ------------------------------------------------------------------ */
	/* Logic — advance the crack with wall-clock deltas.                    */
	/* ------------------------------------------------------------------ */

	/* Shared speed helper: fraction of progress per second, capped by the
	 * MIN_CYCLE_SECONDS floor so the crack never completes faster than that
	 * (which is what guarantees the Click frenzy is never permanent). */
	function crackSpeed(cursors: number): number {
		if (cursors < MIN_CURSORS) return 0;
		const raw = BASE_CRACK_SPEED * Math.pow(cursors / MIN_CURSORS, CURSOR_SPEED_EXP);
		return Math.min(raw, 1 / MIN_CYCLE_SECONDS);
	}

	function logicTick(G: EngineGame): void {
		const now = Date.now();
		const delta = Math.min(MAX_OFFLINE_MS, Math.max(0, now - state.lastTickMs));
		state.lastTickMs = now;
		if (!G.ready || G.OnAscend || G.AscendTimer > 0) return;
		const cursor = G.Objects['Cursor'];
		const cursors = cursor ? cursor.amount : 0;
		if (cursors < MIN_CURSORS || state.progress >= 1) return;
		const speed = crackSpeed(cursors);
		state.progress = Math.min(1, state.progress + (delta / 1000) * speed);
		if (state.progress >= 1 && !state.notified) {
			state.notified = true;
			G.toSave = true;
			G.Notify(loc('Cracked cookie'), loc('Your cursors have cracked the big cookie — click it for a reward!'), ACH_ICON, 1, 1);
		}
	}

	function currentSpeed(G: EngineGame): number {
		const cursor = G.Objects['Cursor'];
		const cursors = cursor ? cursor.amount : 0;
		return crackSpeed(cursors);
	}

	/* ------------------------------------------------------------------ */
	/* Persistence — the Custom save section (mod save()/load).            */
	/* ------------------------------------------------------------------ */
	function save(): string {
		return JSON.stringify({
			progress: state.progress,
			totalTriggers: state.totalTriggers,
			lastTickMs: state.lastTickMs,
			notified: state.notified ? 1 : 0,
		});
	}

	function load(str: string): void {
		if (!str) return;
		try {
			const d = JSON.parse(str);
			if (!d) return;
			state.progress = typeof d.progress === 'number' ? Math.min(1, Math.max(0, d.progress)) : 0;
			state.totalTriggers = typeof d.totalTriggers === 'number' ? Math.max(0, Math.floor(d.totalTriggers)) : 0;
			state.lastTickMs = typeof d.lastTickMs === 'number' ? d.lastTickMs : Date.now();
			state.notified = d.notified ? true : false;
		} catch (e) {
			/* corrupt entry: keep defaults */
		}
	}

	function resetCrack(): void {
		state.progress = 0;
		state.notified = false;
		state.lastTickMs = Date.now();
	}

	/* ------------------------------------------------------------------ */
	/* Stats menu — crack status.                                           */
	/* ------------------------------------------------------------------ */
	function statsHtml(G: EngineGame): string {
		const cursors = G.Objects['Cursor'] ? G.Objects['Cursor'].amount : 0;
		const ready = state.progress >= 1;
		const speed = currentSpeed(G);
		const pct = Math.floor(state.progress * 100);
		let eta = '';
		if (ready) eta = loc('click the cookie!');
		else if (speed > 0) {
			const secs = Math.ceil((1 - state.progress) / speed);
			eta = secs <= 1 ? loc('in ~1 second') : loc('in ~%1 seconds', String(secs));
		} else {
			eta = loc('%1 cursors needed', String(MIN_CURSORS));
		}
		const bar = '<div style="height:9px;background:rgba(255,255,255,0.12);border-radius:5px;overflow:hidden;width:200px;display:inline-block;vertical-align:middle;border:1px solid rgba(255,255,255,0.15);">' +
			'<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#8a5a2b,#e0a55c' + (ready ? ',#ffdf9e' : '') + ');"></div></div>';
		return (
			'<div class="section" style="margin-top:16px;">' + loc('Cracking cookie') + '</div>' +
			'<div class="subsection">' +
			'<div class="title">' + loc('Your cursors are slowly scratching cracks into the big cookie.') + '</div>' +
			'<div class="listing"><b>' + loc('Cursors:') + '</b> ' + Beautify(cursors) + (cursors < MIN_CURSORS ? ' <small>(' + loc('%1 needed to start cracking', String(MIN_CURSORS)) + ')</small>' : '') + '</div>' +
			'<div class="listing"><b>' + loc('Crack:') + '</b> ' + bar + ' ' + pct + '% — ' + (ready ? '<span style="color:#ffd97a;font-weight:bold;">' + eta + '</span>' : eta) + '</div>' +
			'<div class="listing"><b>' + loc('Cracks triggered:') + '</b> ' + Beautify(state.totalTriggers) + '</div>' +
			'<div class="listing"><small style="opacity:0.75;">(' + loc('Buy more cursors to crack it faster. Clicking a fully cracked cookie pays ~%1 minutes of production plus a %2-second Click frenzy.', [String(BURST_SECONDS / 60), String(CLICK_FRENZY_SECONDS)]) + ')</small></div>' +
			'</div>'
		);
	}

	function appendStats(): void {
		const menu = l('menu');
		if (!menu) return;
		if (menu.querySelector('#cc3CrackStats')) return; // menu redraws reuse the DOM
		const wrap = document.createElement('div');
		wrap.id = 'cc3CrackStats';
		wrap.className = 'selectable';
		wrap.innerHTML = statsHtml(window.Game);
		menu.appendChild(wrap);
	}

	/* ------------------------------------------------------------------ */
	/* Content declaration — 3 achievements (vanilla=0, 'create' hook).     */
	/* ------------------------------------------------------------------ */
	const declared = { done: false };

	function declare(G: EngineGame): void {
		if (declared.done) return;
		declared.done = true;
		const a1 = new G.Achievement(ACH_FIRST, loc('Click a fully cracked big cookie.'), [0, 27]);
		a1.order = 200100;
		const a2 = new G.Achievement(ACH_TEN, loc('Trigger %1 cracked cookie payoffs.', '10'), [1, 27]);
		a2.order = 200101;
		const a3 = new G.Achievement(ACH_FIFTY, loc('Trigger %1 cracked cookie payoffs.', '50'), [2, 27]);
		a3.order = 200102;
		if (typeof window.LocalizeUpgradesAndAchievs === 'function') window.LocalizeUpgradesAndAchievs();
		Game.recalculateGains = 1;
	}

	/* ------------------------------------------------------------------ */
	/* Registration.                                                       */
	/* ------------------------------------------------------------------ */
	function register(): boolean {
		const Game = window.Game;
		if (!Game || typeof Game.registerMod !== 'function') return false;
		Game.registerMod(MOD_ID, {
			name: 'Cracking cookie',
			version: '1.0-cc3',
			init: function () {
				Game.registerHook('create', function () { declare(Game); });
				Game.registerHook('logic', function () { logicTick(Game); });
				Game.registerHook('draw', function () { drawCracks(Game); });
				Game.registerHook('click', function () {
					if (!Game.ready || Game.OnAscend || Game.AscendTimer > 0) return;
					if (state.progress < 1) return;
					const cursor = Game.Objects['Cursor'];
					if (!cursor || cursor.amount < MIN_CURSORS) return;
					firePayoff(Game);
				});
				Game.registerHook('reset', function () { resetCrack(); });
				Game.customStatsMenu.push(function () { appendStats(); });
			},
			save: function () { return save(); },
			load: function (str: string) { load(str); },
		}, true);
		return true;
	}

	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () { window.clearInterval(t); }, { once: true });
	}

	/* Test/inspection surface (used by ?qa=cracking): the live state, the
	 * persistence round-trip, forced payoff, speed readout, crack reset, and
	 * the never-permanent-frenzy constants for the invariant check. */
	window.__cc3CrackingCookie = {
		state,
		save,
		load,
		MIN_CURSORS,
		CLICK_FRENZY_SECONDS,
		MIN_CYCLE_SECONDS,
		reset: resetCrack,
		trigger: function () { if (window.Game) firePayoff(window.Game); },
		speed: function () { return window.Game ? currentSpeed(window.Game) : 0; },
	};
})();
