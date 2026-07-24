// Per-ingredient kcal breakdown for a single recipe id — to see WHICH line drives
// an implausible total (over-counted grams / wrong key / missing frying flag).
import { readFileSync } from "node:fs";
import { computeFromCanonical } from "./recompute-nutrition.mjs";
import usdaTable from "../src/features/nutrition/engine/data/usdaTable.json" with { type: "json" };
import cookedTable from "../src/features/nutrition/engine/data/usdaCookedTable.json" with { type: "json" };

const id = process.argv[2];
const recs = JSON.parse(readFileSync(new URL("../supabase/otto-recipes/canonical/recipes.json", import.meta.url)));
const rec = recs.find((r) => r.id === id);
if (!rec) throw new Error(`no recipe ${id}`);
const total = computeFromCanonical(rec);
console.log(`${rec.title}  (servings ${rec.servings}) → ${Math.round(total.kcal)} kcal/serving\n`);
console.log("kcal/100g  grams  cooked fry  key");
for (const i of rec.ingredients) {
  const t = i.cooked ? cookedTable[i.key] : usdaTable[i.key];
  const per = t?.kcal ?? (usdaTable[i.key]?.kcal);
  const contrib = per != null && i.grams != null ? Math.round((per * i.grams) / 100) : "?";
  console.log(
    `${String(per ?? "MISS").padStart(9)}  ${String(i.grams ?? "·").padStart(5)}  ${String(!!i.cooked).padStart(6)} ${String(!!i.frying_medium).padStart(3)}  ${i.key}  (${contrib} kcal total)`,
  );
}
