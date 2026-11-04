# ADR-0011: Offline: persist the query cache, never sync mutations

- **Status:** Accepted
- **Date:** 2026-11-04 (backfilled)
- **Deciders:** Gold-standard gaps G14

## Context
Plans, the shopping list and saved recipes should open without a connection. The 2026-07-21 API decision already ruled out sync machinery ("offline = read-only last-good cache").

## Decision
TanStack Query's cache is persisted to AsyncStorage for a week (`otto.v2.queryCache`), busted on each app version, never dehydrating mutations, and cleared on sign-out or when a different account signs in. NetInfo drives `onlineManager`; one `OfflineBanner` explains the state.

## Consequences
Good: read-only offline with no conflict handling. Bad: an app update wipes the cache (scenario ticket S7 proposes a schema-number buster); writes made offline fail rather than queue.

## Options considered
- Offline-first sync (rejected 2026-07-21: no sync machinery)

## Evidence
- `app/_layout.tsx` (PersistQueryClientProvider)
- `src/shared/online.ts`
- `docs/history/REDESIGN_NOTES.md` Phase 13
