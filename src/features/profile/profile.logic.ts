// Pure profile logic — no React, no imports. The two testable cores the
// packet names: unit-system derivation and earned-stat counting.

export type UnitSystem = 'us' | 'metric';

// Weight-first Metric is Otto's default; only an explicit 'us' opts out.
// Legacy 'weight' (v1's food-scale mode) reads as Metric — same audience the
// old useUnitSystem served, so the migration is silent and honest.
export function deriveUnitSystem(raw: unknown): UnitSystem {
  return raw === 'us' ? 'us' : 'metric';
}

export const UNIT_SEGMENTS = [
  { label: 'Metric', value: 'metric' },
  { label: 'US', value: 'us' },
] as const;

// Distinct cooked RECIPES this week (usePlan() spans only the rolling week —
// not v1's lifetime AsyncStorage tally). Review fix: the old version counted
// cooked plan ENTRIES, so a dish cooked Mon + Wed read "2", but the door it
// links to (/cookbook?cooked=1, backed by useCookedState's distinct set) showed
// 1 recipe. Count distinct recipe ids so the number and its destination agree.
export function cookedCount(
  entries: readonly { cooked?: boolean | null; recipe_id?: string | null }[],
): number {
  const ids = new Set<string>();
  for (const e of entries) if (e.cooked && e.recipe_id) ids.add(String(e.recipe_id));
  return ids.size;
}

export interface Stat {
  label: string;
  value: number | null; // null = no honest source yet → em-dash, never a fake 0
  to: string;
}

// Every number is a door (AllTrails). `yours` is null until the cookbook
// exposes an own-recipe count (packet contract_gap) — the cell shows "—".
export function earnedStats(input: {
  cooked: number;
  saved: number;
  yours: number | null;
}): { stats: Stat[]; nothingYet: boolean } {
  const stats: Stat[] = [
    { label: 'cooked', value: input.cooked, to: '/cookbook?cooked=1' },
    { label: 'saved', value: input.saved, to: '/cookbook?segment=saved' },
    { label: 'yours', value: input.yours, to: '/cookbook?segment=mine' },
  ];
  // Honesty law: a null value is "no data", which reads as not-yet-earned.
  const nothingYet = stats.every((s) => !s.value);
  return { stats, nothingYet };
}

export const statText = (value: number | null): string => (value == null ? '—' : String(value));
