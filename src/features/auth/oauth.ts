// Web-safe sibling of oauth.native.ts. tsc and the web bundle resolve THIS file
// (no `.native` suffix), so expo-apple-authentication / expo-web-browser / the
// native sheet never enter the web bundle. Web never calls these — signInWith
// Provider handles web inline via supabase.auth.signInWithOAuth — so they only
// exist to keep the type contract identical across platforms and throw if ever
// reached.
const webUnreachable = (): never => {
  throw new Error('Native social sign-in is not available on web.');
};

export async function nativeAppleSignIn(): Promise<void> {
  webUnreachable();
}

export async function nativeBrowserSignIn(
  _provider: 'google' | 'facebook',
  _finishFromUrl: (url: string) => Promise<boolean>,
): Promise<void> {
  webUnreachable();
}
