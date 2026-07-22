import React from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, OttoArt, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { usePlan } from './usePlan';
import type { PlanEntry } from './plan.types';

// Otto's week (roadmap Phase 4): vertical day cards, LOOSE buckets — no meal
// slots, no gray guilt. Empty days are painted invitations. Light "Cooked it"
// state; the shopping list is built from here. Adding a dish to a day is the
// recipes feature's job (recipes → usePlan().add), so this screen is the
// week's home: view, mark cooked, remove, build the list.

export function PlanScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { entries, days, isLoading, remove, setCooked } = usePlan();

  const byDay: Record<string, PlanEntry[]> = {};
  for (const e of entries) {
    const dayKey = String(e.day).slice(0, 10);
    (byDay[dayKey] = byDay[dayKey] || []).push(e);
  }
  const planned = entries.length;

  const toggleCooked = async (entry: PlanEntry) => {
    try {
      await setCooked(entry.id, !entry.cooked);
    } catch {
      show("Couldn't mark that — try again.", 'error');
    }
  };

  const removeEntry = async (entry: PlanEntry) => {
    try {
      await remove(entry.id);
    } catch {
      show("Couldn't remove that — try again.", 'error');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text role="display">Otto&apos;s week</Text>
        {planned > 0 && (
          <Text role="caption">
            {planned} {planned === 1 ? 'dish' : 'dishes'} planned
          </Text>
        )}
      </View>

      {planned > 0 && (
        <View style={{ marginBottom: space[4] }}>
          <Button
            title="Build my list from this week"
            variant="primary"
            onPress={() => router.push('/shopping')}
          />
        </View>
      )}

      {isLoading ? (
        <Text role="caption">Checking Otto&apos;s week…</Text>
      ) : (
        days.map((day, index) => {
          const dayEntries = byDay[day.key] || [];
          return (
            <View key={day.key} style={[styles.dayCard, index === 0 && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <Text role="title">{day.label}</Text>
                <View style={{ flex: 1 }} />
                <Text role="caption">{day.sub}</Text>
              </View>

              {dayEntries.length === 0 ? (
                <Text role="caption">
                  {index === 0 ? "Nothing yet — Otto's happy to improvise." : 'Open — no plans, no guilt.'}
                </Text>
              ) : (
                dayEntries.map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    <Pressable
                      style={styles.entryMain}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${entry.title}`}
                      onPress={() => entry.recipe_id && router.push(`/recipe/${entry.recipe_id}`)}
                    >
                      <Text role="body">{entry.title}</Text>
                      {entry.note === 'leftovers' && <Text role="caption">Leftovers</Text>}
                    </Pressable>

                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: Boolean(entry.cooked) }}
                      accessibilityLabel={entry.cooked ? 'Cooked — tap to unmark' : 'Mark as cooked'}
                      hitSlop={8}
                      onPress={() => toggleCooked(entry)}
                      style={[styles.cookedMark, entry.cooked && styles.cookedMarkOn]}
                    >
                      <Text role={entry.cooked ? 'computed' : 'caption'}>
                        {entry.cooked ? '✓ Cooked' : 'Cooked?'}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${entry.title} from ${day.label}`}
                      hitSlop={8}
                      onPress={() => removeEntry(entry)}
                    >
                      <Text role="caption">✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          );
        })
      )}

      {!isLoading && planned === 0 && (
        <View style={styles.emptyWeek}>
          <OttoArt name="happy" size={120} />
          <Text role="body">
            Pick something from your cookbook — tonight in one tap, a list in ten seconds.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles: Record<string, ViewStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
  header: { marginBottom: space[4] },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
    marginBottom: space[3],
  },
  dayCardToday: { backgroundColor: colors.creamDeep },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: space[2] },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
  },
  entryMain: { flex: 1 },
  cookedMark: {
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  cookedMarkOn: { backgroundColor: colors.creamDeep },
  emptyWeek: { alignItems: 'center', gap: space[3], marginTop: space[5] },
};
