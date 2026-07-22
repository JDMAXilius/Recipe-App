import React from "react";
import { Ring } from "@/shared/ui";
import { fdaCalories } from "@/shared/lib/fdaCalories";

// The hero calorie figure, on the shared Ring primitive. FDA label rounding
// (21 CFR 101.9) so a black coffee reads a clean small number like every
// package label. null kcal → Ring renders an em-dash, never a fabricated 0
// (honesty law / ui-components rule 4).
//
// ponytail: max = 2000 is the FDA reference daily intake, the only non-personal
// denominator available — but Ring always prints "/ max", which reads as the
// daily-goal framing nutrition's design forbids. Raised as a contract_gap
// (Ring needs a denominator-less mode); this is the honest interim.
const FDA_REFERENCE_KCAL = 2000;

export function CalorieRing({ kcal }: { kcal: number | null }) {
  const value = kcal == null ? null : fdaCalories(kcal);
  return <Ring value={value} max={FDA_REFERENCE_KCAL} label="kcal" />;
}
