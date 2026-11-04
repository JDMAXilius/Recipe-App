import type { ComponentType } from 'react';

export interface AppleSignInButtonProps {
  onPress: () => void;
  dimmed?: boolean;
}

// Web/Android sibling of AppleSignInButton.ios.tsx: there's no system Apple
// button off iOS, so SocialAuthButtons keeps the Apple glyph tile in its row.
// Null (not a component) also keeps expo-apple-authentication out of the web
// bundle, same split as oauth.ts / oauth.native.ts.
export const AppleSignInButton: ComponentType<AppleSignInButtonProps> | null = null;
