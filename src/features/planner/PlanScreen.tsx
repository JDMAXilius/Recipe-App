import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button, OttoArt, OttoLoading, useToast } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { usePlan } from './usePlan';
import { RecipePickerSheet } from './components/RecipePickerSheet';
import { pickToAddInput, leftoversCarry, nextInWeek, type PickItem } from './plan.pick';
import type { PlanEntry } from './plan.types';

// A picker target: which day the pick lands on, and (for a swap) the entry it
// replaces. entryId absent = plain add; present = swap that slot.
interface PickerTarget {
  day: string;
  entryId?: number;
}

// Otto's week (roadmap Phase 4): vertical day cards, LOOSE buckets — no meal
// slots, no gray guilt. Empty days are painted invitations. Light "Cooked it"
// state; the shopping list is built from here. Adding a dish to a day is the
// recipes feature's job (recipes → usePlan().add), so this screen is the
// week's home: view, mark cooked, remove, build the list.

export function PlanScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { entries, days, isLoading, add, remove, swap, setCooked } = usePlan();
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const byDay: Record<string, PlanEntry[]> = {};
  for (const e of entries) {
    const dayKey = String(e.day).slice(0, 10);
    (byDay[dayKey] = byDay[dayKey] || []).push(e);
  }
  const planned = entries.length;

  const toggleCooked = async (entry: PlanEntry) => {
    haptics.select();
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

  // Picker resolves to an add (new dish on a day) or a swap (replace a slot).
  const onPick = async (pick: PickItem) => {
    const target = picker;
    setPicker(null);
    if (!target) return;
    try {
      const input = pickToAddInput(pick, target.day);
      if (target.entryId != null) await swap(target.entryId, input);
      else await add(input);
      haptics.notify('success');
    } catch {
      show("Couldn't update Otto's week — try again.", 'error');
    }
  };

  // Cook once, eat twice: carry a dish to tomorrow tagged as leftovers.
  const carryLeftovers = async (entry: PlanEntry, entryDay: string) => {
    const nextDay = nextInWeek(entryDay, days);
    if (!nextDay) return;
    const input = leftoversCarry(entry, nextDay);
    if (!input) return;
    try {
      await add(input);
      haptics.notify('success');
    } catch {
      show("Couldn't add leftovers — try again.", 'error');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
        <OttoLoading message="Checking Otto's week…" />
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
                dayEntries.map((entry) => {
                  const canCarry = Boolean(entry.recipe_id) && nextInWeek(day.key, days) != null;
                  return (
                    <View key={entry.id}>
                      <View style={styles.entryRow}>
                        <Pressable
                          style={styles.entryMain}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${entry.title}`}
                          onPress={() => entry.recipe_id && router.push(`/recipe/${entry.recipe_id}`)}
                        >
                          {entry.image ? (
                            <Image source={{ uri: entry.image }} style={styles.thumb as ImageStyle} />
                          ) : (
                            <View style={styles.thumb} />
                          )}
                          <View style={{ flex: 1 }}>
                            <RNText
                              style={{
                                ...type.body,
                                color: colors.ink,
                                textDecorationLine: entry.cooked ? 'line-through' : 'none',
                              }}
                            >
                              {entry.title}
                            </RNText>
                            {entry.note === 'leftovers' && <Text role="caption">Leftovers</Text>}
                          </View>
                        </Pressable>

                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: Boolean(entry.cooked) }}
                          accessibilityLabel={entry.cooked ? 'Cooked — tap to unmark' : 'Mark as cooked'}
                          hitSlop={8}
                          onPress={() => toggleCooked(entry)}
                          style={[styles.cookedMark, entry.cooked && styles.cookedMarkOn]}
                        >
                          <View style={styles.iconLabel}>
                            <Ionicons
                              name={entry.cooked ? 'flame' : 'flame-outline'}
                              size={14}
                              color={entry.cooked ? colors.terracotta : colors.inkSoft}
                            />
                            <Text role={entry.cooked ? 'computed' : 'caption'}>
                              {entry.cooked ? 'Cooked' : 'Cooked?'}
                            </Text>
                          </View>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${entry.title} from ${day.label}`}
                          hitSlop={8}
                          onPress={() => removeEntry(entry)}
                        >
                          <Ionicons name="close" size={18} color={colors.inkSoft} />
                        </Pressable>
                      </View>

                      <View style={styles.entryActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Swap ${entry.title}`}
                          hitSlop={6}
                          onPress={() => {
                            haptics.select();
                            setPicker({ day: day.key, entryId: entry.id });
                          }}
                        >
                          <View style={styles.iconLabel}>
                            <Ionicons name="shuffle" size={14} color={colors.terracotta} />
                            <Text role="computed">Swap</Text>
                          </View>
                        </Pressable>
                        {canCarry && entry.note !== 'leftovers' && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${entry.title} as leftovers tomorrow`}
                            hitSlop={6}
                            onPress={() => carryLeftovers(entry, day.key)}
                          >
                            <View style={styles.iconLabel}>
                              <Ionicons name="refresh" size={14} color={colors.terracotta} />
                              <Text role="computed">Leftovers tomorrow</Text>
                            </View>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add a dish to ${day.label}`}
                hitSlop={6}
                style={styles.addRow}
                onPress={() => {
                  haptics.select();
                  setPicker({ day: day.key });
                }}
              >
                <View style={styles.iconLabel}>
                  <Ionicons name="add" size={18} color={colors.terracotta} />
                  <Text role="computed">Add a dish</Text>
                </View>
              </Pressable>
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

      <RecipePickerSheet
        visible={picker != null}
        title={picker?.entryId != null ? 'Swap in a dish' : "What's cooking?"}
        onPick={onPick}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
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
  entryMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[3] },
  thumb: { width: 40, height: 40, borderRadius: radii.button, backgroundColor: colors.creamDeep },
  entryActions: {
    flexDirection: 'row',
    gap: space[4],
    paddingBottom: space[2],
    paddingLeft: space[1],
  },
  addRow: { paddingTop: space[2] },
  iconLabel: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  cookedMark: {
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  cookedMarkOn: { backgroundColor: colors.creamDeep },
  emptyWeek: { alignItems: 'center', gap: space[3], marginTop: space[5] },
};
