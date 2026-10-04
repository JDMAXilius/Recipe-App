// F3: a save whose request never got an HTTP answer (status 0) is sent once
// more; a real answer, error or not, is final. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { retryOnTransportFailure } from './save.compute.ts';

const runner = (...results) => {
  let calls = 0;
  const run = async () => results[calls++];
  return { run, calls: () => calls };
};

test('a transport failure is retried once, and the retry wins', async () => {
  const r = runner(
    { status: 0, error: { message: 'TypeError: Network request failed' } },
    { status: 201, error: null, data: { id: 43 } },
  );
  const res = await retryOnTransportFailure(r.run);
  assert.equal(res.data.id, 43);
  assert.equal(r.calls(), 2);
});

test('an HTTP answer is never retried, success or error', async () => {
  const ok = runner({ status: 201, error: null });
  await retryOnTransportFailure(ok.run);
  assert.equal(ok.calls(), 1);
  const denied = runner({
    status: 403,
    error: { message: 'row-level security' },
  });
  assert.equal((await retryOnTransportFailure(denied.run)).status, 403);
  assert.equal(denied.calls(), 1);
});

test('only one retry: two transport failures surface the second', async () => {
  const r = runner(
    { status: 0, error: { message: 'a' } },
    { status: 0, error: { message: 'b' } },
    { status: 201 },
  );
  assert.equal((await retryOnTransportFailure(r.run)).error.message, 'b');
  assert.equal(r.calls(), 2);
});
