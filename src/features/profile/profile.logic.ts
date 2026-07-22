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

// A planned dish counts once its `cooked` flag is set. usePlan() spans only
// the rolling week, so this is "cooked this week" — not the lifetime tally v1
// kept in AsyncStorage (see packet gaps).
export function cookedCount(entries: readonly { cooked?: boolean | null }[]): number {
  return entries.reduce((n, e) => (e.cooked ? n + 1 : n), 0);
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
