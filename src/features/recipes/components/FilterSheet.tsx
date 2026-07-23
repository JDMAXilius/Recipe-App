import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
        paddingHorizontal: space[4],
        paddingVertical: space[2],
        borderRadius: radii.pill,
        backgroundColor: active ? colors.terracotta : colors.creamDeep,
      }}
    >
      <Text role={active ? 'computed' : 'body'}>{label}</Text>
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
