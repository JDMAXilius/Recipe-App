import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseApp, resolveRoute, onboardedFor } from './gate.ts';

test('gate: splash while either signal is still resolving', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: false, hasSession: false, member: null }), null);
  assert.equal(resolveRoute({ onboarded: null, isLoaded: true, hasSession: false, member: null }), null);
});

test('gate: first launch, signed out → sign up first', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: true, hasSession: false, member: null }), '/(auth)/sign-up');
});

test('gate: signed in but not onboarded on this device → onboarding (then the trial offer)', () => {
  assert.equal(resolveRoute({ onboarded: false, isLoaded: true, hasSession: true, member: false }), '/onboarding');
});

test('gate: onboarded + signed out → sign-in', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: false, member: null }), '/(auth)/sign-in');
});

test('gate: onboarded + signed in + member → tabs', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: true, member: true }), '/(tabs)');
});

test('hard paywall: signed in but not a member → Otto Club, never the app', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: true, member: false }), '/otto-club');
});

test('hard paywall: membership unknown → splash, not the app (fail closed)', () => {
  assert.equal(resolveRoute({ onboarded: true, isLoaded: true, hasSession: true, member: null }), null);
});

test('route guard: only a signed-in member uses the app', () => {
  assert.equal(canUseApp(true, true), true);
  assert.equal(canUseApp(true, false), false);
  assert.equal(canUseApp(true, null), false);
  assert.equal(canUseApp(false, true), false);
  assert.equal(canUseApp(false, null), false);
});

test('onboardedFor: per account — a new account after a deleted one still gets onboarding', () => {
  assert.equal(onboardedFor(['old-uid'], 'new-uid'), false);
  assert.equal(onboardedFor(['old-uid', 'new-uid'], 'new-uid'), true);
  assert.equal(onboardedFor(true, 'new-uid'), false); // legacy per-device flag
});

test('onboardedFor: signed out → has this phone been used (sign-in vs sign-up)', () => {
  assert.equal(onboardedFor(false, undefined), false);
  assert.equal(onboardedFor([], undefined), false);
  assert.equal(onboardedFor(['a'], undefined), true);
  assert.equal(onboardedFor(true, undefined), true);
});
