// Public surface (feature-module.md §exports + cross-feature allowlist):
// NutritionCard — rendered by recipes' detail.
// useNutrition — consumed by recipes (detail) and cook.
// Nothing else leaks; the engine, estimates, and queries stay feature-private.
export { NutritionCard } from "./components/NutritionCard";
// resolveNutrition — the compute+resolver figure, exported so the import
// feature's SAVE path persists the SAME per-serving number the detail reads.
export { useNutrition, useSeedCalories, resolveNutrition, type NutritionValue } from "./nutrition.queries";
export type { NutritionRecipe } from "./nutrition.types";
