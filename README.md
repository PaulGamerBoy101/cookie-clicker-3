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
| Motion polish | UI rendered at the 30Hz loop rate; hard column/tab switches | The CC3 polish pass (v3.0): display-refresh-rate smooth cookie counter, one-column column slide-in, notification slide-in, ascend-intro flash + shake. Transform/opacity only; respects the in-game "Fancy graphics" toggle and `prefers-reduced-motion` (see "CC3 polish" in `src/styles/main.css` + `src/main.js`, verified by `?qa=anim`) |
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

Every build also stamps the service worker's cache name with a content hash of
`dist/` (the `cc3:stamp-service-worker` plugin in `vite.config.js` rewrites the
`__BUILD__` placeholder in `public/sw.js`). That is what makes a deploy
self-updating for returning players: when any file changes, the stamped
`sw.js` differs byte-for-byte, the browser installs the new worker on the next
visit, and its `activate()` deletes the previous build's cache. With a static
cache name the browser would never see a changed worker and the cache-first
`index.html` would pin the old build on installed clients forever. An
identical rebuild produces an identical stamp, so nothing churns needlessly.

## Testing

The in-page `?debug=1&qa=…` probes (see below) are also the regression suite:
`tests/qa.spec.js` drives each probe in headless Chromium (Playwright) against
a fresh production build and asserts its PASS report.

```
npx playwright install chromium   # once, per machine
npm test                          # builds dist/ itself, serves it, runs all 12 probes
```

Each test gets a fresh browser profile (the first load picks English, as a new
player would). The `offline` and `a11y` probes reload the page themselves to
exercise the persist-then-reboot path; the suite runs serially in one worker
because the probes are stateful. CI runs the same suite on every push and PR
and gates the GitHub Pages deploy on it (`.github/workflows/ci.yml`).

## Security

The game ships a `Content-Security-Policy` (a `<meta>` tag in `index.html`). The port is fully self-contained — every script, style, image, font and sound is same-origin, with no CDN, ads or trackers — and the policy enforces that at the browser level (`default-src 'self'`) while locking down the obvious vectors (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`).

Two directives are intentionally permissive, and it's worth being explicit about the trade-off:

- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — the ported 2.048 engine builds its many click handlers as inline `onclick`/`ontouchend` attributes (`Game.clickStr`), and the i18n plural-form compiler uses `new Function()` on the bundled, trusted language files. Both are core to the engine and can't be nonced/hashed (they're generated at runtime).
- `style-src 'self' 'unsafe-inline'` — the engine sets inline `style` attributes extensively.

These weaken the CSP's XSS protection. That is an accepted, documented trade-off: this is a local offline PWA with no untrusted input and no user-generated HTML, so the residual XSS surface is minimal, and refactoring the legacy engine off inline handlers and `eval` is out of scope for a faithful port. If the engine is ever modernized in that direction, drop the two `'unsafe-*'` keywords.

## Debugging flags (production)

- `?debug=1` — paints uncaught errors / unhandled rejections onto the page.
- `?nosw` — skip service-worker registration.
- `?oneCol=1` / `?oneCol=0` — force the one-column responsive mode on or off.
  Auto by default: it switches when `min(innerWidth, screen.width)` ≤ 640px
  (the phone case), collapses the three columns to one full-width column at a
  time with a bottom tab bar, drops the min layout width 800→400, and swaps the
  viewport meta to `width=device-width, initial-scale=1, viewport-fit=cover`
  (full-screen PWA builds keep the iOS safe areas clear; see
  "One-column responsive mode" in `src/styles/main.css`).
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
  `?qa=offline` grants "Perfect idling" (100% offline CpS, no cap), seeds a
  known CpS, persists a save whose `lastDate` is one hour in the past, and
  reloads; on the reloaded page it checks the engine computed and granted the
  offline gain on load (cookies rise by ~ `timeOffline × CpS`, with the
  "Welcome back!" notification). `?qa=special` unlocks the seasonal specials
  (the "A festive hat" + "A crumbly egg" upgrades), drives `Game.UpdateSpecial()`
  to add the Santa/Dragon tabs, then exercises `Game.UpgradeSanta()` (bumps
  santaLevel, drops a present) and `Game.UpgradeDragon()` (chips the egg).
  `?qa=a11y` exercises the accessibility (screen reader) mode: it enables
  `Game.prefs.screenreader`, persists it, and reloads; on the reloaded page the
  store products / buildings render as `<button aria-labelledby=...>` (with
  srOnly labels) instead of plain `<div>`s. `?qa=wrinkler` drives the
Grandmapocalypse wrinklers: it enables `Game.elderWrath`, spawns a fully visible
(phase 2) wrinkler, checks it sets `Game.cpsSucked` (5% of CpS, lowering the
displayed CpS + draining cookies), then pops it and verifies `Game.wrinklersPopped`
increments, the swallowed cookies are refunded (+10%), and the debuff clears.
`?qa=perf&qlvl=N` seeds all four
  minigame buildings at level `N` (default 1), opens the Garden, and reports the
  actual game-loop rate (`Game.T` ticks/sec) versus the 30-tick `Game.fps`
  target — used to confirm the 4-minigame frame cost (measured 29.9 at level 1
  and 30.3 at level 15, i.e. the loop holds its target). `?qa=onecol`
  verifies the one-column responsive mode (the "todo!" Orteil left in the
  2.048 CSS that CC3 completes): the `body.oneColumn`/`data-col` state, the
  `Game.minLayoutW` 800→400 swap, the viewport-meta swap, the bottom tab bar
  (three tabs, column switching, the active column full-width and stopping
  above the bar, `aria-pressed` tracking), and that the cookie click path
  works in the one-column layout — force the mode with `?oneCol=1` or open a
  viewport ≤ 640px wide. `?qa=anim` verifies the CC3 polish (the v3.0
  animation pass, a presentation layer on the untouched engine): the boot
  fade, the display-rate smooth cookie counter (it seeds a 5e6 jump and
  checks the `#cookies` display counts up and converges to the real value,
  and that the rAF hook re-anchors on every engine tick), the one-column
  column slide-in (`cc3ColIn`), the notification slide-in (`cc3NoteIn`,
  including no entrance replay when `UpdateNotes()` rebuilds `#notes`), and
  the ascend-intro breakpoint flash + `#game` shake (it drives the real
  `Game.Ascend(1)` flow, forces the intro to its end, then
  `Game.Reincarnate(1)`); it ends by flipping "Fancy graphics" off and
  checking the whole pass disables itself (`body.noMotion`, hook stopped,
  CSS gates quiet). A reduced-motion variant (Playwright
  `reducedMotion: 'reduce'`) asserts the same opt-out at the OS level. Run
  it with `&oneCol=1`. Never active in a plain load.

## Credits

- Game code and graphics: **Orteil**, 2013–2022 (original Cookie Clicker). This is a non-commercial port for personal/educational use; please support the official game and its merchandise.
- 2.048 downloadable source: [DiSCooooo / Sushi8756](https://github.com/DiSCooooo/Cookie-Clicker-2.048).
- Merriweather font: [Google Fonts / Sorkin Type](https://www.google.com/fonts), SIL Open Font License.

See [CREDITS.md](CREDITS.md) for the full notice.
