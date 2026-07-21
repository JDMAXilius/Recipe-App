// Repair usdaTable rows whose fdcId points at the WRONG FOOD.
//
// Same class of bug as the N3 sweep (chicken thighs → chicken skin): the row
// carries real USDA numbers, so nothing looks broken, but they describe a
// different food. Found by the piece-weight verification pass — a "zucchini"
// whose USDA portion is 11 g is not a zucchini, it's a baby zucchini.
//
// A repair is only applied when the candidate is CONFIRMED: exact description
// match, or every required word present and no forbidden word. There is no
// "first result wins" fallback — that is how "sweet potato" became "Sweet
// Potato puffs, frozen" on the first draft of this script.
//
//   USDA_API_KEY=... node scripts/fix-table-identities.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { search, macrosOf, tableRow, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const tablePath = path.join(here, "..", "src", "lib", "nutrition", "usdaTable.json");
const table = JSON.parse(fs.readFileSync(tablePath, "utf8"));

// `must` — every word required in the description. `not` — any word disqualifies.
// Together they are the honesty guard: no confirmation, no write.
const REPAIRS = [
  {
    keys: ["zucchini"],
    query: "Squash, summer, zucchini, includes skin, raw",
    must: ["zucchini", "raw"],
    not: ["baby", "cooked", "canned"],
    was: "baby zucchini (11 g/piece — not a zucchini)",
  },
  {
    keys: ["sweet potatoes", "sweet potato"],
    query: "Sweet potato, raw, unprepared",
    must: ["sweet", "potato", "raw"],
    not: ["leaves", "puffs", "frozen", "canned", "cooked", "chips"],
    was: "SWEET POTATO LEAVES (the wrong plant part)",
  },
  {
    keys: ["chicken breast", "chicken breasts"],
    query: "Chicken, broilers or fryers, breast, meat only, raw",
    must: ["chicken", "breast", "raw"],
    not: ["ground", "cooked", "roasted", "fried", "canned"],
    was: "Chicken, GROUND, raw",
  },
  {
    keys: ["green pepper", "green peppers"],
    query: "Peppers, sweet, green, raw",
    must: ["peppers", "green", "raw"],
    not: ["beet", "greens,", "chili", "hot"],
    was: "BEET GREENS, raw (not a pepper at all)",
  },
  {
    keys: ["tomato", "tomatoes"],
    query: "Tomatoes, red, ripe, raw, year round average",
    must: ["tomatoes", "red", "raw"],
    not: ["grape", "cherry", "canned", "sun-dried", "juice", "paste", "sauce"],
    was: "Tomatoes, GRAPE, raw (a cherry-sized tomato as the generic)",
  },
  {
    keys: ["corn tortillas"],
    query: "Tortillas, ready-to-bake or -fry, corn",
    must: ["tortillas", "corn"],
    not: ["corned beef", "mix", "flour"],
    was: "Corned beef and potatoes in tortilla (Apache)",
  },
  {
    keys: ["flour tortilla"],
    query: "Tortillas, ready-to-bake or -fry, flour",
    must: ["tortillas", "flour"],
    not: ["mix", "corn"],
    was: "Wheat flour, white, tortilla MIX (a dry mix, not the tortilla)",
  },
];

const ok = (desc, r) => {
  const d = desc.toLowerCase();
  return r.must.every((w) => d.includes(w)) && !r.not.some((w) => d.includes(w));
};

const changed = [];
const skipped = [];
for (const r of REPAIRS) {
  let foods = [];
  try {
    foods = await search(r.query);
  } catch (e) {
    skipped.push(`${r.keys[0]}: USDA search failed (${e.message})`);
    continue;
  }
  const exact = foods.find((f) => f.description.toLowerCase() === r.query.toLowerCase());
  const food = exact || foods.find((f) => ok(f.description, r));
  if (!food) {
    skipped.push(
      `${r.keys[0]}: nothing confirmed for "${r.query}" — saw [${foods.slice(0, 4).map((f) => f.description).join(" | ")}]`
    );
    continue;
  }
  const macros = macrosOf(food);
  if (!Number.isFinite(macros.kcal)) {
    skipped.push(`${r.keys[0]}: ${food.description} carries no KCAL energy row`);
    continue;
  }
  const row = tableRow(food, macros);
  for (const k of r.keys) {
    const before = table[k];
    table[k] = { ...row };
    changed.push(`${k}: ${before ? before.usda : "(new key)"} → ${row.usda}`);
  }
  console.log(`✓ ${r.keys.join(", ")}`);
  console.log(`    was: ${r.was}`);
  console.log(`    now: ${row.usda} — ${row.kcal} kcal/100g, fdcId ${row.fdcId}`);
  await sleep(1300);
}

console.log(`\n${changed.length} keys repaired, ${skipped.length} left alone`);
if (skipped.length) console.log("NOT CONFIRMED (unchanged, on purpose):\n  " + skipped.join("\n  "));

if (!process.argv.includes("--dry") && changed.length) {
  fs.writeFileSync(tablePath, JSON.stringify(table, null, 2) + "\n");
  console.log("wrote usdaTable.json");
}
