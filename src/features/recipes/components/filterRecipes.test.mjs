import test from 'node:test';
import assert from 'node:assert/strict';
import { filterByCategories } from './filterRecipes.ts';

const rows = [
  { id: 1, title: 'A', image: null, category: 'Beef' },
  { id: 2, title: 'B', image: null, category: 'Chicken' },
  { id: 3, title: 'C', image: null, category: 'Beef' },
  { id: 4, title: 'D', image: null, category: null },
];

test('empty selection is a pass-through (no filtering)', () => {
  assert.deepEqual(filterByCategories(rows, new Set()), rows);
});

test('single category keeps only its members', () => {
  const out = filterByCategories(rows, new Set(['Beef']));
  assert.deepEqual(out.map((r) => r.id), [1, 3]);
});

test('multi-select is a union across categories', () => {
  const out = filterByCategories(rows, new Set(['Beef', 'Chicken']));
  assert.deepEqual(out.map((r) => r.id), [1, 2, 3]);
});

test('null-category rows never match and never throw', () => {
  const out = filterByCategories(rows, new Set(['Beef']));
  assert.ok(!out.some((r) => r.category == null));
});
