// Sign-in, sign-up and reset errors in plain words with the next step (S5).
// Never the raw server text. Pure: authErrors.test.mjs.
type AuthErrorLike = { code?: string; status?: number; name?: string; message?: string } | null | undefined;

// Supabase's errors carry a code or an Auth* name; a plain Error is one the
// app threw itself with words already written for people, so it's kept.
const fromServer = (e: NonNullable<AuthErrorLike>) => !!e.code || e.status !== undefined || /^Auth/.test(e.name ?? '');

export function authErrorMessage(err: unknown, action: 'sign-in' | 'sign-up' | 'reset' | 'password' = 'sign-in'): string {
  const e = (err && typeof err === 'object' ? err : {}) as NonNullable<AuthErrorLike>;
  if (!fromServer(e) && e.message && !/network|fetch/i.test(e.message)) return e.message;
  const code = e.code ?? '';
  const msg = (e.message ?? '').toLowerCase();
  if (e.name === 'AuthRetryableFetchError' || /network|fetch failed|failed to fetch|timed? ?out/.test(msg) || e.status === 0)
    return 'No connection. Check your internet and try again.';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || e.status === 429 || /rate limit/.test(msg))
    return 'Too many tries. Wait a minute, then try again.';
  if (code === 'invalid_credentials' || /invalid login credentials/.test(msg))
    return 'That email and password don’t match. Check them, or tap Forgot your password?';
  if (code === 'email_not_confirmed' || /email not confirmed/.test(msg))
    return 'Confirm your email first: tap the link Otto sent you, then sign in.';
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered|already exists/.test(msg))
    return 'There’s already an account with that email. Sign in instead.';
  if (code === 'weak_password' || /password should|weak password/.test(msg))
    return 'Pick a longer password: at least 8 characters.';
  if (code === 'email_address_invalid' || /invalid email|unable to validate email/.test(msg))
    return 'That email doesn’t look right. Check it and try again.';
  if (code === 'signup_disabled') return 'New accounts are paused for a moment. Try again later.';
  return action === 'sign-up'
    ? 'Couldn’t create your account. Try again in a moment.'
    : action === 'reset'
      ? 'Couldn’t send the reset email. Try again in a moment.'
      : action === 'password'
        ? 'Couldn’t save that password. Try again in a moment.'
        : 'Couldn’t sign you in. Try again in a moment.';
}
