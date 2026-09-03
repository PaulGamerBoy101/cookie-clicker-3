/* Daily crumb — a CC3-native extras mod (not in 2.048).
 *
 * A weekly calendar of returning-player rewards, entirely local/offline (no
 * server, no cross-device sync): every local calendar day the player opens the
 * game, they collect that day's "crumb" — a small gift determined by the day
 * of the week. Consecutive days build a streak; a full 7-day streak grants a
 * weekly bonus. After a long absence (more than MAX_BACKFILL_DAYS missed days)
 * the streak resets and only today's crumb is granted.
 *
 * Day rewards (weekday → gift, all scale with current CpS):
 *   Mon  Fresh dough    5 min of production (min 500 cookies)
 *   Tue  Click fever    3 min click frenzy (×20)
 *   Wed  Sugar drop     +1 sugar lump (falls back to 10 min of production
 *                       while lumps are not yet unlocked)
 *   Thu  Bakery cash    5 min of production (min 500 cookies)
 *   Fri  Frenzy Friday  3 min frenzy (×7)
 *   Sat  Weekend feast  10 min of production (min 500 cookies)
 *   Sun  Golden Sunday  a golden cookie spawns
 *   Weekly bonus (streak % 7 == 0): 3 golden cookies + 30 min of production
 *
 * The engine's "welcome back" offline earnings run first on load, so crumbs
 * sit on top of them and are deliberately small (a few minutes of production
 * per day). A first-ever boot only records the baseline day — the first
 * crumb arrives the day after, like a daily login should.
 *
 * Persistence: registered mod save()/load() (the "Custom" save section), so
 * the streak survives save import/export and ascension (mod data is not
 * touched by Reincarnate). UI: a "Daily crumb" subsection on the Stats menu
 * (a 7-slot week strip with claimed/today markers, streak, lifetime claims,
 * next-day preview) plus a centered prompt dialog when a crumb is collected
 * (like the welcome prompt; falls back to a toast when a dialog is already
 * open). Three achievements (First crumb / On a roll / Crumb machine).
 *
 * New strings use loc() with English source text. CC3's loc() substitutes
 * %N params into the source text of ids missing from the language tables,
 * so these render correctly until a translator adds them.
 */
import type { Game as EngineGame } from '../engine/types';

(function () {
	if (window.__cc3DailyCrumb) return;

	const MOD_ID = 'CC3DailyCrumb';
	const DAY_MS = 86400000;
	const MAX_BACKFILL_DAYS = 14;
	const MIN_CRUMB_COOKIES = 500;

	/* Weekday reward table (Date.getDay(): 0=Sunday … 6=Saturday).
	 * kind: 'cookies-min' (n minutes of production, min MIN_CRUMB_COOKIES),
	 *       'buff' (gainBuff with the named type), 'golden' (spawn n golden
	 *       cookies), 'lump' (+1 sugar lump, cookie fallback when lumps are
	 *       not unlocked yet). */
	const REWARDS: Record<number, { kind: string; amount: number; buff?: string; buffName?: string; buffPow?: number; buffMin?: number; icon: string; name: string }> = {
		0: { kind: 'golden', amount: 1, icon: '🥇', name: 'Golden Sunday' },
		1: { kind: 'cookies-min', amount: 5, icon: '🍞', name: 'Fresh dough' },
		2: { kind: 'buff', amount: 0, buff: 'click frenzy', buffName: 'Click frenzy', buffPow: 20, buffMin: 3, icon: '👆', name: 'Click fever' },
		3: { kind: 'lump', amount: 1, icon: '🍬', name: 'Sugar drop' },
		4: { kind: 'cookies-min', amount: 5, icon: '🏦', name: 'Bakery cash' },
		5: { kind: 'buff', amount: 0, buff: 'frenzy', buffName: 'Frenzy', buffPow: 7, buffMin: 3, icon: '🔥', name: 'Frenzy Friday' },
		6: { kind: 'cookies-min', amount: 10, icon: '🥳', name: 'Weekend feast' },
	};
	const WEEKLY_NAME = 'Weekly crumb';
	const WEEKLY_GOLDENS = 3;
	const WEEKLY_MINUTES = 30;

	const ACHIEVEMENT_FIRST = 'First crumb';
	const ACHIEVEMENT_ROLL = 'On a roll';
	const ACHIEVEMENT_MACHINE = 'Crumb machine';

	interface CrumbState {
		/* start-of-local-day (ms) of the last collected day; null = fresh
		 * install (baseline only, no reward) */
		lastClaim: number | null;
		streak: number;
		totalClaims: number;
	}
	const state: CrumbState = { lastClaim: null, streak: 0, totalClaims: 0 };

	function startOfDay(ms: number): number {
		const d = new Date(ms);
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	}

	function weekdayOf(ms: number): number {
		return new Date(ms).getDay();
	}

	/* Grant one day's reward. Returns a human-readable line for the
	 * notification. */
	function grantDayReward(Game: EngineGame, day: number, lines: string[]): void {
		const r = REWARDS[weekdayOf(day)];
		if (!r) return;
		const cps = Game.cookiesPs || 0;
		switch (r.kind) {
			case 'cookies-min': {
				const amt = Math.max(MIN_CRUMB_COOKIES, cps * 60 * r.amount);
				Game.cookies += amt;
				Game.cookiesEarned += amt;
				lines.push(loc('%1 of production: %2 cookies', ['~' + r.amount + ' min', Beautify(amt)]));
				break;
			}
			case 'buff': {
				Game.gainBuff(r.buff, 60 * (r.buffMin || 3), r.buffPow);
				lines.push(loc('%1 %2 for %3 min', ['×' + r.buffPow, r.buffName || r.buff || '', String(r.buffMin || 3)]));
				break;
			}
			case 'lump': {
				if (typeof Game.canLumps === 'function' && Game.canLumps()) {
					Game.lumps += 1;
					lines.push('+1 ' + loc("sugar lump"));
				} else {
					const amt = Math.max(MIN_CRUMB_COOKIES, cps * 60 * 10);
					Game.cookies += amt;
					Game.cookiesEarned += amt;
					lines.push(loc('%1 of production: %2 cookies', ['~10 min', Beautify(amt)]));
				}
				break;
			}
			case 'golden': {
				for (let i = 0; i < r.amount; i++) new Game.shimmer('golden');
				lines.push(r.amount > 1 ? loc('%1 golden cookies', String(r.amount)) : loc("A golden cookie appears"));
				break;
			}
		}
	}

	function grantWeekly(Game: EngineGame, lines: string[]): void {
		for (let i = 0; i < WEEKLY_GOLDENS; i++) new Game.shimmer('golden');
		const amt = Math.max(MIN_CRUMB_COOKIES, (Game.cookiesPs || 0) * 60 * WEEKLY_MINUTES);
		Game.cookies += amt;
		Game.cookiesEarned += amt;
		lines.push(loc('Weekly crumb: %1 golden cookies + %2 cookies', [String(WEEKLY_GOLDENS), Beautify(amt)]));
	}

	/* Announce a collection like the engine's welcome prompt: a centered
	 * Game.Prompt dialog (title, reward lines, streak, a Collect button).
	 * Falls back to the old toast notification when a prompt dialog is
	 * already open (never clobber another dialog, e.g. the tutorial's
	 * welcome prompt) or while an ascend animation is running. Rewards are
	 * granted in tryClaim before this runs — the dialog is the announcement,
	 * so day bookkeeping never waits on the player clicking it.
	 * lastAnnouncement mirrors what was shown so the QA probe can assert the
	 * rendered text. */
	let lastAnnouncement = '';
	function announce(Game: EngineGame, days: number, lines: string[]): void {
		const title = loc("Daily crumb");
		const body =
			'<div class="block">' + loc("You collected %1 %2 of crumbs!", [String(days), days > 1 ? loc("days") : loc("day")]) + '</div>' +
			'<div class="block">' + lines.join('<br>') + '</div>' +
			'<div class="block">' + loc("Streak: %1", [String(state.streak)]) + '</div>';
		lastAnnouncement = title + ' ' + body;
		const canPrompt = !Game.promptOn && !Game.OnAscend && Game.AscendTimer <= 0 && !Game.ReincarnateTimer;
		if (canPrompt) {
			Game.Prompt(
				'<h3>' + title + '</h3>' + body,
				[[loc('Collect'), 'Game.ClosePrompt();PlaySound(\'snd/tick.mp3\');']]
			);
		} else {
			const summary = lines.length > 3 ? lines[0] + '  ·  +' + (lines.length - 1) + loc(" more") : lines.join('  ·  ');
			Game.Notify(title, loc("Collected %1 %2: %3", [String(days), days > 1 ? loc("days") : loc("day"), summary]), [22, 6]);
		}
	}

	/* Collect every missed day up to today (capped), update the streak,
	 * grant rewards + weekly bonus, announce. No-op when nothing is owed. */
	function tryClaim(Game: EngineGame): boolean {
		const today = startOfDay(Date.now());
		if (state.lastClaim === null) {
			// Fresh install: record today as the baseline (no reward — the
			// first crumb arrives tomorrow). Do NOT set Game.toSave here:
			// on a profile with no save, the engine's Init() schedules a
			// brute-force retry load of the localStorage save ~500 ms later,
			// and a save written inside that window would be read straight
			// back over the live state (T reset, buildings zeroed). The
			// baseline instead rides on the first natural save (the autosave
			// gate opens after 10 s, and any purchase saves immediately).
			state.lastClaim = today;
			return false;
		}
		if (state.lastClaim >= today) return false;
		const days = Math.max(1, Math.round((today - state.lastClaim) / DAY_MS));

		const lines: string[] = [];
		if (days > MAX_BACKFILL_DAYS) {
			// gap too long: streak breaks, today is the first day of a new one
			state.streak = 0;
			state.totalClaims += 1;
			state.streak += 1;
			grantDayReward(Game, today, lines);
			if (state.streak % 7 === 0) grantWeekly(Game, lines);
			state.lastClaim = today;
		} else {
			for (let i = 1; i <= days; i++) {
				const day = state.lastClaim + i * DAY_MS;
				state.streak += 1;
				state.totalClaims += 1;
				grantDayReward(Game, day, lines);
				if (state.streak % 7 === 0) grantWeekly(Game, lines);
			}
			state.lastClaim = today;
		}

		if (state.totalClaims >= 1) Game.Win(ACHIEVEMENT_FIRST);
		if (state.streak >= 7) Game.Win(ACHIEVEMENT_ROLL);
		if (state.streak >= 30) Game.Win(ACHIEVEMENT_MACHINE);

		announce(Game, days, lines);
		Game.toSave = true;
		return true;
	}

	/* ------------------------------------------------------------------ */
	/* Persistence — the Custom save section (mod save()/load).           */
	/* ------------------------------------------------------------------ */
	function save(): string {
		return JSON.stringify({
			lastClaim: state.lastClaim,
			streak: state.streak,
			totalClaims: state.totalClaims,
		});
	}

	function load(str: string): void {
		if (!str) return;
		try {
			const d = JSON.parse(str);
			if (!d) return;
			state.lastClaim = typeof d.lastClaim === 'number' ? d.lastClaim : null;
			state.streak = Math.max(0, d.streak | 0);
			state.totalClaims = Math.max(0, d.totalClaims | 0);
		} catch (e) {
			/* corrupt entry: keep defaults */
		}
	}

	/* ------------------------------------------------------------------ */
	/* Stats menu — the weekly calendar.                                   */
	/* ------------------------------------------------------------------ */
	function calendarHtml(): string {
		const today = startOfDay(Date.now());
		/* display order Mon..Sun (getDay 1,2,3,4,5,6,0) */
		const order = [1, 2, 3, 4, 5, 6, 0];
		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		let cells = '';
		for (let i = 0; i < order.length; i++) {
			const dow = order[i];
			const r = REWARDS[dow];
			/* day of THIS week for this weekday */
			const thisWeek = today + (dow - weekdayOf(today)) * DAY_MS;
			const isToday = thisWeek === today;
			const claimed = state.lastClaim !== null && thisWeek < today && state.lastClaim >= thisWeek;
			const future = thisWeek > today;
			const style = isToday
				? 'border-color:#b84;box-shadow:0 0 8px rgba(255,180,60,0.5);'
				: claimed
					? 'opacity:0.85;'
					: 'opacity:' + (future ? '0.45' : '0.6') + ';';
			cells +=
				'<div class="listing" style="display:inline-block;width:64px;margin:0 3px 8px;padding:6px 2px;text-align:center;vertical-align:top;' + style + '">' +
				'<div style="font-size:11px;font-weight:bold;">' + dayNames[dow] + '</div>' +
				'<div style="font-size:9px;">' + (isToday ? loc("today") : claimed ? '✓' : '') + '</div>' +
				'<div style="font-size:20px;">' + r.icon + '</div>' +
				'<div style="font-size:9px;opacity:0.8;">' + r.name + '</div>' +
				'</div>';
		}
		const nextDow = (weekdayOf(today) + 1) % 7;
		const next = REWARDS[nextDow];
		const lastStr = state.lastClaim === null
			? loc("none yet — your first crumb arrives tomorrow")
			: new Date(state.lastClaim).toLocaleDateString();
		return (
			'<div class="section" style="margin-top:16px;">' + loc("Daily crumb") + '</div>' +
			'<div class="subsection">' +
			'<div class="title">' + loc("This week") + '</div>' +
			'<div style="text-align:center;">' + cells + '</div>' +
			'<div class="listing"><b>' + loc("Streak:") + '</b> ' + Beautify(state.streak) + (state.streak === 1 ? loc(" day") : loc(" days")) +
			' <small>(' + loc("collected %1 crumbs all time", String(state.totalClaims)) + ')</small></div>' +
			'<div class="listing"><b>' + loc("Last crumb:") + '</b> ' + lastStr + '</div>' +
			'<div class="listing"><b>' + loc("Tomorrow:") + '</b> ' + next.icon + ' ' + next.name + '</div>' +
			'<div class="listing"><b>' + loc("Weekly bonus:") + '</b> 🎂 ' + WEEKLY_NAME + ' — ' +
			loc("%1 golden cookies + ~%2 min of production (every 7-day streak)", [String(WEEKLY_GOLDENS), String(WEEKLY_MINUTES)]) + '</div>' +
			'<div class="listing"><small style="opacity:0.75;">(' + loc("Come back each day to build your streak. After %1 missed days it resets and only today is collected.", String(MAX_BACKFILL_DAYS)) + ')</small></div>' +
			'</div>'
		);
	}

	function appendStats(): void {
		const menu = l('menu');
		if (!menu) return;
		if (menu.querySelector('#cc3CrumbStats')) return; // menu redraws reuse the DOM
		const wrap = document.createElement('div');
		wrap.id = 'cc3CrumbStats';
		wrap.className = 'selectable';
		wrap.innerHTML = calendarHtml();
		menu.appendChild(wrap);
	}

	/* ------------------------------------------------------------------ */
	/* Content declaration — 3 achievements (vanilla=0, 'create' hook).   */
	/* ------------------------------------------------------------------ */
	const declared = { done: false };

	function declare(Game: EngineGame): void {
		if (declared.done) return;
		declared.done = true;
		const a1 = new Game.Achievement(ACHIEVEMENT_FIRST, 'Collect your first daily crumb.', [1, 26]);
		a1.order = 200000;
		const a2 = new Game.Achievement(ACHIEVEMENT_ROLL, 'Reach a ' + loc("%1-day streak", '7') + '.', [2, 26]);
		a2.order = 200001;
		const a3 = new Game.Achievement(ACHIEVEMENT_MACHINE, 'Reach a ' + loc("%1-day streak", '30') + '.', [3, 26]);
		a3.order = 200002;
		if (typeof window.LocalizeUpgradesAndAchievs === 'function') window.LocalizeUpgradesAndAchievs();
		Game.recalculateGains = 1;
	}

	/* ------------------------------------------------------------------ */
	/* Registration.                                                      */
	/* ------------------------------------------------------------------ */
	function register(): boolean {
		const Game = window.Game;
		if (!Game || typeof Game.registerMod !== 'function') return false;
		Game.registerMod(MOD_ID, {
			name: 'Daily crumb',
			version: '1.0-cc3',
			init: function () {
				Game.registerHook('create', function () { declare(Game); });
				Game.registerHook('check', function () {
					if (Game.time) tryClaim(Game);
				});
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

	/* Test/inspection surface (used by ?qa=dailycrumb): the live state, the
	 * persistence round-trip, and a forced claim for the probe. */
	window.__cc3DailyCrumb = {
		state,
		save,
		load,
		startOfDay,
		claim: function () { return tryClaim(window.Game); },
		lastAnnouncement: function () { return lastAnnouncement; },
	};
})();
