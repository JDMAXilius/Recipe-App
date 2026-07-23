// ONE-TIME migration endpoint: the lead DELETES it after the 792-recipe batch,
// so the anon-key exposure window is bounded.
// canonicalize — Phase 2 of OWN_RECIPE_DB: one original TheMealDB recipe in,
// one canonical "silver" record out (usdaTable keys, metric grams, verified
// servings, cooked/frying flags). The driver (docs/tickets/OWN_RECIPE_DB.md)
// calls this per recipe with the 969-key usdaTable allowlist; it fills media/
// provenance from bronze itself. This function ONLY transforms text — no DB writes.
//
// Model call mirrors generate-recipe/index.ts exactly: ANTHROPIC_API_KEY read
// ONLY from Deno.env (never logged, never echoed), same Anthropic endpoint /
// headers / json_schema output_config, same CORS + error shape. DORMANT without
// ANTHROPIC_API_KEY (503). Auth posture mirrors content/index.ts: the batch
// driver calls with the anon key (NOT a user token), so the platform's
// verify_jwt + anon key is the boundary — no getUserId gate.
import { z } from "npm:zod@4";
import { json, preflight, rateLimited } from "../_shared/http.ts";

// claude-sonnet-5: batch of 792 recipes — this is a pick-the-match + rewrite job
// (like resolve-nutrition's haiku pick), not open generation, so sonnet's quality
// at ~1/5 opus cost is the right tradeoff. generate-recipe uses opus-4-8 for
// creative generation; resolve-nutrition uses haiku-4-5 for pure matching — this
// sits between. ponytail: model slug is a calibration knob — repo siblings are
// `claude-opus-4-8` / `claude-haiku-4-5`, so the lead should confirm the exact
// current sonnet slug at deploy if the API rejects this one.
const MODEL = "claude-sonnet-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// ---- input contract -------------------------------------------------------
const body = z.object({
  recipe: z.object({
    id: z.coerce.string().min(1).max(64),
    title: z.string().trim().min(1).max(300),
    category: z.string().trim().max(100).nullish(),
    area: z.string().trim().max(100).nullish(),
    instructions: z.string().min(1).max(20000),
    ingredient_lines: z.array(z.string().trim().min(1).max(300)).min(1).max(120),
  }),
  keys: z.array(z.string().trim().min(1).max(120)).min(1).max(2000),
});
type Body = z.infer<typeof body>;

// ---- output schema (json_schema-constrained, like generate-recipe) --------
// id/title/category come from the trusted input — the model never mutates
// identity fields. It produces judgment: servings, area, instructions, ingredients.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["servings", "area", "instructions", "ingredients"],
  properties: {
    servings: { type: "integer" },
    area: { anyOf: [{ type: "string" }, { type: "null" }] },
    instructions: { type: "array", items: { type: "string" } },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "grams", "cooked", "frying_medium", "note"],
        properties: {
          key: { anyOf: [{ type: "string" }, { type: "null" }] },
          grams: { type: "number" },
          cooked: { type: "boolean" },
          frying_medium: { type: "boolean" },
          note: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
      },
    },
  },
};

// DOCTRINE — embedded verbatim from .claude/agents/canonicalizer.md (the whole
// point of this function is these judgment rules). The OUTPUT CONTRACT below
// specializes the shape for this edge function (no missing_ingredients/doubts
// arrays — those fold into per-ingredient `note`).
const DOCTRINE = `# DOCTRINE
- Output shape (zod-validated by the orchestrator, field names exactly as
  the silver record in OWN_RECIPE_DB.md): verified \`servings\`; per
  ingredient line \`{ original, key, grams, cooked?, frying_medium?,
  note? }\`; \`instructions\` rewritten in Otto's voice;
  \`missing_ingredients[]\`; \`doubts[]\` (run-level — reported, not stored
  per-recipe).
- \`key\` MUST be one that already exists in
  \`src/features/nutrition/engine/data/usdaTable.json\` — the packet hands
  you the key list. No key fits → \`key: null\` AND the name goes to
  \`missing_ingredients\`, NEVER an invented key. A flagged miss beats a guess.
- Amounts become metric grams, derived from the original text and the
  instructions. An amount you inferred rather than read gets a \`note\` and
  a doubt entry — the uncertainty must survive into the record.
- \`servings\` — HONESTY GATE (the field most often wrong; treat like \`key\`):
  * If the recipe TEXT states a yield ("cut into four for 48", "Serves 8-10",
    "makes 10 slices"), use it and QUOTE that phrase in a \`note\`/doubt. Take
    the low end of a range for the calorie-safe per-serving.
  * If NO yield is stated anywhere, you are INFERRING — say so in the note,
    give the basis, AND sanity-check against total food mass and piece count:
    a plausible main serving is ~300-700 g of food; baked-good pieces are
    ~30-120 g each. If your servings would imply an absurd portion (e.g. a
    158 g "mini" bun, or a 4-person dish holding 1.8 kg of meat), it is WRONG —
    revise it and flag the doubt. Never present an inferred servings with the
    same confidence as a text-stated one; never a silent flat default.
- **CHOOSE-ONE alternatives** (a real over-count class): when the ingredient
  list repeats a base block or lists variants and the instructions say
  "or" / "your chosen X" / "either", the cook uses ONE, not all. Canonicalize
  a SINGLE variant (grams for one), set the others to \`grams: 0\` with a note
  ("alternative to <X>; not summed"), and flag a doubt. NEVER sum alternatives —
  three "220 g butter" filling variants are ~one 220 g filling, not 660 g.
- \`frying_medium: true\` ONLY when the fat is a searing/frying MEDIUM that does
  NOT end up in the served dish — it stays as pan residue or is poured/drained
  off (e.g. searing meat in batches in a separate pan, deep/shallow frying).
  \`frying_medium: false\` (eaten, count whole) when the fat REMAINS in the pot
  and is served: any braise/stew/curry/soup where you sizzle aromatics in the
  same vessel that becomes the sauce, plus dressings, aglio e olio, baking.
  Decide by ONE test: "is this oil in the food on the plate?" Yes → false.
  Apply it identically to structurally-similar dishes; when the instructions
  genuinely don't settle it, \`false\` + a doubt (under-count-safe).
- Do NOT encode ontology distinctions that don't exist: if two candidate keys
  map to the same food (e.g. \`thyme\` and \`fresh thyme\`), pick one consistently;
  don't split by a dried/fresh nuance the table doesn't carry.
- \`cooked: true\` only when the line is added already-cooked per the
  instructions ("add the cooked rice") — the raw-vs-cooked 3x error class.
- Media and provenance fields (image, youtube, source URL) pass through
  UNTOUCHED — founder call 2026-07-23: existing media is kept, never
  replaced or regenerated. Instructions prose is the ONLY text you rewrite.
- You are read-only by design: you return data, you never land it. Every
  batch is refuted by the critic (V2) before a builder writes anything.`;

const OUTPUT_CONTRACT = `# OUTPUT CONTRACT (this run)
Return ONE JSON object matching the provided schema exactly:
- servings: integer — the HONESTY GATE result above.
- area: the cuisine as a clean string, or null if none applies.
- instructions: array of strings — the method rewritten in Otto's voice, one
  action per step, no numbering.
- ingredients: array with EXACTLY one entry per ingredient line given below,
  IN THE SAME ORDER. Each entry: { key, grams, cooked, frying_medium, note }.
  * key: chosen ONLY from the ALLOWED KEYS list in the user message, or null.
    NEVER invent a key. No key fits → null.
  * grams: metric grams (number).
  * cooked, frying_medium: booleans per the doctrine tests above.
  * note: a short string carrying any doubt, inference basis, quoted yield
    phrase, "alternative to X; not summed", or a missing-ingredient flag
    (this run has no separate missing_ingredients/doubts arrays — fold them
    ALL into note). null when there is genuinely nothing to flag.
Do NOT include id, title, category, or any media/provenance — the driver
supplies those. Output the JSON object only.`;

const SYSTEM = `You are Otto's recipe canonicalizer. ONE original recipe in, ONE canonical structured record out. You are the correction-at-the-source step: after you, no guard or overlay should need to reinterpret this recipe.\n\n${DOCTRINE}\n\n${OUTPUT_CONTRACT}`;

// ---- Anthropic call — mirrors generate-recipe's askClaude exactly ---------
// deno-lint-ignore no-explicit-any
async function askClaude(userMessage: string): Promise<any> {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: userMessage }],
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
    return null; // driver retries — null beats a guess
  }
}

function buildUserMessage(recipe: Body["recipe"], keys: string[]): string {
  const lines = recipe.ingredient_lines
    .map((line, i) => `${i + 1}. ${line}`)
    .join("\n");
  return [
    "ALLOWED KEYS (pick each ingredient's key ONLY from this list, else null):",
    JSON.stringify(keys),
    "",
    "RECIPE TO CANONICALIZE:",
    `Title: ${recipe.title}`,
    `Category: ${recipe.category ?? "(none)"}`,
    `Area: ${recipe.area ?? "(none)"}`,
    "",
    "Instructions (verbatim original — rewrite in Otto's voice for output):",
    recipe.instructions,
    "",
    `Ingredient lines (${recipe.ingredient_lines.length} — return exactly this many ingredients, in order):`,
    lines,
  ].join("\n");
}

// deno-lint-ignore no-explicit-any
function shapeRecord(recipe: Body["recipe"], keys: Set<string>, data: any) {
  if (!data) return null;
  if (!Number.isInteger(data.servings) || data.servings < 1) return null;

  const instructions = (data.instructions || [])
    .filter((s: unknown) => typeof s === "string" && (s as string).trim())
    .map((s: string) => s.trim().slice(0, 2000));
  if (instructions.length === 0) return null;

  const out = data.ingredients;
  // one-entry-per-line, in order — a mismatch is a bad response; let the driver retry.
  if (!Array.isArray(out) || out.length !== recipe.ingredient_lines.length) return null;

  const ingredients = recipe.ingredient_lines.map((original, i) => {
    const ing = out[i] ?? {};
    // defensive allowlist enforcement: never let an invented key through.
    const key = typeof ing.key === "string" && keys.has(ing.key) ? ing.key : null;
    const grams = typeof ing.grams === "number" && Number.isFinite(ing.grams) && ing.grams >= 0
      ? ing.grams
      : 0;
    return {
      original, // verbatim input line, per contract
      key,
      grams,
      cooked: ing.cooked === true,
      frying_medium: ing.frying_medium === true,
      note: typeof ing.note === "string" && ing.note.trim() ? ing.note.trim().slice(0, 500) : null,
    };
  });

  return {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category ?? null,
    area: data.area ? String(data.area).slice(0, 100) : null,
    servings: Math.min(data.servings, 100),
    instructions,
    ingredients,
  };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });

  // No getUserId gate: the batch driver calls with the anon key, like content —
  // platform verify_jwt + anon key is the auth boundary. Runaway circuit-breaker
  // only, keyed on a constant since there's no per-user id. ponytail: high ceiling
  // so the sequential 792-recipe batch isn't throttled; tighten if this endpoint
  // ever outlives the one-time migration.
  if (rateLimited("canon", 1000, 60 * 60 * 1000)) {
    return json(429, { error: "Rate limit — too many canonicalize calls this hour" });
  }
  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json(503, { error: "Canonicalizer is not wired up yet (no model key)" });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = body.safeParse(raw);
  if (!parsed.success) return json(400, { error: "Invalid body" });

  try {
    const { recipe, keys } = parsed.data;
    const data = await askClaude(buildUserMessage(recipe, keys));
    const record = shapeRecord(recipe, new Set(keys), data);
    if (!record) {
      // non-JSON / wrong shape / bad servings — the driver retries.
      return json(502, { error: "Canonicalization failed", detail: "model returned no usable record" });
    }
    return json(200, { record });
  } catch (error) {
    // message is our own string ("Anthropic answered 4xx") — never the key or body.
    console.error("canonicalize failed", (error as Error).message);
    return json(502, { error: "Canonicalization failed", detail: "upstream model call failed" });
  }
});
