import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// "Chat with Otto" conversational build screen. Warm, light, Lora display for
// the recipe title; Otto on the left, you on the right; clarify options and the
// recipe result render inline under Otto's bubble.
export const createOttoStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    thread: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
      gap: SPACING.lg,
    },

    // OTTO (left)
    ottoRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" },
    avatar: { width: 34, height: 34, marginTop: 2 },
    ottoCol: { flex: 1, gap: SPACING.sm, alignItems: "flex-start" },
    ottoBubble: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.card,
      borderTopLeftRadius: 4,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      maxWidth: "92%",
    },
    ottoText: { ...TYPE.body, color: colors.ink, lineHeight: 21 },

    // YOU (right)
    youRow: { flexDirection: "row", justifyContent: "flex-end" },
    youBubble: {
      backgroundColor: colors.accent,
      borderRadius: RADIUS.card,
      borderTopRightRadius: 4,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      maxWidth: "82%",
    },
    youText: { ...TYPE.body, color: colors.white, lineHeight: 21 },

    // CLARIFY CHIPS
    chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
    chip: {
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.accentSoft,
    },
    chipText: { ...TYPE.body, fontSize: 13, fontWeight: "700", color: colors.accent },

    // RECIPE RESULT CARD
    recipeCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.card,
      padding: SPACING.md,
      gap: SPACING.sm,
      alignSelf: "stretch",
    },
    recipeTitle: { ...TYPE.display, fontSize: 20, lineHeight: 26, color: colors.ink },
    recipeMeta: { ...TYPE.caption, color: colors.inkSoft },
    recipeLines: { gap: 4, marginTop: 2 },
    recipeLine: { flexDirection: "row", gap: SPACING.sm, alignItems: "baseline" },
    recipeMeasure: {
      ...TYPE.body,
      fontSize: 13,
      fontWeight: "700",
      color: colors.accent,
      minWidth: 64,
    },
    recipeName: { ...TYPE.body, fontSize: 13, color: colors.ink, flex: 1 },
    recipeMore: { ...TYPE.caption, color: colors.inkSoft, marginTop: 2 },
    saveButton: {
      height: 48,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      marginTop: SPACING.xs,
    },
    saveText: { ...TYPE.body, fontWeight: "700", color: colors.white },
    tweakButton: { alignSelf: "center", paddingVertical: SPACING.xs },
    tweakText: { ...TYPE.body, fontSize: 13, fontWeight: "700", color: colors.accent },

    // THINKING
    thinking: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    thinkingText: { ...TYPE.body, fontSize: 13, color: colors.inkSoft },

    // INPUT BAR
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.button,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm + 2,
      paddingBottom: SPACING.sm,
      ...TYPE.body,
      color: colors.ink,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: { opacity: 0.4 },
  });
