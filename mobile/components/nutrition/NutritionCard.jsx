import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import CalorieRing from "./CalorieRing";

// NutritionCard v2 (Mobbin deep dive, 2026-07-15):
// header scope toggle (per serving ◦ whole recipe) + scope sentence in words,
// calorie ring, ONE segmented macro bar (BitePal — one bar reads as one dish)
// with a 3-column legend (grams bold + % of this dish's calories), honest
// footnote. No daily-goal framing ever (that's a diet app's contract).
// The servings stepper now lives in the Ingredients section only.
// Inputs are PER-SERVING estimates; whole-recipe = × servings.
export default function NutritionCard({ calories, protein = 0, carbs = 0, fat = 0, servings = 4 }) {
  const { colors, nutrition } = useTheme();
  const [scope, setScope] = useState("serving"); // "serving" | "recipe"
  const styles = useMemo(() => createStyles(colors), [colors]);

  const mult = scope === "recipe" ? servings : 1;
  const cal = Math.round(calories * mult);
  const grams = { protein: protein * mult, carbs: carbs * mult, fat: fat * mult };

  const pCal = grams.protein * 4;
  const cCal = grams.carbs * 4;
  const fCal = grams.fat * 9;
  const totalCal = pCal + cCal + fCal || 1;
  const pct = (v) => Math.round((v / totalCal) * 100);

  const toggleScope = (next) => {
    if (next === scope) return;
    Haptics.selectionAsync().catch(() => {});
    setScope(next);
  };

  const LEGEND = [
    { key: "protein", label: "Protein", color: nutrition.protein, g: grams.protein, cals: pCal },
    { key: "carbs", label: "Carbs", color: nutrition.carbs, g: grams.carbs, cals: cCal },
    { key: "fat", label: "Fat", color: nutrition.fat, g: grams.fat, cals: fCal },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* scope toggle — quiet words, no switch chrome (SideChef rule) */}
      <View style={styles.scopeRow}>
        <TouchableOpacity onPress={() => toggleScope("serving")} accessibilityRole="button">
          <Text style={[styles.scopeText, scope === "serving" && styles.scopeActive]}>
            per serving
          </Text>
        </TouchableOpacity>
        <Text style={styles.scopeSep}>◦</Text>
        <TouchableOpacity onPress={() => toggleScope("recipe")} accessibilityRole="button">
          <Text style={[styles.scopeText, scope === "recipe" && styles.scopeActive]}>
            whole recipe
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.scopeSentence}>
        {scope === "serving"
          ? `Per serving, at ${servings} servings`
          : `The whole recipe, at ${servings} servings`}
      </Text>

      <View style={styles.top}>
        <CalorieRing kcal={cal} label="est. kcal" />
        <View style={styles.barArea}>
          {/* ONE segmented bar — proportions of this dish's calories */}
          <View style={styles.segmentBar}>
            {LEGEND.map((m) => (
              <View
                key={m.key}
                style={{ flex: Math.max(m.cals, 1), backgroundColor: m.color }}
              />
            ))}
          </View>
          <View style={styles.legendRow}>
            {LEGEND.map((m) => (
              <View key={m.key} style={styles.legendItem}>
                <View style={styles.legendTop}>
                  <View style={[styles.dot, { backgroundColor: m.color }]} />
                  <Text style={[styles.grams, { color: colors.ink }]}>
                    {Math.round(m.g)}g
                  </Text>
                </View>
                <Text style={[styles.legendLabel, { color: colors.inkSoft }]}>{m.label}</Text>
                <Text style={[styles.legendPct, { color: colors.inkSoft }]}>
                  {pct(m.cals)}% of cals
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={[styles.footnote, { color: colors.inkSoft }]}>
        Otto's estimate, from this kind of dish — a guide, not a guarantee.
      </Text>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      gap: 12,
    },
    scopeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    scopeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.inkSoft,
      opacity: 0.55,
    },
    scopeActive: {
      color: colors.accent,
      opacity: 1,
    },
    scopeSep: {
      color: colors.inkSoft,
      fontSize: 11,
    },
    scopeSentence: {
      fontSize: 12,
      color: colors.inkSoft,
      marginTop: -6,
    },
    top: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    barArea: {
      flex: 1,
      gap: 10,
    },
    segmentBar: {
      flexDirection: "row",
      height: 10,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: colors.surfaceWarm,
    },
    legendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    legendItem: {
      gap: 1,
    },
    legendTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    grams: {
      fontSize: 14,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    legendLabel: {
      fontSize: 11,
      fontWeight: "600",
    },
    legendPct: {
      fontSize: 10,
      fontVariant: ["tabular-nums"],
    },
    footnote: {
      fontSize: 11,
      lineHeight: 15,
    },
  });
