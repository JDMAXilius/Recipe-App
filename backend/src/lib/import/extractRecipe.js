// I1b — LLM structured extraction: free text (a social caption today; OCR
// text or a transcript later) → the app-wide recipe draft shape. Built per
// docs/IMPORT_SHARE_RESEARCH.md §2.6 and DORMANT until ANTHROPIC_API_KEY
// lands in env (C21 pattern — same as SSO rows and the old nutrition keys).
//
// Honesty rules are enforced in the prompt AND the shape: missing fields
// come back null (never invented), steps keep the creator's wording, and an
// is_recipe gate rejects non-recipe posts before the review screen. Every
// draft still lands on the existing review/edit screen — extraction is
// never trusted blindly.
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";

export const extractionActive = () => Boolean(ENV.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }));

// claude-haiku-4-5: the research doc's pick for this classify-and-extract
// workload (~$0.003–0.01/import). Keep ONE stable schema — the API compiles
// and caches it for 24h.
const MODEL = "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_recipe", "title", "servings", "ingredients", "steps", "confidence"],
  properties: {
    is_recipe: { type: "boolean" },
    title: { anyOf: [{ type: "string" }, { type: "null" }] },
    servings: { anyOf: [{ type: "integer" }, { type: "null" }] },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["measure", "name"],
        properties: {
          measure: { type: "string" },
          name: { type: "string" },
        },
      },
    },
    steps: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
};

const SYSTEM = `You turn social-media recipe captions into structured recipe data.

Rules — these are non-negotiable:
- If the text does not actually contain a written recipe (ingredients and/or method), set is_recipe to false and leave everything else empty. Hashtag soup, a dish name alone, or "recipe in the video" is NOT a recipe.
- Never invent anything. A field the text doesn't state is null (title, servings) or omitted (an ingredient without a quantity gets measure ""). Do not guess quantities, servings, times, or steps.
- Keep the creator's wording for steps; fix only obvious transcription artifacts (emoji bullets, ALL CAPS headers).
- measure holds the quantity + unit exactly as written ("2 cups", "1/2 tsp"); name holds the ingredient itself.
- confidence: high = clearly structured recipe; medium = recipe present but you had to interpret formatting; low = fragmentary, the user must check every line.`;

const MAX_INPUT_CHARS = 16000; // ~4K tokens — captions/transcripts, not books

export async function extractRecipeFromText({ text, platform, authorName }) {
  if (!extractionActive()) return null;
  const input = String(text || "").slice(0, MAX_INPUT_CHARS).trim();
  if (!input) return null;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Caption from ${platform || "a social post"}${authorName ? ` by ${authorName}` : ""}:\n\n${input}`,
      },
    ],
  });

  logger.info(
    { platform, model: MODEL, usage: response.usage, stop: response.stop_reason },
    "caption extraction ran"
  );
  if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") return null;

  const textBlock = response.content.find((block) => block.type === "text");
  let data;
  try {
    data = JSON.parse(textBlock?.text ?? "");
  } catch {
    return null; // schema-constrained, so this shouldn't happen — null beats a guess
  }
  if (!data.is_recipe || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    return null;
  }

  // Clamp to the save schema's limits (validate.js) — same rule as the
  // JSON-LD importer: never hand the editor a draft that POST /api/recipes
  // will reject.
  const clamp = (value, max) => (value == null ? null : String(value).slice(0, max));
  return {
    title: clamp(data.title, 300) || "Untitled recipe",
    servings: Number.isInteger(data.servings) && data.servings > 0 ? data.servings : null,
    category: null,
    area: null,
    ingredients: data.ingredients
      .filter((pair) => pair && pair.name)
      .slice(0, 100)
      .map((pair) => ({
        measure: String(pair.measure || "").slice(0, 80),
        name: String(pair.name).slice(0, 200),
      })),
    steps: (data.steps || [])
      .filter(Boolean)
      .slice(0, 60)
      .map((step) => String(step).slice(0, 2000)),
    confidence: data.confidence,
  };
}
