// Claude-as-matcher for nutrition (founder direction 2026-07-21: "use USDA /
// Claude rather than hand-editing values"). The honest split: Claude only ever
// SELECTS which real USDA food a freeform ingredient refers to — it never
// invents a calorie. Every number still comes from the vetted USDA table; this
// module just resolves "beef mince" → "minced beef", "aubergine" → "eggplant",
// "grated cheddar" → "cheddar cheese" without us hand-listing every alias.
//
// It runs ONLY on the tail the deterministic lookup misses, batched once per
// recipe, and every resolution is cached forever — so cost is one cheap call
// per novel ingredient, ever. DORMANT without ANTHROPIC_API_KEY (same C21 gate
// as the other AI seams): no key → returns all-null, and computeNutrition
// behaves exactly as it does today.
//
// Honesty guard: a returned name is trusted ONLY if it is an exact key in the
// table. A hallucinated or approximate name resolves to null (→ the line drops
// and the coverage guard decides), never to a fabricated food.
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";
import tableJson from "./usdaTable.json" with { type: "json" };

const table = tableJson;
const TABLE_KEYS = Object.keys(table).sort(); // sorted = stable prompt prefix (cacheable)
const KEY_SET = new Set(TABLE_KEYS);

export const resolverActive = () => Boolean(ENV.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }));

// Matching a freeform name to one of a fixed candidate list is a cheap
// classify job, not generation — Haiku, the same tier the caption extractor
// uses. One stable schema so the API caches it 24h.
const MODEL = "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches"],
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["input", "canonical"],
        properties: {
          input: { type: "string" },
          canonical: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
      },
    },
  },
};

const SYSTEM = `You match freeform cooking-ingredient names to a fixed list of canonical USDA food names.

For each input, return the ONE canonical name from the allowed list that refers to the SAME food, or null if none does.

Rules — non-negotiable:
- Match the FOOD IDENTITY, not just the words. "beef mince" = "minced beef"; "grated cheddar" = "cheddar cheese"; "aubergine" = "eggplant"; "courgette" = "zucchini"; "spring onion" = "scallions"; "coriander" (the leaf) ≠ "coriander seeds".
- NEVER map to a different food. "green beans" is not "beans"; "sweet potato" is not "potato"; "coconut milk" is not "milk". When the list has no genuine match, return null — a wrong match is worse than none.
- Ignore preparation words that don't change identity (chopped, diced, fresh, large). Respect words that DO (smoked, dried, canned) only when a matching canonical form exists; otherwise null.
- Return canonical values EXACTLY as they appear in the allowed list, or null. Do not invent names.`;

const MAX_BATCH = 40; // a recipe rarely has more unmatched lines than this
const MAX_NAME_CHARS = 120;

const norm = (s) => String(s || "").trim().toLowerCase();

// Permanent per-process cache: freeform name → canonical key | null. Null is
// cached too, so a known miss is never re-asked. (Recipe-level nutrition is
// already cached on the row, so in practice each ingredient resolves once.)
const cache = new Map();

// names[] (freeform) → Map<normalizedName, canonicalKey|null>. Dormant-safe:
// with no key it resolves nothing (all misses stay null) and never calls out.
export async function resolveIngredientNames(names) {
  const wanted = [...new Set((names || []).map(norm).filter(Boolean))];
  const out = new Map();
  const ask = [];
  for (const n of wanted) {
    if (cache.has(n)) out.set(n, cache.get(n));
    else ask.push(n);
  }
  if (!ask.length || !resolverActive()) {
    for (const n of ask) out.set(n, null); // dormant → honest miss (not cached; a key landing later resolves it)
    return out;
  }

  try {
    const batch = ask.slice(0, MAX_BATCH).map((n) => n.slice(0, MAX_NAME_CHARS));
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: [
        { type: "text", text: SYSTEM },
        // The candidate list is large but stable — cache it so only the varying
        // batch of names is billed at full rate on repeat calls.
        {
          type: "text",
          text: `Allowed canonical names (choose only from these):\n${TABLE_KEYS.join("\n")}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Match these ingredients:\n${batch.join("\n")}` }],
    });
    logger.info({ model: MODEL, count: batch.length, usage: response.usage }, "ingredient resolution ran");
    if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") {
      for (const n of ask) out.set(n, null);
      return out;
    }
    const textBlock = response.content.find((b) => b.type === "text");
    const data = JSON.parse(textBlock?.text ?? "");
    const byInput = new Map((data.matches || []).map((m) => [norm(m.input), m.canonical]));
    for (const n of ask) {
      const picked = byInput.get(n);
      // HONESTY GUARD: trust the pick only if it's a real table key.
      const resolved = picked && KEY_SET.has(norm(picked)) ? norm(picked) : null;
      cache.set(n, resolved);
      out.set(n, resolved);
    }
  } catch (error) {
    logger.warn({ err: error.message }, "ingredient resolution failed");
    for (const n of ask) if (!out.has(n)) out.set(n, null); // fail closed → honest miss
  }
  return out;
}

// Test seam: look up a resolved key's food row (or null).
export const foodForKey = (canonicalKey) => table[norm(canonicalKey)] || null;
