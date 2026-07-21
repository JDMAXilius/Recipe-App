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

  // --- Phase 22 sweep: rows found by audit-key-vs-record.mjs and by reading the
  // table for sibling keys that disagree (thai fish sauce was right, fish sauce
  // was not). Same failure mode throughout: a search that matched on one word.
  {
    keys: ["sardines"],
    query: "Fish, sardine, Atlantic, canned in oil, drained solids with bone",
    must: ["sardine", "atlantic", "canned"],
    not: ["fish oil", "pacific", "tomato sauce"],
    was: "Fish OIL, sardine (902 kcal — the oil, not the fish)",
  },
  {
    keys: ["streaky bacon"],
    query: "Pork, cured, bacon, unprepared",
    must: ["bacon", "unprepared"],
    not: ["salt pork", "cooked", "strips", "pre-sliced"],
    was: "Pork, cured, SALT PORK, raw (748 kcal — pure fatback)",
  },
  {
    keys: ["black pudding"],
    query: "Blood sausage",
    must: ["blood", "sausage"],
    not: ["blackberr", "smoked", "meatless"],
    was: "BLACKBERRIES, raw (43 kcal — matched on 'black')",
  },
  {
    keys: ["black olives"],
    query: "Olives, ripe, canned (small-extra large)",
    must: ["olives", "ripe", "canned"],
    not: ["blackberr", "green", "jumbo", "tomato"],
    was: "BLACKBERRY JUICE, canned (38 kcal — matched on 'black')",
  },
  {
    keys: ["grape leaves"],
    query: "Grape leaves, raw",
    must: ["grape", "leaves", "raw"],
    not: ["muscadine", "canned", "drumstick"],
    was: "GRAPES, muscadine, raw (the fruit, not the leaf)",
  },
  {
    keys: ["fries"],
    query: "Potatoes, french fried, all types, salt added in processing, frozen, unprepared",
    must: ["potatoes", "french", "fried", "unprepared"],
    not: ["sweet", "extruded", "cross", "wedge", "yellow", "oven"],
    was: "SWEET POTATO french fries (wrong vegetable)",
  },
  {
    keys: ["manchego"],
    query: "Cheese, romano",
    must: ["cheese", "romano"],
    not: ["milk", "spread", "bread"],
    was: "MILK, sheep, fluid (108 kcal — the milk, not the hard cheese)",
  },
  {
    keys: ["bryndza cheese"],
    query: "Cheese, feta",
    must: ["cheese", "feta"],
    not: ["milk", "spread", "crumbled"],
    was: "MILK, sheep, fluid (108 kcal — the milk, not the brined cheese)",
  },
  {
    keys: ["star anise"],
    query: "Spices, anise seed",
    must: ["spices", "anise"],
    not: ["mustard", "star"],
    was: "Spices, MUSTARD SEED, ground (a different spice entirely)",
  },
  {
    keys: ["yautia"],
    query: "Yautia (tannier), raw",
    must: ["yautia", "raw"],
    not: ["abiyuch"],
    was: "ABIYUCH, raw (an unrelated tropical fruit)",
  },
  {
    keys: ["mixed peel"],
    query: "Candied fruit",
    must: ["candied", "fruit"],
    not: ["babyfood", "snacks", "leather", "chocolate"],
    was: "BABYFOOD, mixed fruit yogurt, strained (matched on 'mixed fruit')",
  },
  {
    keys: ["lime juice"],
    query: "Lime juice, raw",
    must: ["lime", "juice", "raw"],
    not: ["lemon", "acerola", "grapefruit"],
    was: "LIMES, raw (the whole fruit, not the juice)",
  },
  {
    keys: ["gochujang"],
    query: "Miso",
    must: ["miso"],
    not: ["soup", "almond"],
    was: "Nuts, ALMOND PASTE (458 kcal — a search for 'paste' won)",
  },
  {
    keys: ["madras paste", "massaman curry paste"],
    query: "SMART SOUP, Thai Coconut Curry",
    must: ["thai", "curry"],
    not: ["almond", "powder", "tomato"],
    was: "Nuts, ALMOND PASTE (458 kcal); now matches the other curry-paste keys",
  },
  {
    keys: ["jerk"],
    query: "Spices, allspice, ground",
    must: ["allspice"],
    not: ["croutons", "cinnamon"],
    was: "CROUTONS, seasoned (465 kcal — not a seasoning)",
  },
  {
    keys: ["sausages"],
    query: "Sausage, Italian, pork, mild, raw",
    must: ["sausage", "pork", "raw"],
    not: ["turkey", "beef", "chorizo", "smoked", "cooked", "cured"],
    was: "Sausage, TURKEY, fresh, raw (155 kcal — a lean outlier as the generic)",
  },
  {
    keys: ["jamón ibérico", "parma ham", "serrano ham", "prosciutto"],
    query: "Pork, cured, ham, whole, separable lean and fat, unheated",
    must: ["cured", "ham", "whole", "separable lean and fat", "unheated"],
    not: ["patties", "water", "hormel", "juices", "center"],
    was: "HORMEL Cure 81 Ham (106 kcal) / ham PATTIES — wet-cured deli ham for a dry-cured one",
  },
  {
    keys: ["fish sauce"],
    query: "Sauce, fish, ready-to-serve",
    must: ["sauce", "fish", "ready"],
    not: ["bluefish", "cheese", "oyster", "cocktail", "plum"],
    was: "Fish, BLUEFISH, raw (124 kcal — the fish, not the sauce; 'thai fish sauce' was already right)",
  },
  {
    keys: ["fish stock"],
    query: "Soup, stock, fish, home-prepared",
    must: ["stock", "fish", "home"],
    not: ["sticks", "beef", "chicken"],
    was: "Fish, FISH STICKS, frozen, prepared (277 kcal for a stock)",
  },
  {
    keys: ["heavy cream"],
    query: "Cream, fluid, heavy whipping",
    must: ["cream", "heavy", "whipping"],
    not: ["shortening", "light", "sour"],
    was: "SHORTENING frying (HEAVY duty), palm (884 kcal — matched on 'heavy')",
  },
  {
    keys: ["cream cheese"],
    query: "Cheese, cream",
    must: ["cheese", "cream"],
    not: ["fat free", "low fat", "spread", "frosting", "cottage", "flavor"],
    was: "CREAM, fluid, light (coffee cream) — the dairy cream, not the cheese",
  },
  {
    keys: ["cream of tartar"],
    query: "Leavening agents, cream of tartar",
    must: ["cream of tartar"],
    not: ["fluid"],
    was: "CREAM, fluid, light (coffee cream) — matched on 'cream'",
  },
  {
    keys: ["chicken stock"],
    query: "Soup, chicken broth, ready-to-serve",
    must: ["chicken", "broth", "ready"],
    not: ["reduced", "vegetable", "rice", "chunky", "dry", "bouillon", "beef"],
    was: "CHICKEN, canned, no broth (185 kcal — canned chicken meat, not stock)",
  },
  {
    keys: ["chicken stock cube", "chicken stock concentrate"],
    query: "Soup, chicken broth or bouillon, dry",
    must: ["chicken", "bouillon", "dry"],
    not: ["ready", "canned, chunky"],
    was: "CHICKEN, canned, no broth (185 kcal — canned chicken meat, not a stock cube)",
  },
  {
    keys: ["beef stock"],
    query: "Soup, stock, beef, home-prepared",
    must: ["stock", "beef", "home"],
    not: ["mushroom", "fish", "chicken"],
    was: "Soup, beef broth, CUBED, DRY (170 kcal for a liquid stock; the cube keys keep that record)",
  },
  {
    keys: ["red pepper flakes"],
    query: "Spices, pepper, red or cayenne",
    must: ["spices", "pepper", "cayenne"],
    not: ["sweet", "black"],
    was: "Peppers, SWEET, red, RAW (26 kcal — fresh bell pepper for a dried flake)",
  },
  {
    keys: ["yeast"],
    query: "Leavening agents, yeast, baker's, active dry",
    must: ["yeast", "active dry"],
    not: ["compressed", "extract", "doughnut"],
    was: "YEAST EXTRACT SPREAD (Marmite, not baker's yeast)",
  },
  {
    keys: ["king prawns", "raw king prawns"],
    query: "Crustaceans, shrimp, raw",
    must: ["shrimp", "raw"],
    not: ["crab", "canned", "cooked", "breaded", "imitation"],
    was: "Crustaceans, CRAB, alaska KING, raw (matched on 'king')",
  },

  // --- TestFlight QA 2026-07-21 (steak & beetroot naan, fat 3x high): the
  // "lean" keys pointed at 70/30 — the OPPOSITE of lean. UK lean mince is
  // ≤10% fat, extra lean ≤5%; the recipe corpus writes "lean" meaning 5%.
  // Interim: both keys remapped in-table to the verified grass-fed row
  // (168652 → 168608, 12.7 g fat). This entry completes the repair to the
  // true 95/5 record when a USDA key is available.
  {
    keys: ["lean minced beef", "lean minced steak"],
    query: "Beef, ground, 95% lean meat / 5% fat, raw",
    must: ["beef", "ground", "95%", "raw"],
    not: ["cooked", "patty", "patties", "crumbles", "broiled", "pan"],
    was: "Beef, ground, 70% LEAN / 30% FAT, raw (332 kcal — the opposite of lean)",
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
