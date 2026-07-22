import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PawMark, Text } from '@/shared/ui';
import { colors, radii, shadow, space } from '@/shared/theme/tokens';
import { useSaved } from '@/features/cookbook';
import { getNutritionEstimate } from '@/features/nutrition/estimates';
import type { RecipeSummary } from './recipe.types';

// The Discover / related-grid tile. Self-contained: it wires its own save paw
// through useSaved() (allowlisted: cookbook → recipes) so any grid of summaries
// is saveable without the parent threading state.
//
// Calorie badge: a summary has NO ingredients, so the card can only ESTIMATE
// from its category (getNutritionEstimate) — it must therefore ALWAYS be
// tilde-framed ("~400 cal"), never a bare number. The detail screen's computed
// USDA figure is the source of truth; the "~" is the honest signal that these
// two can legitimately differ (v1's "numbers never disagree" fix).
export function RecipeCard({
  recipe,
  onPress,
}: {
  recipe: RecipeSummary;
  onPress?: () => void;
}) {
  const router = useRouter();
  const { isSaved, toggle } = useSaved();
  // favorites.recipe_id is INTEGER (seed ids only). A user-recipe summary
  // ("u-12") would Number() to NaN and poison the favorites row, so the paw is
  // rendered only for genuine seed ids — the save affordance is seed-only by
  // design. Today only seed summaries reach this card; this guards the drift.
  const recipeId = Number(recipe.id);
  const isSeed = Number.isInteger(recipeId);
  const estCalories = getNutritionEstimate(recipe.category).calories;

  // The card Pressable and the paw Pressable are SIBLINGS, not nested — on web
  // react-native-web renders each accessibilityRole="button" as a real <button>,
  // and a <button> inside a <button> is invalid HTML (hydration error). The paw
  // overlays via absolute positioning on the wrapper, outside the card button.
  return (
    <View style={{ flex: 1, margin: space[2], maxWidth: '50%' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open recipe ${recipe.title}`}
        onPress={onPress ?? (() => router.push(`/recipe/${recipe.id}`))}
      >
        <View style={{ borderRadius: radii.card, overflow: 'hidden', backgroundColor: colors.creamDeep }}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', aspectRatio: 5 / 4, backgroundColor: colors.creamDeep }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', aspectRatio: 5 / 4 }} />
          )}
        </View>
        <View style={{ paddingTop: space[2] }}>
          <Text role="body">{recipe.title}</Text>
        </View>
      </Pressable>
      {/* Estimate-only calorie pill (top-left, opposite the paw). Always "~". */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: space[2],
          left: space[2],
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
        <Text role="caption">{`~${estCalories} cal`}</Text>
      </View>
      {isSeed ? (
        <View style={{ position: 'absolute', top: space[2], right: space[2] }}>
          <PawMark
            saved={isSaved(recipeId)}
            onToggle={() =>
              toggle({
                recipeId,
                title: recipe.title,
                image: recipe.image,
                category: recipe.category,
                cookTime: null,
                servings: null,
              })
            }
            size={26}
          />
        </View>
      ) : null}
    </View>
  );
}
