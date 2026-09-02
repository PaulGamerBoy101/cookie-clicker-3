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
 * Browsers block audio before a user gesture, so the engine starts the first
 * track from a one-time pointerdown/keydown listener (Game.prefs.bgMusic is
 * the on/off switch, save-backed in the existing prefs bitfield).
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

/** Build the Music object the engine publishes (and the jukebox drives). */
export function CreateMusic(): any {
	const tracks: any = {};
	const names: string[] = [];
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

	const me: any = {
		tracks,
		names,
		get currentName() {
			return currentName;
		},
		setVolume(volume: number) {
			for (const name of names) tracks[name].audio.volume = volume;
		},
		setFilter() {
			/* no-op: the Steam "wub" filter has no web equivalent */
		},
		playTrack(name: string) {
			if (!tracks[name]) return;
			if (currentName && tracks[currentName]) tracks[currentName].audio.pause();
			currentName = name;
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
			me.playTrack(names[(index + 1) % names.length]);
		},
		init(game: any) {
			for (const [name, src] of MUSIC_TRACKS) {
				//no src argument: the element starts attribute-less and the browser
				//fetches nothing (a '' src would resolve to the document URL and
				//fire a bogus load)
				const audio = new Audio();
				audio.preload = 'none';
				audio.loop = true;
				audio.volume = (game.volumeMusic || 50) / 100;
				audio.addEventListener('ended', () => {
					if (game.jukebox && game.jukebox.trackAuto) me.next();
				});
				tracks[name] = { name, author: MUSIC_AUTHOR, audio };
				srcs[name] = src;
				names.push(name);
			}
		},
	};
	return me;
}
