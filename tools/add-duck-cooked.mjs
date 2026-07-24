// One-off: close the Duck Confit table gap (ticket T4) MODULARLY. Adds a cooked
// duck record to usdaCookedTable.json carrying a data-referenced `raw_yield`, and
// flips the recipe's duck line to cooked:true. No magic number is baked into the
// recipe — grams stay the honest raw quantity (1400g = 4 legs); the engine applies
// `raw_yield` wherever a cooked record has one (see compute.ts sum()), so this is
// reusable for any cooked food, not a per-recipe hack.
//
// raw_yield is DERIVED, not guessed: protein is conserved during cooking, so the
// raw→cooked mass ratio = raw protein density ÷ cooked protein density. For duck
// meat+skin: 11.5 (raw, fdcId 172408) ÷ 19.0 (roasted, fdcId 172411) = 0.605. The
// discarded ~40% is rendered fat — exactly what confit pours off.
import { readFileSync, writeFileSync } from "node:fs";

const COOKED = new URL("../src/features/nutrition/engine/data/usdaCookedTable.json", import.meta.url);
const RECIPES = new URL("../supabase/otto-recipes/canonical/recipes.json", import.meta.url);

const DUCK_COOKED = {
  fdcId: 172411,
  usda: "Duck, domesticated, meat and skin, cooked, roasted",
  kcal: 337, protein_g: 19, fat_g: 28.4, carbs_g: 0, fiber_g: 0, sugar_g: null, sodium_mg: 59,
  // raw→cooked mass yield, derived from protein conservation (11.5 raw / 19.0 cooked).
  raw_yield: 0.605,
};

const cooked = JSON.parse(readFileSync(COOKED));
for (const k of ["duck", "duck legs"]) {
  if (cooked[k]) throw new Error(`cookedTable already has "${k}" — aborting`);
  cooked[k] = DUCK_COOKED;
}

const recipes = JSON.parse(readFileSync(RECIPES));
const rc = recipes.find((r) => r.id === "52907");
if (!rc) throw new Error("no recipe 52907");
const line = rc.ingredients.find((i) => i.key === "duck legs");
if (!line) throw new Error("52907: no 'duck legs' ingredient");
if (line.cooked !== false || line.grams !== 1400) {
  throw new Error(`52907 duck legs unexpected state (cooked ${line.cooked}, grams ${line.grams}) — aborting`);
}
line.cooked = true; // grams UNCHANGED (1400 raw); engine's raw_yield does the mass math.
line.note =
  "confit: raw skin-on legs slow-cooked in their own fat, which renders out and is discarded. " +
  "cooked:true → roasted-duck record @337; the record's raw_yield (0.605, protein-conserved) " +
  "converts the 1400g raw to the eaten cooked mass in the engine.";

console.log(`+ cookedTable["duck"], ["duck legs"] = ${DUCK_COOKED.usda} (${DUCK_COOKED.kcal} kcal/100g, raw_yield ${DUCK_COOKED.raw_yield})`);
console.log(`~ 52907 Duck Confit: "duck legs" cooked false->true (grams stay 1400 raw)`);

if (process.argv.includes("--apply")) {
  writeFileSync(COOKED, JSON.stringify(cooked, null, 2) + "\n");
  writeFileSync(RECIPES, JSON.stringify(recipes, null, 2) + "\n");
  console.log("\nwritten.");
} else {
  console.log("\n(dry-run — pass --apply to write)");
}
