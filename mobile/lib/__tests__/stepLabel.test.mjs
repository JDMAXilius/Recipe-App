// Run: node lib/__tests__/stepLabel.test.mjs
// Guards the "STEP n" header filter used by services/mealAPI.js and the backend
// RecipeSource adapter. TheMealDB 52982 (Carbonara) ships headers as their own
// lines; kept, they render as blank steps in cook mode and double the count.
import assert from "node:assert/strict";

const isStepLabel = (line) => /^\s*(step\s*)?\d+\s*[:.)\-]?\s*$/i.test(line);

// labels — must be dropped
for (const s of ["STEP 1", "Step 2", "step 3:", "STEP 4.", "STEP 5)", "STEP 6 -", "  STEP 7  ", "1", "2.", "3)"]) {
  assert.equal(isStepLabel(s), true, `should be treated as a label: ${JSON.stringify(s)}`);
}

// real instructions — must be kept, including ones that open with a number
for (const s of [
  "Put a large saucepan of water on to boil.",
  "STEP 1 Put a large saucepan of water on to boil.",
  "2 large eggs, beaten",
  "350g spaghetti",
  "Cook until the sauce starts to thicken then remove from heat.",
  "1 hour in the oven, then rest.",
]) {
  assert.equal(isStepLabel(s), false, `should be kept: ${JSON.stringify(s)}`);
}

// end to end on the real shape of 52982
const raw = "STEP 1\r\nPut a large saucepan of water on to boil.\r\n\r\nSTEP 2\r\nFinely chop the pancetta.\r\n";
const steps = raw.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !isStepLabel(s));
assert.deepEqual(steps, [
  "Put a large saucepan of water on to boil.",
  "Finely chop the pancetta.",
]);

console.log("stepLabel: all assertions passed");
