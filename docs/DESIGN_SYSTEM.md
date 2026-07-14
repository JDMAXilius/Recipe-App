# 🎨 Design System — "Otto" (base app)

> **Purpose.** The canonical token + component spec for the base recipe app. Derived from two grounded sources: **the mascot's own palette** (see [`MASCOT.md`](./MASCOT.md)) and **real shipping apps pulled from Mobbin** (see [`MOBBIN_COMPARISON.md`](./MOBBIN_COMPARISON.md)). This file supersedes the token sketches in `DESIGN_RESEARCH.md` §2.

**Status:** v2 — light-only codification for the full redesign (**Part B below is authoritative
where it extends or contradicts Part A**; Part A kept for token tables + traceability)
**Last updated:** 2026-07-14 (redesign Phase 3)

> **⚠️ D2 — LIGHT ONLY (governs everything):** the app ships the base light token set and the
> user cannot change it. §1.2 dark tokens and §1.4 niche accents stay in code, unused at
> runtime, for future niche *builds*. No theme switcher, no appearance picker, no niche picker
> anywhere in UI. `ThemeContext` is locked to `base.light`.

---

## 0. The one big change from the earlier drafts (and why)

Earlier wireframes (v2–v4) used a **cool-neutral ground** to avoid the overused warm-cream cliché. **That's now reversed — deliberately.** Two reasons:

1. **The mascot decides.** Otto is a hand-painted, warm-light storybook character. Placing him on cool grey-blue reads like a sticker pasted on the wrong app. The whole UI is his world now.
2. **The references agree.** From our Mobbin pulls, **Alma** (the closest aesthetic sibling: illustrated, cozy, nutrition-focused) runs a warm cream ground with earthy accents and a serif for recipe titles — and it's the most premium-feeling app in our comparison set. Kitchen Stories also grounds warm.

Cream is a cliché when it's *inherited*; it's correct when the brand's mascot is literally painted in it. We keep it from feeling generic via the terracotta/chestnut accent system, ink-warm typography, and the watercolor illustration language — not via the background alone.

---

## 1. Color tokens

### 1.1 Brand & neutrals (light theme)

| Token | Hex | From | Usage |
|---|---|---|---|
| `color.accent` | `#C4562E` | Otto's apron (terracotta) | primary actions, active states, brand moments |
| `color.accentSoft` | `#F3D9CD` | apron tint | selected chips, highlights, mascot-adjacent fills |
| `color.secondary` | `#8A5A3B` | Otto's fur (chestnut) | secondary buttons, icons, illustration accents |
| `color.gold` | `#E8B04B` | golden light | ratings, streaks, small celebratory accents |
| `color.bg` | `#FAF4EA` | Otto's cream world | app background |
| `color.surface` | `#FFFFFF` | — | cards, sheets |
| `color.surfaceWarm` | `#F3E9DA` | belly/hat cream | grouped rows, wells, inset surfaces |
| `color.ink` | `#2A211B` | eyes/linework (warm near-black) | primary text |
| `color.inkSoft` | `#6E6055` | — | secondary text |
| `color.border` | `#E8DECF` | — | hairlines, card borders |

### 1.2 Dark theme (warm dark — never grey-black)

| Token | Hex | Note |
|---|---|---|
| `color.bg` | `#1E1712` | warm espresso, keeps Otto's world at night |
| `color.surface` | `#2A211B` | |
| `color.surfaceWarm` | `#332822` | |
| `color.ink` | `#F3E9DA` | cream text on espresso |
| `color.inkSoft` | `#B9A895` | |
| `color.border` | `#3E322A` | |
| `color.accent` | `#E0774E` | terracotta lifted for contrast on dark |
| `color.secondary` | `#B98A66` | |

### 1.3 Nutrition colors (functional — FIXED across themes & niches)

Per the Mobbin finding (no universal standard; fat=purple is the one real convention — MyFitnessPal + Lifesum):

| Token | Hex | Meaning |
|---|---|---|
| `color.protein` | `#3B82F6` | protein (blue) |
| `color.carbs` | `#F0A020` | carbs (amber) |
| `color.fat` | `#8B5CF6` | fat (purple) |

These never re-skin. Green stays reserved for the Keto niche accent; red/destructive stays `#D64545`.

### 1.4 Niche accents (Phase 2 — swap `color.accent`/`accentSoft` + mascot apron only)

| App | accent | Notes |
|---|---|---|
| Lean | `#10B3A3` | fresh teal |
| Keto | `#2E8B4E` | earthy green (niche convention) |
| Bulk | `#F5793B` | energetic orange |

**Contrast requirements:** body text ≥ 4.5:1 on `bg` and `surface`; accent-on-white used at ≥ 3:1 for large UI only; white text on `accent` passes for buttons. Verify per niche accent at implementation.

---

## 2. Typography

System fonts only (zero bundle cost, native feel — both are iOS system faces):

| Role | Face | Size/weight | Usage |
|---|---|---|---|
| `type.display` | **New York (serif)** | 30/800 | recipe titles, featured headlines — the "Alma move": serif = editorial food warmth |
| `type.title` | SF Pro Rounded | 22/700 | screen titles, section headers |
| `type.body` | SF Pro Rounded | 15/400 | ingredients, instructions, general UI |
| `type.label` | SF Pro Rounded | 13/600 | buttons, chips, tab labels |
| `type.caption` | SF Pro (mono digits) | 12/500, +0.04em, uppercase | "PER SERVING", stat labels; `tabular-nums` for all numerals |

Android fallbacks: serif → Roboto Serif; rounded → Roboto (or bundle Nunito if roundness matters enough to pay for it).
Rules: line-height 1.45 body / 1.1 display; max ~34ch line length for instructions; numbers always tabular.

## 3. Space, shape, elevation

| Group | Values |
|---|---|
| Spacing (4-pt) | 4 · 8 · 12 · 16 · 24 · 32 — default gutter 16, section gap 24 |
| Radius | cards 20 · sheets 24 (top) · buttons 14 · chips/pills 999 · mascot frames 24 |
| Elevation | soft & warm: `0 2px 12px rgba(42,33,27,0.08)` (light) — never hard drop shadows |
| Hairlines | 1px `color.border` |

## 4. Illustration & imagery language

- **Mascot:** per `MASCOT.md` — onboarding, empty/loading states, Profile, small header greeting. Never on content cards.
- **Watercolor accents:** faint painted washes/steam wisps allowed in onboarding + empty states only. UI chrome itself stays flat and clean — *cozy art inside calm UI*.
- **Food photography:** full-bleed in cards, radius 20, no overlays darker than 40%; calorie badge and cook-time chip sit on the image (Mobbin: Lifesum, Kitchen Stories).

## 5. Motion & haptics

| Event | Motion | Haptic (`expo-haptics`) |
|---|---|---|
| Save/favorite | bookmark pop (spring, 1→1.15→1) | `impactMedium` |
| Serving stepper tick | number crossfade + bar re-layout (200ms) | `selection` |
| Calorie ring on detail open | sweep from 0 (500ms ease-out) | — |
| Sheet open/close | native spring sheet | `impactLight` on open |
| Tab switch | none (instant) | `selection` |
| Reduced motion | all sweeps/pops → simple fades | keep haptics |

## 6. Core components (specs)

All validated against Mobbin references (`MOBBIN_COMPARISON.md`):

1. **NutritionCard** — `surface`, radius 20, padding 16. Left: **CalorieRing** (64px, `accent` sweep, big kcal number + "PER SERVING" caption). Right: 3 **MacroBars** (8px tracks, radius 999, fixed macro colors, grams + % labels). Footer: **ServingStepper** + US/Metric toggle.
2. **ServingStepper** — `Serves − N +` pill row; scales ingredient quantities & recipe totals; **per-serving nutrition constant** (Kitchen Stories model).
3. **RecipeCard** — image top (5:4), calorie badge top-right (surface pill + accent dot), cook-time chip bottom-left on image; title (2 lines) + 3 macro dots below.
4. **FilterSheet** — native bottom sheet, grab handle, chip groups (Category/Cuisine/Sort), footer `Clear all` + `Show N recipes` (live count).
5. **Chips** — pill, `surfaceWarm` idle / `accent` selected (white label).
6. **Buttons** — primary: `accent` fill, radius 14, label 15/600 white; secondary: `surfaceWarm` + `ink`; destructive: outline `#D64545`.
7. **Tab bar** — 4 tabs (Recipes/Search/Saved/Profile), frosted (`expo-blur`) over `bg`, active = `accent`, SF Symbols on iOS.
8. **EmptyState / LoadingState** — Otto expression (Sad/Sleepy) + one-line message + optional action; watercolor wash permitted.
9. **MascotBadge** — 32–40px circular crop of Otto's face for headers.

## 7. Implementation mapping (when we build)

- `mobile/constants/colors.js` → restructure to export this token set; `THEMES` becomes `{base, lean, keto, bulk}` each `{light, dark}`; macro colors exported separately as `NUTRITION_COLORS` (never themed).
- Runtime theming per `PROMPT_ENGINEERING.md` **F1** (ThemeContext + `useTheme()`).
- Mascot PNGs live in `mobile/assets/mascot/` (download from CDN — see `MASCOT.md` §2 warning).
- New components in `mobile/components/nutrition/` (`CalorieRing`, `MacroBar`, `ServingStepper`, `NutritionCard`).

## 8. Traceability

| Decision | Grounded in |
|---|---|
| Warm cream ground | Otto's palette + Alma (Mobbin) |
| Serif recipe titles | Alma (Mobbin) |
| Terracotta accent | Otto's apron |
| Macro blue/amber/purple | MyFitnessPal + Lifesum (Mobbin) — fat=purple is the one convention |
| Serving model | Kitchen Stories (Mobbin) — scales ingredients, per-serving constant |
| Calorie badge on cards | Lifesum, MyFitnessPal (Mobbin) |
| Filter sheet anatomy | Beli, eBay, Vivino (Mobbin) |
| Warm dark mode | standard practice for warm-brand apps; keeps mascot coherent at night |

---
---

# Part B — Redesign codification (Phase 3, 2026-07-14) — AUTHORITATIVE

> Locks every system decision the Phase-4 screens build against. Sources: `AUDIT.md`,
> `MOBBIN_COMPARISON.md` Part 2, `REDESIGN_NOTES.md` (P2-1…P2-11). Code is truth: tokens in
> `mobile/constants/colors.js` + `mobile/constants/tokens.js`; theme lock in
> `mobile/context/ThemeContext.jsx`.

## B1. Tokens — light-only truth

- **Palette:** Part A §1.1 light table is complete and final. No new colors. Scrims/overlays are
  now tokens too (they were the stragglers): `overlay.scrim = rgba(42,33,27,0.35)` (photo
  overlays — warm ink, never pure black), `overlay.scrimStrong = rgba(42,33,27,0.65)` (hero
  gradient foot), `overlay.textShadow = rgba(42,33,27,0.45)`. Exported from `tokens.js`.
- **Runtime lock:** `ThemeContext` pins `niche="base"`, `mode="light"`; `setNiche`/`setMode`
  removed from the public API. `app.json` → `"userInterfaceStyle": "light"`.
- **Hardcoded-value ledger (to purge in Phase 4):**
  1. `app/recipe/[id].jsx:182–277` — four gradient pairs (`#FF6B6B/#FF8E53`, `#4ECDC4/#44A08D`,
     `#FF0000/#CC0000`, `#9C27B0/#673AB7`) — all die with the rainbow section icons.
  2. `app/recipe/[id].jsx:134` + `recipe-detail.styles.js:40,71,85` + `home.styles.js:56,80` —
     black rgba scrims/text-shadows → `overlay.*` tokens.
  3. `app/(tabs)/index.jsx:107-128` — inline `width/height: 100` on the farm-animal images —
     die with the images (D5).
  4. Spacing/radius/type literals in style factories: legal for now, migrate to `tokens.js`
     scales opportunistically as each screen is rebuilt (no big-bang sweep).

## B2. Typography (revised — implementable truth)

Part A specced New York + SF Pro Rounded. **Neither is reachable from React Native without
native font-descriptor work** (RN exposes neither iOS's serif design axis nor the rounded axis),
and the Figma library already substituted **Lora** for Display. v2 aligns code with Figma:

| Role | Face | Size/weight | Usage |
|---|---|---|---|
| `type.display` | **Lora Bold** (bundled, `@expo-google-fonts/lora`) | 30/700 | recipe titles, featured headline, greeting |
| `type.title` | Lora SemiBold | 22/600 | screen titles, section headers |
| `type.body` | System (SF Pro / Roboto) | 15/400, lh 1.45 | ingredients, steps, UI |
| `type.label` | System Semibold | 13/600 | buttons, chips, tab labels |
| `type.caption` | System Medium | 12/500, +0.04em, uppercase, `fontVariant: ['tabular-nums']` | "ESTIMATED PER SERVING", stat labels |
| `type.step` | System | ≥24/400, lh 1.35 | cook-mode step text (kitchen distance) |

Rules: serif is a *display* voice only — never on buttons/labels/body; numbers always tabular;
max ~34ch line length for steps; Dynamic Type respected (never disable font scaling).

## B3. Motion spec — named springs (reanimated), not durations

| Name | Config | Used for |
|---|---|---|
| `spring.gentle` | `{ damping: 18, stiffness: 120, mass: 1 }` | screen/element entrances, layout shifts |
| `spring.snappy` | `{ damping: 15, stiffness: 220, mass: 0.8 }` | chips select, segmented moves, stepper ticks |
| `spring.pop` | `{ damping: 12, stiffness: 320, mass: 0.7 }` + scale 1→1.25→1 | **THE SIGNATURE: paw-pop on save** — paw inks in, pops, settles |
| `spring.sheet` | `{ damping: 22, stiffness: 260, mass: 1 }` | sheets, cook-mode present/dismiss |
| `timing.sweep` | 500ms ease-out | CalorieRing sweep on detail open (0→value, once) |
| `timing.fade` | 200ms | crossfades, skeletons, reduced-motion fallback for ALL of the above |

Rules: everything interruptible; nothing animates on scroll; entrances ≤ 3 elements staggered
40ms; `AccessibilityInfo.isReduceMotionEnabled()` → swap springs/sweeps for `timing.fade`.
One signature moment per screen maximum — the paw-pop is the app's.

## B4. Haptic map (expo-haptics) — exhaustive; nothing off-table vibrates

| Event | Call | Why |
|---|---|---|
| Save (paw-pop) | `notificationAsync(Success)` | the emotional beat of the app |
| Unsave | `impactAsync(Light)` | acknowledged, not celebrated |
| Undo (toast) | `selectionAsync()` | state restored |
| Category/filter chip select | `selectionAsync()` | discrete choice |
| Serving stepper tick | `selectionAsync()` | discrete increments |
| Cook-mode step advance | `impactAsync(Medium)` | thumb-sized commitment, messy hands |
| Cook-mode finish (Proud Otto) | `notificationAsync(Success)` | completion |
| Sign-in/up success | `notificationAsync(Success)` | doorway moment |
| Destructive confirm (sign out / delete / remove-saved dialog confirm) | `notificationAsync(Warning)` | consequence |
| Tab switch | `selectionAsync()` | (kept from current profile behavior, extended to all tabs) |
| **Never:** scroll, load, appear, video play, keyboard, errors-from-typing | — | haptics = state changes the user caused |

## B5. Icon spec

- **One family: Ionicons** (incumbent, zero new deps) — **outline variants only** at rest;
  filled variant allowed solely as an "active/selected" state of the same glyph. One optical
  size per context (tab 24, inline 18, meta 14). Never mix a second library.
- **Custom Otto-drawn marks** (SVG, drawn from the mascot's linework — Phase 4 assets):
  1. **Paw-mark** — THE save mark: outline = unsaved, terracotta-inked = saved. Replaces heart
     AND bookmark everywhere (cards, detail, Saved tab icon).
  2. **Tab glyphs** — Discover (steam-curl over a pan), Saved (paw), Account (apron bow) —
     watercolor-weight strokes, readable silhouettes, labels always on.
  3. Macro dot glyphs stay plain circles (data, not personality).
- **Rainbow gradient section icons: banned.** Section headers in detail get plain
  `inkSoft` Ionicons or no icon at all — the serif title does the work.

### B5.1 Food-icon set (D5) — hand-painted, Otto's exact style

Replaces TheMealDB photo-thumb category chips + the farm-animal PNGs. Generated from Otto's hero
as image reference (MASCOT.md §7 technique: lock-phrase, qualities-only, 2 takes, never name a
studio), each on the shared `surfaceWarm` warm-tint field, consistent scale, soft shadow:

| # | Asset | Covers TheMealDB category |
|---|---|---|
| 1 | roast joint on board | Beef |
| 2 | roast chicken leg | Chicken |
| 3 | glazed cake slice | Dessert |
| 4 | chop with rosemary | Lamb |
| 5 | steaming mixed bowl | Miscellaneous |
| 6 | pasta nest w/ fork | Pasta |
| 7 | ham/bacon curl | Pork |
| 8 | whole fish on plate | Seafood |
| 9 | small side dish bowl | Side |
| 10 | soup cup w/ steam | Starter |
| 11 | vegetable basket | Vegan |
| 12 | garden salad bowl | Vegetarian |
| 13 | egg + toast plate | Breakfast |
| 14 | stew pot | Goat |

Spec: 512px source PNGs → rendered ~72pt in category tiles; one unifying warm tint behind all;
label below in sentence case. File names `mobile/assets/food/cat-<category>.png`.

## B6. Otto usage rules (D3) — where he lives, where he's banned

**Two scales, reserved territory** (`MOBBIN_COMPARISON.md` §2.3/§2.7):

| Surface | Otto | Asset |
|---|---|---|
| Sign-up | LARGE (~40% h) hero, mid-gesture | `otto-hero.png` |
| Sign-in | small vignette by the form | `otto-happy.png` (cropped scene) |
| Discover greeting band | small (≤15% h), scrolls away | `otto-happy.png` |
| Saved empty (first-run) | full-screen Sad + empty recipe book | `otto-scene-empty.png` |
| Search-empty (no results) | small Thinking, above keyboard | `otto-thinking.png` |
| Offline / server error | full-screen Sad | `otto-sad.png` |
| Cold-start loading ONLY | Sleepy + rotating cooking tip | `otto-scene-loading.png` |
| Cook-mode finish | full-screen Proud, sparse confetti | `otto-proud.png` |
| First save (once, ever) | Excited toast-card | `otto-excited.png` |
| Account identity badge | bust-crop badge (B7) | `otto-badge.png` (new) |

**Banned:** toasts/snackbars (except the one first-save card), inline banners, confirm dialogs,
routine fetch loading, recipe steps/ingredients, over food photography, more than one Otto per
screen. If a screen would look identical with Otto removed it isn't done — but if Otto covers
content, he's fired from that screen.

**Otto's voice — five canonical specimens** (plain verbs, sentence case, ≤2 short sentences;
third-person warm narrator, NEVER first-person "I" — one narrator across the whole app):

1. *Error:* "We dropped the pan. Try again in a bit."
2. *Empty (Saved):* "Nothing saved… yet. Tap the paw on any recipe and Otto will keep it here."
3. *Completion (cook mode):* "Dinner, done. Otto's proud of you."
4. *Sign-in headline:* "Back to the kitchen?" — sub "Otto kept your place."
5. *Permission ask (notifications, future):* "Otto can remind you when it's time to cook. Only
   if you want."

Export rules: PNGs render at ≥2px per displayed pt (no scaling to mush); minimum display 48pt;
never stretch, tint, flip, or outline the artwork; transparent-background cutouts required for
in-UI use (opaque scene PNGs only as full-bleed illustrations).

**Animated Otto (D4): NOT in this redesign.** Separate approve-first proposal:
`docs/OTTO_ANIMATION_PLAN.md`.

## B7. App icon + badge fix (D6)

- **Badge (`otto-badge.png`, new asset):** purpose-cut BUST from the hero — hat peak sits 8–12%
  of diameter below circle top, head (hat incl.) spans 60–70% of diameter, crop exits bottom
  only at mid-chest, flat terracotta disc behind. Fixes the Profile crop that beheads the hat.
  Used at 32–40pt (headers) and 56pt (Account).
- **App icon:** keep option-B art, recompose with ~12% more padding so the hat clears iOS
  corner masking; same composition exported for `adaptive-icon` (Android foreground, safe-zone
  66%), `splash-icon` (centered on `bg` cream), and `favicon`. Kills the last stock-Expo assets.

## B8. Component deltas vs Part A §6

- **Tab bar** → 3 tabs `Discover · Saved · Account` (P2-1), custom glyphs (B5), frosted blur
  stays, labels always on.
- **RecipeCard** → photo ~70% card height, ONE cream pill on photo (cook time only when real —
  i.e., not from TheMealDB fabrication → v1 shows category pill instead), title 2 lines below,
  paw-mark top-right (in-place save/unsave + undo toast). Calorie badge & macro dots REMOVED
  from cards (placeholder data doesn't get card-level precision — supersedes Part A §6.3).
- **NutritionCard** → stays the centerpiece; adds "ESTIMATED PER SERVING" caption, `~` rounded
  kcal, footnote "Estimates based on typical ingredients." Stepper scales the estimate framing
  only — never ingredient strings (P2-6).
- **FilterSheet** → deferred to post-v1 (search merges into Discover; category tiles + query
  cover v1 filtering).
- **EmptyState/LoadingState/MascotBadge** → per B6/B7.
- **NEW: CookMode pager** — Step N of M, `type.step`, giant Next (min 88pt tall), ingredients
  peek sheet, `useKeepAwake()`, progress segments, Proud-Otto finish.
