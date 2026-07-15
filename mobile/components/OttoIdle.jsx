import { useEffect } from "react";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { SPRING } from "../constants/tokens";

// Living Otto without Rive (D4-lite, within the B6 guardrails): a slow
// breathing loop — barely-there scale + lift, ~4s per breath — plus an
// optional pop-in entrance for celebration moments. Idle pauses under
// reduced motion (static PNG, no exceptions). Never blocks anything.
export default function OttoIdle({ source, style, entrance = false, sway = false }) {
  const reducedMotion = useReducedMotion();
  const breathe = useSharedValue(0);
  const pop = useSharedValue(entrance && !reducedMotion ? 0 : 1);

  useEffect(() => {
    if (reducedMotion) return;
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2100, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    if (entrance) {
      pop.value = withDelay(80, withSpring(1, SPRING.pop));
    }
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pop.value * (1 + breathe.value * 0.015) },
      { translateY: breathe.value * -2 },
      ...(sway ? [{ rotate: `${(breathe.value - 0.5) * 2.4}deg` }] : []),
    ],
    opacity: entrance ? Math.min(1, pop.value * 1.4) : 1,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Image source={source} style={{ width: "100%", height: "100%" }} contentFit="contain" accessible={false} />
    </Animated.View>
  );
}
