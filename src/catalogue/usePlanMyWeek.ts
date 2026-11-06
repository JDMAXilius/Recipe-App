// "Otto, plan my week" on Plan (R4.4): the first-week rules (allergies hard,
// diet from the ingredients, skips, no repeats, no two days running from one
// category) applied to the empty days only, from the person's own answers.
// Composition (planner + onboarding + profile), so it lives in the catalogue.
import { useCallback } from 'react';
import type { Diet } from '@/shared/allergens';
import { buildFirstWeek } from '@/features/onboarding/firstWeek';
import { useDinnerShelf } from '@/features/onboarding/onboarding.queries';
import { readPrefsForPlanning } from '@/features/profile';
import type { AddPlanInput } from '@/features/planner';

export function usePlanMyWeek(enabled: boolean) {
  // The shelf loads only when this button can show (it's the whole catalogue).
  const shelf = useDinnerShelf(enabled);
  return useCallback(
    async (emptyDays: string[], planned: string[]): Promise<AddPlanInput[]> => {
      // A failed read is said as such, never as "nothing fits your answers".
      const result = shelf.data ? shelf : await shelf.refetch();
      if (!result.data) throw new Error("Couldn't reach Otto's recipes. Check your connection and try again.");
      // Allergies are a hard filter: read the person's answers fresh (the
      // account's copy), and refuse rather than plan without them.
      const prefs = await readPrefsForPlanning();
      const taken = new Set(planned);
      const week = buildFirstWeek(
        result.data.filter((d) => !taken.has(d.id)),
        { diet: prefs.diet as Diet, allergies: prefs.allergies, skips: prefs.skips, cuisines: prefs.cuisines },
        emptyDays,
        Date.now() % 1_000_000_007,
      );
      return week.map((w) => ({ day: w.day, recipeId: w.recipeId, title: w.title, image: w.image, category: w.category, note: null, label: 'dinner', kind: 'recipe' }));
    },
    [shelf],
  );
}
