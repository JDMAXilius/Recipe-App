import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// Saved screen v2 — flat grid, count header, Otto-Sad first-run empty state
// (MOBBIN_COMPARISON §2.5).
export const createFavoritesStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.md,
    },
    title: {
      ...TYPE.display,
      fontSize: 28,
      lineHeight: 34,
      color: colors.ink,
    },
    count: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },
    recipesSection: {
      paddingHorizontal: SPACING.lg,
    },
    recipesGrid: {
      gap: SPACING.lg,
      paddingBottom: SPACING.xxl,
    },
    row: {
      justifyContent: "space-between",
      gap: SPACING.lg,
    },

    // Empty state — full-screen Otto moment (first-run)
    emptyState: {
      alignItems: "center",
      paddingTop: SPACING.xxl * 2,
      paddingHorizontal: SPACING.xxl,
    },
    emptyOtto: {
      width: 200,
      height: 200,
      marginBottom: SPACING.lg,
    },
    emptyTitle: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.sm,
      textAlign: "center",
    },
    emptyDescription: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
      marginBottom: SPACING.xl,
    },
    exploreButton: {
      backgroundColor: colors.accent,
      borderRadius: RADIUS.button,
      height: 52,
      paddingHorizontal: SPACING.xxl,
      alignItems: "center",
      justifyContent: "center",
    },
    exploreButtonText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.white,
    },
  });
