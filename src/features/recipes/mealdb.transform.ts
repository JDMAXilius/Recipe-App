// The RecipeSource seam (feature-module.md rule 6: zod at the TheMealDB trust
// boundary). TheMealDB reaches us through the `content` edge function verbatim,
// so its envelope + meal rows are external, untrusted JSON — parsed here once,
// then transformed into the feature's own Recipe / RecipeSummary shapes. No
// screen or query ever touches a raw strIngredientN field.
//
// Port of mobile/services/mealAPI.js transformMealData: same ingredient-pair
// extraction, same step-label scrub. Behaviour pinned by mealdb.transform.test.mjs.
import { z } from 'zod';
// Runtime import kept relative (not the `@/types` alias) so this module stays
// loadable under `npm test` — node's type-stripping erases type-only `@/`
// imports but not value ones, matching the engine/estimates precedent.
import { toSeedId } from '../../types/ids';
import type { Recipe, RecipeSummary } from './recipe.types';

// A meal row: idMeal + strMeal are load-bearing; everything else is nullish.
// The strIngredient1..20 / strMeasure1..20 pairs arrive via catchall so we
// read them by index without declaring 40 optional fields.
const MealSchema = z
  .object({
    idMeal: z.string(),
    strMeal: z.string(),
    strMealThumb: z.string().nullish(),
    strCategory: z.string().nullish(),
    strArea: z.string().nullish(),
    strInstructions: z.string().nullish(),
    strYoutube: z.string().nullish(),
    strSource: z.string().nullish(),
  })
  .catchall(z.unknown());

export type Meal = z.infer<typeof MealSchema>;

const MealsEnvelope = z.object({ meals: z.array(MealSchema).nullish() });
const CategoriesEnvelope = z.object({
  categories: z
    .array(
      z.object({
        strCategory: z.string(),
        strCategoryDescription: z.string().nullish(),
        strCategoryThumb: z.string().nullish(),
      }),
    )
    .nullish(),
});

// content returns { meals: [...] | null }; null means "no rows", never an error.
export function parseMeals(json: unknown): Meal[] {
  return MealsEnvelope.parse(json).meals ?? [];
}

export function parseCategories(json: unknown) {
  const rows = CategoriesEnvelope.parse(json).categories ?? [];
  return rows.map((c) => ({
    name: c.strCategory,
    description: c.strCategoryDescription ?? '',
    thumb: c.strCategoryThumb ?? null,
  }));
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

// TheMealDB puts standalone "STEP 1" headers on their own line above the real
// instruction (52982 Carbonara). Kept, they render as numbered blanks and
// double the step count. Drop the label; the line below it is the step.
const isStepLabel = (line: string) => /^\s*(step\s*)?\d+\s*[:.)\-]?\s*$/i.test(line);

export function mealSteps(instructions: string | null | undefined): string[] {
  if (!instructions) return [];
  return instructions
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !isStepLabel(s));
}

export function mealIngredients(meal: Meal): { measure: string; name: string }[] {
  const pairs: { measure: string; name: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = str(meal[`strIngredient${i}`]);
    if (!name) continue;
    pairs.push({ measure: str(meal[`strMeasure${i}`]), name });
  }
  return pairs;
}

// Full meal → Recipe (detail). Seed recipes are 'themealdb'; the id brands as a
// SeedId (numeric). servings is unknown at this layer — the engine's recipeFacts
// owns the real yield, so null here is honest, not a fabricated 4.
export function mealToRecipe(json: unknown): Recipe {
  const meal = MealSchema.parse(json);
  return {
    id: toSeedId(meal.idMeal),
    title: meal.strMeal,
    image: meal.strMealThumb ?? null,
    category: meal.strCategory ?? null,
    area: meal.strArea ?? null,
    ingredients: mealIngredients(meal),
    steps: mealSteps(meal.strInstructions),
    youtubeUrl: meal.strYoutube ?? null,
    servings: null,
    source: 'themealdb',
    sourceName: null,
    sourceUrl: meal.strSource ?? null,
  };
}

// filter.php rows are id/name/thumb only — a summary carries nothing more.
export function mealToSummary(meal: Meal, category: string | null = null): RecipeSummary {
  return {
    id: toSeedId(meal.idMeal),
    title: meal.strMeal,
    image: meal.strMealThumb ?? null,
    category: meal.strCategory ?? category,
  };
}
