import React, { useEffect, useRef, useState } from 'react';
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
import { Text, Button, OttoIdle, OttoLoading, OttoError, useToast } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { sound } from '@/shared/sound';
import { colors, radii, shadow, space, type } from '@/shared/theme/tokens';
import { usePlan } from './usePlan';
import { RecipePickerSheet } from './components/RecipePickerSheet';
import { PlanAgentSheet } from './components/PlanAgentSheet';
import { useQueryClient } from '@tanstack/react-query';
import { entryToInput, pickToAddInput, leftoversCarry, nextInWeek, type PickItem } from './plan.pick';
import { isLeftover, MEAL_LABELS, positionAtEnd, sortDay } from './plan.list';
import { showActionSheet } from '@/shared/actionSheet';
import { flags } from '@/shared/flags';
import type { AddPlanInput, PlanEntry } from './plan.types';
import { track } from '@/shared/track';

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

/** planMyWeek (R4.4, composed by the route): dinners for the empty days,
 *  built with the first-week rules from the person's answers. */
export interface PlanScreenProps {
  planMyWeek?: (emptyDays: string[], planned: string[]) => Promise<AddPlanInput[]>;
  /** Inside PlanTab (R4.5): the tab owns the top inset, and "Shopping list"
   *  switches the segment instead of pushing /shopping. */
  embedded?: boolean;
  onOpenShopping?: () => void;
}

export function PlanScreen({ planMyWeek, embedded, onOpenShopping }: PlanScreenProps = {}) {
  const router = useRouter();
  const { show } = useToast();
  const { entries, days, isLoading, isError, isSuccess, refetch, add, remove, swap, setCooked, setLabel, move } =
    usePlan();
  const [planning, setPlanning] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  // 1.2 (flags.agent): the plan agent's sheet.
  const [agentOpen, setAgentOpen] = useState(false);
  const qc = useQueryClient();

  const byDay: Record<string, PlanEntry[]> = {};
  for (const e of entries) {
    const dayKey = String(e.day).slice(0, 10);
    (byDay[dayKey] = byDay[dayKey] || []).push(e);
  }
  const planned = entries.length;

  // MOMENT 4 (motion.md §4): every day of the week has a dish. Fires once on
  // the crossing — arming on the first observation, so opening an already-full
  // week is a memory, not a moment.
  //
  // A celebration is Otto + haptic + chime + a warm line — with
  // only the last two, the whole moment collapses to one anonymous buzz under
  // reduced motion or Sounds-off, indistinguishable from an error. The toast
  // carries the visual half and survives both off-ramps.
  const weekFull = days.length > 0 && days.every((d) => (byDay[d.key]?.length ?? 0) > 0);
  const weekCelebrated = useRef<boolean | null>(null);
  useEffect(() => {
    // isSuccess, not !isLoading: an optimistic add that later rolls back must
    // not congratulate anyone, and an errored week must not arm anything.
    if (!isSuccess) return;
    if (weekCelebrated.current === null) {
      weekCelebrated.current = weekFull;
      return;
    }
    if (weekFull && !weekCelebrated.current) {
      haptics.notify('success');
      sound.play('allDone');
      show("Seven days, seven dinners. Otto's set.", 'success', { ottoImage: 'excited' });
    }
    weekCelebrated.current = weekFull;
  }, [weekFull, isSuccess, show]);

  const toggleCooked = async (entry: PlanEntry) => {
    haptics.select();
    try {
      await setCooked(entry.id, !entry.cooked);
      if (!entry.cooked) track('item_cooked', { source: 'plan', via: 'button' });
    } catch {
      show("Couldn't mark that. Try again.", 'error');
    }
  };

  const removeEntry = async (entry: PlanEntry) => {
    try {
      await remove(entry.id);
      haptics.impact('light'); // a commit (motion.md §2) — add/carry already do
      // Undo puts it back where it was (a new row, so not marked cooked). flowV2:
      // the free-list columns (label, kind, place) only exist there.
      const back = flags.flowV2 ? entryToInput(entry) : null;
      if (back)
        show(`${entry.title} off the plan.`, 'info', {
          actionLabel: 'Undo',
          onAction: () => void add(back).catch(() => show("Couldn't put it back. Add it again from the day.", 'error')),
        });
    } catch {
      show("Couldn't remove that. Try again.", 'error');
    }
  };

  // R4.2: one sheet for everything a dish can do (long-press, flowV2).
  const dishActions = async (entry: PlanEntry, entryDay: string) => {
    const canCarry = Boolean(entry.recipe_id) && nextInWeek(entryDay, days) != null && !isLeftover(entry);
    const items: { label: string; run: () => unknown }[] = [
      { label: entry.cooked ? 'Not cooked yet' : 'Cooked it', run: () => toggleCooked(entry) },
      { label: 'Swap', run: () => setPicker({ day: entryDay, entryId: entry.id }) },
      { label: 'Move to another day', run: () => moveEntry(entry) },
      ...(canCarry ? [{ label: 'Leftovers tomorrow', run: () => carryLeftovers(entry, entryDay) }] : []),
      { label: entry.label ? 'Change label' : 'Add a label', run: () => chooseLabel(entry) },
      { label: 'Remove', run: () => removeEntry(entry) },
    ];
    const i = await showActionSheet({ title: entry.title, options: items.map((x) => x.label), destructiveIndex: items.length - 1 });
    if (i != null) void items[i].run();
  };

  const moveEntry = async (entry: PlanEntry) => {
    const others = days.filter((d) => d.key !== String(entry.day).slice(0, 10));
    const i = await showActionSheet({ title: `Move ${entry.title} to…`, options: others.map((d) => `${d.label} · ${d.sub}`) });
    if (i == null) return;
    const to = others[i].key;
    try {
      await move(entry.id, to, positionAtEnd(sortDay(byDay[to] || [])));
      haptics.select();
    } catch {
      show("Couldn't move that. Try again.", 'error');
    }
  };

  // R4.4: fill only the empty days, never touching what's planned.
  const emptyDays = days.filter((d) => (byDay[d.key]?.length ?? 0) === 0).map((d) => d.key);
  const ottoPlans = async () => {
    if (!planMyWeek || emptyDays.length === 0) return;
    setPlanning(true);
    try {
      const picks = await planMyWeek(emptyDays, entries.map((e) => e.recipe_id).filter((id): id is string => !!id));
      let saved = 0;
      for (const p of picks) {
        try {
          await add(p);
          saved++;
        } catch {
          // keep going; the count below says what landed
        }
      }
      const word = (n: number) => `${n} ${n === 1 ? 'dinner' : 'dinners'}`;
      if (picks.length === 0) show('Nothing fits your answers for those days yet.', 'info');
      else if (saved === picks.length) {
        haptics.notify('success');
        show(`Otto planned ${word(saved)}.`, 'success');
      } else show(`Otto planned ${word(saved)} of ${picks.length}. Try again for the rest.`, 'error');
    } catch (err) {
      show(err instanceof Error && err.message ? err.message : "Couldn't plan the week. Try again.", 'error');
    } finally {
      setPlanning(false);
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
      haptics.impact('light'); // a commit, not a flow completion (motion.md §2)
    } catch {
      show("Couldn't update Otto's week. Try again.", 'error');
    }
  };

  // Free list (ADR-0013): a label is optional and set after the fact. Long
  // press opens the choice; the last option clears it.
  const chooseLabel = async (entry: PlanEntry) => {
    if (!flags.flowV2) return;
    const options = [...MEAL_LABELS.map((l) => l[0].toUpperCase() + l.slice(1)), 'No label'];
    const pick = await showActionSheet({ title: `What is ${entry.title}?`, options });
    if (pick == null) return;
    try {
      await setLabel(entry.id, pick < MEAL_LABELS.length ? MEAL_LABELS[pick] : null);
      haptics.select();
    } catch {
      show("Couldn't update Otto's week. Try again.", 'error');
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
      haptics.impact('light'); // a commit, not a flow completion (motion.md §2)
    } catch {
      show("Couldn't add leftovers. Try again.", 'error');
    }
  };

  return (
    <SafeAreaView edges={embedded ? [] : ['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text role="display">Otto&apos;s week</Text>
        {planned > 0 && (
          <Text role="caption">
            {planned} {planned === 1 ? 'dish' : 'dishes'} planned
          </Text>
        )}
      </View>

      {(planned > 0 || flags.agent || (flags.flowV2 && planMyWeek && emptyDays.length > 0)) && (
        <View style={{ marginBottom: space[4], gap: space[2] }}>
          {flags.agent && !isLoading && !isError && (
            <Button title="Plan with Otto" variant="secondary" onPress={() => setAgentOpen(true)} />
          )}
          {flags.flowV2 && planMyWeek && emptyDays.length > 0 && !isLoading && !isError && (
            <Button
              title={planned === 0 ? 'Otto, plan my week' : `Otto, fill ${emptyDays.length === 1 ? 'the open day' : `the ${emptyDays.length} open days`}`}
              variant="primary"
              loading={planning}
              onPress={ottoPlans}
            />
          )}
          {planned > 0 && <Button title="Shopping list" variant="secondary" onPress={() => (onOpenShopping ? onOpenShopping() : router.push('/shopping'))} />}
        </View>
      )}

      {isLoading ? (
        <OttoLoading message="Checking Otto's week…" />
      ) : isError ? (
        // An errored query also reports isLoading false with entries [] — and
        // seven "Nothing planned" cards would assert the user planned
        // nothing when the app knows nothing (usePlan.ts says this in writing).
        <OttoError message="We couldn't reach Otto's week." onRetry={refetch} />
      ) : (
        days.map((day, index) => {
          const dayEntries = sortDay(byDay[day.key] || []);
          return (
            <View key={day.key} style={[styles.dayCard, index === 0 && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <View style={styles.dayHeaderText}>
                  {index === 0 ? (
                    <RNText style={{ ...type.title, color: colors.terracotta }}>{day.label}</RNText>
                  ) : (
                    <Text role="title">{day.label}</Text>
                  )}
                  <Text role="meta">{day.sub}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add a dish to ${day.label}`}
                  hitSlop={4}
                  style={styles.addBtn}
                  onPress={() => {
                    haptics.select();
                    setPicker({ day: day.key });
                  }}
                >
                  <Ionicons name="add" size={20} color={colors.terracotta} />
                </Pressable>
              </View>

              {dayEntries.length === 0 ? (
                <Text role="caption">{flags.flowV2 ? 'Open. No plans, no guilt.' : 'Nothing planned'}</Text>
              ) : (
                dayEntries.map((entry) => {
                  const canCarry = Boolean(entry.recipe_id) && nextInWeek(day.key, days) != null;
                  return (
                    <View key={entry.id} style={styles.entryRow}>
                      <Pressable
                        style={styles.entryMain}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${entry.title}`}
                        onPress={() => entry.recipe_id && router.push(`/recipe/${entry.recipe_id}`)}
                        onLongPress={flags.flowV2 ? () => dishActions(entry, day.key) : undefined}
                        accessibilityHint={flags.flowV2 ? 'Long-press for cooked, swap, move, leftovers, label or remove' : undefined}
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
                          {(entry.label || isLeftover(entry)) && (
                            <Text role="caption">
                              {[entry.label, isLeftover(entry) ? 'leftovers' : null].filter(Boolean).join(' · ')}
                            </Text>
                          )}
                        </View>
                      </Pressable>

                      {/* Inline icon-only actions (Figma 276:716): swap · cooked ·
                          leftovers-tomorrow · remove. No text labels. */}
                      <View style={styles.entryIcons}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Swap ${entry.title}`}
                          hitSlop={13}
                          onPress={() => {
                            haptics.select();
                            setPicker({ day: day.key, entryId: entry.id });
                          }}
                        >
                          <Ionicons name="shuffle" size={18} color={colors.inkSoft} />
                        </Pressable>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: Boolean(entry.cooked) }}
                          accessibilityLabel={entry.cooked ? 'Cooked. Tap to unmark' : 'Mark as cooked'}
                          hitSlop={13}
                          onPress={() => toggleCooked(entry)}
                        >
                          <Ionicons
                            name={entry.cooked ? 'flame' : 'flame-outline'}
                            size={18}
                            color={entry.cooked ? colors.terracotta : colors.inkSoft}
                          />
                        </Pressable>
                        {canCarry && !isLeftover(entry) && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${entry.title} as leftovers tomorrow`}
                            hitSlop={13}
                            onPress={() => carryLeftovers(entry, day.key)}
                          >
                            <Ionicons name="repeat" size={18} color={colors.inkSoft} />
                          </Pressable>
                        )}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${entry.title} from ${day.label}`}
                          hitSlop={13}
                          onPress={() => removeEntry(entry)}
                        >
                          <Ionicons name="close" size={18} color={colors.inkSoft} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          );
        })
      )}

      {!isLoading && planned === 0 && (
        <View style={styles.emptyWeek}>
          <OttoIdle name="happy" size={120} sway />
          <Text role="body">Add a dish to get started.</Text>
        </View>
      )}
      </ScrollView>

      {flags.agent && (
        <PlanAgentSheet visible={agentOpen} onClose={() => setAgentOpen(false)} onChanged={() => void qc.invalidateQueries({ queryKey: ['plan'] })} />
      )}
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
    ...shadow.card,
  },
  dayCardToday: { borderWidth: 1.5, borderColor: colors.terracotta },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: space[2] },
  dayHeaderText: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: space[2] }, // wraps at large Dynamic Type
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
  },
  entryMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[3] },
  thumb: { width: 40, height: 40, borderRadius: radii.button, backgroundColor: colors.creamDeep },
  // paddingVertical is what MAKES the children's hitSlop work. This row used to
  // hug the 18pt icons, so Fabric clipped every touch at the row's edge and the
  // 13pt slop below each icon — including the destructive remove — was dead.
  // Giving the parent 13pt of its own slack puts the slop inside the row's
  // bounds, so the effective target is a real 44pt tall without moving an icon.
  entryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingVertical: 13,
  },
  emptyWeek: { alignItems: 'center', gap: space[3], marginTop: space[5] },
};
