// ParallaxHero — the detail screen's photo with the classic depth trick: as
// the page scrolls the image translates at ~0.5× the offset (slower than the
// content, so it reads as a deeper layer) and scales up on pull-down
// overscroll. Driven by core RN Animated transforms — the repo law in
// src/shared/motion.ts: reanimated LAYOUT animations break web, simple
// transforms ride RN Animated. The wrapper keeps the old fixed hero height
// with overflow hidden, so layout is identical to the static <Image> it
// replaces — only pixels inside the frame move. Both interpolations clamp at
// their range edges so momentum overshoot can't produce jumps (iOS + web).
// Reduced motion (mandatory, per motion.ts): the photo renders static.
import React from 'react';
import { Animated, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { colors } from '@/shared/theme/tokens';
import { foodIcon } from '@/shared/assets';

const HERO_HEIGHT = 280; // photo hero (unchanged from the static v3 layout)

export interface ParallaxHeroProps {
  image: string | null;
  /** Category drives the painted-art default when there's no photo (own art — no licensing). */
  category?: string | null;
  /** The detail screen's Animated scroll offset (contentOffset.y). */
  scrollY: Animated.Value;
}

export function ParallaxHero({ image, category, scrollY }: ParallaxHeroProps) {
  const reduced = useReducedMotion();

  // No photo → the painted category art IS the hero (founder call 2026-07-24):
  // same full-bleed height, same parallax, so a photo-less recipe never feels
  // second-class. Local asset vs uri is the only difference.
  const source = image ? { uri: image } : foodIcon(category ?? '');

  const transform = reduced
    ? []
    : [
        {
          // Scroll down → the image drifts down inside its clipped frame at
          // half the content's speed (the parallax). Clamped: pull-down stays
          // at 0 (scale below owns that gesture) and past one hero-height the
          // frame is offscreen anyway.
          translateY: scrollY.interpolate({
            inputRange: [0, HERO_HEIGHT],
            outputRange: [0, HERO_HEIGHT * 0.5],
            extrapolate: 'clamp',
          }),
        },
        {
          // Pull-down overscroll → a centred zoom (1 → 1.5 across a full
          // hero-height of pull; a typical rubber-band pull lands ~1.1–1.2).
          // The centred scale overflows the frame on both edges, so no cream
          // gap ever shows. Clamped both ways: normal scrolling stays at 1.
          scale: scrollY.interpolate({
            inputRange: [-HERO_HEIGHT, 0],
            outputRange: [1.5, 1],
            extrapolate: 'clamp',
          }),
        },
      ];

  return (
    <View style={{ width: '100%', height: HERO_HEIGHT, overflow: 'hidden', backgroundColor: colors.creamDeep }}>
      <Animated.Image
        source={source}
        resizeMode="cover"
        style={{ width: '100%', height: HERO_HEIGHT, transform }}
      />
    </View>
  );
}
