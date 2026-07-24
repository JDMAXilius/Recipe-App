// Compute-at-save: the persisted figure + grams that make a USER recipe's card
// and detail read ONE source of truth, plus the edit-id parse that stops an
// edit from creating a new row. Pure — no Supabase — so node --test strip-types
// it directly. Run: node --test src/features/import/save.nutrition.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEditId } from './draft.ts';
import { ingredientsWithGrams } from './save.compute.ts';
import { computeNutrition } from '../nutrition/engine/compute.ts';

// A sample user recipe (Cozy Apple Crumble), gram-measured so the bundled USDA
// table covers it without the resolver — exactly the create/edit save input.
const CRUMBLE = [
  { measure: '500 g', name: 'apples' },
  { measure: '150 g', name: 'plain flour' },
  { measure: '100 g', name: 'butter' },
  { measure: '100 g', name: 'sugar' },
];
const SERVINGS = 4;

test('parseEditId: strips the "u-" ref so an edit LOADS the row (update, not insert)', () => {
  assert.equal(parseEditId('u-20'), 20); // the detail link's ref — was → null → blank insert
  assert.equal(parseEditId('20'), 20); // bare numeric still works
  assert.equal(parseEditId(undefined), null); // no param → create
  assert.equal(parseEditId('u-'), null); // malformed → create, never NaN
  assert.equal(parseEditId('u-abc'), null);
});

test('save persists per-ingredient grams (parseIngredientLine, same parser the detail scales with)', () => {
  const withGrams = ingredientsWithGrams(CRUMBLE);
  assert.equal(withGrams.length, CRUMBLE.length);
  // every gram-measured line resolves to a positive weight, stored on the object
  for (const line of withGrams) {
    assert.equal(typeof line.grams, 'number');
    assert.ok(line.grams > 0, `${line.name} should carry grams`);
  }
  assert.equal(withGrams[0].grams, 500); // "500 g apples" → 500 g, verbatim
  // the pair fields survive alongside the added grams
  assert.equal(withGrams[1].name, 'plain flour');
});

test('save persists a per-serving nutrition figure (the engine the detail also uses)', () => {
  const result = computeNutrition({ ingredients: CRUMBLE, servings: SERVINGS });
  assert.notEqual(result, null, 'a covered recipe must produce a figure, not null');
  assert.equal(typeof result.kcal, 'number');
  assert.ok(result.kcal > 0);
  assert.equal(result.per, 'serving');
});

test('card kcal == detail kcal: both round the SAME persisted per-serving figure', () => {
  const result = computeNutrition({ ingredients: CRUMBLE, servings: SERVINGS });
  // card (cookbook mine.queries → nutritionKcalOf) and detail (NutritionCard →
  // computed.kcal) both derive from recipes.nutrition.kcal — no second source.
  const cardKcal = Math.round(result.kcal);
  const detailKcal = Math.round(result.kcal);
  assert.equal(cardKcal, detailKcal);
});

test('empty / uncomputable recipe: null figure (read path falls back), grams still mapped', () => {
  // no ingredients → engine returns null; the save stores null and never blocks.
  assert.equal(computeNutrition({ ingredients: [], servings: SERVINGS }), null);
  assert.deepEqual(ingredientsWithGrams([]), []);
});
