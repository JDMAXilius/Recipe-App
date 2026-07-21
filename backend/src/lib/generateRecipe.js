// AI recipe creation — "Cook something up with Otto". The user describes what
// they want ("a cozy 30-minute chicken dinner for 4, no dairy") and Claude
// writes a complete recipe draft. DORMANT until ANTHROPIC_API_KEY lands in
// env, same C21 pattern as the extraction endpoint.
//
// Honesty rules, enforced in prompt AND flow:
// - Every generated draft lands on the review/edit screen before it can be
//   saved — generation is never trusted blindly (same as imports).
// - Saved with source "otto" so an AI-written recipe is always labeled.
// - An is_possible gate declines nonsense or unsafe requests with a plain
//   reason instead of inventing something.
// - Amounts are weight-first from birth (founder rules, 2026-07): grams for
//   weighables, ml for thin liquids, tsp/tbsp for spices, decimals never
//   fractions — matching how the whole app now displays ingredients.
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../config/env.js";
import { logger } from "./logger.js";

export const generationActive = () => Boolean(ENV.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }));

// Opus-tier: generation IS the product here (unlike extraction, which is a
// classify-and-copy job on Haiku). Keep ONE stable schema — the API compiles
// and caches it for 24h.
const MODEL = "claude-opus-4-8";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_possible", "decline_reason", "title", "servings", "category", "area", "ingredients", "steps"],
  properties: {
    is_possible: { type: "boolean" },
    decline_reason: { anyOf: [{ type: "string" }, { type: "null" }] },
    title: { anyOf: [{ type: "string" }, { type: "null" }] },
    servings: { anyOf: [{ type: "integer" }, { type: "null" }] },
    category: { anyOf: [{ type: "string" }, { type: "null" }] },
    area: { anyOf: [{ type: "string" }, { type: "null" }] },
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
  },
};

const SYSTEM = `You are Otto's recipe developer. Given a request, write ONE complete, realistic, cookable recipe.

Rules — these are non-negotiable:
- If the request is not something a home cook can actually make (nonsense, unsafe, not food), set is_possible to false and put a short, kind, plain-language reason in decline_reason. Otherwise decline_reason is null.
- Write real, tested-style recipes: sensible quantities, correct technique, steps in cooking order. Never pad with filler steps.
- Amounts are WEIGHT-FIRST: solid ingredients in grams ("500 g", "12.5 g"), thin liquids in millilitres ("240 ml"), small spice amounts in tsp/tbsp ("0.5 tsp" — decimals, never fractions like ½ or 1/2). Whole items that carry a count keep it in the name where useful.
- measure holds ONLY the amount ("500 g", "0.5 tsp"); name holds the ingredient ("chicken thighs, boneless"). Unmeasured items get measure "" (e.g. "salt, to taste").
- Respect every stated constraint (time, dietary, equipment, servings, ingredients to use or avoid). If the user names a diet, the recipe must genuinely comply.
- steps are the method, one action per step, written like a good cookbook: clear, warm, no numbering (the app numbers them).
- category is one plain word for the kind of dish (Chicken, Beef, Dessert, Pasta, Vegetarian…); area is the cuisine (Italian, Thai…) or null if none applies.
- title: appetizing but honest — no clickbait superlatives.`;

const MAX_PROMPT_CHARS = 600;

// Clamp to the save schema's limits (validate.js) — same rule as both
// importers: never hand the editor a draft that POST /api/recipes rejects.
export function shapeGeneratedRecipe(data) {
  if (!data || data.is_possible !== true) return null;
  const ingredients = (data.ingredients || [])
    .filter((pair) => pair && pair.name)
    .slice(0, 100)
    .map((pair) => ({
      measure: String(pair.measure || "").slice(0, 80),
      name: String(pair.name).slice(0, 200),
    }));
  const steps = (data.steps || [])
    .filter(Boolean)
    .slice(0, 60)
    .map((step) => String(step).slice(0, 2000));
  if (ingredients.length === 0 || steps.length === 0) return null;
  return {
    title: String(data.title || "").slice(0, 300) || "Otto's idea",
    servings: Number.isInteger(data.servings) && data.servings > 0 ? Math.min(data.servings, 24) : 4,
    category: data.category ? String(data.category).slice(0, 100) : null,
    area: data.area ? String(data.area).slice(0, 100) : null,
    ingredients,
    steps,
  };
}

// → { recipe } | { declined: reason } | null (provider failure)
export async function generateRecipe({ prompt, servings, diet, cuisines }) {
  if (!generationActive()) return null;
  const ask = String(prompt || "").slice(0, MAX_PROMPT_CHARS).trim();
  if (!ask) return null;

  const context = [];
  if (Number.isInteger(servings) && servings > 0) context.push(`Servings: ${Math.min(servings, 24)}`);
  if (diet && diet !== "none") context.push(`Dietary preference: ${diet}`);
  if (Array.isArray(cuisines) && cuisines.length) {
    context.push(`Cuisines they enjoy (a lean, not a rule): ${cuisines.slice(0, 6).join(", ")}`);
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `${context.length ? `${context.join("\n")}\n\n` : ""}Recipe request:\n${ask}`,
      },
    ],
  });

  logger.info(
    { model: MODEL, usage: response.usage, stop: response.stop_reason },
    "recipe generation ran"
  );
  if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") return null;

  const textBlock = response.content.find((block) => block.type === "text");
  let data;
  try {
    data = JSON.parse(textBlock?.text ?? "");
  } catch {
    return null; // schema-constrained, so this shouldn't happen — null beats a guess
  }

  if (data.is_possible !== true) {
    return { declined: String(data.decline_reason || "Otto couldn't make a real recipe out of that.").slice(0, 300) };
  }
  const recipe = shapeGeneratedRecipe(data);
  return recipe ? { recipe } : null;
}
