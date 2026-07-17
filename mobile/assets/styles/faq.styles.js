// Little questions (FAQ accordion) — profile → boring-but-important bits.
import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

export const createFaqStyles = (colors) =>
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
      gap: SPACING.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.md,
    },
    questionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
    },
    question: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.ink,
      flex: 1,
    },
    answer: {
      ...TYPE.body,
      color: colors.inkSoft,
      paddingBottom: SPACING.md,
      lineHeight: 21,
    },
    footer: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
      textAlign: "center",
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.lg,
    },
  });
