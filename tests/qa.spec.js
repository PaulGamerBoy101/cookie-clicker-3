// QA probe suite — drives the in-page `?debug=1&qa=…` probes (src/main.ts)
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

test('?qa=content: typed content validation and economy report pass', async ({ page }) => {
	await boot(page, '&qa=content');
	const report = await qaReport(page, /PASS: typed content validation and economy report verified/);
	expect(report).not.toMatch(/FAIL/);
	expect(report).not.toMatch(/ERROR/);
	expect(report).toMatch(/Grandma < Cats < Farm/);
	expect(report).toMatch(/next purchase cost\/marginal CpS\/payback: PASS/);
	expect(report).toMatch(/Cat\/Farm achievements registered: PASS/);
	expect(report).toMatch(/strategy runner compares 3 purchase policies: PASS/);
	expect(report).toMatch(/cross-building balance audit covers every building and level: PASS/);
	expect(report).toMatch(/full analysis covers all buildings\/upgrades, categories, and restores counts: PASS/);
});

test('Cursor upgrades: purchased finger sprite is applied to the cookie hands', async ({ page }) => {
	await boot(page, '');
	await page.waitForFunction(() => window.Game && window.Game.ready === 1 && window.Game.LeftBackground, null, BOOT);
	const state = await page.evaluate(async () => {
		const G = window.Game;
		const cursor = G.Objects.Cursor;
		const upgrade = G.Upgrades['Reinforced index finger'];
		cursor.amount = 1;
		cursor.unlocked = 1;
		cursor.bought = 1;
		cursor.refresh();
		await new Promise((resolve) => setTimeout(resolve, 500));
		const ctx = G.LeftBackground;
		const originalDraw = ctx.drawImage.bind(ctx);
		let iconDraws = 0;
		let iconSource = null;
		ctx.drawImage = function (...args) {
			const src = args[0]?.src || '';
			if (src.includes('/img/icons.webp') && Number(args[3]) === 48 && Number(args[4]) === 48) {
				iconDraws++;
				iconSource = [Number(args[1]), Number(args[2])];
			}
			return originalDraw(...args);
		};
		G.DrawBackground();
		const beforePurchase = iconDraws;
		G.cookies = 1e6;
		upgrade.unlocked = 1;
		upgrade.buy();
		await new Promise((resolve) => setTimeout(resolve, 500));
		G.DrawBackground();
		return {
			bought: upgrade.bought,
			beforePurchase,
			iconDraws,
			iconSource,
			expectedSource: [upgrade.icon[0] * 48, upgrade.icon[1] * 48],
		};
	});
	expect(state.bought).toBe(1);
	expect(state.beforePurchase).toBe(0);
	expect(state.iconDraws).toBeGreaterThan(0);
	expect(state.iconSource).toEqual(state.expectedSource);
	await assertNoUncaughtErrors(page);
});

test('Grandmas: cozy idle motion stays grounded and purchases get a bounce state', async ({ page }) => {
	await boot(page, '');
	await page.waitForFunction(() => window.Game && window.Game.ready === 1 && window.Game.Objects.Grandma && window.Game.Objects.Grandma.canvas, null, BOOT);
	const state = await page.evaluate(async () => {
		const G = window.Game;
		const grandma = G.Objects.Grandma;
		grandma.amount = 3;
		grandma.unlocked = 1;
		grandma.bought = 3;
		grandma.refresh();
		await new Promise((resolve) => setTimeout(resolve, 500));
		const firstFrame = grandma.canvas.toDataURL();
		const positionsBefore = grandma.pics.map((pic) => [pic.x, pic.y]);
		await new Promise((resolve) => setTimeout(resolve, 500));
		const secondFrame = grandma.canvas.toDataURL();
		const positionsAfter = grandma.pics.map((pic) => [pic.x, pic.y]);
		grandma.amount = 4;
		grandma.bought = 4;
		grandma.refresh();
		await new Promise((resolve) => setTimeout(resolve, 150));
		const newGrandma = grandma.pics.find((pic) => pic.id === 3);
		return {
			animationChanged: firstFrame !== secondFrame,
			positionsStable: JSON.stringify(positionsBefore) === JSON.stringify(positionsAfter),
			newGrandmaBorn: newGrandma && typeof newGrandma.born === 'number',
		};
	});
	expect(state.animationChanged).toBe(true);
	expect(state.positionsStable).toBe(true);
	expect(state.newGrandmaBorn).toBe(true);
	await assertNoUncaughtErrors(page);
});

test('Cats: 24 balanced upgrades use the Protein spritesheet and apply mixed bonuses', async ({ page }) => {
	await boot(page, '');
	await page.waitForFunction(() => window.Game && window.Game.ready === 1 && window.Game.Objects.Cats, null, BOOT);
	const state = await page.evaluate(async () => {
		const G = window.Game;
		const cats = G.Objects.Cats;
		const baseNames = [
			'Cardboard box basics','Sunbeam training','Whisker refinement','Midnight zoomies',
			'Tuna-grade nutrition','Claw-powered kneading','Purrfect production','Nine-lives efficiency',
			'Feline assembly','Astral catnaps','Infinite yarn loop','Quantum litter boxes',
			'Cosmic whisker arrays','Protein singularity'
		];
		const specialNames = [
			'Grandma-approved recipes','Purrfect timing','Cat café loyalty','Protein-rich kibble',
			'Feather wand drills','Sunbeam perches','Catnip cultivation','Scratching-post ovens',
			'Climbing shelves','Nine lives logistics'
		];
		const allNames = baseNames.concat(specialNames);
		const load = (name) => new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
			image.onerror = reject;
			image.src = name;
		});
		const sheet = await load('img/cat-upgrades/protein_spritesheet.png');
		cats.amount = 75;
		cats.unlocked = 1;
		cats.bought = 75;
		cats.buyFunction();
		cats.refresh();
		const upgrades = allNames.map((name) => G.Upgrades[name]);
		const basePrices = baseNames.map((name) => G.Upgrades[name].basePrice);
		const iconCount = upgrades.filter((upgrade) => upgrade && upgrade.icon[2] === 'img/cat-upgrades/protein_spritesheet.png').length;
		const unlockedAt75 = specialNames.slice(0, 4).every((name) => G.Upgrades[name].unlocked === 1);
		// Verify all 24 Cat upgrades are tied to the Cats building with tier keys
		const buildingTieCount = upgrades.filter((u) => u && u.buildingTie && u.buildingTie.name === 'Cats').length;
		const tierCount = upgrades.filter((u) => u && u.tier).length;
		const tieredInBuilding = Object.keys(cats.tieredUpgrades || {}).length;
		const grandma = G.Objects.Grandma;
		grandma.amount = 10;
		for (const name of allNames) G.Upgrades[name].bought = 0;
		G.CalculateGains();
		const baseline = { catCps: cats.storedCps, cps: G.cookiesPs, click: G.computedMouseCps };
		for (const name of ['Grandma-approved recipes','Purrfect timing','Cat café loyalty','Protein-rich kibble']) G.Upgrades[name].bought = 1;
		G.CalculateGains();
		return {
			registered: upgrades.filter(Boolean).length,
			sheet,
			iconCount,
			basePrices,
			unlockedAt75,
			buildingTieCount,
			tierCount,
			tieredInBuilding,
			boosted: { catCps: cats.storedCps, cps: G.cookiesPs, click: G.computedMouseCps },
			baseline,
		};
	});
	expect(state.registered).toBe(24);
	expect(state.sheet).toEqual([288, 192]);
	expect(state.iconCount).toBe(24);
	expect(state.basePrices.every((price, index, prices) => index === 0 || price > prices[index - 1])).toBe(true);
	expect(state.unlockedAt75).toBe(true);
	expect(state.buildingTieCount).toBe(24);
	expect(state.tierCount).toBe(24);
	expect(state.tieredInBuilding).toBe(24);
	expect(state.boosted.catCps).toBeGreaterThan(state.baseline.catCps);
	expect(state.boosted.cps).toBeGreaterThan(state.baseline.cps);
	expect(state.boosted.click).toBeGreaterThan(state.baseline.click);
	await assertNoUncaughtErrors(page);
});

test('Cats: save-safe building slot, Grandma/Farm ordering, and animated sprites', async ({ page }) => {
	await boot(page, '');
	await page.waitForFunction(() => window.Game.Objects && window.Game.Objects.Cats && window.Game.Objects.Cats.canvas, null, BOOT);
	const state = await page.evaluate(async () => {
		const G = window.Game;
		const cats = G.Objects.Cats;
		const load = (name) => new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
			image.onerror = reject;
			image.src = name;
		});
		const sprite = await load('img/cats/idle.png');
		const background = await load('img/cats/Summer1.png');
		cats.amount = 3;
		cats.unlocked = 1;
		cats.refresh();
		await new Promise((resolve) => setTimeout(resolve, 600));
		const firstFrame = cats.canvas.toDataURL();
		await new Promise((resolve) => setTimeout(resolve, 600));
		return {
			ids: { grandma: G.Objects.Grandma.id, cats: cats.id, farm: G.Objects.Farm.id },
			prices: { grandma: G.Objects.Grandma.basePrice, cats: cats.basePrice, farm: G.Objects.Farm.basePrice },
			cps: { grandma: G.Objects.Grandma.baseCps, cats: cats.baseCps, farm: G.Objects.Farm.baseCps },
			rows: [...document.querySelectorAll('#rows > .row')].slice(0, 3).map((el) => el.id),
			products: [...document.querySelectorAll('#products > .product')].slice(1, 4).map((el) => el.id),
			sprite,
			background,
			animationChanged: firstFrame !== cats.canvas.toDataURL(),
		};
	});
	expect(state.ids.cats).toBeGreaterThan(state.ids.farm);
	expect(state.rows).toEqual([`row${state.ids.grandma}`, `row${state.ids.cats}`, `row${state.ids.farm}`]);
	expect(state.products).toEqual([`product${state.ids.grandma}`, `product${state.ids.cats}`, `product${state.ids.farm}`]);
	expect(state.prices.grandma).toBeLessThan(state.prices.cats);
	expect(state.prices.cats).toBeLessThan(state.prices.farm);
	expect(state.cps.grandma).toBeLessThan(state.cps.cats);
	expect(state.cps.cats).toBeLessThan(state.cps.farm);
	expect(state.sprite.width).toBeGreaterThan(0);
	expect(state.sprite.height).toBe(64);
	expect(state.background.width).toBe(2304);
	expect(state.background.height).toBe(1296);
	expect(state.animationChanged).toBe(true);
	await assertNoUncaughtErrors(page);
});

test('Cats: compact multi-lane renderer supports 100 visible cats without attack states', async ({ page }) => {
	await boot(page, '');
	await page.waitForFunction(() => window.Game.Objects && window.Game.Objects.Cats && window.Game.Objects.Cats.canvas, null, BOOT);
	const state = await page.evaluate(async () => {
		const cats = window.Game.Objects.Cats;
		const ctx = cats.ctx;
		const originalDraw = ctx.drawImage.bind(ctx);
		let catDraws = 0;
		let attackDraws = 0;
		let minCatWidth = Infinity;
		let minCatY = Infinity;
		ctx.drawImage = function (...args) {
			const src = args[0]?.src || '';
			if (src.includes('/img/cats/attack-1.png')) attackDraws++;
			if (src.includes('/img/cats/') && !src.includes('Summer1.png')) {
				catDraws++;
				minCatWidth = Math.min(minCatWidth, Number(args[7]));
				minCatY = Math.min(minCatY, Number(args[6]));
			}
			return originalDraw(...args);
		};
		cats.amount = 100;
		cats.unlocked = 1;
		cats.refresh();
		await new Promise((resolve) => setTimeout(resolve, 600));
		return { amount: cats.amount, catDraws, attackDraws, minCatWidth, minCatY, canvas: [cats.canvas.width, cats.canvas.height] };
	});
	expect(state.amount).toBe(100);
	expect(state.catDraws).toBeGreaterThanOrEqual(100);
	expect(state.attackDraws).toBe(0);
	expect(state.minCatWidth).toBeGreaterThanOrEqual(80);
	expect(state.minCatY).toBeGreaterThanOrEqual(45);
	expect(state.canvas[0]).toBeGreaterThan(0);
	expect(state.canvas[1]).toBe(128);
	await assertNoUncaughtErrors(page);
});

test('Cats and Farms: mobile and reduced-motion renderers stay visible', async ({ browser }) => {
	const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const mobilePage = await mobile.newPage();
	await boot(mobilePage, '&qa=cats100&oneCol=1');
	await mobilePage.evaluate(() => document.querySelector('#oneColTabs button[data-col="middle"]').click());
	await mobilePage.waitForFunction(() => {
		const cats = window.Game.Objects.Cats;
		return document.body.classList.contains('oneColumn') && cats.canvas.clientWidth > 0 && cats.canvas.clientHeight > 0;
	}, null, BOOT);
	const mobileState = await mobilePage.evaluate(() => {
		const cats = window.Game.Objects.Cats;
		const rect = cats.canvas.getBoundingClientRect();
		return { oneColumn: document.body.classList.contains('oneColumn'), canvas: [cats.canvas.width, cats.canvas.height], visible: rect.width > 0 && rect.height > 0 };
	});
	expect(mobileState.oneColumn).toBe(true);
	expect(mobileState.canvas[0]).toBeGreaterThan(0);
	expect(mobileState.canvas[1]).toBeGreaterThanOrEqual(128);
	expect(mobileState.visible).toBe(true);
	await mobile.close();

	const reduced = await browser.newContext({ reducedMotion: 'reduce' });
	const reducedPage = await reduced.newPage();
	await boot(reducedPage, '&qa=cats&oneCol=1');
	await reducedPage.evaluate(() => document.querySelector('#oneColTabs button[data-col="middle"]').click());
	await reducedPage.waitForFunction(() => {
		const cats = window.Game.Objects.Cats;
		return document.body.classList.contains('noMotion') && cats.canvas.clientWidth > 0 && cats.canvas.clientHeight > 0;
	}, null, BOOT);
	const reducedState = await reducedPage.evaluate(() => {
		const cats = window.Game.Objects.Cats;
		const rect = cats.canvas.getBoundingClientRect();
		return { noMotion: document.body.classList.contains('noMotion'), canvas: [cats.canvas.width, cats.canvas.height], visible: rect.width > 0 && rect.height > 0, frame: window.Game.T };
	});
	expect(reducedState.noMotion).toBe(true);
	expect(reducedState.canvas[0]).toBeGreaterThan(0);
	expect(reducedState.canvas[1]).toBeGreaterThanOrEqual(128);
	expect(reducedState.visible).toBe(true);
	expect(reducedState.frame).toBeGreaterThan(0);
	await reduced.close();
});

test('?qa=save: save export -> import round-trip restores state', async ({ page }) => {
	await boot(page, '&qa=save');
	const report = await qaReport(page, /PASS: export->import round-trip restored state/);
	expect(report).not.toMatch(/ERROR/);
	expect(report).toMatch(/cats=7/);
	expect(report).toMatch(/cat upgrade=true/);
	expect(report).toMatch(/cat achievement=true/);
});

test('?qa=backup: rolling save backups capture, prune, restore, and download', async ({ page }) => {
	const downloads = [];
	page.on('download', (d) => downloads.push(d.suggestedFilename()));
	await boot(page, '&qa=backup');
	const report = await qaReport(page, /PASS: rolling backups capture, prune, and restore correctly/);
	expect(report).not.toMatch(/ERROR/);
	expect(report).toMatch(/history=3/);
	expect(report).toMatch(/dedupe: true/);
	expect(report).toMatch(/prune-cap\(10\): true/);
	expect(report).toMatch(/restored cookies=300/);
	expect(report).toMatch(/download: true/);
	expect(downloads.some((name) => /Backup-\d{4}-\d{4}\.txt$/.test(name))).toBe(true);
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

test('?qa=binverter: the Black Hole Inverter mod (building + content + save) verified', async ({ page }) => {
	await boot(page, '&qa=binverter');
	const report = await qaReport(page, /PASS: Black Hole Inverter verified end to end/);
	expect(report).not.toMatch(/ERROR/);
	expect(report).not.toMatch(/FAIL:/);
	expect(report).toMatch(/building declared as id 20/);
	expect(report).toMatch(/17 building upgrades/);
	expect(report).toMatch(/18 building achievements/);
	expect(report).toMatch(/building amount restored to 7/);
	await assertNoUncaughtErrors(page);
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
