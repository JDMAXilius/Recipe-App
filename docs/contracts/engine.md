# Contract — Nutrition Engine (`src/features/nutrition/engine/`)

Status: M0 draft · Owner: engine-porter · Port target for M1.
Behavior is pinned by the v1 suites: `backend/test/goldenNutrition.test.mjs`,
`backend/test/macroBreakdown.test.mjs`, `backend/test/parseIngredient.test.mjs`,
plus `mobile/test/foodScale.test.mjs` for display. Divergence = port bug.

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

## Public API (frozen — changes need a contract_gap)

```ts
parseIngredients(lines: string[]): ParsedIngredient[]
lookupFood(name: string, parsed: ParsedIngredient, cooked: CookedState): FoodRow | null
computeNutrition(input: {
  ingredients: string[] | ParsedIngredient[]
  servings: number
  recipeId?: SeedId | UserRecipeId
  steps?: string[]              // cooked-state classification input
}): NutritionResult | null      // null when below coverage floor — HONESTY LAW
```

## Data shapes (zod schemas in engine/schemas.ts — runtime-shared with edge functions)

```ts
NutritionResult = {
  perServing: { kcal: number; protein_g: number; carbs_g: number; fat_g: number }
  coverage: number              // 0..1 matched-ingredient mass share
  estimated: boolean            // true → UI must label it
  breakdown: IngredientContribution[]
}
```
`SeedId` (branded string, numeric content) and `UserRecipeId` (branded
string, `u-` prefix) live in `src/types/ids.ts`; constructors validate.

## Laws

1. **Honesty:** null beats a guess. Below the coverage floor → null, never a
   padded number. Estimates always flagged `estimated: true`.
2. **Macro rule:** every test asserts P/C/F, never kcal alone.
3. **One data copy:** the 5 JSON files exist only in `engine/data/`;
   `tools/` scripts are their only writers. Checksums asserted in tests.
4. **Guards carry over verbatim** — including the carb ceiling and the
   mobile-side category-estimate fallback ranges (`nutritionEstimates.js`).
5. **Property tests** (new in v2): parse round-trips (scale by k → grams
   scale by k), compute monotonicity (more of an ingredient never lowers
   its contribution), guard idempotence.
