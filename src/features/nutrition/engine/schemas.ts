// Runtime data shapes (zod) — written FROM the v1 provider's actual output
// (usdaProvider.js final return object), which is what `seed_nutrition` rows
// and `recipes.nutrition` cache. The v1 FLAT shape, verbatim: a new shape
// would reject every cached row.
//
// NOTE for auditors: engine.md's prose field list names `estimated` and
// `breakdown[]`; the v1 code it cites (usdaProvider.js:593-607) emits neither
// — it emits `basis`, `doubt`, `computed_at`. The schema follows the CODE
// (and the recorded fixture), because the cached rows do. Reported as a
// contract_gap by the port packet.
import { z } from "zod";

export const NutritionResultSchema = z.object({
  kcal: z.number(),
  protein_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
  basis_grams: z.number().nullable(),
  per: z.literal("serving"),
  source: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  // Added to v1 output 2026-07-21; rows cached before then may lack them.
  basis: z.enum(["measured", "estimated"]).optional(),
  doubt: z.number().nullable().optional(),
  computed_at: z.string().optional(),
});

export type NutritionResult = z.infer<typeof NutritionResultSchema> & {
  // The engine itself always emits the full current shape.
  basis: "measured" | "estimated";
  doubt: number | null;
  computed_at: string;
};

// A bundled USDA food row (usdaTable.json / usdaCookedTable.json values).
export const FoodRowSchema = z.looseObject({
  fdcId: z.number().nullable(),
  usda: z.string(),
  kcal: z.number(),
  protein_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
  // Optional raw→cooked mass yield for cooked-table records (e.g. confit duck at
  // 0.605, protein-conserved). The engine multiplies grams by this; absent → 1.
  raw_yield: z.number().optional(),
});
