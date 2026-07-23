// Colocated pure-logic check for recipe.pick.ts (node --test, native TS strip).
// The pick-source branch order is the correctness that matters — diet must win
// over cuisine, and a vegetarian must never route to an area pool that could
// surface a Beef pick.
import test from 'node:test';
import assert from 'node:assert/strict';
import { choosePickSource } from './recipe.pick.ts';

test('no prefs → random surprise', () => {
  assert.deepEqual(choosePickSource({ diet: 'none', cuisines: [] }), { kind: 'random' });
});

test('cuisines only → area pool biased to a liked cuisine', () => {
  // rand=0 picks the first cuisine deterministically.
  assert.deepEqual(choosePickSource({ diet: 'none', cuisines: ['Thai', 'Italian'] }, () => 0), {
    kind: 'area',
    value: 'Thai',
  });
  // rand≈1 clamps to the last, never overflows.
  assert.deepEqual(
    choosePickSource({ diet: 'none', cuisines: ['Thai', 'Italian'] }, () => 0.999),
    { kind: 'area', value: 'Italian' },
  );
});

test('diet wins over cuisine → diet category pool (meat-free by construction)', () => {
  assert.deepEqual(choosePickSource({ diet: 'vegetarian', cuisines: ['Italian'] }), {
    kind: 'category',
    value: 'Vegetarian',
  });
  assert.deepEqual(choosePickSource({ diet: 'vegan', cuisines: [] }), {
    kind: 'category',
    value: 'Vegan',
  });
});
