// Music picker test: exercises the Settings soundtrack + track pickers
// (systems/music.ts) end to end — render, pick/persist a track, switch
// soundtracks (pool repoint + pause of the old track), advance within a
// pool, per-soundtrack resume memory, and that one of the newly added Towns
// files serves over HTTP and actually plays. Runs against the default
// :4173 preview, like the other explicit specs:
// `npx playwright test tests/music-picker.spec.js` (npm test stays scoped
// to tests/qa.spec.js).
import { test, expect } from '@playwright/test';
const BOOT = { timeout: 30_000 };
async function boot(page) {
	await page.goto('/?debug=1', { waitUntil: 'load' });
	const lang = page.locator('#langSelect-English');
	try { await lang.waitFor({ state: 'visible', timeout: 5000 }); await lang.click(); } catch {}
	await page.waitForFunction(() => window.Game && window.Game.ready === 1, null, BOOT);
}
test('verify: soundtrack + track picker', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await boot(page);
	await page.evaluate(() => { Game.prefs.bgMusic = 1; }); // gesture happens via our clicks

	// 1. menu renders the pickers with Original active and 8 tracks
	await page.locator('#prefsButton').click();
	const m1 = await page.evaluate(() => ({
		st: Music.activeSoundtrack,
		names: Music.names.length,
		all: Object.keys(Music.allTracks).length,
		hasST: !!document.getElementById('musicTrackSelect'),
	}));
	console.log('[1] initial:', JSON.stringify(m1));
	expect(m1.st).toBe('original'); expect(m1.names).toBe(8); expect(m1.all).toBe(8); // lazy: only the active pool is registered yet
	expect(m1.hasST).toBe(true);

	// 2. pick a specific track -> persists + plays
	await page.evaluate(() => Game.SetMusicTrack('Origins'));
	const m2 = await page.evaluate(() => ({
		cur: Music.currentName,
		pref: localStorage.getItem('cc3_musicTrack:original'),
		paused: Music.tracks['Origins'].audio.paused,
		src: Music.tracks['Origins'].audio.getAttribute('src'),
	}));
	console.log('[2] pick Origins:', JSON.stringify(m2));
	expect(m2.cur).toBe('Origins'); expect(m2.pref).toBe('Origins');
	expect(m2.src).toBe('snd/music/Origins.mp3'); expect(m2.paused).toBe(false);

	// 3. switch to Towns -> pool repoints, prev audio pauses, auto-plays pool start
	await page.evaluate(() => Game.SetMusicSoundtrack('towns'));
	const m3 = await page.evaluate(() => ({
		st: Music.activeSoundtrack,
		names: Music.names.length,
		ghostInPool: Music.names.indexOf('Ghost Alley') !== -1,
		farmInPool: Music.names.indexOf('Farm Life') !== -1,
		cur: Music.currentName,
		originsPaused: Music.tracks['Origins'].audio.paused,
		prefKey: localStorage.getItem('cc3_musicTrack:towns'),
		all: Object.keys(Music.allTracks).length,
	}));
	console.log('[3] towns:', JSON.stringify(m3));
	expect(m3.st).toBe('towns'); expect(m3.names).toBe(7); expect(m3.all).toBe(12); // both pools now registered
	expect(m3.ghostInPool).toBe(true); expect(m3.farmInPool).toBe(true);
	expect(m3.originsPaused).toBe(true); expect(m3.cur).toBe('Bustling Streets');

	// 4. next() advances within the Towns pool
	await page.evaluate(() => Music.next());
	const m4 = await page.evaluate(() => Music.currentName);
	console.log('[4] after next():', m4);
	expect(m4).toBe('Farm Life');

	// 4b. one of the NEW tracks serves over HTTP and actually plays
	const http = await page.evaluate(async () => {
		const r = await fetch('snd/music/Ghost Alley.mp3');
		return { status: r.status, len: (await r.blob()).size };
	});
	console.log('[4b] Ghost Alley.mp3 over HTTP:', JSON.stringify(http));
	expect(http.status).toBe(200); expect(http.len).toBeGreaterThan(500000);

	// 5. set a Towns track (verifies it plays), then switch back to Original -> resumes Origins
	await page.evaluate(() => Game.SetMusicTrack('Ghost Alley'));
	const ghost = await page.evaluate(() => ({
		cur: Music.currentName,
		src: Music.tracks['Ghost Alley'].audio.getAttribute('src'),
		paused: Music.tracks['Ghost Alley'].audio.paused,
	}));
	console.log('[5] playing Ghost Alley:', JSON.stringify(ghost));
	expect(ghost.cur).toBe('Ghost Alley'); expect(ghost.src).toBe('snd/music/Ghost Alley.mp3');
	expect(ghost.paused).toBe(false);
	await page.evaluate(() => Game.SetMusicSoundtrack('original'));
	const m5 = await page.evaluate(() => ({
		cur: Music.currentName,
		townsSaved: localStorage.getItem('cc3_musicTrack:towns'),
	}));
	console.log('[5] back to original:', JSON.stringify(m5));
	expect(m5.cur).toBe('Origins'); expect(m5.townsSaved).toBe('Ghost Alley');

	// 6. dropdown shows + menu close/reopen reflects state, then persist across reload
	await page.reload({ waitUntil: 'load' });
	await boot(page);
	const m6 = await page.evaluate(() => ({
		st: Music.activeSoundtrack,
		pref: localStorage.getItem('cc3_musicTrack:original'),
	}));
	console.log('[6] after reload:', JSON.stringify(m6));
	expect(m6.st).toBe('original'); expect(m6.pref).toBe('Origins');
	expect(errors).toEqual([]);
});
