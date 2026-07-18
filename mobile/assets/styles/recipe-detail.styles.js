import { StyleSheet, Dimensions } from "react-native";
import { SPACING, RADIUS, OVERLAY, TYPE } from "../../constants/tokens";

const { width } = Dimensions.get("window");

// Recipe Detail v3 — anatomy per the Mobbin layout study (docs/REDESIGN_NOTES):
// photo-only hero → title block on cream (eyebrow → serif title → attribution
// → computed meta row) → ingredients → video → method → nutrition →
// related-recipes exit → pinned bottom bar.
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
    heroActionCluster: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },

    // TITLE BLOCK — on cream, below the photo (9/11 apps in the study)
    titleBlock: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.xl,
    },
    eyebrow: {
      ...TYPE.caption,
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: SPACING.sm,
    },
    recipeTitle: {
      ...TYPE.display,
      color: colors.ink,
    },
    attributionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    attributionBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surfaceWarm,
    },
    attributionIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    attributionText: {
      ...TYPE.label,
      fontSize: 13,
      color: colors.inkSoft,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.lg,
      paddingVertical: SPACING.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    metaSlot: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 5,
    },
    metaDivider: {
      width: 1,
      height: 18,
      backgroundColor: colors.border,
    },
    metaValue: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    metaLabel: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
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
    // Sits INLINE in servesControls, beside the − / + stepper. The old
    // alignSelf/marginBottom were for the stacked position under the band.
    scaleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.accentSoft,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      marginRight: SPACING.xs,
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

    // EXIT — related recipes close the page (never dead-end on data)
    relatedCaption: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
      marginTop: -SPACING.md,
      marginBottom: SPACING.lg,
    },
    relatedGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.lg,
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
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },
    cookButton: {
      flex: 1,
      height: 54,
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
    planButton: {
      width: 54,
      height: 54,
      borderRadius: RADIUS.button,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },

    // Add-to-week day sheet
    sheetScrim: {
      flex: 1,
      backgroundColor: OVERLAY.scrim,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: SPACING.md,
    },
    sheetTitle: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.sm,
    },
    dayRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dayRowText: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.ink,
    },
    dayRowSub: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },
    sheetClose: {
      alignSelf: "center",
      paddingVertical: SPACING.md,
    },
    sheetCloseText: {
      ...TYPE.label,
      color: colors.inkSoft,
    },
  });
