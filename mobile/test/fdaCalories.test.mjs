import test from "node:test";
import assert from "node:assert/strict";
import { fdaCalories } from "../lib/fdaCalories.js";

test("under 5 kcal reads as zero (21 CFR 101.9(c)(1))", () => {
  assert.equal(fdaCalories(2), 0); // black coffee
  assert.equal(fdaCalories(4.9), 0);
  assert.equal(fdaCalories(0), 0);
});

test("5-calorie increments up to 50, 10-calorie above", () => {
  assert.equal(fdaCalories(5), 5);
  assert.equal(fdaCalories(24), 25);
  assert.equal(fdaCalories(50), 50);
  assert.equal(fdaCalories(342), 340);
  assert.equal(fdaCalories(789), 790);
});

test("real calories are never zeroed — no 'negative calorie' rule", () => {
  assert.equal(fdaCalories(15), 15); // a stalk of celery keeps its calories
  assert.equal(fdaCalories(29), 30); // a lemon keeps its calories
});

test("nonsense input degrades to zero, never NaN on the card", () => {
  assert.equal(fdaCalories(undefined), 0);
  assert.equal(fdaCalories(NaN), 0);
  assert.equal(fdaCalories(-10), 0);
});
