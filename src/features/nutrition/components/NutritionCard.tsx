import React from "react";
import { View } from "react-native";
import { Text } from "@/shared/ui";
import { space } from "@/shared/theme/tokens";
import { formatCount } from "@/shared/lib/format";
import { CalorieRing } from "./CalorieRing";
import { useNutrition } from "../nutrition.queries";
import {
  applyCarbCeiling,
  getNutritionEstimate,
  estimateCaption,
  type EstimateKind,
} from "../estimates";
import type { NutritionRecipe } from "../nutrition.types";

// The cross-feature nutrition card recipes' detail renders. It owns the whole
// honesty decision so a consumer only writes <NutritionCard recipe={recipe} />:
//   computed figure (engine/cache) wins → estimate framing, "rough guide" when
//   confidence is low; else a labelled CATEGORY estimate (carb-ceiling'd so a
//   carb-less dish can't show phantom carbs); else "no estimate" — a visible
//   em-dash on the ring and every macro, NEVER a fabricated 0 (honesty law).
// Per-serving only: the engine emits per serving, the honest comparable number.
// ponytail: no whole-recipe scope toggle (v1 had one) — not in the packet;
// add a SegmentBar-driven ×servings scope if the detail screen asks for it.

interface Macros {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

const MACRO_LABELS: { key: keyof Omit<Macros, "kcal">; label: string }[] = [
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
];

export function NutritionCard({ recipe }: { recipe: NutritionRecipe }) {
  const { data: computed, isLoading } = useNutrition(recipe);

  // Category fallback only when we have a category to judge by — no category and
  // no computed figure is honestly "no estimate", not the 420-kcal default.
  const estimate = recipe.category
    ? applyCarbCeiling(
        getNutritionEstimate(recipe.category),
        recipe.ingredients.map((i) => i.name),
      )
    : null;

  let kind: EstimateKind;
  let macros: Macros | null;
  if (computed) {
    kind = computed.confidence === "low" ? "computed-low" : "computed";
    macros = {
      kcal: computed.kcal,
      protein: computed.protein_g,
      carbs: computed.carbs_g,
      fat: computed.fat_g,
    };
  } else if (estimate) {
    kind = "category";
    macros = {
      kcal: estimate.calories,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
    };
  } else {
    kind = "none";
    macros = null;
  }

  return (
    <View style={{ gap: space[3] }} accessible accessibilityLabel="Nutrition estimate">
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
        <CalorieRing kcal={macros?.kcal ?? null} />
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
          {MACRO_LABELS.map(({ key, label }) => (
            <View key={key} style={{ alignItems: "center", gap: space[1] }}>
              {/* 'computed' role = terracotta (semantic ink): these are Otto's
                  numbers, not authored text. null → em-dash via formatCount. */}
              <Text role="computed">{`${formatCount(macros?.[key] ?? null)}g`}</Text>
              <Text role="caption">{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text role="caption">{isLoading ? "Estimating…" : estimateCaption(kind)}</Text>
    </View>
  );
}
