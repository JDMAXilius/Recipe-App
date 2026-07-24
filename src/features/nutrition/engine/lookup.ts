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
  // `yield_from_raw` (bool opt-in) + `raw_yield` (derived number) ride here too.
  [nutrient: string]: number | string | boolean | null;
}

// v1 passes `cookedSet.has(key(name))` — the cooked state is a boolean at the
// lookup seam (the classification that PRODUCES it lives outside the engine).
export type CookedState = boolean;

const TABLE = table as Record<string, FoodRow>;
const COOKED_TABLE = cookedTable as Record<string, FoodRow>;

export const key = (s: unknown): string => String(s || "").trim().toLowerCase();

// Raw→cooked mass yield, DERIVED not hard-coded. Protein is ~conserved through
// cooking, so mass_cooked / mass_raw = protein_density_raw / protein_density_cooked.
// A cooked record opts in with `yield_from_raw: true` (only for pairings where the
// raw row is the SAME whole food — NOT the canned/prepared "raw" rows, and NOT
// water-absorbing grains, whose ratios are meaningless or huge). The number itself
// falls out of the two USDA records; the engine reads `raw_yield` in compute.sum().
// Exported so the offline recompute mirror derives identically.
export function deriveRawYield(k: string): number | undefined {
  const cooked = COOKED_TABLE[k];
  if (!cooked?.yield_from_raw) return undefined;
  const rp = TABLE[k]?.protein_g;
  const cp = cooked.protein_g;
  if (typeof rp === "number" && typeof cp === "number" && rp > 0 && cp > 0) return rp / cp;
  return undefined;
}
// Stamp it once at load so lookups return a cooked record that already carries the
// numeric yield — compute.ts stays a pure `food.raw_yield ?? 1` read.
for (const k of Object.keys(COOKED_TABLE)) {
  const y = deriveRawYield(k);
  if (y !== undefined) COOKED_TABLE[k].raw_yield = y;
}

// A literal cooked-state word IN the ingredient line/name — a deterministic read
// of explicit text, NOT an inference from instructions (the frying-medium design
// correctly forbids that; here the cook wrote "cooked"/"boiled" on the line
// itself). CONSERVATIVE by design: roasted/grilled/fried/baked are excluded
// because they usually NAME the ingredient (roasted peppers, roasted sesame oil,
// baked beans product) rather than mark a raw→cooked yield change.
export const COOKED_WORD = /\b(cooked|boiled|steamed|par-?boiled|pre-?cooked)\b/i;
const stripCookedWord = (s: unknown): string =>
  key(s).replace(COOKED_WORD, "").replace(/\s+/g, " ").trim();

// Does a cooked USDA record exist for this food? Gates the AUTO cooked path in
// compute so it can only ever IMPROVE (swap raw→cooked when we have the cooked
// record) and never regress (no record → the line stays raw, never dropped).
// Checks the exact name/item AND the cooked-word-stripped base ("cooked rice" →
// "rice", "boiled potatoes" → "potatoes"), since the cooked table is keyed by
// base food. Curated recipeFacts.cooked does NOT use this gate — a human said
// cooked, so its honest drop-to-null on a missing record is preserved.
export function hasCookedRecord(name: unknown, parsedItem: unknown): boolean {
  for (const b of [key(name), key(parsedItem), stripCookedWord(name), stripCookedWord(parsedItem)]) {
    if (b && COOKED_TABLE[b]) return true;
  }
  return false;
}

// AUTO-COOK DENYLIST: a handful of foods take "boiled"/"cooked" as part of a
// PRODUCT NAME, not a raw→cooked yield change, and the cooked-table record for
// them is a WORSE match than the raw/product row — so the AUTO path must NOT
// flip them. The CURATED path is unaffected (a human can still mark them
// cooked). Matched at the END of the food name so it's the head noun, not a
// modifier ("egg noodles" ends in "noodles" → not denied). Evidence, each:
//   ham          — "boiled ham" is a deli product (~120-145). The cooked row is
//                  "Pork, cured, ham, ... cooked" (172, +62%); raw "Cure 81
//                  Ham" (106) is closer.
//   egg / eggs   — the only cooked-egg record is FRIED (196). "boiled eggs" is
//                  not fried; raw whole egg (143) is closer than the +37% fry.
//   corned beef  — cooked row (453) is +129% over the raw cured product (198).
const COOK_AUTO_DENY = /\b(corned beef|ham|eggs?)\s*$/i;

// Which denylisted food does this line name (→ its raw table key), or null.
// Only consulted by compute AFTER it confirms an auto-cook would otherwise
// fire, so it never resolves lines that were staying null on their own.
export function cookAutoDenied(name: unknown, parsedItem: unknown): string | null {
  for (const b of [key(name), key(parsedItem)]) {
    const m = b.match(COOK_AUTO_DENY);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

// Auto cooked lookup (the gated path above already confirmed a record exists):
// try the full name first so a specific key like "boiled potatoes" wins over the
// generic "potatoes", then fall back to the cooked-word-stripped base. Kept
// SEPARATE from lookup()'s cooked branch, which stays exact-match-only so curated
// recipes ("Boiled Rice" with no "boiled rice" record) keep dropping to null.
export function lookupCookedAuto(name: string | null, parsedItem: string | null): FoodRow | null {
  return (
    COOKED_TABLE[key(name)] ||
    COOKED_TABLE[key(parsedItem)] ||
    COOKED_TABLE[stripCookedWord(name)] ||
    COOKED_TABLE[stripCookedWord(parsedItem)] ||
    null
  );
}

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
  // Singular/plural fold, last resort: a staple written singular ("carrot")
  // when the table keys it plural ("carrots"), or vice-versa. Trailing -s ONLY
  // — never f/ves, which would collapse distinct foods (leaf/leaves). Because it
  // runs only after every exact and qualifier-stripped form has missed, it can
  // only ADD a hit to a line that was already null; it can never redirect a food
  // that already resolved.
  const foldS = (k: string): string => (k.endsWith("s") ? k.slice(0, -1) : k + "s");
  // Fold-unsafe stems: the folded key collides with a DIFFERENT food. "peppers"
  // (the vegetable, freeform "2 peppers") folds to "pepper" = the black-pepper
  // SPICE row (251 kcal/100g) — a ~10x-wrong confident hit where honest-null is
  // correct. "pepper" is the only calorie-bearing homograph in the table, so
  // this denylist stays a single entry rather than a general stemmer.
  const FOLD_UNSAFE = new Set(["pepper"]);
  for (const base of [key(name), key(parsedItem), ...candidates]) {
    if (!base) continue;
    const folded = foldS(base);
    if (FOLD_UNSAFE.has(folded)) continue; // keep the honest null
    const hit = TABLE[folded];
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
