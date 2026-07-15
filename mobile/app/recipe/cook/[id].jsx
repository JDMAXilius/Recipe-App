import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { MealAPI } from "../../../services/mealAPI";
import { useTheme } from "../../../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../../../constants/tokens";
import LoadingSpinner from "../../../components/LoadingSpinner";

// Cook Mode v1 (P2-5): the messy-hands surface. One step per screen, big
// type, one giant Next, ingredients peek, screen kept awake. No timers, no
// voice — that's v2 (see REDESIGN_NOTES). Finish = Proud Otto.

const CookModeScreen = () => {
  useKeepAwake();
  const { id: recipeId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mealData = await MealAPI.getMealById(recipeId);
        if (mealData) setRecipe(MealAPI.transformMealData(mealData));
      } catch (error) {
        console.error("Error loading cook mode:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [recipeId]);

  if (loading) return <LoadingSpinner message="Setting up your station..." />;
  if (!recipe || recipe.instructions.length === 0) {
    router.back();
    return null;
  }

  const steps = recipe.instructions;
  const isLast = step === steps.length - 1;

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (isLast) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFinished(true);
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      Haptics.selectionAsync().catch(() => {});
      setStep(step - 1);
    }
  };

  // FINISH — Proud Otto earns his keep
  if (finished) {
    return (
      <View style={[styles.container, styles.finishContainer]}>
        <Image
          source={require("../../../assets/mascot/otto-proud-cut.png")}
          style={styles.finishOtto}
          contentFit="contain"
          accessible={false}
        />
        <Text style={styles.finishTitle}>Dinner, done.</Text>
        <Text style={styles.finishBody}>Otto's proud of you.</Text>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to recipe"
        >
          <Text style={styles.nextButtonText}>Back to the recipe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER: progress + close */}
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i <= step && styles.progressSegmentDone]}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Exit cooking mode"
        >
          <Ionicons name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <Text style={styles.stepCounter}>
        Step {step + 1} of {steps.length}
      </Text>

      {/* THE STEP */}
      <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent}>
        <Text style={styles.stepText}>{steps[step]}</Text>
      </ScrollView>

      {/* INGREDIENTS PEEK */}
      {showIngredients && (
        <View style={styles.peekPanel}>
          <ScrollView contentContainerStyle={styles.peekContent}>
            {recipe.ingredients.map((ing, i) => (
              <Text key={i} style={styles.peekText}>
                • {ing}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CONTROLS — thumb-sized, one obvious next action */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => setShowIngredients(!showIngredients)}
          style={styles.peekButton}
          accessibilityRole="button"
          accessibilityLabel={showIngredients ? "Hide ingredients" : "Show ingredients"}
        >
          <Ionicons name="list-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
        {step > 0 && (
          <TouchableOpacity
            onPress={goBack}
            style={styles.backStepButton}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={advance}
          style={styles.nextButton}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Finish cooking" : "Next step"}
        >
          <Text style={styles.nextButtonText}>{isLast ? "Finish" : "Next step"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      gap: SPACING.md,
    },
    progressTrack: {
      flex: 1,
      flexDirection: "row",
      gap: 4,
    },
    progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.border,
    },
    progressSegmentDone: {
      backgroundColor: colors.accent,
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCounter: {
      ...TYPE.caption,
      color: colors.inkSoft,
      paddingHorizontal: SPACING.xl,
      marginTop: SPACING.md,
    },
    stepScroll: {
      flex: 1,
    },
    stepContent: {
      padding: SPACING.xl,
    },
    stepText: {
      ...TYPE.step,
      color: colors.ink,
    },
    peekPanel: {
      maxHeight: 220,
      backgroundColor: colors.surfaceWarm,
      borderTopLeftRadius: RADIUS.sheet,
      borderTopRightRadius: RADIUS.sheet,
    },
    peekContent: {
      padding: SPACING.lg,
    },
    peekText: {
      ...TYPE.body,
      color: colors.ink,
      marginBottom: SPACING.xs,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    peekButton: {
      width: 52,
      height: 52,
      borderRadius: RADIUS.button,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    backStepButton: {
      width: 52,
      height: 52,
      borderRadius: RADIUS.button,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    nextButton: {
      flex: 1,
      height: 56,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    nextButtonText: {
      ...TYPE.body,
      fontSize: 17,
      fontWeight: "700",
      color: colors.white,
    },
    finishContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: SPACING.xxl,
      gap: SPACING.sm,
    },
    finishOtto: {
      width: 220,
      height: 220,
      marginBottom: SPACING.lg,
    },
    finishTitle: {
      ...TYPE.display,
      color: colors.ink,
    },
    finishBody: {
      ...TYPE.body,
      color: colors.inkSoft,
      marginBottom: SPACING.xl,
    },
    finishButton: {
      height: 56,
      paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default CookModeScreen;
