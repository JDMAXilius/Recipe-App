import React from 'react';
import { Text as RNText, View, type ViewStyle } from 'react-native';
import { colors, fonts, space } from '../theme/tokens';
import { formatCount } from '../lib/format';
import { Text } from './Text';

export interface RingProps {
  value: number | null;
  // Omit for a max-less display (value + label only, no "/ max"). Nutrition
  // forbids daily-goal framing, so CalorieRing passes no max (contract).
  max?: number;
  label: string;
}

// SVG-free ring (react-native-svg is not a dependency): a bordered circle with
// the computed value centered. Honesty law (contract rule 4): null renders a
// visible em-dash and a muted ring — never a fabricated 0.
// ponytail: no proportional arc without SVG; upgrade to a real progress arc
// when/if react-native-svg lands.
const SIZE = 96;

const circle: ViewStyle = {
  width: SIZE,
  height: SIZE,
  borderRadius: SIZE / 2,
  borderWidth: 8,
  alignItems: 'center',
  justifyContent: 'center',
};

export function Ring({ value, max, label }: RingProps) {
  const hasData = value != null && Number.isFinite(value);
  const valueLabel = hasData ? (max != null ? `${value} of ${max}` : `${value}`) : 'no data';
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${valueLabel}`}
      style={{ alignItems: 'center' }}
    >
      <View
        style={[circle, { borderColor: hasData ? colors.terracotta : colors.creamDeep }]}
      >
        <RNText
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            fontWeight: '600',
            color: hasData ? colors.terracotta : colors.inkSoft,
          }}
        >
          {formatCount(value)}
        </RNText>
        {max != null && <RNText style={{ fontSize: 11, color: colors.inkSoft }}>/ {max}</RNText>}
      </View>
      <View style={{ marginTop: space[2] }}>
        <Text role="caption">{label}</Text>
      </View>
    </View>
  );
}
