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
  mealToRecipe,
  mealToSummary,
  parseCategories,
  parseMeals,
} from './mealdb.transform';
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

// Browse grid for a category. filter.php omits strCategory, so stamp back the
// one we filtered by (keeps the grid honest, same fix as v1 Discover).
export function useDiscover(category: string | null) {
  return useQuery<RecipeSummary[]>({
    queryKey: ['discover', category],
    enabled: !!category,
    queryFn: async () => {
      const meals = parseMeals(await content('filter.php', { c: category as string }));
      return meals.map((m) => mealToSummary(m, category));
    },
  });
}

// Search: by name first, ingredient fallback (kept from the old Search tab).
export function useSearch(query: string) {
  const q = query.trim();
  return useQuery<RecipeSummary[]>({
    queryKey: ['search', q],
    enabled: q.length > 0,
    queryFn: async () => {
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
  .array(z.object({ measure: z.string().nullish(), name: z.string().nullish() }))
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
      const meals = parseMeals(await content('filter.php', { c: category as string }));
      return meals
        .filter((m) => m.idMeal !== selfId)
        .slice(0, 4)
        .map((m) => mealToSummary(m, category));
    },
  });
}
