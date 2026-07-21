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

  // "Cook something up with Otto" — the AI recipe request.
  generateBody: z.object({
    prompt: z.string().trim().min(3).max(600),
    servings: z.coerce.number().int().min(1).max(24).optional(),
    diet: z.string().trim().max(40).optional(),
    cuisines: z.array(z.string().trim().max(40)).max(6).optional(),
  }),

  // Conversational build ("Chat with Otto"): the whole thread each turn.
  generateChatBody: z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(600),
        })
      )
      .min(1)
      .max(20),
    servings: z.coerce.number().int().min(1).max(24).optional(),
    diet: z.string().trim().max(40).optional(),
    cuisines: z.array(z.string().trim().max(40)).max(6).optional(),
  }),

  importTextBody: z.object({
    text: z.string().trim().min(40).max(20000),
  }),

  // Photo import: base64 image body. 7M base64 chars ≈ 5 MB decoded —
  // Claude's per-image ceiling; the client compresses before sending.
  importPhotoBody: z.object({
    image: z.string().min(100).max(7_000_000),
    mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  }),

  collabCreate: z.object({
    displayName: z.string().trim().min(1).max(40),
    items: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(200),
          amount: z.string().trim().max(60).optional(),
        })
      )
      .max(200)
      .optional(),
  }),

  collabItemAdd: z.object({
    displayName: z.string().trim().min(1).max(40),
    name: z.string().trim().min(1).max(200),
    amount: z.string().trim().max(60).optional(),
  }),

  collabItemCheck: z.object({
    displayName: z.string().trim().min(1).max(40),
    checked: z.boolean(),
  }),

  recipeCreate: z.object({
    source: z.enum(["imported", "manual", "otto"]),
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

  // Shopping-list snapshot share (S2/G2) — the exact rows the sender saw.
  listShareBody: z.object({
    items: z
      .array(
        z.object({
          name: trimmed(200),
          amount: z.string().trim().max(120).default(""),
          aisle: z.string().trim().max(60).default(""),
          sources: z.array(z.string().trim().max(300)).max(20).default([]),
        })
      )
      .min(1)
      .max(200),
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
