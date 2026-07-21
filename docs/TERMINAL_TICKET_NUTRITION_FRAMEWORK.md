# TERMINAL TICKET — Nutrition framework: everything the cloud can't run

Companion to `NUTRITION_FRAMEWORK_ROADMAP.md` (items N7–N10). The cloud session builds and
unit-verifies; these tasks need prod credentials, live API keys, open network, or a device.
Execute in order — Task 1 gates the rest.

## Task 1 — Activate + recalculate (roadmap N7) — DO THIS FIRST

Follow `TERMINAL_TICKET_NUTRITION_REFRESH.md` exactly (keys on Railway AND local
`backend/.env` → `railway up` → `/api/health` sha matches origin/main → run
`node --env-file=.env scripts/refresh-nutrition.mjs` → in-app spot-checks). Report the
script's two summary lines back into the thread.

## Task 2 — Live-fire matcher validation (roadmap N8)

The Claude matcher and USDA Stage 2 are unit-tested but have never run with real keys.
From `backend/` with the keyed `.env`:

1. Ad-hoc probe (write a throwaway script or node -e): call
   `resolveIngredientNames([...])` from `src/lib/nutrition/resolveIngredient.js` with ~30
   adversarial names, e.g.: beef mince, minced beef, aubergine, courgette, spring onions,
   coriander leaves, coriander seeds, gochujang, doubanjiang, nutritional yeast, vital wheat
   gluten, oat milk, almond creamer, stevia, monk fruit sweetener, ghee, paneer, halloumi,
   orzo, farro, plantains, tomatillos, kimchi, miso paste, tahini, pomegranate molasses,
   green beans, sweet potato, coconut milk, white rice.
2. For each: print input → resolved food (usda description) → kcal/100g. **Red flags:**
   identity swaps (green beans→beans, sweet potato→potato, coconut milk→milk must NOT
   happen — the prompt forbids them; if seen, paste the case into the thread for a prompt
   fix), and Stage-2 picks of branded/prepared foods where a raw whole food was meant.
3. Pull the `"ingredient resolution ran"` log lines and note tokens/cost for the batch.
4. Recompute 5 of the founder's user recipes + open 10 random seed recipes in the app;
   sanity-check the figures (no 900-kcal coffees, no 12-kcal lasagnas).

Findings → REDESIGN_NOTES (continue Phase 15 numbering). Wrong-match cases are prompt bugs:
report them; the cloud session owns the prompt.

## Task 3 — App rebuild for client-side nutrition pieces (roadmap N9)

Drink category estimates (Coffee ~60, Drink ~120, etc.) and any nutrition-card copy changes
live in the app bundle. Cut a new TestFlight build (bump `expo.version`, distribute to Otto
Insiders — automatic distribution is OFF, assign the build), then verify on device:
- A coffee-type created recipe shows a small computed number (post Task 1) or the ~60
  Coffee estimate — never the 420 dinner default.
- Weight-first ingredient display unchanged everywhere (grams/ml/kg roll-up).

## Task 4 — First-week cost watch (roadmap N10)

After Task 1, skim Railway logs for `ingredient resolution ran` and `photo extraction ran` /
`recipe generation ran` usage. Expected: resolution costs pennies (per-novel-ingredient,
cached in-process per deploy). If resolution volume looks unexpectedly high, say so — the
durable resolver cache (roadmap N2) is already queued cloud-side and removes repeat cost
across deploys.

## Task 5 — Pending: N2 migration (when the cloud lands it)

Roadmap N2 landed: run `node --env-file=.env scripts/n2-resolved-cache.mjs` against prod
(idempotent) BEFORE the refresh script, like every schema change (the "any new table needs
its script run on prod" lesson). The refresh script tolerates its absence but the durable
cache saves repeat Claude spend across deploys.

## Done when

- [ ] Task 1 executed; both summary lines reported
- [ ] Task 2 probe run; resolutions table + cost pasted; wrong-matches (if any) reported
- [ ] Task 3 build distributed; device checks pass
- [ ] Task 4 watch noted after ~1 week
