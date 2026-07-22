# Contract — Testing (realizes docs/TESTING.md for the v2 tree)

Status: M0 draft · Credentials per founder decisions 1–2 (2026-07-21):
anon key committed in `.env.development`; authed E2E terminal-only.

## Layers → concrete commands (CI runs L1+L2 on every rebuild/** push)

| Layer | Command | Where |
|---|---|---|
| L1 unit | `npm test` (`node --test test/*.test.mjs` + colocated feature tests) | cloud + terminal + CI |
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
- Assert real fixture values, not element presence. Canonical:
  garlic-butter-chicken renders **415 kcal · 2.7 g carbs** — the phantom-20g
  regression is caught on pixels.
- Every nutrition assertion covers the macro split (P/C/F). kcal-only
  assertions are rejected in review.
- Screenshots ride in every report-back.

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
- Service-role key: edge functions only. Appearing anywhere else fails
  review, no exceptions.

## During the port

v1 suites keep running on both trees until cutover; the TS port must match
the old engine's outputs (divergence = port bug). Engine property tests per
engine.md §Laws.
