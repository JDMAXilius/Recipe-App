// Colocated unit tests for Otto Club pure logic (node --test, native TS strip).
// Run: node --test src/features/profile/club.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLUB_ENTITLEMENT,
  LINKED_ELSEWHERE,
  hasClubEntitlement,
  introTrialDays,
  purchaseErrorMessage,
} from './club.logic.ts';

test('introTrialDays: free intro offers convert to days', () => {
  assert.equal(introTrialDays({ price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1 }), 7);
  assert.equal(introTrialDays({ price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 }), 3);
  assert.equal(introTrialDays({ price: 0, periodUnit: 'MONTH', periodNumberOfUnits: 1 }), 30);
});

test('introTrialDays: no offer, paid intro, or junk unit → null', () => {
  assert.equal(introTrialDays(null), null);
  assert.equal(introTrialDays(undefined), null);
  assert.equal(introTrialDays({ price: 0.99, periodUnit: 'WEEK', periodNumberOfUnits: 1 }), null);
  assert.equal(introTrialDays({ price: 0, periodUnit: 'FORTNIGHT', periodNumberOfUnits: 1 }), null);
});

test('hasClubEntitlement: only an active club entitlement counts', () => {
  assert.equal(hasClubEntitlement(null), false);
  assert.equal(hasClubEntitlement({ entitlements: { active: {} } }), false);
  assert.equal(hasClubEntitlement({ entitlements: { active: { other: {} } } }), false);
  assert.equal(
    hasClubEntitlement({ entitlements: { active: { [CLUB_ENTITLEMENT]: {} } } }),
    true,
  );
});

test('purchase errors read as sentences, never as bare codes', () => {
  // 7 = RECEIPT_ALREADY_IN_USE (build 48, 2026-10-05): the Apple ID's
  // subscription belongs to another Otto account.
  assert.equal(purchaseErrorMessage('7'), LINKED_ELSEWHERE);
  assert.equal(purchaseErrorMessage('13'), LINKED_ELSEWHERE);
  assert.match(purchaseErrorMessage('6'), /Restore/);
  assert.match(purchaseErrorMessage('10'), /connection/);
  for (const code of ['0', '7', '99', undefined]) {
    assert.doesNotMatch(purchaseErrorMessage(code), /\(\d+\)/);
  }
});

