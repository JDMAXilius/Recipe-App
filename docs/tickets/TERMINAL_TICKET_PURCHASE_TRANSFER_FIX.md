# Terminal ticket: unstick the Otto Club purchase (RevenueCat code 7) — URGENT

> **Budget:** dashboard + one build at most. Read only what's named here. No re-audit.
> Written 2026-10-05 by the cloud session. 1.0.21 (build 48) is **in App Review**.

## What happened
Juan on TestFlight build 48: Apple said "You're all set. Your purchase was successful.", the
app said "The purchase didn't go through (7)" and stayed on the paywall.
`7` = `RECEIPT_ALREADY_IN_USE_ERROR` (`@revenuecat/purchases-typescript-internal`
`generated/error-codes.d.ts`). His Apple ID already holds Otto Club Monthly from an older test
(Apple's "You're currently subscribed to this" sheet), owned in RevenueCat by a **different
Otto account**. RevenueCat's **sandbox transfer behavior is "Keep with original App User ID"**,
so the subscription is refused for the new account. Apple's reviewers reuse sandbox Apple IDs
that bought Otto Club in earlier reviews (builds 40/41/46), so a reviewer can hit the same wall
behind the hard paywall and reject.

## Steps
- [ ] **T1. RevenueCat dashboard (Chrome):** Project settings → **Transfer behavior** → sandbox:
      **"Transfer to new App User ID"** (production already is). Screenshot the saved setting.
      If Chrome isn't signed in to RevenueCat, stop and ask Juan to sign in. Never type a password.
- [ ] **T2. Juan verifies (one tap):** in Otto on TestFlight, Otto Club screen → **Restore** →
      the app opens. Then RevenueCat → Customers → his current Otto account shows `club` active.
      Log the result.
- [ ] **T3. Website rename (Otto_Website repo):** the app's consent setting is now
      **"Account › AI features"** (build 48); the live Privacy Policy, Terms "AI features" section and
      FAQ still say "Account > Otto and AI". Replace that phrase, deploy, check the three live pages.
      Also push `main` if W6 (subscription-only copy) is still only merged locally.
- [ ] **T4. Don't swap the build in review.** The app-side fix (plain error messages, honest
      Restore: `club.logic.ts` `purchaseErrorMessage`, commit `7a6070dd`) ships with the next
      build. Only if Apple rejects 48 for the purchase: bump to build 49 (`app.json`), `eas build
      --platform ios --profile production --auto-submit`, attach 49, reply to Apple that the
      sandbox transfer setting was fixed and purchase errors now explain themselves.

## Done when
T1 saved, T2 confirmed by Juan, T3 live. Update `ROADMAP.md` (2026-10-05 section) and push `main`.

## Log
<!-- append: date, step, result, commit / screenshot -->
