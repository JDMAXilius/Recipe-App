import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Switch, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Text, Button } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useNotifPrefs } from './useNotifPrefs';
import { TONIGHT_HOURS } from './notifications.logic';
import { ensurePermission } from './notifications.queries';

// Reminders — local, opt-in, both default OFF (Otto is the quiet kind). The
// only notifications Otto sends are ones this phone already knows: a nudge on
// days you planned a dish, and a Sunday poke to plan the week. The actual
// scheduling re-syncs at the root (NotifSync in app/_layout) whenever the prefs
// or the week change — so this screen only edits the prefs.
const hourLabel = (h: number) => `${h > 12 ? h - 12 : h}pm`;

export function NotificationsScreen() {
  const router = useRouter();
  const prefs = useNotifPrefs();
  const [denied, setDenied] = useState(false);

  // Turning a reminder ON needs OS permission first; denial keeps the toggle
  // off and surfaces the Settings path.
  const enable = async (turnOn: () => void) => {
    const ok = await ensurePermission();
    if (!ok) {
      setDenied(true);
      return;
    }
    setDenied(false);
    turnOn();
  };

  const onTonight = (v: boolean) => (v ? void enable(() => prefs.setTonight(true)) : prefs.setTonight(false));
  const onSunday = (v: boolean) => (v ? void enable(() => prefs.setSunday(true)) : prefs.setSunday(false));

  const onBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <Screen title="Reminders" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ gap: space[3] }}>
          <Text role="caption">
            Everything here lives on this phone — Otto only reminds you about things the phone already
            knows, and both nudges start off.
          </Text>

          {denied && (
            <View style={styles.card}>
              <Text role="body">Notifications are off for Otto</Text>
              <Text role="caption">
                Turn them on in Settings and Otto can nudge you about tonight&apos;s dinner.
              </Text>
              <Button
                title="Open Settings"
                variant="secondary"
                onPress={() => {
                  void Linking.openSettings();
                }}
              />
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="moon-outline" size={20} color={colors.inkSoft} />
              <View style={styles.rowBody}>
                <Text role="body">Tonight&apos;s dinner</Text>
                <Text role="caption">On days you planned something — one nudge, with the dish name.</Text>
              </View>
              <Switch
                value={prefs.tonight}
                onValueChange={onTonight}
                trackColor={{ true: colors.terracotta, false: colors.creamDeep }}
                thumbColor={colors.white}
                accessibilityLabel="Tonight's dinner reminder"
              />
            </View>
            {prefs.tonight && (
              <View style={styles.hourRow}>
                {TONIGHT_HOURS.map((h) => {
                  const on = prefs.hour === h;
                  return (
                    <Pressable
                      key={h}
                      style={[styles.hourChip, on && styles.hourChipOn]}
                      onPress={() => prefs.setHour(h)}
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
              <Ionicons name="calendar-outline" size={20} color={colors.inkSoft} />
              <View style={styles.rowBody}>
                <Text role="body">Sunday planning nudge</Text>
                <Text role="caption">Sunday, 9am — a fresh week, a gentle poke.</Text>
              </View>
              <Switch
                value={prefs.sunday}
                onValueChange={onSunday}
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
      </ScrollView>
    </Screen>
  );
}

const styles: Record<string, ViewStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
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
