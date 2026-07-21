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

// ── Conversational build ("Chat with Otto") ──────────────────────────────────
// The one-shot generateRecipe above still powers the quick paths. This adds the
// back-and-forth: given the conversation so far, Otto EITHER asks one clarifying
// question (with tappable suggested answers) OR — when the request is already
// specific enough to cook — writes the recipe. Founder rules: skip the question
// when the ask is clear; the finished recipe still lands on the review editor.
const CHAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "message", "options", "title", "servings", "category", "area", "ingredients", "steps"],
  properties: {
    // "clarify" = ask one question; "recipe" = here's the dish; "decline" = can't/won't.
    mode: { type: "string", enum: ["clarify", "recipe", "decline"] },
    // Otto's conversational line: the question, the warm confirmation, or the kind decline.
    message: { type: "string" },
    // clarify only: 2–4 short tappable answers (chip-length). Empty otherwise.
    options: { type: "array", items: { type: "string" } },
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
        properties: { measure: { type: "string" }, name: { type: "string" } },
      },
    },
    steps: { type: "array", items: { type: "string" } },
  },
};

const CHAT_SYSTEM = `You are Otto — a warm, capable home-cooking companion having a SHORT chat to build ONE recipe the person will save to their cookbook.

Go straight to the answer. Default to "recipe" — make sensible choices yourself instead of asking. Each turn, choose exactly one mode:

- "recipe": almost always. Any request you can cook a reasonable version of, just cook it — fill in the obvious defaults ("a coffee" → a simple hot coffee; "pasta" → a classic you'd pick). Put a SHORT confirmation in message (a few words: "Here's a simple black coffee."), then fill title/servings/category/area/ingredients/steps. options is [].

- "clarify": rare — only when you genuinely cannot proceed without one fact. Ask ONE short question in message with 2–4 tappable answers in options. Never ask twice; on the next turn commit to a recipe. Leave title/ingredients/steps null/empty.

- "decline": not food, unsafe, or nonsense. One kind line in message. Empty/null everything else.

Recipe rules (when mode is "recipe"):
- Amounts are WEIGHT-FIRST: solids in grams ("500 g"), thin liquids in millilitres ("240 ml"), small spice amounts in tsp/tbsp ("0.5 tsp" — decimals, never fractions). measure holds ONLY the amount; name holds the ingredient. Unmeasured items get measure "".
- Respect every stated constraint (diet, time, servings, ingredients to use/avoid) and everything agreed earlier in the chat.
- steps: the method, one action per step, warm and clear, no numbering.
- category is one plain word (Chicken, Dessert, Drink…); area is the cuisine or null. title: appetizing but honest.

Keep message to one short line. No preamble, no follow-up suggestions, no "would you like…". Just the confirmation and the recipe.`;

// messages: [{ role: "user"|"assistant", content }] — the chat so far.
// → { clarify: {message, options} } | { recipe: {message, ...recipe} }
//   | { declined: message } | null (provider failure)
export async function chatRecipe({ messages, servings, diet, cuisines }) {
  if (!generationActive()) return null;
  const turns = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-12)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_PROMPT_CHARS) }));
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;

  const context = [];
  if (Number.isInteger(servings) && servings > 0) context.push(`They're cooking for ${Math.min(servings, 24)}.`);
  if (diet && diet !== "none") context.push(`Dietary preference: ${diet}.`);
  if (Array.isArray(cuisines) && cuisines.length) {
    context.push(`Cuisines they enjoy (a lean, not a rule): ${cuisines.slice(0, 6).join(", ")}.`);
  }
  const system = context.length ? `${CHAT_SYSTEM}\n\nContext for this person: ${context.join(" ")}` : CHAT_SYSTEM;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system,
    output_config: { format: { type: "json_schema", schema: CHAT_SCHEMA } },
    messages: turns,
  });

  logger.info({ model: MODEL, usage: response.usage, stop: response.stop_reason, turns: turns.length }, "recipe chat ran");
  if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") return null;

  const textBlock = response.content.find((block) => block.type === "text");
  let data;
  try {
    data = JSON.parse(textBlock?.text ?? "");
  } catch {
    return null;
  }

  const message = String(data.message || "").slice(0, 600);
  if (data.mode === "decline") {
    return { declined: message || "Otto couldn't make a real recipe out of that." };
  }
  if (data.mode === "clarify") {
    const options = (data.options || [])
      .filter((o) => typeof o === "string" && o.trim())
      .slice(0, 4)
      .map((o) => o.trim().slice(0, 80));
    return { clarify: { message: message || "Tell me a little more?", options } };
  }
  // mode "recipe"
  const recipe = shapeGeneratedRecipe({ ...data, is_possible: true });
  return recipe
    ? { recipe: { message: message || "Here's your recipe.", ...recipe } }
    : null;
}
