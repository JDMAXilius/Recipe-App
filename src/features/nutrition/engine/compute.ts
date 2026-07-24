// Port of usdaProvider.computeNutrition (B1.7) — the deterministic path.
// Nutrition is grams x per-100g values — plain arithmetic, ZERO network calls,
// no LLM. The v1 resolver tails (Claude-as-matcher, cooked-state classifier)
// are edge functions OUTSIDE the engine; their dormant behavior is this
// module's behavior: an unmatched line stays unmatched, an ambiguous grain
// refuses the recipe. Honesty law: null beats a guess.
//
// v1 positional args (ingredients, servings, recipeId, steps) become one
// input object per docs/contracts/engine.md — same shapes, same semantics.
import { parseIngredientLine } from "./parse";
import { lookup, lookupCookedAuto, hasCookedRecord, cookAutoDenied, foodForKey, COOKED_WORD, key } from "./lookup";
import type { FoodRow } from "./lookup";
import type { Row } from "./guards";
import {
  hasAmbiguousGrain,
  applyFryingMedium,
  applyBatchCondiment,
  applyTypicalAmounts,
  isNegligible,
  COVERAGE_MIN,
  UNWEIGHED_LINE_MAX,
  MIN_PLAUSIBLE_KCAL,
  MAX_PLAUSIBLE_KCAL,
  MAX_PLAUSIBLE_SERVING_GRAMS,
} from "./guards";
import type { NutritionResult } from "./schemas";
import type { SeedId, UserRecipeId } from "../../../types/ids";
import recipeFacts from "./data/recipeFacts.json" with { type: "json" };

// recipeFacts.json — the two things TheMealDB does not tell us, read once from
// each recipe's own instructions and committed as static data:
//
//   servings : never stated anywhere in the API. A flat default of 4 divided
//              "2kg Shredded Meat" into a 1200 kcal/serving card. Judged from
//              the ingredient quantities and dish type.
//   cooked   : which lines are ALREADY cooked when added. The lines never say,
//              but the instructions do — "add the cooked vegetables and rice"
//              means raw brown rice (360 kcal/100g) is wrong and cooked (123)
//              is right. That single line was a 3x error.
//
// This is a language judgement, not a number: the facts only choose WHICH USDA
// record applies and how many the pot feeds. Every calorie still comes from
// USDA, and any recipe missing from this file falls back to the old guards.
type RecipeFacts = { servings?: number; cooked?: string[]; frying?: string[] };
const FACTS = recipeFacts as Record<string, RecipeFacts>;
const factsFor = (id: string | undefined | null): RecipeFacts | null =>
  id ? FACTS[String(id)] ?? null : null;

const round = (n: number | null | undefined, dp = 0): number | null =>
  n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp;

export interface ComputeNutritionInput {
  ingredients: { measure: string; name: string }[]; // v1 pair shape, verbatim
  servings: number;
  recipeId?: SeedId | UserRecipeId;
  steps?: string[]; // accepted per contract; the engine never classifies from
  // them (that is the edge-function resolver), so they change nothing here —
  // exactly the v1 dormant behavior the suites pin.
}

// The FoodRows the edge resolver found for names the bundled table missed,
// keyed by LOWERCASED ingredient name. Passing them in is NOT engine I/O — the
// fetch happens in the query layer (nutrition.queries.ts); the engine only ever
// consumes rows it is handed, exactly as it consumes the bundled table. A miss
// the resolver reports (null) stays a miss: the override only ever ADDS a match
// the local table lacked, never invents one.
export type ResolvedOverride = Map<string, FoodRow | null>;

// Parse + look up every line, applying the resolver override ONLY where the
// bundled table missed. Shared by computeNutrition and unmatchedNames so both
// see the identical match set. `resolved: true` marks a resolver-supplied hit —
// the confidence pass already scores those as "guessed" (half doubt), the honest
// weight the compute comment anticipated for a resolver-picked food.
function buildContext(input: ComputeNutritionInput, override?: ResolvedOverride) {
  const { ingredients, servings, recipeId } = input;
  const list = (ingredients || []).filter((p) => p && (p.name || p.measure));
  const facts = factsFor(recipeId);
  // A curated serving count beats the caller's flat default of 4 — that
  // default is what turned "2kg Shredded Meat" into 1200 kcal/serving.
  const perServing = Math.max(1, Number(facts?.servings) || Number(servings) || 1);
  const cookedSet = new Set((facts?.cooked || []).map(key));
  // Curated frying/browning media for this recipe — same shape as `cooked`: a
  // human read the instructions and named the oil line that is a cooking medium.
  const fryingSet = new Set((facts?.frying || []).map(key));

  const rows: Row[] = list.map((p) => {
    const line = [p.measure, p.name].filter(Boolean).join(" ").trim();
    const parsed = parseIngredientLine(line);
    const curatedCooked = cookedSet.has(key(p.name));
    // AUTO cooked detection for UNCURATED lines (the T3 fix): a user-imported
    // "200g cooked rice" has no recipeFacts, so it used to resolve to RAW rice
    // (~3x over). A literal cooked-state word in the line is explicit text, not
    // an inference — flip to cooked, but ONLY when a cooked record exists
    // (hasCookedRecord gate). So the auto path can only improve (raw→cooked
    // where we have the record) and never regress (no record → stays raw, never
    // the honest-drop-to-null the curated path uses). Curated cooked is
    // UNCHANGED — it keeps its exact-match lookup and its honest null.
    const wouldAutoCook = COOKED_WORD.test(line) && hasCookedRecord(p.name, parsed.item);
    // AUTO-COOK DENYLIST: for a few foods "boiled"/"cooked" is a product name,
    // not a yield change, and the cooked record is a worse match than the raw/
    // product row — so suppress the flip and keep the raw one. Only consulted
    // when an auto-cook WOULD have fired, so it never resolves lines that were
    // staying null. Curated cooked (below) is untouched.
    const deniedKey =
      COOKED_WORD.test(line) && !curatedCooked ? cookAutoDenied(p.name, parsed.item) : null;
    const autoCooked = !curatedCooked && !deniedKey && wouldAutoCook;
    const cooked = curatedCooked || autoCooked;
    let food = autoCooked
      ? lookupCookedAuto(p.name, parsed.item)
      : lookup(p.name, parsed.item, cooked);
    // The cooked word in the line ("boiled ham") makes the raw lookup miss, so
    // fall back to the denylisted food's base product record.
    if (!food && deniedKey) food = foodForKey(deniedKey);
    let fromResolver = false;
    // Only fill from the resolver when the bundled table missed AND the line is
    // NOT flagged cooked: the resolver returns raw whole-food per-100g, so a raw
    // row on a cooked line reintroduces the ~3x error the cooked guard prevents.
    if (!food && !cooked && override) {
      const hit = override.get(key(p.name)) ?? override.get(key(parsed.item));
      if (hit) {
        food = hit;
        fromResolver = true;
      }
    }
    return { parsed, food, name: p.name, resolved: fromResolver, curatedFrying: fryingSet.has(key(p.name)) };
  });

  return { list, facts, perServing, rows };
}

// Names the LOCAL table could not match — the exact list the query layer sends
// to the resolver. Negligible/inedible lines are excluded: they carry ~no
// calories, so resolving them wastes the resolver's ≤40-name budget. Returns []
// when the recipe honestly refuses on ambiguous grain (the resolver can't settle
// a raw-vs-cooked question, so there is nothing to ask). Pass `resolved` to see
// what is STILL unmatched after a resolve (used by tests / re-checks).
export function unmatchedNames(input: ComputeNutritionInput, override?: ResolvedOverride): string[] {
  const { list, facts, rows } = buildContext(input, override);
  if (!list.length) return [];
  if (!facts && hasAmbiguousGrain(list)) return [];
  return rows.filter((r) => !r.food && !isNegligible(r)).map((r) => r.name);
}

export function computeNutrition(
  input: ComputeNutritionInput,
  override?: ResolvedOverride,
): NutritionResult | null {
  const { list, facts, perServing, rows } = buildContext(input, override);
  if (!list.length) return null;

  // Raw-vs-cooked (N1). Facts resolve the ambiguity for curated seed recipes;
  // for everything else the blunt guard refuses the whole recipe — in v1 the
  // Claude classifier could settle it when a key was live, but the engine is
  // deterministic by contract, so every ambiguous line is "unknown" here and
  // the recipe honestly refuses, exactly like v1 with resolvers dormant.
  if (!facts && hasAmbiguousGrain(list)) return null;

  // FRYING MEDIUM (not an ingredient). "2 quarts oil" in a fried-chicken
  // recipe is the bath, not something anyone eats — counting it whole put
  // 15,387 kcal into one recipe and made 84% of its calories uneaten oil.
  // Count only what the food ABSORBS and never the medium (USDA/FNDDS:
  // "any increase or decrease in fat during cooking is incorporated into the
  // ingredients"; Edamam exposes it as `retainedWeight`).
  applyFryingMedium(rows, perServing);
  applyBatchCondiment(rows, perServing);

  // TYPICAL-AMOUNT FALLBACK (founder call, 2026-07-21). A line whose food we
  // know but whose amount the recipe never states ("Barbeque Sauce", "Flour",
  // "Strawberries") used to be dropped, which meant the whole recipe fell back
  // to a CATEGORY estimate — a number derived from the dish type alone,
  // ignoring the ingredient list entirely. Estimating a typical amount for
  // that one line and computing the rest properly is strictly more informed:
  // USDA still supplies every per-100g number, and only the QUANTITY is ours.
  //
  // The honesty contract is the flag, not the silence: every line filled this
  // way is marked `estimated`, which counts as full doubt, so a recipe leaning
  // on them reads low — never high. That is the difference between an estimate
  // and a fabrication.
  applyTypicalAmounts(rows);

  const usable = rows.filter((r) => r.food && (r.parsed.grams ?? 0) > 0);
  if (!usable.length) return null; // nothing resolved — honestly unknown

  // COVERAGE GUARD (honesty). An unmatched line is dropped from the sum, so a
  // recipe whose main ingredient doesn't resolve ships a total that is
  // confidently understated — and the kcal plausibility guard below can't see
  // it, because a rice-less chicken dinner still lands in human range. So
  // weigh how much of the recipe's real MASS actually matched: if less than
  // COVERAGE_MIN of the substantial (non-seasoning) grams resolved, the sum
  // describes a different dish than the one written. Say we don't know and let
  // the ~category estimate answer. Seasonings are excluded both sides — an
  // unmatched pinch of salt is not missing calories.
  const countable = rows.filter((r) => (r.parsed.grams ?? 0) > 0 && !isNegligible(r));
  const countableGrams = countable.reduce((a, r) => a + (r.parsed.grams as number), 0);
  const resolvedGrams = countable
    .filter((r) => r.food)
    .reduce((a, r) => a + (r.parsed.grams as number), 0);
  if (countableGrams > 0 && resolvedGrams / countableGrams < COVERAGE_MIN) return null;

  // The coverage fraction above weighs MASS, so a line with no parseable
  // weight is invisible to it — a recipe whose ingredients mostly failed to
  // parse reads as 100% covered off the one line that did. Migas shipped
  // 24 kcal/serving for fried bread that way: three of its four lines
  // ("1 large Bread", "Half Garlic", "1 Handfull Pork") carry no grams, so
  // coverage saw only the bread and the low-kcal floor relaxed to 1.
  // If most substantial LINES are unweighed, the mass fraction is describing
  // a minority of the dish and cannot vouch for it.
  const unweighed = rows.filter((r) => !isNegligible(r) && !((r.parsed.grams ?? 0) > 0));
  // (lines filled by applyTypicalAmounts now have grams, so they are not
  // "unweighed" here — they pay for themselves through `estimated` doubt above)
  const substantialLines = rows.filter((r) => !isNegligible(r)).length;
  if (substantialLines > 0 && unweighed.length / substantialLines > UNWEIGHED_LINE_MAX) return null;

  // Sum one nutrient across matched ingredients, scaling per-100g by grams.
  // Stays null when NO ingredient reported it: null/servings would become 0
  // and fabricate a "0mg" out of missing data (QA P2-3).
  const sum = (field: string): number | null => {
    let total: number | null = null;
    for (const { parsed, food } of usable) {
      const v = (food as Record<string, unknown>)[field];
      // raw→cooked mass yield: a cooked record may carry `raw_yield` (< 1 when
      // cooking sheds mass, e.g. confit duck rendering its fat) so the eaten
      // nutrients = raw grams × yield × per-100g. Absent (every raw food, most
      // cooked ones) → 1, i.e. unchanged. Sourced per-record, not per-recipe.
      const y = (food as { raw_yield?: number }).raw_yield ?? 1;
      if (Number.isFinite(v)) total = (total ?? 0) + ((v as number) * (parsed.grams as number) * y) / 100;
    }
    return total;
  };
  const per = (v: number | null, dp: number): number | null =>
    v == null ? null : round(v / perServing, dp);

  // Final plausibility check on the ANSWER, not the inputs. An impossibly
  // HIGH figure (1855 kcal, Ayam Percik with a wrong serving count) always
  // means broken inputs — reject it. A LOW figure is trickier: 12 kcal from a
  // collapsed sum (Bakewell tart, almost nothing matched) is wrong, but ~5
  // kcal from a black coffee is exactly right. The coverage fraction tells the
  // two apart — with near-complete coverage a small total is a legitimately
  // light dish or drink, so only apply the low floor when coverage is partial.
  // (Number(null) is 0 — the same coercion v1's `null / perServing` performed.)
  const kcalPerServing = round(Number(sum("kcal")) / perServing, 0);
  if (!Number.isFinite(kcalPerServing as number) || kcalPerServing == null) return null;
  const coverage = countableGrams > 0 ? resolvedGrams / countableGrams : 0;
  const lowFloor = coverage >= 0.9 ? 1 : MIN_PLAUSIBLE_KCAL;
  if (kcalPerServing < lowFloor || kcalPerServing > MAX_PLAUSIBLE_KCAL) return null;

  const gramsTotal = usable.reduce((a, r) => a + (r.parsed.grams as number), 0);
  // Only a fallback: with curated facts the serving count is read from the
  // recipe rather than assumed, so this backstop does not apply.
  if (!facts && gramsTotal / perServing > MAX_PLAUSIBLE_SERVING_GRAMS) return null;

  // Confidence weights the two failure modes differently:
  //  - unmatched → the line is dropped from the sum, so the total is WRONG
  //    (understated). Counts full.
  //  - guessed   → our parser estimated the grams ("2 large eggs" → 100g,
  //    medium). The line IS in the sum, just approximate. Counts half.
  // Seasoning and garnish are dropped from the denominator (see NEGLIGIBLE).
  // The fallback keeps a recipe that is ENTIRELY seasoning from dividing by
  // zero — it gets scored on its own lines, as before.
  const counted = rows.filter((r) => !isNegligible(r));
  const scored = counted.length ? counted : rows;
  const resolved = (r: Row) => r.food && (r.parsed.grams ?? 0) > 0;
  // An `estimated` line is in the sum but its AMOUNT is ours, so it carries
  // the same doubt as a line we could not match at all.
  const unmatched = scored.filter((r) => !resolved(r) || r.estimated).length;
  // A resolver-picked food would count as "guessed" (half weight) in v1; the
  // engine never resolves, so only parser-approximated lines land here.
  const guessed = scored.filter(
    (r) => resolved(r) && (r.resolved || r.parsed.confidence !== "high")
  ).length;
  // Weighted by MASS, not by line count. Counting lines made one unmeasured
  // pinch of parsley score the same doubt as one guessed main ingredient,
  // which is why recipes that are 98% weighed read no better than recipes
  // that are half guesswork. What actually determines whether the calorie
  // total is right is how much of the DISH the uncertainty covers.
  //
  // Lines with no grams at all (nothing to weigh) keep a line-share penalty —
  // their mass is unknown by definition, so they cannot be weighted by it.
  const massOf = (r: Row) => ((r.parsed.grams ?? 0) > 0 ? (r.parsed.grams as number) : 0);
  const totalMass = scored.reduce((a, r) => a + massOf(r), 0);
  const doubtMass =
    scored.filter((r) => !resolved(r) || r.estimated).reduce((a, r) => a + massOf(r), 0) +
    scored
      .filter((r) => resolved(r) && !r.estimated && (r.resolved || r.parsed.confidence !== "high"))
      .reduce((a, r) => a + massOf(r), 0) * 0.5;
  const weightless = scored.filter((r) => massOf(r) === 0).length;
  const doubt =
    totalMass > 0
      ? doubtMass / totalMass + weightless / scored.length
      : (unmatched + guessed * 0.5) / scored.length;
  // "high" is not perfection. Garlic, onion and egg resolve through piece
  // weights and are rated "guessed" by design, so requiring doubt === 0 made
  // "high" unreachable for almost every real recipe rather than meaningful.
  let confidence: "high" | "medium" | "low" =
    doubt <= 0.1 ? "high" : doubt <= 0.3 ? "medium" : "low";

  // Two failures were being scored as one, and they are not the same thing:
  //
  //   food not identified  → the line is DROPPED, so the total is INCOMPLETE.
  //                          The number is wrong and understated.
  //   amount estimated     → the food is known and in the sum; only the
  //                          quantity is ours. The total is COMPLETE, just
  //                          approximate.
  //
  // "low" means something is MISSING from this number; a recipe with every
  // food identified floors at "medium" however many amounts we inferred.
  // FOUNDER CALL 2026-07-21: a complete total reads "high". The diagnostic is
  // NOT lost: `basis` below keeps the distinction. Audit on `basis`, not on
  // `confidence`.
  const everyFoodIdentified = scored.every((r) => r.food);
  if (confidence !== "high" && everyFoodIdentified) confidence = "high";

  return {
    kcal: kcalPerServing,
    protein_g: per(sum("protein_g"), 1),
    carbs_g: per(sum("carbs_g"), 1),
    fat_g: per(sum("fat_g"), 1),
    fiber_g: per(sum("fiber_g"), 1),
    sugar_g: per(sum("sugar_g"), 1),
    sodium_mg: per(sum("sodium_mg"), 0),
    basis_grams: round(gramsTotal / perServing),
    per: "serving",
    source: "usda",
    confidence,
    // How much of this total rests on amounts Otto inferred rather than ones
    // the recipe stated. "measured" = the recipe said; "estimated" = we did.
    // This is the honest grain the single confidence word no longer carries.
    basis: doubt <= 0.1 ? "measured" : "estimated",
    doubt: round(doubt, 2),
    computed_at: new Date().toISOString(),
  };
}
