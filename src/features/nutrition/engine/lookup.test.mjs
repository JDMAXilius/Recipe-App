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
import { foodForKey, lookup, shapeCookedDecisions, hasCookedRecord, lookupCookedAuto } from "./lookup";

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

test("bare 'chicken' is the whole-bird composite, but ground/minced keys stay ground (lamb trap)", () => {
  // T5 (rev): bare "chicken" is the honest generic for UNSPECIFIED chicken — the
  // real USDA light+dark meat-only composite (171052, 119 kcal / 3.08 g fat), a
  // composite not a single cut, matching the lamb→foreshank / beef→chuck / pork→
  // tenderloin sibling convention (whole cut with its fat, not the leanest row).
  const bare = lookup("chicken", null, false);
  assert.equal(bare?.fdcId, 171052, "bare chicken → whole-bird meat-only composite");
  assert.equal(bare?.usda, "Chicken, broilers or fryers, meat only, raw");
  assert.equal(bare?.kcal, 119);
  assert.equal(bare?.fat_g, 3.08);
  // "chicken, diced" is the same composite (trailing prep stripped, no mince).
  assert.equal(lookup("chicken, diced", null, false)?.usda, bare.usda);
  // Lamb trap: qualifier-strip / trailing-prep-strip would drag every ground
  // spelling to the composite without explicit keys — each must stay ground
  // (143 kcal, 8.1 g fat). Comma forms (FIX B) close the word-order guard hole.
  for (const k of ["ground chicken", "minced chicken", "chicken mince", "chicken, minced", "chicken, ground"]) {
    const r = lookup(k, null, false);
    assert.equal(r?.usda, "Chicken, ground, raw", `${k} must stay ground`);
    assert.equal(r?.fdcId, 171116);
  }
});

test("chicken breast keeps its own breast row, not the composite", () => {
  for (const k of ["chicken breast", "chicken breasts"]) {
    const r = lookup(k, null, false);
    assert.equal(r?.fdcId, 171077, `${k} → breast row`);
    assert.ok(/breast, skinless/.test(r?.usda), `${k} → breast, meat only`);
  }
});

test("singular resolves to the same record as its plural, and vice-versa (BUG B)", () => {
  const plural = lookup("carrots", "carrots", false);
  assert.ok(plural && plural.usda === "Carrots, raw");
  // the singular staple now folds to the plural row it used to miss
  const singular = lookup("carrot", "carrot", false);
  assert.ok(singular && singular.usda === plural.usda, "carrot must resolve to Carrots, raw");
  // "200g carrot" carries item "carrot" — same fold on the parsed item
  assert.ok(lookup(null, "carrot", false)?.usda === "Carrots, raw");
});

test("the -s fold never fabricates the pepper homograph (F1 honesty guard)", () => {
  // "2 peppers" (the vegetable) must NOT fold to "pepper" = the black-pepper
  // SPICE row (~10x wrong). Honest null beats confident-wrong.
  assert.equal(lookup("peppers", "peppers", false), null);
  assert.equal(lookup(null, "peppers", false), null);
  // the direct EXACT hit on the spice name itself is untouched — legit.
  assert.ok(lookup("pepper", "pepper", false)?.usda);
});

test("the -s fold does not collapse distinct foods (BUG B guard pairs)", () => {
  // trailing -s only, never f/ves, and only when the raw form already missed —
  // so none of these produce a WRONG cross-food hit.
  const L = (n) => lookup(n, n, false)?.usda ?? null;
  // oat/oats are the SAME food: both correctly land on the oats row (the fold
  // working as intended, exactly like carrot/carrots).
  assert.equal(L("oat"), L("oats"));
  assert.ok(L("oats") && /oats/i.test(L("oats")));
  // the rest have no standalone row either way — must stay null, NOT grab a
  // multi-word key ("green beans", "green chilli", "medjool dates", "bay leaf").
  for (const [s, p] of [
    ["green", "greens"], ["bean", "beans"], ["date", "dates"],
    ["leaf", "leaves"], ["chili", "chilis"],
  ]) {
    assert.equal(L(s), null, `${s} must stay null`);
    assert.equal(L(p), null, `${p} must stay null`);
  }
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

// ── T3: the AUTO cooked-detection gate (hasCookedRecord / lookupCookedAuto) ──
test("T3: hasCookedRecord gates on a real cooked record (base or exact)", () => {
  // has a cooked record via the stripped base
  assert.ok(hasCookedRecord("cooked rice", "cooked rice"));
  assert.ok(hasCookedRecord("cooked chickpeas", "cooked chickpeas"));
  assert.ok(hasCookedRecord("boiled potatoes", "boiled potatoes"));
  // broccoli/okra have no cooked record → gate stays shut (auto path won't fire)
  assert.equal(hasCookedRecord("cooked broccoli", "cooked broccoli"), false);
  assert.equal(hasCookedRecord("cooked okra", "cooked okra"), false);
});

test("T3: lookupCookedAuto strips the cooked word to the base, exact key wins", () => {
  assert.equal(lookupCookedAuto("cooked rice", "cooked rice")?.kcal, 130);
  assert.equal(lookupCookedAuto("cooked chickpeas", "cooked chickpeas")?.kcal, 139);
  // exact "boiled potatoes" key (87) beats the generic microwaved "potatoes" (105)
  assert.equal(lookupCookedAuto("boiled potatoes", "boiled potatoes")?.fdcId, 170438);
  assert.equal(lookupCookedAuto("boiled potatoes", "boiled potatoes")?.kcal, 87);
});

test("T3: curated cooked path is UNCHANGED — exact match only, honest null on miss", () => {
  // lookup()'s cooked branch (the curated path) never strips: a curated "Boiled
  // Rice"/"cooked broccoli" with no exact record still drops to null, exactly as
  // before this change — a human said cooked, so honor the honest drop.
  assert.equal(lookup("cooked broccoli", "cooked broccoli", true), null);
  assert.equal(lookup("boiled rice", "boiled rice", true), null);
  // an exact curated key still resolves as before
  assert.ok(lookup("white rice", "white rice", true)?.kcal < 200);
});

test("T3: the new boiled-potato record is a real USDA SR row", () => {
  const r = cookedTable["boiled potatoes"];
  assert.equal(r.fdcId, 170438);
  assert.equal(r.usda, "Potatoes, boiled, cooked in skin, flesh, without salt");
  assert.equal(r.kcal, 87);
  assert.equal(r.carbs_g, 20.13);
});
