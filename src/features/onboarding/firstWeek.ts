// The first week (R0.6): seven dinners from the catalogue before any account,
// tonight first. Pure and seeded, so the same answers give the same week in a
// test, and a fresh seed gives a fresh week ("Show me others").
//
// Rules, in order: dinners only · allergies are a HARD filter (keyword
// heuristic, always shown with LEAVE_OUT_NOTE) · the diet must fit the
// ingredients · skipped foods are out · no dish twice · no two days running
// from the same category · the person's cuisines come first.
import { allergensIn, fitsDiet, type Allergen, type Diet } from '../../shared/allergens.ts';

export interface CatalogueDish {
  id: string;
  title: string;
  image: string | null;
  category: string | null;
  area: string | null;
  ingredients: string[]; // every form we have (name, key, original line): the allergen check reads them all
  items?: string[]; // one name per ingredient, for the shopping count
}

export interface WeekAnswers {
  diet: Diet;
  allergies: readonly Allergen[];
  skips: readonly string[];
  cuisines: readonly string[];
}

export interface WeekDish {
  day: string;
  recipeId: string;
  title: string;
  image: string | null;
  category: string | null;
}

// Not dinners (ALLERGEN_COVERAGE.md method).
const NOT_DINNER = new Set(['Dessert', 'Side', 'Breakfast', 'Starter']);

// The categories don't separate dinners from jams, dips and sides (the
// Vegetarian shelf holds Ezme; Miscellaneous holds pumpkin jam), so a dinner
// must also not be named like a condiment, and must have something to fill a
// plate: a protein or a starch.
const CONDIMENT_TITLE = /\b(?:jam|jelly|marmalade|dip|salsa|relish|chutney|pickles?|sauce|dressing|spread|syrup|butter|marinade|seasoning|spice mix|paste|drink|juice|smoothie|lemonade|tea|coffee|cocktail|punch|cake|cookies?|biscuits?|muffins?|pudding|tart)\s*(?:\(|$)/i;
const SUBSTANCE = /\b(?:chicken|beef|pork|lamb|mutton|goat|turkey|duck|veal|sausages?|bacon|ham\b|mince|meat|steak|fish|salmon|tuna|cod\b|haddock|hake|prawns?|shrimp|mussels?|squid|crab|eggs?\b|tofu|tempeh|paneer|halloumi|cheese|feta|ricotta|mozzarella|beans?\b|lentils?|chickpeas?|dal\b|split peas|quinoa|rice\b|risotto|pasta|spaghetti|penne|macaroni|linguine|lasagne|noodles?|udon|potato(?:es)?|gnocchi|bread|pitta|pita|naan|tortillas?|couscous|bulgh?ur|polenta|barley|freekeh)/i;

// Beans that are a vegetable, not a protein.
const NOT_SUBSTANCE = /\b(?:green|runner|french|string|broad|long|yard) beans?|bean sprouts|vanilla|cocoa|coffee|jelly beans/i;

export function looksLikeDinner(d: Pick<CatalogueDish, 'title' | 'ingredients'>): boolean {
  // "Falafel pita with tahini sauce" is a dinner: judge the name before
  // "with", "in" or "and".
  const head = d.title.split(/\s+(?:with|in|and|&)\s+/i)[0];
  return !CONDIMENT_TITLE.test(head) && d.ingredients.some((n) => SUBSTANCE.test(n) && !NOT_SUBSTANCE.test(n));
}

export function eligibleDinners(catalogue: readonly CatalogueDish[], a: WeekAnswers): CatalogueDish[] {
  const skip = a.skips.map((s) => s.toLowerCase()).filter(Boolean);
  return catalogue.filter((d) => {
    if ((d.category && NOT_DINNER.has(d.category)) || !looksLikeDinner(d)) return false;
    const found = allergensIn(d.ingredients);
    if (a.allergies.some((x) => found.has(x))) return false;
    if (!fitsDiet(d.ingredients, a.diet, d.category)) return false;
    const text = [d.title, ...d.ingredients].join(' | ');
    return !skip.some((s) => skipPattern(s).test(text));
  });
}

// A skipped food matches as a whole word, singular or plural ("eggs" skips
// "Egg Yolks", "cherries" skips "Cherry Tomatoes", "apples" never skips
// pineapple), but not its cooking oil: skipping olives keeps olive oil.
export function skipPattern(food: string): RegExp {
  const f = food.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stem = f.endsWith('ies') ? `${f.slice(0, -3)}(?:y|ies)` : f.endsWith('oes') || /(?:ches|shes|xes|sses)$/.test(f) ? `${f.slice(0, -2)}(?:es)?` : f.endsWith('s') && !f.endsWith('ss') ? `${f.slice(0, -1)}s?` : `${f}(?:s|es)?`;
  return new RegExp(`\\b${stem}\\b(?! oil)`, 'i');
}

// Mulberry32: tiny, seeded, good enough to shuffle a shelf.
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A dinner per day, in the order of `days` (tonight first). Fewer dishes
 *  than days when the filters leave too few: the caller says so, honestly. */
export function buildFirstWeek(catalogue: readonly CatalogueDish[], a: WeekAnswers, days: readonly string[], seed: number): WeekDish[] {
  const rand = rng(seed);
  const liked = new Set(a.cuisines);
  const pool = eligibleDinners(catalogue, a);
  // Preferred cuisines first, each group shuffled.
  const ordered = [...shuffle(pool.filter((d) => d.area && liked.has(d.area)), rand), ...shuffle(pool.filter((d) => !(d.area && liked.has(d.area))), rand)];
  const week: WeekDish[] = [];
  const used = new Set<string>();
  for (const day of days) {
    const prev = week.at(-1)?.category ?? null;
    const pick = ordered.find((d) => !used.has(d.id) && (prev === null || d.category !== prev)) ?? ordered.find((d) => !used.has(d.id));
    if (!pick) break;
    used.add(pick.id);
    week.push({ day, recipeId: pick.id, title: pick.title, image: pick.image, category: pick.category });
  }
  return week;
}

/** One-tap Swap: a different dinner for one day, from the same filtered
 *  shelf, never one already in the week and, where possible, not the same
 *  category as its neighbours. Null when nothing else fits. */
export function swapDay(week: readonly WeekDish[], index: number, catalogue: readonly CatalogueDish[], a: WeekAnswers, seed: number): WeekDish | null {
  const day = week[index];
  if (!day) return null;
  const used = new Set(week.map((w) => w.recipeId));
  const near = new Set([week[index - 1]?.category, week[index + 1]?.category].filter(Boolean));
  const pool = shuffle(eligibleDinners(catalogue, a).filter((d) => !used.has(d.id)), rng(seed));
  const pick = pool.find((d) => !near.has(d.category)) ?? pool[0];
  return pick ? { day: day.day, recipeId: pick.id, title: pick.title, image: pick.image, category: pick.category } : null;
}

/** Ingredients to buy for the week, counted once each (the "Shopping list
 *  ready" row). */
export function shoppingCount(week: readonly WeekDish[], catalogue: readonly CatalogueDish[]): number {
  const byId = new Map(catalogue.map((d) => [d.id, d]));
  const names = new Set<string>();
  for (const w of week) for (const n of byId.get(w.recipeId)?.items ?? byId.get(w.recipeId)?.ingredients ?? []) names.add(n.trim().toLowerCase());
  return names.size;
}

/** Tonight, or tomorrow once it's late (after 8 pm): the day the week opens on. */
export function firstDayIndex(now: Date): number {
  return now.getHours() >= 20 ? 1 : 0;
}
