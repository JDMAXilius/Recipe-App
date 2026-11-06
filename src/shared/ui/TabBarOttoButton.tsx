// The Otto circle (ADR-0008, D1.1): the trailing tab, Otto's face, a ring
// when it's the open tab. VoiceOver reads it as "Otto". Same press feel as
// the old ＋, and a tap on the open tab does nothing.
import { Image, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { haptics } from '../haptics';
import { usePressPop } from '../motion';
import { ottoArt } from '../assets';
import { colors, radii } from '../theme/tokens';

const SIZE = 48;

export function TabBarOttoButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const { style, pop } = usePressPop();
  const open = !!accessibilityState?.selected;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Otto"
        accessibilityHint="Ask Otto to plan, find or change anything"
        accessibilityState={accessibilityState}
        onPressIn={() => {
          if (open) return;
          haptics.impact('light');
          pop();
        }}
        onPress={(e) => {
          if (!open) onPress?.(e);
        }}
      >
        <Animated.View
          style={[
            {
              width: SIZE,
              height: SIZE,
              borderRadius: radii.pill,
              backgroundColor: colors.accentSoft,
              borderWidth: 2,
              borderColor: open ? colors.terracotta : colors.cream,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
            style,
          ]}
        >
          <Image source={ottoArt.happy} style={{ width: SIZE - 6, height: SIZE - 6 }} resizeMode="contain" />
        </Animated.View>
      </Pressable>
    </View>
  );
}
