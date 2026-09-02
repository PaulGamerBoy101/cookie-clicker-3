# Asset Audit — Second Prestige Layer

What we can reuse from existing assets vs. what needs new art/sound/UI chrome.

---

## 1. Icons: Zero new art needed for MVP

### Sprite sheets

| Sheet | Size | Slots | Used | Free |
|---|---|---|---|---|
| `public/img/icons.webp` | 1680×1728 | 35×36 = 1260 | 1190 | **70** |
| `public/img/customIcons.png` | 1536×1680 | 32×35 = 1120 | 1120 | 0 (fully packed) |

### What we reuse

| Purpose | How to source | Precedent |
|---|---|---|
| **EE currency icon** (in stats / ascend screen) | Reuse `[19,7]` (heavenly chip) or a star/cosmic icon from rows 14–15 or 25–26 | dailyCrumb reuses `[1,26]` |
| **Transcend button** (on ascend screen) | Reuse `[19,7]` heavenly chip icon with a `frame` overlay, or `[17,0]` (night watch's star) | The vanilla ascend button uses the game's `ascendButton` style |
| **Doctrine node icons** (12 nodes) | Pick existing icons from the 1190 used slots — rows 0–15 have many cosmic/star/heavenly icons already painted | Vanilla heavenly upgrades pick from dozens of slots across the sheet |
| **Achievement icons** (5 achievements) | Pick existing slots — row 26 has achievement icons dailyCrumb already reused | dailyCrumb: `[1,26]`, `[2,26]`, `[3,26]` |
| **Upgrade frames** (bought/unavailable/ghosted) | Reuse `upgradeFrameHeavenly.webp` (the golden frame prestige upgrades use) | All heavenly upgrades already use this |

### What the 70 empty slots are for

The 70 transparent slots in `icons.webp` are available for *future* art if we want a distinct "Eternal Essence crystal" visual identity. They're not needed for the MVP — every Doctrine node and achievement can use a pre-existing icon.

### The fallback: custom image paths

If we want a truly unique icon (e.g., a purple crystal for EE), the game supports `[x, y, url, size]` — a custom image path. This is what the Cat Colony upgrades do (`img/cats/attack-1.png`, frame 0). We could add a **single small PNG** (e.g. `img/eternalEssence.png`, 64×64) and reuse it everywhere. But this is polish, not a blocker.

---

## 2. Sounds: Zero new audio needed

The ascend/prestige flow already has a rich sound palette. The transcendence flow can reuse them directly:

| Sound | Use |
|---|---|
| `charging.mp3` | Transcendence charge-up animation |
| `thud.mp3` | Transcendence impact / breakpoint |
| `cymbalRev.mp3` | Transcendence completion fanfare |
| `choir.mp3` | Transcendence completion (music fallback when muted) |
| `shimmerClick.mp3` | Doctrine node purchase (same sound heavenly upgrades use) |
| `buyHeavenly.mp3` | Alternate purchase sound |
| `levelPrestige.mp3` | Prestige level gain — reuse for EE gain notification |
| `pop1.mp3` / `pop2.mp3` / `pop3.mp3` | Children of a parent node animating in (BuildAscendTree already uses this) |
| `tick.mp3` | Button clicks, confirmation prompts |

No new `.mp3` files needed.

---

## 3. UI Chrome: Zero new chrome needed

| Asset | Use |
|---|---|
| `ascendBox.webp` | Background for the Doctrine tree panel (reuse as-is) |
| `ascendSlot.webp` | Slot background for Doctrine nodes (reuse as-is) |
| `ascendWisp.webp` | Atmospheric wisps behind the tree (reuse as-is) |
| `ascendInfo.webp` | Info panel below the tree (reuse as-is, update text content) |
| `upgradeFrameHeavenly.webp` | The golden frame around each node (reuse as-is) |
| `heavenRing1.webp` / `heavenRing2.webp` | Decorative rings for the EE display (optional) |
| `heavenlyMoney.webp` | Decorative money for the EE counter (optional) |
| `starbg.webp` / `bgStars.webp` / `milkStars.webp` | Background decoration for the transcendence screen |

The Doctrine tree reuses the *exact same* `Game.crate()` renderer (`src/engine/ui/crate.ts`) that already renders heavenly upgrades. It auto-detects `pool='prestige'` and applies the golden frame — we just need to treat `pool='transcend'` the same way (or add a new `pool='transcend'` branch in the crate renderer that applies a slightly different tint).

---

## 4. What *would* need new art (stretch/polish only)

| Item | When | Effort |
|---|---|---|
| A purple "Eternal Essence crystal" icon in the 70 empty slots of `icons.webp` | Phase 2 brand polish | ~1 hour in GIMP/Krita to draw a 48×48 crystal |
| A custom frame for Doctrine nodes (e.g., purple instead of gold) | Phase 2 visual distinction | ~1 hour to tint `upgradeFrameHeavenly.webp` |
| A distinct "transcendence" background (instead of reusing the ascend starfield) | Phase 2 atmosphere | ~1 hour of art |
| A new transcendence-intro animation (instead of reusing the ascend intro) | Phase 2 cinematic | Moderate — currently the ascend intro is a sprite animation with `ascendBox.webp` |

---

## 5. Verdict

**Zero new assets required for the MVP.** The entire second prestige layer can be built from existing icons, sounds, and UI chrome. This is consistent with how `dailyCrumb.ts` and `crackingCookie.ts` were built — they reuse existing `icons.webp` slots without adding any new images.

The only reason to add new art would be:
- **Brand distinction** — making EE look different from heavenly chips (a nice-to-have, not a debut blocker)
- **Phase 2 difficulty** — "Eternal Recipes" challenge modes might want distinct icons

Both are cleanly deferrable.