import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text as RNText,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, OttoArt, OttoLoading, OttoError, Screen } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space } from '@/shared/theme/tokens';
import { kv } from '@/shared/storage';
import { buildShoppingListShareText, ShareListCard, ShoppingListBanner } from '@/features/share';
import { useHousehold, useSharedList, getHouseholdWeekDishes } from '@/features/household';
import { usePlan } from './usePlan';
import { getListRecipes } from './plan.queries';
import { buildShoppingList, AISLES } from './shoppingList';

// Shopping list (roadmap Phase 4): built from the current week, one row per
// ingredient with summed quantities + provenance, aisle sections, whole-row
// check-off that never reorders. Check state is client-only (a boolean map)
// and is NOT an input to buildShoppingList — so ticking an item can never
// move it. Check state + custom extras persist to kv ('shoppingState') so the
// list survives leaving the screen; the derived rows always rebuild from plan.

export function ShoppingScreen() {
  const router = useRouter();
  const { entries, days, isLoading: planLoading } = usePlan();
  // The offscreen ShareListCard (the recipient-facing picture) — captured by
  // react-native-view-shot when sharing on native.
  const shareCardRef = useRef<View>(null);
  const qc = useQueryClient();

  // Refresh on every open. staleTime is 60s app-wide, so without this a reopened
  // list could show a stale plan or stale shared check-state (Juan: "needs to
  // update properly every time I open it"). Invalidate the sources on focus; the
  // derived ingredient rows rebuild from them.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['household-week'] });
      qc.invalidateQueries({ queryKey: ['household-list'] });
      qc.invalidateQueries({ queryKey: ['plan-list'] });
    }, [qc]),
  );

  // Shared kitchen: when the user is in a household the list aggregates EVERY
  // member's week and the check-offs + custom items are shared in realtime
  // (household_list_state). Otherwise it's the personal week with local state.
  const { household, memberIds } = useHousehold();
  const shared = useSharedList(household?.id ?? null);
  const isShared = !!household;

  // Source dishes (id + title): everyone's week when shared, else mine.
  const myDishes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) if (e.recipe_id && !seen.has(e.recipe_id)) seen.set(e.recipe_id, e.title);
    return [...seen].map(([recipeId, title]) => ({ recipeId, title }));
  }, [entries]);
  const householdQuery = useQuery({
    queryKey: ['household-week', household?.id, memberIds, days[0]?.key, days[6]?.key],
    enabled: isShared && memberIds.length > 0,
    queryFn: () => getHouseholdWeekDishes(memberIds, days[0].key, days[6].key),
    placeholderData: keepPreviousData,
  });
  const dishes = useMemo(
    () => (isShared ? (householdQuery.data ?? []) : myDishes),
    [isShared, householdQuery.data, myDishes],
  );
  const recipeIds = useMemo(() => dishes.map((d) => d.recipeId), [dishes]);
  const recipeTitles = useMemo(
    () => new Map(dishes.map((d) => [d.recipeId, d.title])),
    [dishes],
  );

  // Source recipes the shopper dropped (chip ×). Persisted, and pruned to what's
  // actually on the week so a removed-then-replanned dish comes back.
  const [excluded, setExcluded] = useState<string[]>([]);
  const activeRecipeIds = useMemo(
    () => recipeIds.filter((id) => !excluded.includes(id)),
    [recipeIds, excluded],
  );

  const listQuery = useQuery({
    queryKey: ['plan-list', activeRecipeIds],
    enabled: activeRecipeIds.length > 0,
    queryFn: () => getListRecipes(activeRecipeIds),
    // Keep the current rows visible while a changed week refetches, so adding
    // or removing a dish updates the list without a blank flash.
    placeholderData: keepPreviousData,
  });

  // When the week is empty the query is disabled and RETAINS its last data —
  // so the list must be forced empty here, or removing every dish would leave
  // the old ingredients on screen (the "doesn't update" bug).
  const items = useMemo(
    () => (activeRecipeIds.length === 0 ? [] : buildShoppingList(listQuery.data ?? [])),
    [activeRecipeIds.length, listQuery.data],
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<{ key: string; name: string }[]>([]);
  const [newItem, setNewItem] = useState('');

  // Unified check/custom access — the household's realtime state when shared,
  // local state otherwise. The rest of the screen reads only these.
  const checkedMap: Record<string, boolean> = isShared
    ? Object.fromEntries(shared.rows.map((r) => [r.item_key, r.checked]))
    : checked;
  const isChecked = (key: string) => !!checkedMap[key];
  const customList = isShared
    ? shared.rows.filter((r) => r.custom_name).map((r) => ({ key: r.item_key, name: r.custom_name as string }))
    : custom;

  // Persistence (contract: persistence.md). Hydrate once on mount, then mirror
  // every change back to kv. The `hydrated` guard stops the mount save from
  // clobbering stored state with the empty defaults before the load resolves.
  const hydrated = useRef(false);
  useEffect(() => {
    (async () => {
      const saved = await kv.get<{
        checked: Record<string, boolean>;
        custom: { key: string; name: string }[];
        excluded?: string[];
      }>('shoppingState', { checked: {}, custom: [], excluded: [] });
      setChecked(saved.checked ?? {});
      setCustom(saved.custom ?? []);
      setExcluded(saved.excluded ?? []);
      hydrated.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    kv.set('shoppingState', { checked, custom, excluded });
  }, [checked, custom, excluded]);
  // Prune exclusions to dishes still on the week (once it has loaded), so a
  // dropped-then-replanned dish returns to the list instead of staying hidden.
  useEffect(() => {
    if (recipeIds.length === 0) return;
    setExcluded((prev) => {
      const next = prev.filter((id) => recipeIds.includes(id));
      return next.length === prev.length ? prev : next;
    });
  }, [recipeIds]);

  const toggle = (key: string) => {
    haptics.select();
    if (isShared) shared.toggle(key, !isChecked(key));
    else setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addCustom = () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem('');
    if (isShared) shared.addCustom(name);
    // Date.now() key — a re-used index would collide checkboxes after removals.
    else setCustom((prev) => [...prev, { key: `custom-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name }]);
  };

  const removeCustom = (key: string) => {
    if (isShared) shared.removeCustom(key);
    else setCustom((prev) => prev.filter((c) => c.key !== key));
  };

  const grouped = AISLES.map((aisle) => ({
    aisle,
    items: items.filter((i) => i.aisle === aisle),
  })).filter((g) => g.items.length > 0);

  const total = items.length + customList.length;
  const done =
    items.filter((i) => isChecked(i.key)).length +
    customList.filter((c) => isChecked(c.key)).length;

  // Share: on native snapshot the offscreen ShareListCard (the recipient-facing
  // picture — bullets, open items only, Otto sign-off) to a PNG via
  // react-native-view-shot and hand it to the OS share sheet (expo-sharing); on
  // web use navigator.share or the OS text share. Native modules are require()'d
  // only on the native branch so the web bundle never executes them (mirrors
  // src/features/share).
  const shareList = async () => {
    haptics.select();
    const text = buildShoppingListShareText({ items, custom: customList, checked: checkedMap });
    if (Platform.OS !== 'web' && shareCardRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; keeps view-shot out of the web runtime
        const Sharing = require('expo-sharing');
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; web branch never reaches this
        const { captureRef } = require('react-native-view-shot');
        if (await Sharing.isAvailableAsync()) {
          const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Shopping list',
          });
          return;
        }
      } catch {
        // capture/sharing unavailable → fall through to the text share
      }
    }
    const nav = (globalThis as { navigator?: { share?: (d: { text: string }) => Promise<void> } })
      .navigator;
    if (Platform.OS === 'web' && nav?.share) {
      await nav.share({ text }).catch(() => {});
      return;
    }
    await Share.share({ message: text }).catch(() => {});
  };

  const loading = planLoading || listQuery.isLoading;

  if (loading) {
    return (
      <Screen title="Shopping list" onBack={() => router.back()}>
        <OttoLoading message="Counting the pantry…" />
      </Screen>
    );
  }

  if (listQuery.isError) {
    return (
      <Screen title="Shopping list" onBack={() => router.back()}>
        <OttoError onRetry={() => listQuery.refetch()} />
      </Screen>
    );
  }

  // One item line: quantity in terracotta, name in ink; both struck through and
  // terracotta-tinted once checked (the "got it" read at a glance).
  const itemLine = (amount: string | null | undefined, name: string, on: boolean) => (
    <RNText>
      {amount ? (
        <RNText style={[styles.itemAmount, on && styles.struck]}>{amount} </RNText>
      ) : null}
      <RNText style={[styles.itemName, on && styles.struck]}>{name}</RNText>
    </RNText>
  );

  return (
    <Screen
      title="Shopping list"
      onBack={() => router.back()}
      right={
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Our shared list"
            hitSlop={8}
            onPress={() => {
              haptics.select();
              router.push('/household');
            }}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="people-outline" size={22} color={colors.ink} />
          </Pressable>
          {total > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share the shopping list"
              hitSlop={8}
              onPress={shareList}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="share-outline" size={22} color={colors.ink} />
            </Pressable>
          )}
        </>
      }
    >
      <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
        {/* The printed stationery pad — a warm sheet inset with a thin DOUBLE
            terracotta frame, headed by the ribbon banner that overlaps the pad's
            top edge (its notch is cut in the sheet color). Frames are absolute
            Views so they track the pad's height at any list length. */}
        <View style={styles.pad}>
          <View style={styles.padSheet} pointerEvents="none" />
          <View style={styles.padFrameOuter} pointerEvents="none" />
          <View style={styles.padFrameInner} pointerEvents="none" />

          <View style={styles.padContent}>
            <View style={styles.bannerWrap}>
              <ShoppingListBanner notchColor={colors.white} />
            </View>

            {total > 0 && (
              <RNText style={styles.countHeader}>
                {done} of {total} in the basket
              </RNText>
            )}

            {/* Source-recipe chips — tap × to drop that dish from the list. */}
            {activeRecipeIds.length > 0 && (
              <View style={styles.chipsRow}>
                {activeRecipeIds.map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => {
                      haptics.select();
                      setExcluded((prev) => [...prev, id]);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${recipeTitles.get(id) ?? 'this dish'} from the list`}
                    style={styles.chip}
                  >
                    <RNText style={styles.chipText} numberOfLines={1}>
                      {recipeTitles.get(id) ?? 'Recipe'}
                    </RNText>
                    <Ionicons name="close" size={15} color={colors.ink} />
                  </Pressable>
                ))}
              </View>
            )}

            {total === 0 ? (
              <View style={styles.empty}>
                <OttoArt name="thinking" size={120} />
                <Text role="body">
                  Nothing to buy yet — put a dish or two on Otto&apos;s week and build the list from
                  there.
                </Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.aisle} style={styles.section}>
                  <RNText style={styles.aisleHeader}>{group.aisle}</RNText>
                  <View style={styles.rule} />
                  {group.items.map((item) => (
                    <View key={item.key}>
                      <Pressable
                        style={styles.itemRow}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: Boolean(isChecked(item.key)) }}
                        accessibilityLabel={`${item.amount} ${item.name}`.trim()}
                        onPress={() => toggle(item.key)}
                      >
                        <View style={[styles.check, isChecked(item.key) && styles.checkOn]}>
                          {isChecked(item.key) && (
                            <Ionicons name="checkmark" size={17} color={colors.white} />
                          )}
                        </View>
                        <View style={{ flex: 1, opacity: isChecked(item.key) ? 0.75 : 1 }}>
                          {itemLine(item.amount, item.name, isChecked(item.key))}
                          {item.sources.length > 0 && (
                            <Text role="caption">for {item.sources.join(' · ')}</Text>
                          )}
                        </View>
                      </Pressable>
                      <View style={styles.sep} />
                    </View>
                  ))}
                </View>
              ))
            )}

            {customList.length > 0 && (
              <View style={styles.section}>
                <RNText style={styles.aisleHeader}>Everything else</RNText>
                <View style={styles.rule} />
                {customList.map((item) => (
                  <View key={item.key}>
                    <View style={styles.itemRow}>
                      <Pressable
                        style={[styles.check, isChecked(item.key) && styles.checkOn]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: Boolean(isChecked(item.key)) }}
                        accessibilityLabel={item.name}
                        hitSlop={8}
                        onPress={() => toggle(item.key)}
                      >
                        {isChecked(item.key) && (
                          <Ionicons name="checkmark" size={17} color={colors.white} />
                        )}
                      </Pressable>
                      <View style={{ flex: 1, opacity: isChecked(item.key) ? 0.75 : 1 }}>
                        {itemLine(null, item.name, isChecked(item.key))}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.name}`}
                        onPress={() => removeCustom(item.key)}
                        style={styles.removeBtn}
                      >
                        <Ionicons name="close" size={16} color={colors.inkSoft} />
                      </Pressable>
                    </View>
                    <View style={styles.sep} />
                  </View>
                ))}
              </View>
            )}

            {/* "Something else?" — add-your-own row, inside the pad like the
                printed sheet it belongs to. */}
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Something else? Coffee…"
                placeholderTextColor={colors.inkSoft}
                onSubmitEditing={addCustom}
                returnKeyType="done"
                accessibilityLabel="Add your own item"
              />
              <Pressable
                onPress={addCustom}
                accessibilityRole="button"
                accessibilityLabel="Add item"
                style={styles.addBtn}
              >
                <Ionicons name="add" size={26} color={colors.white} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Offscreen share render (native only): the recipient-facing card the
            share sheet snapshots — bullets + open items, not this screen's
            checkboxes. Parked out of the viewport, never interactive. */}
        {Platform.OS !== 'web' && total > 0 && (
          <View
            style={styles.shareStage}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <ShareListCard
              ref={shareCardRef}
              list={{ items, custom: customList, checked: checkedMap }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// Pad frame insets (from the pad's outer edge). The double frame is two nested
// hairlines a step apart; content padding clears them so text never collides
// with the printed rules.
const FRAME = space[3];
const FRAME_GAP = space[1];

const styles: Record<string, ViewStyle & TextStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
  empty: { alignItems: 'center', gap: space[3], marginTop: space[5] },

  // The pad root stays opaque (white) under the sheet so nothing behind it can
  // ever bleed through the sheet's rounded corners.
  pad: {
    position: 'relative',
    marginTop: space[6],
    marginBottom: space[4],
    backgroundColor: colors.white,
    borderRadius: radii.card,
  },
  padSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  padFrameOuter: {
    position: 'absolute',
    top: FRAME,
    left: FRAME,
    right: FRAME,
    bottom: FRAME,
    borderRadius: radii.button - FRAME_GAP,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    opacity: 0.55,
  },
  padFrameInner: {
    position: 'absolute',
    top: FRAME + FRAME_GAP,
    left: FRAME + FRAME_GAP,
    right: FRAME + FRAME_GAP,
    bottom: FRAME + FRAME_GAP,
    borderRadius: radii.button - FRAME_GAP * 2,
    borderWidth: 1,
    borderColor: colors.terracotta,
    opacity: 0.35,
  },
  padContent: {
    paddingHorizontal: space[5],
    paddingTop: 0,
    paddingBottom: space[5],
  },
  // The ribbon hangs over the pad's top edge (half in, half out).
  bannerWrap: { marginTop: -space[5], marginBottom: space[4] },
  countHeader: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
    color: colors.inkSoft,
    marginBottom: space[4],
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    maxWidth: '100%',
    minHeight: 44,
    paddingLeft: space[4],
    paddingRight: space[3],
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
  },
  chipText: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: colors.ink },

  section: { marginBottom: space[5] },
  aisleHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  rule: {
    borderTopWidth: 1,
    borderTopColor: colors.terracotta,
    opacity: 0.5,
    marginTop: space[2],
  },
  sep: {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: colors.gray,
    opacity: 0.7,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    minHeight: 56,
  },
  itemAmount: { fontSize: 16, fontWeight: '700', color: colors.terracotta },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  // Crossed-off: strike the line and tint it terracotta so a ticked row reads
  // as "got it" at a glance (dimmed by the row container's opacity).
  struck: { textDecorationLine: 'line-through', color: colors.terracotta },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  removeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: space[3] },
  addInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: space[4],
    fontSize: 15,
    color: colors.ink,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareStage: { position: 'absolute', top: 0, left: -1000 },
};
