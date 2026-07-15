// Write-body validation (B0.2). Reject bad shapes with a 400 before the DB
// ever sees them. Schemas mirror what the routes/DB actually accept — no
// silent coercion beyond what the API already promised clients.
import { z } from "zod";

const trimmed = (max) => z.string().trim().min(1).max(max);
const optionalStr = (max) => z.string().trim().max(max).nullish();
const DAY = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "day must be YYYY-MM-DD");

// The whole app passes ingredients as [{ measure, name }].
const ingredient = z.object({
  measure: z.string().trim().max(80).default(""),
  name: trimmed(200),
});

export const schemas = {
  favoriteCreate: z.object({
    recipeId: z.coerce.number().int().positive(),
    title: trimmed(300),
    image: optionalStr(2000),
    cookTime: optionalStr(50),
    servings: z.coerce.string().max(20).nullish(),
    category: optionalStr(100),
  }),

  importBody: z.object({
    url: z.string().trim().url().max(2000),
  }),

  recipeCreate: z.object({
    source: z.enum(["imported", "manual"]),
    sourceUrl: optionalStr(2000),
    sourceName: optionalStr(200),
    title: trimmed(300),
    image: optionalStr(2000),
    category: optionalStr(100),
    area: optionalStr(100),
    servings: z.coerce.number().int().min(1).max(48).nullish().catch(null),
    ingredients: z.array(ingredient).max(100).default([]),
    steps: z.array(z.string().trim().min(1).max(2000)).max(60).default([]),
    youtubeUrl: optionalStr(2000),
    visibility: z.enum(["private", "public"]).default("private"),
  }),

  // PUT allows partial edits; attribution fields stay immutable (stripped, not errored,
  // so older clients that echo the whole object back don't break).
  recipeUpdate: z.object({
    title: trimmed(300).optional(),
    image: optionalStr(2000).optional(),
    category: optionalStr(100).optional(),
    area: optionalStr(100).optional(),
    servings: z.coerce.number().int().min(1).max(48).nullish().catch(null).optional(),
    ingredients: z.array(ingredient).max(100).optional(),
    steps: z.array(z.string().trim().min(1).max(2000)).max(60).optional(),
    youtubeUrl: optionalStr(2000).optional(),
    visibility: z.enum(["private", "public"]).optional(),
  }),

  planCreate: z.object({
    day: DAY,
    recipeId: optionalStr(40), // "52772" (seed) or "u-12" (user)
    title: trimmed(300),
    image: optionalStr(2000),
    category: optionalStr(100),
    note: optionalStr(500),
  }),

  planUpdate: z.object({
    day: DAY.optional(),
    note: optionalStr(500).optional(),
    cooked: z.boolean().optional(),
  }),
};

// validate(schemas.x) → middleware; parsed body replaces req.body.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const first = result.error.issues[0];
      return res.status(400).json({
        error: `Invalid ${first?.path?.join(".") || "body"}: ${first?.message || "bad value"}`,
      });
    }
    req.body = result.data;
    next();
  };
}
