// Apply the canonicalizer's 3 verified servings/grams corrections to the silver
// file, by (recipe id + ingredient key), asserting each target exists. --apply
// writes; default prints the before/after. Idempotent (targets a specific value).
import { readFileSync, writeFileSync } from "node:fs";

const PATH = new URL("../supabase/otto-recipes/canonical/recipes.json", import.meta.url);
const recs = JSON.parse(readFileSync(PATH));
const byId = (id) => recs.find((r) => r.id === id) ?? (() => { throw new Error(`no recipe ${id}`); })();

const changes = [];
function setServings(id, to) {
  const r = byId(id);
  changes.push(`${id} ${r.title}: servings ${r.servings} -> ${to}`);
  r.servings = to;
}
// Match on key AND current grams (`from`) so a recipe with two lines sharing a
// key — e.g. Lamingtons' 16g filling vs 400g coating icing sugar — is unambiguous.
function setGrams(id, key, from, to) {
  const r = byId(id);
  const hits = r.ingredients.filter((i) => i.key === key && i.grams === from);
  if (hits.length !== 1) throw new Error(`${id}: expected exactly one "${key}" @${from}g, found ${hits.length}`);
  changes.push(`${id} ${r.title}: "${key}" grams ${from} -> ${to}`);
  hits[0].grams = to;
}

// Ensaimada — 4 spirals cut & shared → 8 honest servings (yield: "cut into four", then "cut into pieces to serve")
setServings("53149", 8);
// Chinon Apple Tarts — puff pastry is the shop pack; only two 13cm circles used (~100g of the sheet)
setGrams("52910", "puff pastry", 320, 100);
// Lamingtons — coating prep-excess counted as eaten: coconut rolling bowls + icing dip batch (drips off)
setGrams("53104", "desiccated coconut", 350, 120);
setGrams("53104", "icing sugar", 400, 200); // the 400g coating batch, NOT the 16g cream-filling line

for (const c of changes) console.log("  " + c);
if (process.argv.includes("--apply")) {
  writeFileSync(PATH, JSON.stringify(recs, null, 2) + "\n");
  console.log("\nwritten.");
} else {
  console.log("\n(dry-run — pass --apply to write)");
}
