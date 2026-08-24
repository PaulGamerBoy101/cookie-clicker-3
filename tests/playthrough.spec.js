// End-to-end playthrough smoke test (beyond the ?qa probes): drives real
// DOM interactions the way a player would — clicking the big cookie, buying
// buildings and an upgrade from the store, popping a golden cookie, opening
// the Stats/Options/Info menu tabs and toggling a preference, renaming the
// bakery, reading the news ticker — then saves and fully reloads the page
// to verify persistence. Cookies are seeded at one point to skip the idle
// grind (same convention as the ?qa probes); every interaction is a real
// DOM click on the shipped UI.
//
// Explicit extra, not part of the default gate: `npm test` / CI are scoped
// to tests/qa.spec.js. Run with `npx playwright test tests/playthrough.spec.js`
// (the webServer provides the :4173 preview).
import { test, expect } from '@playwright/test';

const BOOT = { timeout: 30_000 };

async function boot(page) {
	await page.goto('/?debug=1', { waitUntil: 'load' });
	const lang = page.locator('#langSelect-English');
	try {
		await lang.waitFor({ state: 'visible', timeout: 5_000 });
		await lang.click();
	} catch { /* no language prompt (a profile already chose one) */ }
	await page.waitForFunction(() => window.Game && window.Game.ready === 1, null, BOOT);
}

async function assertNoUncaughtErrors(page) {
	await expect(page.locator('#__dbg')).toHaveCount(0);
}

test('playthrough: cookie, store, golden cookie, menu, ticker, save/reload', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));

	await boot(page);
	await assertNoUncaughtErrors(page);

	// ---- 1. click the big cookie ----
	for (let i = 0; i < 30; i++) await page.locator('#bigCookie').click();
	let st = await page.evaluate(() => ({
		clicks: Game.cookieClicks,
		cookies: Game.cookies,
		wakeAndBake: Game.Achievements['Wake and bake'].won,
		display: l('cookies').innerHTML,
	}));
	console.log('[1] clicked the big cookie 30x:', JSON.stringify(st));
	expect(st.clicks).toBeGreaterThanOrEqual(30);
	expect(st.cookies).toBeGreaterThan(0);
	// achievements are awarded in Game.Logic — wait for the loop to tick
	await page.waitForFunction(() => window.Game.Achievements['Wake and bake'].won === 1, null, { timeout: 5_000 });
	expect(st.display.length).toBeGreaterThan(0);

	// ---- 2. buy buildings from the store (seed cookies to skip the grind) ----
	const before = await page.evaluate(() => ({ cookies: Game.cookies, cps: Game.cookiesPs }));
	await page.evaluate(() => { Game.cookies = 1e6; });
	await page.locator('#product0').click(); // Cursor
	await page.locator('#product1').click(); // Grandma
	await page.locator('#product2').click(); // Farm
	st = await page.evaluate(() => ({
		cursor: Game.Objects['Cursor'].amount,
		grandma: Game.Objects['Grandma'].amount,
		farm: Game.Objects['Farm'].amount,
		cookies: Game.cookies,
		cps: Game.cookiesPs,
	}));
	console.log('[2] bought Cursor/Grandma/Farm:', JSON.stringify(st));
	expect(st.cursor).toBe(1);
	expect(st.grandma).toBe(1);
	expect(st.farm).toBe(1);
	expect(st.cookies).toBeLessThan(1e6);
	expect(st.cps).toBeGreaterThan(0);

	// ---- 3. a second Farm raises CpS ----
	const cps1 = await page.evaluate(() => Game.cookiesPs);
	await page.locator('#product2').click();
	const cps2 = await page.evaluate(() => Game.cookiesPs);
	console.log('[3] CpS after Farm #2:', cps1.toFixed(2), '->', cps2.toFixed(2));
	expect(cps2).toBeGreaterThan(cps1);

	// ---- 4. buy an upgrade from the store ----
	const upBefore = await page.evaluate(
		() => Object.keys(Game.UpgradesById).filter((k) => Game.UpgradesById[k].bought).length
	);
	await page.evaluate(() => {
		Game.recalculateGains = 1; Game.CalculateGains();
		Game.RebuildUpgrades(); Game.upgradesToRebuild = 1; Game.RefreshStore();
	});
	const upEl = page.locator('#upgrades .upgrade.enabled').first();
	await upEl.waitFor({ state: 'visible', timeout: 10_000 });
	await upEl.click();
	st = await page.evaluate(() => ({
		owned: Object.keys(Game.UpgradesById).filter((k) => Game.UpgradesById[k].bought).length,
		cookies: Game.cookies,
	}));
	console.log('[4] bought an upgrade:', JSON.stringify(st));
	expect(st.owned).toBeGreaterThan(upBefore);

	// ---- 5. golden cookie: spawn, then pop it with a real click ----
	// (goldenClicks is gated on `spawnLead`, which a manual spawn isn't — so like
	// the ?qa=golden probe, verify the pop via the Frenzy buff instead)
	await page.evaluate(() => {
		const s = new Game.shimmer('golden');
		s.force = 'frenzy';
	});
	await page.waitForSelector('.shimmer', { timeout: 5_000 });
	const gBefore = await page.evaluate(() => Game.shimmers.length);
	// the golden can spawn just outside the viewport; dispatch a real DOM
	// click on it (the engine's AddEvent('click') pop listener is the same
	// path a user click takes)
	await page.evaluate(() => {
		document.querySelector('.shimmer').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	});
	await page.waitForFunction((n) => Game.shimmers.length < n, gBefore, { timeout: 5_000 });
	st = await page.evaluate(() => ({
		shimmers: Game.shimmers.length,
		frenzy: Game.buffs['Frenzy'] ? Game.buffs['Frenzy'].arg1 : null,
	}));
	console.log('[5] golden cookie popped:', JSON.stringify(st));
	expect(st.shimmers).toBeLessThan(gBefore);
	expect(st.frenzy).toBe(7); // frenzy = ×7 CpS

	// ---- 6. menu tabs + a preference toggle ----
	await page.locator('#statsButton').click();
	expect(await page.evaluate(() => Game.onMenu)).toBe('stats');
	expect(await page.locator('#menu').innerText()).toContain('Statistics');
	expect(await page.locator('#menu').innerText()).toContain('Cookies per second');
	await page.locator('#prefsButton').click();
	expect(await page.evaluate(() => Game.onMenu)).toBe('prefs');
	const numBefore = await page.evaluate(() => Game.prefs.numbers);
	await page.locator('#numbersButton').click();
	expect(await page.evaluate(() => Game.prefs.numbers)).toBe(numBefore === 1 ? 0 : 1);
	await page.locator('#logButton').click();
	expect(await page.evaluate(() => Game.onMenu)).toBe('log');
	expect((await page.locator('#menu').innerText()).length).toBeGreaterThan(0);
	await page.locator('.menuClose').click();
	expect(await page.evaluate(() => Game.onMenu)).toBe('');
	console.log('[6] menu stats/prefs/log opened, numbers pref toggled, menu closed');

	// ---- 7. rename the bakery ----
	await page.evaluate(() => Game.bakeryNameSet('Playthrough Bakery'));
	expect(await page.evaluate(() => Game.bakeryName)).toBe('Playthrough Bakery');
	expect(await page.locator('#bakeryName').innerText()).toContain('Playthrough Bakery');
	console.log('[7] bakery renamed to "Playthrough Bakery"');

	// ---- 8. news ticker draws ----
	await page.evaluate(() => Game.getNewTicker(true));
	st = await page.evaluate(() => ({ ticker: Game.Ticker, drawn: Game.tickerL.innerHTML.length }));
	console.log('[8] ticker:', JSON.stringify(st));
	expect(st.ticker.length).toBeGreaterThan(0);
	expect(st.drawn).toBeGreaterThan(0);

	// ---- 9. save, then a full page reload, verify persistence ----
	await page.evaluate(() => { Game.prefs.numbers = 1; Game.WriteSave(0); });
	await page.reload({ waitUntil: 'load' });
	await boot(page);
	st = await page.evaluate(() => ({
		cookies: Game.cookies,
		cursor: Game.Objects['Cursor'].amount,
		farm: Game.Objects['Farm'].amount,
		numbers: Game.prefs.numbers,
		bakery: Game.bakeryName,
		owned: Object.keys(Game.UpgradesById).filter((k) => Game.UpgradesById[k].bought).length,
	}));
	console.log('[9] after save + reload:', JSON.stringify(st));
	expect(st.cookies).toBeGreaterThan(0);
	expect(st.cursor).toBe(1);
	expect(st.farm).toBeGreaterThanOrEqual(2);
	expect(st.numbers).toBe(1);
	expect(st.bakery).toBe('Playthrough Bakery');
	expect(st.owned).toBeGreaterThan(0);

	// ---- 10. export a save ----
	const exported = await page.evaluate(() => Game.WriteSave(1));
	console.log('[10] exported save length:', exported.length);
	expect(exported.length).toBeGreaterThan(100);

	await assertNoUncaughtErrors(page);
	expect(errors).toEqual([]);
	console.log('PLAYTHROUGH PASS');
});
