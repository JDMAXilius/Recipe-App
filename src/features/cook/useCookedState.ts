// useCookedState() — the cross-feature cooked-set hook (feature-module.md
// allowlist amendment: exported by cook, consumed by cookbook's Cooked filter).
//
// Source of truth = plan_entries.cooked (via usePlan, the allowlisted planner
// hook). v1 marked cooked in AsyncStorage (otto.cooked.*), which does not exist
// in v2; plan_entries.cooked is the lightest existing durable source and is what
// cook-completion already flips (usePlan().setCooked). Two known limits, both in
// the packet gaps: (1) usePlan() lists only the rolling week, so a recipe cooked
// earlier drops out of the set; (2) a recipe cooked without ever being on the
// plan is never recorded. Upgrade path when either bites: a dedicated all-time
// query over plan_entries (needs userId) or a purpose-built cooked source.
import { useCallback, useMemo } from 'react';
import { usePlan } from '@/features/planner';

export interface CookedState {
  cookedIds: Set<string>;
  isCooked: (recipeId: string | number) => boolean;
}

export function useCookedState(): CookedState {
  const { entries } = usePlan();

  const cookedIds = useMemo(
    () =>
      new Set(
        entries
          .filter((e) => e.cooked && e.recipe_id)
          .map((e) => String(e.recipe_id)),
      ),
    [entries],
  );

  const isCooked = useCallback(
    (recipeId: string | number) => cookedIds.has(String(recipeId)),
    [cookedIds],
  );

  return { cookedIds, isCooked };
}
