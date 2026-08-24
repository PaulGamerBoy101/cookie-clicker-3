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

## Community mods (native ports in `src/extras/`)

The original community mods are by **klattmose**
(<https://klattmose.github.io/CookieClicker/>), who also wrote the CCSE
("Cookie Clicker Script Extender") framework they were built on. The original
repository carries no license file, so CC3 does not copy that code: each mod
is a faithful, self-contained **re-implementation** on the engine's own
vanilla content constructors and mod API (no CCSE dependency). Where a mod's
art or sound is specific to the mod itself (not reusable vanilla assets), the
original files are vendored into `public/` as-is and credited to klattmose
here and in the port's file header. The original author is credited in the
changelog and in each port's file header.

- **Black Hole Inverter** (`extras/blackHoleInverter.ts`)
- **Decide Your Destiny** (`extras/decideDestiny.ts`)
- **American Season** (`extras/americanSeason.ts`) — icons, rocket sprite and
  launch/boom sounds are klattmose's originals, vendored in
  `public/img/customIcons.png`, `public/img/rocket.png`,
  `public/snd/rocketLaunch.mp3`, `public/snd/rocketBoom.mp3`.

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
