// ALL recipes server state (feature-module.md rules 2/3): TanStack Query only,
// keyed [domain, ...params]. Two sources behind one seam:
//   1. seed recipes — TheMealDB, reached through the `content` edge function
//      (never the direct API; the supporter key lives server-side). Responses
//      are external, so mealdb.transform zod-parses them at the boundary.
//   2. user recipes — the `recipes` table via supabase-js, typed by Database.
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/shared/supabase/client';
import { usePrefs } from '@/features/profile';
import type { Tables } from '@/types/database';
import { toUserRecipeId } from '@/types/ids';
import {
  type Meal,
  mealToRecipe,
  mealToSummary,
  parseCategories,
  parseMeals,
} from './mealdb.transform';
import {
  USE_OTTO_RECIPES,
  canonicalToRecipe,
  canonicalToSummary,
  parseCanonical,
} from './canonical.transform';
import { choosePickSource } from './recipe.pick';
import type { Recipe, RecipeCategory, RecipeSummary } from './recipe.types';

// One call into the content passthrough. supabase.functions.invoke attaches the
// anon apikey/JWT the function's verify_jwt needs (Discover works before signup)
// and returns the JSON body verbatim in `data`. GET only — the function 405s POST.
async function content(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const name = `content/${endpoint}${qs ? `?${qs}` : ''}`;
  const { data, error } = await supabase.functions.invoke(name, { method: 'GET' });
  if (error) throw error;
  return data;
}

// A route param routes to a source: "u-12" → user recipe (DB), else a seed id.
export function isUserRecipeRef(id: string): boolean {
  return /^u-/.test(id);
}

// ── otto_recipes serving copy (Phase-4 cutover, behind USE_OTTO_RECIPES) ──────
// When the flag is ON these replace the `content` calls for seed detail + the
// category/area grids. Public SELECT on otto_recipes (RLS), so they work before
// signup exactly like the content path. OFF (the default) skips all of this.

async function ottoRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('otto_recipes')
    .select('canonical')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? canonicalToRecipe(parseCanonical(data.canonical)) : null;
}

// Category × areas grid. TheMealDB needs a fetch per filter + a client intersect;
// the canonical record carries both, so one filtered SELECT does it. category is
// passed to the summary (not read off the record) to match the OFF path's
// filter.php-shaped output. Ordered by id for a stable grid.
//
// Cuisine is multi-select, so areas is an OR *within* the group, ANDed with the
// single category — one .in() against the same `canonical->>area` accessor .eq()
// already uses. PostgREST parses the field (arrows included) and the operator
// separately, so `in` reads that JSON accessor exactly like `eq` does; the
// client serialises `canonical->>area=in.(Italian,Japanese)`, i.e. only the
// operator changes. Empty areas = no cuisine filter at all (not "match none").
async function ottoDiscover(
  category: string | null,
  areas: string[],
): Promise<RecipeSummary[]> {
  let q = supabase.from('otto_recipes').select('canonical').order('id');
  if (category) q = q.eq('canonical->>category', category);
  if (areas.length > 0) q = q.in('canonical->>area', areas);
  const { data, error } = await q;
  if (error) throw error;
  // Fall back to the row's OWN category when we didn't filter by one. Unlike
  // filter.php (which omits strCategory, hence the stamp-back), the canonical
  // row carries it — and a cuisine-only browse would otherwise hand every card
  // a null category, dropping it to the generic nutrition estimate and the
  // blank placeholder art for data we already have in hand.
  return (data ?? []).map((row) => {
    const rec = parseCanonical(row.canonical);
    return canonicalToSummary(rec, category ?? rec.category ?? null);
  });
}

// Title search on the serving copy — the OFF path's search.php equivalent.
// Ingredient search stays on the content fallback below (covers the snapshot
// catalogue; Otto originals are title-searchable only for now).
async function ottoSearchByTitle(q: string): Promise<RecipeSummary[]> {
  const { data, error } = await supabase
    .from('otto_recipes')
    .select('canonical')
    .ilike('canonical->>title', `%${q}%`)
    .order('id')
    .limit(24);
  if (error) throw error;
  return (data ?? [])
    .map((row) => parseCanonical(row.canonical))
    .map((r) => canonicalToSummary(r, r.category ?? null));
}

async function ottoRelated(category: string, selfId: string): Promise<RecipeSummary[]> {
  const { data, error } = await supabase
    .from('otto_recipes')
    .select('canonical')
    .eq('canonical->>category', category)
    .order('id');
  if (error) throw error;
  return (data ?? [])
    .map((row) => parseCanonical(row.canonical))
    .filter((r) => r.id !== selfId)
    .slice(0, 4)
    .map((r) => canonicalToSummary(r, category));
}

// ── seed catalogue (content) ────────────────────────────────────────────────

export function useCategories() {
  return useQuery<RecipeCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => parseCategories(await content('categories.php')),
    staleTime: 24 * 60 * 60 * 1000, // near-static; the function caches too
  });
}

// Otto's pick — pref-aware hero. A liked cuisine biases the pool and diet wins
// (choosePickSource owns that lean); with no prefs it's the original random
// surprise. Keyed by prefs so it refetches when taste changes. random.php is
// never cached (same URL, different meal) → still a fresh "surprise me".
async function randomPick(): Promise<Recipe | null> {
  const meals = parseMeals(await content('random.php'));
  return meals[0] ? mealToRecipe(meals[0]) : null;
}

export function useFeatured() {
  const { diet, cuisines } = usePrefs();
  return useQuery<Recipe | null>({
    // sorted cuisine key so [Thai,Italian] and [Italian,Thai] share one cache.
    queryKey: ['featured', diet, [...cuisines].sort().join(',')],
    queryFn: async () => {
      const source = choosePickSource({ diet, cuisines });
      if (source.kind === 'random') return randomPick();

      // filter.php returns lean id/name/thumb rows — pick one, then lookup the
      // full meal so the hero card has area/category/ingredients. Empty pool or
      // a lookup miss falls back to the honest random surprise.
      const param: Record<string, string> =
        source.kind === 'area' ? { a: source.value } : { c: source.value };
      const pool = parseMeals(await content('filter.php', param));
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      if (!chosen) return randomPick();
      const meals = parseMeals(await content('lookup.php', { i: chosen.idMeal }));
      return meals[0] ? mealToRecipe(meals[0]) : randomPick();
    },
  });
}

// Browse grid, intersected across Category (single) × Cuisine/areas (multi,
// FilterSheet). TheMealDB can't combine filters server-side, so it resolves here:
// each selected cuisine is its own filter.php call, UNIONed by id (a recipe
// matching ANY selected cuisine qualifies — that's what multi-select means),
// then intersected with the category set. Single dimension is a straight
// filter.php. filter.php omits strCategory, so stamp back the one we filtered by
// (keeps the grid honest, same fix as v1 Discover).
export function useDiscover(category: string | null, areas: string[] = []) {
  return useQuery<RecipeSummary[]>({
    // Cuisines are a SET, not a sequence: sort into the key so picking Thai then
    // Italian hits the same cache entry as Italian then Thai (re-ordering must
    // never refetch). Joined to a string so the key stays a stable primitive.
    queryKey: ['discover', category, [...areas].sort().join('|')],
    enabled: !!category || areas.length > 0,
    queryFn: async () => {
      // Sort here too, not just in the key: the key is order-insensitive, so two
      // different selection ORDERS share one cache entry — the result must
      // therefore be a pure function of that key, or whichever order fetched
      // first would decide what the other one sees.
      const sorted = [...areas].sort();
      if (USE_OTTO_RECIPES) return ottoDiscover(category, sorted);
      if (sorted.length > 0) {
        // One round trip per selected cuisine + the category one, all in flight
        // together (the old two-fetch Promise.all, widened).
        const [catJson, areaJsons] = await Promise.all([
          category ? content('filter.php', { c: category }) : Promise.resolve(null),
          Promise.all(sorted.map((a) => content('filter.php', { a }))),
        ]);
        // Union keyed by id — dedupes meals that sit in two selected cuisines,
        // and keeps TheMealDB's own order (first cuisine first) so a single
        // selection renders exactly the grid it did before.
        const union = new Map<string, Meal>();
        for (const json of areaJsons) {
          for (const m of parseMeals(json)) union.set(m.idMeal, m);
        }
        if (!category) return [...union.values()].map((m) => mealToSummary(m));
        return parseMeals(catJson)
          .filter((m) => union.has(m.idMeal))
          .map((m) => mealToSummary(m, category));
      }
      const meals = parseMeals(await content('filter.php', { c: category as string }));
      return meals.map((m) => mealToSummary(m, category));
    },
  });
}

// Cuisine list for the FilterSheet — list.php?a=list returns lean { strArea }
// rows (no meals), so parse them here rather than through parseMeals. Alphabetical
// as TheMealDB returns them; that already matches the Figma chip order.
const AreaListEnvelope = z.object({
  meals: z.array(z.object({ strArea: z.string() })).nullish(),
});
export function useAreas() {
  return useQuery<string[]>({
    queryKey: ['areas'],
    queryFn: async () =>
      (AreaListEnvelope.parse(await content('list.php', { a: 'list' })).meals ?? []).map(
        (r) => r.strArea,
      ),
    staleTime: 24 * 60 * 60 * 1000, // near-static
  });
}

// Search: by name first, ingredient fallback (kept from the old Search tab).
export function useSearch(query: string) {
  const q = query.trim();
  return useQuery<RecipeSummary[]>({
    queryKey: ['search', q],
    enabled: q.length > 0,
    queryFn: async () => {
      if (USE_OTTO_RECIPES) {
        // Cutover: titles from the serving copy (finds Otto originals too);
        // empty → the ingredient fallback below, unchanged.
        const hits = await ottoSearchByTitle(q);
        if (hits.length > 0) return hits;
        const meals = parseMeals(await content('filter.php', { i: q }));
        return meals.slice(0, 24).map((m) => mealToSummary(m));
      }
      let meals = parseMeals(await content('search.php', { s: q }));
      if (meals.length === 0) meals = parseMeals(await content('filter.php', { i: q }));
      return meals.slice(0, 24).map((m) => mealToSummary(m));
    },
  });
}

// ── user recipes (DB) ───────────────────────────────────────────────────────

// The `recipes` row's Json columns are typed as Json — validate them at the
// read boundary before they reach the engine / share card (rule 6 applies to
// our own loosely-typed columns too).
const IngredientsJson = z
  .array(
    z.object({
      measure: z.string().nullish(),
      name: z.string().nullish(),
      // Persisted at save (import.queries) — the per-line weight the detail's
      // scaling shows, same as the ON-path/seed grams. Absent on older rows.
      grams: z.number().nullish(),
    }),
  )
  .catch([]);
const StepsJson = z.array(z.string()).catch([]);

function rowToRecipe(row: Tables<'recipes'>): Recipe {
  return {
    id: toUserRecipeId(`u-${row.id}`),
    title: row.title,
    image: row.image ?? null,
    category: row.category ?? null,
    area: row.area ?? null,
    ingredients: IngredientsJson.parse(row.ingredients).map((i) => ({
      measure: i.measure ?? '',
      name: i.name ?? '',
      grams: i.grams ?? null,
    })),
    steps: StepsJson.parse(row.steps),
    youtubeUrl: row.youtube_url ?? null,
    servings: row.servings ?? null,
    source: row.source,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
  };
}

// ── unified detail read ─────────────────────────────────────────────────────

export function useRecipe(id: string) {
  return useQuery<Recipe | null>({
    queryKey: ['recipe', id],
    queryFn: async () => {
      if (isUserRecipeRef(id)) {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', Number(id.slice(2)))
          .maybeSingle();
        if (error) throw error;
        return data ? rowToRecipe(data) : null;
      }
      if (USE_OTTO_RECIPES) return ottoRecipeById(id);
      const meals = parseMeals(await content('lookup.php', { i: id }));
      return meals[0] ? mealToRecipe(meals[0]) : null;
    },
  });
}

// Exit section: other recipes in the same category (self removed). Seed only —
// user recipes have no catalogue neighbours.
export function useRelated(recipe: Recipe | null | undefined) {
  const category = recipe?.category ?? null;
  const selfId = recipe ? String(recipe.id) : '';
  return useQuery<RecipeSummary[]>({
    queryKey: ['related', category, selfId],
    enabled: !!category && !isUserRecipeRef(selfId),
    queryFn: async () => {
      if (USE_OTTO_RECIPES) return ottoRelated(category as string, selfId);
      const meals = parseMeals(await content('filter.php', { c: category as string }));
      return meals
        .filter((m) => m.idMeal !== selfId)
        .slice(0, 4)
        .map((m) => mealToSummary(m, category));
    },
  });
}
