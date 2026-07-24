// Unit tests for the ingredient scaling glue (engine parse → display).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaleIngredient, scaleIngredients, scaledIngredientLines } from './recipe.scale.ts';

test('metric is weight-first: a mass line shows the engine grams, scaled', () => {
  const r = scaleIngredient({ measure: '200 g', name: 'chicken breast' }, 1, 'metric');
  assert.equal(r.display, '200 g');
  assert.equal(r.name, 'chicken breast');
  assert.equal(r.scalable, true);
  // half a batch → half the weight
  assert.equal(scaleIngredient({ measure: '200 g', name: 'chicken breast' }, 0.5, 'metric').display, '100 g');
});

test('metric rolls grams to kg above 1000', () => {
  // 3 cups flour ~ 375 g; ×4 clears 1000 g → kg
  const r = scaleIngredient({ measure: '3 cups', name: 'flour' }, 4, 'metric');
  assert.ok(/kg$/.test(r.display), `expected kg, got "${r.display}"`);
});

test('US keeps the source measure, scaled, not grams', () => {
  const r = scaleIngredient({ measure: '2 tbsp', name: 'olive oil' }, 2, 'us');
  assert.equal(r.display, '4 tbsp');
  assert.equal(r.scalable, true);
});

test('numbers are food-scale: one decimal, trailing .0 stripped, never fractions', () => {
  const r = scaleIngredient({ measure: '1 tbsp', name: 'olive oil' }, 0.5, 'us');
  assert.equal(r.display, '0.5 tbsp'); // not "½"
});

test('an unmeasurable line is not scalable and sinks to the pantry', () => {
  const r = scaleIngredient({ measure: 'to taste', name: 'salt' }, 2, 'metric');
  assert.equal(r.scalable, false);
  const { scalable, pantry } = scaleIngredients(
    [
      { measure: '200 g', name: 'chicken' },
      { measure: 'to taste', name: 'salt' },
    ],
    1,
    'metric',
  );
  assert.equal(scalable.length, 1);
  assert.equal(pantry.length, 1);
  assert.equal(pantry[0].name, 'salt');
});

test('scaledIngredientLines joins amount + name for the share text/card', () => {
  const lines = scaledIngredientLines([{ measure: '200 g', name: 'chicken breast' }], 1, 'metric');
  assert.deepEqual(lines, ['200 g chicken breast']);
});

test('ON-path: a line with canonical grams shows grams (÷ servings), not the text measure', () => {
  // Irish stew lamb: 2000 g total at 8 servings → at 1 serving (factor 1/8) = 250 g,
  // matching the seed per-serving nutrition. The text "500g" is ignored — grams win.
  const r = scaleIngredient({ measure: '500g', name: 'lamb loin chops', grams: 2000 }, 1 / 8, 'metric');
  assert.equal(r.display, '250 g');
  assert.equal(r.name, 'lamb loin chops');
  assert.equal(r.scalable, true);
});

test('ON-path grams fix count-measures in BOTH systems (Chivito: "0.5 Beef Brisket" → grams)', () => {
  // Beef Brisket: canonical 300 g at 2 servings → factor 1/2 → 150 g. The old text
  // "2" ÷ 4 rendered a nonsensical "0.5". Grams show regardless of unit system.
  const pair = { measure: '2', name: 'Beef Brisket', grams: 300 };
  assert.equal(scaleIngredient(pair, 1 / 2, 'metric').display, '150 g');
  assert.equal(scaleIngredient(pair, 1 / 2, 'us').display, '150 g');
});

test('OFF-path (no grams) falls back to the current text-measure behaviour, byte-identical', () => {
  // grams absent → unchanged: metric weighs the text, US keeps the measure.
  assert.equal(scaleIngredient({ measure: '200 g', name: 'chicken breast' }, 1, 'metric').display, '200 g');
  assert.equal(scaleIngredient({ measure: '2 tbsp', name: 'olive oil' }, 2, 'us').display, '4 tbsp');
  // grams: null behaves the same as absent.
  assert.equal(scaleIngredient({ measure: '2 tbsp', name: 'olive oil', grams: null }, 2, 'us').display, '4 tbsp');
});
