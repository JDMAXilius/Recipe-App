// Resolve "1 <thing>" weights for the bare-count vocabulary TheMealDB actually
// uses, from USDA's own foodPortions where a whole-item portion exists.
//
// These are the lines that previously resolved to NO grams at all: "1 Chicken",
// "4 Pork Chops", "8 Prawns", "3 Lamb Leg". They were dropped from the calorie
// sum AND scored as doubt, so they hit the recipe twice.
//
// Only USDA-confirmed portions are written. Anything USDA can't confirm is
// reported for a human/Claude decision rather than guessed here.
//
//   USDA_API_KEY=... node scripts/build-item-weights.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portions, search, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const nutritionDir = path.join(here, "..", "src", "lib", "nutrition");
const table = JSON.parse(fs.readFileSync(path.join(nutritionDir, "usdaTable.json"), "utf8"));
const dest = path.join(nutritionDir, "pieceWeights.json");
const existing = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, "utf8")) : {};

// A whole-item portion, in USDA's wording. Ordered: the earlier a pattern, the
// stronger the preference (a "medium" beats a "cup, chopped").
// A MEASURE word here means the portion is a volume/mass, not one whole item —
// "1 cup", "1 tsp", "1 oz". Accepting those produced a 2 g ginger ("1 tsp") and
// a 134 g asparagus ("1 cup") on the first run. Checked before anything else.
const MEASURE =
  /\b(cups?|tsp|teaspoons?|tbsp|tablespoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|liters?|litres?|serving|servings|racc|quarts?|pints?|block|dash|pinch)\b/i;
// A STATE word means the portion was measured after a preparation that changes
// the mass ("1 cup sifted", "1 chicken, bone removed") — a different thing from
// the whole raw item the corpus counts.
const STATE = /\b(sifted|packed|cooked|chopped|diced|sliced|shredded|crumbled|stewed|drained|melted|removed)\b/i;
const WHOLE = [
  /^1 (medium|large|small)\b/i,
  /^1 (fruit|each|whole)\b/i,
  /^1 (fillet|chop|leg|thigh|breast|wing|drumstick|steak|link|patty|shank|lobster|muffin|pomegranate|avocado|beet|leek)\b/i,
  /^1 (piece|slice|leaf|stalk|clove|head|ear|sheet|almond|nut)\b/i,
  /^1 [a-z]+(?:\s*\(.*\))?$/i, // "1 beet", "1 pomegranate (4\" dia)"
];

// name = the pieceWeights key. verifiedPiece() singularises the ingredient text
// before matching, so keys are SINGULAR ("pork chop" matches "4 Pork Chops").
// key   = usdaTable key to take the fdcId from, when it differs from name.
// query = direct USDA search when the table has no usable row.
// fdcId = pinned record. Needed whenever the table's row is a nutrition PROXY
//         rather than the same physical object — the table's "chicken" is
//         ground chicken, which has no bird to weigh, and its "prunes" is prune
//         puree. Nutrition transfers by proxy; a piece weight does not.
// portion = required USDA wording, when the default WHOLE walk would pick the
//         wrong one. USDA lists sizes in arbitrary order, so without this a fig
//         silently became "1 large" (64 g) instead of the medium (50 g).
// each  = the portion covers N items ("6 medium" oysters); grams are divided.
const TARGETS = [
  { name: "ginger", query: "Ginger root, raw" },
  { name: "corn on the cob", key: "sweetcorn", query: "Corn, sweet, yellow, raw" },
  { name: "salmon" },
  { name: "cod" },
  { name: "mackerel" },
  { name: "herring" },
  { name: "trout" },
  { name: "sardines" },
  { name: "lobster" },
  { name: "radish" },
  { name: "mango" },
  { name: "strawberries" },
  { name: "pomegranate" },
  { name: "almonds" },
  { name: "swede", query: "Rutabagas, raw" },
  { name: "broccoli" },
  { name: "chicken wings", query: "Chicken, broilers or fryers, wing, meat and skin, raw" },
  { name: "coconut", query: "Nuts, coconut meat, raw" },

  // 2026-07-21 bare-count sweep. Each of these is a corpus line that resolved
  // to NO grams ("4 Pork Chops", "8 Oysters") — dropped from the sum AND
  // counted as doubt, so it hit the recipe's confidence twice.
  // Key is "whole chicken", NOT "chicken": a bare key matches by suffix, so
  // "5 boneless Chicken" (breasts) inherited the whole bird — 5230 g, and at
  // HIGH confidence, which is the one thing a verified row must never do.
  { name: "whole chicken", fdcId: 171047, portion: /^1 chicken$/i },
  { name: "pork chop", key: "pork chops", portion: /^1 chop without refuse/i },
  { name: "chicken drumstick", fdcId: 172373, portion: /^1 drumstick$/i },
  { name: "sweetcorn", fdcId: 169998, portion: /^1 ear, medium/i },
  { name: "dried apricot", key: "dried apricots", portion: /^1 half$/i },
  { name: "filo pastry", fdcId: 172791, portion: /^1 sheet dough$/i },
  { name: "phyllo dough", fdcId: 172791, portion: /^1 sheet dough$/i },
  // USDA's shrimp sizes stop at "large" (7 g). King/tiger prawns are a size
  // variant above that, so they are deliberately absent — see the report.
  { name: "prawn", fdcId: 174210, portion: /^1 medium$/i },
  { name: "shrimp", fdcId: 174210, portion: /^1 medium$/i },
  { name: "oyster", fdcId: 171978, portion: /^6 medium$/i, each: 6 },
  { name: "fig", key: "figs", portion: /^1 medium/i },
  { name: "prune", fdcId: 168162, portion: /^1 prune, pitted$/i },
  { name: "turnip", key: "turnips", portion: /^1 medium$/i },
  { name: "black olive", fdcId: 169094, portion: /^1 large$/i },
  { name: "english muffin", fdcId: 172828, portion: /^1 muffin$/i },
  { name: "taco shell", fdcId: 172800, portion: /^1 shell$/i },
  { name: "peaches", fdcId: 325415, portion: /^1 medium/i },
  { name: "pear", fdcId: 167776, portion: /^1 medium$/i },

  // 2026-07-21 doubt-mass sweep. Ranked by the grams these lines contribute to
  // the 286 medium-confidence recipes, biggest lever first. Every fdcId is
  // PINNED because usdaTable's rows for these keys are nutrition proxies or,
  // in one case, provenance that does not match the record (see the report):
  // "chicken thighs" carries fdcId 171077, which is the boneless BREAST.
  { name: "chicken thigh", fdcId: 172385, portion: /^1 thigh with skin$/i },
  { name: "pita bread", fdcId: 174915, portion: /^1 pita, large/i },
  { name: "sausage", fdcId: 171631, portion: /^1 link$/i },
  // "6 large Cabbage Leaves" was inheriting the whole-HEAD estimate (900 g per
  // leaf, 5400 g). USDA weighs the leaf itself; medium is the house convention
  // where USDA offers sizes and the corpus does not commit to one.
  { name: "cabbage leaf", fdcId: 169975, portion: /^1 leaf, medium$/i },

  // 2026-07-21 doubt-mass sweep, round 2. Every fdcId here is the SAME record
  // usdaTable already uses for that key, pinned so a concurrent table edit
  // cannot silently repoint a piece weight at a different food.
  { name: "avocado", fdcId: 171705, portion: /^1 avocado, NS as to/i },
  { name: "fennel", fdcId: 169385, portion: /^1 bulb$/i },
  // "1 sliced Fennel Bulb" ends in "bulb", and verifiedPiece matches a key by
  // SUFFIX — "fennel bulb" does not end in " fennel", so the bare key misses it.
  { name: "fennel bulb", fdcId: 169385, portion: /^1 bulb$/i },
  // "plum" is a SIZE_QUALIFIER, so these lines deliberately cannot inherit the
  // 123 g generic tomato. USDA publishes the plum tomato itself, at half that.
  { name: "plum tomato", fdcId: 170457, portion: /^1 plum tomato$/i },
  // "8 Sun-Dried Tomatoes" was 960 g — 120 g apiece, a FRESH tomato's weight for
  // something the size of a coin. USDA's piece is 2 g.
  { name: "sun-dried tomato", fdcId: 168567, portion: /^1 piece$/i },
];

// DELIBERATELY ABSENT (checked, USDA publishes no usable whole-item portion —
// the line keeps its estimate and its honest "medium" flag rather than a guess):
//   lamb leg / lamb loin chops / lamb shanks / lamb kidney / pigs trotters /
//     beef brisket — oz, lb, "1 serving", or a per-pound cooked yield only.
//   duck legs — only "1 leg, bone removed (yield after cooking)", a cooked mass.
//   sirloin steak — "1 steak" is 608 g (a whole retail top sirloin); the corpus
//     means a sandwich slice ("8 Sirloin steak"), so the record is the wrong
//     physical object, not just the wrong size.
//   beef cutlet — the table's proxy is a 344 g top round steak, not a cutlet.
//   king/tiger prawns — USDA's largest shrimp portion is "4 large" (7 g each);
//     a king prawn is a size ABOVE the record, so it must not inherit it.
//   salmon / pork — "0.5 fillet" (a whole side) and "1 roast"; the corpus
//     count ("2 Salmon", "2 Pork") means neither.
//   walnuts / parsnips / celeriac / bay leaf / cloves / cardamom / star anise —
//     cup or tsp/tbsp only. Bay leaf alone is 60 corpus lines; USDA publishes
//     only "1 tsp, crumbled", so it stays unresolved.
//   tofu — "0.25 block"; block size is not a defined quantity.
//   asparagus — "1 spear, medium" exists, but "1 Asparagus" in the corpus is
//     as likely to mean a bunch as a spear.
//   breadfruit — only "0.25 fruit, small"; scaling a quarter of a SMALL fruit
//     up to a generic one compounds two assumptions.
//   gelatine leafs / rice paper sheets / meringue nests — no USDA portion.
//   baguette — "Bread, french or vienna" publishes "1 oz" and "1 slice" (139 g)
//     only. A slice is not a loaf, and the corpus doubt is "1 Baguette".
//   coconut milk — "1 tbsp" and "1 cup", both volumes. The 2800 g of doubt is
//     "1 can Coconut Milk"; USDA does not publish a can.
//   chicken leg — 172378's only whole-item portion is "1 leg, with skin (Sum of
//     drumstick+thigh+back)" = 344 g: a leg QUARTER with the back still on, not
//     the drumstick-and-thigh a cook buys. At 344 g, "8 Chicken Legs" is 2.75 kg
//     and Creamy Mustard Chicken passes the 700 g/serving plausibility cap and
//     REFUSES to answer — a verified-but-wrong object costs more than the
//     honest 150 g estimate it would replace.
//   chicken breast — USDA counts a BREAST as both halves. 171077 (skinless,
//     boneless) publishes "1 piece" = 272 g, and 171474 (meat and skin) offers
//     only "0.5 breast, bone removed" = 145 g. Both describe the whole double
//     breast; a recipe's "2 Chicken Breasts" means two FILLETS, i.e. two of
//     USDA's halves. Same food, different physical object — the same trap as
//     "1 almond" vs "1 almond flour". Taking 272 g pushed 18 recipes to
//     850–1200 kcal/serving and tipped Creamy Mustard Chicken past the
//     plausibility cap into refusing outright. The 170 g estimate stays.
//   shallot — unchanged: still only "1 tbsp chopped".
//   potatoes — the remaining doubt is NOT a piece weight ("5 Cups Potatoes",
//     "1/2 cup Potatoes" fall to the default 1.0 density); "1 medium" is
//     already verified at 213 g. Belongs in cupWeights, not here.
//   spring onions — likewise: every bare count already resolves through the
//     verified 5 g row. The doubt is "1 bunch" / "Bunch", and USDA publishes no
//     bunch portion.
//   bacon — already verified at 28 g, but the row is keyed to unit "slice" so
//     the bare "4 Bacon" form cannot reach it. Not a USDA gap; see the report.
//
// 2026-07-21 round 2 refusals:
//   squash / butternut squash — the single biggest block of doubt (5850 g over
//     6 recipes) and USDA simply does not publish a whole one. "Squash, winter,
//     all varieties, raw" (170489, the record the table uses) offers ONLY
//     "1 cup, cubes" = 116 g; butternut (169295) likewise. Summer squash
//     (170487) does publish "1 medium" = 196 g, but that is the other vegetable
//     — the corpus's bare "Squash" is winter/pumpkin in 3 of its 4 recipes, and
//     borrowing a summer-squash piece for a winter-squash record is the cherry-
//     tomato mistake in reverse. Stays estimated.
//   broccoli — 170379 publishes "1 bunch" = 608 g and "1 stalk" = 151 g, and the
//     corpus asks for "1 head". A USDA bunch is FOUR stalks; a head is one crown.
//     Neither portion names the object, and the standing 600 g estimate already
//     sits between them, so verifying here would buy a confidence flag with a
//     guess about what "bunch" means. (Note also: usdaTable's broccoli row points
//     at 747447, a Foundation record whose detail endpoint returns an empty body
//     — see the report.)
//   shortcrust pastry — 172814 publishes "1 crust, single 9"" = 194 g. The one
//     doubtful line is "4 Shortcrust Pastry" (Classic Tourtière); a tourtière is
//     one double-crust pie, so "4" is not 4 nine-inch crusts. Unknown object.
//   coriander / spring onions — the remaining doubt is "Bunch", "Small bunch",
//     "Handful", "Packet". USDA publishes "9 sprigs" and "0.25 cup" for cilantro
//     and nothing bunch-shaped for scallions; both already have a verified
//     per-sprig / per-onion row, which is all USDA can support.
//   shallot — re-checked, unchanged: 170499 has "1 tbsp chopped" only, and the
//     Foundation row (2727586) has "1 RACC" = 85 g, which is a serving size, not
//     a shallot.
//   baguette — re-checked, unchanged.
//   egg plant / eggplant — BUILT, TESTED, BACKED OUT (the chicken-breast test).
//     169228 publishes "1 eggplant, unpeeled (approx 1-1/4 lb)" = 548 g, and the
//     key already exists under the other spelling: "aubergine" has shipped at
//     548 g since the first sweep, so the same vegetable is 548 g written one way
//     and 50 g written the other. Adding it flipped 5 recipes to measured and
//     moved their kcal the RIGHT way (Tortang Talong 89 -> 213, Baba Ghanoush
//     93 -> 155 — 50 g was never a credible eggplant). But USDA's 548 g is the
//     American globe eggplant, and the corpus's lines are "6 small Egg Plants"
//     (3288 g) and "4 Egg Plants" for a two-egg Filipino omelette. Replayed
//     WITHOUT curated facts — the path every user recipe takes, where the 700
//     g/serving cap is live — three recipes stopped answering at all: Roasted
//     Eggplant With Tahini, Grilled eggplant with coconut milk, and Antiguan
//     Breakfast. Same verdict as chicken breast: a right-sized estimate beats a
//     verified weight for the wrong-sized object. (The 548 g "aubergine" row
//     predates this and has the same problem — see the report.)

const out = { ...existing };
const unresolved = [];

for (const t of TARGETS) {
  const { name, key: tableKey, query } = t;
  if (out[name]) continue;
  let fdcId = t.fdcId ?? table[tableKey || name]?.fdcId;
  let desc = table[tableKey || name]?.usda;
  if (!fdcId && query) {
    try {
      const foods = await search(query);
      if (foods[0]) {
        fdcId = foods[0].fdcId;
        desc = foods[0].description;
      }
    } catch {
      /* fall through to unresolved */
    }
    await sleep(1100);
  }
  if (!fdcId) {
    unresolved.push(`${name}: no fdcId (table key "${tableKey || name}" absent, query ${query ? "failed" : "not given"})`);
    continue;
  }
  let info;
  try {
    info = await portions(fdcId);
  } catch (e) {
    unresolved.push(`${name}: portions fetch failed (${e.message})`);
    continue;
  }
  // The MEASURE test reads the label with any parenthetical STRIPPED. USDA puts
  // the size of a whole item in brackets — "1 eggplant, unpeeled (approx
  // 1-1/4 lb)", "1 pomegranate (4" dia)" — and that "lb" is describing the
  // eggplant, not replacing it with a mass. What the guard is for is a label
  // that IS a measure ("1 cup", "1 tsp"), and those say so outside the brackets,
  // so this narrows the guard to where it bites without opening it up. STATE
  // still reads the whole label.
  const bare = (l) => l.replace(/\([^)]*\)/g, " ");
  const candidates = info.list.filter((p) => !MEASURE.test(bare(p.label)) && !STATE.test(p.label));
  let hit = null;
  if (t.portion) {
    hit = candidates.find((p) => t.portion.test(p.label));
  } else {
    for (const pat of WHOLE) {
      hit = candidates.find((p) => pat.test(p.label));
      if (hit) break;
    }
  }
  if (!hit) {
    unresolved.push(`${name}: no whole-item portion — had [${info.list.map((p) => p.label).join(" | ") || "none"}]`);
  } else {
    out[name] = {
      grams: t.each ? Math.round((hit.grams / t.each) * 10) / 10 : hit.grams,
      unit: null,
      fdcId,
      usda: info.description || desc,
      portion: hit.label,
      source: "usda-foodportion",
    };
    console.log(`✓ ${name.padEnd(22)} ${String(out[name].grams).padStart(6)} g  (${hit.label} — ${info.description})`);
  }
  await sleep(1100);
}

console.log(`\nresolved ${Object.keys(out).length - Object.keys(existing).length} new (${Object.keys(out).length} total)`);
if (unresolved.length) console.log(`\nUNRESOLVED — need a decision, not a guess (${unresolved.length}):\n  ` + unresolved.join("\n  "));

if (!process.argv.includes("--dry")) {
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${dest}`);
}
