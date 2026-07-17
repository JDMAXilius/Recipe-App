// Shopping list v3 — the 3D torn-notepad remake (founder ask, 2026-07-17).
// Two painted layers: wood table (assets/paper/table-wood.jpg, cover) and
// the paper sheet as an alpha cutout (assets/paper/note-cut.png, stretched
// to the screen so tear/curl/shadow always land where content expects).
// See assets/paper/README.md for asset provenance/swap. Rows are
// transparent with per-row ruled hairlines so the paper shows through.
// All content stays dynamic — the paper is texture, never information.
import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

export const createShoppingStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    table: {
      flex: 1,
    },
    // the stretched cutout carries ~2% built-in transparent margin for its
    // painted shadow; these margins keep painterly wood visible around it
    paper: {
      flex: 1,
      marginTop: SPACING.xs,
      marginHorizontal: SPACING.sm + 2,
      marginBottom: SPACING.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      // inset past the painted table margins at the sheet's sides, and
      // below the chunky torn edge at the top
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.xxl + SPACING.lg,
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
    countHeader: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    count: {
      ...TYPE.caption,
      color: colors.inkSoft,
    },
    staleBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.lg,
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
    // Aisles read like underlined headings scribbled on the page.
    aisleTitle: {
      ...TYPE.title,
      fontSize: 17,
      fontStyle: "italic",
      color: colors.accent,
      marginTop: SPACING.lg,
      marginBottom: 2,
      paddingHorizontal: SPACING.lg,
    },
    aisleRule: {
      height: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent,
      opacity: 0.35,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.xs,
      width: 96,
    },
    // Transparent rows — the paper IS the row background. Each row carries
    // its own ruled hairline (like the founder's reference photos: real
    // notepad rules under every written item), so the "ruling" always lines
    // up with the dynamic content instead of fighting it.
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      marginHorizontal: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      paddingTop: SPACING.xxl,
      paddingHorizontal: SPACING.xxl,
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
  });
