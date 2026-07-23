import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PawMark, Text } from '@/shared/ui';
import { colors, macro, radii, shadow, space } from '@/shared/theme/tokens';
import { useSaved } from '@/features/cookbook';
import { useSeedCalories } from '@/features/nutrition';
import { getNutritionEstimate } from '@/features/nutrition/estimates';
import type { RecipeSummary } from './recipe.types';

// The Discover / related-grid tile. Self-contained: it wires its own save paw
// through useSaved() (allowlisted: cookbook → recipes) so any grid of summaries
// is saveable without the parent threading state.
//
// Calorie badge: prefer the server-computed seed_nutrition figure (batched +
// session-cached via useSeedCalories) so the tile AGREES with what the recipe
// opens to — every Beef tile used to read an identical "~450" category estimate
// that also disagreed with the detail's computed number. Computed → a bare
// figure; only when a recipe has no computed value do we fall back to the
// category estimate, tilde-framed ("~400 cal") as the honest "this is soft"
// signal (v1's "numbers never disagree" rule).
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
  const { data: seedCalories } = useSeedCalories();
  const computedKcal = seedCalories?.get(String(recipe.id));
  const isComputed = typeof computedKcal === 'number' && Number.isFinite(computedKcal);
  const kcal = isComputed ? computedKcal : getNutritionEstimate(recipe.category).calories;

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
        <View style={{ paddingTop: space[2], gap: space[1] }}>
          <Text role="body">{recipe.title}</Text>
          <MacroDots />
        </View>
      </Pressable>
      {/* Calorie pill (top-left, opposite the paw): computed figure when known,
          category estimate ("~") otherwise. */}
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
        <Text role="caption">{`${isComputed ? '' : '~'}${kcal} cal`}</Text>
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

// The 3 macro dots under the title (protein · carbs · fat) — a fixed decorative
// brand motif from the Figma card, NOT a per-recipe claim (a summary carries no
// macros). The colours are the FIXED nutrition palette (never re-skinned).
export function MacroDots() {
  return (
    <View style={{ flexDirection: 'row', gap: space[1] }}>
      {[macro.protein, macro.carbs, macro.fat].map((c) => (
        <View key={c} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      ))}
    </View>
  );
}
