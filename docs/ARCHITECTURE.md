# Otto — Architecture & File Framework

A definitive map of the codebase: how it's laid out, and what each part does.
Grounded in the actual source tree (not aspirational).

---

## 1. What Otto is, in one paragraph

A warm, illustrated recipe app. A **React Native (Expo) mobile app** talks to an
**Express + Postgres backend**. Recipes come from TheMealDB (seed) and from users
(imports + their own writing). Nutrition is computed from **USDA FoodData Central**
data bundled into the backend. Two hard rules run through everything:

- **Honesty law** — never fabricate data. `null` beats a guess.
- **Semantic ink** — terracotta = computed/interactive, ink = human-authored.

```
Recipe-App/
├── mobile/     Expo SDK 54 · React Native 0.81 · expo-router v6 · JS/JSX only
├── backend/    Express 5 · Drizzle ORM · Supabase Postgres · Supabase Auth
├── docs/       Design system, decision log, roadmaps, tickets, these breakdowns
├── reusable-app/               Extracted reusable app scaffold (Otto = worked example)
├── reusable-website-branding/  Reusable brand/website scaffold
└── altavida/                   A second brand built on the reusable scaffold
```

---

## 2. Mobile app (`mobile/`)

### 2.1 Bootstrap & provider tree — `app/_layout.jsx`

The root layout loads fonts (Lora) and nests the global providers. **Order matters**
(inner providers depend on outer ones):

```
ThemeProvider              tokens/colors (light-only lock)
└── AuthProvider           Supabase session → user
    └── NutritionProvider  batched per-card nutrition (needs the session)
        └── SavedProvider  the user's saved recipes (paw-mark state)
            └── ToastProvider  global toast
                └── <Stack>    expo-router screen stack
```

### 2.2 Routing — `app/` (file-based, expo-router)

Every file is a route. Groups in `(parens)` don't add a URL segment.

| Path | Screen |
|---|---|
| `app/_layout.jsx` | Root: providers + stack + splash gate |
| `app/onboarding.jsx` | 3-screen painted intro (no account wall) |
| `app/(tabs)/_layout.jsx` | Bottom tab bar |
| `app/(tabs)/index.jsx` | **Discover** (search, categories, "Otto's pick") |
| `app/(tabs)/cookbook.jsx` | **Cookbook** (All · Saved · My recipes) |
| `app/(tabs)/create.jsx` | **Create** hub |
| `app/(tabs)/plan.jsx` | **Otto's week** planner |
| `app/(tabs)/profile.jsx` | **You** (stats, journal, units, sign-out) |
| `app/recipe/[id].jsx` | Recipe detail (nutrition, scaling, video) |
| `app/recipe/cook/[id].jsx` | **Cook mode** (mise-en-place → big-type steps → finish) |
| `app/recipe/edit.jsx` | Recipe editor (write/edit own) |
| `app/add.jsx` | Add sheet (paste URL / write it myself) |
| `app/shopping.jsx` | Shopping list |
| `app/(auth)/*` | sign-in, sign-up, forgot-password |
| `app/auth/callback.jsx`, `reset-password.jsx`, `change-password.jsx` | Auth flows |
| `app/otto-club.jsx` | Membership/paywall surface |
| `app/journal.jsx`, `household.jsx`, `notifications.jsx`, `preferences.jsx`, `faq.jsx` | Secondary screens |

### 2.3 State — `context/` (React Context providers)

| File | Responsibility |
|---|---|
| `AuthContext.jsx` | Wraps Supabase auth; exposes `session/user/isSignedIn/signOut` |
| `SavedContext.jsx` | Single source of truth for saved recipes; optimistic paw-mark toggles |
| `NutritionContext.jsx` | Batches per-card nutrition into **one request per frame**, memory-cached, so a card and its detail page never disagree |
| `ThemeContext.jsx` | Light-only locked token set; `useTheme()` read API |
| `ToastContext.jsx` | Global toast; `useToast().show({...})` |

### 2.4 Components — `components/`

Presentational + Otto's brand pieces.

- **Brand:** `PawMark` (the save mark, emits on `ottoBus`), `OttoStates` / `OttoIdle` (mascot at emotional beats), `AnimatedSplash`.
- **Recipe UI:** `RecipeCard`, `CategoryFilter`, `FilterSheet`, `ScreenHeader`, `SafeScreen`, `Bounceable`, `LoadingSpinner`, `NoFavoritesFound`.
- **Nutrition:** `nutrition/NutritionCard.jsx` (the card in the screenshots), `nutrition/CalorieRing.jsx`.
- **Sharing:** `ShareCard`, `ShoppingListShareCard`, `ShareCoachSheet`.
- **Video:** `VideoEmbed.native.jsx` / `VideoEmbed.web.jsx` (platform-split file — Metro picks by extension).
- **Auth:** `SocialAuthButtons`.

### 2.5 The deterministic engines — `lib/`

This is where the real logic lives. **No LLM in the render path** — all pure JS.

| File | What it does |
|---|---|
| `ingredientParser.js` | Ingredient line → qty/unit/item; kitchen-fraction scaling; US↔Metric |
| `ingredientWeight.js`, `cupWeights.json` | Volume↔weight conversion tables |
| `foodScale.js` | Scales a whole ingredient list by a factor |
| `stepEnrich.js` | Parses durations/temperatures out of method steps |
| `cookSession.js` | Splits steps for Cook mode; matches step ↔ ingredients |
| `stepAction.js` | Chooses which Otto action illustration a step shows |
| `shoppingList.js` | Sums ingredients across the week into aisle sections |
| `week.js` | The 7-day planner model |
| `fdaCalories.js` | FDA calorie rounding for the label (21 CFR 101.9) |
| `suggest.js` | Search/suggestion helpers |
| `api.js` | `authFetch` — fetch with Supabase token, 15s timeout, GET retry |
| `supabase.js` | Supabase client |
| `socialAuth.js`, `username.js` | Auth helpers |
| `notifications.js` | expo-notifications wiring |
| `share*.js` (`shareCard`, `shareText`, `shareIntent`), `uploadRecipePhoto.js` | Sharing + photo capture |
| `draftStore.js` | Module-level hand-off slot: Add sheet → editor |
| `ottoBus.js` | Tiny event bus so Otto reacts to app events (save → mascot) |
| `prefs.js` | Local preferences (unit system, etc.) |

### 2.6 Data sources — `services/`

The **RecipeSource seam** on the client:

| File | What it does |
|---|---|
| `mealAPI.js` | Seed recipes via **our** backend (`/api/content`), not TheMealDB directly (the paid key is injected server-side). SWR memory cache. |
| `userRecipes.js` | User recipes (imports + own). Owns the id convention: seed = `"52772"`, user = `"u-<dbId>"`. `NutritionAPI` for computed values. Both sources emit the **same recipe shape** so detail/cook/cards need no branches. |

### 2.7 The rest

- `constants/` — `colors.js`, `tokens.js` (spacing/type/radius/timing), `api.js` (API_URL), `foodIcons.js`, **`nutritionEstimates.js`** (category-typical fallback estimates).
- `hooks/` — `useDebounce.js`, `useUnitSystem.js`.
- `assets/styles/*.styles.js` — per-screen StyleSheet modules (one per screen).
- `test/`, `lib/__tests__/` — `node --test` unit tests.

---

## 3. Backend (`backend/`)

### 3.1 The server — `src/server.js`

One Express app. Middleware pipeline, in order:

```
trust proxy (prod)
  → CORS (ottosapp.com + www built in, WEB_ORIGINS extra)
  → helmet
  → request id + structured logging
  → apiLimiter (global rate limit)
  → routes
```

Route groups (all `/api/*` require `requireAuth` **except** `/api/content` and the
public share pages), each with a tiered rate limiter:

| Group | Routes | Limiter |
|---|---|---|
| Content | `GET /api/content/:endpoint` (TheMealDB passthrough) | `contentLimiter` |
| Favorites | `POST/GET/DELETE /api/favorites` | default |
| Import | `POST /api/import`, `/import/text`, `/import/photo` | `costlyLimiter` |
| Generate | `POST /api/generate`, `/generate/chat` | `costlyLimiter` |
| Recipes | CRUD `/api/recipes`, `/recipes/:id/nutrition/recompute` | default/costly |
| Nutrition | `GET /api/nutrition/seed[/:mealId]` | `seedReadLimiter` |
| Plan | `GET/POST/PATCH/DELETE /api/plan` | default |
| Account | `DELETE /api/account` | `destructiveLimiter` |
| Sharing | `/api/recipes/:id/share`, `/api/share/list`, collab `/api/lists/*` | default/costly |
| Public pages | `GET /r/:slug`, `/l/:token`, `/hl/:token` | `publicShareLimiter` |

### 3.2 Config & middleware — `src/config/`, `src/middleware/`

| File | What it does |
|---|---|
| `config/env.js` | Central env loading (all `process.env` reads live here) |
| `config/db.js` | Drizzle client over Supabase Postgres |
| `middleware/auth.js` | `requireAuth` — verifies the Supabase JWT, derives the user (never trust a client-sent userId) |

### 3.3 Domain logic — `src/lib/`

| File / dir | What it does |
|---|---|
| `content/RecipeSource.js` | Server-side seam over the seed source (TheMealDB adapter). `getById/search/filterByIngredient/randomBatch`. |
| `importRecipe.js` | URL → recipe draft via **schema.org JSON-LD**. Deterministic, SSRF-guarded, returns null on miss. |
| `import/extractRecipe.js` | Text → recipe via Claude (dormant without key). |
| `import/extractPhoto.js` | Photo → recipe via Claude vision. |
| `import/social.js` | Social URLs (detect platform → import). |
| `generateRecipe.js` | "Cook something up with Otto" — Claude writes a draft; `is_possible` gate; always lands on the edit screen; saved with source `otto`. |
| `validate.js` | zod schemas per endpoint (`schemas.*`) + `validate()` middleware |
| `rateLimits.js` | The tiered limiters |
| `logger.js` | pino structured logging + `reportError` (Sentry) |
| `sharePages.js` | Server-rendered public share HTML (`/r`, `/l`, `/hl`) |
| `weightDisplay.js` | Formats weights for display |
| **`nutrition/`** | The nutrition subsystem — see §4 |

### 3.4 Database — `src/db/`

- `schema.js` — Drizzle table defs. Tables: `favorites`, `recipes`, `plan_entries`,
  `seed_nutrition`, `resolved_ingredients`, `recipe_shares`, `list_shares`,
  `collab_lists`, `collab_items`.
- `migrations/` — generated SQL + `meta/` snapshots. RLS enabled.

### 3.5 Scripts & tests

- `scripts/` — **build** the bundled data (`build-usda-table.mjs`, `build-cooked-table.mjs`,
  `build-piece-weights.mjs`, `build-cup-weights.mjs`), **audit** it
  (`audit-*.mjs`), and one-off ops (`refresh-nutrition.mjs`, `recompute-user-recipes.mjs`,
  `cleanup-anonymous-users.mjs`). `corpus/a..z.json` is the cached TheMealDB corpus for offline audits.
- `test/` — `node --test` covering parsing, provider, resolver, imports, share pages,
  account deletion, and `goldenNutrition.test.mjs` (regression on known recipes).

---

## 4. The nutrition subsystem — `backend/src/lib/nutrition/`

The heart of the app, and the most-worked area. Three stages, USDA-backed, cached.

```
ingredient line
   │
   ▼  parseIngredient.js            ── measurement → grams
 { qty, unit, item, grams, confidence }
   │
   ▼  lookup()  (usdaProvider.js)   ── name → USDA food row
 usdaTable.json  (943 rows, per-100g values)
   │  (miss?) → resolveIngredient.js  ── Claude PICKS a real USDA record (never invents)
   │  (raw vs cooked?) → resolveCooked.js / usdaCookedTable.json
   ▼
 usdaProvider.js                    ── grams × per-100g ÷ servings, + guards
 { kcal, protein_g, carbs_g, fat_g, …, confidence } | null
```

| File | Role |
|---|---|
| `parseIngredient.js` | Line → grams. Owns unit vocabulary, densities, piece weights, fraction/range parsing, pack-size + frying-oil handling. |
| `NutritionProvider.js` | The seam. `computeNutrition(ingredients, servings, recipeId, steps)`. Picks the active provider. |
| `usdaProvider.js` | The active provider. Name→record lookup (with qualifier stripping), the **guards** (canned-legume→cooked, frying-medium, coverage floor, kcal plausibility, raw/cooked ambiguity), the per-nutrient sum, and the confidence score. |
| `usdaTable.json` | 943 TheMealDB names → real USDA records (fdcId + per-100g). Built by `scripts/build-usda-table.mjs`. |
| `usdaCookedTable.json` | Cooked-state records (raw brown rice 360 vs cooked 123). |
| `pieceWeights.json`, `cupWeights.json` | USDA-verified piece and cup weights. |
| `recipeFacts.json` | Per-seed-recipe curated facts: real servings + which lines arrive already cooked. |
| `resolveIngredient.js` | Claude-as-matcher (dormant without `ANTHROPIC_API_KEY`). Stage 1: pick from the bundled table. Stage 2: live USDA search (`usdaSearch.js`) → pick a real candidate. Cached in `resolved_ingredients`. |
| `resolveCooked.js` | Claude reads the method to settle raw-vs-cooked for ambiguous grains. |
| `usdaSearch.js` | Live USDA FoodData Central search (needs `USDA_API_KEY`). |
| `lifecycle.js` | **When** nutrition runs: async on create/edit/recompute, backfilled onto the row, **never on read**. |

**Runtime cost: zero network calls.** `usdaTable.json` ships with the backend, so a
recipe view is pure arithmetic — can't be rate-limited, can't break if a vendor is down.
Claude/USDA-search only run once per unseen ingredient, then cache forever.

### The two client-side consumers

- `NutritionCard.jsx` renders `computed` (the USDA object) when present; when it's
  `null` it falls back to the **category estimate** from `constants/nutritionEstimates.js`
  and says *"from this kind of dish."* (This fallback is the source of the phantom-carbs
  behaviour seen in QA — see the diagnosis in chat / `docs/QA.md`.)
- `NutritionContext.jsx` batches card-level requests so cards and detail agree.

---

## 5. Cross-cutting conventions

| Concern | How it works |
|---|---|
| **Auth** | Supabase Auth. Client attaches JWT via `authFetch`; server verifies in `requireAuth` and derives the user. Anonymous browsing until first save. |
| **Recipe source seam** | Two sources (TheMealDB seed, user recipes) behind one shape. `RecipeSource.js` (server) + `services/*` (client). Swap the adapter, UI unchanged. |
| **ID convention** | Seed = numeric string (`"52772"`); user = `"u-<dbId>"`. `isUserRecipeId()` is the only place that knows. |
| **Honesty law** | No fabricated numbers. Nutrition returns `null` rather than guess; UI degrades to a labelled estimate. |
| **Caching** | Content SWR (client, 5 min); nutrition computed once and stored; ingredient resolutions cached in `resolved_ingredients` forever. |
| **AI is dormant-safe** | Every Claude path (`generate`, `extract*`, `resolve*`) no-ops without `ANTHROPIC_API_KEY`; the app still works, just more deterministic. |
| **Styling** | Tokens only (`constants/tokens.js`, `colors.js`), light-only lock, per-screen `.styles.js`. |

---

## 6. Key data flows

**Import a recipe (URL):**
`add.jsx` → `POST /api/import` → `importRecipe.js` (schema.org) → draft → `draftStore` → `recipe/edit.jsx` → save → `POST /api/recipes` → `lifecycle.js` backfills nutrition.

**Generate with Otto:**
`create.jsx` → `POST /api/generate` → `generateRecipe.js` (Claude, `is_possible` gate) → draft → edit screen → save (source `otto`).

**View nutrition:**
`recipe/[id].jsx` reads stored `seed_nutrition`/`recipes.nutrition` → `NutritionCard` renders `computed`, or falls back to `nutritionEstimates.js`.

**Cook mode:**
`recipe/cook/[id].jsx` ← `cookSession.js` (step split + ingredient match) + `stepEnrich.js` (timers) + `stepAction.js` (Otto art).

---

## 7. External services & env

| Service | Used for | Key |
|---|---|---|
| Supabase | Postgres + Auth + Storage | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| TheMealDB | Seed recipes (server-side supporter key) | in `RecipeSource.js` |
| USDA FoodData Central | Nutrition (bundled; live search optional) | `USDA_API_KEY` (optional) |
| Anthropic (Claude) | Import/extract/generate/resolve (all optional) | `ANTHROPIC_API_KEY` |
| Sentry | Error reporting | Sentry DSN |

Client env is `EXPO_PUBLIC_*` (inlined at build). Backend runs on `:5001`; app (Expo) on `:8081`.
