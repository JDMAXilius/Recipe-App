// Claude-as-matcher for nutrition (founder direction 2026-07-21: "use USDA /
// Claude rather than hand-editing values"). The honest split: Claude only ever
// SELECTS which real USDA food a freeform ingredient refers to — it never
// invents a calorie. Every number comes from USDA; this module resolves
// "beef mince" → "minced beef", "aubergine" → "eggplant" without us
// hand-listing every alias.
//
// Two tiers, cheapest first, each caught early when possible:
//   Stage 1 — Claude picks from the 920-row bundled table (fast, offline, free
//             numbers). Handles the common regional/word-order gaps.
//   Stage 2 — for what Stage 1 still misses, the LIVE USDA FoodData Central
//             search (Increment 2) supplies real candidates from the full
//             ~600k-food database and Claude picks among them. Numbers come
//             from USDA's own response.
//
// Runs ONLY on the tail the deterministic lookup misses, batched per recipe,
// every resolution cached forever. DORMANT without ANTHROPIC_API_KEY (whole
// thing is a no-op); Stage 2 additionally needs USDA_API_KEY.
//
// Honesty guard: a Stage-1 name is trusted only if it is an exact table key; a
// Stage-2 fdcId only if it is one of the candidates USDA actually returned.
// Anything else resolves to null — never a fabricated food.
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";
import tableJson from "./usdaTable.json" with { type: "json" };
import { usdaSearchActive, searchUsdaFoods, candidateToFoodRow } from "./usdaSearch.js";

const table = tableJson;
const TABLE_KEYS = Object.keys(table).sort(); // sorted = stable prompt prefix (cacheable)
const KEY_SET = new Set(TABLE_KEYS);

export const resolverActive = () => Boolean(ENV.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }));

// Matching a name to a candidate list is a cheap classify job, not generation —
// Haiku, the tier the caption extractor uses. Stable schemas cache 24h.
const MODEL = "claude-haiku-4-5";

const TABLE_SCHEMA = {
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

const SEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["picks"],
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["input", "fdcId"],
        properties: {
          input: { type: "string" },
          fdcId: { anyOf: [{ type: "integer" }, { type: "null" }] },
        },
      },
    },
  },
};

const TABLE_SYSTEM = `You match freeform cooking-ingredient names to a fixed list of canonical USDA food names.

For each input, return the ONE canonical name from the allowed list that refers to the SAME food, or null if none does.

Rules — non-negotiable:
- Match the FOOD IDENTITY, not just the words. "beef mince" = "minced beef"; "grated cheddar" = "cheddar cheese"; "aubergine" = "eggplant"; "courgette" = "zucchini"; "spring onion" = "scallions"; "coriander" (the leaf) ≠ "coriander seeds".
- NEVER map to a different food. "green beans" is not "beans"; "sweet potato" is not "potato"; "coconut milk" is not "milk". When the list has no genuine match, return null — a wrong match is worse than none.
- Ignore preparation words that don't change identity (chopped, diced, fresh, large). Respect words that DO (smoked, dried, canned) only when a matching canonical form exists; otherwise null.
- Return canonical values EXACTLY as they appear in the allowed list, or null. Do not invent names.`;

const SEARCH_SYSTEM = `You are given cooking ingredients and, for each, a numbered list of USDA food records (with their fdcId). Pick the fdcId of the record that best matches the ingredient as a home cook would mean it, or null if none is a genuine match.

Rules — non-negotiable:
- Prefer the plain, raw, whole-food form unless the ingredient clearly says otherwise ("smoked", "roasted", "canned").
- Match the FOOD, not just words. If none of the candidates is really the same food, return null — a wrong pick is worse than none.
- Return only an fdcId that appears in that ingredient's candidate list, or null. Never invent an id.`;

const MAX_BATCH = 40;
const MAX_NAME_CHARS = 120;

const norm = (s) => String(s || "").trim().toLowerCase();

// Permanent per-process cache: freeform name → food row | null. A row's numbers
// are USDA's; null means "no honest match". (Recipe nutrition is cached on the
// row too, so each ingredient resolves once in practice.)
const cache = new Map();

async function askClaude({ system, schema, user, maxTokens = 2000 }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") return null;
  const textBlock = response.content.find((b) => b.type === "text");
  return JSON.parse(textBlock?.text ?? "");
}

// Stage 1: Claude picks a bundled-table key for each name (or null).
async function resolveViaTable(names, into) {
  const batch = names.slice(0, MAX_BATCH).map((n) => n.slice(0, MAX_NAME_CHARS));
  const data = await askClaude({
    system: [
      { type: "text", text: TABLE_SYSTEM },
      {
        type: "text",
        text: `Allowed canonical names (choose only from these):\n${TABLE_KEYS.join("\n")}`,
        cache_control: { type: "ephemeral" }, // large but stable → cache the prefix
      },
    ],
    schema: TABLE_SCHEMA,
    user: `Match these ingredients:\n${batch.join("\n")}`,
  });
  if (!data) return;
  const byInput = new Map((data.matches || []).map((m) => [norm(m.input), m.canonical]));
  for (const n of names) {
    const picked = byInput.get(n);
    const canonicalKey = picked && KEY_SET.has(norm(picked)) ? norm(picked) : null;
    if (canonicalKey) into.set(n, table[canonicalKey]);
  }
}

// Stage 2: live USDA search → Claude picks among the real candidates.
async function resolveViaUsdaSearch(names, into) {
  const searched = await Promise.all(
    names.map(async (n) => ({ name: n, candidates: await searchUsdaFoods(n) }))
  );
  const withCandidates = searched.filter((s) => s.candidates.length);
  if (!withCandidates.length) return;

  const block = withCandidates
    .map(
      (s) =>
        `Ingredient: ${s.name}\n` +
        s.candidates.map((c) => `  fdcId ${c.fdcId}: ${c.description}`).join("\n")
    )
    .join("\n\n");
  const data = await askClaude({
    system: SEARCH_SYSTEM,
    schema: SEARCH_SCHEMA,
    user: `Pick the best USDA record for each ingredient:\n\n${block}`,
  });
  if (!data) return;
  const pickByInput = new Map((data.picks || []).map((p) => [norm(p.input), p.fdcId]));
  for (const { name, candidates } of withCandidates) {
    const fdcId = pickByInput.get(name);
    // HONESTY GUARD: the pick must be one of the candidates USDA returned.
    const chosen = candidates.find((c) => c.fdcId === fdcId);
    const row = chosen ? candidateToFoodRow(chosen) : null;
    if (row) into.set(name, row);
  }
}

// names[] (freeform) → Map<normalizedName, foodRow|null>. Dormant-safe: no
// Anthropic key → resolves nothing. Stage 2 additionally needs a USDA key.
export async function resolveIngredientNames(names) {
  const wanted = [...new Set((names || []).map(norm).filter(Boolean))];
  const out = new Map();
  const ask = [];
  for (const n of wanted) {
    if (cache.has(n)) out.set(n, cache.get(n));
    else ask.push(n);
  }
  if (!ask.length || !resolverActive()) {
    for (const n of ask) out.set(n, null); // dormant → honest miss (uncached; a key later resolves it)
    return out;
  }

  const resolved = new Map(); // name → row (only successes)
  try {
    await resolveViaTable(ask, resolved);
    const stillMissing = ask.filter((n) => !resolved.has(n));
    if (stillMissing.length && usdaSearchActive()) {
      await resolveViaUsdaSearch(stillMissing, resolved);
    }
    logger.info(
      { asked: ask.length, table: resolved.size, usdaSearch: usdaSearchActive() },
      "ingredient resolution ran"
    );
  } catch (error) {
    logger.warn({ err: error.message }, "ingredient resolution failed"); // fail closed
  }

  for (const n of ask) {
    const row = resolved.get(n) || null;
    out.set(n, row);
    // Cache a hit always; cache a miss only when the FULL pipeline ran (USDA
    // active), so a name asked while USDA was dormant retries once the key lands.
    if (row || usdaSearchActive()) cache.set(n, row);
  }
  return out;
}

// Test seam: look up a bundled key's food row (or null).
export const foodForKey = (canonicalKey) => table[norm(canonicalKey)] || null;
