import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// One macro row: label · progress track · grams. `color` comes from NUTRITION_COLORS
// (fixed, never themed). `percent` is share of the recipe's calories (0–100).
export default function MacroBar({ label, grams, percent = 0, color }) {
  const { colors } = useTheme();
  const width = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.inkSoft }]}>{label}</Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceWarm }]}>
        <View style={[styles.fill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.grams, { color: colors.ink }]}>{grams}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  label: {
    width: 56,
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  grams: {
    minWidth: 34,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
