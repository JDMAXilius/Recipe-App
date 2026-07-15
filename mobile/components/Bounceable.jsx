import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { SPRING } from "../constants/tokens";

// Tactile press feedback (B3: spring.snappy, interruptible). Scales to 0.97
// on press-in and springs back on release. Reduced motion → opacity dip only.
// Drop-in replacement for TouchableOpacity on cards/tiles/primary buttons.
// `style` lands on the animated inner view; `containerStyle` on the Pressable
// itself (needed when the button must flex/stretch in its row).
export default function Bounceable({
  children,
  style,
  containerStyle,
  onPress,
  disabled,
  ...pressableProps
}) {
  useTheme(); // keep theme subscription consistent with sibling components
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!reducedMotion) scale.value = withSpring(0.97, SPRING.snappy);
      }}
      onPressOut={() => {
        if (!reducedMotion) scale.value = withSpring(1, SPRING.snappy);
      }}
      style={({ pressed }) => [containerStyle, reducedMotion && pressed ? { opacity: 0.85 } : null]}
      {...pressableProps}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
