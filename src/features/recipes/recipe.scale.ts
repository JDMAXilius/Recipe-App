// Live ingredient scaling — the pure glue between the frozen engine parser and
// the detail screen's ingredient list. Weight-first: the engine already resolves
// each line to grams (its density/piece tables), so Metric shows that computed
// weight; US shows the recipe's own stated measure, scaled. One parse, two
// honest displays — no fabricated conversions beyond what the engine computes.
//
// Behaviour pinned by recipe.scale.test.mjs.
// The engine parse is the allowlisted dependency (@/features/nutrition/engine).
// Imported relatively — a runtime value import must resolve under `npm test`,
// whose loader doesn't read tsconfig `@/` aliases (same as estimates.ts →
// ./engine/guards). Resolves to the identical module either way.
import { parseIngredientLine } from '../nutrition/engine/parse';
// The feature's own pair (carries the ON-path `grams`); structurally a superset
// of the engine's { measure?, name? }, so parseIngredientLine still accepts it.
import type { IngredientPair } from './recipe.types';

export type UnitSystem = 'metric' | 'us';

export interface ScaledRow {
  display: string; // the amount ("237 g", "1.5 tbsp") — '' when unmeasurable
  name: string;
  scalable: boolean; // false → "to taste"/"pinch" with no qty: sinks to the bottom
}

// Food-scale number rule (v1 locked decision): 1 decimal place, trailing .0
// stripped. "166.66 g" → "166.7", "150.0" → "150". Never fractions.
function fmt(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function scaleIngredient(
  pair: IngredientPair,
  rawFactor: number,
  system: UnitSystem,
): ScaledRow {
  // Guard a non-finite or non-positive factor (a recipe with servings 0 or a
  // parsed-NaN yield): scaling by Infinity/NaN would render "Infinity g". Fall
  // back to 1× so the amounts stay the recipe's own, never garbage.
  const factor = Number.isFinite(rawFactor) && rawFactor > 0 ? rawFactor : 1;
  const parsed = parseIngredientLine(pair);
  const name = (pair.name ?? parsed.item ?? '').trim();

  // ON-path single source of truth: when the canonical record carried this
  // line's grams (the weight seed_nutrition was computed from), show THAT,
  // scaled — in both unit systems — so the amount and the nutrition describe the
  // same portion, and count-measures ("2" Beef Brisket) render as their real
  // weight instead of a nonsensical scaled count. The OFF/TheMealDB path has no
  // grams and falls through to the unchanged text-measure behaviour below.
  if (pair.grams != null && Number.isFinite(pair.grams)) {
    const grams = pair.grams * factor;
    const display = grams > 1000 ? `${fmt(grams / 1000)} kg` : `${fmt(grams)} g`;
    return { display, name, scalable: true };
  }

  // Metric / weight-first: the engine's grams are the display when it resolved a
  // weight. Roll to kg above 1000 g (shopping-scale convention).
  if (system === 'metric' && parsed.grams != null) {
    const grams = parsed.grams * factor;
    const display = grams > 1000 ? `${fmt(grams / 1000)} kg` : `${fmt(grams)} g`;
    return { display, name, scalable: true };
  }

  // US (or a line the engine couldn't weigh): keep the source measure, scaled.
  if (parsed.qty != null) {
    const qty = parsed.qty * factor;
    const unit = parsed.unit ? ` ${parsed.unit}` : '';
    return { display: `${fmt(qty)}${unit}`.trim(), name, scalable: true };
  }

  // No quantity at all ("to taste", "for greasing") — unscalable, verbatim.
  return { display: (pair.measure ?? '').trim(), name, scalable: false };
}

// Split a recipe's lines into scalable rows and the unmeasurable "pantry" tail,
// preserving order within each group (positional separation, not a ghetto label).
export function scaleIngredients(
  pairs: IngredientPair[],
  factor: number,
  system: UnitSystem,
): { scalable: ScaledRow[]; pantry: ScaledRow[] } {
  const rows = pairs.map((p) => scaleIngredient(p, factor, system));
  return {
    scalable: rows.filter((r) => r.scalable),
    pantry: rows.filter((r) => !r.scalable),
  };
}

// The plain scaled lines ShareCard / buildRecipeShareText take (pre-formatted
// strings so the picture and the text always match what was on screen).
export function scaledIngredientLines(
  pairs: IngredientPair[],
  factor: number,
  system: UnitSystem,
): string[] {
  return pairs.map((p) => {
    const r = scaleIngredient(p, factor, system);
    return [r.display, r.name].filter(Boolean).join(' ').trim();
  });
}
