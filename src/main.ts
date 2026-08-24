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
 * Never active in a plain production load. */
if (debugSurface && params.has('qa') && params.get('qa') !== 'golden' && params.get('qa') !== 'save' && params.get('qa') !== 'backup' && params.get('qa') !== 'sound' && params.get('qa') !== 'perf' && params.get('qa') !== 'ascend' && params.get('qa') !== 'offline' && params.get('qa') !== 'special' && params.get('qa') !== 'a11y' && params.get('qa') !== 'wrinkler' && params.get('qa') !== 'icon' && params.get('qa') !== 'onecol' && params.get('qa') !== 'anim' && params.get('qa') !== 'binverter' && params.get('qa') !== 'content' && params.get('qa') !== 'destiny') {
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
			const achievementOk = ['Cat nap council','Purrfectly populated','Nine lives, nine rows','The purrduction line','A cat for every cushion','The whole litter','Barnstormer','A field of dreams','From barn to bakery'].every((name) => !!G.Achievements[name]);
			const analysisCategoriesOk = analysis.upgrades.some((upgrade) => upgrade.name === 'Purrfect timing' && upgrade.category === 'click' && Number.isFinite(upgrade.clickPaybackSeconds.five)) && analysis.upgrades.some((upgrade) => upgrade.name === 'Cardboard box basics' && upgrade.category === 'passive') && analysis.upgrades.some((upgrade) => upgrade.name === 'Heavenly cookies' && upgrade.category === 'prestige');
			const strategyOk = strategies.length === 3 && strategies.every((run) => run.purchases > 0 && run.samples.length >= 2 && run.elapsedSeconds === 120);
			const buildingBalanceOk = analysis.buildingBalance.length === analysis.buildingCount && analysis.buildingBalance.every((audit) => audit.milestones.length === 2 && audit.milestones.every((milestone) => milestone.level > 0 && milestone.totalInvestment >= 0 && milestone.totalCps >= 0 && milestone.nextPurchaseCost >= 0 && milestone.marginalCps >= 0 && milestone.paybackRatioToCurve >= 0));
			const analysisOk = analysis.buildingCount === Object.keys(G.Objects).length && analysis.upgradeCount === Object.keys(G.Upgrades).length && analysis.milestones.length === analysis.buildingCount * 2 && analysis.buildingBalance.length === analysis.buildingCount && analysis.upgrades.length === analysis.upgradeCount && analysisCategoriesOk && buildingBalanceOk && strategyOk && G.Objects['Grandma'].amount === 10 && G.Objects['Cats'].amount === 10 && G.Objects['Farm'].amount === 10;
			const pass = validation.valid && orderOk && cpsOk && paybackOk && simulationOk && achievementOk && analysisOk;
			out.textContent =
				'[QA-content] validation: ' + (validation.valid ? 'PASS' : 'FAIL') + ' (' + validation.buildingCount + ' buildings, ' + validation.upgradeCount + ' upgrades, ' + validation.errors + ' errors)\n' +
				'[QA-content] economy snapshot total CpS=' + report.totalCps.toFixed(2) + '\n' +
				selected.map((building) => building ? '[QA-content] ' + building.name + ': order=' + building.storeOrder + ', amount=' + building.amount + ', CpS/unit=' + building.cpsPerBuilding.toFixed(2) + ', total=' + building.totalCps.toFixed(2) : '[QA-content] missing building').join('\n') + '\n' +
				'[QA-content] store order Grandma < Cats < Farm: ' + (orderOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] CpS/unit Grandma < Cats < Farm: ' + (cpsOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] next purchase cost/marginal CpS/payback: ' + (paybackOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] simulator restores live counts: ' + (simulationOk ? 'PASS' : 'FAIL') + '\n' +
				'[QA-content] Cat/Farm achievements registered: ' + (achievementOk ? 'PASS' : 'FAIL') + '\n' +
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
			const cpsOk = Math.abs(G.cookiesPs - cpsA) < 0.01;
			const pass = ok && cookiesOk && cursorsOk && grandmasOk && catsOk && catUpgradeOk && catAchievementOk && cpsOk;
			out.textContent =
				'[QA-save] export length=' + saveStr.length +
				'\n[QA-save] ImportSaveCode returned=' + ok +
				'\n[QA-save] state A: cookies=' + COOKIES + ' cursors=' + CURSORS + ' grandmas=' + GRANDMAS + ' cats=' + CATS + ' cps=' + cpsA.toFixed(2) +
				'\n[QA-save] corrupted: cookies=7 cursors=0 grandmas=0 cats=0 cps=' + cpsCorrupt.toFixed(2) +
				'\n[QA-save] after import: cookies=' + G.cookies.toFixed(3) + ' cursors=' + G.Objects['Cursor'].amount + ' grandmas=' + G.Objects['Grandma'].amount + ' cats=' + G.Objects['Cats'].amount + ' cps=' + G.cookiesPs.toFixed(2) +
				'\n[QA-save] checks: cookies=' + cookiesOk + ' cursors=' + cursorsOk + ' grandmas=' + grandmasOk + ' cats=' + catsOk + ' cat upgrade=' + catUpgradeOk + ' cat achievement=' + catAchievementOk + ' cps=' + cpsOk +
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
