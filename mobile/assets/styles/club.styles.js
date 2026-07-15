import { StyleSheet } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

// Otto Club paywall (Mobbin paywall study: Blinkist timeline + CREME price
// honesty + Kitchen Stories painted benefits). Cream paper, terracotta only.
export const createClubStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingBottom: SPACING.xxl * 2,
    },
    closeButton: {
      position: "absolute",
      top: SPACING.md,
      right: SPACING.lg,
      zIndex: 2,
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    heroBand: {
      backgroundColor: colors.bg, // cutout floats on the page itself — no band seam
      overflow: "hidden",
      paddingTop: SPACING.xxl,
    },
    heroArt: {
      width: "88%",
      alignSelf: "center",
      aspectRatio: 900 / 582, // cutout's native ratio
    },
    body: {
      padding: SPACING.lg,
      gap: SPACING.xl,
    },
    title: {
      ...TYPE.display,
      fontSize: 30,
      lineHeight: 36,
      color: colors.ink,
    },
    subtitle: {
      ...TYPE.body,
      color: colors.inkSoft,
      marginTop: SPACING.xs,
    },

    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    benefitIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    benefitText: {
      ...TYPE.body,
      fontSize: 14,
      color: colors.ink,
      flex: 1,
    },

    sectionTitle: {
      ...TYPE.title,
      fontSize: 18,
      color: colors.ink,
    },
    timeline: {
      gap: 0,
    },
    timelineRow: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    timelineRail: {
      width: 34,
      alignItems: "center",
    },
    timelineNode: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    timelineNodeSoft: {
      backgroundColor: colors.accentSoft,
    },
    timelineLine: {
      flex: 1,
      width: 3,
      backgroundColor: colors.accent,
      marginVertical: 2,
      borderRadius: 2,
    },
    timelineLineFade: {
      backgroundColor: colors.border, // rail fades after the charge node
    },
    timelineBody: {
      flex: 1,
      paddingBottom: SPACING.lg,
    },
    timelineWhen: {
      ...TYPE.label,
      color: colors.ink,
    },
    timelineText: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
      marginTop: 2,
    },

    planCard: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      gap: 4,
    },
    planCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceWarm,
    },
    planTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    planRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    planRadioActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    planName: {
      ...TYPE.body,
      fontWeight: "800",
      color: colors.ink,
      flex: 1,
    },
    planBadge: {
      backgroundColor: colors.accent,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: 3,
    },
    planBadgeText: {
      ...TYPE.caption,
      fontSize: 10,
      color: colors.white,
    },
    planMath: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
    },
    planTerms: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
    },

    truthLine: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
      textAlign: "center",
    },
    cta: {
      height: 54,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: SPACING.sm,
    },
    ctaText: {
      ...TYPE.body,
      fontWeight: "800",
      color: colors.accent,
    },
    ctaSub: {
      ...TYPE.caption,
      color: colors.inkSoft,
      textAlign: "center",
      marginTop: -SPACING.md,
    },
    notifyLink: {
      ...TYPE.label,
      color: colors.accent,
      textAlign: "center",
    },

    cancelCard: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      gap: SPACING.xs,
    },
    cancelTitle: {
      ...TYPE.body,
      fontWeight: "800",
      color: colors.ink,
    },
    cancelBody: {
      ...TYPE.body,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkSoft,
    },
  });
