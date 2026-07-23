# Contract — Testing (realizes docs/TESTING.md for the v2 tree)

Status: M0 draft · Credentials per founder decisions 1–2 (2026-07-21):
anon key committed in `.env.development`; authed E2E terminal-only.

## Layers → concrete commands (CI runs L1+L2 on every rebuild/** push)

| Layer | Command | Where |
|---|---|---|
| L1 unit | `npm test` — the root script MUST glob both `test/*.test.mjs` AND colocated `src/**/*.test.mjs`; engine tests ship as `.test.mjs` files importing the TS source via node's type stripping (node ≥22.6). Wiring the glob is part of the M1 engine packet's acceptance — a green `npm test` that never ran the engine suite is a false green. | cloud + terminal + CI |
| L2 static | `npm run typecheck` && `npm run lint` | cloud + terminal + CI |
| L3 browser | journey scripts below, Expo web `:8081` | cloud headless / terminal Chrome MCP |
| L4 native | TESTING.md checklist | terminal only, M4 gate |

## Journey scripts (`e2e/journeys/*.ts`)

One per feature packet minimum + the full smoke:

```
smoke.ts      browse → open recipe → save (paw) → plan week → build list →
              check item → cook mode
recipes.ts · nutrition.ts · cook.ts · cookbook.ts · planner.ts ·
import.ts · auth.ts · profile.ts · share.ts
```

Rules (from TESTING.md, binding here):
- ANY console error fails the journey.
- Assert real fixture values, not element presence. Fixture expectations
  are RECORDED, never invented: at fixture-build time, run the v1 engine on
  the recipe and store its exact output; the journey asserts the rendered
  numbers equal the recorded ones. (The v1 suites pin ranges — kcal
  320–500, carbs ≤5 for garlic-butter-chicken; the recorded values must
  fall inside them, and the phantom-20g regression is caught on pixels.)
- Every nutrition assertion covers the macro split (P/C/F). kcal-only
  assertions are rejected in review.
- Screenshots ride in every report-back.
- Journey/fixture files for a feature belong to that feature's packet
  owner_path (feature-module.md §Owner-path boundaries). `smoke.ts` and
  shared fixtures are owned by the integration builder (SG5).

## Fixtures (`e2e/fixtures/`)

- `recipes.json` — garlic-butter-chicken + 2 more goldens with expected
  P/C/F per serving (values copied from the v1 golden suite, never invented).
- `planner.json`, `shopping.json` — week + list expectations.
- e2e user rows are disposable; journey setup resets them.

## Credentials (decisions 1–2, locked)

- `EXPO_PUBLIC_SUPABASE_URL` + anon key: committed in `.env.development`.
  RLS is the boundary; anon journeys run anywhere, including cloud + CI.
- Test user `otto-e2e@…`: password ONLY in terminal env / EAS secrets —
  never committed, never in cloud. Authed journeys (save/plan/shop) run
  terminal-only until the founder revisits.
- **Cloud/CI acceptance split (prevents the authed-journey deadlock):** a
  feature packet's cloud verification = L1 + L2 + the ANON portion of its
  journey (browse/render paths). The authed portion is checked at the
  terminal checkpoints WORKFLOW §7 already schedules during M3 — an authed
  journey not yet terminal-verified is listed in the report-back `gaps`,
  never silently skipped, and M4 requires all of them green.
- **RLS attack tests** are plain node scripts using the committed anon key
  + two throwaway sign-ups (no secrets needed). If sign-up is blocked in
  an environment, the attack run moves to terminal and that fact goes in
  `gaps` — a policy read-through is NOT an attack test.
- Service-role key: edge functions only. Appearing anywhere else fails
  review, no exceptions.

## During the port

v1 suites keep running on both trees until cutover; the TS port must match
the old engine's outputs (divergence = port bug). Engine property tests per
engine.md §Laws.
