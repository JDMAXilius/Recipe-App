import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";
import OttoIdle from "./OttoIdle";
import { SPACING, RADIUS, TYPE, TIMING } from "../constants/tokens";

// Full-screen Otto states (DESIGN_SYSTEM B6).
// OttoLoading: COLD START ONLY — Sleepy Otto + a rotating cooking tip
// (Duolingo loader pattern). Routine fetches keep the plain LoadingSpinner.
// OttoError: offline/server failures — Otto takes the blame, copy reassures,
// recovery action always present (Hopper pattern). Never used for toasts.

const TIPS = [
  "Salt your pasta water like the sea.",
  "Rest meat as long as you seared it.",
  "Read the whole recipe before the pan gets hot.",
  "Taste as you go — Otto always does.",
  "Sharp knives are safer than dull ones.",
  "Mise en place: chop first, cook calm.",
];

export function OttoLoading() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <OttoIdle source={require("../assets/mascot/otto-sleepy-cut.png")} style={styles.otto} />
      <Text style={styles.caption}>Warming up the kitchen…</Text>
      <Text style={styles.tip}>{TIPS[tipIndex]}</Text>
    </View>
  );
}

export function OttoError({ onRetry }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/mascot/otto-sad-cut.png")}
        style={styles.otto}
        contentFit="contain"
        accessible={false}
      />
      <Text style={styles.title}>We dropped the pan.</Text>
      <Text style={styles.tip}>Something went wrong on our side. Try again in a bit.</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      padding: SPACING.xxl,
    },
    otto: {
      width: 180,
      height: 180,
      marginBottom: SPACING.lg,
    },
    title: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.sm,
      textAlign: "center",
    },
    caption: {
      ...TYPE.caption,
      color: colors.inkSoft,
      marginBottom: SPACING.sm,
    },
    tip: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
      marginBottom: SPACING.xl,
    },
    retryButton: {
      backgroundColor: colors.accent,
      borderRadius: RADIUS.button,
      height: 52,
      paddingHorizontal: SPACING.xxl,
      alignItems: "center",
      justifyContent: "center",
    },
    retryText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.white,
    },
  });
