// Display formatting the shared primitives need. Honesty law: null/absent
// data renders as a visible em-dash, never a fabricated zero.

export const EM_DASH = '—';

/** null/undefined/NaN → em-dash; real numbers (including 0) → rounded string. */
export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EM_DASH;
  return String(Math.round(value));
}
