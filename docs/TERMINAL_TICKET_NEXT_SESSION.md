# 🎟️ Terminal Ticket — Everything still open (written 2026-07-19, end of Mac session)

> **Start here after restarting Claude Code.** This is the single list of what's left, in the order
> worth doing it. Each item says who can do it and exactly how. Where a claim was verified, it says
> so; where it wasn't, it says that too — several items on this list exist *because* something was
> marked done without being observed working.
>
> **Today's headline, so it isn't repeated:** production was running a **3-day-old backend**. Shared
> lists and both share-link types were merged, documented as shipped, and 404ing in production the
> whole time. All three now work and were verified end to end against prod. See
> `TERMINAL_HANDOFF.md` → deploy gotcha.

---

## 0. First five minutes after restart

**0a. Approve + authenticate the Supabase MCP** (config committed at `.mcp.json`, pinned to the
correct project `mepzfdefanfpnrvydyty`):
```
/mcp          → select "supabase" → Authenticate
claude mcp list   # want: supabase … ✔ Connected (not ⏸ Pending approval)
```
Why it matters: the *other* connected Supabase MCP (`claude.ai Supabase`) is bound to the wrong org
and only sees the INACTIVE `supabase-orvenue`. Every DB question so far has gone through raw
`postgres` scripts. With this one live: `get_advisors`, direct SQL, and auth logs on the real
project. **It will NOT flip the anonymous toggle** — no auth-config tool exists in that MCP.

---

## 1. 🔴 The app opens onto a hard account wall (worst live issue)

**Verified 2026-07-19:** `POST /auth/v1/signup` with `{}` → `anonymous_provider_disabled`, and
`/auth/v1/settings` reports `external.anonymous_users: false` on the live project.

**Effect:** `mobile/app/onboarding.jsx:93` calls `signInAnonymously()`, it fails, and the code falls
through to `/(auth)/sign-in`. **A new user finishes onboarding and hits a signup wall** — before
seeing a single recipe. That is not the designed flow (P10: "end anonymous in Discover, account ask
at first save") and it argues with Apple 5.1.1 (don't require login for features that don't need one).

**Fix — [Founder, dashboard]:**
🔗 https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/auth/providers
The toggle is in the **User Signups** box at the TOP of the page — *not* in the Apple/Google/Facebook
list below it. That distinction is why it looked enabled before. Flip **Allow anonymous sign-ins**,
Save, wait for the green toast.

**Verify (trust this, not the dashboard — they disagreed before):**
```bash
cd backend && node -e "const fs=require('fs');const e=Object.fromEntries(fs.readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));fetch(e.SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:e.SUPABASE_ANON_KEY}}).then(r=>r.json()).then(j=>console.log('anonymous_users:',j.external.anonymous_users))"
```
Want `true`. Then re-run onboarding on a device and confirm it lands in Discover, not the sign-in stool.

**Then:** remove the ⚠️ warning block at the top of the review notes in `APP_STORE_LISTING.md` — the
"browse without an account" line becomes true again.

### 1a. Contain the abuse surface it opens
`signInAnonymously()` is an **unauthenticated endpoint that writes a row to `auth.users` per call.**
- **[Founder]** Turn on CAPTCHA: Authentication → Settings → **Bot and Abuse Protection**.
- **[Terminal]** Prune stale guests — `backend/scripts/cleanup-anonymous-users.mjs` (written, dry-run
  clean). **Dry run by default**; only deletes anonymous users older than the cutoff that own **no
  data**. Schedule monthly:
  ```bash
  cd backend && node --env-file=.env scripts/cleanup-anonymous-users.mjs            # report
  cd backend && node --env-file=.env scripts/cleanup-anonymous-users.mjs --apply    # delete
  ```

> **Decision taken 2026-07-19:** keep anonymous auth rather than rebuild guest browsing without a
> session. The code already ships (`onboarding.jsx`, `socialAuth.js` `linkIdentity`, `sign-up.jsx`
> `is_anonymous`), so it's one toggle vs. several hours. RLS was audited against this first: all five
> policies are scoped to `authenticated`, three key on `auth.uid() = user_id` (a guest sees only its
> own rows), and the four tables with RLS-on-zero-policies deny everyone. **No private data is
> exposed to guests.** The only real cost is junk `auth.users` rows, handled above.

---

## 2. 🔴 Nutrition confidence is stuck at "low" — every single recipe

**Verified 2026-07-19:** sampled 10 seed recipes in production → **10/10 returned
`confidence: "low"`.** Sample: 52765 618kcal, 52771 566kcal, 52772 277kcal, 52819 674kcal … all low.

**Why it matters:** a signal that never varies carries no information. Worse, the honesty design
degrades the card's copy when confidence is low — so **every** recipe shows the hedged framing.
Either the numbers really are unreliable (then don't show calories that prominently) or the flag is
mis-calibrated (then the honesty mechanism is inert exactly when it's needed). **Right now nobody can
tell which — including the user.** These are health-adjacent numbers on a food app.

**[Terminal]** Read the confidence rule in `backend/src/lib/nutrition/parseIngredient.js` /
`usdaProvider.js`, work out what fraction of lines resolve to grams on a typical recipe, and decide
whether the threshold is wrong or the parse rate genuinely is. Fix whichever it turns out to be.
Note a co-pilot session landed `expandPackSize()` in `parseIngredient.js` (commit `35ef222d`) for
exactly this class of problem — check whether it moved the needle before assuming it didn't.

### Resolution 2026-07-19 — it was the flag, not the numbers

Measured over 60 real seed recipes (642 ingredient lines), classifying every line the way
`usdaProvider` scores it. Prod-wide the split was **78.5% low / 14.7% medium / 2.4% high** across all
706 cached rows — so "10/10 low" was a fair read of a real problem.

**Only 0.6% of lines failed to match a USDA record.** The doubt came from 28.3% of lines never
resolving to grams, and those were overwhelmingly `To taste Salt` / `To taste Pepper` — unquantifiable
by nature and carrying ~no calories. The formula divided by every line, so an unknowable pinch of salt
scored the same doubt as a missing cup of flour, and `high` required `doubt === 0`, which is
unreachable while garlic/onion/egg resolve through piece weights by design.

Fixed in two places:
- `parseIngredient.js` — `tbs` was missing from `UNIT_WORDS` (TheMealDB's usual spelling, so those
  lines contributed zero calories), and a bare unit with no number (`Pinch Salt`, `Handful Parsley`)
  never parsed despite `APPROX_G` already holding the weights. Unresolved lines: 28.3% → 19.6%.
- `usdaProvider.js` — seasoning/garnish under 15g or unquantifiable is excluded from the confidence
  denominator (still counted in the nutrition sum), and `high` relaxed to `doubt <= 0.1`.

Result on the same 60: **13.3% high / 51.7% medium / 35.0% low**. Calorie totals are unchanged by the
recalibration; the parser fixes raise them slightly where `tbs` lines had been dropped.
Tests: `__tests__/bareUnit.test.mjs`, `__tests__/confidence.test.mjs`.

⚠️ **Existing seed recipes will not change.** `seedNutritionFor()` (`lifecycle.js:54`) is cache-first
with `onConflictDoNothing`, so the 706 cached rows keep their old flags — deliberately left as-is
(founder call, 2026-07-19). This lands for **user-created recipes** and any seed recipe not yet
cached. Clearing `seed_nutrition` would backfill the rest lazily at zero API cost, if that's ever wanted.

---

## 3. 🔴 Nothing has been tested on a device

**Everything verified today was API-level.** The UI has not run on a phone, and **TestFlight build 19
predates every fix from today** — the mobile changes are not in any build a human can install.

**[Terminal + device]** Cut a build, then test:
```bash
cd mobile && eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```
- Shared list: start → share → join on a 2nd account → **the joiner shares the invite onward and a
  3rd account joins from it** (this path was silently broken; the joiner sent a message with no link).
- The new **"Lists you've been in"** rejoin row on the Household setup screen.
- Paste box: try a link with a trailing slash, with `?utm_source=…`, and with text after it.
- v1.0.5 fixes: shopping pad frame (no seam), splash (Otto on cream, no box), timer alarm (loud, ~4s),
  YouTube plays inline (no Error 153).
- Every visible social button, end to end.
- Delete account → confirm `authUserDeleted: true`.

---

## 4. 🟠 Blocking App Store submission

| # | Item | Owner | Notes |
|---|---|---|---|
| 4a | Website `/privacy`, `/terms`, `/support` live | Founder (separate repo) | **The actual critical path.** Nothing else gets you submitted |
| 4b | Set `PRIVACY_URL` / `TERMS_URL` in `mobile/app/(tabs)/profile.jsx` | Terminal, 2 lines | Rows light up automatically once real |
| 4c | Paste listing copy | Founder | `docs/APP_STORE_LISTING.md` — written + character-counted. **Fix the anonymous claim first (§1)** |
| 4d | Screenshots (6.7") + demo account | Founder | Shot-list is in the listing doc |
| 4e | App Privacy answers | Founder | Pre-filled table in `PRE_LAUNCH_CHECKLIST.md` §B |
| 4f | **Facebook: take Live or disable the provider** | Founder | Dev mode = works for you, fails silently for everyone. A visible-but-broken social button is a documented rejection |

---

## 5. 🟠 Security + ops

- **Rotate `SUPABASE_SERVICE_ROLE_KEY`.** It was pasted into a chat transcript and bypasses RLS
  entirely — full read/write on every user's data.
  🔗 https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/settings/api-keys
  Then update it in Railway → Recipe-App → Variables. **Don't paste the new value into a chat.**
- **Connect GitHub in Railway** so the 3-day drift can't recur. Service → Settings → Source →
  `JDMAXilius/Recipe-App`, branch `main`. Root Directory is now `backend`, so `railway.json`'s
  `watchPatterns: ["backend/**"]` will finally apply — it has been inert this whole time.
- **`SENTRY_DSN` is unset → no error alerting.** Missing tables 500'd in production for days with
  nobody notified. That is precisely how this went unseen.
- **`SHARE_BASE_URL` is unset** (confirmed live). Invites currently carry the Railway hostname.
  Point it at `https://ottosapp.com` once the site exists.
- ~~**RLS note:** `collab_lists`, `collab_items`, `recipe_shares`, `list_shares` have RLS on with 0
  policies.~~ ✅ **DONE 2026-07-19** — owner-scoped policies on all four, matching the existing
  `(select auth.uid())::text = user_id` convention. `collab_items` has no user column, so it scopes
  through its parent list's token (uses `collab_lists_pkey`, no seq scan). Backend is unaffected: it
  connects as `postgres`, the table owner, and `relforcerowsecurity` is false — verified after
  applying (probe route still 401, health OK).
  **Deliberate limitation:** shared lists are token-bearer — possession of the invite IS the
  membership, there is no member table — and that cannot be expressed in RLS, since a predicate sees
  the row and `auth.uid()`, not what the caller knows. So a **joiner gets nothing** through direct
  Supabase access; joiner traffic must keep going through the backend, which checks the token itself.
  These fail closed, which is the right direction.
  Applied as a Supabase migration (`add_collab_and_share_rls_policies`), visible via `list_migrations`
  — note that's a different mechanism from the idempotent scripts in `backend/scripts/`.

---

## 6. 🟡 Known-but-not-blocking

- **Share card still sends text, not the image.** Deps are in `package.json` + lockfile; needs a
  native rebuild. `TERMINAL_TICKET_SHARE_CARD.md`.
- **`mealAPI.js` calls TheMealDB v1 direct from the bundle** across 8 endpoints, so the premium key
  you pay for is unused. Their terms: the test key `"1"` is for *development or educational use* —
  *"you must become a supporter if releasing publicly on an appstore."* You **are** a supporter, the
  app just isn't using the paid key. **Needed before public release, not before internal TestFlight.**
  Lazy version: one `/api/content/*` passthrough that injects the key server-side + repoint `BASE_URL`
  — not the 8 bespoke routes the old ticket implies.
  **DONE 2026-07-19** — `GET /api/content/:endpoint` in `server.js`, allowlisted to the six endpoints
  `mealAPI.js` actually calls, forwarding only TheMealDB's `s/i/a/c/f` params and the response
  verbatim. So the client was a one-line `BASE_URL` change and every `data.meals` parse still works.
  Unauthenticated on purpose (Discover must work before signup) and guarded by `contentLimiter`
  (600/15min per IP) — that limiter is the only thing between the paid key and a free-proxy farm.
  All six endpoints verified against v2 with the supporter key; web export clean.
  ⚠️ **`THEMEALDB_KEY` must be set on Railway** or both this route and `RecipeSource` silently fall
  back to the test key `"1"` — working, but exactly the terms violation this was meant to fix.
  It is server-side only: never `EXPO_PUBLIC_*`, since anything bundled is readable from the IPA.
- **Recipe photo: paste-a-link vs device upload** — still an open founder decision.
- **Account deletion kills a shared list other people are using.** Defensible (no member registry to
  transfer ownership to) but the UI gives no warning. Consider one.

---

## The discipline that would have prevented most of this

Three times now something was "done" in the repo and broken in reality: the collab tables, the share
tables, the deploy. The common thread is **completion measured by code written rather than behaviour
observed.**

- **A health check is not a deploy check.** `/api/health` returned 200 through all three stale days.
  Probe a route from the *newest* feature instead: unauthenticated `GET /api/lists/<anything>` gives
  **401 JSON** when current, **404 HTML** when stale.
- **Any new table in `schema.js` needs a matching script in `backend/scripts/` run against prod.**
  Three features have been broken by skipping this.
- **Pushing to `main` does not deploy.** Until GitHub is connected, deploy manually and verify:
  ```bash
  cd /Users/juan/Recipe-App && npx -y @railway/cli up backend --service Recipe-App --ci
  ```
  (The `backend` PATH argument matters — the CLI link is keyed to the repo root, so `cd backend`
  alone does not change what gets uploaded.)
