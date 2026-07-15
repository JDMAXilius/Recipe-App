// Social sign-in (P10 §3) — real Supabase OAuth, no dead buttons.
//
// The auth screens ask `fetchEnabledProviders()` which providers the Supabase
// project actually has configured (public /auth/v1/settings) and render ONLY
// those rows. Today that's none; the moment the founder enables Apple/Google/
// Facebook in the dashboard the rows appear — wired end-to-end, honestly gated.
//
// Apple uses the native sheet (App Store 4.8 requires offering it once other
// social logins exist) → signInWithIdToken. Google/Facebook use the system
// browser via Supabase's OAuth URL → session tokens come back on our deep link.
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const SETTINGS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/settings`;
const SOCIAL_PROVIDERS = ["apple", "google", "facebook"]; // display order — Apple first (4.8)

export async function fetchEnabledProviders() {
  try {
    const res = await fetch(SETTINGS_URL, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY },
    });
    if (!res.ok) return [];
    const settings = await res.json();
    return SOCIAL_PROVIDERS.filter((p) => settings.external?.[p]);
  } catch {
    return []; // can't verify → show nothing rather than a maybe-dead button
  }
}

// Anonymous guests upgrade IN PLACE on SIGN-UP (same rule as email sign-up:
// linkIdentity attaches the OAuth identity to the current anonymous user so
// their imports/plans/saves keep their owner). On SIGN-IN we switch accounts
// like the email path does — linking there would wrongly reject users whose
// identity already belongs to their real account (QA P2-6). Local session
// read, no network — a transient fetch failure must not misroute the guest
// into a fresh account (QA P3-7).
async function isAnonymousSession() {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: null }));
  return Boolean(data?.session?.user?.is_anonymous);
}

const shouldLink = async (mode) => mode === "sign-up" && (await isAnonymousSession());

// ---- Apple (native sheet; iOS native builds only) -----------------------
export async function signInWithApple(mode) {
  if (await shouldLink(mode)) {
    // keep the guest's data: link via the browser OAuth flow instead of the
    // native sheet (signInWithIdToken can't link — it signs in)
    return linkOAuthIdentity("apple");
  }
  // dynamic imports — these native modules only exist in freshly-built iOS
  // binaries; a top-level import would crash older dev builds at boot
  const [AppleAuthentication, Crypto] = await Promise.all([
    import("expo-apple-authentication"),
    import("expo-crypto"),
  ]);
  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) throw new Error("Apple sign-in isn't available on this device.");

  // Supabase verifies the identity token against the RAW nonce; Apple gets the hash.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!credential.identityToken) throw new Error("Apple didn't return a token. Try again.");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
}

// ---- Google / Facebook (system browser, PKCE-free implicit via Supabase) --
async function createSessionFromUrl(url) {
  // tokens arrive in the URL fragment: #access_token=…&refresh_token=…
  const fragment = url.split("#")[1] || url.split("?")[1] || "";
  const params = Object.fromEntries(new URLSearchParams(fragment));
  if (params.error_description) throw new Error(params.error_description);
  if (!params.access_token || !params.refresh_token) {
    throw new Error("Sign-in was cancelled or didn't finish.");
  }
  const { error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });
  if (error) throw error;
}

async function runBrowserFlow(getUrl) {
  if (Platform.OS === "web") {
    // full-page redirect; supabase-js picks the session out of the URL on
    // return. Explicit origin so dev/preview hosts don't bounce to the
    // dashboard Site URL and strand the session on another origin (QA P3-11).
    const { error } = await getUrl({ redirectTo: window.location.origin });
    if (error) throw error;
    return;
  }
  const redirectTo = Linking.createURL("auth/callback"); // runtime scheme, always right
  const { data, error } = await getUrl({ redirectTo, skipBrowserRedirect: true });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success" && result.url) {
    await createSessionFromUrl(result.url);
  } else if (result.type !== "cancel" && result.type !== "dismiss") {
    throw new Error("Sign-in didn't finish. Try again.");
  }
}

async function linkOAuthIdentity(provider) {
  return runBrowserFlow((options) => supabase.auth.linkIdentity({ provider, options }));
}

export async function signInWithOAuthProvider(provider, mode) {
  if (await shouldLink(mode)) return linkOAuthIdentity(provider);
  return runBrowserFlow((options) => supabase.auth.signInWithOAuth({ provider, options }));
}
