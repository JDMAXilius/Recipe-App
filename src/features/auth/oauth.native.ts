// Native social OAuth flows (ios/android — Metro resolves this over oauth.ts).
// STATIC imports of the native modules: because this file is native-only, they
// never reach the web bundle (same pattern as shareImage.native.ts). oauth.ts is
// the web-safe sibling that tsc + the web bundle resolve instead, so
// expo-apple-authentication (no web support) is never evaluated on web.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '@/shared/supabase/client';

// Finishes any auth session left dangling if the browser redirect races the app
// coming back to foreground.
WebBrowser.maybeCompleteAuthSession();

// Native Apple — the system sheet (best UX, what v1 used) exchanged for a
// Supabase session via signInWithIdToken. A nonce we generate, hash (SHA-256),
// and pass to Apple; Supabase re-hashes the raw one to verify the id token.
export async function nativeAppleSignIn(): Promise<void> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!cred.identityToken) throw new Error("Apple didn't return a sign-in token. Try again.");
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: cred.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;
  } catch (err) {
    // Deliberate cancel from the Apple sheet — silent no-op, no error toast.
    if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
    throw err;
  }
}

// Native Google + Facebook — Supabase OAuth opened in an in-app browser session.
// The provider redirects back to otto://auth/callback; sessionFromUrl (passed in
// to avoid an import cycle with auth.queries) turns the returned tokens/?code=
// into a session.
export async function nativeBrowserSignIn(
  provider: 'google' | 'facebook',
  finishFromUrl: (url: string) => Promise<boolean>,
): Promise<void> {
  const redirectTo = Linking.createURL('/auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // Always let people pick which Google account (not silently the last one).
      ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Sign-in didn't finish. Try again.");

  // Ephemeral = a private browser session: no shared Safari cookies, so no iOS
  // "Otto wants to use …supabase.co to sign in" prompt, and no auto-reuse of
  // whatever Google/Facebook account Safari is signed into (Juan, 2026-10-03).
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferEphemeralSession: true,
  });
  if (result.type !== 'success' || !result.url) return; // dismissed/cancelled → no-op
  const ok = await finishFromUrl(result.url);
  if (!ok) throw new Error("Sign-in didn't finish. Try again.");
}

// Native Google — the iOS Google account picker (Supabase's documented Expo path):
// Google's SDK returns an ID token, exchanged via signInWithIdToken. No browser,
// so no "wants to use …supabase.co" prompt and any account can be picked.
// Client IDs are public identifiers (Google Cloud project otto-502822): the web
// client is the token audience Supabase already trusts, the iOS client is this
// app. The free SDK can't pass a nonce on iOS, so Supabase's Google provider has
// "Skip nonce check" on (set 2026-10-03).
GoogleSignin.configure({
  webClientId: '191825407172-vi4g3e1av51quet7csoloeah3tebjgto.apps.googleusercontent.com',
  iosClientId: '191825407172-krh83vo1una000a1fc6sh73f0qc6uk2c.apps.googleusercontent.com',
});

export async function nativeGoogleSignIn(): Promise<void> {
  try {
    const res = await GoogleSignin.signIn();
    if (isCancelledResponse(res)) return;
    const token = res.data.idToken;
    if (!token) throw new Error("Google didn't return a sign-in token. Try again.");
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
    if (error) throw error;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return;
    throw err;
  }
}

// Forget the Google account on sign-out so the next sign-in shows the picker.
export async function nativeGoogleSignOut(): Promise<void> {
  await GoogleSignin.signOut().catch(() => {});
}
