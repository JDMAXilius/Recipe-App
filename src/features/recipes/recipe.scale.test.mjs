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
