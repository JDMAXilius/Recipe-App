# Otto — API Communication Architecture

Status: **adopted 2026-07-21** (cloud session; decisions logged as Phase 13 in
`docs/REDESIGN_NOTES.md`). This is the authoritative map of how every byte
moves between the app, the backend, and the outside world — what is shipped,
the contracts every route follows, and the numbered plan for the rest.

Companion docs: `BACKEND_ROADMAP.md` (feature history), `PRE_LAUNCH_CHECKLIST.md`,
`TERMINAL_TICKET_*.md` (work handed to the terminal session).

---

## 1. The four planes (shipped today)

```
┌─────────────── mobile (Expo RN, JS only) ───────────────┐
│  services/mealAPI.js      services/userRecipes.js       │
│  (content plane)          (user + AI planes, authFetch) │
└───────────┬──────────────────────┬──────────────────────┘
            │ no auth              │ Bearer <supabase JWT>
            ▼                      ▼
┌────────────────── backend (Express 5, Railway) ─────────────────┐
│ /api/content/*        /api/{recipes,favorites,plan,lists,...}   │
│    │                      │            /api/{import,generate}   │
│    ▼                      ▼                   │                 │
│ TheMealDB           Supabase Postgres         ▼                 │
│ (supporter key,     (Drizzle; RLS backstop)  Claude API         │
│  server-side)                                (dormant-gated)    │
│                                                                 │
│ /r /l /hl — server-rendered public share pages (no app needed)  │
└─────────────────────────────────────────────────────────────────┘
```

### 1a. Content plane — Discover before signup
- `mobile/services/mealAPI.js` → `GET /api/content/:endpoint` → TheMealDB.
- **No auth by design** (Discover works for anonymous guests); `contentLimiter`
  (600/15 min/IP) is what protects the paid key from being farmed as a proxy.
- Endpoint allowlist (`search|lookup|random|categories|filter|list.php`) and
  param allowlist (`s i a c f`) — anything else is dropped, not forwarded.
- The supporter key lives ONLY in `ENV.THEMEALDB_KEY`. Never `EXPO_PUBLIC_*`:
  anything bundled ships inside the IPA.

### 1b. User plane — everything owned by a person
- `mobile/lib/api.js#authFetch` attaches the Supabase access token; the server
  derives identity via `getUser` (never trusts a client-sent userId) and RLS
  on all 8 tables backstops every query.
- Resources: `recipes` (user ids `u-<dbId>`), `favorites`, `plan`, `lists`
  (collab shopping, token = membership), `share` mint/revoke, `nutrition`
  (compute-once cache), `account` (delete, two-tap + `destructiveLimiter`).
- Every write is zod-validated at the edge (`lib/validate.js`); clamps mirror
  the save schema so no flow can hand the editor an unsaveable draft.

### 1c. AI plane — Otto's paid brain (all dormant-gated)
| Seam | Route | Model | Job |
|---|---|---|---|
| URL import | `POST /api/import` | none → Haiku fallback | JSON-LD first (deterministic, SSRF-guarded); LLM only for social captions |
| Text import | `POST /api/import/text` | Haiku | classify-and-copy pasted words into a draft |
| Recipe creation | `POST /api/generate` | Opus 4.8 | write a recipe from a wish (structured outputs, adaptive thinking) |

The four-part pattern every AI seam follows — **new seams copy it exactly**:
1. **Dormant gate**: `Boolean(ENV.ANTHROPIC_API_KEY)` → honest 503 copy when off.
2. **`requireAuth` + `costlyLimiter`** (20/15 min/user) — money calls are never
   anonymous and never unlimited.
3. **Review-first**: output lands on the edit screen, never straight on the
   shelf; saved rows carry an honest `source` label (`imported|manual|otto`).
4. **Honest declines**: an `is_possible`-style gate returns a plain-language
   reason (422) instead of inventing something.

### 1d. Public plane — links that work without the app
- `/r/:slug` (recipe), `/l/:token` (list snapshot), `/hl/:token` (live collab
  list) — server-rendered HTML, weight-first via `lib/weightDisplay.js` (the
  backend mirror of `mobile/lib/foodScale.js`; Railway's Root Directory =
  `backend` means the server can NEVER import `mobile/`).
- Capability tokens ~72-bit CSPRNG; `publicShareLimiter` blunts scrapers, not
  brute force (infeasible either way).

---

## 2. Cross-cutting contracts (the rules every route follows)

- **Auth**: `Authorization: Bearer <supabase access token>`; server-side
  `getUser` per request; `req.userId` is the only identity.
- **Error shape**: always `{ error: "user-ready sentence in Otto's voice" }`.
  The client's `parseOrThrow` throws `body.error` verbatim — server copy IS
  the toast. No stack traces, no error codes in bodies.
- **Status vocabulary**: 400 invalid input · 401 no/bad token · 404 not yours
  or gone · 422 honest decline (import/generate) · 429 limiter ·
  502 upstream failed · 503 feature dormant.
- **Rate-limit tiers** (`lib/rateLimits.js`): `apiLimiter` 300/min/IP global ·
  `contentLimiter` 600/15m/IP · `costlyLimiter` 20/15m/user ·
  `seedReadLimiter` 120/15m/user · `publicShareLimiter` 120/15m/IP ·
  `destructiveLimiter` 5/15m/user.
- **Upstream calls** always carry `AbortSignal.timeout(...)` — no route hangs
  on a dead vendor.
- **Logging**: pino + `reportError`; Sentry wakes when `SENTRY_DSN` lands.
- **Client layer**: all network goes through `services/` (`MealAPI`,
  `UserRecipeAPI`, `CollabAPI`, `ShareAPI`, `NutritionAPI`, `PlanAPI`) — no
  raw `fetch` in screens. One recipe shape (`transformMealData` /
  `transformUserRecipe`) so surfaces never branch on origin.

---

## 3. The rest — numbered decisions (API-1 … API-10)

Effort: S < half a session · M ≈ a session. "Cloud" = doable here;
"founder" = needs dashboard/CLI hands.

### API-1 · Deploy-provable health — **do first** (S, cloud + founder deploy)
`/api/health` returns `{ success }` today, which is how prod ran a 3-day-old
build while every ticket read ✅. Change: health also returns
`{ version, sha }` (git sha baked at start from env or `RAILWAY_GIT_COMMIT_SHA`).
A deploy check becomes `curl /api/health` — no more probing feature routes and
reading 401-vs-404 tea leaves.

### API-2 · Request IDs (S, cloud)
Middleware stamps `req.id` (crypto random), echoes `X-Request-Id`, includes it
in every pino line and `reportError`. When a founder screenshot says "it
failed", the log line is findable. No client change required.

### API-3 · Server-side content cache (S/M, cloud)
`/api/content` re-fetches TheMealDB on every call. Add an in-memory TTL cache:
`lookup/categories/list` 24 h · `search/filter` 1 h · `random` never cached.
Cuts supporter-key quota, snaps Discover latency, and outages coast on warm
entries. In-memory is enough — one Railway instance; revisit only if we scale
out.

### API-4 · Versioning policy — a rule, not a prefix (S, doc-only)
No `/api/v1/`. App-store clients live for months, so the real contract is:
**additive-only changes; never repurpose or remove a field; a breaking change
gets a NEW route name** (e.g. `/api/generate2`), and old routes die only when
analytics say the old binaries are gone. A version prefix adds ceremony
without changing that obligation.

### API-5 · Client resilience (M, cloud)
`authFetch` today = raw fetch: no timeout, no retry. Change: 15 s timeout on
all calls; **one** retry with short backoff for idempotent GETs only (never
POST — an import or generate must not double-fire); a tiny
stale-while-revalidate module cache for Discover reads. Explicitly rejected:
adopting react-query — a cross-cutting rewrite the app doesn't need at this
size.

### API-6 · Shared-list freshness (S now, M later)
The collab list updates on focus/pull today. Now: 20 s foreground polling on
the list screen (zero infra, honest for a household). Later, if real
households feel the lag: Supabase Realtime on the collab tables — the schema
already fits. Decided: polling first; Realtime is an upgrade, not a rewrite.

### API-7 · Offline read cache (M, later phase)
Cookbook/plan/detail keep last-good JSON in AsyncStorage and render read-only
with an honest "as of <time>" stamp when offline. Writes stay online-only —
no sync-conflict machinery for a v1 household app. Scheduled after API-1…6.

### API-8 · AI plane roadmap — next seams, in order (M each, cloud)
All copy the §1c four-part pattern; all wake with the same key.
1. **Photo → recipe**: snap/upload a cookbook page or screenshot; vision
   extraction into the same review editor. Highest leverage — it's the
   share-extension's natural partner.
2. **Ask Otto on a recipe**: substitutions, "can I make this dairy-free?",
   technique questions — scoped to the open recipe, answers grounded in it.
3. **Plan my week**: generate a week from the cookbook + prefs, landing as
   plan entries the user confirms — review-first, like everything.

### API-9 · Images for AI/manual recipes (decision, S)
**No AI-generated food photography presented as real — ever** (honesty law).
Imageless recipes get the Otto placeholder treatment; real photos come from
the user's library via the storage bucket (SQL in
`TERMINAL_TICKET_FUNCTIONAL_FIXES.md` Task 3, founder-run).

### API-10 · Founder activation checklist (the only non-code blockers)
| Switch | Where | Wakes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Railway env | whole AI plane (import/text/generate) |
| `THEMEALDB_KEY` | Railway env | supporter key (test key "1" until then) |
| Photo bucket SQL | Supabase SQL editor | device photo upload |
| Anonymous sign-in toggle | Supabase Auth settings | guest flow (worst live issue) |
| `SUPABASE_SERVICE_ROLE_KEY` rotation | Supabase dashboard | (hygiene — never paste the value into chat) |
| `SHARE_BASE_URL` | Railway env | pretty share links when the domain lands |
| `SENTRY_DSN` (optional) | Railway env | error reporting |
| `npx -y @railway/cli up backend --service Recipe-App --ci` | founder terminal | **every backend merge — push ≠ deploy** |

---

## 4. Execution order

- **Run A — hardening sweep** (one session, all cloud): API-1 health sha →
  API-2 request ids → API-3 content cache → API-5 client resilience →
  API-6 polling. API-4 is adopted by this document.
- **Run B — AI seam #1**: photo → recipe extraction, end-to-end dormant.
- **Run C — comfort**: API-7 offline reads; Realtime upgrade only if
  households ask.
- **Standing terminal work** (already ticketed): live-corpus line validation,
  density-table unification, device QA/TestFlight, activation checklist above.

---

## 5. "Do we need X?" — the classic checklist, answered (founder Q, 2026-07-21)

| Item | Verdict | Why / trigger to revisit |
|---|---|---|
| Rate limits | **Have** | Six tiers live (§2); Supabase limits auth itself. Enough for launch scale. |
| API contract | **Have (enforced, not ceremonial)** | zod at the edge + one error shape + services layer = the contract; API-4 additive-only rule governs evolution. |
| OpenAPI spec / generated types | Skip | One first-party client. Trigger: a second client or external consumer — then generate from the zod schemas. |
| Client API keys | Skip | JWT is the credential; a bundled key is extractable from the IPA by design. |
| Pagination | Skip | Personal cookbooks are small. Trigger: analytics show cookbooks in the thousands. |
| Idempotency keys | Skip | API-5 never retries writes — removes the double-fire problem instead of solving it. |
| Timeouts | Have (server) / API-5 (client) | Every upstream call carries AbortSignal.timeout; authFetch gets one in Run A. |
| CORS | **Have** | Allowlist + `WEB_ORIGINS` env for new fronts. |
| Body/size limits | **Have** | 1 MB JSON cap + per-field zod clamps. |
| Observability | Half | pino live; request ids (API-2) + Sentry DSN complete it. |
| Webhooks | Skip | No external consumers of our events. |
| Quota/SLA tiers | Skip | costlyLimiter is the quota. Paid tiers are a business decision, not infrastructure. |
