// The persisted preferences store — one writer (profile), many readers
// (allowlist: profile → recipes/nutrition). Device-local client state, so a
// module store hydrated from `kv` is the right home, not TanStack Query.
//
// ponytail: module-state + listener pub/sub (same shape the old useUnitSystem
// used). Fine for a handful of scalar prefs read app-wide; reach for
// useSyncExternalStore only if tearing shows up.
import { useEffect, useState } from 'react';
import { kv } from '@/shared/storage';
import { onForget } from '@/shared/forget';
import { flags } from '@/shared/flags';
import { fetchAccountPrefs, pushAccountPrefs } from './profile.queries';
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
let hydrating: Promise<void> | null = null;

const emit = () => listeners.forEach((l) => l());

// Load once from kv, then notify. Best-effort: a failed read leaves defaults.
// One promise, so a writer can wait for it and never be overwritten by it.
// S1: the next person starts from the defaults and reads their own storage.
onForget(() => {
  state = { ...DEFAULT_PREFS, unitSystem: state.unitSystem };
  hydrating = null;
  emit();
});

function hydrate(): Promise<void> {
  hydrating ??= (async () => {
    const [rawPrefs, rawUnit] = await Promise.all([
      kv.get<unknown>('prefs', null),
      kv.get<unknown>('unitSystem', null),
    ]);
    state = { ...normalizePrefs(rawPrefs), unitSystem: deriveUnitSystem(rawUnit) };
    emit();
    void syncFromAccount();
  })();
  return hydrating;
}

// R0.4: the account's copy wins (a new phone gets the answers); an account
// with no row yet takes the phone's. Offline or signed out: the kv cache
// stands. Under flowV2 only, until the App Privacy answers say so.
async function syncFromAccount(): Promise<void> {
  if (!flags.flowV2) return;
  try {
    const row = await fetchAccountPrefs();
    if (row) {
      state = { ...normalizePrefs(row), unitSystem: state.unitSystem };
      const { unitSystem: _unit, ...prefs } = state;
      void kv.set('prefs', prefs);
      emit();
    } else {
      await pushPrefs();
    }
  } catch {
    // offline: keep the cache, try again on the next write
  }
}

const pushPrefs = async () => {
  if (!flags.flowV2) return;
  const { unitSystem: _unit, ...prefs } = state;
  await pushAccountPrefs(prefs).catch(() => {});
};

// Everything but the unit system (its own key); also to the account (R0.4).
const persistPrefs = () => {
  const { unitSystem: _unit, ...prefs } = state;
  void kv.set('prefs', prefs);
  void pushPrefs();
};

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
function update(patch: Partial<Prefs>) {
  state = { ...state, ...normalizePrefs({ ...state, ...patch }), unitSystem: state.unitSystem };
  persistPrefs();
  emit();
}
const setHousehold = (household: Prefs['household']) => update({ household });
const toggleAllergy = (a: Prefs['allergies'][number]) =>
  update({ allergies: state.allergies.includes(a) ? state.allergies.filter((x) => x !== a) : [...state.allergies, a] });
const addSkip = (food: string) => update({ skips: [...state.skips, food] });
const removeSkip = (food: string) => update({ skips: state.skips.filter((s) => s !== food) });
function toggleCuisine(area: string) {
  const has = state.cuisines.includes(area);
  setCuisines(has ? state.cuisines.filter((c) => c !== area) : [...state.cuisines, area]);
}
/** Replace the food preferences at once (the first-run answers, R0.3). */
export async function savePrefs(raw: unknown): Promise<void> {
  await hydrate();
  state = { ...normalizePrefs(raw), unitSystem: state.unitSystem };
  persistPrefs();
  emit();
}
function setUnitSystem(raw: string) {
  state = { ...state, unitSystem: deriveUnitSystem(raw) };
  void kv.set('unitSystem', state.unitSystem);
  emit();
}

const actions = { setDiet, setCuisines, toggleCuisine, setUnitSystem, setHousehold, toggleAllergy, addSkip, removeSkip } as const;

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
