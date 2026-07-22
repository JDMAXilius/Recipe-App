import React, { useState } from 'react';
import { Platform, Pressable, Switch, View, type ViewStyle } from 'react-native';
import { Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { Screen } from './components/Frame';

// Reminders — local and opt-in, both default OFF (Otto is the quiet kind).
// The only notifications Otto sends are ones this phone can know by itself.
// ponytail: the native scheduler (expo-notifications) isn't an installed
// dependency yet — toggles hold intent in session state and the copy says
// reminders arrive with the phone build. Wire scheduling when the module lands.
const TONIGHT_HOURS = [16, 17, 18, 19] as const;
const hourLabel = (h: number) => `${h > 12 ? h - 12 : h}pm`;

export function NotificationsScreen() {
  const { show } = useToast();
  const [tonight, setTonight] = useState(false);
  const [tonightHour, setTonightHour] = useState<number>(17);
  const [sunday, setSunday] = useState(false);

  const flip = (on: boolean, set: (v: boolean) => void) => {
    if (on) show('Reminders live on the phone app — this is the preview.', 'info');
    set(on);
  };

  return (
    <Screen title="Reminders">
      <View style={{ gap: space[3] }}>
        <Text role="caption">
          Everything here lives on this phone — Otto only reminds you about things the phone already
          knows, and both nudges start off.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text role="body">Tonight&apos;s dinner</Text>
              <Text role="caption">On days you planned something — one nudge, with the dish name.</Text>
            </View>
            <Switch
              value={tonight}
              onValueChange={(v) => flip(v, setTonight)}
              trackColor={{ true: colors.terracotta, false: colors.creamDeep }}
              thumbColor={colors.white}
              accessibilityLabel="Tonight's dinner reminder"
            />
          </View>
          {tonight && (
            <View style={styles.hourRow}>
              {TONIGHT_HOURS.map((h) => {
                const on = tonightHour === h;
                return (
                  <Pressable
                    key={h}
                    style={[styles.hourChip, on && styles.hourChipOn]}
                    onPress={() => setTonightHour(h)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Remind at ${hourLabel(h)}`}
                  >
                    <Text role={on ? 'computed' : 'caption'}>{hourLabel(h)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text role="body">Sunday planning nudge</Text>
              <Text role="caption">Sunday, 9am — a fresh week, a gentle poke.</Text>
            </View>
            <Switch
              value={sunday}
              onValueChange={(v) => flip(v, setSunday)}
              trackColor={{ true: colors.terracotta, false: colors.creamDeep }}
              thumbColor={colors.white}
              accessibilityLabel="Sunday planning nudge"
            />
          </View>
        </View>

        {Platform.OS === 'web' && (
          <Text role="caption">Reminders arrive on the phone app — this preview can&apos;t buzz.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles: Record<string, ViewStyle> = {
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: space[4], gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rowBody: { flex: 1, gap: space[1] },
  hourRow: { flexDirection: 'row', gap: space[2] },
  hourChip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    minHeight: 44,
    justifyContent: 'center',
  },
  hourChipOn: { backgroundColor: colors.creamDeep },
};
