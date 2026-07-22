import React from 'react';
import { Image, Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { colors, radii, space } from '@/shared/theme/tokens';
import type { RecipeCategory } from '../recipe.types';

// Painted category tiles — the horizontal browse row (Discover). Each tile is
// the category's own thumb with its name; the selected tile carries a terracotta
// ring (interactive → terracotta, semantic ink).
export function CategoryTiles({
  categories,
  selected,
  onSelect,
}: {
  categories: RecipeCategory[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space[3], paddingVertical: space[2] }}
    >
      {categories.map((cat) => {
        const active = cat.name === selected;
        return (
          <Pressable
            key={cat.name}
            accessibilityRole="button"
            accessibilityLabel={`Browse ${cat.name}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(cat.name)}
            style={{ width: 96, alignItems: 'center', gap: space[1] }}
          >
            <View
              style={{
                width: 96,
                height: 72,
                borderRadius: radii.card,
                overflow: 'hidden',
                backgroundColor: colors.creamDeep,
                borderWidth: active ? 2 : 0,
                borderColor: colors.terracotta,
              }}
            >
              {cat.thumb ? (
                <Image source={{ uri: cat.thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : null}
            </View>
            <RNText
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: active ? '600' : '400',
                color: active ? colors.terracotta : colors.ink,
              }}
            >
              {cat.name}
            </RNText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
