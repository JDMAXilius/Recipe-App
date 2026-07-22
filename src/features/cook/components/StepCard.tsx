import React, { useEffect } from 'react';
import { ScrollView, Text as RNText, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { OttoArt, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { segmentStep } from '../stepEnrich';
import { stepActionArt } from '../stepAction';
import type { IngredientPair } from '../session';

interface Props {
  stepIndex: number;
  text: string;
  ingredients: IngredientPair[];
  // Tapping a duration starts a NAMED timer (label carries the step + phrase).
  onStartTimer: (label: string, minutes: number) => void;
}

// Big-type step body: the "You'll need" chips, the semantic step text (durations
// are terracotta + tappable → named timers, temps are terracotta), and Otto
// acting out the step's primary action (deterministic — stepAction).
export function StepCard({ stepIndex, text, ingredients, onStartTimer }: Props) {
  const segments = segmentStep(text);
  const hasDuration = segments.some((s) => s.type === 'duration');

  // Step-advance transition (v1 ~186-195): fade + a small slide, re-run on each
  // step change (keyed on stepIndex). Reduced motion → static, no animation.
  const reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = 0;
    enter.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [stepIndex, reduced, enter]);
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateX: (1 - enter.value) * 12 }],
  }));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: space[5] }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={enterStyle}>
      {ingredients.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] }}>
          {ingredients.slice(0, 4).map((p, i) => (
            <View
              key={`${p.name}-${i}`}
              style={{
                backgroundColor: colors.creamDeep,
                borderRadius: radii.pill,
                paddingHorizontal: space[3],
                paddingVertical: space[1],
                maxWidth: '100%',
              }}
            >
              <RNText style={{ fontSize: 13, color: colors.ink }} numberOfLines={1}>
                {`${p.measure} ${p.name}`.trim()}
              </RNText>
            </View>
          ))}
        </View>
      )}

      <RNText style={{ fontSize: 26, lineHeight: 36, color: colors.ink }}>
        {segments.map((seg, i) => {
          if (seg.type === 'duration') {
            const label = `Step ${stepIndex + 1} — ${seg.text}`;
            return (
              <RNText
                key={i}
                onPress={() => onStartTimer(label, seg.minutes)}
                suppressHighlighting
                accessibilityRole="button"
                accessibilityLabel={`Start a ${seg.text} timer`}
                style={{ color: colors.terracotta, fontWeight: '800' }}
              >
                {` ◷ ${seg.text} `}
              </RNText>
            );
          }
          if (seg.type === 'temp') {
            return (
              <RNText key={i} style={{ color: colors.terracotta, fontWeight: '800' }}>
                {seg.text}
              </RNText>
            );
          }
          return <RNText key={i}>{seg.text}</RNText>;
        })}
      </RNText>

      {hasDuration && (
        <View style={{ marginTop: space[3] }}>
          <Text role="caption">Tap a time to start a timer</Text>
        </View>
      )}

      <View style={{ alignItems: 'center', marginTop: space[6] }}>
        <OttoArt name={stepActionArt(text)} size={220} />
      </View>
      </Animated.View>
    </ScrollView>
  );
}
