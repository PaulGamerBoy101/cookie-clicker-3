# Cookie Clicker 3 — Roadmap

Open ideas for where to take the game. Nothing here is a commitment — items get
picked up, traded, or dropped as we go. Checked items are shipped.

## Recently shipped (context)

- Cats building with roaming animated cats, 24 balanced cat upgrades
- New cookie upgrades + barn/farm sprite + cursor hand sprites
- Black Hole Inverter mod building (upgrades, achievements, save support)
- Late-game tail rebalance + all-building balance audit
- Full economy analysis tooling (`Game.AnalyzeEconomy`, `Game.SimulateStrategy`)
- Rolling save backups (history, restore, download-to-file)
- Web background music (8 tracks, Bert Cole) + interface tones (confirm/back/
  error), Settings Music toggle + volume slider, jukebox tracks; fixed the
  Settings pref buttons rendering "…undefined"

## Animations & polish

- [ ] **Grandma walking animation** — grandmas roam their box like the cats do.
      Deferred from the cats work ("come back to it later"); the cat renderer is
      the template.
- [ ] **Animate more buildings** — generalize the roaming renderer to other
      buildings (e.g. livestock in farms, workers in mines). Pick the ones where
      motion reads well at building sizes.
- [ ] **Purchase feedback for remaining buildings** — Grandma and Cats get a
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

- [ ] **Cat minigame** — a fifth minigame alongside Garden/Grimoire/Market/
      Pantheon, cat-themed (the minigame framework is already typed and
      code-split; a cat colony / treat garden are natural fits).
- [ ] **More achievements** — cat-count achievements exist at 100 and 450
      ("A cat for every cushion", "The whole litter"); add higher milestones
      (500/1000), cookie-collection, and seasonal achievements.
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
- [ ] **Cloud-save convenience** — one-click copy-to-clipboard of the save code
      is cheap; a QR-code export for phone transfer is a fun add.
- [ ] **PWA niceties** — install prompts, badge the app icon with uncollected
      cookies, background-sync autosaves.

## QA & tooling

- [ ] **Options-menu UI coverage** — Playwright drives the backup flow at the
      probe level; add a test that opens Options and clicks Restore/Download.
- [ ] **Visual regression snapshots** — store, top bar, and cat box against
      goldens, so sprite/alignment regressions (like the top-bar one) get caught.
- [ ] **Economy simulator report** — a rendered HTML report (charts) from
      `Game.AnalyzeEconomy` for sharing balance findings.
