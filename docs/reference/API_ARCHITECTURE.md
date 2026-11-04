# Otto — API Communication Architecture

Status: current · Last verified against code at commit 675f136b · 2026-11-04

The authoritative map of how the app talks to the outside world in **v2**. There
is **no Express backend**: the app talks **directly to Supabase** (Postgres via
the JS client, guarded by RLS) and calls a small set of **Edge Functions** for
the jobs that must run server-side (secret keys, arbitrary-URL fetching, the
OpenAI model calls, the RevenueCat membership mirror, account deletion).
Companion docs: `ARCHITECTURE.md` (the file tree), `docs/history/PRE_LAUNCH_CHECKLIST.md`.

---

## 1. The planes

```
┌──────────────── app (Expo RN, TypeScript) ────────────────┐
│  src/features/*/*.queries.ts  — TanStack Query hooks       │
│  over @/shared/supabase/client (Supabase JS)               │
│  + react-native-purchases (RevenueCat SDK, App Store)      │
└───────┬──────────────────┬──────────────────┬─────────────┘
        │ direct queries    │ functions.invoke  │ functions.invoke
        │ (RLS-scoped)      │ (session token)   │ (anon JWT)
        ▼                   ▼                   ▼
┌──────────────┐  ┌───────────────────────┐  ┌───────────────┐
│ Postgres     │  │ Edge Functions        │  │ content/      │
│ (RLS + RPCs) │  │ import-recipe         │  │ (TheMealDB    │
│              │  │ generate-recipe       │  │  supporter    │
│ recipes,     │  │ resolve-nutrition     │  │  proxy)       │
│ favorites,   │  │ delete-account        │  │ canonicalize/ │
│ plan_entries │  └───────┬───────────────┘  │ (batch tool)  │
│ otto_recipes │          │ OpenAI / USDA /  └──────┬────────┘
│ memberships  │          │ RevenueCat              ▼
│ households…  │          ▼                 TheMealDB v2 · OpenAI
└──────▲───────┘    api.openai.com
       │            api.nal.usda.gov
       │            api.revenuecat.com
       │ service-role upsert
┌──────┴──────────────┐   POST + shared secret   ┌────────────┐
│ revenuecat-webhook  │◀─────────────────────────│ RevenueCat │
└─────────────────────┘                          └────────────┘
```

Four ways bytes move:

1. **Direct DB access** — `supabase.from('recipes').select()/insert()/…`. No
   server hop. Every user table has RLS owner-only policies; the token the JS
   client carries *is* the credential.
2. **Edge functions** — `supabase.functions.invoke('<name>', …)`. The invoke
   attaches the session token; the function verifies it (`getUserId`) and
   derives identity from it — a client-supplied user id is never trusted.
3. **Capability RPCs** — `SECURITY DEFINER` functions for share pages / collab
   (§4) and joining a household, the only read path to that data (bare table
   SELECTs stay impossible).
4. **Server-to-server** — RevenueCat POSTs subscription events to
   `revenuecat-webhook`, which mirrors the `club` entitlement into
   `public.memberships`. The app itself talks to RevenueCat only through its SDK.

---

## 2. Edge functions (`supabase/functions/`)

Shared plumbing lives in `_shared/http.ts`: `corsHeaders`, `json(status, body)`,
`preflight`, `getUserId(req)` (token → user id, or null), `serviceClient()`
(service-role, from `Deno.env` only), and `rateLimited(key, limit, windowMs)` (a
per-user sliding window), plus `requireClub(userId)` (the server-side Otto Club
gate: reads `memberships`, falls back to the RevenueCat REST API, 402 when not a
member; active only when `REQUIRE_CLUB=on`). `_shared/openai.ts` is the one
model-call helper every AI function shares (`api.openai.com/v1/chat/completions`,
strict JSON schema, `reasoning_effort`, `OPENAI_API_KEY`). Service-role and API
keys come **only** from `Deno.env` and are never logged or echoed.

| Function | Method | Auth | Purpose (from its `index.ts`) |
|---|---|---|---|
| `content` | GET | anon JWT (no user) | TheMealDB **v2 supporter** passthrough. `endpoint` allowlist (`search/lookup/random/categories/filter/list.php`) + param allowlist (`s i a c f`). TTL cache (24h lookups, 1h search) with stale-on-error. Exists only to keep `THEMEALDB_KEY` out of the app bundle; **503 if the key is unset** — no free-tier fallback. |
| `import-recipe` | POST | user + rate-limit (30/15m) + Club | URL → recipe draft via **schema.org JSON-LD**. Deterministic, no LLM on that path. Pages with no Recipe data (TikTok, Instagram, YouTube…) fall back to the post's caption, transcribed by `generate-recipe`'s `{text}` mode (`caption.ts`). **SSRF-guarded**: resolve-then-connect; every redirect hop's resolved IP checked against private/reserved ranges (v4, IPv6, and IPv4-mapped/NAT64 bypasses); 3 MB byte cap; http(s) only; 12s timeout. `422` when no recipe is found. |
| `generate-recipe` | POST | user + rate-limit (20/15m) + Club | OpenAI `gpt-5.1` (text and vision), strict JSON schema, `reasoning_effort`. Body selects the mode: **`{prompt}`** → one-shot recipe; **`{messages}`** → chat (`clarify`/`recipe`/`decline`), with **`stream: true`** relayed as SSE (`streamParse.ts`); **`{image}`** → vision (photo→recipe) via `imageMode.ts`; **`{text}`** (or an over-long `{prompt}`) → paste/caption transcription. `is_possible`/decline gate (422). **Dormant → 503** without `OPENAI_API_KEY`. |
| `resolve-nutrition` | POST | user + rate-limit (20/15m) + Club | Live-USDA tail for ingredient names the on-device table misses. USDA FoodData Central search (`Foundation`+`SR Legacy`, per-100g) → OpenAI `gpt-5-mini` **picks** the matching `fdcId`. Honesty guard: the pick must be a candidate USDA actually returned, else `null`. Caches hits AND misses durably in `resolved_ingredients`. Needs `OPENAI_API_KEY` + `USDA_API_KEY`; otherwise an honest (uncached) miss. |
| `delete-account` | POST/DELETE | user + rate-limit (5/15m) | App Store 5.1.1(v). Order: `admin_delete_user_data` RPC (one transaction over all owned rows), then Storage photos (`recipe-photos/<userId>/…`, paged), then the RevenueCat subscriber record, then Sign in with Apple token revocation (when the app sends an authorization code), then the auth user (`delete-account/index.ts:150-166`). |
| `revenuecat-webhook` | POST | shared secret (`RC_WEBHOOK_SECRET` in `Authorization`, constant-time compare; deployed with `verify_jwt` off) | RevenueCat fires it on every subscription event. Ignores the payload's state: fetches the subscriber's **current** `club` entitlement from the RevenueCat REST API (`REVENUECAT_SECRET_KEY`) and mirrors it — upsert into `memberships` (lifetime grants → far-future expiry), or delete the row when there's no entitlement. Idempotent; non-UUID (anonymous) app user ids are acknowledged and skipped; non-2xx → 502 so RevenueCat retries. No CORS. |
| `canonicalize` | POST | anon key (no user) + circuit-breaker (1000/h) | One-time `otto_recipes` migration tool (OWN_RECIPE_DB Phase 2): one original TheMealDB recipe + the usdaTable key allowlist in → one canonical record out (usdaTable keys, metric grams, servings, flags) via OpenAI `gpt-5.1`. Transforms text only — **no DB writes**; the batch driver upserts. **Dormant → 503** without `OPENAI_API_KEY`. Marked for deletion after the batch. |

### The AI/costly pattern (every server-side money/destructive path)
1. **Token-derived identity** — `getUserId`; never an anonymous or client-named user.
2. **Per-user rate limit** — `rateLimited(...)` → 429 with plain-language copy.
3. **Club gate** — `requireClub(userId)` → 402 "This needs Otto Club" (when `REQUIRE_CLUB=on`).
4. **Dormant gate** — `openaiActive()` (`Boolean(Deno.env.get('OPENAI_API_KEY'))`) → honest 503.
5. **Honest declines** — `is_possible`/candidate-guard → 422/`null`, never invention.
6. **Review-first** — generated/imported drafts land on the edit screen; saved
   rows carry an honest `source` (`imported` / `otto` / manual).

Errors are returned as `{ error: "<sentence in Otto's voice>" }`; the client's
`invokeEdge` surfaces that body verbatim onto a toast (see
`src/features/import/import.queries.ts`).

---

## 3. Direct database access (TanStack Query + RLS)

Screens never `fetch`. Each feature owns a `*.queries.ts` with TanStack Query
hooks over the Supabase client. RLS is the boundary — the same query run by two
users returns two different row sets, enforced in Postgres, not in app code.

| Domain | File | Talks to |
|---|---|---|
| Discover / detail | `features/recipes/recipe.queries.ts` | `otto_recipes` table (public read, behind `EXPO_PUBLIC_USE_OTTO_RECIPES`) or `content` fn (seed) + `recipes` table (user) |
| Cookbook | `features/cookbook/{mine,saved}.queries.ts` | `recipes`, `favorites` |
| Import / editor CRUD | `features/import/import.queries.ts` | `import-recipe` + `generate-recipe` fns, `recipes` insert/update/delete |
| Nutrition | `features/nutrition/{nutrition,resolve}.queries.ts` | on-device engine (bundled tables), `resolve-nutrition` fn. `seed_nutrition` exists in the schema but no client code reads it |
| Planner | `features/planner/plan.queries.ts` | `plan_entries`; recipe lookups through `fetchSeedRecipe` (`features/recipes/seed.loader.ts`), which reads `otto_recipes` or calls the `content` fn depending on `EXPO_PUBLIC_USE_OTTO_RECIPES` |
| Household list | `features/household/household.queries.ts` + `useHousehold.ts` | `households*` tables + **Realtime** |
| Chat | `features/chat/chat.queries.ts` | `generate-recipe` fn (chat mode; streaming via `fetch` to `/functions/v1/generate-recipe`) |
| Share | `features/share/share.queries.ts` | `recipe_shares` / `list_shares` + capability RPCs |
| Profile / account | `features/profile/profile.queries.ts` | `delete-account` fn |
| Otto Club | `features/profile/club.purchases.ts` + `club.logic.ts` | RevenueCat SDK (purchase/restore/entitlement `club`) — not Supabase |

**Realtime**: `useSharedList` / `useHousehold`
(`src/features/household/useHousehold.ts`) open a
`supabase.channel().on('postgres_changes', …)` subscription on
`household_list_state` / `household_members`; a push just
`invalidateQueries` the relevant key, so every member's list updates live. (The
tables are added to the `supabase_realtime` publication in the households
migration.)

---

## 4. Capability URLs — share pages (+ household join)

Share data is reached only through `SECURITY DEFINER` RPCs
(`supabase/migrations/20260721090009_share_functions.sql`), each keyed on the
exact slug/token so URLs are never enumerable. (The v1 collab-list RPCs and
tables were dropped in `20260723120000_harden_security_definer_functions.sql`;
shared lists are households now.)

| RPC | Returns | Granted to |
|---|---|---|
| `get_recipe_share(slug)` | `{status, recipe}` (owner `user_id` stripped) | anon + authenticated |
| `get_list_share(token)` | `{status, payload}` (list snapshot) | anon + authenticated |
| `join_household(code)` | the household id (validates the invite code) | authenticated only |

Status vocabulary: `ok` / `revoked` (410) / `missing` or zero rows (404). Bare
SELECTs on the underlying tables are blocked by RLS.

---

## 5. Cross-cutting contracts

- **Auth**: `Authorization: Bearer <supabase access token>`, attached by the JS
  client. Edge functions verify + derive identity via `getUserId`; DB access is
  RLS-scoped. `content` needs only the anon JWT (Discover works before signup).
- **Error shape**: `{ error: "user-ready sentence in Otto's voice" }`. The
  client surfaces `error.context.json().error` verbatim — server copy IS the toast.
- **Status vocabulary**: 400 invalid input · 401 no/bad token (or bad webhook
  secret) · 402 Otto Club required · 405 wrong method · 413 photo too big · 422
  honest decline (import/generate) · 429 rate-limit · 502 upstream failed · 503
  feature dormant / key unset / Club check unavailable.
- **Rate limits**: per-user sliding windows in the functions (`gen`/`resolve`
  20/15m, `import` 30/15m, `del` 5/15m; `canon` 1000/h global); Supabase's platform per-IP limits guard `content`'s
  supporter key. No shared Express limiter anymore.
- **Timeouts**: upstream calls carry `AbortSignal.timeout(...)` (OpenAI
  60–120s, USDA 10s, page fetch 12s, TheMealDB 10s, RevenueCat Club check 6s).
  Exception: `revenuecat-webhook`'s RevenueCat fetch has no timeout.
- **Client layer**: all network is TanStack Query over the Supabase client in
  `*.queries.ts`; no raw `fetch` in screens. One recipe shape
  (`mealdb.transform.ts`) so surfaces never branch on origin.
- **Secrets**: service-role + API keys live only in Supabase secrets / `Deno.env`
  and are never logged. `EXPO_PUBLIC_*` carries only the Supabase URL + anon key
  (extractable by design; RLS is what protects data).

---

## 6. Founder activation switches (the non-code blockers)

| Switch | Where | Wakes |
|---|---|---|
| `OPENAI_API_KEY` | Supabase secret | `generate-recipe`, `canonicalize` + the model half of `resolve-nutrition` |
| `USDA_API_KEY` | Supabase secret | live-USDA tail in `resolve-nutrition` |
| `THEMEALDB_KEY` | Supabase secret | the `content` seed library (503 until set) |
| `RC_WEBHOOK_SECRET` + `REVENUECAT_SECRET_KEY` | Supabase secrets | `revenuecat-webhook` (fails closed without them) + `requireClub`'s REST fallback |
| `REQUIRE_CLUB=on` | Supabase env | the server-side Otto Club gate on `generate-recipe`, `import-recipe`, `resolve-nutrition` |
| `recipe-photos` bucket + policies | migrations `…_storage_policies.sql` | device photo upload |
| Edge functions deployed | `supabase functions deploy` | any of the above going live |

Nutrition itself needs **no** activation: the 962-row USDA table ships on-device,
so per-serving figures compute with zero network and zero keys. The resolver
tail only enriches names the bundle misses.
