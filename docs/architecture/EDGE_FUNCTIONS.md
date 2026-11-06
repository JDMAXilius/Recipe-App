# Otto — Edge Function contracts

Status: current · Last verified at commit `0cbfaa9f` · 2026-11-04

Seven functions live in `supabase/functions/*` (plus `_shared/`). All are Deno,
served at `https://<project>.supabase.co/functions/v1/<name>`. Secrets are read
only from `Deno.env`; this page lists env var **names** only.

## Shared building blocks (`supabase/functions/_shared/`)

| Helper | What it does | Evidence |
|---|---|---|
| `corsHeaders`, `preflight`, `json` | `Access-Control-Allow-Origin: *`; `OPTIONS` → `200 ok`; JSON responses as `{ error: "..." }` on failure | `_shared/http.ts:6-19` |
| `getUserId(req)` | Reads `Authorization: Bearer <token>`, verifies it with `auth.getUser` using `SUPABASE_URL` + `SUPABASE_ANON_KEY`; returns the uid or null. The uid is never taken from the body. | `_shared/http.ts:21-34` |
| `serviceClient()` | Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) | `_shared/http.ts:36-41` |
| `requireClub(uid)` | Server Otto Club gate. Off unless `REQUIRE_CLUB` is exactly `on`. On: active `memberships` row → pass; expired row → 402; no row → RevenueCat `GET /v1/subscribers/{uid}` (6 s timeout) with `REVENUECAT_SECRET_KEY`, mirror the answer into `memberships`, then pass or 402; key missing or RevenueCat down → 503. | `_shared/http.ts:43-94`; rules in `_shared/membership.ts:15-36` |
| `rateLimited(key, limit, windowMs)` | Sliding window in an isolate-local `Map`; resets on cold start and is not shared between isolates | `_shared/http.ts:96-110` |
| `openaiFetch` / `askJson` / `logUsage` | POST to OpenAI Chat Completions with strict `json_schema`, optional `reasoning_effort` and `stream`; non-2xx throws; `askJson` returns null on `length`/`content_filter`/refusal/unparseable; usage logs token counts only | `_shared/openai.ts:5-83` |

Status codes used across functions: 200, 400, 401, 402, 404, 405, 413, 422, 429,
500, 502, 503. Where `verify_jwt` is on (the platform default), the Supabase
gateway rejects a request without a valid JWT before the function runs; the repo
has **no `supabase/config.toml`**, so per-function `verify_jwt` settings are not
in source control (comments claim them at `revenuecat-webhook/index.ts:3`,
`content/index.ts:5-6`, `canonicalize/index.ts:11-13`).

Order of checks in every user-facing function: preflight → method → JWT →
rate limit → club gate → key present → body validation.

---

## `generate-recipe`

> 2026-11-06: its photo (vision) mode is **legacy** (ADR-0015). No current client sends it; it stays only for builds ≤1.0.23 and is removed with R6.6.

**Purpose.** All recipe text from OpenAI: Ask Otto chat (JSON or streamed),
photo transcription, pasted-text transcription, and one-shot generation
(`generate-recipe/index.ts:1-5`). The body's keys pick the mode, checked in this
order: `messages` → `image` → `text` (or a `prompt` longer than 600 chars) →
`prompt` (`:332`, `:351`, `:380`, `:400`).

| Item | Contract |
|---|---|
| Route | `POST /functions/v1/generate-recipe` (`OPTIONS` preflight; anything else 405, `:310-312`) |
| Auth | User JWT via `getUserId` (`:314-315`); Otto Club gate (`:322-323`) |
| Rate limit | `gen:<uid>` 20 per 15 min (`:317-319`) |
| Model | `gpt-5.1` for text and vision (`:14-15`); `max_completion_tokens` 4000, 120 s timeout (`:166-168`, `:212-215`) |
| `reasoning_effort` | streaming chat `low` (`:213`); non-streaming chat, paste and one-shot `medium` (`:343`, `:387`, `:408`); vision omitted (model default) (`:359-365`) |

**Request shapes** (zod at `:18-39`, image check at `generate-recipe/imageMode.ts:8-23`):

```jsonc
// chat
{ "messages": [{ "role": "user" | "assistant", "content": "1..600 chars" }],  // 1..20 items; server keeps the last 12, last must be "user"
  "stream": true,            // optional
  "servings": 1..24,         // optional, all three modes that take them
  "diet": "≤40 chars",       // optional
  "cuisines": ["≤40 chars"]  // optional, ≤6 }
// vision
{ "image": "<base64, ≤10,000,000 chars>", "mimeType": "image/jpeg" | "image/png" | "image/webp" }
// paste / caption transcription
{ "text": "40..8000 chars" }      // or { "prompt": "<more than 600 chars>" }
// one-shot
{ "prompt": "3..600 chars", "servings"?, "diet"?, "cuisines"? }
```

**Responses.**

- One-shot, paste, vision → `200`
  `{ title, servings, category|null, area|null, ingredients:[{measure,name}], steps:[string], image:null, source:"otto", sourceUrl:null, sourceName:null }`
  (`:374`, `:396`, `:417`). Clamps: ≤100 ingredients, ≤60 steps, step ≤2000 chars,
  servings default 4, max 24 (`:127-151`).
- Chat (JSON) → `200` one of
  `{ mode:"clarify", message, options:[≤4 strings] }`,
  `{ mode:"recipe", message, recipe:{ ...as above } }`,
  `{ mode:"decline", message }` (`:175-194`).
- Chat with `stream: true` → `200`, `content-type: text/event-stream` (`:282-284`).
  Frames are `data: <json>\n\n` (`:205`):
  - `{"type":"delta","text":"..."}` — the next slice of the decoded `message`
    field as it streams (`:241-247`; prefix decoder `generate-recipe/streamParse.ts:9-53`);
  - then exactly one of `{"type":"done","payload":<the JSON-path chat payload>}`
    or `{"type":"error","error":"..."}` (`:258-266`, `:267-274`).
  Errors after the stream opens arrive as an `error` event on a 200, not as a status.

**Errors.**

| Status | When | Evidence |
|---|---|---|
| 400 | body fails zod; last chat turn not `user`; bad image; paste outside 40..8000 | `:334`, `:336`, `:357`, `:383`, `:401` |
| 401 | missing/invalid token | `:315` |
| 402 | club gate on and not a member | `_shared/http.ts:65`, `:89` |
| 405 | not POST | `:312` |
| 413 | image over the size cap | `:355-356` |
| 422 | model says not possible (decline reason ≤300 chars) | `:367-371`, `:389-393`, `:410-414` |
| 429 | rate limit | `:318` |
| 502 | model output unusable or upstream failure | `:344`, `:346`, `:366`, `:373`, `:388`, `:395`, `:409`, `:416`, `:420` |
| 503 | `OPENAI_API_KEY` unset; or club gate cannot check | `:324-326`; `_shared/http.ts:68`, `:92` |

**External calls.** OpenAI Chat Completions (`_shared/openai.ts:35-47`); via
the gate, Postgres `memberships` and RevenueCat REST (`_shared/http.ts:58-89`).

**Env var names.** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`,
`REQUIRE_CLUB`, and when the gate is on `SUPABASE_SERVICE_ROLE_KEY`,
`REVENUECAT_SECRET_KEY`.

**Called by.**
- Chat, streaming: `src/features/chat/chat.queries.ts:129-136` (from `useChat`, `src/features/chat/useChat.ts:177`).
- Chat, JSON: `src/features/chat/chat.queries.ts:85` (`sendChat`, no caller today).
- Paste: `src/features/import/import.queries.ts:95`. Photo: `:104`. One-shot: `:87` (hook `useGenerateRecipe`, no screen uses it).
- Server-to-server from `import-recipe` for captions: `supabase/functions/import-recipe/index.ts:267-276`.

**Tests.** `supabase/functions/generate-recipe/imageMode.test.mjs` (4 tests: size/mime checks),
`supabase/functions/generate-recipe/streamParse.test.mjs` (12 tests: SSE line split,
`message` prefix decoding), `supabase/functions/_shared/membership.test.mjs` (gate rules);
client parser `src/features/chat/sse.logic.test.mjs`. No test exercises the handler itself.

---

## `import-recipe`

**Purpose.** URL → recipe draft from schema.org JSON-LD, with no model call on
that path; social posts with no Recipe data fall back to the caption, which is
transcribed by `generate-recipe`'s `{text}` mode (`import-recipe/index.ts:1-9`).

| Item | Contract |
|---|---|
| Route | `POST /functions/v1/import-recipe` (`:356-359`) |
| Auth | User JWT (`:361-362`); Otto Club gate (`:368-369`) |
| Rate limit | `import:<uid>` 30 per 15 min (`:365-367`) |
| Request | `{ "url": "<valid URL, ≤2000 chars>" }` (`:14`) |
| Response 200 | `{ title, image|null, servings|null, category|null, area|null, ingredients:[{measure,name}], steps:[string], sourceUrl, sourceName }` (`:343-353`); caption path sets `image: null` (`:280-290`) |

**SSRF guard.** http(s) only, every hop DNS-resolved and every A/AAAA checked
against private, loopback, link-local, CGNAT, unique-local, NAT64 and IPv4-mapped
ranges, manual redirects (max 4), 12 s timeout, HTML content types only, 3 MB
streamed cap (`:17-18`, `:20-66`, `:68-86`, `:88-142`). Known residual: DNS
rebinding between check and fetch (`:92-98`).

**Errors.**

| Status | When | Evidence |
|---|---|---|
| 400 | not a valid URL | `:371-372` |
| 401 | missing/invalid token | `:362` |
| 402 / 503 | club gate | `_shared/http.ts:55-94` |
| 405 | not POST | `:359` |
| 422 | no recipe found (social hosts get a "snap a screenshot" message); any fetch/parse/SSRF failure → "Couldn't read that page" | `:376-384`, `:386-388` |
| 429 | rate limit | `:366` |

**External calls.** The target site (any public host), DNS (`Deno.resolveDns`,
`:76-82`), TikTok oEmbed `https://www.tiktok.com/oembed` 8 s (`:243-255`), and
`generate-recipe` with the caller's own `Authorization` header, 90 s
(`:261-277`).

**Env var names.** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REQUIRE_CLUB`, and when the
gate is on `SUPABASE_SERVICE_ROLE_KEY`, `REVENUECAT_SECRET_KEY`.

**Called by.** `src/features/import/import.queries.ts:73-75` (`importFromUrl`),
used by `src/features/import/AddSheet.tsx:66`.

**Tests.** `supabase/functions/import-recipe/caption.test.mjs` (3 tests:
entity decoding and Instagram caption parsing). The authed URL-import e2e block is
skipped while its fixture is null (`e2e/fixtures/import.json:2`,
`e2e/journeys/import.ts:11-14`).

---

## `resolve-nutrition`

**Purpose.** For ingredient names the on-device table misses: search USDA
FoodData Central, then let the model **pick** one of the returned `fdcId`s; a pick
that USDA did not return is discarded (`resolve-nutrition/index.ts:1-11`, `:157-165`).

| Item | Contract |
|---|---|
| Route | `POST /functions/v1/resolve-nutrition` (`:168-171`) |
| Auth | User JWT (`:173-174`); Otto Club gate (`:179-180`) |
| Rate limit | `resolve:<uid>` 20 per 15 min (`:176-178`) |
| Request | `{ "names": ["1..120 chars"] }`, 1..40 names (`:22-27`); names are trimmed, lowercased, deduped (`:185`) |
| Response 200 | `{ "resolved": { "<name>": FoodRow | null } }` where FoodRow = `{ fdcId, usda, kcal, protein_g, fat_g, carbs_g, fiber_g, sugar_g, sodium_mg }` per 100 g (`:131-134`, `:229`) |
| Model | `gpt-5-mini`, 2000 tokens, `reasoning_effort: low`, 60 s (`:21`, `:62-64`) |

Behaviour: reads the durable cache `resolved_ingredients` first, failing open
(`:189-201`); if both `OPENAI_API_KEY` and `USDA_API_KEY` are set, resolves the rest
and caches hits **and** misses (`:203-225`); otherwise returns null for the rest
without caching (`:226`). It never returns 503 for missing keys.

**Errors.** 400 `Invalid names` (`:183`), 401 (`:174`), 402/503 club gate, 405
(`:171`), 429 (`:177`). USDA and model failures degrade to null, not an error
(`:125-128`, `:205-209`).

**External calls.** USDA `POST https://api.nal.usda.gov/fdc/v1/foods/search`
(Foundation + SR Legacy, 6 results, 10 s), with the key in the query string
(`:67-69`, `:108-129`); OpenAI; Postgres `resolved_ingredients` as service role.

**Env var names.** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`OPENAI_API_KEY`, `USDA_API_KEY`, `REQUIRE_CLUB`, `REVENUECAT_SECRET_KEY`.

**Called by.** `src/features/nutrition/resolve.queries.ts:45-56`, only after AI
consent is already granted (`src/features/nutrition/nutrition.queries.ts:64-65`).

**Tests.** None for the function. The client's use of resolved rows is covered by
`src/features/nutrition/engine/compute.resolve.test.mjs`.

---

## `content`

**Purpose.** Read-only passthrough to TheMealDB v2 so the supporter key stays
server-side (`content/index.ts:1-6`).

| Item | Contract |
|---|---|
| Route | `GET /functions/v1/content/<endpoint>?<params>`; endpoint ∈ `search.php`, `lookup.php`, `random.php`, `categories.php`, `filter.php`, `list.php`; params ∈ `s`, `i`, `a`, `c`, `f` (each ≤200 chars), others dropped (`:17-25`, `:47-56`) |
| Auth | No user check in code; relies on the platform's `verify_jwt` with the anon key (`:5-6`) |
| Rate limit | None in code; Supabase platform limits only (`:6`) |
| Response 200 | TheMealDB JSON verbatim (`:71`, `:77`) |
| Cache | Isolate-local LRU, 500 entries; 24 h for lookup/categories/list, 1 h for search/filter, none for random; stale entry served if upstream fails (`:27-38`, `:57-64`, `:79-80`) |

**Errors.** 404 unknown endpoint or bad params (`:52`), 405 not GET (`:43`), 503
`THEMEALDB_KEY` unset (`:44-45`), 502 upstream failure with nothing cached (`:81-85`).

**External calls.** `https://www.themealdb.com/api/json/v2/<key>/<endpoint>`, 10 s (`:15`, `:67-69`).

**Env var names.** `THEMEALDB_KEY` (read once at module load, `:14`).

**Called by.** `src/features/recipes/seed.loader.ts:25-31` (`content()`), used from
`src/features/recipes/recipe.queries.ts:106`, `:116`, `:156` and
`src/features/recipes/seed.loader.ts:47` when `EXPO_PUBLIC_USE_OTTO_RECIPES` is not `true`.

**Tests.** None for the function; response parsing is covered by
`src/features/recipes/mealdb.transform.test.mjs`.

---

## `delete-account`

**Purpose.** App Store 5.1.1(v) account deletion, in a fixed order: owned rows in
one transaction, Storage photos, RevenueCat subscriber, Sign in with Apple token
revocation, then the auth user last (`delete-account/index.ts:1-7`, `:142-175`).

| Item | Contract |
|---|---|
| Route | `POST` or `DELETE /functions/v1/delete-account` (`:131-133`) |
| Auth | User JWT; the uid comes only from the token (`:135-136`). No club gate (non-members must be able to delete: the paywall offers it, `src/features/profile/OttoClubScreen.tsx:41`) |
| Rate limit | `del:<uid>` 5 per 15 min (`:138-140`) |
| Request | optional `{ "appleAuthorizationCode": "<string>" }` (`:160-163`) |
| Response 200 | `{ dataDeleted: true, authUserDeleted: true, photosDeleted: <number>, revenueCatDeleted: <boolean>, appleRevoked: <boolean or null> }` (`:175`) |

Steps:
1. RPC `admin_delete_user_data(p_user_id)` as service role (`:145-146`) — deletes
   `favorites`, `recipes`, `plan_entries`, `recipe_shares`, `list_shares`
   (`supabase/migrations/20260924234635_fix_admin_delete_user_data_drop_collab.sql:9-22`).
2. Remove `recipe-photos/<uid>/*`, paging 100 at a time, max 50 pages; failures logged, not fatal (`:10-41`, `:151`).
3. RevenueCat `DELETE /v1/subscribers/<uid>`, 8 s; 404 counts as done; best effort (`:47-66`, `:156`).
4. If a code was sent: build an ES256 client secret, exchange the code at
   `appleid.apple.com/auth/token`, revoke at `/auth/revoke`, 8 s each; best effort (`:74-126`, `:159-163`).
5. `auth.admin.deleteUser(uid)` (`:166`); this cascades `memberships`,
   `households` the user created (with all their members and list state) and
   `household_members` rows.

**Errors.** 401 (`:136`), 405 (`:132`), 429 (`:139`), 500 if the RPC throws or the
auth user survives (`:146`, `:170-173`, `:176-179`). Retrying is safe (`:167-169`).

**External calls.** Postgres (service role), Storage, RevenueCat REST, Apple ID.

**Env var names.** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`REVENUECAT_SECRET_KEY`, `APPLE_SIWA_KEY`, `APPLE_SIWA_KEY_ID`, `APPLE_TEAM_ID`,
`APPLE_CLIENT_ID`.

**Called by.** `src/features/profile/profile.queries.ts:8-13`, from
`src/features/profile/useDeleteAccount.ts:33-41` (which first asks Apple for a fresh
authorization code, `src/features/auth/oauth.native.ts:119-127`).

**Tests.** `supabase/migrations/tests/rls-attacks.test.mjs:267` (another user
cannot call `admin_delete_user_data`) and `:283` (cleanup asserts the function
returns 200). That suite runs against the live project and is not part of `npm test`.

---

## `revenuecat-webhook`

**Purpose.** Keep `memberships` in step with RevenueCat. Each event triggers a
fresh read of the subscriber's current `club` entitlement; the event payload's
state is never trusted, so out-of-order or replayed events cannot regress
`expires_at` (`revenuecat-webhook/index.ts:1-13`).

| Item | Contract |
|---|---|
| Route | `POST /functions/v1/revenuecat-webhook`; no CORS, no `OPTIONS` handling (`:21-25`, `:43`) |
| Auth | `Authorization` header equals `RC_WEBHOOK_SECRET` or `Bearer <RC_WEBHOOK_SECRET>`, compared in constant time over SHA-256 digests; missing secret fails closed (`:27-50`). Comment says deployed with `verify_jwt` off (`:3`). |
| Rate limit | None |
| Request | RevenueCat event JSON; uses only `event.app_user_id`, `event.store`, `event.environment` (`:52-53`, `:92-93`) |
| Response | `200 {ignored:"no supabase user id"}` when `app_user_id` is not a UUID (`:54-56`); `200 {member:false}` after deleting the row (`:80-85`); `200 {member:true, expires_at}` after upsert (`:88-100`) |

**Errors.** 401 bad secret (`:50`), 405 not POST (`:43`), 502 when the RevenueCat
read, the delete or the upsert fails, so RevenueCat retries (`:62-66`, `:84`, `:96-99`).

**External calls.** RevenueCat `GET https://api.revenuecat.com/v1/subscribers/<uid>`
with **no timeout** (`:58-61`); Postgres `memberships` as service role (`:70-74`).

**Env var names.** `RC_WEBHOOK_SECRET`, `REVENUECAT_SECRET_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`.

**Called by.** RevenueCat (webhook URL configured in the RevenueCat dashboard, not
in this repo). No app code calls it.

**Tests.** None. Its expiry rule duplicates `entitlementExpiry` in
`_shared/membership.ts:31-36` (tested) rather than importing it (`:78`).

---

## `canonicalize`

**Purpose.** One-time batch tool for the `otto_recipes` migration: one TheMealDB
recipe plus the allowed usdaTable keys in, one canonical record out. Text only, no
DB writes (`canonicalize/index.ts:1-13`).

| Item | Contract |
|---|---|
| Route | `POST /functions/v1/canonicalize` (`:210-213`) |
| Auth | No user check; "the batch driver calls with the anon key" (`:11-13`, `:215-219`) |
| Rate limit | One global key `canon`, 1000 per hour per isolate (`:220-222`) |
| Request | `{ recipe: { id: 1..64 chars, title: 1..300, category?, area?, instructions: 1..20000, ingredient_lines: [1..300 chars] 1..120 }, keys: [1..120 chars] 1..2000 }` (`:23-33`) |
| Response 200 | `{ record: { id, title, category|null, area|null, servings (1..100), instructions:[string], ingredients:[{ original, key|null, grams, cooked, frying_medium, note|null }] } }`; keys not in the allowlist become null (`:169-208`, `:239`) |
| Model | `gpt-5.1`, 8000 tokens, 120 s, no `reasoning_effort` (`:20`, `:143-145`) |

**Errors.** 400 invalid body (`:229`), 405 (`:213`), 429 (`:221`), 502 with a `detail`
string when the model output is unusable or the call fails (`:235-238`, `:240-244`),
503 `OPENAI_API_KEY` unset (`:223-225`).

**External calls.** OpenAI only.

**Env var names.** `OPENAI_API_KEY`.

**Called by.** `tools/canonicalize-recipes.mjs:57` (hard-coded project URL) and
`:684` (`--run-batch`). No app code.

**Tests.** None for the function.

---

## `scan-meal` (new, 2026-11-06 · not deployed)

Snap a meal (ADR-0013, ADR-0015): one photo of food → the recipe of the whole dish the portion came from (2 slices of banana bread → the loaf, served by the slice).

| Field | Contract |
|---|---|
| Purpose | Identify the dish and reconstruct its full recipe (batch yield, servings in a natural unit, the photographed portion, ingredients weight-first, steps). No calories: the app computes nutrition on the device at save |
| Method | `POST` |
| Auth | `getUserId` (401) → `requireClub` (402 when `REQUIRE_CLUB=on`). The pre-account scan (3 per device, DeviceCheck/App Attest) is R0.16 and not built |
| Rate limit | 10 per 15 min per user (isolate-local, like the others) |
| Request | `{ image: base64, mimeType: image/jpeg \| image/png \| image/webp }`, checked by `_shared/image.ts` (413 too big, 400 malformed) |
| Model | `gpt-5.1`, strict `SCAN_SCHEMA` (`scan-meal/scan.ts`), effort medium, 55 s timeout |
| Checks | `checkScan` in code: enough ingredients and steps; baked archetypes make a whole batch of ≥4 servings; leavening ≤ 6% and sugar ≤ 150% of flour; single meals ≤ 8 servings; portion ≤ servings. Failures get **one** retry with the issues as feedback; anything still off is returned in `scan.checks` and shown to the user |
| Response 200 | The editor's draft fields (`title, servings, category, area, ingredients, steps, image: null, source: "otto", sourceUrl: null, sourceName: null`) plus `scan: { archetype, seen[], portion, yield, servingUnit, questions[≤2], assumptions[], checks[], closest }`. `closest` is the best title match in `otto_recipes` (read via the service client) |
| Errors | 401, 402, 405, 413, 400, 422 (no food: the model's kind decline), 429, 502 (model lost the plot), 503 (no key) |
| Env | `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REQUIRE_CLUB`, `REVENUECAT_SECRET_KEY` |
| Client | `scanMeal` / `useScanMeal` in `src/features/import/import.queries.ts`; Add screen tile "Snap a meal" (behind `flags.flowV2`) |
| Tests | `scan-meal/scan.test.mjs` with contract fixtures in `scan-meal/fixtures/` (model outputs, not photos). The photo calibration set (real meals with known recipes) is still to build (R6.5) |
| Storage | The photo is not stored by this function |

## Open questions / risks

1. **`canonicalize` is still deployed-shaped code with no user auth.** Its header
   says it is a one-time endpoint to be deleted after the batch
   (`canonicalize/index.ts:1-2`). Anyone holding the anon key, which ships in every
   app build (`src/shared/supabase/client.ts:9`), can spend OpenAI tokens at up to
   1000 calls per hour per isolate (`canonicalize/index.ts:220`).
2. **The server paywall is off by default.** `requireClub` only acts when
   `REQUIRE_CLUB=on` (`_shared/membership.ts:15-17`); the repo cannot show whether
   production sets it, and `supabase/functions/.env.example` lists no
   `REQUIRE_CLUB`. Until it is on, any signed-in account can call the paid AI
   functions directly.
3. **`verify_jwt` is not in source control** (no `supabase/config.toml`). `content`
   and `canonicalize` rely on it being on; `revenuecat-webhook` needs it off.
4. **Rate limits are per isolate** and reset on cold start (`_shared/http.ts:96-98`).
   `import-recipe`'s caption path also consumes the caller's `gen` budget in
   `generate-recipe`, in whichever isolate serves it.
5. **SANDBOX purchases unlock the server gate.** `memberships.environment` is
   commented "never gate prod features on SANDBOX rows"
   (`supabase/migrations/20260723150000_memberships.sql:12`), but
   `isActiveMembership` counts SANDBOX rows on purpose (`_shared/membership.ts:19-26`).
6. **`memberships` has two writers.** The migration says it is written only by the
   webhook (`20260723150000_memberships.sql:1-4`); `requireClub` also upserts
   (`_shared/http.ts:80-87`), with `store` and `environment` null.
7. **Webhook RevenueCat call has no timeout** (`revenuecat-webhook/index.ts:58-61`),
   and if `REVENUECAT_SECRET_KEY` is missing it sends `Bearer undefined`, gets a
   non-2xx and returns 502 on every event, so RevenueCat retries indefinitely.
8. **`import-recipe` hides the real reason a caption transcription failed.** Any
   non-2xx from `generate-recipe` (402, 429, 503) becomes `null` and then a 422
   "couldn't find a written recipe" (`import-recipe/index.ts:277`, `:376-384`).
9. **Comment vs code on `reasoning_effort`.** `generate-recipe/index.ts:162-164`
   says chat, one-shot and paste pass `low`; only the streaming chat does
   (`:213`); the others pass `medium` (`:343`, `:387`, `:408`).
10. **Stale AI-provider comments in code.** The code calls OpenAI only, but comments
    still say Anthropic/Claude/Sonnet: `src/features/chat/ChatScreen.tsx:121`,
    `src/features/chat/chat.queries.ts:29`, `src/features/import/import.queries.ts:99`,
    `src/features/import/AddSheet.tsx:126`, `src/features/nutrition/nutrition.queries.ts:60`,
    `src/features/nutrition/engine/lookup.ts:4`, `src/features/profile/ProfileScreen.tsx:274`,
    `supabase/functions/resolve-nutrition/index.ts:12`.
11. **"5 edge functions"** in `_shared/http.ts:1` — there are seven.
12. **Household invite codes are guessable in principle.** 6 characters from a
    32-letter alphabet made with `Math.random` (`src/features/household/household.queries.ts:33-39`),
    and `join_household` has no attempt limit
    (`20260722120000_households_shared_shopping_list.sql:59-68`).
13. **Deleting a kitchen's creator deletes the kitchen for everyone** via
    `households.created_by ON DELETE CASCADE`
    (`20260722120000_households_shared_shopping_list.sql:7`), which `delete-account`
    triggers when it drops the auth user.
14. **`memberships` is missing from `src/types/database.ts`** (see [ERD.md](ERD.md#cross-check-against-srctypesdatabasets)).
15. **The Storage INSERT policy may not exist in production.** Its migration skips
    it with a NOTICE when the role lacks privilege
    (`20260721090010_storage_policies.sql:11-17`, `:36-38`); the repo cannot show
    whether it was created by hand.
16. **Photo path comments are stale.** `import.queries.ts:109-110` and
    `20260721090010_storage_policies.sql:2-3` say `<uid>/<timestamp>.<ext>`; the code
    uses a random UUID (`src/features/import/import.queries.ts:161`).
17. **`delete-account` comment in the client** says rows, photos, then the auth
    user (`src/features/profile/profile.queries.ts:1-5`); the function also deletes
    the RevenueCat subscriber and revokes Apple tokens.
18. **Dead or unused paths.** `sendChat` (non-streaming chat), `useGenerateRecipe`
    (one-shot `{prompt}`), and the share create/read hooks have no screen callers
    (see [C4.md](C4.md#key-facts-2)). Chat never sends `diet`/`cuisines`
    (`src/features/chat/ChatScreen.tsx:81`).
19. **Transcriptions are labelled `source: "otto"` by the server**
    (`generate-recipe/index.ts:374`, `:396`); the client relabels them
    `imported`/`manual` (`src/features/import/import.queries.ts:96`, `:105`).
20. **`resolved_ingredients` is readable by anon** (`20260721090008_resolved_ingredients.sql:16-19`),
    so every ingredient name any user has resolved is listable.
21. **USDA key travels in the query string** (`resolve-nutrition/index.ts:112`), so
    it can appear in upstream or proxy logs even though Otto never logs it.
22. **No handler-level tests** for any function; the RLS attack suite is outside
    `npm test` (`package.json` `scripts.test` globs `supabase/functions/**` only).

## Deployed settings (read from the Supabase project, 2026-11-04)

Read-only check with the Supabase management API; it answers open question 3 for production, though source control still lacks `supabase/config.toml`.

| Function | Status | Version | `verify_jwt` |
|---|---|---|---|
| content | ACTIVE | 13 | on |
| delete-account | ACTIVE | 15 | on |
| generate-recipe | ACTIVE | 22 | on |
| import-recipe | ACTIVE | 15 | on |
| resolve-nutrition | ACTIVE | 13 | on |
| canonicalize | ACTIVE | 14 | on (the anon key passes it; there is no user check) |
| revenuecat-webhook | ACTIVE | 10 | off (shared-secret check in code, as intended) |

`canonicalize` is still deployed although its header says it is deleted after the one-time 792-recipe batch. See `docs/tickets/TERMINAL_TICKET_ARCHITECTURE_FINDINGS.md` A1.
