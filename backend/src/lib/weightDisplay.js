// Weight-first amounts for the public share pages — the server-side mirror of
// the app's display rules (mobile/lib/foodScale.js is the source of truth for
// the product decisions; this stays deliberately small).
//
// Why a mirror and not an import: Railway deploys with Root Directory
// `backend`, so mobile/ does not exist in the image. The conversion itself
// reuses the backend's OWN parser (parseIngredientLine → grams), which the
// display cross-check keeps aligned with the app's table.
//
// Founder rules (2026-07): grams for everything weighable, ml for thin
// pourables, decimals never fractions ("0.5 tsp"), spice-spoon amounts stay
// spoons, anything unresolved shows the original measure verbatim.
import { parseIngredientLine } from "./nutrition/parseIngredient.js";

// Mirrors foodScale.js LIQUID_RE / SEASONING_RE in spirit (kept short: the
// share page can always fall back to the honest raw measure).
const LIQUID_RE =
  /\b(water|milk(?!\s*powder)|buttermilk|cream(?!\s*cheese| of tartar|ed)|stock|broth|wine(?!\s*leaves)|beer|stout|cider|brandy|rum|sherry|sake|mirin|juice|vinegar|oil(?!ive)|olive oil|coconut milk|passata|soy sauce|kefir|espresso|coffee)\b/i;
const SEASONING_RE =
  /\b(salt|pepper|paprika|cumin|coriander seeds?|cinnamon|nutmeg|allspice|turmeric|curry powder|masala|seasoning|oregano|thyme|rosemary|sage|bay lea|cardamom|saffron|vanilla|baking (powder|soda)|yeast|zest|dried [a-z]+)\b/i;

const VOLUME_UNITS = new Set(["cup", "tbsp", "tsp", "ml", "l"]);

const dec = (v) => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// measure + name → the amount string the page prints. Never throws; anything
// uncertain returns the original measure unchanged.
export function weightAmount(measure, name) {
  const raw = String(measure || "").trim();
  if (!raw) return "";
  // Unmeasurables pass through verbatim, like the app: "Handful", "Pinch",
  // "1 sprig" are the author's honest amount, not something to weigh.
  if (!/\d/.test(raw) || /\b(pinch|dash|handful|sprig|bunch|knob|drop)/i.test(raw)) return raw;
  try {
    const parsed = parseIngredientLine(`${raw} ${name || ""}`.trim());
    if (!parsed || parsed.qty == null) return raw;

    // Spice-rack lines keep their spoons (a scale can't read them) — but
    // decimal-format the quantity so "½ tsp" prints as "0.5 tsp".
    if (SEASONING_RE.test(String(name || "")) && (!parsed.unit || VOLUME_UNITS.has(parsed.unit))) {
      return parsed.unit ? `${dec(parsed.qty)} ${parsed.unit}` : raw;
    }

    // Thin pourables → ml.
    if (LIQUID_RE.test(String(name || "")) && parsed.unit && VOLUME_UNITS.has(parsed.unit)) {
      const ML = { cup: 240, tbsp: 15, tsp: 5, ml: 1, l: 1000 };
      const ml = parsed.qty * ML[parsed.unit];
      return ml >= 10 ? `${dec(ml)} ml` : raw;
    }

    // Everything else with a computed weight → grams (5 g scale floor).
    if (parsed.grams != null && parsed.grams >= 5) return `${dec(parsed.grams)} g`;
    return raw;
  } catch {
    return raw;
  }
}
