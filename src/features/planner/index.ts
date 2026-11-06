// Public surface (feature-module.md §exports + cross-feature allowlist):
// the screens app/ routes mount, plus usePlan() — consumed by recipes
// (add-to-week) and profile. Nothing else leaks.
export { PlanScreen } from './PlanScreen';
export { PlanTab } from './PlanTab';
export { ShoppingScreen } from './ShoppingScreen';
export { usePlan, type UsePlan } from './usePlan';
export { tonightEntry } from './plan.pick';
export type { AddPlanInput, PlanEntry } from './plan.types';
