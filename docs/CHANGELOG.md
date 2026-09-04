# Changelog

Player-facing history for Cookie Clicker 3. This mirrors the in-game
**Info > Version history** panel, which is generated from
`src/engine/content/changelog.ts` — when you ship a player-visible change,
update both (the in-game entry is what players actually see; this file is
the plain-text mirror for GitHub).

Entries are newest first, dated DD/MM/YYYY to match the in-game panel. The
upstream Cookie Clicker 2.048 patch notes that the engine also displays
(31/05/2022 back to 05/08/2013) are Orteil's, shown verbatim in the
in-game log, and are not duplicated here.

## 04/09/2026 - soundtracks and a music picker

- Settings now has a music section: pick between the original soundtrack and
  the new Towns set (7 tracks from the same composer, Bert Cole), and choose
  exactly which track plays from a dropdown — your soundtrack and track are
  remembered between sessions, and each soundtrack resumes its own last
  track

## 04/09/2026 - hold-to-buy, announcement dialogs, and smoother panels

- click and hold a building in the store to buy it over and over — the
  current bulk amount applies (Ctrl/Shift), the hold stops the moment you
  release, slide off the row, open a menu or can't afford the next one, and
  the repeats never double-buy your final click; a new "Hold to buy" option
  in Settings turns the feature off entirely
- milestone announcements are now centered dialogs (like the welcome popup)
  instead of notification toasts: the daily crumb collect and the
  transcendence completion summary — they still fall back to a toast when
  another dialog is already open or an ascension animation is running
- minigame panels now ease open and closed, anchored to where you clicked;
  the Doctrine view and the heavenly tree got the same eased full-screen
  takeover
- the Cracking cookie's crumble got a visual pass: the crack starts
  hairline and widens like the ascension intro, chunks fly tighter, the
  faint gray box is gone, and click particles and wrinklers stay visible
  above the cracked cookie
- store rows that haven't changed are no longer rewritten on every refresh,
  keeping purchases snappy even in a full store grid
- fixed the Cat Colony panel not refreshing when the cat count changes
- Decide Your Destiny now survives corrupt or hand-edited saves

## 02/09/2026 - performance pass

- background music now loads lazily: nothing is fetched until you first
  play a track (previously the browser downloaded all ~12 MB of music on
  page load, even with music off), and the next track is pre-buffered for
  gapless auto-advance
- the cookie counter and per-second readout are now updated in place
  instead of being rebuilt from HTML every frame
- tiled backgrounds (milk, tall backgrounds) are painted with native canvas
  patterns instead of per-tile draw loops
- sprite lookups no longer scan the loaded-asset list on every draw, and
  the remaining autosave work is scheduled during idle time
- the icons sprite sheet is preloaded during boot and is no longer
  downloaded twice under different cache-busting URLs

## 01/09/2026 - purchase feedback, copy-to-clipboard

- every building now gets a short grounded bounce on purchase (not just
  Grandma) — the store-wide feedback the roadmap called for
- the Export save prompt now has a "Copy to clipboard" button so you can
  grab the save code without manually selecting the textarea

## 01/09/2026 - challenges, a roomier store, and cozier minigames

- added 4 new challenge modes (pick one when ascending): **Trigger finger**
  (scroll over the cookie = click it, no clicking achievements),
  **Ascetic** (golden and wrath cookies never spawn), **Monoculture** (the
  first building you buy locks in your only building type for the run),
  and **Spender** (no upgrades may be purchased, buildings only). Each has
  a completion shadow achievement that permanently unlocks a reward
  heavenly upgrade: Scrolling adept (+2% click power, +5% golden effect
  duration), Golden heart (+15% duration, +5% spawn frequency), Unity (+1%
  CpS per 100 of your most-owned building), and Minimalist (+2% CpS per
  100 prestige upgrades owned)
- the building store is no longer a single column: buildings now sit in a
  staggered, overlapping grid that fills the box, so far more of them are
  visible at once; also fixed the Mines' back rows looking transparent and
  made farms/mines rebuild their sprites when the sprite sheet loads
- the heavenly upgrade tree now derives its layout automatically from the
  upgrade parent graph, and you can rearrange it with clickable presets
  (Auto / By branch / By generation / Grid) plus drag-to-reposition — the
  layout saves with your game
- Grandma's Sitting Room redesigned: the cramped 6×6 activity-button table
  became a proper room layout — seat cards in a 3-column grid with each
  seat's activity icon and stats, a labelled Cozy/Eldritch activity shelf
  with per-activity comfort and yarn rates, a clearer comfort bar, and
  card-style shop rows
- Cat Colony got the same visual pass: expedition cards with cat-sprite
  poses and stat chips (cats, duration, treats, risk), color-coded roster
  chips for idle/away/resting cats, and card-style shop rows
- built-in extras (American Season, Casino, Daily Crumb, Black Hole
  Inverter, Decide Your Destiny, Tutorial) no longer award the
  "Third-party" achievement on every page load — a genuinely third-party
  mod still does

## 31/08/2026 - a fuller heavenly chip shop

- added 12 low-tier heavenly upgrades (2-30 chips): Blessed apron, Second
  helping and Angelic recipe (+cookie production), Firm handshake and
  Demonic hustle (+clicking), Morning bells (golden cookies appear more
  often), Sugar glaze (golden cookie effects last longer), Patient tongue
  (golden cookies stay longer), Night watch (offline earnings), Bargaining
  table (buildings 1% cheaper), Tidy pantry (upgrades 1% cheaper) and
  Lucky start (start each run with 3 free cursors)
- the Ascend confirmation now offers a "Browse the tree" option: view the
  heavenly upgrades without ascending (nothing resets, no chips earned) —
  and you can even buy upgrades with the chips you already have. The
  Reincarnate button becomes a "Back to game" button while browsing

## 23/08/2026 - cookie clicker 3

- Cookie Clicker 3: the 2.048 engine, rebuilt as strictly typed TypeScript
  ES modules on a Vite build — same game, same numbers, same puns
- saves stay byte-compatible with Cookie Clicker 2.048 (verified by an
  automated export/import round-trip)
- no ads, no trackers, no CDN requests — every script, image, font and
  sound is self-hosted
- the game now boots offline (PWA), with a self-updating service worker
- added the Cats building (with roaming animated cats), 24 cat upgrades,
  and a full achievement set — 14 tiered, 3 production, 1 level, plus
  cat-count milestones up to 1,000
- muting the Cats store now leaves a little sleeping cat (breathing,
  tail-flick and zzz) in the muted-icons bar
- added the cat synergy system: 8 cat upgrades (Kitten grandmas, Farm
  cats, Miner cats, Worker cats, Space cats, Golden cats, Altered cats,
  Time cats) that each make Cats twice as efficient and boost their
  building +1% per (id-1) cats, plus the "The purr-fect match"
  achievement for owning all of them
- added the Black Hole Inverter building, a native mod with 17 upgrades
  and 18 achievements
- added Decide Your Destiny: spend sugar lumps to choose the outcome of
  the next natural golden cookie (a native port of klattmose's mod)
- added American Season: a July 1st season with rockets and a left-panel
  fireworks canvas (a native port of klattmose's mod)
- added background music (8 tracks by Bert Cole) and interface tones, with
  Music and volume settings
- rebalanced the late-game building tail back onto the ~2.1x-per-store-step
  price curve, checked by a full building balance audit
- added economy analysis tooling (Game.AnalyzeEconomy /
  Game.SimulateStrategy) behind the ?qa=content probe
- added rolling save backups (history, restore and download from the
  Options menu)
- added one-column responsive mode for phones — the "todo!" Orteil left in
  the 2.048 CSS, now completed
- the v3.0 animation pass: display-rate smooth cookie counter, slide-in
  columns and notifications, ascend-intro flash + shake (all disabled by
  "Fancy graphics" off or the OS reduce-motion setting)
- added a Content-Security-Policy; deploys are gated by a 21-probe
  Playwright CI on GitHub Pages
