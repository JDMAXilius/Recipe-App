# ADR-0005: Hard paywall: an account and an active Otto Club are required to use the app

- **Status:** Accepted
- **Date:** 2026-10-04 (backfilled)
- **Deciders:** Juan (founder)

## Context
A free tier was planned in the v2 direction memo (`docs/reference/otto-v2-direction-and-structure.md`). On 2026-10-03/04 the founder chose subscription-only: nobody uses Otto without an account and the `club` entitlement (the free trial counts).

## Decision
Every route is declared in `app/_layout.tsx` under `Stack.Protected`: signed out → auth only; signed in without Club → onboarding and the paywall; everything else → signed-in members. The paywall has no close; it carries Restore purchases, Terms, Privacy, Sign out and Delete account (Apple 5.1.1(v)). Unknown membership shows the splash; a RevenueCat error fails closed onto the paywall.

## Consequences
Good: one clear model, deep links can't bypass it. Bad: Ask to Buy (pending) and lapsed members meet a locked app unless those states get their own screens (rework roadmap R2.2, R2.6). **This supersedes the freemium recommendation in the v2 direction memo**, which should be read as history.

## Options considered
- Free tier with Club features gated (rejected 2026-10-04)
- Soft paywall with a close button (rejected)

## Evidence
- commits `2f1433aa`, `db084fcd`, `a9d0bc4b` (2026-10-03/04)
- `src/features/onboarding/launch.ts`
- `app/_layout.tsx`
