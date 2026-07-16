import { useMemo } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { createRecipeCardStyles } from "../assets/styles/home.styles";
import { getNutritionEstimate } from "../constants/nutritionEstimates";
import PawMark from "./PawMark";
import Bounceable from "./Bounceable";

// RecipeCard — one-to-one with the Figma DS component (page "RecipeCard"):
// image 5:4 · calorie badge top-right (surface pill + accent dot) · title max
// 2 lines · 3 macro dots. The Figma "30 MIN" chip is omitted — cookTime is
// fabricated upstream and honesty beats fidelity (QA rule).
// ONE corner stamp per card (roadmap §5.6): paw (saveable seed recipe),
// "By you" ribbon (created), or link stamp with the source name (imported).
export default function RecipeCard({ recipe }) {
  const router = useRouter();
  const { colors, nutrition } = useTheme();
  const recipeCardStyles = useMemo(() => createRecipeCardStyles(colors), [colors]);
  const estimate = getNutritionEstimate(recipe.category);
  const isOwn = recipe.source === "manual" || recipe.source === "imported";

  // Computed nutrition for YOUR recipes; category estimate for seed recipes.
  //
  // Seed recipes cannot be computed honestly: TheMealDB has no servings field
  // (so every per-serving figure divides by a guessed 4 — "2kg Shredded Meat"
  // became 1200 kcal/serving) and its ingredient lines never say raw or cooked
  // ("3 cups brown rice" added already-cooked read 789 vs a true ~415; "1 Can
  // Black Beans" hit the dry-bean row at 4x). On every recipe checked by hand
  // the category estimate was CLOSER than the computed number.
  //
  // Your recipes have neither problem: you give the real servings and your own
  // ingredient lines, so the backend's per-serving figure is trustworthy and
  // rides along on the row — no fetch needed.
  const computed = isOwn ? recipe.nutrition : null;
  const kcal = computed?.kcal ?? estimate.calories;
  const isComputed = Number.isFinite(computed?.kcal);

  return (
    <Bounceable
      style={recipeCardStyles.container}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open recipe ${recipe.title}`}
    >
      <View style={recipeCardStyles.imageContainer}>
        <Image
          source={{ uri: recipe.image }}
          style={recipeCardStyles.image}
          contentFit="cover"
          transition={300}
        />
        {/* "~" marks a category-typical estimate; a bare number is computed
            from this recipe's own ingredients. Honesty law: never present an
            estimate with the precision of a measurement. */}
        <View style={recipeCardStyles.calorieBadge}>
          <View style={recipeCardStyles.calorieDot} />
          <Text style={recipeCardStyles.calorieBadgeText}>
            {isComputed ? "" : "~"}
            {kcal} cal
          </Text>
        </View>
        {!isOwn && <PawMark recipe={recipe} style={recipeCardStyles.pawPosition} />}
        {recipe.source === "manual" && (
          <View style={[recipeCardStyles.ownStamp, { backgroundColor: colors.accent }]}>
            <Text style={recipeCardStyles.ownStampText}>By you</Text>
          </View>
        )}
        {recipe.source === "imported" && (
          <View style={[recipeCardStyles.ownStamp, { backgroundColor: colors.surface }]}>
            <Ionicons name="link" size={11} color={colors.accent} />
            <Text
              style={[recipeCardStyles.ownStampText, { color: colors.accent }]}
              numberOfLines={1}
            >
              {recipe.sourceName || "imported"}
            </Text>
          </View>
        )}
      </View>

      <View style={recipeCardStyles.content}>
        <Text style={recipeCardStyles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={recipeCardStyles.macroDots}>
          <View style={[recipeCardStyles.macroDot, { backgroundColor: nutrition.protein }]} />
          <View style={[recipeCardStyles.macroDot, { backgroundColor: nutrition.carbs }]} />
          <View style={[recipeCardStyles.macroDot, { backgroundColor: nutrition.fat }]} />
        </View>
      </View>
    </Bounceable>
  );
}
