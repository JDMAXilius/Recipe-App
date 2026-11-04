# Terminal ticket: redesign Otto's app flow from the researched model

> **Budget:** plan + Juan's decisions first (F1–F2), then build in small PRs. Written 2026-11-03.
> Read `TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md` first.

## Why
Juan: the current flow "is not the worst, but it's definitely not there". Today (see
`docs/flow-maps/maps/otto.html`): launch gate → sign up/sign in **first** → onboarding → **hard paywall**
→ tabs. Nothing of value is shown before the account and the money ask, and several scenarios
(returning-state restore, permission denial, lapsed subscription, link entry while signed out) aren't drawn or designed.

## Inputs
- Target model: `docs/flow-maps/maps/apple.html` + `research/01_APPLE_AND_INDUSTRY_RULES.md` (23-scenario checklist).
- Proven patterns: `research/02_REFERENCE_APP_FLOWS.md`. Closest analogue: **Cherrypick** (meal plan + groceries). Strongest plan-reveal → paywall: **Cal AI**. Account-after-result: **Duolingo**.
- Juan's redesign requirements: `docs/redesign-2026-11/`.
- Code: `app/_layout.tsx`, `src/features/onboarding/gate.ts` (+ its tests), `src/features/onboarding/OnboardingScreen.tsx`, `src/features/profile/OttoClubScreen.tsx`, `src/features/auth/*`.

## Steps
- [ ] **F1. Draft the new flow as a map.** Copy `docs/flow-maps/build/` data format and add an `otto-next` entry to `build.mjs`: first launch, returning, link/notification entry, plus scenario lanes. **Use the 14 lanes in `docs/flow-maps/lanes/otto.json` as the checklist** (today's behaviour + gaps) and draw each one's target behaviour in `otto-next`; Apple's version of each is in `lanes/apple.json`. Also draw the entry points the current map lacks: reminder notification taps (S2) and What's New after an update (S7). Recommended starting point (decide with Juan):
      welcome (with "I have an account") → food questions (household, diet, dislikes, goals) → taste/recipe picks → **plan reveal** (their first week of meals) → **account, framed as "save your plan"** (Sign in with Apple first; Skip allowed only if the app can run without an account — today it can't, see F2) → paywall right after the reveal (trial, billed amount most prominent, Restore, Terms, Privacy; a one-time offer on dismiss is optional) → Discover/Plan. Notifications primed at the plan reveal ("remind me what's for dinner"), camera only at first photo import, AI consent right before the first AI call.
- [ ] **F2. Decisions for Juan (ask, don't assume):** (a) keep the hard paywall or allow a free tier; (b) account before or after the questions (Supabase stores prefs per user — answers given before sign-up must be kept locally and written after sign-in); (c) which tab opens first; (d) whether to add a one-time offer.
- [ ] **F3. Gate logic.** Update `resolveRoute`/`canUseApp` and the `Stack.Protected` groups in `app/_layout.tsx` to the agreed order; extend `gate` tests for every branch (first launch, returning member, lapsed, signed out, link entry).
- [ ] **F4. Restore state on relaunch** (HIG Launching): reopen the last tab instead of always Discover.
- [ ] **F5. Scenario coverage** (lanes 2, 5, 8; the remaining lane gaps are S1–S11 in `TERMINAL_TICKET_SCENARIO_GAPS.md`): permission denied fallbacks, lapsed subscription → clear re-subscribe path without data loss, deep link while signed out / not a member returns to the target after sign-in or purchase, offline launch.
- [ ] **F6. Small fixes found while mapping:** delete the unreachable signed-out "Sign in" state in `src/features/chat/ChatScreen.tsx` (chat is members-only); Cookbook empty-state "Explore" pushes `/` (launch gate) — push the Discover tab directly.
- [ ] **F7. Regenerate `otto.html`** from the new routes and compare with `otto-next`.

## Done when
`otto-next` map approved by Juan, gate + tests merged, F4–F6 shipped behind one build, `otto.html` matches the shipped app. Update `ROADMAP.md`.

## Log
<!-- append: date, step, result, commit -->
