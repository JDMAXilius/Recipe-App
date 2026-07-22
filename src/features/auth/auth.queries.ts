// All Supabase auth calls for the domain (contract: supabase lives in
// *.queries.ts). Imperative actions — auth is a subscription (session comes
// from onAuthStateChange in AuthProvider) plus mutations, not query-cache
// state, so there are no TanStack useQuery hooks here. Every function throws
// on failure; the screen decides what to say.
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from '@/shared/supabase/client';
import type { AuthMode, SocialProvider } from './social';
import { cleanUsername } from './username';

// ---- Email / password ---------------------------------------------------

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string): Promise<void> {
  // Auth is required — no anonymous/guest sessions to upgrade (founder decision
  // 2026-07-22), so this is a plain sign-up.
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ---- Password recovery / change -----------------------------------------

export async function sendPasswordReset(email: string): Promise<void> {
  // Lands on /reset-password, which sits OUTSIDE (auth) on purpose: the
  // recovery link signs you in, and (auth) bounces signed-in users home.
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/reset-password'),
  });
  if (error) throw error;
}

export async function hasActiveSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  // Supabase has no "verify password" call, so proving the current one means
  // signing in with it. Same user, so the session just refreshes — but a wrong
  // password fails here, before anything is changed.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyError) throw new Error("That current password doesn't match.");
  await updatePassword(newPassword);
}

export async function saveUsername(value: string): Promise<string> {
  const username = cleanUsername(value);
  const { data, error } = await supabase.auth.updateUser({ data: { username } });
  if (error) throw error;
  return data.user?.user_metadata?.username ?? username;
}

// ---- Recovery-link session bootstrap (native) ---------------------------

// Supabase hands the session back one of two ways: implicit puts tokens in the
// URL fragment, PKCE puts a ?code= in the query. Native parses whichever
// arrived; web has detectSessionInUrl and does it for us.
export async function sessionFromUrl(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  const { queryParams } = Linking.parse(url);
  if (queryParams?.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(String(queryParams.code));
    return !error;
  }
  const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return !error;
}

// ---- Social OAuth --------------------------------------------------------

// mode (sign-in vs sign-up) is one operation for OAuth — kept in the signature
// so the auth screens can pass it, but there's no anonymous session to link
// anymore (auth is required), so both just start the provider redirect.
export async function signInWithProvider(provider: SocialProvider, _mode: AuthMode): Promise<void> {
  if (Platform.OS !== 'web') {
    // ponytail: native OAuth needs expo-web-browser (+ expo-apple-authentication
    // /expo-crypto for the Apple sheet) — not installed in the v2 tree. Wire the
    // native flow when those deps land; the web redirect path works today.
    throw new Error("Social sign-in isn't available in this build yet.");
  }
  const options = { redirectTo: Linking.createURL('/') };
  const { error } = await supabase.auth.signInWithOAuth({ provider: provider as Provider, options });
  if (error) throw error;
}
