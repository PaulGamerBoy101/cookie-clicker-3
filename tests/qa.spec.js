// QA probe suite — drives the in-page `?debug=1&qa=…` probes (src/main.js)
// in headless Chromium against the production build and asserts each probe's
// PASS report. Each test gets a fresh browser context (no localStorage), so
// every load starts from a fresh profile and must pass the language prompt
// first (boot() handles it). Two probes (offline, a11y) reload the page
// themselves; Playwright's retrying locators ride through the reload.
import { test, expect } from '@playwright/test';

const BOOT = { timeout: 30_000 };

/**
 * Load the game with `?debug=1` + `query`, dismiss the fresh-profile
 * language prompt (pick English), and wait for the engine to boot.
 */
async function boot(page, query) {
	await page.goto(`/?debug=1${query}`, { waitUntil: 'load' });
	const lang = page.locator('#langSelect-EN');
	try {
		await lang.waitFor({ state: 'visible', timeout: 5_000 });
		await lang.click();
	} catch {
		/* no language prompt (a profile already chose one) */
	}
	await page.waitForFunction(() => window.Game && window.Game.ready === 1, null, BOOT);
}

/**
 * Wait until the probe's #__dbgqa report contains `doneRe` (its terminal
 * PASS marker — phased probes update the same element in place) and return
 * the full report text.
 */
async function qaReport(page, doneRe, timeout = 60_000) {
	const el = page.locator('#__dbgqa');
	await expect(el).toContainText(doneRe, { timeout });
	return el.innerText();
}

/** No uncaught errors were painted onto the debug error surface. */
async function assertNoUncaughtErrors(page) {
	await expect(page.locator('#__dbg')).toHaveCount(0);
}

test('bare ?qa: seeds the minigame buildings and opens the Garden', async ({ page }) => {
	await boot(page, '&qa');
	await page.waitForFunction(
		() => {
			const G = window.Game;
			if (!G || !G.Objects) return false;
			return (
				['Farm', 'Bank', 'Temple', 'Wizard tower'].every((n) => G.Objects[n] && G.Objects[n].minigameLoaded) &&
				G.Objects['Farm'].onMinigame
			);
		},
		null,
		{ timeout: 30_000 }
	);
	await assertNoUncaughtErrors(page);
});

test('?qa=cookies: seeds cookies for light store-buy testing', async ({ page }) => {
	await boot(page, '&qa=cookies');
	await page.waitForFunction(() => window.Game.cookies >= 1e6, null, BOOT);
	await assertNoUncaughtErrors(page);
});

test('?qa=golden: golden-cookie click path spawns a frenzy buff', async ({ page }) => {
	await boot(page, '&qa=golden');
	const report = await qaReport(page, /Frenzy buff=ACTIVE/);
	expect(report).not.toMatch(/ERROR/);
	expect(report).toMatch(/baseline CpS=/);
	await assertNoUncaughtErrors(page);
});

test('?qa=save: save export -> import round-trip restores state', async ({ page }) => {
	await boot(page, '&qa=save');
	const report = await qaReport(page, /PASS: export->import round-trip restored state/);
	expect(report).not.toMatch(/ERROR/);
});

test('?qa=perf: 4-minigame frame cost holds the 30-tick loop target', async ({ page }) => {
	await boot(page, '&qa=perf&qlvl=1');
	// The probe samples the loop for ~3s before writing its verdict.
	const report = await qaReport(page, /verdict: OK/, 90_000);
	expect(report).toMatch(/target Game\.fps = 30/);
	expect(report).not.toMatch(/BELOW target/);
});

test('?qa=ascend: ascension grants chips+prestige, reincarnate resets the run', async ({ page }) => {
	await boot(page, '&qa=ascend');
	// ~5s ascend intro + settle time between phases.
	const report = await qaReport(
		page,
		/PASS: ascend granted chips\+prestige, reincarnate reset the run and kept prestige state/,
		90_000
	);
	expect(report).not.toMatch(/FAIL/);
});

test('?qa=offline: offline gain (timeOffline x CpS) granted on load', async ({ page }) => {
	await boot(page, '&qa=offline');
	// Phase 1 seeds + reloads the page; phase 2 (fresh load, language persisted)
	// verifies the gain the engine computed during boot.
	const report = await qaReport(
		page,
		/PASS: offline gain granted on load/,
		90_000
	);
	expect(report).not.toMatch(/ERROR/);
});

test('?qa=special: seasonal specials (Santa + Dragon) unlock and act', async ({ page }) => {
	await boot(page, '&qa=special');
	const report = await qaReport(page, /\[QA-special\] PASS: seasonal specials/);
	expect(report).not.toMatch(/ERROR/);
	expect(report).toMatch(/PASS: Santa tab present/);
	expect(report).toMatch(/PASS: Dragon tab present/);
});

test('?qa=a11y: screen-reader mode renders store products as accessible buttons', async ({ page }) => {
	await boot(page, '&qa=a11y');
	// Phase 1 enables the pref + reloads; phase 2 checks the rendered DOM.
	const report = await qaReport(
		page,
		/PASS: screen-reader mode renders store products as accessible/
		,
		90_000
	);
	expect(report).not.toMatch(/ERROR/);
});

test('?qa=wrinkler: wrinkler spawns, sucks 5% CpS, and pops for a refund', async ({ page }) => {
	await boot(page, '&qa=wrinkler');
	const report = await qaReport(page, /PASS: wrinkler spawns, sucks 5% CpS, and pops/, 90_000);
	expect(report).not.toMatch(/FAIL/);
	expect(report).not.toMatch(/ERROR/);
});

test('?qa=onecol: one-column responsive mode (forced) verified end to end', async ({ page }) => {
	await boot(page, '&qa=onecol&oneCol=1');
	const report = await qaReport(page, /PASS: one-column responsive mode verified/);
	expect(report).not.toMatch(/FAIL/);
	expect(report).not.toMatch(/ERROR/);
});

test('?qa=icon: store product icons resolve to a sprite (no missing backgrounds)', async ({ page }) => {
	await boot(page, '&qa=icon');
	const report = await qaReport(page, /productIcon1/, 90_000);
	expect(report).not.toMatch(/NO BACKGROUND!/);
	expect(report).not.toMatch(/\(not found\)/);
});

test('?qa=anim: the CC3 polish (v3.0 animation pass) verified end to end', async ({ page }) => {
	await boot(page, '&qa=anim&oneCol=1');
	// Counter sampling (~1s) + the ~2.5s ascend-intro breakpoint wait +
	// the 1s reincarnate animation.
	const report = await qaReport(
		page,
		/PASS: the CC3 polish \(v3\.0 animation pass\) verified/,
		90_000
	);
	expect(report).not.toMatch(/FAIL/);
	expect(report).not.toMatch(/ERROR/);
});

test('reduced-motion: the whole CC3 polish is disabled, the game still runs', async ({ browser }) => {
	const context = await browser.newContext({ reducedMotion: 'reduce' });
	const page = await context.newPage();
	await boot(page, '&oneCol=1');
	await page.waitForFunction(() => window.__cc3Anim && window.Game.ready === 1, null, BOOT);
	const state = await page.evaluate(() => ({
		noMotion: document.body.classList.contains('noMotion'),
		counter: window.__cc3Anim.counter,
		wrapperAnim: getComputedStyle(document.getElementById('wrapper')).animationName,
	}));
	// the JS opt-out is published for the CSS gates ...
	expect(state.noMotion).toBe(true);
	expect(state.counter.active).toBe(false);
	expect(state.counter.frames).toBe(0);
	// ... and the CSS gates are quiet
	expect(state.wrapperAnim).toBe('none');
	// the engine's own 30Hz render still drives the counter (the display works)
	await page.evaluate(() => { window.Game.cookies += 1e6; });
	await page.waitForFunction(() => window.Game.cookiesd >= 999_999, null, BOOT);
	// notes still appear, just without the slide-in
	await page.evaluate(() => window.Game.Notify('QA', 'reduced motion', [10, 10], 6));
	const note = page.locator('#notes .note').first();
	await expect(note).toBeVisible({ timeout: 5_000 });
	expect(await note.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
	// column switching still works, animationless
	await page.evaluate(() => document.querySelector('#oneColTabs button[data-col="middle"]').click());
	expect(await page.locator('#sectionMiddle').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
	await context.close();
});
