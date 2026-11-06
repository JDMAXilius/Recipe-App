// "Otto, plan my week" on Plan (R4.4): the first-week rules (allergies hard,
// diet from the ingredients, skips, no repeats, no two days running from one
// category) applied to the empty days only, from the person's own answers.
// Composition (planner + onboarding + profile), so it lives in the catalogue.
import { useCallback } from 'react';
import type { Diet } from '@/shared/allergens';
import { buildFirstWeek } from '@/features/onboarding/firstWeek';
import { useDinnerShelf } from '@/features/onboarding/onboarding.queries';
import { usePrefs } from '@/features/profile';
import type { AddPlanInput } from '@/features/planner';

export function usePlanMyWeek() {
  const shelf = useDinnerShelf();
  const prefs = usePrefs();
  return useCallback(
    async (emptyDays: string[], planned: string[]): Promise<AddPlanInput[]> => {
      const dishes = shelf.data ?? (await shelf.refetch()).data ?? [];
      const taken = new Set(planned);
      const week = buildFirstWeek(
        dishes.filter((d) => !taken.has(d.id)),
        { diet: prefs.diet as Diet, allergies: prefs.allergies, skips: prefs.skips, cuisines: prefs.cuisines },
        emptyDays,
        Date.now() % 1_000_000_007,
      );
      return week.map((w) => ({ day: w.day, recipeId: w.recipeId, title: w.title, image: w.image, category: w.category, note: null, label: 'dinner', kind: 'recipe' }));
    },
    [shelf, prefs.diet, prefs.allergies, prefs.skips, prefs.cuisines],
  );
}
