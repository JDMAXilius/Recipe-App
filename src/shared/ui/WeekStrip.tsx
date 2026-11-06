// Seven real dates, tonight first (D1.4). A dot marks a day with something
// planned; a tap opens that day. Presentational: the caller owns the data.
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './Text';
import { colors, radii, space } from '../theme/tokens';
import { haptics } from '../haptics';

export interface StripDay {
  key: string;
  label: string; // "Today", "Tomorrow", "Thursday"
  sub: string; // "Nov 6"
  planned: number;
}

export function WeekStrip({ days, onPress }: { days: readonly StripDay[]; onPress: (key: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
      {days.map((d, i) => (
        <Pressable
          key={d.key}
          onPress={() => {
            haptics.select();
            onPress(d.key);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${d.label}, ${d.sub}: ${d.planned ? `${d.planned} planned` : 'open'}`}
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
          <Text role="meta">{i === 0 ? 'Today' : d.label.slice(0, 3)}</Text>
          <Text role="body">{d.sub.replace(/^\D+/, '')}</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.planned ? colors.terracotta : 'transparent' }} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
