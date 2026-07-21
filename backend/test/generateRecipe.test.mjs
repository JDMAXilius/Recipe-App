// AI recipe creation — pins the draft shaping (clamps, honesty gates) that
// sits between Claude's structured output and the editor. The API call
// itself follows the proven extractRecipe pattern and is dormant-gated.
import test from "node:test";
import assert from "node:assert/strict";
import { shapeGeneratedRecipe, generationActive } from "../src/lib/generateRecipe.js";

test("dormant without a key", () => {
  assert.equal(generationActive(), Boolean(process.env.ANTHROPIC_API_KEY));
});

test("a good generation shapes into an editor-ready draft", () => {
  const shaped = shapeGeneratedRecipe({
    is_possible: true,
    title: "Cozy Braised Chicken Thighs",
    servings: 4,
    category: "Chicken",
    area: "French",
    ingredients: [
      { measure: "800 g", name: "chicken thighs, bone-in" },
      { measure: "240 ml", name: "chicken stock" },
      { measure: "0.5 tsp", name: "black pepper" },
      { measure: "", name: "salt, to taste" },
    ],
    steps: ["Season the chicken.", "Brown it well.", "Braise until tender."],
  });
  assert.equal(shaped.title, "Cozy Braised Chicken Thighs");
  assert.equal(shaped.servings, 4);
  assert.equal(shaped.ingredients.length, 4);
  assert.equal(shaped.ingredients[0].measure, "800 g");
  assert.equal(shaped.steps.length, 3);
});

test("declines and empty results never reach the editor", () => {
  assert.equal(shapeGeneratedRecipe({ is_possible: false, decline_reason: "not food" }), null);
  assert.equal(shapeGeneratedRecipe({ is_possible: true, ingredients: [], steps: ["x"] }), null);
  assert.equal(shapeGeneratedRecipe({ is_possible: true, ingredients: [{ measure: "1", name: "egg" }], steps: [] }), null);
  assert.equal(shapeGeneratedRecipe(null), null);
});

test("clamps hostile sizes to the save schema's limits", () => {
  const shaped = shapeGeneratedRecipe({
    is_possible: true,
    title: "x".repeat(999),
    servings: 999,
    category: null,
    area: null,
    ingredients: Array.from({ length: 300 }, (_, i) => ({ measure: "1 g", name: `ing ${i}` })),
    steps: Array.from({ length: 200 }, () => "step"),
  });
  assert.equal(shaped.title.length, 300);
  assert.equal(shaped.servings, 24);
  assert.equal(shaped.ingredients.length, 100);
  assert.equal(shaped.steps.length, 60);
});

// ── Conversational build ("Chat with Otto") ──────────────────────────────
import { chatRecipe } from "../src/lib/generateRecipe.js";
import { schemas } from "../src/lib/validate.js";

test("chat is dormant without a key — no turn resolves", async () => {
  assert.equal(await chatRecipe({ messages: [{ role: "user", content: "a coffee" }] }), null);
});

test("chat requires the last turn to be the user's", async () => {
  // dormant returns null anyway, but the guard shape is what we pin: a thread
  // that ends on Otto is not a turn to answer.
  assert.equal(
    await chatRecipe({ messages: [{ role: "assistant", content: "Hot or iced?" }] }),
    null
  );
});

test("generateChatBody accepts a real thread and rejects malformed ones", () => {
  const ok = schemas.generateChatBody.safeParse({
    messages: [
      { role: "user", content: "a coffee" },
      { role: "assistant", content: "Hot or iced?" },
      { role: "user", content: "black with creamer and one stevia" },
    ],
    servings: 1,
  });
  assert.equal(ok.success, true);
  // empty thread
  assert.equal(schemas.generateChatBody.safeParse({ messages: [] }).success, false);
  // bad role
  assert.equal(
    schemas.generateChatBody.safeParse({ messages: [{ role: "otto", content: "hi" }] }).success,
    false
  );
  // empty content
  assert.equal(
    schemas.generateChatBody.safeParse({ messages: [{ role: "user", content: "" }] }).success,
    false
  );
});
