import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { createRecipeCardStyles } from "../assets/styles/home.styles";
import PawMark from "./PawMark";

// v2 (redesign B8): photo-dominant card, ONE metadata pill on the photo
// (category — a true fact; cookTime is fabricated upstream so it's gone),
// title below, paw save-mark in place. No calorie/macros on cards.
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
        {recipe.category ? (
          <View style={recipeCardStyles.categoryPill}>
            <Text style={recipeCardStyles.categoryPillText}>{recipe.category}</Text>
          </View>
        ) : null}
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
