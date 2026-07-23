// The persisted preferences store — one writer (profile), many readers
// (allowlist: profile → recipes/nutrition). Device-local client state, so a
// module store hydrated from `kv` is the right home, not TanStack Query.
//
// ponytail: module-state + listener pub/sub (same shape the old useUnitSystem
// used). Fine for a handful of scalar prefs read app-wide; reach for
// useSyncExternalStore only if tearing shows up.
import { useEffect, useState } from 'react';
import { kv } from '@/shared/storage';
import { deriveUnitSystem, type UnitSystem } from './profile.logic';
import {
  DEFAULT_PREFS,
  normalizeDiet,
  normalizePrefs,
  pruneCuisines,
  type Prefs,
} from './profile.prefs';

export interface PrefsState extends Prefs {
  unitSystem: UnitSystem;
}

let state: PrefsState = { ...DEFAULT_PREFS, unitSystem: 'metric' };
const listeners = new Set<() => void>();
let hydrated = false;

const emit = () => listeners.forEach((l) => l());

// Load once from kv, then notify. Best-effort: a failed read leaves defaults.
async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const [rawPrefs, rawUnit] = await Promise.all([
    kv.get<unknown>('prefs', null),
    kv.get<unknown>('unitSystem', null),
  ]);
  state = { ...normalizePrefs(rawPrefs), unitSystem: deriveUnitSystem(rawUnit) };
  emit();
}

const persistPrefs = () => void kv.set('prefs', { diet: state.diet, cuisines: state.cuisines });

// Setters are module-level (stable identity) — writes persist best-effort and
// never block the UI (kv.set swallows its own failures).
function setDiet(diet: string) {
  state = { ...state, diet: normalizeDiet(diet) };
  persistPrefs();
  emit();
}
function setCuisines(cuisines: string[]) {
  state = { ...state, cuisines: pruneCuisines(cuisines) };
  persistPrefs();
  emit();
}
function toggleCuisine(area: string) {
  const has = state.cuisines.includes(area);
  setCuisines(has ? state.cuisines.filter((c) => c !== area) : [...state.cuisines, area]);
}
function setUnitSystem(raw: string) {
  state = { ...state, unitSystem: deriveUnitSystem(raw) };
  void kv.set('unitSystem', state.unitSystem);
  emit();
}

const actions = { setDiet, setCuisines, toggleCuisine, setUnitSystem } as const;

export type UsePrefs = PrefsState & typeof actions;

export function usePrefs(): UsePrefs {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap(state);
    listeners.add(l);
    void hydrate();
    setSnap(state); // catch a hydrate that resolved before this subscribe
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { ...snap, ...actions };
}
