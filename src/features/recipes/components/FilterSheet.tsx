import React from 'react';
import { Pressable, View } from 'react-native';
import { Button, Sheet, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { filterByCategories } from './filterRecipes';

export { filterByCategories };

// Narrow the already-loaded grid client-side (no network round-trip). The only
// dimension a RecipeSummary carries is `category` — see filterRecipes.ts for why
// (and why Discover only opens this when the grid spans categories). Chips are
// multi-select: selected = accentSoft fill + terracotta ink (semantic ink; the
// Text primitive has no white role, so a light fill with computed text is the
// honest selected state), unselected = creamDeep fill + body ink.
export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  selected: Set<string>;
  onToggle: (category: string) => void;
  onClear: () => void;
  resultCount: number;
}

export function FilterSheet({
  visible,
  onClose,
  categories,
  selected,
  onToggle,
  onClear,
  resultCount,
}: FilterSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Filter by category">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
        {categories.map((cat) => {
          const active = selected.has(cat);
          return (
            <Pressable
              key={cat}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter ${cat}`}
              onPress={() => onToggle(cat)}
              style={{
                paddingHorizontal: space[4],
                paddingVertical: space[2],
                borderRadius: radii.pill,
                backgroundColor: active ? colors.accentSoft : colors.creamDeep,
                borderWidth: active ? 1 : 0,
                borderColor: colors.terracotta,
              }}
            >
              <Text role={active ? 'computed' : 'body'}>{cat}</Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[4],
          marginTop: space[5],
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          onPress={onClear}
          hitSlop={8}
        >
          <Text role="caption">Clear all</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button title={`Show ${resultCount} recipes`} onPress={onClose} variant="primary" />
        </View>
      </View>
    </Sheet>
  );
}
