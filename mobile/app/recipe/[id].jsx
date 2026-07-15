import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { MealAPI } from "../../services/mealAPI";
import { useTheme } from "../../context/ThemeContext";
import { OVERLAY } from "../../constants/tokens";
import { getNutritionEstimate } from "../../constants/nutritionEstimates";
import { createRecipeDetailStyles } from "../../assets/styles/recipe-detail.styles";
import { scaledIngredient, formatQty } from "../../lib/ingredientParser";
import { segmentStep } from "../../lib/stepEnrich";
import { splitSteps, matchStepIngredients } from "../../lib/cookSession";
import { useUnitSystem } from "../../hooks/useUnitSystem";
import LoadingSpinner from "../../components/LoadingSpinner";
import NutritionCard from "../../components/nutrition/NutritionCard";
import PawMark from "../../components/PawMark";
import Bounceable from "../../components/Bounceable";

const BASE_SERVINGS = 4;

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
  const [servings, setServings] = useState(BASE_SERVINGS);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [unitSystem, setUnitSystem] = useUnitSystem();

  const scaleFactor = servings / BASE_SERVINGS;

  const tickServings = (next) => {
    if (next < 1 || next > 24) return;
    Haptics.selectionAsync().catch(() => {});
    setServings(next);
  };

  const pickUnits = (next) => {
    if (next === unitSystem) return;
    Haptics.selectionAsync().catch(() => {});
    setUnitSystem(next);
  };

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

  // Ingredients: scaled + converted rows; unscalable ("Dash", "to taste")
  // sink to the bottom — positional separation, no "Pantry" ghetto.
  const pairs = recipe.ingredientPairs?.length
    ? recipe.ingredientPairs
    : recipe.ingredients.map((s) => ({ measure: "", name: s }));
  const scaledRows = pairs.map((pair) => ({
    pair,
    ...scaledIngredient(pair, scaleFactor, unitSystem),
  }));
  const scalableRows = scaledRows.filter((r) => r.scalable);
  const pantryRows = scaledRows.filter((r) => !r.scalable);

  // Method: same split steps the cook mode uses — numbering stays aligned.
  const methodSteps = splitSteps(recipe.instructions);

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
          {/* INGREDIENTS — live scaling + US/Metric (deep-dive blueprint) */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionHeaderRow}>
              <Text style={recipeDetailStyles.sectionTitleInline}>Ingredients</Text>
              <View style={recipeDetailStyles.unitToggleRow}>
                <TouchableOpacity onPress={() => pickUnits("us")} accessibilityRole="button">
                  <Text
                    style={[
                      recipeDetailStyles.unitToggleText,
                      unitSystem === "us" && recipeDetailStyles.unitToggleActive,
                    ]}
                  >
                    US
                  </Text>
                </TouchableOpacity>
                <Text style={recipeDetailStyles.unitToggleSep}>/</Text>
                <TouchableOpacity onPress={() => pickUnits("metric")} accessibilityRole="button">
                  <Text
                    style={[
                      recipeDetailStyles.unitToggleText,
                      unitSystem === "metric" && recipeDetailStyles.unitToggleActive,
                    ]}
                  >
                    Metric
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={recipeDetailStyles.servesBand}>
              <Text style={recipeDetailStyles.servesText}>
                For <Text style={recipeDetailStyles.servesCount}>{servings}</Text>{" "}
                {servings === 1 ? "serving" : "servings"}
              </Text>
              <View style={recipeDetailStyles.servesControls}>
                <TouchableOpacity
                  style={recipeDetailStyles.servesButton}
                  onPress={() => tickServings(servings - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease servings"
                >
                  <Text style={recipeDetailStyles.servesButtonText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={recipeDetailStyles.servesButton}
                  onPress={() => tickServings(servings + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increase servings"
                >
                  <Text style={recipeDetailStyles.servesButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {scaleFactor !== 1 && (
              <TouchableOpacity
                style={recipeDetailStyles.scaleChip}
                onPress={() => tickServings(BASE_SERVINGS)}
                accessibilityRole="button"
                accessibilityLabel="Reset servings"
              >
                <Text style={recipeDetailStyles.scaleChipText}>
                  ×{formatQty(scaleFactor)} · Reset
                </Text>
              </TouchableOpacity>
            )}

            {scalableRows.map((row, index) => (
              <View key={index} style={recipeDetailStyles.ingredientRow}>
                <Text style={recipeDetailStyles.ingredientMeasure}>{row.display}</Text>
                <Text style={recipeDetailStyles.ingredientName}>{row.name}</Text>
              </View>
            ))}
            {pantryRows.length > 0 && <View style={recipeDetailStyles.pantryGap} />}
            {pantryRows.map((row, index) => (
              <View key={`p${index}`} style={recipeDetailStyles.ingredientRow}>
                {row.display ? (
                  <Text style={recipeDetailStyles.ingredientMeasure}>{row.display}</Text>
                ) : null}
                <Text style={recipeDetailStyles.ingredientName}>{row.name}</Text>
              </View>
            ))}

            {unitSystem === "metric" && (
              <Text style={recipeDetailStyles.metricNote}>
                Converted automatically — Otto rounds to kitchen-friendly amounts.
              </Text>
            )}
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

          {/* METHOD — semantic ink: terracotta = computed, ink = authored */}
          <View style={recipeDetailStyles.sectionContainer}>
            <Text style={recipeDetailStyles.sectionTitle}>Method</Text>
            {methodSteps.map((instruction, index) => {
              const uses = matchStepIngredients(instruction, pairs).slice(0, 3);
              return (
                <View key={index} style={recipeDetailStyles.instructionRow}>
                  <View style={recipeDetailStyles.stepIndicator}>
                    <Text style={recipeDetailStyles.stepNumber}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={recipeDetailStyles.stepHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={recipeDetailStyles.instructionText}>
                          {segmentStep(instruction).map((seg, i) => {
                            if (seg.type === "duration")
                              return (
                                <Text key={i} style={recipeDetailStyles.durationChip}>
                                  {" "}◷ {seg.text}{" "}
                                </Text>
                              );
                            if (seg.type === "temp")
                              return (
                                <Text key={i} style={recipeDetailStyles.tempText}>
                                  {seg.text}
                                </Text>
                              );
                            return <Text key={i}>{seg.text}</Text>;
                          })}
                        </Text>
                        {uses.length > 0 && (
                          <Text style={recipeDetailStyles.usesLine} numberOfLines={1}>
                            uses:{" "}
                            {uses
                              .map((p) => {
                                const s = scaledIngredient(p, scaleFactor, unitSystem);
                                return `${s.display} ${s.name}`.trim();
                              })
                              .join(" · ")}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={recipeDetailStyles.stepPlayButton}
                        onPress={() => router.push(`/recipe/cook/${recipe.id}?step=${index}`)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Start cooking from step ${index + 1}`}
                      >
                        <Ionicons name="play" size={14} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* NUTRITION — closing card, live-linked to the Ingredients stepper */}
          <View style={recipeDetailStyles.sectionContainer}>
            <Text style={recipeDetailStyles.sectionTitle}>Nutrition</Text>
            <NutritionCard {...getNutritionEstimate(recipe.category)} servings={servings} />
          </View>
        </View>
      </ScrollView>

      {/* PINNED BOTTOM BAR */}
      <View style={recipeDetailStyles.bottomBar}>
        <PawMark recipe={recipe} size={26} style={{ width: 52, height: 52 }} />
        <Bounceable
          style={recipeDetailStyles.cookButton}
          containerStyle={{ flex: 1 }}
          onPress={() => router.push(`/recipe/cook/${recipe.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Start cooking step by step"
        >
          <Ionicons name="flame-outline" size={20} color={colors.white} />
          <Text style={recipeDetailStyles.cookButtonText}>Start cooking</Text>
        </Bounceable>
      </View>
    </View>
  );
};

export default RecipeDetailScreen;
