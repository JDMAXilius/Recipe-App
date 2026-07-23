// Ported v1 suites (deterministic parts only):
// - backend/test/resolveIngredient.test.mjs → foodForKey (the test seam).
//   The resolver-dormancy tests (resolverActive, resolveIngredientNames) are
//   NOT ported: that module is the Anthropic/network tail, outside the engine.
// - backend/test/resolveCooked.test.mjs → shapeCookedDecisions (pure shaping)
//   and the N4 cooked-table rows. classifyCookedState dormancy is not ported
//   for the same reason.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { foodForKey, shapeCookedDecisions } from "./lookup";

const require = createRequire(import.meta.url);
const cookedTable = require("./data/usdaCookedTable.json");

test("foodForKey returns real USDA rows and null for non-keys", () => {
  const minced = foodForKey("minced beef");
  assert.ok(minced && minced.protein_g > 15, "a real key returns its USDA row");
  assert.equal(foodForKey("definitely not a food xyzzy"), null);
  assert.equal(foodForKey(""), null);
  // case-insensitive, like the compute path
  assert.ok(foodForKey("Cheddar Cheese"));
});

test("shapeCookedDecisions clamps to the enum and answers every asked name", () => {
  const out = shapeCookedDecisions(
    {
      decisions: [
        { name: "Rice", state: "cooked" },
        { name: "black beans", state: "raw" },
        { name: "pasta", state: "definitely-cooked-trust-me" }, // invalid → dropped
      ],
    },
    ["rice", "black beans", "pasta", "never-answered"]
  );
  assert.equal(out.get("rice"), "cooked");
  assert.equal(out.get("black beans"), "raw");
  assert.equal(out.get("pasta"), "unknown"); // invalid enum → unknown, never trusted
  assert.equal(out.get("never-answered"), "unknown");
});

test("N4: cooked pasta/white-rice records exist for the classifier to land on", () => {
  for (const k of ["pasta", "spaghetti", "white rice", "lasagne sheets", "lentils", "black beans"]) {
    assert.ok(cookedTable[k], `cooked record for "${k}" should exist`);
    assert.ok(cookedTable[k].kcal < 200, `"${k}" cooked kcal should be cooked-range, got ${cookedTable[k].kcal}`);
  }
});
