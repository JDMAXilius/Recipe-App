// otto-recipes SILVER driver (bronze → silver). Medallion Phase 2.
//
// A Node script CANNOT spawn Claude agents, so this driver does everything
// EXCEPT the LLM call. The lead runs it, dispatches the `canonicalizer` agent
// between --emit and --land, and commits. Three real steps + two utilities:
//
//   --rank [N=10]       rank the bronze corpus worst-first → the pilot list
//   --emit <id>         write the canonicalizer INPUT payload for one recipe
//   --land <file.json>  zod-validate the canonicalizer's OUTPUT and upsert silver
//   --run-batch         Phase 2 FULL run: canonicalize all un-landed bronze via the
//                       DEPLOYED `canonicalize` edge fn + zod-land each. RESUMABLE
//                       (work set = bronze ids not yet in recipes.json), failure-
//                       isolated (a zod/network fail is logged, never aborts the run).
//                       [--limit N] [--concurrency C=4] [--only id,id,...] [--model x]
//   --rematch-nulls     deterministically recover key:null lines the ENGINE resolves
//                       (the canonicalizer missed some exact usdaTable matches). No
//                       model/API — re-runs the engine's own lookup on each null line
//                       and maps the record back to its usdaTable key. Idempotent.
//                       Needs the TS loader (dynamic-imports the engine, like --rank).
//   --self-check        prove the zod key gate + the resume filter (no agent/network)
//
// RUN (plain node is fine for --emit / --land / --self-check — pure JSON + zod):
//   node tools/canonicalize-recipes.mjs --self-check
//   node tools/canonicalize-recipes.mjs --emit 52781
//   node tools/canonicalize-recipes.mjs --land supabase/otto-recipes/canonical/_out-52781.json
//
// --rank reuses the ENGINE (parse → lookup → guards → compute), so it needs the
// same TS loader `npm test` / nutrition-breakdown.mjs use:
//   node --experimental-strip-types \
//        --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//        tools/canonicalize-recipes.mjs --rank 10
//
// The ranking logic is REPLICATED (trimmed) from tools/nutrition-breakdown.mjs
// because that file exports nothing and runs its own main on import — it cannot
// be imported cleanly. The engine building blocks it composes ARE exported, so
// the kcal/severity here is the engine's own, not a re-implementation of the sum.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute } from "node:path";
import assert from "node:assert";
import { z } from "zod";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const P = {
  bronze: join(ROOT, "supabase/otto-recipes/raw/themealdb-2026-07.json"),
  usda: join(ROOT, "src/features/nutrition/engine/data/usdaTable.json"),
  facts: join(ROOT, "src/features/nutrition/engine/data/recipeFacts.json"),
  canonicalDir: join(ROOT, "supabase/otto-recipes/canonical"),
  recipes: join(ROOT, "supabase/otto-recipes/canonical/recipes.json"),
  pilotRank: join(ROOT, "supabase/otto-recipes/canonical/_pilot-rank.json"),
  missing: join(ROOT, "supabase/otto-recipes/canonical/_missing-ingredients.json"),
  failures: join(ROOT, "supabase/otto-recipes/canonical/_run-failures.json"),
  doubts: join(ROOT, "supabase/otto-recipes/canonical/_servings-doubts.json"),
};

const CANON_URL = "https://mepzfdefanfpnrvydyty.supabase.co/functions/v1/canonicalize";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};
const nn = (s) => (s && String(s).trim() ? String(s).trim() : null); // "" / null → null

// ── bronze helpers ────────────────────────────────────────────────────────────
const loadBronze = () => readJson(P.bronze);
const mealById = (bronze, id) => bronze.meals.find((m) => String(m.idMeal) === String(id));

// The 20 numbered ingredient/measure slots → the lines the engine and the
// canonicalizer both consume. Blank slots (null / "" / whitespace) are skipped.
function bronzeLines(meal) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const name = nn(meal[`strIngredient${i}`]);
    if (!name) continue;
    const measure = nn(meal[`strMeasure${i}`]) || "";
    out.push({ measure, name });
  }
  return out;
}

// ── the SILVER schema (zod, exported) ─────────────────────────────────────────
// key MUST be an EXISTING usdaTable key or null; a non-null invented key is a
// HARD failure (the canonicalizer picks from the emitted list, never invents).
export function makeSilverSchema(usdaKeySet) {
  const keySchema = z
    .string()
    .nullable()
    .refine((k) => k === null || usdaKeySet.has(k), {
      message: "key is not an existing usdaTable key (canonicalizer must pick from the list, never invent)",
    });
  return z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    area: z.string().nullable(), // some TheMealDB recipes have no area (e.g. Flija, Mini butter buns) — pilot finding
    servings: z.number().int().positive(),
    instructions: z.array(z.string()),
    ingredients: z
      .array(
        z.object({
          original: z.string(),
          key: keySchema,
          grams: z.number().nonnegative(),
          cooked: z.boolean(),
          frying_medium: z.boolean(),
          note: z.string().nullable(),
        })
      )
      .min(1),
    media: z.object({
      image: z.string().nullable(),
      youtube: z.string().nullable(),
      source: z.string().nullable(),
    }),
    provenance: z.object({
      source: z.literal("themealdb"),
      fetched_at: z.string(),
      canonicalized_at: z.string(),
      model: z.string(),
    }),
  });
}
const usdaKeySet = () => new Set(Object.keys(readJson(P.usda)));

// ── --rank : bronze corpus, worst-first ───────────────────────────────────────
// Replicated (trimmed) from nutrition-breakdown.mjs: same engine calls, same
// guard order, same severity (refused = uncapped Σ + 100000 so the most broken
// over-counts sort to the TOP), same signal flags for the why-flagged reason.
const FAT_RE = /\b(oils?|ghee|lard|shortening|dripping|tallow|butter|margarine)\b/i;
const OIL_SUSPECT_PER_SERVING_G = 20;
const OIL_SUSPECT_TOTAL_G = 50;

async function rank(n) {
  // Engine is dynamic-imported here ONLY (the other modes never touch it), so
  // --emit / --land / --self-check run under plain node without the TS loader.
  const { parseIngredientLine } = await import("../src/features/nutrition/engine/parse.ts");
  const { lookup, key } = await import("../src/features/nutrition/engine/lookup.ts");
  const { applyFryingMedium, applyBatchCondiment, applyTypicalAmounts, isNegligible } =
    await import("../src/features/nutrition/engine/guards.ts");
  const { computeNutrition } = await import("../src/features/nutrition/engine/compute.ts");
  const bronze = loadBronze();

  // adapt each meal → the T6 corpus shape
  const corpus = bronze.meals.map((m) => ({
    name: m.strMeal,
    recipeId: String(m.idMeal),
    servings: 4, // ranking pass is RAW (lead call): flat default, NOT recipeFacts servings
    ingredients: bronzeLines(m),
  }));

  // RAW ranking (lead decision): recipeId is NOT passed to the engine and
  // recipeFacts is not consulted, so the frying/cooked/servings overlay — the very
  // thing Phase 2 retires — does not hide the over-counts canonicalization must fix.
  // This surfaces the true raw workload (Irish Stew 52781 and worse savory disasters
  // rise instead of reading a tamed ~1048 kcal at rank 37).
  void key;
  const scored = corpus.map((recipe) => {
    const perServing = Math.max(1, Number(recipe.servings) || 1);
    const list = recipe.ingredients.filter((p) => p && (p.name || p.measure));
    const rows = list.map((p) => {
      const line = [p.measure, p.name].filter(Boolean).join(" ").trim();
      const parsed = parseIngredientLine(line);
      const food = lookup(p.name, parsed.item, false);
      return { parsed, food, name: p.name, _origGrams: parsed.grams };
    });
    applyFryingMedium(rows, perServing);
    applyBatchCondiment(rows, perServing);
    applyTypicalAmounts(rows);

    const lines = rows.map((r) => {
      const grams = r.parsed.grams ?? 0;
      const kcal100 = r.food && Number.isFinite(r.food.kcal) ? r.food.kcal : null;
      const kcalServingRaw = kcal100 != null ? (kcal100 * grams) / 100 / perServing : 0;
      const negligible = isNegligible(r);
      const flags = [];
      if (!r.food && !negligible) flags.push("UNMATCHED");
      if (
        r.food && FAT_RE.test(r.name || "") &&
        !r.fryingMedium && !r.batchCondiment && !r.estimated &&
        grams / perServing >= OIL_SUSPECT_PER_SERVING_G &&
        (r._origGrams ?? 0) >= OIL_SUSPECT_TOTAL_G
      ) flags.push("OIL_WHOLE");
      if (grams > 0 && grams / perServing > 400) flags.push("HUGE_GRAMS");
      return { name: r.name, kcalServingRaw, flags };
    });
    const totalRaw = lines.reduce((a, l) => a + l.kcalServingRaw, 0);
    for (const l of lines) {
      const share = totalRaw > 0 ? l.kcalServingRaw / totalRaw : 0;
      if (share >= 0.35 && l.kcalServingRaw > 60) l.flags.push(`BIG_SHARE(${l.name} ${Math.round(share * 100)}%)`);
    }

    const result = computeNutrition({ ingredients: list, servings: perServing }); // no recipeId → RAW (no facts overlay)
    const severity = result ? result.kcal : Math.round(totalRaw) + 100000;
    const why = [];
    if (!result) why.push(`engine-refused (uncapped ≈${Math.round(totalRaw)} kcal/srv)`);
    else why.push(`${result.kcal} kcal/srv (doubt ${result.doubt})`);
    const oil = lines.filter((l) => l.flags.includes("OIL_WHOLE"));
    const unmatched = lines.filter((l) => l.flags.includes("UNMATCHED"));
    const huge = lines.filter((l) => l.flags.includes("HUGE_GRAMS"));
    const big = lines.flatMap((l) => l.flags.filter((f) => f.startsWith("BIG_SHARE")));
    if (oil.length) why.push(`oil-whole×${oil.length} [${oil.map((l) => l.name).join(", ")}]`);
    if (unmatched.length) why.push(`unmatched×${unmatched.length} [${unmatched.map((l) => l.name).join(", ")}]`);
    if (huge.length) why.push(`huge-grams×${huge.length}`);
    if (big.length) why.push(`dominant: ${big.join(", ")}`);

    return { id: recipe.recipeId, name: recipe.name, severity, why };
  });

  scored.sort((a, b) => b.severity - a.severity);
  const pilot = scored.slice(0, n).map(({ id, name, why }) => ({ id, name, why }));
  writeJson(P.pilotRank, pilot);
  console.log(JSON.stringify(pilot, null, 2));
}

// ── --rematch-nulls : recover key:null lines the engine CAN resolve ────────────
// A bounded, DETERMINISTIC repair (no model/API): the canonicalizer model missed
// some exact usdaTable matches, so ~25 lines carry key:null even though the
// engine's own lookup resolves them (e.g. 52840 "1½ kg Clams" → `clams`, the
// calorie-dominant line). We re-run the ENGINE'S matching on each null line and
// map the resolved record back to the usdaTable key that produced it — never a
// hand-rolled matcher, so the fill is exactly what the app will look up.
//
// Cooked flag is gated the same way compute.ts's UNCURATED path gates it
// (`ing.cooked && hasCookedRecord`): a line flagged cooked with NO cooked record
// resolves against the raw table — which is why 52840 Clams (cooked, no cooked
// record) recovers `clams` instead of dropping. A line the engine cannot resolve
// stays null (a genuine Phase-3 miss). Idempotent: recovered lines are no longer
// null, so a re-run is a no-op.
async function rematchNulls() {
  const { parseIngredientLine } = await import("../src/features/nutrition/engine/parse.ts");
  const { lookup, foodForKey, hasCookedRecord } = await import("../src/features/nutrition/engine/lookup.ts");

  const keySet = usdaKeySet();
  const recipes = readJson(P.recipes);

  // Reverse index by OBJECT REFERENCE: foodForKey(k) returns the engine's own
  // TABLE[k], the exact reference lookup() returns on a hit — so the map-back is
  // an identity match, never an fdcId guess that could collide across aliases.
  const refToKey = new Map();
  for (const k of keySet) refToKey.set(foodForKey(k), k);

  let before = 0, recovered = 0;
  const recoveredList = [];
  const stillNull = [];

  for (const r of recipes) {
    for (const ing of r.ingredients) {
      if (ing.key !== null) continue;
      before++;
      const parsed = parseIngredientLine(ing.original);
      const name = parsed.item;
      const cookedEff = ing.cooked && hasCookedRecord(name, parsed.item);
      const food = lookup(name, parsed.item, cookedEff);
      const foundKey = food ? refToKey.get(food) : undefined;
      if (foundKey) {
        assert(keySet.has(foundKey), `re-match produced a non-usdaTable key: ${foundKey}`); // gate: never land an invented key
        ing.key = foundKey;
        ing.note = "key recovered by deterministic re-match" + (ing.note ? "; " + ing.note : "");
        recovered++;
        recoveredList.push({ id: r.id, name, key: foundKey, original: ing.original });
      } else {
        stillNull.push({ id: r.id, title: r.title, original: ing.original, note: ing.note });
      }
    }
  }

  recipes.sort((a, b) => Number(a.id) - Number(b.id));
  writeJson(P.recipes, recipes);
  writeJson(P.missing, stillNull); // rewrite: only the STILL-null lines (Phase 3)

  console.log(`--rematch-nulls: ${before} null-key line(s) before → ${recovered} recovered, ${stillNull.length} still-null (genuine Phase-3 misses).`);
  console.log("\nRECOVERED (recipe id | ingredient → key):");
  for (const x of recoveredList) console.log(`  ${x.id}  ${x.name} → ${x.key}   [${x.original}]`);
  console.log(`\nStill-null → ${P.missing} (${stillNull.length} line(s)).`);
}

// ── --emit : the canonicalizer INPUT payload for one recipe ───────────────────
function emit(id) {
  const bronze = loadBronze();
  const meal = mealById(bronze, id);
  if (!meal) throw new Error(`recipe id ${id} not found in bronze`);
  const payload = {
    id: String(meal.idMeal),
    title: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions, // verbatim — the canonicalizer rewrites in Otto voice
    ingredient_lines: bronzeLines(meal).map((l) => `${l.measure} ${l.name}`.trim()), // the `original` strings
    media: {
      image: nn(meal.strMealThumb),
      youtube: nn(meal.strYoutube),
      source: nn(meal.strSource),
    },
    usdaTable_keys: Object.keys(readJson(P.usda)).sort(), // pick `key` from THIS list, or null
  };
  writeJson(join(P.canonicalDir, `_input-${payload.id}.json`), payload);
  console.log(JSON.stringify(payload, null, 2));
}

// ── validate + upsert (shared by --land and --run-batch) ──────────────────────
const zodIssues = (err) => err.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);

// Pure: zod-validate one canonicalizer OUTPUT record, fill driver-owned media +
// provenance, re-check the FULL schema. No file IO, no process.exit — returns a
// result so the batch can isolate failures and the CLI can exit on them.
function validateRecord(rec, bronze, schemas, model, now) {
  const { core, full } = schemas;
  const parsed = core.safeParse(rec);
  if (!parsed.success) return { ok: false, id: rec?.id ?? "?", errors: zodIssues(parsed.error) };
  const meal = mealById(bronze, parsed.data.id);
  if (!meal) return { ok: false, id: parsed.data.id, errors: ["no bronze row — cannot source media/fetched_at"] };
  const record = {
    ...parsed.data,
    media: { image: nn(meal.strMealThumb), youtube: nn(meal.strYoutube), source: nn(meal.strSource) },
    provenance: {
      source: "themealdb",
      fetched_at: bronze.fetched_at,
      canonicalized_at: now,
      model: model || rec?.provenance?.model || "claude",
    },
  };
  const finalCheck = full.safeParse(record); // final gate re-checks keys before anything lands
  if (!finalCheck.success) return { ok: false, id: record.id, errors: zodIssues(finalCheck.error) };
  return { ok: true, record: finalCheck.data };
}

// Synchronous read-modify-write (safe under concurrency: no await inside → atomic
// w.r.t. the event loop). Idempotent upsert by id, sorted by numeric id. The
// per-record call from the batch is what makes the run RESUMABLE — recipes.json
// is durable after every landed recipe, so a crash never loses prior progress.
function upsertRecords(validated) {
  const existing = existsSync(P.recipes) ? readJson(P.recipes) : [];
  const ids = new Set(validated.map((r) => r.id));
  const merged = existing.filter((r) => !ids.has(r.id)).concat(validated);
  merged.sort((a, b) => Number(a.id) - Number(b.id));
  writeJson(P.recipes, merged);

  // missing-ingredients report (null-key lines → Phase 3 top-up). Idempotent:
  // drop these ids' prior entries before re-adding.
  const missing = existsSync(P.missing) ? readJson(P.missing) : [];
  const kept = missing.filter((m) => !ids.has(m.id));
  let missingCount = 0;
  for (const r of validated) {
    for (const ing of r.ingredients) {
      if (ing.key === null) { kept.push({ id: r.id, title: r.title, original: ing.original, note: ing.note }); missingCount++; }
    }
  }
  writeJson(P.missing, kept);
  return { total: merged.length, missingCount };
}

// Idempotent by-id upsert into a side report (failures / doubts). entry=null drops.
function upsertById(path, id, entry) {
  const arr = existsSync(path) ? readJson(path) : [];
  const kept = arr.filter((e) => String(e.id) !== String(id));
  if (entry) kept.push(entry);
  writeJson(path, kept);
}

// ── --land : validate the canonicalizer OUTPUT and upsert silver ──────────────
function land(file, model) {
  const bronze = loadBronze();
  const full = makeSilverSchema(usdaKeySet());
  const schemas = { full, core: full.omit({ provenance: true, media: true }) }; // canonicalizer returns media/provenance; driver fills them
  const now = new Date().toISOString();

  const incoming = readJson(isAbsolute(file) ? file : join(ROOT, file));
  const records = Array.isArray(incoming) ? incoming : [incoming];

  const validated = [];
  for (const rec of records) {
    const res = validateRecord(rec, bronze, schemas, model, now);
    if (!res.ok) {
      console.error(`validation FAILED for record id=${res.id}:`);
      for (const e of res.errors) console.error(`  ${e}`);
      process.exit(1);
    }
    validated.push(res.record);
  }

  const landedIds = validated.map((r) => r.id);
  const { total, missingCount } = upsertRecords(validated);
  console.log(
    `Landed ${validated.length} record(s) [${landedIds.join(", ")}] → ${P.recipes} (${total} total). ` +
      `${missingCount} null-key ingredient(s) → ${P.missing}.`
  );
}

// ── --run-batch : canonicalize the whole bronze via the deployed edge fn ──────
// Read EXPO_PUBLIC_SUPABASE_ANON_KEY from repo env file(s) — same order as the
// snapshot script. The anon key is the publishable client key (public/safe).
function readAnonKey() {
  for (const name of [".env", ".env.development", ".env.local"]) {
    let text;
    try { text = readFileSync(join(ROOT, name), "utf8"); } catch { continue; }
    const m = text.match(/^\s*EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env / .env.development / .env.local");
}

// The edge-function INPUT shape: { recipe:{...}, keys }. Same field logic as
// --emit (ingredient_lines = joined "measure name" originals; area ""→null).
function buildInput(meal, keys) {
  return {
    recipe: {
      id: String(meal.idMeal),
      title: meal.strMeal,
      category: meal.strCategory,
      area: nn(meal.strArea),
      instructions: meal.strInstructions,
      ingredient_lines: bronzeLines(meal).map((l) => `${l.measure} ${l.name}`.trim()),
    },
    keys,
  };
}

// Resume filter (pure, testable in --self-check with NO network): the work set is
// bronze ids NOT already in recipes.json. --only overrides to an explicit id list
// (re-canonicalize even if present — upsert is idempotent). --limit caps the count.
function computeWorkSet(meals, existingIds, only, limit) {
  const present = new Set(meals.map((m) => String(m.idMeal)));
  let ids = only && only.length
    ? only.map(String).filter((id) => present.has(id))
    : meals.map((m) => String(m.idMeal)).filter((id) => !existingIds.has(id));
  if (limit != null) ids = ids.slice(0, limit);
  return ids;
}

// POST one input to the canonicalize edge fn. 3× exponential backoff on
// network/5xx; a 4xx is a hard per-recipe failure (no retry — bad request).
async function postCanonicalize(input, anon) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(CANON_URL, {
        method: "POST",
        headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120000),
      });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${t.slice(0, 200)}`); // 4xx: not retriable
      }
      const json = await res.json();
      if (!json || !json.record) throw new Error("response missing { record }");
      return { record: json.record, responseModel: json.model ?? json.record?.provenance?.model ?? null };
    } catch (err) {
      lastErr = err;
      const retriable = /HTTP 5|fetch failed|network|timeout|aborted|terminated|ENOTFOUND|ECONNRESET|EAI_AGAIN/i.test(err.message);
      if (attempt < 3 && retriable) { await sleep(400 * 2 ** attempt); continue; } // 800, 1600ms
      throw err;
    }
  }
  throw lastErr;
}

// Bounded worker pool. `idx++` is atomic between awaits (single-threaded), so no
// task is claimed twice. ponytail: fixed pool, add a rate-limit gap if the fn 429s.
async function runPool(items, concurrency, worker) {
  let idx = 0;
  const lanes = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: lanes }, async () => {
    while (idx < items.length) await worker(items[idx++]);
  }));
}

// Servings sanity post-check (critic fix #2): flag absurd per-serving food mass
// for human review — does NOT block landing. ponytail: naive g/serving thresholds,
// tune if false-positive rate is high.
const BAKED_RE = /\b(cake|bun|bread|muffin|cookie|biscuit|pastry|pie|scone|brownie|tart|loaf|doughnut|donut|pancake|waffle|crumble|cupcake|roll)\b/i;
function servingsDoubt(r) {
  const grams = r.ingredients.reduce((a, i) => a + i.grams, 0);
  const per = grams / r.servings;
  const baked = r.category === "Dessert" || BAKED_RE.test(r.title);
  let reason = null;
  if (baked) {
    if (per < 25) reason = `baked piece ~${Math.round(per)}g < 25g`;
    else if (per > 200) reason = `baked piece ~${Math.round(per)}g > 200g`;
  } else if (per < 120) {
    reason = `main ~${Math.round(per)}g/serving < 120g`;
  }
  if (!reason) return null;
  return { id: r.id, title: r.title, category: r.category, servings: r.servings, total_grams: Math.round(grams), per_serving_g: Math.round(per), reason };
}

async function runBatch({ limit, concurrency, only, model }) {
  const anon = readAnonKey();
  const bronze = loadBronze();
  const full = makeSilverSchema(usdaKeySet());
  const schemas = { full, core: full.omit({ provenance: true, media: true }) };
  const keys = Object.keys(readJson(P.usda)).sort();
  const existingIds = new Set((existsSync(P.recipes) ? readJson(P.recipes) : []).map((r) => r.id));
  const workIds = computeWorkSet(bronze.meals, existingIds, only, limit);
  const total = workIds.length;
  const t0 = Date.now();
  let landed = 0, failed = 0, nullKeys = 0, doubts = 0, n = 0;

  console.error(
    `--run-batch: ${total} recipe(s) to canonicalize ` +
      `(${existingIds.size} already landed, concurrency ${concurrency}${only ? `, --only ${only.length}` : ""}${limit != null ? `, --limit ${limit}` : ""}).`
  );

  await runPool(workIds, concurrency, async (id) => {
    const i = ++n;
    const meal = mealById(bronze, id);
    try {
      const { record: raw, responseModel } = await postCanonicalize(buildInput(meal, keys), anon);
      const res = validateRecord(raw, bronze, schemas, model || responseModel, new Date().toISOString());
      if (!res.ok) {
        failed++;
        upsertById(P.failures, id, { id, title: meal.strMeal, errors: res.errors });
        console.error(`[${i}/${total}] ${id} ${meal.strMeal} → FAILED (${res.errors[0]})`);
        return;
      }
      const { missingCount } = upsertRecords([res.record]); // durable now → resumable
      upsertById(P.failures, id, null); // clear any prior failure for this id
      nullKeys += missingCount;
      const doubt = servingsDoubt(res.record);
      upsertById(P.doubts, id, doubt);
      if (doubt) doubts++;
      landed++;
      console.error(`[${i}/${total}] ${id} ${meal.strMeal} → ${res.record.servings}srv landed`);
    } catch (err) {
      failed++;
      upsertById(P.failures, id, { id, title: meal?.strMeal ?? "?", errors: [`request error: ${err.message}`] });
      console.error(`[${i}/${total}] ${id} ${meal?.strMeal ?? "?"} → FAILED (${err.message})`);
    }
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(
    `\nbatch done: ${landed} landed, ${failed} failed, ${nullKeys} null-key ingredient(s), ` +
      `${doubts} servings-doubt(s), ${elapsed}s elapsed.`
  );
  console.error(`recipes → ${P.recipes}` + (failed ? ` | failures → ${P.failures}` : "") + (doubts ? ` | doubts → ${P.doubts}` : "") + (nullKeys ? ` | missing → ${P.missing}` : ""));
}

// ── --self-check : prove the key-validation gate (no agent/network) ───────────
function selfCheck() {
  const keySet = usdaKeySet();
  assert(keySet.has("beef"), "expected 'beef' to be a real usdaTable key");
  const schema = makeSilverSchema(keySet);
  const base = {
    id: "99999",
    title: "Self-check Stew",
    category: "Beef",
    area: "Test",
    servings: 4,
    instructions: ["Brown the beef.", "Simmer."],
    media: { image: null, youtube: null, source: null },
    provenance: { source: "themealdb", fetched_at: "x", canonicalized_at: "y", model: "test" },
  };
  const valid = {
    ...base,
    ingredients: [
      { original: "1kg Beef", key: "beef", grams: 1000, cooked: false, frying_medium: false, note: null },
      { original: "a pinch of magic", key: null, grams: 0, cooked: false, frying_medium: false, note: "no key fits" },
    ],
  };
  const invalid = {
    ...base,
    id: "99998",
    ingredients: [
      { original: "1kg Beef", key: "totally_invented_key_xyz", grams: 1000, cooked: false, frying_medium: false, note: null },
    ],
  };

  const okr = schema.safeParse(valid);
  assert(okr.success, "VALID record should pass but did not: " + JSON.stringify(okr.error?.issues));
  const badr = schema.safeParse(invalid);
  assert(!badr.success, "INVALID record (invented key) should FAIL but passed");
  const keyIssue = badr.error.issues.find((i) => i.path.join(".").includes("key"));
  assert(keyIssue, "expected the failure to be on the ingredient key");

  // resume filter (batch) — NO network, NO files: bronze ids minus already-landed
  const meals = [{ idMeal: "1" }, { idMeal: "2" }, { idMeal: "3" }, { idMeal: "4" }];
  const landedAlready = new Set(["2", "4"]);
  const resumed = computeWorkSet(meals, landedAlready, null, null);
  assert.deepEqual(resumed, ["1", "3"], `resume filter should exclude landed ids, got ${JSON.stringify(resumed)}`);
  const capped = computeWorkSet(meals, new Set(), null, 2);
  assert.deepEqual(capped, ["1", "2"], `--limit 2 should cap to first two, got ${JSON.stringify(capped)}`);
  const onlyList = computeWorkSet(meals, landedAlready, ["4", "1", "999"], null);
  assert.deepEqual(onlyList, ["4", "1"], `--only should override (incl. landed) and drop unknown ids, got ${JSON.stringify(onlyList)}`);

  // servings sanity post-check — flags absurd per-serving mass, never blocks
  const tinyMain = { id: "1", title: "Thin Soup", category: "Beef", servings: 8, ingredients: [{ grams: 400 }] };
  const okMain = { id: "2", title: "Hearty Stew", category: "Beef", servings: 4, ingredients: [{ grams: 2000 }] };
  assert(servingsDoubt(tinyMain), "a 50g/serving main should be flagged");
  assert(!servingsDoubt(okMain), "a 500g/serving main should NOT be flagged");

  console.log("self-check PASS:");
  console.log("  ✓ valid record (real key 'beef' + null key) accepted");
  console.log("  ✓ invalid record (invented key 'totally_invented_key_xyz') REJECTED:");
  console.log(`    ${keyIssue.path.join(".")}: ${keyIssue.message}`);
  console.log("  ✓ resume filter excludes already-landed ids: work set [1,3] (2,4 skipped)");
  console.log("  ✓ --limit caps the slice; --only overrides (re-includes landed, drops unknown)");
  console.log("  ✓ servings post-check flags 50g/serving main, passes 500g/serving main");
}

// ── main ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flagVal = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};

if (argv.includes("--self-check")) {
  selfCheck();
} else if (argv.includes("--rank")) {
  const n = Number(flagVal("--rank")) || 10;
  await rank(n);
} else if (argv.includes("--run-batch")) {
  const limit = flagVal("--limit") != null ? Number(flagVal("--limit")) : null;
  const concurrency = Number(flagVal("--concurrency")) || 4;
  const only = flagVal("--only") ? flagVal("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
  await runBatch({ limit, concurrency, only, model: flagVal("--model") });
} else if (argv.includes("--rematch-nulls")) {
  await rematchNulls();
} else if (argv.includes("--emit")) {
  emit(flagVal("--emit"));
} else if (argv.includes("--land")) {
  land(flagVal("--land"), flagVal("--model"));
} else {
  console.error(
    "usage:\n" +
      "  --rank [N=10]                 rank bronze worst-first → pilot list (needs the TS loader; see header)\n" +
      "  --emit <id>                   write the canonicalizer INPUT payload for one recipe\n" +
      "  --land <file.json>            validate + upsert the canonicalizer OUTPUT into silver [--model <name>]\n" +
      "  --run-batch [--limit N]       canonicalize all un-landed bronze via the deployed edge fn (RESUMABLE)\n" +
      "              [--concurrency C=4] [--only <id,id,...>] [--model <name>]\n" +
      "  --rematch-nulls               recover key:null lines the engine resolves (deterministic; needs TS loader)\n" +
      "  --self-check                  prove the zod key gate + resume filter (no agent/network)"
  );
  process.exit(2);
}
