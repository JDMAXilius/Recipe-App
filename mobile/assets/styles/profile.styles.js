import { StyleSheet } from "react-native";

// Otto design system values (docs/DESIGN_SYSTEM.md):
// cards radius 20 · chips pill 999 · buttons radius 14 · gutter 16 · section gap 24
export const createProfileStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
      gap: 24,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.ink,
      marginTop: 4,
    },

    // identity card — Otto lives on Profile (one of his allowed surfaces)
    identityCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    mascotBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    mascotImage: {
      // zoomed crop so Otto's face fills the circle (matches Figma MascotBadge)
      width: 106,
      height: 106,
      marginLeft: -25,
      marginTop: -8,
    },
    identityText: {
      flex: 1,
      gap: 2,
    },
    email: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.ink,
    },
    identityCaption: {
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 0.5,
      color: colors.inkSoft,
    },

    // sections
    section: {
      gap: 10,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.inkSoft,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 16,
      gap: 12,
    },

    // appearance chips (surface-warm idle / accent selected — DS §6.5)
    chipRow: {
      flexDirection: "row",
      gap: 8,
    },
    chip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surfaceWarm,
    },
    chipSelected: {
      backgroundColor: colors.accent,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.ink,
    },
    chipTextSelected: {
      color: colors.white,
    },

    // theme (niche) rows
    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 4,
    },
    swatch: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeName: {
      flex: 1,
      fontSize: 15,
      color: colors.ink,
    },
    themeNameSelected: {
      fontWeight: "700",
    },

    // sign out — destructive outline (DS §6.6)
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.destructive,
      borderRadius: 14,
      paddingVertical: 13,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.destructive,
    },
  });
