// The first week (R0.6): seven dinners from the catalogue before any account,
// tonight first. Pure and seeded, so the same answers give the same week in a
// test, and a fresh seed gives a fresh week ("Show me others").
//
// Rules, in order: dinners only · allergies are a HARD filter (keyword
// heuristic, always shown with LEAVE_OUT_NOTE) · the diet must fit the
// ingredients · skipped foods are out · no dish twice · no two days running
// from the same category · the person's cuisines come first.
import { allergensIn, fitsDiet, type Allergen, type Diet } from '../../shared/allergens';

export interface CatalogueDish {
  id: string;
  title: string;
  image: string | null;
  category: string | null;
  area: string | null;
  ingredients: string[]; // names (and keys) as written
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

export function eligibleDinners(catalogue: readonly CatalogueDish[], a: WeekAnswers): CatalogueDish[] {
  const skip = a.skips.map((s) => s.toLowerCase()).filter(Boolean);
  return catalogue.filter((d) => {
    if (d.category && NOT_DINNER.has(d.category)) return false;
    const found = allergensIn(d.ingredients);
    if (a.allergies.some((x) => found.has(x))) return false;
    if (!fitsDiet(d.ingredients, a.diet)) return false;
    const text = `${d.title} ${d.ingredients.join(' ')}`.toLowerCase();
    return !skip.some((s) => text.includes(singularish(s)));
  });
}

// "mushrooms" should also skip "mushroom"; "tomatoes" → "tomato".
const singularish = (s: string) => s.replace(/(?:es|s)$/, (m) => (s.length > 4 ? '' : m));

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

/** Tonight, or tomorrow once it's late (after 8 pm): the day the week opens on. */
export function firstDayIndex(now: Date): number {
  return now.getHours() >= 20 ? 1 : 0;
}
