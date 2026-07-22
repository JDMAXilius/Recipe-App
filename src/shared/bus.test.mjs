import test from 'node:test';
import assert from 'node:assert/strict';
import { ottoBus } from './bus.ts';

test('ottoBus: emit fires subscribers; unsubscribe stops them', () => {
  let n = 0;
  const off = ottoBus.on('save', () => (n += 1));
  ottoBus.emit('save');
  ottoBus.emit('save');
  assert.equal(n, 2);
  off();
  ottoBus.emit('save');
  assert.equal(n, 2); // no longer listening
});

test('ottoBus: a handler may unsubscribe itself mid-emit without skipping others', () => {
  const calls = [];
  const offA = ottoBus.on('save', () => {
    calls.push('a');
    offA(); // remove self during emit — must not skip B
  });
  ottoBus.on('save', () => calls.push('b'));
  ottoBus.emit('save');
  assert.deepEqual(calls, ['a', 'b']);
});
