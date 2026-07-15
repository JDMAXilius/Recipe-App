import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { TIMING } from "../../constants/tokens";

// Hero calorie figure inside a ring. The number sweeps 0 → value on mount
// (timing.sweep, ease-out — DESIGN_SYSTEM B3); reduced motion shows it static.
// `kcal` may be a string like "~420" — the tilde is preserved (estimate framing).
export default function CalorieRing({ kcal, label = "per serving", size = 66 }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  const raw = String(kcal);
  const prefix = raw.startsWith("~") ? "~" : "";
  const target = parseInt(raw.replace(/[^0-9]/g, ""), 10);
  const animatable = Number.isFinite(target) && !reducedMotion;
  const [display, setDisplay] = useState(animatable ? 0 : raw);

  useEffect(() => {
    if (!animatable) {
      setDisplay(raw);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / TIMING.sweep);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(`${prefix}${Math.round(target * eased)}`);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [raw]);

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
      <Text style={[styles.kcal, { color: colors.ink, fontSize: size * 0.26 }]}>{display}</Text>
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
