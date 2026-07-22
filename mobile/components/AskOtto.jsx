import { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";
import Bounceable from "./Bounceable";

// Comp/AskOtto (Figma 198:136) — the Discover entry point into the ＋ tab.
// Discover is where people land with no plan; this is the one card that says
// "you don't have to find a recipe, you can ask for one". Deliberately a card
// and not a second search pill: search looks through what exists, Otto writes
// what doesn't.
export default function AskOtto({ onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Bounceable
      style={styles.card}
      containerStyle={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ask Otto for a recipe"
    >
      <Image
        source={require("../assets/mascot/otto-happy-cut.png")}
        style={styles.otto}
        resizeMode="contain"
      />
      <View style={styles.copy}>
        <Text style={styles.title}>Ask Otto</Text>
        <Text style={styles.subtitle}>
          Tell him what you&apos;re hungry for — he&apos;ll write the recipe.
        </Text>
      </View>
      <View style={styles.go}>
        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </View>
    </Bounceable>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.card,
      paddingVertical: SPACING.md,
      paddingLeft: SPACING.md,
      paddingRight: SPACING.lg,
    },
    otto: {
      width: 48,
      height: 48,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...TYPE.body,
      fontSize: 16,
      fontWeight: "700",
      color: colors.ink,
    },
    subtitle: {
      ...TYPE.body,
      fontSize: 13,
      lineHeight: 18,
      color: colors.inkSoft,
    },
    go: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
  });
