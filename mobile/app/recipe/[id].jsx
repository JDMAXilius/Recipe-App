import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, Modal } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SPACING } from "../../constants/tokens";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { MealAPI } from "../../services/mealAPI";
import { UserRecipeAPI, transformUserRecipe, isUserRecipeId, PlanAPI, NutritionAPI, ShareAPI } from "../../services/userRecipes";
import { weekDays } from "../../lib/week";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import { getNutritionEstimate } from "../../constants/nutritionEstimates";
import { createRecipeDetailStyles } from "../../assets/styles/recipe-detail.styles";
import { scaledIngredient, formatQty } from "../../lib/ingredientParser";
import { segmentStep } from "../../lib/stepEnrich";
import { splitSteps, matchStepIngredients } from "../../lib/cookSession";
import { buildRecipeShareText, sharePlainText } from "../../lib/shareText";
import { shareCardAvailable, captureAndShareCard } from "../../lib/shareCard";
import ShareCard from "../../components/ShareCard";
import { useUnitSystem } from "../../hooks/useUnitSystem";
import LoadingSpinner from "../../components/LoadingSpinner";
import NutritionCard from "../../components/nutrition/NutritionCard";
import PawMark from "../../components/PawMark";
import Bounceable from "../../components/Bounceable";
import RecipeCard from "../../components/RecipeCard";

const BASE_SERVINGS = 4;

// Recipe Detail v3 (Mobbin layout study, 2026-07-15): photo-only hero (title
// never sits on the art — the NYT/Kitchen Stories/Blue Apron norm), then on
// cream: eyebrow → serif title → attribution chip (reserved for v2 import
// sources) → computed meta row. Ingredients before Method (12/12 apps),
// video in the Kitchen Stories slot, nutrition after Method, and the page
// exits into related recipes instead of dead-ending on a data card.

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
  const insets = useSafeAreaInsets();
  const recipeDetailStyles = useMemo(() => createRecipeDetailStyles(colors), [colors]);
  const safeBottom = Math.max(insets.bottom, SPACING.lg);

  const [recipe, setRecipe] = useState(null);
  const [related, setRelated] = useState([]);
  // computed per-serving nutrition (B1) — user recipes carry it on the row;
  // seed recipes ask the server's compute-once cache. Null = category estimate.
  const [computedNutrition, setComputedNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(BASE_SERVINGS);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const { show } = useToast();
  const [unitSystem, setUnitSystem] = useUnitSystem();

  const baseServings = recipe?.servings || BASE_SERVINGS;
  const scaleFactor = servings / baseServings;
  const isOwn = isUserRecipeId(recipeId);

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

  const shareCardRef = useRef(null);

  // Long-press = share the painted card image (the Instagram answer);
  // only offered when the build actually carries the capture modules.
  const shareAsCard = async () => {
    if (!shareCardAvailable()) return shareRecipe();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const shared = await captureAndShareCard(shareCardRef, recipe.title);
    if (!shared) await shareRecipe(); // capture failed — text share still works
  };

  const shareRecipe = async () => {
    Haptics.selectionAsync().catch(() => {});
    // Own recipes get a public link (S2) so previews unfurl; if minting
    // fails (offline, signed out) the full-text share still works alone.
    let link = null;
    if (isOwn) {
      try {
        link = (await ShareAPI.recipeLink(recipeId))?.url || null;
      } catch {
        // text-only fallback — the button never depends on the network
      }
    }
    const { copied } = await sharePlainText(buildRecipeShareText(recipe), recipe.title, link);
    // web without a share sheet lands on the clipboard — say so (no silent success)
    if (copied) show({ message: "Recipe copied — paste it anywhere." });
  };

  useEffect(() => {
    const loadRecipeDetail = async () => {
      setLoading(true);
      setRelated([]);
      setComputedNutrition(null);
      try {
        if (isUserRecipeId(recipeId)) {
          const row = await UserRecipeAPI.get(recipeId);
          const transformed = transformUserRecipe(row);
          setRecipe(transformed);
          setComputedNutrition(transformed.nutrition);
          if (transformed.servings) setServings(transformed.servings);
          return;
        }
        // seed nutrition: cached server-side; null while the provider is
        // dormant or the visitor is anonymous — card keeps the estimate
        NutritionAPI.seed(recipeId)
          .then((r) => setComputedNutrition(r?.nutrition || null))
          .catch(() => setComputedNutrition(null));
        const mealData = await MealAPI.getMealById(recipeId);
        if (mealData) {
          const transformedRecipe = MealAPI.transformMealData(mealData);
          setRecipe({ ...transformedRecipe, youtubeUrl: mealData.strYoutube || null });

          // Exit section: same-category recipes (filter.php omits strCategory —
          // stamp it back on, same fix as Discover).
          if (mealData.strCategory) {
            MealAPI.filterByCategory(mealData.strCategory)
              .then((meals) =>
                setRelated(
                  meals
                    .filter((m) => m.idMeal !== String(mealData.idMeal))
                    .slice(0, 4)
                    .map((m) => ({
                      ...MealAPI.transformMealData(m),
                      category: mealData.strCategory,
                    }))
                )
              )
              .catch(() => setRelated([]));
          }
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

  // Own recipes can be edited in place — re-pull on focus so returning from
  // the editor never shows stale rows; a 404 means it was deleted, so the
  // ghost page empties out instead of staying interactive.
  useFocusEffect(
    useCallback(() => {
      if (!isUserRecipeId(recipeId)) return;
      UserRecipeAPI.get(recipeId)
        .then((row) => {
          const fresh = transformUserRecipe(row);
          setRecipe(fresh);
          // an edit may have voided/recomputed nutrition server-side — the
          // card must never show pre-edit numbers against new ingredients
          setComputedNutrition(fresh.nutrition);
          if (fresh.servings) setServings(fresh.servings);
        })
        .catch((error) => {
          if (/not found/i.test(error.message)) setRecipe(null);
        });
    }, [recipeId])
  );

  if (loading) return <LoadingSpinner message="Getting the recipe ready..." />;
  if (!recipe) {
    // never a blank wall — plan/tonight snapshots can point at deleted recipes
    return (
      <View style={[recipeDetailStyles.container, { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }]}>
        <Text style={recipeDetailStyles.recipeTitle}>That page is gone</Text>
        <Text style={recipeDetailStyles.attributionText}>
          Otto looked everywhere — this recipe isn't on the shelf anymore.
        </Text>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          style={[recipeDetailStyles.backButton, { width: "auto", paddingHorizontal: 20 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ color: colors.ink, fontWeight: "700" }}>Take me back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  const addToWeek = async (day) => {
    setPlanOpen(false);
    try {
      await PlanAPI.add({
        day: day.key,
        recipeId: String(recipe.id),
        title: recipe.title,
        image: recipe.image,
        category: recipe.category,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      show({ message: `On ${day.label === "Today" || day.label === "Tomorrow" ? day.label.toLowerCase() : day.label}'s card — Otto's week has plans.` });
    } catch (error) {
      show({ message: error.message || "Couldn't add it to the week." });
    }
  };

  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={recipeDetailStyles.scrollContent}
      >
        {/* HERO — photo only; the art is never a text background (v3) */}
        <View style={recipeDetailStyles.headerContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={recipeDetailStyles.headerImage}
            contentFit="cover"
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
            <View style={recipeDetailStyles.heroActionCluster}>
              <TouchableOpacity
                style={recipeDetailStyles.backButton}
                onPress={shareRecipe}
                onLongPress={shareAsCard}
                accessibilityRole="button"
                accessibilityLabel="Share this recipe"
                accessibilityHint={shareCardAvailable() ? "Long press to share as a picture" : undefined}
              >
                <Ionicons name="share-outline" size={20} color={colors.ink} />
              </TouchableOpacity>
              {isOwn ? (
                <TouchableOpacity
                  style={recipeDetailStyles.backButton}
                  onPress={() => router.push(`/recipe/edit?id=${recipeId}`)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit recipe"
                >
                  <Ionicons name="pencil" size={20} color={colors.ink} />
                </TouchableOpacity>
              ) : (
                <PawMark recipe={recipe} size={26} style={{ width: 44, height: 44 }} />
              )}
            </View>
          </View>
        </View>

        {/* TITLE BLOCK — identity lives on the cream, not the photo */}
        <View style={recipeDetailStyles.titleBlock}>
          <Text style={recipeDetailStyles.eyebrow}>
            {[recipe.category, recipe.area].filter(Boolean).join("  ·  ")}
          </Text>
          <Text style={recipeDetailStyles.recipeTitle}>{recipe.title}</Text>

          {/* Attribution slot — source = author; the credit never edits away */}
          {recipe.source === "imported" && recipe.sourceUrl ? (
            <TouchableOpacity
              style={recipeDetailStyles.attributionRow}
              onPress={() => Linking.openURL(recipe.sourceUrl)}
              accessibilityRole="link"
              accessibilityLabel={`Open the original recipe on ${recipe.sourceName || "the source site"}`}
            >
              <View style={recipeDetailStyles.attributionIcon}>
                <Ionicons name="link" size={12} color={colors.accent} />
              </View>
              <Text style={recipeDetailStyles.attributionText}>
                From {recipe.sourceName || "the web"}{" "}
                <Ionicons name="open-outline" size={12} color={colors.accent} />
              </Text>
            </TouchableOpacity>
          ) : recipe.source === "manual" ? (
            <View style={recipeDetailStyles.attributionRow}>
              <View style={recipeDetailStyles.attributionIcon}>
                <Ionicons name="person" size={12} color={colors.accent} />
              </View>
              <Text style={recipeDetailStyles.attributionText}>By you — from your kitchen</Text>
            </View>
          ) : (
            <View style={recipeDetailStyles.attributionRow}>
              <Image
                source={require("../../assets/mascot/otto-badge.png")}
                style={recipeDetailStyles.attributionBadge}
                contentFit="cover"
              />
              <Text style={recipeDetailStyles.attributionText}>From Otto's kitchen</Text>
            </View>
          )}

          {/* Honest meta — every number computed from real data */}
          <View style={recipeDetailStyles.metaRow}>
            <View style={recipeDetailStyles.metaSlot}>
              <Text style={recipeDetailStyles.metaValue}>{servings}</Text>
              <Text style={recipeDetailStyles.metaLabel}>
                {servings === 1 ? "serving" : "servings"}
              </Text>
            </View>
            <View style={recipeDetailStyles.metaDivider} />
            <View style={recipeDetailStyles.metaSlot}>
              <Text style={recipeDetailStyles.metaValue}>{pairs.length}</Text>
              <Text style={recipeDetailStyles.metaLabel}>ingredients</Text>
            </View>
            <View style={recipeDetailStyles.metaDivider} />
            <View style={recipeDetailStyles.metaSlot}>
              <Text style={recipeDetailStyles.metaValue}>{methodSteps.length}</Text>
              <Text style={recipeDetailStyles.metaLabel}>steps</Text>
            </View>
          </View>
        </View>

        <View style={recipeDetailStyles.contentSection}>
          {/* NUTRITION — sits directly under the attribution/meta block, above
              Ingredients (founder call, 2026-07-16). Was after Method
              (Crouton/ReciMe placement). It reads the SAME `servings` the
              stepper drives, so "whole recipe" tracks the scaled ingredients;
              per-serving is per-serving and correctly does not move. */}
          <View style={recipeDetailStyles.sectionContainer}>
            <Text style={recipeDetailStyles.sectionTitle}>Nutrition</Text>
            <NutritionCard
              {...getNutritionEstimate(recipe.category)}
              computed={computedNutrition}
              servings={servings}
            />
          </View>

          {/* INGREDIENTS — live scaling + US/Metric (deep-dive blueprint) */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionHeaderRow}>
              <Text style={recipeDetailStyles.sectionTitleInline}>Ingredients</Text>
              <View style={recipeDetailStyles.unitToggleRow}>
                <TouchableOpacity onPress={() => pickUnits("us")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Show US units">
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
                <TouchableOpacity onPress={() => pickUnits("metric")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Show metric units">
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
                {/* Reset sits beside the stepper, not under it: it belongs to
                    the control it undoes, and a chip appearing below used to
                    push the ingredient rows down as soon as you tapped +. */}
                {scaleFactor !== 1 && (
                  <TouchableOpacity
                    style={recipeDetailStyles.scaleChip}
                    onPress={() => tickServings(baseServings)}
                    accessibilityRole="button"
                    accessibilityLabel="Reset servings"
                  >
                    <Text style={recipeDetailStyles.scaleChipText}>
                      ×{formatQty(scaleFactor)} · Reset
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={recipeDetailStyles.servesButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => tickServings(servings - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease servings"
                >
                  <Text style={recipeDetailStyles.servesButtonText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={recipeDetailStyles.servesButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => tickServings(servings + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increase servings"
                >
                  <Text style={recipeDetailStyles.servesButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

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
                    // Load the embed inside an HTML doc with a real baseUrl origin.
                    // A bare `uri: youtube.com/embed/...` sends no referer, which
                    // YouTube rejects with "Error 153 — player configuration error";
                    // giving the iframe an origin fixes it. playsinline + the
                    // inline-playback props keep it in the card instead of forcing
                    // the fullscreen native player on first tap.
                    source={{
                      html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>*{margin:0;padding:0}html,body{height:100%;background:#000;overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style></head><body><iframe src="https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&fs=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`,
                      baseUrl: "https://www.youtube.com",
                    }}
                    allowsFullscreenVideo
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                    originWhitelist={["*"]}
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
          {methodSteps.length > 0 && (
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
                        onPress={() => router.push(`/recipe/cook/${recipe.id}?step=${index}&servings=${servings}`)}
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
          )}

          {/* EXIT — the page never dead-ends on a data card */}
          {related.length > 0 && (
            <View style={recipeDetailStyles.sectionContainer}>
              <Text style={recipeDetailStyles.sectionTitle}>More from the pantry</Text>
              <Text style={recipeDetailStyles.relatedCaption}>
                Other {recipe.category?.toLowerCase()} dishes Otto keeps close by.
              </Text>
              <View style={recipeDetailStyles.relatedGrid}>
                {related.map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Off-screen share card — capture needs a mounted, laid-out view;
          positioned out of the viewport, never unmounted mid-capture. */}
      {shareCardAvailable() && (
        <View style={{ position: "absolute", left: -9999, top: 0 }} pointerEvents="none">
          <ShareCard ref={shareCardRef} recipe={recipe} />
        </View>
      )}

      {/* PINNED BOTTOM BAR — Start cooking is the primary; Add-to-plan its one
          quiet companion. Save + Share live in the hero cluster (top-right),
          so they're NOT repeated here (that squeezed the primary button). */}
      <View style={[recipeDetailStyles.bottomBar, { paddingBottom: safeBottom }]}>
        <TouchableOpacity
          style={recipeDetailStyles.planButton}
          onPress={() => setPlanOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add to Otto's week"
        >
          <Ionicons name="calendar-outline" size={22} color={colors.accent} />
        </TouchableOpacity>
        {methodSteps.length > 0 ? (
          <Bounceable
            style={recipeDetailStyles.cookButton}
            containerStyle={{ flex: 1 }}
            onPress={() => router.push(`/recipe/cook/${recipe.id}?servings=${servings}`)}
            accessibilityRole="button"
            accessibilityLabel="Start cooking step by step"
          >
            <Ionicons name="flame-outline" size={20} color={colors.white} />
            <Text style={recipeDetailStyles.cookButtonText}>Start cooking</Text>
          </Bounceable>
        ) : (
          // Steps were optional at save — no fake cook entrance, offer the fix
          <Bounceable
            style={recipeDetailStyles.cookButton}
            containerStyle={{ flex: 1 }}
            onPress={() => router.push(`/recipe/edit?id=${recipeId}`)}
            accessibilityRole="button"
            accessibilityLabel="Add steps to cook this"
          >
            <Ionicons name="create-outline" size={20} color={colors.white} />
            <Text style={recipeDetailStyles.cookButtonText}>Add steps to cook this</Text>
          </Bounceable>
        )}
      </View>

      {/* Day picker — which card does this land on? */}
      <Modal visible={planOpen} transparent animationType="slide">
        <View style={recipeDetailStyles.sheetScrim}>
          <View style={[recipeDetailStyles.sheet, { paddingBottom: safeBottom + SPACING.md }]}>
            <View style={recipeDetailStyles.sheetHandle} />
            <Text style={recipeDetailStyles.sheetTitle}>Add to Otto's week</Text>
            {weekDays().map((day) => (
              <TouchableOpacity
                key={day.key}
                style={recipeDetailStyles.dayRow}
                onPress={() => addToWeek(day)}
                accessibilityRole="button"
                accessibilityLabel={`Add to ${day.label}`}
              >
                <Text style={recipeDetailStyles.dayRowText}>{day.label}</Text>
                <Text style={recipeDetailStyles.dayRowSub}>{day.sub}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={recipeDetailStyles.sheetClose}
              onPress={() => setPlanOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={recipeDetailStyles.sheetCloseText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RecipeDetailScreen;
