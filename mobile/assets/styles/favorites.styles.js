import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// Cookbook (was Saved) — flat grid, count header, in-screen segments
// (All · Saved · My recipes, Kitchen Stories pattern), Cooked filter chip,
// Otto empty states per segment.
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
    // Segment row — quiet words + painted daub underline (no switch chrome)
    segmentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.lg,
    },
    segmentText: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.inkSoft,
      opacity: 0.6,
    },
    segmentActive: {
      color: colors.ink,
      opacity: 1,
    },
    segmentDaub: {
      height: 3,
      borderRadius: 2,
      marginTop: 3,
      backgroundColor: "transparent",
    },
    segmentDaubActive: {
      backgroundColor: colors.accent,
    },
    cookedChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
    },
    cookedChipActive: {
      backgroundColor: colors.accent,
    },
    cookedChipText: {
      ...TYPE.label,
      fontSize: 12,
      color: colors.accent,
    },
    cookedChipTextActive: {
      color: colors.white,
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
      flexDirection: "row",
      gap: SPACING.sm,
    },
    exploreButtonText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.white,
    },
  });
