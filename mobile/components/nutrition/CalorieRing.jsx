import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// Hero calorie figure inside a ring. Dependency-free (a solid accent ring frame);
// a partial-progress arc (% of a daily goal) can be added later with react-native-svg.
export default function CalorieRing({ kcal, label = "per serving", size = 66 }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.accent,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <Text style={[styles.kcal, { color: colors.ink, fontSize: size * 0.26 }]}>{kcal}</Text>
      <Text style={[styles.label, { color: colors.inkSoft }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  kcal: {
    fontWeight: "800",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
    lineHeight: undefined,
  },
  label: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
