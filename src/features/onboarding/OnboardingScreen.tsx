import React, { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bounceable, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { onboardingArt } from '@/shared/assets';
import { useOnboarded } from './useOnboarded';

// Onboarding — the 3-screen painted showcase (Figma master board / v1 parity):
// full-bleed art, a Skip door, page dots, and one CTA that advances then hands
// off to auth. Auth is REQUIRED (founder decision — no anonymous browsing): the
// final "Start cooking" opens sign-up (the new-cook path), Skip opens sign-in
// (the returning cook). Either exit marks onboarded so the gate won't repeat.
const { width } = Dimensions.get('window');

const SCENES = [
  {
    key: 'collect',
    title: 'Every recipe you love — in one place',
    body: 'Import from any site or video, or write your own — Otto keeps them all together.',
    cta: 'Continue',
  },
  {
    key: 'cook',
    title: 'Cook it right, every time',
    body: 'Step-by-step cook mode, serving sizes that scale, and a nutrition estimate for every dish.',
    cta: 'Continue',
  },
  {
    key: 'plan',
    title: 'Plan the week, shop in one tap',
    body: 'Plan your meals and Otto builds the shopping list for you.',
    cta: 'Start cooking',
  },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markOnboarded } = useOnboarded();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const leave = (route: '/(auth)/sign-up' | '/(auth)/sign-in') => async () => {
    await markOnboarded();
    router.replace(route);
  };
  const finish = leave('/(auth)/sign-up');
  const skip = leave('/(auth)/sign-in');

  const advance = async () => {
    haptics.select();
    if (page === SCENES.length - 1) return finish();
    const next = page + 1;
    const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    scroller.current?.scrollTo({ x: next * width, animated: !reduce });
    setPage(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const scene = SCENES[page];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Pressable
        onPress={skip}
        accessibilityRole="button"
        accessibilityLabel="Skip the introduction"
        style={{
          position: 'absolute',
          top: Math.max(insets.top, space[2]) + space[1],
          right: space[5],
          zIndex: 2,
          paddingHorizontal: space[3],
          paddingVertical: space[2],
        }}
      >
        <Text role="label">Skip</Text>
      </Pressable>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {SCENES.map((s) => (
          <View key={s.key} style={{ width, flex: 1 }}>
            <Image
              source={onboardingArt[s.key]}
              style={{ width: '100%', flex: 1 }}
              contentFit="contain"
              accessibilityLabel={s.title}
            />
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: space[6], paddingTop: space[3], paddingBottom: Math.max(insets.bottom, space[5]) + space[3], gap: space[4] }}>
        <View style={{ flexDirection: 'row', gap: space[2], justifyContent: 'center' }}>
          {SCENES.map((s, i) => (
            <View
              key={s.key}
              style={{
                width: i === page ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === page ? colors.terracotta : colors.border,
              }}
            />
          ))}
        </View>

        {/* Fixed text block so the CTA never scrolls with the art. */}
        <View style={{ height: 132, gap: space[2] }}>
          <Text role="display">{scene.title}</Text>
          <Text role="caption">{scene.body}</Text>
        </View>

        <Bounceable accessibilityLabel={scene.cta} onPress={advance}>
          <View
            style={{
              height: 54,
              borderRadius: radii.button,
              backgroundColor: colors.terracotta,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText style={{ color: colors.white, fontWeight: '800', fontSize: 16 }}>{scene.cta}</RNText>
          </View>
        </Bounceable>
      </View>
    </View>
  );
}
