# Cookie Clicker 3 — Roadmap

Open ideas for where to take the game. Nothing here is a commitment — items get
picked up, traded, or dropped as we go. Checked items are shipped.

## Recently shipped (context)

- **Challenge modes** — 4 new ascension modes, each a distinct self-imposed
  handicap with a completion reward: **Trigger finger** (scroll over the
  cookie = click it; no clicking achievements), **Ascetic** (golden and wrath
  cookies never spawn), **Monoculture** (the first building you buy locks in
  your only building type for the run), **Spender** (no upgrades may be
  purchased). Reaching each run's cookie milestone wins a shadow achievement
  that permanently unlocks a matching reward heavenly upgrade with real
  effects: Scrolling adept (+2% click power, +5% golden effect duration),
  Golden heart (+15% golden effect duration, +5% spawn frequency), Unity
  (+1% CpS per 100 of your most-owned building type), Minimalist (+2% CpS per
  100 prestige upgrades owned). Milestones: Trigger finger/Spender 1e15,
  Ascetic 1e12, Monoculture 1e9. Verified by the "challenge modes" QA test.
- **Heavenly-tree layout + arrangement presets** — upgrade positions are now
  derived automatically from the parent DAG (Sugiyama-style), replacing
  hand-placed coordinates, and the tree can be rearranged with one-click
  presets (Auto / By branch / By generation / Grid) or drag-to-reposition;
  the layout saves with the game. Verified by the ?qa=arrange and heavenly
  presets tests.
- **Store grid + store UI fixes** — the building store is no longer a
  single-column list: buildings sit in a staggered, overlapping grid that
  fills the box, so far more are visible at once. Also fixed the Mines' back
  rows looking transparent, made farms/mines rebuild their sprites when the
  sprite sheet loads, and relocated the heavenly-tree arrange buttons so they
  no longer sit on top of other buttons.
- **Sitting Room & Cat Colony visual redesign** — both minigames got a shared
  visual language: card-based layouts (seat/mission cards with icons and
  per-activity stat chips), labeled cozy/eldritch (Sitting Room) and
  idle/away/resting (Cat Colony) color-coded tags, and card-style shop rows.
  Also fixed the blank Chamomile incense icon (it was a solid-black sprite).
- **Third-party achievement fix** — CC3's built-in extras (American Season,
  Casino, Daily Crumb, Black Hole Inverter, Decide Your Destiny, Tutorial)
  no longer award the "Third-party" achievement on every page load; only a
  genuinely third-party mod does. (`Game.registerMod` gained an optional
  `builtin` flag.)
- **Purchase feedback everywhere** — the roadmap said "Grandma and Cats get a"
  bounce on purchase; extend to the rest of the store. Only Grandma actually had
  it. Every building pic already carries a `born` timestamp, so the generic
  framed/unframed draw branches now route through the same age-based bounce
  math — any purchase across the store gets immediate visual feedback.
- **Cloud-save convenience (copy-to-clipboard)** — the Export save prompt
  gained a one-click "Copy to clipboard" button. Works in secure contexts
  (navigator.clipboard.writeText) and falls back to a hidden-textarea
  execCommand('copy') for http/file pages. Verified by the ?qa=save probe.
- **Daily crumb — weekly calendar rewards** — CC3-native returning-player
  rewards, fully local/offline: every local day the game opens, the player
  collects that weekday's crumb (Mon/Thu 5 min of production, Tue 3-min click
  frenzy, Wed a sugar lump, Fri 3-min frenzy, Sat 10 min of production, Sun a
  golden cookie; minimum 500 cookies while CpS is low). Consecutive days build
  a streak; every 7-day streak grants the weekly crumb (3 golden cookies + 30
  min of production). Missed days backfill (capped at 14 — longer absences
  reset the streak); a fresh install only records the baseline day. State
  (streak / last claim / lifetime claims) persists in the save's Custom mod
  section, so it survives import/export and ascension. UI: a "Daily crumb"
  subsection on the Stats menu (7-slot week strip, today marker, streak,
  next-day preview) + a notification on each collection; 3 achievements.
  Verified by the ?qa=dailycrumb probe. See
  `src/extras/dailyCrumb.ts`.
- **Grandma's Sitting Room minigame** — the sixth minigame (Grandma
  building counterpart), following the Cat Colony shape: seat grandmas in six
  activities on a cozy↔eldritch comfort dial. Cozy activities (knitting, tea)
  produce Yarn and calm the Grandmapocalypse; eldritch ones (chant, choir)
  produce more Yarn and accelerate the wrath, boosting wrath-cookie and
  wrinkler economy via the minigame `effs`. Yarn buys REPEATABLE flat-price
  stacks of six Grandma upgrades that feed the existing CpS formula
  (grandmaAdd/grandmaMult in content/buildings/grandma.ts), plus 5
  achievements and a 2-node heavenly branch off 'Starter kitchen' (yarn +50%,
  'Elder hospitality' doubling the comfort-driven wrath rates). The minigame
  only reports `M.currentComfort()` — all `Game.elderWrath` mutation stays in
  the canonical `Game.UpdateGrandmapocalypse` updater (cozy rooms hold wrath
  at 0, eldritch rooms speed up the climb), so Elder Pledge/Covenant
  bookkeeping stays in charge. Verified by the ?qa=sittingroom probe. See
  `src/engine/minigameGrandmaSittingRoom.ts`.
- Browse-only heavenly upgrade tree: the Ascend confirmation gained a
  "Browse the tree" option (Game.AscendBrowseView/AscendBrowseClose) that
  opens the ascend view without the intro, without earning chips and without
  resetting anything; the Reincarnate button becomes "Back to game" (original
  markup restored on close), purchases spend existing chips, and the debug
  prestige mode is left alone. Verified by the ?qa=ascendbrowse probe
- 12 low-tier heavenly upgrades (2-30 chips, appended so save ids stay stable):
  Blessed apron, Second helping, Angelic recipe (+2/+3/+2% CpS), Firm handshake,
  Demonic hustle (+5% clicking each), Morning bells (golden spawn +5%),
  Sugar glaze (golden effect duration +5%), Patient tongue (golden lifespan +5%),
  Night watch (+2% offline earnings), Bargaining table (buildings 1% cheaper),
  Tidy pantry (upgrades 1% cheaper), Lucky start (3 free cursors each run)
- **Cat Colony minigame** — the fifth minigame (Cats' Farm/Temple/Wizard
  tower/Bank counterpart): dispatch idle cats on timed expeditions for
  Treats, occasionally a scuffle sends cats home to rest instead. Treats buy
  REPEATABLE flat-price stacks of six Cat Colony upgrades (not
  cookie-bought; the first stack is `.earn()`-granted for save continuity)
  that feed the existing Cats catAdd/catMult formula, plus 5 achievements
  and a 4-node heavenly branch off 'Communion of whiskers' (Bottomless
  treat jar, Nap discipline, Efficient patrols, Generous strangers) that
  tune the trickle, expedition duration and reward. Built entirely from
  assets already in the repo: the panel background reuses
  `img/cats/Summer1.png` (the Cats building's own room backdrop), the roster
  visualization reuses `img/cats/idle.png`/`sleep.png` via the same CSS
  keyframe-stepping technique as the muted-Cats sleeping store icon, the
  upgrade icons crop frame 0 of the previously-unused `attack-1.png`/
  `hurt.png`/etc. strips, and every sound is one already shipped in
  `public/snd/`. Verified by the ?qa=catcolony probe (deterministic
  dispatch/resolve, the heavenly modifiers, the treat economy and
  save/load round-trip). See `src/engine/minigameCatColony.ts`.
- Cats building with roaming animated cats, 24 balanced cat upgrades; the muted
  Cats store icon now shows an animated sleeping cat (breathing + tail + zzz)
- Cat synergy system (mirrors the grandma one): 8 cat upgrades — Kitten grandmas,
  Farm cats, Miner cats, Worker cats, Space cats, Golden cats, Altered cats,
  Time cats — each making Cats 2× as efficient and boosting the tied building
  +1% per (id−1) cats, plus the "The purr-fect match" achievement
- Cats achievements extended to the full standard set (14 tiered + 3 production
  + 1 level) plus cat-count milestones up to 1,000
- New cookie upgrades + barn/farm sprite + cursor hand sprites
- Black Hole Inverter mod building (upgrades, achievements, save support)
- Late-game tail rebalance + all-building balance audit
- Full economy analysis tooling (`Game.AnalyzeEconomy`, `Game.SimulateStrategy`)
- Rolling save backups (history, restore, download-to-file)
- Web background music (8 tracks, Bert Cole) + interface tones (confirm/back/
  error), Settings Music toggle + volume slider, jukebox tracks; fixed the
  Settings pref buttons rendering "…undefined"

## Animations & polish

- [ ] **Animate more buildings** — generalize the roaming renderer to other
      buildings (e.g. livestock in farms, workers in mines). Pick the ones where
      motion reads well at building sizes.
- [x] **Purchase feedback for remaining buildings** — Grandma and Cats get a
      bounce on purchase; extend that feel to the rest of the store.
- [ ] **Clicker feedback depth** — the cursor sprites landed and vanilla click
      particles already burst on the big cookie; consider richer effects on top
      (ripples, crumbs, screen shake at milestones).

## Backups & saves

- [ ] **One-click "Back up now"** — a button that captures the current save and
      downloads it immediately (backup history exists; this is the instant
      "before I do something risky" path).
- [ ] **Named/versioned backup slots** — label backups in the dropdown
      (e.g. "before ascension", "pre-wipe") instead of only timestamps.
- [ ] **Export a bundle** — one file that carries the save + active backups +
      mod data, for full off-browser archives.

## Content

- [ ] **More achievements** — Cats now carry the full standard set (14
      tiered + 3 production + 1 level) plus cat-count milestones at 100,
      450, 500 and 1000; add cookie-collection and seasonal achievements.
- [ ] **Seasonal events** — the Santa/Dragon specials exist; add CC3-native
      events (e.g. a summer event using the summer backgrounds).
- [ ] **Cat cosmetics** — alternate cat sprite palettes unlockable by milestone.

## Economy & balance (tooling now exists)

- [ ] **Balance gate in CI** — fail the build when the audit flags a new
      balance warning, so rebalances are reviewed as they land.
- [ ] **In-game buy hints** — surface the strategy-runner's `bestPayback` order
      as a subtle store hint (no auto-buy).
- [ ] **Payback panel** — a stats-screen section showing each building's current
      payback vs. the curve, powered by `Game.AnalyzeEconomy`.

## Platform & modding

- [ ] **Mod loader polish** — native mods work (Black Hole Inverter is one) and
      `Game.modSaveData` exists, but the modding surface is minimal and there is
      no mod menu or public API docs; document and expose it.
- [x] **Cloud-save convenience (copy-to-clipboard)** — the Export save prompt
      gained a one-click "Copy to clipboard" button (modern async clipboard API
      with a hidden-textarea execCommand fallback for http/file pages).
      Verified by the ?qa=save probe.
- [ ] **QR-code save export** — the copy-to-clipboard landed; a QR-code export
      for phone transfer is a fun add on top.
- [ ] **PWA niceties** — install prompts, badge the app icon with uncollected
      cookies, background-sync autosaves.

## QA & tooling

- [ ] **Options-menu UI coverage** — Playwright drives the backup flow at the
      probe level; add a test that opens Options and clicks Restore/Download.
- [ ] **Visual regression snapshots** — store, top bar, and cat box against
      goldens, so sprite/alignment regressions (like the top-bar one) get caught.
- [ ] **Economy simulator report** — a rendered HTML report (charts) from
      `Game.AnalyzeEconomy` for sharing balance findings.
