import { Platform, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { usePressSpring } from '@/shared/motion';
import { colors, shadow } from '@/shared/theme/tokens';

// The v1 signature: a raised, circular terracotta ＋ standing in for the `create`
// tab's button (spec §Bottom tab bar). Rendered via Tabs.Screen `tabBarButton`,
// so react-navigation's `onPress` is forwarded verbatim (navigation still works).
// Press feedback comes from usePressSpring (contract: motion lives in one place).
export function TabBarCreateButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const { style, onPressIn, onPressOut } = usePressSpring();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create recipe"
        accessibilityState={accessibilityState}
        onPress={(e) => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          onPress?.(e);
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View
          style={[
            {
              width: 58,
              height: 58,
              borderRadius: 29,
              marginTop: -26, // lifts the disc above the bar
              backgroundColor: colors.terracotta,
              borderWidth: 3,
              borderColor: colors.cream, // 3px surface ring
              alignItems: 'center',
              justifyContent: 'center',
            },
            shadow.featured,
            style,
          ]}
        >
          <Ionicons name="add" size={30} color={colors.white} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
