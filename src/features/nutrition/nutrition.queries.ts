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

// The compute + resolver tail, in ONE place. Deterministic engine first, then
// the edge resolver for names the bundled 962-row table missed. Exported so the
// SAVE path (import.queries) can persist the SAME figure the detail computes —
// user recipes then carry a precomputed per-serving number exactly like seeds,
// which is what makes the card and the detail agree. Never throws: a resolver
// failure degrades to the coverage-vetted local result; the engine returning
// null (below the coverage floor) stays null and the caller falls back to the
// labelled category estimate.
export async function resolveNutrition(
  input: ComputeNutritionInput,
): Promise<NutritionValue | null> {
  const local = computeNutrition(input);
  const missing = unmatchedNames(input);
  if (!missing.length) return local;
  const resolved = await resolveIngredients(missing);
  if (!resolved.size) return local;
  // Prefer the improved figure; if the richer match set somehow trips a
  // plausibility guard (→ null), keep the coverage-vetted local result.
  return computeNutrition(input, resolved) ?? local;
}

async function fetchNutrition(recipe: NutritionRecipe): Promise<NutritionValue | null> {
  const id = String(recipe.id);

  // 0. user recipe ("u-<n>") → the per-serving figure computed + persisted at
  //    save (recipes.nutrition), the single source of truth the card reads too.
  //    Same trust-boundary parse as seed_nutrition; a missing/malformed value
  //    (older row, or the engine returned null at save) falls through to a live
  //    compute so nothing regresses.
  if (id.startsWith("u-")) {
    const { data } = await supabase
      .from("recipes")
      .select("nutrition")
      .eq("id", Number(id.slice(2)))
      .maybeSingle();
    if (data?.nutrition) {
      const parsed = NutritionResultSchema.safeParse(data.nutrition);
      if (parsed.success) return parsed.data;
    }
    return resolveNutrition({
      ingredients: recipe.ingredients,
      servings: recipe.servings ?? 4,
      recipeId: recipe.id,
      steps: recipe.steps,
    });
  }

  // 1. cached server-computed figure (seed recipes). maybeSingle → null when
  //    absent (uncached seeds), never throws on the empty case.
  const { data } = await supabase
    .from("seed_nutrition")
    .select("nutrition")
    .eq("recipe_id", id)
    .maybeSingle();
  if (data?.nutrition) {
    const parsed = NutritionResultSchema.safeParse(data.nutrition);
    if (parsed.success) return parsed.data;
    // a malformed cached row is not trusted — fall through to recompute
  }

  // 2/3. compute locally, then the resolver tail. A flat default of 4 is the
  //    caller's fallback; curated seed recipes override it inside the engine.
  return resolveNutrition({
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
      const { data } = await supabase.from("seed_nutrition").select("recipe_id, nutrition").range(0, 99999);
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
