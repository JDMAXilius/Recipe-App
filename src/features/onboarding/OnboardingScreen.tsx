import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, OttoIdle, Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { onboardingArt } from '@/shared/assets';
import { useOnboarded } from './useOnboarded';

// First-run welcome. Living Otto + brand, the three value scenes, then into auth.
// Auth is REQUIRED (founder decision 2026-07-22 — no anonymous/guest browsing):
// onboarding funnels straight to create-account or sign-in. OttoIdle carries the
// "alive" (breathe + entrance pop, reduced-motion aware in motion.ts). Either CTA
// marks onboarded so the gate won't show this again.
const SCENES = [
  { key: 'collect', headline: 'Collect every recipe', caption: 'Import from anywhere — Otto keeps them tidy.' },
  { key: 'cook', headline: 'Cook hands-free', caption: 'Step-by-step with timers, no scrubbing back.' },
  { key: 'plan', headline: 'Plan your week', caption: 'Meals mapped, shopping list sorted.' },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markOnboarded } = useOnboarded();
  const [busy, setBusy] = useState<'account' | 'signin' | null>(null);

  const go = (which: 'account' | 'signin') => async () => {
    setBusy(which);
    await markOnboarded();
    router.replace(which === 'account' ? '/(auth)/sign-up' : '/(auth)/sign-in');
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
        <Button
          title="Create account"
          onPress={go('account')}
          variant="primary"
          size="lg"
          loading={busy === 'account'}
          disabled={busy === 'signin'}
        />
        <Button
          title="I already have an account"
          onPress={go('signin')}
          variant="ghost"
          size="lg"
          loading={busy === 'signin'}
          disabled={busy === 'account'}
        />
      </View>
    </View>
  );
}
