// add-otto-recipes.mjs — land NEW Otto-original recipes into the catalogue.
// The growth path after the one-time migration (docs/tickets/OWN_RECIPE_DB.md):
// authored records in, silver + serving-copy SQL out. Used by the
// otto-new-recipes skill (.claude/skills/otto-new-recipes/SKILL.md).
//
// Input: a JSON file of FULL silver-shaped records — id ("9xxxxx" string),
// title, category, area, servings, instructions[], ingredients[] each
// { original, measure, name, key, grams, cooked, frying_medium, note }.
// The canonicalizer judgment (key/grams/flags) is done by the agent BEFORE
// this runs; this tool only validates, lands, and computes.
//
// What it does, in order:
//   1. validates every record (shape, id range, keys against usdaTable)
//   2. appends new records to silver recipes.json (skips ids already there)
//   3. computes per-serving nutrition via the SAME engine path as the 792
//      (tools/recompute-nutrition.mjs computeFromCanonical)
//   4. writes upsert SQL for otto_recipes + seed_nutrition next to the input
//      (apply via the Supabase MCP execute_sql, or psql as the service role)
//
// RUN (needs the TS strip-types loader, same as npm test):
//   node --experimental-strip-types \
//        --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//        tools/add-otto-recipes.mjs <records.json>
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { z } from "zod";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolvePath(HERE, "..");
const SILVER = resolvePath(REPO, "supabase/otto-recipes/canonical/recipes.json");

const log = (...a) => process.stderr.write(a.join(" ") + "\n");

const input = process.argv[2];
if (!input) {
  log("usage: node --experimental-strip-types --import ./src/features/nutrition/engine/ts-ext-resolve.mjs tools/add-otto-recipes.mjs <records.json>");
  process.exit(1);
}

const usda = JSON.parse(readFileSync(resolvePath(REPO, "src/features/nutrition/engine/data/usdaTable.json"), "utf8"));

const Ingredient = z.object({
  original: z.string().min(1),
  measure: z.string(),
  name: z.string().min(1),
  key: z.string().nullable(),
  grams: z.number().positive(),
  cooked: z.boolean(),
  frying_medium: z.boolean(),
  note: z.string().nullable(),
});
const Record_ = z.object({
  // Otto originals live in the 9xxxxx range — far above TheMealDB's ids, still
  // numeric because SeedId requires /^\d+$/.
  id: z.string().regex(/^9\d{5}$/, "otto-original ids are 9xxxxx"),
  title: z.string().min(1),
  category: z.string().min(1),
  area: z.string().min(1),
  servings: z.number().int().positive(),
  instructions: z.array(z.string().min(1)).min(1),
  ingredients: z.array(Ingredient).min(1),
});

const records = z.array(Record_).min(1).parse(JSON.parse(readFileSync(input, "utf8")));

// key gate — the same allowlist rule the migration's zod gate enforced.
for (const r of records) {
  for (const i of r.ingredients) {
    if (i.key != null && !usda[i.key]) {
      throw new Error(`${r.id} "${r.title}": "${i.key}" is not a usdaTable key`);
    }
  }
}

// land into silver (append-only; existing ids are skipped, never overwritten —
// silver is the source of truth, edit it deliberately if a record must change).
const silver = JSON.parse(readFileSync(SILVER, "utf8"));
const have = new Set(silver.map((r) => r.id));
const now = new Date().toISOString();
const landed = [];
for (const r of records) {
  if (have.has(r.id)) { log(`skip ${r.id} "${r.title}" — already in silver`); continue; }
  landed.push({
    ...r,
    media: { image: null, youtube: null, source: null },
    provenance: { source: "otto", authored_at: now, canonicalized_at: now },
  });
}
if (!landed.length) { log("nothing new to land."); process.exit(0); }
writeFileSync(SILVER, JSON.stringify([...silver, ...landed], null, 2) + "\n");
log(`silver: +${landed.length} → ${silver.length + landed.length} records`);

// nutrition — the same engine path that computed the 792's seed_nutrition.
const { computeFromCanonical } = await import("./recompute-nutrition.mjs");
const esc = (s) => s.replace(/'/g, "''");
let sql = "";
for (const rec of landed) {
  const nutrition = computeFromCanonical(rec);
  if (!nutrition) {
    log(`WARN ${rec.id} "${rec.title}": engine refused (coverage/plausibility) — no seed_nutrition row; app will estimate`);
  }
  sql += `insert into otto_recipes (id, canonical, provenance) values ('${rec.id}', '${esc(JSON.stringify(rec))}'::jsonb, '${esc(JSON.stringify(rec.provenance))}'::jsonb) on conflict (id) do update set canonical = excluded.canonical, provenance = excluded.provenance, updated_at = now();\n`;
  if (nutrition) {
    sql += `insert into seed_nutrition (recipe_id, nutrition, computed_at) values ('${rec.id}', '${esc(JSON.stringify(nutrition))}'::jsonb, now()) on conflict (recipe_id) do update set nutrition = excluded.nutrition, computed_at = now();\n`;
    log(`  ${rec.id} "${rec.title}": ${nutrition.kcal} kcal/serving, ${nutrition.confidence}`);
  }
}
const sqlPath = input.replace(/\.json$/, "") + ".upsert.sql";
writeFileSync(sqlPath, sql);
log(`SQL → ${sqlPath}  (apply via Supabase MCP execute_sql)`);
