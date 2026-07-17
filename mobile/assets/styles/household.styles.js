// Shared list ("our list") — S3. Plain warm surfaces, no pad: this list
// belongs to several hands, so it reads like the app, not like one
// person's notepad.
import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

export const createHouseholdStyles = (colors) =>
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
      padding: SPACING.lg,
      paddingBottom: SPACING.xxl * 2,
    },
    intro: {
      ...TYPE.body,
      color: colors.inkSoft,
      marginBottom: SPACING.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    cardTitle: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.ink,
    },
    cardHint: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.button,
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.md,
      height: 44,
      ...TYPE.body,
      color: colors.ink,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      backgroundColor: colors.accent,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.md,
    },
    primaryButtonText: {
      ...TYPE.label,
      color: colors.white,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.md - 2,
    },
    secondaryButtonText: {
      ...TYPE.label,
      color: colors.accent,
    },
    // joined view
    countLine: {
      ...TYPE.caption,
      color: colors.inkSoft,
      letterSpacing: 1.5,
      textAlign: "center",
      marginBottom: SPACING.md,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      marginBottom: SPACING.sm,
    },
    itemCheck: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    itemCheckOn: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    itemBody: {
      flex: 1,
    },
    itemName: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.ink,
    },
    itemNameChecked: {
      color: colors.inkSoft,
      textDecorationLine: "line-through",
    },
    itemQty: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.accent,
    },
    itemWho: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: 1,
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginTop: SPACING.xs,
      marginBottom: SPACING.lg,
    },
    addInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.button,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      height: 44,
      ...TYPE.body,
      color: colors.ink,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    quietAction: {
      alignSelf: "center",
      paddingVertical: SPACING.sm,
    },
    quietActionText: {
      ...TYPE.label,
      color: colors.inkSoft,
    },
    emptyList: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
      gap: SPACING.sm,
    },
    emptyText: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
    },
  });
