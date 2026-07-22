// Server I/O for the nutrition tail (feature-module.md rule 2): the ONLY place
// the resolve-nutrition edge function is called. The frozen engine never does
// network/LLM I/O — it is handed the FoodRows this returns as an override.
//
// resolve-nutrition (deployed + verified live) takes ≤40 lowercased names,
// each ≤120 chars, and returns { resolved: { [loweredName]: FoodRow | null } }
// per-100g — null being an HONEST miss (not in USDA whole-food data). It caches
// durably server-side, so a name is paid for once ever; the client just wraps
// the call in the recipe's nutrition query so a given recipe resolves once/session.
import { z } from "zod";
import { supabase } from "@/shared/supabase/client";
import { FoodRowSchema } from "./engine/schemas";
import { key } from "./engine/lookup";
import type { FoodRow } from "./engine/lookup";
import type { ResolvedOverride } from "./engine/compute";

const MAX_NAMES = 40; // resolver contract: ≤40 names per call
const MAX_LEN = 120; // resolver contract: each name ≤120 chars

// The resolved value is a per-100g FoodRow (same shape the bundled table holds)
// or null for an honest miss. A trust boundary → zod-parse before it reaches the
// engine; a malformed entry is dropped, never fed in.
const ResolveResponseSchema = z.object({
  resolved: z.record(z.string(), FoodRowSchema.nullable()),
});

// Resolve ONLY the names the local table missed. Returns a Map<loweredName,
// FoodRow|null> the engine consumes as an override. Never throws: a resolver
// failure (401 not signed in, 429 rate limited, network, malformed) degrades to
// an empty map, so the caller keeps whatever the local engine already produced.
export async function resolveIngredients(names: string[]): Promise<ResolvedOverride> {
  const out: ResolvedOverride = new Map();
  // dedupe + lowercase + length-clamp; drop empties and over-long names (a
  // miss the resolver would reject anyway → stays a miss locally).
  const uniq = [...new Set(names.map(key))].filter((n) => n && n.length <= MAX_LEN);
  if (!uniq.length) return out;

  // The resolver 401s when not signed in — check locally rather than spend a
  // round-trip to be told. Guest sessions count as signed in.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return out;

  for (let i = 0; i < uniq.length; i += MAX_NAMES) {
    const batch = uniq.slice(i, i + MAX_NAMES);
    const { data, error } = await supabase.functions.invoke("resolve-nutrition", {
      body: { names: batch },
    });
    if (error) continue; // 401/429/network — degrade, never crash the card
    const parsed = ResolveResponseSchema.safeParse(data);
    if (!parsed.success) continue;
    for (const [name, row] of Object.entries(parsed.data.resolved)) {
      out.set(key(name), (row ?? null) as FoodRow | null);
    }
  }
  return out;
}
