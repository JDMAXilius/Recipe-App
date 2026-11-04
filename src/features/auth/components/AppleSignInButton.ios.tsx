import React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { radii } from '@/shared/theme/tokens';

// iOS: Apple's own "Continue with Apple" button (HIG 43 · Sign in with Apple
// prefers the system button over a custom glyph). Full width, first, so it's
// at least as prominent as Google/Facebook (Review 4.8). The system draws and
// sizes its own label, so the height is fixed rather than minHeight.
export function AppleSignInButton({ onPress, dimmed }: { onPress: () => void; dimmed?: boolean }) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={radii.button}
      onPress={onPress}
      style={[{ width: '100%', height: 50 }, dimmed && { opacity: 0.5 }]}
    />
  );
}
