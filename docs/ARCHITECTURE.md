# Otto — Architecture & File Framework

A definitive map of the codebase: how it's laid out, and what each part does.
Grounded in the actual source tree (not aspirational).

---

## 1. What Otto is, in one paragraph

A warm, illustrated recipe app. A **TypeScript Expo (React Native) app** talks
**directly to Supabase** — Postgres (with RLS as the security boundary), Auth,
Storage, and a handful of **Edge Functions** for the few jobs that must run
server-side. There is **no Express backend anymore**: the app queries the
database through the Supabase JS client, and the server-side logic (URL import,
Claude generation, the live-USDA resolver tail, the TheMealDB key proxy, account
deletion) lives in `supabase/functions/`. Recipes come from TheMealDB (seed) and
from users (imports + their own writing + Otto's generations). Nutrition is
computed **on-device** from **USDA FoodData Central** data bundled into the app.
Two hard rules run through everything:

- **Honesty law** — never fabricate data. `null` beats a guess.
- **Semantic ink** — terracotta = computed/interactive, ink = human-authored.

```
Recipe-App/
├── app/         expo-router v6 file-based routes (TypeScript)
├── src/         features/ (feature-first modules) + shared/ + types/
├── supabase/    functions/ (edge functions) + migrations/ (SQL schema + RLS)
├── assets/      mascot art, action art, food-category icons, app icons
├── docs/        Design system, decision log, roadmaps, tickets, these breakdowns
├── e2e/ · test/ integration + node --test suites
├── reusable-app/               Extracted reusable app scaffold (Otto = worked example)
├── reusable-website-branding/  Reusable brand/website scaffold
└── altavida/                   A second brand built on the reusable scaffold
```

Stack in one line: **Expo SDK 54 · React Native 0.81 · React 19 · expo-router
v6 · TypeScript · TanStack Query v5 · zod v4 · Supabase JS v2 · Lora (serif)**.

---

## 2. The app (`app/` + `src/`)

### 2.1 Bootstrap & provider tree — `app/_layout.tsx`

The root layout loads Lora (render-gated on it so the serif never flashes
system-first) and nests the providers. v2 has **one** React context (`Auth`);
everything else that used to be a context is now server state in TanStack Query.

```
GestureHandlerRootView
└── ErrorBoundary
    └── SafeAreaProvider
        └── QueryClientProvider    TanStack Query (staleTime 60s, retry 1)
            └── AuthProvider       Supabase session → user (the one context)
                └── <Stack>        expo-router screen stack
                    + <ToastHost>  global toast
                    + <NotifSync>  keeps OS reminders in step with plan+prefs
```

### 2.2 Routing — `app/` (file-based, expo-router)

Every file is a route. Groups in `(parens)` don't add a URL segment.

| Path | Screen |
|---|---|
| `app/_layout.tsx` | Root: providers + stack |
| `app/index.tsx` | Launch gate → onboarding / sign-in / tabs (`resolveRoute`) |
| `app/onboarding.tsx` | Painted intro (no account wall) |
| `app/(tabs)/_layout.tsx` | Bottom tab bar (5 tabs; raised center ＋) |
| `app/(tabs)/index.tsx` | **Discover** (search, category tiles, Otto's pick) |
| `app/(tabs)/cookbook.tsx` | **Cookbook** (All · Saved · My recipes) |
| `app/(tabs)/create.tsx` | **Create** — chat with Otto to build a recipe |
| `app/(tabs)/plan.tsx` | **Plan** — Otto's week |
| `app/(tabs)/profile.tsx` | **Account** (stats, journal, prefs, sign-out) |
| `app/recipe/[id].tsx` | Recipe detail (nutrition, scaling, video) |
| `app/recipe/cook/[id].tsx` | **Cook mode** (mise-en-place → big-type steps → finish) |
| `app/recipe/edit.tsx` | Recipe editor (write/edit own; import/generate land here) |
| `app/add.tsx` | Add sheet (paste URL / snap a photo / write it myself) |
| `app/shopping.tsx` | Shopping list (personal + shared household) |
| `app/household.tsx` | Shared-kitchen membership |
| `app/journal.tsx` | Cook journal |
| `app/chats.tsx` | Otto chat threads |
| `app/otto-club.tsx` | Membership/paywall surface |
| `app/notifications.tsx`, `preferences.tsx`, `faq.tsx` | Secondary screens |
| `app/(auth)/*` | sign-in, sign-up, forgot-password |
| `app/auth/callback.tsx`, `reset-password.tsx`, `change-password.tsx` | Auth flows |

Screen files are thin — most delegate to a `*Screen` component in the owning
feature module (e.g. `app/(tabs)/cookbook.tsx` → `features/cookbook/CookbookScreen`).

### 2.3 Feature modules — `src/features/*` (feature-first)

Each feature owns its screens, components, pure logic (`*.ts` + `*.test.mjs`),
and **all its server state** in a `*.queries.ts` file (TanStack Query hooks over
the Supabase client — no raw `fetch` in screens). `index.ts` is the public seam.

| Feature | Owns |
|---|---|
| `auth/` | `AuthProvider`, the auth screens, OAuth (`oauth*.ts`), username/social helpers |
| `recipes/` | Discover + detail, TheMealDB transform (`mealdb.transform.ts`), recipe scaling (`recipe.scale.ts`), category/filter/video components |
| `cookbook/` | Cookbook screen; "mine" vs "saved" queries; RecipeCard |
| `import/` | Add sheet, edit-recipe screen, `import.queries.ts` (edge calls + recipes CRUD), `draft.ts` (Add→editor hand-off) |
| `cook/` | Cook mode: `session.ts` (step split + ingredient match), `stepEnrich.ts` (timers/temps), `stepAction.ts` (which Otto art), StepCard/TimerHub |
| `nutrition/` | The **deterministic engine** (`engine/`, §3), NutritionCard, CalorieRing, `estimates.ts` (category fallback), the seed-cache + resolver queries |
| `planner/` | Week model (`week.ts`), plan picking, `shoppingList.ts` (aisle rollup), plan/shopping screens |
| `household/` | Shared kitchen: `useHousehold`/`useSharedList` (realtime), `household.queries.ts` |
| `journal/` | Cook journal logic + screen |
| `chat/` | Otto chat: `chat.logic.ts`, `useChat`, calls `generate-recipe` in chat mode |
| `share/` | Share cards, share text/image, capability tokens (`token.ts`), `share.queries.ts` |
| `notifications/` | Notif prefs + `NotifSync`; expo-notifications wiring |
| `onboarding/` | Splash, onboarding screen, first-run `gate.ts` / `resolveRoute` |
| `profile/` | Account screen + sub-screens (FAQ, Household, Otto Club, Preferences), prefs logic |

### 2.4 Shared — `src/shared/*`

| Path | What it is |
|---|---|
| `theme/tokens.ts` | The **one** token source — colors, macro colors, overlays, type scale, spacing, radii, springs, shadows. Light-only, plain module (not a context). No file hardcodes a hex. |
| `ui/` | Primitives: `Text` (applies semantic-ink color per role), `Button`, `Input`, `Screen`, `Sheet`, `Ring`, `Toast`, `SegmentBar`, `Bounceable`, `ErrorBoundary`, `TabBarCreateButton`, and the Otto marks (`OttoArt`, `OttoStates`, `OttoIdle`, `PawMark`) |
| `supabase/client.ts` | The Supabase JS client (AsyncStorage-backed session) |
| `assets.ts` | Typed asset registry — the ONE place painted art is `require()`d |
| `haptics.ts`, `motion.ts` | Haptic + reanimated-spring helpers |
| `storage.ts`, `bus.ts`, `imagePicker.ts` | AsyncStorage wrapper, tiny event bus (Otto reacts to saves), photo picker |
| `lib/` | `fdaCalories.ts` (FDA label rounding, 21 CFR 101.9) + `format.ts`. **Note:** the nutrition engine is NOT here — it lives in `features/nutrition/engine/`; the cook/scale/shopping libs live in their feature modules. |

### 2.5 Types — `src/types/`

- `database.ts` — generated Supabase table types (`Tables`, `TablesInsert`).
- `ids.ts` — **branded** ids with validating constructors: `SeedId` (numeric
  content, `"52772"`), `UserRecipeId` (`"u-"`-prefixed), `UserId` (a UUID). An
  invalid string throws rather than silently branding.

---

## 3. The nutrition engine — `src/features/nutrition/engine/`

The heart of the app moved on-device. **Zero network calls at runtime** — a
recipe view is pure arithmetic that can't be rate-limited or broken by a vendor
outage. Deterministic, no LLM in the compute path. Three stages:

```
ingredient line
   │
   ▼  parse.ts                     ── measurement → grams (densities, piece/cup
 { qty, unit, item, grams, confidence }    weights, fraction/range parsing)
   │
   ▼  lookup.ts                    ── name → USDA food row (exact + qualifier-strip)
 data/usdaTable.json  (962 rows, per-100g)  + data/usdaCookedTable.json (cooked states)
   │
   ▼  compute.ts + guards.ts       ── grams × per-100g ÷ servings, guards, confidence
 { kcal, protein_g, carbs_g, fat_g, …, basis, doubt } | null
```

| File | Role |
|---|---|
| `parse.ts` | Line → grams. Unit vocabulary, densities, `data/pieceWeights.json` + `data/cupWeights.json`, fraction/range parsing. |
| `lookup.ts` | Name → USDA row against `data/usdaTable.json` (with qualifier stripping) and cooked-state row against `data/usdaCookedTable.json`. |
| `compute.ts` | The deterministic sum: coverage floor, per-nutrient totals, confidence, and the **honesty law** — below coverage or on an ambiguous grain it returns `null`. |
| `guards.ts` | The guards: frying-medium, batch condiments, typical amounts, carb ceiling, kcal plausibility, negligible lines, coverage/serving bounds. |
| `schemas.ts` | zod schema for the stored/returned nutrition shape (trust boundary). |
| `data/recipeFacts.json` | Per-seed-recipe curated facts: real `servings` + which lines arrive already `cooked` (a language judgement TheMealDB never states — it only chooses WHICH USDA record applies). |
| `data/*.json` | Bundled tables (USDA raw/cooked, piece/cup weights, recipe facts). Built offline; no build step ships with the app. |

The v1 resolver tails (Claude-as-matcher, cooked-state classifier) are **outside**
the engine now — they're the `resolve-nutrition` edge function (§5). Their dormant
behavior *is* the engine's behavior: an unmatched line stays unmatched.

**Two consumers** (`nutrition/`): `NutritionCard` renders the computed USDA
object when present; when it's `null` it falls back to the **category estimate**
in `estimates.ts` and labels it *"ESTIMATED PER SERVING."* `nutrition.queries.ts`
reads the `seed_nutrition` cache first, computes locally second, and only then
asks the resolver for names the bundled table missed (§6).

---

## 4. Data layer — TanStack Query + Supabase + RLS

There is no server JWT-verify middleware for data reads. **RLS is the security
boundary.** Components call feature `*.queries.ts` hooks that use the Supabase
JS client directly:

- **Reads/writes** go straight to Postgres via `supabase.from('...')`, scoped by
  the authenticated user's RLS policies (owner-only on every user table).
- **Realtime**: the shared shopping list subscribes via
  `supabase.channel().on('postgres_changes', …)` — see
  `src/features/household/useHousehold.ts` (`useHousehold` + `useSharedList`); a
  push just invalidates the relevant Query key.
- **Edge functions** (§5) are invoked with `supabase.functions.invoke(...)`,
  which attaches the session token; the function derives identity from it.
- **Capability-URL data** (share pages, collab lists) is read/written only
  through `SECURITY DEFINER` RPCs (§6), never bare table SELECTs.

---

## 5. Supabase (`supabase/`)

### 5.1 Edge functions — `supabase/functions/`

Five functions plus shared plumbing (`_shared/http.ts`: CORS, `json`,
`getUserId` — verifies the access token and derives the user id, never trusts a
client-sent one — `serviceClient`, and a per-user sliding-window `rateLimited`).

| Function | Method | Auth | Job |
|---|---|---|---|
| `content/` | GET | anon JWT only | TheMealDB **v2 supporter** passthrough. Endpoint + param allowlist, TTL cache with stale-on-error. Exists only to keep `THEMEALDB_KEY` out of the app bundle; refuses (503) if the key is unset (no free-tier fallback). |
| `import-recipe/` | POST | user | URL → recipe draft via **schema.org JSON-LD**. Deterministic, no LLM. **SSRF-guarded**: resolve-then-connect, every redirect hop's resolved IP checked against private/reserved ranges (incl. IPv4-mapped IPv6 bypasses). Returns 422 on no-recipe. |
| `generate-recipe/` | POST | user + rate-limit | Claude (`claude-opus-4-8`). Body decides the mode: `{prompt}` → one-shot, `{messages}` → **chat**, `{image}` → **vision (photo→recipe)** via `imageMode.ts`. JSON-schema-constrained; `is_possible`/decline gate; **dormant (503)** without `ANTHROPIC_API_KEY`. |
| `resolve-nutrition/` | POST | user + rate-limit | Live-USDA tail for names the on-device table misses. USDA FoodData Central search → Claude (`claude-haiku-4-5`) **picks** a real `fdcId` (never invents a calorie; honesty guard: the pick must be a returned candidate). Caches hits AND misses in `resolved_ingredients`. Needs both `ANTHROPIC_API_KEY` + `USDA_API_KEY`; else honest miss. |
| `delete-account/` | POST/DELETE | user + rate-limit | App Store 5.1.1(v). Order kept from v1: `admin_delete_user_data` RPC (one transaction), then Storage photos, then the auth user. |

Every AI/costly path: token-derived identity, per-user rate limit, dormant gate
with honest 503 copy, and error bodies written in Otto's voice (the client puts
them straight on a toast).

### 5.2 Schema & RLS — `supabase/migrations/*.sql`

Plain SQL migrations (not Drizzle). RLS enabled on every table; user tables are
owner-only. Notable tables:

| Table | Purpose |
|---|---|
| `recipes` | User imports/creations/generations (`id serial`; ingredients/steps `jsonb`; `nutrition jsonb`; `source`, `visibility`). Owner-only CRUD. |
| `favorites` | Saved recipes (paw-mark). Owner-only. |
| `plan_entries` | The week planner. Owner-only (+ household-read). |
| `seed_nutrition` | Server-computed USDA figures for seed recipes. Read-all. |
| `resolved_ingredients` | Durable resolver cache (name → USDA food row). Read-all; service-role write. |
| `recipe_shares`, `list_shares` | Capability-token share rows. Owner CRUD; public read via RPC only. |
| `collab_lists`, `collab_items` | Token-gated collaborative shopping lists. |
| `households`, `household_members`, `household_list_state` | Shared-kitchen shopping list (realtime). Membership gated by `is_household_member()`; join via `join_household(code)`. |

`SECURITY DEFINER` functions are the only path to capability-URL data
(`get_recipe_share`, `get_list_share`, `get_collab_list`, `add_collab_item`,
`set_collab_item_checked`, `delete_collab_item`) and to account deletion
(`admin_delete_user_data`). Each pins an empty `search_path`, revokes the default
PUBLIC grant, and re-grants to exactly the roles that need it. RLS attacks are
regression-tested in `supabase/migrations/tests/rls-attacks.test.mjs`.

---

## 6. Cross-cutting conventions

| Concern | How it works |
|---|---|
| **Auth** | Supabase Auth. `AuthProvider` is the only React context. Edge functions derive identity from the verified token via `getUserId`; data access is guarded by RLS. |
| **Recipe source seam** | Two sources (TheMealDB seed via `content/`, user recipes in `recipes`) behind one recipe shape (`mealdb.transform.ts` normalizes TheMealDB). Detail/cook/cards never branch on origin. |
| **ID convention** | `src/types/ids.ts` — `SeedId` numeric (`"52772"`), `UserRecipeId` `"u-<recipes.id>"`, `UserId` UUID. A route ref starting `u-` routes to the DB; else a seed id → `content/`. |
| **Honesty law** | No fabricated numbers. The engine returns `null` rather than guess; the UI degrades to a labelled category estimate. |
| **Semantic ink** | Terracotta = computed/interactive, ink = authored. Enforced by the `Text` primitive + `tokens.ts`. |
| **Zero-runtime-cost nutrition** | `usdaTable.json` (962 rows) ships in the app; a recipe view is pure arithmetic. Claude/USDA-search run once per unseen ingredient, then cache in `resolved_ingredients` forever. |
| **AI is dormant-safe** | Every Claude path (`generate-recipe`, `resolve-nutrition`) 503s without `ANTHROPIC_API_KEY`; the app still works, just more deterministic. |
| **Data access** | All server state in feature `*.queries.ts` via TanStack Query; no raw `fetch` in screens. |
| **Styling** | Tokens only (`shared/theme/tokens.ts`), light-only lock. |

---

## 7. Key data flows

**Import a recipe (URL):**
`add.tsx` → `import.queries.ts` `invoke('import-recipe', {url})` → schema.org
JSON-LD (SSRF-guarded) → draft → `draft.ts` hand-off → `recipe/edit.tsx` → save
via `supabase.from('recipes').insert(...)` (RLS owner-scoped).

**Generate with Otto (chat):**
`(tabs)/create.tsx` → `chat.queries.ts` `invoke('generate-recipe', {messages})`
→ Claude Opus, chat mode (`clarify`/`recipe`/`decline`) → recipe lands on the
edit screen → save with `source: 'otto'`.

**Snap a photo → recipe:**
`add.tsx` → `invoke('generate-recipe', {image})` → vision mode → same review
editor.

**View nutrition:**
`recipe/[id].tsx` → `nutrition.queries.ts` reads `seed_nutrition` cache → else
`engine/compute.ts` locally → else `resolve-nutrition` for missing names, then
recompute → `NutritionCard` renders the computed object or `estimates.ts`.

**Cook mode:**
`recipe/cook/[id].tsx` ← seed via `content/lookup.php` (or the DB row) ←
`cook/session.ts` (step split + ingredient match) + `stepEnrich.ts` (timers) +
`stepAction.ts` (Otto art).

**Shared shopping list:**
`shopping.tsx` / `household.tsx` → `useSharedList(householdId)` → reads
`household_list_state`, mutates via `set_checked` etc., and a
`postgres_changes` channel invalidates the Query key so every member's list
updates live.

---

## 8. External services & env

| Service | Used for | Key (Supabase secret / env) |
|---|---|---|
| Supabase | Postgres + Auth + Storage + Edge Functions | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| TheMealDB | Seed recipes (server-side supporter key) | `THEMEALDB_KEY` (in the `content` function) |
| USDA FoodData Central | Nutrition (bundled on-device; live search optional) | `USDA_API_KEY` (optional, `resolve-nutrition`) |
| Anthropic (Claude) | generate / resolve (all optional/dormant-gated) | `ANTHROPIC_API_KEY` |

Client env is `EXPO_PUBLIC_*` (inlined at build) for the Supabase URL + anon
key. Edge-function secrets live in Supabase, never in the bundle.
