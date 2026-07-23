# ✅ Otto Pre-Launch Checklist

> Grounded in the actual state of the repo (2026-07-18), not a generic template. Each item is
> tagged with an **owner**: **[You]** = founder in a console/dashboard, **[Terminal]** = the Mac
> engineer, **[Backend]** = a Railway/env change, **[Done]** = already handled in code (verify only).
>
> Scope tiers so nothing blocks the wrong step:
> - **A. Blockers for TestFlight *internal*** — must be true before testers get a useful build.
> - **B. Blockers for App Store *review/public*** — needed to submit for sale/public TestFlight.
> - **C. Polish** — worth doing before public, not blocking.

---

## A. Blockers for internal TestFlight

- [ ] **[Terminal]** Build + submit per `TERMINAL_TICKET_TESTFLIGHT.md`, and register the three
  `EXPO_PUBLIC_*` env vars (Supabase URL/key, API URL) — a build without them white-screens.
- [x] **[Backend]** Backend is **deployed and public** (Railway), and `EXPO_PUBLIC_API_URL` points at
  it — a phone can't reach a laptop. ✅ **Redeployed 2026-07-19** after discovering prod had been
  running a **2026-07-16** build, i.e. every share and collab route was missing. `/api/health` 200.
  > **A health check is NOT a deploy check.** `/api/health` answered 200 the whole time prod was
  > three days stale. Verify a route from the *newest* feature instead — unauthenticated
  > `GET /api/lists/<anything>` gives **401 JSON** on current code, **404 HTML** on a stale build.
- [ ] **[You]** At least **Apple** sign-in configured per `TERMINAL_TICKET_OAUTH_PROVIDERS.md`
  (buttons are honestly gated, so Apple-only is fine; Google/Facebook can follow).
- [ ] **[Backend] Full account deletion.** `DELETE /api/account` wipes favorites/recipes/plans and
  deletes the Supabase auth user **only if `SUPABASE_SERVICE_ROLE_KEY` is set** in the backend env
  (`server.js:442`). **Set that key on Railway** or account deletion leaves the login (email) alive —
  which fails Apple Guideline 5.1.1(v). Verify the response returns `authUserDeleted: true`.

---

## B. Blockers for App Store review / public

### Legal pages
- [ ] **[You] Privacy policy URL — REQUIRED.** Today `PRIVACY_URL = null` in `app/(tabs)/profile.jsx`
  so the row is hidden (honest, no dead link). App Store *and* Sign in with Apple both require a
  reachable privacy policy. Host one (a simple static page is fine), then set `PRIVACY_URL` to it —
  the in-app row appears automatically. *(Ask me and I'll draft a starting-point policy tailored to
  what Otto actually collects — see the data map below — for your lawyer/you to finalize. I won't
  invent legal text unasked.)*
- [ ] **[You] Terms of Service** (optional but recommended). Same pattern: set `TERMS_URL` when the
  page exists; the row is gated off until then.

### App Store Connect metadata
- [ ] **[You] Support URL / email.** A support contact is required. The app already has a support
  email wired (feedback + bug-report mailto in `profile.jsx`); use the same address for the App Store
  "Support URL" (a mailto or a simple contact page).
- [ ] **[You] App Privacy answers ("nutrition label").** Based on what Otto actually collects:

  | Data type | Collected? | Linked to identity? | Used for | Notes |
  |---|---|---|---|---|
  | **Email address** | Yes | Yes | App Functionality (auth) | From email/Apple/Google/Facebook sign-in via Supabase |
  | **Name** | Sometimes | Yes | App Functionality | Only if the provider returns it (Apple/Google) |
  | **User content** (recipes, meal plans, shopping lists) | Yes | Yes | App Functionality | Stored server-side, scoped per user |
  | **Photos** (plate journal) | **No (on-device only)** | — | — | Journal photos live in on-device storage (`otto.journal.*`), never uploaded — do **not** declare as collected |
  | **User ID / identifiers** | Yes | Yes | App Functionality | Supabase user id |
  | **Diagnostics / crash data** | Backend only | No | App Functionality | Server error tracking (Sentry-style). Declare only if a mobile crash SDK is added — none today |
  | **Tracking / ads** | **No** | — | — | No ad or cross-app tracking SDKs → **no ATT prompt needed** |

  > Net: "Data Used to Track You" = **none**. "Data Linked to You" = email, name (maybe), user
  > content, identifiers — all for **App Functionality**, not advertising.
- [ ] **[You] Age rating** questionnaire (Otto has no objectionable content → 4+; note user-generated
  content + web links if the import/browser flow counts).
- [ ] **[You] Screenshots** for required device sizes (6.7" at minimum), app name, subtitle,
  description, keywords, category (Food & Drink). **Copy is drafted and character-counted in
  `docs/APP_STORE_LISTING.md`** — paste it; only the demo-account credentials and the three
  ottosapp.com URLs are still blank.
- [ ] **[You] Sign in with Apple review note.** If review can't complete Apple sign-in, provide a
  **demo account** (email+password) in App Review notes so they can get in.

### Functionality gates (Apple rejects these)
- [ ] **[Done → verify]** No dead-end UI — rate/tell-a-friend/privacy/terms rows are all gated on real
  URLs (`RATE_APP_URL`, `TELL_A_FRIEND_URL`, `PRIVACY_URL`, `TERMS_URL` = null → hidden). Set them
  when real; never ship a row that goes nowhere.
- [ ] **[Done → verify]** Delete-account is reachable in ≤2 taps from Profile and not hidden under
  Privacy (honesty law; `profile.jsx:24`).
- [ ] **[You]** If any OAuth provider button is visible, its flow must complete end-to-end in the
  reviewed build (see OAuth ticket) — a visible-but-broken social button is a rejection.

---

## C. Polish (before public, not blocking internal)

- [ ] **[You]** Set `RATE_APP_URL` to the real App Store review deep link once the app id exists
  (`profile.jsx` — row stays hidden until then).
- [ ] **[You]** Set `TELL_A_FRIEND_URL` (the public App Store listing URL) so the share-Otto row
  carries a real link instead of link-free text.
- [ ] **[You]** External TestFlight (public testers, up to 10k) needs the **Test Information** tab
  filled + a light Beta App Review. Not needed for internal.
- [x] **[Backend] Account-deletion completeness sweep. ✅ DONE + VERIFIED IN PRODUCTION 2026-07-19**
  (throwaway account seeded across all six user-owned tables → `{dataDeleted:true,
  authUserDeleted:true}`, its share link 404s, DB sweep shows 0 rows; the whole sweep runs in **one
  transaction** after a no-transaction bug was found that deleted data and then reported failure). `DELETE /api/account` now
  also deletes `recipe_shares`, `list_shares`, and the `collab_lists` (+ their `collab_items`) the
  user **owns** — hard deletes, not `revokedAt`, since a revoked row still carries their user_id.
  **Call made, easy to reverse:** a shared list dies with its owner. There is no member registry to
  hand it to (`collab_items` stores only a display name), so ownership can't transfer without a
  schema change, and an orphaned list is one nobody can ever put away. Lists the user merely
  *joined* are untouched — those belong to someone else. `test/accountDeletion.test.mjs` reads
  `schema.js` and fails if any table with a `user_id` column is missing from the handler, so the
  next user-owned table can't be forgotten.
- [ ] **[You]** Confirm the **client-secret JWT for Apple expires ≤6 months** — set a reminder to
  regenerate (also noted in the OAuth ticket).
- [ ] **[You]** Backend **rate limiting + error tracking** live in production (B0 work) — confirm keys
  are set in the Railway env, not just present in code.

---

## Data map (for the privacy policy + App Store answers)

**Collected server-side (Supabase/Postgres via the backend):** email, optional name, Supabase user
id, and user content (recipes you save/import, meal plans, shopping lists — including collaborative
list items shared with people you invite).

**Stays on your device (never uploaded):** cooking-journal plate photos, food preferences, reminder
settings, onboarding state — all in on-device storage.

**Third parties in the path:** Supabase (auth + database), the app's hosting/backend (Railway), the
recipe source (TheMealDB) for browsing, and the OAuth providers you enable (Apple/Google/Facebook)
for sign-in only. No advertising or cross-app tracking SDKs.

---

## Quick status snapshot (as of this checklist)

| Item | State |
|---|---|
| Delete account (in-app + API) | ✅ built; ⚠️ needs `SUPABASE_SERVICE_ROLE_KEY` for full deletion |
| Privacy policy | ❌ URL not set (`PRIVACY_URL = null`) — **required before submit** |
| Terms | ⭕ optional, gated off |
| Support contact | ✅ email wired (feedback + bug report) |
| Rate / Tell-a-friend rows | ⭕ honestly gated off until URLs exist |
| Social sign-in | ⚙️ wired in code, needs Supabase provider config (OAuth ticket) |
| TestFlight build config | ✅ `eas.json` + `app.json` ready (TestFlight ticket) |
| Tracking / ATT | ✅ none — no prompt needed |

---

## D. Roadmap & activation items — launch verdicts (2026-07-21)

> Founder asked: which of the remaining items are **absolutely necessary before launching**?
> Verdict per item, with the reason. "Launch" = public App Store; internal TestFlight is looser.

### ABSOLUTELY NECESSARY — launch is broken or non-compliant without these

- [ ] **[You] `railway up` deploy of current `main` + nutrition recalculation.** Full ordered
  runbook: `docs/TERMINAL_TICKET_NUTRITION_REFRESH.md` (keys first → deploy → verify sha →
  `scripts/refresh-nutrition.mjs` → in-app spot-checks). Without the script, old corrupt/
  understated cached values and never-retry "unavailable" sentinels persist. Everything shipped since the last deploy
  (weight-first display fixes, AI seams, Run A hardening, photo import) exists only in git until
  this runs. Push ≠ deploy — verify with `/api/health` now returning `{version, sha}`.
- [ ] **[You] Anonymous sign-in toggle** (Supabase Auth settings). Guest browsing is the front
  door of the product and it is broken in prod today. Nothing else matters if the first screen
  can't be used.
- [ ] **[You] Photo bucket SQL** (`TERMINAL_TICKET_FUNCTIONAL_FIXES.md` Task 3). The editor's
  "Upload a photo of the dish" button is live UI; without the bucket it fails every time — a
  dead-end button, which the honesty laws forbid shipping. Run the SQL **or** tell me to gate
  the button off.
- [ ] **[You] `SUPABASE_SERVICE_ROLE_KEY` on Railway** (+ rotation per the security ticket).
  Already tier A above: without it, account deletion leaves the login alive → fails Apple
  Guideline 5.1.1(v). Compliance, not polish.
- [ ] **[Terminal/You] TestFlight build distributed + device QA pass.** A launch is a build in
  users' hands; builds sitting in "processed" reach nobody (automatic distribution is OFF on
  Otto Insiders — assign the build to the group).
- [ ] **[You] Privacy policy URL** (tier B above — restated here because it is the one legal
  hard-stop App Store review will actually enforce).
- [ ] **[You] `THEMEALDB_KEY` supporter key** — **necessary for PUBLIC launch, not for internal
  TestFlight.** TheMealDB's terms allow the test key for development only; a public app-store
  release is expected to hold a supporter key. This is a terms-compliance gate, not a feature.

### DECISION REQUIRED — one of two paths before public launch

- [ ] **[You] `ANTHROPIC_API_KEY` on Railway — set it, or we hide the dormant cards.** The app
  technically works without it (all four AI seams answer with honest "still being wired up"
  copy). But the Add sheet now leads with three Otto features (cook it up, paste text, snap a
  photo) that would all apologize on day one — survivable for internal TestFlight, not a
  public first impression. One env var wakes all four seams at once; if you'd rather launch
  without the spend, say so and I'll gate the dormant cards off so nothing on screen can fail.

### NOT NECESSARY FOR LAUNCH — defined and deliberately deferred

- **Run C offline read cache (API-7):** the app is online-only and *honest* about failures
  (Otto-voice errors, stale-while-revalidate already cushions Discover). Post-launch comfort.
- **Ask Otto / plan-my-week seams (API-8 #2–3):** new features, not gates. Ship after launch.
- **Supabase Realtime for the shared list (API-6 later-branch):** 8-second polling is
  indistinguishable from live for a household. Upgrade only if real users feel lag.
- **Pagination, OpenAPI spec, idempotency keys, webhooks, quota tiers (§5 of
  API_ARCHITECTURE):** each has a written trigger for when it stops being a skip; none fire at
  launch scale.
- **`SENTRY_DSN`:** recommended in week one (request-ids + pino already give correlation), but
  logs alone are enough to launch.
- **`SHARE_BASE_URL` / pretty domain:** share links already work on the Railway host. Polish.
- **Density-table unification + live-corpus line validation (terminal ticket):** accuracy
  polish on top of an engine that is already golden-tested against the full 920-name corpus;
  the residual tail only softens calorie estimates that are honestly marked `~`.

**The short version:** seven boxes in the first list + one decision = launch-ready. Nothing in
the deferred list should delay a launch date.
