import React, { useEffect, useRef, useState } from 'react';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useBreathe, useEntranceHop } from '../motion';
import { ottoBus } from '../bus';
import { OttoArt, type OttoArtName } from './OttoArt';

export interface OttoIdleProps {
  name: OttoArtName;
  reactTo?: 'save';
  sway?: boolean;
  size?: number;
}

// Living Otto (spec §5). Breathing loop + entrance pop + a hop to the excited
// expression when its bus event fires (one reaction at a time, restore @1400ms).
// All animation comes from motion.ts hooks (one home); this file owns only the
// mascot orchestration — bus subscription + art swap. Reduced motion → static.
export function OttoIdle({ name, reactTo, sway, size = 96 }: OttoIdleProps) {
  const reduced = useReducedMotion();
  const breatheStyle = useBreathe({ sway });
  const { style: outerStyle, hop } = useEntranceHop();
  const [display, setDisplay] = useState<OttoArtName>(name);
  const reacting = useRef(false);

  useEffect(() => setDisplay(name), [name]);

  useEffect(() => {
    if (!reactTo || reduced) return;
    return ottoBus.on(reactTo, () => {
      if (reacting.current) return;
      reacting.current = true;
      setDisplay('excited');
      hop();
      setTimeout(() => {
        setDisplay(name);
        reacting.current = false;
      }, 1400);
    });
  }, [reactTo, reduced, name, hop]);

  if (reduced) return <OttoArt name={display} size={size} />;
  return (
    <Animated.View style={outerStyle}>
      <Animated.View style={breatheStyle}>
        <OttoArt name={display} size={size} />
      </Animated.View>
    </Animated.View>
  );
}
