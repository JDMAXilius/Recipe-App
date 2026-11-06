import { authErrorMessage } from '../authErrors';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text as RNText, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, space } from '@/shared/theme/tokens';
import { brandMark } from '@/shared/assets';
import { haptics } from '@/shared/haptics';
import { useAuth } from '../AuthProvider';
import { SOCIAL_PROVIDERS, providerLabel, type AuthMode, type SocialProvider } from '../social';
import { AppleSignInButton } from './AppleSignInButton';
import { track } from '@/shared/track';

// Social sign-in (ported from mobile/components/SocialAuthButtons.jsx, matched to
// the Figma master board): a compact CENTERED ROW of icon-only brand buttons —
// Apple glyph · Google's multicolour G · Facebook f — the Thrive/eBay pattern,
// NOT three stacked "Continue with…" bars. All three always render (product
// decision); a provider that can't complete surfaces a friendly error on tap.
// Same component on sign-in and sign-up. An "or" divider closes the row.
// On iOS Apple leaves the row for the system full-width "Continue with Apple"
// button above it (HIG 43; still first and the most prominent, Review 4.8).
export interface SocialAuthButtonsProps {
  mode?: AuthMode;
  onError?: (message: string) => void;
}

const button: ViewStyle = {
  width: 76,
  minHeight: 50,
  borderRadius: radii.button,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.white,
  alignItems: 'center',
  justifyContent: 'center',
};

const FACEBOOK_BLUE = '#1877F2';

export function SocialAuthButtons({ mode = 'sign-in', onError }: SocialAuthButtonsProps) {
  const { signInWithProvider } = useAuth();
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const start = async (provider: SocialProvider) => {
    if (busy) return;
    haptics.select();
    setBusy(provider);
    try {
      await signInWithProvider(provider, mode);
      if (mode === 'sign-up') track('plan_saved', { method: provider });
      // success: AuthProvider sees the session and route guards redirect home
    } catch (err) {
      onError?.(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const icon = (p: SocialProvider) => {
    if (p === 'google')
      return <Image source={brandMark.google} style={{ width: 22, height: 22 }} resizeMode="contain" />;
    if (p === 'facebook') return <Ionicons name="logo-facebook" size={22} color={FACEBOOK_BLUE} />;
    return <Ionicons name="logo-apple" size={22} color={colors.ink} />;
  };

  const row = AppleSignInButton ? SOCIAL_PROVIDERS.filter((p) => p !== 'apple') : SOCIAL_PROVIDERS;

  return (
    <View style={{ marginBottom: space[4] }}>
      {AppleSignInButton && (
        <View style={{ marginBottom: space[3] }}>
          <AppleSignInButton onPress={() => start('apple')} dimmed={!!busy && busy !== 'apple'} />
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space[3] }}>
        {row.map((p) => (
          <Pressable
            key={p}
            onPress={() => start(p)}
            disabled={!!busy}
            accessibilityRole="button"
            accessibilityLabel={providerLabel(p)}
            style={[button, !!busy && busy !== p && { opacity: 0.5 }]}
          >
            {busy === p ? <ActivityIndicator color={colors.inkSoft} /> : icon(p)}
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space[5] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <RNText style={{ marginHorizontal: space[3], color: colors.inkSoft, fontSize: 13 }}>or</RNText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    </View>
  );
}
