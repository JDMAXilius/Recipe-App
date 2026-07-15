import { useEffect, useRef, useState } from "react";
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
import { SPRING, TIMING } from "../constants/tokens";
import { ottoBus } from "../lib/ottoBus";

// Living Otto without Rive (D4 in code, within the B6 guardrails):
// • idle — a slow breathing loop (~4s/breath, barely there)
// • entrance — optional spring pop-in for celebration moments
// • reactions — pass `reactTo="save"` (+ reactionSource art) and Otto hops
//   and flashes the reaction expression for ~1.4s when the event fires,
//   then settles back to idle. Never blocks anything; one reaction at a
//   time; reduced motion → static PNG, reactions skipped entirely.
export default function OttoIdle({
  source,
  style,
  entrance = false,
  sway = false,
  reactTo = null,
  reactionSource = null,
}) {
  const reducedMotion = useReducedMotion();
  const breathe = useSharedValue(0);
  const pop = useSharedValue(entrance && !reducedMotion ? 0 : 1);
  const hop = useSharedValue(0);
  const [displaySource, setDisplaySource] = useState(source);
  const reacting = useRef(false);

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

  // Event reaction (guardrails: ≤1.5s, one at a time, skipped under reduced motion)
  useEffect(() => {
    if (!reactTo || reducedMotion) return;
    const unsubscribe = ottoBus.on((event) => {
      if (event !== reactTo || reacting.current) return;
      reacting.current = true;
      if (reactionSource) setDisplaySource(reactionSource);
      hop.value = withSequence(
        withTiming(-8, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(0, SPRING.pop)
      );
      pop.value = withSequence(withSpring(1.1, SPRING.pop), withSpring(1, SPRING.gentle));
      setTimeout(() => {
        setDisplaySource(source);
        reacting.current = false;
      }, 1400);
    });
    return unsubscribe;
  }, [reactTo, reactionSource, source, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pop.value * (1 + breathe.value * 0.015) },
      { translateY: breathe.value * -2 + hop.value },
      ...(sway ? [{ rotate: `${(breathe.value - 0.5) * 2.4}deg` }] : []),
    ],
    opacity: entrance ? Math.min(1, pop.value * 1.4) : 1,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Image
        source={displaySource}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        transition={TIMING.fade}
        accessible={false}
      />
    </Animated.View>
  );
}
