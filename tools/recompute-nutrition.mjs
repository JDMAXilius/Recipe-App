// recompute-nutrition.mjs — recompute seed_nutrition DIRECTLY from canonical silver.
//
// Phase 5 of the otto-recipes medallion pipeline. The app reads `seed_nutrition`
// for both cards (useSeedCalories) and the detail screen (nutrition.queries.ts).
// Those rows were computed from PARSED ingredient TEXT; this recomputes them from
// the canonical silver records instead — where a human already resolved grams,
// the USDA key, cooked-state, the frying medium, and the serving count. That is
// how canonicalization's corrections (verified servings, oil-film, cooked flags,
// gram fixes) actually reach users.
//
// NOT a re-parse: it never runs parse.ts. It takes canonical's resolved
// {key, grams, cooked, frying_medium} rows straight into the engine's OWN guards
// and mirrors compute.ts's final summation → guard → confidence tail VERBATIM, so
// the numbers, the `nutrition` jsonb SHAPE, and the confidence match exactly what
// the app produces today — just fed by canonical instead of TheMealDB text.
//
// Canonical is treated as "curated facts present" (like recipeFacts servings/
// cooked/frying), so the two text-ambiguity guards the engine skips WHEN facts
// exist are skipped here too: the raw-vs-cooked grain refusal (canonical resolved
// it) and the MAX_PLAUSIBLE_SERVING_GRAMS backstop (servings are verified). Every
// other guard — coverage floor, unweighed-line ceiling, kcal plausibility bounds,
// mass-weighted confidence — runs exactly as compute.ts runs it.
//
// RUN (needs the TS strip-types loader, same as `npm test` / nutrition:breakdown):
//   node --experimental-strip-types \
//        --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//        tools/recompute-nutrition.mjs --dry-run
//   node --experimental-strip-types \
//        --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//        tools/recompute-nutrition.mjs --self-check
//
// UPSERT (the lead runs this — service-role key never lives in the repo):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node --experimental-strip-types \
//          --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//          tools/recompute-nutrition.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

import { key } from "../src/features/nutrition/engine/lookup.ts";
import {
  applyFryingMedium,
  applyBatchCondiment,
  applyTypicalAmounts,
  isNegligible,
  COVERAGE_MIN,
  UNWEIGHED_LINE_MAX,
  MIN_PLAUSIBLE_KCAL,
  MAX_PLAUSIBLE_KCAL,
} from "../src/features/nutrition/engine/guards.ts";
import usdaTable from "../src/features/nutrition/engine/data/usdaTable.json" with { type: "json" };
import cookedTable from "../src/features/nutrition/engine/data/usdaCookedTable.json" with { type: "json" };

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolvePath(HERE, "..");
const SILVER_PATH = resolvePath(REPO, "supabase/otto-recipes/canonical/recipes.json");
const BATCH = 100;

const log = (...a) => process.stderr.write(a.join(" ") + "\n");
const round = (n, dp = 0) =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

// ── Build the engine's Row[] from a canonical record ─────────────────────────
// The canonical `key` is already a usdaTable key (the canonicalizer resolved it),
// so NO lookup()/parse() runs. food = cooked && cooked-record ? cooked : raw; a
// null key is an honest miss (food = null → dropped from the sum, counted against
// coverage). `name` falls back to the original line so isNegligible's NEGLIGIBLE/
// INEDIBLE regexes still catch a keyless "8 Banana Leaves" or "Zest of 1 Lime".
// `curatedFrying` carries the human frying_medium flag — the exact signal
// recipeFacts.frying feeds applyFryingMedium in the live engine.
function buildRows(record) {
  const perServing = Math.max(1, Number(record.servings) || 1);
  const rows = (record.ingredients || []).map((ing) => {
    const k = key(ing.key);
    // Mirror the engine's lookup() exactly: a cooked line resolves ONLY against
    // the cooked table, and a cooked-MISS drops to null — it must NEVER fall back
    // to the raw usdaTable row (that re-introduces the ~3x raw-vs-cooked error the
    // honesty law forbids; see lookup.ts:141-148). The raw branch is unchanged.
    let food = null;
    if (k) food = ing.cooked ? (cookedTable[k] ?? null) : (usdaTable[k] ?? null);
    const grams = Number(ing.grams) || 0;
    return {
      // parsed mirrors ParsedLine; confidence "high" = the amount is human-verified
      // in canonical, not an Otto parse guess (frying/typical guards still lower it).
      parsed: { qty: null, unit: null, item: ing.key || "", grams, confidence: "high", raw: ing.original || "" },
      food,
      name: ing.key || ing.original || "",
      resolved: false,
      curatedFrying: !!ing.frying_medium,
    };
  });
  return { perServing, rows };
}

// ── compute.ts tail, mirrored verbatim (guards + summation + confidence) ──────
// facts are ALWAYS present for canonical, so the two facts-gated refusals in
// compute.ts (hasAmbiguousGrain, MAX_PLAUSIBLE_SERVING_GRAMS) do not apply and are
// intentionally omitted. Everything below is line-for-line compute.ts.
function computeFromCanonical(record) {
  const { perServing, rows } = buildRows(record);
  if (!rows.length) return null;

  applyFryingMedium(rows, perServing);
  applyBatchCondiment(rows, perServing);
  applyTypicalAmounts(rows);

  const usable = rows.filter((r) => r.food && (r.parsed.grams ?? 0) > 0);
  if (!usable.length) return null;

  const countable = rows.filter((r) => (r.parsed.grams ?? 0) > 0 && !isNegligible(r));
  const countableGrams = countable.reduce((a, r) => a + r.parsed.grams, 0);
  const resolvedGrams = countable.filter((r) => r.food).reduce((a, r) => a + r.parsed.grams, 0);
  if (countableGrams > 0 && resolvedGrams / countableGrams < COVERAGE_MIN) return null;

  const unweighed = rows.filter((r) => !isNegligible(r) && !((r.parsed.grams ?? 0) > 0));
  const substantialLines = rows.filter((r) => !isNegligible(r)).length;
  if (substantialLines > 0 && unweighed.length / substantialLines > UNWEIGHED_LINE_MAX) return null;

  const sum = (field) => {
    let total = null;
    for (const { parsed, food } of usable) {
      const v = food[field];
      if (Number.isFinite(v)) total = (total ?? 0) + (v * parsed.grams) / 100;
    }
    return total;
  };
  const per = (v, dp) => (v == null ? null : round(v / perServing, dp));

  const kcalPerServing = round(Number(sum("kcal")) / perServing, 0);
  if (!Number.isFinite(kcalPerServing) || kcalPerServing == null) return null;
  const coverage = countableGrams > 0 ? resolvedGrams / countableGrams : 0;
  const lowFloor = coverage >= 0.9 ? 1 : MIN_PLAUSIBLE_KCAL;
  if (kcalPerServing < lowFloor || kcalPerServing > MAX_PLAUSIBLE_KCAL) return null;

  const gramsTotal = usable.reduce((a, r) => a + r.parsed.grams, 0);

  const counted = rows.filter((r) => !isNegligible(r));
  const scored = counted.length ? counted : rows;
  const resolved = (r) => r.food && (r.parsed.grams ?? 0) > 0;
  const massOf = (r) => ((r.parsed.grams ?? 0) > 0 ? r.parsed.grams : 0);
  const totalMass = scored.reduce((a, r) => a + massOf(r), 0);
  const doubtMass =
    scored.filter((r) => !resolved(r) || r.estimated).reduce((a, r) => a + massOf(r), 0) +
    scored
      .filter((r) => resolved(r) && !r.estimated && (r.resolved || r.parsed.confidence !== "high"))
      .reduce((a, r) => a + massOf(r), 0) * 0.5;
  const weightless = scored.filter((r) => massOf(r) === 0).length;
  const unmatched = scored.filter((r) => !resolved(r) || r.estimated).length;
  const guessed = scored.filter(
    (r) => resolved(r) && (r.resolved || r.parsed.confidence !== "high")
  ).length;
  const doubt =
    totalMass > 0
      ? doubtMass / totalMass + weightless / scored.length
      : (unmatched + guessed * 0.5) / scored.length;
  let confidence = doubt <= 0.1 ? "high" : doubt <= 0.3 ? "medium" : "low";
  const everyFoodIdentified = scored.every((r) => r.food);
  if (confidence !== "high" && everyFoodIdentified) confidence = "high";

  return {
    kcal: kcalPerServing,
    protein_g: per(sum("protein_g"), 1),
    carbs_g: per(sum("carbs_g"), 1),
    fat_g: per(sum("fat_g"), 1),
    fiber_g: per(sum("fiber_g"), 1),
    sugar_g: per(sum("sugar_g"), 1),
    sodium_mg: per(sum("sodium_mg"), 0),
    basis_grams: round(gramsTotal / perServing),
    per: "serving",
    source: "usda",
    confidence,
    basis: doubt <= 0.1 ? "measured" : "estimated",
    doubt: round(doubt, 2),
    computed_at: new Date().toISOString(),
  };
}

function loadSilver() {
  const records = JSON.parse(readFileSync(SILVER_PATH, "utf8"));
  if (!Array.isArray(records)) {
    throw new Error(`expected an array in ${SILVER_PATH}, got ${typeof records}`);
  }
  return records;
}

// recipe_id + the nutrition jsonb, ready to upsert. A refused recipe (null) is
// skipped, NOT written as null — the app then honestly falls back to its labelled
// category estimate, exactly as it does for an uncached seed.
function computeAll(records) {
  const rows = [];
  const refused = [];
  for (const rec of records) {
    if (!rec || typeof rec.id !== "string" || !rec.id) {
      throw new Error(`silver record missing string id: ${JSON.stringify(rec)?.slice(0, 120)}`);
    }
    const nutrition = computeFromCanonical(rec);
    if (!nutrition) {
      refused.push(rec.id);
      continue;
    }
    rows.push({ recipe_id: rec.id, nutrition });
  }
  return { rows, refused };
}

const supabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in the environment. " +
        "Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node --experimental-strip-types " +
        "--import ./src/features/nutrition/engine/ts-ext-resolve.mjs tools/recompute-nutrition.mjs",
    );
  }
  return { url, serviceKey };
};

// ── modes ────────────────────────────────────────────────────────────────────
async function dryRun() {
  const records = loadSilver();
  const { rows, refused } = computeAll(records);
  const kcals = rows.map((r) => r.nutrition.kcal).sort((a, b) => a - b);
  const median = kcals.length ? kcals[Math.floor(kcals.length / 2)] : null;
  const conf = rows.reduce((m, r) => ((m[r.nutrition.confidence] = (m[r.nutrition.confidence] || 0) + 1), m), {});

  log(`silver: ${records.length} records from ${SILVER_PATH}`);
  log(`computed: ${rows.length}   refused/null (→ app category estimate): ${refused.length}`);
  log(`kcal/serving  min ${kcals[0]}  median ${median}  max ${kcals[kcals.length - 1]}`);
  log(`confidence    ${JSON.stringify(conf)}`);
  if (refused.length) log(`refused ids   ${refused.join(", ")}`);

  // before[current seed_nutrition] → after[canonical] for 5 samples (Irish stew first).
  const { url, serviceKey } = readOnlyCreds();
  const wanted = ["52781", ...rows.filter((r) => r.recipe_id !== "52781").slice(0, 4).map((r) => r.recipe_id)];
  const before = url ? await fetchCurrent(url, serviceKey, wanted) : {};
  log(`\nsamples  before[current] → after[canonical]  (kcal / P,C,F g / conf):`);
  for (const id of wanted) {
    const rec = records.find((r) => r.id === id);
    const a = rows.find((r) => r.recipe_id === id)?.nutrition;
    const b = before[id];
    const fmt = (n) => (n ? `${n.kcal} kcal  ${n.protein_g},${n.carbs_g},${n.fat_g} g  ${n.confidence}` : "—");
    log(`  ${id} ${rec?.title ?? ""}`);
    log(`      before: ${b ? fmt(b) : url ? "(no current row)" : "(no read creds)"}`);
    log(`      after : ${fmt(a)}`);
  }
  log(`\n[dry-run] no writes performed.`);
}

// A read of the CURRENT rows for the before/after diff. Uses service-role if the
// lead exported it, else the bundled anon key (seed_nutrition is public SELECT).
function readOnlyCreds() {
  const url = process.env.SUPABASE_URL || null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;
  return { url: url && serviceKey ? url : null, serviceKey };
}
async function fetchCurrent(url, serviceKey, ids) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("seed_nutrition").select("recipe_id, nutrition").in("recipe_id", ids);
  if (error) {
    log(`(before-read skipped: ${error.message})`);
    return {};
  }
  return Object.fromEntries((data ?? []).map((r) => [r.recipe_id, r.nutrition]));
}

async function upsert() {
  const { url, serviceKey } = supabaseClient();
  const records = loadSilver();
  const { rows, refused } = computeAll(records);
  log(`silver: ${records.length} records; computed ${rows.length}, refused ${refused.length}`);

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((r) => ({ ...r, computed_at: now }));
    const { error } = await supabase.from("seed_nutrition").upsert(batch, { onConflict: "recipe_id" });
    if (error) throw new Error(`upsert batch @${i}: ${error.message}`);
    upserted += batch.length;
    log(`  upserted ${upserted}/${rows.length}`);
  }
  log(`\n===== RECOMPUTE COMPLETE =====`);
  log(`${upserted} upserted, ${refused.length} refused (left to the app's category estimate)`);
}

// Offline check: one hand-built canonical record → assert the nutrition SHAPE the
// app reads (nutrition.queries.ts / schemas.ts) and a known kcal. 200 g chicken
// breast (120 kcal/100g) over 2 servings = 120 kcal/serving, all-measured → high.
function selfCheck() {
  const record = {
    id: "TEST",
    servings: 2,
    ingredients: [
      { original: "200g chicken breast", key: "chicken breast", grams: 200, cooked: false, frying_medium: false },
    ],
  };
  const n = computeFromCanonical(record);
  const SHAPE = [
    "kcal", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg",
    "basis_grams", "per", "source", "confidence", "basis", "doubt", "computed_at",
  ];
  for (const k of SHAPE) console.assert(k in n, `nutrition shape missing "${k}"`);
  console.assert(Object.keys(n).length === SHAPE.length, `unexpected extra keys: ${Object.keys(n)}`);
  console.assert(n.kcal === 120, `kcal expected 120, got ${n.kcal}`); // 120 * 200/100 / 2
  console.assert(n.protein_g === 22.5, `protein expected 22.5, got ${n.protein_g}`);
  console.assert(n.fat_g === 2.6, `fat expected 2.6, got ${n.fat_g}`); // 2.62*200/100/2 = 2.62 → 2.6
  console.assert(n.carbs_g === 0, `carbs expected 0, got ${n.carbs_g}`);
  console.assert(n.per === "serving" && n.source === "usda", "per/source constants");
  console.assert(n.confidence === "high" && n.basis === "measured", "all-measured → high/measured");
  console.assert(n.basis_grams === 100, `basis_grams expected 100, got ${n.basis_grams}`); // 200/2

  // Frying-medium reuse: a curated 200 g oil pour must collapse to the engine's
  // film, not count 200 g of oil whole (that would blow past MAX_PLAUSIBLE_KCAL).
  const fried = computeFromCanonical({
    id: "T2", servings: 4,
    ingredients: [
      { original: "500g chicken breast", key: "chicken breast", grams: 500, cooked: false, frying_medium: false },
      { original: "200ml oil", key: "olive oil", grams: 200, cooked: false, frying_medium: true },
    ],
  });
  console.assert(fried && fried.kcal < 400, `frying film should keep kcal modest, got ${fried?.kcal}`);

  log("self-check OK");
}

export { computeFromCanonical, computeAll, loadSilver };

// Only dispatch the CLI when run directly, not when imported (compare scripts).
if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const argv = process.argv;
  if (argv.includes("--self-check")) {
    selfCheck();
  } else if (argv.includes("--dry-run")) {
    dryRun().catch((err) => { log(`FATAL: ${err.message}`); process.exit(1); });
  } else {
    upsert().catch((err) => { log(`FATAL: ${err.message}`); process.exit(1); });
  }
}
