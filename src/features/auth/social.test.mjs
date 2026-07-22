import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SOCIAL_PROVIDERS, providerLabel } from './social';

test('SOCIAL_PROVIDERS lists Apple first (App Store 4.8)', () => {
  assert.deepEqual([...SOCIAL_PROVIDERS], ['apple', 'google', 'facebook']);
});

test('providerLabel maps every provider to a friendly label', () => {
  assert.equal(providerLabel('apple'), 'Continue with Apple');
  assert.equal(providerLabel('google'), 'Continue with Google');
  assert.equal(providerLabel('facebook'), 'Continue with Facebook');
  for (const p of SOCIAL_PROVIDERS) {
    assert.equal(typeof providerLabel(p), 'string');
    assert.ok(providerLabel(p).length > 0);
  }
});
