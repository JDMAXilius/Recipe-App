// Triage helper: recipes whose per-serving kcal reads high, from a fresh compute
// of the current canonical (post-pepper). Prints kcal / servings / total grams /
// grams-per-serving so we can tell "servings under-set" from "legitimately rich".
import { computeFromCanonical, loadSilver } from "./recompute-nutrition.mjs";

const FLOOR = Number(process.argv[2] ?? 1000);
const records = loadSilver();
const rows = [];
for (const rec of records) {
  const n = computeFromCanonical(rec);
  if (!n || typeof n.kcal !== "number") continue;
  if (n.kcal < FLOOR) continue;
  const totalG = (rec.ingredients || []).reduce((s, i) => s + (Number(i.grams) || 0), 0);
  const serv = Number(rec.servings) || 1;
  rows.push({ id: rec.id, title: rec.title, kcal: Math.round(n.kcal), servings: serv,
    totalG: Math.round(totalG), gPerServ: Math.round(totalG / serv),
    dens: totalG > 0 ? n.kcal / (totalG / serv) : 0 });
}
rows.sort((a, b) => b.dens - a.dens);
console.log(`${rows.length} recipes ≥ ${FLOOR} kcal/serving, sorted by energy density (kcal/g):\n`);
console.log("dens  kcal  serv  g/serv  id     title");
for (const r of rows) {
  const flag = r.dens > 3.2 ? " <-- over-count?" : "";
  console.log(
    `${r.dens.toFixed(2)}  ${String(r.kcal).padStart(4)}  ${String(r.servings).padStart(4)}  ${String(r.gPerServ).padStart(6)}  ${r.id.padEnd(6)} ${r.title}${flag}`,
  );
}
