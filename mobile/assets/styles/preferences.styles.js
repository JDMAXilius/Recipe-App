// Food preferences picker (profile → Food preferences). KS-style explicit
// Save: changes re-rank Discover, so they commit once, deliberately.
import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

export const createPreferencesStyles = (colors) =>
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
    saveButton: {
      minWidth: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.md,
    },
    saveText: {
      ...TYPE.label,
      color: colors.accent,
    },
    saveTextIdle: {
      color: colors.inkSoft,
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
    sectionLabel: {
      ...TYPE.label,
      color: colors.inkSoft,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontSize: 12,
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.lg,
      paddingHorizontal: SPACING.md,
    },
    dietRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    dietRowLast: {
      borderBottomWidth: 0,
    },
    dietLabel: {
      ...TYPE.body,
      color: colors.ink,
      flex: 1,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOn: {
      borderColor: colors.accent,
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    dietFootnote: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    },
    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
    },
    chip: {
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.surfaceWarm,
    },
    chipOn: {
      backgroundColor: colors.accent,
    },
    chipText: {
      ...TYPE.label,
      fontSize: 13,
      color: colors.ink,
    },
    chipTextOn: {
      color: colors.white,
    },
  });
