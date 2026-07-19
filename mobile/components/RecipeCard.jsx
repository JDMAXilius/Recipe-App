import { useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useNutrition } from "../context/NutritionContext";
import { createRecipeCardStyles } from "../assets/styles/home.styles";
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
  const isOwn = recipe.source === "manual" || recipe.source === "imported";

  // Prefer the computed figure so the card and the detail screen agree — they
  // used to read 450 and 255 for the same recipe. The context batches every
  // card on screen into one request and caches for the session; user recipes
  // carry their own nutrition, so they are skipped.
  const { getNutrition, request } = useNutrition();
  useEffect(() => {
    if (!isOwn) request(recipe.id);
  }, [recipe.id, isOwn, request]);

  const computed = isOwn ? recipe.nutrition : getNutrition(recipe.id);
  // Only a figure computed from THIS recipe's ingredients earns a badge.
  // Previously the card fell back to a category-typical guess wearing a "~",
  // which meant every beef dish read the same number and every grid carried a
  // row of tildes. The hedge now lives once, on the nutrition card that shows
  // the actual breakdown — not on every tile. No number beats a vague one.
  const kcal = Number.isFinite(computed?.kcal) ? computed.kcal : null;

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
        {kcal != null && (
          <View style={recipeCardStyles.calorieBadge}>
            <View style={recipeCardStyles.calorieDot} />
            <Text style={recipeCardStyles.calorieBadgeText}>{kcal} cal</Text>
          </View>
        )}
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
