// Public surface (feature-module.md §exports + cross-feature allowlist):
// the two screens app/ routes mount, plus usePlan() — consumed by recipes
// (add-to-week) and profile. Nothing else leaks.
export { PlanScreen } from './PlanScreen';
export { ShoppingScreen } from './ShoppingScreen';
export { usePlan, type UsePlan } from './usePlan';
export type { AddPlanInput, PlanEntry } from './plan.types';
