// Photo → recipe seam: dormant gate, shared shaping, and the body schema.
// The live vision call needs a key + network; what we pin here is everything
// around it — the same surface the text-extraction tests cover.
import test from "node:test";
import assert from "node:assert/strict";
import { extractRecipeFromPhoto, photoExtractionActive } from "../src/lib/import/extractPhoto.js";
import { shapeExtractedRecipe } from "../src/lib/import/extractRecipe.js";
import { schemas } from "../src/lib/validate.js";

test("photo extraction is dormant without ANTHROPIC_API_KEY", async () => {
  assert.equal(photoExtractionActive(), false);
  assert.equal(
    await extractRecipeFromPhoto({ image: "x".repeat(200), mediaType: "image/jpeg" }),
    null
  );
});

test("shared shaping refuses non-recipes and clamps hostile sizes", () => {
  assert.equal(shapeExtractedRecipe({ is_recipe: false, ingredients: [] }), null);
  assert.equal(shapeExtractedRecipe({ is_recipe: true, ingredients: [] }), null);

  const shaped = shapeExtractedRecipe({
    is_recipe: true,
    title: "T".repeat(999),
    servings: 4,
    ingredients: Array.from({ length: 300 }, () => ({ measure: "1".repeat(999), name: "flour" })),
    steps: Array.from({ length: 200 }, () => "s".repeat(9999)),
    confidence: "medium",
  });
  assert.equal(shaped.title.length, 300);
  assert.equal(shaped.ingredients.length, 100);
  assert.equal(shaped.ingredients[0].measure.length, 80);
  assert.equal(shaped.steps.length, 60);
  assert.equal(shaped.steps[0].length, 2000);
  assert.equal(shaped.confidence, "medium");
});

test("importPhotoBody accepts real payloads and rejects junk", () => {
  const good = schemas.importPhotoBody.safeParse({
    image: "a".repeat(500),
    mediaType: "image/jpeg",
  });
  assert.equal(good.success, true);

  assert.equal(
    schemas.importPhotoBody.safeParse({ image: "a".repeat(500), mediaType: "image/heic" }).success,
    false
  );
  assert.equal(
    schemas.importPhotoBody.safeParse({ image: "tiny", mediaType: "image/png" }).success,
    false
  );
  assert.equal(
    schemas.importPhotoBody.safeParse({ image: "a".repeat(7_000_001), mediaType: "image/png" }).success,
    false
  );
});
