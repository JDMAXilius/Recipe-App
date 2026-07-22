// Colocated unit tests for chat pure logic (node --test, native TS strip).
// Run: node --test src/features/chat/chat.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_CAP,
  MAX_AGE_MS,
  MSG_CAP,
  TURN_CAP,
  optionPickToMessage,
  pruneHistory,
  toWireTranscript,
} from './chat.logic.ts';

const msg = (i, ts, role = 'user') => ({ role, content: `m${i}`, ts });

test('pruneHistory: drops messages older than 30 days', () => {
  const now = 1_000_000_000_000;
  const kept = msg(1, now - MAX_AGE_MS + 1000);
  const stale = msg(2, now - MAX_AGE_MS - 1000);
  const out = pruneHistory([stale, kept], now);
  assert.deepEqual(out, [kept]);
});

test('pruneHistory: caps to the last 50 messages', () => {
  const now = 2_000_000_000_000;
  const many = Array.from({ length: 60 }, (_, i) => msg(i, now - i));
  const out = pruneHistory(many, now);
  assert.equal(out.length, MSG_CAP);
  assert.equal(out[out.length - 1].content, 'm59'); // last kept
  assert.equal(out[0].content, 'm10'); // first 10 dropped
});

test('pruneHistory: age filter runs before the count cap', () => {
  const now = 3_000_000_000_000;
  // 50 fresh + 10 stale — stale must go even though total ≤ 60.
  const fresh = Array.from({ length: 50 }, (_, i) => msg(i, now - i));
  const stale = Array.from({ length: 10 }, (_, i) => msg(100 + i, now - MAX_AGE_MS - i));
  const out = pruneHistory([...stale, ...fresh], now);
  assert.equal(out.length, 50);
  assert.ok(out.every((m) => now - m.ts <= MAX_AGE_MS));
});

test('toWireTranscript: keeps last 20 turns, strips ts', () => {
  const now = 4_000_000_000_000;
  const many = Array.from({ length: 25 }, (_, i) => msg(i, now - i));
  const wire = toWireTranscript(many);
  assert.equal(wire.length, TURN_CAP);
  assert.equal(wire[0].content, 'm5');
  assert.deepEqual(Object.keys(wire[0]).sort(), ['content', 'role']);
});

test('toWireTranscript: clamps content to 600 chars', () => {
  const long = { role: 'user', content: 'x'.repeat(CONTENT_CAP + 50), ts: 1 };
  const [wire] = toWireTranscript([long]);
  assert.equal(wire.content.length, CONTENT_CAP);
});

test('optionPickToMessage: trims, clamps, builds a user turn', () => {
  const out = optionPickToMessage('  Something spicy  ', 42);
  assert.deepEqual(out, { role: 'user', content: 'Something spicy', ts: 42 });
});

test('optionPickToMessage: empty/whitespace → null', () => {
  assert.equal(optionPickToMessage('   ', 1), null);
  assert.equal(optionPickToMessage('', 1), null);
});
