// Shared USDA FoodData Central client for the audit/build scripts.
//
// Two traps this file exists to stop repeating:
//  1. Energy is returned TWICE under the same nutrient name (KCAL and KJ). Read
//     the kJ row by accident and every number is silently 4.184x wrong. We ALWAYS
//     filter on unitName.
//  2. The API intermittently answers with an HTML error page instead of JSON,
//     which throws a confusing "Unexpected token '<'" far from the cause.
export const KEY = process.env.USDA_API_KEY;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson(url, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      const text = await r.text();
      if (text.trim().startsWith("<")) throw new Error(`HTML error page (HTTP ${r.status})`);
      // An empty body slipped past the HTML guard and reached JSON.parse(""),
      // which reports "Unexpected end of JSON input" — a message that names the
      // parser rather than the cause, and only after all the retries. A dead
      // fdcId (404, zero bytes) cost ~37s of retries to say nothing useful.
      if (!text.trim()) throw new Error(`empty body (HTTP ${r.status})`);
      return JSON.parse(text);
    } catch (e) {
      last = e;
      // A 404 is an answer, not a hiccup — retrying it just burns the clock.
      if (/HTTP 404/.test(e.message)) throw e;
      await sleep(2500 * (i + 1));
    }
  }
  throw last;
}

// Search-result and detail responses shape nutrients differently; handle both,
// and never trust a nutrient name without its unit.
export function macrosOf(food) {
  const rows = food.foodNutrients || [];
  const pick = (name, unit) => {
    const hit = rows.find((n) => {
      const nm = n.nutrientName || n.nutrient?.name;
      const un = (n.unitName || n.nutrient?.unitName || "").toUpperCase();
      return nm === name && (!unit || un === unit);
    });
    const v = hit?.value ?? hit?.amount;
    return Number.isFinite(v) ? v : null;
  };
  return {
    kcal: pick("Energy", "KCAL"),
    protein_g: pick("Protein"),
    fat_g: pick("Total lipid (fat)"),
    carbs_g: pick("Carbohydrate, by difference"),
    fiber_g: pick("Fiber, total dietary"),
    sugar_g: pick("Sugars, total including NLEA"),
    sodium_mg: pick("Sodium, Na"),
  };
}

export async function search(query, { dataType = "SR Legacy,Foundation", pageSize = 8 } = {}) {
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${KEY}` +
    `&query=${encodeURIComponent(query)}&dataType=${encodeURIComponent(dataType)}&pageSize=${pageSize}`;
  const j = await fetchJson(url);
  return j.foods || [];
}

export async function detail(fdcId) {
  return fetchJson(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${KEY}`);
}

export async function portions(fdcId) {
  const food = await detail(fdcId);
  return {
    description: food.description,
    list: (food.foodPortions || [])
      .map((p) => ({
        label: [p.amount, p.modifier || p.measureUnit?.name].filter(Boolean).join(" ").trim(),
        grams: p.gramWeight,
      }))
      .filter((p) => p.grams > 0),
  };
}

// A row in the shape usdaTable.json uses.
export function tableRow(food, macros) {
  return {
    fdcId: food.fdcId,
    usda: food.description,
    kcal: macros.kcal,
    protein_g: macros.protein_g,
    fat_g: macros.fat_g,
    carbs_g: macros.carbs_g,
    fiber_g: macros.fiber_g ?? 0,
    sugar_g: macros.sugar_g,
    sodium_mg: macros.sodium_mg,
  };
}
