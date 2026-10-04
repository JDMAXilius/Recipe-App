# Release checklist: Otto 1.0.20 (after 1.0.19 is approved)

> **Budget:** checklist only. Read nothing outside the files and dashboards named here; no
> re-audit (`docs/audit/2026-10-04-AUDIT.md` is done); one verification run per step; short logs.

1.0.20 = builds 43–44+: native Google sign-in, private Facebook session, onboarding on the
account, sign up → onboarding → hard paywall, Sign in with Apple revocation on delete,
subscriber delete step, email-confirmation inbox screen, lean hard paywall (no skip).
Everything below was **deliberately held** because 1.0.19 (build 41) in review has the
free tier and no inbox screen. Do these the day 1.0.20 is submitted / goes live.

## At submission (App Store Connect)
- [ ] **Version string first.** Builds 43–44 were built as `1.0.19` (`app.json` `expo.version`).
      ASC only attaches a build whose version string matches, so set `expo.version` to
      **`1.0.20`** and cut a new build (45+) before creating/attaching version 1.0.20. Builds
      43–44 can't be used for 1.0.20.
- [ ] **If the UX ticket's consent rework lands (item 10: "Account › AI features")**, rename
      everywhere in the same release, because Apple compares the reply/notes with the app:
      `AI_CONSENT_COPY.settingsLabel` and `offToast` (and `aiConsent.logic.test.mjs`, which pins
      the label to the path in the body), the FAQ data answer, the review notes, and the
      website Privacy Policy, Terms "AI features" section and FAQ (website W5 says
      "Account > Otto and AI"). The provider name, the explicit Allow, and nothing sent before
      it must stay (5.1.2(i)).
- [ ] Create version 1.0.20, attach the newest VALID build.
- [ ] **Description:** remove any "free" / "core features stay free" wording → "Start with a
      7-day free trial, then Otto Club $4.99/month or $39.99/year." Keep renewal terms +
      Terms/Privacy links (3.1.2).
- [ ] **Review notes:** Otto is subscription-only after a 7-day trial; the demo account has an
      Otto Club entitlement so you can use everything; to test the purchase, sign up with a
      new account → after the intro, the paywall → Start my free week (sandbox).
      Delete my account on an Apple-sign-in account asks Apple once (token revocation).
- [ ] **RevenueCat:** customer `e320f478-9313-4870-bd63-33851846352b` (demo) → Grant
      entitlement `club` (promotional, e.g. 1 year). NOT before: build 41's reviewer must be
      able to test the purchase.
- [ ] What's New: "A cleaner start: sign up, a quick intro, and your free week."

## Edge functions — deploy with 1.0.20 (audit 2026-10-04, `docs/audit/2026-10-04-AUDIT.md`)
The code on `main` carries: a server-side Otto Club gate for `generate-recipe`, `import-recipe`
and `resolve-nutrition` (`_shared/membership.ts` + `requireClub()` in `_shared/http.ts`, **off
until `REQUIRE_CLUB=on`**), a 500 from `delete-account` when the auth user survives, an import
rate limit, and a constant-time webhook secret compare. Deploying is safe before 1.0.20 is live
(the gate is off); **turning the gate on is not** — build 41's free tier calls these functions.
- [ ] `deno check supabase/functions/*/index.ts` (no Deno in the cloud; must pass here).
- [ ] `supabase functions deploy generate-recipe import-recipe resolve-nutrition delete-account`
      and `supabase functions deploy revenuecat-webhook --no-verify-jwt`. Then one Ask Otto on
      TestFlight to confirm nothing changed with the gate off.
- [ ] **Day 1.0.20 is live, after the demo entitlement grant above:**
      `supabase secrets set REQUIRE_CLUB=on`. Verify: a non-member token → 402 from
      generate-recipe; the demo account → 200; a fresh sandbox purchase → 200 within seconds even
      before the webhook (REST fallback). If anything blocks a real member, `supabase secrets unset
      REQUIRE_CLUB` turns it off instantly.
- [ ] Supabase → Auth → Providers → Email → **Leaked password protection: ON** (advisor WARN).

## Same day 1.0.20 goes live
- [ ] Website: merge `w6-hard-paywall` (Terms §4 + support FAQ subscription-only copy).
- [ ] Supabase → Auth → Sign In / Providers → **Confirm email: ON** (1.0.20 has the inbox
      screen; old builds don't).
- [ ] RevenueCat sandbox transfer behavior is "Keep with original App User ID" (testing aid,
      sandbox only). Fine to leave; production stays "Transfer to new App User ID".

## Already done (2026-10-03/04)
Google Cloud iOS client + consent screen In production; Supabase Google client IDs + skip
nonce; SIWA key 3R22ZNM24Q + APPLE_SIWA_* function secrets (verified by digest);
delete-account v9 deployed; all non-demo accounts removed.
