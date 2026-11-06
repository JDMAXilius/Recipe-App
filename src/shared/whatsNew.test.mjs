import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseOf, shouldShowWhatsNew } from './whatsNew.ts';

test('a release is major.minor', () => {
  assert.equal(releaseOf('1.1.3'), '1.1');
  assert.equal(releaseOf('2.0'), '2.0');
  assert.equal(releaseOf(null), null);
  assert.equal(releaseOf('beta'), null);
});

test('shows once per newer release, never for a patch or without notes', () => {
  assert.equal(shouldShowWhatsNew(null, '1.1.0', true), true); // upgrader, never tracked
  assert.equal(shouldShowWhatsNew('1.0.24', '1.1.0', true), true);
  assert.equal(shouldShowWhatsNew('1.1.0', '1.1.2', true), false);
  assert.equal(shouldShowWhatsNew('1.10.0', '1.9.0', true), false); // numeric, not string order
  assert.equal(shouldShowWhatsNew('1.0.0', '1.1.0', false), false);
  assert.equal(shouldShowWhatsNew(42, '1.1.0', true), true);
});
