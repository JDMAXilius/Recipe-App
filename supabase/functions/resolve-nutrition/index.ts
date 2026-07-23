// resolve-nutrition — live-USDA tail for ingredients the client's deterministic
// lookup misses. The client already matches against the bundled 962-row table
// (exact + qualifier-strip in engine/lookup.ts); the freeform names it CAN'T
// resolve are POSTed here, where a live USDA FoodData Central search supplies
// real candidates and Claude picks the fdcId that matches the ingredient a home
// cook means. Claude only ever SELECTS a real USDA record — it never invents a
// calorie. Honesty guard: an fdcId counts only if USDA actually returned it in
// that ingredient's candidate list; anything else → null. Resolved rows are
// cached durably in resolved_ingredients (service-role write; clients read-only
// by policy). Keys come ONLY from Deno.env; never logged.
//
// ponytail: dropped the old Stage-1 "Claude vs the bundled table" match — it
// required shipping the 962-row table into the function, and the client already
// does the table match. If British-synonym coverage (aubergine→eggplant) ever
// matters beyond what USDA search + the client's qualifier-strip catch, re-add
// Stage 1 as a DB-backed canonical-name lookup, not a bundled JSON.
import { z } from "npm:zod@4";
import { getUserId, json, preflight, rateLimited, serviceClient } from "../_shared/http.ts";

const MODEL = "claude-haiku-4-5"; // a pick-the-match job, not generation
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_BATCH = 40;
const MAX_NAME_CHARS = 120;

const bodySchema = z.object({
  names: z.array(z.string().trim().min(1).max(MAX_NAME_CHARS)).min(1).max(MAX_BATCH),
});

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

const SEARCH_SYSTEM = `You are given cooking ingredients and, for each, a numbered list of USDA food records (with their fdcId). Pick the fdcId of the record that best matches the ingredient as a home cook would mean it, or null if none is a genuine match.

Rules — non-negotiable:
- Prefer the plain, raw, whole-food form unless the ingredient clearly says otherwise ("smoked", "roasted", "canned").
- Match the FOOD, not just words. If none of the candidates is really the same food, return null — a wrong pick is worse than none.
- Return only an fdcId that appears in that ingredient's candidate list, or null. Never invent an id.`;

const norm = (s: unknown) => String(s || "").trim().toLowerCase();
const resolverActive = () => Boolean(Deno.env.get("ANTHROPIC_API_KEY"));
const usdaSearchActive = () => Boolean(Deno.env.get("USDA_API_KEY"));

// ---- Claude call -----------------------------------------------------------
// deno-lint-ignore no-explicit-any
async function askClaude(system: unknown, schema: unknown, user: string): Promise<any> {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system,
      output_config: { format: { type: "json_schema", schema } },
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Anthropic answered ${response.status}`);
  const data = await response.json();
  if (data.stop_reason === "max_tokens" || data.stop_reason === "refusal") return null;
  // deno-lint-ignore no-explicit-any
  const textBlock = (data.content || []).find((b: any) => b.type === "text");
  return JSON.parse(textBlock?.text ?? "");
}

// ---- USDA search tail (port of usdaSearch.js) -------------------------------
const DATA_TYPES = ["Foundation", "SR Legacy"]; // whole-food, per-100g records
const PAGE_SIZE = 6;
const SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const NUTRIENT_BY_NUMBER: Record<string, string> = {
  "203": "protein_g",
  "204": "fat_g",
  "205": "carbs_g",
  "291": "fiber_g",
  "269": "sugar_g",
  "307": "sodium_mg",
};

// deno-lint-ignore no-explicit-any
function extractPer100g(foodNutrients: any[]): Record<string, number | null> {
  const out: Record<string, number | null> = {
    kcal: null, protein_g: null, fat_g: null, carbs_g: null,
    fiber_g: null, sugar_g: null, sodium_mg: null,
  };
  // Energy is reported under DIFFERENT nutrient numbers by dataset: SR Legacy
  // uses 208 (Energy, kcal); modern Foundation foods OMIT 208 and report only
  // Atwater 957 (General) / 958 (Specific), both kcal. Only mapping 208 dropped
  // every Foundation food (kcal null → candidate filtered → resolve returned
  // null for common ingredients like boneless chicken thighs). Prefer 208, then
  // Atwater General, then Specific.
  let e208: number | null = null, e957: number | null = null, e958: number | null = null;
  for (const n of foodNutrients || []) {
    const number = String(n?.nutrientNumber ?? n?.nutrient?.number ?? "");
    const value = n?.value ?? n?.amount;
    if (!Number.isFinite(value)) continue;
    const field = NUTRIENT_BY_NUMBER[number];
    if (field) out[field] = value;
    else if (number === "208") e208 = value;
    else if (number === "957") e957 = value;
    else if (number === "958") e958 = value;
  }
  out.kcal = e208 ?? e957 ?? e958;
  return out;
}

type Candidate = { fdcId: number; description: string; per100g: Record<string, number | null> };

async function searchUsdaFoods(query: string): Promise<Candidate[]> {
  const q = String(query || "").trim();
  if (!q || !usdaSearchActive()) return [];
  try {
    const url = `${SEARCH_URL}?api_key=${encodeURIComponent(Deno.env.get("USDA_API_KEY")!)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: q, dataType: DATA_TYPES, pageSize: PAGE_SIZE }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`USDA search answered ${res.status}`);
    const data = await res.json();
    return (data.foods || [])
      // deno-lint-ignore no-explicit-any
      .map((f: any) => ({ fdcId: f.fdcId, description: f.description, per100g: extractPer100g(f.foodNutrients) }))
      .filter((c: Candidate) => c.fdcId && Number.isFinite(c.per100g.kcal));
  } catch (error) {
    console.warn("USDA search failed", (error as Error).message);
    return [];
  }
}

function candidateToFoodRow(candidate: Candidate | undefined) {
  if (!candidate || !Number.isFinite(candidate.per100g?.kcal)) return null;
  return { fdcId: candidate.fdcId, usda: candidate.description, ...candidate.per100g };
}

type FoodRow = Record<string, unknown>;

async function resolveViaUsdaSearch(names: string[], into: Map<string, FoodRow>) {
  const searched = await Promise.all(
    names.map(async (n) => ({ name: n, candidates: await searchUsdaFoods(n) })),
  );
  const withCandidates = searched.filter((s) => s.candidates.length);
  if (!withCandidates.length) return;

  const block = withCandidates
    .map((s) =>
      `Ingredient: ${s.name}\n` +
      s.candidates.map((c) => `  fdcId ${c.fdcId}: ${c.description}`).join("\n")
    )
    .join("\n\n");
  const data = await askClaude(
    SEARCH_SYSTEM,
    SEARCH_SCHEMA,
    `Pick the best USDA record for each ingredient:\n\n${block}`,
  );
  if (!data) return;
  // deno-lint-ignore no-explicit-any
  const pickByInput = new Map((data.picks || []).map((p: any) => [norm(p.input), p.fdcId]));
  for (const { name, candidates } of withCandidates) {
    const fdcId = pickByInput.get(name);
    // HONESTY GUARD: the pick must be one of the candidates USDA returned.
    const chosen = candidates.find((c) => c.fdcId === fdcId);
    const row = candidateToFoodRow(chosen);
    if (row) into.set(name, row);
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  // AI path — per-user budget (v1 costlyLimiter tier).
  if (rateLimited(`resolve:${userId}`, 20, 15 * 60 * 1000)) {
    return json(429, { error: "Too many requests — give it a few minutes and try again" });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json(400, { error: "Invalid names" });

  const wanted = [...new Set(parsed.data.names.map(norm).filter(Boolean))];
  const out = new Map<string, FoodRow | null>();
  const db = serviceClient();

  // L2 durable cache first — a name is paid for once, ever.
  let ask = wanted;
  try {
    const { data: rows, error } = await db
      .from("resolved_ingredients")
      .select("name, food")
      .in("name", wanted);
    if (error) throw error;
    for (const row of rows ?? []) out.set(row.name, row.food ?? null);
    ask = wanted.filter((n) => !out.has(n));
  } catch {
    // fail open — memory-only for this request
  }

  if (ask.length && resolverActive() && usdaSearchActive()) {
    const resolved = new Map<string, FoodRow>();
    try {
      await resolveViaUsdaSearch(ask, resolved);
    } catch (error) {
      console.warn("ingredient resolution failed", (error as Error).message); // fail closed
    }

    const durable: { name: string; food: FoodRow | null; tier: string }[] = [];
    for (const n of ask) {
      const row = resolved.get(n) ?? null;
      out.set(n, row);
      // The full pipeline ran (both keys present), so cache the miss too — it
      // won't silently retry forever, and a real hit is cached always.
      durable.push({ name: n, food: row, tier: row ? "usda-search" : "miss" });
    }
    if (durable.length) {
      const { error } = await db
        .from("resolved_ingredients")
        .upsert(durable, { onConflict: "name" });
      if (error) console.warn("resolver cache write failed", error.message); // fail open
    }
  } else {
    for (const n of ask) out.set(n, null); // dormant → honest miss (uncached)
  }

  return json(200, { resolved: Object.fromEntries(out) });
});
