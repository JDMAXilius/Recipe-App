// Colocated unit tests for the pure journal list ops (node --test).
// Run: node --test src/features/journal/journal.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, sortNewestFirst, MAX_JOURNAL } from './journal.logic.ts';

const mk = (id, cookedAt) => ({
  id,
  recipeId: 'u-1',
  title: 't',
  uri: `file://${id}`,
  cookedAt,
});

test('addEntry keeps the list newest-first', () => {
  let list = [];
  list = addEntry(list, mk('a', 100));
  list = addEntry(list, mk('b', 300));
  list = addEntry(list, mk('c', 200));
  assert.deepEqual(
    list.map((e) => e.id),
    ['b', 'c', 'a'],
  );
});

test('addEntry caps to the newest `cap` entries', () => {
  let list = [];
  for (let i = 0; i < 10; i++) list = addEntry(list, mk(String(i), i), 3);
  assert.equal(list.length, 3);
  assert.deepEqual(
    list.map((e) => e.id),
    ['9', '8', '7'],
  );
});

test('MAX_JOURNAL is the default cap', () => {
  let list = [];
  for (let i = 0; i < MAX_JOURNAL + 5; i++) list = addEntry(list, mk(String(i), i));
  assert.equal(list.length, MAX_JOURNAL);
});

test('sortNewestFirst does not mutate its input', () => {
  const input = [mk('a', 1), mk('b', 2)];
  const out = sortNewestFirst(input);
  assert.deepEqual(
    input.map((e) => e.id),
    ['a', 'b'],
  );
  assert.deepEqual(
    out.map((e) => e.id),
    ['b', 'a'],
  );
});
