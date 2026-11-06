// Colocated pure-logic check for profile.prefs.ts (node --test, native TS strip).
// The prune/validate seam is the correctness that matters — a corrupt kv blob
// must never reach the pick engine as an unknown diet or a bogus cuisine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDiet, normalizePrefs, pruneCuisines, servingsFor } from './profile.prefs.ts';

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

const blank = { household: { adults: 2, kids: 0 }, diet: 'none', allergies: [], skips: [], cuisines: [] };

test('normalizePrefs: a corrupt blob falls back to a clean known shape', () => {
  assert.deepEqual(normalizePrefs(null), blank);
  assert.deepEqual(normalizePrefs({ diet: 'junk' }), blank);
});

test('normalizePrefs: an old {diet, cuisines} row keeps its values and gains the new fields', () => {
  assert.deepEqual(normalizePrefs({ diet: 'vegan', cuisines: ['Indian', 'x'] }), { ...blank, diet: 'vegan', cuisines: ['Indian'] });
});

test('normalizePrefs: household clamps, allergies are known keys, skips are short lowercase words', () => {
  const p = normalizePrefs({
    household: { adults: 0, kids: 20.4 },
    allergies: ['peanut', 'peanut', 'gluten', 'kryptonite'],
    skips: [' Mushrooms ', 'mushrooms', '', 7, 'Olives'],
  });
  assert.deepEqual(p.household, { adults: 1, kids: 8 });
  assert.deepEqual(p.allergies, ['peanut', 'gluten']);
  assert.deepEqual(p.skips, ['mushrooms', 'olives']);
});

test('servingsFor: a kid counts as half, never below one', () => {
  assert.equal(servingsFor({ adults: 2, kids: 0 }), 2);
  assert.equal(servingsFor({ adults: 2, kids: 1 }), 3);
  assert.equal(servingsFor({ adults: 1, kids: 2 }), 2);
});
