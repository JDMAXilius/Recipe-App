import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addRecent } from './recentSearches.ts';

test('addRecent: newest first, case-insensitive dedupe, capped at 5, ignores blanks', () => {
  let l = [];
  for (const q of ['a', 'b', 'c', 'd', 'e', 'f']) l = addRecent(l, q);
  assert.deepEqual(l, ['f', 'e', 'd', 'c', 'b']);
  assert.deepEqual(addRecent(l, ' C '), ['C', 'f', 'e', 'd', 'b']);
  assert.equal(addRecent(l, '   '), l);
});
