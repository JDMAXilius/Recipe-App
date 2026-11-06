import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseApp, LAUNCH_HREF, launchHref, onboardedFor, resolveLaunch } from './launch.ts';

const base = { authReady: true, signedIn: false, onboarded: false, hasDraft: false, membership: 'unknown', purchasePending: false };
const at = (over) => resolveLaunch({ ...base, ...over });

test('loading while auth, the first-run flag or the draft is still unknown', () => {
  assert.equal(at({ authReady: false }), 'loading');
  assert.equal(at({ onboarded: null }), 'loading');
  assert.equal(at({ hasDraft: null }), 'loading');
});

test('signed out: first launch, used phone, draft waiting', () => {
  assert.equal(at({}), 'welcome');
  assert.equal(at({ onboarded: true }), 'signIn');
  assert.equal(at({ hasDraft: true }), 'resumeDraft');
  assert.equal(at({ onboarded: true, hasDraft: true }), 'resumeDraft'); // the draft wins: it's this person's week
});

test('signed in without answers → the questions; with a draft being claimed → straight on', () => {
  assert.equal(at({ signedIn: true, membership: 'none' }), 'needsPlan');
  assert.equal(at({ signedIn: true, hasDraft: true, membership: 'none' }), 'paywall');
});

test('signed in with answers: membership decides, unknown is never the app', () => {
  const me = { signedIn: true, onboarded: true };
  assert.equal(at({ ...me, membership: 'unknown' }), 'loading');
  assert.equal(at({ ...me, membership: 'member' }), 'app'); // includes an offline cached answer
  assert.equal(at({ ...me, membership: 'none' }), 'paywall');
  assert.equal(at({ ...me, membership: 'none', purchasePending: true }), 'pending');
  assert.equal(at({ ...me, membership: 'ended' }), 'ended');
  assert.equal(at({ ...me, membership: 'member', purchasePending: true }), 'app'); // approved meanwhile
});

test('every state but loading has a route', () => {
  for (const s of ['welcome', 'resumeDraft', 'signIn', 'needsPlan', 'paywall', 'pending', 'ended', 'app']) {
    assert.match(LAUNCH_HREF[s], /^\//, s);
  }
});

test('route guard: only a signed-in member uses the app', () => {
  assert.equal(canUseApp(true, 'member'), true);
  for (const m of ['unknown', 'ended', 'none']) assert.equal(canUseApp(true, m), false);
  assert.equal(canUseApp(false, 'member'), false);
});

test('onboardedFor: per account when signed in, per phone when signed out', () => {
  assert.equal(onboardedFor(['old-uid'], 'new-uid'), false);
  assert.equal(onboardedFor(['old-uid', 'new-uid'], 'new-uid'), true);
  assert.equal(onboardedFor(true, 'new-uid'), false); // legacy per-device flag
  assert.equal(onboardedFor(false, undefined), false);
  assert.equal(onboardedFor([], undefined), false);
  assert.equal(onboardedFor(['a'], undefined), true);
  assert.equal(onboardedFor(true, undefined), true);
});

test('the rework opens Welcome and the questions; everything else is unchanged', () => {
  assert.equal(launchHref('welcome', true), '/welcome');
  assert.equal(launchHref('needsPlan', true), '/about/1');
  assert.equal(launchHref('welcome', false), '/(auth)/sign-up');
  assert.equal(launchHref('app', true), '/(tabs)');
  assert.equal(launchHref('pending', true), '/club/pending');
  assert.equal(launchHref('ended', true), '/club/ended');
  assert.equal(launchHref('ended', false), '/otto-club');
});
