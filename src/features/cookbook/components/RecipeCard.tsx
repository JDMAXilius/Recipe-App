import React from 'react';
import { Image, Pressable, Text as RNText, View } from 'react-native';
import { PawMark, Text } from '@/shared/ui';
import { colors, macro, radii, shadow, space } from '@/shared/theme/tokens';
import { useSeedCalories } from '@/features/nutrition';
import { getNutritionEstimate } from '@/features/nutrition/estimates';
import type { CookbookItem } from '../cookbook.types';

// Cookbook-private card (RecipeCard-equivalent — RecipeCard is not a shared
// primitive). ONE corner stamp per card (v1 §5.6): paw for saveable seed
// recipes, "By you" for written, source name for imported.
// Calorie badge (restored, matching the Discover tile): the server-computed
// seed figure for saved recipes (batched + session-cached via useSeedCalories),
// a tilde-framed category estimate for user recipes whose numbers aren't
// precomputed. Positioned opposite whichever corner the paw/stamp occupies.
interface Props {
  item: CookbookItem;
  saved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
}

export function RecipeCard({ item, saved, onToggleSave, onPress }: Props) {
  const { data: seedCalories } = useSeedCalories();
  // Both surfaces read the SAME precomputed per-serving figure: saved seeds from
  // the batched seed_nutrition map, owned recipes from recipes.nutrition
  // (persisted at save, threaded here as item.nutritionKcal). Either missing →
  // the honest category estimate.
  const computedKcal =
    item.variant === 'saved'
      ? seedCalories?.get(String(item.recipeId))
      : item.nutritionKcal ?? undefined;
  const isComputed = typeof computedKcal === 'number' && Number.isFinite(computedKcal);
  const kcal = isComputed ? computedKcal : getNutritionEstimate(item.category).calories;
  // 'saved' puts the paw top-right, so the calorie pill takes top-left; owned
  // recipes carry a "By you"/source stamp top-left, so the pill takes top-right.
  const calorieSide = item.variant === 'saved' ? 'left' : 'right';

  // Card Pressable and the paw Pressable are SIBLINGS — a <button> nested in a
  // <button> (react-native-web renders both accessibilityRole="button"s as real
  // <button>s) is invalid HTML. The paw overlays via absolute positioning on the
  // wrapper, outside the card button. The "By you"/source badge is a plain View,
  // so it can stay inside.
  return (
    <View
      style={{
        flex: 1,
        margin: space[2],
        borderRadius: radii.card,
        backgroundColor: colors.white,
        overflow: 'hidden',
      }}
    >
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open recipe ${item.title}`}>
        <View style={{ aspectRatio: 5 / 4, backgroundColor: colors.creamDeep }}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : null}

          {item.variant !== 'saved' ? (
            <View
              style={{
                position: 'absolute',
                top: space[2],
                left: space[2],
                maxWidth: '80%',
                paddingHorizontal: space[2],
                paddingVertical: space[1],
                borderRadius: radii.pill,
                backgroundColor: colors.white,
              }}
            >
              <RNText style={{ fontSize: 11, fontWeight: '600', color: colors.inkSoft }} numberOfLines={1}>
                {item.variant === 'mine' ? 'By you' : item.sourceName || 'imported'}
              </RNText>
            </View>
          ) : null}

          {/* Calorie pill — computed figure (bare) or category estimate ("~"). */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: space[2],
              [calorieSide]: space[2],
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[1],
              backgroundColor: colors.white,
              borderRadius: radii.pill,
              paddingHorizontal: space[3],
              paddingVertical: space[1],
              ...shadow.card,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta }} />
            <Text role="caption">{`${isComputed ? '' : '~'}${kcal} cal`}</Text>
          </View>
        </View>

        <View style={{ padding: space[3], gap: space[1] }}>
          <Text role="body">{item.title}</Text>
          {/* 3 macro dots (protein · carbs · fat) — fixed decorative motif. */}
          <View style={{ flexDirection: 'row', gap: space[1] }}>
            {[macro.protein, macro.carbs, macro.fat].map((c) => (
              <View key={c} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
            ))}
          </View>
        </View>
      </Pressable>

      {item.variant === 'saved' ? (
        <View style={{ position: 'absolute', top: space[2], right: space[2] }}>
          <PawMark saved={saved} onToggle={onToggleSave} size={24} />
        </View>
      ) : null}
    </View>
  );
}
