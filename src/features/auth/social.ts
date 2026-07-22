// Social sign-in provider catalog (ported from mobile/lib/socialAuth.js).
//
// PURE module — no react-native / expo / supabase imports, so the provider
// mapping unit-tests via node's type stripping. The OAuth flow itself is a
// Supabase call and lives in auth.queries.ts (contract: all supabase in
// *.queries.ts).

export type SocialProvider = 'apple' | 'google' | 'facebook';
export type AuthMode = 'sign-in' | 'sign-up';

// Display order — Apple first (App Store guideline 4.8: offer it once other
// social logins exist).
export const SOCIAL_PROVIDERS: readonly SocialProvider[] = ['apple', 'google', 'facebook'];

const LABELS: Record<SocialProvider, string> = {
  apple: 'Continue with Apple',
  google: 'Continue with Google',
  facebook: 'Continue with Facebook',
};

export const providerLabel = (provider: SocialProvider): string => LABELS[provider];
