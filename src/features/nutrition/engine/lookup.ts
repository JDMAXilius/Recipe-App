// Port of the deterministic lookup surface: usdaProvider.js `lookup` (name +
// parsed item + cooked state → USDA food row), resolveIngredient.js
// `foodForKey` (test seam), and resolveCooked.js `shapeCookedDecisions` (the
// pure decision shaping — the Anthropic call around it is an edge function,
// NOT engine code; the engine itself never classifies, so an ambiguous line
// stays ambiguous and compute refuses honestly).
import table from "./data/usdaTable.json" with { type: "json" };
import cookedTable from "./data/usdaCookedTable.json" with { type: "json" };

export interface FoodRow {
  fdcId: number | null;
  usda: string;
  kcal: number;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  [nutrient: string]: number | string | null;
}

// v1 passes `cookedSet.has(key(name))` — the cooked state is a boolean at the
// lookup seam (the classification that PRODUCES it lives outside the engine).
export type CookedState = boolean;

const TABLE = table as Record<string, FoodRow>;
const COOKED_TABLE = cookedTable as Record<string, FoodRow>;

export const key = (s: unknown): string => String(s || "").trim().toLowerCase();

// Leading qualifiers that DON'T change a food's identity — safe to strip when
// the full name misses. "white rice" → "rice", "boneless chicken thighs" →
// "chicken thighs", "fresh basil" → "basil". Deliberately excludes words that
// DO change identity and have their own rows: brown/red/green/sweet/baby/wild
// (brown rice ≠ rice, green beans ≠ beans, sweet potato ≠ potato). Without
// this, freeform user recipes silently drop common lines and understate the
// whole total — the exact confidently-wrong failure the honesty law forbids.
const QUALIFIER =
  /^(white|boneless|skinless|skin-on|bone-in|fresh|raw|cooked|large|small|medium|extra|jumbo|whole|halved|chopped|diced|minced|sliced|shredded|grated|crushed|ground|lean|plain|organic|free-?range|unsalted|salted|light|reduced-fat|low-?fat|full-?fat|firm|ripe|cold|warm|dried|frozen|canned|tinned)\s+/i;

function stripQualifiers(name: unknown): string[] {
  let n = String(name || "").trim();
  const seen: string[] = [];
  while (QUALIFIER.test(n)) {
    n = n.replace(QUALIFIER, "").trim();
    seen.push(n);
  }
  return seen; // progressively-shortened candidates, most-specific first
}

// TRAILING prep clauses — "chicken breast, sliced thin", "garlic, minced",
// "fresh parsley, chopped". QUALIFIER above only strips LEADING words, so
// these missed the table entirely; when the miss was the recipe's main
// ingredient, coverage collapsed and the whole card fell back to the generic
// category estimate — a fabricated macro split on an honest-looking number
// (TestFlight QA 2026-07-21, garlic butter chicken: 20 g phantom carbs).
// A clause is dropped only when EVERY word in it is a preparation word.
// Identity words are deliberately absent — "beans, canned" and "tomatoes,
// sun-dried" keep their clause and their own (or no) row, never the raw one.
const TRAILING_PREP_WORD =
  /^(?:sliced|diced|chopped|minced|shredded|grated|crushed|julienned|cubed|quartered|halved|peeled|seeded|deseeded|cored|trimmed|rinsed|drained|beaten|melted|softened|divided|optional|thin|thinly|thick|thickly|fine|finely|rough|roughly|coarse|coarsely|fresh|freshly|small|medium|large|extra|cut|into|pieces|strips|chunks|wedges|rings|lengthwise|crosswise|at|room|temperature|and|or|to|for|taste|serve|serving|garnish|plus|more)$/i;

function stripTrailingPrep(name: unknown): string | null {
  const parts = String(name || "").split(",");
  if (parts.length < 2) return null;
  let end = parts.length;
  while (end > 1) {
    const words = parts[end - 1].trim().split(/\s+/).filter(Boolean);
    if (!words.length || !words.every((w) => TRAILING_PREP_WORD.test(w))) break;
    end--;
  }
  if (end === parts.length) return null; // nothing safe to strip
  return parts.slice(0, end).join(",").trim();
}

export function lookup(name: string | null, parsedItem: string | null, cooked: CookedState): FoodRow | null {
  if (cooked) {
    const c = COOKED_TABLE[key(name)] || COOKED_TABLE[key(parsedItem)];
    if (c) return c;
    // Flagged cooked but we have no cooked record — the raw row would be ~3x
    // wrong, so drop the line rather than substitute it.
    return null;
  }
  const direct = TABLE[key(name)] || TABLE[key(parsedItem)];
  if (direct) return direct;
  // Trailing prep clause stripped ("chicken breast, sliced thin" → "chicken
  // breast") — checked directly first, then fed through the same qualifier
  // pipeline below ("fresh parsley, chopped" → "fresh parsley" → "parsley").
  const bases = [stripTrailingPrep(name), stripTrailingPrep(parsedItem)].filter(
    (b): b is string => Boolean(b)
  );
  for (const b of bases) {
    const hit = TABLE[key(b)];
    if (hit) return hit;
  }
  // Full name missed — try, in order: leading non-identity qualifiers stripped,
  // then two aliases for the commonest regional/word-order gaps.
  const candidates = [
    ...stripQualifiers(name),
    ...stripQualifiers(parsedItem),
    ...bases.flatMap((b) => [b, ...stripQualifiers(b)]),
  ];
  for (const raw of [key(name), key(parsedItem), ...candidates]) {
    // "beef mince" / "pork mince" → the table's "minced beef" (word order).
    const mince = raw.match(/^(beef|pork|lamb|chicken|turkey)\s+mince$/);
    if (mince) candidates.push(`minced ${mince[1]}`);
    // Bare cheese name → "<x> cheese" (table keys are "cheddar cheese", etc.).
    // "grated cheddar" already strips to "cheddar" above, then this appends.
    if (raw && !/\bcheese\b/.test(raw)) candidates.push(`${raw} cheese`);
  }
  for (const cand of candidates) {
    const hit = TABLE[key(cand)];
    if (hit) return hit;
  }
  return null;
}

// Test seam (ports resolveIngredient.js foodForKey): a bundled key's food row.
export const foodForKey = (canonicalKey: unknown): FoodRow | null => TABLE[key(canonicalKey)] || null;

export type CookedDecision = "raw" | "cooked" | "unknown";

// Pure + testable (ports resolveCooked.js shapeCookedDecisions): classifier
// output → Map<normalizedName, state>, enum-clamped, every asked name
// guaranteed present (missing → "unknown"). The classifier itself is an edge
// function; the engine only ever shapes its (cached) verdicts.
export function shapeCookedDecisions(
  data: { decisions?: { name?: unknown; state?: unknown }[] } | null | undefined,
  askedNames: string[]
): Map<string, CookedDecision> {
  const byName = new Map(
    (data?.decisions || [])
      .filter((d) => d && ["raw", "cooked", "unknown"].includes(d.state as string))
      .map((d) => [key(d.name), d.state as CookedDecision])
  );
  const out = new Map<string, CookedDecision>();
  for (const n of askedNames) out.set(key(n), byName.get(key(n)) || "unknown");
  return out;
}
