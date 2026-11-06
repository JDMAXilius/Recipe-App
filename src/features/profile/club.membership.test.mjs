import test from 'node:test';
import assert from 'node:assert/strict';
import { hasClubEntitlement, membershipState } from './club.logic.ts';

const info = (active, all = active) => ({ entitlements: { active, all } });

// The sign-in bug: a stale answer from before RevenueCat switched accounts sent
// paying members to the paywall, so "not ready" must never be a known answer.
test('mid sign-in the answer is unknown, never "not a member"', () => {
  assert.equal(membershipState(false, info({ club: {} }), false), 'unknown');
  assert.equal(membershipState(false, null, true), 'unknown');
  assert.equal(membershipState(true, null, false), 'unknown'); // asked, no answer yet
});

test('once ready: member, ended, never, and a failed fetch fails closed', () => {
  assert.equal(membershipState(true, info({ club: {} }), false), 'member');
  assert.equal(membershipState(true, info({}, { club: { periodType: 'NORMAL' } }), false), 'ended');
  assert.equal(membershipState(true, info({}, { club: { periodType: 'TRIAL' } }), false), 'none'); // trial cancelled before it charged
  assert.equal(membershipState(true, info({}), false), 'none');
  assert.equal(membershipState(true, null, true), 'none');
  assert.equal(hasClubEntitlement(null), false);
});
