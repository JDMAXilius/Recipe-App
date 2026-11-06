import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreTarget, tabForPath, isRestorableTab } from './lastTab.ts';

test('maps the four tabs and nothing else', () => {
  assert.equal(tabForPath('/'), 'index');
  assert.equal(tabForPath('/plan'), 'plan');
  assert.equal(tabForPath('/otto'), null);
  assert.equal(tabForPath('/recipe/52772'), null);
});

test('restores only from Home, only a known tab other than Home', () => {
  assert.equal(restoreTarget('/', 'plan'), '/plan');
  assert.equal(restoreTarget('/', 'index'), null);
  assert.equal(restoreTarget('/', 'otto'), null);
  assert.equal(restoreTarget('/', null), null);
  assert.equal(restoreTarget('/recipe/1', 'plan'), null); // a deep link wins
  assert.equal(isRestorableTab(42), false);
});
