// Calorie display rounding, straight from the FDA's own labelling rule.
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
// What this is NOT: the folk "negative calorie" rule (celery, lemon, grapefruit
// supposedly costing more to digest than they carry). There is no USDA or FDA
// basis for it — the thermic effect of food is ~10% of intake, so a 15 kcal
// stalk of celery still nets ~10 kcal. Otto does not zero out real calories.
//
// Energy from fibre needs no special case here: Otto reads USDA's own Energy
// value per food, which is already computed with specific Atwater factors, so
// non-digestible carbohydrate is accounted for at the source.
export function fdaCalories(kcal) {
  if (!Number.isFinite(kcal)) return 0;
  const v = Math.max(0, kcal);
  if (v < 5) return 0;
  if (v <= 50) return Math.round(v / 5) * 5;
  return Math.round(v / 10) * 10;
}
