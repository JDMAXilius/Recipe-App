# ADR-0003: Supabase as the backend, row-level security as the authorization layer

- **Status:** Accepted
- **Date:** 2026-07-15 (backfilled)
- **Deciders:** Founder · Phase 11 (B0+B1)

## Context
Otto stores accounts, saved and user recipes, plans, households and memberships. There is no app server team.

## Decision
Use Supabase: Postgres with RLS on every user table (own-row policies), Supabase Auth (Apple, Google, Facebook, email), Edge Functions for anything that needs a secret (AI, webhooks, account deletion), and SECURITY DEFINER RPCs for capability-URL reads (shares). The client talks to Postgres directly with the user's JWT; there is no custom API in between.

## Consequences
Good: authorization is in the database and testable (`supabase/migrations/tests/rls-attacks.test.mjs`). Bad: every new table needs policies before it ships; schema docs drift unless generated (see `docs/architecture/ERD.md`).

## Options considered
- A custom Node API (rejected: more to run and secure)
- Firebase (rejected: weaker relational model for plans and households)

## Evidence
- `supabase/migrations/`
- `src/shared/supabase/client.ts`
- `src/features/share/share.queries.ts` (DEFINER RPCs)
