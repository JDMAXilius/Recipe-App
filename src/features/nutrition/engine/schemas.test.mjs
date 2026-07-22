// New in v2 (engine.md §Data shapes): the zod schema is written FROM the v1
// output and must parse cached seed_nutrition-shaped rows unchanged. The
// fixture rows are RECORDED v1 provider output (see fixtures/ header), never
// invented. Also pins the branded-id constructors (src/types/ids.ts).
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { NutritionResultSchema, FoodRowSchema } from "./schemas";
import { computeNutrition } from "./compute";
import { foodForKey } from "./lookup";
import { toSeedId, toUserRecipeId } from "../../../types/ids";

const require = createRequire(import.meta.url);
const fixture = require("./fixtures/seedNutritionRows.json");

test("recorded v1 seed_nutrition rows parse unchanged", () => {
  assert.ok(fixture.rows.length >= 2, "fixture must carry the recorded rows");
  for (const row of fixture.rows) {
    const parsed = NutritionResultSchema.parse(row); // throws on mismatch
    assert.deepEqual(parsed, row, "schema must not coerce or drop fields");
  }
});

test("the engine's own output parses against the same schema", () => {
  const out = computeNutrition({
    ingredients: [{ measure: "100g", name: "Butter" }, { measure: "100g", name: "Sugar" }],
    servings: 2,
  });
  const parsed = NutritionResultSchema.parse(out);
  assert.deepEqual(parsed, out);
});

test("bundled food rows parse as FoodRow", () => {
  for (const key of ["butter", "minced beef", "cheddar cheese"]) {
    FoodRowSchema.parse(foodForKey(key));
  }
});

test("branded id constructors validate", () => {
  assert.equal(toSeedId("52772"), "52772");
  assert.equal(toSeedId(52772), "52772");
  assert.throws(() => toSeedId("u-abc"));
  assert.throws(() => toSeedId("52772x"));
  assert.equal(toUserRecipeId("u-9f2"), "u-9f2");
  assert.throws(() => toUserRecipeId("52772"));
  assert.throws(() => toUserRecipeId("u-"));
});
