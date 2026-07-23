# Contract — Nutrition Engine (`src/features/nutrition/engine/`)

Status: M0 draft · Owner: engine-porter · Port target for M1.
Behavior is pinned by ALL the v1 engine suites: `goldenNutrition`,
`macroBreakdown`, `parseIngredient`, `resolveIngredient`, `resolveCooked`,
`usdaProvider` (backend/test/), plus `mobile/test/carbCeiling.test.mjs`
(the ceiling moves INTO the engine — see Laws §4). Divergence = port bug.
(`foodScale` display formatting is feature-layer, NOT this folder — it pins
the nutrition feature packet instead.)

## Shape

Pure TypeScript, zero React Native imports, `node --test`-runnable, no
runtime network or LLM calls. The AI tail (unmatched-ingredient resolver)
is an edge function OUTSIDE the engine.

```
engine/
├── parse.ts        measurement text → {qty, unit, grams?} (units, densities,
│                   pack sizes, piece words) — ports parseIngredient.js
├── lookup.ts       ingredient name → USDA food row (leading-qualifier AND
│                   trailing-prep strip; cooked-state resolution table)
├── compute.ts      grams × per-100g ÷ servings → NutritionResult
├── guards.ts       canned-legume→cooked, frying-medium absorption, coverage
│                   floor, plausibility bounds, carb ceiling
├── data/           usdaTable.json · usdaCookedTable.json · pieceWeights.json
│                   cupWeights.json · recipeFacts.json  ← the ONE copy
└── engine.test.ts  golden + macro suites ported alongside
```

## Public API (frozen — mirrors the v1 signatures the suites call;
## changes need a contract_gap)

```ts
// ports parseIngredient.js — SAME return shape (the confidence aggregate
// feeds the coverage/honesty logic; do not drop it)
parseIngredients(list: {measure: string, name: string}[]): {
  lines: ParsedLine[]
  totalGrams: number | null
  confidence: number
}

// ports usdaProvider.lookup — name + parsed line + cooked state → food row
lookup(name: string, parsedItem: ParsedLine, cooked: CookedState): FoodRow | null

// ports NutritionProvider.computeNutrition — v1 positional args become one input
computeNutrition(input: {
  ingredients: {measure: string, name: string}[]   // v1 pair shape, verbatim
  servings: number
  recipeId?: SeedId | UserRecipeId
  steps?: string[]              // cooked-state classification input
}): NutritionResult | null      // null when below coverage floor — HONESTY LAW
```

## Data shapes (zod schemas in engine/schemas.ts — runtime-shared with edge functions)

`NutritionResult` is the v1 FLAT shape, verbatim — `seed_nutrition` rows and
`recipes.nutrition` already cache it; a new shape would reject every cached
row. Fields (verified by RUNNING v1, usdaProvider.js:593-611): `kcal,
protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, basis_grams, per,
source, confidence` + `basis, doubt, computed_at` (the last three added
2026-07-21, so `.optional()` — pre-that-date cached rows lack them). The v1
output does NOT emit `estimated` or a `breakdown[]` array (an earlier draft
of this contract named them in error; the code is the truth). The zod schema
is written FROM the recorded v1 output and parses cached `seed_nutrition`
rows unchanged — a test asserts exactly that against a 3-row recorded
fixture.

`SeedId` (branded string, numeric content) and `UserRecipeId` (branded
string, `u-` prefix) live in `src/types/ids.ts`; constructors validate.

## Laws

1. **Honesty:** null beats a guess. Below the coverage floor → null, never a
   padded number. Estimates always flagged `estimated: true`.
2. **Macro rule:** every test asserts P/C/F, never kcal alone.
3. **One data copy:** the 5 JSON files exist only in `engine/data/`;
   `tools/` scripts are their only writers. Checksums asserted in tests.
4. **Guards carry over verbatim.** The carb ceiling lives in `guards.ts` —
   INSIDE the engine, one copy (deviation from FRAMEWORK §3, which sketched
   it in feature-layer estimates.ts; contract wins — pinned by
   carbCeiling.test.mjs). Feature-layer `estimates.ts` keeps ONLY the
   category fallback ranges; it never re-implements a guard.
5. **Property tests** (new in v2): parse round-trips (scale by k → grams
   scale by k), compute monotonicity (more of an ingredient never lowers
   its contribution), guard idempotence.
