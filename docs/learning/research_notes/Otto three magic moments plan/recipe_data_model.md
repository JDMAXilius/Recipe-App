# Recipe data model: yields, serving units, portions and meal plans

Status: draft · Research notes, 2026-11-05 · Local facts read at commit `607e37f4`

**About these notes.** This session could search the web but could not open most primary pages. schema.org, developers.google.com, fdc.nal.usda.gov and govinfo.gov all failed to resolve: they are outside this cloud session's allowed network hosts. Findings marked as cited come from search-result extracts, and several of those are secondary sources; each is labelled. Points marked "(prior knowledge, not re-verified)" come from the researcher's training data. Check them against the primary page before they go into an ADR. Repo facts cite file paths.

---

## 1. Standards: schema.org Recipe, Google recipe data, FDA/EU serving rules

### Takeaway
schema.org has one yield field, `recipeYield`, and it is free-form ("1 loaf", "4 servings"). There is no confirmed `recipeServings` property. Nutrition hangs off `nutrition` (NutritionInformation), which is per serving, and `servingSize` is a free-text string. Google requires the yield to be a portion count whenever calories are given. Label law (FDA RACC, EU 1169/2011) fixes reference amounts per food category, which is a different job from a recipe's own "this loaf cuts into 10 slices". An app has to store both the physical yield and the serving count itself.

### Cited Findings
- schema.org defines `recipeYield` as "The quantity produced by the recipe (for example, number of people served, number of servings, etc)". Its own JSON-LD example uses `"recipeYield": "1 loaf"` next to a `nutrition` NutritionInformation block. — [schema.org recipeYield (mirror)](https://alt112012.schema.org/recipeYield); [w3resource schema.org Recipe](https://www.w3resource.com/schema.org/Recipe.php)
- A search for `recipeServings` as a schema.org property found nothing. — [search results incl. google.schema.org NutritionInformation](https://google.schema.org/NutritionInformation)
- NutritionInformation `servingSize`: "The serving size, in terms of the number of volume or mass" (Text). This text came from an archived, deprecated copy of the vocabulary page. — [BibloGraph frozen copy](https://bibliograph.github.io/BibloGraph-Frozen/bibliograph.net/NutritionInformation.html); [bib.schema.org NutritionInformation](https://bib.schema.org/NutritionInformation)
- Google: when `nutrition.calories` is defined, the calories are read as per serving, so `recipeYield` must be given as a number of portions. The zh-TW version of the page says the same. — [Google Search Central recipe (data-types URL)](https://developers.google.com/search/docs/data-types/recipe); [zh-TW version](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-tw)
- Yandex treats `recipeYield` as Text, "Number of servings". — [Yandex Webmaster recipe](https://www.yandex.com/support/webmaster/en/supported-schemas/recipe)
- Open-source managers split the two ideas. In Mealie test fixtures, `recipeServings` is a number and `recipeYield` is free text such as "12 cookies", and both are set together. Note that `recipeServings` is Mealie's own field, not schema.org's. (Secondary: third-party MCP code, not Mealie docs.) — [mealie-mcp-server-ts functional test](https://glama.ai/mcp/servers/@that0n3guy/mealie-mcp-server-ts/blob/324b2a707bb6f20dcb07517e89e2e06de31b7ca7/src/__tests__/functional.test.ts); [mealie-mcp builders](https://glama.ai/mcp/servers/@mdlopresti/mealie-mcp/blob/c90916ce210793907e53db42d1439c1fc3d94f05/tests/unit/builders.py)
- **FDA RACC (21 CFR 101.12, Table 2).** "Breads (excluding sweet quick type), rolls" is 50 g, with the label stated as "__ piece(s) (__ g)" for sliced bread. Unsliced bread is "2 oz (56 g/__ inch slice)". Manufacturers convert the RACC into a household measure using 21 CFR 101.9(b). — [eCFR 101.12](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.12); [21 CFR 101.12 Table 2 PDF (NM.gov copy)](https://www.env.nm.gov/cannabis-hemp/wp-content/uploads/sites/34/2026/01/21-CFR-101.12-Table-2.pdf)
- "Coffee cakes, crumb cakes, doughnuts, Danish, sweet rolls, sweet quick type breads, muffins, toaster pastries" are 55 g. Banana bread is a sweet quick bread, so its label RACC is 55 g, not 50 g. The same manual also lists "bagels, toaster pastries, muffins (excluding English muffins)" at 110 g, which conflicts. (Secondary: an industry wiki, not the CFR text.) — [RACC Bakery Products (industry wiki)](https://esharesearch.atlassian.net/wiki/spaces/GENFOOD/pages/133070950/RACC+Bakery+Products)
- **EU 1169/2011 Art. 33.** Values per portion or per consumption unit are allowed only in addition to per 100 g / 100 ml. The portion has to be quantified on the label, placed close to the declaration, and the number of portions in the pack stated. When nutrients are given only per portion, energy must still be given per 100 g and per portion. — [legislation.gov.uk Art. 33](https://www.legislation.gov.uk/id/eur/2011/1169/article/33/5); [FSAI nutrition labelling](https://www.fsai.ie/business-advice/labelling/labelling-nutrition-information/nutrition-labelling); [EU Your Europe](https://europa.eu/youreurope/business/product-requirements/food-labelling/nutrition-declaration/index_en.htm)

### Inferences
- (prior knowledge, not re-verified) schema.org `recipeYield` accepts `QuantitativeValue` or `Text` and is a sub-property of HowTo `yield`. `recipeIngredient` (Text, one line per item) replaced the older `ingredients`. `recipeInstructions` takes Text, ItemList, CreativeWork, `HowToStep`, or `HowToSection` (a named group of HowToSteps, for example "For the glaze"). Other properties: `prepTime`, `cookTime` and `totalTime` (ISO 8601 durations), `recipeCategory`, `recipeCuisine`, `cookingMethod`, `suitableForDiet` (a RestrictedDiet enum such as GlutenFreeDiet or VeganDiet), `keywords`, plus HowTo's `tool`, `supply` and `estimatedCost`. NutritionInformation carries `calories` and nutrient fields as text with units ("240 calories", "9 g").
- (prior knowledge, not re-verified) Google's property table describes `recipeYield` roughly as: "Specify the number of servings produced from this recipe with just a number. If you want to use a different unit (for example, number of items), you can include additional yields." This is the "1 loaf" + "10" pattern. Verify the exact wording before quoting it.
- Recipe apps differ from labels. A label serving is a regulatory reference set per food category (55 g for sweet quick bread). A recipe serving is the author's or user's division of what the recipe makes. The two can differ: 10 slices from a 900 g loaf is 90 g per slice, about 1.6 RACC. If Otto ever shows a "label-style" number, it can display the RACC next to the serving, but it must never divide by the RACC.
- The EU rule (per 100 g always, per portion optional) is a sound default for Otto: store nutrients per 100 g of finished dish plus grams per serving, and derive everything else from those two.

### Gaps
- Could not open schema.org or Google's property tables to confirm whether `recipeYield` officially accepts an array, or Google's exact wording about multiple yields. These hosts need to be allowed in the session's network settings.
- RACC values for cookies, cakes, pizza and mixed dishes were not fetched. govinfo.gov is blocked, and only the bread and sweet quick bread rows were confirmed.

---

## 2. Serving units, and how apps and USDA model servings and portions

### Takeaway
Every serious tool reduces "a serving" to a gram weight. USDA FoodData Central stores nutrients per 100 g plus `foodPortions` rows ("1 slice" = N g). MyFitnessPal and Cronometer divide recipe totals by a servings count, and both struggle with cooked weight: their users fall back to treating 1 g as one serving. Otto needs three separate quantities: **yield** (what the recipe physically makes: 1 loaf, about 900 g cooked), **servings** (how many units it divides into: 10, by the slice), and **portion eaten** (how many units or grams a person actually had: 2 slices).

### Cited Findings
- FDC `food_portion` rows carry portion id, fdcId, amount, gram weight, measure unit, sequence, portion description and modifier. A sample row has modifier "serving" and gram weight 34.0. (Secondary: a third-party Apify actor.) — [Apify USDA FDC Portion / Serving Weight](https://apify.com/nexgenwatch/usda-fdc-portion-serving-weight-master)
- In the usda-fdc Python client's `FoodPortion` model, `gram_weight` is a required float and `modifier` an optional string, alongside a portion description and measure unit. — [usda-fdc Models API](https://usda-fdc.readthedocs.io/en/stable/api/models.html)
- Banana bread "1 slice" weights disagree across sources. Foodstruct says 60 g, with 195.6 kcal for SR "banana bread, prepared from recipe, made with margarine". FatSecret generic says 57 g / 158 kcal. A University of Maine label says 92 g. A branded slice is 40 g. No FNDDS record was opened directly. — [Foodstruct banana bread](https://foodstruct.com/food/banana-bread/1-oz); [FatSecret banana bread](https://www.fatsecret.com.au/calories-nutrition/generic/banana-bread); [UMaine Banana Bread label](https://extension.umaine.edu/publications/?p=17789); [UH Hospitals nutrition facts, banana bread 1 slice](https://www.uhhospitals.org/health-information/health-and-wellness-library/nutrition-facts/article/nutritionfacts-v1/bread-banana-prepared-from-recipe-made-with-margarine-1-slice)
- MyFitnessPal's recipe tool combines ingredients "so MyFitnessPal can automatically calculate the correct number of calories and nutrients when you log a serving". If you are unsure, "enter a best-guess number" of servings. — [MFP help: create a recipe](https://support.myfitnesspal.com/hc/en-us/articles/360032271452-How-do-I-create-a-recipe-Original-Recipe-Tool-Non-English-versions-of-the-site)
- An MFP community workaround: "set the number of servings to the number of grams of the finished dish… when I eat 223 grams of the lasagna, I'd log 223 servings". Another: edit the servings count after cooking. — [MFP community: logging a specific amount](https://community.myfitnesspal.com/en/discussion/comment/48703381); [Redefining Strength support](https://support.redefiningstrength.com/help/the-recipes-arent-showing-up-in-my-fitness-pal)
- Cronometer help: water lost during cooking makes the final weight differ from the sum of ingredients, and it recommends setting a cooked recipe weight to log portions accurately. Recipes are either serving-based or weight-based, and per forum users that choice can't be changed after saving. The default weight-based serving is the raw total. — [Cronometer support](https://support.cronometer.com/hc/en-us/articles/360018510311); [Cronometer forum: raw vs cooked weight](https://forums.cronometer.com/discussion/3915/custom-recipe-raw-vs-cooked-weight); [forum: serving vs weight based](https://forums.cronometer.com/discussion/comment/2524)
- Paprika scales "ingredients to your desired serving size, and convert between measurements" (App Store listing). No official docs were found on how the servings field parses. — [Paprika 3 App Store listing](https://apps.appfollow.io/ios/paprika-recipe-manager-3/1303222868?country=us); [Anders Norén review](https://andersnoren.se/gear/software/paprika-recipe-manager-review/)
- Otto today: `otto_recipes.canonical` has `servings` (number) and per-line `grams`, `key` (usdaTable ontology) and `cooked`/`frying_medium`. The target v2 adds `servings: {count, basis, note}` and per-line `display {qty, unit, name}` plus `confidence`. There is no serving unit ("slice") and no yield unit ("loaf"). — `docs/reference/RECIPE_DATA_MODEL.md` §4
- Otto today: the user table `recipes.servings` is an integer, `ingredients` is `[{measure,name}]`, and `nutrition` is jsonb computed at save. There is no serving unit, no yield, no cooked weight and no provenance beyond `source`/`source_url`/`source_name`. `favorites.servings` is display text. — `docs/architecture/ERD.md` (`recipes`, `favorites`)
- Otto's engine already resolves grams per line through piece and cup weight tables (`pieceWeights`/`cupWeights`), modelled on FDC `foodPortions`. — `docs/reference/RECIPE_DATA_MODEL.md` §3

### Inferences
- Use a small controlled vocabulary for serving units, stored as singular/plural pairs: `serving` (default), `portion`, `slice`, `piece`, `square` (bars, brownies), `cookie`, `muffin`, `bar`, `wedge` (pie, pizza), `bowl`, `cup` (volume, ≈240 ml), `glass`, `plate`, `taco`, `roll`. `cup` and `bowl` are volume-like and need a gram weight per recipe because density varies. Keep a `custom` escape hatch.
- Yield units are different words: `loaf`, `cake` / `9-inch cake`, `pan` / `9x13 pan`, `tray`, `pot`, `batch`, `pie`, `pizza`, plus count yields (24 cookies) and volume yields (1.5 L soup). For count yields the yield unit and the serving unit can be the same thing (24 cookies, serving 2 cookies → 12 servings), so store `units_per_serving`.
- Banana bread modelled this way: yield = 1 loaf; servings = 10; serving_unit = slice; units_per_serving = 1; cooked_total_g ≈ 900 (estimated, or weighed by the user); serving_g = 90. A photo of "2 slices" then becomes portion = 2 × slice = 2 servings = 180 g.
- Cronometer and MFP show what goes wrong when cooked weight isn't a field: users fake it with "1 g servings". Otto should keep an optional `cooked_total_g` (measured or estimated) so that "I ate 250 g of the stew" works without hacks.

### Gaps
- No primary docs were reached for Mela, Plan to Eat, Samsung Food (Whisk), or Mealime servings and scaling. Searches returned only reviews or nothing.
- The FDC API guide (fdc.nal.usda.gov) was blocked. The FNDDS portion weight for "Bread, banana" ("1 slice") is not confirmed; use FDC's own record before seeding a default.

---

## 3. Scaling rules

### Takeaway
Scale grams linearly by `target_servings / base_servings`. Flag the lines and fields that don't scale linearly: leavening, salt and spices, frying oil, pan size and bake time. Show a caution rather than "correcting" them silently. Convert between volume and weight only through per-ingredient density or portion tables, never one generic density. Round only for display, never in storage.

### Cited Findings
- Leavening is commonly advised at about 1.5–1.75× when doubling, not 2×. This is attributed to King Arthur, but only via third-party sites, and the figures disagree. — [hub-kitchen scaling guide](https://hub-kitchen.pages.dev/guides/scaling-a-recipe/); [dev.to: why doubling isn't doubling](https://dev.to/alphashark/why-doubling-a-recipe-isnt-always-doubling-everything-2b3i)
- Salt and spices: start below linear ("Salt at 3× ~75% of linear"; "two-thirds of the calculated amount and adjusted to taste"). Low-authority sources. — [dev.to evvytools](https://dev.to/evvytools/how-to-scale-a-recipe-up-or-down-without-wrecking-the-ratios-55g1); [Formula Forge baking scaling](https://formula-forge.pages.dev/cooking/baking-scaling-tips)
- Bake time is unchanged when you use more pans of the original size. One bigger pan changes depth and time, by +10–20% or +25–30% depending on the source. Check doneness early. — [recipe-scaler baking guide](https://recipe-scaler.pages.dev/blog/baking-scaling-guide); [letscalculator guide](https://letscalculator.pages.dev/guides/how-to-scale-a-recipe/)
- Paprika is claimed to keep leavening and spice ratios when scaling, but this comes from a reseller page and is unverified. — [spice.alibaba.com Paprika explainer](https://spice.alibaba.com/spice-basics/app-paprika)
- Otto's scaler is weight-first. Metric shows the engine's resolved grams times the factor. US shows the recipe's own stated measure scaled. Amounts are formatted to 1 decimal ("never fractions"). A non-finite or ≤0 factor falls back to 1×. "To taste" lines are unscalable and sink to the bottom. — `src/features/recipes/recipe.scale.ts:1-40`
- Earlier defect: display re-parsed text ("2" ÷ factor → "0.5 Beef Brisket"), and ingredient scaling used a different servings value than nutrition. The fix is to make `servings.count` the only divisor. — `docs/reference/RECIPE_DATA_MODEL.md` §1, §4

### Inferences
- Add a per-line `scale` hint, with values `linear` (default), `sublinear` (leavening, salt, strong spices, chilli), `fixed` (1 bay leaf, a frying-oil volume set by pot depth, "oil for greasing") and `to_taste`. The UI scales `linear` exactly. For `sublinear` it shows the linear amount with a note ("start with less; taste"); no automatic curve, since the sources disagree. For `fixed` it keeps the base amount.
- Store `pan` / `equipment` on the recipe (for example `{"kind":"loaf pan","size":"9x5 in"}`). When the scale factor isn't 1 for a baked recipe, show "use N pans" if the factor is a whole number, or "time may change; check early". Bake times are not scaled.
- Volume ↔ weight goes through the food ontology key (`usdaTable` key → density or `cupWeights`). With no key, show the original measure only and mark the line `confidence: null`. This matches the existing honesty rule.
- Display rounding, as a suggestion layered on the existing 1-decimal rule: under 10 g, 1 decimal; 10–100 g, nearest 1 g; 100–1000 g, nearest 5 g; over 1000 g, nearest 10 g. Counts show as halves ("1½ eggs" → offer "1 large + 1 yolk" only if authored). US volumes round to ⅛ tsp/tbsp and ¼ cup. Keep full precision in storage and in the nutrition math. These thresholds are a design choice, not sourced.

### Gaps
- No peer-reviewed paper on non-linear recipe scaling was found this session. The leavening and salt factors come only from low-authority sources and should not be hard-coded.

---

## 4. Nutrition computation: totals, per serving, cooked yield, "as eaten", confidence

### Takeaway
The pipeline: per-ingredient grams × per-100 g nutrients gives recipe totals. Apply cooking yield (moisture and fat change) and retention factors where a cooked record isn't used. Divide by servings for per serving; multiply by portions eaten for "as eaten". Every number carries a basis and a confidence, and photo-derived numbers are always labelled as estimates.

### Cited Findings
- USDA method: compute cooked composition from raw by applying cooking yield factors (the weight change from moisture and fat loss), then apply nutrient retention factors for vitamin and mineral losses. Don't double-count: retention factors often already include heating and draining losses, and evaporative loss needs a yield factor as well. — [USDA Cooking Yields for Meat & Poultry](https://ars.usda.gov/ARSUserFiles/80400535/Data/retn/USDA_CookingYields_MeatPoultry02.pdf); [Murphy et al., retention factors (archived NAL)](https://webarchive.library.unt.edu/eot2008/20080916112152/http:/www.nal.usda.gov/fnic/foodcomp/Data/Classics/retn_murphy.pdf)
- Moisture change (%) = 100 × ((Nc×Ec) − (Nr×Er)) / Wcr, and the same formula with fat values gives fat change. — [USDA Cooking Yields PDF](https://ars.usda.gov/ARSUserFiles/80400535/Data/retn/USDA_CookingYields_MeatPoultry02.pdf)
- FSANZ (AUSNUT) publishes recipe calculators that apply yield and retention factors. A possible second reference. — [FSANZ recipe calculators](https://foodstandards.govt.nz/science-data/monitoringnutrients/ausnut/foodnutrient/recipecalculators)
- Cronometer: the final cooked weight differs from the ingredient sum, so set a cooked weight to log portions. — [Cronometer support](https://support.cronometer.com/hc/en-us/articles/360018510311)
- Otto already has: `nutrition = per-100g × grams ÷ servings`; cooked-yield and frying-oil absorption guards; `seed_nutrition` as a regenerable cache; ">1000 kcal per serving is a review trigger, not a cap"; per-line confidence (`read | inferred | null`). — `docs/reference/RECIPE_DATA_MODEL.md` §2, §3, §5
- ADR-0013 makes "Snap any dish" (photo → recipe) the headline moment. — `docs/adr/0013-magic-moments-snap-any-dish-and-otto-plans-your-week.md`

### Inferences
- The "you photographed 2 slices" flow, as rules:
  1. The vision model returns `{dish, portion_count: 2, portion_unit: "slice", portion_g_est: [70, 110]}` and a candidate whole recipe (a loaf).
  2. The recipe is stored at its natural yield (1 loaf, 10 slices). It is never stored as "2 slices of banana bread", so the user can bake it, plan it and scale it.
  3. Map the portion to servings: if `portion_unit == serving_unit`, portions = 2 servings; otherwise convert through grams (portion_g / serving_g).
  4. Show: "2 slices ≈ 2 servings ≈ ~470 kcal (estimate)". Show a range when confidence is low ("~400–550 kcal"). The per-serving figure comes from the computed recipe, the portion figure from portions × per serving.
  5. The user can adjust the portion (stepper by unit, or grams), and that correction is saved to the snap log, not to the recipe.
- Store nutrition in two layers. `per_100g_cooked` (or the totals plus `cooked_total_g`) is the source. `per_serving` is derived: totals ÷ servings. The `basis` values are `computed_usda` (engine), `ai_estimate` (photo or LLM with no grams resolved), `label` (from a package) and `user`. `confidence` is high, medium or low, and the reasons (unresolved keys, inferred servings, photo-estimated portion) are kept as a list so the UI can say why.
- For a photo, the portion estimate is the least reliable term (slice thickness varies a lot: 40–92 g across the sources in §2). So "as eaten" numbers from a photo should always carry an "estimate" tag even when the recipe itself is `computed_usda`.
- If `cooked_total_g` is known, per serving can also be expressed per 100 g of dish, which gives the "I ate 250 g" path and an EU-style per-100 g display.

### Gaps
- No published accuracy figures for portion-size estimation from photos were gathered here. That belongs to the photo-recognition research thread.
- Current versions of the USDA yield and retention tables weren't confirmed; the PDFs found are older releases.

---

## 5. Meal plan models: slots vs lists, leftovers, non-recipe items, household portions

### Takeaway
Most planners use fixed meal types (breakfast, lunch, dinner, snack and a few more) as a column or enum. Otto's ADR-0013 picked an ordered free list per day with an optional label. Model this as `plan_items(day, position, label?)`, where label is free text with suggested values, and an item can be a recipe, a leftover of a cook event, a plain food, a note, or "eat out". Servings planned and per-member portions live on the item.

### Cited Findings
- Mealie meal-plan entries have an entry type. Values listed: breakfast, lunch, dinner, side, drink, dessert, snack (Home Assistant integration). Another wrapper lists only breakfast, lunch, dinner, side. — [Home Assistant Mealie integration](https://www.home-assistant.io/integrations/mealie); [mealie-mcp builders](https://glama.ai/mcp/servers/@mdlopresti/mealie-mcp/blob/c90916ce210793907e53db42d1439c1fc3d94f05/tests/unit/builders.py)
- Tandoor meal-plan entries are created from recipe, date, meal type and servings. Meal types are their own user-manageable list, and shopping lists are built from the plan. (Secondary: third-party MCP wrappers.) — [Tandoor MCP server](https://glama.ai/mcp/servers/@oculairmedia/Tandoor.mcp/tree/a66940a8aae9a2c56b9a8cb1665d055909263532); [starbuck93 tandoor-mcp](https://glama.ai/mcp/servers/starbuck93/tandoor-mcp-server)
- Leftovers in paper-planner practice: write "Leftover [dish]" in the next day's lunch or dinner, and use leftovers within 3–4 days. — [safefood meal planning](https://www.safefood.net/Healthy-Eating/How-to-plan-your-meals/Meal-planning); [UT Extension W1353E](https://utia.tennessee.edu/publications/wp-content/uploads/sites/269/2025/12/W1353E.pdf)
- Otto ADR-0013: "A plan day is an ordered list of items with an optional label (breakfast, lunch, dinner, snack or custom). No slot is required." It replaces the planned `meal` column (G-9) with an optional `label`. — `docs/adr/0013-magic-moments-snap-any-dish-and-otto-plans-your-week.md`
- Otto today: `plan_entries(id, user_id, day date, recipe_id text null, title, image, category snapshots, note, cooked bool, created_at)`. `recipe_id` is `"52772"` (seed) or `"u-12"` (user), null for a note. No order column, no label, no servings, no member portions, no leftover link. RLS lets household co-members read it. — `docs/architecture/ERD.md` (`plan_entries`)
- Otto today: households, members and shared list state exist, and the shopping list tracks `removed_sources` by recipe id. — `docs/architecture/ERD.md` (`households`, `household_list_state`)

### Inferences
- Use a list with labels, not slots. Labels are presentation and filtering, never structure. Sort a day by `position` (a fractional index or gapped integer, so drag-to-reorder writes one row). The UI may group items under their labels, but unlabeled items are first-class.
- Item kinds (enum `kind`):
  - `recipe`: points at a recipe id plus version, carries `servings_planned`.
  - `leftover`: points at a `cook_event_id` and portions. No shopping-list contribution.
  - `food`: a plain item such as "apple" or "yogurt". Optional FDC id or ontology key plus quantity and unit, so nutrition can still sum.
  - `note`: free text, for example "pizza night".
  - `eat_out`: optional place or note, no nutrition by default.
- Cook events make leftovers honest. Cooking a planned recipe (or tapping "cooked") creates `cook_events(recipe_id, version, servings_made, cooked_at)`. Later items of kind `leftover` draw portions from it, and the app can show "3 servings left, eat by Thu". This was inferred from the 3–4 day guidance.
- Shopping list: only `recipe` and `food` items with `servings_planned` contribute. Quantities are grams × (servings_planned / base_servings), summed by ontology key. Leftover items contribute 0, which avoids double-buying.
- Household portions: `plan_item_portions(plan_item_id, member_id, portions numeric)`. `servings_planned` defaults to the sum of member portions, which is what to cook. Each member's eaten nutrition = their portions × per serving. Keep it optional: one row per item for a solo user.
- Migration path from today's table: add `position`, `label`, `kind`, `servings_planned`, `recipe_version`, `cook_event_id` and `food_ref` to `plan_entries`. Existing rows become `kind = recipe` or `note`, with position taken from `created_at` order.

### Gaps
- No primary help-centre docs were found for Plan to Eat, Mealime, Samsung Food or Paprika meal-plan models, including whether they support free lists, custom meal types or leftovers. The search returned nothing useful.

---

## 6. Provenance, editing, versioning, AI flags, image provenance, attribution

### Takeaway
Treat catalogue recipes as immutable, versioned records. A user edit makes a fork, a full copy in the user's `recipes` with `parent_id` and `parent_version`. Light personal data (rating, notes, default servings) is a per-user overlay that doesn't fork. Every recipe and every image carries an origin enum. AI-generated images also carry the IPTC `trainedAlgorithmicMedia` digital source type and the "AI image" tag (ADR-0014).

### Cited Findings
- IPTC recommends that software generating images with trained AI models write Digital Source Type `trainedAlgorithmicMedia` (URI `http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia`) into XMP, or include it in a C2PA manifest. Google, Microsoft, Adobe, Midjourney and Shutterstock committed to it, and OpenAI signals its images through C2PA. Metadata can be stripped, intentionally or accidentally. — [IPTC guidance for AI-generated synthetic media](https://iptc.org/news/iptc-publishes-metadata-guidance-for-ai-generated-synthetic-media/); [IPTC Digital Source Type (metawatch)](https://metawatch.iptc.org/dst/)
- Google Merchant Center requires AI-generated product images to keep the IPTC `trainedAlgorithmicMedia` tag. (Reported by a secondary source.) — [ppc.land on IPTC metadata](https://ppc.land/iptc-metadata/)
- Otto ADR-0014 sets the image order: user photo, then a catalogue photo of the same dish, then a generated photoreal image. The generated image is made once, stored, tagged "AI image" everywhere it appears, never shown as the user's dish, never used as the Snap result, and there is a "Snap your plate" prompt to replace it. — `docs/adr/0014-ai-recipe-images-are-photorealistic-and-tagged.md`
- Otto today: `otto_recipes.provenance` jsonb (source/media) exists. User `recipes.source` is `imported | otto | manual`, alongside `source_url` and `source_name` (site or `@handle`). There is no version history, no parent link and no AI flag beyond `source = 'otto'`. — `docs/architecture/ERD.md` (`otto_recipes`, `recipes`)
- Otto's governance: silver is git-versioned and PR-reviewed, gold is regenerable, and every new recipe enters through the canonicalizer and critic gate. — `docs/reference/RECIPE_DATA_MODEL.md` §6

### Inferences
- Fork vs override:
  - **Overlay (no fork):** `recipe_user_state(user_id, recipe_ref, default_servings, rating, notes, cooked_count, last_cooked_at, hidden)`. Cheap, and it survives catalogue fixes.
  - **Fork on first content edit:** a change to ingredients, steps or yield copies into `recipes` with `parent_ref` (catalogue id), `parent_version` and `origin = 'fork'`. The fork doesn't auto-update; it can show "Otto updated the original" when the parent version moves. This keeps catalogue fixes (for example the servings re-verification pass) from silently rewriting a user's edited recipe, and keeps the user's edits from leaking into the catalogue.
  - "Personalise" (make it vegan, scale to 2 by default, swap an allergen), whether done by AI or by the user, is a fork with `origin = 'ai_adapted'` and a `change_summary`.
- Version history: `recipe_versions(recipe_ref, version int, canonical jsonb, author_kind (pipeline|user|ai), change_summary, created_at)`. Plan items and cook events store `recipe_version`, so last month's plan still shows what was cooked.
- Recipe origin enum: `catalogue`, `import_url`, `import_text`, `photo_snap` (vision), `ai_generated` (Otto AI), `ai_adapted`, `manual`, `fork`. Plus `ai_model` and `generated_at` when AI-made, and an `attribution {source_name, source_url, author, licence_note}`. URL imports keep the credit visible.
- Media table: `recipe_media(id, recipe_ref, kind (user_photo|catalogue|ai_generated), storage_path, digital_source_type (IPTC URI), is_primary, width, height, created_at, prompt_hash)`. Choose the primary by rule (user_photo > catalogue > ai_generated), not by a mutable flag. Write the IPTC tag into the generated file too. The in-app tag is driven by `kind`, since metadata can be stripped.

### Gaps
- No engineering blog from NYT Cooking, Allrecipes or Samsung Food on how they version or fork recipes was found this session. The fork/overlay recommendation rests on general reasoning and Otto's own constraints.

---

## 7. Search and filter fields

### Takeaway
Store a flat, indexed facet set per recipe, derived from canonical data where possible: times, diet and allergen tags with confidence, cuisine, course or category, equipment, cost band, and per-serving kcal and protein. Map each to schema.org where an equivalent exists.

### Cited Findings
- Otto's recipes already carry `category` (dish kind) and `area` (cuisine). The model doc proposes a GIN index on canonical for search later, without a schema change. — `docs/architecture/ERD.md` (`recipes`); `docs/reference/RECIPE_DATA_MODEL.md` §7
- Tandoor auto-generates plans from recipes tagged with keywords, so tags drive planning, not just search. (Secondary.) — [Tandoor MCP server](https://glama.ai/mcp/servers/@oculairmedia/Tandoor.mcp/tree/a66940a8aae9a2c56b9a8cb1665d055909263532)

### Inferences
- Fields and their schema.org counterparts (counterparts are prior knowledge, not re-verified):
  - `total_min` → totalTime; `active_min` → prepTime (hands-on); `cook_min` → cookTime; `passive_min` covers rising or marinating.
  - `diet_tags[]` (vegan, vegetarian, pescatarian, gluten_free, dairy_free, low_carb, halal, kosher) → suitableForDiet.
  - `allergen_tags[]` for the major allergens, each carrying a confidence or derivation (`derived_from_keys` vs `stated`), because a wrong "nut-free" is a safety failure.
  - `cuisine` → recipeCuisine; `course` / `category` (breakfast, main, side, dessert, snack, drink) → recipeCategory. This is distinct from plan labels: a breakfast recipe can be eaten at dinner.
  - `equipment[]` (oven, air fryer, slow cooker, blender, loaf pan) → tool.
  - `cost_band` (1–3) or `est_cost_per_serving` → estimatedCost.
  - `kcal_per_serving` and `protein_g_per_serving`, denormalized from nutrition for filtering.
  - `skill` (easy/medium); `servings_count`; `keywords[]`; `is_ai`, `has_real_photo`.
- Derive the diet and allergen tags from ingredient ontology keys at canonicalization, not by hand, and store which keys triggered each tag so it can be explained in the UI.

### Gaps
- No source was found this session on which filters users actually use most in recipe apps. Otto's tracking plan should measure this.

---

## 8. Recommended schema and rules for Otto

### Takeaway
Keep grams as the atom and `servings.count` as the only divisor, as Otto already does. Add the missing nouns: yield unit, serving unit, cooked weight, portion eaten, plan item kind, label and order, cook event, version, fork parent and media provenance. Most of these fit in the canonical jsonb plus four small tables.

### Cited Findings
- Present today: `otto_recipes(id, canonical jsonb, provenance jsonb)`; `recipes(…, servings int, ingredients jsonb [{measure,name}], steps jsonb [string], nutrition jsonb, source, source_url, source_name)`; `plan_entries(day, recipe_id, title, image, category, note, cooked)`; `seed_nutrition(recipe_id, nutrition)`; households. — `docs/architecture/ERD.md`
- Planned v2 canonical: `servings {count, basis, note}`; ingredients `{original, display {qty, unit, name}, grams, key, cooked, frying_medium, confidence, note}`. — `docs/reference/RECIPE_DATA_MODEL.md` §4
- The app reads `canonical.servings` through `canonical.transform.ts` (`servings: z.number().nullish()`). — `src/features/recipes/canonical.transform.ts:54,103`

### Inferences
**Canonical recipe record (extends v2 jsonb, the same shape for catalogue and user recipes):**
```jsonc
{
  "yield":    { "qty": 1, "unit": "loaf", "cooked_total_g": 900, "cooked_total_basis": "estimated" },  // measured | estimated | null
  "servings": { "count": 10, "unit": "slice", "unit_plural": "slices", "units_per_serving": 1,
                "serving_g": 90, "basis": "stated", "confidence": "high", "note": "cut into 10" },     // stated | inferred | photo | user
  "ingredients": [{ "original": "3 ripe bananas", "display": {"qty":3,"unit":null,"name":"ripe bananas"},
                    "grams": 354, "key": "banana raw", "confidence": "read",
                    "scale": "linear", "section": null, "optional": false }],                       // linear | sublinear | fixed | to_taste
  "steps": [{ "section": "Batter", "text": "…", "timer_s": null }],            // HowToSection/HowToStep analogue
  "equipment": [{ "kind": "loaf pan", "size": "9x5 in" }],
  "times": { "active_min": 15, "cook_min": 60, "passive_min": 0, "total_min": 75 },
  "facets": { "cuisine": "American", "course": ["breakfast","snack"], "diet": ["vegetarian"],
              "allergens": [{"tag":"gluten","from":["wheat flour"]},{"tag":"egg","from":["egg"]}],
              "cost_band": 1, "skill": "easy" },
  "nutrition": { "per_serving": { "kcal": 235, "protein_g": 3.6 /*…*/ }, "per_100g": { /*…*/ },
                 "basis": "computed_usda", "confidence": "medium", "reasons": ["servings inferred"] },
  "origin": "photo_snap", "ai": { "model": "…", "generated_at": "…" },
  "attribution": { "source_name": null, "source_url": null, "author": null },
  "version": 3, "parent": { "ref": "900123", "version": 2 }
}
```
(The banana-bread numbers above are illustrative, not computed.)

**New or changed tables:**
- `recipe_versions(recipe_ref text, version int, canonical jsonb, author_kind text, change_summary text, created_at)`, PK `(recipe_ref, version)`.
- `recipe_media(id, recipe_ref, kind text check in ('user_photo','catalogue','ai_generated'), storage_path, digital_source_type text, created_at, prompt_hash)`. The primary image is chosen by the ADR-0014 order.
- `recipe_user_state(user_id, recipe_ref, default_servings numeric, rating, notes, hidden, last_cooked_at)`. The overlay, with no fork.
- `cook_events(id, user_id, household_id null, recipe_ref, recipe_version, servings_made numeric, cooked_at, photo_media_id null)`.
- `plan_entries`, extended into plan items: `+ position numeric, + label text null, + kind text check in ('recipe','leftover','food','note','eat_out') default 'recipe', + recipe_version int, + servings_planned numeric, + cook_event_id null, + food_ref jsonb null ({key|fdc_id, qty, unit, grams})`.
- `plan_item_portions(plan_item_id, member_id uuid, portions numeric)`. Optional, for households.
- `food_logs` / `snaps(id, user_id, photo_media_id, recipe_ref, recipe_version, portion_count numeric, portion_unit text, portion_g numeric, portion_basis text ('photo','user'), kcal_est numeric, kcal_low, kcal_high, eaten_at, plan_item_id null)`. This records what was eaten and stays separate from the recipe.

**Rules:**
1. `servings.count` is the only divisor. `serving_g = cooked_total_g / servings.count` when the cooked total is known.
2. Scale factor = target servings ÷ `servings.count`. Grams × factor for `linear` lines, a caution note for `sublinear`, unchanged for `fixed`. Never re-parse display text.
3. Portion → servings: same unit means portions × units_per_serving⁻¹; otherwise go through grams. Nutrition as eaten = per serving × servings eaten.
4. A photo creates a whole-yield recipe (1 loaf / 10 slices) plus a snap log of 2 slices. Never a "2 slices" recipe.
5. Every derived number keeps its `basis` and `confidence`. Photo portions are always tagged "estimate", with a range when confidence is low.
6. Catalogue rows are immutable per version. A user content edit forks with a parent pointer; personal data goes in the overlay.
7. Image choice follows user photo, then catalogue, then AI. AI images carry the in-app "AI image" tag (driven by `kind`) and IPTC `trainedAlgorithmicMedia` in the file.
8. Plan labels are optional free text with suggested values. Order is by `position`. Leftovers point at cook events and add nothing to the shopping list.
9. Store at full precision; round only at display.

### Gaps
- Not verified against the live database: whether `otto_recipes.canonical` rows already carry anything like a yield unit. Check with the database tools before migrating.
- A label-style RACC display (for example "55 g reference") is optional, and no product decision exists for it.
- The hosts that need allowlisting to verify the "(prior knowledge)" items are schema.org, developers.google.com, fdc.nal.usda.gov and govinfo.gov.
