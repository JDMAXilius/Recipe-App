// L3 journey — nutrition (testing.md §Journey scripts).
//
// Nutrition has no route of its own: NutritionCard renders INSIDE the recipe
// detail screen (recipes packet). Until that screen exists this journey asserts
// the honesty contract at its source — the engine output the card renders must
// equal the RECORDED fixture (never invented), covering the P/C/F macro split,
// with carbs staying a trace (the phantom-20g regression). When the recipes
// detail screen lands, the browser step below reads the same fixture and
// asserts the rendered pixels equal these numbers.
//
// tsconfig excludes e2e/**, so this file is an L3 artifact run by the journey
// harness, not by tsc/eslint/`npm test`.
import assert from "node:assert/strict";
import { computeNutrition } from "../../src/features/nutrition/engine/compute";
import fixture from "../fixtures/nutrition.json" with { type: "json" };

export default async function nutritionJourney(): Promise<void> {
  const { input, expected } = fixture["garlic-butter-chicken"];

  const out = computeNutrition({ ingredients: input.ingredients, servings: input.servings });
  assert.ok(out, "garlic butter chicken must compute — never the category template");

  // Macro split, never kcal alone (testing.md rule).
  assert.equal(out.kcal, expected.kcal, `kcal ${out.kcal} != ${expected.kcal}`);
  assert.equal(out.protein_g, expected.protein_g, `protein ${out.protein_g} != ${expected.protein_g}`);
  assert.equal(out.carbs_g, expected.carbs_g, `carbs ${out.carbs_g} != ${expected.carbs_g}`);
  assert.equal(out.fat_g, expected.fat_g, `fat ${out.fat_g} != ${expected.fat_g}`);

  // The regression that named this fixture: nothing in the list supplies carbs.
  assert.ok(out.carbs_g <= 5, `phantom carbs are back: ${out.carbs_g}g`);
  assert.ok(out.kcal >= 320 && out.kcal <= 500, `kcal ${out.kcal} outside golden range`);

  // TODO(recipes-detail): render the card at recipe-detail and assert the on-
  // screen "Protein/Carbs/Fat" values equal expected; wire when that route ships.
}
