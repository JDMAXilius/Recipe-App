// B1.2b — foodDbProvider. Network is stubbed: these pin the math and the
// honesty rules, not Edamam's uptime.
import test from "node:test";
import assert from "node:assert/strict";

process.env.EDAMAM_APP_ID = "test-id";
process.env.EDAMAM_APP_KEY = "test-key";

const { foodDbProvider } = await import("../src/lib/nutrition/foodDbProvider.js");

// Fakes one food: parser resolves any name, /nutrients answers with `panel`.
// `unmatchable` names resolve to no foodId, mimicking a Food DB miss.
function stubFetch({ panel, unmatchable = [] }) {
  return async (url, options) => {
    if (String(url).includes("/parser")) {
      const ingr = decodeURIComponent(String(url).split("ingr=")[1] || "");
      const miss = unmatchable.some((u) => ingr.includes(u));
      return {
        ok: true,
        status: 200,
        json: async () => (miss ? { parsed: [], hints: [] } : { parsed: [{ food: { foodId: "food_x" } }] }),
      };
    }
    // /nutrients — one ingredient per call on this plan
    const body = JSON.parse(options.body);
    assert.equal(body.ingredients.length, 1, "must send exactly 1 ingredient per call");
    const grams = body.ingredients[0].quantity;
    return { ok: true, status: 200, json: async () => panel(grams) };
  };
}

const realFetch = globalThis.fetch;
const withStub = async (stub, fn) => {
  globalThis.fetch = stub;
  try {
    return await fn();
  } finally {
    globalThis.fetch = realFetch;
  }
};

// 100 kcal + 10g protein per 100g; no SUGAR/NA reported by this fake food.
const simplePanel = (grams) => ({
  calories: grams,
  totalWeight: grams,
  totalNutrients: { PROCNT: { quantity: grams / 10 } },
});

test("sums across ingredients and divides by servings", async () => {
  const out = await withStub(stubFetch({ panel: simplePanel }), () =>
    foodDbProvider.computeNutrition(
      [{ measure: "100g", name: "thing a" }, { measure: "300g", name: "thing b" }],
      4
    )
  );
  assert.equal(out.kcal, 100); // (100 + 300) / 4
  assert.equal(out.protein_g, 10); // (10 + 30) / 4
  assert.equal(out.basis_grams, 100); // 400g / 4
  assert.equal(out.per, "serving");
  assert.equal(out.source, "edamam-fooddb");
});

test("a nutrient no ingredient reports stays null — never 0", async () => {
  const out = await withStub(stubFetch({ panel: simplePanel }), () =>
    foodDbProvider.computeNutrition([{ measure: "100g", name: "thing a" }], 4)
  );
  // null/4 === 0 in JS would fabricate "0mg sodium" from missing data
  assert.equal(out.sodium_mg, null);
  assert.equal(out.sugar_g, null);
  assert.notEqual(out.sodium_mg, 0);
});

test("all matched, all parsed exactly → high", async () => {
  const out = await withStub(stubFetch({ panel: simplePanel }), () =>
    foodDbProvider.computeNutrition(
      [{ measure: "100g", name: "thing a" }, { measure: "200g", name: "thing b" }],
      1
    )
  );
  assert.equal(out.confidence, "high");
});

test("one guessed gram weight among four does not tip to low", async () => {
  // "2 large eggs" parses medium (no explicit unit) — the regression that
  // equal-weighting unmatched and guessed caused.
  const out = await withStub(stubFetch({ panel: simplePanel }), () =>
    foodDbProvider.computeNutrition(
      [
        { measure: "100g", name: "thing a" },
        { measure: "200g", name: "thing b" },
        { measure: "300g", name: "thing c" },
        { measure: "2", name: "large eggs" },
      ],
      4
    )
  );
  assert.equal(out.confidence, "medium");
});

test("an unmatched ingredient is dropped from the sum and lowers confidence", async () => {
  const out = await withStub(
    stubFetch({ panel: simplePanel, unmatchable: ["unobtainium"] }),
    () =>
      foodDbProvider.computeNutrition(
        [{ measure: "100g", name: "thing a" }, { measure: "900g", name: "unobtainium" }],
        1
      )
  );
  assert.equal(out.kcal, 100); // the 900g line is absent, not counted as 0
  assert.equal(out.confidence, "low"); // 1 of 2 dropped
});

test("nothing matched → null, never a fabricated number", async () => {
  const out = await withStub(
    stubFetch({ panel: simplePanel, unmatchable: ["unobtainium"] }),
    () => foodDbProvider.computeNutrition([{ measure: "900g", name: "unobtainium" }], 1)
  );
  assert.equal(out, null);
});

test("no ingredients → null", async () => {
  assert.equal(await foodDbProvider.computeNutrition([], 4), null);
  assert.equal(await foodDbProvider.computeNutrition(null, 4), null);
});

test("never exceeds the concurrency cap — a 429 storm drops ingredients silently", async () => {
  let inFlight = 0;
  let peak = 0;
  const counting = async (url, options) => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return stubFetch({ panel: simplePanel })(url, options);
  };
  await withStub(counting, () =>
    foodDbProvider.computeNutrition(
      Array.from({ length: 12 }, (_, i) => ({ measure: "100g", name: `thing ${i}` })),
      4
    )
  );
  assert.ok(peak <= 2, `peak concurrency ${peak} exceeded cap of 2`);
});

test("retries a 429 rather than recording a false miss", async () => {
  let calls = 0;
  const flaky = async (url, options) => {
    calls++;
    if (calls <= 2) return { ok: false, status: 429, json: async () => ({}) };
    return stubFetch({ panel: simplePanel })(url, options);
  };
  const out = await withStub(flaky, () =>
    foodDbProvider.computeNutrition([{ measure: "100g", name: "thing a" }], 1)
  );
  // without retry the first 429 would drop the only ingredient → null
  assert.ok(out, "429 should be retried, not treated as unmatched");
  assert.equal(out.kcal, 100);
});

test("upstream failure → null, not a partial total", async () => {
  const failing = async () => ({ ok: false, status: 429, json: async () => ({}) });
  const out = await withStub(failing, () =>
    foodDbProvider.computeNutrition([{ measure: "100g", name: "thing a" }], 1)
  );
  assert.equal(out, null);
});
