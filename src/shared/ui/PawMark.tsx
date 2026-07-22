import React from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, shadow, spring } from '../theme/tokens';
import { usePressSpring } from '../motion';
import { haptics } from '../haptics';
import { paw } from '../assets';

export interface PawMarkProps {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}

// PRESENTATIONAL ONLY (contract §6). Real paw art in a circle; press feedback +
// a pop on save + a success haptic on false→true. It does NOT own the save flow
// (no useSaved import) — the anon-wall / first-save / undo live in the feature
// hook that hands `saved`/`onToggle` down.
// ponytail: the 1.25→1 save-pop is inlined because motion.ts has no pop hook —
// see contract_gap. Press dip goes through usePressSpring (one home).
export function PawMark({ saved, onToggle, size = 36 }: PawMarkProps) {
  const reduced = useReducedMotion();
  const press = usePressSpring();
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const pad = Math.max(0, (44 - size) / 2); // hit target ≥ 44pt

  const handle = () => {
    if (!saved) {
      haptics.notify('success'); // a save (false→true); stays under reduced motion
      if (!reduced) pop.value = withSequence(withSpring(1.25, spring.pop), withSpring(1, spring.pop));
    }
    onToggle();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Saved — remove from cookbook' : 'Save to cookbook'}
      accessibilityState={{ selected: saved }}
      onPress={handle}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={pad}
    >
      <Animated.View style={press.style}>
        <Animated.View
          style={[
            popStyle,
            {
              width: size,
              height: size,
              borderRadius: radii.pill,
              backgroundColor: colors.white,
              alignItems: 'center',
              justifyContent: 'center',
            },
            shadow.card,
          ]}
        >
          <View style={{ width: size * 0.6, height: size * 0.6 }}>
            <Image
              source={saved ? paw.filled : paw.outline}
              accessible={false}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={120}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
