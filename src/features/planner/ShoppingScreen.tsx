import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Text, Button, OttoArt } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useAuth } from '@/features/auth';
import { usePlan } from './usePlan';
import { getListRecipes } from './plan.queries';
import { buildShoppingList, AISLES } from './shoppingList';

// Shopping list (roadmap Phase 4): built from the current week, one row per
// ingredient with summed quantities + provenance, aisle sections, whole-row
// check-off that never reorders. Check state is client-only (a boolean map)
// and is NOT an input to buildShoppingList — so ticking an item can never
// move it. Basic personal list; the shared-household list is a follow-up
// (collab_* RPCs, see packet gaps).

export function ShoppingScreen() {
  const { entries, isLoading: planLoading } = usePlan();
  const { user } = useAuth();
  const userId = user?.id ?? null;

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

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const loading = planLoading || listQuery.isLoading;

  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text role="display">Shopping list</Text>
        {total > 0 && (
          <Text role="caption">
            {done} of {total} in the basket
          </Text>
        )}
      </View>

      {loading ? (
        <Text role="caption">Counting the pantry…</Text>
      ) : total === 0 ? (
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
            <Text role="title">{group.aisle}</Text>
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
                  {checked[item.key] && <Text role="computed">✓</Text>}
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
          <Text role="title">Your extras</Text>
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
                {checked[item.key] && <Text role="computed">✓</Text>}
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
                <Text role="caption">✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

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
  );
}

const styles: Record<string, ViewStyle & TextStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
  header: { marginBottom: space[4] },
  empty: { alignItems: 'center', gap: space[3], marginTop: space[5] },
  rule: {
    height: 1,
    backgroundColor: colors.creamDeep,
    marginTop: space[2],
    marginBottom: space[2],
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
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.creamDeep },
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
