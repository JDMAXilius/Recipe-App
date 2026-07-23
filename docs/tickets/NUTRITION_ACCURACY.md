# Nutrition accuracy — discussion + tickets (2026-07-23 handoff)

**Purpose:** capture a live design discussion so any Claude Code session (or Juan via phone)
can continue the work. Nothing below is *done* except the context + the one small fix noted.
Most execution is **terminal-only (Claude Code)** — flagged per item. Discussion/decisions can
happen on phone.

---

## 0. The system — read this first (context)

Otto computes recipe nutrition **deterministically, on-device, from USDA data** — no network, no
LLM in the arithmetic (the LLM only matches *unknown ingredient names*, via the `resolve-nutrition`
edge function). Three layers:

1. **`src/features/nutrition/engine/data/usdaTable.json`** — **962 ingredients, per-100g** USDA
   values (`{fdcId, usda, kcal, protein_g, fat_g, carbs_g, fiber_g, sugar_g, sodium_mg}`). The
   compute is `value × grams / 100` (see `compute.ts:195`). ✅ ~95% of TheMealDB's 985 ingredients
   covered; curated. **⚠️ It is per-100g, NOT per-serving. Do NOT convert it to "per serving" — the
   engine would double-scale and every recipe would read wildly low.**
2. **Weight layer** — `pieceWeights.json` (79), `cupWeights.json` (74), + the `DENSITY` / `PIECE_G`
   / `EACH_G` tables inside `parse.ts`. Turns "2 chicken breasts" / "1 cup rice" → grams. 🎯 **This
   is the real accuracy lever.**
3. **Servings + cooking model** — `recipeFacts.json` (per-recipe serving count) + `applyFryingMedium`
   / `applyBatchCondiment` in `guards.ts` (÷ servings, and count only *absorbed* frying oil).

**Proof it's per-100g:** a bolognese with 30 g parmesan (per-100g = 392 kcal) computes to
211 kcal/serving; the parmesan contributes only 29 kcal/serving (`392 × 30/100 ÷ 4`).

## 1. Key finding — "why does a recipe read too high?"

When a total is too high but the arithmetic doesn't match reality, it is **always layer 2/3, never
the per-100g table.** Traced **Irish Stew** (1135 kcal/serving), three culprits:

- **Cooking oil counted whole** — `120ml olive oil` (for browning) = 976 kcal. You don't eat 120 ml
  of oil; most stays in the pan. `applyFryingMedium` only triggers on a literal "for frying".
- **Fatty-cut + raw match** — `lamb` → "Lamb, loin chop, separable lean and fat" (298 kcal/100g);
  real stew lamb is leaner (~230), and 2 kg counted **raw** (fat renders out over 2 h of stewing).
- **Wrong match** — `300g soaked overnight in water …` matched to **flour** (almost certainly barley).

## 2. Industry validation (settled — don't relitigate)

This IS how recipe-nutrition apps work. Per-100g base + parse-line → grams → ÷ servings:
- **Edamam / Spoonacular / Nutritionix** — same pipeline; USDA per-100g is the universal base.
  Otto is a deterministic, on-device Edamam-style engine + honesty guards most apps lack.
- The cooking-yield problem is canonical: **USDA FNDDS yield & nutrient-retention factors** and
  **Edamam's `retainedWeight`** are the references. Otto already has the correct *absorbed-only*
  model for frying oil — it just needs better **detection** (see T1).
- **The right rule for oils/spices is NOT "exclude them" — it's "count only what's eaten."** Oil in
  a dressing/sauce IS eaten (count fully); oil as a browning medium is mostly not (count absorbed).
  Excluding wholesale flips the error to *under*-counting. Spices are already ~0 kcal and de-weighted
  (`isNegligible`); no need to exclude.

## 3. Open discussion — the MyFitnessPal / Cronometer / Yazio model

Those apps store foods **per-100g PLUS named serving weights** ("1 cup = X g", "1 medium = Y g")
the user picks from. **That is exactly Otto's `pieceWeights` + `cupWeights`** — just per-food and
much larger. **Takeaway:** the "MFP model" does NOT mean changing the per-100g table; it means
**growing the per-food serving-weight coverage** (= ticket T2). Logging apps (MFP/Cronometer) also
sidestep cooking yield because the user logs the *cooked* portion; Otto starts from *raw* ingredients
so it must model yield itself (T1/T3).
> **Decision for Juan:** how far to invest in named-portion / weight coverage (T2)?

---

## 4. Tickets (prioritized)

### T6 — Per-recipe breakdown diagnostic tool  ·  do this FIRST  ·  ✅ BUILT (2026-07-23)
`tools/nutrition-breakdown.mjs` is committed. Given a recipe (id/name/ingredients) it prints each
line's **parsed grams + kcal contribution + matched USDA record (with fdcId)**, sorted heaviest-first,
flagging outliers: `OIL_WHOLE` (frying medium counted as eaten — the T1 signal), `UNMATCHED`,
`HUGE_GRAMS`, `BIG_SHARE` (one line dominates the total), `low-conf`, `NO_GRAMS`, plus the guards that
*did* fire (`frying-absorbed`, `condiment-capped`, `typical-amt`, `cooked-record`). It reuses the
engine's own parse→lookup→guards path in compute.ts order, so the numbers match what the engine sums.

Run:
```
node --experimental-strip-types --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
     tools/nutrition-breakdown.mjs [--demo | --file <recipe.json> | --corpus <recipes.json>]
```
`--demo` reproduces the Irish Stew trace (surfaces all three culprits the ticket named).
`tools/nutrition-breakdown.sample.json` is a 4-recipe example / corpus template.

**Remaining networked step (terminal w/ network):** generate the full seed corpus — call the `content`
edge function per TheMealDB recipe, write `[{ name, recipeId, servings, ingredients }]`, then
`--corpus` it to rank all 750+ worst-first. (USDA is blocked in cloud sessions, but the breakdown
itself runs fully offline — the table + engine ship locally.)

### T1 — Cooking-oil / medium detection  ·  HIGH impact  ·  [terminal]
Extend `applyFryingMedium` (`guards.ts`) so a **large** oil/butter quantity in a **savory main dish**
with **sear/brown/fry** steps counts only the absorbed fraction (`FRY_ABSORBED_G ≈ 14 g`), not the
whole pour. Small oil, or a dressing/sauce/baking context → count fully. Grounded in USDA FNDDS +
the existing absorbed-only model. **Must:** keep the golden suite green; add a golden pinning the fix
(Irish stew ~700→ realistic). **Risk:** don't under-count dishes where the oil IS eaten.

### T2 — Weight-layer audit + expand (the "MFP model")  ·  HIGH  ·  [terminal]
Grow `pieceWeights.json` (79) and promote common `EACH_G`/`PIECE_G` estimates in `parse.ts` to
USDA-verified per-piece/per-cup weights. Use T6 to find ingredients resolving to wrong/zero grams.
This is where Otto is genuinely behind Edamam/MFP and where accuracy gains actually are.

### T5 — Better default protein matches  ·  MED  ·  [terminal]
`lamb` → a leaner stewing cut (not loin chop); audit beef/pork/lamb defaults for "separable lean AND
fat" over-fatting. Verify against USDA (FoodData Central API, DEMO_KEY works for a few queries).

### T3 — USDA FNDDS cooked-yield factors  ·  MED  ·  [terminal]
Otto has `usdaCookedTable.json` + a raw-vs-cooked guard; extend the yield/retention coverage so more
"add the cooked X" lines resolve to the cooked record (a cooked-vs-raw mismatch is a ~3× error).

### T4 — Coverage top-up  ·  LOW  ·  [terminal]
Add the ~5–10 **real** missing ingredients (nutella, doubanjiang, fermented black beans, a few more)
to `usdaTable.json` with real USDA fdcIds. **Skip** food colourings / spice blends / vague entries
(negligible; the runtime resolver handles misses anyway). Keep the `fdcId` provenance test passing —
proxy to the closest real record wholesale + a note (the `ackee`/`paneer` pattern) when USDA lacks it.

### T7 — `seed_nutrition` recompute  ·  OPTIONAL, do LAST  ·  [terminal + Supabase MCP]
The 6 ingredient fixes already shipped (parmesan/parmesan cheese/sesame seed/sour cream/paneer/
mascarpone — commit `28ced5cc`) and any T1–T5 fixes only affect **live** computes. The **777 cached
`seed_nutrition` rows** (which feed recipe **cards** via `useSeedCalories` AND the detail screen) still
show OLD values. Recompute = for each seed recipe: fetch ingredients (TheMealDB), run the engine,
upsert `seed_nutrition`. **Do this AFTER T1–T5 land** so it propagates everything at once. The row
stores only the computed result (no ingredient basis), so a recompute must re-fetch ingredients.

---

## 5. Terminal-only vs phone

**Terminal (Claude Code) ONLY** — needs a shell / file edits / DB:
- Editing engine files; running the TS engine (`node --experimental-strip-types --import
  src/features/nutrition/engine/ts-ext-resolve.mjs …`); running `npm test`.
- Querying USDA FoodData Central (`api.nal.usda.gov`, `DEMO_KEY`, rate-limited ~30/hr).
- Supabase MCP reads/writes (T7 recompute writes to `seed_nutrition`).
- `git commit` / `git push`; creating the `tools/` script.

**Phone (claude.ai)** — no shell, but great for:
- Reading/refining this doc, prioritizing, deciding scope (T2 depth, whether to run T7).
- Design discussion (cooking-yield rules, which cuts to default to, MFP-model tradeoffs).

## 6. Decisions needed from Juan
1. **Priority order** — suggested: **T6 → T1 → T2 → T5 → T3 → T4 → T7**.
2. **How far to invest in the weight/portion layer (T2 / the MFP model)** — a light audit, or a
   serious per-food serving-weight expansion?
3. **T7 recompute** — now, or after T1–T5 land (recommended: after).

## 7. Provenance
Discussion + the Irish-stew trace done 2026-07-23. The only code change shipped from it is the
6-ingredient USDA fix (`28ced5cc`). Engine files: `src/features/nutrition/engine/{compute,parse,
lookup,guards}.ts` + `data/{usdaTable,pieceWeights,cupWeights,usdaCookedTable,recipeFacts}.json`.
