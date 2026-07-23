// Motion hooks (contract: ui-components.md §2). The ONLY place a spring/timing
// config from tokens.ts is consumed — components never inline one. Every hook is
// reduced-motion aware (mandatory): it degrades gracefully instead of animating.
import { useEffect, useState } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spring, timing } from './theme/tokens';

// Press-feedback spring (Bounceable core): scale → 0.97 on press. Reduced motion
// → a simple opacity dip, no scale.
export function usePressSpring() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const dim = useSharedValue(0);
  const style = useAnimatedStyle(() =>
    reduced ? { opacity: 1 - dim.value * 0.15 } : { transform: [{ scale: scale.value }] },
  );
  const onPressIn = () => {
    if (reduced) dim.value = 1;
    else scale.value = withSpring(0.97, spring.snappy);
  };
  const onPressOut = () => {
    if (reduced) dim.value = 0;
    else scale.value = withSpring(1, spring.snappy);
  };
  return { style, onPressIn, onPressOut };
}

// OttoIdle breathing loop: ±1.5% scale, −2px rise, optional ±1.2° sway, ~4.2s/breath.
export function useBreathe({ sway = false }: { sway?: boolean } = {}) {
  const reduced = useReducedMotion();
  const b = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    b.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(b);
  }, [reduced, b]);
  return useAnimatedStyle(() => {
    if (reduced) return {};
    const scale = { scale: 1 + b.value * 0.015 };
    const rise = { translateY: -2 * b.value };
    return sway
      ? { transform: [scale, rise, { rotate: `${(b.value - 0.5) * 2.4}deg` }] }
      : { transform: [scale, rise] };
  });
}

// A one-shot pop: scale 1 → 1.25 → 1 (spring.pop). PawMark's save feedback.
// Returns the animated style + a trigger; reduced motion → no-op (caller keeps
// its haptic). One home for the pop, out of the component.
export function usePop() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pop = () => {
    if (!reduced) scale.value = withSequence(withSpring(1.25, spring.pop), withSpring(1, spring.pop));
  };
  return { style, pop };
}

// OttoIdle's entrance pop (on mount, delay 80) + a hop trigger (−8→0). Returns
// the outer transform style + a hop(). The mascot ORCHESTRATION (bus + art swap)
// stays in OttoIdle; the animation lives here. Reduced motion → static (scale 1).
export function useEntranceHop() {
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0);
  const hopV = useSharedValue(0);
  useEffect(() => {
    if (!reduced) pop.value = withDelay(80, withSpring(1, spring.pop));
  }, [reduced, pop]);
  const hop = () => {
    if (!reduced) {
      hopV.value = withSequence(
        withTiming(-8, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(0, spring.pop),
      );
    }
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }, { translateY: hopV.value }],
    opacity: Math.min(1, pop.value * 1.4),
  }));
  return { style, hop };
}

// Count-up for the CalorieRing: 0 → target, ease-out cubic. Plain rAF (a displayed
// number, not a transform). Reduced motion / non-finite → the value, immediately.
export function useCountUp(target: number | null, ms: number = timing.sweep): number | null {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState<number | null>(target);
  useEffect(() => {
    if (target == null || !Number.isFinite(target) || reduced) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start == null) start = now;
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduced]);
  return display;
}
