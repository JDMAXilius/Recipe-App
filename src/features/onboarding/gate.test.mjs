import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from './gate.ts';

test('gate: splash while either signal is still resolving', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: false, hasSession: false }), null);
  assert.equal(resolveRoute({ onboarded: null, isLoaded: true, hasSession: false }), null);
});

test('gate: first launch, signed out → sign up first', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: true, hasSession: false }), '/(auth)/sign-up');
});

test('gate: signed in but not onboarded on this device → onboarding (then the trial offer)', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: true, hasSession: true }), '/onboarding');
});

test('gate: onboarded + signed out → sign-in', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: false }), '/(auth)/sign-in');
});

test('gate: onboarded + signed in → tabs', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: true }), '/(tabs)');
});
