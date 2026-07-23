// Calorie display rounding, straight from the FDA's own labelling rule.
// Ported verbatim from v1 (mobile/lib/fdaCalories.js), typed.
//
// 21 CFR 101.9(c)(1): caloric content is "expressed to the nearest 5-calorie
// increment up to and including 50 calories, and 10-calorie increment above 50
// calories, except that amounts less than 5 calories may be expressed as zero."
//
// Why Otto follows the label rule instead of printing the raw computed number:
// a brewed black coffee genuinely computes to ~2 kcal, and every packaged label
// a user has ever read calls that 0. Printing "2 kcal" next to a cup of black
// coffee reads as a bug, not as precision.
//
// What this is NOT: the folk "negative calorie" rule. Otto does not zero out
// real calories; USDA Energy values already use specific Atwater factors.
export function fdaCalories(kcal: number): number {
  if (!Number.isFinite(kcal)) return 0;
  const v = Math.max(0, kcal);
  if (v < 5) return 0;
  if (v <= 50) return Math.round(v / 5) * 5;
  return Math.round(v / 10) * 10;
}
