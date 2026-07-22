# Otto — Target Framework (clean rebuild blueprint)

Status: **agreed direction, not yet applied** (founder session 2026-07-21).
Companion to `docs/ARCHITECTURE.md`, which documents the codebase as it is
today. This file is the blueprint both sessions build against when the
rebuild starts. Guiding rule: **less is more — just the necessary files.**

Founder decisions locked in:

- **App stack:** React Native + Expo, done right (not SwiftUI, not bare RN).
- **Backend:** Supabase-direct — the Express service is retired; the only
  server code is a handful of Edge Functions.

Defaults adopted with those decisions (flag before changing):

- **TypeScript everywhere.** The phantom-carbs class of bug is partly a
  types problem; generated Supabase types make the schema the one source of
  truth.
- **TanStack Query owns all server state.** Replaces SavedContext,
  NutritionContext, mealAPI's hand-rolled SWR cache and per-frame batching.
- **Feature-first layout.** Code colocates by domain, not by layer.
- **RLS is the authorization layer.** No auth middleware, no trusted-client
  problems — Postgres row policies enforce ownership.
- **Nutrition computes on-device.** The engine is pure deterministic
  TypeScript with bundled USDA data (~1 MB in the app bundle — accepted
  trade for instant/offline/free). Only the AI tail (unmatched-ingredient
  resolver) runs server-side.

---

## 1. Top-level layout

```
otto/
├── app/              expo-router routes — THIN (each file renders a feature screen)
├── src/
│   ├── features/     domain modules, self-contained
│   ├── shared/       cross-feature primitives (ui, theme, supabase, utils)
│   └── types/        generated Supabase types + shared domain types
├── supabase/
│   ├── migrations/   declarative schema + RLS policies
│   └── functions/    edge functions — the ONLY server code
├── tools/            dev-only data-pipeline scripts (USDA table builders)
├── assets/           fonts, Otto art, splash
└── (config: app.json, tsconfig, eslint, package.json, eas.json, .env.example)
```

## 2. `app/` — routes only (~24 files)

Same screens as today; each file is ~10 lines — import the feature screen,
render it. No data fetching, no business logic in routes.

```
app/_layout.tsx              providers: QueryClient, Auth, (theme is a plain module)
app/(tabs)/{_layout,index,cookbook,create,plan,profile}.tsx
app/recipe/[id].tsx · app/recipe/cook/[id].tsx · app/recipe/edit.tsx
app/(auth)/{_layout,sign-in,sign-up,forgot-password}.tsx
app/{add,shopping,onboarding,otto-club,journal,household,notifications,preferences,faq}.tsx
app/auth/callback.tsx · app/{reset,change}-password.tsx
```

## 3. `src/features/` — the heart (~46 files)

Each feature owns its screens, components, hooks, queries and types.
Changing a feature means opening exactly one folder.

```
features/
├── recipes/     (6)  DiscoverScreen, RecipeDetailScreen, RecipeCard,
│                     recipe.queries.ts, mealdb.transform.ts, recipe.types.ts
├── nutrition/   (8)  NutritionCard, CalorieRing, useNutrition(),
│                     estimates.ts (category fallback + carb ceiling), engine/ ↓
├── cook/        (6)  CookScreen, session.ts, stepEnrich.ts, stepAction.ts,
│                     StepCard, TimerHub
├── cookbook/    (3)  CookbookScreen, useSaved(), saved.queries.ts
├── planner/     (5)  PlanScreen, ShoppingScreen, week.ts, shoppingList.ts,
│                     plan.queries.ts
├── import/      (4)  AddSheet, EditRecipeScreen, draft.ts, import.queries.ts
├── auth/        (5)  SignIn/SignUp/Forgot screens, useAuth(), social.ts
├── profile/     (6)  ProfileScreen + preferences/household/notifications/
│                     otto-club/faq screens
└── share/       (3)  ShareCard, shareText.ts, share.queries.ts
```

### The crown jewel: `features/nutrition/engine/`

Framework-agnostic, zero React Native imports — trivially testable, and can
move server-side unchanged if ever needed. One copy (today the parser and
cup weights exist in BOTH mobile and backend, drifted — that is the class
of bug where card ≠ detail).

```
engine/
├── parse.ts          measurement → grams (units, densities, piece weights)
├── lookup.ts         name → USDA record (leading-qualifier AND trailing-prep strip)
├── compute.ts        grams × per-100g ÷ servings
├── guards.ts         canned-legume→cooked, frying medium, coverage floor,
│                     plausibility, carb ceiling
├── data/             usdaTable, usdaCookedTable, pieceWeights, cupWeights,
│                     recipeFacts  (5 json — the ONE copy)
└── engine.test.ts    golden recipes + macro-split regressions (assert P/C/F,
                      never kcal alone)
```

## 4. `src/shared/` — primitives (~14 files)

```
shared/ui/         (~8)  Button, Text, Sheet, Ring, SegmentBar, Toast,
                         PawMark, OttoArt — the design system; replaces all
                         14 per-screen *.styles.js files
shared/theme/      (2)   tokens.ts, colors.ts — light-only lock as a plain
                         module, NOT a context
shared/supabase/   (1)   client.ts — typed client; queries live per-feature
shared/lib/        (3)   fdaCalories.ts, format.ts, units.ts — tiny pure utils
```

## 5. `supabase/` — all server code (~8 files)

**5 small edge functions replace ~40 Express routes.** CRUD for favorites,
recipes, plans and shares become direct typed Supabase calls guarded by RLS.
Server code is only what genuinely cannot run on-device:

```
migrations/           schema.sql + policies.sql (+ seed) — RLS per table
functions/
├── content/            TheMealDB proxy (hides the supporter key)
├── import-recipe/      URL → draft (schema.org JSON-LD, SSRF-guarded)
├── generate-recipe/    Claude generation + text/photo extraction
├── resolve-nutrition/  Claude matcher tail for unmatched ingredients
└── delete-account/     service-role cleanup (auth user + storage photos)
```

Zod validation lives at these five boundaries only. Rate limiting: Supabase
built-ins + per-function checks on the costly (AI) paths.

## 6. `tools/` — dev-only (~5 files)

The USDA data pipeline survives as tooling (build usdaTable / cookedTable /
pieceWeights / cupWeights + the identity-repair script). One-off schema and
audit scripts from the current repo already ran — they do not carry over.

---

## 7. File count: today vs target

| Area | Today | Target | What happens |
|---|--:|--:|---|
| Routes | 26 | 24 | Same screens, thin files |
| Screens/components | 20 + logic in routes | ~30 in features/ | Same UI, colocated |
| State (contexts) | 5 providers | 1 (Auth) | Rest → TanStack Query / plain modules |
| Client logic (lib+services+constants+hooks) | 33 | ~18 | Hand-rolled caching deleted |
| Styles | 14 | 0 | shared/ui + colocation |
| Backend app | 24 src + 8 json + 5 migrations | 5 functions + ~3 sql | RLS replaces ~40 routes |
| Backend scripts | 25 + 29 json | ~5 | Keep pipeline, drop one-offs |
| Nutrition data | 6 json in 2 places | 5 json in 1 place | Single copy |
| Tests | 26 | ~15 | Same coverage, colocated |
| Config | 8 | 6 | drizzle/railway gone |
| **TOTAL** | **~224** | **~110** | **≈ half the files, same product** |

Living-code reduction (excluding one-off scripts and the cached corpus):
roughly **150 → 85 files**.

## 8. The three numbers that tell the story

1. **~40 Express routes → 5 edge functions.** Everything else is direct
   typed Supabase calls under RLS.
2. **5 contexts → 1.** Every hand-rolled cache (mealAPI SWR, Nutrition
   batching, Saved optimistic sets) was reimplementing TanStack Query.
3. **2 codebases → 1.** One parser, one data set, one test suite — the
   card-vs-detail drift bug becomes structurally impossible.

## 9. What carries over unchanged (the assets worth protecting)

- The **deterministic nutrition engine** logic and its bundled USDA data —
  ported to TS, behavior pinned by the existing golden + macro-split tests.
- The **honesty law** (null beats a guess; estimates labelled; carb ceiling).
- The **design tokens** and the semantic-ink rule.
- The **id convention** (seed numeric, user `u-` prefixed) and RecipeSource
  seam (now a transform module per source).
- `docs/` — the decision log, design system, QA and this blueprint.
