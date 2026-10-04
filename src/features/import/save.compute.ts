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
  return ingredients.map((p) => ({
    ...p,
    grams: parseIngredientLine(p).grams,
  }));
}

// UX ticket F3 ("Couldn't save. Try again." on the first save, second tap
// worked). The API logs for that save show ONE recipes POST (201) and no failed
// one: the first tap never reached the server. supabase-js reports a fetch that
// rejects (iOS drops a POST sent on a pooled connection the server already
// closed; NSURLSession retries only idempotent requests) as status 0, with a
// plain-object error, which is why the editor showed its generic fallback.
// One retry on status 0 covers it. Any HTTP answer (RLS, 4xx, 5xx) is final.
// ponytail: a request that reached the server but lost its response would
// insert twice; add an idempotency key if duplicate rows ever show up.
export async function retryOnTransportFailure<T extends { status: number }>(
  run: () => PromiseLike<T>,
): Promise<T> {
  const first = await run();
  return first.status === 0 ? run() : first;
}
