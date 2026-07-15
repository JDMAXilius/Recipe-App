import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { createRecipeCardStyles } from "../assets/styles/home.styles";
import { getNutritionEstimate } from "../constants/nutritionEstimates";
import PawMark from "./PawMark";

// v2 (redesign B8, amended by founder mid-run — P4-4): photo-dominant card,
// ONE pill on the photo: "~N cal", the category-typical estimate (same
// estimator as the detail NutritionCard, always tilde-framed). Title below,
// paw save-mark in place.
export default function RecipeCard({ recipe }) {
  const router = useRouter();
  const { colors } = useTheme();
  const recipeCardStyles = useMemo(() => createRecipeCardStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={recipeCardStyles.container}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      activeOpacity={0.85}
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
        <View style={recipeCardStyles.categoryPill}>
          <Text style={recipeCardStyles.categoryPillText}>
            ~{getNutritionEstimate(recipe.category).calories} cal
          </Text>
        </View>
        <PawMark recipe={recipe} style={recipeCardStyles.pawPosition} />
      </View>

      <View style={recipeCardStyles.content}>
        <Text style={recipeCardStyles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
