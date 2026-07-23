// otto-recipes SILVER driver (bronze → silver). Medallion Phase 2.
//
// A Node script CANNOT spawn Claude agents, so this driver does everything
// EXCEPT the LLM call. The lead runs it, dispatches the `canonicalizer` agent
// between --emit and --land, and commits. Three real steps + two utilities:
//
//   --rank [N=10]       rank the bronze corpus worst-first → the pilot list
//   --emit <id>         write the canonicalizer INPUT payload for one recipe
//   --land <file.json>  zod-validate the canonicalizer's OUTPUT and upsert silver
//   --self-check        prove the zod key-validation gate works (no agent/network)
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
};

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

// ── --land : validate the canonicalizer OUTPUT and upsert silver ──────────────
function land(file, model) {
  const bronze = loadBronze();
  const keySet = usdaKeySet();
  const full = makeSilverSchema(keySet);
  const core = full.omit({ provenance: true, media: true }); // canonicalizer returns these; driver fills them
  const now = new Date().toISOString();

  const incoming = readJson(isAbsolute(file) ? file : join(ROOT, file));
  const records = Array.isArray(incoming) ? incoming : [incoming];

  const validated = [];
  for (const rec of records) {
    const parsed = core.safeParse(rec);
    if (!parsed.success) {
      console.error(`zod validation FAILED for record id=${rec?.id ?? "?"}:`);
      for (const issue of parsed.error.issues) {
        console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      process.exit(1);
    }
    const meal = mealById(bronze, parsed.data.id);
    if (!meal) {
      console.error(`record id=${parsed.data.id} has no bronze row — cannot source media/fetched_at.`);
      process.exit(1);
    }
    const record = {
      ...parsed.data,
      media: { image: nn(meal.strMealThumb), youtube: nn(meal.strYoutube), source: nn(meal.strSource) },
      provenance: {
        source: "themealdb",
        fetched_at: bronze.fetched_at,
        canonicalized_at: now,
        model: model || "claude",
      },
    };
    // final gate: the FULL silver schema (re-checks keys) before anything lands
    const finalCheck = full.safeParse(record);
    if (!finalCheck.success) {
      console.error(`FULL-record validation FAILED for id=${record.id}:`);
      for (const issue of finalCheck.error.issues) console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      process.exit(1);
    }
    validated.push(finalCheck.data);
  }

  // upsert by id (idempotent — re-landing overwrites, never duplicates), sorted by numeric id
  const existing = existsSync(P.recipes) ? readJson(P.recipes) : [];
  const landedIds = new Set(validated.map((r) => r.id));
  const merged = existing.filter((r) => !landedIds.has(r.id)).concat(validated);
  merged.sort((a, b) => Number(a.id) - Number(b.id));
  writeJson(P.recipes, merged);

  // missing-ingredients run report (null-key lines → Phase 3 top-up). Idempotent:
  // drop this id's prior entries before re-adding.
  const missing = existsSync(P.missing) ? readJson(P.missing) : [];
  const kept = missing.filter((m) => !landedIds.has(m.id));
  for (const r of validated) {
    for (const ing of r.ingredients) {
      if (ing.key === null) kept.push({ id: r.id, title: r.title, original: ing.original, note: ing.note });
    }
  }
  writeJson(P.missing, kept);

  const missingCount = validated.reduce((a, r) => a + r.ingredients.filter((i) => i.key === null).length, 0);
  console.log(
    `Landed ${validated.length} record(s) [${[...landedIds].join(", ")}] → ${P.recipes} (${merged.length} total). ` +
      `${missingCount} null-key ingredient(s) → ${P.missing}.`
  );
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

  console.log("self-check PASS:");
  console.log("  ✓ valid record (real key 'beef' + null key) accepted");
  console.log("  ✓ invalid record (invented key 'totally_invented_key_xyz') REJECTED:");
  console.log(`    ${keyIssue.path.join(".")}: ${keyIssue.message}`);
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
} else if (argv.includes("--emit")) {
  emit(flagVal("--emit"));
} else if (argv.includes("--land")) {
  land(flagVal("--land"), flagVal("--model"));
} else {
  console.error(
    "usage:\n" +
      "  --rank [N=10]       rank bronze worst-first → pilot list (needs the TS loader; see header)\n" +
      "  --emit <id>         write the canonicalizer INPUT payload for one recipe\n" +
      "  --land <file.json>  validate + upsert the canonicalizer OUTPUT into silver [--model <name>]\n" +
      "  --self-check        prove the zod key-validation gate (no agent/network)"
  );
  process.exit(2);
}
