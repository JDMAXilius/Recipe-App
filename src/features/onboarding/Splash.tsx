import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { splashArt } from '@/shared/assets';
import { colors } from '@/shared/theme/tokens';
import { flags } from '@/shared/flags';

// Full-screen launch splash (spec §5: cream, centered matted lid-lift). Shown by
// the font gate (_layout) and the first-run gate (index) while things resolve —
// deliberately provider-free (renders above SafeAreaProvider) and static: the
// splash is on screen for a blink, so no motion hook to earn (reduced = instant).
// flowV2 (R1.1, gap G18, Apple "Launching"): the launch looks like Welcome's
// empty cream shell — no otter, no words — so the first real screen simply
// fills in. The otter lives on Welcome.
export function Splash() {
  if (flags.flowV2) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={splashArt}
        style={{ width: 240, height: 358 }}
        contentFit="contain"
        accessibilityLabel="Otto"
      />
    </View>
  );
}
