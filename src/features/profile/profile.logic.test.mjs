// Colocated unit tests for profile pure logic (node --test, native TS strip).
// Run: node --test src/features/profile/profile.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveUnitSystem,
  cookedCount,
  earnedStats,
  statText,
} from './profile.logic.ts';

test('deriveUnitSystem: only explicit "us" opts out; legacy + junk → metric', () => {
  assert.equal(deriveUnitSystem('us'), 'us');
  assert.equal(deriveUnitSystem('metric'), 'metric');
  assert.equal(deriveUnitSystem('weight'), 'metric'); // v1 legacy value
  assert.equal(deriveUnitSystem(null), 'metric');
  assert.equal(deriveUnitSystem(undefined), 'metric');
  assert.equal(deriveUnitSystem('nonsense'), 'metric');
});

test('cookedCount: distinct cooked recipes, tolerates null/undefined flags', () => {
  assert.equal(cookedCount([]), 0);
  // distinct recipe ids — matches the cookbook Cooked door (useCookedState set)
  assert.equal(
    cookedCount([
      { cooked: true, recipe_id: '52772' },
      { cooked: false, recipe_id: '111' },
      { cooked: true, recipe_id: 'u-3' },
    ]),
    2,
  );
  // same recipe cooked twice counts once (Mon + Wed = 1 distinct recipe)
  assert.equal(
    cookedCount([
      { cooked: true, recipe_id: '52772' },
      { cooked: true, recipe_id: '52772' },
    ]),
    1,
  );
  assert.equal(cookedCount([{ cooked: null }, {}, { cooked: undefined }]), 0);
});

test('earnedStats: three doors in order; null yours is not a fabricated zero', () => {
  const { stats, nothingYet } = earnedStats({ cooked: 2, saved: 0, yours: null });
  assert.deepEqual(stats.map((s) => s.label), ['cooked', 'saved', 'yours']);
  assert.equal(stats[2].value, null);
  assert.equal(stats[0].to, '/cookbook?cooked=1');
  assert.equal(nothingYet, false); // 2 cooked = something earned
});

test('earnedStats: all zero/null → nothingYet', () => {
  assert.equal(earnedStats({ cooked: 0, saved: 0, yours: 0 }).nothingYet, true);
  assert.equal(earnedStats({ cooked: 0, saved: 0, yours: null }).nothingYet, true);
});

test('statText: null → em-dash, numbers stringified', () => {
  assert.equal(statText(null), '—');
  assert.equal(statText(0), '0');
  assert.equal(statText(7), '7');
});
