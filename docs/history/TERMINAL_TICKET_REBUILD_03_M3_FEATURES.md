# TERMINAL TICKET — REBUILD 03 · M3 feature fan-out

**Goal:** port the 9 `src/features/*` folders from v1 to the v2 structure
(TS, TanStack Query, `@/shared/ui`, branded ids), each self-contained per
`docs/contracts/feature-module.md`. Two waves (founder decision 3).

**Kick-off:** M1 green (engine @12502ac6) · M2 live (@ff0dd011) · shared/ui
(@50bf62a6) · types regenerated. Work branch: `rebuild/v2`.

## Wave split (dependency direction: providers first, consumers second)

**Wave 1 — export the cross-feature allowlist (5):**
`auth` (useAuth) · `cookbook` (useSaved) · `nutrition` (useNutrition +
NutritionCard) · `planner` (usePlan) · `share` (ShareCard)

**Wave 2 — consumers (4):**
`recipes` (Discover + detail; consumes useSaved/useNutrition/usePlan +
NutritionCard/ShareCard) · `cook` (consumes useNutrition) · `import` (AddSheet)
· `profile` (consumes useSaved/usePlan)

## Per-feature packet shape

- owner_path: `src/features/<name>/` **+** `e2e/journeys/<name>.ts` **+**
  `e2e/fixtures/<name>.json`
- Port from the named v1 source (read-only): `mobile/app/*`, `mobile/components/*`,
  `mobile/lib/*`. Rewrite to TS, TanStack Query for all server state (no
  contexts, no hand-rolled caches), `@/shared/ui` primitives + `@/shared/theme`
  tokens, supabase via `@/shared/supabase/client`, ids branded via `@/types/ids`.
- Nutrition math comes ONLY from `@/features/nutrition/engine` — never
  re-implement parsing/among/guards.
- Export exactly what `feature-module.md` §allowlist says; nothing else leaks.
- Zod only at trust boundaries (edge-function responses, external payloads).

## Acceptance (M3, per packet)

- tsc + eslint clean (repo-wide stays green)
- colocated unit tests for pure logic pass (`*.test.mjs`)
- exports match the contract's allowlist; imports only from `@/shared`,
  `@/types`, and allowlisted cross-feature hooks/components
- diff ⊆ owner_path
- `e2e/journeys/<name>.ts` + fixtures AUTHORED (they EXECUTE at SG5 integration
  when routes+providers boot the app — routes don't exist in M3)

## Gate M3

Every packet accepted (builder → verifier → merge). Then ticket 04 (SG5
integration: thin routes + providers + boot, then the review swarm + device QA).

## Report-back (per wave, folded here)
```
wave 1: auth __ · cookbook __ · nutrition __ · planner __ · share __
wave 2: recipes __ · cook __ · import __ · profile __
tsc/lint repo-wide: __ · unit suites: __/__
```
