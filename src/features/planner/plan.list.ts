// A plan day is an ordered free list (ADR-0013): items in any order, each with
// an optional label (breakfast, lunch, dinner, snack or the user's own word).
// Pure ordering rules, zero framework imports (plan.list.test.mjs).
//
// Order is a fractional `position`: moving an item writes ONE row (the
// midpoint between its new neighbours) instead of renumbering the day. Rows
// from before the column existed have position null and keep their insert
// order, after any positioned rows.

export const MEAL_LABELS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type PlanKind = 'recipe' | 'food' | 'leftover' | 'note' | 'out';

export const STEP = 1024; // spacing for new positions; ~50 halvings before a rebalance
const MIN_GAP = 1e-6;

export interface Orderable {
  id: number;
  position?: number | null;
  created_at?: string | null;
}

export function sortDay<T extends Orderable>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const pa = a.position ?? null;
    const pb = b.position ?? null;
    if (pa !== null && pb !== null && pa !== pb) return pa - pb;
    if (pa !== null && pb === null) return -1;
    if (pa === null && pb !== null) return 1;
    const ta = a.created_at ?? '';
    const tb = b.created_at ?? '';
    return ta < tb ? -1 : ta > tb ? 1 : a.id - b.id;
  });
}

// The position each item effectively holds in display order (nulls get
// evenly spaced slots after the last real one).
function effective<T extends Orderable>(sorted: readonly T[]): number[] {
  let last = 0;
  return sorted.map((item) => {
    last = item.position ?? last + STEP;
    return last;
  });
}

// Where a new item goes: after everything already on the day.
export function positionAtEnd(items: readonly Orderable[]): number {
  const e = effective(sortDay(items));
  return (e.length ? e[e.length - 1] : 0) + STEP;
}

// The position that puts `movingId` at display index `toIndex`, or null when
// the neighbours are too close and the day needs `rebalance` first.
export function positionFor(items: readonly Orderable[], movingId: number, toIndex: number): number | null {
  const others = sortDay(items).filter((i) => i.id !== movingId);
  const e = effective(others);
  const at = Math.max(0, Math.min(toIndex, others.length));
  const before = at > 0 ? e[at - 1] : null;
  const after = at < others.length ? e[at] : null;
  if (before === null && after === null) return STEP;
  if (before === null) return (after as number) / 2;
  if (after === null) return before + STEP;
  return after - before < MIN_GAP ? null : (before + after) / 2;
}

// Fresh evenly spaced positions for a whole day, in its current order.
export function rebalance(items: readonly Orderable[]): { id: number; position: number }[] {
  return sortDay(items).map((item, i) => ({ id: item.id, position: (i + 1) * STEP }));
}

// A label is a short word the user chose, never required. '' → none.
export function normalizeLabel(raw: string | null | undefined): string | null {
  const t = (raw ?? '').trim().toLowerCase().slice(0, 24);
  return t || null;
}

// Leftovers are kind 'leftover' now; rows written before the column carried
// the tag in `note`.
export function isLeftover(e: { kind?: string | null; note?: string | null }): boolean {
  return e.kind === 'leftover' || e.note === 'leftovers';
}
