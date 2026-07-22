// Public surface (feature-module.md §exports + cross-feature allowlist):
// NutritionCard — rendered by recipes' detail.
// useNutrition — consumed by recipes (detail) and cook.
// Nothing else leaks; the engine, estimates, and queries stay feature-private.
export { NutritionCard } from "./components/NutritionCard";
export { useNutrition, type NutritionValue } from "./nutrition.queries";
export type { NutritionRecipe } from "./nutrition.types";
