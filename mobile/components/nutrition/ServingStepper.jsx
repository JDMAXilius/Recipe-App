import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";

// Serves − N + control. Changing servings scales ingredient quantities and the
// recipe total; per-serving nutrition stays constant (see docs/DESIGN_SYSTEM.md).
export default function ServingStepper({ servings, onChange, min = 1, max = 24 }) {
  const { colors } = useTheme();

  const tick = (next) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };
  const dec = () => servings > min && tick(servings - 1);
  const inc = () => servings < max && tick(servings + 1);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.inkSoft }]}>Serves</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={dec}
          disabled={servings <= min}
          style={[styles.pm, { backgroundColor: colors.surfaceWarm, opacity: servings <= min ? 0.4 : 1 }]}
          accessibilityLabel="Decrease servings"
        >
          <Text style={[styles.pmText, { color: colors.ink }]}>−</Text>
        </TouchableOpacity>

        <Text style={[styles.value, { color: colors.ink }]}>{servings}</Text>

        <TouchableOpacity
          onPress={inc}
          disabled={servings >= max}
          style={[styles.pm, { backgroundColor: colors.surfaceWarm, opacity: servings >= max ? 0.4 : 1 }]}
          accessibilityLabel="Increase servings"
        >
          <Text style={[styles.pmText, { color: colors.ink }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pm: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  pmText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
  value: {
    minWidth: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
