# 🔬 Nutrition pipeline — industry & data-source research

> Written 2026-07-21 (terminal, Fable session), from a three-stream research pass done while
> driving the confidence campaign (REDESIGN_NOTES Phases 18–20). Companion to `DESIGN_RESEARCH.md`
> and `IMPORT_SHARE_RESEARCH.md`. This is **reference** — what others do, what we may legally ship,
> and which public-domain datasets close the remaining gaps. The actionable build order lives in
> `BACKEND_ROADMAP.md`.
>
> Every dataset below was checked for licence. The standing rule (bought painfully by the Edamam
> episode, see `TERMINAL_HANDOFF`/roadmap): **read a vendor's cache & retention terms BEFORE building
> a table on their data.**

---

## 1. Headline findings

1. **Our architecture is already the industry-standard one.** Store nutrition per 100 g, multiply by
   a per-measure gram weight. Whisk's `nutrition_coefficient` and Tandoor's
   `(amount / properties_food_amount) × property_amount` are the same design arrived at
   independently. Raw-vs-cooked as *separate records* (our `usdaCookedTable.json`) is what Whisk,
   Nutritionix (`is_raw_food`) and Cronometer/NCCDB all converge on. **No redesign is needed.**

2. **The parse is the easy part; matching and gram-conversion are the hard part.** Open CRF parsers
   hit 95%+ sentence accuracy for free, but database *linking* sits at **73–79%** in the literature
   and Zestful's founder publicly reported **73%** on USDA matching against an 80% target. This is
   independent confirmation that a 100%-high confidence target is not an Otto limitation — nobody has
   solved freeform-name → canonical-food linking.

3. **~75% of end-to-end nutrition error is the DATABASE, not the parse** (Zhang et al., *Adv Nutr*
   2021, PMID 34019624: pooled energy error −202 kcal/d, collapsing to −57 kcal/d, I²=0%, when app
   and reference share a food-composition table). Effort spent on USDA data correctness (the
   provenance audit, the identity repairs) is spent in the right place.

4. **Our confidence signal is ahead of most of the industry.** See §4.

---

## 2. How the commercial players are built (documented facts only)

| Vendor | Parse method | Unit→gram | Cooking yield | Confidence exposed | Sources stated | Buildable today |
|---|---|---|---|---|---|---|
| **Edamam** | Rules/ontology (patent US2020/0233875A1, abandoned) | per-food `measures[].weight` + qualifiers | **Yes** — `retainedWeight`: oil absorption, marinade, stock | `status` (OK/MISSING_QUANTITY/UNRECOGNIZED_FOOD) + HTTP 555 gate | **None stated** (8 yrs of Wayback: zero USDA mentions) | Yes — but licence forbids caching |
| **Nutritionix** | Undisclosed | `alt_measures[]` + linear scaling | **No** | Almost none (`line_delimited` only) | USDA + own RD team; `ndb_no`<1M = USDA, ≥1M = vendor | Yes |
| **Spoonacular** | Undisclosed "ontology" | `/recipes/convert` incl. `piece` | No | Only on `guessNutrition`/image | "primarily USDA"; ~2,600-entry whole-food ceiling | Yes |
| **Whisk / Samsung Food** | Deep-learning NLP (stated) | density-derived `nutrition_coefficient` | Partial (raw/cooked separate records) | **`nutrition.coverage` 0–1** | USDA, Danish, Fineli, EFSA | **No — not accepting new clients** |
| **MyFitnessPal** | Rules + confidence cascade (patent US11055486B2) | conversion table + ingredient-keyed substitution table | Not documented | Binary green check — *popularity/consensus score, per patent, NOT nutritional validation* | **None stated** | No — private/closed |
| **Cronometer** | "Retrained" (ML, unspecified) | Not documented | cooked-recipe-weight override | **Per-nutrient Data Confidence %** (best in class) | **Fully enumerated** — NCCDB, SR28, CNF, NEVO, CoFID, NUTTAB… | No — partner-only |
| **Tandoor** (OSS) | Hand-written rules | explicit conversion graph, **refuses to guess density** | No | `missing_conversion` flags | USDA FDC live API + own open data | Self-hosted |
| **Mealie** (OSS) | CRF (`ingredient-parser-nlp`), brute, or OpenAI | pint, scaling only | No | per-field confidence object | schema.org scrape only | Self-hosted |
| **Paprika** | positional `qty unit ingredient`, scaling only | — | — | none | none — nutrition is a free-text field | — |

**Takeaways that shaped our decisions:**
- **Nobody published an LLM or neural NER for the *parse* in production.** Edamam and MFP both
  describe rules + lookup tables + a confidence-ordered cascade — which is exactly our
  `parseIngredient.js` + `usdaTable.json` + the resolve cascade. Claude in our stack sits *downstream*
  as the matcher, which mirrors where the industry puts ML (search re-rank, categorization).
- **MFP's green check is a crowd-popularity score that silently backfills missing nutrients from
  other users' entries** (patent US11508472B2). A 2025 head-to-head (J Hum Nutr Diet, PMC12550805)
  found MFP "poor validity", Cronometer "good-to-excellent". The lesson: **distinguish unknown from
  zero and never silently fill** — which is already Otto's honesty law.
- **Edamam & Spoonacular forbid the permanent caching an offline app requires** — re-confirming the
  2026-07-19 decision to rule them out.

---

## 3. Open-source & academic building blocks (with licences)

| Resource | Use | Licence | Ship-safe? |
|---|---|---|---|
| **`strangetom/ingredient-parser`** (PyPI `ingredient-parser-nlp`) | CRF parser, 95.6% sentence / 98.3% word; has optional USDA FDC foundation-food matcher | **MIT** (code) | ✅ code; ⚠️ training corpus mixes scraped sites — flag if we ship the model |
| **NYT `ingredient-phrase-tagger`** | ~180k labelled lines (the data is the value) | **Apache-2.0** | ✅ but archived/py2 |
| **FoodOn** ontology | canonical food concept layer, stable IRIs | **CC-BY-4.0** | ✅ with attribution |
| **FoodBase corpus** | food NER training/eval | **CC-BY** | ✅ with attribution |
| **Open Food Facts taxonomies** | multilingual synonyms (courgette→zucchini) | **ODbL + AGPL repo** | 🚩 share-alike — escalate before embedding |
| **RecipeNLG** | 2.2M recipes | **non-commercial only** | ❌ binds employer — do not use |
| **LanguaL** | faceted descriptors | copyrighted, no grant | ❌ |
| **King Arthur weight chart** | baking densities | "All rights reserved" | ❌ **already removed — Phase 20** |

**Verdict:** if we ever want a stronger parser than the current regex one, fork
`strangetom/ingredient-parser` (MIT, maintained, best published numbers). Not needed yet — the parse
is not our bottleneck (§1.2).

---

## 4. Confidence — how we compare

Ranked, the industry spread is enormous:
1. **Cronometer** — per-nutrient completeness %, `-` (unknown) visually distinct from `0` (known
   zero), source icons, labels AI backfill. Best in class.
2. **Whisk** — `coverage` 0–1 ("what fraction of this recipe resolved"). The cheapest honest signal.
3. **Otto (us)** — per-recipe `high/medium/low`, unresolved lines excluded from the sum not zeroed,
   `~` estimate framing when unknown. **Roughly level with Whisk, ahead of the rest.**
4. Edamam — 3-value status, no score.
5. MFP — binary check that is really a popularity score.
6. Nutritionix / Spoonacular parser / Paprika — nothing.

**Design conclusions we already follow, confirmed by the field:** store nutrition once per 100 g;
raw vs cooked as separate records; ship a coverage/confidence signal; distinguish unknown from zero;
never silently backfill. The one idea worth *adopting* later is Cronometer's **per-nutrient**
completeness (we do per-recipe) — deferred, not needed for launch.

---

## 5. Public-domain datasets that close the remaining gaps

All CC0 / US-Gov public domain unless noted. These turn the one-at-a-time USDA API queries used in
the confidence campaign into shipped tables, and are the concrete path for the ~327 still-medium
recipes. **Build order + how to apply them: `BACKEND_ROADMAP.md`.**

| Dataset | Gives us | Size | Where |
|---|---|---|---|
| **FNDDS Portions & Weights** (2021-23) | count/volume → grams | **22,046 rows**, .xlsx | ars.usda.gov FSRG · pre-joined "At A Glance" file |
| **FDC `food_portion`** | per-food portions | SR Legacy 96.7% coverage, **Foundation only ~23%** | fdc.nal.usda.gov bulk CSV |
| **SR28 `FOOD_DES` refuse %** | as-purchased → edible | 1,944 foods | `sr28asc.zip` — **FDC dropped this field** |
| **USDA Cooking Yields R2 (meat/poultry)** | raw → cooked weight | 174 rows, .xlsx/CSV | ars.usda.gov · DOI 10.15482/USDA.ADC/1409031 |
| **USDA Nutrient Retention Factors R6** | nutrient loss on cooking | 7,018 rows (vitamins/minerals/choline only) | `retn06` · DOI …/1409034 |
| **Ag Handbook 102** | produce/grain yields | scan only (no OCR layer) | ah102.pdf — budget OCR if needed |
| **Bognár 2002 (BFE-R-02-03)** | **fat absorbed by frying**, g/100 g by food×method | breaded meat 6.0, unbreaded 0.0, fries 5.0 | fao.org PDF — ⚠️ no explicit licence, FAO-hosted |

**Gotchas learned this session (all cost real debugging, all now encoded in `scripts/usdaClient.mjs`):**
- **Energy is returned twice** under one nutrient name (KCAL + KJ). Filter on `unitName` or every
  number is silently 4.184× off.
- **The API returns "1 RACC" portions for Foundation foods**, but the bulk-CSV Dec-2025 release
  contains **zero** RACC rows — API and bulk download disagree. **Prefer SR Legacy for portion work.**
- **An fdcId proves nothing on its own** — the provenance audit found `white wine vinegar` carrying
  peanut butter's id. Verify description AND numbers, not just that an id resolves.
- USDA search ranks on text relevance: naive `avocado` → "Oil, avocado". Curate the query, let USDA
  supply the number (the `usdaQueries.json` pattern).

### The standard calculation order (USDA's own, public-domain, defensible)
Confirmed across Genesis R&D, ESHA, Galley, Nutritics, FoodWorks and USDA's own FNDDS docs:
1. **AP → edible portion** — `× (1 − refuse%)` from SR28.
2. **count/volume → grams** — FDC/FNDDS portions.
3. **added frying oil** — add as an explicit ingredient (Bognár g/100 g). **Never** model as a
   yield >100% — every vendor agrees on this.
4. **per-nutrient retention, at the ingredient level** — `retn06` (vitamins/minerals only).
5. **cooked-weight yield, at the recipe level** — Cooking Yields R2; divide to re-express per 100 g.

USDA's worked example (broiled halibut B6): 0.344 mg × 90% retention ÷ 0.73 yield = 0.424 mg/100 g
cooked. This is the citable convention if we ever compute cooked-from-raw ourselves.

---

## 6. What this research does NOT change

- The **two-source data architecture** (TheMealDB recipes + USDA nutrition) stands — confirmed
  optimal, not just adequate.
- **Edamam / Spoonacular stay ruled out** for nutrition (caching terms).
- The **~77% honest confidence ceiling** stands and is now externally corroborated (§1.2). Driving
  every recipe to "high" would mean inventing precision — the honesty law forbids it, and the field
  agrees nobody achieves it.

> **Do not re-run this research.** If a future session is tempted, the answer is in this file and the
> dataset URLs in §5. The next *action* is the FNDDS/SR28 import in `BACKEND_ROADMAP.md`, not more
> searching.
