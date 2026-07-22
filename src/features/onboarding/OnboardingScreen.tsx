import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, OttoIdle, Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { onboardingArt } from '@/shared/assets';
import { useAuth } from '@/features/auth';
import { useOnboarded } from './useOnboarded';

// First-run welcome (spec §4 "onboarding absent"). Living Otto + brand, then the
// three value scenes, then the entry fork. OttoIdle carries the "alive" (breathe
// + entrance pop, both reduced-motion aware in motion.ts); the scenes stay still
// and let the serif do the talking — less-is-more. Either CTA marks onboarded.
const SCENES = [
  { key: 'collect', headline: 'Collect every recipe', caption: 'Import from anywhere — Otto keeps them tidy.' },
  { key: 'cook', headline: 'Cook hands-free', caption: 'Step-by-step with timers, no scrubbing back.' },
  { key: 'plan', headline: 'Plan your week', caption: 'Meals mapped, shopping list sorted.' },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enterAsGuest } = useAuth();
  const { markOnboarded } = useOnboarded();
  const [busy, setBusy] = useState<'account' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async () => {
    setBusy('account');
    await markOnboarded();
    router.replace('/(auth)/sign-up');
  };

  const browseAsGuest = async () => {
    setBusy('guest');
    setError(null);
    try {
      await enterAsGuest();
      await markOnboarded();
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest mode isn't available right now.");
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: space[5], paddingVertical: space[6] }}
        showsVerticalScrollIndicator={false}
      >
        <OttoIdle name="happy" sway size={120} />
        <View style={{ marginTop: space[3], alignItems: 'center' }}>
          <Text role="display">Otto</Text>
        </View>
        <View style={{ marginTop: space[1], alignItems: 'center' }}>
          <Text role="caption">Your kitchen, remembered.</Text>
        </View>

        {SCENES.map((s) => (
          <View key={s.key} style={{ marginTop: space[6], alignItems: 'center' }}>
            <Image
              source={onboardingArt[s.key]}
              style={{ width: 220, height: 220 }}
              contentFit="contain"
              accessibilityLabel={s.headline}
            />
            <View style={{ marginTop: space[3], alignItems: 'center' }}>
              <Text role="title">{s.headline}</Text>
            </View>
            <View style={{ marginTop: space[1], alignItems: 'center' }}>
              <Text role="caption">{s.caption}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: space[5], paddingBottom: insets.bottom + space[4], gap: space[2] }}>
        {error != null && (
          <View style={{ alignItems: 'center', marginBottom: space[1] }}>
            <Text role="caption">{error}</Text>
          </View>
        )}
        <Button
          title="Create account"
          onPress={createAccount}
          variant="primary"
          size="lg"
          loading={busy === 'account'}
          disabled={busy === 'guest'}
        />
        <Button
          title="Browse as guest"
          onPress={browseAsGuest}
          variant="ghost"
          size="lg"
          loading={busy === 'guest'}
          disabled={busy === 'account'}
        />
      </View>
    </View>
  );
}
