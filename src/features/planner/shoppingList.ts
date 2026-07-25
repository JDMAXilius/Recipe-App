// Shopping list engine (roadmap Phase 4): ONE row per ingredient with summed
// quantities + provenance. Deterministic. Port of mobile/lib/shoppingList.js.
//
// Amounts are WEIGHT-FIRST (founder, 2026-07): entries that resolve to grams
// sum in grams (kg roll-up above 1000); anything that doesn't fully resolve
// falls back to same-unit sums / honest raw listing — never a faked sum.
//
// This module is PURE: it takes ingredients ALREADY parsed by the nutrition
// engine (@/features/nutrition/engine — grams come from there, we never
// re-implement parsing). The parse happens in plan.queries.ts at the data
// boundary; keeping it out of here lets the colocated .mjs suite exercise the
// summing/aisle/no-reorder logic without pulling the engine's path alias.

export const AISLES = [
  'Produce',
  'Meat & fish',
  'Dairy & eggs',
  'Bakery',
  'Pantry',
  'Spices',
  'Other',
] as const;

export type Aisle = (typeof AISLES)[number];

// One ingredient line, already parsed by the engine. `name` is the raw
// ingredient name (drives grouping + aisle); `grams` is the engine's resolved
// weight for the whole line (null → unresolved); `qty`/`unit` feed the
// same-unit fallback; `raw` is the original measure string for honest listing.
export interface ParsedIngredient {
  name: string;
  qty: number | null;
  unit: string | null;
  grams: number | null;
  raw: string;
}

export interface RecipeForList {
  /** Stable recipe id (plan_entries.recipe_id: "u-<n>" or a seed id). This —
   *  never the title — is a source's identity: two dishes sharing a title are
   *  different dishes, and a renamed dish is still the same one. */
  id: string;
  title: string;
  ingredients: ParsedIngredient[];
}

export interface ShoppingItem {
  key: string;
  name: string;
  aisle: Aisle;
  amount: string;
  /** Recipe IDS the amount came from (render titles by lookup). */
  sources: string[];
}

// Order matters: pantry phrases first ("chicken stock" is Pantry, not Meat).
const AISLE_RULES: { aisle: Aisle; words: string[] }[] = [
  {
    aisle: 'Pantry',
    words: ['stock', 'broth', 'sauce', 'paste', 'canned', 'tinned', 'flour', 'sugar', 'rice', 'pasta', 'noodle', 'spaghetti', 'lasagna sheet', 'lasagne', 'oil', 'vinegar', 'bean', 'lentil', 'chickpea', 'coconut milk', 'honey', 'syrup', 'oats', 'cereal', 'cornstarch', 'corn starch', 'baking', 'yeast', 'breadcrumb', 'wine', 'sherry', 'mirin', 'soy', 'worcestershire', 'mustard', 'ketchup', 'mayo', 'peanut butter', 'jam', 'chocolate', 'cocoa', 'vanilla', 'nut', 'almond', 'walnut', 'cashew', 'raisin', 'sultana', 'date', 'tomato purée', 'tomato puree', 'passata'],
  },
  {
    aisle: 'Meat & fish',
    words: ['chicken', 'beef', 'pork', 'lamb', 'sausage', 'bacon', 'fish', 'salmon', 'tuna', 'cod', 'prawn', 'shrimp', 'turkey', 'beef mince', 'pork mince', 'mincemeat', 'steak', 'ham', 'chorizo', 'anchov', 'duck', 'veal', 'meatball'],
  },
  {
    aisle: 'Dairy & eggs',
    words: ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'egg', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'feta', 'crème', 'creme fraiche'],
  },
  {
    aisle: 'Bakery',
    words: ['bread', 'tortilla', 'bun', 'pita', 'naan', 'baguette', 'roll', 'croissant', 'wrap'],
  },
  {
    aisle: 'Spices',
    words: ['salt', 'black pepper', 'white pepper', 'paprika', 'cumin', 'oregano', 'cinnamon', 'nutmeg', 'turmeric', 'curry powder', 'chilli powder', 'chili powder', 'cayenne', 'coriander seed', 'fennel seed', 'bay lea', 'thyme', 'rosemary', 'sage', 'allspice', 'clove', 'cardamom', 'garam masala', 'italian seasoning', 'seasoning', 'dried'],
  },
  {
    aisle: 'Produce',
    words: ['onion', 'garlic', 'carrot', 'tomato', 'potato', 'pepper', 'lettuce', 'spinach', 'broccoli', 'lemon', 'lime', 'apple', 'banana', 'parsley', 'basil', 'coriander', 'cilantro', 'ginger', 'mushroom', 'celery', 'zucchini', 'courgette', 'cucumber', 'avocado', 'chilli', 'chili', 'scallion', 'spring onion', 'leek', 'cabbage', 'kale', 'berry', 'orange', 'aubergine', 'eggplant', 'squash', 'pumpkin', 'corn', 'pea', 'green bean', 'cauliflower', 'radish', 'beet', 'herb', 'mint', 'dill', 'chive', 'shallot', 'salad'],
  },
];

// Word-boundary matching — substring hits misfiled things ("nutmeg" → "nut"
// → Pantry, "boiled egg" → "oil", "graham cracker" → "ham").
const RULE_MATCHERS = AISLE_RULES.map((rule) => ({
  aisle: rule.aisle,
  re: new RegExp(`\\b(?:${rule.words.join('|').replace(/ /g, '\\s+')})`, 'i'),
}));

export function aisleFor(name: string): Aisle {
  for (const rule of RULE_MATCHERS) {
    if (rule.re.test(name)) return rule.aisle;
  }
  return 'Other';
}

const keyFor = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // singularize the tail word so "Tomatoes" and "tomato" share a row
    .replace(/(oes|ches|shes|sses)$/, (m) => m.slice(0, -2))
    .replace(/([^s])s$/, '$1');

// Pluralize display units the same way the parser does.
const PLURAL_UNITS = new Set(['cup', 'clove', 'can', 'slice', 'pound', 'stick']);

// "1.5" → "1½", "0.75" → "¾", "3" → "3". Port of ingredientParser.formatQty.
const NICE_FRACTIONS: [number, string][] = [
  [0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'], [0.5, '½'],
  [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞'], [1, ''],
];
function formatQty(value: number | null): string {
  if (value == null) return '';
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  let fracGlyph = '';
  let bestDiff = 0.06; // tolerance
  for (const [f, glyph] of NICE_FRACTIONS) {
    if (glyph && Math.abs(f - frac) < bestDiff) {
      bestDiff = Math.abs(f - frac);
      fracGlyph = glyph;
    }
  }
  if (!fracGlyph && frac > 0.05) return String(Math.round(value * 10) / 10);
  if (whole === 0) return fracGlyph || '0';
  return `${whole}${fracGlyph}`;
}

const displayAmount = (qty: number | null, unit: string | null): string => {
  if (qty == null) return '';
  const q = formatQty(qty);
  if (!unit) return q;
  const plural = qty > 1 && PLURAL_UNITS.has(unit) ? 's' : '';
  return `${q} ${unit}${plural}`;
};

// grams → "500 g" / "1.3 kg". Port of foodScale.formatShoppingWeight.
const scaleNum = (value: number): string => {
  const r = Math.round(value * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};
function formatWeight(grams: number): string {
  if (grams > 1000) return `${scaleNum(grams / 1000)} kg`;
  return `${scaleNum(grams)} g`;
}

// recipes → items grouped one-per-ingredient, in AISLES order, stable within
// aisle. Deterministic: the output order is a pure function of the input and
// carries no check state, so checking an item off can NEVER reorder the list.
export function buildShoppingList(recipes: RecipeForList[]): ShoppingItem[] {
  interface Bucket {
    key: string;
    name: string;
    aisle: Aisle;
    entries: ParsedIngredient[];
    sources: string[];
  }
  const map = new Map<string, Bucket>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients || []) {
      const name = (ing.name || '').trim();
      if (!name) continue;
      const key = keyFor(name);
      if (!key) continue;
      let item = map.get(key);
      if (!item) {
        item = { key, name, aisle: aisleFor(key), entries: [], sources: [] };
        map.set(key, item);
      }
      item.entries.push(ing);
      if (!item.sources.includes(recipe.id)) item.sources.push(recipe.id);
    }
  }

  const items: ShoppingItem[] = [];
  for (const item of map.values()) {
    // Weight-first: if EVERY entry for this ingredient resolved to grams, sum
    // on the scale — "500 g + 750 g" → "1.3 kg". One unresolvable entry drops
    // the whole row to the honest fallback; a partial sum would silently
    // under-buy.
    let grams = 0;
    let unresolved = false;
    for (const e of item.entries) {
      if (e.grams != null) grams += e.grams;
      else unresolved = true;
    }
    let amount: string;
    if (!unresolved && grams > 0) {
      amount = formatWeight(grams);
    } else {
      const units = new Set(item.entries.map((e) => e.unit ?? '(count)'));
      const allQty = item.entries.every((e) => e.qty != null);
      if (units.size === 1 && allQty) {
        const total = item.entries.reduce((sum, e) => sum + (e.qty as number), 0);
        amount = displayAmount(total, item.entries[0].unit);
      } else {
        // mixed units / unparseable — list honestly, never fake a sum
        const raws = [...new Set(item.entries.map((e) => e.raw).filter(Boolean))];
        amount = raws.join(' + ');
      }
    }
    items.push({ key: item.key, name: item.name, aisle: item.aisle, amount, sources: item.sources });
  }

  items.sort((a, b) => AISLES.indexOf(a.aisle) - AISLES.indexOf(b.aisle));
  return items;
}

// ─── Hand-removed rows ──────────────────────────────────────────────────────
// Hold-then-drag throws ONE ingredient off the list. What we remember must be
// the removal the shopper actually made, not the ingredient's NAME forever:
// `key` is the bare normalized name ("onion"), so a key-only memory suppressed
// every future onion — remove 100 g of onion from Soup one week and the 3 kg
// for next week's Onion Bhaji Party never renders. Silent under-buying, i.e.
// the exact failure this feature exists to prevent, inverted.
//
// So a removal also remembers WHAT it was removing: the row's `sources` (the
// RECIPE IDS the amount came from — ids, not titles: two dishes sharing a
// title are different dishes, and renaming a dish must not orphan or revive a
// removal). A row is hidden only when a remembered removal has the same key
// AND the same set of source ids. Same dish still on the week → still hidden
// (what the shopper meant). The ingredient turning up from a different dish,
// or from one more dish, is a DIFFERENT shopping decision, so the row comes
// back with its new amount.
export interface RemovedEntry {
  key: string;
  sources: string[];
  /** When the shopper removed it (ms epoch). Optional: pre-stamp blobs carry
   *  none. Not yet enforced — the expiry rule is a founder call (ticket 4b);
   *  stamping now means whatever rule lands can apply retroactively. */
  at?: number;
}

// Order-insensitive set compare. Both boundaries dedupe (buildShoppingList
// pushes an id once; normalizeRemoved dedupes stored blobs), so length +
// membership is a true set comparison here.
export function sameSources(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  const seen = new Set(b);
  return a.every((s) => seen.has(s));
}

// Is this row one the shopper threw off — for THIS set of dishes?
export function isRemoved(item: ShoppingItem, removed: RemovedEntry[]): boolean {
  return removed.some((r) => r.key === item.key && sameSources(r.sources, item.sources));
}

// Hydration guard for the kv blob. The field has never shipped in a build, so
// there is no stored data to migrate — but a hand-edited or legacy `string[]`
// blob must not crash the screen: anything that isn't a well-formed entry is
// dropped rather than guessed at (a bare string carries no source set, and
// inventing one would re-create the global-suppression bug).
export function normalizeRemoved(raw: unknown): RemovedEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: RemovedEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue; // legacy plain string → ignored
    const { key, sources, at } = entry as { key?: unknown; sources?: unknown; at?: unknown };
    if (typeof key !== 'string' || !key) continue;
    if (!Array.isArray(sources)) continue;
    // Dedupe: sameSources is a length + membership compare, which is only a
    // true set compare over deduped inputs — a hand-edited ["A","A"] blob
    // would make it asymmetric.
    const clean = [...new Set(sources.filter((s): s is string => typeof s === 'string'))];
    out.push({ key, sources: clean, ...(typeof at === 'number' ? { at } : {}) });
  }
  return out;
}

// Removals must be pruned the same way dropped dishes are: once the week no
// longer produces that ingredient at all, the memory has to go, or a re-planned
// dish would come back invisible forever. Keyed on the ingredient being live —
// a live key whose sources changed is handled by isRemoved (it simply stops
// matching), so it can stay until the ingredient itself leaves the week.
//
// The build is best-effort per dish (a failed fetch yields fewer recipes), so
// pruning is gated PER ENTRY, not on the whole build being complete: an entry
// is pruned only when every dish it names is accounted for — either resolved
// in this build (its ingredients are genuinely in liveKeys, so the key being
// absent is real) or off the active week entirely (its absence is real too).
// A dish that was asked for but didn't come back is unknown — its removals are
// kept, never guessed away. This kills both failure modes at once: the flaky
// wipe (one bad fetch erased 'olive oil' for good) and the permanent freeze
// (one forever-unresolvable dish disabled pruning for every entry, making all
// removals immortal).
//
// Returns the SAME array when nothing changed so a setState(prev => …) can
// no-op instead of re-rendering the list.
export function pruneRemoved(
  removed: RemovedEntry[],
  liveKeys: string[],
  build?: { resolvedIds: string[]; activeIds: string[] },
): RemovedEntry[] {
  if (removed.length === 0) return removed;
  const live = new Set(liveKeys);
  const resolved = build ? new Set(build.resolvedIds) : null;
  const active = build ? new Set(build.activeIds) : null;
  const accounted = (id: string) => !resolved || !active || resolved.has(id) || !active.has(id);
  const next = removed.filter((r) => live.has(r.key) || !r.sources.every(accounted));
  return next.length === removed.length ? removed : next;
}
