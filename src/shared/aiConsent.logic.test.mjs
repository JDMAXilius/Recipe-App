// Third-party AI consent rules (5.1.2(i)). Run: node --test src/shared/aiConsent.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_CONSENT_COPY, mayUseAi, parseAiConsent } from './aiConsent.logic.ts';

test('only the two real answers survive a read; anything else is unknown', () => {
  assert.equal(parseAiConsent('granted'), 'granted');
  assert.equal(parseAiConsent('declined'), 'declined');
  for (const junk of [null, undefined, true, 1, 'yes', 'GRANTED', {}, []]) {
    assert.equal(parseAiConsent(junk), 'unknown');
  }
});

test('nothing leaves for AI without an explicit yes', () => {
  assert.equal(mayUseAi('granted'), true);
  assert.equal(mayUseAi('declined'), false);
  assert.equal(mayUseAi('unknown'), false);
});

test('the sheet names the company, the data, the way out, and a real decline', () => {
  const text = AI_CONSENT_COPY.body.join(' ');
  assert.match(text, /Anthropic/);
  assert.match(text, /words you type/);
  assert.match(text, /photo/);
  assert.match(text, /ingredient names/);
  assert.match(text, /Account › Otto and AI/);
  assert.match(text, /work either way/);
  assert.equal(AI_CONSENT_COPY.decline, 'Not now');
  // The Account row is what the sheet points to — they must use the same name.
  assert.equal(AI_CONSENT_COPY.settingsLabel, 'Otto and AI');
});
