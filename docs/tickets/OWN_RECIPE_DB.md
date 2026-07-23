# Owning the recipe data — verdict, research, roadmap (2026-07-23)

**Question (Juan):** TheMealDB is unreliable (wrong ingredient names, wrong measures — the
over-count problem). Should Otto replace it with its own recipe database, corrected once at the
source, so fixes never again live in guard/overlay files? Is that what real apps do?

**Verdict: YES — recommended, and it's smaller than it sounds.** Scoped correctly this is a
*data-ownership migration*, not "build an API product":

1. **Snapshot** the ~750 seed recipes once into Otto's own Supabase (they're a fixed catalogue,
   not a live feed — nothing is lost by leaving the API).
2. **Canonicalize** them once with a Claude batch pass (names → `usdaTable` keys, measures →
   grams, servings verified, frying/cooked flagged) — the "double-check with Claude" loop, run
   at the source instead of as runtime patches.
3. **Serve** recipes from Otto's DB; retire the runtime TheMealDB dependency.

This **supersedes most of the blocked ticket work**: T1's frying curation, T2's weight audit,
T7's recompute, and the whole `recipeFacts.json` overlay all collapse into "the canonical data
is simply correct." One effort, at the source, one time — exactly the instinct behind the ask.

**What it does NOT do (honesty):** the engine's parse/lookup/guards stay. User-imported recipes
(URL import, Ask Otto, photo) are free text forever and need that machinery. Owning the seeds
makes *seed* accuracy exact; it doesn't delete the general pipeline — and shouldn't.

---

## Research — how the real apps actually do it

| App / vendor | Recipe/food data | Nutrition computation |
|---|---|---|
| **MyFitnessPal** | **Owns** a ~20.5M-entry food DB: crowdsourced + dietitian-verified tiers ("Best Match" / green-check) + licensed Nutritionix data. User-generated tier is famously error-prone (~27% of entries in a 2019 Nutrition Journal study) | Recipe importer parses ingredient lines and matches them against **their own** food DB — same shape as Otto's engine |
| **Cronometer** | **Licenses curated, lab-verified DBs** — NCCDB (U. Minnesota), USDA FDC, Canadian Nutrient File; staff-verified, deliberately small. The accuracy gold standard (30/30 within 5% of USDA reference in published tests vs MFP's 11/30) | Same per-100g × grams pipeline, on trusted values only |
| **Cal AI** | No browsable DB — computer-vision portion estimation from photos (10–20% variance) | Vision volume estimate → weight → nutrient DB values |
| **Edamam / Nutritionix / Spoonacular** | **Own** food ontologies built on USDA + branded data; sell it as the product | NLP ingredient parsing → per-100g × grams, **with oil-absorption adjustment for fried recipes and stock/broth exclusions** — independently validates Otto's guard design |
| **TheMealDB** | Crowdsourced hobby DB. Free with attribution; supporter key expected for production; **no SLA, no data standardization** | Carries no nutrition at all |

**The industry pattern is unambiguous:** every serious player **owns or licenses** its
food/recipe data and anchors nutrient *values* to USDA or lab-verified databases. Nobody ships
a commercial product on TheMealDB as a runtime dependency — it's a seed/prototype source.
Otto already owns 80% of the stack (own `usdaTable` ontology, own weights, own facts overlay,
own cached `seed_nutrition`); the recipes are the **last third-party runtime dependency**.

Sources: [MFP food DB](https://blog.myfitnesspal.com/how-food-database-works/) ·
[MFP×Nutritionix](https://syndigo.com/success-stories/myfitnesspal/) ·
[MFP vs Cronometer accuracy research](https://www.kcalm.app/blog/myfitnesspal-vs-cronometer-accuracy-research-review/) ·
[Cronometer sources](https://cronometer.com/blog/accurate-data-tips/) ·
[Edamam Nutrition API](https://developer.edamam.com/edamam-nutrition-api) ·
[Cal AI](https://www.calai.app/) · [TheMealDB API guide](https://www.themealdb.com/api.php)

## Licensing / legal (verify before Phase 1)

- **Ingredient lists are facts** — not copyrightable (US). Instruction *prose* can carry thin
  copyright → **rewrite instructions in Otto's voice** during canonicalization (also improves
  them). **Images are copyrighted** → keep attribution + hotlink, or replace over time with own
  art/photography; don't silently re-host as ours.
- TheMealDB terms: attribution required; supporter key for production. **The terms page 403'd
  in this cloud session — read `themealdb.com/terms_of_use.php` directly before snapshotting**
  and keep the supporter subscription + credit line regardless (already in README/credits).
- Nutrition stays USDA (public domain, CC0) — unchanged, already clean.

---

## Roadmap (phased; each phase shippable alone)

**Phase 0 — Decision + legal check** `[phone/any session]`
Read TheMealDB terms directly; confirm supporter status; decide image strategy (attribute vs
replace). Gate for everything below.

**Phase 1 — Snapshot (own the bytes)** `[terminal + network]`
Script pulls every seed recipe via the existing `content` edge function → new `otto_recipes`
table (migration + RLS public-read, mirroring `seed_nutrition`) storing the **original data
verbatim** (provenance: `themealdb`, source id, fetched_at) + a versioned JSON export in the
repo for audit. Never destroy source data — canonical corrections live alongside it.

*Media fields — all three are captured (they're what `mealdb.transform.ts` already consumes),
but they differ:*
- **YouTube link** (`strYoutube`): just a URL; YouTube hosts the video. Snapshot and embed as
  today — no dependency, no legal question.
- **Source URL** (`strSource`): the attribution trail — keep forever ("source credited
  forever" is already Otto law).
- **Image** (`strMealThumb`): points at TheMealDB's CDN — snapshotting only the URL keeps a
  runtime dependency on their image host. Plan: copy the **existing files as-is** into Supabase
  Storage **iff the terms allow re-hosting** (the Phase 0 check); fallback = keep hotlinking +
  attribution. **Founder call (2026-07-23): the existing images/videos/sources are KEPT, not
  replaced or regenerated** — the migration changes who stores the data, never the content.

**Phase 2 — Canonicalization (the one-time fix)** `[terminal + Claude API]`
Batch pass, one recipe at a time, zod-validated structured output:
- each ingredient line → `{ canonical_name (an existing usdaTable key — Claude must pick from
  the shipped key list, never invent), grams (metric), cooked?, frying_medium?, note }`
- servings verified from the instructions; instructions rewritten in Otto's voice.
Then re-run `tools/nutrition-breakdown.mjs --corpus` on the canonical data → rank residual
outliers → human spot-check the worst N. This is T6 doing its real job.
Cost: ~750 recipes ≈ trivial (single-digit dollars of API); a weekend of sessions.

**Phase 3 — Ingredient top-up (absorbs T4/T5-remainder)** `[terminal + USDA]`
Canonicalization flags names with no `usdaTable` key → add real USDA records (real fdcIds) for
the handful that matter; skip negligibles. The table stays the single source of truth.

**Phase 4 — Cutover** `[terminal]`
`recipes.queries.ts` reads `otto_recipes` instead of the content proxy (feature-flagged). The
engine consumes canonical grams directly for seeds (parse/guards untouched — still guard user
imports). Retire the `content` function or reduce it to image proxying. Goldens + full suite +
T6 re-run are the gate.

**Phase 5 — Recompute + cleanup (absorbs T7)** `[terminal + Supabase]`
Recompute all `seed_nutrition` rows from canonical data. Fold `recipeFacts.json` into the
canonical rows and retire the overlay (one source of truth for per-recipe facts too).

**Phase 6 — Ongoing: Otto's catalogue becomes real IP** `[continuous]`
New recipes (editorial or curated user gems) enter through the same canonicalization gate, so
the catalogue only ever contains verified data. Over time the TheMealDB origin becomes history.

## Effort & cost

~2–4 focused terminal sessions + a Claude batch measured in dollars. Storage is trivial
(750 recipes). Risk is contained: snapshot is additive, cutover is feature-flagged, and the
golden suite + T6 corpus scan are the regression net. **Not over-engineering:** it *removes* a
moving part (live API + patch overlays) and replaces it with data that is simply correct.

## Architecture — the data framework (designed 2026-07-23)

This is the **medallion architecture** (bronze → silver → gold), the industry-standard layered
data model, mapped onto Otto's existing patterns. Three laws hold it together: each layer is
**derivable from the layer below plus the ontology**; every layer has **exactly one writer**;
fixes flow to the *owning* layer, never to a derived one.

**Naming (founder call, 2026-07-23): the catalogue is `otto-recipes` / `otto_recipes` — named
for the brand, not the source.** "Seed" naming would bake TheMealDB's origin into table and
folder names forever; but the origin is a **per-record fact**, not an identity. The catalogue
launches with ~750 records whose `provenance.source = "themealdb"` and grows past **2,000+**
with Otto-original recipes (`provenance.source = "otto"`), every one entering through the same
canonicalizer + critic gate. Born-canonical records (Otto originals) simply have no bronze row —
bronze only holds snapshots of *external* sources. (`seed_nutrition` keeps its name for now —
it's an existing production table the app reads; renaming it to `otto_nutrition` is a cheap
optional at Phase 5, when every row is regenerated anyway.)

```
Recipe-App/
├── supabase/
│   ├── migrations/                    schema + RLS (writer: security-builder)
│   └── otto-recipes/                  NEW — Otto's catalogue, version-controlled
│       ├── raw/
│       │   └── themealdb-2026-07.json   BRONZE  verbatim snapshot. Immutable audit trail.
│       │                                        "Capture everything, transform nothing."
│       └── canonical/
│           └── recipes.json             SILVER  ★ THE source of truth for Otto's catalogue.
│                                                Git-versioned → data fixes are PR-reviewed.
├── tools/                             the ONLY data writers (extends engine.md Law 3)
│   ├── snapshot-themealdb.mjs                bronze:  API → raw JSON (runs once)
│   ├── canonicalize-recipes.mjs            silver:  raw × canonicalizer agents × critic
│   ├── deploy-recipes.mjs                  serving: canonical JSON → Supabase upsert
│   ├── recompute-nutrition.mjs           gold:    canonical × usdaTable → seed_nutrition
│   └── nutrition-breakdown.mjs           audit    (already exists — T6)
├── src/features/nutrition/engine/data/  ONTOLOGY (exists, unchanged) — usdaTable.json is the
│                                        food-entity store; its keys are the join everywhere
└── src/features/recipes/                app reads otto_recipes from Supabase (Phase 4 cutover)
```

**Layers and their single writers:**

| Layer | Artifact | Writer | Edited by hand? |
|---|---|---|---|
| Bronze (raw) | `otto-recipes/raw/*.json` | `snapshot-themealdb.mjs`, once | **Never** — provenance |
| Silver (canonical) | `otto-recipes/canonical/recipes.json` ★ | canonicalization pipeline; then PR-reviewed corrections | **Yes — this is THE place fixes go** |
| Serving copy | `otto_recipes` table (Supabase) | `deploy-recipes.mjs` only | Never — derived from silver, like a build artifact |
| Gold (computed) | `seed_nutrition` table | `recompute-nutrition.mjs` only | Never — disposable, regenerate any time |
| Ontology | `engine/data/*.json` | tools scripts (Law 3) | Via tools/PR — per-ingredient truth lives here |

**The silver record shape** (one recipe — dual representation, original never destroyed):

```jsonc
{
  "id": "52874",
  "title": "Beef and Mustard Pie",
  "category": "Beef", "area": "British",
  "servings": 4,                          // verified from instructions, not assumed
  "instructions": ["..."],                // Otto-voice steps (the one rewritten text)
  "ingredients": [{
    "original": "1kg Beef",               // TheMealDB line, verbatim — NEVER destroyed
    "key": "beef",                        // canonical usdaTable key — the ontology join
    "grams": 1000,
    "cooked": false, "frying_medium": false,
    "note": null                          // set when an amount was inferred (doubt survives)
  }],
  "media": { "image": "...", "youtube": "...", "source": "..." },   // untouched, founder call
  "provenance": { "source": "themealdb", "fetched_at": "...", "canonicalized_at": "...", "model": "..." }
}
```

**Deliberate simplicity calls (less is more, with reasons):**
- **One canonical file**, not 750 — diffs fine in PRs, tiny in git (~2–3 MB), one thing to load.
- **JSONB `ingredients` column** in `otto_recipes`, not a normalized child table — the app only
  ever reads whole recipes; zero joins; Postgres JSONB stays queryable (GIN index) if search-by-
  ingredient is ever wanted. Normalization can be added later without touching silver.
- **No graph database** — Whisk's food graph serves recommendation at web scale; a 750-recipe
  catalogue joined to a 964-key ontology needs none of it.
- **No runtime parser for seeds** — grams are resolved once at canonicalization; the engine's
  parser keeps working for user imports, where free text actually lives.

**Research — this IS how the professionals do it** (and what we borrowed from whom):
- **Medallion bronze/silver/gold** is the standard layered model across modern data platforms
  ("capture everything, transform nothing" at raw; silver as the canonical form; gold as
  serving) — adopted wholesale. [Databricks](https://www.databricks.com/blog/what-is-medallion-architecture)
- **NYT Cooking** parses every ingredient phrase into structured {qty, unit, name} while
  keeping the original phrase — their open-source `ingredient-phrase-tagger` — the dual
  representation our silver shape uses. [nytimes/ingredient-phrase-tagger](https://github.com/nytimes/ingredient-phrase-tagger)
- **Whisk/Samsung Food** maps unstructured recipe text onto a canonical food ontology and
  enriches from it — our `usdaTable` keys are the same pattern at Otto scale; the key join
  means we could add per-food properties later without schema change. [Whisk docs](https://docs.whisk.com/)
- **RecipeDB** (academic) does canonical matching via exact → strip-processing-words → stemmed —
  which is literally `lookup.ts`'s strategy, independently validated. [RecipeDB](https://academic.oup.com/database/article/doi/10.1093/database/baaa077/6006228)
- **Version-controlled reference data** loaded into the warehouse by script (the dbt "seeds"
  pattern) — why silver lives in git with the DB as a derived serving copy.
- Where the big players differ: ML parsers at ingestion scale (NYT's CRF) and graph enrichment
  (Whisk). Both solve volumes Otto doesn't have; a one-time Claude pass over a fixed catalogue
  is the right-sized equivalent, and both patterns remain adoptable later without re-architecture.

## Agent crew — reuse map (decided 2026-07-23)

The existing `.claude/agents/` crew covers this roadmap almost entirely; **one new agent** is
needed. Per-phase owners:

| Phase | Owner(s) | Notes |
|---|---|---|
| 1 — Snapshot | **security-builder** (migration + RLS + Storage bucket) + **builder** (snapshot script in `tools/`) | Both as-is; exactly their doctrine |
| 2 — Canonicalize | **canonicalizer** *(NEW — `.claude/agents/canonicalizer.md`)* fanned out per-recipe via the Workflow pipeline; **critic** (REFUTER) verifies each batch before landing | No existing agent owns "recipe text in → canonical structured data out"; builder writes code not data, engine-porter's doctrine forbids editing data content, critic can't write |
| 3 — Ingredient top-up | **engine-porter** | One-line doctrine nuance: its charter says data JSONs are written by the `tools/` pipeline — so top-ups land via a tools script it runs, keeping "one writer" true |
| 4 — Cutover | **builder** (recipes.queries) → **verifier** (V1 ladder) → **critic** (V2) | The standard validation ladder, unchanged |
| 5 — Recompute | **security-builder** (DB writes) + **verifier** | Old T7 |
| 6 — Ongoing gate | **canonicalizer** + **critic** | Every new recipe enters through the same pair |

**ui-systems** sits this one out (no UI change — recipes render identically). The canonicalizer
is deliberately **read-only** (like critic): it *returns* validated structured output; a builder
lands the data. That preserves the crew discipline — producers propose, critics refute,
builders write, verifier proves.

## Phase 7 — The data asset: collecting user-created recipes (vision, 2026-07-23)

**Founder vision:** every recipe created in the app (Ask Otto, the editor, photo) is a data
point. Collected, canonicalized, and de-identified, the corpus becomes a licensable dataset —
the model Edamam runs today (5M+ recipes / 1M foods licensed to Nestlé, Amazon, Microsoft,
NYT) and Nutritionix (enterprise licensing from ~$1,850/mo). The value is NOT raw text — it's
**canonical, USDA-linked, structured** recipe data, which is exactly what the canonicalizer
gate produces. Otto's pipeline is the product.

**Provenance decides what is sellable** (this is the load-bearing design decision):

| `provenance.source` | In catalogue? | In sellable corpus? | Why |
|---|---|---|---|
| `otto` (editorial) | yes | **yes** | fully owned |
| `otto-ai` (Ask Otto generations) | curated subset | **yes** | model outputs are Otto's under Anthropic commercial terms |
| `user-created` (editor, from scratch) | curated gems | **yes, gated** | needs ToS license grant + consent + de-identification (below) |
| `user-imported` (URL/photo import) | never | **NO** | third-party content — a user importing seriouseats.com gives Otto zero rights to sell it |
| `themealdb` (the initial ~750) | yes | **NO (default)** | crowdsourced under attribution terms; reselling it as our dataset is a rights violation unless explicitly cleared |

**Pipeline (reuses everything already designed):** the private `recipes` table stays exactly
the product feature it is (user-owned, RLS). A collector job copies **eligible** (consented +
sellable-provenance) records → de-identify → corpus bronze (verbatim minus identity) → the
same **canonicalizer + critic gate** → corpus silver. Two tiers of one asset: **Tier A** =
curated promotions into the public `otto-recipes` catalogue (the 2,000+ vision); **Tier B** =
the full de-identified canonical corpus (the licensable dataset).

**De-identification rules (non-negotiable):** strip user id, name, avatar, journal/photos,
device data; no per-user linkage in the corpus — recipes only. Free text (titles, notes) gets
a scrub pass ("Grandma Rosa's soup" carries a name). Coarse time at most; no location.

**Legal gates — ALL must land before the first record is collected for sale:**
1. **ToS**: a license-grant clause (user grants Otto a perpetual license to de-identified
   recipe content). Today's ToS almost certainly lacks it.
2. **Privacy policy + in-app transparency**: plain-language disclosure. GDPR: explicit consent
   for EU users; CCPA: "sale/share" classification → Do-Not-Sell link + opt-out honored.
3. **App Store privacy label** update — data leaving the app for non-app purposes changes the
   declaration; misdeclaring is a rejection/removal risk.
4. **Counsel review** before the first license deal.
5. **Brand honesty (Otto law):** say it plainly in-app — "recipes you create may, anonymized,
   grow Otto's cookbook and food data" — with an opt-out (opt-in where law requires). A quiet
   harvest would be both illegal in key markets and fatal to the "honest cookbook" brand.

Sources: [Edamam](https://www.euroquity.com/en/company/edamam) ·
[Nutritionix database licensing](https://www.nutritionix.com/database) ·
[market comparison](https://about.greenchoicenow.com/nutrition-data-api-comparison)

## Relationship to NUTRITION_ACCURACY.md

T6 stays (the auditor). T1-mechanism stays (guards user imports). T1-data-curation, T2's
per-recipe half, T4, T5-remainder, and T7 are **absorbed** into Phases 2–5 above. If this plan
is approved, execute OWN_RECIPE_DB and treat those tickets as closed-by-supersession.
