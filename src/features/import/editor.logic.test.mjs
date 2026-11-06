import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insertAfter, moveBy } from './editor.logic.ts';

test('insertAfter: right after the row, clamped at the ends', () => {
  assert.deepEqual(insertAfter(['a', 'b', 'c'], 0, 'x'), ['a', 'x', 'b', 'c']);
  assert.deepEqual(insertAfter(['a', 'b'], 1, 'x'), ['a', 'b', 'x']);
  assert.deepEqual(insertAfter(['a'], 9, 'x'), ['a', 'x']);
  assert.deepEqual(insertAfter([], -1, 'x'), ['x']);
});

test('moveBy: up and down by one, nothing lost, edges stay put', () => {
  assert.deepEqual(moveBy(['a', 'b', 'c'], 2, -1), ['a', 'c', 'b']);
  assert.deepEqual(moveBy(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c']);
  assert.deepEqual(moveBy(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c']);
  assert.deepEqual(moveBy(['a', 'b', 'c'], 2, 1), ['a', 'b', 'c']);
});
