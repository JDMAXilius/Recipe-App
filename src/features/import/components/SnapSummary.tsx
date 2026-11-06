import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { describePortion, describeYield } from '@/shared/yield';
import type { RecipeSize, SnapInfo } from '../draft';

// What a meal scan worked out, above the editable recipe: the batch it makes,
// the portion in the photo, what Otto saw, and anything it isn't sure about.
// Nothing here is hidden or rounded away: uncertain chips and unresolved
// checks are shown as such (honesty laws).
const card: ViewStyle = { backgroundColor: colors.creamDeep, borderRadius: radii.card, padding: space[4], gap: space[3], marginBottom: space[4] };
const chipRow: ViewStyle = { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] };
const chip = (sure: boolean): ViewStyle => ({
  paddingHorizontal: space[3],
  paddingVertical: space[1],
  borderRadius: radii.pill,
  backgroundColor: sure ? colors.accentSoft : colors.white,
  borderWidth: 1,
  borderColor: sure ? colors.accentSoft : colors.grayStrong,
});
const line: ViewStyle = { flexDirection: 'row', gap: space[2], alignItems: 'flex-start' };

export function SnapSummary({ snap, size, servings }: { snap: SnapInfo; size: RecipeSize | null; servings: number }) {
  const s = { count: servings, unit: size?.servingUnit ?? 'serving' };
  return (
    <View style={card} accessibilityLabel="What Otto worked out from your photo">
      <View style={{ gap: space[1] }}>
        {size && <Text role="title">{describeYield(size.yield, s)}</Text>}
        <Text role="body">{describePortion(snap.portion, s)}</Text>
      </View>

      {snap.seen.length > 0 && (
        <View style={{ gap: space[2] }}>
          <Text role="meta">OTTO SEES</Text>
          <View style={chipRow}>
            {snap.seen.map((item) => (
              <View key={item.name} style={chip(item.confident)}>
                <Text role="caption">{item.confident ? item.name : `${item.name}?`}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {[...snap.questions, ...snap.checks].map((text) => (
        <View key={text} style={line}>
          <Ionicons name="help-circle-outline" size={18} color={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text role="caption">{text}</Text>
          </View>
        </View>
      ))}

      {snap.assumptions.length > 0 && (
        <Text role="caption">Otto assumed: {snap.assumptions.join(' · ')}</Text>
      )}
      {snap.closest && <Text role="caption">Close to Otto’s {snap.closest.title} in the cookbook.</Text>}
    </View>
  );
}
