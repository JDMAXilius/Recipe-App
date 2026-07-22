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
  title: string;
  ingredients: ParsedIngredient[];
}

export interface ShoppingItem {
  key: string;
  name: string;
  aisle: Aisle;
  amount: string;
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
      if (!item.sources.includes(recipe.title)) item.sources.push(recipe.title);
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
