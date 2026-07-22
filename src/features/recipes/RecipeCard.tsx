import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PawMark, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useSaved } from '@/features/cookbook';
import type { RecipeSummary } from './recipe.types';

// The Discover / related-grid tile. Self-contained: it wires its own save paw
// through useSaved() (allowlisted: cookbook → recipes) so any grid of summaries
// is saveable without the parent threading state.
// ponytail: no calorie badge — a summary carries no ingredients, so an honest
// figure needs a per-card lookup (12+ network calls on Discover). Add it when a
// batched discover-nutrition source lands; the macro dots stay decorative.
export function RecipeCard({
  recipe,
  onPress,
}: {
  recipe: RecipeSummary;
  onPress?: () => void;
}) {
  const router = useRouter();
  const { isSaved, toggle } = useSaved();
  const recipeId = Number(recipe.id);

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
    </View>
  );
}
