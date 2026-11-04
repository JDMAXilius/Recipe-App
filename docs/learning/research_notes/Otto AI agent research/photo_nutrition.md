# Photo → meal identification → nutrition → saved recipe (research notes)

Status: draft · research notes, not a spec · 2026-11-04

Method note: these notes come from web search result summaries. Direct page fetches failed because the session's network blocks `www.ncbi.nlm.nih.gov` and `dev.to`, so I could not read the full text of the PMC papers. Every number below has a link. Numbers I took from search summaries rather than the primary text are marked "(secondary)". Check them against the primary paper before quoting them in product copy or store copy.

Repo context I checked: `supabase/functions/generate-recipe/index.ts` already has a vision mode (photo → transcribed recipe, `MODEL_VISION = "gpt-5.1"`, `image_url` data-URI, size check in `imageMode.ts`). The cards already show computed calories bare and category estimates as `~` (`src/features/recipes/RecipeCard.tsx:121`).

## 1. How consumer apps do photo → calories, and how accurate they are

### Takeaway
Every major app works the same way: a vision model suggests foods, the app matches them to a food database, and the user confirms them. The best independent test so far (NIH, 102 weighed meals, 2026) found that all four apps tested undercounted by roughly 250–345 kcal per meal, about a third of the calories. Fat was the biggest miss. Vendor accuracy claims (80–97%) measure food identification, not calories, and do not survive independent testing.

### Cited Findings
- NIH/NIDDK study, presented as a conference abstract at NUTRITION 2026 (not peer-reviewed). 102 meals were prepared in the NIH Clinical Center metabolic kitchen with every ingredient weighed, and photos were run through four apps. Mean underestimates: Appediet 252 kcal, MyFitnessPal 327, Lose It! 333, Cal AI 345. — [Healio](https://www.healio.com/news/primary-care/20260804/ai-photobased-calorietracking-tools-underestimate-them-by-33); [ScienceDaily](https://www.sciencedaily.com/releases/2026/07/260726015237.htm); [Medscape](https://www.medscape.com/viewarticle/photo-based-meal-apps-underestimate-calories-and-fat-2026a1000qo9)
- In the same study, all apps underestimated fat by about 30 g per meal, and Lose It! and Cal AI underestimated carbohydrate by about 14 g. Overall the apps missed about a third of calories. The authors point to "hybrid approaches" as the fix. — [Healio](https://www.healio.com/news/primary-care/20260804/ai-photobased-calorietracking-tools-underestimate-them-by-33); [Medical Daily](https://www.medicaldaily.com/ai-calorie-tracking-apps-underestimate-calories-fat-nih-study-2026-476487) (secondary)
- Cal AI's FAQ claims "about 80% accurate". Older blog posts claim 90% on visible foods. — via [myclaw.ai review](https://myclaw.ai/blog/cal-ai-reviews) (secondary)
- One review site reports Cal AI at 63.5% recognition, ±25% portion error and 9.4 s processing. The same site ranks the app inconsistently, so treat this as low reliability. — [ai-calorie-tracker.com](https://www.ai-calorie-tracker.com/reviews/cal-ai)
- Hands-on reviews: Cal AI is "reasonable" on simple, visible meals, and accuracy "drops significantly" on mixed and homemade dishes. — [Nutrola review](https://nutrola.app/en/blog/cal-ai-review-2026) (competitor source); [Open Health test](https://openhealth.blog/en/blog/ai-photo-calorie-tracking)
- MyFitnessPal Meal Scan is a Premium feature. It scans live or from an uploaded photo, matches against the MFP database, and the user picks foods and sets servings before logging. — [MyFitnessPal blog](https://blog.myfitnesspal.com/meal-scan/); [whatthefood.io](https://whatthefood.io/blog/7-best-food-recognition-apps-for-tracking-calories)
- A single third-party test reported that Meal Scan underestimated protein by about 50% and overestimated carbs by more than 100% on simple grilled-chicken meals. This is a competitor-cited source, so it is low reliability. — [nutrifyai](https://www.nutrifyai.app/blog/myfitnesspal-alternatives-that-scan)
- Lose It! Snap It is Premium-only and does no automatic logging: a review step confirms the recognized food and amount. Lose It claims 87.3–97.1% accuracy on the Food-101 dataset (this is classification, not calories). A competitor-cited 2026 benchmark reports 68.7% identification and ±22% portion error. — [Nutrola](https://nutrola.app/en/blog/can-lose-it-scan-food-from-photos) (competitor source)
- SnapCalorie (Perception Labs) comes from former Google researchers. Co-founder Wade Norris is reported as a Nutrition5k co-author. It uses the phone's depth sensor to measure portions. The founder said in 2023 that this reduces caloric error to "under 20%". The app's FAQ claims about 15% mean caloric error (±150 kcal on a 1,000 kcal dish). No independent verification was found. — [TechCrunch 2023](https://techcrunch.com/2023/06/26/snapcalorie-computer-vision-health-app-raises-3m/); founder link via [kcalm comparison](https://kcalm.app/compare/kcalm-vs-snapcalorie/) (competitor source)
- Foodvisor keeps photo analysis behind Premium. Bitesnap is an older, free photo-first logger with a dated model. I found no detail on either app's confirm flow. — [nutrifyai best scanners](https://www.nutrifyai.app/blog/best-food-scanner-apps-2026)

### Inferences
- All the market leaders end in a "user confirms" step. Confirmation is the industry norm, not a burden that Otto would add.
- The documented failure mode is systematic *under*counting, driven by fat (oils, butter, dressings). This is not random noise. For a weight-loss user, an undercount is the harmful direction.
- Vendor accuracy percentages measure food identification on clean benchmark photos. They do not measure kcal. Otto should never quote an accuracy percentage in its marketing.

### Gaps
- The primary NUTRITION 2026 abstract text and per-macro tables (the press figures could not be checked against the abstract).
- A peer-reviewed independent test of SnapCalorie or Foodvisor.
- A systematic App Store review mining. I found no rigorous source, and the only review evidence I found is anecdotal blog summaries.

## 2. Research on vision-LLM calorie and macro estimation accuracy

### Takeaway
With photo only, general-purpose vision LLMs land at about 30–36% mean absolute percentage error (MAPE) on energy. GPT-4o and Claude 3.5 Sonnet are about equal, and Gemini 1.5 Pro is much worse. The models underestimate more as portions grow. Giving the model ingredient amounts roughly halves the error, to about 14%. Portion size, not food identification, is the dominant error source.

### Cited Findings
- Fridolfsson et al., *Current Developments in Nutrition* 2025 (DOI 10.1016/j.cdnut.2025.107556): 52 standardized food photos. Weight MAPE was 36.3% (GPT-4o) and 37.3% (Claude 3.5 Sonnet). Energy MAPE was 35.8% for both. Gemini 1.5 Pro's MAPE ranged 64.2–109.9% across nutrients. The authors found "systematic underestimation of large portions" and concluded the models are "not yet suitable for precise dietary assessment". — [PubMed](https://pubmed.ncbi.nlm.nih.gov/41081011/); [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12513282/)
- Rodriguez-Jimenez et al., *Nutrients* 2025, 17:3613 (ChatGPT-5, 195 dishes, 4 cases): photo only / photo plus non-visual descriptors / photo plus ingredients with amounts / ingredients without photo. Reported error by case: about 30.5% → 24.4% → 13.9%. Removing the photo while keeping the ingredients made results *worse*, so visual cues add information. Dish complexity (number of ingredients) correlated only weakly with error. — [Nutrients DOI](https://doi.org/10.3390/nu17223613); figures (secondary) via [calorix.ai](https://calorix.ai/blog/can-chatgpt-count-calories/)
- O'Hara et al. 2025: ChatGPT underestimated weight for 87 of 114 (76.3%) meal photos. — [ResearchGate](https://www.researchgate.net/publication/388806807_An_Evaluation_of_ChatGPT_for_Nutrient_Content_Estimation_from_Meal_Photographs) (secondary)
- Nutrition5k (Thames et al., Google, CVPR 2021): about 5,000 real cafeteria dishes with video, depth, per-component weights and nutrition. Calorie error was 26.1% for a 2D image model, 18.8% with RGB-D, and 16.5% with a depth-based volume pipeline (secondary figures from a review). The paper claims its model beats professional nutritionists. Dataset at github.com/google-research-datasets/Nutrition5k. — [CVPR paper](https://openaccess.thecvf.com/content/CVPR2021/papers/Thames_Nutrition5k_Towards_Automatic_Nutritional_Understanding_of_Generic_Food_CVPR_2021_paper.pdf); [arXiv](https://arxiv.org/abs/2103.03375); numbers via [Liner review](https://liner.com/review/nutrition5k-towards-automatic-nutritional-understanding-generic-food) (secondary)
- Benchmark papers: even the best models struggle to get portion MAPE below 50% in complex categories such as packaged food. — [arXiv 2507.07048](https://arxiv.org/html/2507.07048v1) (summary)
- Other 2026 benchmarks to read: a ten-model VLM benchmark of accuracy, cost and prompt strategies ([bioRxiv](https://www.biorxiv.org/content/10.64898/2026.07.26.740845v1.full)); a prompt-engineering multi-dataset study ([Nutrients 2026](https://doi.org/10.3390/nu18122017)); Open-KNEAD, a knowledge-grounded agentic decomposition ([arXiv 2607.12911](https://arxiv.org/pdf/2607.12911)); OmniFood-Bench ([arXiv 2607.08423](https://arxiv.org/pdf/2607.08423)).
- Early multimodal ChatGPT dietary assessment analysis — [arXiv 2312.08592](https://arxiv.org/pdf/2312.08592)

### Inferences
- Rule of thumb for Otto: photo-only point estimates are about ±30–35% off on average, with a downward bias. With confirmed ingredients and amounts the error is about ±14%, and the remaining error is mostly hidden fat and the portion actually eaten.
- The ChatGPT-5 result is the strongest argument for Otto's architecture: an ingredient list *with amounts* is the single biggest accuracy lever. Otto can then compute the numbers from USDA itself instead of letting the model do the arithmetic.

### Gaps
- Per-macro MAPE for Fridolfsson (the PMC full text was blocked).
- Exact numbers from the 2026 ten-model benchmark, including which model or prompt won and the cost per image.
- No study found on GPT-5.1 specifically, the model Otto's vision mode uses.

## 3. Better methods: model identifies, database computes, user confirms

### Takeaway
The evidence supports a hybrid design. The vision model only *identifies* components and proposes rough portions. Otto maps them to USDA FoodData Central entries and computes the numbers on-device. The user confirms the ingredients and the one or two biggest portions (rice and oil typically dominate). Depth sensing improves portion error from about 26% to about 17–19% in research. Multi-photo and reference objects help, but each adds friction.

### Cited Findings
- Depth and volume cut calorie error from 26.1% (2D) to 16.5–18.8% on Nutrition5k. — [Nutrition5k](https://openaccess.thecvf.com/content/CVPR2021/papers/Thames_Nutrition5k_Towards_Automatic_Nutritional_Understanding_of_Generic_Food_CVPR_2021_paper.pdf); [Liner](https://liner.com/review/nutrition5k-towards-automatic-nutritional-understanding-generic-food) (secondary)
- SnapCalorie applies depth sensors in production and claims under 20% error. — [TechCrunch](https://techcrunch.com/2023/06/26/snapcalorie-computer-vision-health-app-raises-3m/)
- Supplying ingredient amounts lowered GPT-5 energy error from about 30.5% to about 13.9%. — [Nutrients 17:3613](https://doi.org/10.3390/nu17223613) (figures secondary)
- The NIH authors recommend "hybrid approaches" after finding the fat undercount. — [Medical Daily](https://www.medicaldaily.com/ai-calorie-tracking-apps-underestimate-calories-fat-nih-study-2026-476487)
- MFP and Lose It both match vision output to their food databases and require a confirm step. — [MFP blog](https://blog.myfitnesspal.com/meal-scan/); [Nutrola on Snap It](https://nutrola.app/en/blog/can-lose-it-scan-food-from-photos)
- A 2026 study reports that an automated pipeline with Claude Sonnet cut energy MAE by 4.9% and protein and fat MAE by about 25% compared with a baseline, while carbohydrate error rose by 23.1%. Structured decomposition helps unevenly. — via [Nutrients 2026 search summary](https://doi.org/10.3390/nu18122017) (secondary; the exact attribution is unclear)

### Inferences (recommended pipeline for Otto)
1. **Vision call (edge function)** returns structured JSON only: `components[]` with `{name, usdaQuery, visibleConfidence: high|med|low, portion: {low, mid, high, unit}, hiddenRisk: ["oil","butter","sauce","sugar"]}` plus `dishGuess`. The model returns **no kcal**. This keeps nutrition deterministic and USDA-sourced, consistent with Otto's honesty rules.
2. **On-device mapping** to Otto's existing USDA table (usdaTable keys + grams, the same path the `otto-new-recipes` skill uses). Unmatched items stay visible as "not counted" chips. Otto never invents a value for them.
3. **Ask at most 1–2 questions**, picked by the largest kcal *uncertainty* (high − low): "About how much rice? ½ cup · 1 cup · 1½ cups" with a visual size reference, and "Cooked with oil or butter? None · a little · a lot". The fat question targets the documented failure mode.
4. **Compute low/mid/high** from the USDA numbers and show `~520 kcal (440–610)`. Keep the `~` until every portion is user-confirmed or weighed.
5. **Optional depth**: iPhone Pro LiDAR via ARKit is a later enhancement. It is not needed for v1, because the confirm step captures most of the gain.
- Multi-photo (top plus 45° angle) is supported by depth research, but I found no source quantifying the gain for LLM inputs. See Gaps.

### Gaps
- No quantified result found for multi-photo LLM input, or for reference-object (credit card, plate size) calibration with LLMs.
- No study isolating "1–2 clarifying questions" against a full ingredient list. The inference above extrapolates from the ChatGPT-5 escalating-context result.

## 4. Photo → recipe (not just calories)

### Takeaway
Reverse-engineering a recipe from a plated-dish photo is an established research area (Inverse Cooking, CVPR 2019 → retrieval-augmented LMMs 2024–25), but hallucination remains a documented problem. The honest framing is "a recipe *like* this", seeded from a matched catalogue recipe, not "the recipe for this". Photos of cookbook pages and handwritten cards are a separate, much easier transcription task that Otto already ships.

### Cited Findings
- Inverse Cooking (Salvador, Drozdzal, Giró-i-Nieto, Romero; Facebook AI, CVPR 2019, pp. 10453–10462) predicts ingredients from an image and then generates instructions. — cited in [Retrieval Augmented Recipe Generation, WACV 2025](https://openaccess.thecvf.com/content/WACV2025/papers/Liu_Retrieval_Augmented_Recipe_Generation_WACV_2025_paper.pdf)
- Retrieval Augmented Recipe Generation (WACV 2025) retrieves similar recipes and uses them as references for a LLaVA+LoRA generator. The authors say multimodal models "still hallucinate" in recipe generation and cite FoodLMM as an example. — [WACV 2025](https://openaccess.thecvf.com/content/WACV2025/papers/Liu_Retrieval_Augmented_Recipe_Generation_WACV_2025_paper.pdf)
- FIRE: Food Image to REcipe generation (2023) produces title, ingredients and instructions from an image. — [arXiv 2308.14391](https://arxiv.org/pdf/2308.14391)
- ChefFusion (CIKM 2024) is a multimodal foundation model for recipe and food image generation. — [arXiv 2409.12010](https://arxiv.org/pdf/2409.12010)
- LetMeCook (ACM MM 2025) is a fridge photo → ingredient detection → retrieval → LLM refinement system. — [ACM DL](https://dl.acm.org/doi/10.1145/3746027.3754489)
- Otto today: `generate-recipe` vision mode transcribes a photographed recipe (schema-constrained, `gpt-5.1`, with a decline path "Otto couldn't read that photo"). — repo `supabase/functions/generate-recipe/index.ts:350-374`

### Inferences
- Use a **retrieval-first** design, the same lesson as the WACV 2025 paper. Match the identified dish and components against `otto_recipes` and offer "Closest Otto recipe: Chicken burrito bowl, edit to match yours". Generate a new recipe only when nothing matches. Label it "Otto's guess at this dish" and make it fully editable.
- Keep two entry intents in the UI: "Log what I ate" (meal → nutrition) and "Save as a recipe" (meal → editable recipe). A plated dish's recipe is a guess. A cookbook page is a transcription. The copy should differ for each.
- Servings: a photo shows one plate. Default to "1 serving as pictured". For a saved recipe, ask "How many servings did the whole batch make?" and do not infer it.

### Gaps
- No quantitative ingredient-recall numbers for current frontier LLMs on image-to-recipe (older Inverse Cooking metrics are not comparable).

## 5. UX patterns for honest uncertainty

### Takeaway
The established pattern is: editable chips for detected items, then a confirm step, then logging. Combine it with Otto's existing `~` convention, low–high ranges, and an explicit "what Otto assumed" list. I found no formal study comparing range against point-estimate displays in food apps.

### Cited Findings
- Confirm-before-log in Snap It ("a review step where you confirm the recognized food and amount") and in Meal Scan (select foods, set servings). — [Nutrola](https://nutrola.app/en/blog/can-lose-it-scan-food-from-photos); [whatthefood.io](https://whatthefood.io/blog/7-best-food-recognition-apps-for-tracking-calories)
- Lose It suggests cropping the photo to help recognition. — [Nutrola](https://nutrola.app/en/blog/can-lose-it-scan-food-from-photos)
- Otto already uses `~` for estimates and a bare number for computed figures. — repo `src/features/recipes/RecipeCard.tsx:22,121`; `src/features/cookbook/components/RecipeCard.tsx:16,87`

### Inferences (recommended UI)
- **Result sheet:** photo thumbnail. Below it, chips such as "Rice · ~1 cup ▾", "Black beans · ~½ cup ▾", "Chicken thigh · ~120 g ▾" and "+ Add". Low-confidence chips get a dotted outline and "?". There is also a "Not counted: salsa (couldn't match)" row.
- **Number:** `~540 kcal` with `range 450–650` in secondary text. Macros as `~P 32 g · C 60 g · F 18 g`. Drop the `~` only when the user has confirmed every portion.
- **"Otto assumed"** disclosure: "1 tbsp oil for cooking · rice is cooked white rice · 1 serving as pictured". Each line is tappable to change it.
- **Source line:** "Numbers from USDA FoodData Central. Photo read by OpenAI." This also supports the Apple 1.4.1 methodology disclosure (see §6).
- Never show decimals or kcal to single units on photo estimates. Round to 10 kcal, because false precision implies an accuracy the method does not have.

### Gaps
- No peer-reviewed study found on range versus point estimates in consumer nutrition UX.

## 6. Risks: health claims, eating disorders, Apple, FTC, privacy

### Takeaway
The biggest product risk is eating-disorder harm from precise, gamified calorie tracking. The biggest compliance risks are (a) accuracy claims without disclosed methodology (Apple 1.4.1, FTC substantiation) and (b) sending meal photos to OpenAI without explicit, provider-naming consent (Apple 5.1.2(i), revised Nov 2025). Otto's ADR-0006 already covers the consent point.

### Cited Findings
- Levinson et al. 2017: of 105 people with diagnosed eating disorders, 74.3% used MyFitnessPal, and 73.1% of those said it contributed to their symptoms (self-report, not causal). — [ResearchGate](https://www.researchgate.net/publication/319194941_My_Fitness_Pal_calorie_tracker_usage_in_the_eating_disorders)
- People who track for weight or shape reasons were more likely to say the app contributed to ED symptoms than people who track for health reasons. — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1471015321000957)
- College app users show higher disordered-eating scores (correlational). — [ResearchGate](https://www.researchgate.net/publication/313537618_Calorie_counting_and_fitness_tracking_technology_Associations_with_eating_disorder_symptomatology)
- Longitudinal food-tracking study: general disordered-eating symptoms increased after tracking, while emotional eating and anxiety decreased. — [PMC11556259](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11556259/)
- Counterevidence: a 2021 RCT with 200 low-risk college women found no change in ED risk after one month of MFP. The authors say this may not generalise to higher-risk people. — summarised in [Duke Psychiatry](https://psychiatry.duke.edu/blog/trouble-tracking) (secondary)
- Apple 1.4.1: medical apps that could provide inaccurate data get greater scrutiny. Rejections ask apps to "clearly disclose data and methodology to support accuracy claims relating to health measurements" and to cite sources. — [Apple forums 703502](https://developer.apple.com/forums/thread/703502); [Apple forums 807508](https://developer.apple.com/forums/thread/807508) (wellness app still flagged); [conductatlas](https://conductatlas.com/platform/apple/apple-app-store-review-guidelines/provision/CA-P-018796/medical-apps-with-inaccurate-data-may-be-rejected/) (secondary)
- Apple also bars writing false or inaccurate data into HealthKit. — [conductatlas](https://conductatlas.com/platform/apple/apple-app-store-review-guidelines/provision/CA-P-019081/apps-must-not-write-false-data-into-healthkit/) (secondary)
- Apple 5.1.2(i) was revised on 13 Nov 2025 to name third-party AI explicitly: apps must disclose and obtain explicit permission before sending personal data to a third-party AI. Apps have been rejected when the consent screen was not seen by reviewers. — [TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai); [Apple forums 820209](https://developer.apple.com/forums/thread/820209); [Apple forums 816140](https://developer.apple.com/forums/thread/816140)
- FTC: health claims need "competent and reliable scientific evidence". In 2024 HeHealth (Calmara) claimed up to 94.4% accuracy for an AI STI-detection app, and the FTC's closing letter led it to shut the app down and refund customers. Earlier cases include MelApp and Mole Detective (2015) and a blood-pressure app (2016). — [FTC closing letter](https://ftc.gov/system/files/ftc_gov/pdf/hehealth-closing-letter.pdf); [Kelley Drye](https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/ftc-settles-with-health-app-marketers-for-unsubstantiated-melanoma-detection-claims); [Mintz](https://www.mintz.com/insights-center/viewpoints/2017-10-10-building-health-app-part-4-avoiding-ftc-enforcement-action)

### Inferences
- **Copy rules:** no "accurate" or "precise" claims, and no percentages. Use "Otto's estimate from your photo" and "numbers from USDA". Never connect the feature to weight loss, diabetes or carb counting for insulin. A 2026 ScienceDirect study on LLM carb counting in T1D exists, which shows that use case is live and high-risk.
- **ED-sensitive defaults:** make the feature recipe-first ("save this meal as a recipe") rather than a running daily kcal total. No streaks, no red/green "over budget" colours, no "bad food" labels. Give users a setting to hide numbers (show ingredients and servings only). Do not prompt users to photograph every meal. The weight/shape-motive finding suggests framing the feature around cooking and variety, not restriction.
- **HealthKit:** if Otto ever writes dietary energy, write only user-confirmed values and keep the range in metadata, or don't write at all. Writing a 30%-off photo guess risks the "inaccurate data" clause.
- **Privacy:** meal photos can contain faces, homes, location EXIF and receipts. Strip EXIF on-device before upload, downscale, don't retain images server-side, and name OpenAI in the consent (ADR-0006). Update `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` (Photos or Videos → linked/not linked, purpose: app functionality).

### Gaps
- I did not find NEDA's published guidance on app design. The NEDA site was not reached, so cite NEDA only after reading it directly.
- No FTC action specific to calorie-counting apps was found.
- The exact current text of guideline 1.4.1 was not read from developer.apple.com in this session.

## 7. Costs and latency

### Takeaway
At current list prices, image input is a fraction of a cent per photo on mini-class models. Otto's current vision model (`gpt-5.1`) will cost more per image, but should still be in the low cents per scan including output. Cal AI-class apps report about 9 s end to end, so a target of under 10 s (or streaming chips) is in line with the market.

### Cited Findings
- OpenAI bills images as input tokens based on size and detail, with per-model multipliers: 1.2 for gpt-5-mini and 1.62 for gpt-4.1-mini. A 1,024-patch image works out to about 1,229 billable tokens on gpt-5-mini. — [OpenAI Images & vision guide](https://developers.openai.com/api/docs/guides/images-vision)
- List input prices: gpt-5-mini $0.25 per 1M tokens, gpt-4.1-mini $0.40 per 1M (deprecated). — [OpenAI GPT-4.1 mini page](https://developers.openai.com/api/docs/models/gpt-4.1-mini); aggregators [calcis.dev](https://www.calcis.dev/pricing/openai), [benchlm.ai](https://benchlm.ai/openai/api-pricing) (secondary; they conflict on output prices)
- Cal AI processing time is about 9.4 s (a single review site, low reliability). — [ai-calorie-tracker.com](https://www.ai-calorie-tracker.com/reviews/cal-ai)
- Otto's vision call uses `gpt-5.1` with a 120 s timeout and maxTokens 4000. — repo `supabase/functions/generate-recipe/index.ts:15,166-167`

### Inferences
- Rough arithmetic (mine, not from a source): image input of about 1.2k tokens on gpt-5-mini costs about $0.0003. A structured component JSON of about 300–600 output tokens adds roughly $0.001 at about $2 per 1M output. So the total is about $0.001–0.002 per scan on a mini model, and about 5–10× that on a full model.
- Because the model only identifies foods (no arithmetic, no recipe prose), a mini model may be enough for the identification step. Calibrate it against Otto's own small, weighed test set before switching off `gpt-5.1`.
- Latency: send a downscaled image (around 1024 px long edge) to cut tokens and upload time. Render chips progressively.

### Gaps
- Current official gpt-5.1 per-token pricing was not retrieved in this session.
- No measured latency for Otto's own vision call; read it from `logUsage` logs.
