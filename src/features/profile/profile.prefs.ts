// Device-level preferences owned by profile. The unit system is set only here
// (founder decision) and read wherever ingredients render.
//
// ponytail: in-memory module state + listeners — session-scoped, no
// persistence. AsyncStorage isn't an installed dependency yet (same ceiling as
// the auth session store); wire it here when it lands. Client preference, not
// server state, so a module cache is the right home — not TanStack Query.
import { useEffect, useState } from 'react';
import { deriveUnitSystem, type UnitSystem } from './profile.logic';

let current: UnitSystem = 'metric';
const listeners = new Set<(v: UnitSystem) => void>();

export function useUnitSystem(): [UnitSystem, (value: string) => void] {
  const [value, setValue] = useState<UnitSystem>(current);
  useEffect(() => {
    const listener = (v: UnitSystem) => setValue(v);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const set = (raw: string) => {
    current = deriveUnitSystem(raw);
    listeners.forEach((l) => l(current));
  };
  return [value, set];
}

// Food preferences (ported from v1 lib/prefs). Only diets TheMealDB can
// honestly tag are offered — a toggle the data can't honor would be a lie.
export const DIETS = [
  { key: 'none', label: 'None — I eat everything' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
] as const;

// TheMealDB's area vocabulary — the cuisine chip set.
export const CUISINES = [
  'American', 'British', 'Chinese', 'French', 'Greek', 'Indian', 'Italian',
  'Jamaican', 'Japanese', 'Mexican', 'Moroccan', 'Polish', 'Portuguese',
  'Spanish', 'Thai', 'Turkish', 'Vietnamese',
] as const;
