import test from 'node:test';
import assert from 'node:assert/strict';
import { changed } from './rows.ts';

test('a write that matched no row throws; errors pass through', () => {
  assert.deepEqual(changed({ data: [{ id: 1 }], error: null }, 'It'), [{ id: 1 }]);
  assert.throws(() => changed({ data: [], error: null }, 'That plan item'), /That plan item isn't there any more/);
  const e = new Error('rls');
  assert.throws(() => changed({ data: null, error: e }, 'It'), e);
});
