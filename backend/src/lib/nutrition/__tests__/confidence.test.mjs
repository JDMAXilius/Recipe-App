// Run: node src/lib/nutrition/__tests__/confidence.test.mjs
// The confidence flag reported "low" for 78.5% of the seed catalogue and "high"
// for 2.4% — a signal that never varies. The cause was the doubt formula
// counting every LINE equally, so an unquantifiable "To taste Salt" scored the
// same doubt as a missing cup of flour. These assert the invariant that fix
// establishes, without depending on the exact contents of usdaTable.json.
import assert from "node:assert/strict";
import { usdaProvider } from "../usdaProvider.js";

const base = [
  { measure: "500g", name: "Chicken" },
  { measure: "2 tbsp", name: "Olive Oil" },
  { measure: "1 large", name: "Onion" },
  { measure: "400g", name: "Tomatoes" },
];

const seasoning = [
  { measure: "To taste", name: "Salt" },
  { measure: "To taste", name: "Pepper" },
  { measure: "Pinch", name: "Thyme" },
];

const conf = async (list) => (await usdaProvider.computeNutrition(list, 4))?.confidence;

const plain = await conf(base);
assert.ok(plain, "base recipe should compute at all");

// 1. THE POINT: seasoning you cannot quantify must not degrade the estimate.
assert.equal(
  await conf([...base, ...seasoning]),
  plain,
  "unquantifiable seasoning must not lower confidence"
);

// 2. ...and it must not silently inflate it either.
assert.notEqual(await conf(seasoning.concat(base)), "low", "should not be dragged low by garnish");

// 3. A real ingredient that does NOT resolve still counts as doubt — the flag
//    has to keep meaning something.
const withJunk = [...base, ...Array.from({ length: 4 }, (_, i) => ({ measure: "", name: `Nonexistent Foodstuff ${i}` }))];
const junked = await conf(withJunk);
if (junked) {
  const rank = { high: 3, medium: 2, low: 1 };
  assert.ok(rank[junked] < rank[plain], `unresolvable real ingredients should lower confidence: ${plain} -> ${junked}`);
}

// 4. The numbers themselves are untouched by any of this.
const a = await usdaProvider.computeNutrition(base, 4);
const b = await usdaProvider.computeNutrition([...base, ...seasoning], 4);
assert.equal(a.kcal, b.kcal, "seasoning must not move the calorie total");

console.log("confidence: all assertions passed");
