import { StyleSheet, Dimensions } from "react-native";
import { SPACING, RADIUS, OVERLAY, TYPE } from "../../constants/tokens";

const { width } = Dimensions.get("window");
const cardWidth = (width - SPACING.lg * 3) / 2;

// Discover (Home + Search merged — docs/MOBBIN_COMPARISON.md §2.1/§2.3).
export const createHomeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingBottom: SPACING.xxl,
    },

    // Greeting band — one warm line + small Otto; scrolls away (B6).
    greetingSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    greetingText: {
      ...TYPE.display,
      fontSize: 26,
      lineHeight: 32,
      color: colors.ink,
      flex: 1,
      paddingRight: SPACING.md,
    },
    greetingOtto: {
      width: 64,
      height: 64,
    },

    // Search pill — part of the warm header, not a grey utility bar.
    searchSection: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.lg,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.lg,
      height: 48,
    },
    searchIcon: {
      marginRight: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      ...TYPE.body,
      color: colors.ink,
      height: "100%",
    },

    // Featured
    featuredSection: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    featuredCard: {
      borderRadius: RADIUS.card,
      overflow: "hidden",
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    featuredImageContainer: {
      height: 240,
      backgroundColor: colors.surfaceWarm,
      position: "relative",
    },
    featuredImage: {
      width: "100%",
      height: "100%",
    },
    featuredOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: OVERLAY.scrim,
      justifyContent: "space-between",
      padding: SPACING.lg,
    },
    featuredBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      borderRadius: RADIUS.pill,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    featuredBadgeText: {
      ...TYPE.caption,
      color: colors.accent,
    },
    featuredContent: {
      justifyContent: "flex-end",
    },
    featuredTitle: {
      ...TYPE.display,
      color: colors.white,
      marginBottom: SPACING.sm,
      textShadowColor: OVERLAY.textShadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    featuredMeta: {
      flexDirection: "row",
      gap: SPACING.lg,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      ...TYPE.label,
      color: colors.white,
    },

    // Sections
    recipesSection: {
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    },
    sectionHeader: {
      marginBottom: SPACING.lg,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    sectionTitle: {
      ...TYPE.title,
      color: colors.ink,
    },
    sectionCount: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },
    recipesGrid: {
      gap: SPACING.lg,
    },
    row: {
      justifyContent: "space-between",
      gap: SPACING.lg,
    },

    // Search-empty — small Thinking Otto above the keyboard, no button (B6).
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.xxl,
    },
    emptyOtto: {
      width: 120,
      height: 120,
      marginBottom: SPACING.md,
    },
    emptyTitle: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.xs,
      textAlign: "center",
    },
    emptyDescription: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
    },
  });

// Category tiles — large illustrated food art on a shared warm tint (B5.1).
export const createCategoryStyles = (colors) =>
  StyleSheet.create({
    categoryFilterContainer: {
      marginBottom: SPACING.xl,
    },
    categoryFilterScrollContent: {
      paddingHorizontal: SPACING.lg,
      gap: SPACING.md,
    },
    categoryButton: {
      alignItems: "center",
      width: 84,
    },
    categoryTile: {
      width: 76,
      height: 76,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "transparent",
      overflow: "hidden",
    },
    selectedCategoryTile: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    categoryImage: {
      width: 68,
      height: 68,
    },
    categoryText: {
      ...TYPE.label,
      fontSize: 12,
      color: colors.inkSoft,
      textAlign: "center",
      marginTop: 6,
    },
    selectedCategoryText: {
      color: colors.accent,
    },
  });

// RecipeCard v2 — photo ~70%, ONE pill on photo, title below, paw mark (B8).
export const createRecipeCardStyles = (colors) =>
  StyleSheet.create({
    container: {
      width: cardWidth,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      marginBottom: SPACING.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: "hidden",
    },
    imageContainer: {
      position: "relative",
      height: cardWidth * 1.05,
    },
    image: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.surfaceWarm,
    },
    categoryPill: {
      position: "absolute",
      left: SPACING.sm,
      bottom: SPACING.sm,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: 4,
    },
    categoryPillText: {
      ...TYPE.caption,
      fontSize: 10,
      color: colors.ink,
    },
    pawPosition: {
      position: "absolute",
      top: SPACING.sm,
      right: SPACING.sm,
    },
    content: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    title: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.ink,
      lineHeight: 20,
    },
  });
