/* Tutorial — a CC3 extras mod: a short coach-mark walkthrough of the core
 * loop (clicking, buildings, CpS, upgrades, golden cookies), plus a
 * permanent "?" Help panel to revisit it or browse a quick reference.
 *
 * Scope (v1): the core loop only. Prestige, minigames, seasons, wrinklers
 * etc. aren't covered yet — this is built to extend (add more Step entries,
 * or trigger a fresh coach-mark sequence from elsewhere in the engine via
 * window.Tutorial) once those are wanted.
 *
 * Built on the engine's own mod API (Game.registerMod / registerHook), same
 * as the other extras/*.ts files — no CCSE dependency. No content is
 * declared (no buildings/upgrades/achievements), so there's no 'create'
 * hook and nothing to save/load: the only persisted state is one
 * localStorage flag (whether the player has ever been offered the tour),
 * the same mechanism the language-select screen already uses.
 *
 * Coach-mark technique: #tutorialSpotlight (index.html) is a transparent,
 * position:fixed box the size of the target element; a giant box-shadow
 * darkens everything else on the page (the standard spotlight trick — no
 * clip-path or canvas needed) while its own border/pulse draws the eye to
 * the target underneath. #tutorialCallout is a plain .framed box
 * positioned next to the target with explicit left/top (recomputed every
 * draw tick, since store content reflows and the window can resize), not
 * the #prompt anchor's centered-transform layout, because it has to track
 * an arbitrary element instead of the screen center. Steps with no target
 * (target: null) skip the spotlight and center the callout, for points
 * that aren't tied to one fixed element (golden cookies spawn at a random
 * position and are hidden most of the time).
 */
import type { Game as EngineGame } from '../engine/types';

(function () {
	if (window.__cc3Tutorial) return;
	window.__cc3Tutorial = 1;

	const SEEN_KEY = 'CookieClickerTutorialSeen';

	type Step = {
		target: string | null;
		placement: 'top' | 'bottom' | 'left' | 'right';
		title: string;
		desc: string;
		// Optional "this step is done" signal, checked every draw tick against
		// a baseline captured when the step was shown (not just "count > 0" —
		// a player replaying the tour, or a veteran who reached the Help panel
		// on an existing save, would already have clicks/buildings > 0 and the
		// step would auto-advance before they could read it).
		baselineOf?: (Game: EngineGame) => number;
		advanceIf?: (Game: EngineGame, baseline: number) => boolean;
	};

	const STEPS: Step[] = [
		{
			target: 'bigCookie', placement: 'right',
			title: 'Click the cookie!',
			desc: 'This is your bakery. Click the giant cookie to bake cookies by hand.',
			baselineOf: (Game) => Game.cookieClicks,
			advanceIf: (Game, baseline) => Game.cookieClicks > baseline,
		},
		{
			target: 'products', placement: 'left',
			title: 'Buy buildings',
			desc: 'Spend cookies here on Cursors and other buildings — they bake cookies automatically, even while you’re away.',
			baselineOf: (Game) => Game.BuildingsOwned,
			advanceIf: (Game, baseline) => Game.BuildingsOwned > baseline,
		},
		{
			target: 'cookies', placement: 'bottom',
			title: 'Cookies per second',
			desc: 'The small number under your cookie count is your CpS — how fast you’re baking automatically. Watch it grow!',
		},
		{
			target: 'upgrades', placement: 'left',
			title: 'Upgrades',
			desc: 'As you buy buildings, upgrades will show up here. They boost your production — always worth grabbing when you can afford one.',
		},
		{
			target: null, placement: 'top',
			title: 'Golden cookies — and you’re set!',
			desc: 'Every so often a golden cookie appears on screen — click it fast for a temporary boost. That’s the core loop! There’s a lot more to find (prestige, minigames, seasonal events…) — click <b>Help</b> anytime to revisit this tour or browse a quick reference.',
		},
	];

	const state: { stepIndex: number; baseline: number } = { stepIndex: -1, baseline: 0 };

	/* ------------------------------------------------------------------ */
	/* Positioning.                                                        */
	/* ------------------------------------------------------------------ */
	function targetRect(id: string | null): DOMRect | null {
		if (!id) return null;
		const el = window.l(id);
		if (!el) return null;
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0 && rect.height <= 0) return null;
		return rect;
	}

	function positionCallout(step: Step) {
		const spotlight = window.l('tutorialSpotlight');
		const callout = window.l('tutorialCallout');
		if (!spotlight || !callout) return;
		const rect = targetRect(step.target);
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		if (rect) {
			spotlight.style.display = 'block';
			spotlight.style.left = (rect.left - 6) + 'px';
			spotlight.style.top = (rect.top - 6) + 'px';
			spotlight.style.width = (rect.width + 12) + 'px';
			spotlight.style.height = (rect.height + 12) + 'px';
		}
		else {
			spotlight.style.display = 'none';
		}

		callout.style.display = 'block';
		const cw = callout.offsetWidth || 240;
		const ch = callout.offsetHeight || 120;
		const gap = 20;
		let left: number, top: number;
		if (!rect) {
			left = vw / 2 - cw / 2;
			top = vh / 2 - ch / 2;
		}
		else if (step.placement === 'right') {
			left = rect.right + gap;
			top = rect.top + rect.height / 2 - ch / 2;
		}
		else if (step.placement === 'left') {
			left = rect.left - cw - gap;
			top = rect.top + rect.height / 2 - ch / 2;
		}
		else if (step.placement === 'bottom') {
			left = rect.left + rect.width / 2 - cw / 2;
			top = rect.bottom + gap;
		}
		else {// 'top'
			left = rect.left + rect.width / 2 - cw / 2;
			top = rect.top - ch - gap;
		}
		left = Math.max(8, Math.min(vw - cw - 8, left));
		top = Math.max(8, Math.min(vh - ch - 8, top));
		callout.style.left = left + 'px';
		callout.style.top = top + 'px';
	}

	/* ------------------------------------------------------------------ */
	/* Step flow.                                                          */
	/* ------------------------------------------------------------------ */
	function showStep(Game: EngineGame, i: number) {
		const step = STEPS[i];
		state.stepIndex = i;
		state.baseline = step.baselineOf ? step.baselineOf(Game) : 0;
		const isLast = i === STEPS.length - 1;
		const html =
			'<h3>' + loc(step.title) + '</h3>' +
			'<div class="tutorialDesc">' + loc(step.desc) + '</div>' +
			'<div class="tutorialButtons">' +
				'<a class="option" ' + Game.clickStr + '="window.Tutorial.skip();">' + loc('Skip tour') + '</a>' +
				'<a class="option" ' + Game.clickStr + '="window.Tutorial.advance();">' + (isLast ? loc('Finish') : loc('Next')) + '</a>' +
			'</div>' +
			'<div class="tutorialProgress">' + loc('Step %1 of %2', [i + 1, STEPS.length]) + '</div>';
		const callout = window.l('tutorialCallout');
		if (callout) callout.innerHTML = html;
		positionCallout(step);
	}

	function endTutorial() {
		state.stepIndex = -1;
		const spotlight = window.l('tutorialSpotlight');
		const callout = window.l('tutorialCallout');
		if (spotlight) spotlight.style.display = 'none';
		if (callout) callout.style.display = 'none';
		localStorageSet(SEEN_KEY, '1');
	}

	function start(Game: EngineGame) {
		localStorageSet(SEEN_KEY, '1');
		showStep(Game, 0);
	}

	function advance(Game: EngineGame) {
		if (state.stepIndex < 0) return;
		window.PlaySound('snd/tick.mp3');
		const next = state.stepIndex + 1;
		if (next >= STEPS.length) endTutorial();
		else showStep(Game, next);
	}

	function skip() {
		window.PlaySound('snd/tickOff.mp3');
		endTutorial();
	}

	function showWelcomePrompt(Game: EngineGame) {
		Game.Prompt(
			'<h3>' + loc('Welcome to Cookie Clicker!') + '</h3>' +
			'<div class="block">' + loc('Want a quick tour of the basics? It only takes a minute.') + '</div>',
			[
				[loc('Start the tour'), 'Game.ClosePrompt();window.Tutorial.start();'],
				[loc('No thanks'), 'Game.ClosePrompt();window.Tutorial.skip();'],
			]
		);
	}

	/* ------------------------------------------------------------------ */
	/* Hooks.                                                              */
	/* ------------------------------------------------------------------ */
	function draw(Game: EngineGame) {
		if (state.stepIndex < 0) return;
		// A real prompt or menu panel can cover (or hide) the target element
		// mid-tour (e.g. the player opens Options); duck out rather than draw
		// a spotlight around stale coordinates, and resume once it closes.
		if (Game.promptOn || Game.onMenu !== '') {
			const spotlight = window.l('tutorialSpotlight');
			const callout = window.l('tutorialCallout');
			if (spotlight) spotlight.style.display = 'none';
			if (callout) callout.style.display = 'none';
			return;
		}
		const step = STEPS[state.stepIndex];
		positionCallout(step);
		if (step.advanceIf && step.advanceIf(Game, state.baseline)) advance(Game);
	}

	// Only ever fires once (checkedFreshProfile latches immediately): the
	// 'check' hook itself keeps firing every few seconds for the game's own
	// unlock checks, but this mod only needs the very first firing after
	// boot, once Game.LoadSave has had time to run.
	let checkedFreshProfile = false;
	function check(Game: EngineGame) {
		if (checkedFreshProfile) return;
		// Game.T===0 is the very first tick, immediately after Game.ready=1 —
		// too early on the (rare) async fallback load path (main.ts retries
		// LoadSave from localStorage after a 500ms timeout when the
		// synchronous attempt fails), where cookiesEarned/BuildingsOwned would
		// still read as a blank save. Wait for the next firing instead (~5s
		// later), comfortably past that fallback.
		if (Game.T === 0) return;
		checkedFreshProfile = true;
		if (localStorageGet(SEEN_KEY)) return;
		// A save with any progress predates this feature (or is a returning
		// player's existing save) — don't retroactively nag them with a
		// welcome prompt; just mark it seen. The tour stays reachable from
		// the Help panel for anyone who wants it later.
		if (Game.cookiesEarned > 0 || Game.cookiesReset > 0 || Game.BuildingsOwned > 0) {
			localStorageSet(SEEN_KEY, '1');
			return;
		}
		showWelcomePrompt(Game);
	}

	/* ------------------------------------------------------------------ */
	/* Registration.                                                       */
	/* ------------------------------------------------------------------ */
	function register() {
		const Game = window.Game;
		if (!Game || typeof Game.registerMod !== 'function') return false;
		Game.registerMod('Tutorial', {
			name: 'Tutorial',
			version: '1.0-cc3',
			init: function () {
				window.Tutorial = {
					start: function () { start(Game); },
					skip: function () { skip(); },
					advance: function () { advance(Game); },
				};
				Game.registerHook('draw', function () { draw(Game); });
				Game.registerHook('check', function () { check(Game); });
			},
		});
		return true;
	}

	// Register as soon as the engine is present. Normally that's immediately
	// (the engine module evaluates first); the tiny poll is a safety net for
	// load order, same as every other extras/*.ts file.
	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () { window.clearInterval(t); }, { once: true });
	}
})();
