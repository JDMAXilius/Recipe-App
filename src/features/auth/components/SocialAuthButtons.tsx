import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text as RNText, View, type ViewStyle } from 'react-native';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useAuth } from '../AuthProvider';
import { SOCIAL_PROVIDERS, providerLabel, type AuthMode, type SocialProvider } from '../social';

// Social sign-in (ported from mobile/components/SocialAuthButtons.jsx) — a
// centered row of provider buttons, Apple first (App Store 4.8). All three
// always render (product decision: the row matches the design regardless of
// Supabase config); a provider that can't complete surfaces a friendly error
// on tap. Same component on sign-in and sign-up. No brand-icon assets in the
// v2 tree yet, so buttons show the provider name until OttoArt/brand marks land.
export interface SocialAuthButtonsProps {
  mode?: AuthMode;
  onError?: (message: string) => void;
}

const button: ViewStyle = {
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: colors.creamDeep,
  backgroundColor: colors.white,
  minHeight: 50,
  paddingHorizontal: space[4],
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: space[3],
};

export function SocialAuthButtons({ mode = 'sign-in', onError }: SocialAuthButtonsProps) {
  const { signInWithProvider } = useAuth();
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const start = async (provider: SocialProvider) => {
    if (busy) return;
    setBusy(provider);
    try {
      await signInWithProvider(provider, mode);
      // success: AuthProvider sees the session and route guards redirect home
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Sign-in didn't finish. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ marginBottom: space[4] }}>
      {SOCIAL_PROVIDERS.map((p) => (
        <Pressable
          key={p}
          onPress={() => start(p)}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel={providerLabel(p)}
          style={[button, !!busy && busy !== p && { opacity: 0.5 }]}
        >
          {busy === p ? (
            <ActivityIndicator color={colors.inkSoft} />
          ) : (
            <RNText style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>
              {providerLabel(p)}
            </RNText>
          )}
        </Pressable>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space[2] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.creamDeep }} />
        <RNText style={{ marginHorizontal: space[3], color: colors.inkSoft, fontSize: 13 }}>or</RNText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.creamDeep }} />
      </View>
    </View>
  );
}
