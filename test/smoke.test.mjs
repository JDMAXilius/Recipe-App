// Anchor for the root test suite — CI's `node --test` needs at least one file.
// Real suites arrive with the engine port (M1) and feature packets (M3).
import test from 'node:test';
import assert from 'node:assert/strict';

test('scaffold smoke: test runner wired', () => {
  assert.equal(1 + 1, 2);
});
