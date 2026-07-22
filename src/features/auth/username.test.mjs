import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_USERNAME,
  cleanUsername,
  displayNameFor,
  hasUsername,
  nameFromEmail,
} from './username';

test('cleanUsername trims, collapses whitespace, caps length', () => {
  assert.equal(cleanUsername('  Juan  '), 'Juan');
  assert.equal(cleanUsername('Juan   Diego'), 'Juan Diego');
  assert.equal(cleanUsername('\tJuan\n Diego \t'), 'Juan Diego');
  assert.equal(cleanUsername(null), '');
  assert.equal(cleanUsername(undefined), '');
  assert.equal(cleanUsername('   '), '');
  assert.equal(cleanUsername('a'.repeat(50)).length, MAX_USERNAME);
});

test('nameFromEmail derives a capitalized first segment', () => {
  assert.equal(nameFromEmail('otto-e2e@example.com'), 'Otto');
  assert.equal(nameFromEmail('juan.diego@example.com'), 'Juan');
  assert.equal(nameFromEmail('maria_lopez@example.com'), 'Maria');
  assert.equal(nameFromEmail(''), '');
  assert.equal(nameFromEmail(null), '');
});

test('displayNameFor prefers a chosen name, else derives, else falls back', () => {
  assert.equal(displayNameFor({ user_metadata: { username: 'Chef Juan' } }), 'Chef Juan');
  assert.equal(displayNameFor({ email: 'sam.smith@example.com' }), 'Sam');
  // relay addresses derive to gibberish → warm fallback, not nonsense
  assert.equal(displayNameFor({ email: 'zrz2p6fhgc@privaterelay.appleid.com' }), 'Chef');
  assert.equal(displayNameFor(null), 'Chef');
  assert.equal(displayNameFor({ email: '' }, 'Friend'), 'Friend');
});

test('hasUsername is true only for a real chosen name', () => {
  assert.equal(hasUsername({ user_metadata: { username: 'Juan' } }), true);
  assert.equal(hasUsername({ user_metadata: { username: '   ' } }), false);
  assert.equal(hasUsername({ email: 'a@b.com' }), false);
  assert.equal(hasUsername(null), false);
});
