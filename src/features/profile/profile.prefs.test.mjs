// Colocated pure-logic check for profile.prefs.ts (node --test, native TS strip).
// The prune/validate seam is the correctness that matters — a corrupt kv blob
// must never reach the pick engine as an unknown diet or a bogus cuisine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDiet, normalizePrefs, pruneCuisines } from './profile.prefs.ts';

test('normalizeDiet: known keys pass, junk/legacy → none', () => {
  assert.equal(normalizeDiet('vegetarian'), 'vegetarian');
  assert.equal(normalizeDiet('vegan'), 'vegan');
  assert.equal(normalizeDiet('none'), 'none');
  assert.equal(normalizeDiet('pescatarian'), 'none'); // not offered
  assert.equal(normalizeDiet(null), 'none');
  assert.equal(normalizeDiet(42), 'none');
});

test('pruneCuisines: keeps known areas, drops unknown, de-dupes, preserves order', () => {
  assert.deepEqual(pruneCuisines(['Italian', 'Klingon', 'Thai']), ['Italian', 'Thai']);
  assert.deepEqual(pruneCuisines(['Thai', 'Thai', 'Italian']), ['Thai', 'Italian']);
  assert.deepEqual(pruneCuisines('nope'), []);
  assert.deepEqual(pruneCuisines([1, 2, 'Greek']), ['Greek']);
});

test('normalizePrefs: a corrupt blob falls back to a clean known shape', () => {
  assert.deepEqual(normalizePrefs(null), { diet: 'none', cuisines: [] });
  assert.deepEqual(normalizePrefs({ diet: 'vegan', cuisines: ['Indian', 'x'] }), {
    diet: 'vegan',
    cuisines: ['Indian'],
  });
  assert.deepEqual(normalizePrefs({ diet: 'junk' }), { diet: 'none', cuisines: [] });
});
