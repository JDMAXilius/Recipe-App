// Public surface (feature-module.md §exports): the screen app/ routes mount,
// plus useCookedState() — the cross-feature cooked-set hook (manager amends the
// allowlist so cookbook's Cooked filter can consume it). Nothing else leaks;
// session/enrich/action logic and queries stay feature-private.
export { CookScreen } from './CookScreen';
export { useCookedState, type CookedState } from './useCookedState';
