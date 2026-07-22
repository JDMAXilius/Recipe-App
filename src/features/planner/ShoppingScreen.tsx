import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Text, Button, OttoArt, OttoLoading, OttoError, Screen } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space } from '@/shared/theme/tokens';
import { kv } from '@/shared/storage';
import { buildShoppingListShareText } from '@/features/share';
import { useAuth } from '@/features/auth';
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
  const { entries, isLoading: planLoading } = usePlan();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const padRef = useRef<View>(null);

  // Unique recipe ids still on the week — the list's source recipes.
  const recipeIds = useMemo(() => {
    const seen = new Set<string>();
    for (const e of entries) if (e.recipe_id) seen.add(e.recipe_id);
    return [...seen];
  }, [entries]);

  const listQuery = useQuery({
    queryKey: ['plan-list', userId, recipeIds],
    enabled: recipeIds.length > 0 && !!userId,
    queryFn: () => getListRecipes(recipeIds, userId),
  });

  const items = useMemo(
    () => buildShoppingList(listQuery.data ?? []),
    [listQuery.data],
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<{ key: string; name: string }[]>([]);
  const [newItem, setNewItem] = useState('');

  // Persistence (contract: persistence.md). Hydrate once on mount, then mirror
  // every change back to kv. The `hydrated` guard stops the mount save from
  // clobbering stored state with the empty defaults before the load resolves.
  const hydrated = useRef(false);
  useEffect(() => {
    (async () => {
      const saved = await kv.get<{
        checked: Record<string, boolean>;
        custom: { key: string; name: string }[];
      }>('shoppingState', { checked: {}, custom: [] });
      setChecked(saved.checked ?? {});
      setCustom(saved.custom ?? []);
      hydrated.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    kv.set('shoppingState', { checked, custom });
  }, [checked, custom]);

  const toggle = (key: string) => {
    haptics.select();
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addCustom = () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem('');
    // Date.now() key — a re-used index would collide checkboxes after removals.
    setCustom((prev) => [...prev, { key: `custom-${Date.now()}`, name }]);
  };

  const removeCustom = (key: string) =>
    setCustom((prev) => prev.filter((c) => c.key !== key));

  const grouped = AISLES.map((aisle) => ({
    aisle,
    items: items.filter((i) => i.aisle === aisle),
  })).filter((g) => g.items.length > 0);

  const total = items.length + custom.length;
  const done =
    items.filter((i) => checked[i.key]).length +
    custom.filter((c) => checked[c.key]).length;

  // Share: on native snapshot the painted pad to a PNG (react-native-view-shot)
  // and hand it to the OS share sheet (expo-sharing); on web use navigator.share
  // or the OS text share. Native modules are require()'d only on the native
  // branch so the web bundle never executes them (mirrors src/features/share).
  const shareList = async () => {
    haptics.select();
    const text = buildShoppingListShareText({ items, custom, checked });
    if (Platform.OS !== 'web' && padRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; keeps view-shot out of the web runtime
        const Sharing = require('expo-sharing');
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; web branch never reaches this
        const { captureRef } = require('react-native-view-shot');
        if (await Sharing.isAvailableAsync()) {
          const uri = await captureRef(padRef, { format: 'png', quality: 1 });
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

  return (
    <Screen
      title="Shopping list"
      onBack={() => router.back()}
      right={
        total > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share the shopping list"
            hitSlop={8}
            onPress={shareList}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="share-outline" size={22} color={colors.ink} />
          </Pressable>
        ) : undefined
      }
    >
      <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
        {/* The printed stationery pad — a warm sheet framed by a faint terracotta
            double rule, headed by a SHOPPING LIST banner flag. The frame is drawn
            with absolute Views so it tracks the pad's height at any list length. */}
        <View ref={padRef} collapsable={false} style={styles.pad}>
          <View style={styles.padSheet} pointerEvents="none" />
          <View style={styles.padFrameOuter} pointerEvents="none" />
          <View style={styles.padFrameInner} pointerEvents="none" />

          <View style={styles.padContent}>
            <View style={styles.bannerWrap} accessibilityRole="header">
              <View style={styles.banner}>
                <RNText style={styles.bannerText}>SHOPPING LIST</RNText>
              </View>
            </View>

            {total > 0 && (
              <View style={styles.countHeader}>
                <Text role="meta">{done} of {total} in the basket</Text>
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
                <View key={group.aisle} style={{ marginBottom: space[4] }}>
                  <Text role="meta">{group.aisle}</Text>
                  <View style={styles.rule} />
                  {group.items.map((item) => (
                    <Pressable
                      key={item.key}
                      style={styles.itemRow}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: Boolean(checked[item.key]) }}
                      accessibilityLabel={`${item.amount} ${item.name}`.trim()}
                      onPress={() => toggle(item.key)}
                    >
                      <View style={[styles.check, checked[item.key] && styles.checkOn]}>
                        {checked[item.key] && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text role="body">
                          {item.amount ? `${item.amount} ` : ''}
                          {item.name}
                        </Text>
                        {item.sources.length > 0 && (
                          <Text role="caption">for {item.sources.join(' · ')}</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))
            )}

            {custom.length > 0 && (
              <View style={{ marginBottom: space[4] }}>
                <Text role="meta">Your extras</Text>
                <View style={styles.rule} />
                {custom.map((item) => (
                  <View key={item.key} style={styles.itemRow}>
                    <Pressable
                      style={[styles.check, checked[item.key] && styles.checkOn]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: Boolean(checked[item.key]) }}
                      accessibilityLabel={item.name}
                      onPress={() => toggle(item.key)}
                    >
                      {checked[item.key] && (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      )}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text role="body">{item.name}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name}`}
                      hitSlop={8}
                      onPress={() => removeCustom(item.key)}
                    >
                      <Ionicons name="close" size={16} color={colors.inkSoft} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

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
          <Button title="Add" variant="secondary" onPress={addCustom} />
        </View>
      </ScrollView>
    </Screen>
  );
}

// Pad frame insets (from the pad's outer edge). Content padding clears them so
// text never collides with the printed rules.
const FRAME = space[3];

const styles: Record<string, ViewStyle & TextStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
  empty: { alignItems: 'center', gap: space[3], marginTop: space[5] },

  pad: { position: 'relative', marginTop: space[2], marginBottom: space[4] },
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
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.accentSoft,
  },
  padFrameInner: {
    position: 'absolute',
    top: FRAME + 5,
    left: FRAME + 5,
    right: FRAME + 5,
    bottom: FRAME + 5,
    borderRadius: radii.button - 3,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  padContent: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[5],
  },

  bannerWrap: { alignItems: 'center', marginTop: space[2], marginBottom: space[3] },
  banner: {
    backgroundColor: colors.ink,
    paddingHorizontal: space[5],
    paddingVertical: space[2],
  },
  bannerText: { color: colors.cream, fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  countHeader: { alignItems: 'center', marginBottom: space[3] },

  rule: {
    height: 0,
    borderTopWidth: 1.5,
    borderTopColor: colors.terracotta,
    opacity: 0.45,
    marginTop: space[2],
    marginBottom: space[1],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: space[3] },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.creamDeep,
    borderRadius: radii.pill,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    color: colors.ink,
  },
};
