// Raw-vs-cooked resolution (roadmap N1) — the blunt guard's long-promised real
// fix. "3 cups rice" doesn't say whether the rice is raw or cooked (the two
// differ ~3× in kcal), and nothing in the LINE can resolve it — only the
// recipe's own method can: "add the cooked rice" vs "add rice and stock,
// simmer 18 minutes". That is an LLM-shaped reading task, so Claude reads the
// steps and answers raw/cooked/unknown per ingredient — and USDA still
// supplies every number (the answer only selects WHICH USDA record applies).
//
// Honesty rules:
// - "cooked" or "raw" only when the steps actually say; anything else is
//   "unknown", and an unknown ambiguous line keeps today's behavior (the
//   whole recipe honestly refuses → category estimate). Never guessed.
// - DORMANT without ANTHROPIC_API_KEY: every name returns "unknown", so the
//   blunt guard behaves exactly as it always has.
// - Answers are clamped to the enum; anything malformed becomes "unknown".
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";

export const cookedResolverActive = () => Boolean(ENV.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }));

// Reading a method and labeling ingredients is a classify job — Haiku tier,
// same as the other matchers. One stable schema (API caches it 24h).
const MODEL = "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["decisions"],
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "state"],
        properties: {
          name: { type: "string" },
          state: { type: "string", enum: ["raw", "cooked", "unknown"] },
        },
      },
    },
  },
};

const SYSTEM = `You read a recipe's method and decide, for each listed ingredient, whether it enters the pot ALREADY COOKED or RAW (i.e. the recipe itself cooks it).

Rules — non-negotiable:
- "cooked": the steps clearly show the ingredient arrives pre-cooked — "add the cooked rice", "stir in the drained canned beans", "fold in leftover pasta".
- "raw": the recipe clearly cooks it from raw — "add the rice and stock, cover and simmer 18 minutes", "boil the pasta", "cook the lentils until tender".
- "unknown": the steps do not say, or never mention the ingredient. When in doubt, "unknown" — a guess here can be 3× wrong on calories.
- Canned/tinned legumes are "cooked" by nature when the steps just add them; dry legumes the recipe boils are "raw".
- Answer for every listed name, exactly as given.`;

const norm = (s) => String(s || "").trim().toLowerCase();
const MAX_STEP_CHARS = 6000;

// Pure + testable: model output → Map<normalizedName, state>, enum-clamped,
// every asked name guaranteed present (missing → "unknown").
export function shapeCookedDecisions(data, askedNames) {
  const byName = new Map(
    (data?.decisions || [])
      .filter((d) => d && ["raw", "cooked", "unknown"].includes(d.state))
      .map((d) => [norm(d.name), d.state])
  );
  const out = new Map();
  for (const n of askedNames) out.set(norm(n), byName.get(norm(n)) || "unknown");
  return out;
}

// { steps, names } → Map<normalizedName, "raw"|"cooked"|"unknown">.
// Dormant or on any failure: all "unknown" (fail closed — the blunt guard
// then behaves exactly as before this module existed).
export async function classifyCookedState({ steps, names }) {
  const asked = [...new Set((names || []).map(norm).filter(Boolean))];
  const allUnknown = () => new Map(asked.map((n) => [n, "unknown"]));
  const method = (steps || []).filter(Boolean).join("\n").slice(0, MAX_STEP_CHARS).trim();
  if (!asked.length || !method || !cookedResolverActive()) return allUnknown();

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Method:\n${method}\n\nIngredients to classify:\n${asked.join("\n")}`,
        },
      ],
    });
    logger.info(
      { model: MODEL, count: asked.length, usage: response.usage },
      "cooked-state classification ran"
    );
    if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") {
      return allUnknown();
    }
    const textBlock = response.content.find((b) => b.type === "text");
    return shapeCookedDecisions(JSON.parse(textBlock?.text ?? ""), asked);
  } catch (error) {
    logger.warn({ err: error.message }, "cooked-state classification failed");
    return allUnknown();
  }
}
