import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, MAX_AGE_MS, MAX_QUEUE, readQueue, toRows } from './events.ts';

const e = (at, name = 'paywall_viewed') => ({ name, props: { variant: 'generic' }, at });

test('the queue caps at MAX_QUEUE and drops events older than 30 days', () => {
  let q = [];
  for (let i = 0; i < MAX_QUEUE + 5; i++) q = enqueue(q, e(i), i);
  assert.equal(q.length, MAX_QUEUE);
  assert.equal(q[0].at, 5);
  assert.deepEqual(enqueue([e(0)], e(MAX_AGE_MS + 1), MAX_AGE_MS + 1).map((x) => x.at), [MAX_AGE_MS + 1]);
});

test('a stored queue keeps only well-formed events', () => {
  assert.deepEqual(readQueue(null), []);
  assert.deepEqual(readQueue([e(1), { name: 'Bad Name', props: {}, at: 1 }, { name: 'ok_event', at: 1 }, 'x']), [e(1)]);
});

test('rows carry the user, the device and when it happened', () => {
  const [row] = toRows([e(0)], 'u1', 'device-123', '1.0.24');
  assert.deepEqual(row, { user_id: 'u1', device_id: 'device-123', name: 'paywall_viewed', props: { variant: 'generic' }, app_version: '1.0.24', occurred_at: '1970-01-01T00:00:00.000Z' });
});
