// The answers while someone goes through the three questions (R1.3), in
// memory until "Save my week" turns them into the draft (R0.3). A tiny module
// store: the three question screens and the week share it without props.
import { useSyncExternalStore } from 'react';
import type { Allergen, Diet } from '@/shared/allergens';

export interface FirstRunAnswers {
  household: { adults: number; kids: number };
  diet: Diet;
  allergies: Allergen[];
  skips: string[];
}

let answers: FirstRunAnswers = { household: { adults: 2, kids: 0 }, diet: 'none', allergies: [], skips: [] };
const listeners = new Set<() => void>();

export function setAnswers(patch: Partial<FirstRunAnswers>) {
  answers = { ...answers, ...patch };
  listeners.forEach((l) => l());
}

export function useAnswers(): FirstRunAnswers {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => answers,
  );
}
