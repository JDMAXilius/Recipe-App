import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Sheet, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useDiscover } from '../recipe.queries';

// FilterSheet — 1:1 with Figma (node 213:99): grab handle · Category group ·
// Cuisine group · footer with Clear all + live-count CTA. Each group is
// single-select (tap the active chip to clear it). The intersection itself
// lives in useDiscover; the sheet just warms it — the live count calls
// useDiscover with the PENDING selection, so hitting "Show" lifts pending →
// applied and the grid reads a warm cache. Gated on `visible` so the count
// query is idle while closed.
export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  areas: string[];
  initialCategory: string | null;
  initialArea: string | null;
  onApply: (category: string | null, area: string | null) => void;
}

// Selected state carries THREE cues — soft terracotta wash, a terracotta ring,
// and a check — never colour alone (WCAG 1.4.1; the researched filter pattern).
// The label stays INK at every state: a category name is authored content, and
// ink on accentSoft reads ~11.7:1 where the old filled-terracotta chip painted
// terracotta text on a terracotta fill (1:1 — the label vanished). accentSoft is
// used exactly as its token documents it: "chip fills, selected tiles".
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter ${label}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
        minHeight: 44, // tap-target law (matches the shopping-list chip)
        paddingHorizontal: space[4],
        paddingVertical: space[2],
        borderRadius: radii.pill,
        backgroundColor: active ? colors.accentSoft : colors.creamDeep,
        borderWidth: 1.5,
        borderColor: active ? colors.terracotta : 'transparent',
      }}
    >
      {active ? <Ionicons name="checkmark" size={15} color={colors.terracotta} /> : null}
      <Text role="body">{label}</Text>
    </Pressable>
  );
}

export function FilterSheet({
  visible,
  onClose,
  categories,
  areas,
  initialCategory,
  initialArea,
  onApply,
}: FilterSheetProps) {
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [area, setArea] = useState<string | null>(initialArea);

  // Re-seat the pending selection from the applied one each time it opens.
  useEffect(() => {
    if (visible) {
      setCategory(initialCategory);
      setArea(initialArea);
    }
  }, [visible, initialCategory, initialArea]);

  // Live count for the CTA — disabled (both null) while closed.
  const count = useDiscover(visible ? category : null, visible ? area : null);
  const n = count.data?.length ?? 0;

  const toggle =
    (value: string, current: string | null, set: (v: string | null) => void) => () => {
      haptics.select();
      set(current === value ? null : value);
    };

  const clearAll = () => {
    haptics.select();
    setCategory(null);
    setArea(null);
  };

  const ctaTitle =
    !category && !area
      ? 'Show recipes'
      : count.isFetching
        ? 'Counting…'
        : `Show ${n} ${n === 1 ? 'recipe' : 'recipes'}`;

  return (
    <Sheet visible={visible} onClose={onClose} title="Filters">
      <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
        <Text role="meta">Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[2], marginBottom: space[4] }}>
          {categories.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={toggle(c, category, setCategory)} />
          ))}
        </View>

        <Text role="meta">Cuisine</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[2] }}>
          {areas.map((a) => (
            <Chip key={a} label={a} active={area === a} onPress={toggle(a, area, setArea)} />
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], marginTop: space[5] }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Clear all filters" onPress={clearAll} hitSlop={8}>
          <Text role="computed">Clear all</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button title={ctaTitle} onPress={() => onApply(category, area)} variant="primary" />
        </View>
      </View>
    </Sheet>
  );
}
