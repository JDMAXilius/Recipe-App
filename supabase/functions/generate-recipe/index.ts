// generate-recipe — "Cook something up with Otto". Prompt + validation shape
// ported from backend/src/lib/generateRecipe.js (one-shot AND chat modes; the
// body decides: {prompt} → one-shot, {messages} → chat).
// DORMANT without ANTHROPIC_API_KEY (503). Key comes ONLY from Deno.env and is
// never logged or echoed. Per-user rate limit: this is the most expensive path.
import { z } from "npm:zod@4";
import { getUserId, json, preflight, rateLimited } from "../_shared/http.ts";
import { checkImage, VISION_INSTRUCTION } from "./imageMode.ts";

const MODEL = "claude-opus-4-8";
const MAX_PROMPT_CHARS = 600;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const commonFields = {
  servings: z.coerce.number().int().min(1).max(24).optional(),
  diet: z.string().trim().max(40).optional(),
  cuisines: z.array(z.string().trim().max(40)).max(6).optional(),
};
const generateBody = z.object({
  prompt: z.string().trim().min(3).max(MAX_PROMPT_CHARS),
  ...commonFields,
});
const chatBody = z.object({
  messages: z
    .array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(MAX_PROMPT_CHARS),
    }))
    .min(1)
    .max(20),
  ...commonFields,
});

// ---- schemas + prompts (verbatim from v1) ---------------------------------
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
        properties: { measure: { type: "string" }, name: { type: "string" } },
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

const CHAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "message", "options", "title", "servings", "category", "area", "ingredients", "steps"],
  properties: {
    mode: { type: "string", enum: ["clarify", "recipe", "decline"] },
    message: { type: "string" },
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

// ---- shaping (port of shapeGeneratedRecipe) --------------------------------
// deno-lint-ignore no-explicit-any
function shapeGeneratedRecipe(data: any) {
  if (!data || data.is_possible !== true) return null;
  const ingredients = (data.ingredients || [])
    // deno-lint-ignore no-explicit-any
    .filter((pair: any) => pair && pair.name)
    .slice(0, 100)
    // deno-lint-ignore no-explicit-any
    .map((pair: any) => ({
      measure: String(pair.measure || "").slice(0, 80),
      name: String(pair.name).slice(0, 200),
    }));
  const steps = (data.steps || [])
    .filter(Boolean)
    .slice(0, 60)
    .map((step: unknown) => String(step).slice(0, 2000));
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

type Turn = { role: "user" | "assistant"; content: string };
// Vision turns carry a content-block array (image + text) instead of a string;
// the string Turn (chat/one-shot) is still assignable to Message[].
type VisionContent = Array<
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "text"; text: string }
>;
type Message = Turn | { role: "user"; content: VisionContent };

// deno-lint-ignore no-explicit-any
async function askClaude(system: string, schema: unknown, messages: Message[]): Promise<any> {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system,
      output_config: { format: { type: "json_schema", schema } },
      messages,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Anthropic answered ${response.status}`);
  const data = await response.json();
  if (data.stop_reason === "max_tokens" || data.stop_reason === "refusal") return null;
  // deno-lint-ignore no-explicit-any
  const textBlock = (data.content || []).find((b: any) => b.type === "text");
  try {
    return JSON.parse(textBlock?.text ?? "");
  } catch {
    return null; // schema-constrained, so this shouldn't happen — null beats a guess
  }
}

function contextLines(body: z.infer<typeof generateBody> | z.infer<typeof chatBody>): string[] {
  const context: string[] = [];
  if (Number.isInteger(body.servings) && body.servings! > 0) {
    context.push(`Servings: ${Math.min(body.servings!, 24)}`);
  }
  if (body.diet && body.diet !== "none") context.push(`Dietary preference: ${body.diet}`);
  if (Array.isArray(body.cuisines) && body.cuisines.length) {
    context.push(`Cuisines they enjoy (a lean, not a rule): ${body.cuisines.slice(0, 6).join(", ")}`);
  }
  return context;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  // v1 costlyLimiter budget: 20 per 15 min per user.
  if (rateLimited(`gen:${userId}`, 20, 15 * 60 * 1000)) {
    return json(429, { error: "Too many requests — give it a few minutes and try again" });
  }
  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json(503, { error: "Otto can't cook ideas up just yet — that part of the kitchen is still being wired up." });
  }

  const raw = await req.json().catch(() => ({}));

  try {
    // -------- chat mode --------
    if (raw && typeof raw === "object" && "messages" in raw) {
      const parsed = chatBody.safeParse(raw);
      if (!parsed.success) return json(400, { error: "Invalid body" });
      const turns: Turn[] = parsed.data.messages.slice(-12);
      if (turns[turns.length - 1].role !== "user") return json(400, { error: "Invalid body" });
      const context = contextLines(parsed.data);
      const system = context.length
        ? `${CHAT_SYSTEM}\n\nContext for this person: ${context.join(" ")}`
        : CHAT_SYSTEM;
      const data = await askClaude(system, CHAT_SCHEMA, turns);
      if (!data) return json(502, { error: "Otto lost his train of thought — try again in a moment." });
      const message = String(data.message || "").slice(0, 600);
      if (data.mode === "decline") {
        return json(200, { mode: "decline", message: message || "Otto couldn't make a real recipe out of that." });
      }
      if (data.mode === "clarify") {
        const options = (data.options || [])
          .filter((o: unknown) => typeof o === "string" && (o as string).trim())
          .slice(0, 4)
          .map((o: string) => o.trim().slice(0, 80));
        return json(200, { mode: "clarify", message: message || "Tell me a little more?", options });
      }
      const recipe = shapeGeneratedRecipe({ ...data, is_possible: true });
      if (!recipe) return json(502, { error: "Otto lost his train of thought — try again in a moment." });
      return json(200, {
        mode: "recipe",
        message: message || "Here's your recipe.",
        recipe: { ...recipe, image: null, source: "otto", sourceUrl: null, sourceName: null },
      });
    }

    // -------- vision mode (photo → transcribed recipe) --------
    if (raw && typeof raw === "object" && "image" in raw) {
      // deno-lint-ignore no-explicit-any
      const check = checkImage((raw as any).image, (raw as any).mimeType);
      if (!check.ok) {
        return check.status === 413
          ? json(413, { error: "That photo's a bit big for Otto — try a smaller, clearer shot." })
          : json(400, { error: "Invalid body" });
      }
      const data = await askClaude(SYSTEM, SCHEMA, [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: check.mimeType, data: check.image } },
          { type: "text", text: VISION_INSTRUCTION },
        ],
      }]);
      if (!data) return json(502, { error: "Otto's idea burner wouldn't light — try again in a moment." });
      if (data.is_possible !== true) {
        return json(422, {
          error: String(data.decline_reason || "Otto couldn't read that photo — try a clearer shot.").slice(0, 300),
        });
      }
      const recipe = shapeGeneratedRecipe(data);
      if (!recipe) return json(502, { error: "Otto couldn't read that photo — try a clearer shot." });
      return json(200, { ...recipe, image: null, source: "otto", sourceUrl: null, sourceName: null });
    }

    // -------- one-shot mode --------
    const parsed = generateBody.safeParse(raw);
    if (!parsed.success) return json(400, { error: "Invalid body" });
    const context = contextLines(parsed.data);
    const data = await askClaude(SYSTEM, SCHEMA, [
      {
        role: "user",
        content: `${context.length ? `${context.join("\n")}\n\n` : ""}Recipe request:\n${parsed.data.prompt}`,
      },
    ]);
    if (!data) return json(502, { error: "Otto's idea burner wouldn't light — try again in a moment." });
    if (data.is_possible !== true) {
      return json(422, {
        error: String(data.decline_reason || "Otto couldn't make a real recipe out of that.").slice(0, 300),
      });
    }
    const recipe = shapeGeneratedRecipe(data);
    if (!recipe) return json(502, { error: "Otto's idea burner wouldn't light — try again in a moment." });
    return json(200, { ...recipe, image: null, source: "otto", sourceUrl: null, sourceName: null });
  } catch (error) {
    console.error("recipe generation failed", (error as Error).message);
    return json(502, { error: "Otto couldn't finish that idea right now — try again in a moment." });
  }
});
