# ADR-0004: RevenueCat for subscriptions; one entitlement named `club`

- **Status:** Accepted
- **Date:** 2026-09-24 (backfilled)
- **Deciders:** Founder

## Context
Otto Club is an auto-renewing subscription (yearly $39.99, monthly $4.99, 7-day trial). StoreKit receipts, renewals, grace periods and server notifications are easy to get wrong.

## Decision
Use RevenueCat: products `otto_club_yearly` and `otto_club_monthly` attached to the entitlement `club`; the app reads membership from the customer-info listener (`useMembership`), and the `revenuecat-webhook` edge function writes `memberships` rows. An Apple purchase that RevenueCat has not confirmed is reported as `unconfirmed`, never as success.

## Consequences
Good: one membership question everywhere (`hasClubEntitlement`), RevenueCat's offline cache keeps returning members in. Bad: a third party sits in the money path; sandbox testing needs both Apple and RevenueCat set up.

## Options considered
- StoreKit 2 directly + own receipt validation (rejected: more code in the money path)

## Evidence
- `src/features/profile/club.purchases.ts`
- `src/features/profile/club.logic.ts` (`CLUB_ENTITLEMENT = 'club'`)
- `supabase/functions/revenuecat-webhook/`
- `docs/tickets/ROADMAP.md` (App Store Connect + RevenueCat setup)
