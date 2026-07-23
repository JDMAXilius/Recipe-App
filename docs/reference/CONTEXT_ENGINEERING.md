# 🧠 Context Engineering — Recipe App

> **Purpose of this file.** The single source of truth an AI coding agent (or a new developer) should read *before* touching the codebase. It captures the app map, architecture, data flows, conventions, and known gotchas so any change is made with full context. Keep it updated as the app evolves. For the deep dive see `ARCHITECTURE.md` (file tree) and `API_ARCHITECTURE.md` (how bytes move).

**Stack in one line:** TypeScript Expo (React Native) app talking **directly to Supabase** — Postgres + RLS, Auth, Storage, and a few Edge Functions — with TanStack Query as the data layer and TheMealDB (via a key-proxy function) as the seed recipe source.

> **Active initiatives live in `docs/tickets/`** — nutrition accuracy (`NUTRITION_ACCURACY.md`)
> and the planned `otto-recipes` data-ownership migration (`OWN_RECIPE_DB.md`, which will
> replace the runtime TheMealDB dependency described below). This doc describes the app as it
> **is**; check the tickets for where it's going.

---

## 1. What this app is

A warm, illustrated **recipe app**. Users browse and search recipes (Discover), view full details with **on-device computed nutrition**, save favorites, plan a week, cook in a big-type Cook mode, import recipes from a URL or a photo, generate new ones by chatting with Otto, and share a shopping list with their household in real time. Seed recipe *content* comes from **TheMealDB**; user recipes (imports / generations / their own writing) live in the app's own `recipes` table. Auth is **Supabase** (email/password + OAuth). There is **no Express backend** — the app queries Postgres directly and RLS is the security boundary.

---

## 2. Repository map

```
Recipe-App/
├── app/                          expo-router v6 file-based routes (.tsx)
│   ├── _layout.tsx               root: GestureRoot→ErrorBoundary→Query→Auth→Stack
│   ├── index.tsx                 launch gate → onboarding / sign-in / tabs
│   ├── (auth)/                   sign-in, sign-up, forgot-password
│   ├── (tabs)/                   Discover · Cookbook · ＋Create · Plan · Account
│   ├── recipe/[id].tsx           detail · recipe/cook/[id].tsx · recipe/edit.tsx
│   ├── add.tsx  shopping.tsx  household.tsx  journal.tsx  chats.tsx
│   └── otto-club.tsx  notifications.tsx  preferences.tsx  faq.tsx  onboarding.tsx
│
├── src/
│   ├── features/                 feature-first modules (own screens + logic + queries)
│   │   ├── auth/ recipes/ cookbook/ import/ cook/ nutrition/ planner/
│   │   ├── household/ journal/ chat/ share/ notifications/ onboarding/ profile/
│   │   └── nutrition/engine/     the deterministic on-device USDA engine
│   ├── shared/
│   │   ├── theme/tokens.ts       THE token source (light-only, plain module)
│   │   ├── ui/                   primitives (Text, Button, Sheet, Ring, Otto marks…)
│   │   ├── supabase/client.ts    the Supabase JS client
│   │   ├── assets.ts             typed art registry (require() lives here only)
│   │   └── lib/ haptics.ts motion.ts storage.ts bus.ts imagePicker.ts
│   └── types/                    database.ts (generated) · ids.ts (branded ids)
│
├── supabase/
│   ├── functions/                edge functions (Deno/TS)
│   │   ├── _shared/http.ts       CORS, json(), getUserId(), serviceClient(), rateLimited()
│   │   ├── content/              TheMealDB v2 supporter proxy (keeps the key server-side)
│   │   ├── import-recipe/        URL → draft via schema.org JSON-LD (SSRF-guarded)
│   │   ├── generate-recipe/      Claude: one-shot / chat / photo→recipe
│   │   ├── resolve-nutrition/    live-USDA + Claude pick, caches to resolved_ingredients
│   │   └── delete-account/       App Store 5.1.1(v) full erase
│   └── migrations/               *.sql schema + RLS + SECURITY DEFINER RPCs
│                                 └── tests/rls-attacks.test.mjs
│
├── assets/                       mascot/ actions/ food/ images/ brands/
├── e2e/  test/                   integration + node --test suites
└── docs/                         this file, ARCHITECTURE.md, DESIGN_SYSTEM.md, …
```

---

## 3. Sitemap / navigation graph

```
app/index (launch gate: resolveRoute(onboarded, isLoaded, hasSession))
│
├── onboarding            [first run, no account wall]
├── (auth)                [not signed in] → sign-in ⇄ sign-up, forgot-password
│
└── (tabs)                [signed in; clears → redirect (auth)/sign-in]
    ├── index      Discover   (search, category tiles, Otto's pick) ─▶ recipe/[id]
    ├── cookbook   Cookbook   (All · Saved · My recipes)            ─▶ recipe/[id]
    ├── create     ＋         (chat with Otto → generate-recipe)     ─▶ recipe/edit
    ├── plan       Plan       (Otto's week)                          ─▶ shopping
    └── profile    Account    (stats, journal, prefs, sign-out)

recipe/[id]        detail: nutrition card, serving scale, video ─▶ recipe/cook/[id]
recipe/cook/[id]   Cook mode (gesture-locked step pager)
add                URL import / photo / write-it-myself ─▶ recipe/edit
shopping · household  personal + realtime shared list
```

**Auth gating.** `app/index.tsx` resolves the launch route from auth + the first-run flag (`resolveRoute`, pure/tested). `(tabs)/_layout.tsx` redirects to `(auth)/sign-in` if the session clears while inside the app.

---

## 4. Tech stack & key dependencies

| Concern | Choice |
|---|---|
| Framework | Expo SDK 54, React Native 0.81, React 19, **TypeScript** |
| Navigation | `expo-router` v6 (file-based) |
| Server state | `@tanstack/react-query` v5 — all data access, one QueryClient in the root |
| Backend | **Supabase** (`@supabase/supabase-js` v2): Postgres + RLS, Auth, Storage, Edge Functions |
| Validation | `zod` v4 (at every trust boundary — edge replies, cached JSON, inputs) |
| Fonts | Lora (serif) via `@expo-google-fonts/lora`, loaded + render-gated in the root layout |
| Animation / gesture | `react-native-reanimated` v4, `react-native-gesture-handler` |
| Haptics / video / share | `expo-haptics`, `react-native-webview`, `react-native-view-shot`, `expo-sharing` |
| Edge runtime | Deno (Supabase Edge Functions), TS |

There is **one** React context (`AuthProvider`). Everything else that used to be a context (nutrition batching, saved recipes, theme, toasts) is now server state in TanStack Query or a plain module.

---

## 5. Data model (`supabase/migrations/*.sql`)

Plain SQL migrations, RLS on every table, user tables owner-only. Key tables:

| Table | Notes |
|---|---|
| `recipes` | User imports/creations. `id serial`; `user_id text`; `source`, `source_url/name`; `ingredients`/`steps` `jsonb`; `nutrition jsonb`; `visibility`. Owner-only CRUD (+ household read). |
| `favorites` | Saved recipes (paw-mark). Owner-only. |
| `plan_entries` | The week planner. Owner-only (+ household read). |
| `seed_nutrition` | Server-precomputed USDA figures for seed recipes. Read-all. |
| `resolved_ingredients` | Durable resolver cache (name → USDA food row). Read-all; service-role write. |
| `recipe_shares` / `list_shares` | Capability-token share rows. Read via RPC only. |
| `collab_lists` / `collab_items` | Token-gated collaborative lists. |
| `households` / `household_members` / `household_list_state` | Shared-kitchen shopping list, realtime. Membership gated by `is_household_member()`. |

**ID convention** (`src/types/ids.ts`, branded + validating): `SeedId` = numeric TheMealDB id (`"52772"`), `UserRecipeId` = `"u-<recipes.id>"`, `UserId` = a UUID. A route ref starting `u-` routes to the DB; else it's a seed id fetched via the `content` function.

Capability-URL data (share pages, collab lists) is reached only through `SECURITY DEFINER` RPCs (`…_share_functions.sql`), never bare SELECTs — so URLs aren't enumerable.

---

## 6. Data flows

**Seed recipe content → `content` edge function → TheMealDB.**
`features/recipes/recipe.queries.ts` calls `supabase.functions.invoke('content/<endpoint>')`; the function proxies TheMealDB's v2 supporter API (key server-side), allowlists endpoints/params, and TTL-caches. `mealdb.transform.ts` normalizes the awkward TheMealDB shape into the app's canonical recipe object so nothing downstream branches on origin.

**User recipes → Postgres directly.** The editor and cookbook read/write `recipes` / `favorites` via TanStack Query hooks; RLS scopes every row to the owner.

**Import / generate → edge functions.** `import-recipe` (URL → schema.org draft, SSRF-guarded) and `generate-recipe` (Claude one-shot / chat / photo) return a draft that lands on `recipe/edit.tsx`; the user reviews, then saves with an honest `source`.

**Nutrition → on-device engine.** `nutrition.queries.ts` reads the `seed_nutrition` cache → else runs `features/nutrition/engine/compute.ts` locally (zero network) → else asks `resolve-nutrition` for just the names the 962-row table missed. `null` from the engine → the card shows a labelled category estimate (`estimates.ts`).

**Shared list → Realtime.** `features/household/useHousehold.ts` subscribes with `supabase.channel().on('postgres_changes', …)` on `household_list_state`; a push invalidates the Query key so every member's list updates live.

---

## 7. Auth flow (Supabase)

1. `src/shared/supabase/client.ts` creates the client (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, session persisted in AsyncStorage).
2. `src/features/auth/AuthProvider.tsx` subscribes to `onAuthStateChange`, exposes `{ session, user, isLoaded, … }` via `useAuth()` — the one React context.
3. Email/password screens in `(auth)/`; OAuth (Apple/Google/Facebook) via `features/auth/oauth*.ts`.
4. Edge functions verify the access token and derive identity in `_shared/http.ts` `getUserId` — a client-supplied user id is never trusted. Direct DB access is guarded by RLS.

---

## 8. Theming & tokens

`src/shared/theme/tokens.ts` is the **one** token source: `colors` (light-only), `macro` (fixed protein/carbs/fat, never re-skinned), `overlay` (warm-ink scrims), the `type` scale, `space`, `radii`, springs, and `shadow`. It's a **plain module, not a context** — there is no `useTheme()` and no runtime switching (light is locked; `app.json` `"userInterfaceStyle": "light"`).

**Semantic ink** governs color: terracotta = computed/interactive, ink = human-authored. The `Text` primitive in `src/shared/ui/` applies the right color per role, so screens don't pass hexes. No file hardcodes a hex, spring, or type size — it comes from `tokens.ts`. See `DESIGN_SYSTEM.md` for the full spec.

---

## 9. Conventions & patterns

- **Language:** TypeScript throughout (`.tsx` screens/components, `.ts` logic, `.mjs` node tests). Function components + hooks.
- **Feature-first:** each `src/features/<name>/` owns its screens, components, pure logic, and **all its server state in `*.queries.ts`** (TanStack Query). `index.ts` is the public seam; import across features through it (`@/features/<name>`).
- **No raw `fetch` in screens.** Data goes through TanStack Query over the Supabase client, or `supabase.functions.invoke(...)` for edge functions.
- **RLS is the boundary.** Never add a client-trusted `userId` — the token is the identity, policies enforce ownership.
- **Honesty law:** never fabricate data. The nutrition engine returns `null` rather than guess; the UI degrades to a labelled estimate.
- **zod at trust boundaries:** edge-function replies, cached JSON, and inputs are parsed before use.
- **Pure logic is tested:** logic modules ship a `*.test.mjs` (`node --test`, run via the `test` script).
- **Imports:** `@/` alias to `src/` (e.g. `@/features/auth`, `@/shared/ui`, `@/shared/theme/tokens`).

---

## 10. Environment / configuration

**Client (`.env`, `EXPO_PUBLIC_*` — inlined at build; restart Expo after edits):**
```
EXPO_PUBLIC_SUPABASE_URL=<supabase_project_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
```

**Edge-function secrets (Supabase secrets / `Deno.env` — never in the bundle):**
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `THEMEALDB_KEY`, `ANTHROPIC_API_KEY` (optional), `USDA_API_KEY` (optional).

**Run**
```bash
npm install
npm start              # expo start
npm run ios            # expo run:ios  (dev build)
npm run typecheck      # tsc --noEmit
npm test               # node --test suites (engine, functions, logic)
```

---

## 11. Known gotchas / notes (read before "fixing" things)

1. **The nutrition engine is on-device, not in a function.** It lives in `src/features/nutrition/engine/` (`parse` → `lookup` → `compute`+`guards`), bundles `data/usdaTable.json` (962 rows), and does **zero** network at runtime. The `resolve-nutrition` function is only the tail for names the bundle misses.
2. **`generate-recipe` is one function with three modes** — `{prompt}` (one-shot), `{messages}` (chat), `{image}` (photo→recipe). There is no separate photo-import function.
3. **AI paths are dormant-safe.** `generate-recipe` / `resolve-nutrition` 503 (or return honest misses) without `ANTHROPIC_API_KEY`; the app still works, just more deterministic.
4. **`content` needs `THEMEALDB_KEY`** — it refuses (503) rather than falling back to the free catalog.
5. **`backend/` still exists on disk but is empty of tracked files** — the v1 Express server was deleted in this branch. Don't resurrect `/api/*`; it's gone.
6. **RLS, not middleware, protects data.** A missing/loose policy is the vulnerability, not a missing auth check in app code. New tables need policies + a case in `migrations/tests/rls-attacks.test.mjs`.

---

## 12. Where to make common changes

| I want to… | Touch this |
|---|---|
| Add a screen | new file under `app/...` (expo-router auto-registers); delegate to a `*Screen` in the owning feature |
| Add a tab | `app/(tabs)/_layout.tsx` + new `(tabs)/<name>.tsx` |
| Change seed recipe fetching | `src/features/recipes/recipe.queries.ts` (+ the `content` function's allowlist for a new endpoint) |
| Add/change a DB query | the feature's `*.queries.ts` (TanStack Query over `supabase.from(...)`) |
| Change DB shape | new `supabase/migrations/*.sql` (+ RLS policy + rls-attacks test); regenerate `src/types/database.ts` |
| Add server-side logic (secrets, URL fetch, Claude) | a `supabase/functions/<name>/index.ts` using `_shared/http.ts` |
| Restyle a screen | the component in its feature module; pull values from `src/shared/theme/tokens.ts` |
| Change tokens/colors | `src/shared/theme/tokens.ts` (the only place) |
| Change auth behavior | `src/features/auth/AuthProvider.tsx`, `app/(auth)/*`, `oauth*.ts`, `shared/supabase/client.ts` |
| Add global state | prefer a TanStack Query hook in a feature; a new context only if it truly must be React context (Auth is the sole precedent) |
| Touch the nutrition math | `src/features/nutrition/engine/*` — and run its `*.test.mjs` golden/laws suites |
