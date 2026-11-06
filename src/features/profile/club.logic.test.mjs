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


test('clubDates: a renewing trial has an end; a cancelled one or a paid plan has none', async () => {
  const { clubDates } = await import('./club.logic.ts');
  const info = (club) => ({ entitlements: { active: club ? { club } : {} } });
  const end = '2026-11-20T10:00:00Z';
  assert.deepEqual(clubDates(info({ periodType: 'TRIAL', willRenew: true, expirationDate: end })), { trialEndsAt: end, billingIssue: false });
  assert.equal(clubDates(info({ periodType: 'TRIAL', willRenew: false, expirationDate: end })).trialEndsAt, null);
  assert.equal(clubDates(info({ periodType: 'NORMAL', willRenew: true, expirationDate: end })).trialEndsAt, null);
  assert.equal(clubDates(info({ periodType: 'NORMAL', billingIssueDetectedAt: end })).billingIssue, true);
  assert.deepEqual(clubDates(info(null)), { trialEndsAt: null, billingIssue: false });
  assert.deepEqual(clubDates(null), { trialEndsAt: null, billingIssue: false });
});

test('trialEndDate: calendar units from now; none without a free trial', async () => {
  const { trialEndDate } = await import('./club.logic.ts');
  const now = new Date(2026, 10, 4, 12);
  const week = { price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1 };
  assert.equal(trialEndDate(week, now).getDate(), 11);
  assert.equal(trialEndDate({ price: 0, periodUnit: 'MONTH', periodNumberOfUnits: 1 }, new Date(2026, 0, 15)).getMonth(), 1);
  assert.equal(trialEndDate({ ...week, price: 0.99 }, now), null);
  assert.equal(trialEndDate(null, now), null);
});
