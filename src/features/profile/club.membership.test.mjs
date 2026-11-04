import test from 'node:test';
import assert from 'node:assert/strict';
import { hasClubEntitlement, membershipAnswer } from './club.logic.ts';

// The sign-in bug: a stale answer from before RevenueCat switched accounts sent
// paying members to the paywall, so "not ready" must never be a known answer.
test('mid sign-in the answer is unknown, never "not a member"', () => {
  assert.deepEqual(membershipAnswer(false, null, false), { member: false, known: false });
  assert.deepEqual(membershipAnswer(false, null, true), { member: false, known: false });
});
test('once ready, it reports the real state', () => {
  assert.deepEqual(membershipAnswer(true, null, false), { member: false, known: false });
  assert.equal(membershipAnswer(true, null, true).known, true);
  assert.equal(hasClubEntitlement(null), false);
});
