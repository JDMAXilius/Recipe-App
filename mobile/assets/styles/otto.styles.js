import { StyleSheet, Platform } from "react-native";
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

    // EMPTY STATE — minimal centered prompt (no greeting bubble, no chips)
    emptyThread: { flexGrow: 1, justifyContent: "center", padding: SPACING.lg },
    empty: { alignItems: "center", gap: SPACING.lg },
    emptyOtto: { width: 120, height: 120 },
    emptyText: {
      ...TYPE.display,
      fontSize: 22,
      lineHeight: 30,
      color: colors.ink,
      textAlign: "center",
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

    // HEADER — right-slot import action (no top X; the tab bar is the way out)
    headerAction: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceWarm,
    },

    // INPUT BAR — one rounded pill holding the field + a Speak/Send button,
    // so you can talk to Otto or type (founder's reference).
    inputBar: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: SPACING.sm,
      minHeight: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 28,
      backgroundColor: colors.surface,
      paddingLeft: SPACING.md,
      paddingRight: SPACING.xs + 2,
      paddingVertical: SPACING.xs,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      paddingTop: Platform.OS === "ios" ? SPACING.sm + 2 : SPACING.sm,
      paddingBottom: SPACING.sm,
      ...TYPE.body,
      color: colors.ink,
    },
    speakPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      height: 40,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.ink,
    },
    speakText: { ...TYPE.body, fontSize: 14, fontWeight: "700", color: colors.white },
    sendPill: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
  });
