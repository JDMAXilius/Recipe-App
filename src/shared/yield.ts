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

// One cap for servings everywhere (scan, editor, cook mode): a big batch of
// cookies or dumplings fits; anything past it is a typo.
export const MAX_SERVINGS = 200;

// Food units are a small vocabulary; suffix rules get them wrong (cookies →
// "cooky", quiches → "quich"), so the exceptions are listed and the rest is +s.
const IRREGULAR: Record<string, string> = {
  loaf: 'loaves', patty: 'patties', berry: 'berries', sandwich: 'sandwiches', dish: 'dishes',
  glass: 'glasses', batch: 'batches', box: 'boxes', peach: 'peaches', tomato: 'tomatoes', potato: 'potatoes',
};
const SINGULAR = Object.fromEntries(Object.entries(IRREGULAR).map(([one, many]) => [many, one]));
const UNCOUNTABLE = new Set(['pasta', 'rice', 'soup']);

// Units arrive from people and models in either number ("slices", "slice").
// Store the singular; pluralise only for display.
export function singular(unit: string): string {
  const u = unit.trim().toLowerCase();
  if (SINGULAR[u]) return SINGULAR[u];
  if (IRREGULAR[u] || /ss$/.test(u)) return u;
  return /s$/.test(u) ? u.slice(0, -1) : u;
}

export function unitLabel(unit: string, n: number): string {
  const u = singular(unit) || 'serving';
  if (n === 1 || UNCOUNTABLE.has(u)) return u;
  return IRREGULAR[u] ?? `${u}s`;
}

// "1 loaf" ⇄ { qty: 1, unit: 'loaf' } for the editor's Makes field. A bare
// unit means one of it; nothing parseable means no yield.
export function parseYield(text: string): Yield | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)?\s*([a-zA-Z][a-zA-Z\s-]{0,23})?\s*$/.exec(text);
  if (!m || !m[2]) return null;
  const qty = m[1] ? Number(m[1].replace(',', '.')) : 1;
  return qty > 0 ? { qty: Math.min(qty, MAX_SERVINGS), unit: singular(m[2]) } : null;
}

export function formatYield(y: Yield): string {
  return `${fmt(y.qty)} ${unitLabel(y.unit, y.qty)}`;
}

// Display rounding only: values are stored at full precision.
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

// "Makes 1 loaf · 10 slices". When the batch IS the servings ("4 servings"),
// say it once.
export function describeYield(y: Yield, s: Servings): string {
  const servings = `${fmt(s.count)} ${unitLabel(s.unit, s.count)}`;
  if (singular(y.unit) === singular(s.unit) || singular(y.unit) === 'serving') return `Makes ${servings}`;
  return `Makes ${fmt(y.qty)} ${unitLabel(y.unit, y.qty)} · ${servings}`;
}

// How many servings the photographed portion is. A portion in the BATCH unit
// (a whole pie) is all of its servings; otherwise each item shown is one
// serving (2 slices = 2), never more than the recipe makes.
export function portionServings(p: Portion, s: Servings, y?: Yield): number {
  if (p.count <= 0) return 0;
  if (y && y.qty > 0 && singular(p.unit) === singular(y.unit) && singular(y.unit) !== singular(s.unit)) {
    return Math.min(s.count, Math.round(((p.count * s.count) / y.qty) * 10) / 10);
  }
  return Math.min(p.count, s.count);
}

// "You photographed 2 slices ≈ 2 servings". The "≈" is deliberate: a portion
// read from a photo is an estimate.
export function describePortion(p: Portion, s: Servings, y?: Yield): string {
  const n = portionServings(p, s, y);
  const shown = `${fmt(p.count)} ${unitLabel(p.unit, p.count)}`;
  return `You photographed ${shown} ≈ ${fmt(n)} ${unitLabel('serving', n)}`;
}
