// Write docs/NOT_HIGH_RECIPES.md — every catalogue recipe not at high
// confidence, with its ingredient lines and why each line falls short.
//
// These are the recipes whose totals are INCOMPLETE (an ingredient could not be
// resolved to a USDA record), as opposed to merely approximate. A recipe whose
// only issue is an inferred amount still reads high, because its total is whole.
//
//   node --env-file=.env scripts/report-not-high.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { parseIngredientLine } from "../src/lib/nutrition/parseIngredient.js";
import { lookup, isNegligible } from "../src/lib/nutrition/usdaProvider.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false, max: 1 });

const rows = await sql`
  select recipe_id, nutrition from seed_nutrition
  where nutrition->>'confidence' in ('low','medium')
     or nutrition->>'confidence' is null
  order by nutrition->>'confidence' nulls last, recipe_id`;
const dist = await sql`
  select coalesce(nutrition->>'confidence','unknown') c, count(*)
  from seed_nutrition group by 1 order by 2 desc`;
const total = dist.reduce((a, d) => a + Number(d.count), 0);
const tally = Object.fromEntries(dist.map((d) => [d.c, d.count]));

const corpus = path.join(here, "corpus");
const byId = new Map();
for (const f of fs.readdirSync(corpus).filter((x) => x.endsWith(".json")))
  for (const m of JSON.parse(fs.readFileSync(path.join(corpus, f), "utf8")).meals || [])
    byId.set(m.idMeal, m);
const facts = JSON.parse(fs.readFileSync(path.join(here, "..", "src", "lib", "nutrition", "recipeFacts.json"), "utf8"));

const o = [];
o.push("# Otto — Recipes not at high confidence");
o.push("");
o.push(`Generated ${new Date().toISOString().slice(0, 10)} from production \`seed_nutrition\`.`);
o.push("");
o.push(
  `Production: **${tally.high || 0} high · ${tally.medium || 0} medium · ${tally.low || 0} low` +
    `${tally.unknown ? ` · ${tally.unknown} unknown` : ""}** of ${total} recipes.`
);
o.push("");
o.push(`These **${rows.length}** are everything not at high. Each has at least one ingredient that`);
o.push("could not be resolved to a USDA record, so its total is **incomplete** rather than merely");
o.push("approximate. That is the dividing line: a recipe whose only issue is an inferred AMOUNT");
o.push("still reads high, because nothing is missing from its number.");
o.push("");
o.push("**Note** column:");
o.push("");
o.push("- `no USDA food` — no matching record; the line is dropped from the total");
o.push("- `no amount` — the recipe never stated one; a conservative typical amount was used");
o.push("- `est. weight` — a bare count whose piece weight is Otto's estimate, not a USDA portion");
o.push("- blank — measured: exact, or a USDA-verified portion");
o.push("");
o.push("---");
o.push("");

let i = 1;
for (const r of rows) {
  const id = String(r.recipe_id);
  const n = r.nutrition || {};
  const m = byId.get(id);
  o.push(`## ${i++}. ${m ? m.strMeal : `(recipe id ${id})`} — \`${n.confidence || "unknown"}\``);
  o.push("");
  if (!m) {
    o.push("_Added to TheMealDB after our cached corpus snapshot; ingredient lines not available offline._");
    o.push("");
    continue;
  }
  const meta = [];
  if (m.strCategory) meta.push(`**Category:** ${m.strCategory}`);
  if (m.strArea) meta.push(`**Cuisine:** ${m.strArea}`);
  if (facts[id]) meta.push(`**Serves:** ${facts[id].servings}`);
  if (n.kcal != null) meta.push(`**${n.kcal} kcal/serving**`);
  if (n.basis) meta.push(`**basis:** ${n.basis}`);
  o.push(meta.join(" · "));
  o.push("");
  o.push("| Amount | Ingredient | Note |");
  o.push("|---|---|---|");
  for (let k = 1; k <= 20; k++) {
    const ing = (m[`strIngredient${k}`] || "").trim();
    const me = (m[`strMeasure${k}`] || "").trim();
    if (!ing) continue;
    const p = parseIngredientLine({ measure: me, name: ing });
    const food = lookup(ing, p.item, false);
    let note = "";
    if (!isNegligible({ name: ing, measure: me, parsed: p, food })) {
      if (!food) note = "**no USDA food**";
      else if (!(p.grams > 0)) note = "no amount";
      else if (p.confidence !== "high") note = "est. weight";
    }
    o.push(`| ${me || "_not stated_"} | ${ing} | ${note} |`);
  }
  o.push("");
}

const dest = path.join(here, "..", "..", "docs", "NOT_HIGH_RECIPES.md");
fs.writeFileSync(dest, o.join("\n"));
console.log(`wrote ${dest} — ${rows.length} recipes`);
process.exit(0);
