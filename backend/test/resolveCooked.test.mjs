// Raw-vs-cooked resolution (N1): dormant behavior and the pure decision
// shaping. The live Claude call is verified on deploy like the other seams.
import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyCookedState,
  cookedResolverActive,
  shapeCookedDecisions,
} from "../src/lib/nutrition/resolveCooked.js";
import { usdaProvider } from "../src/lib/nutrition/usdaProvider.js";

test("cooked resolver is dormant without ANTHROPIC_API_KEY", async () => {
  assert.equal(cookedResolverActive(), false);
  const out = await classifyCookedState({
    steps: ["Add the cooked rice and stir."],
    names: ["rice"],
  });
  assert.equal(out.get("rice"), "unknown"); // dormant → never a verdict
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

test("dormant: a volume-measured grain still refuses the whole recipe (unchanged)", async () => {
  const out = await usdaProvider.computeNutrition(
    [
      { measure: "3 cups", name: "rice" },
      { measure: "200 g", name: "chicken breast" },
    ],
    4,
    null,
    ["Add the cooked rice.", "Serve."] // steps present, but no key → unknown → refuse
  );
  assert.equal(out, null);
});

test("N4: cooked pasta/white-rice records exist for the classifier to land on", async () => {
  // Weight-measured, so no ambiguity — just proves the new cooked rows are
  // reachable through the curated-facts path shape (cookedTable lookup).
  const { default: cookedTable } = await import(
    "../src/lib/nutrition/usdaCookedTable.json",
    { with: { type: "json" } }
  );
  for (const k of ["pasta", "spaghetti", "white rice", "lasagne sheets", "lentils", "black beans"]) {
    assert.ok(cookedTable[k], `cooked record for "${k}" should exist`);
    assert.ok(cookedTable[k].kcal < 200, `"${k}" cooked kcal should be cooked-range, got ${cookedTable[k].kcal}`);
  }
});
