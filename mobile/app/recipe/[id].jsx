import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { MealAPI } from "../../services/mealAPI";
import { useTheme } from "../../context/ThemeContext";
import { OVERLAY } from "../../constants/tokens";
import { getNutritionEstimate } from "../../constants/nutritionEstimates";
import { createRecipeDetailStyles } from "../../assets/styles/recipe-detail.styles";
import LoadingSpinner from "../../components/LoadingSpinner";
import NutritionCard from "../../components/nutrition/NutritionCard";
import PawMark from "../../components/PawMark";

// Recipe Detail v2 (MOBBIN_COMPARISON §2.4): one scroll, true facts only —
// the fabricated Prep-Time/Servings stat cards are gone, ingredients are flat
// rows with tinted quantities (browsing surface: no checkboxes), video is an
// inline tap-to-play row, nutrition reads as an estimate, and the pinned bar
// keeps Save + Start cooking always reachable.

// Handles watch?v=, youtu.be/ and /shorts/ URLs (gotcha #8 fixed).
export const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const RecipeDetailScreen = () => {
  const { id: recipeId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const recipeDetailStyles = useMemo(() => createRecipeDetailStyles(colors), [colors]);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const loadRecipeDetail = async () => {
      setLoading(true);
      try {
        const mealData = await MealAPI.getMealById(recipeId);
        if (mealData) {
          const transformedRecipe = MealAPI.transformMealData(mealData);
          setRecipe({ ...transformedRecipe, youtubeUrl: mealData.strYoutube || null });
        }
      } catch (error) {
        console.error("Error loading recipe detail:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRecipeDetail();
    setVideoPlaying(false);
  }, [recipeId]);

  if (loading) return <LoadingSpinner message="Getting the recipe ready..." />;
  if (!recipe) return null;

  const videoId = getYouTubeId(recipe.youtubeUrl);

  const handlePlayVideo = () => {
    // WebView isn't supported on web — open YouTube directly there.
    if (Platform.OS === "web") {
      Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
      return;
    }
    setVideoPlaying(true);
  };

  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={recipeDetailStyles.scrollContent}
      >
        {/* HERO */}
        <View style={recipeDetailStyles.headerContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={recipeDetailStyles.headerImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", OVERLAY.scrim, OVERLAY.scrimStrong]}
            style={recipeDetailStyles.gradientOverlay}
          />

          <View style={recipeDetailStyles.floatingButtons}>
            <TouchableOpacity
              style={recipeDetailStyles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </TouchableOpacity>
            <PawMark recipe={recipe} size={26} style={{ width: 44, height: 44 }} />
          </View>

          <View style={recipeDetailStyles.titleSection}>
            <View style={recipeDetailStyles.badgeRow}>
              {recipe.category ? (
                <View style={recipeDetailStyles.categoryBadge}>
                  <Text style={recipeDetailStyles.categoryText}>{recipe.category}</Text>
                </View>
              ) : null}
              {recipe.area ? (
                <View style={recipeDetailStyles.categoryBadge}>
                  <Text style={recipeDetailStyles.categoryText}>{recipe.area}</Text>
                </View>
              ) : null}
            </View>
            <Text style={recipeDetailStyles.recipeTitle}>{recipe.title}</Text>
          </View>
        </View>

        <View style={recipeDetailStyles.contentSection}>
          {/* INGREDIENTS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <Text style={recipeDetailStyles.sectionTitle}>Ingredients</Text>
            {(recipe.ingredientPairs?.length
              ? recipe.ingredientPairs
              : recipe.ingredients.map((s) => ({ measure: "", name: s }))
            ).map((pair, index) => (
              <View key={index} style={recipeDetailStyles.ingredientRow}>
                {pair.measure ? (
                  <Text style={recipeDetailStyles.ingredientMeasure}>{pair.measure}</Text>
                ) : null}
                <Text style={recipeDetailStyles.ingredientName}>{pair.name}</Text>
              </View>
            ))}
          </View>

          {/* VIDEO — inline, tap to play, exactly where doubt starts */}
          {videoId && (
            <View style={recipeDetailStyles.sectionContainer}>
              <Text style={recipeDetailStyles.sectionTitle}>See it made</Text>
              {videoPlaying && Platform.OS !== "web" ? (
                <View style={recipeDetailStyles.videoCard}>
                  <WebView
                    style={recipeDetailStyles.webview}
                    source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
                    allowsFullscreenVideo
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={recipeDetailStyles.videoCard}
                  onPress={handlePlayVideo}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Play recipe video"
                >
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                    style={recipeDetailStyles.videoThumb}
                    contentFit="cover"
                  />
                  <View style={recipeDetailStyles.videoScrim}>
                    <View style={recipeDetailStyles.videoPlayButton}>
                      <Ionicons name="play" size={28} color={colors.accent} />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              <Text style={recipeDetailStyles.videoCaption}>
                Watch this one being made before you start.
              </Text>
            </View>
          )}

          {/* STEPS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <Text style={recipeDetailStyles.sectionTitle}>Method</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={recipeDetailStyles.instructionRow}>
                <View style={recipeDetailStyles.stepIndicator}>
                  <Text style={recipeDetailStyles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={recipeDetailStyles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* NUTRITION — category-typical estimate (P4-4), tilde-framed */}
          <View style={recipeDetailStyles.sectionContainer}>
            <Text style={recipeDetailStyles.sectionTitle}>Nutrition</Text>
            <NutritionCard
              {...getNutritionEstimate(recipe.category)}
              servings={servings}
              onServingsChange={setServings}
            />
          </View>
        </View>
      </ScrollView>

      {/* PINNED BOTTOM BAR */}
      <View style={recipeDetailStyles.bottomBar}>
        <PawMark recipe={recipe} size={26} style={{ width: 52, height: 52 }} />
        <TouchableOpacity
          style={recipeDetailStyles.cookButton}
          onPress={() => router.push(`/recipe/cook/${recipe.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Start cooking step by step"
        >
          <Ionicons name="flame-outline" size={20} color={colors.white} />
          <Text style={recipeDetailStyles.cookButtonText}>Start cooking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RecipeDetailScreen;
