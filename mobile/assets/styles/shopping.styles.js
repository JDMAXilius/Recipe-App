// Shopping list — printed stationery pad (founder references 2026-07-17: a
// "things to do:" pad with a dark banner flag and a printed grocery-store
// SHOPPING LIST pad), same design as the /l/:token share page.
//
// The pad's height must track the list, so the artwork is THREE slices
// (assets/paper/pad-top|mid|bot.png, cut from one render by
// backend/src/assets/make-paper-note.mjs): top and bottom keep their aspect
// ratio — frame corners, stacked-pad edge and cast shadow never distort —
// while the vertically-uniform middle band stretches to whatever height the
// content needs. The stack sits absolutely behind the content inside the
// ScrollView, so a short list is a short pad and a long list just grows it.
//
// Rows are transparent with dotted hairlines over the paper; the banner
// flag, printed-caps aisle labels and rules are real views — every word
// stays dynamic. The paper is texture, never information.
import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// content inset that clears the pad's printed frame (frame sits ~30pt in
// from the pad edge at phone widths)
const FRAME_INSET = SPACING.xxl + SPACING.xs;

export const createShoppingStyles = (colors) =>
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
    scroll: {
      paddingBottom: SPACING.xl,
    },
    // the pad grows with its content; the art stack behind it follows
    pad: {
      marginHorizontal: SPACING.md,
    },
    padArt: {
      ...StyleSheet.absoluteFillObject,
    },
    // A second sheet peeking out bottom-right — keeps the "pad of pages" feel
    // the old art had, without any image seams.
    padStack: {
      position: "absolute",
      top: 7,
      left: 7,
      right: -5,
      bottom: -6,
      backgroundColor: "#EFE7DA",
      borderRadius: 10,
    },
    // The top sheet: warm paper, soft edge, gentle cast shadow.
    padSheet: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#FBF9F3",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#2A211B",
      shadowOpacity: 0.12,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    // Printed double rule, inset just inside the content frame (FRAME_INSET).
    // Terracotta ink at low opacity so it reads as a printed line, not a border.
    padFrameOuter: {
      position: "absolute",
      top: FRAME_INSET - 12,
      left: FRAME_INSET - 12,
      right: FRAME_INSET - 12,
      bottom: FRAME_INSET - 12,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: "rgba(196, 86, 46, 0.38)",
    },
    padFrameInner: {
      position: "absolute",
      top: FRAME_INSET - 7,
      left: FRAME_INSET - 7,
      right: FRAME_INSET - 7,
      bottom: FRAME_INSET - 7,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: "rgba(196, 86, 46, 0.22)",
    },
    // clears the bottom frame line + stacked-pad edge inside the artwork
    padBottomSpace: {
      height: SPACING.xxl + SPACING.md,
    },
    // printed banner flag, like the "things to do:" pad — overlaps the top
    // frame line on purpose, pinned like a label
    bannerWrap: {
      alignItems: "center",
      marginTop: SPACING.lg,
      marginBottom: SPACING.xs,
    },
    banner: {
      backgroundColor: colors.ink,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + 2,
    },
    bannerText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 3,
    },
    bannerNotchRow: {
      flexDirection: "row",
    },
    bannerNotchLeft: {
      width: 0,
      height: 0,
      borderTopWidth: 9,
      borderTopColor: colors.ink,
      borderRightWidth: 92,
      borderRightColor: "transparent",
    },
    bannerNotchRight: {
      width: 0,
      height: 0,
      borderTopWidth: 9,
      borderTopColor: colors.ink,
      borderLeftWidth: 92,
      borderLeftColor: "transparent",
    },
    countHeader: {
      alignItems: "center",
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.sm,
    },
    count: {
      ...TYPE.caption,
      color: colors.inkSoft,
      letterSpacing: 1.5,
    },
    staleBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: RADIUS.card,
      marginHorizontal: FRAME_INSET,
      marginBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
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
    sourceChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      paddingHorizontal: FRAME_INSET,
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
    // Aisles read like the pad's printed section labels — single red rule,
    // same as the share page.
    aisleTitle: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.ink,
      marginTop: SPACING.lg + SPACING.xs,
      marginBottom: SPACING.xs,
      paddingHorizontal: FRAME_INSET,
    },
    aisleRule: {
      height: 0,
      borderTopWidth: 1.5,
      borderColor: colors.accent,
      opacity: 0.5,
      marginHorizontal: FRAME_INSET,
      marginBottom: SPACING.xs,
      alignSelf: "stretch",
    },
    // Transparent rows — the paper IS the row background; each row carries
    // its own dotted hairline so the ruling always lines up with the
    // dynamic content instead of fighting it.
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      marginHorizontal: FRAME_INSET,
      borderBottomWidth: 1.5,
      borderStyle: "dotted",
      borderBottomColor: colors.secondary,
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
      fontVariant: ["tabular-nums"],
    },
    itemProvenance: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: 1,
    },
    emptyList: {
      alignItems: "center",
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
      paddingHorizontal: FRAME_INSET + SPACING.md,
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
    addItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingHorizontal: FRAME_INSET,
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
  });
