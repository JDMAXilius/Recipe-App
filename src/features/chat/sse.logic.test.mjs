// Colocated unit tests for the SSE frame parser (node --test, native TS strip).
// Run: node --test src/features/chat/sse.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { feedSse } from './sse.logic.ts';

test('one complete event in one chunk', () => {
  const { events, carry } = feedSse('data: {"type":"delta","text":"hi"}\n\n', '');
  assert.deepEqual(events, [{ type: 'delta', text: 'hi' }]);
  assert.equal(carry, '');
});

test('event split across arbitrary chunk boundaries', () => {
  const wire = 'data: {"type":"delta","text":"slow"}\n\n';
  let carry = '';
  let events = [];
  // Feed one character at a time — worst-case boundary split.
  for (const ch of wire) {
    const fed = feedSse(ch, carry);
    carry = fed.carry;
    events = events.concat(fed.events);
  }
  assert.deepEqual(events, [{ type: 'delta', text: 'slow' }]);
  assert.equal(carry, '');
});

test('split lands mid-delimiter (\\n | \\n)', () => {
  const first = feedSse('data: {"a":1}\n', '');
  assert.deepEqual(first.events, []);
  const second = feedSse('\ndata: {"b":2}\n\n', first.carry);
  assert.deepEqual(second.events, [{ a: 1 }, { b: 2 }]);
  assert.equal(second.carry, '');
});

test('multiple events in a single chunk, in order', () => {
  const chunk =
    'data: {"type":"delta","text":"a"}\n\n' +
    'data: {"type":"delta","text":"b"}\n\n' +
    'data: {"type":"done","payload":{"mode":"decline","message":"x"}}\n\n';
  const { events, carry } = feedSse(chunk, '');
  assert.deepEqual(events, [
    { type: 'delta', text: 'a' },
    { type: 'delta', text: 'b' },
    { type: 'done', payload: { mode: 'decline', message: 'x' } },
  ]);
  assert.equal(carry, '');
});

test('garbage tolerance: bad JSON and non-data lines are skipped', () => {
  const chunk =
    ': keepalive comment\n\n' +
    'data: not json at all\n\n' +
    'event: weird\ndata: {"ok":true}\n\n' +
    'random noise\n\n';
  const { events, carry } = feedSse(chunk, '');
  assert.deepEqual(events, [{ ok: true }]);
  assert.equal(carry, '');
});

test('incomplete tail is carried, not parsed', () => {
  const { events, carry } = feedSse('data: {"type":"del', '');
  assert.deepEqual(events, []);
  assert.equal(carry, 'data: {"type":"del');
});

test('CRLF delimiters work too', () => {
  const { events, carry } = feedSse('data: {"n":1}\r\n\r\ndata: {"n":2}\r\n\r\n', '');
  assert.deepEqual(events, [{ n: 1 }, { n: 2 }]);
  assert.equal(carry, '');
});
