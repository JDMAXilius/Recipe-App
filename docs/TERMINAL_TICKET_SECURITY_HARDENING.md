# 🎟️ Terminal Ticket — Security hardening pass (4-point audit)

> Source: a founder-shared reel (`sebas.soto222`) with four "don't get hacked" prompts. Rewritten
> here **against Otto's actual codebase** so the terminal doesn't chase generic advice. The cloud
> session already read the backend and mapped current state — **start from "What's already in place"
> and go straight to the gaps.**
>
> The four asks (translated from the reel):
> 1. Rate-limit every API endpoint (the reel says ~5/route/user/15min).
> 2. Scan the whole codebase for API keys / tokens / passwords living outside `.env`.
> 3. Sanitize every user-entered input.
> 4. Run a security audit and list every remaining vulnerability.
>
> Stack reminder: **Express 5** backend (`backend/src/server.js`, 794 lines), **Drizzle ORM** on
> Postgres (Neon/Supabase), **Supabase Auth** (JWT bearer), **Zod** validation, **Sentry**. Deploys
> to Railway (pushing `main` does NOT deploy — see `TERMINAL_HANDOFF.md`).

---

## What's already in place (do NOT rebuild — just verify)

Confirmed by reading the code this session:

- **Rate limiting is already wired** (`backend/src/lib/rateLimits.js` + `server.js`):
  - Global `apiLimiter` on everything — per-IP, 300/min.
  - `costlyLimiter` — **per-user** (`keyGenerator: req.userId`), 20 / 15 min, on the money/AI/enumerable
    routes: `/api/import`, `/api/import/text`, `/api/recipes/:id/nutrition/recompute`, `/api/share/list`,
    `/api/lists` (create).
  - `contentLimiter` (600/15min per-IP) on the anonymous TheMealDB passthrough `/api/content/:endpoint`.
  - `seedReadLimiter` (per-user, 120/15min) on the nutrition-seed reads.
  - `app.set("trust proxy", 1)` in production (so the per-IP limiter keys on the real client, not Railway's proxy).
- **Every data route is behind `requireAuth`** and **every mutating route runs `validate(schemas.X)`**
  (Zod) — see the route table in `server.js` (lines ~91–776).
- **SQL is parameterized** — all DB access is via Drizzle ORM; no string-built queries.
- **HTML share pages escape output** — `backend/src/lib/sharePages.js` runs every interpolated value
  through `escapeHtml()` (recipe `/r/:slug`, list `/l/:token`, `/hl/:token`).
- **`express.json({ limit: "1mb" })`** caps body size (basic DoS guard).
- **`.env` is gitignored** (`.gitignore:1`), `dotenv` loads config, **Sentry** captures errors.

So the four asks are ~70% already done. Below is only the **delta** — the gaps and the things that
can only be checked with git history / the live project / a deploy.

---

## Task 1 — Rate limiting: coverage audit + auth-attempt story

**Reel bar:** "max 5 attempts per route per user per 15 min." Otto's limits are deliberately looser
than that (a busy household must never feel throttled), so **don't blindly clamp everything to 5** —
that would break normal use. Instead:

1. **Login/signup/password-reset attempts** — the reel's "5 attempts" is really about *auth brute
   force*. Those flows run on **Supabase Auth**, not this backend, so they're rate-limited by Supabase.
   → **Verify** Supabase Auth rate limits are at defaults or tighter (Dashboard → Authentication →
   Rate Limits): token/verify/OTP. Nothing to add in Express; just confirm and note it here.
2. **Coverage gaps in our own API** — confirm no *mutating or enumerable* route is missing a limiter.
   Current thin spots to eyeball:
   - `DELETE /api/account` (`server.js:477`) — destructive, no `costlyLimiter`. Add a tight per-user
     limiter (e.g. 5 / 15 min) — this one genuinely matches the reel's bar.
   - Token-guessing surfaces: `GET /api/lists/:token`, `GET /r/:slug`, `GET /l/:token`, `GET /hl/:token`.
     Tokens are the membership, so enumeration = unauthorized read. The global per-IP limiter covers
     these, but consider a dedicated tighter limiter on the public `/r|/l|/hl` reads to blunt scraping.
3. **Confirm `trust proxy` is correct on Railway** — if it's wrong, the per-IP limiter keys on the
   proxy IP and throttles *all* users together (or not at all). Verify with the `X-Forwarded-For`
   chain in a real request.

**Done when:** a one-line note here per route class ("covered by X limiter"), `DELETE /api/account`
has a tight limiter, and Supabase Auth limits are confirmed.

---

## Task 2 — Secret scan (working tree **and git history**)

`.env` is gitignored today, but that doesn't prove a key was never committed earlier, and the cloud
box can't scan history meaningfully. This is the highest-value task.

1. **Scan history + tree** with a real tool (either):
   ```bash
   # from repo root
   npx gitleaks detect --source . --redact -v          # or:
   docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect -s /repo --redact -v
   ```
   Also a fast manual sweep for the specific shapes Otto uses:
   ```bash
   git grep -nE "sk-ant-|service_role|SUPABASE_.*KEY|eyJ[A-Za-z0-9_-]{20,}|postgres(ql)?://[^ ]*:[^ @]*@" $(git rev-list --all) -- 2>/dev/null | head
   ```
   Targets: Anthropic key (`sk-ant-…`), Supabase **service_role** key + JWT secret, `DATABASE_URL`
   with inline password, TheMealDB supporter key, Sentry DSN (low sensitivity).
2. **If anything is found in history:** treat it as compromised — **rotate the key** (Anthropic
   console, Supabase project settings, Neon/DB password, Railway env) and update the Railway/EAS env
   vars. Rotation matters even if the repo is private (clones, past collaborators, CI logs).
3. **Confirm the client never ships a secret.** `EXPO_PUBLIC_*` vars are bundled into the app and are
   PUBLIC by definition — verify only the **anon** Supabase key and public API URL are `EXPO_PUBLIC_*`,
   and that no service_role key or Anthropic key is referenced anywhere under `mobile/`:
   ```bash
   grep -rnE "service_role|sk-ant-|SUPABASE_SERVICE" mobile/ && echo "LEAK ⚠️" || echo "clean"
   ```

**Done when:** gitleaks is clean (or every finding is rotated + invalidated), the client-secret grep
is clean, and a one-line result is noted here.

---

## Task 3 — Input sanitization: close the XSS + mass-assignment edges

Validation (Zod) and SQL safety (Drizzle) are already in place, and the share HTML escapes values.
Three specific edges remain:

1. **URL-scheme XSS in the share pages.** `sharePages.js` HTML-escapes `row.sourceUrl` and `row.image`
   but escaping does **not** stop a `javascript:` (or `data:`) scheme inside `href`/`src`. A recipe
   with `sourceUrl: "javascript:…"` becomes a live XSS on the public `/r/:slug` page.
   → Add a scheme allowlist (http/https only) before rendering any user-supplied URL into `href`/`src`
   — reject/blank otherwise. Applies to `sourceUrl`, `image`, and any user URL on the list pages.
2. **Zod strictness (mass-assignment).** Confirm the `schemas.*` in `backend/src/lib/validate.js` use
   `.strict()` (reject unknown keys) rather than the default strip/passthrough — so a client can't set
   fields like `visibility`, `userId`, or `id` it shouldn't. If they're not strict, make them strict
   and re-test the create/update flows.
3. **`requireAuth` verifies the JWT signature** (not just decodes it). Confirm it calls
   `supabase.auth.getUser(token)` / verifies against the JWT secret — a decode-only check would let a
   forged token through. (Read `requireAuth` in `server.js` / its middleware file and note which.)

**Done when:** user URLs are scheme-checked before landing in HTML attributes, schemas are `.strict()`,
and the JWT verification path is confirmed real (with a one-line note here).

---

## Task 4 — Security audit: the remaining list

Findings the cloud pass already surfaced, plus the checks that need the live project:

- **CORS is wide open** — `app.use(cors())` (`server.js:33`) sends `Access-Control-Allow-Origin: *`.
  Lower risk here because the API is bearer-token (no cookies), but scope it to the real origins
  (the app's web host + `getotto.app` when live) rather than `*`.
- **No security headers / no `helmet`.** Add `helmet` (backend dep) — at minimum on the HTML share
  routes: a **Content-Security-Policy** (defense-in-depth behind Task 3's escaping),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options`/frame-ancestors.
- **`npm audit`** in `backend/` and `mobile/` — triage High/Critical, `npm audit fix` what's safe,
  note anything that needs a manual bump.
- **Supabase RLS + Storage** — v1.0.9 already "closed RLS on the four collab/share tables and fixed a
  bucket listing leak." **Verify RLS is ON for every user-data table** (`select … from pg_tables` +
  check policies) and that the new **`recipe-photos`** bucket (from the photo-upload ticket) has the
  owner-insert / public-read policies and no listing leak. Run `get_advisors` (Supabase) for the
  security lint.
- **Error responses don't leak internals** — confirm 500s return the friendly message (they do via
  `reportError`) and never a stack/SQL string to the client.
- **`express.json` limit** is 1 MB — fine; just confirm no route needs bigger and none is unbounded.

**Done when:** CORS is scoped, `helmet` is on (at least the HTML routes) with a CSP, `npm audit` is
triaged, Supabase `get_advisors` is clean (or noted), and a short findings list is written below.

---

## Findings log — worked 2026-07-20

### Task 1 (rate limits) — coverage complete, two gaps closed
Full route-by-route pass over all 35 routes in `server.js`. Coverage by class:

| Route class | Limiter |
|---|---|
| Everything | `apiLimiter` (per-IP, 300/min) |
| Money/AI/enumerable (`/api/import`, `/api/import/text`, nutrition recompute, `/api/share/list`, `POST /api/lists`) | `costlyLimiter` (per-user, 20/15min) |
| Anonymous TheMealDB passthrough | `contentLimiter` (per-IP, 600/15min) |
| Nutrition-seed reads | `seedReadLimiter` (per-user, 120/15min) |
| **`DELETE /api/account`** | **`destructiveLimiter` (per-user, 5/15min) — added** |
| **Public share pages `/r`, `/l`, `/hl`** | **`publicShareLimiter` (per-IP, 120/15min) — added** |
| Ordinary per-user CRUD (favorites, recipes, plan, collab items) | `apiLimiter` only — deliberate; these are cheap owner-scoped writes and a household must never feel throttled |

- `DELETE /api/account` now matches the reel's 5/15min bar exactly — the one route where it fits.
- Deliberately **did not** clamp everything to 5/route/user: that would break normal use, which the
  ticket already called out.
- ⚠️ **Not verifiable from the terminal** — needs the live env:
  - **`trust proxy` on Railway.** Code is right (`app.set("trust proxy", 1)` in prod), but whether
    Railway's `X-Forwarded-For` chain has exactly one hop can only be confirmed against a real request.
    If it's wrong, every per-IP limiter keys on the proxy and throttles all users as one.
  - **Supabase Auth rate limits** (the reel's real "5 attempts" target — brute force lives there, not
    in Express). Dashboard toggle, see the open items below.

### Task 2 (secrets) — clean, plus one gap closed
- `gitleaks` **could not be installed** on this machine (no brew, no docker; the `npx gitleaks`
  invocation in the ticket is not a real npm package). Fell back to the ticket's manual sweep,
  run over **all 207 commits**, for: `sk-ant-*`, `service_role`, JWT (`eyJ…`), and
  `postgres://user:pass@` shapes.
- **Result: clean.** Zero real secret values in our own source across full history. Every hit was a
  documentation placeholder (`SUPABASE_SERVICE_ROLE_KEY=...` in README), a skill doc, an empty test
  assignment (`ANTHROPIC_API_KEY = ""`), or this ticket quoting its own grep. **No rotation needed.**
- No `.env` / secrets / credentials file was **ever** committed (`--diff-filter=A` over all refs).
- Client is clean: `mobile/` references no `service_role`, `sk-ant-`, or `THEMEALDB_KEY`. The only
  `EXPO_PUBLIC_*` vars are `API_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` — all correctly public.
- 🔧 **Fixed: the repo root had no `.gitignore` at all.** `backend/.gitignore` and `mobile/.gitignore`
  cover their own trees, but a root-level `.env` was ignored by nothing — one `git add .` from being
  committed. Added `/.gitignore` (`.env`, `.env.*`, `node_modules/`, `.DS_Store`).
- ⚠️ **`node_modules/` is committed at the repo root — 22,024 tracked files.** Not a secret leak
  (vendored third-party code, no Otto keys in it), but it's why the sweep needed excludes, and it
  means the root tree ships dependency code nobody audits. Untracking it is a 22k-file delete commit —
  left as a decision, see open items.

### Task 3 (sanitization) — real XSS found and fixed
1. 🔧 **URL-scheme XSS was live and is now closed.** `sharePages.js` escaped `sourceUrl`/`image` but
   escaping does nothing to a `javascript:` scheme inside `href`/`src` — an imported recipe with
   `sourceUrl: "javascript:…"` was a working XSS on the public `/r/:slug` page. Added `safeUrl()`:
   parses with the **URL parser** (not a regex — the parser is what browsers agree with on
   tab/newline/case tricks) and passes **only http/https**. Applied to the attribution `href`, the
   hero `<img src>`, and every `og:image`/`og:url`. An unsafe URL drops the attribute rather than
   rendering it; **attribution still travels**, just as unlinked text. Pinned by two new tests
   (`javascript:`, `JaVaScRiPt:`, `java\nscript:`, `data:`, `vbscript:`, `file:`, `//evil.com`, …).
2. ✅ **Zod `.strict()` — deliberately NOT applied.** Zod's `z.object()` default is **strip**, which
   already makes mass-assignment impossible: unknown keys are dropped before the route ever sees the
   body, so a client cannot set `userId`, `id`, or `visibility` it shouldn't. `.strict()` would only
   change "silently drop" into "400 error" — and `recipeUpdate`'s comment says older clients echo the
   whole object back, so strict mode would **break them**. Strip is both safe and the compatible
   choice. No change made; the ticket's ask is satisfied by the existing default.
3. ✅ **JWT verification is real.** `middleware/auth.js:18` calls `supabase.auth.getUser(token)` —
   server-side verification against Supabase, not a local decode. A forged token cannot pass.

### Task 4 (audit)
- 🔧 **CORS scoped.** `app.use(cors())` (`*`) → allowlist of `SHARE_BASE_URL`, `getotto.app`,
  `www.getotto.app`, plus `localhost:8081/19006` in **non-production only**. Requests with **no
  Origin** (the native app, curl, link-preview crawlers) still pass — CORS only governs browsers, and
  the native app never sends an Origin. Verified live: `getotto.app` → allowed, `evil.example.com` →
  no ACAO header.
- 🔧 **`helmet` added** (`^8.3.0`) with an explicit CSP: `default-src 'none'`, `script-src 'none'`
  (the share pages ship zero JS by design — this keeps it that way), `style-src 'self' 'unsafe-inline'`
  (each page has one inline `<style>`), `img-src 'self' https: data:` (recipe images come from
  whatever site they were imported from), `frame-ancestors`/`base-uri`/`form-action` `'none'`.
  `crossOriginResourcePolicy` set to **`cross-origin`** on purpose — helmet's `same-origin` default
  would have broken every WhatsApp/iMessage/Slack link preview, which fetch `og:image` cross-origin.
  Verified live: CSP, HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options` all landing.
- **`npm audit` triaged:**
  - **backend — 1 high, 4 moderate.** The high is **`drizzle-orm` <0.45.2, SQL injection via
    improperly escaped SQL identifiers** (installed: 0.44.7). **Not exploitable here**: every query
    goes through the typed query builder with static identifiers from `db/schema.js` — grep confirms
    **zero** uses of `` sql`` ``, `sql.raw`, `sql.identifier`, or `.execute(`, so no identifier is
    ever user-controlled. Still worth the bump, but npm flags 0.45.2 as breaking → **manual bump,
    not `audit fix --force`**, and it needs a DB to test against. Left for a deliberate pass.
    The 4 moderate are `esbuild`/`drizzle-kit` — **devDependency, dev-server only, never shipped.**
  - **mobile — 3 high, 19 moderate, 2 low. All transitive, all build tooling, none in the app binary:**
    `undici` → `@expo/cli`, `@xmldom/xmldom` → `@expo/config-plugins`/`plist` (prebuild), `flatted`
    → `eslint`. Expo SDK pins these, so `npm audit fix` would desync the SDK and break builds — the
    correct fix is an **Expo SDK bump**, not an audit fix. **Deliberately not run.**
- ✅ **Supabase RLS verified — all 8 public tables have RLS enabled with policies**, every one scoped
  to `authenticated` only (`anon` gets nothing) and owner-checked via `auth.uid()`:
  `favorites`, `recipes`, `plan_entries`, `recipe_shares`, `list_shares`, `collab_lists`,
  `collab_items` (via an `EXISTS` join to its owner's list), `seed_nutrition`. The two broader reads
  are intentional and correct: `recipes` adds a `visibility = 'public'` SELECT, and `seed_nutrition`
  is `using (true)` — shared reference data, not user data.
- ✅ **Storage verified.** `recipe-photos`: public read, 10 MB cap, MIME allowlist
  (jpeg/png/webp/heic). One policy — `owner insert`, scoped to `(storage.foldername(name))[1] =
  auth.uid()`. **No SELECT policy = no listing**, so the v1.0.9 listing leak stays closed.
- ✅ **Error responses don't leak internals** — every catch returns the flat friendly string
  (`"Something went wrong"`) and routes real detail to `reportError`/Sentry. No stack or SQL reaches
  a client.
- ✅ **`express.json({ limit: "1mb" })`** — no route needs more; nothing is unbounded.
- ✅ **Supabase security advisors: one WARN, no errors** — leaked-password protection disabled
  (dashboard toggle, see open items).

### 🆕 Finding the ticket didn't list: account deletion leaves photos behind
`DELETE /api/account` wipes every DB row in one transaction — but it **never touches Storage**. A
deleted user's uploads stay in the **public** `recipe-photos` bucket, still reachable by direct URL,
forever. The route's own comment cites App Store 5.1.1(v); this is the gap in it. There's also no
UPDATE/DELETE policy on `storage.objects`, so users can't remove their own photos either.
**Fix (not done here — needs a decision):** in the deletion path, list and remove
`recipe-photos/<userId>/*` with the service-role client (the same `SUPABASE_SERVICE_ROLE_KEY` branch
that already deletes the auth user), and add an owner-scoped DELETE policy for in-app photo removal.

---

## Done when (whole ticket)
- [x] Every mutating/destructive/enumerable route's limiter is accounted for; `DELETE /api/account`
      tightened (5/15min); public share pages given a dedicated limiter. Supabase Auth limits → open item.
- [x] History + tree swept clean over all 207 commits (manual sweep — gitleaks uninstallable here);
      **no secret ever committed, so no rotation needed**; client ships no service key; root
      `.gitignore` added.
- [x] User-supplied URLs scheme-checked before HTML (real XSS closed, tests added); Zod strip
      confirmed sufficient and `.strict()` deliberately declined; JWT verification confirmed real.
- [x] CORS scoped; `helmet` + CSP live; `npm audit` triaged both trees; Supabase RLS, storage, and
      advisors verified.
- [x] Findings log filled in with the actual result of each check.

## Open items (need Juan / the live env — not code)
1. **Enable leaked-password protection** (the one Supabase advisor WARN):
   → https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/auth/providers
   Under **Password Settings**, turn on **"Prevent use of leaked passwords"**.
2. **Confirm Supabase Auth rate limits** are at defaults or tighter:
   → https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/auth/rate-limits
   Check the token / verify / OTP rows — this is where the reel's "5 attempts" bar actually applies.
3. **Verify `trust proxy` on Railway** — after deploying, hit any route and confirm the
   `X-Forwarded-For` chain is one hop, so the per-IP limiters key on the real client.
4. **Decide on `drizzle-orm` 0.44.7 → 0.45.2** (breaking; not exploitable in our code today).
5. **Decide on untracking the root `node_modules/`** (22,024 files; now ignored going forward).
6. **Decide on the photo-deletion gap** above.
7. **Deploy** — pushing `main` does NOT deploy (see `TERMINAL_HANDOFF.md`).

---

## Notes / cloud-doable subset
Several Task 3 & 4 items are **pure code** and could be done from a cloud session without the live
project: the URL-scheme allowlist in `sharePages.js`, Zod `.strict()`, scoping CORS, and adding
`helmet`+CSP. The parts that genuinely need the terminal/live env: the **git-history secret scan +
key rotation**, **Supabase RLS/advisors/storage** verification, **`npm audit` triage**, and the
**Railway `trust proxy`/deploy** confirmation. Split accordingly if you want the code-only fixes landed
early.
