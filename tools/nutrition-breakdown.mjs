// Per-recipe nutrition breakdown diagnostic (ticket T6, docs/tickets/NUTRITION_ACCURACY.md).
//
// Prints, for one recipe or a whole corpus, each ingredient line's PARSED GRAMS,
// KCAL CONTRIBUTION and MATCHED USDA RECORD — sorted heaviest-first — and flags
// outliers (oil counted whole, unmatched foods, low-confidence parses, huge
// grams, single line dominating the total). The point is to answer "why does
// this recipe read too high?" without guessing: layer 2/3 (grams / cooking
// model) is always the culprit, never the per-100g table — this shows which line.
//
// It reuses the ENGINE's own building blocks (parse → lookup → guards) in the
// exact order compute.ts applies them, so the grams and kcal it prints are the
// grams and kcal the engine actually sums. It never re-implements the arithmetic.
//
// RUN (needs the TS strip-types loader, same as `npm test`):
//   node --experimental-strip-types \
//        --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//        tools/nutrition-breakdown.mjs <mode>
//
// MODES:
//   --demo                     run the Irish Stew reference case from the ticket
//   --file  <recipe.json>      one recipe:  { name?, recipeId?, servings, ingredients:[{measure,name}] }
//   --corpus <recipes.json>    array of the above — batch scan, ranked worst-first
//   (no args)                  same as --demo
//
// A seed corpus (all 750+ TheMealDB recipes) can be generated in a session WITH
// network by calling the `content` edge function per recipe and writing an array
// of { name, recipeId, servings, ingredients } — then `--corpus that.json`. USDA
// is blocked in cloud sessions, but the engine + table ship locally, so the
// breakdown itself runs fully offline.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

import { parseIngredientLine } from "../src/features/nutrition/engine/parse.ts";
import { lookup, key } from "../src/features/nutrition/engine/lookup.ts";
import {
  applyFryingMedium,
  applyBatchCondiment,
  applyTypicalAmounts,
  isNegligible,
} from "../src/features/nutrition/engine/guards.ts";
import { computeNutrition } from "../src/features/nutrition/engine/compute.ts";
import recipeFacts from "../src/features/nutrition/engine/data/recipeFacts.json" with { type: "json" };

const HERE = dirname(fileURLToPath(import.meta.url));

// Fat words that read as a frying medium (mirrors guards.ts FAT_RE, which is not
// exported). Used only to flag "oil counted whole" — a diagnostic hint, not a
// compute path.
const FAT_RE = /\b(oils?|ghee|lard|shortening|dripping|tallow|butter|margarine)\b/i;

// ── one recipe → structured breakdown ────────────────────────────────────────
// Rebuilds the row set exactly as compute.ts buildContext does, then applies the
// same guards in the same order, snapshotting each line's grams BEFORE the guards
// so we can show what the engine dropped (e.g. oil the frying-medium guard zeroed).
function breakdown(recipe) {
  const facts = recipe.recipeId != null ? recipeFacts[String(recipe.recipeId)] ?? null : null;
  const perServing = Math.max(1, Number(facts?.servings) || Number(recipe.servings) || 1);
  const cookedSet = new Set((facts?.cooked || []).map(key));

  const list = (recipe.ingredients || []).filter((p) => p && (p.name || p.measure));
  const rows = list.map((p) => {
    const line = [p.measure, p.name].filter(Boolean).join(" ").trim();
    const parsed = parseIngredientLine(line);
    const cooked = cookedSet.has(key(p.name));
    const food = lookup(p.name, parsed.item, cooked);
    return { parsed, food, name: p.name, measure: p.measure, resolved: false, cooked, _origGrams: parsed.grams };
  });

  // Same order as compute.ts (frying medium & batch condiment reduce grams;
  // typical amounts fill unquantified lines).
  applyFryingMedium(rows, perServing);
  applyBatchCondiment(rows, perServing);
  applyTypicalAmounts(rows);

  const lines = rows.map((r) => {
    const grams = r.parsed.grams ?? 0;
    const kcal100 = r.food && Number.isFinite(r.food.kcal) ? r.food.kcal : null;
    const kcalTotal = kcal100 != null ? (kcal100 * grams) / 100 : null;
    const kcalServing = kcalTotal != null ? kcalTotal / perServing : null;
    const negligible = isNegligible(r);
    const flags = [];

    if (!r.food && !negligible) flags.push("UNMATCHED");
    // Oil/butter still counted whole (frying-medium guard did NOT fire) and
    // contributing real calories — the T1 signal.
    if (
      r.food &&
      FAT_RE.test(r.name || "") &&
      !r.fryingMedium &&
      !r.estimated &&
      (kcalServing ?? 0) > 100
    ) {
      flags.push("OIL_WHOLE");
    }
    if (r.fryingMedium) flags.push("frying-absorbed");
    if (r.batchCondiment) flags.push("condiment-capped");
    if (r.estimated) flags.push("typical-amt");
    if (r.cooked) flags.push("cooked-record");
    if (grams > 0 && grams / perServing > 400) flags.push("HUGE_GRAMS");
    if (!negligible && !(grams > 0)) flags.push("NO_GRAMS");
    if (r.food && r.parsed.confidence !== "high") flags.push("low-conf");

    return {
      name: r.name,
      measure: r.measure,
      item: r.parsed.item,
      grams: round(grams, 1),
      origGrams: round(r._origGrams ?? 0, 1),
      confidence: r.parsed.confidence,
      match: r.food ? r.food.usda : null,
      fdcId: r.food ? r.food.fdcId : null,
      kcal100,
      kcalServing: kcalServing != null ? round(kcalServing, 0) : null,
      negligible,
      flags,
    };
  });

  // Share of the per-serving kcal each line carries (post-guard) — the "one line
  // dominates" outlier is share-based, computed after the total is known.
  const totalKcal = lines.reduce((a, l) => a + (l.kcalServing ?? 0), 0);
  for (const l of lines) {
    l.share = totalKcal > 0 && l.kcalServing != null ? l.kcalServing / totalKcal : 0;
    if (l.share >= 0.35 && (l.kcalServing ?? 0) > 60) l.flags.push("BIG_SHARE");
  }
  lines.sort((a, b) => (b.kcalServing ?? 0) - (a.kcalServing ?? 0));

  const result = computeNutrition({
    ingredients: list,
    servings: perServing,
    recipeId: recipe.recipeId,
  });

  return { name: recipe.name || recipe.recipeId || "(unnamed)", perServing, lines, totalKcal: round(totalKcal, 0), result };
}

const round = (n, dp = 0) =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

// ── rendering ─────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s ?? "").padEnd(n).slice(0, n);
const lpad = (s, n) => String(s ?? "").padStart(n);

function printOne(b) {
  const engineKcal = b.result ? b.result.kcal : "null (refused)";
  console.log(`\n━━ ${b.name}  ·  serves ${b.perServing}`);
  console.log(
    `   engine → ${engineKcal} kcal/serving` +
      (b.result ? `  (confidence ${b.result.confidence}, basis ${b.result.basis}, doubt ${b.result.doubt})` : "") +
      `   ·  Σ lines ≈ ${b.totalKcal} kcal/serving`
  );
  console.log(
    "   " +
      pad("kcal/srv", 9) +
      pad("share", 7) +
      pad("grams", 9) +
      pad("conf", 8) +
      pad("ingredient", 22) +
      pad("→ USDA match (fdcId)", 46) +
      "flags"
  );
  for (const l of b.lines) {
    const grams = l.origGrams !== l.grams ? `${l.grams}(${l.origGrams})` : `${l.grams}`;
    const usda = l.match && l.match.length > 30 ? l.match.slice(0, 29) + "…" : l.match;
    const match = l.match ? `${usda} (${l.fdcId ?? "—"})` : l.negligible ? "· negligible" : "· UNMATCHED";
    console.log(
      "   " +
        lpad(l.kcalServing ?? "—", 8) +
        " " +
        lpad(l.share ? Math.round(l.share * 100) + "%" : "—", 6) +
        " " +
        pad(grams, 9) +
        pad(l.confidence, 8) +
        pad(l.name, 22) +
        pad(match, 46) +
        l.flags.join(" ")
    );
  }
}

// One-line health summary for corpus scanning: worst signals surfaced.
function signals(b) {
  const s = [];
  const oil = b.lines.filter((l) => l.flags.includes("OIL_WHOLE"));
  const unmatched = b.lines.filter((l) => l.flags.includes("UNMATCHED"));
  const big = b.lines.filter((l) => l.flags.includes("BIG_SHARE"));
  const huge = b.lines.filter((l) => l.flags.includes("HUGE_GRAMS"));
  if (oil.length) s.push(`oil-whole×${oil.length} (${oil.reduce((a, l) => a + (l.kcalServing || 0), 0)} kcal)`);
  if (unmatched.length) s.push(`unmatched×${unmatched.length} [${unmatched.map((l) => l.name).join(", ")}]`);
  if (big.length) s.push(`dominant:${big.map((l) => l.name + " " + Math.round(l.share * 100) + "%").join(", ")}`);
  if (huge.length) s.push(`huge-grams×${huge.length}`);
  if (!b.result) s.push("engine-refused");
  return s;
}

function printCorpus(recipes) {
  const scored = recipes.map(breakdown);
  // Worst-first: implausibly high totals and the biggest single-line dominance.
  scored.sort((a, b) => (b.result?.kcal ?? 0) - (a.result?.kcal ?? 0));
  console.log(`\nScanned ${scored.length} recipes. Ranked by kcal/serving (worst-first):\n`);
  console.log("   " + pad("kcal", 6) + pad("recipe", 34) + "signals");
  for (const b of scored) {
    const k = b.result ? b.result.kcal : "null";
    console.log("   " + pad(k, 6) + pad(b.name, 34) + (signals(b).join("  ·  ") || "—"));
  }
  // Then the full breakdown of the top offenders so the culprit lines are visible.
  const worst = scored.filter((b) => (b.result?.kcal ?? 0) >= 700 || signals(b).length).slice(0, 8);
  if (worst.length) {
    console.log(`\n\nFull breakdown of the ${worst.length} most suspect:`);
    worst.forEach(printOne);
  }
}

// The ticket's reference case — Irish Stew, traced 2026-07-23 (1135 kcal/serving).
// Ingredients/quantities as TheMealDB serves them; recipeId omitted so it uses
// the flat default and reproduces the pre-fix behaviour the ticket describes.
const IRISH_STEW = {
  name: "Irish Stew (ticket reference case)",
  servings: 4,
  ingredients: [
    { measure: "2 kg", name: "Lamb" },
    { measure: "120 ml", name: "Olive Oil" },
    { measure: "2", name: "Potatoes" },
    { measure: "4", name: "Carrots" },
    { measure: "2", name: "Onions" },
    { measure: "300 g", name: "soaked overnight in water then drained" },
    { measure: "1 litre", name: "Beef Stock" },
    { measure: "2 sprigs", name: "Thyme" },
    { measure: "2 tbsp", name: "Butter" },
    { measure: "1 tsp", name: "Salt" },
    { measure: "1 tsp", name: "Black Pepper" },
  ],
};

// ── main ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const loadJson = (p) => JSON.parse(readFileSync(resolvePath(process.cwd(), p), "utf8"));

if (argv.includes("--corpus")) {
  printCorpus(loadJson(flag("--corpus")));
} else if (argv.includes("--file")) {
  printOne(breakdown(loadJson(flag("--file"))));
} else {
  if (!argv.includes("--demo") && argv.length) {
    console.error("Unknown args. Use --demo | --file <json> | --corpus <json>. Running --demo.\n");
  }
  console.log("DEMO — the Irish Stew reference case from docs/tickets/NUTRITION_ACCURACY.md");
  console.log("(recipeId omitted, so no curated facts apply — reproduces the pre-fix trace)");
  printOne(breakdown(IRISH_STEW));
  console.log(
    "\nReading it: OIL_WHOLE on the 120 ml olive oil is the T1 target — a browning\n" +
      "medium counted as if eaten. UNMATCHED on the 'soaked overnight…' line is the\n" +
      "mis-parse the ticket names (almost certainly barley). HUGE_GRAMS / BIG_SHARE on\n" +
      "the 2 kg lamb is the fatty-cut + raw-match (T5) — leaner, cooked would drop it."
  );
}
void HERE;
