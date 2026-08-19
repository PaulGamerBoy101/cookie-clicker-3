# Cookie Clicker 3

A modern, from-scratch rebuild of the tooling around [Cookie Clicker 2.048](https://github.com/DiSCooooo/Cookie-Clicker-2.048) (itself a port of Orteil's [Cookie Clicker](http://orteil.dashnet.org/cookieclicker/)). The game code is the original 2.048 engine, ported into ES modules and served by a zero-runtime-dependency Vite pipeline — no jQuery, no IE polyfills, no CDN requests, no ads, no trackers.

## What "modernized" means here

| Area | 2.048 (2022) | Cookie Clicker 3 |
| --- | --- | --- |
| Module system | One 890 KB classic `<script>` + runtime `<script>` injection for minigames and languages | ES modules throughout; minigames and languages are code-split Vite chunks loaded with dynamic `import()` |
| Build | None (static files) | Vite 5: dev server with HMR, production bundle with per-chunk code splitting and minification |
| Save encoding | 2007-era WebToolkit Base64 (pure JS, UTF-8 double-encoding) | Native `btoa`/`atob` + `TextEncoder`/`TextDecoder`, byte-compatible with 2.048 saves |
| Line endings / encoding | CRLF, BOMs | LF, no BOMs (normalized at port time) |
| Fonts | Google Fonts CDN request at load | Self-hosted Merriweather Black woff2 (latin, latin-ext, cyrillic, cyrillic-ext) bundled by Vite |
| Boot hook | `window.onload = …` + inline `onclick`/`onmouseout` handlers | `addEventListener('load', …)` + listeners attached in the entry module |
| Legacy DOM bugs | Relied on sloppy-mode behavior (implicit globals, mutating the read-only `DOMRect` returned by `getBoundingClientRect()`) | Fixed for strict mode: implicit globals are declared and republished, `getBounds()` builds a fresh plain object |
| Offline / PWA | — | Web app manifest + service worker (cache-first, best-effort caching) so the game boots offline |
| Ads / tracking / IE shims | AdSense, Facebook pixel, cookieconsent CDN, excanvas, IE conditional comments | Removed |

The engine itself was **not** rewritten line-by-line: it is the authentic 2.048 code, transformed mechanically (see below) so it runs as strict-mode ES modules. Behavior, numbers, puns and all are the original.

## Project layout

```
index.html              app shell (all ids the engine expects)
src/
  main.js               entry: module wiring, language + minigame dynamic imports, PWA
  config.js             VERSION / BETA / App, published before the engine evaluates
  styles/main.css       ported + modernized stylesheet (self-hosted @font-face)
  assets/fonts/         Merriweather Black woff2 subsets (bundled by Vite)
  engine/
    base64.js           native Base64 save encoding
    main.js             the 2.048 engine as an ES module (+ globals shim)
    minigameGarden.js   minigame modules (dynamic import, code-split)
    minigameGrimoire.js
    minigameMarket.js
    minigamePantheon.js
    loc/                language modules (EN, FR, DE, NL, CS, PL, IT, ES,
                        PT-BR, JA, ZH-CN, KO, RU) — one chunk per language
public/
  img/ snd/             game assets (referenced by string path at runtime)
  manifest.webmanifest  PWA manifest
  sw.js                 service worker
  legacy/               2.048 files that were dropped (dungeons WIP, excanvas, ajax, showads)
scripts/
  transform-engine.mjs    the one-shot port: classic script -> ES module
  scan-implicit-globals.mjs  dev utility: flags bare assignments to undeclared
                             identifiers (the strict-mode bug class the port must
                             fix) — `node scripts/scan-implicit-globals.mjs <file>`
```

## The port

`scripts/transform-engine.mjs` (Node + acorn + acorn-walk) performs the 2.048 → ES-module transform. Re-run it only if the upstream engine source changes:

```
npm run port     # = node scripts/transform-engine.mjs
```

What it does:

1. **AST analysis** — parses each legacy file, collects top-level bindings (for the `window` shim) and *all* identifiers that are assigned-but-undeclared anywhere in the file (the original relied on implicit globals; strict-mode ESM throws on those).
2. **Strict-mode preamble** — inserts `var …;` declarations for the implicit globals.
3. **Modern boot** — `window.onload` → `addEventListener('load', …)`.
4. **Modern loading** — the runtime `<script src=…>` injection used for language files and minigame scripts is replaced by `window.loadLangModule` / `window.loadMinigameModule`, backed by static Vite dynamic imports (so they code-split in the production build).
5. **`getBounds()` fix** — modern `getBoundingClientRect()` returns an immutable `DOMRect`; the original mutated it in place (a silent no-op in sloppy mode). It now computes a fresh plain object, which also makes `Game.scale` actually work.
6. **Globals shim** — appends `Object.assign(window, { …all engine top-level bindings… })` so the minigame modules and the legacy mod API (`Game.LoadMod`) keep resolving their free variables against `window`.
7. **Language files** — each `loc/*.js` (`AddLanguage('XX', …, {…})`) is rewritten to `export default { id, name, strings }`.
8. **Strict-mode bug fixes** — the original is a sloppy-mode classic script, so it contains bare assignments to undeclared identifiers (implicit globals) that throw `ReferenceError` in strict-mode ESM. The transform fixes the known ones (`mysterious` in `crateTooltip`, `arr2` in `grabProps`, `name` in `CalculateGains`, `buff` in the Sugar-frenzy handler, `icon` in the Market `goodTooltip`); `scripts/scan-implicit-globals.mjs` is a scope-aware checker used to find them — the whole tree currently reports zero.

## Developing

```
npm install
npm run dev        # http://localhost:5173
```

## Building

```
npm run build      # outputs dist/
npm run preview    # serve dist/ at http://localhost:4173
```

The build is relocatable (`base: './'`), so `dist/` can be dropped onto any static host, including a GitHub Pages subpath.

## Security

The game ships a `Content-Security-Policy` (a `<meta>` tag in `index.html`). The port is fully self-contained — every script, style, image, font and sound is same-origin, with no CDN, ads or trackers — and the policy enforces that at the browser level (`default-src 'self'`) while locking down the obvious vectors (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`).

Two directives are intentionally permissive, and it's worth being explicit about the trade-off:

- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — the ported 2.048 engine builds its many click handlers as inline `onclick`/`ontouchend` attributes (`Game.clickStr`), and the i18n plural-form compiler uses `new Function()` on the bundled, trusted language files. Both are core to the engine and can't be nonced/hashed (they're generated at runtime).
- `style-src 'self' 'unsafe-inline'` — the engine sets inline `style` attributes extensively.

These weaken the CSP's XSS protection. That is an accepted, documented trade-off: this is a local offline PWA with no untrusted input and no user-generated HTML, so the residual XSS surface is minimal, and refactoring the legacy engine off inline handlers and `eval` is out of scope for a faithful port. If the engine is ever modernized in that direction, drop the two `'unsafe-*'` keywords.

## Debugging flags (production)

- `?debug=1` — paints uncaught errors / unhandled rejections onto the page.
- `?nosw` — skip service-worker registration.
- `?qa` (with `?debug=1`) — QA seed: gives a level-1 Farm/Bank/Temple/Wizard
  tower so the engine dynamically imports every minigame, then opens the
  Garden. `?qa=cookies` seeds cookies only (no minigames) for light
  store-buy testing. `?qa=golden` spawns and pops a forced "frenzy" golden
  cookie and reports the resulting buff/CpS (verifies the golden-cookie click
  path). `?qa=save` exports a save, corrupts the live state, re-imports it, and
  verifies the round-trip restores the state. `?qa=ascend` drives the full
  ascension (Legacy/prestige) flow — `Game.Ascend(1)` intro (grants heavenly
  chips + prestige) then `Game.Reincarnate(1)` (the reset) — and verifies the
  run is reset while the prestige state (chips, prestige, resets) is kept.
  `?qa=perf&qlvl=N` seeds all four
  minigame buildings at level `N` (default 1), opens the Garden, and reports the
  actual game-loop rate (`Game.T` ticks/sec) versus the 30-tick `Game.fps`
  target — used to confirm the 4-minigame frame cost (measured 29.9 at level 1
  and 30.3 at level 15, i.e. the loop holds its target). Never active in a
  plain load.

## Credits

- Game code and graphics: **Orteil**, 2013–2022 (original Cookie Clicker). This is a non-commercial port for personal/educational use; please support the official game and its merchandise.
- 2.048 downloadable source: [DiSCooooo / Sushi8756](https://github.com/DiSCooooo/Cookie-Clicker-2.048).
- Merriweather font: [Google Fonts / Sorkin Type](https://www.google.com/fonts), SIL Open Font License.

See [CREDITS.md](CREDITS.md) for the full notice.
