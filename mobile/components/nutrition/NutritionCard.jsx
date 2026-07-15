import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import CalorieRing from "./CalorieRing";
import MacroBar from "./MacroBar";
import ServingStepper from "./ServingStepper";

// Groups the calorie ring, three macro bars, and the serving stepper.
// Inputs are PER-SERVING values (calories, protein/carbs/fat in grams).
// Macro bar fill = each macro's share of the recipe's calories
// (protein 4 kcal/g, carbs 4 kcal/g, fat 9 kcal/g).
export default function NutritionCard({
  calories,
  protein = 0,
  carbs = 0,
  fat = 0,
  servings,
  onServingsChange,
  showStepper = true,
}) {
  const { colors, nutrition } = useTheme();

  const pCal = protein * 4;
  const cCal = carbs * 4;
  const fCal = fat * 9;
  const totalCal = pCal + cCal + fCal || 1;
  const pct = (v) => Math.round((v / totalCal) * 100);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.top}>
        <CalorieRing kcal={`~${calories}`} label="est. / serving" />
        <View style={styles.macros}>
          <MacroBar label="Protein" grams={protein} percent={pct(pCal)} color={nutrition.protein} />
          <MacroBar label="Carbs" grams={carbs} percent={pct(cCal)} color={nutrition.carbs} />
          <MacroBar label="Fat" grams={fat} percent={pct(fCal)} color={nutrition.fat} />
        </View>
      </View>

      {showStepper && typeof servings === "number" && (
        <View style={styles.stepper}>
          <ServingStepper servings={servings} onChange={onServingsChange} />
        </View>
      )}

      {/* Honesty rule (P2-7): TheMealDB has no nutrition data — say so. */}
      <Text style={[styles.footnote, { color: colors.inkSoft }]}>
        Estimated from typical ingredients — a guide, not a guarantee.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  macros: {
    flex: 1,
    gap: 8,
  },
  stepper: {
    marginTop: 2,
  },
  footnote: {
    fontSize: 11,
    lineHeight: 15,
  },
});
