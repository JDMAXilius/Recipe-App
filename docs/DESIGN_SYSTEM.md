# 🎨 Design System — "Otto" (base app)

> **Purpose.** The canonical token + component spec for the base recipe app. Derived from two grounded sources: **the mascot's own palette** (see [`MASCOT.md`](./MASCOT.md)) and **real shipping apps pulled from Mobbin** (see [`MOBBIN_COMPARISON.md`](./MOBBIN_COMPARISON.md)). This file supersedes the token sketches in `DESIGN_RESEARCH.md` §2.

**Status:** v1 — tokens defined; components specced; implementation pending
**Last updated:** 2026-07-14

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
