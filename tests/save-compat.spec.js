// Slice-7 save-format compatibility check (symmetric round-trip):
// 1. master: seed a rich state, export
// 2. master: re-import its own export, re-export  -> baseline
// 3. rewrite: import master's export, re-export     -> test
// 4. diff the parsed sections; only the lastDate timestamp may differ
//
// The baseline server is wired into playwright.config.js: when a pristine
// master build exists at .cc3-master/ (create it with `npm run setup:master`,
// or let the CI test-compat job check it out), a `vite preview` serves it on
// :4174 alongside the :4173 build and this spec runs; otherwise it skips.
import { test, expect } from '@playwright/test';
import fs from 'fs';

const BOOT = { timeout: 30_000 };

// Detect the baseline the same way playwright.config.js does. Locally a
// missing baseline just skips the spec; in CI the test-compat job always
// provisions it, so a miss there is a workflow bug and must fail loudly
// (test.skip with a condition that never lifts is reported as failed there).
const masterProvisioned = fs.existsSync('.cc3-master/package.json');
if (!masterProvisioned) {
	test.skip(
		true,
		'save-compat needs a pristine master build on :4174 — run `npm run setup:master` to provision it' +
			(process.env.CI ? ' (MISSING IN CI — the test-compat job should have created it)' : '')
	);
}

async function boot(page, base) {
	const response = await page.goto(`${base}/?debug=1`, { waitUntil: 'load', timeout: BOOT.timeout });
	if (base.includes(':4174') && (!response || !response.ok())) {
		throw new Error(
			`save-compat baseline at ${base} is not serving the game (HTTP ${response ? response.status() : 'no response'}) — re-provision it with: npm run setup:master`
		);
	}
	const lang = page.locator('#langSelect-English');
	try {
		await lang.waitFor({ state: 'visible', timeout: 5_000 });
		await lang.click();
	} catch { /* no language prompt */ }
	await page.waitForFunction(() => window.Game && window.Game.ready === 1, null, BOOT);
}

// Seed a rich, deterministic state so the save exercises every section.
async function seedRichState(page) {
	await page.evaluate(() => {
		const G = window.Game;
		G.cookies = 987654321.5;
		G.cookiesEarned = 12345678901.25;
		G.cookieClicks = 4321;
		G.goldenClicks = 77;
		G.handmadeCookies = 55555.5;
		G.missedGoldenClicks = 3;
		G.bgType = 2;
		G.milkType = 1;
		G.cookiesReset = 1000000;
		G.elderWrath = 1;
		G.pledges = 2;
		G.pledgeT = 0;
		G.researchT = 0;
		G.resets = 3;
		G.goldenClicksLocal = 12;
		G.cookiesSucked = 0;
		G.wrinklersPopped = 4;
		G.santaLevel = 2;
		G.reindeerClicked = 5;
		G.seasonT = 0;
		G.seasonUses = 1;
		G.season = 'christmas';
		G.prestige = 150;
		G.heavenlyChips = 42;
		G.heavenlyChipsSpent = 10;
		G.heavenlyCookies = 0;
		G.ascensionMode = 0;
		G.dragonLevel = 8;
		G.dragonAura = 5;
		G.dragonAura2 = 0;
		G.chimeType = 1;
		G.volume = 80;
		G.lumps = 3;
		G.lumpsTotal = 9;
		G.lumpT = G.time;
		G.lumpRefill = 0;
		G.lumpCurrentType = 1;
		// vault stores numeric upgrade ids; use upgrades registered at boot on both branches
		G.vault = [G.Upgrades['Reinforced index finger'].id, G.Upgrades['Thumbprint cookies'].id];
		G.heralds = 1;
		G.fortuneGC = 0;
		G.fortuneCPS = 0;
		G.cookiesPsRawHighest = 5000;
		G.volumeMusic = 70;
		// buildings
		const objs = G.Objects;
		objs['Cursor'].amount = 10; objs['Cursor'].bought = 10; objs['Cursor'].unlocked = 1; objs['Cursor'].totalCookies = 1000; objs['Cursor'].level = 1; objs['Cursor'].highest = 10;
		objs['Grandma'].amount = 5; objs['Grandma'].bought = 5; objs['Grandma'].unlocked = 1; objs['Grandma'].totalCookies = 500; objs['Grandma'].level = 0; objs['Grandma'].highest = 5;
		objs['Farm'].amount = 3; objs['Farm'].bought = 3; objs['Farm'].unlocked = 1; objs['Farm'].totalCookies = 300; objs['Farm'].level = 0; objs['Farm'].highest = 3;
		objs['Cats'].amount = 7; objs['Cats'].bought = 7; objs['Cats'].unlocked = 1; objs['Cats'].totalCookies = 700; objs['Cats'].level = 0; objs['Cats'].highest = 7;
		// upgrades (unlocked + bought)
		G.Upgrades['Reinforced index finger'].unlocked = 1; G.Upgrades['Reinforced index finger'].bought = 1;
		G.Upgrades['Carpal tunnel prevention cream'].unlocked = 1; G.Upgrades['Carpal tunnel prevention cream'].bought = 1;
		G.Upgrades['Thumbprint cookies'].unlocked = 1; G.Upgrades['Thumbprint cookies'].bought = 1;
		G.Upgrades['Cardboard box basics'].unlocked = 1; G.Upgrades['Cardboard box basics'].bought = 1;
		// achievements (won)
		G.Achievements['Wake and bake'].won = 1;
		G.Achievements['Making some dough'].won = 1;
		G.Achievements['One with everything'].won = 1;
		G.recalculateGains = 1; G.CalculateGains();
	});
}

// WriteSave(1) is escape(b64(raw + '!END!')) — decode it back to the raw pipe format.
const dec = (s) => Buffer.from(unescape(s).replace('!END!', ''), 'base64').toString('utf8');

// section 2 is run-details: startDate;fullDate;lastDate;bakeryName;seed —
// lastDate (3rd field) is re-stamped at WriteSave entry, so it drifts between exports.
function normalizeLastDate(raw) {
	const sections = raw.split('|');
	const run = sections[2].split(';');
	if (run.length > 3) run[2] = '__LASTDATE__';
	sections[2] = run.join(';');
	return sections.join('|');
}

test('save compat: master export -> rewrite import -> re-export diff (symmetric)', async ({ browser }) => {
	// ---- master: seed + export ----
	const mCtx = await browser.newContext();
	const mPage = await mCtx.newPage();
	await boot(mPage, 'http://localhost:4174');
	await seedRichState(mPage);
	const masterExport = await mPage.evaluate(() => window.Game.WriteSave(1));

	// ---- master: self-import baseline ----
	await mCtx.close();

	// ---- master: self-import baseline, on a FRESH page (mirrors the rewrite side) ----
	const m2Ctx = await browser.newContext();
	const m2Page = await m2Ctx.newPage();
	await boot(m2Page, 'http://localhost:4174');
	// LoadSave restores Game.heralds to its pre-import value (verbatim 2.048
	// behavior — the save's heralds are only used for the offline-CpS estimate).
	// Pin it identically on both import pages so the restore is symmetric.
	const masterSelf = await m2Page.evaluate((saveStr) => {
		const G = window.Game;
		G.heralds = 1;
		const ok = G.ImportSaveCode(saveStr);
		G.recalculateGains = 1; G.CalculateGains();
		return { ok, raw: G.WriteSave(2), exp: G.WriteSave(1) };
	}, masterExport);
	expect(masterSelf.ok).toBe(true);
	await m2Ctx.close();

	// ---- rewrite: import master's export ----
	const rCtx = await browser.newContext();
	const rPage = await rCtx.newPage();
	await boot(rPage, 'http://localhost:4173');
	const rw = await rPage.evaluate((saveStr) => {
		const G = window.Game;
		G.heralds = 1;
		const ok = G.ImportSaveCode(saveStr);
		G.recalculateGains = 1; G.CalculateGains();
		return {
			ok,
			raw: G.WriteSave(2),
			exp: G.WriteSave(1),
			state: {
				cookies: G.cookies, cookiesEarned: G.cookiesEarned, cookieClicks: G.cookieClicks,
				goldenClicks: G.goldenClicks, resets: G.resets,
				heavenlyChips: G.heavenlyChips, lumps: G.lumps, dragonLevel: G.dragonLevel,
				cursorAmt: G.Objects['Cursor'].amount, grandmaAmt: G.Objects['Grandma'].amount,
				farmAmt: G.Objects['Farm'].amount,
				catsAmt: G.Objects['Cats'].amount,
				up1: G.Upgrades['Reinforced index finger'].bought,
				up2: G.Upgrades['Thumbprint cookies'].bought,
				catUp: G.Upgrades['Cardboard box basics'].bought,
				ach1: G.Achievements['Wake and bake'].won,
			},
		};
	}, masterExport);
	await rCtx.close();

	// 1) import must succeed on both branches
	expect(rw.ok).toBe(true);

	// 2) live state after import matches the seeded values
	expect(rw.state.cookies).toBeCloseTo(987654321.5, 1);
	expect(rw.state.cookiesEarned).toBeCloseTo(12345678901.25, 1);
	expect(rw.state.cookieClicks).toBe(4321);
	expect(rw.state.goldenClicks).toBe(77);
	expect(rw.state.resets).toBe(3);
	// prestige is recomputed from cookiesReset on load (HowMuchPrestige) by design
	// on both branches — the section diff below is the real compatibility gate.
	expect(rw.state.heavenlyChips).toBe(42);
	expect(rw.state.lumps).toBe(3);
	expect(rw.state.dragonLevel).toBe(8);
	expect(rw.state.cursorAmt).toBe(10);
	expect(rw.state.grandmaAmt).toBe(5);
	expect(rw.state.farmAmt).toBe(3);
	expect(rw.state.catsAmt).toBe(7);
	expect(rw.state.up1).toBe(1);
	expect(rw.state.up2).toBe(1);
	expect(rw.state.catUp).toBe(1);
	expect(rw.state.ach1).toBe(1);

	// 3) section-by-section diff: master self-import (baseline) vs rewrite import.
	//    Both sides go through the identical import path, so this isolates the
	//    branch difference; only lastDate (section 2, 3rd field) may differ.
	//    Sections 6 (upgrades: an 'unlocked,bought' pair per upgrade) and 7
	//    (achievements: one char each) are 1/0 strings in registration order.
	//    New content is always APPENDED to the end of its registration list
	//    (upgrade ids are the registration index), so importing an older save
	//    leaves the new entries at 0 and re-export extends the section with
	//    trailing '0's. Allow exactly that and nothing else.
	const APPEND_ONLY_ZERO_SECTIONS = { 6: 'upgrades', 7: 'achievements' };
	const appendOnlyZeros = (i, a, b) =>
		i in APPEND_ONLY_ZERO_SECTIONS && b.startsWith(a) && /^[0]+$/.test(b.slice(a.length));
	const a = normalizeLastDate(masterSelf.raw).split('|');
	const b = normalizeLastDate(rw.raw).split('|');
	expect(b.length).toBe(a.length);
	const diffs = [];
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i] && !appendOnlyZeros(i, a[i], b[i]))
			diffs.push(`section ${i}: master-self=${JSON.stringify(a[i].slice(0, 80))}... rewrite-import=${JSON.stringify(b[i].slice(0, 80))}...`);
	}
	expect(diffs, 'raw save sections must match (see diffs):\n' + diffs.join('\n')).toEqual([]);

	// 4) the WriteSave(1) re-exports: identical after decoding + normalizing lastDate
	//    (with the same append-only-'0' tolerance on the achievements section)
	const ea = normalizeLastDate(dec(masterSelf.exp)).split('|');
	const eb = normalizeLastDate(dec(rw.exp)).split('|');
	expect(eb.length).toBe(ea.length);
	const exportDiffs = [];
	for (let i = 0; i < ea.length; i++) {
		if (ea[i] !== eb[i] && !appendOnlyZeros(i, ea[i], eb[i]))
			exportDiffs.push(`section ${i}: master-self=${JSON.stringify(ea[i].slice(0, 80))}... rewrite-import=${JSON.stringify(eb[i].slice(0, 80))}...`);
	}
	expect(exportDiffs, 're-exported save sections must match (see diffs):\n' + exportDiffs.join('\n')).toEqual([]);
});
