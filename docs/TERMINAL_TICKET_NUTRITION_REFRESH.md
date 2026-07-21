# TERMINAL TICKET — Recalculate all nutrition with the USDA+Claude framework

> STATUS: in-progress — terminal 2026-07-21 (ba700e68)

Founder directive (2026-07-21): "We need to recalculate everything again with this new
framework that way everything is accurate."

Everything is built and on `main`. This ticket is pure execution — env, deploy, one script,
verification. **Order matters: keys before recompute**, otherwise the recalculation runs with
the Claude matcher dormant and only gets the deterministic fixes.

## Why this is needed (context)

Both nutrition caches are compute-once, so prod still serves the OLD engine's output:
- `seed_nutrition` rows computed with corrupt USDA rows (chicken thighs/drumsticks were mapped
  to chicken SKIN — 440 kcal/9.6g protein; pork knuckle/cheeks/sausage to pork backfat) and
  totals understated by silently-dropped ingredients.
- "unavailable" negative-cache sentinels that will NEVER retry on their own.
- `recipes.nutrition` (user recipes) backfilled by the same old engine.

The new framework (Phases 14–15e, all on main): fixed rows, qualifier/alias lookup, coverage
guard, coverage-aware low floor (light drinks compute truthfully), Claude-as-matcher
(Stage 1 bundled table, Stage 2 live USDA search) — USDA supplies every number, Claude only
ever SELECTS the food, hallucinations resolve to null.

## Steps (in this order)

1. **Keys on Railway** (service Recipe-App → Variables):
   - `ANTHROPIC_API_KEY` — wakes the matcher (and generate/text/photo import).
   - `USDA_API_KEY` — free, instant: https://fdc.nal.usda.gov/api-key-signup.html
     (Stage 2 full-database matching; skip only if the founder decides against it).

2. **Same two keys into `backend/.env` locally** — the recompute script runs on this machine
   against prod and reads its own env. Without them here, user-recipe recompute is
   deterministic-only.

3. **Deploy current main:**
   ```bash
   cd /Users/juan/Recipe-App && npx -y @railway/cli up backend --service Recipe-App --ci
   ```
   (The `backend` PATH argument is load-bearing — see REDESIGN_NOTES "merged is NOT live".)

4. **Prove the deploy** (health now names the build):
   ```bash
   curl -s https://<railway-host>/api/health
   # expect {"success":true,"version":"1.0.0","sha":"<current main sha prefix>"}
   ```
   The sha must match `git rev-parse --short=12 origin/main`. No sha match = stale build, stop.

5. **Recalculate everything:**
   ```bash
   cd backend && node --env-file=.env scripts/refresh-nutrition.mjs
   ```
   Idempotent — safe to re-run. This is the EAGER full-database recalculation: it enumerates
   the entire TheMealDB catalogue (a–z), wipes `seed_nutrition`, recomputes every catalogue
   recipe on the spot (same code path the API uses, so curated facts + sentinels apply), then
   recomputes every user recipe inline. Progress prints every 25; expect a few minutes for the
   catalogue. Final output: `seed recipes: N computed, M honestly unknown` and
   `user recipes: N recomputed, M honestly unknown`. Report both lines back.

6. **Verify in the app** (the founder's own recipes are the fixtures):
   - "World's Best Lasagna" (2-serving user recipe): nutrition card should show a **computed**
     figure (~740 kcal/serving at 4 servings basis — scaled to its servings), NOT
     "Otto's estimate, from this kind of dish".
   - A black-coffee-style recipe: single-digit-to-teens kcal, not 420.
   - Any seed recipe with chicken thighs: kcal noticeably down vs before (skin row fixed).

7. **Cost note:** user-recipe recompute fires one Haiku matching call per NOVEL unresolved
   ingredient (batched per recipe, cached in-process for the run). For a personal-scale DB
   this is cents. Seed recipes are matcher-light by construction (their names ARE the table
   vocabulary).

## Done when

- [ ] Health sha matches origin/main
- [ ] Script ran clean; counts reported back in the thread
- [ ] Lasagna shows computed (no "estimate" caption); coffee shows a real small number
- [ ] REDESIGN_NOTES updated with the run's counts (continue Phase 15 numbering)
