import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// "You" — Account v3 (Mobbin account study): identity header, earned-stats
// card (each number a door), journal row, inline units toggle, support rows,
// quiet sign-out + visible delete. No fabricated numbers, ever.
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
    identityName: {
      ...TYPE.title,
      fontSize: 20,
      color: colors.ink,
      marginBottom: 2,
    },
    email: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
    },

    // STATS — earned numbers, each one a door (AllTrails pattern)
    statsCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: SPACING.lg,
    },
    statCell: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statCellDivider: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    statValue: {
      ...TYPE.display,
      fontSize: 26,
      lineHeight: 32,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    statLabel: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },
    statsEmptyNote: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: SPACING.sm,
      marginLeft: SPACING.xs,
    },
    rowValue: {
      ...TYPE.body,
      fontSize: 13,
      fontWeight: "700",
      color: colors.inkSoft,
      fontVariant: ["tabular-nums"],
    },

    // UNITS — inline segmented value, one tap, no subscreen (SideChef)
    unitToggle: {
      flexDirection: "row",
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.pill,
      padding: 3,
    },
    unitOption: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      borderRadius: RADIUS.pill,
    },
    unitOptionActive: {
      backgroundColor: colors.accent,
    },
    unitOptionText: {
      ...TYPE.label,
      fontSize: 12,
      color: colors.inkSoft,
    },
    unitOptionTextActive: {
      color: colors.white,
    },

    // Otto Club card — copy left, floating-Otto art anchored right, breaking
    // the card edge (Duolingo sticker bleed). Renders ONLY in the free state.
    clubCard: {
      marginTop: SPACING.sm,
      backgroundColor: colors.surfaceWarm,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: RADIUS.card,
      flexDirection: "row",
      overflow: "hidden",
      padding: SPACING.lg,
      minHeight: 120,
    },
    clubCopy: {
      flex: 1,
      gap: SPACING.sm,
      paddingRight: SPACING.sm,
    },
    clubTitle: {
      ...TYPE.display,
      fontSize: 20,
      lineHeight: 26,
      color: colors.accent,
    },
    clubBody: {
      ...TYPE.body,
      fontSize: 12,
      lineHeight: 17,
      color: colors.ink,
    },
    clubPill: {
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    clubPillText: {
      ...TYPE.label,
      fontSize: 12,
      color: colors.white,
    },
    clubArt: {
      width: "44%",
      aspectRatio: 1184 / 764, // painting's native ratio — never squished
      alignSelf: "flex-end",
      marginRight: -SPACING.lg, // art bleeds off the card edge
      marginBottom: -SPACING.md,
    },
    deleteRow: {
      alignSelf: "center",
      paddingVertical: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    deleteText: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.destructive,
      opacity: 0.8,
    },
    deleteTextArmed: {
      fontWeight: "800",
      opacity: 1,
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
