/* Cookie Clicker 3 — entry point.
 *
 * Wires the ported 2.048 engine into a modern module pipeline:
 *   config.js        publishes VERSION/BETA/App before the engine evaluates
 *   engine/base64.js native btoa/atob save encoding
 *   engine/main.js   the engine itself (classic script -> ES module)
 *
 * The engine still bootstraps on the window `load` event (see the bottom of
 * engine/main.js). It asks this module for language files and minigame
 * scripts via `window.loadLangModule` / `window.loadMinigameModule`; both are
 * backed by static Vite dynamic imports, so they bundle, tree-split and
 * resolve correctly in dev and in the production build.
 */
import './config.js';
import './engine/base64.js';
import './engine/main.js';
import './styles/main.css';

/* Error surface: paint uncaught boot/runtime errors to the DOM so they're
 * visible without DevTools. Always on in the dev server; in the production
 * build it is opt-in via ?debug=1 (handy for field diagnosis). */
const params = new URLSearchParams(window.location.search);
const debugSurface = import.meta.env.DEV || params.has('debug');
if (debugSurface) {
	const show = (label, text) => {
		const d = document.createElement('pre');
		d.id = '__dbg';
		d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#b00020;color:#fff;padding:8px;max-width:80vw;white-space:pre-wrap;font:12px/140% monospace;';
		d.textContent = label + ': ' + text;
		document.body.appendChild(d);
	};
	window.addEventListener('error', (e) => show('ERR', e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '')));
	window.addEventListener('unhandledrejection', (e) => show('REJ', e.reason && e.reason.stack ? e.reason.stack : String(e.reason)));
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
 *   ?qa=golden    spawn + pop a forced "frenzy" golden cookie, report the buff
 *   ?qa=save      export a save, corrupt state, re-import, verify round-trip
 * Never active in a plain production load. */
if (debugSurface && params.has('qa') && params.get('qa') !== 'golden' && params.get('qa') !== 'save' && params.get('qa') !== 'perf') {
	const qaMode = params.get('qa'); // null for bare ?qa, else the value
	const MINIGAME_BUILDINGS = ['Farm', 'Bank', 'Temple', 'Wizard tower'];
	const tick = window.setInterval(() => {
		const G = window.Game;
		if (!G || !G.ready || !G.Objects) return;
		if (!G.__qaSeeded) {
			G.__qaSeeded = 1;
			try {
				G.cookies += 1e6;
				if (qaMode !== 'cookies') {
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
			} catch (e) {
				console.error('QA seed failed:', e);
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
				} catch (e) {
					console.error('QA open minigame failed:', e);
				}
			}
			if (farm.onMinigame) window.clearInterval(tick); // Garden open: done
		}
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
		} catch (e) {
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
			const COOKIES = 12345.678, CURSORS = 10, GRANDMAS = 5;
			// 1. seed state A
			G.cookies = COOKIES;
			G.Objects['Cursor'].amount = CURSORS; G.Objects['Cursor'].unlocked = 1; G.Objects['Cursor'].bought = 1;
			G.Objects['Grandma'].amount = GRANDMAS; G.Objects['Grandma'].unlocked = 1; G.Objects['Grandma'].bought = 1;
			G.recalculateGains = 1; G.CalculateGains();
			const cpsA = G.cookiesPs;
			// 2. export the save string
			const saveStr = G.WriteSave(1);
			// 3. corrupt the live state (so the import must do real work)
			G.cookies = 7;
			G.Objects['Cursor'].amount = 0;
			G.Objects['Grandma'].amount = 0;
			G.recalculateGains = 1; G.CalculateGains();
			const cpsCorrupt = G.cookiesPs;
			// 4. re-import the export
			const ok = G.ImportSaveCode(saveStr);
			G.recalculateGains = 1; G.CalculateGains();
			// 5. verify the state was restored
			const cookiesOk = Math.abs(G.cookies - COOKIES) < 0.01;
			const cursorsOk = G.Objects['Cursor'].amount === CURSORS;
			const grandmasOk = G.Objects['Grandma'].amount === GRANDMAS;
			const cpsOk = Math.abs(G.cookiesPs - cpsA) < 0.01;
			const pass = ok && cookiesOk && cursorsOk && grandmasOk && cpsOk;
			out.textContent =
				'[QA-save] export length=' + saveStr.length +
				'\n[QA-save] ImportSaveCode returned=' + ok +
				'\n[QA-save] state A: cookies=' + COOKIES + ' cursors=' + CURSORS + ' grandmas=' + GRANDMAS + ' cps=' + cpsA.toFixed(2) +
				'\n[QA-save] corrupted: cookies=7 cursors=0 grandmas=0 cps=' + cpsCorrupt.toFixed(2) +
				'\n[QA-save] after import: cookies=' + G.cookies.toFixed(3) + ' cursors=' + G.Objects['Cursor'].amount + ' grandmas=' + G.Objects['Grandma'].amount + ' cps=' + G.cookiesPs.toFixed(2) +
				'\n[QA-save] checks: cookies=' + cookiesOk + ' cursors=' + cursorsOk + ' grandmas=' + grandmasOk + ' cps=' + cpsOk +
				'\n[QA-save] ' + (pass ? 'PASS: export->import round-trip restored state' : 'FAIL: state mismatch');
		} catch (e) {
			out.textContent = '[QA-save] ERROR: ' + e.constructor.name + ': ' + e.message;
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
			} catch (e) {
				console.error('QA perf seed failed:', e);
			}
		}
		if (!G.__qaPerfStarted) {
			const allLoaded = BUILDINGS.every((n) => G.Objects[n] && G.Objects[n].minigameLoaded);
			if (!allLoaded) return;
			G.__qaPerfStarted = 1;
			const farm = G.Objects['Farm'];
			if (farm && !farm.onMinigame && farm.switchMinigame) {
				try { farm.switchMinigame(1); if (farm.refresh) farm.refresh(); } catch (e) { console.error('QA perf open failed:', e); }
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

/* ----------------------------------------------------------------- i18n */
// Language files are ESM modules; Vite code-splits each into its own chunk.
const langModules = import.meta.glob('./engine/loc/*.js');

window.loadLangModule = function (file, done, fail) {
	const key = `./engine/loc/${file}.js`;
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
const minigameModules = {
	'minigameGarden.js': () => import('./engine/minigameGarden.js'),
	'minigameGrimoire.js': () => import('./engine/minigameGrimoire.js'),
	'minigameMarket.js': () => import('./engine/minigameMarket.js'),
	'minigamePantheon.js': () => import('./engine/minigamePantheon.js'),
};

window.loadMinigameModule = function (url) {
	const loader = minigameModules[url];
	if (!loader) return Promise.reject(new Error(`Unknown minigame module: ${url}`));
	return loader();
};

/* ----------------------------------------------- engine UI hooks (no
 * inline handlers anymore: these replace the original onclick/onmouseout). */
document.getElementById('tooltip').addEventListener('mouseout', () => {
	window.Game.tooltip.hide();
});
document.getElementById('promptClose').addEventListener('click', () => {
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
