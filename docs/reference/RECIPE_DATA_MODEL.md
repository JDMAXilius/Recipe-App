# Otto recipe data model — design & best practices (2026-07-23)

**Why this doc:** now that Otto owns its recipe catalogue (`otto_recipes`), we need one deliberate
model for *serving size, metric weight, nutrition, and ingredients* — so the recipe card, the
detail nutrition card, and the ingredient list can never disagree. This captures the principle,
how the serious apps do it, the target schema, the data-quality levers, and a phased roadmap.

---

## 1. The problem we hit (grounded, not hypothetical)

Three real defects surfaced when the catalogue went live, and they share one root cause —
**several representations of "how much," derived from different places:**

| Symptom | Root cause |
|---|---|
| Recipe **card** kcal ≠ **detail** nutrition (Irish stew: 500 g lamb shown, but 1090 kcal — a 2× gap) | Nutrition scales by **canonical servings** (8); ingredient display scaled by a **different** servings (adapter nulled `canonical.servings` → app defaulted to ~4) |
| "Chivito uruguayo" shows **"0.5 Beef Brisket"** (canonical is a correct **300 g**) | Display re-parses the **text measure** ("2" ÷ scaling) instead of using the resolved **grams** |
| **30 recipes ≥ 1000 kcal/serving** (a serving is normally < 700) | **Servings under-set** by the canonicalizer (Pizza Express Margherita `servings:1`, Chick-Fil-A `1`, Cuban Sandwich/Chivito/alfredo `2`) — grams are right, the *yield* is wrong |

**The lesson:** grams and servings must have exactly one home, and every displayed number
(calories, macros, ingredient amounts) must be *derived* from it. No parallel re-parsing, no
overlay that can drift.

## 2. The principle — one source of truth

> The **canonical silver record** (`grams` + `key` + `servings` per recipe) is the truth.
> Nutrition, the card, and the ingredient list are all **derived** from it. Nothing is
> hand-edited downstream; nothing re-derives amounts from text a second time.

- **Grams is the atom.** Every ingredient resolves to a metric weight once. The human measure
  ("2 slices", "1 can") is a *label*, never the thing nutrition or scaling is computed from.
- **Servings is first-class.** It drives *everything* per-serving. It carries a basis (read from
  the recipe text vs inferred) and a confidence — treated like an ingredient `key` (null/flag
  beats a confident guess).
- **Gold is disposable.** `seed_nutrition` is a cache regenerated from silver; it is never the
  source, so it can't drift.

## 3. How the serious apps / vendors do it (and what we borrow)

| Source | Model | Borrow |
|---|---|---|
| **USDA FoodData Central** | Per-100g nutrients **+ `foodPortions`** (gram weight per household measure). The gram is the atom. | Our `usdaTable` per-100g base + `pieceWeights`/`cupWeights` = the same idea |
| **Cronometer** (accuracy gold standard) | Licenses lab-verified DBs (NCCDB/USDA); small, curated; per-100g × chosen serving-weight | Curate small + verified; per-food serving weights |
| **MyFitnessPal** | 20M-entry crowd DB + **named serving weights** the user picks ("1 medium = 120 g") → grams → nutrients | The "MFP model" = per-food serving-weight coverage (our future portion picker) |
| **NYT Cooking** (`ingredient-phrase-tagger`) | Parses each line → `{qty, unit, name, comment}` **while keeping the original phrase** — dual representation | Structured display fields **alongside** grams (see §4) |
| **Edamam / Spoonacular / Nutritionix** | NLP parse → grams via density/portion tables → per-100g nutrients, **with oil-absorption + cooked-yield factors** | Validates our guards (frying-medium film, cooked-yield); they own the ontology |
| **Whisk / Samsung Food** | Unstructured text → **canonical food ontology** → enrich | Our `usdaTable` keys are that ontology |

**Unanimous pattern:** grams is canonical; the human measure is a display label; nutrition =
`per-100g × grams ÷ servings`; **servings is a verified first-class field**; the food ontology
(keys) is the join. Otto already has ~all the pieces — the work is making them the *single* seam.

## 4. Target silver record (v2) — structured, one source of truth

```jsonc
{
  "id": "53063",
  "title": "Chivito uruguayo",
  "category": "Beef", "area": "Uruguayan",
  "servings": { "count": 4, "basis": "inferred", "note": "no yield stated; 300g beef + fillings serves ~4" },
  //            ^ was a bare number — now carries basis + confidence, like a key
  "instructions": ["..."],            // Otto-voice
  "ingredients": [{
    "original": "2 Beef Brisket",     // verbatim, never destroyed
    "display":  { "qty": 2, "unit": null, "name": "Beef Brisket" },  // human label (NYT dual-rep)
    "grams": 300,                     // THE amount — nutrition + scaling both use this
    "key": "beef brisket",            // usdaTable ontology join
    "cooked": false, "frying_medium": false,
    "confidence": "read",             // read | inferred | null (per-line honesty)
    "note": null
  }],
  "media": { ... }, "provenance": { ... }
}
```

**Rendering rules (so card/detail/ingredients can't disagree):**
- **Ingredient amount shown = `grams` scaled by the chosen servings** (unambiguous, matches
  nutrition). Show the human `display` measure as a secondary label at default servings
  ("2 Beef Brisket · 300 g"); when the user changes servings, grams lead (no "0.5 brisket").
- **Card kcal = detail kcal = `seed_nutrition`**, computed from `grams` ÷ `servings.count`. Same input.
- **`servings.count` is the ONLY divisor** everywhere.

## 5. Data-quality levers (in priority order)

1. **Servings verification — #1 lever.** It multiplies every per-serving number. Rule: cite the
   yield phrase from the instructions ("serves 4", "cut into 8"); if none, infer *and* mass-sanity-
   check (a main serving ≈ 300–700 g / 400–800 kcal; flag `basis:"inferred"` + low confidence).
   **A high per-serving kcal (> ~1000) is a REVIEW TRIGGER, not a cap.** A recipe is allowed to read
   over 1000 kcal/serving as long as it checks out against USDA + a Claude review — a rich confit,
   a whole pizza, or a 1 lb-pork Cuban sandwich is *honestly* that caloric. Never divide servings
   just to push a number under a threshold; that hides a real value or, worse, hides a real bug.
   Triage by **energy density** (`tools/list-high-kcal.mjs`): plausible density + low servings =
   maybe under-set; impossible savory density (> ~3.3 kcal/g) = an ingredient over-count to fix at
   the source. **Audit outcome (2026-07-24):** of ~30 recipes ≥ 1000 kcal, only a handful were real
   defects (Ensaimada servings, Chinon puff-pastry, Lamingtons coating, Duck Confit raw-fat); the
   rest were legitimately rich and were LEFT — >1000 is fine when verified.
2. **Gram resolution** — piece/cup/density weights; `count → grams`. The real accuracy lever
   (the "weight layer"). Grow USDA-verified per-piece weights (the MFP model).
3. **Cooked-yield + oil-absorption** — raw↔cooked records, frying-medium film. (Shipped; keep
   `cooked` only where a cooked record exists — see the recompute honesty rule.)
4. **USDA key accuracy** — the ontology; leaner default cuts; real fdcIds + proxies noted.
5. **Honesty everywhere** — per-line confidence, `null` beats a guess, plausibility refusals to a
   labelled category estimate. Never a confident-wrong number.

## 6. Roadmap (phased, modular — each shippable alone)

- **Phase 1 — single source of truth on the read path (IN PROGRESS).** Adapter surfaces
  `canonical.servings` + per-ingredient `grams`; the detail renders grams (scaled) as the amount;
  card + detail + ingredients all derive from grams + servings. Fixes the 2× mismatch + "0.5 brisket".
- **Phase 2 — servings re-verification.** A pass over recipes with implausible per-serving kcal
  (> ~900): re-read the yield from instructions / mass-sanity-check, correct `servings`, mark basis.
  (The canonicalizer prompt already has the honesty gate — this re-runs it targeted, or a
  deterministic mass-based flag → human review.)
- **Phase 3 — enrich the silver schema.** Add the structured `display {qty, unit, name}` and
  per-line `confidence` (the NYT dual representation). Migrate the pipeline to emit them.
- **Phase 4 — retire `recipeFacts.json`.** Fold servings/cooked/frying into canonical so there is
  literally one place for per-recipe facts. (Currently canonical + the overlay coexist.)
- **Phase 5 — named serving weights / portion picker (the MFP model).** Per-food serving-weight
  coverage so users can log "1 cup" etc. Future / product-driven.
- **Governance (continuous).** Silver is git-versioned + PR-reviewed (the medallion "silver as
  source of truth"); gold (`seed_nutrition`) is regenerable and never hand-edited; every new
  recipe (editorial / Ask-Otto / user gem) enters through the **canonicalizer + critic gate**
  (OWN_RECIPE_DB.md Phase 6/7) so the catalogue only ever holds verified data.

## 7. Non-goals / deliberate simplicity
- No graph DB (a 792-recipe catalogue on a 974-key ontology needs none — Whisk-scale is not ours).
- No runtime parser for seeds (grams resolved once at canonicalization; the parser stays for
  *user imports*, where free text actually lives).
- One canonical JSON file + one JSONB column, not a normalized child table (the app reads whole
  recipes; add a GIN index for search later without a schema change).

**Bottom line:** Otto already computes correct numbers — the redesign is about making the
*canonical record the single seam* so nothing downstream can disagree, and treating **servings**
with the same honesty rigor we already apply to ingredient keys. See `OWN_RECIPE_DB.md` for the
medallion architecture this sits inside, and `NUTRITION_ACCURACY.md` for the engine guards.
