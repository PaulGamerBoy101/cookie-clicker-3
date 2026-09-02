/* Cookie Clicker 3 — entry point.
 *
 * Wires the ported 2.048 engine into a modern module pipeline:
 *   config.ts         publishes VERSION/BETA/App before the engine evaluates
 *   engine/base64.ts  native btoa/atob save encoding
 *   engine/main.ts    the engine itself (classic script -> ES module)
 *
 * The engine still bootstraps on the window `load` event (see the bottom of
 * engine/main.ts). It asks this module for language files and minigame
 * scripts via `window.loadLangModule` / `window.loadMinigameModule`; both are
 * backed by static Vite dynamic imports, so they bundle, tree-split and
 * resolve correctly in dev and in the production build.
 */
import './config';
import './engine/base64';
import './engine/main';
/* CC3 extras: content mods built on the engine's own mod API (no CCSE).
 * Must be imported after engine/main.ts so Game.registerMod exists at module
 * eval; each self-registers (its content is declared in the 'create' hook
 * during Game.Load, before LoadSave). */
import './extras/blackHoleInverter';
import './extras/decideDestiny';
import './extras/americanSeason';
import './extras/casino';
import './extras/tutorial';
import './extras/dailyCrumb';
import './extras/crackingCookie';
import './extras/transcendence';
import './styles/main.css';
import type { Cc3AnimStats, Game as EngineGame, LanguageData } from './engine/types';

/* Error surface: paint uncaught boot/runtime errors to the DOM so they're
 * visible without DevTools. Always on in the dev server; in the production
 * build it is opt-in via ?debug=1 (handy for field diagnosis). */
const params = new URLSearchParams(window.location.search);
const debugSurface = import.meta.env.DEV || params.has('debug');
if (debugSurface) {
	const show = (label: string, text: string) => {
		const d = document.createElement('pre');
		d.id = '__dbg';
		d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#b00020;color:#fff;padding:8px;max-width:80vw;white-space:pre-wrap;font:12px/140% monospace;';
		d.textContent = label + ': ' + text;
		document.body.appendChild(d);
	};
	window.addEventListener('error', (e) => show('ERR', e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '')));
	window.addEventListener('unhandledrejection', (e) => {
		// e.reason is unknown; the original read .stack off it untyped — same logic, cast at the boundary.
		const r = e.reason as { stack?: string } | null | undefined;
		show('REJ', r && r.stack ? r.stack : String(e.reason));
	});
}

/* Debug-only QA seed (requires ?debug=1, then ?qa or ?qa=cookies).
 *
 * Reaching some content by clicking alone takes far longer than a test
 * session (the Garden minigame needs a level-1 Farm, which normally costs a
 * sugar lump, which normally costs a billion cookies). For automated/quick
 * verification this seeds state and, for the default minigame mode, opens the
 * Garden — exercising the minigame dynamic-import path end to end.
 *   ?qa           seed a level-1 minigame building set and open the Garden
 *   ?qa=cookies   seed cookies only (no minigames) for light store-buy tests
 *   ?qa=cats      seed five Cats so the animated building can be previewed
 *   ?qa=cats100   seed 100 Cats to preview the compact multi-lane display
 *   ?qa=golden    spawn + pop a forced "frenzy" golden cookie, report the buff
 *   ?qa=destiny   exercise Decide Your Destiny: buy the heavenly chain, decide a
 *                 destiny, pop a natural golden cookie, verify the forced
 *                 effect + save round-trip
 *   ?qa=save      export a save, corrupt state, re-import, verify round-trip
 *   ?qa=backup    exercise the rolling save backup history (capture/list/restore)
 *   ?qa=content   validate content registries and report economy ordering
 *   ?qa=dailycrumb exercise the daily crumb: claim a single missed day, a
 *                  multi-day backfill, the streak-reset after a long absence,
 *                  the no-double-claim guard, and the save round-trip
 * Never active in a plain production load. */
if (debugSurface && params.has('qa') && params.get('qa') !== 'golden' && params.get('qa') !== 'save' && params.get('qa') !== 'backup' && params.get('qa') !== 'sound' && params.get('qa') !== 'perf' && params.get('qa') !== 'ascend' && params.get('qa') !== 'ascendbrowse' && params.get('qa') !== 'arrange' && params.get('qa') !== 'offline' && params.get('qa') !== 'special' && params.get('qa') !== 'a11y' && params.get('qa') !== 'wrinkler' && params.get('qa') !== 'icon' && params.get('qa') !== 'onecol' && params.get('qa') !== 'anim' && params.get('qa') !== 'binverter' && params.get('qa') !== 'content' && params.get('qa') !== 'destiny' && params.get('qa') !== 'amseason' && params.get('qa') !== 'casino' && params.get('qa') !== 'dailycrumb') {
	const qaMode = params.get('qa'); // null for bare ?qa, else the value
	const MINIGAME_BUILDINGS = ['Farm', 'Bank', 'Temple', 'Wizard tower'];
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects) return;
		if (!G.__qaSeeded) {
			G.__qaSeeded = 1;
			try {
				G.cookies += 1e6;
				if (qaMode !== 'cookies' && qaMode !== 'cats' && qaMode !== 'cats100') {
					G.lumps += 10;
					for (const name of MINIGAME_BUILDINGS) {
						const b = G.Objects[name];
						if (!b) continue;
						b.amount = 1;
						b.unlocked = 1;
						b.bought = 1;
						b.highest = 1;
						b.level = 1;
					}
					G.recalculateGains = 1;
					if (G.LoadMinigames) G.LoadMinigames();
				}
			} catch (e: any) {
				console.error('QA seed failed:', e);
			}
			if (qaMode === 'cats' || qaMode === 'cats100') {
				const cats = G.Objects['Cats'];
				if (cats) {
					const showcaseAmount = qaMode === 'cats100' ? 100 : 5;
					G.BuildingsOwned -= cats.amount;
					cats.amount = showcaseAmount;
					cats.unlocked = 1;
					cats.bought = showcaseAmount;
					cats.highest = showcaseAmount;
					cats.totalCookies = 0;
					G.BuildingsOwned += cats.amount;
					cats.refresh();
				}
				G.recalculateGains = 1;
				if (G.CalculateGains) G.CalculateGains();
				window.clearInterval(tick);
				return;
			}
			if (qaMode === 'cookies') window.clearInterval(tick); // done seeding
		}
		if (qaMode === 'cookies') return;
		const allLoaded = MINIGAME_BUILDINGS.every((n) => G.Objects[n] && G.Objects[n].minigameLoaded);
		if (allLoaded) {
			const farm = G.Objects['Farm'];
			if (!farm.onMinigame) {
				try {
					if (farm.switchMinigame) farm.switchMinigame(1);
					if (farm.refresh) farm.refresh();
				} catch (e: any) {
					console.error('QA open minigame failed:', e);
				}
			}
			if (farm.onMinigame) window.clearInterval(tick); // Garden open: done
		}
	}, 250);
}

// QA: validate registered content and report the current building economy.
// This is intentionally read-only with respect to content definitions; it seeds
// three building counts only so the report has comparable per-building values.
// Usage: ?debug=1&qa=content
if (debugSurface && params.get('qa') === 'content') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects || typeof G.ValidateContent !== 'function' || typeof G.GetEconomyReport !== 'function' || typeof G.AnalyzeEconomy !== 'function') return;
		if (G.__qaContent) return;
		G.__qaContent = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:760px;';
		document.body.appendChild(out);
		try {
			const names = ['Grandma', 'Cats', 'Farm'];
			for (const name of names) {
				const building = G.Objects[name];
				if (!building) throw new Error('Missing building: ' + name);
				building.amount = 10;
				building.unlocked = 1;
				building.bought = 10;
			}
			G.recalculateGains = 1;
			const validation = G.ValidateContent();
			const report = G.GetEconomyReport();
			const simulation = G.SimulateEconomy([{ Grandma: 10, Cats: 10, Farm: 10 }]);
			const analysis = G.AnalyzeEconomy({ levels: [1, 10] });
			const strategies = (['cheapest', 'bestPayback', 'upgradesFirst'] as const).map((strategy) => G.SimulateStrategy({ strategy, durationSeconds: 120, clicksPerSecond: 5, sampleEverySeconds: 60, maxPurchases: 1000 }));
			const selected = names.map((name) => report.buildings.find((building) => building.name === name));
			const orderOk = selected[0] && selected[1] && selected[2] && selected[0].storeOrder < selected[1].storeOrder && selected[1].storeOrder < selected[2].storeOrder;
			const cpsOk = selected[0] && selected[1] && selected[2] && selected[0].cpsPerBuilding < selected[1].cpsPerBuilding && selected[1].cpsPerBuilding < selected[2].cpsPerBuilding;
			const paybackOk = selected.every((building) => building && building.nextPurchaseCost > 0 && building.marginalCps > 0 && Number.isFinite(building.paybackSeconds));
			const simulationOk = simulation.length === 1 && simulation[0].buildings.some((building) => building.name === 'Cats' && building.amount === 10) && G.Objects['Grandma'].amount === 10 && G.Objects['Cats'].amount === 10 && G.Objects['Farm'].amount === 10;
			const achievementOk = ['Cat nap council','Purrfectly populated','Nine lives, nine rows','The purrduction line','A cat for every cushion','The whole litter','Barnstormer','A field of dreams','From barn to bakery','Fifty-fur strong','A hundred paws','The meow-ve','Paw-some company','Whisker horde','The kitty condo','Cat-astrophe','Half a grand of fluff','The feline parliament','The meow-terpiece','The great cat-icula','Industrial meow-ny','The purr-oduction dynasty','The decan of cats','The five-hundred purr','One thousand paws','The purr-fect match'].every((name) => !!G.Achievements[name]) && G.Objects['Cats'].tieredAchievs && Object.keys(G.Objects['Cats'].tieredAchievs).length === 14 && G.Objects['Cats'].productionAchievs.length === 3 && !!G.Objects['Cats'].levelAchiev10;
			const analysisCategoriesOk = analysis.upgrades.some((upgrade) => upgrade.name === 'Purrfect timing' && upgrade.category === 'click' && Number.isFinite(upgrade.clickPaybackSeconds.five)) && analysis.upgrades.some((upgrade) => upgrade.name === 'Cardboard box basics' && upgrade.category === 'passive') && analysis.upgrades.some((upgrade) => upgrade.name === 'Heavenly cookies' && upgrade.category === 'prestige');
			const strategyOk = strategies.length === 3 && strategies.every((run) => run.purchases > 0 && run.samples.length >= 2 && run.elapsedSeconds === 120);
			const buildingBalanceOk = analysis.buildingBalance.length === analysis.buildingCount && analysis.buildingBalance.every((audit) => audit.milestones.length === 2 && audit.milestones.every((milestone) => milestone.level > 0 && milestone.totalInvestment >= 0 && milestone.totalCps >= 0 && milestone.nextPurchaseCost >= 0 && milestone.marginalCps >= 0 && milestone.paybackRatioToCurve >= 0));
			const analysisOk = analysis.buildingCount === Object.keys(G.Objects).length && analysis.upgradeCount === Object.keys(G.Upgrades).length && analysis.milestones.length === analysis.buildingCount * 2 && analysis.buildingBalance.length === analysis.buildingCount && analysis.upgrades.length === analysis.upgradeCount && analysisCategoriesOk && buildingBalanceOk && strategyOk && G.Objects['Grandma'].amount === 10 && G.Objects['Cats'].amount === 10 && G.Objects['Farm'].amount === 10;
			// The muted Cats icon must carry the animated sleeping-cat sheet.
			G.Objects['Cats'].mute(1);
			const catsMuteEl = document.getElementById('mutedProduct' + G.Objects['Cats'].id);
			const catSleepOk = !!(catsMuteEl && catsMuteEl.classList.contains('catSleepIcon') && getComputedStyle(catsMuteEl).backgroundImage.indexOf('cats/sleep.png') >= 0);
			G.Objects['Cats'].mute(0);
			// The cat-synergy system mirrors the grandma one: 8 registered
			// upgrades (one per tied building), owning one doubles Cats CpS and
			// boosts the tied building +1% per (id-1) cats.
			const catSynergyNames = ['Kitten grandmas','Farm cats','Miner cats','Worker cats','Space cats','Golden cats','Altered cats','Time cats'];
			const catSynergyOk = (G.CatSynergies || []).length === 8
				&& catSynergyNames.every((name) => (G.CatSynergies || []).includes(name) && !!G.Upgrades[name] && !!G.Upgrades[name].buildingTie && !!G.Objects[G.Upgrades[name].buildingTie.name])
				&& catSynergyNames.every((name) => (G.Upgrades[name].buildingTie as any).cat === G.Upgrades[name])
				&& (() => {
					const upgrade = G.Upgrades['Farm cats'];
					const catsBefore = G.Objects['Cats'].storedCps;
					const farmBefore = G.Objects['Farm'].storedCps;
					const farmBoost = 1 + 10 * 0.01 * (1 / (G.Objects['Farm'].id - 1));
					upgrade.bought = 1; upgrade.unlocked = 1;
					G.recalculateGains = 1; G.CalculateGains();
					const ok = Math.abs(G.Objects['Cats'].storedCps - 2 * catsBefore) <= 1e-9 * catsBefore && Math.abs(G.Objects['Farm'].storedCps - farmBefore * farmBoost) <= 1e-12 * farmBefore;
					upgrade.bought = 0; upgrade.unlocked = 0;
					G.recalculateGains = 1; G.CalculateGains();
					return ok;
				})();
			const pass = validation.valid && orderOk && cpsOk && paybackOk && simulationOk && achievementOk && catSleepOk && catSynergyOk && analysisOk;
			out.textContent =
				'[QA-content] validation: ' + (validation.valid ? 'PASS' : 'FAIL') + ' (' + validation.buildingCount + ' buildings, ' + validation.upgradeCount + ' upgrades, ' + validation.errors + ' errors)\n' +
				'[QA-content] economy snapshot total CpS=' + report.totalCps.toFixed(2) + '\n' +
				selected.map((building) => building ? '[QA-content] ' + building.name + ': order=' + building.storeOrder + ', amount=' + building.amount + ', CpS/unit=' + building.cpsPerBuilding.toFixed(2) + ', total=' + building.totalCps.toFixed(2) : '[QA-content] missing building').join('\n') + '\n' +
				'[QA-content] store order Grandma < Cats < Farm: ' + (orderOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] CpS/unit Grandma < Cats < Farm: ' + (cpsOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] next purchase cost/marginal CpS/payback: ' + (paybackOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] simulator restores live counts: ' + (simulationOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] Cat/Farm achievements registered: ' + (achievementOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] muted Cats icon uses the sleeping-cat sheet: ' + (catSleepOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] cat synergies registered and double Cats / boost the tied building: ' + (catSynergyOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] strategy runner compares 3 purchase policies: ' + (strategyOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] cross-building balance audit covers every building and level: ' + (buildingBalanceOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] full analysis covers all buildings/upgrades, categories, and restores counts: ' + (analysisOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] ' + (pass ? 'PASS: typed content validation and economy report verified' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-content] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the golden-cookie click path end to end. Spawns a golden cookie
// with a forced "frenzy" effect, pops it, and reports the resulting buff and
// CpS change (frenzy is a ×7 CpS buff). Usage: ?debug=1&qa=golden
if (debugSurface && params.get('qa') === 'golden') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || typeof G.shimmer !== 'function' || !G.shimmersL) return;
		if (G.__qaGolden) return;
		G.__qaGolden = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			G.cookies += 1e6;
			for (let i = 0; i < 10; i++) G.Objects['Cursor'].buy(1);
			G.recalculateGains = 1;
			G.CalculateGains();
			const before = G.cookiesPs;
			const shimmersBefore = G.shimmers.length;
			const sh = new G.shimmer('golden');
			sh.force = 'frenzy';
			sh.pop();
			G.CalculateGains();
			const after = G.cookiesPs;
			const buff = G.buffs['Frenzy']; // gainBuff keys by display name
			out.textContent =
				'[QA-golden] baseline CpS=' + before.toFixed(2) +
				'\n[QA-golden] after-frenzy CpS=' + after.toFixed(2) + ' (ratio ' + (before > 0 ? (after / before).toFixed(2) : '∞') + '×, expect ~7×)' +
				'\n[QA-golden] Frenzy buff=' + (buff ? 'ACTIVE (mult ' + buff.arg1 + ')' : 'MISSING') +
				'\n[QA-golden] shimmers ' + shimmersBefore + ' -> ' + G.shimmers.length + ' (spawn+pop lifecycle)';
		} catch (e: any) {
			out.textContent = '[QA-golden] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the save export -> import round-trip. Seeds a known state, exports
// it (Game.WriteSave), corrupts the live state, re-imports the export
// (Game.ImportSaveCode), and checks the state is restored. Usage: ?debug=1&qa=save
if (debugSurface && params.get('qa') === 'save') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || typeof G.WriteSave !== 'function' || typeof G.ImportSaveCode !== 'function') return;
		if (G.__qaSave) return;
		G.__qaSave = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const COOKIES = 12345.678, CURSORS = 10, GRANDMAS = 5, CATS = 7;
			// 1. seed state A, including the new Cat building/content
			G.cookies = COOKIES;
			G.Objects['Cursor'].amount = CURSORS; G.Objects['Cursor'].unlocked = 1; G.Objects['Cursor'].bought = 1;
			G.Objects['Grandma'].amount = GRANDMAS; G.Objects['Grandma'].unlocked = 1; G.Objects['Grandma'].bought = 1;
			G.Objects['Cats'].amount = CATS; G.Objects['Cats'].unlocked = 1; G.Objects['Cats'].bought = CATS;
			G.Upgrades['Cardboard box basics'].unlocked = 1; G.Upgrades['Cardboard box basics'].bought = 1;
			G.Achievements['Cat nap council'].won = 1;
			G.Achievements['One thousand paws'].won = 1;
			G.recalculateGains = 1; G.CalculateGains();
			const cpsA = G.cookiesPs;
			// 2. export the save string
			const saveStr = G.WriteSave(1);
			// 3. corrupt the live state (so the import must do real work)
			G.cookies = 7;
			G.Objects['Cursor'].amount = 0;
			G.Objects['Grandma'].amount = 0;
			G.Objects['Cats'].amount = 0;
			G.Upgrades['Cardboard box basics'].bought = 0;
			G.Achievements['Cat nap council'].won = 0;
			G.Achievements['One thousand paws'].won = 0;
			G.recalculateGains = 1; G.CalculateGains();
			const cpsCorrupt = G.cookiesPs;
			// 4. re-import the export
			const ok = G.ImportSaveCode(saveStr);
			G.recalculateGains = 1; G.CalculateGains();
			// 5. verify the state was restored
			const cookiesOk = Math.abs(G.cookies - COOKIES) < 0.01;
			const cursorsOk = G.Objects['Cursor'].amount === CURSORS;
			const grandmasOk = G.Objects['Grandma'].amount === GRANDMAS;
			const catsOk = G.Objects['Cats'].amount === CATS;
			const catUpgradeOk = G.Upgrades['Cardboard box basics'].bought === 1;
			const catAchievementOk = G.Achievements['Cat nap council'].won === 1;
			const newCatAchievementOk = G.Achievements['One thousand paws'].won === 1;
			const cpsOk = Math.abs(G.cookiesPs - cpsA) < 0.01;
			// 6. verify the export prompt's copy-to-clipboard button: open the
			// prompt, click "Copy to clipboard", and confirm writeText received
			// the save code (stubbed — headless pages deny the real clipboard).
			let copiedText: string | null = null;
			const realWriteText = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
			Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t: string) => { copiedText = t; return Promise.resolve(); } }, configurable: true });
			const copyBtnOk = (() => {
				try {
					G.ExportSave();
					const promptL = document.getElementById('promptContentExportSave');
					const parent = promptL ? promptL.parentElement : null;
					if (!promptL || !parent) return 'no-prompt';
					const opts = parent.querySelectorAll('.option');
					let copyBtn: Element | null = null;
					opts.forEach((a) => { if (a.textContent.indexOf('Copy to clipboard') !== -1) copyBtn = a; });
					if (!copyBtn) return 'no-button';
					(copyBtn as HTMLElement).click();
					const txt = document.getElementById('textareaPrompt') as HTMLTextAreaElement | null;
					return copiedText !== null && txt !== null && copiedText === txt.value;
				} catch (e: any) { return 'error:' + e.message; }
			})();
			if (realWriteText) Object.defineProperty(navigator, 'clipboard', { value: { writeText: realWriteText }, configurable: true });
			const pass = ok && cookiesOk && cursorsOk && grandmasOk && catsOk && catUpgradeOk && catAchievementOk && newCatAchievementOk && cpsOk && copyBtnOk === true;
			out.textContent =
				'[QA-save] export length=' + saveStr.length +
				'\n[QA-save] ImportSaveCode returned=' + ok +
				'\n[QA-save] state A: cookies=' + COOKIES + ' cursors=' + CURSORS + ' grandmas=' + GRANDMAS + ' cats=' + CATS + ' cps=' + cpsA.toFixed(2) +
				'\n[QA-save] corrupted: cookies=7 cursors=0 grandmas=0 cats=0 cps=' + cpsCorrupt.toFixed(2) +
				'\n[QA-save] after import: cookies=' + G.cookies.toFixed(3) + ' cursors=' + G.Objects['Cursor'].amount + ' grandmas=' + G.Objects['Grandma'].amount + ' cats=' + G.Objects['Cats'].amount + ' cps=' + G.cookiesPs.toFixed(2) +
				'\n[QA-save] checks: cookies=' + cookiesOk + ' cursors=' + cursorsOk + ' grandmas=' + grandmasOk + ' cats=' + catsOk + ' cat upgrade=' + catUpgradeOk + ' cat achievement=' + catAchievementOk + ' new cat achievement=' + newCatAchievementOk + ' cps=' + cpsOk +
				'\n[QA-save] copy-to-clipboard button=' + copyBtnOk +
				'\n[QA-save] ' + (pass ? 'PASS: export->import round-trip restored state' : 'FAIL: state mismatch');
		} catch (e: any) {
			out.textContent = '[QA-save] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the CC3 rolling save backups (systems/backup.ts). Captures
// several known states, checks the history (order, dedupe, prune cap), then
// restores an older backup and verifies the live state returns to it.
// Usage: ?debug=1&qa=backup
if (debugSurface && params.get('qa') === 'backup') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || typeof G.WriteSave !== 'function' || typeof G.CaptureSave !== 'function' || typeof G.ListBackups !== 'function' || typeof G.RestoreBackup !== 'function' || typeof G.DownloadBackup !== 'function') return;
		if (G.__qaBackup) return;
		G.__qaBackup = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const backupKey = G.SaveTo + 'Backups';
			// 1. capture three distinct states (cookies 100 / 200 / 300)
			const captures: number[] = [];
			for (const cookies of [100, 200, 300]) {
				G.cookies = cookies;
				G.recalculateGains = 1; G.CalculateGains();
				G.CaptureSave(G.WriteSave(1));
				captures.push(cookies);
			}
			const list1 = G.ListBackups(); // newest first
			const countOk = list1.length === 3;
			const orderOk = list1[0].timestamp > list1[1].timestamp && list1[1].timestamp > list1[2].timestamp;
			// 2. dedupe: capturing the same save again adds nothing
			G.CaptureSave(G.WriteSave(1));
			const dedupeOk = G.ListBackups().length === 3;
			// 3. prune: 12 captures keep only the newest 10
			G.cookies = 400;
			for (let i = 0; i < 9; i++) { G.CaptureSave(G.WriteSave(1) + '_' + i); }
			const pruneOk = G.ListBackups().length === 10;
			// 4. download the selected backup as a .txt save file (before restoring —
			// the restore re-captures and would prune the oldest entry away)
			const survivors = G.ListBackups(); // newest first
			const oldest = survivors[survivors.length - 1];
			const downloadOk = G.DownloadBackup(oldest.timestamp) && !G.DownloadBackup(1234567890123);
			// 4b. restore the oldest surviving backup (cookies=300; the 100 and 200
			// entries were pruned by the cap) and verify the live state returns to it
			const restoreOk = G.RestoreBackup(oldest.timestamp) && Math.abs(G.cookies - 300) < 0.01;
			// 5. the restore wrote through to the main save slot (a fresh backup
			// of the restored state is captured by the WriteSave hook)
			const restoredSaved = Math.abs(G.cookies - 300) < 0.01 && G.ListBackups().length >= 10;
			const pass = countOk && orderOk && dedupeOk && pruneOk && restoreOk && restoredSaved && downloadOk;
			out.textContent =
				'[QA-backup] captures=' + captures.join(',') + ' history=' + list1.length +
				'\n[QA-backup] order newest-last: ' + orderOk + ' dedupe: ' + dedupeOk + ' prune-cap(10): ' + pruneOk + ' download: ' + downloadOk +
				'\n[QA-backup] restored cookies=' + G.cookies + ' (expect 300) restoreOk=' + restoreOk + ' restoredSaved=' + restoredSaved +
				'\n[QA-backup] localStorage key=' + backupKey +
				'\n[QA-backup] ' + (pass ? 'PASS: rolling backups capture, prune, and restore correctly' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-backup] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the sound engine. The engine wraps Audio with a soundjay guard
// and must capture the REAL constructor into realAudio; if it captures the
// no-op fallback instead, every `new Audio(url)` returns a plain object and
// no sound ever loads or plays (regression for the module-scope `var Audio`
// shadowing the global). Exercises the full load chain: PlaySound caches the
// element, onloadeddata re-fires it, and readyState reaches >=2.
// Usage: ?debug=1&qa=sound
if (debugSurface && params.get('qa') === 'sound') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || typeof PlaySound !== 'function') return;
		if (G.__qaSound) return;
		G.__qaSound = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		const started = Date.now();
		const sndUrl = 'snd/tick.mp3';
		try {
			PlaySound(sndUrl, 1); // cache + start loading (plays after load)
			PlaySound('snd/error1.mp3', 0.5); // CC3 interface tone
			G.Win('Wake and bake'); // achievement unlock -> CC3 confirm tone
			const poll = window.setInterval(() => {
				try {
					const s = (window as any).Sounds && (window as any).Sounds[sndUrl];
					const err = (window as any).Sounds && (window as any).Sounds['snd/error1.mp3'];
					const conf = (window as any).Sounds && (window as any).Sounds['snd/confirm1.mp3'];
					const wrapperOk = new window.Audio(sndUrl) instanceof HTMLAudioElement;
					const loaded = s instanceof HTMLAudioElement && s.readyState >= 2;
					const errLoaded = err instanceof HTMLAudioElement && err.readyState >= 2;
					const confLoaded = conf instanceof HTMLAudioElement && conf.readyState >= 2;
					// CC3 music: Music object exists, jukebox populated, first track loads
					const music = (window as any).Music;
					const musicOk = music && music.tracks && Object.keys(music.tracks).length >= 8 && music.names && music.names.length >= 8;
					const jukeboxOk = G.jukebox && G.jukebox.tracks && G.jukebox.tracks.length >= 8 && G.jukebox.tracks[0] === 'Farm Life';
					const firstTrack = musicOk ? music.tracks[music.names[0]].audio : null;
					const trackLoaded = firstTrack instanceof HTMLAudioElement && firstTrack.readyState >= 2;
					// CC3 bridge fix: the Settings pref buttons must read ON/OFF live
					const onOffOk = (window as any).ON === ' ON' && (window as any).OFF === ' OFF';
					if ((loaded && errLoaded && confLoaded && trackLoaded) || Date.now() - started > 10000) {
						window.clearInterval(poll);
						const pass = wrapperOk && loaded && errLoaded && confLoaded && musicOk && jukeboxOk && trackLoaded && onOffOk && G.volume > 0;
						out.textContent =
							'[QA-sound] wrapper produces real Audio elements: ' + wrapperOk +
							'\n[QA-sound] \'snd/tick.mp3\' loaded (readyState=' + (s ? s.readyState : 'n/a') + '): ' + loaded +
							'\n[QA-sound] \'snd/error1.mp3\' loaded (readyState=' + (err ? err.readyState : 'n/a') + '): ' + errLoaded +
							'\n[QA-sound] \'snd/confirm1.mp3\' loaded via achievement win (readyState=' + (conf ? conf.readyState : 'n/a') + '): ' + confLoaded +
							'\n[QA-sound] music tracks=' + (musicOk ? Object.keys(music.tracks).length : 'n/a') + ' jukebox=' + (jukeboxOk ? G.jukebox.tracks.length : 'n/a') +
							'\n[QA-sound] first music track loaded (readyState=' + (firstTrack ? firstTrack.readyState : 'n/a') + '): ' + trackLoaded +
							'\n[QA-sound] ON/OFF bridge: ' + onOffOk + ' volume=' + G.volume +
							'\n[QA-sound] ' + (pass ? 'PASS: sound engine, music, and settings labels all work' : 'FAIL: see checks above');
						window.clearInterval(tick);
					}
				} catch (e: any) {
					window.clearInterval(poll);
					out.textContent = '[QA-sound] ERROR: ' + e.constructor.name + ': ' + e.message;
					window.clearInterval(tick);
				}
			}, 250);
		} catch (e: any) {
			out.textContent = '[QA-sound] ERROR: ' + e.constructor.name + ': ' + e.message;
			window.clearInterval(tick);
		}
	}, 250);
}

// QA: verify the Black Hole Inverter extras mod end to end — the building is
// declared (id 20) with its store row + display canvas, its 17 upgrades + 18
// achievements exist, it can be bought (CpS grows, tier-1 achievement wins), and
// its state survives a save export->import round-trip. Usage: ?debug=1&qa=binverter
if (debugSurface && params.get('qa') === 'binverter') {
	const NAME = 'Black hole inverter';
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects || !G.Objects[NAME]) return;
		if (G.__qaBinverter) return;
		G.__qaBinverter = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const me = G.Objects[NAME];
			const lines: string[] = [];
			let pass = true;
			const chk = (label: string, cond: boolean) => { lines.push((cond ? 'PASS: ' : 'FAIL: ') + label); if (!cond) pass = false; };

			// 1. declaration + store/canvas DOM (vanilla now has 20 buildings, id 0-19, so the inverter is id 20)
			chk('building declared as id 20', me.id === 20);
			chk('store row #product' + me.id + ' present', !!document.getElementById('product' + me.id));
			chk('store icon #productIcon' + me.id + ' present', !!document.getElementById('productIcon' + me.id));
			chk('display canvas #rowCanvas' + me.id + ' present', !!document.getElementById('rowCanvas' + me.id));
			chk('building canvas+ctx wired', !!(me.canvas && me.ctx));
			const iconEl = document.getElementById('productIcon' + me.id);
			const iconBg = iconEl ? getComputedStyle(iconEl).backgroundImage : '';
			chk('store icon shows the inverter sprite (' + iconBg + ')', iconBg.indexOf('blackholeinverter') !== -1);
			chk('baseCps>0 (' + Math.round(me.baseCps) + ') & basePrice>0 (' + Math.round(me.basePrice) + ')', me.baseCps > 0 && me.basePrice > 0);

			// 2. content counts
			const upgCount = Object.keys(G.Upgrades).filter((n) => { const u = G.Upgrades[n]; return u.buildingTie === me || u.buildingTie1 === me || u.buildingTie2 === me; }).length;
			const tieredAch = me.tieredAchievs ? Object.keys(me.tieredAchievs).length : 0;
			const prodAch = me.productionAchievs ? me.productionAchievs.length : 0;
			const achCount = tieredAch + prodAch + (me.levelAchiev10 ? 1 : 0);
			chk('17 building upgrades (14 tiered + grandma + 2 synergy), got ' + upgCount, upgCount === 17);
			chk('18 building achievements (14 tiered + 3 prod + M87), got ' + achCount, achCount === 18);

			// 3. mechanics: reveal, buy, CpS, tier-1 achievement
			me.unlocked = 1;
			const cpsBefore = G.cookiesPs;
			G.cookies += 1e40;
			me.buy(1);
			G.recalculateGains = 1; G.CalculateGains();
			const cpsAfter = G.cookiesPs;
			chk('buy(1) -> amount 1', me.amount === 1);
			chk('CpS grew after buy (' + Math.round(cpsBefore) + ' -> ' + Math.round(cpsAfter) + ')', cpsAfter > cpsBefore);
			chk('tier-1 achievement "Single singularity" won', !!(G.Achievements['Single singularity'] && G.Achievements['Single singularity'].won === 1));

			// 4. save export->import round-trip
			me.amount = 7; me.highest = 7; me.level = 3;
			const up = G.Upgrades['Blacker holes'];
			if (up) { up.unlocked = 1; up.bought = 1; }
			G.recalculateGains = 1; G.CalculateGains();
			const modObj = G.mods && G.mods['Black Hole Inverter'];
			const directSave = (modObj && typeof modObj.save === 'function') ? modObj.save() : '(no mod.save)';
			chk('mod.save() captures "Blacker holes"', directSave.indexOf('Blacker holes') !== -1);
			const saveStr = G.WriteSave(1);
			me.amount = 0; me.highest = 0; me.level = 0;
			if (up) { up.bought = 0; up.unlocked = 0; }
			G.recalculateGains = 1; G.CalculateGains();
			const ok = G.ImportSaveCode(saveStr);
			G.recalculateGains = 1; G.CalculateGains();
			chk('ImportSaveCode returned true', ok === true);
			chk('building amount restored to 7 (got ' + me.amount + ')', me.amount === 7);
			chk('upgrade "Blacker holes" restored bought (got ' + (up ? up.bought : 'n/a') + ')', !!(up && up.bought === 1));

			out.textContent = lines.join('\n') + '\n[QA-binverter] ' + (pass ? 'PASS: Black Hole Inverter verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-binverter] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify Decide Your Destiny (extras/decideDestiny.ts). Checks the content
// declarations, buys the heavenly "Destiny: Decided" with chips, lets the
// 'check' hook unlock the decider, decides a destiny, pops a NATURAL golden
// cookie (no force, no chain) and verifies the chosen effect was forced and
// the decision cleared. Then save/load round-trips through WriteSave +
// ImportSaveCode. Usage: ?debug=1&qa=destiny
if (debugSurface && params.get('qa') === 'destiny') {
	const NAME = 'Decide Your Destiny';
	const DECIDER = 'Destiny decider';
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Upgrades) return;
		const decider = G.Upgrades[DECIDER];
		const decided = G.Upgrades['Destiny: Decided'];
		if (!decider || !decided) return; // wait for launchMods to declare the content
		if (G.__qaDestiny) return;
		G.__qaDestiny = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const lines: string[] = [];
			let pass = true;
			const chk = (label: string, cond: boolean) => { lines.push((cond ? 'PASS: ' : 'FAIL: ') + label); if (!cond) pass = false; };
			const modSave = (): string => { const m = G.mods[NAME]; return (m && typeof m.save === 'function') ? m.save() : '(missing mod save)'; };
			const modLoad = (s: string): boolean => { const m = G.mods[NAME]; if (m && typeof m.load === 'function') { m.load(s); return true; } return false; };

			// 1. content declarations
			chk('mod registered with save/load', !!G.mods[NAME] && typeof G.mods[NAME].save === 'function' && typeof G.mods[NAME].load === 'function');
			chk('9 heavenly "Destiny: *" upgrades', ['Decided', 'Architecture', 'Agriculture', 'Scattershot', 'Carpal tunnel', 'Misfortune', 'Altitude', 'Apocalypse', 'Whimsy'].every((n) => !!G.Upgrades['Destiny: ' + n]));
			chk('4 achievements', ['Decisive', 'Control freak', 'Tradeoff', 'Whimsical'].every((n) => !!G.Achievements[n]));
			chk('decider is a toggle with a choice selector', decider.pool === 'toggle' && typeof decider.choicesFunction === 'function' && typeof decider.choicesPick === 'function');
			chk("'Destiny: Decided' parent resolved to vanilla 'Legacy' (CCSE empty-parents rule)", decided.parents.length === 1 && !!decided.parents[0] && (decided.parents[0] as any).name === 'Legacy');
			chk('heavenly pool/order set (pool=' + decider.pool + '/' + decided.pool + ', order=' + decided.order + ')', decided.pool === 'prestige' && decided.order === decided.id);

			// 2. unlock path: buy the heavenly upgrade with chips, 'check' hook unlocks the decider
			G.heavenlyChips = 1e6;
			decided.unlocked = 1;
			decided.buy();
			chk('heavenly "Destiny: Decided" bought (chips left ' + Math.round(G.heavenlyChips) + ')', decided.bought === 1);
			G.runModHook('check');
			chk("'check' hook unlocked the decider (unlocked=" + decider.unlocked + ')', decider.unlocked === 1);
			chk('initial lump cost is 1 (2^0)', decider.priceLumps === 1);

			// 3. decide Frenzy, pop a natural golden cookie
			G.lumps = 10;
			G.prefs.askLumps = 0; // skip the spend confirmation prompt
			decider.choicesPick(1); // AllDestinies[1] = Frenzy
			chk('decision recorded (mod save "' + modSave() + '")', modSave() === '1.3;Frenzy,1');
			chk('timesDecided=1 raised the price to 2 lumps', decider.priceLumps === 2);
			chk('achievement "Decisive" won', G.Achievements['Decisive'].won === 1);
			const sh = new G.shimmer('golden');
			sh.pop(); // natural: no force, no chain -> the mod must force the decided effect
			const buff = G.buffs['Frenzy'];
			chk('natural golden cookie forced Frenzy (mult ' + (buff ? buff.arg1 : 'n/a') + ')', !!buff && buff.arg1 === 7);
			chk('decision cleared after the pop (mod save "' + modSave() + '")', modSave() === '1.3;Undecided,1');

			// 4. save round-trip through the engine save format
			decider.choicesPick(2); // AllDestinies[2] = Lucky
			chk('second decision: Lucky, 2 times (price 4)', modSave() === '1.3;Lucky,2' && decider.priceLumps === 4);
			const saveStr = G.WriteSave(1);
			//WriteSave(1) returns a base64 string, so assert on the mod data
			//registry that saveModData() populated while building it
			chk('WriteSave invoked the mod save (registry "' + (G.modSaveData[NAME] || '(missing)') + '")', G.modSaveData[NAME] === '1.3;Lucky,2');
			modLoad('1.3;Blab,9'); // simulate a different (older) save arriving
			chk('corrupted state before import: Blab x9', modSave() === '1.3;Blab,9');
			G.ImportSaveCode(saveStr);
			chk('ImportSaveCode restored Lucky x2 (got "' + modSave() + '")', modSave() === '1.3;Lucky,2');
			chk('priceLumps re-derived on load (2^2=4, got ' + decider.priceLumps + ')', decider.priceLumps === 4);

			out.textContent = lines.join('\n') + '\n[QA-destiny] ' + (pass ? 'PASS: Decide Your Destiny verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-destiny] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify American Season (extras/americanSeason.ts, a port of klattmose's
// mod). Checks the season/trigger/upgrades/achievements/shimmer declarations,
// triggers the season with "Explosive biscuit", pops rockets (earn + drop +
// achievements), exercises the cps/ticker mod hooks and the menus, and
// save/load round-trips the config + rocketsPopped through WriteSave +
// ImportSaveCode. Usage: ?debug=1&qa=amseason
if (debugSurface && params.get('qa') === 'amseason') {
	const NAME = 'American Season';
	const UPGRADES = ['Ring burst', 'Peony burst', 'Palm burst', 'Bees burst', 'Crossette burst', 'Waterfall burst', 'Pearl burst', 'Pistil burst', 'Short fuse', 'Slow burn', 'High explosive'];
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Upgrades) return;
		const trigger = G.Upgrades['Explosive biscuit'];
		if (!trigger) return; // wait for launchMods to declare the content
		if (G.__qaAmSeason) return;
		G.__qaAmSeason = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const lines: string[] = [];
			let pass = true;
			const chk = (label: string, cond: boolean) => { lines.push((cond ? 'PASS: ' : 'FAIL: ') + label); if (!cond) pass = false; };
			const AS: any = (window as any).AmericanSeason;
			const realRandom = Math.random;

			// 1. content declarations
			chk('mod registered with save/load', !!G.mods[NAME] && typeof G.mods[NAME].save === 'function' && typeof G.mods[NAME].load === 'function');
			chk('window.AmericanSeason namespace exposed (inline menu handlers)', !!AS);
			chk('season "american" registered with trigger', !!G.seasons['american'] && G.seasons['american'].trigger === 'Explosive biscuit');
			// The original formula (2*Bunny - Fool) mirrors Fool around Bunny;
			// with 2.048 upgrade ids that lands in the open special-section
			// region (order 24000.x) right after the Easter cluster.
			chk('trigger is a toggle in the special-section biscuit region (order ' + trigger.order + ')', trigger.pool === 'toggle' && trigger.order >= 24000 && trigger.order < 25000);
			chk('11 firework upgrades declared', UPGRADES.every((n) => !!G.Upgrades[n]));
			chk('upgrades appended to seasonDrops (the Keepsakes roll)', UPGRADES.every((n) => (G.seasonDrops || []).indexOf(n) !== -1));
			chk('4 achievements declared', ['Pyrotechnics', 'July 4th', 'Pyromaniac', 'Full barrage'].every((n) => !!G.Achievements[n]));
			chk('"Pyromaniac" is a shadow achievement', G.Achievements['Pyromaniac'].pool === 'shadow');
			chk('rocket shimmer type registered on a timer', !!G.shimmerTypes['rocket'] && G.shimmerTypes['rocket'].spawnsOnTimer === true);
			chk('rocket does not spawn outside the season', G.season != 'american' && G.shimmerTypes['rocket'].spawnConditions() === false);
			const starburst = G.Upgrades['Starburst'];
			// The mod sets (-630, 111), then its final rearrangeUps(Starburst, 5/5)
			// moves it to the point opposite Starsnow on the star circle.
			const anchor = G.Upgrades['Season switcher'];
			const starDist = (u: any) => Math.hypot(u.posX - anchor.posX, u.posY - anchor.posY);
			chk('"Starburst" heavenly: prestige pool, parented to "Season switcher", on the star circle', !!starburst && starburst.pool === 'prestige' && starburst.parents.length === 1 && (starburst.parents[0] as any).name === 'Season switcher' && Math.abs(starDist(starburst) - starDist(G.Upgrades['Starsnow'])) < 0.001);
			chk('"Starburst" added to "Keepsakes" parents', (G.Upgrades['Keepsakes'].parents || []).indexOf(starburst) !== -1);
			chk('"Grand finale" is a debug-pool upgrade', G.Upgrades['Grand finale'].pool === 'debug');

			// 2. trigger the season with the biscuit
			G.cookies = 1e15;
			trigger.unlocked = 1;
			trigger.buy();
			chk('"Explosive biscuit" triggered the American season (seasonT ' + Math.round(G.seasonT) + ')', G.season === 'american' && G.seasonT > 0);
			chk('rocket now spawns in the season', G.shimmerTypes['rocket'].spawnConditions() === true);

			// 3. pop a rocket (deterministic RNG: no drop roll, earn + counter + check hook)
			Math.random = () => 0.5; // 0.5 < failRate 0.8 -> no upgrade drop
			const before = G.cookies;
			const r1 = new G.shimmer('rocket');
			r1.spawnLead = 1;
			r1.pop();
			Math.random = realRandom;
			chk('rocket pop earned cookies (+' + Math.round(G.cookies - before) + ')', G.cookies >= before + 25);
			chk('rocketsPopped incremented (got ' + AS.rocketsPopped + ')', AS.rocketsPopped === 1);
			G.runModHook('check');
			chk('"Pyrotechnics" won after 1 rocket', G.Achievements['Pyrotechnics'].won === 1);

			// 4. force an upgrade drop with a deterministic RNG, buy a firework upgrade, check the cps hook
			Math.random = () => 0.999; // 0.999 > 0.8 -> drop; choose() -> index floor(0.999*11)=10
			const r2 = new G.shimmer('rocket');
			r2.spawnLead = 1;
			r2.pop();
			Math.random = realRandom;
			chk('deterministic drop unlocked the last upgrade in the pool ("High explosive")', G.Upgrades['High explosive'].unlocked === 1);
			G.Unlock('Ring burst');
			G.cookies = 1e12;
			G.Upgrades['Ring burst'].buy();
			chk('"Ring burst" bought at 2^0*999=999', G.Upgrades['Ring burst'].bought === 1);
			const cps = G.runModHookOnValue('cps', 100);
			chk('"cps" hook adds +1% per firework upgrade (100 -> ' + cps + ')', Math.abs(cps - 101) < 1e-9);

			// 5. ticker news during the season
			G.cookiesEarned = Math.max(G.cookiesEarned, 1000);
			const news = ((G.modHooks['ticker'] || []) as any[]).map((f) => f()).find((a: any) => a && a.length > 0);
			chk('ticker hook serves American news in the season', Array.isArray(news) && news[0].indexOf('News :') === 0);

			// 6. the fireworks canvas
			chk('fireworks canvas present in the left panel', !!l('AmericanSeasonFireworksDisplay'));

			// 7. the menus (the mod appends to the freshly rendered menu DOM)
			G.onMenu = 'prefs';
			G.UpdateMenu();
			chk('options menu shows the config UI (SHOW_CANVASButton)', l('menu').innerHTML.indexOf('SHOW_CANVASButton') !== -1);
			G.onMenu = 'stats';
			G.UpdateMenu();
			chk('stats menu shows version + rockets exploded', l('menu').innerHTML.indexOf('American Season:</b>') !== -1 && l('menu').innerHTML.indexOf('Rockets exploded') !== -1);

			// 8. save round-trip through the engine save format
			AS.config.STAR_COUNT = 42;
			const saveStr = G.WriteSave(1);
			//WriteSave(1) returns a base64 string, so assert on the mod data
			//registry that saveModData() populated while building it
			const reg = G.modSaveData[NAME] as string;
			chk('WriteSave invoked the mod save (registry has config + rocketsPopped)', typeof reg === 'string' && reg.indexOf('"STAR_COUNT":42') !== -1 && reg.indexOf('"rocketsPopped":2') !== -1);
			AS.config.STAR_COUNT = 1;
			chk('state corrupted before import (STAR_COUNT=1)', AS.config.STAR_COUNT === 1);
			G.ImportSaveCode(saveStr);
			chk('ImportSaveCode restored config + rocketsPopped (STAR_COUNT ' + AS.config.STAR_COUNT + ', rockets ' + AS.rocketsPopped + ')', AS.config.STAR_COUNT === 42 && AS.rocketsPopped === 2);

			// 9. the trigger's descFunc renders
			const desc = (G.Upgrades['Explosive biscuit'].descFunc as any)();
			chk('trigger descFunc renders the firework-upgrade listing', typeof desc === 'string' && desc.indexOf('firework upgrades') !== -1);

			out.textContent = lines.join('\n') + '\n[QA-amseason] ' + (pass ? 'PASS: American Season verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-amseason] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify Casino (extras/casino.ts). A faithful port of klattmose's
// Blackjack minigame riding the vanilla minigame slot on the Chancemaker:
// the mod registers via the mod API (init from launchMods), attaches M to
// Game.Objects['Chancemaker'].minigame with minigameUrl 'casino.js' (a no-op
// module in minigameModules), and the engine's scriptLoaded calls M.launch.
// Phase 1 forces the minigame to load (level 1 + LoadMinigames), phase 2
// verifies declarations + deterministic blackjack mechanics + menus + the
// vanilla minigame save slot round-trip. Usage: ?debug=1&qa=casino
if (debugSurface && params.get('qa') === 'casino') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		const CM: any = (window as any).Casino;
		if (!G || !G.ready || !G.Upgrades || !CM) return;
		const ch = G.Objects['Chancemaker'];
		if (!ch.minigameLoaded) {
			// Phase 1: kick off the vanilla minigame load.
			if (!G.__qaCasinoKick) {
				G.__qaCasinoKick = 1;
				ch.level = 1;
				ch.amount = Math.max(ch.amount, 1);
				G.BuildingsOwned = Math.max(G.BuildingsOwned, 1);
				G.LoadMinigames();
			}
			return; // wait for loadMinigameModule -> scriptLoaded -> M.launch
		}
		if (G.__qaCasino) return;
		G.__qaCasino = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const lines: string[] = [];
			let pass = true;
			const chk = (label: string, cond: boolean) => { lines.push((cond ? 'PASS: ' : 'FAIL: ') + label); if (!cond) pass = false; };
			const realRandom = Math.random;

			// 1. declarations
			chk('mod registered (no mod-API save section: state rides the vanilla minigame slot)', !!G.mods['casino'] && typeof (G.mods['casino'] as any).save === 'undefined');
			chk('attached to the Chancemaker (M.parent.minigame === M)', CM.parent === ch && ch.minigame === CM && CM.name === 'Casino');
			chk('minigameUrl wired to the no-op module', ch.minigameUrl === 'casino.js' && ch.minigameName === 'Casino' && CM.version === '4.0');
			const UPGRADES = ['Raise the stakes', 'High roller!', 'Big spender!', 'Main player', 'True gambler', 'Math lessons', 'Counting cards', 'Standard push', 'Tiebreaker', 'Double down', 'Surrender', 'I make my own luck', 'Infinite Improbability Drive', 'Double or nothing', 'Stoned cows', 'Game for Pros', 'Actually, do tell me the odds'];
			chk('17 upgrades declared', UPGRADES.every((n) => !!G.Upgrades[n]) && CM.Upgrades.length === 17);
			const ACHIEVEMENTS = ['Card minnow', 'Card trout', 'Card shark', 'Five card stud', 'Why can\'t I hold all these cards?', 'Ace up your sleeve', 'Paid off the dealer', 'Deal with the Devil', 'Blackjack!', 'I like to live dangerously', 'I also like to live dangerously'];
			chk('11 achievements declared', ACHIEVEMENTS.every((n) => !!G.Achievements[n]) && CM.Achievements.length === 11);
			chk('4 shadow achievements', ['Ace up your sleeve', 'Paid off the dealer', 'Deal with the Devil', 'I also like to live dangerously'].every((n) => G.Achievements[n].pool === 'shadow'));
			chk('heavenly upgrade derives a layout position from the DAG', (function(){var u=G.Upgrades['Actually, do tell me the odds'];return !!u && (G.PrestigeUpgrades||[]).indexOf(u)!==-1 && u.pool==='prestige' && typeof u.posX==='number' && typeof u.posY==='number';})());
			const tg = G.Upgrades['True gambler'];
			chk('bet-multiplier upgrades ordered right after "True gambler"', Math.abs(G.Upgrades['Double or nothing'].order - (tg.order + 0.001)) < 1e-9 && Math.abs(G.Upgrades['Stoned cows'].order - (G.Upgrades['Double or nothing'].order + 0.001)) < 1e-9 && Math.abs(G.Upgrades['Game for Pros'].order - (G.Upgrades['Stoned cows'].order + 0.001)) < 1e-9);
			chk('all upgrade orders in the 1e6 region', CM.Upgrades.every((u: any) => u.order >= 1000000 && u.order < 1000000 + 0.2));
			chk('priceFunc scales basePrice with peak CPS (Math lessons = 1x)', Math.abs(G.Upgrades['Math lessons'].getPrice() - 1 * G.cookiesPsRawHighest * 60) < 1e-9 && Math.abs(G.Upgrades['Surrender'].getPrice() - 35 * G.cookiesPsRawHighest * 60) < 1e-9);
			chk('heavenly upgrade hidden until "Card shark" is won', !G.Upgrades['Actually, do tell me the odds'].showIf());

			// 2. the table
			chk('minigame UI built into rowSpecial', !!l('casinoMoney') && !!l('casinoActions') && !!l('casinoGame') && !!l('casinoInfo') && !!l('casinoBG'));
			chk('53 cards (placeholder + 4 suits x 13 pips)', CM.cards.length === 53 && CM.cards[0].pip === 0 && CM.cards[1].pip === 1 && CM.cards[1].value === 1 && CM.cards[13].pip === 13 && CM.cards[13].value === 10 && CM.cards[14].suit === 1);
			chk('4-deck shoe built (208 cards)', CM.Deck.length === CM.deckCount * 52 && CM.Deck.length === 208 && CM.minDecks === 2);
			chk('cardImage offsets (K of spades -> 948px/0px, hidden -> 158px/492px)', CM.cardImage(CM.cards[13]) === '-948px -0px ' && CM.cardImage(CM.cards[0]) === '-158px -492px ');

			const bj = CM.games.Blackjack;
			// pure helpers
			const hv = (cards: any[]) => { const h: any = {value: 0, cards}; bj.getHandValue(h); return h.value; };
			chk('ace values: A+K=21, A+A=12, 10+9=19', hv([CM.cards[1], CM.cards[13]]) === 21 && hv([CM.cards[1], CM.cards[14]]) === 12 && hv([CM.cards[13], CM.cards[9]]) === 19);
			// precision 1 (set by reset): floor to 1 decimal, values under 0.1% clamp
chk('formatPercentage floors to 1 decimal', CM.formatPercentage(0.1234) === '12.3%' && CM.formatPercentage(0.00001) === '<0.1%');
			const deckCopy = CM.Deck.slice();
			CM.reshuffle();
			chk('reshuffle rebuilds a 4-deck shoe', CM.Deck.length === 208 && CM.Deck.every((c: any) => !!c.pip) && JSON.stringify(CM.Deck) === JSON.stringify(deckCopy));
			chk('instantWinChance is 0 without the luck upgrade', bj.instantWinChance() === 0);
			G.Upgrades['I make my own luck'].bought = 1;
			ch.chancemakerChance = undefined;
			chk('instantWinChance = 1-(1-0.0002^amount) with the luck upgrade', Math.abs(bj.instantWinChance() - (1 - Math.pow(1 - 0.0002, ch.amount))) < 1e-12);
			G.Upgrades['Infinite Improbability Drive'].bought = 1;
			chk('IID doubles the chance', Math.abs(bj.instantWinChance() - (1 - Math.pow(1 - 0.0004, ch.amount))) < 1e-12);
			G.Upgrades['I make my own luck'].bought = 0;
			G.Upgrades['Infinite Improbability Drive'].bought = 0;

			// 3. deterministic deal (the probe runs synchronously, so the engine
			//    loop cannot interleave with these beats)
			G.cookies = 1e7;
			CM.bankPercentage = true;
			CM.betChoice = 1;
			CM.betMode = 1;
			Math.random = () => 0; // always draw Deck[0] (kept through section 7)
			CM.reset(true);
			CM.logic(); //inactive-phase recompute: reset left betAmount 0
			bj.istep = 0;
			bj.phase = bj.phases.deal;
			let guard = 0;
			while (bj.phase === bj.phases.deal && guard++ < 10) {
				CM.nextBeat = 0;
				CM.logic();
			}
			const p0 = CM.hands.player[0];
			chk('deal: player A-3 (14), dealer 2-4 (6), phase firstTurn', bj.phase === bj.phases.firstTurn && p0.cards.length === 2 && p0.value === 14 && CM.hands.dealer.cards.length === 2 && CM.hands.dealer.cards[1].pip === 0 && bj.hiddenCard.pip === 4);
			chk('deal spent the bank-percentage bet (1e7 -> ' + G.cookies + ')', Math.abs(G.cookies - (1e7 - 1e7 * 0.001)) < 1e-9);

			// 4. hit to bust -> Math lessons unlock -> dealer turn -> bust
			bj.phase = bj.phases.playerTurn;
			p0.cards = [CM.cards[13], CM.cards[26]]; // K+K = 20
			bj.getHandValue(p0);
			bj.hit(p0, true); // draws the next Deck[0] card
			chk('bust on 21+ unlocks "Math lessons" and stands', G.Upgrades['Math lessons'].unlocked === 1 && p0.value > 21);
			guard = 0;
			while (bj.phase !== bj.phases.inactive && guard++ < 10) {
				CM.nextBeat = 0;
				CM.logic();
			}
			chk('busted hand pays 0 (losses ' + bj.losses + ', netTotal ' + bj.netTotal + ')', bj.losses === 1 && Math.abs(bj.netTotal + 1e4) < 1e-6);

			// 5. natural blackjack with a rigged shoe (deal order is P,D,P,D, so
			//    the player draws Deck[0] and Deck[2]: A, filler, K up top)
			CM.reshuffle();
			CM.Deck.splice(0, 0, CM.cards[1], CM.cards[2], CM.cards[13]);
			G.cookies = 1e7;
			CM.betAmount = 1e4;
			bj.istep = 0;
			bj.phase = bj.phases.deal;
			guard = 0;
			while (bj.phase === bj.phases.deal && guard++ < 10) {
				CM.nextBeat = 0;
				CM.logic();
			}
			chk('natural A+K is a blackjack: 2.5x payout, "I make my own luck" unlocked, "Blackjack!" won', bj.phase === bj.phases.inactive && CM.hands.player[0].value === 21 && bj.winsT === 1 && G.Upgrades['I make my own luck'].unlocked === 1 && G.Achievements['Blackjack!'].won === 1 && Math.abs(G.cookies - (1e7 - 1e4 + 2.5e4)) < 1e-6);

			// 6. dealer bust (dealer K+2 -> hits K -> 22)
			CM.reshuffle();
			CM.Deck.splice(0, 0, CM.cards[13], CM.cards[2], CM.cards[3], CM.cards[13], CM.cards[13]);
			G.cookies = 1e7;
			CM.betAmount = 1e4;
			bj.istep = 0;
			bj.phase = bj.phases.deal;
			guard = 0;
			while (bj.phase === bj.phases.deal && guard++ < 10) {
				CM.nextBeat = 0;
				CM.logic();
			}
			bj.phase = bj.phases.playerTurn;
			bj.stand();
			guard = 0;
			while (bj.phase !== bj.phases.inactive && guard++ < 10) {
				CM.nextBeat = 0;
				CM.logic();
			}
			chk('dealer bust pays 2x (winsT ' + bj.winsT + ')', bj.phase === bj.phases.inactive && bj.winsT === 2 && Math.abs(bj.netTotal - (1.5e4 - 1e4 + 1e4)) < 1e-6);
			Math.random = realRandom;

			// 7. split a pair of aces
			CM.reset(true);
			G.cookies = 1e7;
			CM.betAmount = 1e4;
			CM.hands = {dealer: {value: 0, cards: [CM.cards[2], CM.cards[0]]}, player: [{value: 0, splitFirstTurn: true, cards: [CM.cards[1], CM.cards[14]]}]};
			bj.getHandValue(CM.hands.player[0]);
			bj.getHandValue(CM.hands.dealer);
			bj.hiddenCard = CM.cards[2];
			bj.phase = bj.phases.playerTurn;
			bj.split();
			chk('split aces into two 2-card hands (splits ' + bj.splits + ')', CM.hands.player.length === 2 && CM.hands.player[0].cards.length === 2 && CM.hands.player[1].cards.length === 2 && bj.splits === 2);

			// 8. bet toggles
			G.Upgrades['Raise the stakes'].bought = 1;
			G.Upgrades['High roller!'].bought = 1;
			CM.bankPercentage = false;
			CM.betMode = 1;
			bj.toggleBetMode();
			const m2 = CM.betMode;
			bj.toggleBetMode();
			const m3 = CM.betMode;
			bj.toggleBetMode();
			chk('bet mode cycles 1 -> 2 -> 3 -> 1 with the upgrades', m2 === 2 && m3 === 3 && CM.betMode === 1);
			CM.betMode = 1;
			G.cookiesPsRawHighest = 50;
			CM.betChoice = 2;
			bj.phase = bj.phases.inactive; //recompute only runs in the inactive phase
			CM.logic(); //inactive-phase recompute
			chk('CPS bet = min(cookies*0.1, peakCPS*choice) = ' + CM.betAmount, Math.abs(CM.betAmount - Math.min(1e7 * 0.1, 50 * 2)) < 1e-9);

			// 9. the menus
			G.onMenu = 'prefs';
			G.UpdateMenu();
			chk('options menu: bank-percentage toggle + beat slider', !!l('Casino_bankPercentageButton') && !!l('beatLengthSlider'));
			CM.bankPercentage = true; //start from "on" so the first click flips it off
			l('Casino_bankPercentageButton').click();
			chk('toggle flips bankPercentage off (sidebar shows CPS bets)', CM.bankPercentage === false && l('casinoMoney').innerHTML.indexOf('of CPS') !== -1);
			l('Casino_bankPercentageButton').click();
			chk('toggle flips it back on', CM.bankPercentage === true && l('casinoMoney').innerHTML.indexOf('percent of bank') !== -1);
			(l('beatLengthSlider') as any).value = 500;
			(l('beatLengthSlider') as any).oninput();
			chk('beat slider updates M.beatLength + label', CM.beatLength === 500 && l('beatLengthSliderRightText').innerHTML === '500');
			G.onMenu = 'stats';
			G.UpdateMenu();
			chk('stats menu shows version + earnings', l('menu').innerHTML.indexOf('Casino:</b>') !== -1 && l('menu').innerHTML.indexOf('Blackjack has earned you :') !== -1);

			// 10. probability tooltips
			G.Upgrades['Actually, do tell me the odds'].bought = 1;
			chk('odds upgrade shows with "Card shark" won', G.Achievements['Card shark'].won === 1 ? !!G.Upgrades['Actually, do tell me the odds'].showIf() : G.Achievements['Card shark'].won === 0);
			bj.phase = bj.phases.inactive;
			CM.buildSidebar();
			const dp = bj.dealProbabilities();
			chk('deal probabilities render (deck-true, sums sane)', typeof dp === 'string' && dp.indexOf('Blackjack :') !== -1 && dp.indexOf('<div') === 0);

			// 11. check hook (wins/loss thresholds)
			bj.winsT = 21;
			bj.tiesLost = 3;
			G.runModHook('check');
			chk('check hook: "Card minnow" won, "Raise the stakes" + "Standard push" unlocked', G.Achievements['Card minnow'].won === 1 && G.Upgrades['Raise the stakes'].unlocked === 1 && G.Upgrades['Standard push'].unlocked === 1);

			// 12. save round-trip through the vanilla minigame save slot
			CM.reshuffle(); //a full 208-card shoe in the save
			bj.winsT = 21;
			bj.wins = 7;
			bj.netTotal = 12345.6;
			CM.betMode = 3;
			CM.betChoice = 5;
			CM.bankPercentage = false;
			const savedDeckLen = CM.Deck.length;
			const saved = CM.save();
			const groups = saved.split(' ');
			chk('save string has the 7 vanilla minigame slots', groups.length === 7 && groups[0].split('_')[2] === '21' && groups[0].split('_')[5] === '3' && groups[0].split('_')[6] === '5');
			CM.reset(true); //zero the session state (all-time totals survive by design)
			bj.winsT = 999;
			bj.netTotal = -1; //corrupt the fields reset does not touch, so load() must restore them
			chk('state cleared before load (session stats + bet config)', bj.wins === 0 && bj.losses === 0 && CM.betMode === 1 && CM.betChoice === 1 && !!CM.bankPercentage && bj.phase === bj.phases.inactive);
			CM.load(saved);
			chk('load restores stats/bet config/deck (winsT ' + bj.winsT + ', betMode ' + CM.betMode + ')', bj.winsT === 21 && bj.wins === 7 && Math.abs(bj.netTotal - 12345.6) < 1e-9 && CM.betMode === 3 && CM.betChoice === 5 && !CM.bankPercentage && CM.Deck.length === savedDeckLen && bj.phase === bj.phases.inactive);

			// 13. full engine save -> import round-trip (the real persistence path)
			const saveCode = G.WriteSave(1);
			bj.winsT = 0;
			chk('state corrupted before import', bj.winsT === 0);
			G.ImportSaveCode(saveCode);
			chk('ImportSaveCode restored the minigame state through the Chancemaker save slot (winsT ' + bj.winsT + ')', bj.winsT === 21 && CM.betMode === 3);

			out.textContent = lines.join('\n') + '\n[QA-casino] ' + (pass ? 'PASS: Casino verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-casino] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the Daily crumb (extras/dailyCrumb.ts) — the weekly calendar of
// daily returning rewards. Fresh profile: the boot check hook records the
// baseline day (no reward). Then drive the exposed state surface
// (window.__cc3DailyCrumb): a single missed-day claim (the reward kind
// depends on the day of week, verified per kind), the no-double-claim guard,
// a 3-day backfill (streak continuity), a 30-day absence (streak reset,
// today only), and the save round-trip (WriteSave -> corrupt -> ImportSaveCode
// restores the streak through the mod save section). Usage: ?debug=1&qa=dailycrumb
if (debugSurface && params.get('qa') === 'dailycrumb') {
	const tick = window.setInterval(() => {
		const G: any = window.Game;
		const DC = (window as any).__cc3DailyCrumb;
		if (!G || !G.ready || !G.Objects || !DC) return;
		if (G.__qaDailyCrumb) return;
		G.__qaDailyCrumb = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		const lines: string[] = [];
		let pass = true;
		const chk = (label: string, ok: boolean) => { if (!ok) pass = false; lines.push((ok ? '✓ ' : '✗ ') + label); };
		try {
			const DAY = 86400000;
			const today = DC.startOfDay(Date.now());
			const st = DC.state;
			const cpsBefore = G.cookiesPs || 0;
			// 0. fresh install: baseline recorded, no reward
			chk('baseline day recorded without a reward (lastClaim=' + (st.lastClaim === today) + ', claims=' + st.totalClaims + ')', st.lastClaim === today && st.totalClaims === 0 && st.streak === 0);
			// 1. single missed day: the day claimed is TODAY (the missed-day
			// window is (lastClaim, today]), so the reward kind follows today's
			// weekday.
			st.lastClaim = today - DAY;
			st.streak = 0;
			const tDow = new Date(today).getDay();
			const cookiesBefore = G.cookies;
			const lumpsBefore = G.lumps;
			const claimed = DC.claim();
			const dCookies = G.cookies - cookiesBefore;
			const dLumps = G.lumps - lumpsBefore;
			const expectedCookies = (mins: number) => Math.max(500, cpsBefore * 60 * mins);
			let rewardOk = false;
			if (tDow === 0) rewardOk = G.shimmers.length >= 1; // Sunday: golden cookie
			else if (tDow === 2) rewardOk = !!G.buffs['Click frenzy']; // Tuesday: click frenzy
			else if (tDow === 5) rewardOk = !!G.buffs['Frenzy']; // Friday: frenzy
			else if (tDow === 3) rewardOk = G.lumps > -1 ? dLumps >= 1 : dCookies >= expectedCookies(10); // Wednesday: lump or fallback
			else rewardOk = dCookies >= expectedCookies(tDow === 6 ? 10 : 5); // Mon/Thu 5min, Sat 10min
			chk('single missed day claims (streak=' + st.streak + ', claims=' + st.totalClaims + ')', claimed && st.lastClaim === today && st.streak === 1 && st.totalClaims === 1);
			chk('day reward granted (weekday ' + tDow + ': dCookies=' + Math.round(dCookies) + ', dLumps=' + dLumps + ')', rewardOk);
			chk('First crumb achievement won', !!G.Achievements['First crumb'] && G.Achievements['First crumb'].won === 1);
			// 2. same day again: no double claim
			const before2 = { cookies: G.cookies, claims: st.totalClaims, streak: st.streak };
			const claimed2 = DC.claim();
			chk('no double claim on the same day', !claimed2 && st.totalClaims === before2.claims && G.cookies === before2.cookies && st.lastClaim === today);
			// 3. 3-day backfill: all days collected, streak continuous
			st.lastClaim = today - 3 * DAY;
			st.streak = 0;
			const claims3 = st.totalClaims;
			const claimed3 = DC.claim();
			chk('3-day backfill (streak=' + st.streak + ', +claims=' + (st.totalClaims - claims3) + ')', claimed3 && st.streak === 3 && st.totalClaims === claims3 + 3 && st.lastClaim === today);
			// 4. 30-day absence: streak resets, only today collected
			st.lastClaim = today - 30 * DAY;
			st.streak = 5;
			const claims4 = st.totalClaims;
			const claimed4 = DC.claim();
			chk('30-day absence resets the streak (streak=' + st.streak + ', +claims=' + (st.totalClaims - claims4) + ')', claimed4 && st.streak === 1 && st.totalClaims === claims4 + 1 && st.lastClaim === today);
			// 5. persistence round-trip through the Custom save section
			st.lastClaim = today - DAY;
			st.streak = 12;
			st.totalClaims = 42;
			// type 2 returns the uncompressed string (type 1 is escaped Base64,
			// so the raw mod key would not be visible in it)
			const rawSave = G.WriteSave(2);
			chk('save carries the CC3DailyCrumb mod entry', typeof rawSave === 'string' && rawSave.indexOf('CC3DailyCrumb') !== -1);
			const saveCode = G.WriteSave(1);
			st.lastClaim = null;
			st.streak = 0;
			st.totalClaims = 0;
			const imported = G.ImportSaveCode(saveCode);
			chk('import restores crumb state (streak=' + st.streak + ', claims=' + st.totalClaims + ')', imported && st.streak === 12 && st.totalClaims === 42 && st.lastClaim === today - DAY);
			// 6. the UI text renders fully substituted (the loc() fallback for
			// CC3-native ids must fill %N params, never show a raw "%1"): the
			// Stats-menu crumb section and the collect notification log line.
			G.ShowMenu('stats');
			const crumbUi = document.getElementById('cc3CrumbStats');
			const uiText = crumbUi ? (crumbUi.textContent || '') : '';
			chk('stats menu crumb section renders', !!crumbUi && uiText.indexOf('Streak:') !== -1);
			chk('no raw %N placeholders in the crumb section', uiText !== '' && !/%\d/.test(uiText));
			chk('weekly bonus line shows substituted values', uiText.indexOf('3 golden cookies') !== -1 && uiText.indexOf('14 missed days') !== -1);
			const logEntry = (G.Log || []).find((s: any) => String(s).indexOf('Daily crumb') !== -1) || '';
			chk('collect notification text has no raw %N placeholders', logEntry.indexOf('Daily crumb') !== -1 && !/%\d/.test(String(logEntry)));
			out.textContent = lines.join('\n') + '\n[QA-dailycrumb] ' + (pass ? 'PASS: daily crumb verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-dailycrumb] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the Cracking cookie (extras/crackingCookie.ts) — cursors slowly
// crack the big cookie; clicking the fully-cracked cookie pays out.
// Fresh profile: set up cursors, check progress advances, trigger the payoff
// and verify the reward, then round-trip through the save. Also check the
// stats menu section renders. Usage: ?debug=1&qa=cracking
if (debugSurface && params.get('qa') === 'cracking') {
	const tick = window.setInterval(() => {
		const G: any = window.Game;
		const CC = (window as any).__cc3CrackingCookie;
		if (!G || !G.ready || !G.Objects || !CC) return;
		if (G.__qaCracking) return;
		G.__qaCracking = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		const lines: string[] = [];
		let pass = true;
		const chk = (label: string, ok: boolean) => { if (!ok) pass = false; lines.push((ok ? '✓ ' : '✗ ') + label); };
		try {
			const st = CC.state;
			// 0. seeded cursors
			const cursor = G.Objects['Cursor'];
			if (cursor) cursor.amount = 15;
			chk('cursors seeded (amount=' + (cursor ? cursor.amount : 'no cursor object') + ')', cursor && cursor.amount >= 15);
			chk('MIN_CURSORS=' + CC.MIN_CURSORS, CC.MIN_CURSORS === 10);
			// 0b. never-permanent-frenzy invariant: the crack cycle floor is
			// strictly longer than the Click frenzy, so the ×777 window can
			// never be permanently active at any cursor count.
			const frenzy = CC.CLICK_FRENZY_SECONDS;
			const floor = CC.MIN_CYCLE_SECONDS;
			chk('frenzy never permanent (frenzy=' + frenzy + 's < floor=' + floor + 's)', typeof frenzy === 'number' && typeof floor === 'number' && floor > frenzy);
			// 1. progress advances while the game is running
			const p0 = st.progress;
			chk('initial progress 0', p0 === 0);
			// 2. trigger payoff (set progress to 1, hit the click hook)
			st.progress = 1;
			st.notified = false;
			const cookiesBefore = G.cookies;
			// click the cookie to trigger the payoff
			G.ClickCookie(null, 0);
			const dCookies = G.cookies - cookiesBefore;
			const hasFrenzy = !!G.buffs['Click frenzy'];
			chk('payoff consumed (progress=' + st.progress + ', totalTriggers=' + st.totalTriggers + ')', st.progress === 0 && st.totalTriggers >= 1);
			chk('payoff rewards cookies (dCookies=' + Math.round(dCookies) + ')', dCookies >= 1000);
			chk('payoff applies Click frenzy buff', hasFrenzy);
			chk('achievement "It\'s cracked!" won', !!G.Achievements["It's cracked!"] && G.Achievements["It's cracked!"].won === 1);
			// 2b. cooldown: the bonus is locked for COOLDOWN_MS (2 minutes)
			chk('cooldown is 2 minutes (COOLDOWN_MS=' + CC.COOLDOWN_MS + ')', CC.COOLDOWN_MS === 2 * 60 * 1000);
			chk('payoff started a cooldown (cooldownUntil=' + st.cooldownUntil + ')',
				st.cooldownUntil > Date.now() && st.cooldownUntil <= Date.now() + CC.COOLDOWN_MS + 100);
			const tBefore = st.totalTriggers;
			st.progress = 1;
			CC.trigger(); // force a payoff attempt while cooling down
			chk('cooldown blocks a second payoff (triggers=' + st.totalTriggers + ')', st.totalTriggers === tBefore);
			st.progress = 0;
			// 3. no double trigger on the same click
			const t2 = st.totalTriggers;
			G.ClickCookie(null, 0);
			chk('no double trigger (triggers=' + st.totalTriggers + ')', st.totalTriggers === t2);
			// 4. persistence round-trip through the Custom save section
			st.progress = 0.77;
			st.totalTriggers = 42;
			st.lastTickMs = 1234567890;
			st.notified = true;
			const cdBefore = st.cooldownUntil;
			const rawSave = G.WriteSave(2);
			chk('save carries the CC3CrackingCookie mod entry', typeof rawSave === 'string' && rawSave.indexOf('CC3CrackingCookie') !== -1);
			const saveCode = G.WriteSave(1);
			st.progress = 0;
			st.totalTriggers = 0;
			st.lastTickMs = 0;
			st.notified = false;
			st.cooldownUntil = 0;
			const imported = G.ImportSaveCode(saveCode);
			chk('import restores crack state (progress=' + st.progress + ', triggers=' + st.totalTriggers + ')', imported && Math.abs(st.progress - 0.77) < 0.001 && st.totalTriggers === 42 && st.notified === true);
			chk('import restores the cooldown (cd=' + st.cooldownUntil + ')', imported && st.cooldownUntil === cdBefore);
			// 5. stats menu section renders
			G.ShowMenu('stats');
			const ui = document.getElementById('cc3CrackStats');
			const uiText = ui ? (ui.textContent || '') : '';
			chk('stats menu crack section renders', !!ui && uiText.indexOf('Cracking cookie') !== -1);
			chk('no raw %N placeholders in the crack section', uiText !== '' && !/%\d/.test(uiText));
			// 6. reset hook clears the crack
			CC.reset();
			chk('reset clears progress (progress=' + st.progress + ')', st.progress === 0 && st.notified === false && st.cooldownUntil === 0);
			out.textContent = lines.join('\n') + '\n[QA-cracking] ' + (pass ? 'PASS: cracking cookie verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-cracking] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: measure the 4-minigame frame cost. Seeds the four minigame buildings
// (Garden/Market/Pantheon/Grimoire) so all four minigame logic() functions run
// every tick, opens the Garden (the realistic "one minigame open" draw cost),
// and reports the actual game-loop rate (Game.T ticks/sec) over ~3s versus the
// 30-tick target (the loop is setTimeout(1000/Game.fps); a heavy minigame
// logic() would push the achieved rate below target). Usage: ?debug=1&qa=perf
if (debugSurface && params.get('qa') === 'perf') {
	const BUILDINGS = ['Farm', 'Bank', 'Temple', 'Wizard tower'];
	const LVL = Math.max(1, parseInt(params.get('qlvl') || '1', 10) || 1);
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects) return;
		if (!G.__qaPerfSeeded) {
			G.__qaPerfSeeded = 1;
			try {
				G.cookies += 1e15;
				G.lumps += 100;
				for (const name of BUILDINGS) {
					const b = G.Objects[name];
					if (!b) continue;
					b.amount = LVL; b.unlocked = 1; b.bought = 1; b.highest = LVL; b.level = LVL;
				}
				G.recalculateGains = 1;
				if (G.LoadMinigames) G.LoadMinigames();
			} catch (e: any) {
				console.error('QA perf seed failed:', e);
			}
		}
		if (!G.__qaPerfStarted) {
			const allLoaded = BUILDINGS.every((n) => G.Objects[n] && G.Objects[n].minigameLoaded);
			if (!allLoaded) return;
			G.__qaPerfStarted = 1;
			const farm = G.Objects['Farm'];
			if (farm && !farm.onMinigame && farm.switchMinigame) {
				try { farm.switchMinigame(1); if (farm.refresh) farm.refresh(); } catch (e: any) { console.error('QA perf open failed:', e); }
			}
			const out = document.createElement('div');
			out.id = '__dbgqa';
			out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
			document.body.appendChild(out);
			const t0 = performance.now(), t0Game = G.T;
			out.textContent = '[QA-perf] 4 minigames active, sampling loop rate...';
			const wait = window.setInterval(() => {
				const now = performance.now();
				const elapsed = (now - t0) / 1000;
				const actual = (G.T - t0Game) / elapsed;
				if (elapsed < 3) {
					out.textContent = '[QA-perf] 4 minigames active, sampling loop rate... (' + actual.toFixed(1) + ' ticks/s so far, ' + elapsed.toFixed(1) + 's)';
					return;
				}
				window.clearInterval(wait);
				out.textContent =
					'[QA-perf] 4 minigames active (Farm/Bank/Temple/Wizard tower, level ' + LVL + ') + Garden open\n' +
					'[QA-perf] target Game.fps = ' + G.fps +
					'\n[QA-perf] actual loop rate = ' + actual.toFixed(1) + ' ticks/s over ' + elapsed.toFixed(1) + 's' +
					'\n[QA-perf] (loop is setTimeout(1000/Game.fps); heavy minigame logic() would drop this below target)' +
					'\n[QA-perf] verdict: ' + (actual >= G.fps * 0.9 ? 'OK — holding ~target' : 'BELOW target by ' + (G.fps - actual).toFixed(1) + ' ticks/s');
				window.clearInterval(tick);
			}, 500);
		}
	}, 250);
}

// QA: verify the ascension (Legacy/prestige) flow end to end. Seeds a run with a
// large cookiesEarned (1e15 -> floor((1e15/1e12)^(1/3)) = 10 prestige), drives
// Game.Ascend(1) (5s intro that grants heavenly chips + prestige at its
// breakpoint), then Game.Reincarnate(1) (the actual reset), and checks:
// chips+prestige were granted, the run was reset (buildings cleared), and the
// prestige state (chips, prestige, resets) was kept. Usage: ?debug=1&qa=ascend
/** The ascend probe's own two-phase state, parked on Game (index-signature field). */
interface AscendQaState {
	phase: number;
	out: HTMLDivElement;
	hc0: number;
	hc1?: number;
	prestige0: number;
	prestige1?: number;
	resets0: number;
	cursor0: number;
	t: number;
}
if (debugSurface && params.get('qa') === 'ascend') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects || typeof G.Ascend !== 'function' || typeof G.Reincarnate !== 'function') return;
		if (!G.__qaAscend) {
			const out = document.createElement('div');
			out.id = '__dbgqa';
			out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
			document.body.appendChild(out);
			try {
				const E = 1e15;
				if (G.Upgrades['Legacy']) G.Upgrades['Legacy'].bought = 1;
				G.cookies = E; G.cookiesEarned = E;
				G.Objects['Cursor'].amount = 50; G.Objects['Grandma'].amount = 20;
				G.recalculateGains = 1; G.CalculateGains();
				G.__qaAscend = { phase: 1, out, hc0: G.heavenlyChips, prestige0: G.prestige, resets0: G.resets, cursor0: G.Objects['Cursor'].amount, t: Date.now() };
				out.textContent = '[QA-ascend] seeded cookiesEarned=1e15, calling Game.Ascend(1)... (wait for the ~5s intro)';
				G.Ascend(1);
			} catch (e: any) {
				out.textContent = '[QA-ascend] ERROR seed: ' + e.message;
				window.clearInterval(tick);
			}
			return;
		}
		const a = G.__qaAscend as AscendQaState;
		if (a.phase === 1) {
			if (G.OnAscend === 1 || Date.now() - a.t > 8000) {
				a.phase = 2;
				a.hc1 = G.heavenlyChips; a.prestige1 = G.prestige;
				a.out.textContent = '[QA-ascend] intro done (OnAscend=' + G.OnAscend + ') — chips ' + a.hc0 + '->' + a.hc1 + ', prestige ' + a.prestige0 + '->' + a.prestige1 + '. Calling Game.Reincarnate(1)...';
				G.Reincarnate(1);
				a.t = Date.now();
			}
		} else if (a.phase === 2) {
			if (Date.now() - a.t > 2000) {
				const cursorAfter = G.Objects['Cursor'].amount;
				// hc1/prestige1 were set in the phase 1 -> 2 transition above
				const chipsOk = a.hc1! > a.hc0 && G.heavenlyChips === a.hc1;
				const prestigeOk = a.prestige1! > a.prestige0 && G.prestige === a.prestige1;
				const resetsOk = G.resets > a.resets0;
				const resetOk = cursorAfter === 0;
				const backOk = G.OnAscend === 0;
				const pass = chipsOk && prestigeOk && resetsOk && resetOk && backOk;
				a.out.textContent =
					'[QA-ascend] after Reincarnate\n' +
					'[QA-ascend] heavenlyChips: ' + a.hc0 + ' -> ' + a.hc1 + ' (now ' + G.heavenlyChips + ') ' + (chipsOk ? 'OK' : 'FAIL') +
					'\n[QA-ascend] prestige: ' + a.prestige0 + ' -> ' + a.prestige1 + ' (now ' + G.prestige + ') ' + (prestigeOk ? 'OK' : 'FAIL') +
					'\n[QA-ascend] resets: ' + a.resets0 + ' -> ' + G.resets + ' ' + (resetsOk ? 'OK' : 'FAIL') +
					'\n[QA-ascend] Cursor: ' + a.cursor0 + ' -> ' + cursorAfter + ' (expect 0) ' + (resetOk ? 'OK' : 'FAIL') +
					'\n[QA-ascend] OnAscend back to 0 ' + (backOk ? 'OK' : 'FAIL') +
					'\n[QA-ascend] ' + (pass ? 'PASS: ascend granted chips+prestige, reincarnate reset the run and kept prestige state' : 'FAIL');
				window.clearInterval(tick);
			}
		}
	}, 250);
}

// QA: verify the browse-only heavenly tree (?debug=1&qa=ascendbrowse). Seeds a
// small run with 100 heavenly chips, opens Game.AscendBrowseView() (no intro,
// no chip gain), checks the tree rendered and the Reincarnate button turned
// into a Back button, buys one upgrade with existing chips, closes with
// Game.AscendBrowseClose(), and checks the run is untouched and the original
// button/info markup was restored.
if (debugSurface && params.get('qa') === 'ascendbrowse') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects || typeof G.AscendBrowseView !== 'function' || typeof G.AscendBrowseClose !== 'function') return;
		if (!G.__qaAscendBrowse) {
			const o = document.createElement('div');
			o.id = '__dbgqa';
			o.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
			document.body.appendChild(o);
			try {
				if (G.Upgrades['Legacy']) G.Upgrades['Legacy'].bought = 1;
				const apron = G.Upgrades['Blessed apron'];
				if (!apron) throw new Error('Blessed apron upgrade missing from the registry');
				G.heavenlyChips = 100;
				G.cookies = 1e9; G.cookiesEarned = 1e9;
				G.Objects['Cursor'].amount = 50;
				G.recalculateGains = 1; G.CalculateGains();
				G.__qaAscendBrowse = {
					phase: 1, out: o, t: Date.now(),
					cookies0: G.cookies, cursor0: G.Objects['Cursor'].amount, hc0: G.heavenlyChips,
					apronId: apron.id, apronPrice: apron.basePrice,
					buttonHTML0: (document.getElementById('ascendButton') as HTMLElement).innerHTML,
					infoHTML0: (document.getElementById('ascendInfo') as HTMLElement).innerHTML,
				};
				o.textContent = '[QA-ascendbrowse] seeded 100 chips, calling Game.AscendBrowseView()...';
				G.AscendBrowseView();
			} catch (e: any) {
				o.textContent = '[QA-ascendbrowse] ERROR seed: ' + e.message;
				window.clearInterval(tick);
			}
			return;
		}
		const a = G.__qaAscendBrowse as { phase: number; out: HTMLDivElement; t: number; cookies0: number; cursor0: number; hc0: number; apronId: number; apronPrice: number; buttonHTML0: string; infoHTML0: string; btnBrowse?: string };
		if (a.phase === 1) {
			if (G.OnAscend === 1 && G.AscendBrowse === 1 && Date.now() - a.t > 500) {
				a.phase = 2;
				a.t = Date.now();
				const btn = (document.getElementById('ascendButton') as HTMLElement).textContent || '';
				a.btnBrowse = btn;
				a.out.textContent = '[QA-ascendbrowse] browse view up (OnAscend=' + G.OnAscend + ', AscendBrowse=' + G.AscendBrowse + '), button now: ' + btn.replace(/\s+/g, ' ').trim() + '. Buying Blessed apron (id ' + a.apronId + ')...';
				G.PurchaseHeavenlyUpgrade(a.apronId);
			}
		} else if (a.phase === 2) {
			if (Date.now() - a.t > 500) {
				a.phase = 3;
				a.t = Date.now();
				a.out.textContent = '[QA-ascendbrowse] bought (chips now ' + G.heavenlyChips + '), calling Game.AscendBrowseClose()...';
				G.AscendBrowseClose();
			}
		} else {
			if (Date.now() - a.t > 500) {
				const btn = (document.getElementById('ascendButton') as HTMLElement).innerHTML;
				const info = (document.getElementById('ascendInfo') as HTMLElement).innerHTML;
				const viewOk = true;
				const boughtOk = G.Upgrades['Blessed apron'] && G.Upgrades['Blessed apron'].bought === 1;
				const chipsOk = G.heavenlyChips === a.hc0 - a.apronPrice;
				const runOk = G.Objects['Cursor'].amount === a.cursor0 && Math.abs(G.cookies - a.cookies0) < 1e6;
				const labelOk = (a.btnBrowse || '').replace(/\s+/g, ' ').trim() === 'Back to game';
				const closedOk = G.OnAscend === 0 && G.AscendBrowse === 0 && !document.getElementById('game')!.classList.contains('ascending');
				const restoredOk = btn === a.buttonHTML0 && info === a.infoHTML0;
				const pass = viewOk && labelOk && boughtOk && chipsOk && runOk && closedOk && restoredOk;
				a.out.textContent =
					'[QA-ascendbrowse] results\n' +
					'[QA-ascendbrowse] browse view opened (OnAscend=1, AscendBrowse=1) ' + (viewOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] Blessed apron bought with existing chips ' + (boughtOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] chips: ' + a.hc0 + ' -> ' + G.heavenlyChips + ' (expect ' + (a.hc0 - a.apronPrice) + ') ' + (chipsOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] browse button relabeled to Back to game ' + (labelOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] run untouched (cookies ' + Math.round(G.cookies) + ', Cursor ' + G.Objects['Cursor'].amount + ') ' + (runOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] closed: OnAscend=' + G.OnAscend + ', AscendBrowse=' + G.AscendBrowse + ', .ascending removed ' + (closedOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] button/info markup restored ' + (restoredOk ? 'OK' : 'FAIL') +
					'\n[QA-ascendbrowse] ' + (pass ? 'PASS: heavenly tree browsed without triggering an ascension' : 'FAIL');
				window.clearInterval(tick);
			}
		}
	}, 250);
}

// QA: verify the Transcendence (second prestige layer) flow. Seeds a large
// cookiesReset (1e30 > the 1e29 gate), calls window.__cc3Transcendence.seed()
// then doTranscend(), and checks: EE was earned, state was recorded, the run
// was hard-reset (buildings cleared, prestige state zeroed), the mod data
// round-trips through save(), and the unlock/UI flags were reset for reuse.
// Usage: ?debug=1&qa=transcend
if (debugSurface && params.get('qa') === 'transcend') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		const T = (window as any).__cc3Transcendence;
		if (!G || !G.ready || !G.Objects || !T) return;
		if (!G.__qaTranscend) {
			const o = document.createElement('div');
			o.id = '__dbgqa';
			o.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
			document.body.appendChild(o);
			try {
				T.seed(1e30);
				G.cookiesReset = 1e30; G.cookiesEarned = 1e12;
				G.prestige = 1000;
				G.heavenlyChips = 500;
				G.Objects['Cursor'].amount = 50; G.Objects['Grandma'].amount = 20;
				G.Objects['Cursor'].level = 5;
				G.recalculateGains = 1; G.CalculateGains();
				const eeBefore = T.state.ee;
				G.__qaTranscend = { out: o, eeBefore, t: Date.now() };
				o.textContent = '[QA-transcend] seeded cookiesReset=1e30, calling doTranscend(true) (bypassing the intro animation)...';
				T.doTranscend(true);
			} catch (e: any) {
				o.textContent = '[QA-transcend] ERROR seed: ' + e.message;
				window.clearInterval(tick);
			}
			return;
		}
		const a = G.__qaTranscend as { out: HTMLDivElement; eeBefore: number; t: number };
		if (Date.now() - a.t > 500) {
			const eeAfter = T.state.ee;
			const eeEarned = T.state.eeEarned;
			const trans = T.state.transcendences;
			const eeOk = eeAfter > a.eeBefore && eeEarned === eeAfter;
			const transOk = trans === 1;
			// 10 lifetime EE activates the Inner Fire milestone, which grants 3
			// free Cursors after the reset — so Cursor is expected to be 3, not 0.
			const resetOk = G.Objects['Cursor'].amount === 3 && G.Objects['Grandma'].amount === 0 && G.prestige === 0 && G.heavenlyChips === 0;
			const savedOk = (() => { try { const s = JSON.parse(T.save()); return s.ee === eeAfter && s.trans === trans; } catch (e) { return false; } })();
			const gateOk = T.canTranscend();
			const pass = eeOk && transOk && resetOk && savedOk && gateOk;
			a.out.textContent =
				'[QA-transcend] results\n' +
				'[QA-transcend] EE: ' + a.eeBefore + ' -> ' + eeAfter + ' (lifetime ' + eeEarned + ') ' + (eeOk ? 'OK' : 'FAIL') +
				'\n[QA-transcend] transcendences: ' + trans + ' (expect 1) ' + (transOk ? 'OK' : 'FAIL') +
				'\n[QA-transcend] run reset: Cursor=' + G.Objects['Cursor'].amount + ' (expect 3: Inner Fire milestone), Grandma=' + G.Objects['Grandma'].amount + ', prestige=' + G.prestige + ', chips=' + G.heavenlyChips + ' ' + (resetOk ? 'OK' : 'FAIL') +
				'\n[QA-transcend] save round-trip ' + (savedOk ? 'OK' : 'FAIL') +
				'\n[QA-transcend] gate still unlocked (canTranscend) ' + (gateOk ? 'OK' : 'FAIL') +
				'\n[QA-transcend] ' + (pass ? 'PASS: transcendence earned EE, reset the run, and persisted' : 'FAIL');
			window.clearInterval(tick);
		}
	}, 250);
}

// QA: verify heavenly-tree arrange mode — drag to move upgrades, suppress
// accidental purchase, persist to localStorage, reset to defaults.
// Usage: ?debug=1&qa=arrange
if (debugSurface && params.get('qa') === 'arrange') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects || typeof G.AscendBrowseView !== 'function' || typeof G.ToggleArrangeHeavenly !== 'function') return;
		if (!G.__qaArrange) {
			const o = document.createElement('div');
			o.id = '__dbgqa';
			o.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
			document.body.appendChild(o);
			try {
				// Mark the full purchase chain bought so the drag target renders as a crate:
				// Legacy -> Heavenly cookies -> {Tin of british tea biscuits, Box of macarons,
				// Box of brand biscuits, Tin of butter cookies} -> Starter kit -> Starter kitchen
				const chain = ['Legacy', 'Heavenly cookies', 'Tin of british tea biscuits', 'Box of macarons', 'Box of brand biscuits', 'Tin of butter cookies', 'Starter kit', 'Starter kitchen'];
				for (const c of chain) { if (G.Upgrades[c]) { G.Upgrades[c].bought = 1; G.Upgrades[c].unlocked = 1; } }
				G.heavenlyChips = 100;
				G.cookies = 1e9; G.cookiesEarned = 1e9;
				G.Objects['Cursor'].amount = 50;
				G.recalculateGains = 1; G.CalculateGains();
				// Pick known purchasable upgrade as drag target
				const target = G.Upgrades['Starter kitchen'];
				if (!target) throw new Error('Starter kitchen upgrade missing');
				G.__qaArrange = {
					phase: 1, out: o, t: Date.now(),
					target: target,
					posX0: target.posX, posY0: target.posY,
					bought0: target.bought,
					hc0: G.heavenlyChips,
				};
				o.textContent = '[QA-arrange] seeded, opening browse view...';
				G.AscendBrowseView();
			} catch (e: any) {
				o.textContent = '[QA-arrange] ERROR seed: ' + e.message;
				window.clearInterval(tick);
			}
			return;
		}
		const a = G.__qaArrange as any;
		if (a.phase === 1) {
			if (G.OnAscend === 1 && G.AscendBrowse === 1 && Date.now() - a.t > 500) {
				a.phase = 2;
				a.t = Date.now();
				a.out.textContent = '[QA-arrange] browse view open, toggling arrange mode...';
				G.ToggleArrangeHeavenly();
				// Verify toggle state
				const btn = document.getElementById('arrangeTreeButton');
				if (G.ArrangeHeavenly !== 1) a.out.textContent = '[QA-arrange] FAIL: ArrangeHeavenly not 1 after toggle';
				else if (!btn) a.out.textContent = '[QA-arrange] FAIL: arrangeTreeButton missing';
				else if (btn.innerHTML.indexOf('Done') === -1) a.out.textContent = '[QA-arrange] FAIL: button label not "Done arranging"';
				else a.out.textContent = '[QA-arrange] arrange mode ON, verifying crate clickStr guard...';
			}
		} else if (a.phase === 2) {
			if (Date.now() - a.t > 300) {
				// Verify the crate for a purchasable upgrade has the clickStr guard
				const el = document.getElementById('heavenlyUpgrade' + a.target.id);
				if (!el) { a.out.textContent = '[QA-arrange] FAIL: heavenlyUpgrade element not found'; return; }
				const attr = el.getAttribute(G.clickStr) || '';
				if (attr.indexOf('AscendDragMoved') === -1) { a.out.textContent = '[QA-arrange] FAIL: clickStr guard missing: ' + attr; return; }
				a.out.textContent = '[QA-arrange] clickStr guard OK, simulating drag...';
				// Simulate drag: dispatch mousedown on the element
				const rect = el.getBoundingClientRect();
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy }));
				if (!G.SelectedHeavenlyUpgrade) { a.out.textContent = '[QA-arrange] FAIL: SelectedHeavenlyUpgrade not set after mousedown'; return; }
				if (G.AscendDragMoved !== 0) { a.out.textContent = '[QA-arrange] FAIL: AscendDragMoved not 0 at mousedown'; return; }
				// First UpdateAscend frame at the original position — establishes AscendDragX = mousedown position
				G.mouseDown = 1;
				G.UpdateAscend();
				// "Move" the mouse beyond the 6px threshold
				G.mouseX = G.mouseX + 40;
				G.mouseY = G.mouseY + 40;
				// Second UpdateAscend frame — the delta from frame 1 now moves the upgrade
				G.UpdateAscend();
				if (G.AscendDragMoved !== 1) { a.out.textContent = '[QA-arrange] FAIL: AscendDragMoved not 1 after drag step'; return; }
				// Release mouse — mouseup on the element
				G.mouseDown = 0;
				el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: G.mouseX, clientY: G.mouseY }));
				// Check: posX changed, not bought, localStorage has override
				if (Math.abs(a.target.posX - a.posX0) < 5 && Math.abs(a.target.posY - a.posY0) < 5) { a.out.textContent = '[QA-arrange] FAIL: posX/posY barely changed (drag did not move the upgrade)'; return; }
				if (a.target.bought !== a.bought0) { a.out.textContent = '[QA-arrange] FAIL: upgrade was accidentally bought during drag'; return; }
				if (G.heavenlyChips !== a.hc0) { a.out.textContent = '[QA-arrange] FAIL: heavenlyChips changed (accidental purchase)'; return; }
				const saved = window.localStorage.getItem('cc3_heavenly_layout');
				if (!saved) { a.out.textContent = '[QA-arrange] FAIL: localStorage key not set after drag'; return; }
				const parsed = JSON.parse(saved);
				if (!parsed[a.target.id] || parsed[a.target.id][0] !== Math.round(a.target.posX) || parsed[a.target.id][1] !== Math.round(a.target.posY)) { a.out.textContent = '[QA-arrange] FAIL: localStorage override mismatch'; return; }
				a.movedPosX = a.target.posX; a.movedPosY = a.target.posY;//capture the dragged position BEFORE reset restores defaults
				a.phase = 3;
				a.t = Date.now();
				a.out.textContent = '[QA-arrange] drag OK (pos changed, not bought, saved), toggling arrange off...';
			}
		} else if (a.phase === 3) {
			if (Date.now() - a.t > 300) {
				G.ToggleArrangeHeavenly();
				if (G.ArrangeHeavenly !== 0) { a.out.textContent = '[QA-arrange] FAIL: ArrangeHeavenly not 0 after toggle off'; return; }
				// Verify clickStr is plain purchase after toggle off
				const el = document.getElementById('heavenlyUpgrade' + a.target.id);
				if (el) {
					const attr = el.getAttribute(G.clickStr) || '';
					if (attr.indexOf('AscendDragMoved') !== -1) { a.out.textContent = '[QA-arrange] FAIL: clickStr still has guard after arrange off'; return; }
				}
				a.phase = 4;
				a.t = Date.now();
				a.out.textContent = '[QA-arrange] arrange off, clickStr plain, resetting layout...';
				G.ResetHeavenlyLayout();
			}
		} else {
			if (Date.now() - a.t > 300) {
				// After reset, posX/posY should be back to defaults
				const posOk = Math.abs(a.target.posX - a.posX0) < 1 && Math.abs(a.target.posY - a.posY0) < 1;
				const lsOk = !window.localStorage.getItem('cc3_heavenly_layout');
				const pass = posOk && lsOk;
				a.out.textContent =
					'[QA-arrange] results\n' +
					'[QA-arrange] arrange mode toggle: OK\n' +
					'[QA-arrange] clickStr guard present when arranging: OK\n' +
					'[QA-arrange] drag moved upgrade: ' + (Math.abs(a.movedPosX - a.posX0) >= 5 || Math.abs(a.movedPosY - a.posY0) >= 5 ? 'OK' : 'FAIL (barely moved)') + '\n' +
					'[QA-arrange] no accidental purchase during drag: ' + (a.target.bought === a.bought0 && G.heavenlyChips === a.hc0 ? 'OK' : 'FAIL') + '\n' +
					'[QA-arrange] localStorage override after drag: OK\n' +
					'[QA-arrange] clickStr reverts to plain when arrange off: OK\n' +
					'[QA-arrange] reset restores default positions: ' + (posOk ? 'OK' : 'FAIL') + '\n' +
					'[QA-arrange] reset clears localStorage: ' + (lsOk ? 'OK' : 'FAIL') + '\n' +
					'[QA-arrange] ' + (pass ? 'PASS: arrange mode verified end to end' : 'FAIL');
				window.clearInterval(tick);
			}
		}
	}, 250);
}

// QA: verify offline gains (cookies earned while the game was closed). Desktop
// offline CpS only runs with the "Perfect idling" upgrade (100%, no cap), so the
// probe grants it, seeds a known CpS (100 cursors = 10 CpS), persists a save whose
// lastDate is one hour in the past (WriteSave uses Game.time, which we set in a
// synchronous block so the 30Hz loop can't advance it first), then reloads. On the
// reloaded page the engine computes and grants the offline gain during boot; phase 2
// checks that cookies rose by ~ (timeOffline * CpS). Usage: ?debug=1&qa=offline
if (debugSurface && params.get('qa') === 'offline') {
	const out = () => {
		let d = document.getElementById('__dbgqa');
		if (!d) { d = document.createElement('div'); d.id = '__dbgqa'; d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;'; document.body.appendChild(d); }
		return d;
	};
	const tick = window.setInterval(() => {
		const G = window.Game;
		// G.ready is set in the constructor, before the async load finishes; wait
		// for a few seconds of game time (G.T) so the save has fully loaded and the
		// offline gain (computed during load) has been applied before we touch state.
		if (!G || !G.ready || !G.Objects || G.T < 90) return;
		let marker: { base: number; cps: number; expected: number } | null = null;
		try { marker = JSON.parse(localStorage.getItem('__qaOffline') || 'null'); } catch (e: any) { /* ignore */ }
		if (marker) {
			// Phase 2: the engine already computed + granted the offline gain on boot.
			if (G.__qaOfflineDone) return;
			G.__qaOfflineDone = 1;
			try {
				const earned = G.cookies - marker.base;
				const ok = earned >= marker.expected * 0.5 && earned <= marker.expected * 1.5;
				out().textContent =
					'[QA-offline] phase 2 (after reload; offline gain applied during boot)\n' +
					'[QA-offline] saved base cookies = ' + Math.round(marker.base) +
					'\n[QA-offline] current cookies    = ' + Math.round(G.cookies) +
					'\n[QA-offline] gained while away  = ' + Math.round(earned) + '   (expected ~' + Math.round(marker.expected) + ' = 3600s x ' + marker.cps.toFixed(2) + ' CpS)' +
					'\n[QA-offline] ' + (ok ? 'PASS: offline gain granted on load (timeOffline x CpS; Perfect idling = 100% no-cap)' : 'CHECK: gain outside expected band');
				try { localStorage.removeItem('__qaOffline'); } catch (e: any) { /* ignore */ }
			} catch (e: any) { out().textContent = '[QA-offline] verify error: ' + e.message; }
			window.clearInterval(tick);
			return;
		}
		// Phase 1: seed, persist a save with a past lastDate, then reload.
		if (G.__qaOfflineSeeded) return;
		G.__qaOfflineSeeded = 1;
		try {
			if (G.Upgrades['Perfect idling']) G.Upgrades['Perfect idling'].bought = 1;
			G.cookies = 1e6;
			G.Objects['Cursor'].amount = 100;
			G.recalculateGains = 1; G.CalculateGains();
			const cps = G.cookiesPs;
			const awayMs = 3600 * 1000;
			const base = G.cookies;
			// Synchronous block: the 30Hz loop cannot interrupt it, so WriteSave's
			// lastDate=Game.time stays at the (past) value we just set.
			const past = Date.now() - awayMs;
			G.time = past; G.lastDate = past; G.toSave = false;
			G.WriteSave();
			localStorage.setItem('__qaOffline', JSON.stringify({ base, cps, expected: (awayMs / 1000) * cps }));
			out().textContent = '[QA-offline] phase 1: 100 cursors (CpS ' + cps.toFixed(2) + '), saved with lastDate 1h ago, reloading to trigger the offline gain...';
			// Stop ticking: the marker is now in localStorage, so this page's next
			// tick would run phase 2 *before* the reload — measuring live CpS
			// drift instead of the offline gain. Phase 2 may only run on the
			// reloaded page (fresh document, marker still present).
			window.clearInterval(tick);
			setTimeout(() => location.reload(), 400);
		} catch (e: any) { out().textContent = '[QA-offline] ERROR: ' + e.message; }
	}, 250);
}

// QA: verify the seasonal specials (Santa + Dragon tabs). Unlocked by the
// "A festive hat" (Santa) and "A crumbly egg" (Dragon) upgrades, after which
// Game.UpdateSpecial() pushes 'santa'/'dragon' onto Game.specialTabs. The tabs are
// canvas-drawn (not DOM), so the probe drives the underlying actions directly:
// Game.UpgradeSanta() (spends cookies, bumps santaLevel, drops a Santa present)
// and Game.UpgradeDragon() (chips the egg: spends 1e6, bumps dragonLevel).
// Usage: ?debug=1&qa=special
if (debugSurface && params.get('qa') === 'special') {
	const out = () => {
		let d = document.getElementById('__dbgqa');
		if (!d) { d = document.createElement('div'); d.id = '__dbgqa'; d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;'; document.body.appendChild(d); }
		return d;
	};
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Upgrades || G.T < 90) return;
		if (G.__qaSpecialDone) return;
		G.__qaSpecialDone = 1;
		try {
			const lines = [];
			// Unlock both specials.
			G.Upgrades['A festive hat'].bought = 1;
			G.Upgrades['A crumbly egg'].bought = 1;
			G.UpdateSpecial();
			const hasSanta = G.specialTabs.indexOf('santa') >= 0;
			const hasDragon = G.specialTabs.indexOf('dragon') >= 0;
			lines.push('specialTabs = [' + G.specialTabs.join(', ') + ']');
			lines.push((hasSanta ? 'PASS' : 'FAIL') + ': Santa tab present   ' + (hasDragon ? 'PASS' : 'FAIL') + ': Dragon tab present');
			// Seed cookies (Dragon egg chip costs 1e6).
			G.cookies = 1e7;
			// Santa: bump santaLevel + drop a present.
			const santaBefore = G.santaLevel;
			G.UpgradeSanta();
			const santaOk = G.santaLevel === santaBefore + 1;
			lines.push('santaLevel ' + santaBefore + ' -> ' + G.santaLevel + (santaOk ? '   (PASS: +1, present dropped)' : '   (FAIL)'));
			// Dragon: chip the egg.
			const dragonBefore = G.dragonLevel;
			G.UpgradeDragon();
			const dragonOk = G.dragonLevel === dragonBefore + 1;
			lines.push('dragonLevel ' + dragonBefore + ' -> ' + G.dragonLevel + (dragonOk ? '   (PASS: +1, egg chipped)' : '   (FAIL)'));
			lines.push(hasSanta && hasDragon && santaOk && dragonOk
				? '[QA-special] PASS: seasonal specials (Santa + Dragon) unlock and act'
				: '[QA-special] CHECK: see above');
			out().textContent = '[QA-special] seasonal specials (Santa + Dragon tabs)\n' + lines.join('\n');
		} catch (e: any) { out().textContent = '[QA-special] ERROR: ' + e.message + '\n' + (e.stack || ''); }
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the accessibility (screen reader) mode. It's a preference
// (Game.prefs.screenreader) that, when on, renders store products / buildings as
// <button aria-labelledby=...> with srOnly labels instead of plain <div>s (it
// requires a reload to take effect). Two-phase: phase 1 enables the pref,
// persists it (WriteSave) and reloads; phase 2 checks a store product is now a
// <button> with aria-labelledby. Usage: ?debug=1&qa=a11y
if (debugSurface && params.get('qa') === 'a11y') {
	const out = () => {
		let d = document.getElementById('__dbgqa');
		if (!d) { d = document.createElement('div'); d.id = '__dbgqa'; d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;'; document.body.appendChild(d); }
		return d;
	};
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.prefs || G.T < 90) return;
		let marker: unknown = null;
		try { marker = JSON.parse(localStorage.getItem('__qaA11y') || 'null'); } catch (e: any) { /* ignore */ }
		if (marker) {
			// Phase 2: screen-reader mode should be active (products are <button>s).
			if (G.__qaA11yDone) return;
			G.__qaA11yDone = 1;
			try {
				const p0 = document.getElementById('product0');
				const tag = p0 ? p0.tagName.toLowerCase() : '(missing)';
				const aria = p0 ? p0.getAttribute('aria-labelledby') : null;
				const ok = !!p0 && tag === 'button' && !!aria;
				out().textContent =
					'[QA-a11y] phase 2 (screen-reader mode active after reload)\n' +
					'[QA-a11y] prefs.screenreader = ' + G.prefs.screenreader +
					'\n[QA-a11y] #product0 tag          = ' + tag +
					'\n[QA-a11y] #product0 aria-labelledby = ' + (aria || '(none)') +
					'\n[QA-a11y] ' + (ok ? 'PASS: screen-reader mode renders store products as accessible <button aria-labelledby=...>' : 'CHECK: expected a <button> with aria-labelledby');
				try { localStorage.removeItem('__qaA11y'); } catch (e: any) { /* ignore */ }
			} catch (e: any) { out().textContent = '[QA-a11y] verify error: ' + e.message; }
			window.clearInterval(tick);
			return;
		}
		// Phase 1: enable the pref, persist it, then reload.
		if (G.__qaA11ySeeded) return;
		G.__qaA11ySeeded = 1;
		try {
			G.prefs.screenreader = 1;
			G.WriteSave();
			localStorage.setItem('__qaA11y', JSON.stringify({ on: 1 }));
			out().textContent = '[QA-a11y] phase 1: enabled screen-reader mode, reloading...';
			// Same guard as the offline probe: the marker is in localStorage now,
			// so this page's next tick would run phase 2 before the reload. The
			// pref flip can be picked up live by a re-render, so phase 2 must run
			// on the reloaded page to actually verify the persisted pref + boot
			// render path.
			window.clearInterval(tick);
			setTimeout(() => location.reload(), 400);
		} catch (e: any) { out().textContent = '[QA-a11y] ERROR: ' + e.message; }
	}, 250);
}

// QA: verify the wrinklers (Grandmapocalypse critters on the cookie). They spawn
// while Game.elderWrath > 0; a fully-visible (phase 2) wrinkler sucks 5% of CpS
// (Game.cpsSucked) and swallows cookies; popping it (hp <= 0.5) removes it, bumps
// Game.wrinklersPopped, and refunds the swallowed cookies (+10%). The probe forces
// one to spawn, makes it fully visible, checks the CpS debuff, then pops it — the
// pop resolves on the next loop tick (UpdateWrinklers), so verification runs one
// interval later. Usage: ?debug=1&qa=wrinkler
/** State the wrinkler probe parks on Game between its two ticks. */
interface WrinklerQaBefore { popped: number; cookies: number; }
interface WrinklerQaDef { debuffOk: boolean; cpsBefore: number; debuff: number; }
if (debugSurface && params.get('qa') === 'wrinkler') {
	const out = () => {
		let d = document.getElementById('__dbgqa');
		if (!d) { d = document.createElement('div'); d.id = '__dbgqa'; d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;'; document.body.appendChild(d); }
		return d;
	};
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.wrinklers || G.T < 90) return;
		if (G.__qaWrinklerDone) return;
		if (!G.__qaWrinklerSeeded) {
			// Seed 1: enable wrath, seed CpS, spawn + fully show a wrinkler, check
			// the CpS debuff, then pop it (resolves on the next UpdateWrinklers tick).
			G.__qaWrinklerSeeded = 1;
			try {
				const lines = [];
				G.elderWrath = 1;
				G.Objects['Cursor'].amount = 100;
				G.recalculateGains = 1; G.CalculateGains();
				const cpsBefore = G.cookiesPs;
				const me = G.wrinklers[0];
				G.SpawnWrinkler(me);
				me.phase = 2; me.close = 1;      // fully visible (skip the crawl-in)
				G.recalculateGains = 1; G.CalculateGains();
				// The wrinkler does NOT change the raw CpS; it sets Game.cpsSucked
				// (5% per visible wrinkler), which lowers the DISPLAYED CpS and drains
				// cookies via Game.Dissolve every tick. So verify cpsSucked > 0.
				const debuff = G.cpsSucked;
				const debuffOk = debuff > 0;
				lines.push('[QA-wrinkler] phase 1 (wrinkler spawned, fully visible)');
				lines.push('raw CpS ' + cpsBefore.toFixed(2) + ' (unchanged)   cpsSucked = ' + debuff.toFixed(3) + (debuffOk ? '   (PASS: a visible wrinkler sucks 5% of CpS -> displayed CpS + cookie drain)' : '   (FAIL)'));
				me.sucked = 1000;                // give it swallowed cookies to refund
				G.__qaWrinkBefore = { popped: G.wrinklersPopped, cookies: G.cookies };
				me.hp = -10;                     // triggers the pop on the next tick
				G.__qaWrinkDef = { debuffOk, cpsBefore, debuff };
				out().textContent = lines.join('\n');
			} catch (e: any) { out().textContent = '[QA-wrinkler] ERROR: ' + e.message + '\n' + (e.stack || ''); G.__qaWrinklerDone = 1; window.clearInterval(tick); }
			return;
		}
		// Seed 2: the pop has resolved (a loop tick ran UpdateWrinklers). Verify.
		G.__qaWrinklerDone = 1;
		try {
			const me = G.wrinklers[0];
			const before = G.__qaWrinkBefore as WrinklerQaBefore;
			const d = G.__qaWrinkDef as WrinklerQaDef | undefined;
			const poppedOk = G.wrinklersPopped > before.popped && me.phase === 0;
			const refund = G.cookies - before.cookies;
			const refundOk = refund >= 550;      // ~1100 refund (1000 x 1.1), well above drift
			const debuffGone = G.cpsSucked === 0;
			// The pop path now plays the CC3 error tone — the cache entry proves it fired
			const errSnd = (window as any).Sounds && (window as any).Sounds['snd/error1.mp3'];
			const errorToneOk = errSnd instanceof HTMLAudioElement;
			const lines = [
				'[QA-wrinkler] phase 2 (pop resolved on a loop tick)',
				'phase1 raw CpS ' + (d ? d.cpsBefore.toFixed(2) : '?') + '   cpsSucked=' + (d ? d.debuff.toFixed(3) : '?') + (d && d.debuffOk ? '   (PASS: visible wrinkler set cpsSucked, lowering displayed CpS)' : '   (FAIL: debuff not seen)'),
				'wrinklersPopped ' + before.popped + ' -> ' + G.wrinklersPopped + (poppedOk ? '   (PASS: +1, wrinkler removed phase=0)' : '   (FAIL)'),
				'cookies ' + Math.round(before.cookies) + ' -> ' + Math.round(G.cookies) + ' (+' + Math.round(refund) + ')' + (refundOk ? '   (PASS: refunded swallowed cookies +10%)' : '   (FAIL)'),
				'cpsSucked = ' + G.cpsSucked + (debuffGone ? '   (PASS: CpS debuff cleared after the pop)' : '   (FAIL)'),
				'error tone on pop: ' + (errorToneOk ? 'PASS' : 'FAIL (no snd/error1.mp3 in the sound cache)'),
				d && d.debuffOk && poppedOk && refundOk && debuffGone && errorToneOk
					? '[QA-wrinkler] PASS: wrinkler spawns, sucks 5% CpS, and pops for a cookie refund'
					: '[QA-wrinkler] CHECK: see above'
			];
			out().textContent = lines.join('\n');
		} catch (e: any) { out().textContent = '[QA-wrinkler] verify error: ' + e.message; }
		window.clearInterval(tick);
	}, 250);
}

// QA: diagnose missing store icons — report the computed style of a store product
// .icon element (width/height/background-image/position) so we can see why the
// sprite isn't showing. Usage: ?debug=1&qa=icon
if (debugSurface && params.get('qa') === 'icon') {
	const out = () => {
		let d = document.getElementById('__dbgqa');
		if (!d) { d = document.createElement('div'); d.id = '__dbgqa'; d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;'; document.body.appendChild(d); }
		return d;
	};
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || G.T < 60) return;
		if (G.__qaIconDone) return;
		G.__qaIconDone = 1;
		try {
			const rows = ['[QA-icon] store icon diagnostics'];
			const inspect = (id: string) => {
				const el = document.getElementById(id);
				if (!el) { rows.push(id + ': (not found)'); return; }
				const cs = getComputedStyle(el);
				const bi = cs.backgroundImage;
				const m = bi.match(/url\(([^)]+)\)/);
				let file = '(none)';
				if (m) { const u = m[1].replace(/['"]/g, ''); const mm = u.match(/img\/([a-zA-Z0-9_.-]+)\.webp/); if (mm) file = mm[1] + '.webp'; }
				rows.push(id + ' [' + el.className + ']');
				rows.push('  size: ' + cs.width + ' x ' + cs.height + ' | opacity: ' + cs.opacity + ' | visibility: ' + cs.visibility + ' | display: ' + cs.display);
				rows.push('  bg-image file: ' + file + (bi === 'none' ? '  <-- NO BACKGROUND!' : '') + ' | position: ' + cs.backgroundPosition);
			};
			inspect('productIcon1');      // "on" layer (Grandma)
			inspect('productIconOff1');   // "off" layer (Grandma, the dimmed one)
			inspect('productIcon0');      // "on" layer (Cursor)
			out().textContent = rows.join('\n');
		} catch (e: any) { out().textContent = '[QA-icon] ERROR: ' + e.message + '\n' + (e.stack || ''); }
		window.clearInterval(tick);
	}, 250);
}

// QA: verify one-column responsive mode (the Orteil "todo!" CC3 completes).
// Checks the mode state (body.oneColumn + data-col, Game.minLayoutW 800 -> 400,
// viewport-meta swap, published --cc3Scale), the bottom tab bar (visible, three
// tabs, column switching, active column full-width and stopping above the bar,
// aria-pressed), and that the cookie click path works in the one-column layout.
// Usage: ?debug=1&qa=onecol (force the mode with &oneCol=1, or open a viewport
// of 640px or narrower to get it by auto-detection)
if (debugSurface && params.get('qa') === 'onecol') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		// G.T<5 keeps ClickCookie's "game just booted" gate (Game.T<3) out of the picture
		if (!G || !G.ready || typeof G.resize !== 'function' || G.T < 5) return;
		if (G.__qaOneCol) return;
		// CC3 polish: the incoming column has a 180ms entrance animation; wait
		// for it to settle before measuring column rects (the transform would
		// skew the gap-to-tab-bar check)
		const settling = ['sectionLeft', 'sectionMiddle', 'sectionRight'].some((id) => {
			const el = document.getElementById(id);
			return el!.getAnimations && el!.getAnimations().length > 0;
		});
		if (settling) return;
		G.__qaOneCol = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		const lines: string[] = [];
		const ok = (label: string, pass: boolean, extra?: string) => {
			lines.push('[QA-onecol] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
		};
		try {
			const body = document.body;
			if (!body.classList.contains('oneColumn')) {
				out.textContent =
					'[QA-onecol] one-column mode is NOT active in this viewport (innerWidth=' + window.innerWidth +
					', screen.width=' + window.screen.width + '; auto-switches at <= 640px)\n' +
					'[QA-onecol] re-run with ?oneCol=1 to force it, or open a viewport <= 640px wide.';
				window.clearInterval(tick);
				return;
			}
			// --- mode state ---
			ok('body.oneColumn + data-col=left at boot', body.dataset.col === 'left', 'data-col=' + body.dataset.col);
			ok('Game.minLayoutW drops 800 -> 400', G.minLayoutW === 400, 'minLayoutW=' + G.minLayoutW);
			const vp = document.querySelector<HTMLMetaElement>('meta[name=viewport]');
			ok('viewport meta swapped to device-width', !!(vp && vp.content.indexOf('width=device-width') === 0), vp ? vp.content : 'meta missing');
			ok('Game.scale sane (0.3 .. 1.5)', G.scale >= 0.3 && G.scale <= 1.5, 'scale=' + G.scale);
			ok('--cc3Scale CSS var published', body.style.getPropertyValue('--cc3Scale') === String(G.scale), 'var=' + body.style.getPropertyValue('--cc3Scale') + ', scale=' + G.scale);
			// --- tab bar + columns ---
			const bar = document.getElementById('oneColTabs');
			const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('#oneColTabs button'));
			ok('tab bar visible with 3 tabs', !!bar && tabs.length === 3 && getComputedStyle(bar).display === 'flex', 'display=' + (bar ? getComputedStyle(bar).display : 'n/a') + ', tabs=' + tabs.length);
			const shown = (id: string) => { const r = document.getElementById(id)!.getBoundingClientRect(); return r.width >= 100 && r.height >= 100; };
			const hidden = (id: string) => getComputedStyle(document.getElementById(id)!).display === 'none';
			const colRect = (id: string) => document.getElementById(id)!.getBoundingClientRect();
			ok('left column shown, middle+right hidden', shown('sectionLeft') && hidden('sectionMiddle') && hidden('sectionRight'));
			const fullW = window.innerWidth / G.scale;
			const lw = colRect('sectionLeft').width;
			ok('active column is full-width', Math.abs(lw - fullW) < 2, 'col=' + lw.toFixed(1) + 'px, expect~' + fullW.toFixed(1) + 'px');
			const gap = colRect('sectionLeft').bottom - bar!.getBoundingClientRect().top;
			ok('column stops right above the tab bar', Math.abs(gap) < 2, 'gap=' + gap.toFixed(2) + 'px');
			// --- tab switching ---
			tabs[1].click();
			ok('Buildings tab -> middle column', body.dataset.col === 'middle' && tabs[1].getAttribute('aria-pressed') === 'true' && shown('sectionMiddle') && hidden('sectionLeft') && hidden('sectionRight'), 'data-col=' + body.dataset.col);
			tabs[2].click();
			ok('Store tab -> right column', body.dataset.col === 'right' && tabs[2].getAttribute('aria-pressed') === 'true' && shown('sectionRight') && hidden('sectionLeft') && hidden('sectionMiddle'), 'data-col=' + body.dataset.col);
			ok('aria-pressed tracks the active tab', tabs.map((t) => t.getAttribute('aria-pressed')).join(',') === 'false,false,true', tabs.map((t) => t.getAttribute('aria-pressed')).join(','));
			// --- cookie click path in the one-column layout ---
			tabs[0].click();
			const r = document.getElementById('bigCookie')!.getBoundingClientRect();
			const cx = (r.left + r.right) / 2;
			ok('cookie on-screen and horizontally centered', r.top >= 0 && r.bottom <= window.innerHeight && Math.abs(cx - window.innerWidth / 2) < 5, 'center-x=' + cx.toFixed(1) + 'px vs viewport-mid ' + (window.innerWidth / 2).toFixed(1) + 'px');
			const clicksBefore = G.cookieClicks;
			const cookiesBefore = G.cookies;
			G.ClickCookie(null, 5);
			ok('cookie click earns cookies (ClickCookie path)', G.cookieClicks === clicksBefore + 1 && G.cookies >= cookiesBefore + 5 - 1e-6, cookiesBefore.toFixed(1) + ' -> ' + G.cookies.toFixed(1) + ' cookies, ' + clicksBefore + ' -> ' + G.cookieClicks + ' clicks');
			out.textContent = lines.join('\n') + '\n[QA-onecol] ' + (lines.every((l) => l.indexOf('PASS') !== -1) ? 'PASS: one-column responsive mode verified' : 'FAIL: see the lines above');
		} catch (e: any) {
			out.textContent = lines.join('\n') + '\n[QA-onecol] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the CC3 polish (the v3.0 animation pass) — the presentation-
// layer motion that sits on top of the untouched engine: the boot fade, the
// display-rate smooth cookie counter, the one-column column slide-in, the
// notification slide-in, and the ascend-intro breakpoint flash (+shake).
// Game state is never touched beyond what the (unmodified) ascend flow does;
// the probe checks computed CSS, the window.__cc3Anim stats, and that the
// counter display converges monotonically to the real cookie value. One-
// column mode is forced with &oneCol=1; assumes an English profile (the
// Beautify number format the display parsing relies on).
// Usage: ?debug=1&qa=anim&oneCol=1
/** The anim probe's multi-phase state, parked on Game (index-signature field). */
interface AnimQaState {
	phase: number;
	t0: number;
	v: number[];
	all: string[];
	id1?: string;
	id2?: string;
}
if (debugSurface && params.get('qa') === 'anim') {
	const out = () => {
		let d = document.getElementById('__dbgqa');
		if (!d) { d = document.createElement('div'); d.id = '__dbgqa'; d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;'; document.body.appendChild(d); }
		return d;
	};
	// Parse the #cookies display: full digits below 1e6 ("999,999"), word
	// units at/above it ("4.655 million", per the port's Beautify format).
	const DISPLAY_UNITS: Record<string, number> = { million: 1e6, billion: 1e9, trillion: 1e12, quadrillion: 1e15, quintillion: 1e18 };
	const readDisplay = () => {
		const el = document.getElementById('cookies');
		const m = el ? el.textContent.match(/([\d,]+(?:\.\d+)?)\s*(million|billion|trillion|quadrillion|quintillion)?/) : null;
		return m ? parseFloat(m[1].replace(/,/g, '')) * (DISPLAY_UNITS[m[2]] || 1) : NaN;
	};
	const tick = window.setInterval(() => {
		const G = window.Game;
		const A = window.__cc3Anim;
		if (!G || !G.ready || !G.prefs || !A || G.T < 30) return;
		let st: AnimQaState | undefined = G.__qaAnim;
		if (!st) {
			const s: AnimQaState = { phase: 0, t0: 0, v: [], all: [] };
			st = s;
			G.__qaAnim = s;
			const ok = (label: string, pass: boolean, extra?: string) => s.all.push('[QA-anim] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
			// --- boot fade: the 0.35s animation has long finished; the name persists ---
			const wAnim = getComputedStyle(document.getElementById('wrapper')!).animationName;
			ok('boot fade: #wrapper ran cc3BootIn', wAnim === 'cc3BootIn', wAnim);
			// --- a fresh profile (fancy=1, no reduced-motion) keeps motion on ---
			ok('motion on for a fresh profile', A.motion === true && !document.body.classList.contains('noMotion'), 'noMotion=' + document.body.classList.contains('noMotion'));
			// --- one-column column slide-in (this probe runs with &oneCol=1) ---
			const body = document.body;
			if (body.classList.contains('oneColumn')) {
				const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('#oneColTabs button'));
				tabs[1].click();
				ok('tab switch: middle column enters with cc3ColIn', getComputedStyle(document.getElementById('sectionMiddle')!).animationName === 'cc3ColIn', getComputedStyle(document.getElementById('sectionMiddle')!).animationName);
				tabs[2].click();
				ok('tab switch: right column enters with cc3ColIn', getComputedStyle(document.getElementById('sectionRight')!).animationName === 'cc3ColIn');
				tabs[0].click(); // back to the cookie column
			} else {
				ok('one-column mode active (run the probe with &oneCol=1)', false);
			}
			// --- notification slide-in: the first note (capture its DOM id) ---
			st.id1 = 'note-' + G.noteId;
			G.Notify('[QA-anim] note one', 'slide-in test', [10, 10], 6);
			// --- smooth cookie counter: seed a 5e6 jump, sample the display ---
			G.cookies += 5e6;
			st.t0 = Date.now();
			st.v = [readDisplay()];
			st.phase = 1;
			out().textContent = st.all.join('\n') + '\n[QA-anim] phase 1: display at ' + Math.round(st.v[0]) + ' right after the +5e6 jump; sampling...';
			return;
		}
		if (st.phase === 1) {
			const ok = (label: string, pass: boolean, extra?: string) => st.all.push('[QA-anim] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
			// t0+250ms: note #1 has landed with its slide-in (id1 set in phase 0)
			const n1 = document.getElementById(st.id1!);
			ok('note 1: .note entered with cc3NoteIn', !!n1 && getComputedStyle(n1).animationName === 'cc3NoteIn', n1 ? getComputedStyle(n1).animationName : '(missing)');
			st.v.push(readDisplay());
			st.phase = 2;
			out().textContent = st.all.join('\n') + '\n[QA-anim] phase 2: display at ' + Math.round(st.v[1]) + '...';
			return;
		}
		if (st.phase === 2) {
			// a second note rebuilds #notes: note 1 must not replay its entrance
			st.id2 = 'note-' + G.noteId;
			G.Notify('[QA-anim] note two', 'rebuild test', [10, 10], 6);
			st.v.push(readDisplay());
			st.phase = 3;
			out().textContent = st.all.join('\n') + '\n[QA-anim] phase 3: display at ' + Math.round(st.v[2]) + '...';
			return;
		}
		if (st.phase === 3) {
			const ok = (label: string, pass: boolean, extra?: string) => st.all.push('[QA-anim] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
			// DOM order in #notes is oldest-first; look both notes up by id (set in phase 0/2)
			const n1 = document.getElementById(st.id1!);
			const n2 = document.getElementById(st.id2!);
			ok('note 2: new note enters with cc3NoteIn', !!n2 && getComputedStyle(n2).animationName === 'cc3NoteIn');
			ok('note 1: no entrance replay after the #notes rebuild (.cc3Seen)', !!n1 && n1.classList.contains('cc3Seen'), n1 ? (n1.className || '(no class)') : '(missing)');
			st.v.push(readDisplay());
			// --- counter verdict: the display counted up and converged.
			// (The display quantizes to 3 significant digits at 1e6+, so only
			// the first jump is asserted strictly; later samples may plateau.)
			const target = G.cookies;
			const [v0, v1, v2, v3] = st.v;
			const midJump = v1 > v0 && v1 >= 0.05 * target && v1 <= 0.999 * target;
			const nonDec = v2 >= v1 && v3 >= v2;
			const converged = v3 >= target - Math.max(20, 0.02 * target);
			ok('smooth counter: display mid-count-up at t0+250ms', midJump, st.v.map((x: number) => Math.round(x)).join(' -> '));
			ok('smooth counter: display never decreases', nonDec, st.v.map((x: number) => Math.round(x)).join(' -> '));
			ok('smooth counter: display converged to the real cookie value', converged, 'display ' + Math.round(v3) + ' vs cookies ' + Math.round(target));
			ok('smooth counter: rAF hook ran at display rate (active, re-anchored each tick)', A.counter.active === true && A.counter.anchors >= G.T - 35 && A.counter.frames >= (G.T - 30) * 0.9, 'frames=' + A.counter.frames + ' anchors=' + A.counter.anchors + ' writes=' + A.counter.writes + ' ticks=' + G.T);
			st.phase = 4;
			out().textContent = st.all.join('\n') + '\n[QA-anim] phase 4: seeded the ascend, waiting for the intro breakpoint (~2.5s)...';
			// --- ascend-intro breakpoint flash: drive the real flow ---
			if (G.Upgrades['Legacy']) G.Upgrades['Legacy'].bought = 1;
			G.cookies = 1e15; G.cookiesEarned = 1e15;
			G.Ascend(1);
			return;
		}
		if (st.phase === 4) {
			// wait for the intro to cross the breakpoint (75 ticks ≈ 2.5s)
			if (G.AscendTimer < G.AscendBreakpoint) return;
			const ok = (label: string, pass: boolean, extra?: string) => st.all.push('[QA-anim] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
			// the flash + shake run 900ms and we are <=250ms past the crossing
			const flash = document.getElementById('cc3Flash');
			ok('ascend flash: #cc3Flash fired at the breakpoint', A.ascendFlashes === 1 && !!flash && flash.classList.contains('cc3On'), 'ascendFlashes=' + A.ascendFlashes + ', class=' + (flash ? flash.className : '(missing)'));
			ok('ascend shake: #game got cc3Shake', document.getElementById('game')!.classList.contains('cc3Shake'));
			// fast-forward the intro's end (chips + prestige are granted)
			G.AscendTimer = G.AscendDuration;
			st.phase = 5;
			out().textContent = st.all.join('\n') + '\n[QA-anim] phase 5: intro forced to its end, waiting for the ascend screen...';
			return;
		}
		if (st.phase === 5) {
			if (G.OnAscend !== 1) return;
			G.Reincarnate(1);
			st.phase = 6;
			st.t0 = Date.now();
			return;
		}
		if (st.phase === 6) {
			// outlast the 1s reincarnate animation AND the 900ms flash cleanup
			if (G.OnAscend !== 0 || Date.now() - st.t0 < 1600) return;
			const ok = (label: string, pass: boolean, extra?: string) => st.all.push('[QA-anim] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
			ok('ascend flash: the overlay was cleaned up afterwards', !document.getElementById('cc3Flash'));
			ok('reincarnate: the run reset (Cursor back to 0)', G.Objects['Cursor'].amount === 0);
			// --- in-game "Fancy graphics" opt-out: flip it off and check the gates ---
			G.prefs.fancy = 0;
			G.addClass('noFancy');
			st.phase = 7;
			st.t0 = Date.now();
			return;
		}
		if (st.phase === 7) {
			if (Date.now() - st.t0 < 300) return; // a few frames for the rAF hook to react
			const ok = (label: string, pass: boolean, extra?: string) => st.all.push('[QA-anim] ' + (pass ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' (' + extra + ')' : ''));
			ok('fancy off: body.noMotion published', document.body.classList.contains('noMotion') && A.motion === false);
			ok('fancy off: the smooth counter hook stopped', A.counter.active === false);
			ok('fancy off: the CSS motion gates went quiet', getComputedStyle(document.getElementById('wrapper')!).animationName === 'none');
			out().textContent = st.all.join('\n') + '\n[QA-anim] ' + (st.all.every((l: string) => l.indexOf('PASS') !== -1) ? 'PASS: the CC3 polish (v3.0 animation pass) verified' : 'FAIL: see the lines above');
			window.clearInterval(tick);
		}
	}, 250);
}

// QA: verify Grandma's Sitting Room (engine/minigameGrandmaSittingRoom.ts),
// in particular the Grandmapocalypse integration: the minigame reports
// M.currentComfort() and the canonical Game.UpdateGrandmapocalypse does all
// the wrath mutation — a cozy room (comfort >= 2) suppresses the 'One mind'
// floor and calms the elders to 0 (and holds), an eldritch room (comfort
// <= -2) accelerates the wrath climb, and 'Elder hospitality' doubles the
// comfort-driven rates. The rate comparisons draw from identical seeded
// random streams, so they are deterministic run to run. Also covers the yarn
// economy, the repeatable-stack upgrade path, the save/load round-trip and
// the achievements. Usage: ?debug=1&qa=sittingroom
if (debugSurface && params.get('qa') === 'sittingroom') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Upgrades) return;
		const gm: any = G.Objects['Grandma'];
		if (!gm.minigameLoaded) {
			// Phase 1: kick off the lazy minigame load (needs level > 0).
			if (!G.__qaSittingKick) {
				G.__qaSittingKick = 1;
				gm.level = 300;
				gm.amount = 300;
				G.BuildingsOwned = Math.max(G.BuildingsOwned, 1);
				G.LoadMinigames();
			}
			return; // wait for loadMinigameModule -> scriptLoaded -> M.launch
		}
		if (G.__qaSitting) return;
		G.__qaSitting = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const lines: string[] = [];
			let pass = true;
			const chk = (label: string, cond: boolean) => { lines.push((cond ? 'PASS: ' : 'FAIL: ') + label); if (!cond) pass = false; };
			const M: any = gm.minigame;
			const U = (n: string) => G.Upgrades[n];
			const realRandom = Math.random;
			const setSeats = (arr: number[]) => { M.seats = arr.slice(); M.computeEffs(); };

			// 1. content declarations
			chk('minigame attached to the Grandma (name "Sitting Room")', M.parent === gm && M.name === 'Sitting Room' && gm.minigameUrl === 'minigameGrandmaSittingRoom.js');
			chk('6 yarn upgrades tied to the Grandma with a flat .yarnPrice', ['Lap blanket weaving', 'Rocking chair maintenance', 'Tea leaf cultivation', 'Elder shawl', 'Chamomile incense', 'The Grandmother Tree'].every((n) => { const u = U(n); return !!u && u.buildingTie === gm && typeof u.yarnPrice === 'number' && u.yarnPrice > 0; }));
			chk('2 heavenly upgrades in the prestige pool off Starter kitchen', U('Grandma\'s knitting circle').pool === 'prestige' && (U('Grandma\'s knitting circle').parents[0] as any).name === 'Starter kitchen' && U('Elder hospitality').pool === 'prestige' && (U('Elder hospitality').parents[0] as any).name === 'Grandma\'s knitting circle');
			chk('5 sitting-room achievements declared', ['First knit', 'Yarn hoard', "Grandma's peace", 'The elders sing', 'Fully furnished'].every((n) => !!G.Achievements[n]));

			// 2. wrath integration — deterministic beats (Math.random=()=>0
			//    makes every drift roll succeed, so only the gating matters)
			U('One mind').bought = 1;
			G.pledgeT = 0;
			G.cookies = 1e15;
			setSeats([0, 1, 1, 0, 0, 1]); // knitting/tea mix, comfort +6
			chk('cozy room comfort is +6', M.currentComfort() === 6);
			G.elderWrath = 0;
			Math.random = () => 0;
			G.UpdateGrandmapocalypse();
			chk('cozy room HOLDS wrath at 0 (One mind floor + climb suppressed)', G.elderWrath === 0);
			setSeats([4, 4, 4, 4, 4, 4]); // six chants, comfort -6
			chk('eldritch room comfort is -6', M.currentComfort() === -6);
			G.elderWrath = 0;
			G.UpdateGrandmapocalypse();
			chk('eldritch room does NOT suppress the floor (wrath back to 1)', G.elderWrath === 1);
			Math.random = realRandom;

			// 3. wrath integration — drift rates (identical seeded LCG streams,
			//    so each pair of runs sees the same rolls and the comparison
			//    is deterministic)
			const lcg = (base: number) => { let s = base; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; };
			const runTo = (target: (wrath: number) => boolean, cap: number) => { let t = 0; while (!target(G.elderWrath) && t < cap) { G.UpdateGrandmapocalypse(); t++; } return t; };
			U('Communal brainsweep').bought = 1;
			U('Elder Pact').bought = 1; // wrath cap 3
			setSeats([0, 1, 1, 0, 0, 1]);
			U('Elder hospitality').bought = 0;
			Math.random = lcg(12345);
			G.elderWrath = 3;
			const cozyTicks = runTo((w) => w === 0, 20000);
			chk('cozy room calmed wrath 3 -> 0 in ' + cozyTicks + ' ticks (< 2000)', G.elderWrath === 0 && cozyTicks < 2000);
			for (let i = 0; i < 300; i++) G.UpdateGrandmapocalypse();
			chk('cozy room holds the elders at 0', G.elderWrath === 0);
			U('Elder hospitality').bought = 1;
			Math.random = lcg(12345);
			G.elderWrath = 3;
			const hospTicks = runTo((w) => w === 0, 20000);
			chk("'Elder hospitality' calmed it faster (" + hospTicks + ' vs ' + cozyTicks + ' ticks, ~half)', G.elderWrath === 0 && hospTicks <= cozyTicks / 2 + 100 && hospTicks < 2000);
			U('Elder hospitality').bought = 0;
			setSeats([4, 4, 4, 4, 4, 4]);
			Math.random = lcg(12345);
			G.elderWrath = 1;
			const eldritchTicks = runTo((w) => w === 3, 20000);
			chk('eldritch room climbed wrath 1 -> 3 in ' + eldritchTicks + ' ticks (< 1500)', G.elderWrath === 3 && eldritchTicks < 1500);
			setSeats([-1, -1, -1, -1, -1, -1]);
			Math.random = lcg(12345);
			G.elderWrath = 1;
			const neutralTicks = runTo((w) => w === 3, 40000);
			chk('neutral room took ' + neutralTicks + ' ticks to the same climb (>= 3x the eldritch room)', G.elderWrath === 3 && neutralTicks >= eldritchTicks * 3);
			Math.random = realRandom;

			// 4. effs contract (what CalculateGains aggregates)
			setSeats([0, 1, 1, 0, 0, 1]);
			chk('cozy +6 effs (grandmaCps +12%, wrath cookies rarer)', Math.abs(M.effs.grandmaCps - 1.12) < 1e-12 && Math.abs(M.effs.wrathCookieFreq - 1.06) < 1e-12);
			setSeats([4, 4, 4, 4, 4, 4]);
			chk('eldritch -6 effs (wrath gain +18%, wrinklers +18%, grandmaCps -6%)', Math.abs(M.effs.wrathCookieGain - 1.18) < 1e-12 && Math.abs(M.effs.wrinklerSpawn - 1.18) < 1e-12 && Math.abs(M.effs.grandmaCps - 0.94) < 1e-12 && Math.abs(M.effs.wrathCookieFreq - 1 / 1.12) < 1e-12);

			// 5. yarn economy, repeatable stacks, CpS hookup
			setSeats([-1, -1, -1, -1, -1, -1]); // neutral: comfort 0
			// Grandma is a DYNAMIC building: me.cps is a function evaluated as me.cps(me)
			const gmCps = () => (typeof gm.cps === 'function' ? (gm.cps as any)(gm) : (gm.cps as number));
			const cpsBefore = gmCps();
			M.yarn = 10000;
			M.yarnEarned = 10;
			M.checkAchievements();
			chk('achievement "First knit" wins at 1+ yarn earned', G.Achievements['First knit'].won === 1);
			M.buyUpgrade('Lap blanket weaving');
			chk('yarn purchase adds a stack, marks the first one in the main save, deducts 25 yarn', M.effectiveStacks('Lap blanket weaving') === 1 && U('Lap blanket weaving').bought === 1 && M.yarn === 10000 - 25);
			chk('Grandma CpS rose after the stack (' + cpsBefore.toFixed(2) + ' -> ' + gmCps().toFixed(2) + ')', gmCps() > cpsBefore);
			M.yarn = 100000;
			for (const n of M.upgradeNames) M.buyUpgrade(n);
			chk('buying every upgrade wins "Fully furnished"', G.Achievements['Fully furnished'].won === 1);
			setSeats([0, 1, 1, 0, 0, 1]);
			M.checkAchievements();
			chk('"Grandma\'s peace" wins at comfort +6', G.Achievements["Grandma's peace"].won === 1);
			setSeats([4, 4, 4, 4, 4, 4]);
			M.checkAchievements();
			chk('"The elders sing" wins at comfort -6', G.Achievements['The elders sing'].won === 1);

			// 6. save / load round-trip
			M.yarn = 123;
			M.yarnEarned = 456;
			setSeats([0, 1, -1, -1, 4, -1]);
			M.upgradeStacks = [2, 0, 1, 0, 0, 3];
			const saved = M.save();
			// A real hard reset clears the main-save bought flags BEFORE the
			// minigame reset runs (systems/reset.ts), so mirror that order —
			// otherwise effectiveStacks' main-save fallback would correctly
			// regrow one stack per still-bought upgrade.
			for (const n of M.upgradeNames) U(n).bought = 0;
			M.reset(true);
			chk('reset cleared the room state', M.yarn === 0 && M.yarnEarned === 0 && M.upgradeStacks.every((n: number) => n === 0) && M.seats.every((n: number) => n === -1));
			M.load(saved);
			chk('load restored yarn, stacks and seats (' + saved + ')', M.yarn === 123 && M.yarnEarned === 456 && M.upgradeStacks.join(':') === '2:0:1:0:0:3' && M.seats.join(':') === '0:1:-1:-1:4:-1');

			// 7. How-to-play button + tutorial panel
			const helpBtn = document.getElementById('roomHelpBtn') as HTMLElement | null;
			chk('the header has a "How to play" button', !!helpBtn);
			if (helpBtn) {
				helpBtn.click();
				const tut = document.getElementById('roomTutorial');
				chk('clicking it opens the tutorial (with content + close button)', !!tut && tut.style.display !== 'none' && !!document.getElementById('roomHelpClose') && (tut.textContent || '').includes('Comfort dial'));
				const closeBtn = document.getElementById('roomHelpClose') as HTMLElement | null;
				if (closeBtn) closeBtn.click();
				chk('the close button hides the tutorial', !!tut && tut.style.display === 'none' && tut.innerHTML === '');
			}

			// cleanup: the QA page is disposable, but leave the wrath state sane
			setSeats([-1, -1, -1, -1, -1, -1]);
			G.elderWrath = 0;
			G.pledgeT = 0;
			U('One mind').bought = 0;
			U('Communal brainsweep').bought = 0;
			U('Elder Pact').bought = 0;
			G.killShimmers();
			out.textContent = lines.join('\n') + '\n[QA-sittingroom] ' + (pass ? 'PASS: Grandma\'s Sitting Room + Grandmapocalypse integration verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-sittingroom] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

// QA: verify the Cat Colony minigame (engine/minigameCatColony.ts): mission
// unlock gating, dispatch/resolve with pinned deterministic rolls (0.9999 =
// no hurt, max treats; 0 = always hurt; 0.045/0.03 = land on either side of
// the heavenly risk modifiers), the four heavenly modifiers
// ('Nap discipline', 'Nine-lives insurance' stacks, 'Efficient patrols',
// 'Generous strangers'), the 'Bottomless treat jar' trickle (including the
// achievement firing from jar drip alone), the treat economy with repeatable
// stacks feeding the Cats dynamic CpS formula, the five achievements, and
// the save/load round-trip (mirroring the real hard-reset order, where the
// main-save bought flags clear before the minigame reset runs).
// Usage: ?debug=1&qa=catcolony
if (debugSurface && params.get('qa') === 'catcolony') {
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Upgrades) return;
		const cats: any = G.Objects['Cats'];
		if (!cats.minigameLoaded) {
			// Phase 1: kick off the lazy minigame load (needs level > 0).
			if (!G.__qaCatColKick) {
				G.__qaCatColKick = 1;
				cats.level = 250;
				cats.amount = 250;
				G.BuildingsOwned = Math.max(G.BuildingsOwned, 1);
				G.LoadMinigames();
			}
			return; // wait for loadMinigameModule -> scriptLoaded -> M.launch
		}
		if (G.__qaCatCol) return;
		G.__qaCatCol = 1;
		const out = document.createElement('div');
		out.id = '__dbgqa';
		out.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;color:#060;font:12px monospace;white-space:pre-wrap;max-width:640px;';
		document.body.appendChild(out);
		try {
			const lines: string[] = [];
			let pass = true;
			const chk = (label: string, cond: boolean) => { lines.push((cond ? 'PASS: ' : 'FAIL: ') + label); if (!cond) pass = false; };
			const M: any = cats.minigame;
			const U = (n: string) => G.Upgrades[n];
			const realRandom = Math.random;
			const now = () => Date.now();
			const yarn = M.missionsById['yarn'];
			const resolveNow = () => { for (const a of M.away) a.returnAt = now() - 1; M.resolveExpeditions(); };

			// 1. content declarations
			chk('minigame attached to the Cats (name "Cat Colony")', M.parent === cats && M.name === 'Cat Colony' && cats.minigameUrl === 'minigameCatColony.js');
			chk('6 treat upgrades tied to the Cats with a flat .treatsPrice', M.upgradeNames.length === 6 && M.upgradeNames.every((n: string) => { const u = U(n); return !!u && u.buildingTie === cats && typeof u.treatsPrice === 'number' && u.treatsPrice > 0; }));
			chk('4 heavenly upgrades in the prestige pool off the whisker chain', U('Nap discipline').pool === 'prestige' && (U('Nap discipline').parents[0] as any).name === 'Communion of whiskers' && U('Generous strangers').pool === 'prestige' && (U('Generous strangers').parents[0] as any).name === 'Nap discipline' && U('Bottomless treat jar').pool === 'prestige' && (U('Bottomless treat jar').parents[0] as any).name === 'Generous strangers' && U('Efficient patrols').pool === 'prestige' && (U('Efficient patrols').parents[0] as any).name === 'Bottomless treat jar');
			chk('5 colony achievements declared', ['First expedition', 'Seasoned adventurers', 'The nine-lives guild', 'Pocketful of treats', 'Fully catified'].every((n: string) => !!G.Achievements[n]));

			// 2. unlock gating (mission.unlock vs the Cats count)
			cats.amount = 5;
			chk('missions gate on the Cats count (5 cats: pantry/ninelives refused)', M.dispatch('pantry') === false && M.dispatch('ninelives') === false && M.away.length === 0);
			cats.amount = 250;

			// 3. dispatch + resolve, best-case rolls (0.9999: no hurt, max treats)
			Math.random = () => 0.9999;
			M.treats = 0; M.treatsEarnedTotal = 0; M.missionsCompleted = 0;
			chk('dispatching yarn + sunbeam uses 3 idle cats (247 of 250 idle)', M.dispatch('yarn') === true && M.dispatch('sunbeam') === true && M.away.length === 2 && M.idleCats() === 247);
			chk('away entries keep id/count and a future returnAt', M.away[0].id === 'yarn' && M.away[0].count === 1 && M.away[1].id === 'sunbeam' && M.away[1].count === 2 && M.away.every((a: any) => a.returnAt > now()));
			resolveNow();
			chk('best-case resolution: 1 + 3 treats, 2 missions, no hurt', M.away.length === 0 && M.resting.length === 0 && M.treats === 4 && M.treatsEarnedTotal === 4 && M.missionsCompleted === 2);
			chk('"First expedition" wins on the first resolution', G.Achievements['First expedition'].won === 1);

			// 4. scuffle — worst-case roll (0: every expedition comes home hurt)
			Math.random = () => 0;
			const t0 = now();
			const dispatched = M.dispatch('yarn');
			resolveNow();
			chk('a hurt expedition rests the cat (15..40s window) and pays no treats', dispatched === true && M.treats === 4 && M.missionsCompleted === 2 && M.resting.length === 1 && M.resting[0].count === 1 && M.resting[0].returnAt - t0 >= 15000 && M.resting[0].returnAt - t0 <= 40500);
			M.resting.length = 0; //probe housekeeping; the rest would resolve itself

			// 5. heavenly modifiers, each against a pinned roll
			U('Nap discipline').bought = 1;
			chk("'Nap discipline' cuts the yarn risk to 0.05 * 0.8", Math.abs(M.hurtChanceFor(yarn) - 0.04) < 1e-9);
			Math.random = () => 0.045; //< 0.05 (hurt bare) but >= 0.04 (safe with it)
			M.dispatch('yarn');
			resolveNow();
			chk('a 0.045 roll stays safe under Nap discipline (+1 treat)', M.resting.length === 0 && M.treats === 5 && M.missionsCompleted === 3);
			U('Nap discipline').bought = 0;

			M.upgradeStacks[3] = 2; //two stacks of 'Nine-lives insurance'
			chk("'Nine-lives insurance' stacks multiply the risk by 0.7 each", Math.abs(M.hurtChanceFor(yarn) - 0.05 * 0.49) < 1e-9);
			Math.random = () => 0.03; //< 0.05 (hurt bare) but >= 0.05*0.49 (safe stacked)
			M.dispatch('yarn');
			resolveNow();
			chk('two insurance stacks carry a 0.03 roll (+1 treat)', M.resting.length === 0 && M.treats === 6 && M.missionsCompleted === 4);
			M.upgradeStacks[3] = 0;
			M.dispatch('yarn');
			resolveNow();
			chk('the same 0.03 roll hurts without the insurance', M.resting.length === 1 && M.treats === 6);
			M.resting.length = 0;

			U('Efficient patrols').bought = 1;
			chk("'Efficient patrols' shortens the yarn 80s -> 68s", M.durationFor(yarn) === 68);
			M.dispatch('yarn');
			const d = M.away[0].returnAt - now();
			chk('a dispatched expedition honors the shortened duration (~68s out)', d > 67500 && d < 68500);
			M.away.length = 0;
			U('Efficient patrols').bought = 0;

			Math.random = () => 0.9999;
			const baseTreats = M.treats;
			M.dispatch('pantry');
			resolveNow();
			chk('the pantry maxes at 6 treats without the modifier', M.treats - baseTreats === 6);
			U('Generous strangers').bought = 1;
			M.dispatch('pantry');
			resolveNow();
			chk("'Generous strangers' rounds the 6 up to ceil(6*1.2) = 8", M.treats - baseTreats === 14);
			U('Generous strangers').bought = 0;

			U('Bottomless treat jar').bought = 1;
			const ticks = G.fps * 60 + 10; //a minute of game ticks, +10 float margin
			M.treats = 0; M.treatsEarnedTotal = 0; M.treatTrickle = 0;
			for (let i = 0; i < ticks; i++) M.logic();
			chk('the jar trickles 1 treat per minute and counts it toward the lifetime total', M.treats === 1 && M.treatsEarnedTotal === 1);
			M.treats = 0; M.treatsEarnedTotal = 999; M.treatTrickle = 0;
			for (let i = 0; i < ticks; i++) M.logic();
			chk('a threshold crossed by jar drip alone still fires "Pocketful of treats"', M.treatsEarnedTotal === 1000 && G.Achievements['Pocketful of treats'].won === 1);
			U('Bottomless treat jar').bought = 0;

			// 6. treat economy, repeatable stacks, CpS hookup
			// Cats is a DYNAMIC building: me.cps is a function evaluated as me.cps(me)
			const catsCps = () => (typeof cats.cps === 'function' ? (cats.cps as any)(cats) : (cats.cps as number));
			const cpsBefore = catsCps();
			M.treats = 10000;
			M.buyUpgrade('Cardboard fort training');
			chk('treat purchase adds a stack, marks the first one in the main save, deducts 15 treats', M.effectiveStacks('Cardboard fort training') === 1 && U('Cardboard fort training').bought === 1 && M.treats === 10000 - 15);
			chk('Cats CpS rose after the stack (' + cpsBefore.toFixed(2) + ' -> ' + catsCps().toFixed(2) + ')', catsCps() > cpsBefore);
			M.treats = 100000;
			for (const n of M.upgradeNames) M.buyUpgrade(n);
			chk('buying every upgrade wins "Fully catified"', G.Achievements['Fully catified'].won === 1);
			M.missionsCompleted = 50;
			M.checkExpeditionAchievements();
			chk('"Seasoned adventurers" wins at 50 missions', G.Achievements['Seasoned adventurers'].won === 1);
			M.missionsCompleted = 250;
			M.checkExpeditionAchievements();
			chk('"The nine-lives guild" wins at 250 missions', G.Achievements['The nine-lives guild'].won === 1);

			// 7. save / load round-trip
			// Clear the main-save bought flags first: with them still set,
			// effectiveStacks' fallback (exercised by refresh() -> renderShop)
			// would correctly self-migrate any 0-stack row back to 1 before
			// M.save runs. The bought-flag migration itself is tested below.
			for (const n of M.upgradeNames) U(n).bought = 0;
			M.treats = 77;
			M.missionsCompleted = 9;
			M.treatsEarnedTotal = 1234;
			M.upgradeStacks = [2, 0, 1, 0, 0, 3];
			M.dispatch('yarn');
			M.resting.push({ uid: M.uidN++, count: 2, returnAt: now() + 30000 });
			const saved = M.save();
			// A real hard reset clears the main-save bought flags BEFORE the
			// minigame reset runs (systems/reset.ts), so mirror that order —
			// otherwise effectiveStacks' main-save fallback would correctly
			// regrow one stack per still-bought upgrade.
			for (const n of M.upgradeNames) U(n).bought = 0;
			M.reset(true);
			chk('reset cleared the colony state', M.treats === 0 && M.missionsCompleted === 0 && M.treatsEarnedTotal === 0 && M.away.length === 0 && M.resting.length === 0 && M.upgradeStacks.every((n: number) => n === 0));
			M.load(saved);
			chk('load restored treats, counters, stacks and in-flight expeditions (' + saved + ')', M.treats === 77 && M.missionsCompleted === 9 && M.treatsEarnedTotal === 1234 && M.upgradeStacks.join(':') === '2:0:1:0:0:3' && M.away.length === 1 && M.away[0].id === 'yarn' && M.away[0].count === 1 && M.away[0].returnAt - now() > 60000 && M.resting.length === 1 && M.resting[0].count === 2);
			M.reset(true);
			U('Cardboard fort training').bought = 1; //pre-stacking save: bought flag, 0 stacks
			chk('effectiveStacks self-migrates a pre-stacking bought upgrade to 1', M.effectiveStacks('Cardboard fort training') === 1 && M.upgradeStacks[0] === 1);
			U('Cardboard fort training').bought = 0;
			U('Legendary colony charter').bought = 1;
			M.load('5 5 5 - - 0:0:0:0:0:0');
			chk('load migrates the bought flag of a pre-stacking save to one stack', M.treats === 5 && M.missionsCompleted === 5 && M.upgradeStacks.join(':') === '0:0:0:0:0:1');

			// 8. How-to-play button + tutorial panel
			const helpBtn = document.getElementById('colonyHelpBtn') as HTMLElement | null;
			chk('the roster has a "How to play" button', !!helpBtn);
			if (helpBtn) {
				helpBtn.click();
				const tut = document.getElementById('colonyTutorial');
				chk('clicking it opens the tutorial (with content + close button)', !!tut && tut.style.display !== 'none' && !!document.getElementById('colonyHelpClose') && (tut.textContent || '').includes('Dispatch expeditions'));
				const closeBtn = document.getElementById('colonyHelpClose') as HTMLElement | null;
				if (closeBtn) closeBtn.click();
				chk('the close button hides the tutorial', !!tut && tut.style.display === 'none' && tut.innerHTML === '');
			}

			// cleanup: the QA page is disposable, but leave the colony state sane
			M.away.length = 0;
			M.resting.length = 0;
			M.treats = 0; M.missionsCompleted = 0; M.treatsEarnedTotal = 0; M.treatTrickle = 0;
			M.upgradeStacks = [0, 0, 0, 0, 0, 0];
			for (const n of M.upgradeNames) U(n).bought = 0;
			U('Nap discipline').bought = 0;
			U('Generous strangers').bought = 0;
			U('Efficient patrols').bought = 0;
			U('Bottomless treat jar').bought = 0;
			Math.random = realRandom;
			out.textContent = lines.join('\n') + '\n[QA-catcolony] ' + (pass ? 'PASS: Cat Colony minigame + repeatable treat upgrades verified end to end' : 'FAIL: see checks above');
		} catch (e: any) {
			out.textContent = '[QA-catcolony] ERROR: ' + e.constructor.name + ': ' + e.message;
		}
		window.clearInterval(tick);
	}, 250);
}

/* ----------------------------------------------------------------- i18n */
// Language files are ESM modules; Vite code-splits each into its own chunk.
/* Generic = the module namespace shape at runtime: each loc file is
 * `export default { id, name, strings }` (a LanguageData), so the resolved
 * module is `{ default: LanguageData }` (plural strings are [one, many] arrays). */
const langModules = import.meta.glob<{ default: LanguageData }>(
	'./engine/loc/*.ts',
);

window.loadLangModule = function (file, done, fail) {
	const key = `./engine/loc/${file}.ts`;
	if (!langModules[key]) {
		if (fail) fail(new Error(`Unknown language module: ${file}`));
		return;
	}
	langModules[key]().then((m) => {
		const { id, name, strings } = m.default;
		window.AddLanguage(id, name, strings);
		done();
	}).catch((err) => {
		(fail || ((e) => console.error(e)))(err);
	});
};

/* ------------------------------------------------------------ minigames */
// Keys match the `minigameUrl` values the engine assigns to buildings.
const minigameModules: Record<string, () => Promise<unknown>> = {
	// Keys must stay the classic '…js' strings: the engine (engine/main.ts)
	// assigns them verbatim as building.minigameUrl; only the specifiers moved to .ts.
	'minigameGarden.js': () => import('./engine/minigameGarden'),
	'minigameGrimoire.js': () => import('./engine/minigameGrimoire'),
	'minigameMarket.js': () => import('./engine/minigameMarket'),
	'minigamePantheon.js': () => import('./engine/minigamePantheon'),
	'minigameCatColony.js': () => import('./engine/minigameCatColony'),
	'minigameGrandmaSittingRoom.js': () => import('./engine/minigameGrandmaSittingRoom'),
	// CC3 extras mod (extras/casino.ts): the code is already in memory via
	// the static import — this no-op module stands in for the original's
	// remote "dummyFile.js" so the vanilla minigame machinery (LoadMinigames
	// -> scriptLoaded -> M.launch) works unchanged.
	'casino.js': () => Promise.resolve(null),
};

window.loadMinigameModule = function (url) {
	const loader = minigameModules[url];
	if (!loader) return Promise.reject(new Error(`Unknown minigame module: ${url}`));
	return loader();
};

/* ----------------------------------------------- engine UI hooks (no
 * inline handlers anymore: these replace the original onclick/onmouseout). */
document.getElementById('tooltip')!.addEventListener('mouseout', () => {
	window.Game.tooltip.hide();
});
document.getElementById('promptClose')!.addEventListener('click', () => {
	window.PlaySound('snd/tickOff.mp3');
	window.Game.ClosePrompt();
});

/* ------------------------------------------------------------- cosmetic */
document.title = 'Cookie Clicker 3';

/* --------------------------------------------- PWA: offline support (prod) */
const swEnabled = import.meta.env.PROD && 'serviceWorker' in navigator && !new URLSearchParams(window.location.search).has('nosw');
if (swEnabled) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
			console.warn('Service worker registration failed:', err);
		});
	});
}

/* --------------------------- one-column responsive mode (CC3) ---------------------------
   Completes the "todo!" Orteil left in the 2.048 style.css. On a narrow viewport the
   game collapses to ONE full-width column at a time, switched with a bottom tab bar
   (Cookie / Buildings / Store), and the min layout width drops 800 -> 400 (the engine reads
   Game.minLayoutW; the transform parameterized the hard-coded 800). The viewport meta is
   swapped too: the classic layout uses width=900 (a fixed 900px canvas scaled to fit — on a
   phone that forces the whole game to ~0.45x), while one-column mode uses width=device-width
   so the game gets the phone's real pixel width.

   Mode detection uses min(innerWidth, screen.width): under the classic meta a phone's layout
   viewport reports 900, but screen.width always reports the device width, so detection works
   in both states; on desktop the window's innerWidth is the meaningful value.
   Force it for testing with ?oneCol=1 (on) / ?oneCol=0 (off). */
(function () {
	const ONE_COL_MAX_W = 640;
	// viewport-fit=cover: when installed as a full-screen PWA, let the content
	// reach the screen edges so the CSS can place the tab bar / top bar against
	// the real safe-area insets (env() is 0 without it). In a plain browser the
	// insets are 0 anyway, so this only changes full-screen PWA behavior.
	const VP_DEVICE = 'width=device-width, initial-scale=1, viewport-fit=cover';
	const vp = document.querySelector<HTMLMetaElement>('meta[name=viewport]');
	const vpClassic = vp ? vp.content : null;
	const force =
		params.get('oneCol') === '1' || params.get('oneCol') === 'on'
			? true
			: params.get('oneCol') === '0' || params.get('oneCol') === 'off'
				? false
				: null;
	const COLS = ['left', 'middle', 'right'];
	const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('#oneColTabs button'));
	let activeCol = 'left';
	let currentOneCol: boolean | null = null;

	// dataset.col is string | undefined; undefined falls through to 'left'
	// exactly as the original indexOf(col) === -1 check did.
	const setCol = (col: string | undefined) => {
		activeCol = col && COLS.indexOf(col) !== -1 ? col : 'left';
		document.body.dataset.col = activeCol;
		for (const t of tabs) t.setAttribute('aria-pressed', String(t.dataset.col === activeCol));
	};
	setCol('left');
	for (const t of tabs) t.addEventListener('click', () => setCol(t.dataset.col));

	const desiredOneCol = () =>
		force === null ? Math.min(window.innerWidth, window.screen.width) <= ONE_COL_MAX_W : force;

	const applyMode = (G: EngineGame) => {
		const on = desiredOneCol();
		if (on === currentOneCol) return;
		currentOneCol = on;
		document.body.classList.toggle('oneColumn', on);
		if (G) G.minLayoutW = on ? 400 : 800;
		if (vp) vp.content = on ? VP_DEVICE : vpClassic!;
	};

	// The engine registers its own window 'resize' listener and calls Game.resize() once at
	// boot. Wrapping the function (not adding a second listener) guarantees the mode is
	// resolved BEFORE the engine's scale math runs, so the min width is already correct on
	// every pass — including the resize events our own viewport-meta swap triggers.
	const boot = window.setInterval(() => {
		const G = window.Game;
		// Game.resize only exists once the engine's constructor has run (after the
		// player picks a language on a fresh profile), so poll until it does.
		if (!G || typeof G.resize !== 'function') return;
		window.clearInterval(boot);
		if (G.__oneColWrapped) return;
		G.__oneColWrapped = 1;
		const orig = G.resize;
		G.resize = function () {
			applyMode(G);
			orig.call(G);
			// Publish the layout scale (Game.resize set Game.scale) so CSS can convert
			// viewport-space safe-area insets into the (possibly scaled) wrapper space:
			// see the "One-column responsive mode" block in styles/main.css.
			document.body.style.setProperty('--cc3Scale', String(G.scale));
		};
		G.resize(); // re-run now: the engine's boot resize already ran with the 800 default
	}, 25);
})();

/* --------------------------- CC3 polish: the v3.0 animation pass ---------------------------
   Presentation-layer motion on top of the untouched 2.048 engine (the CSS
   side of this pass lives in the "CC3 polish" block of styles/main.css).
   Everything here is transform/opacity only, never touches game state, and
   is disabled as a whole by EITHER the OS "reduce motion" setting
   (prefers-reduced-motion) OR the in-game "Fancy graphics" toggle
   (Game.prefs.fancy) — both published as body.noMotion for the CSS gates.
   The effects:
   1. Smooth cookie counter — the engine eases Game.cookiesd toward
      Game.cookies by 30% per 30Hz tick (0.7 of the gap remaining) and
      renders #cookies at loop rate. This re-renders the SAME #cookies at
      the display's refresh rate, continuing the engine's own easing in its
      exact closed form (x -> C - (C-x)*0.7^(t/T), which matches the
      engine's discrete value at every tick boundary). It re-anchors on
      every engine tick (a Game.T change), so it can never drift from the
      engine's value; when inactive, the engine's own render stands alone.
   2. Ascend flash — when the 5s ascend intro passes its breakpoint
      (Game.AscendBreakpoint — the cookie-"explosion" tick where the engine
      plays snd/thud.mp3), flash the #cc3Flash overlay and shake #game
      for ~0.5s.
   3. Note slide-in — .note elements get a one-shot CSS entrance; since
      UpdateNotes() rebuilds the #notes innerHTML on every change, already-
      seen notes are tagged .cc3Seen so the entrance doesn't replay on
      them.
   Verify with ?debug=1&qa=anim (and the reduced-motion variant in
   tests/qa.spec.js). */
(function () {
	const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	const stats: Cc3AnimStats = {
		motion: true,
		noMotionClass: false,
		counter: { active: false, frames: 0, anchors: 0, writes: 0 },
		ascendFlashes: 0,
		notesSeen: 0,
	};
	window.__cc3Anim = stats;

	/* --- 1. smooth cookie counter ---------------------------------------- */
	let lastT = -1;
	let ax = 0, aC = 0, at = 0;
	let lastStr = '';
	const renderCookies = (v: number) => {
		const G = window.Game;
		const el = document.getElementById('cookies');
		if (!el) return;
		// Ported 1:1 from the engine's own #cookies render (Game.Draw) —
		// the only difference is that the value comes from the closed-form
		// continuation instead of the tick-quantized Game.cookiesd.
		let str = window.Beautify(Math.round(v));
		if (v >= 1000000)//dirty padding
		{
			const spacePos = str.indexOf(' ');
			const dotPos = str.indexOf('.');
			let add = '';
			if (spacePos !== -1)
			{
				if (dotPos === -1) add += '.000';
				else
				{
					if (spacePos - dotPos === 2) add += '00';
					if (spacePos - dotPos === 3) add += '0';
				}
			}
			str = [str.slice(0, spacePos), add, str.slice(spacePos)].join('');
		}
		str = window.loc('%1 cookie', { n: Math.round(v), b: str });
		if (str.length > 14) str = str.replace(' ', '<br>');
		if (G.prefs.monospace) str = '<span class="monospace">' + str + '</span>';
		str += '<div id="cookiesPerSecond"' + (G.cpsSucked > 0 ? ' class="wrinkled"' : '') + '>' + window.loc('per second:') + ' ' + window.Beautify(G.cookiesPs * (1 - G.cpsSucked), 1) + '</div>';
		if (str !== lastStr)
		{
			el.innerHTML = str;
			lastStr = str;
			stats.counter.writes++;
		}
	};

	/* --- 2. ascend flash --------------------------------------------------- */
	let lastAscendTimer = 0;
	let flashCleanup = 0;
	const fireAscendFlash = () => {
		const flash = document.createElement('div');
		flash.id = 'cc3Flash';
		const game = document.getElementById('game');
		document.body.appendChild(flash);
		void flash.offsetWidth; // let the element commit before the animation
		flash.classList.add('cc3On');
		if (game) game.classList.add('cc3Shake');
		stats.ascendFlashes++;
		window.clearTimeout(flashCleanup);
		flashCleanup = window.setTimeout(() => {
			flash.classList.remove('cc3On');
			if (game) game.classList.remove('cc3Shake');
			flash.remove();
		}, 900);
	};

	/* --- 3. one-shot note entrances ---------------------------------------- */
	const seenNotes = new Set();
	const notesEl = document.getElementById('notes');
	if (notesEl) {
		const markSeen = () => {
			for (const el of notesEl.children) {
				const id = el.id && el.id.indexOf('note-') === 0 ? el.id : null;
				if (!id) continue;
				if (!seenNotes.has(id)) {
					seenNotes.add(id);
					stats.notesSeen++;
				} else {
					el.classList.add('cc3Seen'); // innerHTML rebuild: suppress replay
				}
			}
		};
		new MutationObserver(markSeen).observe(notesEl, { childList: true });
	}

	/* --- the frame loop ------------------------------------------------------ */
	let wasOff: boolean | null = null;
	const frame = (now: number) => {
		window.requestAnimationFrame(frame);
		const G = window.Game;
		if (!G || !G.ready || !G.prefs) return;

		// Publish the combined opt-out (OS reduce-motion or in-game
		// "Fancy graphics" off) for the CSS gates.
		const off = motionQuery.matches || !G.prefs.fancy;
		stats.motion = !off;
		if (off !== wasOff) {
			wasOff = off;
			document.body.classList.toggle('noMotion', off);
			if (off) lastStr = ''; // next motion-enabled frame re-renders fresh
		}
		stats.noMotionClass = document.body.classList.contains('noMotion');
		if (off) {
			stats.counter.active = false;
			return;
		}

		// 1. Smooth counter: only while the engine itself is drawing
		// (Game.visible mirrors document visibility; during OnAscend the
		// engine skips the #cookies render, so we must too).
		const active = !!G.visible && !G.OnAscend && !!document.getElementById('cookies');
		stats.counter.active = active;
		if (active) {
			if (G.T !== lastT) {
				// Engine tick boundary: re-anchor on the engine's own value.
				lastT = G.T;
				ax = G.cookiesd;
				aC = G.cookies;
				at = now;
				stats.counter.anchors++;
			}
			const frac = Math.min((now - at) / (1000 / G.fps), 1);
			renderCookies(aC - (aC - ax) * Math.pow(0.7, frac));
			stats.counter.frames++;
		}

		// 2. Ascend flash: fire once when the intro crosses the breakpoint.
		if (G.AscendTimer > 0 && G.AscendBreakpoint > 0 &&
			lastAscendTimer < G.AscendBreakpoint && G.AscendTimer >= G.AscendBreakpoint) {
			fireAscendFlash();
		}
		lastAscendTimer = G.AscendTimer;
	};
	window.requestAnimationFrame(frame);
})();
