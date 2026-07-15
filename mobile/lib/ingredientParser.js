// Deterministic ingredient parsing, scaling, and US↔Metric conversion.
// Powers real ingredient scaling (v2 roadmap Phase 0) for TheMealDB's prose
// measures and future imported recipes. Pure functions, no AI, no latency —
// numbers are never in character (Ask-Otto guardrail #2).
//
// parse("1 1/2 cups")            → { qty: 1.5, unit: "cup",  note: "" }
// parse("1 (12 oz.)")            → { qty: 1,   unit: null,   note: "(12 oz.)" }
// parse("Dash")                  → { qty: null, unit: null,  note: "Dash" }
// scaleQty(1.5, 2)               → 3
// formatQty(0.75)                → "¾"
// convertMeasure({qty,unit}, "metric") → { qty, unit } in ml/g

const UNICODE_FRACTIONS = {
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875, "⅕": 0.2,
};

// Display fractions we snap to — kitchen-real steps only (never "2.17 eggs").
const NICE_FRACTIONS = [
  [0, ""], [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.375, "⅜"], [0.5, "½"],
  [0.625, "⅝"], [2 / 3, "⅔"], [0.75, "¾"], [0.875, "⅞"], [1, ""],
];

const UNIT_ALIASES = {
  cup: ["cup", "cups", "c"],
  tbsp: ["tbsp", "tbsps", "tablespoon", "tablespoons", "tbs", "tblsp"],
  tsp: ["tsp", "tsps", "teaspoon", "teaspoons"],
  oz: ["oz", "oz.", "ounce", "ounces"],
  lb: ["lb", "lbs", "lb.", "pound", "pounds"],
  g: ["g", "g.", "gram", "grams", "gr"],
  kg: ["kg", "kilogram", "kilograms"],
  ml: ["ml", "ml.", "milliliter", "milliliters", "millilitres"],
  l: ["l", "liter", "liters", "litre", "litres"],
  pint: ["pint", "pints", "pt"],
  quart: ["quart", "quarts", "qt"],
  gallon: ["gallon", "gallons"],
  clove: ["clove", "cloves"],
  can: ["can", "cans", "tin", "tins"],
  pinch: ["pinch", "pinches"],
  dash: ["dash", "dashes"],
  handful: ["handful", "handfuls"],
  slice: ["slice", "slices"],
  piece: ["piece", "pieces"],
  sprig: ["sprig", "sprigs"],
  stick: ["stick", "sticks"],
  bunch: ["bunch", "bunches"],
};

const UNIT_LOOKUP = {};
for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
  for (const a of aliases) UNIT_LOOKUP[a] = canonical;
}

// Units we convert between systems (volume → ml, weight → g). Count-ish
// units (clove, can, pinch…) never convert.
const TO_METRIC = {
  cup: { factor: 240, unit: "ml" },
  tbsp: { factor: 15, unit: "ml" },
  tsp: { factor: 5, unit: "ml" },
  pint: { factor: 473, unit: "ml" },
  quart: { factor: 946, unit: "ml" },
  gallon: { factor: 3785, unit: "ml" },
  oz: { factor: 28, unit: "g" },
  lb: { factor: 454, unit: "g" },
};

const UNIT_LABELS = {
  cup: (q) => (q > 1 ? "cups" : "cup"),
  tbsp: () => "tbsp",
  tsp: () => "tsp",
  oz: () => "oz",
  lb: () => "lb",
  g: () => "g",
  kg: () => "kg",
  ml: () => "ml",
  l: () => "L",
  pint: (q) => (q > 1 ? "pints" : "pint"),
  quart: (q) => (q > 1 ? "quarts" : "quart"),
  gallon: (q) => (q > 1 ? "gallons" : "gallon"),
  clove: (q) => (q > 1 ? "cloves" : "clove"),
  can: (q) => (q > 1 ? "cans" : "can"),
  pinch: (q) => (q > 1 ? "pinches" : "pinch"),
  dash: () => "dash",
  handful: (q) => (q > 1 ? "handfuls" : "handful"),
  slice: (q) => (q > 1 ? "slices" : "slice"),
  piece: (q) => (q > 1 ? "pieces" : "piece"),
  sprig: (q) => (q > 1 ? "sprigs" : "sprig"),
  stick: (q) => (q > 1 ? "sticks" : "stick"),
  bunch: (q) => (q > 1 ? "bunches" : "bunch"),
};

const numberFrom = (token) => {
  if (UNICODE_FRACTIONS[token] != null) return UNICODE_FRACTIONS[token];
  if (/^\d+\/\d+$/.test(token)) {
    const [a, b] = token.split("/").map(Number);
    return b ? a / b : null;
  }
  if (/^\d+(\.\d+)?$/.test(token)) return parseFloat(token);
  return null;
};

// Parse a measure string like "1 1/2 cups", "¾ cup", "1 (12 oz.)", "Dash".
export function parseMeasure(measure) {
  const raw = (measure || "").trim();
  if (!raw) return { qty: null, unit: null, note: "" };

  let normalized = raw.replace(/^(\d+(?:\.\d+)?)([a-zA-Z]+\.?)$/,"$1 $2");
  const tokens = normalized.split(/\s+/);
  let qty = null;
  let i = 0;

  const first = numberFrom(tokens[0]);
  if (first != null) {
    qty = first;
    i = 1;
    // mixed number: "1 1/2" or "1 ½"
    if (i < tokens.length) {
      const second = numberFrom(tokens[i]);
      if (second != null && second < 1) {
        qty += second;
        i += 1;
      }
    }
  } else {
    // leading unicode fraction glued to unit? e.g. "½cup"
    const glued = raw.match(/^([¼½¾⅓⅔⅛⅜⅝⅞⅕])(.+)$/);
    if (glued) {
      qty = UNICODE_FRACTIONS[glued[1]];
      tokens[0] = glued[2];
    }
  }

  let unit = null;
  if (i < tokens.length) {
    const candidate = tokens[i].toLowerCase().replace(/[.,]$/, "");
    if (UNIT_LOOKUP[candidate]) {
      unit = UNIT_LOOKUP[candidate];
      i += 1;
    }
  }

  const note = tokens.slice(i).join(" ");
  return { qty, unit, note };
}

// Snap a scaled quantity to kitchen-real fractions.
export function snapQty(value) {
  if (value == null) return null;
  if (value >= 10) return Math.round(value);
  const whole = Math.floor(value);
  const frac = value - whole;
  let best = NICE_FRACTIONS[0];
  for (const cand of NICE_FRACTIONS) {
    if (Math.abs(cand[0] - frac) < Math.abs(best[0] - frac)) best = cand;
  }
  const snapped = whole + best[0];
  return snapped === 0 ? NICE_FRACTIONS[1][0] : snapped; // never snap to zero
}

// "1.5" → "1½", "0.75" → "¾", "3" → "3"
export function formatQty(value) {
  if (value == null) return "";
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  let fracGlyph = "";
  let bestDiff = 0.06; // tolerance
  for (const [f, glyph] of NICE_FRACTIONS) {
    if (glyph && Math.abs(f - frac) < bestDiff) {
      bestDiff = Math.abs(f - frac);
      fracGlyph = glyph;
    }
  }
  if (!fracGlyph && frac > 0.05) {
    // not a nice fraction — one decimal, trimmed
    return String(Math.round(value * 10) / 10);
  }
  if (whole === 0) return fracGlyph || "0";
  return `${whole}${fracGlyph}`;
}

// Convert a parsed measure to the target system ("us" | "metric").
// Only volume/weight units convert; counts pass through untouched.
export function convertMeasure({ qty, unit }, system) {
  if (qty == null || !unit) return { qty, unit };
  if (system === "metric" && TO_METRIC[unit]) {
    const { factor, unit: metricUnit } = TO_METRIC[unit];
    let value = qty * factor;
    // round to friendly metric numbers
    value = value >= 100 ? Math.round(value / 5) * 5 : Math.round(value);
    // upgrade large amounts
    if (metricUnit === "ml" && value >= 1000) return { qty: Math.round(value / 50) / 20, unit: "l" };
    if (metricUnit === "g" && value >= 1000) return { qty: Math.round(value / 50) / 20, unit: "kg" };
    return { qty: value, unit: metricUnit };
  }
  return { qty, unit }; // US display keeps original units
}

// Full display pipeline: parse → scale → convert → format.
// Returns { display, name } e.g. { display: "1½ cups", name: "soy sauce" }
export function scaledIngredient(pair, factor = 1, system = "us") {
  const { qty, unit, note } = parseMeasure(pair.measure);
  if (qty == null) {
    // unparseable ("Dash", "To serve", "Topping") — show as-is, never fake it
    return { display: pair.measure || "", name: pair.name, scalable: false };
  }
  const scaled = factor === 1 ? qty : snapQty(qty * factor);
  const converted = system === "metric" ? convertMeasure({ qty: scaled, unit }, "metric") : { qty: scaled, unit };
  const unitLabel = converted.unit ? ` ${UNIT_LABELS[converted.unit](converted.qty)}` : "";
  const noteText = note ? ` ${note}` : "";
  return {
    display: `${formatQty(converted.qty)}${unitLabel}${noteText}`.trim(),
    name: pair.name,
    scalable: true,
  };
}
