import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE, OVERLAY } from "../../constants/tokens";

// Otto's week + shopping list. Day cards are loose buckets: today wears a
// warm tint, empty days are one quiet line — invitations, never gray guilt.
export const createPlanStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      paddingBottom: SPACING.xxl * 2,
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
    listButtonWrap: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    listButton: {
      height: 48,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: SPACING.sm,
    },
    listButtonText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.white,
    },

    dayCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      padding: SPACING.md,
    },
    dayCardToday: {
      backgroundColor: colors.surfaceWarm,
      borderColor: colors.accent,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    dayLabel: {
      ...TYPE.title,
      fontSize: 17,
      color: colors.ink,
    },
    dayLabelToday: {
      color: colors.accent,
    },
    daySub: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },
    dayAdd: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyDay: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
      paddingBottom: SPACING.xs,
    },
    entryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.xs + 2,
    },
    entryMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    entryThumb: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surfaceWarm,
    },
    entryThumbEmpty: {
      alignItems: "center",
      justifyContent: "center",
    },
    entryTitle: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.ink,
      flex: 1,
    },
    entryTitleCooked: {
      color: colors.inkSoft,
      textDecorationLine: "line-through",
    },
    cookedMark: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceWarm,
    },
    cookedMarkOn: {
      backgroundColor: colors.accent,
    },
    entryRemove: {
      padding: 4,
    },
    emptyWeek: {
      alignItems: "center",
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.lg,
      gap: SPACING.md,
    },
    emptyOtto: {
      width: 140,
      height: 140,
    },
    emptyWeekText: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
    },

    // Picker sheet
    sheetScrim: {
      flex: 1,
      backgroundColor: OVERLAY.scrim,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: RADIUS.sheet ?? 24,
      borderTopRightRadius: RADIUS.sheet ?? 24,
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: SPACING.md,
    },
    sheetTitle: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.md,
    },
    sheetEmpty: {
      paddingVertical: SPACING.xl,
    },
    sheetEmptyText: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
    },
    pickRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickThumb: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.surfaceWarm,
    },
    pickTitle: {
      ...TYPE.body,
      fontWeight: "600",
      color: colors.ink,
      flex: 1,
    },
    sheetClose: {
      alignSelf: "center",
      paddingVertical: SPACING.md,
    },
    sheetCloseText: {
      ...TYPE.label,
      color: colors.inkSoft,
    },

    // Shopping list
    aisleTitle: {
      ...TYPE.title,
      fontSize: 17,
      color: colors.ink,
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
      paddingHorizontal: SPACING.lg,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      paddingHorizontal: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemCheck: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.border,
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
      fontVariant: ["tabular-nums"],
    },
    itemProvenance: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: 1,
    },
    sourceChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
    },
    sourceChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    sourceChipText: {
      ...TYPE.label,
      fontSize: 12,
      color: colors.ink,
      maxWidth: 160,
    },
    staleBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
      padding: SPACING.md,
    },
    staleText: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.ink,
      flex: 1,
    },
    staleAction: {
      ...TYPE.label,
      color: colors.accent,
    },
    addItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
    addItemInput: {
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
    addItemButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyList: {
      alignItems: "center",
      paddingTop: SPACING.xxl,
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.md,
    },
  });
