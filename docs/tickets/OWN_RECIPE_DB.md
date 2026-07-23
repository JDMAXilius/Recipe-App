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
Script pulls every seed recipe via the existing `content` edge function → new `seed_recipes`
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
`recipes.queries.ts` reads `seed_recipes` instead of the content proxy (feature-flagged). The
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

## Relationship to NUTRITION_ACCURACY.md

T6 stays (the auditor). T1-mechanism stays (guards user imports). T1-data-curation, T2's
per-recipe half, T4, T5-remainder, and T7 are **absorbed** into Phases 2–5 above. If this plan
is approved, execute OWN_RECIPE_DB and treat those tickets as closed-by-supersession.
