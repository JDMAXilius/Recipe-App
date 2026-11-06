import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from './authErrors.ts';

test('auth errors become plain advice, never server text', () => {
  assert.match(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' }), /don’t match/);
  assert.match(authErrorMessage({ name: 'AuthApiError', message: 'Email not confirmed' }), /Confirm your email/);
  assert.match(authErrorMessage({ status: 429 }), /Too many tries/);
  assert.match(authErrorMessage({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }), /No connection/);
  assert.match(authErrorMessage({ code: 'user_already_exists' }, 'sign-up'), /Sign in instead/);
  assert.match(authErrorMessage({ code: 'weak_password' }, 'sign-up'), /at least 8/);
  const unknown = authErrorMessage({ status: 500, message: 'pq: duplicate key value violates unique constraint' });
  assert.doesNotMatch(unknown, /pq|constraint/);
  assert.match(authErrorMessage(null, 'reset'), /reset email/);
});

test("the app's own errors keep their words; server text never shows", () => {
  assert.equal(authErrorMessage(new Error("Apple didn't return a sign-in token. Try again.")), "Apple didn't return a sign-in token. Try again.");
  assert.doesNotMatch(authErrorMessage({ name: 'AuthApiError', status: 400, message: 'some internal thing' }), /internal/);
});
