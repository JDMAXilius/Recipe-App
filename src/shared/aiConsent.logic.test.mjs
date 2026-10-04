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
  const text = [AI_CONSENT_COPY.lead, ...AI_CONSENT_COPY.bullets, AI_CONSENT_COPY.caption].join(' ');
  assert.match(text, /Claude/);
  assert.match(text, /Anthropic/);
  assert.match(text, /photos/);
  assert.match(text, /Your questions/);
  assert.match(text, /Ingredient names/);
  assert.match(text, /Account › AI features/);
  // Anthropic's commercial terms: no training on API customer content.
  assert.match(text, /Not used to train AI/);
  assert.equal(AI_CONSENT_COPY.privacyUrl, 'https://ottosapp.com/privacy');
  assert.equal(AI_CONSENT_COPY.allow, 'Allow');
  assert.equal(AI_CONSENT_COPY.decline, 'Not now');
  // The Account row is what the sheet and the toast point to — same name.
  assert.equal(AI_CONSENT_COPY.settingsLabel, 'AI features');
  assert.match(AI_CONSENT_COPY.offToast, /Account › AI features/);
});
