# Otto — API Communication Architecture

The authoritative map of how the app talks to the outside world in **v2**. There
is **no Express backend**: the app talks **directly to Supabase** (Postgres via
the JS client, guarded by RLS) and calls a small set of **Edge Functions** for
the jobs that must run server-side (secret keys, arbitrary-URL fetching, the
Claude calls, account deletion). Companion docs: `ARCHITECTURE.md` (the file
tree), `PRE_LAUNCH_CHECKLIST.md`.

---

## 1. The planes

```
┌──────────────── app (Expo RN, TypeScript) ────────────────┐
│  src/features/*/*.queries.ts  — TanStack Query hooks       │
│  over @/shared/supabase/client (Supabase JS)               │
└───────┬──────────────────┬──────────────────┬─────────────┘
        │ direct queries    │ functions.invoke  │ functions.invoke
        │ (RLS-scoped)      │ (session token)   │ (anon JWT)
        ▼                   ▼                   ▼
┌──────────────┐  ┌───────────────────────┐  ┌───────────────┐
│ Postgres     │  │ Edge Functions        │  │ content/      │
│ (RLS + RPCs) │  │ import-recipe         │  │ (TheMealDB    │
│              │  │ generate-recipe       │  │  supporter    │
│ recipes,     │  │ resolve-nutrition     │  │  proxy)       │
│ favorites,   │  │ delete-account        │  └──────┬────────┘
│ plan_entries │  └───────┬───────────────┘         │
│ households…  │          │ Claude / USDA           ▼
└──────────────┘          ▼                      TheMealDB v2
                    api.anthropic.com
                    api.nal.usda.gov
```

Three ways bytes move:

1. **Direct DB access** — `supabase.from('recipes').select()/insert()/…`. No
   server hop. Every user table has RLS owner-only policies; the token the JS
   client carries *is* the credential.
2. **Edge functions** — `supabase.functions.invoke('<name>', …)`. The invoke
   attaches the session token; the function verifies it (`getUserId`) and
   derives identity from it — a client-supplied user id is never trusted.
3. **Capability RPCs** — `SECURITY DEFINER` functions for share pages / collab
   lists (§4), the only read/write path to that data (bare table SELECTs stay
   impossible).

---

## 2. Edge functions (`supabase/functions/`)

Shared plumbing lives in `_shared/http.ts`: `corsHeaders`, `json(status, body)`,
`preflight`, `getUserId(req)` (token → user id, or null), `serviceClient()`
(service-role, from `Deno.env` only), and `rateLimited(key, limit, windowMs)` (a
per-user sliding window). Service-role and API keys come **only** from
`Deno.env` and are never logged or echoed.

| Function | Method | Auth | Purpose (from its `index.ts`) |
|---|---|---|---|
| `content` | GET | anon JWT (no user) | TheMealDB **v2 supporter** passthrough. `endpoint` allowlist (`search/lookup/random/categories/filter/list.php`) + param allowlist (`s i a c f`). TTL cache (24h lookups, 1h search) with stale-on-error. Exists only to keep `THEMEALDB_KEY` out of the app bundle; **503 if the key is unset** — no free-tier fallback. |
| `import-recipe` | POST | user | URL → recipe draft via **schema.org JSON-LD**. Deterministic, no LLM. **SSRF-guarded**: resolve-then-connect; every redirect hop's resolved IP checked against private/reserved ranges (v4, IPv6, and IPv4-mapped/NAT64 bypasses); 3 MB byte cap; http(s) only; 12s timeout. `422` when no recipe is found. |
| `generate-recipe` | POST | user + rate-limit (20/15m) | Claude `claude-opus-4-8`, JSON-schema-constrained, adaptive thinking. Body selects the mode: **`{prompt}`** → one-shot recipe; **`{messages}`** → chat (`clarify`/`recipe`/`decline`); **`{image}`** → vision (photo→recipe) via `imageMode.ts`. `is_possible`/decline gate (422). **Dormant → 503** without `ANTHROPIC_API_KEY`. |
| `resolve-nutrition` | POST | user + rate-limit (20/15m) | Live-USDA tail for ingredient names the on-device table misses. USDA FoodData Central search (`Foundation`+`SR Legacy`, per-100g) → Claude `claude-haiku-4-5` **picks** the matching `fdcId`. Honesty guard: the pick must be a candidate USDA actually returned, else `null`. Caches hits AND misses durably in `resolved_ingredients`. Needs `ANTHROPIC_API_KEY` + `USDA_API_KEY`; otherwise an honest (uncached) miss. |
| `delete-account` | POST/DELETE | user + rate-limit (5/15m) | App Store 5.1.1(v). Order kept from v1: `admin_delete_user_data` RPC (one transaction over all owned rows), then Storage photos (`recipe-photos/<userId>/…`, paged), then the auth user. |

### The AI/costly pattern (every server-side money/destructive path)
1. **Token-derived identity** — `getUserId`; never an anonymous or client-named user.
2. **Per-user rate limit** — `rateLimited(...)` → 429 with plain-language copy.
3. **Dormant gate** — `Boolean(Deno.env.get('ANTHROPIC_API_KEY'))` → honest 503.
4. **Honest declines** — `is_possible`/candidate-guard → 422/`null`, never invention.
5. **Review-first** — generated/imported drafts land on the edit screen; saved
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
| Discover / detail | `features/recipes/recipe.queries.ts` | `content` fn (seed) + `recipes` table (user) |
| Cookbook | `features/cookbook/{mine,saved}.queries.ts` | `recipes`, `favorites` |
| Import / editor CRUD | `features/import/import.queries.ts` | `import-recipe` + `generate-recipe` fns, `recipes` insert/update/delete |
| Nutrition | `features/nutrition/{nutrition,resolve}.queries.ts` | `seed_nutrition` (read), on-device engine, `resolve-nutrition` fn |
| Planner | `features/planner/plan.queries.ts` | `plan_entries`, `content` fn (seed lookups) |
| Household list | `features/household/household.queries.ts` + `useHousehold.ts` | `households*` tables + **Realtime** |
| Chat | `features/chat/chat.queries.ts` | `generate-recipe` fn (chat mode) |
| Share | `features/share/share.queries.ts` | `recipe_shares` / `list_shares` + capability RPCs |
| Profile / account | `features/profile/profile.queries.ts` | prefs tables, `delete-account` fn |

**Realtime**: `useSharedList` / `useHousehold`
(`src/features/household/useHousehold.ts`) open a
`supabase.channel().on('postgres_changes', …)` subscription on
`household_list_state` / `household_members`; a push just
`invalidateQueries` the relevant key, so every member's list updates live. (The
tables are added to the `supabase_realtime` publication in the households
migration.)

---

## 4. Capability URLs — share pages & collab lists

Share/collab data is reached only through `SECURITY DEFINER` RPCs
(`supabase/migrations/20260721090009_share_functions.sql`), each keyed on the
exact slug/token so URLs are never enumerable:

| RPC | Returns | Granted to |
|---|---|---|
| `get_recipe_share(slug)` | `{status, recipe}` (owner `user_id` stripped) | anon + authenticated |
| `get_list_share(token)` | `{status, payload}` (list snapshot) | anon + authenticated |
| `get_collab_list(token)` | `{status, is_mine, items}` | authenticated only |
| `add_collab_item / set_collab_item_checked / delete_collab_item` | the mutated row | authenticated only |

Status vocabulary: `ok` / `revoked` (410) / `missing` or zero rows (404). Bare
SELECTs on the underlying tables are blocked by RLS.

---

## 5. Cross-cutting contracts

- **Auth**: `Authorization: Bearer <supabase access token>`, attached by the JS
  client. Edge functions verify + derive identity via `getUserId`; DB access is
  RLS-scoped. `content` needs only the anon JWT (Discover works before signup).
- **Error shape**: `{ error: "user-ready sentence in Otto's voice" }`. The
  client surfaces `error.context.json().error` verbatim — server copy IS the toast.
- **Status vocabulary**: 400 invalid input · 401 no/bad token · 405 wrong method
  · 413 photo too big · 422 honest decline (import/generate) · 429 rate-limit ·
  502 upstream failed · 503 feature dormant / key unset.
- **Rate limits**: per-user sliding windows in the functions (`gen`/`resolve`
  20/15m, `del` 5/15m); Supabase's platform per-IP limits guard `content`'s
  supporter key. No shared Express limiter anymore.
- **Timeouts**: every upstream call carries `AbortSignal.timeout(...)` (Claude
  60–120s, USDA 10s, page fetch 12s, TheMealDB 10s) — no function hangs on a
  dead vendor.
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
| `ANTHROPIC_API_KEY` | Supabase secret | `generate-recipe` + the Claude half of `resolve-nutrition` |
| `USDA_API_KEY` | Supabase secret | live-USDA tail in `resolve-nutrition` |
| `THEMEALDB_KEY` | Supabase secret | the `content` seed library (503 until set) |
| `recipe-photos` bucket + policies | migrations `…_storage_policies.sql` | device photo upload |
| Edge functions deployed | `supabase functions deploy` | any of the above going live |

Nutrition itself needs **no** activation: the 962-row USDA table ships on-device,
so per-serving figures compute with zero network and zero keys. The resolver
tail only enriches names the bundle misses.
