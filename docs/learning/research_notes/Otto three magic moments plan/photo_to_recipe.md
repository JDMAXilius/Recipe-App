# Photo of a meal → the full recipe of the dish

Research notes, 2026-11-05. Scope: whether anyone ships "photo of a cooked dish → full recipe (ingredients with amounts, steps, yield/servings)", how well current models do it, and how Otto should design it (portion → batch, grounding, honesty/IP/policy, cost).

**Method caveat (read first).** In this session `arxiv.org`, `developers.openai.com` and several blogs could not be fetched (outside the session's allowed network). Paper metrics and OpenAI prices below come from search-result snippets of those pages and from secondary trackers, not from reading the primary PDFs/pages. Anything not confirmed by a primary source is marked **[unverified]**. To verify, allow `arxiv.org` and `developers.openai.com` in the environment network settings and re-read the cited pages.

Otto context found in the repo (code, not research): `supabase/functions/generate-recipe/index.ts` already has `MODEL_VISION = "gpt-5.1"` ("photo transcription") and `MODEL_TEXT = "gpt-5.1"`; `supabase/functions/resolve-nutrition/index.ts` uses `gpt-5-mini` for "a pick-the-match job"; `supabase/functions/canonicalize/index.ts` uses `gpt-5.1`. So the vision call, the USDA-match step and the canonicaliser that a dish-to-recipe pipeline needs already exist in some form.

---

## 1. Competitive check: who turns a photo of a cooked dish into a full recipe?

### Takeaway
Category (d), dish photo → full recipe, exists, but only in small single-purpose App Store apps (Recipix, DishDecoder, Recipe Lens AI, "AI Get Recipe By Photo & Snap", BiteFrame, Recipe Scanner AI, CookChook) and as an ad-hoc use of general chatbots. None of them appears to have scale or independent reviews. The big recipe managers (ReciMe, Flavorish, Honeydew) do (a), OCR of a printed or handwritten recipe. Samsung Food announced (d)-like dish recognition but shipped the ingredient version. Calorie apps (Cal AI, MFP, LoseIt) do (c) and measurably under-count. Nobody found does what Otto proposes: infer the whole batch from a portion, express servings in natural units, and compute nutrition deterministically.

### Cited Findings
**(d) Dish photo → full recipe: small apps, marketing claims only**
- Recipix (iOS) and BiteFrame (web) both describe the same flow: upload a dish photo, AI analysis, a recipe with ingredients and instructions — [Recipix, App Store](https://apps.apple.com/us/app/recipix-ai-recipe-generator/id6502718973); [BiteFrame](https://biteframe.ai/)
- Others with the same pitch: Recipe Scanner AI ("Scan Any Dish, Get the Recipe Instantly"), CookChook "Recipe from Photo", RecipeBot, and RecipeScan, whose dish-photo feature is Premium-only — [Recipe Scanner AI](https://tryrecipescanner.com/); [CookChook](https://www.cookchook.com/recipe-from-photo); [RecipeBot](https://www.recipebot.com/); [RecipeScan](https://recipescannerapp.com/)
- DishDecoder (iOS) advertises "photo-to-recipe" with ingredients, steps and nutrition. Its release notes mention an "improved AI model and prompting for better ingredient detection" — [DishDecoder, App Store](https://apps.apple.com/us/app/dishdecoder/id6742336211)
- Meal42 says it uses "GPT-4o Vision for accurate ingredient detection" and a separate model to write the recipe, a two-stage design — [Meal42, App Store](https://apps.apple.com/app/id6757866043)
- "AI Get Recipe By Photo & Snap" had 1 rating. "AI Photo Recipe Identifier" had too few ratings to show an overview. Other entrants: Recipe Lens AI, Foodii, and a Korean "Recipe AI – Photo to Recipe" — [AI Get Recipe By Photo](https://apps.apple.com/us/app/id6475171661); [AI Photo Recipe Identifier](https://apps.apple.com/us/app/id6473107541); [Recipe Lens AI](https://apps.apple.com/us/app/recipe-lens-ai/id6744943104); [Foodii](https://apps.apple.com/app/id6747945628); [Recipe AI (KR)](https://apps.apple.com/kr/app/%EB%A0%88%EC%8B%9C%ED%94%BC-ai-%EC%82%AC%EC%A7%84-%EC%9A%94%EB%A6%AC%EB%B2%95/id6746402789?l=en-GB)
- A how-to guide (CookThis, Android) warns that a photo cannot show quantities, salt, oil, stock or hidden ingredients, so amounts are estimates. It also says a general chatbot that accepts images can produce a recipe if asked for ingredients and numbered steps — [CookThis guide](https://www.usamakashif.me/cookthis/how-to-get-a-recipe-from-a-food-photo/) (search snippet only; the page could not be fetched)

**General chatbots used for (d)**
- Healthline's writer tested ChatGPT photo upload for meal ideas. It "had problems correctly identifying ingredients" and suggested unappetizing combinations, though it was useful for ideas and swaps — [Healthline](https://www.healthline.com/health/how-to-use-ai-for-food-swaps-and-recipe-ideation)
- Wired's hands-on test of DishGen covered text recipes, not photos: "edible but unremarkable", and a pesto that browned faster than expected. The bigger complaint was the bot's answers on copyright. ChefGPT and Epicure are named as similar — [Wired (mirror)](https://wirednews.pages.dev/story/dishgen-ai-recipes-tested) **[mirror domain; unverified copy]**
- No source confirmed that DishGen or Samsung Food has a dish-photo → recipe feature. A directory listing claims ChefGPT tracks calories and macros from photos — [toolworthy, Samsung Food](https://www.toolworthy.ai/tool/samsung-food); [mrcook compare](https://www.mrcook.app/en/compare/chefgpt-vs-dishgen) **[vendor-style claims]**

**Samsung Food (announced (d), shipped (b))**
- IFA 2023: "Vision AI" would let Samsung Food recognise dishes from images alone, list ingredients, link related recipes and save one, with food recognition slated for 2024 — [Samsung Newsroom, IFA 2023](https://news.samsung.com/global/meet-samsung-food-at-ifa-2023-the-ultimate-personalized-cooking-assistant)
- IFA 2024 "Samsung Food+" framed Vision AI as recognising *ingredients* in phone photos and adding them to a Food List — [Asia Economy](https://www.asiae.co.kr/en/article/2024082808193890433); [Samsung UK, IFA 2024](https://news.samsung.com/uk/upgraded-samsung-food-raises-the-bar-for-food-experiences-at-ifa-2024)
- Whether dish → recipe shipped, and how accurate it is, is **unconfirmed**.

**(a) Recipe card / cookbook page → text: common in the recipe managers**
- ReciMe: "add recipes … simply by taking a photo of it", meaning printed recipes — [ReciMe Smart Imports](https://www.recime.app/smart-imports-explained)
- Flavorish: photo or camera import. The photo should show the ingredients, instructions and notes, including handwritten notes and cookbook pages — [Flavorish help](https://www.flavorish.ai/blog/save-recipes-from-an-image-with-flavorish)
- Honeydew: "snap a photo or upload a screenshot" to import — [Product Hunt](https://www.producthunt.com/posts/honeydew). Pestle: found only web import, no photo import — [alternativeto](https://alternativeto.net/software/poach)

**(c) Plated dish → calories only: measurable under-counting**
- NIH analysis presented at NUTRITION 2026 (July 2026, preliminary): 102 weighed meals photographed and run through MyFitnessPal, LoseIt!, Cal AI and Appediet. All four under-estimated, by about 250–345 kcal per meal on average and about 30 g of fat per meal. Carbs were the most consistent. A follow-up with 200+ meals found keto/high-fat meals worse — [ScienceDaily](https://sciencedaily.com/releases/2026/07/260726015237.htm); [Newswise](https://www.newswise.com/articles/photo-based-calorie-tracking-apps-may-underestimate-energy-in-meals); [Epocrates](https://www.epocrates.com/online/article/ai-calorie-counting-apps-miss-a-third-of-meal-calories)

### Inferences
- The space is crowded with thin GPT wrappers, but no trusted brand owns (d). The open lane is *trustworthy* (d): a whole-batch recipe whose nutrition comes from USDA math rather than the model.
- The calorie-app data shows that fat (oil, butter, sauces) is what a camera misses. Otto's recipe framing makes the hidden fat an explicit, editable ingredient line ("2 tbsp olive oil, estimated") instead of a silent error. That is a differentiator worth saying out loud.
- No competitor found infers batch yield from a portion photo ("2 slices → a loaf of ~10 slices"). Treat it as a novel feature, with no prior art to copy.

### Gaps
- I found no independent reviews, Reddit threads or press tests of any category-(d) app's accuracy. App Store review text could not be read (the listings show few or no ratings).
- Google Lens / Gemini "recipe for this dish" behaviour and ChatGPT-specific dish-to-recipe evaluations were not confirmed from primary sources in this session.
- Not checked: Cooked, PantryChef, SnapRecipe, "What's this dish". Assume they belong to the same wrapper class until checked.

---

## 2. Research: how well do models do dish → recipe?

### Takeaway
Academic dish → recipe peaked as a two-stage problem (predict the ingredient set, then generate steps). Inverse Cooking reached about 0.49 ingredient F1 on Recipe1M. Large multimodal models write fluent recipes but hallucinate. The current best-known fix is retrieval: put similar known recipes in the prompt, then vote across candidates (WACV 2025). GPT-4o-class models reach roughly 0.74–0.86 ingredient F1 on *visible* ingredients in food benchmarks, but no benchmark scores amounts, yield or baking chemistry.

### Cited Findings
- **Inverse Cooking (Salvador et al., CVPR 2019, Meta/FAIR):** predicts ingredients as a set (no order), then generates instructions attending to both the image and the inferred ingredients. Human judges found its output more compelling than retrieval-based baselines — [CVF Open Access](https://openaccess.thecvf.com/content_CVPR_2019/html/Salvador_Inverse_Cooking_Recipe_Generation_From_Food_Images_CVPR_2019_paper.html); [Meta AI](https://ai.meta.com/research/publications/inverse-cooking-recipe-generation-from-food-images/)
- Inverse Cooking's set-transformer ingredient prediction: **IoU 32.11, F1 48.61** on Recipe1M — [SOTAVerified](https://sotaverified.org/papers/inverse-cooking-recipe-generation-from-food); [Liner review](https://liner.com/review/inverse-cooking-recipe-generation-from-food-images) **[secondary; paper table not read directly]**
- **FIRE (Chhikara et al., 2023):** BLIP generates the title, a ViT plus decoder extracts ingredients, and T5 writes instructions from the title and ingredients. The paper also demos recipe customisation and recipe → code via LLM prompting. Code released — [arXiv 2308.14391](https://arxiv.org/html/2308.14391v2); [DeepAI](https://deepai.org/publication/fire-food-image-to-recipe-generation) (quantitative results not retrieved)
- **LLaVA-Chef (2024):** LLaVA fine-tuned in 3 stages on Recipe1M and evaluated on a 50,507-sample test subset. It claims a large CIDEr lead over other models, including Chef Transformer, but the paper's versions report different scales (a "21-point" vs "nearly 24-point" lead), so the figure is **unreliable**. Ablation: images alone gave CIDEr ≈ 0.004, and giving the food name plus ingredients was essential — [arXiv 2408.16889](https://arxiv.org/html/2408.16889v1); [Moonlight review](https://www.themoonlight.io/review/llava-chef-a-multi-modal-generative-model-for-food-recipes)
- **Retrieval Augmented Recipe Generation (Liu et al., WACV 2025):** two-stage methods came before. LMMs can generate recipes directly "but tend to hallucinate". Their method, Stochastic Diversified Retrieval Augmentation, retrieves image-related recipes from a datastore with an off-the-shelf cross-modal retriever and adds them to the prompt. Self-Consistency Ensemble Voting then picks the most consistent of the candidates generated with different retrieved contexts. Reported SOTA on Recipe1M — [CVF Open Access](https://openaccess.thecvf.com/content/WACV2025/html/Liu_Retrieval_Augmented_Recipe_Generation_WACV_2025_paper.html); [arXiv 2411.08715](https://arxiv.org/abs/2411.08715)
- **GPT-4o on food images:**
  - Pic2Plate's GPT-4o ingredient detection: precision 0.83, recall 0.91, F1 0.86, the best of the models compared — [Sensors 2025, Pic2Plate](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11768646/)
  - January Food Benchmark: GPT-4o ingredient F1 0.737 in its best configuration, below a specialised model — [JFB, arXiv 2508.09966](https://arxiv.org/html/2508.09966v1); [January benchmarks repo](https://github.com/January-ai/food-scan-benchmarks)
  - FoodMLLM-JP generates recipes from images with GPT-4o and uses GPT-4o as a judge, scoring ingredient lists by IoU/F1 — [arXiv 2409.18459](https://arxiv.org/pdf/2409.18459) (figures not retrieved)
  - A 2025/26 open-VLM benchmark found newer models list more items per image than GPT-4o, which lowers precision while recall holds — [Nutrients/MDPI](https://www.mdpi.com/2072-6643/18/21/3582)
  - A ten-model dietary-assessment benchmark (bioRxiv 2026, 3,229 images) put GPT-4o at CCC 0.752, at about $2.00 per 1,000 images — [bioRxiv](https://www.biorxiv.org/content/10.64898/2026.07.26.740845v1.full)
- **Gemini:** a 2025 arXiv paper evaluates Gemini with an EfficientNet-B4 backbone for food image → recipe and nutrition description — [arXiv 2511.08215](https://arxiv.org/html/2511.08215v1) (results not retrieved)
- **RecipeGen (2025):** a step-aligned multimodal benchmark for real-world recipe generation — [arXiv 2506.06733](https://arxiv.org/html/2506.06733v2) (not read)
- **Failure modes seen in practice:** wrong ingredient identification (Healthline test); hidden quantities, salt, oil and stock invisible to a camera (CookThis); systematic fat under-estimates (NIH study, §1) — [Healthline](https://www.healthline.com/health/how-to-use-ai-for-food-swaps-and-recipe-ideation); [ScienceDaily](https://sciencedaily.com/releases/2026/07/260726015237.htm)

### Inferences
- The metrics measure *which ingredients* (F1/IoU) and text overlap (BLEU/CIDEr). None measures *amounts*, *yield*, or whether the recipe actually works when cooked (e.g. leavening ratios). For Otto, the hard parts (quantities, batch size, chemistry) are unbenchmarked, so Otto needs its own eval set: about 30–50 home-cooked dishes with known recipes, scored on dish-name accuracy, ingredient F1, gram error on the 5 largest ingredients, yield error, and kcal/serving error against the true recipe run through Otto's own USDA engine.
- Expected failure classes for the eval (from the findings plus domain reasoning; **[inference, not benchmarked]**):
  - invisible fats and sugars (butter in banana bread, oil in stir-fry)
  - sauces and stocks
  - spices and salt amounts
  - confusing look-alikes (banana bread vs. zucchini bread vs. pumpkin loaf)
  - baking chemistry: wrong soda/powder amounts, egg and flour ratios, oven temp and time
  - garnish counted as an ingredient
  - plating extras (side salad) merged into the dish
- The LLaVA-Chef ablation (image-only is terrible, name plus ingredients helps) supports a "name it first, confirm, then write" flow. Asking the user to confirm the dish name is cheap and fixes the largest error source.

### Gaps
- Full results tables for FIRE, LLaVA-Chef, RAR (WACV 2025) and FoodMLLM-JP: arXiv was blocked here.
- No public evaluation of GPT-5 / GPT-5.1 / Gemini 2.5+ on dish-to-recipe was found. Claims that "current models do X% on dish→recipe" would be **unsupported**.
- Chef Transformer: no primary source retrieved.

---

## 3. The portion → batch problem (2 slices → a loaf)

### Takeaway
No paper or app found addresses it. It is a design problem Otto has to solve itself. The workable approach: classify the dish into a "batch archetype" (loaf, round cake, pie, sheet pan, cookie batch, pot, single plate), get the archetype's default yield from a retrieved similar recipe (or a small curated table), express servings in the archetype's natural unit ("slice", "piece", "cookie", "bowl"), and show the photographed portion count separately ("You photographed 2 slices ≈ 2 servings"). schema.org `recipeYield` and USDA portion data give the vocabulary and gram weights.

### Cited Findings
- schema.org `recipeYield` is free text or a QuantitativeValue: "the quantity produced by the recipe (for example, number of people served, number of servings, etc.)" — [pub.dev schema_org docs](https://pub.dev/documentation/schema_org/latest/schemas_recipe/SchemaRecipe/recipeYield.html)
- One implementer's docs say `recipeYield` should be the number of servings, "not the number of individual items, if these are different" — [Unhead schema.org Recipe](https://unhead.unjs.io/docs/typescript/schema-org/api/schema/recipe)
- Real markup uses item units (`"recipeYield": "12 cookies"`), and schema.org's own banana-bread example reportedly uses `"recipeYield": "1 loaf"` — [GitHub gist](https://gist.github.com/patrickcoombe/3ffbf6515a90b30b27ce); [schema.org/Recipe](https://schema.org/Recipe) **["1 loaf" seen in a search summary; page not fetched]**
- USDA FNDDS ties each food code to portion descriptions, each with a sequence number and an edible gram weight, converted from what survey respondents reported. FoodData Central portion records use qualifiers such as "slice" and "medium". Nutrients per portion = per-100 g value × portion grams ÷ 100 — [FNDDS 2021–2023 Contents of Datasets](https://ars.usda.gov/ARSUserFiles/80400530/pdf/fndds/2021_2023_Contents_of_Datasets.pdf); [FNDDS 2019–2020 documentation](https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/fndds/2019_2020_FNDDS_Doc.pdf); [tidyverse FDC schema example](https://data-dict.tidyverse.org/examples/foodbank.yaml)
- A specific FNDDS "1 slice banana bread = N g" value was **not** retrieved here. Look it up in the FNDDS Portion Weights file or the FDC API (Survey foods).

### Inferences
- **Pipeline for yield** **[design proposal]**:
  1. The vision step outputs `{dish_name, archetype, visible_portion: {count, unit}, confidence}`, e.g. `{banana bread, loaf, {2, slice}}`.
  2. Retrieve the nearest catalogue/known recipes for the dish name and copy the median yield and serving unit (e.g. "1 loaf, 10 slices").
  3. If there is no match, fall back to an archetype table.
  4. Write the recipe for the whole batch.
  5. Nutrition per serving = Otto's deterministic USDA total ÷ servings.
  6. Cross-check: batch grams ÷ servings should fall near the FNDDS "1 slice" gram weight for the matching survey food. Flag if it is off by more than about 35%.
- **Starter archetype table** (needs validation against the catalogue; **[unverified defaults, not from a source]**):

  | Archetype | Default yield |
  |---|---|
  | 9×5 loaf | 10 slices (8–12) |
  | 9" pie / tart | 8 slices |
  | 9" round cake | 12 slices |
  | 9×13 lasagna / casserole | 12 pieces (9–12) |
  | 9×13 brownies / bars | 16–24 pieces |
  | Cookies | 24 per batch |
  | Muffins | 12 |
  | Pizza (12") | 8 slices |
  | Soup / stew pot | 6 bowls (about 1½ cups each) |
  | Stir-fry / pasta / curry | 4 servings |
  | Composed single plate (burger, salad bowl) | 1 serving, scaled to 2–4 as "makes 2" |

- **Copy for the reveal** (honest framing): "Banana bread · makes 1 loaf (10 slices). You photographed 2 slices: 2 servings, 2 × 196 kcal = 392 kcal." (numbers illustrative). Keep "what's on your plate" and "the recipe" as two clearly separate lines, so Otto never implies the plate *is* the recipe.
- One user confirm with three chips: dish name ✓ / slices per loaf [8 | 10 | 12] / anything the camera can't see (e.g. "nuts?", "chocolate chips?"). This fixes the top errors at the cost of one tap. It fits the "user confirms 2–3 things" idea in the brief.
- Store `yield_quantity` + `yield_unit` + `serving_unit` + `photographed_portion` as separate fields. Do not overload `servings`.

### Gaps
- No empirical data on how well LLMs infer batch yield from a portion photo. This needs Otto's own eval.
- Typical-yield distributions per archetype from a real corpus (Recipe1M or Otto's catalogue) were not computed. Running them over `otto_recipes` would replace the unverified table above.

---

## 4. Grounding to reduce hallucination

### Takeaway
Use the WACV 2025 pattern: retrieve, then adapt, then check. Retrieve the 3–5 closest known recipes (Otto catalogue first, optionally the web) and let the model adapt them to the photo. Constrain ingredient names to Otto's USDA vocabulary (the existing canonicalize / resolve-nutrition step). Then run deterministic sanity checks: baker's-percentage ranges for baked goods, grams per serving, kcal per serving against FNDDS. Ask the user about the 2–3 things a camera can't know.

### Cited Findings
- Retrieval augmentation plus self-consistency voting over multiple retrieved contexts is the reported way to cut LMM hallucination in recipe generation — [WACV 2025](https://openaccess.thecvf.com/content/WACV2025/html/Liu_Retrieval_Augmented_Recipe_Generation_WACV_2025_paper.html)
- Pic2Plate combines a vision-language model with retrieval to ground recipe recommendations — [Pic2Plate, Sensors 2025](https://doi.org/10.3390/s25020449)
- Two-stage separation (detect ingredients with a vision model, then write with a language model) is used by Meal42 and in the literature (Inverse Cooking, FIRE) — [Meal42](https://apps.apple.com/app/id6757866043); [Inverse Cooking](https://openaccess.thecvf.com/content_CVPR_2019/html/Salvador_Inverse_Cooking_Recipe_Generation_From_Food_Images_CVPR_2019_paper.html); [FIRE](https://arxiv.org/html/2308.14391v2)
- Food name plus ingredients as conditioning sharply improves generation over image-only (LLaVA-Chef ablation) — [LLaVA-Chef](https://arxiv.org/html/2408.16889v1)
- Otto already has a USDA "pick-the-match" model step (`resolve-nutrition`, gpt-5-mini) and a canonicaliser (`canonicalize`, gpt-5.1) — repo: `/home/user/Recipe-App/supabase/functions/resolve-nutrition/index.ts`, `/home/user/Recipe-App/supabase/functions/canonicalize/index.ts`

### Inferences
- **Proposed pipeline** **[design]**:
  1. **Vision → structured guess** (gpt-5.1, low reasoning): dish name, top-3 alternates, archetype, visible components, visible portion, cues for hidden ingredients.
  2. **Confirm chip**: dish name (with alternates).
  3. **Retrieve**: nearest `otto_recipes` by name/embedding, top 3–5, with yields.
  4. **Adapt**: a JSON-schema-constrained generation that must use ingredient keys from Otto's USDA table. Free-text items not in the table go to `resolve-nutrition`.
  5. **Deterministic checks** in code: baker's % for the archetype, total-mass vs. archetype mass, kcal per serving vs. the FNDDS analogue. On failure, regenerate once with the failed check stated, then show "estimate" badges.
  6. **Nutrition**: Otto's existing on-device USDA math.
- **Baker's-percentage guard rails** for quick breads / loaves (flour = 100%; **[unverified typical ranges from domain knowledge; validate against the catalogue]**):

  | Ingredient | Range |
  |---|---|
  | Liquid incl. banana/egg | 60–110% |
  | Sugar | 30–80% |
  | Fat | 20–60% |
  | Chemical leavener | about 1–2% baking soda equivalent, or 3–5% baking powder |
  | Salt | 0.5–2% |

  Checks like these catch the classic LLM baking errors (e.g. a tablespoon of baking soda in one loaf).
- Self-consistency (WACV-style) costs N× tokens. A cheaper variant: generate once, run the deterministic checks, and regenerate only on failure.
- Attribution: if the adaptation stays close to one retrieved catalogue recipe, store `based_on_recipe_id` and show "Based on Otto's Banana Bread". That is honest, and it links the snap to the catalogue.

### Gaps
- No published measurement of how much catalogue-constrained vocabulary reduces nutrition error. Otto's eval set would have to show it.
- Web retrieval (search API cost, licensing of scraped recipes) was not researched here.

---

## 5. Honesty, IP and policy

### Takeaway
US law treats an ingredient list and simple directions as uncopyrightable, but expressive text (headnotes, descriptions, stories) and compilations are protected. So Otto can adapt a known recipe's ingredients and method as facts, must write its own step text, and should attribute when it is "based on" a specific source. Apple requires explicit, named consent before user photos go to third-party AI (5.1.2(i), revised Nov 13, 2025), and applies extra scrutiny to apps whose health data could be inaccurate (1.4.1). So nutrition from a snap must be labelled an estimate, with the method disclosed.

### Cited Findings
- US Copyright Office Circular 33: "A mere listing of ingredients or contents, or a simple set of directions, is uncopyrightable", and the Office cannot register recipes that are just ingredients plus a process — [Circular 33 (PDF)](https://www.copyright.gov/circs/circ33.pdf) (text from search excerpt)
- The Office's recipe factsheet: protection "may, however, extend to substantial literary expression — a description, explanation, or illustration — that accompanies a recipe or formula or to a combination of recipes, as in a cookbook" — [FL-122 (archived)](https://webarchive.library.unt.edu/web/20130103070723/http://www.copyright.gov/fls/fl122.pdf)
- Case law: Tomaydo-Tomahhdo v. Vozary, 629 F. App'x 658 (6th Cir. 2015, non-precedential) held recipes uncopyrightable as lists/procedures — [National Law Review](https://natlawreview.com/article/mixing-things-let-s-talk-recipes-part-one-four-part-series-copyright); [NYC Bar, "Secret Ingredients"](https://www.nycbar.org/wp-content/uploads/2023/05/20221024-SecretIngredientsHowtoProtectRecipes_FINAL_22.6.6.pdf)
- Apple 5.1.2(i), revised 2025-11-13: "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." — [TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai); [iGeeksBlog](https://www.igeeksblog.com/apple-app-store-ai-data-disclosure-guidelines)
- Commentary on 5.1.2(i): a privacy-policy line alone is not enough, pre-checked boxes are not acceptable, and stripping identifiers does not exempt the data — [stora.sh guide](https://stora.sh/blog/2026-05-06-apple-ai-consent-rule-5-1-2-i-implementation-guide); [QAwerk](https://qawerk.com/blog/apple-app-store-ai-data-sharing-guidelines/) **[secondary commentary]**
- Apple 1.4.1: medical apps that could provide inaccurate data may get greater scrutiny, and apps "must clearly disclose data and methodology to support accuracy claims relating to health measurements". A vet AI chat app was rejected under 1.4.1 — [ConductAtlas index of 1.4.1](https://conductatlas.com/platform/apple/apple-app-store-review-guidelines/provision/CA-P-018796/medical-apps-with-inaccurate-data-may-be-rejected/); [Apple Developer Forums thread](https://developer.apple.com/forums/thread/807889) **[wording via third-party index]**
- FTC: no source was retrieved in this session on FTC rules for nutrition claims in apps. **Gap.**

### Inferences
- Otto's ADR-0006 (named-provider AI consent before the first AI call) already covers 5.1.2(i) for photos, as long as the snap flow (including "photo before the account", ADR-0013) shows that consent *before* the upload.
- 1.4.1 posture: label snap nutrition "Estimated from a recipe Otto wrote from your photo · USDA FoodData Central". Link a "How Otto estimates" sheet. Avoid accuracy claims ("accurate calories") in store copy. That copy rule follows from the NIH finding that photo calorie apps under-count by 250–345 kcal.
- IP posture: copy facts (ingredients, amounts, method), never copy headnotes or step prose. Generate Otto's own wording. Attribute "Inspired by <source>" when one retrieved recipe dominates. Ownership of AI-written step text is a separate question; the Copyright Office's AI-authorship guidance was not researched here.
- If a recipe image is ever generated for a snapped dish, ADR-0014 applies: the user's real photo wins, so for snaps no generated image is needed.

### Gaps
- FTC guidance on health/nutrition claims (e.g. the Health Products Compliance Guidance) and FDA rounding rules for displayed nutrition were not retrieved.
- Apple's own text for 1.4.1 was not fetched; the wording comes via a third-party index.

---

## 6. Cost and latency per scan (OpenAI vision)

### Takeaway
At GPT-5.1 list prices ($1.25 / 1M input, $10 / 1M output), one scan costs about **$0.02–0.05** **[estimate]**. Output and reasoning tokens dominate, not the image. A gpt-5-mini first pass for identification would cut that further. Latency is **unverified**; plan for roughly 8–25 s and stream the reveal in stages.

### Cited Findings
- GPT-5.1 list price: $1.25 per 1M input, $0.125 cached input, $10.00 per 1M output. Batch: $0.625 / $5. Reasoning tokens bill as output. 400K context — [pricepertoken](https://pricepertoken.com/pricing-page/model/openai-gpt-5.1); [anotherwrapper](https://anotherwrapper.com/llm-pricing/gpt-5.1-2025-11-13); [chatlyai explainer](https://chatlyai.app/blog/gpt-5-1-pricing-explained) **[third-party trackers; the official page could not be fetched]**
- GPT-5 $1.25 input / $10 output; GPT-5 mini $0.25 input; GPT-5 nano $0.05 input. This is a snapshot marked deprecated, so prices may have changed — [OpenAI GPT-5 model page](https://developers.openai.com/api/docs/models/gpt-5) (search snippet)
- Image input is billed as tokens. For patch-based models such as gpt-5-mini, a 1024×1024 image = 32×32 = 1,024 patches × 1.2 = **~1,229 tokens**. Older/tile models use 70 base + 140 per tile — [OpenAI Images & vision guide](https://developers.openai.com/api/docs/guides/images-vision) (search snippet)
- Third-party pages describe newer models (e.g. "GPT-6", October 2026 price changes) that could not be verified — [nOps](https://www.nops.io/blog/openai-api-pricing/); [IntuitionLabs](https://intuitionlabs.ai/articles/chatgpt-api-pricing-2026-token-costs-limits) **[unverified]**
- For comparison: GPT-4o dietary assessment ≈ $2.00 per 1,000 images (≈ $0.002 per image), identification only — [bioRxiv 2026](https://www.biorxiv.org/content/10.64898/2026.07.26.740845v1.full)

### Inferences (worked estimate, all **[estimate]**)

**One-call design** (gpt-5.1): 1 image (~1.2k tokens) + system/schema prompt (~2k) + 3 retrieved recipes (~3k) ≈ 6k input, which is **$0.0075**. Output: a recipe JSON of about 1.5k tokens plus 1–2k reasoning tokens ≈ 2.5–3.5k, which is **$0.025–0.035**. Total ≈ **$0.03–0.04 per scan**. With one regeneration on a failed check, worst case about $0.07.

**Two-step design:**

| Step | Model | Input | Output | Cost |
|---|---|---|---|---|
| Identify | gpt-5-mini | ~3k tokens at $0.25/1M | ~300 tokens | < $0.002 |
| Write | gpt-5.1, no image | ~5k tokens | ~3k tokens | ≈ $0.036 |

Identification is nearly free, and that matters for the 3 free pre-account scans per device (ADR-0013).

At 3 free scans per device, the pre-account acquisition cost is about $0.10–0.15 per device in model fees.

**Latency:** no measured source. Hide it by streaming in stages: dish name and photo chip after the identify call (~2–5 s), the recipe card after writing (~+6–20 s), and nutrition instantly on device once the ingredients arrive.

### Gaps
- Official current OpenAI prices and model lineup for November 2026 (developers.openai.com was blocked). Re-check before modelling unit economics.
- No measured end-to-end latency for gpt-5.1 vision with structured output. Measure it from the existing `generate-recipe` edge function logs (photo-transcription path) before committing to UX timings.
