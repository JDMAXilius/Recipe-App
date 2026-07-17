// Reminders settings (profile → Preferences → Reminders).
import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

export const createNotificationStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceWarm,
    },
    headerTitle: {
      ...TYPE.title,
      color: colors.ink,
    },
    scroll: {
      paddingBottom: SPACING.xxl * 2,
    },
    scopeNote: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
    },
    permissionBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
    },
    permissionText: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.ink,
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.md,
    },
    rowBody: {
      flex: 1,
    },
    rowTitle: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.ink,
    },
    rowHint: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
      marginTop: 2,
    },
    hourRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      paddingBottom: SPACING.md,
      paddingLeft: SPACING.md + 20 + SPACING.md - SPACING.md,
    },
    hourChip: {
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      backgroundColor: colors.surfaceWarm,
    },
    hourChipOn: {
      backgroundColor: colors.accent,
    },
    hourChipText: {
      ...TYPE.label,
      fontSize: 13,
      color: colors.ink,
    },
    hourChipTextOn: {
      color: colors.white,
    },
  });
