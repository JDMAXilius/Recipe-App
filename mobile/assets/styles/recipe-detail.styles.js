import { StyleSheet, Dimensions } from "react-native";
import { SPACING, RADIUS, OVERLAY, TYPE } from "../../constants/tokens";

const { width } = Dimensions.get("window");

// Recipe Detail v2 — anatomy per MOBBIN_COMPARISON §2.4:
// hero → true facts → ingredients (tinted quantities, no chrome) →
// video row → steps → NutritionCard (estimate-framed) → pinned bottom bar.
export const createRecipeDetailStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingBottom: 120, // room for the pinned bottom bar
    },

    // HERO
    headerContainer: {
      height: width * 0.85,
      position: "relative",
    },
    headerImage: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.surfaceWarm,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    floatingButtons: {
      position: "absolute",
      top: SPACING.md,
      left: SPACING.lg,
      right: SPACING.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    titleSection: {
      position: "absolute",
      bottom: SPACING.lg,
      left: SPACING.lg,
      right: SPACING.lg,
    },
    badgeRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    categoryBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
    },
    categoryText: {
      ...TYPE.caption,
      color: colors.accent,
    },
    recipeTitle: {
      ...TYPE.display,
      color: colors.white,
      textShadowColor: OVERLAY.textShadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },

    // CONTENT
    contentSection: {
      paddingTop: SPACING.xl,
    },
    sectionContainer: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    sectionTitle: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.lg,
    },
    // Section header band: serif title left + ONE quiet action right (deep-dive rule)
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    sectionTitleInline: {
      ...TYPE.title,
      color: colors.ink,
    },
    unitToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    unitToggleText: {
      ...TYPE.label,
      color: colors.inkSoft,
      opacity: 0.5,
    },
    unitToggleActive: {
      color: colors.accent,
      opacity: 1,
    },
    unitToggleSep: {
      ...TYPE.label,
      color: colors.border,
    },

    // Serves band — "For N servings" + compact stepper (Tasty × Kitchen Stories)
    servesBand: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    servesText: {
      ...TYPE.body,
      color: colors.ink,
    },
    servesCount: {
      fontWeight: "700",
      color: colors.accent,
      fontVariant: ["tabular-nums"],
    },
    servesControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    servesButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    servesButtonText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.ink,
      lineHeight: 22,
    },
    scaleChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.accentSoft,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: 4,
      marginBottom: SPACING.md,
    },
    scaleChipText: {
      ...TYPE.label,
      color: colors.accent,
    },
    pantryGap: {
      height: SPACING.md,
    },
    metricNote: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: SPACING.sm,
    },

    // METHOD — inline semantic ink (terracotta = computed, ink = authored)
    durationChip: {
      color: colors.accent,
      fontWeight: "700",
      backgroundColor: colors.accentSoft,
    },
    tempText: {
      color: colors.secondary,
      fontWeight: "700",
    },
    ingredientBold: {
      fontWeight: "700",
    },
    usesLine: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: SPACING.xs,
    },
    stepHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    stepPlayButton: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceWarm,
    },

    // INGREDIENTS — flat rows, quantity tinted (Crouton pattern)
    ingredientRow: {
      flexDirection: "row",
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: SPACING.sm,
    },
    ingredientMeasure: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.accent,
      minWidth: 84,
      fontVariant: ["tabular-nums"],
    },
    ingredientName: {
      ...TYPE.body,
      color: colors.ink,
      flex: 1,
    },

    // VIDEO — inline thumbnail row (NYT pattern), never a hero
    videoCard: {
      borderRadius: RADIUS.card,
      overflow: "hidden",
      backgroundColor: colors.surfaceWarm,
      position: "relative",
      height: (width - SPACING.lg * 2) * 0.56,
    },
    videoThumb: {
      width: "100%",
      height: "100%",
    },
    videoScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: OVERLAY.scrim,
      alignItems: "center",
      justifyContent: "center",
    },
    videoPlayButton: {
      width: 64,
      height: 64,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    videoCaption: {
      ...TYPE.body,
      color: colors.inkSoft,
      marginTop: SPACING.sm,
    },
    webview: {
      width: "100%",
      height: "100%",
    },

    // STEPS — plain numbered, generous type, zero fake affordances
    instructionRow: {
      flexDirection: "row",
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    stepIndicator: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    stepNumber: {
      ...TYPE.label,
      color: colors.accent,
    },
    instructionText: {
      ...TYPE.body,
      fontSize: 16,
      lineHeight: 24,
      color: colors.ink,
      flex: 1,
    },

    // PINNED BOTTOM BAR — the next action never scrolls away
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      gap: SPACING.md,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },
    cookButton: {
      flex: 1,
      height: 52,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: SPACING.sm,
    },
    cookButtonText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.white,
    },
  });
