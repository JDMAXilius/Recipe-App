# ADR-0010: Preferences live on the account, not only on the phone

- **Status:** Proposed
- **Date:** 2026-11-04
- **Deciders:** Juan decides (rework roadmap D1)

## Context
Diet and cuisines are stored only in device key-value storage (`src/features/profile/usePrefs.ts`); a new phone loses them, and the new first-run questions (household, allergies, skips) need a home the draft can be claimed into.

## Decision
Add a `profiles` row per user (RLS own-row) holding household, diet, allergies and skips; device storage becomes an offline cache.

## Consequences
Good: answers follow the account; the allergy filter works everywhere. Bad: allergies on the server change the App Privacy answers before the next submission; a migration and RLS test are needed.

## Options considered
- Keep device-only prefs
- Store in `auth.users.user_metadata` (rejected: not queryable with RLS joins, mixed with auth data)

## Evidence
- `docs/tickets/REWORK_ROADMAP.md` D1, D2, R0.4
