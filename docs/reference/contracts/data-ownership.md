# Contract — Data ownership (one source of truth per kind)

Status: v2 · Extends `engine.md` Law 3 ("one data copy") and Law 4 (estimates).
Rule of thumb: **data lives in data files; logic files hold algorithms, not
ingredients.** If you are typing an ingredient name next to a number in a `.ts`
file, stop — that number belongs in a JSON reference file.

## Who owns what

| Data kind | The ONE owner | Who may reference it | Never lives in |
|---|---|---|---|
| Per-ingredient **nutrition** (per-100g) | `engine/data/usdaTable.json` | `lookup.ts` reads it | any `.ts`, any component, `estimates.ts` |
| Per-ingredient **cooked** nutrition | `engine/data/usdaCookedTable.json` | `lookup.ts` | anywhere else |
| Per-ingredient **weights** (piece / cup) | `engine/data/pieceWeights.json`, `cupWeights.json` | `parse.ts` | inline tables in `parse.ts` — see Known deviation |
| Per-**recipe** facts (servings, cooked, frying) | `engine/data/recipeFacts.json` | `compute.ts` (`buildContext`) | hardcoded per-recipe branches |
| Per-**dish-category** fallback estimates | `estimates.ts` (`ESTIMATES`) | nutrition feature, fallback only | `usdaTable.json` (not ingredient data) |

The source of truth is **fed by USDA** (FoodData Central, public-domain). Every
value carries a real `fdcId`; a value with no real record is not added (honesty
law). Unseen ingredients are resolved at runtime by the `resolve-nutrition` edge
function (Claude picks a real USDA record), then cached — never invented inline.

## What logic files MAY hold (not data)

`parse.ts` / `lookup.ts` / `guards.ts` / `compute.ts` are algorithms. They may
contain, and these are NOT "ingredient data":

- **Universal unit constants** — `MASS_G` (g/oz/lb), `VOLUME_ML` (ml/cup/tbsp),
  `APPROX_G` (pinch/dash/handful). True everywhere, not per-ingredient.
- **Model parameters** — absorption factors (`FAT_ABSORBED_PER_100G`), thresholds
  (`FRYING_MEDIUM_MIN_G`, `MAX_PLAUSIBLE_KCAL`, the carb ceiling). Physics/policy,
  not an ingredient's identity.
- **Classification rules** — regexes deciding *what class* a line is (`FAT_RE`,
  `CONDIMENT_RE`, `AMBIGUOUS_GRAIN`, the qualifier/prep strippers). These key on
  words to pick an algorithm; they hold no nutrition or weight values.

The line: a **number tied to a specific ingredient** is data (owned by a JSON
file). A **rule or constant that applies across ingredients** is logic.

## Known deviation (documented, not hidden) → ticket T2

`parse.ts` still holds per-ingredient **weight** data inline: `DENSITY`,
`PIECE_G`, `EACH_G` (e.g. how many grams one onion is, oil's density). By the
table above these belong in `pieceWeights.json` / `cupWeights.json`. Consolidating
them is **ticket T2** (`docs/tickets/NUTRITION_ACCURACY.md`); the USDA-verification
half of that needs network. Until then, treat the JSONs as the growth target and
add new weights there, not to the inline tables.

## When recipe data comes out wrong (the modular loop)

TheMealDB recipes carry unreliable ingredient names and measurements; the error
is almost always an **over-count** (oil is the most visible, but it can be any
line). The fix is always general and data-driven — **never** a hardcoded
per-ingredient or per-recipe branch in a logic file:

1. **Detect** — `tools/nutrition-breakdown.mjs` (T6) flags the outlier line
   (grams, kcal share, unmatched, oil counted whole) and its matched USDA record.
2. **Diagnose the layer** — a too-high total is almost always the **weight or
   cooking layer**, never the per-100g table (a per-100g value × grams ÷ servings
   is small per portion). Confirm which line and why.
3. **Fix at the source, by kind:**
   - Wrong/fatty **nutrition match** → correct the entry in `usdaTable.json`
     (re-point to a real leaner `fdcId` already present, or add one via USDA).
   - Wrong **amount / cooking interpretation** (oil as a browning medium, a batch
     condiment, an already-cooked line, the serving count) → a curated flag in
     `recipeFacts.json`, or a general guard keyed on classification.
   - **Unseen** ingredient → let `resolve-nutrition` (Claude + USDA) match it.
4. **Verify with Claude** — when a value is doubtful or a name won't match,
   cross-check the USDA record with Claude; trust it when the data source and the
   check agree. Confirm the fix with the golden + laws suites (they pin behavior
   so a fix for one dish can't silently shift another).

Solve the **class**, not the instance: any fix must be one an equivalent recipe
would benefit from, expressed as data or a general rule — not a special case.
