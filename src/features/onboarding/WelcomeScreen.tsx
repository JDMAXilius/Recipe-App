// Welcome (R1.2): the one first-launch screen. A painting, a left-aligned
// promise, and two doors: Get started (the questions, no account yet) and
// I have an account. Replaces the three-painting carousel under flowV2.
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { onboardingArt } from '@/shared/assets';

export function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
      <Image
        source={onboardingArt.plan}
        style={{ flex: 1, width: '100%' }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
      <View style={{ paddingHorizontal: space[6], paddingBottom: Math.max(insets.bottom, space[5]) + space[3], gap: space[5] }}>
        <View style={{ gap: space[2] }}>
          <Text role="display">Dinner, sorted for the week.</Text>
          <Text role="body">Three quick questions and Otto plans seven dinners you’ll actually cook.</Text>
        </View>
        <View style={{ gap: space[2] }}>
          <Button title="Get started" variant="primary" size="lg" onPress={() => router.push('/about/1')} />
          <Button title="I have an account" variant="ghost" size="lg" onPress={() => router.push('/(auth)/sign-in')} />
        </View>
      </View>
    </View>
  );
}
