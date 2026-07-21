// Claude-as-matcher resolver: the deterministic surface. The live Claude call
// is dormant-gated (no key here) and verified on deploy, same as the other AI
// seams; what we pin here is that dormant behavior is a safe no-op and that
// the honesty guard (only real table keys resolve) holds.
import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveIngredientNames,
  resolverActive,
  foodForKey,
} from "../src/lib/nutrition/resolveIngredient.js";

test("resolver is dormant without ANTHROPIC_API_KEY", () => {
  assert.equal(resolverActive(), false);
});

test("dormant resolution is a safe no-op: every name resolves to null, no throw", async () => {
  const out = await resolveIngredientNames(["beef mince", "grated cheddar", "aubergine"]);
  assert.equal(out.get("beef mince"), null);
  assert.equal(out.get("grated cheddar"), null);
  assert.equal(out.get("aubergine"), null);
});

test("resolveIngredientNames tolerates empty / junk input", async () => {
  assert.equal((await resolveIngredientNames([])).size, 0);
  assert.equal((await resolveIngredientNames(null)).size, 0);
  assert.equal((await resolveIngredientNames(["", "  "])).size, 0);
});

test("foodForKey returns real USDA rows and null for non-keys", () => {
  const minced = foodForKey("minced beef");
  assert.ok(minced && minced.protein_g > 15, "a real key returns its USDA row");
  assert.equal(foodForKey("definitely not a food xyzzy"), null);
  assert.equal(foodForKey(""), null);
  // case-insensitive, like the compute path
  assert.ok(foodForKey("Cheddar Cheese"));
});
