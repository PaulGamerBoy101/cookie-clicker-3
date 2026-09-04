/**
 * systems/music.ts — CC3 web background music (not in 2.048's browser build).
 *
 * 2.048's browser version has no music at all: `Music` stays `false`, the
 * "Music in background" pref and the jukebox's track section are Steam-only
 * (`App`-gated), and `Game.jukebox.tracks` is never populated. CC3 adds a
 * small music player here that implements exactly the interface the vanilla
 * jukebox already drives — `Music.tracks[name] = { name, author, audio }`,
 * `setVolume`, `playTrack`, `pause`, `unpause`, `loop`, `setFilter`, `cue`,
 * `next` — so the existing (Steam-only) jukebox track UI works unmodified in
 * the browser once its `if (App)` gate is relaxed to `if (Music)`.
 *
 * Tracks are MP3s in public/snd/music/, composed by Bert Cole
 * (bitbybitsound.com) — see CREDITS.md for the required attribution. Each
 * track gets its own HTMLAudioElement (created lazily by the engine's Audio
 * wrapper), looped by default; auto-advance to the next track happens on
 * 'ended' when `Game.jukebox.trackAuto` is on.
 *
 * CC3 perf: the elements exist from init (the jukebox reads
 * `tracks[name].audio` synchronously), but their `src` is only assigned on
 * first `playTrack(name)` — until then the browser fetches nothing, so a
 * visitor who never enables music downloads none of the ~12 MB of tracks,
 * and a visitor who does downloads them one at a time. When a track starts,
 * the next track in the list is pre-buffered (src assigned, not played) so
 * jukebox auto-advance stays gapless.
 *
 * CC3 soundtracks: tracks are grouped into soundtracks (the Original OST and
 * the Towns set from the same 16-Bit Starter Pack), and the player plays one
 * soundtrack's pool at a time. The choice persists in localStorage
 * (`cc3_musicSoundtrack`, `cc3_musicTrack`) — NOT the prefs bitfield, which
 * is byte-locked for save compatibility. `names` exposes the active pool so
 * the jukebox list, `next()`, auto-advance and pre-buffering stay inside it;
 * `allTracks` keeps every registered track so switching soundtracks can
 * re-point the pool without losing element state. Browsers block audio
 * before a user gesture, so the engine starts the first track from a
 * one-time pointerdown/keydown listener (Game.prefs.bgMusic is the on/off
 * switch, save-backed in the existing prefs bitfield).
 */

/** Displayed track author line (required by the music license). */
export const MUSIC_AUTHOR = 'Music composed by Bert Cole (bitbybitsound.com)';

/** Track list: [display name, mp3 path]. Order = jukebox order; index 0 is
 * the default first track. */
export const MUSIC_TRACKS: Array<[string, string]> = [
	['Farm Life', 'snd/music/Farm Life.mp3'],
	['Simpler Times', 'snd/music/Simpler Times.mp3'],
	['Origins', 'snd/music/Origins.mp3'],
	['A Little R & R', 'snd/music/A Little R & R.mp3'],
	['Returning Home', 'snd/music/Returning Home.mp3'],
	['Bustling Streets', 'snd/music/Bustling Streets.mp3'],
	['Long Road Ahead', 'snd/music/Long Road Ahead.mp3'],
	['Waiting', 'snd/music/Waiting.mp3'],
];

/** The Towns soundtrack: the seven "Towns" folder tracks from the same
 * 16-Bit Starter Pack (three overlap with the Original OST; the pack's
 * copies are byte-identical sources, so the existing MP3s are reused and
 * the other four are converted from the pack's OGGs). */
export const MUSIC_TOWNS_TRACKS: Array<[string, string]> = [
	['Bustling Streets', 'snd/music/Bustling Streets.mp3'],
	['Farm Life', 'snd/music/Farm Life.mp3'],
	['Ghost Alley', 'snd/music/Ghost Alley.mp3'],
	['Merch City', 'snd/music/Merch City.mp3'],
	['Remnants of What Once Was', 'snd/music/Remnants of What Once Was.mp3'],
	['Returning Home', 'snd/music/Returning Home.mp3'],
	['Smooth As Glass', 'snd/music/Smooth As Glass.mp3'],
];

/** Soundtrack registry: [id, display name, track table]. Order = menu order;
 * index 0 is the default. */
export const MUSIC_SOUNDTRACKS: Array<[string, string, Array<[string, string]>]> = [
	['original', 'Original', MUSIC_TRACKS],
	['towns', 'Towns', MUSIC_TOWNS_TRACKS],
];

/** Soundtrack choice persistence (localStorage; default 'original'). */
export function GetMusicSoundtrackPref(): string {
	const v = localStorageGet('cc3_musicSoundtrack');
	return (v && MUSIC_SOUNDTRACKS.some((s) => s[0] === v)) ? v : MUSIC_SOUNDTRACKS[0][0];
}
export function SetMusicSoundtrackPref(id: string): void {
	localStorageSet('cc3_musicSoundtrack', id);
}

/** Last-picked track persistence, per soundtrack (localStorage keys
 * 'cc3_musicTrack:<soundtrackId>'; '' = none picked yet) so each pool
 * resumes where the player left it when switched back to. */
export function GetMusicTrackPref(): string {
	return localStorageGet('cc3_musicTrack:' + GetMusicSoundtrackPref()) || '';
}
export function SetMusicTrackPref(name: string): void {
	localStorageSet('cc3_musicTrack:' + GetMusicSoundtrackPref(), name);
}

/** Build the Music object the engine publishes (and the jukebox drives). */
export function CreateMusic(): any {
	const tracks: any = {};//every registered track, across all soundtracks
	const names: string[] = [];//the ACTIVE soundtrack's pool (order = play order)
	const srcs: any = {};//track name -> file path (assigned to audio.src on first play)
	let currentName = '';

	/** Assign a track's src if it doesn't have one yet (no-op otherwise).
	 * Checks the src ATTRIBUTE (not the property): an element that never got a
	 * src still reports the document URL from the property (empty-string
	 * resolution), which would block the assignment forever. */
	const ensureSrc = (name: string) => {
		const audio = tracks[name] && tracks[name].audio;
		if (audio && !audio.getAttribute('src')) {
			audio.preload = 'auto';
			audio.src = srcs[name];
		}
	};

	/** (Re)point the active pool at a soundtrack's track table. Elements are
	 * created on first registration and kept for the session (a re-switch
	 * back reuses the same element and its buffered src). */
	const setPool = (trackTable: Array<[string, string]>) => {
		names.length = 0;
		for (const [name, src] of trackTable) {
			if (!tracks[name]) {
				const audio = new Audio();
				audio.preload = 'none';
				audio.loop = true;
				tracks[name] = { name, author: MUSIC_AUTHOR, audio };
				srcs[name] = src;
			}
			names.push(name);
		}
	};

	const me: any = {
		tracks,
		names,
		allTracks: tracks,
		get currentName() {
			return currentName;
		},
		/** The active soundtrack's track table (kept for the menu's dropdown
		 * and for pool switches). */
		soundtracks: MUSIC_SOUNDTRACKS,
		activeSoundtrack: GetMusicSoundtrackPref(),
		setSoundtrack(id: string) {
			const entry = MUSIC_SOUNDTRACKS.find((s) => s[0] === id);
			if (!entry || entry[0] === me.activeSoundtrack) return;
			//pause whatever is playing: it may not exist in the new pool, and a
			//paused currentName makes the engine's restart logic pick the pool's
			//saved track fresh
			me.pause();
			currentName = '';//no longer current: the pool is about to change
			me.activeSoundtrack = entry[0];
			SetMusicSoundtrackPref(entry[0]);//also switches which track pref is read/written
			setPool(entry[2]);
		},
		setVolume(volume: number) {
			for (const name of names) tracks[name].audio.volume = volume;
			//also catch elements registered but not in the active pool (they'd
			//miss the sweep otherwise on the next switch)
			for (const name in tracks) if (names.indexOf(name) === -1) tracks[name].audio.volume = volume;
		},
		setFilter() {
			/* no-op: the Steam "wub" filter has no web equivalent */
		},
		playTrack(name: string) {
			if (!tracks[name] || names.indexOf(name) === -1) return;//must be in the active pool
			if (currentName && tracks[currentName]) tracks[currentName].audio.pause();
			currentName = name;
			SetMusicTrackPref(name);
			const audio = tracks[name].audio;
			ensureSrc(name);//first play: this is the moment the track is fetched
			audio.currentTime = 0;
			try {
				const played = audio.play();
				if (played && played.catch) played.catch(() => {});
			} catch (e) {
				/* autoplay-blocked: the first-gesture listener will start it */
			}
			//pre-buffer the next track so trackAuto advance doesn't stall on a
			//fresh fetch (src only; it stays paused)
			const index = names.indexOf(name);
			if (index !== -1) ensureSrc(names[(index + 1) % names.length]);
		},
		pause() {
			if (currentName && tracks[currentName]) tracks[currentName].audio.pause();
		},
		unpause() {
			if (currentName && tracks[currentName]) {
				ensureSrc(currentName);
				try {
					const played = tracks[currentName].audio.play();
					if (played && played.catch) played.catch(() => {});
				} catch (e) {
					/* ignore autoplay rejections */
				}
			}
		},
		loop(loopOn: boolean) {
			if (currentName && tracks[currentName]) tracks[currentName].audio.loop = !!loopOn;
		},
		cue() {
			/* auto-advance is handled on 'ended' (see init) */
		},
		next() {
			if (!names.length) return;
			const index = names.indexOf(currentName);
			//currentName can fall outside the pool after a soundtrack switch
			//(setSoundtrack clears it, so this is just belt and suspenders)
			me.playTrack(names[(index === -1 ? 0 : (index + 1)) % names.length]);
		},
		/** The saved track pick for the active pool if it's still valid, else
		 * the pool's first track — what "start/resume music" should play. */
		getStartName(): string {
			const saved = GetMusicTrackPref();
			return (saved && names.indexOf(saved) !== -1) ? saved : (names[0] || '');
		},
		init(game: any) {
			const entry = MUSIC_SOUNDTRACKS.find((s) => s[0] === GetMusicSoundtrackPref());
			setPool(entry ? entry[2] : MUSIC_TRACKS);
			for (const name in tracks) {
				tracks[name].audio.volume = (game.volumeMusic || 50) / 100;
				tracks[name].audio.addEventListener('ended', () => {
					if (game.jukebox && game.jukebox.trackAuto) me.next();
				});
			}
		},
	};
	return me;
}
