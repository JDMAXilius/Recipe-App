# 🎨 Design Research & UI Direction — Recipe App

> **Scope: front-end / UI only.** This document is about *how the app looks and feels*, not functionality. It captures competitive research, a recommended design system, patterns for showing **calories, macros, and serving sizes**, a **brand/mascot** direction, and the **multi-app niche strategy** (weight-loss / keto / bulking). It ends with an updated sitemap and low-fi wireframe concepts. Principle throughout: **less is more.**

**Last updated:** 2026-07-14

---

## 0. TL;DR — the direction in six lines

1. **Move from "playful clip-art" → "clean, warm, modern health app."** Keep friendliness, lose the childish feel.
2. **One core design system, re-skinned per niche.** Shared components; each niche app changes color + mascot outfit only.
3. **Calories = a ring. Macros = 3 color-coded bars** (protein / carbs / fat). This is the industry-standard mental model — don't reinvent it.
4. **Serving size = a simple stepper** that live-scales ingredients. One control, big win.
5. **Adopt a friendly mascot** (à la Yazio's "Yettie") as the brand anchor — one character, recolored per niche.
6. **Ruthless minimalism:** generous whitespace, bold type, one accent color per screen, micro-interactions for delight.

---

## 1. What the research says

### 1.1 2026 mobile design trends (recipe/health)
The consistent themes across trend reports: **minimalism** (whitespace, unified palette, remove clutter), **bold typography** for hierarchy/readability, **dark mode** as a baseline expectation, and **micro-interactions** (subtle animation + haptics) for feedback and delight. Gesture-driven navigation is replacing heavy button chrome. → *Sources: [DesignStudio](https://www.designstudiouiux.com/blog/mobile-app-ui-ux-design-trends/), [Tubik](https://tubikstudio.com/blog/ui-design-trends-2026/), [Natively](https://natively.dev/blog/best-mobile-app-design-trends-2026).*

**Implication for us:** the current animal clip-art + heavy gradients read as "kids' app." The upgrade is *calmer*: more whitespace, bigger food photography, one accent color, restrained gradients.

### 1.2 How the best nutrition apps present data
- **MyFitnessPal** — clean, database-driven, approachable; the benchmark for "friendly + functional."
- **Cronometer** — extremely detailed macros/micros, but the interface "can feel overwhelming for beginners." → *the cautionary tale; we deliberately show less.*
- **Lifesum** — praised for an easy, mindful, well-designed food diary + recipes.

The dominant **data-viz pattern**: a **daily calorie ring** (goal / consumed / remaining) paired with **color-coded macro bars**. A widely used convention: **protein = violet, carbs = gold/amber, fat = green** (water = blue), kept consistent on every screen so progress reads at a glance. Backgrounds stay white/clean; pastel accents highlight sections without overwhelming. → *Sources: [Nutrisense](https://www.nutrisense.io/blog/apps-to-track-nutrition), [Fortune](https://fortune.com/article/best-nutrition-apps/), [Simple Nutrition dev blog](https://zthh.dev/blogs/dev-blog-simple-nutrition-macro-tracker-part-1-designing-views-in-figma), [Nutrio UI Kit](https://www.figma.com/community/file/1405833265093338268/nutrio-calorie-counter-app-ui-kit).*

### 1.3 Serving sizes / portions
Best practice = a **serving stepper** (e.g. "Serves 4" with − / +) or a **multiplier** (0.5× / 1× / 2×) that **live-scales ingredient quantities**. Round to friendly fractions (½ cup, not 0.5). Note some ingredients (spices, leaveners) don't scale linearly — a UI caveat, not a v1 blocker. → *Sources: [SideChef UX best practices](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites), [Samsung Food converter](https://samsungfood.com/recipe-converter/).*

### 1.4 Mascots in food/health branding
Mascots make health "approachable" — the standout reference is **Yazio's "Yettie,"** a soft, rounded, friendly creature in light tones that makes healthy habits feel comforting. Mascots work best when **relatable and expressive** (Tony the Tiger, Chester Cheetah). The trick for us: a mascot that reads *friendly and modern*, **not** childish — rounded, minimal, few colors. → *Sources: [Tubik – mascots in UI](https://blog.tubikstudio.com/design-me-live-the-power-of-mascots-in-ui-and-branding/), [Designhill – food mascots](https://www.designhill.com/design-blog/top-mascot-logos-in-food-branding/), [Looka](https://looka.com/blog/logo-mascots/).*

### 1.5 One app vs. many niche apps
History swings both ways (the "unbundling" of 2013–14, re-bundling after). The durable insight: **single-purpose apps win on focus, faster iteration, and speaking directly to one audience's pain** — as long as they share infrastructure so you're not rebuilding each one. The recommended model is an **"app constellation": one shared design system + codebase, multiple niche skins.** → *Sources: [RevenueCat – portfolio vs single-app](https://www.revenuecat.com/blog/growth/app-portfolio-vs-single-app/), [Medium – app constellation](https://medium.com/@MickyT/thoughts-on-the-mobile-app-constellation-strategy-7fdd64efce86), [DZone](https://dzone.com/articles/single-purpose-or-multi-purpose-app-which-option-i).*

**Implication:** design the UI now as a **themeable system** (you already have 8 themes in `colors.js`!). Each future niche app = a color theme + mascot variant + default content filter. No UI rebuild.

---

## 2. Recommended design system

Keep it small and token-driven. This maps cleanly onto the existing `constants/colors.js` + `assets/styles/*` structure.

### 2.1 Foundations (design tokens)
| Token group | Recommendation |
|---|---|
| **Color — base** | White/near-white backgrounds, near-black text, soft borders. Reuse the existing 8 palettes as *niche skins*. |
| **Color — accent** | **One** brand accent per niche (weight-loss teal, keto green, bulking orange — see §4). |
| **Color — macros (fixed, never re-skinned)** | Protein `#7C5CFC` (violet), Carbs `#F5A524` (amber), Fat `#22C55E` (green). Consistent everywhere. |
| **Typography** | One family, bold weights for hierarchy. Scale: Display 32 / Title 24 / Section 18 / Body 15 / Caption 13. |
| **Spacing** | 4-pt grid: 4 / 8 / 12 / 16 / 24 / 32. Lean on 16 & 24 for breathing room. |
| **Radius** | Cards 16–20, chips/pills 999 (full), buttons 14. Soft, not sharp. |
| **Elevation** | Very soft shadows (low opacity, large blur) — no heavy drop shadows. |
| **Dark mode** | Add a dark variant per theme (currently missing). Baseline expectation for 2026. |

### 2.2 Core components (the whole kit — deliberately short)
- **RecipeCard** (redesigned: bigger image, calorie badge, macro dots)
- **CalorieRing** (circular progress; the hero stat)
- **MacroBar** ×3 (protein/carbs/fat, color-coded, grams + %)
- **ServingStepper** (− / value / +, live-scales ingredients)
- **NutritionCard** (groups CalorieRing + 3 MacroBars + serving info)
- **FilterChip** (already exists as CategoryFilter — restyle)
- **PrimaryButton / IconButton** (with `expo-haptics` feedback)
- **Tab bar** (frosted via `expo-blur`, SF Symbols via `expo-symbols` on iOS)
- **EmptyState / LoadingSpinner** (keep, restyle)
- **MascotBadge** (the brand character, used in headers/empty states/onboarding)

> Everything else is composition. If a screen needs a component not on this list, question whether the screen is doing too much.

### 2.3 iOS-native feel levers (already installed, unused)
`expo-haptics` (tap feedback), `expo-symbols` (SF Symbols), `expo-blur` (frosted bars). Turning these on is most of the "premium iOS" jump — no new dependencies.

---

## 3. Presenting calories, macros & serving size (UI spec)

This is the core new content. Three components carry it.

### 3.1 CalorieRing (the hero number)
- Circular progress ring; big number in the center (e.g. **`520 kcal`**), label "per serving" beneath.
- On a recipe: shows kcal **per serving** (recalculates when the serving stepper changes).
- Placement: top of the NutritionCard on Recipe Detail; a small badge on RecipeCard.

### 3.2 MacroBars (the breakdown)
- Three horizontal bars, fixed colors: **Protein (violet) · Carbs (amber) · Fat (green)**.
- Each shows grams + % of the recipe's calories (e.g. `Protein 32g · 25%`).
- Compact variant = three colored dots with gram counts (for RecipeCard footer).

### 3.3 ServingStepper (portions)
- `Serves [ − ] 4 [ + ]`. Changing it **live-scales the ingredient quantities and the recipe total** — but **per-serving nutrition stays constant** (that's how recipe scaling actually works). The CalorieRing keeps showing kcal *per serving*; the stepper changes how much you cook, optionally surfacing a scaled "recipe total."
- Round to friendly fractions (4 tbsp → ¼ cup). Note: spices/leaveners don't scale linearly — flag rather than blindly multiply. This single control is the highest-value new interaction.

### 3.4 Where they live
```
Recipe Detail
 ├── Hero image + title + MascotBadge (small)
 ├── NutritionCard
 │     ├── CalorieRing (per serving)   ← NEW
 │     ├── MacroBars ×3                ← NEW
 │     └── ServingStepper              ← NEW (drives the two above + ingredients)
 ├── Ingredients (quantities scale with stepper)
 └── Instructions
```
RecipeCard (grid): image → title → **calorie badge** + **3 macro dots** → time/serves. So nutrition is visible *before* opening a recipe.

---

## 4. Brand & mascot direction

### 4.1 The problem with today's look
Animal clip-art (lamb/chicken/pork) + rainbow gradients = reads "kids' app." You want **friendly, not childish** — the Yazio/Yettie zone: soft, rounded, minimal, modern.

### 4.2 Recommended mascot approach
- **One mascot, recolored per niche.** A simple, rounded character (few shapes, 2–3 colors) that can wear a niche "accent." Examples of a workable concept: a round chef-hat blob, a friendly pot/pan character, or a cheerful vegetable — kept **geometric and flat**, not detailed/cartoony.
- **Expressive but restrained:** 3–4 poses (welcome, empty-state, success, loading). Used sparingly — headers, empty states, onboarding — never cluttering content screens.
- **Logo:** wordmark + mascot lockup; mascot alone as the app icon. Each niche app icon = same mascot, niche accent color + a tiny prop (dumbbell = bulking, leaf = keto, etc.).

### 4.3 Niche skins (color + personality)
| App | Audience | Accent | Personality | Mascot prop |
|---|---|---|---|---|
| **Base / "all recipes"** | general | warm neutral (coffee/terracotta) | approachable, homely | chef hat |
| **Lean** (weight-loss / low-cal) | cutting | **teal / fresh green** | light, motivating, clean | measuring tape / leaf |
| **Keto** | keto dieters | **deep green + earthy tan** (industry norm) | confident, natural, rich | avocado |
| **Bulk** (muscle gain) | bulking | **bold orange / energetic** | strong, high-energy | dumbbell |

> Keto's green/earthy palette is the established convention in that niche — lean into it. Bulking skews warm/energetic; weight-loss skews light/fresh. All three inherit the **same components and the fixed macro colors** — only the accent + mascot prop change.

---

## 5. Multi-app niche strategy (UI architecture)

**"App constellation" model — one design system, many skins:**

```
        ┌─────────────────────────────┐
        │   Shared Design System      │  tokens · components · mascot
        │  (this repo's UI layer)     │
        └──────────────┬──────────────┘
        ┌──────────────┼──────────────┐
     ┌──▼──┐        ┌───▼───┐       ┌──▼──┐
     │Lean │        │ Keto  │       │Bulk │   ← each = accent theme + mascot prop
     │(teal)│       │(green)│       │(orange)│    + default recipe filter
     └─────┘        └───────┘       └─────┘
```

- **Nothing about the layouts changes between apps** — only the theme token set + mascot variant + the default nutrition filter (low-cal / high-fat-low-carb / high-protein).
- You already have the mechanism half-built: `THEMES` in `colors.js`. The work is (a) make theme **reactive** (see `PROMPT_ENGINEERING.md` F1), (b) add a **macro color set** and **niche accent** to each theme, (c) add a **mascot variant** slot.
- This keeps "less is more" true at the *portfolio* level: each app feels laser-focused, but you maintain one UI.

---

## 6. Updated sitemap (UI-focused, with new nutrition surfaces)

New/changed nodes marked **★**.

```
Root
│
├── Onboarding ★            (new — 2–3 friendly mascot slides, per-niche intro)
│
├── (auth)
│   ├── sign-in            (restyled: mascot, cleaner form)
│   └── sign-up            (restyled)
│
└── (tabs)   [frosted tab bar ★]
    ├── Home / Recipes
    │     ├── MascotBadge greeting ★
    │     ├── Featured recipe (calorie badge ★)
    │     ├── Category / niche filter chips
    │     └── Recipe grid → RecipeCard (calorie badge + macro dots ★)
    │
    ├── Search
    │     ├── Search field
    │     ├── Filter chips (category / macro-aware ★)
    │     └── Results grid (nutrition-annotated cards ★)
    │
    ├── Favorites
    │     └── Saved recipe grid (nutrition-annotated ★)
    │
    └── Profile ★            (new tab — email, theme/niche picker, dark mode, sign out)
          └── moves logout here from the Favorites header

Recipe Detail  [full screen]
    ├── Hero image + title + small MascotBadge ★
    ├── NutritionCard ★
    │     ├── CalorieRing (per serving) ★
    │     ├── MacroBars ×3 ★
    │     └── ServingStepper ★  → live-scales ingredients + nutrition
    ├── Ingredients (scaled quantities ★)
    ├── Video tutorial
    └── Instructions
```

**Net new screens:** Onboarding, Profile. **Net new components:** CalorieRing, MacroBar, ServingStepper, NutritionCard, MascotBadge, calorie/macro annotations on RecipeCard.

> Note (front-end only, per your scope): real calorie/macro *values* need a data source later (TheMealDB doesn't provide them). For now the UI can render from **placeholder/estimated values** so we design the screens; wiring real data is a separate, later step.

---

## 7. Low-fi wireframe concepts

ASCII sketches of the four screens that change most. (A visual version is delivered alongside this doc.)

### 7.1 Recipe Detail (the big one)
```
┌─────────────────────────────┐
│  ◀           🐣        ♡     │  hero image, mascot, save
│        [ FOOD PHOTO ]        │
│  Grilled Salmon Bowl         │
│  🍽 Mediterranean            │
├─────────────────────────────┤
│  ╭─────╮   Protein ▓▓▓▓░ 32g │
│  │ 520 │   Carbs   ▓▓░░░ 18g │  NutritionCard
│  │ kcal│   Fat     ▓▓▓░░ 24g │  ring + macro bars
│  ╰─────╯                      │
│      Serves  [ − ]  4  [ + ] │  ← scales everything
├─────────────────────────────┤
│  Ingredients            (6)  │
│  ① 2 cups quinoa            │  quantities update
│  ② 4 fillets salmon        │  with the stepper
│  ...                         │
├─────────────────────────────┤
│  Instructions           (5)  │
│  ...                         │
└─────────────────────────────┘
```

### 7.2 RecipeCard (grid item)
```
┌───────────────┐
│  [ PHOTO ]    │
│         520 ● │  calorie badge
│ Salmon Bowl   │
│ ●32 ●18 ●24   │  macro dots (violet/amber/green)
│ ⏱30m   🍽4    │
└───────────────┘
```

### 7.3 Home
```
┌─────────────────────────────┐
│  🐣  Hey! What's cooking?    │  mascot greeting
│  ┌───────────────────────┐  │
│  │  FEATURED  [ photo ]  │  │  featured w/ calorie badge
│  │  Poke Bowl    480 ●   │  │
│  └───────────────────────┘  │
│  ( Chicken )( Keto )( Beef ) │  filter chips
│  ┌────────┐ ┌────────┐      │
│  │ card   │ │ card   │      │  nutrition-annotated grid
│  └────────┘ └────────┘      │
└─────────────────────────────┘
```

### 7.4 Profile (new)
```
┌─────────────────────────────┐
│         🐣                    │
│    juan@email.com            │
├─────────────────────────────┤
│  Theme / Niche   ( Lean ▾ )  │  ← swaps accent + mascot
│  Dark mode          ●──      │
│  Units          (metric ▾)   │
├─────────────────────────────┤
│         Sign out             │
└─────────────────────────────┘
```

---

## 8. Recommended next steps

1. **Lock the brand direction** — pick the mascot concept (chef-hat blob / pot / veggie) and the first niche to prototype (Lean, Keto, or Bulk).
2. **Approve the design tokens** (accent per niche + fixed macro colors + type scale).
3. **Design in Figma** — I generate the NutritionCard, RecipeCard, and Recipe Detail into your Figma so we iterate visually; feed in **Mobbin** screenshots for reference.
4. **Build the shared component kit** (CalorieRing, MacroBars, ServingStepper, MascotBadge) against the reactive theme system.
5. **Prove the constellation** — flip the theme to show the same screens as Lean / Keto / Bulk.

> Everything above is **UI-only**. Real nutrition data, functional theme switching, and per-app builds are separate workstreams we can sequence after the look is locked.

---

### Sources
- Trends: [DesignStudio](https://www.designstudiouiux.com/blog/mobile-app-ui-ux-design-trends/) · [Tubik 2026](https://tubikstudio.com/blog/ui-design-trends-2026/) · [Natively](https://natively.dev/blog/best-mobile-app-design-trends-2026)
- Nutrition apps & data-viz: [Nutrisense](https://www.nutrisense.io/blog/apps-to-track-nutrition) · [Fortune](https://fortune.com/article/best-nutrition-apps/) · [Simple Nutrition dev blog](https://zthh.dev/blogs/dev-blog-simple-nutrition-macro-tracker-part-1-designing-views-in-figma) · [Nutrio UI Kit](https://www.figma.com/community/file/1405833265093338268/nutrio-calorie-counter-app-ui-kit)
- Serving size: [SideChef](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites) · [Samsung Food](https://samsungfood.com/recipe-converter/)
- Mascots: [Tubik](https://blog.tubikstudio.com/design-me-live-the-power-of-mascots-in-ui-and-branding/) · [Designhill](https://www.designhill.com/design-blog/top-mascot-logos-in-food-branding/) · [Looka](https://looka.com/blog/logo-mascots/)
- Niche strategy: [RevenueCat](https://www.revenuecat.com/blog/growth/app-portfolio-vs-single-app/) · [App constellation](https://medium.com/@MickyT/thoughts-on-the-mobile-app-constellation-strategy-7fdd64efce86) · [DZone](https://dzone.com/articles/single-purpose-or-multi-purpose-app-which-option-i)
- Niche palettes: [99designs keto](https://99designs.com/inspiration/logos/keto) · [Octet fitness palette](https://octet.design/colors/palette/fitness-app-color-palette-1731930882/)
