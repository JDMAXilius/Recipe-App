import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { haptics } from '@/shared/haptics';
import { usePressPop } from '@/shared/motion';
import { colors, radii, shadow } from '@/shared/theme/tokens';

// The v1 signature: a raised, circular terracotta ＋ standing in for the `create`
// tab's button (spec §Bottom tab bar). Rendered via Tabs.Screen `tabBarButton`,
// so react-navigation's `onPress` is forwarded verbatim (navigation still works).
//
// Two behaviours the founder asked for (2026-07-25):
// 1. The press must be FELT and must always come back. usePressPop runs the
//    whole dip-and-return from onPress — the old press-in/press-out pair was
//    orphaned by navigation (the out never fired), so the ＋ came back from the
//    chat screen still scaled down.
// 2. Already on the create tab → the tap does NOTHING. No navigation, no
//    haptic, no pop: you're there, and re-announcing arrival is noise. The
//    accessibilityState marks it selected, which is what says so.
const SIZE = 58;
const LIFT = -26; // how far the disc stands proud of the bar

export function TabBarCreateButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const { style, pop } = usePressPop();
  const isOnScreen = !!accessibilityState?.selected;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create recipe"
        accessibilityState={accessibilityState}
        // Feedback rides the TOUCH, not the release — waiting for onPress put
        // the whole animation a finger-lift late, which is what read as slow.
        onPressIn={() => {
          if (isOnScreen) return;
          haptics.impact('medium'); // heavier than a tab tick: this one moves you
          pop();
        }}
        onPress={(e) => {
          if (isOnScreen) return; // already here — nothing to do
          onPress?.(e);
        }}
      >
        <Animated.View
          style={[
            {
              width: SIZE,
              height: SIZE,
              borderRadius: radii.pill,
              marginTop: LIFT,
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
