// Live USDA FoodData Central search (nutrition Increment 2). When the bundled
// 920-row table has no good match, this reaches the full ~600k-food USDA
// database so the Claude matcher has real candidates to pick from. USDA data is
// public domain (CC0), so — unlike the specialist nutrition APIs — its numbers
// can be cached permanently, which is the whole reason Otto uses USDA.
//
// This module ONLY fetches and shapes candidates; Claude picks among them
// (resolveIngredient.js) and every number comes from USDA's own response.
// DORMANT without USDA_API_KEY — searchUsdaFoods returns [] and the matcher
// stays on the bundled table.
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";

export const usdaSearchActive = () => Boolean(ENV.USDA_API_KEY);

// Foundation + SR Legacy are whole-food, per-100g records — the clean basis a
// recipe ingredient wants. Branded (per-serving, messy) and Survey are excluded
// on purpose.
const DATA_TYPES = "Foundation,SR Legacy";
const PAGE_SIZE = 6;
const SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

// USDA nutrient NUMBERS (stable across the API's shapes) → our macro fields.
const NUTRIENT_BY_NUMBER = {
  "208": "kcal",
  "203": "protein_g",
  "204": "fat_g",
  "205": "carbs_g",
  "291": "fiber_g",
  "269": "sugar_g",
  "307": "sodium_mg",
};

// Pure: a USDA food's nutrient array → our per-100g macro shape. The search API
// returns flat items ({nutrientNumber, value}); the detail API nests
// ({nutrient:{number}, amount}). Handle both so the same extractor works on
// either. Missing nutrients stay null (never fabricated as 0). TESTABLE.
export function extractPer100g(foodNutrients) {
  const out = { kcal: null, protein_g: null, fat_g: null, carbs_g: null, fiber_g: null, sugar_g: null, sodium_mg: null };
  for (const n of foodNutrients || []) {
    const number = String(n?.nutrientNumber ?? n?.nutrient?.number ?? "");
    const value = n?.value ?? n?.amount;
    const field = NUTRIENT_BY_NUMBER[number];
    if (field && Number.isFinite(value)) out[field] = value;
  }
  return out;
}

// query → [{ fdcId, description, per100g }] (top Foundation/SR-Legacy hits).
// Never throws; dormant or on any failure returns []. Only candidates that
// actually carry a calorie figure are kept — a row we can't get kcal from is
// useless to the sum.
export async function searchUsdaFoods(query) {
  const q = String(query || "").trim();
  if (!q || !usdaSearchActive()) return [];
  try {
    const url = `${SEARCH_URL}?api_key=${encodeURIComponent(ENV.USDA_API_KEY)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: q, dataType: DATA_TYPES.split(","), pageSize: PAGE_SIZE }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`USDA search answered ${res.status}`);
    const data = await res.json();
    return (data.foods || [])
      .map((f) => ({ fdcId: f.fdcId, description: f.description, per100g: extractPer100g(f.foodNutrients) }))
      .filter((c) => c.fdcId && Number.isFinite(c.per100g.kcal));
  } catch (error) {
    logger.warn({ err: error.message, query: q }, "USDA search failed");
    return [];
  }
}

// A picked USDA candidate → the same food-row shape the bundled table uses, so
// computeNutrition treats it identically. Numbers are USDA's, verbatim.
export function candidateToFoodRow(candidate) {
  if (!candidate || !Number.isFinite(candidate.per100g?.kcal)) return null;
  return {
    fdcId: candidate.fdcId,
    usda: candidate.description,
    ...candidate.per100g,
  };
}
