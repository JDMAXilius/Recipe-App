import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/shared/ui";
import { colors, macro, radii, space } from "@/shared/theme/tokens";
import { formatCount } from "@/shared/lib/format";
import { haptics } from "@/shared/haptics";
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
// honesty decision so a consumer only writes <NutritionCard recipe servings />:
//   computed figure (engine/cache) wins → estimate framing, "rough guide" when
//   confidence is low; else a labelled CATEGORY estimate (carb-ceiling'd so a
//   carb-less dish can't show phantom carbs); else "no estimate" — a visible
//   em-dash on the ring and every macro, NEVER a fabricated 0 (honesty law).
// v1-fidelity chrome (restored): bordered card, a quiet "per serving ◦ whole
// recipe" scope toggle (defaults to whole recipe — the number the stepper
// visibly moves) + a scope sentence, ONE segmented macro bar coloured by the
// fixed macro palette (protein blue / carbs amber / fat purple), and a legend
// with grams + "% of cals". Inputs are PER-SERVING; whole recipe = × servings.

interface Macros {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export function NutritionCard({
  recipe,
  servings = recipe.servings ?? 4,
}: {
  recipe: NutritionRecipe;
  servings?: number;
}) {
  const { data: computed, isLoading } = useNutrition(recipe);
  // Defaults to whole recipe (founder call): people reach for the servings
  // stepper and expect the number to move with it. Per-serving correctly does
  // NOT — cooking for 8 instead of 4 doubles the pot, not the plate — so it
  // stays one tap away as the honest dish-to-dish comparable.
  const [scope, setScope] = useState<"serving" | "recipe">("recipe");

  // Category fallback only when we have a category to judge by — no category and
  // no computed figure is honestly "no estimate", not the 420-kcal default.
  const estimate = recipe.category
    ? applyCarbCeiling(
        getNutritionEstimate(recipe.category),
        recipe.ingredients.map((i) => i.name),
      )
    : null;

  let kind: EstimateKind;
  let perServing: Macros | null;
  let basisGrams: number | null = null;
  if (computed) {
    kind = computed.confidence === "low" ? "computed-low" : "computed";
    perServing = {
      kcal: computed.kcal,
      protein: computed.protein_g,
      carbs: computed.carbs_g,
      fat: computed.fat_g,
    };
    basisGrams = computed.basis_grams ?? null;
  } else if (estimate) {
    kind = "category";
    perServing = {
      kcal: estimate.calories,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
    };
  } else {
    kind = "none";
    perServing = null;
  }

  const mult = scope === "recipe" ? servings : 1;
  const scale = (v: number | null) => (v == null ? null : v * mult);
  const kcal = scale(perServing?.kcal ?? null);
  const grams = {
    protein: scale(perServing?.protein ?? null),
    carbs: scale(perServing?.carbs ?? null),
    fat: scale(perServing?.fat ?? null),
  };

  // Calorie share drives the segmented bar + "% of cals". Null grams → no bar.
  const pCal = (grams.protein ?? 0) * 4;
  const cCal = (grams.carbs ?? 0) * 4;
  const fCal = (grams.fat ?? 0) * 9;
  const totalCal = pCal + cCal + fCal;
  const pct = (v: number) => (totalCal > 0 ? Math.round((v / totalCal) * 100) : 0);

  const LEGEND = [
    { key: "protein", label: "Protein", color: macro.protein, g: grams.protein, cals: pCal },
    { key: "carbs", label: "Carbs", color: macro.carbs, g: grams.carbs, cals: cCal },
    { key: "fat", label: "Fat", color: macro.fat, g: grams.fat, cals: fCal },
  ] as const;

  const toggleScope = (next: "serving" | "recipe") => {
    if (next === scope) return;
    haptics.select();
    setScope(next);
  };

  const servingWord = servings === 1 ? "serving" : "servings";

  return (
    // NOT `accessible` on the container — that collapses children into one node,
    // so a screen reader would miss the ring's "kcal: 420" and each macro value.
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.card,
        backgroundColor: colors.white,
        padding: space[4],
        gap: space[3],
      }}
    >
      {/* Scope toggle — quiet words, no switch chrome */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
        <ScopeWord label="per serving" active={scope === "serving"} onPress={() => toggleScope("serving")} a11y="Show per serving" />
        <Text role="caption">◦</Text>
        <ScopeWord label="whole recipe" active={scope === "recipe"} onPress={() => toggleScope("recipe")} a11y="Show the whole recipe" />
      </View>
      <Text role="caption">
        {scope === "serving"
          ? `Per serving, at ${servings} ${servingWord}` +
            (basisGrams ? ` · about ${Math.round(basisGrams)}g each` : "")
          : `The whole recipe, at ${servings} ${servingWord}`}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
        <CalorieRing kcal={kcal} label="est. kcal" />
        <View style={{ flex: 1, gap: space[3] }}>
          {/* ONE segmented bar — proportions of this dish's calories. Muted
              placeholder when there's no honest macro breakdown. */}
          <View
            style={{
              flexDirection: "row",
              height: 10,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: colors.creamDeep,
            }}
          >
            {totalCal > 0
              ? LEGEND.map((m) => (
                  <View key={m.key} style={{ flex: Math.max(m.cals, 1), backgroundColor: m.color }} />
                ))
              : null}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {LEGEND.map((m) => (
              <View
                key={m.key}
                accessible
                accessibilityLabel={`${m.label} ${formatCount(m.g)} grams`}
                style={{ gap: 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space[1] }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: m.color }} />
                  {/* 'computed' role = terracotta (semantic ink): Otto's numbers. */}
                  <Text role="computed">{`${formatCount(m.g)}g`}</Text>
                </View>
                <Text role="caption">{m.label}</Text>
                {totalCal > 0 ? <Text role="caption">{pct(m.cals)}% of cals</Text> : null}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* The ONE place nutrition is qualified. */}
      <Text role="caption">{isLoading ? "Estimating…" : estimateCaption(kind)}</Text>
    </View>
  );
}

function ScopeWord({
  label,
  active,
  onPress,
  a11y,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected: active }}
    >
      {/* Semantic ink: the selected scope is terracotta (interactive/computed),
          the other stays quiet caption grey. Role switch, not a style hatch. */}
      <Text role={active ? "computed" : "caption"}>{label}</Text>
    </Pressable>
  );
}
