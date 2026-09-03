/* Cracking cookie — a CC3-native extras mod (not in 2.048).
 *
 * An incentive to buy Cursors: with enough of them, the Cursors slowly
 * crack the big cookie. The crack is shown as a progressive crumbling
 * animation using the ascend crumbling-cookie effect (brokenCookie.webp
 * chunks + brokenCookieHalo) — the same visual the ascend intro uses.
 * The more Cursors you own, the faster the crumble spreads. Once the
 * cookie is fully crumbled it glows gold and clicks on it fire a payoff
 * — a lump of cookies scaled to your CpS plus a short Click frenzy —
 * then the cookie reforms and a 2-minute cooldown starts before the
 * next cracking cycle can pay out.
 *
 * Design:
 *   - Cracking requires at least MIN_CURSORS Cursors (10 — the "Ambidextrous"
 *     milestone). Below that, the crumble sits where it is (it never heals).
 *   - Crumble speed scales linearly with Cursor count: with C as the count,
 *     progress/second = BASE_CRACK_SPEED * (C / MIN_CURSORS)^CURSOR_SPEED_EXP.
 *     At exactly MIN_CURSORS a full crack takes ~2 hours — "a very long time";
 *     doubling your cursors halves the time to the next crack. The cycle is
 *     floored at MIN_CYCLE_SECONDS — derived from the Click frenzy length plus
 *     a hard downtime — so a payoff can never recur while the previous frenzy
 *     is still running (the ×777 window is never permanent).
 *   - Cracking is wall-clock driven (Date.now() deltas in the logic hook), so
 *     it keeps working while the tab is throttled or the game is closed; a
 *     single logic tick can catch up at most MAX_OFFLINE_MS (4 h) so a long
 *     absence doesn't insta-crack dozens of cycles.
 *   - Payoff (clicking the fully-crumbled cookie): a burst of cookies equal to
 *     max(MIN_BURST, CpS * BURST_SECONDS) (2 minutes of production), plus a
 *     Click frenzy (×777, CLICK_FRENZY_SECONDS) so the payoff feels juicy,
 *     plus a sparkle + sound + notification. A 2-minute cooldown locks the
 *     payoff after each trigger; the cookie reforms during the cooldown.
 *   - Ascensions/hard resets reform the cookie: the 'reset' hook clears the
 *     crumble (the lifetime trigger count and achievements survive, like other
 *     mod data).
 *
 * Persistence: registered mod save()/load() (the "Custom" save section), so
 * the crumble progress, lifetime trigger count, wall-clock anchor and cooldown
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
	/* Cursors needed before the crumble starts spreading. */
	const MIN_CURSORS = 10;
	/* Progress fraction gained per second at exactly MIN_CURSORS. At
	 * MIN_CURSORS a full crack cycle takes ~2 hours — "a very long time" —
	 * so the early-game payoff is an idle-hours reward, not a quick click.
	 * speed scales linearly (EXP=1) so buying cursors is visibly rewarding:
	 *   10 cursors  → ~2 h
	 *   25 cursors  → ~48 min
	 *   50 cursors  → ~24 min
	 *  100 cursors  → ~12 min
	 *  500 cursors  → ~2.4 min
	 * The ceiling is the 2-minute hard cooldown on the payoff, which the
	 * curve reaches around 600 cursors. */
	const BASE_CRACK_SPEED = 1 / 7200; // 0.000139
	/* speed = BASE_CRACK_SPEED * (C / MIN)^EXP — linear (EXP=1) so the
	 * speedup is directly proportional to cursor count: doubling your
	 * cursors halves the time to the next crack (until the cooldown cap). */
	const CURSOR_SPEED_EXP = 1;
	/* Cap the wall-clock catch-up per logic tick (4 h) — a single tick may
	 * only advance the crumble this far even if the game was closed for days. */
	const MAX_OFFLINE_MS = 4 * 3600 * 1000;
	/* Payoff: burst = max(MIN_BURST, CpS * BURST_SECONDS); Click frenzy. */
	const BURST_SECONDS = 120;
	const MIN_BURST = 1000;
	const CLICK_FRENZY_SECONDS = 7;
	const CLICK_FRENZY_POW = 777;
	/* Never-permanent guarantee: the crumble cycle is floored so a payoff can
	 * never recur before the previous Click frenzy has expired plus a hard
	 * FRENZY_DOWNTIME of downtime. Because MIN_CYCLE_SECONDS is DERIVED from
	 * CLICK_FRENZY_SECONDS, the ×777 window can never be permanently active
	 * at any cursor count — even thousands — and the invariant holds even if
	 * the frenzy length is tweaked later. The cap bites at ~6000 cursors. */
	const FRENZY_DOWNTIME = 5;
	const MIN_CYCLE_SECONDS = CLICK_FRENZY_SECONDS + FRENZY_DOWNTIME; // 12
	/* Hard 2-minute cooldown on the bonus payoff after each trigger. During
	 * the cooldown the cookie reforms (progress stays 0) and no cracking
	 * occurs. The crack-speed floor (MIN_CYCLE_SECONDS) is subsumed by this
	 * much longer cooldown, but kept for the never-permanent invariant. */
	const COOLDOWN_MS = 2 * 60 * 1000; // 120 000 ms

	const ACH_FIRST = "It's cracked!";
	const ACH_TEN = 'Crumbs underfoot';
	const ACH_FIFTY = 'Cookie fault line';
	const ACH_ICON: [number, number] = [0, 27];

	interface CrumbleState {
		/* 0..1 — how far the crumble has spread across the big cookie. */
		progress: number;
		/* Lifetime payoff count (survives ascension, like the achievements). */
		totalTriggers: number;
		/* Wall-clock anchor for the delta-driven crumble speed (ms epoch). */
		lastTickMs: number;
		/* True once the "ready to click" notification fired for this cycle. */
		notified: boolean;
		/* Cooldown until this ms epoch (0 = no cooldown). The bonus cannot
		 * be collected while now < cooldownUntil. */
		cooldownUntil: number;
	}
	const state: CrumbleState = {
		progress: 0, totalTriggers: 0, lastTickMs: Date.now(),
		notified: false, cooldownUntil: 0,
	};

	/* ------------------------------------------------------------------ */
	/* Crumble rendering — reuses the ascend crumbling-cookie effect.       */
	/* The brokenCookie.webp sprite sheet has 10 chunk frames (256×256 each) */
	/* laid out horizontally. The chunk arrangement matches the ascend       */
	/* animation in drawBackground.ts (lines 458-483).                       */
	/* ------------------------------------------------------------------ */

	/* Sprite-sheet frame index per drawn chunk (re-order from the ascend). */
	const CHUNK_MAP: number[] = [7, 6, 3, 2, 8, 1, 9, 5, 0, 4];

	/* Draw the crumbling cookie on the LeftBackground canvas, covering the
	 * intact cookie that DrawBackground already painted. Progress p (0..1)
	 * plays the ascend crumbling-cookie animation in slow motion: the crack
	 * forms as a hairline, then the wedge gaps grow outward from the center
	 * until at p=1 the cookie is fully broken apart (gold ready glow). */
	function drawCrumble(G: EngineGame): void {
		const p = state.progress;
		if (p <= 0) return;
		/* Skip while the real ascend/reincarnate intros are playing — they
		 * already paint the crumbling cookie themselves. */
		if (!G.ready || G.OnAscend || G.AscendTimer > 0) return;
		const ctx = G.LeftBackground;
		if (!ctx || !ctx.canvas) return;
		const cx = G.cookieOriginX;
		const cy = G.cookieOriginY;
		const r = 128 * (G.BigCookieSize || 1);
		if (typeof cx !== 'number' || typeof cy !== 'number' ||
			!isFinite(cx) || !isFinite(cy) || r <= 0) return;

		/* Mapping: t = p (0→1) — the ascend crumbling-cookie animation played
		 * in slow motion over the whole crack cycle. Separation follows an
		 * ease-in (tS = t^1.5) so the crack spends its early life as a barely
		 * open hairline and the gaps grow faster as the crumble deepens. */
		const t = Math.min(1, p);
		const tS = Math.pow(t, 1.5); // wedge separation, slow at the beginning
		/* Chunks are frames of the intact cookie: each brokenCookie.webp frame
		 * is a 256×256 slice that only lines up with the cookie silhouette when
		 * drawn at the same on-screen size as the big cookie (256*BigCookieSize,
		 * as in DrawBackground). The ten assembled frames form the cracked
		 * cookie; separation opens the gaps between them like in the ascend. */
		const chunkSize = r * 2 * (1 + tS * 0.25); // full cookie tile, swelling as it breaks
		/* Dark space growing behind the wedges: hides the intact cookie
		 * underneath (which DrawBackground repaints every frame) and fills the
		 * widening crack gaps. Opaque to near the rim so the intact cookie
		 * never ghosts through, with a soft edge for blending. */
		const voidAlpha = Math.min(1, t * 2); // fully dark by t=0.5
		/* Wedges fade in quickly while the hairline crack forms. */
		const chunkAlpha = Math.min(1, t * 6);
		const shake = 0.5 * t; // jitter intensity

		ctx.save();

		/* Dark void fill — grows with the crack: shadows the intact cookie
		 * under the wedges and shows through the widening gaps as the
		 * "broken space" between them, matching the ascend animation's look
		 * (there the background itself goes dark). No clip needed: the
		 * gradient stays inside the cookie silhouette. */
		if (voidAlpha > 0.01) {
			const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
			grad.addColorStop(0, 'rgba(10,8,5,' + voidAlpha.toFixed(3) + ')');
			grad.addColorStop(0.85, 'rgba(10,8,5,' + voidAlpha.toFixed(3) + ')');
			grad.addColorStop(1, 'rgba(10,8,5,' + (voidAlpha * 0.6).toFixed(3) + ')');
			ctx.fillStyle = grad;
			ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
		}

		/* Crumble chunks — each is a frame from the brokenCookie sprite. As in
		 * the ascend animation they are not clipped and slowly spin while the
		 * cookie breaks apart: the wedges drift radially outward, so the dark
		 * crack lines grow from the center toward the rim. */
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(tS * -0.1 * Math.PI * 2); // slow spin while crumbling
		ctx.globalAlpha = chunkAlpha;
		for (let i = 0; i < 10; i++) {
			const fi = CHUNK_MAP[i]; // frame index in the sprite sheet
			const angle = -(((fi + 4) % 10) / 10) * Math.PI * 2;
			const spread = tS * (50 + ((i + 2) % 3) * 25) * (r / 128); // px offset
			const jx = (Math.random() * 2 - 1) * shake * 6;
			const jy = (Math.random() * 2 - 1) * shake * 6;
			const dx = Math.sin(angle) * spread + jx;
			const dy = Math.cos(angle) * spread + jy;
			ctx.drawImage(
				Pic('brokenCookie.webp'),
				fi * 256, 0, 256, 256,
				-chunkSize / 2 + dx, -chunkSize / 2 + dy,
				chunkSize, chunkSize,
			);
		}

		/* Broken halo — in the ascend animation it is a brief flash when the
		 * cookie gives way: flash it in while the crack forms, then let it
		 * fade as the wedges separate. */
		const haloAlpha = Math.min(1, t * 8) * Math.max(0, 1 - tS * 2.5);
		if (haloAlpha > 0.01) {
			ctx.globalAlpha = haloAlpha * 0.6;
			const haloSize = chunkSize * 1.5;
			ctx.drawImage(
				Pic('brokenCookieHalo.webp'),
				-haloSize / 2, -haloSize / 2,
				haloSize, haloSize,
			);
		}
		ctx.restore();

		ctx.globalAlpha = 1;
		ctx.restore();

		/* Ready glow when fully crumbled. */
		if (p >= 1) drawReadyGlow(ctx, cx, cy, r, G.T);
	}

	/* Golden pulsing halo + ring around the fully-crumbled, clickable cookie.
	 * Copied verbatim from the original crackingCookie mod. */
	function drawReadyGlow(ctx: any, cx: number, cy: number, r: number, T: number): void {
		const pulse = 0.5 + 0.5 * Math.sin(T * 0.1);
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = 1;
		const grd = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.5);
		grd.addColorStop(0, 'rgba(255,200,90,0)');
		grd.addColorStop(0.7, 'rgba(255,180,60,' + (0.16 + 0.1 * pulse).toFixed(3) + ')');
		grd.addColorStop(1, 'rgba(255,180,60,0)');
		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 0.4 + 0.3 * pulse;
		ctx.strokeStyle = 'rgba(255,200,80,1)';
		ctx.lineWidth = 3 + 2 * pulse;
		ctx.beginPath();
		ctx.arc(cx, cy, r * (1.045 + 0.015 * pulse), 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	}

	/* ------------------------------------------------------------------ */
	/* Payoff — clicking the fully-crumbled cookie.                        */
	/* ------------------------------------------------------------------ */
	function firePayoff(G: EngineGame): void {
		const now = Date.now();
		/* Cooldown gate: bonus can only be collected every COOLDOWN_MS. */
		if (now < state.cooldownUntil) return;
		const burst = Math.max(MIN_BURST, (G.cookiesPs || 0) * BURST_SECONDS);
		G.Earn(burst);
		G.gainBuff('click frenzy', CLICK_FRENZY_SECONDS, CLICK_FRENZY_POW);
		state.totalTriggers++;
		state.progress = 0;
		state.notified = false;
		state.cooldownUntil = now + COOLDOWN_MS;
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
	/* Logic — advance the crumble with wall-clock deltas.                 */
	/* ------------------------------------------------------------------ */

	/* Shared speed helper: fraction of progress per second, capped by the
	 * MIN_CYCLE_SECONDS floor so the crumble never completes faster than that
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

		/* During cooldown the cookie is reforming — no cracking. The
		 * cooldown is a hard 2-minute gate on the payoff. */
		if (now < state.cooldownUntil) return;

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
	/* Persistence — the Custom save section (mod save()/load()).          */
	/* ------------------------------------------------------------------ */
	function save(): string {
		return JSON.stringify({
			progress: state.progress,
			totalTriggers: state.totalTriggers,
			lastTickMs: state.lastTickMs,
			notified: state.notified ? 1 : 0,
			cooldownUntil: state.cooldownUntil,
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
			state.cooldownUntil = typeof d.cooldownUntil === 'number' ? Math.max(0, d.cooldownUntil) : 0;
		} catch (e) {
			/* corrupt entry: keep defaults */
		}
	}

	function resetCrack(): void {
		state.progress = 0;
		state.notified = false;
		state.lastTickMs = Date.now();
		state.cooldownUntil = 0;
	}

	/* ------------------------------------------------------------------ */
	/* Stats menu — crumble status.                                        */
	/* ------------------------------------------------------------------ */
	function statsHtml(G: EngineGame): string {
		const cursors = G.Objects['Cursor'] ? G.Objects['Cursor'].amount : 0;
		const ready = state.progress >= 1;
		const now = Date.now();
		const inCooldown = now < state.cooldownUntil;
		const speed = currentSpeed(G);
		const pct = Math.floor(state.progress * 100);
		let eta = '';
		if (inCooldown) {
			const remaining = Math.ceil((state.cooldownUntil - now) / 1000);
			eta = remaining <= 1 ? loc('cooldown ~1 second') : loc('cooldown ~%1 seconds', String(remaining));
		} else if (ready) {
			eta = loc('click the cookie!');
		} else if (speed > 0) {
			const secs = Math.ceil((1 - state.progress) / speed);
			eta = secs <= 1 ? loc('in ~1 second') : loc('in ~%1 seconds', String(secs));
		} else {
			eta = loc('%1 cursors needed', String(MIN_CURSORS));
		}
		const bar = '<div style="height:9px;background:rgba(255,255,255,0.12);border-radius:5px;overflow:hidden;width:200px;display:inline-block;vertical-align:middle;border:1px solid rgba(255,255,255,0.15);">' +
			'<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#8a5a2b'
			+ (inCooldown ? ',#555' : ',#e0a55c') + (ready ? ',#ffdf9e' : '') + ');"></div></div>';
		return (
			'<div class="section" style="margin-top:16px;">' + loc('Cracking cookie') + '</div>' +
			'<div class="subsection">' +
			'<div class="title">' + loc('Your cursors are slowly crumbling the big cookie.') + '</div>' +
			'<div class="listing"><b>' + loc('Cursors:') + '</b> ' + Beautify(cursors) + (cursors < MIN_CURSORS ? ' <small>(' + loc('%1 needed to start cracking', String(MIN_CURSORS)) + ')</small>' : '') + '</div>' +
			'<div class="listing"><b>' + loc('Crack:') + '</b> ' + bar + ' ' + pct + '% — ' + (inCooldown ? '<span style="color:#888;">' + eta + '</span>' : ready ? '<span style="color:#ffd97a;font-weight:bold;">' + eta + '</span>' : eta) + '</div>' +
			'<div class="listing"><b>' + loc('Cracks triggered:') + '</b> ' + Beautify(state.totalTriggers) + '</div>' +
			'<div class="listing"><small style="opacity:0.75;">(' + loc('Buy more cursors to crack it faster. Clicking a fully cracked cookie pays ~%1 minutes of production plus a %2-second Click frenzy. There is a 2-minute cooldown between payoffs.', [String(BURST_SECONDS / 60), String(CLICK_FRENZY_SECONDS)]) + ')</small></div>' +
			'</div>'
		);
	}

	function appendStats(): void {
		const menu = l('menu');
		if (!menu) return;
		if (menu.querySelector('#cc3CrackStats')) return;
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
				Game.registerHook('draw', function () { drawCrumble(Game); });
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
		COOLDOWN_MS,
		reset: resetCrack,
		trigger: function () { if (window.Game) firePayoff(window.Game); },
		speed: function () { return window.Game ? currentSpeed(window.Game) : 0; },
	};
})();