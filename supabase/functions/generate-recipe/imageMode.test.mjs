// Pure-logic checks for the vision-mode guard (node --test, native TS strip).
// The one branch worth pinning: 413-too-big vs 400-malformed, and the happy
// pass-through — everything the edge fn keys its status codes on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkImage, MAX_IMAGE_CHARS } from './imageMode.ts';

test('checkImage: accepts a well-formed base64 + allowed mime', () => {
  const r = checkImage('abc123', 'image/png');
  assert.deepEqual(r, { ok: true, image: 'abc123', mimeType: 'image/png' });
});

test('checkImage: empty or non-string image → 400', () => {
  assert.deepEqual(checkImage('', 'image/jpeg'), { ok: false, status: 400 });
  assert.deepEqual(checkImage(null, 'image/jpeg'), { ok: false, status: 400 });
  assert.deepEqual(checkImage(undefined, 'image/jpeg'), { ok: false, status: 400 });
});

test('checkImage: over the cap → 413 (before mime is even looked at)', () => {
  const tooBig = 'a'.repeat(MAX_IMAGE_CHARS + 1);
  assert.deepEqual(checkImage(tooBig, 'image/jpeg'), { ok: false, status: 413 });
  // exactly at the cap is still ok
  assert.equal(checkImage('a'.repeat(MAX_IMAGE_CHARS), 'image/jpeg').ok, true);
});

test('checkImage: disallowed / missing mime → 400', () => {
  assert.deepEqual(checkImage('abc', 'image/heic'), { ok: false, status: 400 });
  assert.deepEqual(checkImage('abc', 'application/pdf'), { ok: false, status: 400 });
  assert.deepEqual(checkImage('abc', null), { ok: false, status: 400 });
});
