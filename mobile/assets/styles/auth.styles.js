import { StyleSheet, Dimensions } from "react-native";
import { SPACING, RADIUS, TYPE } from "../../constants/tokens";

const { height } = Dimensions.get("window");

// Auth pair v2 (MOBBIN_COMPARISON §2.2): two screens, two Otto scales.
// Sign-up = large framed Otto (first contact, the thesis). Sign-in = compact
// vignette; the headline does the warmth. One saturated CTA, quiet fields.
export const createAuthStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
    },

    // Otto — sign-up scale (framed card, mascot radius token)
    heroContainer: {
      height: height * 0.32,
      marginBottom: SPACING.xl,
      borderRadius: RADIUS.mascot,
      overflow: "hidden",
      backgroundColor: colors.surfaceWarm,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },

    // Otto — sign-in scale (small vignette above the headline)
    vignetteContainer: {
      alignItems: "center",
      marginTop: SPACING.xl,
      marginBottom: SPACING.md,
    },
    vignetteImage: {
      width: 140,
      height: 140,
    },

    title: {
      ...TYPE.display,
      color: colors.ink,
      textAlign: "center",
      marginBottom: SPACING.sm,
    },
    subtitle: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
      marginBottom: SPACING.xl,
      // reserve two lines so a longer subtitle never shifts the form down
      // relative to the other screen (sign-in ↔ sign-up stay aligned)
      minHeight: 44,
    },

    formContainer: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: SPACING.lg,
      position: "relative",
    },
    textInput: {
      ...TYPE.body,
      fontSize: 16,
      color: colors.ink,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.button,
      borderWidth: 1,
      borderColor: colors.border,
    },
    eyeButton: {
      position: "absolute",
      right: SPACING.lg,
      top: SPACING.lg,
      padding: 4,
    },
    hint: {
      ...TYPE.caption,
      textTransform: "none",
      letterSpacing: 0,
      color: colors.inkSoft,
      // absolute so it lives in the input's bottom margin instead of adding
      // height — keeps the CTA at the same Y on sign-up as on sign-in
      position: "absolute",
      top: "100%",
      left: SPACING.xs,
      marginTop: 2,
    },
    errorText: {
      ...TYPE.body,
      fontSize: 14,
      color: colors.destructive,
      textAlign: "center",
      marginBottom: SPACING.md,
    },
    authButton: {
      backgroundColor: colors.accent,
      height: 52,
      borderRadius: RADIUS.button,
      alignItems: "center",
      justifyContent: "center",
      marginTop: SPACING.sm,
      marginBottom: SPACING.xl,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      ...TYPE.body,
      fontSize: 16,
      fontWeight: "700",
      color: colors.white,
    },
    linkContainer: {
      alignItems: "center",
      paddingBottom: SPACING.xl,
    },
    linkText: {
      ...TYPE.body,
      color: colors.inkSoft,
    },
    link: {
      color: colors.accent,
      fontWeight: "700",
    },
  });
