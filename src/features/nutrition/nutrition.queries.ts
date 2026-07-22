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
import { computeNutrition } from "./engine/compute";
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
  return computeNutrition({
    ingredients: recipe.ingredients,
    servings: recipe.servings ?? 4,
    recipeId: recipe.id,
    steps: recipe.steps,
  });
}

export function useNutrition(recipe: NutritionRecipe) {
  return useQuery({
    queryKey: ["nutrition", String(recipe.id)],
    queryFn: () => fetchNutrition(recipe),
  });
}
