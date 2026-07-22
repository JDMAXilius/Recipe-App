import React, { useEffect, useRef, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spring } from '../theme/tokens';
import { useBreathe } from '../motion';
import { ottoBus } from '../bus';
import { OttoArt, type OttoArtName } from './OttoArt';

export interface OttoIdleProps {
  name: OttoArtName;
  reactTo?: 'save';
  sway?: boolean;
  size?: number;
}

// Living Otto (spec §5). Breathing loop (useBreathe) + entrance pop + a hop to
// the excited expression when its bus event fires (one reaction at a time,
// restore @1400ms). Reduced motion → a plain static OttoArt.
// ponytail: entrance-pop + hop are inlined here because motion.ts (P0, out of
// this packet's diff scope) has no reaction hook — see contract_gap.
export function OttoIdle({ name, reactTo, sway, size = 96 }: OttoIdleProps) {
  const reduced = useReducedMotion();
  const breatheStyle = useBreathe({ sway });
  const pop = useSharedValue(0); // 0 → grows in on mount
  const hop = useSharedValue(0);
  const [display, setDisplay] = useState<OttoArtName>(name);
  const reacting = useRef(false);

  useEffect(() => setDisplay(name), [name]);

  useEffect(() => {
    if (reduced) return;
    pop.value = withDelay(80, withSpring(1, spring.pop));
  }, [reduced, pop]);

  useEffect(() => {
    if (!reactTo || reduced) return;
    return ottoBus.on(reactTo, () => {
      if (reacting.current) return;
      reacting.current = true;
      setDisplay('excited');
      hop.value = withSequence(
        withTiming(-8, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(0, spring.pop),
      );
      setTimeout(() => {
        setDisplay(name);
        reacting.current = false;
      }, 1400);
    });
  }, [reactTo, reduced, name, hop]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }, { translateY: hop.value }],
    opacity: Math.min(1, pop.value * 1.4),
  }));

  if (reduced) return <OttoArt name={display} size={size} />;
  return (
    <Animated.View style={outerStyle}>
      <Animated.View style={breatheStyle}>
        <OttoArt name={display} size={size} />
      </Animated.View>
    </Animated.View>
  );
}
