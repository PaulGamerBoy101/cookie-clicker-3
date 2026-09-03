# Cookie Clicker 3

Cookie Clicker 3 is a modern Cookie Clicker experience based on [Cookie Clicker 2.048](https://github.com/DiSCooooo/Cookie-Clicker-2.048) (itself a port of Orteil's [Cookie Clicker](http://orteil.dashnet.org/cookieclicker/)). It is an unofficial fan port — not affiliated with or endorsed by Orteil. The project preserves the original game's behavior in a strictly typed TypeScript ES-module web app, built with a zero-runtime-dependency Vite pipeline — no jQuery, no IE polyfills, no CDN requests, no ads, no trackers. See [docs/ROADMAP.md](docs/ROADMAP.md) for where the project is headed.

## [PLAY ME HERE](https://giveen.github.io/cookie-clicker-3/)

## What "modernized" means here

| Area | 2.048 (2022) | Cookie Clicker 3 |
| --- | --- | --- |
| Module system | One 890 KB classic `<script>` + runtime `<script>` injection for minigames and languages | ES modules throughout; minigames and languages are code-split Vite chunks loaded with dynamic `import()` |
| Language | ES5-ish sloppy-mode classic script (JS) | TypeScript: full `strict` type-checking on all code — Phases 1–5 typed the content layer, core classes, systems, and minigames; Phase 6 Slice 1 typed `engine/main.ts` (the entire codebase now compiles clean under `tsc`) |
| Build | None (static files) | Vite 6: dev server with HMR, production bundle with per-chunk code splitting and minification |
| Save encoding | 2007-era WebToolkit Base64 (pure JS, UTF-8 double-encoding) | Native `btoa`/`atob` + `TextEncoder`/`TextDecoder`, byte-compatible with 2.048 saves |
| Line endings / encoding | CRLF, BOMs | LF, no BOMs (normalized at port time) |
| Fonts | Google Fonts CDN request at load | Self-hosted Merriweather Black woff2 (latin, latin-ext, cyrillic, cyrillic-ext) bundled by Vite |
| Boot hook | `window.onload = …` + inline `onclick`/`onmouseout` handlers | `addEventListener('load', …)` + listeners attached in the entry module |
| Legacy DOM bugs | Relied on sloppy-mode behavior (implicit globals, mutating the read-only `DOMRect` returned by `getBoundingClientRect()`) | Fixed for strict mode: implicit globals are declared and republished, `getBounds()` builds a fresh plain object |
| Offline / PWA | — | Web app manifest + service worker (cache-first, best-effort caching) so the game boots offline |
| Motion polish | UI rendered at the 30Hz loop rate; hard column/tab switches | The CC3 polish pass (v3.0): display-refresh-rate smooth cookie counter, one-column column slide-in, notification slide-in, ascend-intro flash + shake. Transform/opacity only; respects the in-game "Fancy graphics" toggle and `prefers-reduced-motion` (see "CC3 polish" in `src/styles/main.css` + `src/main.ts`, verified by `?qa=anim`) |
| Ads / tracking / IE shims | AdSense, Facebook pixel, cookieconsent CDN, excanvas, IE conditional comments | Removed |

The engine started as the authentic 2.048 code, transformed mechanically so it runs as strict-mode ES modules, and was then rewritten incrementally (Phases 1–6) into typed modules: content data lives in `src/engine/content/`, core classes in `src/engine/core/`, systems in `src/engine/systems/`, UI in `src/engine/ui/`, and pure helpers in `src/engine/utils/` — with `engine/main.ts` remaining as a thin, fully typed orchestrator. The hard constraint throughout was **runtime behavior identical to `master`** at every step: every extraction was verified verbatim against the committed original, and the save format is byte-compatible (verified by `tests/save-compat.spec.js` — a `master` save imports on `rewrite` and re-exports identically). Behavior, numbers, puns and all are the original.

## Project layout

```
index.html              app shell (all ids the engine expects)
tsconfig.json           TypeScript config (strict; tsc --noEmit is the type gate)
docs/                   design docs (roadmap, feature designs)
src/
  main.ts               entry: module wiring, language + minigame dynamic imports, PWA
  config.ts             VERSION / BETA / App, published before the engine evaluates
  globals.d.ts          the engine's `window` surface (boundary for the glue code)
  styles/main.css       ported + modernized stylesheet (self-hosted @font-face)
  assets/fonts/         Merriweather Black woff2 subsets (bundled by Vite)
  engine/
    base64.ts           native Base64 save encoding
    main.ts             the 2.048 engine as a fully typed ES module (+ globals shim; Phase 6)
    core/               typed classes: Game, Building, Upgrade, Achievement
    content/            typed content: tiers, buildings, upgrades, achievements, foolObjects,
                        milks, changelog, heavenlyPositions (Phase 6 slice 5)
    systems/            typed systems: economy, save, backup, shimmer, wrinkler, ascend, buffs,
                        ticker, santa, dragon, shimmerTypes, specialMenu, bakeryName,
                        seasons, modding, reset
    utils/              pure helpers: helpers, formatting, encoding, DOM, time, LoadScript,
                        debug (Phase 6)
    ui/                 UI systems: particles, notifications, tooltip, crate, store, menu,
                        drawBackground (Phase 6 slice 4)
    minigameGarden.ts   minigame modules (dynamic import, code-split; typed — Phase 5)
    minigameGrimoire.ts
    minigameMarket.ts
    minigamePantheon.ts
    loc/                language modules (EN, FR, DE, NL, CS, PL, IT, ES,
                        PT-BR, JA, ZH-CN, KO, RU) — one chunk per language
public/
  img/ snd/             game assets (referenced by string path at runtime)
  manifest.webmanifest  PWA manifest
  sw.js                 service worker
  legacy/               2.048 files that were dropped (dungeons WIP, excanvas, ajax, showads)
```

The one-shot port scripts (`scripts/transform-engine.mjs`, `scripts/scan-
implicit-globals.mjs`) that produced the initial ES-module conversion were
**retired in Phase 6**: the engine is now fully typed, so re-running the
port would clobber the typed modules, and `tsc` strict covers the
undeclared-identifier bug class the scanner used to hunt.

## History: the port, then the rewrite

The game was first converted from 2.048 classic script to strict-mode ES modules by a one-shot Node + acorn transform (retired in Phase 6). That port is what established the architecture the rewrite preserved:

1. **Modern boot** — `window.onload` → `addEventListener('load', …)`.
2. **Modern loading** — the runtime `<script src=…>` injection used for language files and minigame scripts became `window.loadLangModule` / `window.loadMinigameModule`, backed by static Vite dynamic imports (so they code-split in the production build).
3. **`getBounds()` fix** — modern `getBoundingClientRect()` returns an immutable `DOMRect`; the original mutated it in place (a silent no-op in sloppy mode). It computes a fresh plain object instead, which also makes `Game.scale` actually work.
4. **Globals shim** — `Object.assign(window, { …engine top-level bindings… })` so the minigame modules and the legacy mod API (`Game.LoadMod`) keep resolving their free variables against `window`.
5. **Language files** — each `loc/*.js` became an `export default { id, name, strings }` module (typed by inference).
6. **Strict-mode fixes** — implicit-global assignments that throw `ReferenceError` in strict-mode ESM were declared or republished.

The ported engine and minigames initially shipped under `// @ts-nocheck`; the Phases 1–6 rewrite replaced that wholesale: every content block, core class, system, minigame, and UI module is now hand-typed TypeScript, and `engine/main.ts` is a thin typed orchestrator with **zero `@ts-nocheck` anywhere in `src/`**. Runtime behavior stays identical to `master` (see the save-compat check above).

## Developing

```
npm install
npm run dev        # http://localhost:5173
```

## Building

```
npm run typecheck  # tsc --noEmit: strict type-check, no emit
npm run build      # typecheck, then outputs dist/
npm run preview    # serve dist/ at http://localhost:4173
```

The build is relocatable (`base: './'`), so `dist/` can be dropped onto any static host, including a GitHub Pages subpath. `tsc --noEmit` is the type gate (Vite/esbuild only strips types and does not type-check); the type config lives in `tsconfig.json` (full `strict`, TS 7). The entire codebase type-checks — engine, core classes, content, systems, minigames, localization, extras, and glue — with the engine's `window` boundary declared in `src/globals.d.ts`.

Every build also stamps the service worker's cache name with a content hash of
`dist/` (the `cc3:stamp-service-worker` plugin in `vite.config.ts` rewrites the
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
npm test                          # builds dist/ itself, serves it, runs the 21 QA probes (tests/qa.spec.js)
```

Each test gets a fresh browser profile (the first load picks English, as a new
player would). The `offline` and `a11y` probes reload the page themselves to
exercise the persist-then-reboot path; the suite runs serially in one worker
because the probes are stateful. CI runs the same suite on every push and PR
and gates the GitHub Pages deploy on it (`.github/workflows/ci.yml`).

**Deploy is `master`-gated.** The workflow's deploy job runs only on pushes to
`master` (never on PRs, and PR branches never publish), so the `rewrite`
branch's work goes live only when it is merged into `master` — a separate,
explicit step that also runs the full QA gate on the merge commit.

`npm test` (and CI) is scoped to `tests/qa.spec.js` on purpose. Two further
specs live in `tests/` as **explicit extras**, run on demand and never part of
the gate:

- `tests/save-compat.spec.js` — the cross-branch save-format check: imports a
  `master`-built save on `rewrite` and diffs the re-export. Needs a `master`
  build served on :4174 in addition to the :4173 preview.
- `tests/playthrough.spec.js` — an end-to-end playthrough smoke test that
  drives the real UI (big-cookie clicks, store purchases, a golden-cookie
  pop, the menu tabs, a preference toggle, a bakery rename, the news ticker)
  and verifies persistence across a full page reload. Runs against the
  default :4173 preview (`npx playwright test tests/playthrough.spec.js`).

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
  store-buy testing. `?qa=cpslatency` audits the purchase→CpS latency: it
  performs a real building and a real upgrade purchase through the engine buy
  path and measures how long `Game.cookiesPs` (engine state) and the rendered
  `#cookiesPerSecond` counter take to reflect each — both must land within
  1–2 frames of the 30 Hz logic loop. `?qa=golden` spawns and pops a forced "frenzy" golden
  cookie and reports the resulting buff/CpS (verifies the golden-cookie click
  path).  `?qa=save` exports a save, corrupts the live state, re-imports it, and
  verifies the round-trip restores the state. `?qa=backup` verifies the
  rolling save backups (`src/engine/systems/backup.ts`): every successful
  save is captured into a per-game localStorage history (deduplicated,
  pruned to the newest 10), and restoring an older backup returns the live
  state to it. The Options menu's "Backups" section lists them for restore
  or download as a timestamped `.txt` save file (same format as "Save to
  file", so it imports anywhere). `?qa=sound` verifies the sound engine:
  the soundjay-guard `Audio` wrapper must capture the real browser
  constructor (a module-scope `var Audio` shadowing the global used to
  make every sound a dead plain object), and a sample must load through
  the `PlaySound` cache to `readyState>=2`. It also verifies the CC3 web
  music (8 tracks in `public/snd/music/`, composed by Bert Cole — the
  browser build of 2.048 had no music at all), the jukebox track list,
  and the live `ON`/`OFF` bridge the Settings pref buttons depend on
  (they used to render "Fancy graphicsundefined"). `?qa=ascend` drives the full
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
  srOnly labels) instead of plain `<div>`s. `?qa=content` validates building,
  upgrade, tier, registry, and store-order relationships, then prints a typed
  economy snapshot for Grandma, Cats, and Farm. The same helpers are available
  to development tooling as `Game.ValidateContent()` and
  `Game.GetEconomyReport()`. For a complete read-only audit, use
  `Game.AnalyzeEconomy({ levels: [1, 10, 25, 50, 100, 250, 500] })`; it reports
  every building, every upgrade's contextual CpS/click contribution and
  payback, plus fresh-run milestone scenarios and total investment. Upgrade
  reports are categorized as passive, click, mixed, prestige, seasonal, toggle,
  tech, debug, or utility; click upgrades include payback at 1, 5, and 10
  clicks/sec, and unusually long ordinary paybacks are flagged in `warnings`.
  Custom scenarios can provide `{ label, buildings, upgrades }`. The analyzer
  snapshots and restores the live building, upgrade, cookie, and calculated
  economy state.  `Game.SimulateStrategy({ strategy: 'bestPayback',
  durationSeconds: 3600, clicksPerSecond: 5 })` runs a deterministic sandboxed
  progression using `cheapest`, `bestPayback`, or `upgradesFirst` purchasing.
  `Game.AnalyzeEconomy()` also includes `buildingBalance`, which evaluates
  every building at each requested ownership level, reports total investment,
  next-purchase cost, marginal CpS, and payback, and compares each payback with
  the neighboring-building curve to flag local relative outliers. `?qa=content` exercises
  the all-building balance audit, all-building/all-upgrade, and strategy coverage.
  The audit drives the CC3 tail rebalance: 2.048 stacked an extra ×10 per
  building from Fractal engine on (10×–1000× off the fitted curve); CC3 walks
  the fitted ~2.1×-per-store-step curve from Antimatter condenser through
  Cortex baker (Prism +15%, Chancemaker +42%, Fractal engine +78%, Javascript
  console −88%, Idleverse −99%, Cortex baker −99.9%), and prices the Black
  hole inverter mod building on the same curve. CpS, tiered upgrade ratios,
  and all gameplay formulas are unchanged.
  `?qa=wrinkler` drives the
Grandmapocalypse wrinklers: it enables `Game.elderWrath`, spawns a fully visible
(phase 2) wrinkler, checks it sets `Game.cpsSucked` (5% of CpS, lowering the
displayed CpS + draining cookies), then pops it and verifies `Game.wrinklersPopped`
increments, the swallowed cookies are refunded (+10%), and the debuff clears.
   `?qa=dailycrumb` verifies the Daily crumb (CC3-native weekly calendar of
   daily returning rewards, `src/extras/dailyCrumb.ts`): a fresh install
   records the baseline day without a reward, a single missed day claims that
   day's weekday reward (cookies scale with CpS, or a buff / sugar lump /
   golden cookie depending on the weekday), the same day never double-claims,
   a multi-day absence backfills each missed day and keeps the streak
   continuous, an absence over 14 days resets the streak (today only), and the
   streak/claims state round-trips through the save's Custom mod section
   (WriteSave → corrupt → ImportSaveCode).
   `?qa=cracking` verifies the Cracking cookie (CC3-native Cursor incentive,
   `src/extras/crackingCookie.ts`): with at least 10 Cursors the big cookie
   slowly cracks — speed scales with Cursor count and is wall-clock driven so
   it advances while the tab is throttled or the game is closed (capped
   catch-up) — and clicking the fully-cracked cookie pays out a CpS-scaled
   cookie burst plus a Click frenzy, resets the crack, and round-trips the
   progress/trigger count through the save's Custom mod section. The crack
   cycle is floored (derived from the frenzy length + a hard downtime) so the
   ×777 Click frenzy can never be permanently active at any cursor count. It
   also asserts click-particle layering: the crumble overlay re-draws the
   engine's front particle layer above itself, culled to the area the overlay
   can cover.
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

## Legal

Cookie Clicker 3 is an **unofficial, non-commercial fan port**. The original
game's code and all graphics are copyright **Orteil, 2013–2022** and are
included under his in-source permission ("feel free to alter this code to
your liking, but please do not re-host it, do not profit from it and do not
present it as your own"). This project is not affiliated with or endorsed by
Orteil, is not for sale, carries no ads or other monetization, and is not a
substitute for the official game at
<http://orteil.dashnet.org/cookieclicker/>. See [LICENSE](LICENSE) for the
license on the CC3-original code and [CREDITS.md](CREDITS.md) for the full
notice. If any rights holder objects to this project, contact me and the
objected-to material will be removed or the project taken down.

## Credits

- Game code and graphics: **Orteil**, 2013–2022 (original Cookie Clicker). This is a non-commercial port for personal/educational use; please support the official game and its merchandise.
- 2.048 downloadable source: [DiSCooooo / Sushi8756](https://github.com/DiSCooooo/Cookie-Clicker-2.048).
- Merriweather font: [Google Fonts / Sorkin Type](https://www.google.com/fonts), SIL Open Font License.

See [CREDITS.md](CREDITS.md) for the full notice.
