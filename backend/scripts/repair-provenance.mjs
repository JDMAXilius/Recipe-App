// Apply the fixes the provenance audit found.
//
//  id-wrong   → the description+numbers are right but the fdcId belongs to a
//               different food ("white wine vinegar" carried peanut butter's
//               id). Re-point the id by searching the stored description, and
//               only accept a record whose description actually matches.
//  data-stale → id and description agree; our stored numbers drifted from the
//               live record (espresso was stored from a search result at 36
//               kcal; the detail endpoint says 9). The detail endpoint wins.
//
//   USDA_API_KEY=... node scripts/repair-provenance.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { search, detail, macrosOf, tableRow, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const tablePath = path.join(here, "..", "src", "lib", "nutrition", "usdaTable.json");
const table = JSON.parse(fs.readFileSync(tablePath, "utf8"));
const cache = JSON.parse(fs.readFileSync(path.join(here, "provenance-cache-main.json"), "utf8"));

const STOP = new Set(["raw","fresh","all","commercial","varieties","includes","and","or","with","without","the","of","year","round","average","unprepared","prepared","type","commercially","plain"]);
const words = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const overlap = (a, b) => {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size);
};

const applied = [];
const refused = [];

for (const entry of Object.values(cache)) {
  if (entry.verdict === "id-wrong") {
    let foods = [];
    try {
      foods = await search(entry.stored);
    } catch (e) {
      refused.push(`${entry.keys[0]}: search failed (${e.message})`);
      continue;
    }
    await sleep(1200);
    const exact = foods.find((f) => f.description.toLowerCase() === String(entry.stored).toLowerCase());
    const near = foods.find((f) => overlap(entry.stored, f.description) >= 0.8);
    const food = exact || near;
    if (!food) {
      refused.push(`${entry.keys[0]}: no record matches "${entry.stored}" — saw [${foods.slice(0, 3).map((f) => f.description).join(" | ")}]`);
      continue;
    }
    const macros = macrosOf(food);
    if (!Number.isFinite(macros.kcal)) {
      refused.push(`${entry.keys[0]}: ${food.description} has no KCAL row`);
      continue;
    }
    const row = tableRow(food, macros);
    for (const k of entry.keys) table[k] = { ...row };
    applied.push(`id-wrong  ${entry.keys.join("/")}: id ${entry.keys.length && table[entry.keys[0]].fdcId} now ${row.usda} (${row.kcal} kcal)`);
  }

  if (entry.verdict === "data-stale") {
    const id = Object.keys(cache).find((k) => cache[k] === entry);
    let food;
    try {
      food = await detail(id);
    } catch (e) {
      refused.push(`${entry.keys[0]}: detail fetch failed (${e.message})`);
      continue;
    }
    await sleep(1200);
    // Only refresh numbers when the record is still the SAME food.
    if (overlap(entry.stored, food.description || "") < 0.6) {
      refused.push(`${entry.keys[0]}: live record drifted identity, not just numbers — left for review`);
      continue;
    }
    const macros = macrosOf(food);
    if (!Number.isFinite(macros.kcal)) {
      refused.push(`${entry.keys[0]}: live record has no KCAL row`);
      continue;
    }
    const row = tableRow({ fdcId: Number(id), description: food.description }, macros);
    for (const k of entry.keys) table[k] = { ...row };
    applied.push(`stale     ${entry.keys.join("/")}: ${entry.storedKcal} → ${row.kcal} kcal (${row.usda})`);
  }
}

console.log(applied.length ? applied.join("\n") : "nothing to apply");
if (refused.length) console.log(`\nREFUSED (unchanged on purpose):\n  ${refused.join("\n  ")}`);
if (!process.argv.includes("--dry") && applied.length) {
  fs.writeFileSync(tablePath, JSON.stringify(table, null, 2) + "\n");
  console.log("\nwrote usdaTable.json");
}
