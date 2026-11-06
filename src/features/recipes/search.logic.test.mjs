import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindsIn, narrowByKind } from './search.logic.ts';

const hits = [
  { id: 1, category: 'Chicken' },
  { id: 2, category: 'Pasta' },
  { id: 3, category: 'Chicken' },
  { id: 4, category: null },
];

test('kinds: most common first, no nulls', () => {
  assert.deepEqual(kindsIn(hits), ['Chicken', 'Pasta']);
  assert.deepEqual(kindsIn([]), []);
});

test('narrow: a kind keeps only it; none keeps all', () => {
  assert.deepEqual(narrowByKind(hits, 'Chicken').map((h) => h.id), [1, 3]);
  assert.equal(narrowByKind(hits, null).length, 4);
});
