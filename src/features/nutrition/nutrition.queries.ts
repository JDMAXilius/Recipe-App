// ALL nutrition server state lives here (feature-module.md rule 2/3): TanStack
// Query only, keyed ['nutrition', recipeId]. Two honest sources, in order:
//   1. the seed_nutrition cache — the server-computed USDA figure for a seed
//      recipe (a trust boundary, so the cached JSON is zod-parsed before use;
//      rows cached before 2026-07-21 lack basis/doubt/computed_at, which the
//      schema marks .optional() — never fabricated here).
//   2. the frozen engine's computeNutrition — deterministic, no network/LLM.
// Below the coverage floor the engine returns null (honesty law); the card
// then falls back to a labelled category estimate.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase/client";
import { computeNutrition, unmatchedNames } from "./engine/compute";
import type { ComputeNutritionInput } from "./engine/compute";
import { resolveIngredients } from "./resolve.queries";
import { NutritionResultSchema } from "./engine/schemas";
import type { NutritionRecipe } from "./nutrition.types";

// The stored shape (schema output): the flat v1 row with the three late fields
// optional. Both the cache read and the fresh compute produce this.
export type NutritionValue = ReturnType<typeof NutritionResultSchema.parse>;

async function fetchNutrition(recipe: NutritionRecipe): Promise<NutritionValue | null> {
  // 1. cached server-computed figure (seed recipes). maybeSingle → null when
  //    absent (user recipes, uncached seeds), never throws on the empty case.
  const { data } = await supabase
    .from("seed_nutrition")
    .select("nutrition")
    .eq("recipe_id", String(recipe.id))
    .maybeSingle();
  if (data?.nutrition) {
    const parsed = NutritionResultSchema.safeParse(data.nutrition);
    if (parsed.success) return parsed.data;
    // a malformed cached row is not trusted — fall through to recompute
  }

  // 2. compute locally from the ingredient list. A flat default of 4 is the
  //    caller's fallback; curated seed recipes override it inside the engine.
  const input: ComputeNutritionInput = {
    ingredients: recipe.ingredients,
    servings: recipe.servings ?? 4,
    recipeId: recipe.id,
    steps: recipe.steps,
  };
  const local = computeNutrition(input);

  // 3. resolver tail — the 962-row bundled table covers most ingredients, but
  //    AI-generated and URL-imported recipes carry names it lacks. Ask the
  //    edge resolver for JUST those missing names, then recompute with the rows
  //    it found handed in as an override. The engine does no I/O itself; it only
  //    consumes the FoodRows. A resolver miss (null) stays a miss, and any
  //    resolver failure degrades to `local` — the card never blocks on it.
  const missing = unmatchedNames(input);
  if (!missing.length) return local;
  const resolved = await resolveIngredients(missing);
  if (!resolved.size) return local;
  // Prefer the improved figure; if the richer match set somehow trips a
  // plausibility guard (→ null), keep the coverage-vetted local result.
  return computeNutrition(input, resolved) ?? local;
}

export function useNutrition(recipe: NutritionRecipe) {
  return useQuery({
    queryKey: ["nutrition", String(recipe.id)],
    queryFn: () => fetchNutrition(recipe),
  });
}

// Batched per-serving calories for the grid tiles. The card badge must AGREE
// with what the recipe opens to (v1's "numbers never disagree" rule), so it
// reads the same server-computed seed_nutrition figure the detail screen uses —
// NOT a flat per-category estimate (which made every Beef tile read an
// identical "~450"). One request for the whole static seed table, cached for
// the session; each card does an O(1) Map lookup and falls back to the category
// estimate (tilde-framed) only when a recipe has no computed figure.
export function useSeedCalories() {
  return useQuery({
    queryKey: ["seed-calories"],
    staleTime: Infinity,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data } = await supabase.from("seed_nutrition").select("recipe_id, nutrition");
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        const kcal = (row.nutrition as { kcal?: unknown } | null)?.kcal;
        if (typeof kcal === "number" && Number.isFinite(kcal)) {
          map.set(String(row.recipe_id), Math.round(kcal));
        }
      }
      return map;
    },
  });
}
