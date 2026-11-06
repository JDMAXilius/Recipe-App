// Seven real dates, tonight first (D1.4). A dot marks a day with something
// planned; a tap hands the caller that day's key. Presentational: the caller owns the data.
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './Text';
import { colors, radii, space } from '../theme/tokens';
import { haptics } from '../haptics';

export interface StripDay {
  key: string; // YYYY-MM-DD
  planned: number;
}

// Built from the date itself, so every locale reads right ("Thu" + "6").
const dateOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function WeekStrip({ days, onPress }: { days: readonly StripDay[]; onPress: (key: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
      {days.map((d, i) => {
        const date = dateOf(d.key);
        const day = i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' });
        const long = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString(undefined, { weekday: 'long' });
        return (
        <Pressable
          key={d.key}
          onPress={() => {
            haptics.select();
            onPress(d.key);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${long}, ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${d.planned ? `${d.planned} planned` : 'open'}`}
          style={{
            minWidth: 64,
            minHeight: 64,
            paddingHorizontal: space[3],
            paddingVertical: space[2],
            borderRadius: radii.card,
            backgroundColor: i === 0 ? colors.accentSoft : colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Text role="meta">{day}</Text>
          <Text role="body">{String(date.getDate())}</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.planned ? colors.terracotta : 'transparent' }} />
        </Pressable>
        );
      })}
    </ScrollView>
  );
}
