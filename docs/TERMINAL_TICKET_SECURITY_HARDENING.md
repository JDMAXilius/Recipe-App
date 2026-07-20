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

## Findings log (fill in as you go)
- Task 1 (rate limits): …
- Task 2 (secrets): …
- Task 3 (sanitization): …
- Task 4 (audit): …

## Done when (whole ticket)
- [ ] Every mutating/destructive/enumerable route's limiter is accounted for; `DELETE /api/account`
      tightened; Supabase Auth limits confirmed.
- [ ] gitleaks clean over history + tree; any found secret **rotated**; client ships no service key.
- [ ] User-supplied URLs scheme-checked before HTML; Zod schemas `.strict()`; JWT verification confirmed.
- [ ] CORS scoped; `helmet` + CSP on HTML routes; `npm audit` triaged; Supabase RLS/storage verified.
- [ ] Findings log filled in with the actual result of each check.

---

## Notes / cloud-doable subset
Several Task 3 & 4 items are **pure code** and could be done from a cloud session without the live
project: the URL-scheme allowlist in `sharePages.js`, Zod `.strict()`, scoping CORS, and adding
`helmet`+CSP. The parts that genuinely need the terminal/live env: the **git-history secret scan +
key rotation**, **Supabase RLS/advisors/storage** verification, **`npm audit` triage**, and the
**Railway `trust proxy`/deploy** confirmation. Split accordingly if you want the code-only fixes landed
early.
