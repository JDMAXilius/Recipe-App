// B1.7 — USDA nutrition provider. Same seam, same contract as the (now
// retired) Edamam adapters; only the source of the numbers differs.
//
// Why USDA won: FoodData Central is public domain (CC0 1.0), so its values can
// be stored, shipped and redistributed. Edamam could not be: Food DB Enterprise
// Basic permits caching "FoodId, Food Label" ONLY, and all plans forbid
// "automated programatic requests with the goal to collect, scrape or save
// data". Otto's whole design is a permanent per-recipe cache, so that plan was
// unusable at any price. USDA also happens to be free.
//
// Shape: usdaTable.json resolves TheMealDB's 961 ingredient names to real USDA
// food records (built once by scripts/build-usda-table.mjs, each row carrying
// its fdcId). parseIngredient.js owns qty→grams, as it already does for scaling
// and shopping. Nutrition is then grams x per-100g values — plain arithmetic.
//
// The consequence worth stating: ZERO network calls at runtime. A recipe view
// costs nothing, cannot be rate limited, and cannot break because a vendor is
// down or a subscription lapsed. It works for user-created recipes too, as long
// as their ingredient names resolve.
//
// Attribution: USDA asks that FoodData Central be credited as the data source.
// Otto surfaces this alongside its TheMealDB credit.
import { parseIngredientLine } from "./parseIngredient.js";
import table from "./usdaTable.json" with { type: "json" };
import recipeFacts from "./recipeFacts.json" with { type: "json" };
import cookedTable from "./usdaCookedTable.json" with { type: "json" };

// recipeFacts.json — the two things TheMealDB does not tell us, read once from
// each recipe's own instructions and committed as static data:
//
//   servings : never stated anywhere in the API. A flat default of 4 divided
//              "2kg Shredded Meat" into a 1200 kcal/serving card. Judged from
//              the ingredient quantities and dish type.
//   cooked   : which lines are ALREADY cooked when added. The lines never say,
//              but the instructions do — "add the cooked vegetables and rice"
//              means raw brown rice (360 kcal/100g) is wrong and cooked (123)
//              is right. That single line was a 3x error.
//
// This is a language judgement, not a number: the facts only choose WHICH USDA
// record applies and how many the pot feeds. Every calorie still comes from
// USDA, and any recipe missing from this file falls back to the old guards.
const factsFor = (id) => (id ? recipeFacts[String(id)] : null);

const round = (n, dp = 0) =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

const key = (s) => String(s || "").trim().toLowerCase();

// RAW-vs-COOKED GUARD.
//
// "3 cups brown rice" does not say whether the rice is raw or cooked, and the
// two differ ~3x (brown rice: 360 kcal/100g raw, 123 cooked). The table holds
// the raw record, which is right when a recipe cooks the grain and wrong when
// it assembles one already cooked. TheMealDB 52772 is the latter — its
// instructions say "add the cooked vegetables and rice" — and we shipped 789
// kcal/serving against a true ~415. The category estimate (~400) was closer.
//
// Nothing in an ingredient LINE resolves this; only the instructions do. And
// the parser rates these lines "high" confidence (the grams are fine — it is
// the food identity that is wrong), so the confidence field cannot warn about
// it. That makes it the one failure the honesty law most forbids: silently,
// confidently wrong.
//
// So refuse the recipe instead. null means "honestly unknown" and the UI falls
// back to the ~category estimate, which is cruder but not a fabrication.
// Deliberately whole-recipe, not per-line: dropping the grain would understate
// the total by more than the estimate errs.
//
// ponytail: a blunt guard. The real fix reads the instructions ("add the
// cooked rice") and picks the cooked record — that is an LLM-shaped language
// task with USDA still supplying every number, and it needs a key + budget.
const AMBIGUOUS_GRAIN =
  /\b(rice|pasta|spaghetti|macaroni|noodles?|penne|rigatoni|tagliatelle|fettuccine|linguine|farfalle|couscous|quinoa|bulgur|orzo|barley|farro|lentils?|oats|polenta|grits)\b/i;
const VOLUME_MEASURE = /\b(cups?|c\.)\b/i;

// Same trap in legumes: the table holds DRY beans (black beans, 341 kcal/100g)
// but "1 Can Black Beans" is cooked and drained (~91). Arepa Pabellón read
// 1364 kcal off one bean line alone. A can/tin measure means cooked; the table
// row does not, and it cannot vary per line.
const LEGUME = /\b(beans?|chickpeas?|lentils?|peas)\b/i;
const CANNED_MEASURE = /\b(cans?|tins?|tinned|canned)\b/i;

// A grain measured by VOLUME is the high-risk shape: "3 cups rice" reads
// naturally as either. Weight ("400g rice") almost always means raw in a
// recipe, so it is left alone rather than nulling half the catalogue.
function hasAmbiguousGrain(list) {
  return list.some((p) => {
    const name = String(p.name || "");
    const measure = String(p.measure || "");
    if (AMBIGUOUS_GRAIN.test(name) && VOLUME_MEASURE.test(measure)) return true;
    if (LEGUME.test(name) && CANNED_MEASURE.test(measure)) return true;
    return false;
  });
}

// TheMealDB ships no servings field, so callers pass a flat default of 4. That
// is fine for a weeknight dinner and nonsense for a party dish: Arepa Pabellón
// lists "2kg Shredded Meat", which at 4 servings implies 500g of meat per
// person and produced a 1200 kcal/serving card.
//
// There is no signal in the data to tell us the real yield, so treat an
// implausible per-serving weight as proof the assumption broke. ~700g of total
// ingredients per serving is already a very large plate; beyond that we are
// dividing by the wrong number and should say we don't know.
const MAX_PLAUSIBLE_SERVING_GRAMS = 700;

// Human range for one serving of one dish. Anything outside it means the inputs
// were broken, not that the food is remarkable.
const MIN_PLAUSIBLE_KCAL = 40;
const MAX_PLAUSIBLE_KCAL = 1500;

// SEASONING IS NOT DOUBT.
//
// Measured over the seed catalogue 2026-07-19: 78.5% of recipes read "low" and
// only 2.4% "high" — a signal that never varies carries no information. The
// cause was not bad data. 99.4% of ingredient lines matched a USDA record; what
// failed to resolve was overwhelmingly "To taste Salt" and "To taste Pepper",
// which are unquantifiable BY NATURE and contribute ~no calories either way.
//
// The old formula divided by every line, so an unknowable pinch of salt scored
// exactly as much doubt as a missing cup of flour. That reported the ESTIMATE as
// poor when only the salt was unknown — the opposite of honest.
//
// So these lines are excluded from the confidence metric entirely. They are NOT
// excluded from the nutrition sum: if one resolves, its grams still count. Only
// the guard on quantity keeps this narrow — a garnish of parsley is negligible,
// 500g of spinach is a real ingredient and is scored like one.
const NEGLIGIBLE =
  /\b(salt|pepper|peppercorns?|seasoning|spices?|herbs?|parsley|cilantro|coriander|basil|thyme|rosemary|oregano|sage|mint|dill|chives|bay leaf|bay leaves|garnish|zest|vanilla extract|food colou?ring)\b/i;
const NEGLIGIBLE_MAX_G = 15;

function isNegligible(row) {
  if (!NEGLIGIBLE.test(row.name || "") && !NEGLIGIBLE.test(row.parsed.item || "")) return false;
  return row.parsed.grams == null || row.parsed.grams <= NEGLIGIBLE_MAX_G;
}

// Seed recipes arrive as { measure, name } where `name` IS the TheMealDB
// ingredient name the table is keyed on — so it matches directly. User-written
// recipes are freeform, so fall back to the parser's extracted item
// ("2 tbsp olive oil" → "olive oil") before giving up.
//
// `cooked` swaps in the cooked USDA record where the instructions say the line
// goes in already cooked. The two differ enough to dominate a recipe: brown
// rice is 360 kcal/100g raw and 123 cooked.
function lookup(name, parsedItem, cooked) {
  if (cooked) {
    const c = cookedTable[key(name)] || cookedTable[key(parsedItem)];
    if (c) return c;
    // Flagged cooked but we have no cooked record — the raw row would be ~3x
    // wrong, so drop the line rather than substitute it.
    return null;
  }
  return table[key(name)] || table[key(parsedItem)] || null;
}

export const usdaProvider = {
  name: "usda",

  // async to satisfy the NutritionProvider contract; no I/O actually happens.
  // `recipeId` opts a seed recipe into its curated facts (servings + which
  // lines are cooked); user recipes pass none and use their own real servings.
  async computeNutrition(ingredients, servings, recipeId) {
    const list = (ingredients || []).filter((p) => p && (p.name || p.measure));
    if (!list.length) return null;

    const facts = factsFor(recipeId);
    // Facts RESOLVE the raw/cooked ambiguity, so the blunt guards are only for
    // recipes we have no facts for (user recipes, or a seed id we missed).
    if (!facts && hasAmbiguousGrain(list)) return null;

    // A curated serving count beats the caller's flat default of 4 — that
    // default is what turned "2kg Shredded Meat" into 1200 kcal/serving.
    const perServing = Math.max(1, Number(facts?.servings) || Number(servings) || 1);
    const cookedSet = new Set((facts?.cooked || []).map(key));

    const rows = list.map((p) => {
      const line = [p.measure, p.name].filter(Boolean).join(" ").trim();
      const parsed = parseIngredientLine(line);
      const food = lookup(p.name, parsed.item, cookedSet.has(key(p.name)));
      return { parsed, food, name: p.name };
    });

    const usable = rows.filter((r) => r.food && r.parsed.grams > 0);
    if (!usable.length) return null; // nothing resolved — honestly unknown

    // Sum one nutrient across matched ingredients, scaling per-100g by grams.
    // Stays null when NO ingredient reported it: null/servings would become 0
    // and fabricate a "0mg" out of missing data (QA P2-3).
    const sum = (field) => {
      let total = null;
      for (const { parsed, food } of usable) {
        const v = food[field];
        if (Number.isFinite(v)) total = (total ?? 0) + (v * parsed.grams) / 100;
      }
      return total;
    };
    const per = (v, dp) => (v == null ? null : round(v / perServing, dp));

    // Final plausibility check on the ANSWER, not the inputs. A real serving of
    // real food is not 12 kcal (Bakewell tart, when almost nothing resolved and
    // the total silently collapsed) and not 1855 (Ayam Percik, where the
    // serving count is still wrong). Whatever the cause, a figure outside human
    // range is evidence the inputs were broken — so say we don't know and let
    // the ~category estimate answer. Catches ~6% of the catalogue.
    const kcalPerServing = round(sum("kcal") / perServing, 0);
    if (!Number.isFinite(kcalPerServing)) return null;
    if (kcalPerServing < MIN_PLAUSIBLE_KCAL || kcalPerServing > MAX_PLAUSIBLE_KCAL) return null;

    const gramsTotal = usable.reduce((a, r) => a + r.parsed.grams, 0);
    // Only a fallback: with curated facts the serving count is read from the
    // recipe rather than assumed, so this backstop does not apply.
    if (!facts && gramsTotal / perServing > MAX_PLAUSIBLE_SERVING_GRAMS) return null;

    // Confidence weights the two failure modes differently:
    //  - unmatched → the line is dropped from the sum, so the total is WRONG
    //    (understated). Counts full.
    //  - guessed   → our parser estimated the grams ("2 large eggs" → 100g,
    //    medium). The line IS in the sum, just approximate. Counts half.
    // Seasoning and garnish are dropped from the denominator (see NEGLIGIBLE).
    // The fallback keeps a recipe that is ENTIRELY seasoning from dividing by
    // zero — it gets scored on its own lines, as before.
    const counted = rows.filter((r) => !isNegligible(r));
    const scored = counted.length ? counted : rows;
    const resolved = (r) => r.food && r.parsed.grams > 0;
    const unmatched = scored.filter((r) => !resolved(r)).length;
    const guessed = scored.filter((r) => resolved(r) && r.parsed.confidence !== "high").length;
    const doubt = (unmatched + guessed * 0.5) / scored.length;
    // "high" is not perfection. Garlic, onion and egg resolve through piece
    // weights and are rated "guessed" by design, so requiring doubt === 0 made
    // "high" unreachable for almost every real recipe rather than meaningful.
    const confidence = doubt <= 0.1 ? "high" : doubt <= 0.3 ? "medium" : "low";

    return {
      kcal: kcalPerServing,
      protein_g: per(sum("protein_g"), 1),
      carbs_g: per(sum("carbs_g"), 1),
      fat_g: per(sum("fat_g"), 1),
      fiber_g: per(sum("fiber_g"), 1),
      sugar_g: per(sum("sugar_g"), 1),
      sodium_mg: per(sum("sodium_mg"), 0),
      basis_grams: round(gramsTotal / perServing),
      per: "serving",
      source: "usda",
      confidence,
      computed_at: new Date().toISOString(),
    };
  },
};
