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
	let currentName = '';

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
			audio.currentTime = 0;
			try {
				const played = audio.play();
				if (played && played.catch) played.catch(() => {});
			} catch (e) {
				/* autoplay-blocked: the first-gesture listener will start it */
			}
		},
		pause() {
			if (currentName && tracks[currentName]) tracks[currentName].audio.pause();
		},
		unpause() {
			if (currentName && tracks[currentName]) {
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
				const audio = new Audio(src);
				audio.preload = 'auto';
				audio.loop = true;
				audio.volume = (game.volumeMusic || 50) / 100;
				audio.addEventListener('ended', () => {
					if (game.jukebox && game.jukebox.trackAuto) me.next();
				});
				tracks[name] = { name, author: MUSIC_AUTHOR, audio };
				names.push(name);
			}
		},
	};
	return me;
}
