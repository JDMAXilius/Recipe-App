// Snap a meal — the model's output contract and the deterministic checks the
// server runs on it. No imports, so Deno (the edge fn) and `node --test`
// (scan.test.mjs) load the same file. ADR-0013 / ADR-0015.
//
// The model only identifies the dish and reconstructs the recipe of the WHOLE
// batch the photographed portion came from (2 slices → the loaf). It never
// writes calories: nutrition is computed on the phone from the ingredient grams.

export const ARCHETYPES = ["loaf", "cake", "pie", "tray", "pot", "batch", "plate", "bowl", "drink"] as const;
export type Archetype = (typeof ARCHETYPES)[number];
const BAKED = new Set<Archetype>(["loaf", "cake", "pie", "tray", "batch"]);
const SINGLE = new Set<Archetype>(["plate", "bowl", "drink"]);

const count = { type: "object", additionalProperties: false, required: ["count", "unit"], properties: { count: { type: "number" }, unit: { type: "string" } } };
const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

export const SCAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_food", "decline_reason", "dish", "archetype", "seen", "portion", "yield", "servings", "category", "area", "ingredients", "steps", "questions", "assumptions"],
  properties: {
    is_food: { type: "boolean" },
    decline_reason: nullableString,
    dish: { type: "string" },
    archetype: { type: "string", enum: ARCHETYPES },
    seen: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["name", "confident"], properties: { name: { type: "string" }, confident: { type: "boolean" } } },
    },
    portion: count,
    yield: { type: "object", additionalProperties: false, required: ["qty", "unit"], properties: { qty: { type: "number" }, unit: { type: "string" } } },
    servings: count,
    category: nullableString,
    area: nullableString,
    ingredients: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["measure", "name"], properties: { measure: { type: "string" }, name: { type: "string" } } },
    },
    steps: { type: "array", items: { type: "string" } },
    questions: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
  },
};

export const SCAN_SYSTEM = `You are Otto's recipe developer. You are shown a photo of food someone is eating or about to eat. Work out the RECIPE for that dish, not a description of the plate.

Rules, non-negotiable:
- If the photo shows no food (or something unsafe to eat), set is_food to false with a short, kind decline_reason, and leave everything else empty or zero.
- dish: the plain name a home cook would use ("Banana bread", "Chicken burrito bowl").
- archetype: how the recipe is made and divided. loaf, cake, pie, tray (sheet-pan bakes, lasagna, brownies), pot (soups, stews, curries), batch (cookies, muffins, dumplings), plate or bowl (assembled single meals), drink.
- portion: what the photo shows, in the natural unit ("2 slice", "1 bowl").
- yield and servings describe the WHOLE recipe the portion came from. Two slices of banana bread mean a banana bread recipe: yield 1 loaf, servings 10 slice. A bowl of soup means a pot of soup: yield 1 pot, servings 6 bowl. A single assembled plate is yield 1 serving, servings 1 serving (or 2 if it is clearly shared).
- ingredients are for the whole recipe, weight-first: solids in grams ("280 g"), thin liquids in millilitres ("240 ml"), small amounts in tsp or tbsp with decimals ("1 tsp"). measure holds only the amount, name holds only the ingredient. Include the fat it is cooked in, sauces and toppings you can see or that the dish needs.
- steps: the method in cooking order, one action per step, warm and clear, no numbering.
- seen: the components you can actually see, each marked confident true or false.
- questions: at most 2 short questions about things the camera cannot tell (an amount, "cooked in oil or butter?"). Empty when nothing important is uncertain.
- assumptions: short notes on what you assumed (pan size, sweetener, cooking fat).
- Never state calories, macros or health claims. Never name brands or copy a named author's recipe text; write the method in your own words.
- category is one plain word (Bread, Chicken, Dessert…); area is the cuisine or null.`;

export interface ScanRecipe {
  dish: string;
  archetype: Archetype;
  seen: { name: string; confident: boolean }[];
  portion: { count: number; unit: string };
  yield: { qty: number; unit: string };
  servings: { count: number; unit: string };
  category: string | null;
  area: string | null;
  ingredients: { measure: string; name: string }[];
  steps: string[];
  questions: string[];
  assumptions: string[];
}

export type Shaped = { ok: true; recipe: ScanRecipe } | { ok: false; decline: string } | null;

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
// Units are stored singular ("slices" → "slice"); the app pluralises for display.
// Mirrors src/shared/yield.ts singular() (Deno can't import app code).
const SINGULAR: Record<string, string> = {
  loaves: "loaf", patties: "patty", berries: "berry", sandwiches: "sandwich", dishes: "dish",
  glasses: "glass", batches: "batch", boxes: "box", peaches: "peach", tomatoes: "tomato", potatoes: "potato",
};
export function singular(u: string): string {
  if (SINGULAR[u]) return SINGULAR[u];
  if (/ss$/.test(u) || Object.values(SINGULAR).includes(u)) return u;
  return /s$/.test(u) ? u.slice(0, -1) : u;
}
const unit = (v: unknown) => singular(str(v, 24).toLowerCase()) || "serving";
const positive = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback);
// Same cap as the app's MAX_SERVINGS. A value past it is capped AND said so in
// assumptions: the nutrition divisor must never change silently.
export const MAX_SERVINGS = 200;

// deno-lint-ignore no-explicit-any
export function shapeScan(data: any): Shaped {
  if (!data || typeof data !== "object") return null;
  if (data.is_food !== true) return { ok: false, decline: str(data.decline_reason, 300) || "Otto couldn't spot a meal in that photo." };
  const archetype: Archetype = ARCHETYPES.includes(data.archetype) ? data.archetype : "plate";
  const ingredients = (Array.isArray(data.ingredients) ? data.ingredients : [])
    // deno-lint-ignore no-explicit-any
    .filter((p: any) => p && str(p.name, 200))
    .slice(0, 60)
    // deno-lint-ignore no-explicit-any
    .map((p: any) => ({ measure: str(p.measure, 80), name: str(p.name, 200) }));
  const steps = (Array.isArray(data.steps) ? data.steps : []).map((s: unknown) => str(s, 1500)).filter(Boolean).slice(0, 40);
  if (ingredients.length === 0 || steps.length === 0) return null;
  const assumptions = (Array.isArray(data.assumptions) ? data.assumptions : []).map((a: unknown) => str(a, 200)).filter(Boolean).slice(0, 5);
  const rawServings = Math.round(positive(data.servings?.count, 1));
  const rawYield = positive(data.yield?.qty, 1);
  if (rawServings > MAX_SERVINGS || rawYield > MAX_SERVINGS) assumptions.push(`Capped at ${MAX_SERVINGS}; check the servings and the amounts.`);
  return {
    ok: true,
    recipe: {
      dish: str(data.dish, 120) || "Otto's version",
      archetype,
      // deno-lint-ignore no-explicit-any
      seen: (Array.isArray(data.seen) ? data.seen : []).slice(0, 12).map((s: any) => ({ name: str(s?.name, 60), confident: s?.confident === true })).filter((s: { name: string }) => s.name),
      portion: { count: positive(data.portion?.count, 1), unit: unit(data.portion?.unit) },
      yield: { qty: Math.min(MAX_SERVINGS, rawYield), unit: unit(data.yield?.unit) },
      servings: { count: Math.max(1, Math.min(MAX_SERVINGS, rawServings)), unit: unit(data.servings?.unit) },
      category: data.category ? str(data.category, 60) : null,
      area: data.area ? str(data.area, 60) : null,
      ingredients,
      steps,
      questions: (Array.isArray(data.questions) ? data.questions : []).map((q: unknown) => str(q, 140)).filter(Boolean).slice(0, 2),
      assumptions,
    },
  };
}

// --- deterministic checks -----------------------------------------------------
// Cheap rules that catch the model's known failure modes before the user sees
// them. Each returns a plain sentence the model can act on in one retry.

// Grams for the small set of lines the baking check needs. tsp/tbsp are
// converted at powder density (~4.8 g/tsp): close enough to catch a recipe
// with ten times too much leavening, not a substitute for the nutrition engine.
export function gramsOf(measure: string): number | null {
  const m = /^\s*([\d.]+)\s*(kg|g|tsp|tbsp)\b/i.exec(measure);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return u === "kg" ? n * 1000 : u === "g" ? n : u === "tsp" ? n * 4.8 : n * 14.4;
}

const sum = (r: ScanRecipe, pattern: RegExp) =>
  r.ingredients.filter((i) => pattern.test(i.name)).reduce((t, i) => t + (gramsOf(i.measure) ?? 0), 0);

export function checkScan(r: ScanRecipe): string[] {
  const issues: string[] = [];
  if (r.ingredients.length < 3) issues.push("A real recipe for this dish needs more than two ingredients.");
  if (r.steps.length < 2) issues.push("Write the method as at least two steps.");
  if (BAKED.has(r.archetype)) {
    if (r.yield.unit === "serving" || r.servings.count < 4) issues.push(`A ${r.archetype} recipe makes a whole ${r.archetype} that divides into several servings; set yield and servings for the whole batch.`);
    const flour = sum(r, /flour/i);
    if (flour >= 100) {
      const leavening = sum(r, /baking (soda|powder)|bicarbonate/i);
      const sugar = sum(r, /sugar|honey|syrup/i);
      if (leavening / flour > 0.06) issues.push("The leavening is far too high for that much flour; use about 1 tsp of baking soda or 1 tbsp of baking powder per 250 g flour at most.");
      if (sugar / flour > 1.5) issues.push("The sugar is far too high for that much flour; check the amounts.");
    }
  }
  if (SINGLE.has(r.archetype) && r.servings.count > 8) issues.push("An assembled single meal does not serve more than a few people; check servings.");
  if (r.portion.count > r.servings.count) issues.push("The portion in the photo can't be more than the whole recipe makes; check portion and servings.");
  return issues;
}
