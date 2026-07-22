// Native social OAuth flows (ios/android — Metro resolves this over oauth.ts).
// STATIC imports of the native modules: because this file is native-only, they
// never reach the web bundle (same pattern as shareImage.native.ts). oauth.ts is
// the web-safe sibling that tsc + the web bundle resolve instead, so
// expo-apple-authentication (no web support) is never evaluated on web.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
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
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Sign-in didn't finish. Try again.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return; // dismissed/cancelled → no-op
  const ok = await finishFromUrl(result.url);
  if (!ok) throw new Error("Sign-in didn't finish. Try again.");
}
