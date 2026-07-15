import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// Account v2 (MOBBIN_COMPARISON §2.6): identity header (badge-crop-safe Otto),
// reserved subscription slot, honest utility rows only, sign-out, version.
export const createProfileStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xxl,
    },
    title: {
      ...TYPE.display,
      fontSize: 28,
      lineHeight: 34,
      color: colors.ink,
      marginBottom: SPACING.lg,
    },

    // IDENTITY
    identityCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      gap: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    mascotBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.accent,
    },
    mascotImage: {
      width: "100%",
      height: "100%",
    },
    identityText: {
      flex: 1,
    },
    email: {
      ...TYPE.body,
      fontSize: 16,
      fontWeight: "700",
      color: colors.ink,
      marginBottom: 2,
    },
    identityCaption: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },

    // GROUPED ROWS
    section: {
      marginBottom: SPACING.xl,
    },
    sectionLabel: {
      ...TYPE.caption,
      color: colors.inkSoft,
      marginBottom: SPACING.sm,
      marginLeft: SPACING.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.lg,
      gap: SPACING.md,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowText: {
      ...TYPE.body,
      fontSize: 15,
      color: colors.ink,
      flex: 1,
    },

    // SIGN OUT + VERSION
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      borderWidth: 1.5,
      borderColor: colors.destructive,
      borderRadius: RADIUS.button,
      height: 52,
      marginBottom: SPACING.xl,
    },
    signOutText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.destructive,
    },
    version: {
      ...TYPE.caption,
      color: colors.inkSoft,
      textAlign: "center",
    },
  });
