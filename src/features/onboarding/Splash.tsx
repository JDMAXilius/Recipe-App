import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { splashArt } from '@/shared/assets';
import { colors } from '@/shared/theme/tokens';

// Full-screen launch splash (spec §5: cream, centered matted lid-lift). Shown by
// the font gate (_layout) and the first-run gate (index) while things resolve —
// deliberately provider-free (renders above SafeAreaProvider) and static: the
// splash is on screen for a blink, so no motion hook to earn (reduced = instant).
export function Splash() {
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
