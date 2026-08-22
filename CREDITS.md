# Credits & license notice

## Original game

The game code and all graphics in this project are from **Cookie Clicker**,
created by **Orteil** (DashNet) and first published in 2013.

> Code and graphics copyright Orteil, 2013-2022.
> Feel free to alter this code to your liking, but please do not re-host it,
> do not profit from it and do not present it as your own.

Accordingly, this project:

- is a personal, non-commercial port intended for private use and
  study; it is not a substitute for the official game at
  <http://orteil.dashnet.org/cookieclicker/>;
- does not replace, impersonate or re-host the official site;
- keeps the original author credit visible in the top bar.

The 2.048 source this port was built from:
<https://github.com/DiSCooooo/Cookie-Clicker-2.048> (a fan-maintained
downloadable edition of the 2.048 release).

## Fonts

- **Merriweather** (Black, 900) by Sorkin Type, via Google Fonts.
  Licensed under the SIL Open Font License, Version 1.1.
  Self-hosted woff2 subsets in `src/assets/fonts/`.

## Music & sound effects

- **Background music** — the 8 tracks in `public/snd/music/` (Farm Life,
  Simpler Times, Origins, A Little R & R, Returning Home, Bustling Streets,
  Long Road Ahead, Waiting) are from the free 16-Bit Starter Pack.
  Music composed by **Bert Cole** — <https://bitbybitsound.com>.
  Used under the pack's non-exclusive license; not to be re-sold or used in
  derivative works.
- **Interface tones** — `snd/confirm1.mp3`, `snd/back1.mp3`, `snd/error1.mp3`
  are from the interface-sfx-pack-1 by **obsydianx**
  (<https://obsydianx.itch.io/interface-sfx-pack-1>), licensed CC0.

## Tooling

- [Vite](https://vite.dev) (MIT) — build pipeline (dev dependency only).
- [acorn](https://github.com/acornjs/acorn) + [acorn-walk](https://github.com/acornjs/acorn/tree/main/acorn-walk) (MIT) — used at port time by the (now-retired) `scripts/transform-engine.mjs`; the one-shot 2.048 → ES-module conversion it powered is checked in, so the packages are no longer dev dependencies.

Cookie Clicker 3 itself ships **zero runtime dependencies**: the browser gets
plain ES modules, CSS, fonts and static assets.

## Intentionally excluded from the 2.048 source

- `excanvas.compiled.js` — IE8 canvas polyfill; modern browsers have canvas.
- `showads.js`, all AdSense/Facebook-pixel code — ads and trackers.
- `dungeons.js`, `DungeonGen.js` — the unreleased dungeon system (never wired
  into the game in 2.048); kept in `public/legacy/` for reference.
- `ajax.js` — superseded by ES module dynamic imports.
- The "load mod from pasted URL" input box — loading arbitrary scripts from a
  pasted URL is not something a shipped build should offer. (The documented
  `Game.LoadMod(url)` API still exists in the engine for the modding community.)
