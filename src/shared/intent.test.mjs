import test from 'node:test';
import assert from 'node:assert/strict';
import { INTENT_MAX_AGE_MS, intentPath, remember, stillWanted } from './intent.ts';

test('links become in-app paths; doors are never remembered', () => {
  assert.equal(intentPath('otto://recipe/52772'), '/recipe/52772');
  assert.equal(intentPath('https://ottosapp.com/r/abc123/'), '/r/abc123');
  assert.equal(intentPath('/shopping?from=notif'), '/shopping?from=notif');
  for (const door of ['otto://', 'otto://sign-in', '/(auth)/sign-up', '/otto-club', '/club/pending', '/welcome', '/onboarding', '/auth/callback?code=1', '/reset-password']) {
    assert.equal(intentPath(door), null, door);
  }
  assert.equal(intentPath(null), null);
});

test('an intent lasts 24 hours and must be well formed', () => {
  const now = 1_000_000_000;
  const i = remember('otto://recipe/1', now);
  assert.deepEqual(i, { href: '/recipe/1', at: now });
  assert.equal(stillWanted(i, now + INTENT_MAX_AGE_MS), '/recipe/1');
  assert.equal(stillWanted(i, now + INTENT_MAX_AGE_MS + 1), null);
  assert.equal(stillWanted({ href: '/otto-club', at: now }, now), null);
  assert.equal(stillWanted({ href: 3, at: now }, now), null);
  assert.equal(stillWanted(null, now), null);
});
