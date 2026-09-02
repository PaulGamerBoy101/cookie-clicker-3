# Second Prestige Layer — "Transcendence"

A research-backed design for a second prestige layer in Cookie Clicker 3, drawing from
Antimatter Dimensions (Infinity → Eternity → Reality), Clicker Heroes
(Ascension → Transcendence), Realm Grinder, Egg Inc., and Idle Skilling.

---

## Table of Contents

1. [Research: How other idle games do it](#1-research-how-other-idle-games-do-it)
2. [Distilled design principles](#2-distilled-design-principles)
3. [CC3 Design — "Transcendence"](#3-cc3-design--transcendence)
4. [The Doctrine Tree: a respec-able transcendent mechanic](#4-the-doctrine-tree-a-respec-able-transcendent-mechanic)
5. [Milestones that gate the keep-list](#5-milestones-that-gate-the-keep-list)
6. [Curated keep-list](#6-curated-keep-list)
7. [Born again interplay](#7-born-again-interplay)
8. [Scope & delivery plan](#8-scope--delivery-plan)
9. [Implementation map](#9-implementation-map)

---

## 1. Research: How other idle games do it

### Antimatter Dimensions — Infinity → **Eternity** → Reality → Celestials

*([AD Eternity wiki](https://antimatter-dimensions.fandom.com/wiki/Eternity) — successfully loaded)*

- **Unlock**: a **hard cap of the first layer** — you must reach the 1st-layer currency cap
  (1.798e308 IP) *and* have the 8th Infinity Dimension. A genuine "you've maxed layer 1"
  milestone, not a soft suggestion.
- **"4th consecutive reset system and the 2nd Prestige Layer"** — resets *everything except*
  a curated list: Achievements, Statistics, Challenge times, **Time Dimensions, Eternity
  Upgrades, Time Studies, Eternity Milestones, Eternity Challenges, Time Dilation**.
- **Log-based currency**: you can Eternity *whenever you want* once unlocked, and always
  gain ≥1 EP. `EP = ⌊(5⌊log₁₀(IP)⌋/308 − 0.7)⌋`. No run is ever wasted.
- **Each layer adds a mechanically new system**, not just multipliers:
  - **Time Studies** — a *respec-able* skill tree (spend Time Theorems, reset and
    reallocate, different branches).
  - **Time Dimensions** — a new resource-producer that feeds tickspeed, changing the
    economy's shape.
  - **Eternity Milestones** — passive permanent bonuses unlocked at EP thresholds that
    *gate the keep-list* (e.g. "keep X across Eternity").
  - **Eternity Challenges** — repeatable restricted runs granting permanent rewards.
- Also notable: the cheeky *"But I wanted another prestige layer…"* achievement — the
  genre itself jokes about how players always want more layers.

### Clicker Heroes — Ascension → **Transcendence**
*(domain knowledge; wiki is Cloudflare-blocked)*

- **Ascension (layer 1)** = Hero Souls → randomly-offered, levelable **Ancients** (dozens).
- **Transcendence (layer 2)** = requires reaching a specific zone + 1M lifetime Hero Souls →
  grants **Ancient Souls**, spent on **Outsiders**: a fixed handful (~7) of extremely
  powerful, transformative upgrades (e.g. "more souls per boss," "less boss HP,"
  "faster progression") plus a global **Transcendent Power** multiplier.
- **Lesson**: the 2nd layer's upgrades are **few and game-shaping** — a deliberate contrast
  to the many small layer-1 upgrades.

### Realm Grinder — Rebirth → **Abdication** → Ascension → Research

- Each layer introduces a **choice mechanic**: Abdication unlocks **factions**
  (Good/Evil/Neutral, each with distinct playstyles), not numbers.

### Egg Inc. — Prestige → **Prophecy Eggs**

- The 2nd currency **isn't a reset at all** — Prophecy Eggs are earned from contracts and
  *multiply the power of Soul Eggs*. Proof that "second layer" ≠ "second reset."

### Idle Skilling — Ascension → **Transcendence**

- The 2nd layer **unlocks entirely new areas** (The Void, The Lab) — "game 2" layered
  on top of game 1.

### Cookie Clicker itself

- Never had a true 2nd layer — sugar lumps are a *time-gated side-meta*, not a reset.
  This is an open gap CC3 can fill with a layer that respects the original's tone.

---

## 2. Distilled design principles

What the research actually teaches:

1. **Log-based currency, always ≥ 1.** The 2nd-layer currency must come from the
   *log/root* of 1st-layer progress so every run contributes. (AD: `EP = f(log₁₀ IP)`;
   CH: `AS = f(√lifetime HS)`.)
2. **A real, hard unlock gate.** Reach the cap/end of layer 1 (AD's 1.798e308). A "wow"
   milestone, not a vague suggestion.
3. **A new mechanic per layer, not just bigger numbers.** The strongest layers add:
   respec-able studies (AD), transformative outsiders (CH), a choice mechanic (RG),
   a new resource (AD Time Dimensions), or new areas (IS).
4. **Milestones that gate the keep-list.** Eternity Milestones give long-horizon goals
   *within* the layer and literally decide "what survives the next reset."
5. **A curated keep-list.** Explicit, meaningful carry-over (achievements + stats +
   *the new layer's own stuff*), not "everything's gone" and not "everything's kept."
6. **The layer has its own challenges.** Restricted repeatable runs with permanent
   rewards (AD Eternity Challenges, CH transcendence challenges).
7. **Respec-ability is a beloved feature** (AD Time Studies, CH Ancients both allow it).

---

## 3. CC3 Design — "Transcendence"

> **Naming alternative:** "Eternal Essence" or "Cosmic Sugar" could work thematically with
> Cookie Clicker's humor. "Transcendence" is the working name below; it's evocative and
> mirrors the established "Ascension" terminology.

### 3.1 Currency: Eternal Essence (EE) — log-based, always ≥ 1

**Formula:**

```
EE = ⌊ (log₁₀(cookiesReset / 1e¹²) − 8) ⌋
```

- At 1e²⁰ lifetime cookies → 0 EE (below gate)
- At 1e²¹ → 1 EE, 1e²² → 2 EE, 1e²³ → 3 EE … (roughly +1 EE per order of magnitude
  past the gate)
- First transcendence (at 1e²⁹, the gate) → **~9 EE.** Second (1e³³) → ~13 EE.
- Every transcendence always yields **≥ 1 EE** — nothing is ever wasted.
- The `−8` and the base-10 log are the tuning knobs (`Game.EEfactor`, exactly like
  `Game.HCfactor` already exists).
- **Lifetime EE earned** (the running total) determines which Milestones you've unlocked.

### 3.2 Unlock gate — the full ascend meter

Instead of an arbitrary "prestige ≥ 100," gate on the existing hard cap:

- `Game.ascendMeterLevel = 1e²⁹` already exists (main.ts:1295) — the full ascend meter.
- Transcendence unlocks when `cookiesReset ≥ 1e²⁹` (the ascend meter reads full) **or**
  lifetime prestige ≥ 10,000, whichever the player meets.
- This mirrors AD's "reach the 1st-layer cap" and makes the first Transcendence a genuine
  "you beat the game's first half" moment.

### 3.3 The Transcendence flow

1. Player's ascend meter fills completely (1e²⁹ cookiesReset) → the **Transcend button**
   appears on the ascend screen, beside the Reincarnate button.
2. Clicking it shows a confirmation prompt (like Ascend's) with the EE gain preview.
3. On confirm, a brief animation plays (reuses the ascend intro with a different visual).
4. **What happens**:
   - Calls `Game.Reset(1)` (hard reset — buildings, upgrades, buffs, seasons, etc.).
   - Clears all prestige-pool upgrades (`pool === 'prestige' → bought = 0`).
   - Resets prestige level, heavenly chips, heavenly chips spent.
   - Resets building levels, sugar lumps, lump state.
   - Keeps achievements, stats, bakery name, **EE, Doctrine nodes, Milestones**.
5. The player is back in the game with 0 cookies, but the Doctrine tree's passive
   bonuses are already active.

### 3.4 UI integration

- **Transcend button** on the ascend screen (visible only when gate is met). Shows the
  EE gain for the current run.
- **Transcendence tab** on the ascend screen — a toggle button that swaps the tree view
  from the heavenly tree to the Doctrine tree (reuses the same DAG renderer).
- **Stats screen** — "Transcendence" section: EE, lifetime EE, transcendence count,
  next-gain preview.
- **Doctrine tree** — rendered in `#transcendContent` (a new `<div>`), priced in EE,
  with a "Respec" button (refund all, pay 1 EE cost or free).

---

## 4. The Doctrine Tree: a respec-able transcendent mechanic

**This is the core new mechanic — not just multipliers, but a small respec-able DAG tree
that changes how you play.**

Reuses the existing `heavenlyLayout.ts` Sugiyama DAG engine, the `Game.crate()` renderer,
and the arrange/preset mode — the engineering cost is low.

### 4.1 Four branches, ~12 nodes

#### Glutton's Path (click-focused)

| Node | Effect | Cost (EE) |
|------|--------|-----------|
| Persistent Hand | Clicking the cookie gains +0.5% of your CpS per 100 Cursors owned | 1 |
| Echoing Click | Each click triggers 0.5 seconds of passive CpS | 3 |
| Cascade | Golden cookie clicks have a 10% chance to spawn another golden cookie | 8 |

#### Idler's Path (production-focused)

| Node | Effect | Cost (EE) |
|------|--------|-----------|
| Lazy Oven | +5% offline CpS per Idler node owned (including this one) | 1 |
| Warm Embers | The shimmering veil starts on by default and costs 50% less to reactivate | 3 |
| Ambient Baking | Wrinklers spawn 20% faster and hold 10% more cookies | 8 |

#### Fatebinder's Path (golden-cookie/wrinkler-focused)

| Node | Effect | Cost (EE) |
|------|--------|-----------|
| Fortune's Favor | Golden cookies appear 10% more often and last 10% longer | 1 |
| Elder's Whisper | Wrath cookies can still spawn in Ascetic runs (your first challenge-breaker) | 3 |
| Strange Attractor | Natural golden cookies have a 5% chance to be a "cluster" (spawns n more) | 8 |
| Double Dip | Golden cookie effects have a 15% chance to double on expiry (trigger again) | 15 |

#### Rebuilder's Path (economy-shaping)

| Node | Effect | Cost (EE) |
|------|--------|-----------|
| Frugal Start | Buildings are 2% cheaper per Transcendence performed (max −20%) | 1 |
| Measured Growth | Upgrades are 2% cheaper per Transcendence performed (max −20%) | 3 |
| Legacy Echo | Start each run with 1 free building of the type you owned the most of last run | 8 |

### 4.2 Respec

Any time (outside a run), click the **Respec** button in the Doctrine tree. All nodes are
refunded and you can reallocate. Cost: free for the first respec per Transcendence,
1 EE thereafter. This encourages experimentation — try Glutton's path this run,
Idler's next, then mix.

### 4.3 Why a DAG tree instead of a flat list

CC3 already has the full heavenly-tree machinery: Sugiyama auto-layout, drag-arrange,
presets, crate rendering, parent-based gating. A 12-node Doctrine tree built as
`pool='transcend'` upgrades drops into the prestige-adjacent bookkeeping
(`Game.TranscendUpgrades`) and gets the tree renderer, tooltips, and mobile support
for free.

---

## 5. Milestones that gate the keep-list

Following AD's Eternity Milestones: lifetime-EE thresholds unlock passive bonuses *and*
decide what survives the next Transcendence.

| Milestone | EE (lifetime) | Unlock |
|---|---|---|
| First Light | 1 | The Transcendence tab + keep 1 *cosmetic* heavenly upgrade (milk/bg/sound selector) |
| Inner Fire | 10 | Start each run with 3 free Cursors |
| Steady Hand | 25 | Keep **1 heavenly upgrade of your choice** across Transcendence |
| Elder's Grace | 50 | Start each run with 5 free Grandmas |
| Relentless | 100 | Keep **building levels** across Transcendence |
| Unbroken | 250 | Keep **sugar lumps** across Transcendence |
| Timeless | 500 | Keep **2** heavenly upgrades of your choice |
| Omega | 1000 | Keep all permanent-upgrade slots + "Born Eternal" (Doctrine works in Born-again runs) |

This replaces the earlier "10% carry over" idea with explicit, earned bonuses — a direct
application of AD's best design pattern.

---

## 6. Curated keep-list

**Across Transcendence you keep:**
- Achievements, statistics, bakery name
- EE, Doctrine nodes, Milestones
- Transcendence achievements

**You lose:**
- Prestige level, heavenly chips, heavenly chips spent
- All heavenly upgrades (except those a Milestone preserves)
- All buildings and building levels (except those a Milestone preserves)
- Sugar lumps and lump state (except those a Milestone preserves)
- All non-lasting upgrades (cookie, kitten, synergy, seasonal, etc.)
- Seasons, santa/dragon levels, wrinklers, buffs
- Permanent upgrade slots (except those a Milestone preserves)

This is cleaner than a "keep 10% random" approach — every carry-over is a Milestone reward
you earned.

---

## 7. Born again interplay

`ascensionMode == 1` (Born again) disables Doctrine effects too — matching how prestige
and heavenly upgrades are disabled — **unless** the Omega milestone (1000 lifetime EE)
has been earned, which unlocks "Born Eternal" mode. This gives veteran players a reason
to attempt Born again runs post-transcendence.

---

## 8. Scope & delivery plan

### MVP (coherent, shippable feature)

1. EE currency + log formula + the Transcendence reset flow
   (reuses `Game.Reset(1)` + clears prestige state/upgrades).
2. Unlock gate (full ascend meter or 10k lifetime prestige).
3. **Doctrine respec-able tree** (12 nodes, 4 branches) — biggest piece, reuses the
   tree/layout engine.
4. **Milestones** (8 thresholds, at least the first 5).
5. Keep-list + Born-again handling.
6. Save via mod data section (same mechanism as dailyCrumb / crackingCookie — no vanilla
   format change).
7. 5 achievements (First Light, Inner Fire, Steady Hand, Elder's Grace, Relentless).
8. Stats/UI integration (Transcendence section, Transcend button, Doctrine tab).
9. `?qa=transcend` QA probe + Playwright coverage.

**MVP size estimate:** ~1 new file (`src/extras/transcendence.ts`, ~900–1200 lines
modeled on `dailyCrumb.ts`), small edits to `main.ts` (import + QA), reuse of existing
tree/layout/crate code. No engine-core rewrites.

### Phase 2

- **Eternal Recipes** — a set of repeatable restricted runs (transcendence challenges)
  with first-clear permanent rewards. Modeled on the existing `ascensionModes` in
  `src/engine/main.ts` (lines 1284–1291).
- **More Doctrine nodes** — expand each branch from 3→5 nodes (12→20 total).
- **Balance pass** using the existing `Game.AnalyzeEconomy` tooling, comparing no-Doctrine
  vs. full-Doctrine CpS curves.

### Stretch

- A post-Transcendence **minigame or building** ("The Eternal Oven") — an Idle-Skilling-
  style new area. This would be its own project (art assets, building declaration,
  minigame logic).

### Deliberately out of scope

- A **3rd prestige layer** (the Milestone system is designed to slot one in later).
- Any **vanilla save-format** changes (mod-data persistence keeps `save-compat` green).

---

## 9. Implementation map

### Files to create

| File | Purpose |
|---|---|
| `src/extras/transcendence.ts` | All layer-2 logic: registerMod, EE formula, Doctrine nodes, Milestones, reset flow, save/load, UI, achievements, `window.__cc3Transcendence` test/inspection surface |

### Files to modify

| File | Change |
|---|---|
| `src/main.ts` | Add `import './extras/transcendence';` (≈line 27) + `?qa=transcend` QA probe block |
| `src/engine/systems/ascend.ts` | Add the Transcend button + Doctrine tab toggle to the ascend overlay. Expose `Game.BuildTranscendTree()` (a thin variant of `BuildAscendTree()` with EE pricing). Add the EE-gain calculation to the ascend info display |
| `src/engine/systems/reset.ts` | The transcendence path calls `Game.Reset(1)` then clears prestige upgrades + prestige/chips state. Expose a mod hook (`runModHook('transcend')`) |
| `src/engine/systems/heavenlyLayout.ts` | Reuse as-is. The Doctrine tree uses `pool='transcend'` upgrades which get Sugiyama auto-layout for free |
| `tests/qa.spec.js` | Add the `?qa=transcend` probe to the gate suite |

### Key tuning knobs

| Knob | Location | Default | Purpose |
|---|---|---|---|
| `Game.EEfactor` | transcendence.ts | `1.0` (log base-10) | Tunes how fast EE grows per order of magnitude |
| `Game.EEoffset` | transcendence.ts | `8` | Controls the gate: EE = floor(log₁₀(cookiesReset/1e¹²) − offset) |
| Gate cookiesReset | transcendence.ts | `1e²⁹` | The full ascend meter — first transcendence threshold |
| Doctrine node costs | transcendence.ts | 1–15 EE | Per-node pricing (see branch tables) |
| Milestone thresholds | transcendence.ts | 1–1000 EE | 8 thresholds (see milestone table) |
| Milestone carried counts | transcendence.ts | 1–2 upgrades | How many heavenly upgrades survive |

### Save format

Uses the **existing mod save data** mechanism (the "Custom" section of the save,
`Game.saveModData()`):

```
CC3Transcendence:{"ee":42,"ees":300,"trans":15,"eee":450,"tpa":999999,"milestones":[1,2,3,4,5],"doctrine":[101,102,201]};
```

No vanilla save fields are added — backward compatible, survives import/export, and the
save-format tests (save-compat.spec.js) stay green.

### QA probe

`?qa=transcend` follows the pattern of `?qa=ascend`:
1. Seed a high-cookiesEarned state (≥1e²⁹).
2. Verify the Transcend button is visible.
3. Drive the transcendence flow.
4. Verify EE was earned, state round-trips through save/load, and the run was reset
   (buildings cleared, prestige state reset, Doctrine tree accessible).

---

## Appendix: Design Rationale

### Why "Transcendence" over other names?

- "Transcendence" mirrors Cookie Clicker's celestial theme ("Heavenly chips,"
  "Ascension") — it implies going *beyond* the heavens.
- It's consistent with Clicker Heroes' second layer, helping players who cross games
  recognize the pattern.
- Alternatives: **"Nirvana"** (Buddhist-themed, fits rebirth cycle but may clash with CC's
  Christian-celestial aesthetic), **"The Great Wipe"** (too jokey for a late-game system).

### Why 12 Doctrine nodes instead of 25+?

- Research shows the best 2nd layers have *few, transformative* upgrades (CH Outsiders:
  7; AD Time Studies: a dozen serious ones before the filler).
- A small tree with respec is *deep* — players experiment with different path combos.
- Implementation cost: 12 nodes × ~10 lines each + tree renderer reuse = cheap.

### Why log-based EE instead of root-based (like prestige)?

- Prestige already uses a root formula (`(cookies/1e¹²)^(1/2.5)`).
- The 2nd layer should feel *differently shaped* — log makes early gains fast but
  every subsequent transcendence rewarding.
- More importantly, log guarantees every transcendence gives ≥1 EE after the gate,
  which root does not (you can waste a run if you barely cross the threshold).
