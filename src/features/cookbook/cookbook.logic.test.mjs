// Colocated unit tests for cookbook pure logic (node --test, native TS strip).
// Run: node --test src/features/cookbook/cookbook.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCookedFilter,
  applyOptimisticToggle,
  deriveSavedIds,
  mineToItem,
  savedToItem,
  selectSegment,
} from './cookbook.logic.ts';

const fav = (recipeId, extra = {}) => ({
  recipeId,
  title: `r${recipeId}`,
  image: null,
  category: null,
  cookTime: null,
  servings: null,
  ...extra,
});

test('deriveSavedIds: numeric set, no string/number drift', () => {
  const ids = deriveSavedIds([fav(52772), fav(52959)]);
  assert.ok(ids.has(52772));
  assert.ok(ids.has(52959));
  assert.equal(ids.has(1), false);
  assert.equal(ids.size, 2);
});

test('applyOptimisticToggle: save prepends, unsave removes, idempotent by id', () => {
  const start = [fav(1)];
  const added = applyOptimisticToggle(start, fav(2));
  assert.deepEqual(added.map((r) => r.recipeId), [2, 1]); // prepend
  const removed = applyOptimisticToggle(added, fav(2));
  assert.deepEqual(removed.map((r) => r.recipeId), [1]); // toggled back off
  assert.equal(start.length, 1, 'input not mutated');
});

test('selectSegment: saved | mine | all = mine + saved', () => {
  const saved = [savedToItem(fav(1))];
  const mine = [mineToItem({ id: 9, title: 'm', image: null, category: null, source: 'manual', sourceName: null })];
  assert.deepEqual(selectSegment('saved', saved, mine).map((i) => i.key), ['s-1']);
  assert.deepEqual(selectSegment('mine', saved, mine).map((i) => i.key), ['m-9']);
  assert.deepEqual(selectSegment('all', saved, mine).map((i) => i.key), ['m-9', 's-1']);
});

test('mineToItem: imported source gets the imported variant + stamp name', () => {
  const imported = mineToItem({ id: 3, title: 'x', image: null, category: null, source: 'imported', sourceName: 'NYT' });
  assert.equal(imported.variant, 'imported');
  assert.equal(imported.sourceName, 'NYT');
  assert.equal(imported.save, null); // owned recipes carry no paw payload
  const written = mineToItem({ id: 4, title: 'y', image: null, category: null, source: 'manual', sourceName: null });
  assert.equal(written.variant, 'mine');
});

test('savedToItem: carries its own save payload + saved variant', () => {
  const item = savedToItem(fav(7));
  assert.equal(item.variant, 'saved');
  assert.equal(item.recipeId, 7);
  assert.equal(item.save.recipeId, 7);
});

test('applyCookedFilter: only passes items flagged cooked', () => {
  const items = [
    { ...savedToItem(fav(1)), cooked: true },
    { ...savedToItem(fav(2)), cooked: false },
  ];
  assert.deepEqual(applyCookedFilter(items, true).map((i) => i.recipeId), [1]);
  assert.deepEqual(applyCookedFilter(items, false).map((i) => i.recipeId), [1, 2]);
});
