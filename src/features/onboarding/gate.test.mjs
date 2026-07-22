import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from './gate.ts';

test('gate: splash while either signal is still resolving', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: false, hasSession: false }), null);
  assert.equal(resolveRoute({ onboarded: null, isLoaded: true, hasSession: false }), null);
});

test('gate: not onboarded → onboarding (even with a session)', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: true, hasSession: false }), '/onboarding');
  assert.equal(resolveRoute({ onboarded: false, isLoaded: true, hasSession: true }), '/onboarding');
});

test('gate: onboarded + signed out → sign-in', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: false }), '/(auth)/sign-in');
});

test('gate: onboarded + a session (guest or real) → tabs', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: true }), '/(tabs)');
});
