import React from "react";
import { Ring } from "@/shared/ui";
import { fdaCalories } from "@/shared/lib/fdaCalories";

// The hero calorie figure, on the shared Ring primitive. FDA label rounding
// (21 CFR 101.9) so a black coffee reads a clean small number like every
// package label. null kcal → Ring renders an em-dash, never a fabricated 0
// (honesty law / ui-components rule 4).
//
// No `max`: nutrition's design forbids daily-goal framing, and Ring's max-less
// variant renders the value + label with no "/ denominator" (the contract_gap
// is resolved — Ring now supports a denominator-less display).
export function CalorieRing({ kcal }: { kcal: number | null }) {
  const value = kcal == null ? null : fdaCalories(kcal);
  return <Ring value={value} label="kcal" />;
}
