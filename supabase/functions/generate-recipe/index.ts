// generate-recipe — "Cook something up with Otto". Prompt + validation shape
// ported from backend/src/lib/generateRecipe.js (one-shot AND chat modes; the
// body decides: {prompt} → one-shot, {messages} → chat).
// DORMANT without ANTHROPIC_API_KEY (503). Key comes ONLY from Deno.env and is
// never logged or echoed. Per-user rate limit: this is the most expensive path.
import { z } from "npm:zod@4";
import { corsHeaders, getUserId, json, preflight, rateLimited } from "../_shared/http.ts";
import { checkImage, VISION_INSTRUCTION } from "./imageMode.ts";
import { extractMessagePrefix, parseSseLines } from "./streamParse.ts";

const MODEL_TEXT = "claude-sonnet-5"; // chat + one-shot: schema-constrained work, ~5x cheaper
const MODEL_VISION = "claude-opus-4-8"; // photo transcription stays on opus until measured on sonnet
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
  stream: z.boolean().optional(),
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

Each turn, choose exactly one mode:

- "recipe": when the request names a dish or a clear enough craving ("chicken tikka masala", "a cozy tomato soup for two", "carbonara but vegetarian"), cook it. Fill sensible defaults for anything small that's unstated. Put a SHORT confirmation in message (a few words), then fill title/servings/category/area/ingredients/steps. options is [].

- "clarify": when the request is too general to pick well ("make me a coffee", "pasta", "something for dinner", "use up my chicken") ask ONE short question in message and put 2-4 appetizing directions in options (e.g. for coffee: "Latte", "Cappuccino", "Cold brew", "Simple black"). Options are tappable answers, each a few words. NEVER clarify twice in a row; after one clarify, commit to a recipe with whatever you have. Leave title/ingredients/steps null/empty.

- "decline": not food, unsafe, or nonsense. One kind line in message. Empty/null everything else.

Voice rule for message and options: short plain sentences, never the em dash character.

Recipe rules (when mode is "recipe"):
- Amounts are WEIGHT-FIRST: solids in grams ("500 g"), thin liquids in millilitres ("240 ml"), small spice amounts in tsp/tbsp ("0.5 tsp" — decimals, never fractions). measure holds ONLY the amount; name holds the ingredient. Unmeasured items get measure "".
- Respect every stated constraint (diet, time, servings, ingredients to use/avoid) and everything agreed earlier in the chat.
- steps: the method, one action per step, warm and clear, no numbering.
- category is one plain word (Chicken, Dessert, Drink…); area is the cuisine or null. title: appetizing but honest.

Keep message to one short line. No preamble, no follow-up suggestions, no "would you like…". Just the confirmation and the recipe.

Speed matters: thinking adds latency and should be rare here. For everyday dishes, drinks, and clarify turns, respond directly without thinking. Think only when the request has genuinely tricky constraints (unusual dietary combinations, ingredient substitutions that affect chemistry).`;

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

// System goes as blocks: the static prompt carries a cache_control breakpoint;
// any per-user context rides in a second, uncached block so it never breaks
// the cacheable prefix. HONEST CEILING (critic 2026-07-24): Anthropic ignores
// breakpoints below a ~1024-token prefix and our prompts sit under that, so
// today this earns no discount (harmless; it self-activates if the prompt
// grows). Confirm via usage.cache_creation_input_tokens on a live call.
type SystemBlock = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };
function systemBlocks(staticPrompt: string, context?: string): SystemBlock[] {
  const blocks: SystemBlock[] = [{ type: "text", text: staticPrompt, cache_control: { type: "ephemeral" } }];
  if (context) blocks.push({ type: "text", text: context });
  return blocks;
}

// effort: the latency knob (docs: sonnet-5 at "medium" ≈ prior-gen "high").
// Chat/one-shot pass "medium" so turns come back faster; vision omits it
// (default "high") because faithful photo transcription is quality-critical.
// deno-lint-ignore no-explicit-any
async function askClaude(model: string, system: SystemBlock[], schema: unknown, messages: Message[], effort?: string): Promise<any> {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system,
      output_config: { format: { type: "json_schema", schema }, ...(effort ? { effort } : {}) },
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

// Chat post-processing shared by the JSON and SSE paths: model output →
// the exact response payload. null means "lost his train of thought"
// (502 on the JSON path, an error event on the SSE path).
const CHAT_LOST = "Otto lost his train of thought. Try again in a moment.";
// deno-lint-ignore no-explicit-any
function chatPayload(data: any) {
  const message = String(data.message || "").slice(0, 600);
  if (data.mode === "decline") {
    return { mode: "decline", message: message || "Otto couldn't make a real recipe out of that." };
  }
  if (data.mode === "clarify") {
    const options = (data.options || [])
      .filter((o: unknown) => typeof o === "string" && (o as string).trim())
      .slice(0, 4)
      .map((o: string) => o.trim().slice(0, 80));
    return { mode: "clarify", message: message || "Tell me a little more?", options };
  }
  const recipe = shapeGeneratedRecipe({ ...data, is_possible: true });
  if (!recipe) return null;
  return {
    mode: "recipe",
    message: message || "Here's your recipe.",
    recipe: { ...recipe, image: null, source: "otto", sourceUrl: null, sourceName: null },
  };
}

// Chat mode with stream:true — same Anthropic call with stream:true, relayed
// as our own SSE: {"type":"delta","text"} for each new slice of the message
// field, then {"type":"done","payload"} with EXACTLY the JSON-path payload,
// or {"type":"error","error"} with the JSON-path copy. Auth/rate-limit/400/
// 503 all ran before we get here.
function streamChat(system: SystemBlock[], turns: Turn[]): Response {
  const body = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const response = await fetch(ANTHROPIC_URL, {
          method: "POST",
          headers: {
            "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL_TEXT,
            max_tokens: 4000,
            stream: true,
            thinking: { type: "adaptive" },
            system,
            output_config: { format: { type: "json_schema", schema: CHAT_SCHEMA }, effort: "medium" },
            messages: turns,
          }),
          signal: AbortSignal.timeout(120000),
        });
        if (!response.ok || !response.body) throw new Error(`Anthropic answered ${response.status}`);

        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let carry = "";
        let buffer = "";
        let sent = "";
        let stopReason: string | null = null;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const split = parseSseLines(decoder.decode(value, { stream: true }), carry);
            carry = split.carry;
            for (const raw of split.events) {
              // deno-lint-ignore no-explicit-any
              let event: any;
              try {
                event = JSON.parse(raw);
              } catch {
                continue;
              }
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                buffer += event.delta.text;
                const prefix = extractMessagePrefix(buffer);
                if (prefix.length > sent.length) {
                  send({ type: "delta", text: prefix.slice(sent.length) });
                  sent = prefix;
                }
              } else if (event.type === "message_delta") {
                stopReason = event.delta?.stop_reason ?? stopReason;
              }
              // thinking deltas and every other event type: ignored
            }
          }
        } finally {
          reader.cancel().catch(() => {}); // client gone or loop done: stop upstream
        }

        let payload = null;
        if (stopReason !== "max_tokens" && stopReason !== "refusal") {
          try {
            payload = chatPayload(JSON.parse(buffer));
          } catch {
            // payload stays null → error event
          }
        }
        send(payload ? { type: "done", payload } : { type: "error", error: CHAT_LOST });
      } catch (error) {
        console.error("recipe chat stream failed", (error as Error).message);
        try {
          send({ type: "error", error: "Otto couldn't finish that idea right now. Try again in a moment." });
        } catch {
          // client already disconnected — nothing to tell it
        }
      }
      try {
        controller.close();
      } catch {
        // already closed/cancelled
      }
    },
  });
  return new Response(body, {
    headers: { ...corsHeaders, "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
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
    return json(429, { error: "Too many requests. Give it a few minutes and try again" });
  }
  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json(503, { error: "Otto can't cook ideas up just yet. That part of the kitchen is still being wired up." });
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
      const system = systemBlocks(
        CHAT_SYSTEM,
        context.length ? `Context for this person: ${context.join(" ")}` : undefined,
      );
      if (parsed.data.stream) return streamChat(system, turns);
      const data = await askClaude(MODEL_TEXT, system, CHAT_SCHEMA, turns, "medium");
      if (!data) return json(502, { error: CHAT_LOST });
      const payload = chatPayload(data);
      if (!payload) return json(502, { error: CHAT_LOST });
      return json(200, payload);
    }

    // -------- vision mode (photo → transcribed recipe) --------
    if (raw && typeof raw === "object" && "image" in raw) {
      // deno-lint-ignore no-explicit-any
      const check = checkImage((raw as any).image, (raw as any).mimeType);
      if (!check.ok) {
        return check.status === 413
          ? json(413, { error: "That photo's a bit big for Otto. Try a smaller, clearer shot." })
          : json(400, { error: "Invalid body" });
      }
      const data = await askClaude(MODEL_VISION, systemBlocks(SYSTEM), SCHEMA, [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: check.mimeType, data: check.image } },
          { type: "text", text: VISION_INSTRUCTION },
        ],
      }]);
      if (!data) return json(502, { error: "Otto's idea burner wouldn't light. Try again in a moment." });
      if (data.is_possible !== true) {
        return json(422, {
          error: String(data.decline_reason || "Otto couldn't read that photo. Try a clearer shot.").slice(0, 300),
        });
      }
      const recipe = shapeGeneratedRecipe(data);
      if (!recipe) return json(502, { error: "Otto couldn't read that photo. Try a clearer shot." });
      return json(200, { ...recipe, image: null, source: "otto", sourceUrl: null, sourceName: null });
    }

    // -------- one-shot mode --------
    const parsed = generateBody.safeParse(raw);
    if (!parsed.success) return json(400, { error: "Invalid body" });
    const context = contextLines(parsed.data);
    const data = await askClaude(MODEL_TEXT, systemBlocks(SYSTEM), SCHEMA, [
      {
        role: "user",
        content: `${context.length ? `${context.join("\n")}\n\n` : ""}Recipe request:\n${parsed.data.prompt}`,
      },
    ], "medium");
    if (!data) return json(502, { error: "Otto's idea burner wouldn't light. Try again in a moment." });
    if (data.is_possible !== true) {
      return json(422, {
        error: String(data.decline_reason || "Otto couldn't make a real recipe out of that.").slice(0, 300),
      });
    }
    const recipe = shapeGeneratedRecipe(data);
    if (!recipe) return json(502, { error: "Otto's idea burner wouldn't light. Try again in a moment." });
    return json(200, { ...recipe, image: null, source: "otto", sourceUrl: null, sourceName: null });
  } catch (error) {
    console.error("recipe generation failed", (error as Error).message);
    return json(502, { error: "Otto couldn't finish that idea right now. Try again in a moment." });
  }
});
