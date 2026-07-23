import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { foodIcon } from '@/shared/assets';
import { colors, radii, space } from '@/shared/theme/tokens';
import type { RecipeCategory } from '../recipe.types';

// Painted category tiles — the horizontal browse row (Discover, spec §Discover
// item 6). Each tile shows the hand-painted `foodIcon` webp (not the MealDB
// photo thumb) so the row reads as v1's painted look; the selected tile carries
// a terracotta ring, and its label goes terracotta (role="computed", the
// interactive/selected ink) while the rest stay ink (role="body").
const SHORT: Record<string, string> = { Miscellaneous: 'Misc' };

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
            onPress={() => {
              haptics.select();
              onSelect(cat.name);
            }}
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
              <Image
                source={foodIcon(cat.name)}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <Text role={active ? 'computed' : 'body'}>{SHORT[cat.name] ?? cat.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
