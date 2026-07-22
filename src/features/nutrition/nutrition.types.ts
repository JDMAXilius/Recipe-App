// Domain input for the nutrition layer. The engine takes v1's (measure, name)
// ingredient pairs verbatim; a recipe crossing into this feature carries those
// plus the two facts the card needs (servings, category) and a branded id.
import type { SeedId, UserRecipeId } from "@/types/ids";

export interface NutritionRecipe {
  id: SeedId | UserRecipeId;
  ingredients: { measure: string; name: string }[];
  servings: number | null;
  category?: string | null;
  steps?: string[];
}
