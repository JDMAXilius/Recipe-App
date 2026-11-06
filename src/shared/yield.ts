// Recipe yield vs portion — pure, framework-free (node --test strips it).
//
// A recipe makes a BATCH (1 loaf) that divides into SERVINGS in a natural unit
// (10 slices). A meal photo shows a PORTION (2 slices). These are three
// different numbers and must never collapse into one: servings.count is the
// only nutrition divisor; the portion only says how many servings were eaten.
// ADR-0013 · docs/learning/reports/Otto three magic moments plan.md.

export interface Yield {
  qty: number; // 1
  unit: string; // "loaf" · "pie" · "pot" · "serving"
}

export interface Servings {
  count: number; // 10
  unit: string; // "slice" · "piece" · "bowl" · "serving"
}

export interface Portion {
  count: number; // 2 (what the photo shows)
  unit: string; // "slice"
}

// Units whose plural isn't +s. Everything else gets +s ("slice" → "slices").
const IRREGULAR: Record<string, string> = { loaf: 'loaves', serving: 'servings', glass: 'glasses', dish: 'dishes', batch: 'batches', patty: 'patties' };
const UNCOUNTABLE = new Set(['pasta', 'rice', 'soup']);

export function unitLabel(unit: string, n: number): string {
  const u = unit.trim().toLowerCase() || 'serving';
  if (n === 1 || UNCOUNTABLE.has(u)) return u;
  return IRREGULAR[u] ?? `${u}s`;
}

// Display rounding only: values are stored at full precision.
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

// "Makes 1 loaf · 10 slices". When the batch IS the servings ("4 servings"),
// say it once.
export function describeYield(y: Yield, s: Servings): string {
  const servings = `${fmt(s.count)} ${unitLabel(s.unit, s.count)}`;
  if (y.unit.trim().toLowerCase() === s.unit.trim().toLowerCase() || y.unit === 'serving') return `Makes ${servings}`;
  return `Makes ${fmt(y.qty)} ${unitLabel(y.unit, y.qty)} · ${servings}`;
}

// How many servings the photographed portion is. Same unit → a count; a
// different unit (a "plate" of a pot recipe) is one serving per item shown.
export function portionServings(p: Portion, s: Servings): number {
  if (p.count <= 0) return 0;
  return Math.min(p.count, s.count);
}

// "You photographed 2 slices ≈ 2 servings". The "≈" is deliberate: a portion
// read from a photo is an estimate.
export function describePortion(p: Portion, s: Servings): string {
  const n = portionServings(p, s);
  const shown = `${fmt(p.count)} ${unitLabel(p.unit, p.count)}`;
  return `You photographed ${shown} ≈ ${fmt(n)} ${unitLabel('serving', n)}`;
}
