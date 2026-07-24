// Pure compute-at-save helper — no Supabase, no React — so node --test can
// strip-type it directly (save.nutrition.test.mjs). The query layer
// (import.queries) wires this to the DB write.
//
// Grams are resolved ONCE at save via the same parser the detail's scaling uses
// (parseIngredientLine), then persisted onto each stored ingredient. User
// recipes then carry the per-line weight seed recipes already carry, so the
// ingredient list renders grams and the nutrition figure and the amounts
// describe the same portion — one source of truth, not two derivations.
// Relative (not @/) so the runtime value import resolves under `npm test`,
// whose loader doesn't read tsconfig `@/` aliases — same as recipe.scale.ts →
// ../nutrition/engine/parse. Resolves to the identical module either way.
import { parseIngredientLine } from '../nutrition/engine/parse';
import type { IngredientPair } from './draft';

export type StoredIngredient = IngredientPair & { grams: number | null };

export function ingredientsWithGrams(ingredients: IngredientPair[]): StoredIngredient[] {
  return ingredients.map((p) => ({ ...p, grams: parseIngredientLine(p).grams }));
}
