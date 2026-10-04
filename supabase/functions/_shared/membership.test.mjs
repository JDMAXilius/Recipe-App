// Server-side Club gate rules (node --test, native TS strip).
import test from 'node:test';
import assert from 'node:assert/strict';
import { clubRequired, entitlementExpiry, isActiveMembership } from './membership.ts';

test('the gate is off unless REQUIRE_CLUB is exactly on', () => {
  assert.equal(clubRequired(undefined), false);
  assert.equal(clubRequired(''), false);
  assert.equal(clubRequired('true'), false);
  assert.equal(clubRequired('on'), true);
  assert.equal(clubRequired(' ON '), true);
});

test('a row counts only while expires_at is in the future', () => {
  const now = new Date('2026-10-04T12:00:00Z');
  assert.equal(isActiveMembership({ expires_at: '2026-10-05T00:00:00Z' }, now), true);
  assert.equal(isActiveMembership({ expires_at: '2026-10-04T11:59:59Z' }, now), false);
  assert.equal(isActiveMembership({ expires_at: '9999-12-31T00:00:00Z' }, now), true);
  assert.equal(isActiveMembership({ expires_at: 'nonsense' }, now), false);
  assert.equal(isActiveMembership({ expires_at: null }, now), false);
  assert.equal(isActiveMembership(null, now), false);
});

test('RevenueCat subscriber → club expiry; grants without a date are far-future', () => {
  assert.equal(entitlementExpiry({ entitlements: { club: { expires_date: '2026-11-01T00:00:00Z' } } }), '2026-11-01T00:00:00Z');
  assert.equal(entitlementExpiry({ entitlements: { club: { expires_date: null } } }), '9999-12-31T00:00:00Z');
  assert.equal(entitlementExpiry({ entitlements: { other: { expires_date: '2026-11-01T00:00:00Z' } } }), null);
  assert.equal(entitlementExpiry({}), null);
  assert.equal(entitlementExpiry(null), null);
});
