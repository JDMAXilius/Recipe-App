# 🎟️ Session handoff — what shipped, what's open

> Continuation ticket for the next Claude Code session. Everything below marked ✅ is
> **done, committed, and live in production** (Railway auto-deploys on push to `main`; the
> old "pushing main doesn't deploy" note in `TERMINAL_HANDOFF.md` is stale). Start from the
> **Open** section — the shipped work is context, not to-do.
>
> State as of this handoff: `main` at the ingredient-weight commit, TestFlight **build 25**
> submitting with the `Otto Insiders` group attached.

---

## ✅ Shipped this session (live in prod)

**Security hardening** (`docs/TERMINAL_TICKET_SECURITY_HARDENING.md` has the full log)
- Closed a live URL-scheme XSS on the public share pages (`sharePages.js` `safeUrl()`).
- CORS scoped from `*` to an allowlist (`ottosapp.com`, `www`, `WEB_ORIGINS` env); `helmet` + CSP.
- `destructiveLimiter` (5/15min) on `DELETE /api/account`; `publicShareLimiter` on `/r|/l|/hl`.
- Account deletion now also wipes the user's **Storage photos** (`deleteUserPhotos`), not just DB rows.
- `drizzle-orm` 0.44.7 → 0.45.2 (cleared the high-severity SQLi advisory; not exploitable here anyway).
- Root `.gitignore` added; root `node_modules` untracked. Secret sweep over all history: clean.
- Verified live: RLS on all 8 tables, storage has no listing leak, `trust proxy` keys per-client IP.

**Auth / account**
- **Username**: editable name on the account screen (`lib/username.js`), stored in Supabase
  `user_metadata` — no table. Relay-email fallback to "Chef". Household screen reads the same name.
- **Password reset**: `/(auth)/forgot-password` + root `/reset-password`. Works end to end —
  verified a real email lands (Google Workspace SMTP, see below).
- **Change password**: `/change-password`, current-password required, row hidden for OAuth-only accounts.

**Email (working)**
- Transactional email = **Google Workspace SMTP** (`smtp.gmail.com:465`, `juandiego@ottosapp.com`,
  App Password). Supabase email rate limit raised 2/h → 100. NOT Resend (Resend still serves
  `juandlugo.com` consulting only).

**Domain / deep links**
- Everything says **`ottosapp.com`** now (CORS, share links, README, legal URLs, test fixtures).
- URL scheme renamed `mobile://` → **`otto://`** (a squatting app could have hijacked OAuth callbacks).
  Native rebuilt; `otto://` deep links verified, `mobile://` now rejected. Supabase redirect
  allowlist carries `mobile://**`, `otto://**`, `https://ottosapp.com/**`.

**Ingredient weights** (the last feature — `lib/ingredientWeight.js`)
- Scale-friendly weights next to ingredients where **volume is a poor instrument** (flour, sugar,
  fats, cheese, nuts, grains, dried fruit, meat by mass). Hidden for liquids, spices, salt,
  aromatics, and anything under ~20 g. Weights are estimates → carry a `≈`.
- US mode converts European recipes' grams→oz/lb; metric mode converts cup recipes→ml + gram
  estimate. Both directions covered. USDA FoodData Central sourced (public domain); 972-ingredient table. (The original King Arthur chart dependency was removed 2026-07-21 — see REDESIGN_NOTES Phase 20.)
- Shown on the recipe detail AND cook-mode prep list (the mise-en-place screen where you weigh).
- 35 tests; full Metro export confirmed it bundles and ships.

**TestFlight tooling**
- Builds ship without any Apple login (local credentials, ASC API key). `npm run tf:attach`
  hands a new build to the `Otto Insiders` group after a submit.

---

> **Update 2026-07-20 (Mac session, `54e7535a`):** weight-first **Tasks 1 + 3 are done** — the real
> TheMealDB corpus is cached in `backend/scripts/corpus/`, `backend/scripts/audit-foodscale.mjs`
> audits it at line level, and four kilo-scale display bugs are fixed (piece words, pack weights,
> `2 x 400g`, the `tbls` unit). 66.9% of lines print a real g/ml number; numbers + the density
> cross-check verdict live in `TERMINAL_TICKET_WEIGHT_FIRST.md`. Still device-gated: Task 2.
> Also re-checked live: **`anonymous_users` is still `false`** — the onboarding account wall in
> `TERMINAL_TICKET_NEXT_SESSION.md §1` is unfixed and it is one dashboard toggle.

## ⚠️ Open — pick up here

### 1. Verify on a physical device (highest value, needs a human)
Everything below was verified by logic + real-data preview, NOT by eye on a phone. TestFlight
build 25 is the vehicle. Check:
- [ ] **Ingredient weights** render cleanly on the recipe detail + cook-mode rows (tab bar, spacing).
- [ ] **Password-reset link** opens the app to "Set a new password" (tap the emailed link).
- [ ] **Social sign-in** (Apple/Google/Facebook) still works through the new `otto://auth/callback`.
      Backend check passed (Supabase accepts the callback); a real login was never completed.

### 2. Ingredient-weight polish (only if the device check finds it)
- **Eggs show a weight always** (`2 eggs ≈100 g`). Research says helpful in baking, noise in savory,
  but Otto can't tell which recipe it's in. One-line change to gate it if Juan dislikes it on savory.
- **Dual-unit source strings**: TheMealDB sometimes writes `"175g/6oz"` and Otto shows it verbatim.
  Not wrong (the weight's right there), just untidy. Pre-existing parser behavior — leave unless asked.
- **US-mode weight-hint on cup recipes** now shows oz (`2 cups flour ≈8.5 oz`). Confirm that's wanted
  vs. metric-only weights.

### 3. Website — the real App Store blocker (in the OTHER repo `Otto_Website`)
Apple requires **live Privacy + Support URLs** before you can submit for review. The app links to
`ottosapp.com/privacy` and `/terms`; those pages don't exist yet, and the legal drafts still have
`[PLACEHOLDERS]`. TestFlight doesn't need them; the App Store does. **This is what gates launch.**

### 4. Config / housekeeping (Juan, dashboards — no code)
- [ ] **Rotate two leaked credentials** (both pasted into chat this session): the Google App Password
      (https://myaccount.google.com/apppasswords) and the Resend key (https://resend.com/api-keys).
- [ ] **Supabase Site URL** → set to `https://ottosapp.com` (was `http://localhost:3000`).
- [ ] **Leaked-password protection** — Supabase Pro-only, enable when you upgrade.
- [ ] **`noreply@ottosapp.com` alias** — resets currently come from Juan's personal address; replies
      hit his inbox. Fine at this scale; alias when volume grows.
- [ ] **Bundle id** is still `com.otto.recipes` (placeholder). Changing it later = new app record +
      testers reinstall. Decide before the tester base grows.

### 5. Known-but-deferred (not blocking)
- **Mobile `npm audit`**: 24 advisories, all transitive Expo build tooling, none in the app binary.
  Fix is an Expo SDK bump on its own schedule, not `npm audit fix`. Not security-relevant.
- **CORS + local web dev**: running Otto on web locally can't reach the prod backend (the scoping is
  working as designed). Point local web at a local backend, or add localhost to `WEB_ORIGINS`.
- **`Otto Insiders` group lacks auto-distribute** (Apple won't let it be turned on after creation),
  so each build needs `npm run tf:attach`. The skill now creates future groups with it on.

---

## Test / verify commands
```bash
cd mobile && node --test test/*.test.mjs      # 35 tests, all green
cd backend && npm test                        # 48 tests
# TestFlight after a submit:
cd mobile && npm run tf:attach                 # hand newest build to Otto Insiders
```
