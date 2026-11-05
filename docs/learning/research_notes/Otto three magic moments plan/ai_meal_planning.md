# AI meal planning: auto-generating a week (or day) of meals, personalising it, and editing it by conversation

Status: draft · Research notes, not verified against code · 2026-11-05

Research method note: this session's network only allowed web *search*; direct fetches of medrxiv.org, arxiv.org and eatthismuch.com were blocked (host not in allowed network domains). Findings below therefore come from search-result content and snippets, not full-text reads. Numbers from papers are abstract-level and should be checked against the full texts before being quoted in a product doc.

## 1. Products: inputs, plan shape, swaps, and what reviews praise or complain about

### Takeaway
Every successful planner follows the same loop: ask a few inputs (diet, allergies, dislikes, household/servings, optionally calories), generate a whole day/week at once, then let the user refine with a per-meal "shuffle/swap" plus a "regenerate whole day/week" button, and roll the result into a grocery list. The recurring complaints are repetition over time, unrealistic macro/portion outputs, poor leftover/small-household handling, rigid scheduling, and user recipes being second-class in the planner.

### Cited Findings
**Eat This Much (algorithmic generator by calories/macros)**
- Generates a plan from calorie, macro and food settings; two levels of regeneration: a "shuffle" button next to each meal type that "will regenerate just that meal. Clicking on it won't impact the rest of your day's meal plan", or regenerate the entire day — [Eat This Much blog, Tutorial #3](https://blog.eatthismuch.com/eat-this-much-tutorial-3-getting-meals-you-like-part-1-how-to-regenerate-meals-favorite-and-block-foods/)
- Same tutorial covers "favorite" and "block" foods as the main preference-teaching controls — [Eat This Much blog, Tutorial #3](https://blog.eatthismuch.com/eat-this-much-tutorial-3-getting-meals-you-like-part-1-how-to-regenerate-meals-favorite-and-block-foods/)
- Recommended workflow: regenerate the day/week until you have a good baseline, then regenerate individual meals/foods to fine-tune — [Eat This Much how-to](https://www.eatthismuch.com/how-to/)
- Free tier builds a day; the automatic weekly generator is a subscriber feature — [Eat This Much FAQ](https://www.eatthismuch.com/faq); [ProMealPlan review 2026](https://www.promealplan.com/en/blog/eat-this-much-review-2026)
- Off-plan eating: remove the suggested foods, add what you ate, and regenerate the remaining meals of the day — [Eat This Much FAQ](https://www.eatthismuch.com/faq)

**Strongr Fastr**
- Plans generated from profile inputs; user can set own targets (calories, protein, carbs, fiber) — [App Store listing](https://apps.apple.com/us/app/-/id1326334081)
- Swap flow: Meal Plan tab → "Swap" → pick which days to replace → "Find Replacement" → browse and select — [Strongr Fastr help: meal plan editing](https://www.strongrfastr.com/help/clients/meal_plan_tutorial)
- Help docs warn "Changing portion sizes may throw your meal plan off of its nutrition goals"; coach-configured plans can disable swapping — [Strongr Fastr help](https://www.strongrfastr.com/help/clients/meal_plan_tutorial)

**PlateJoy / Prospre**
- PlateJoy "Path" auto-assigns Balance Plates recipes, which you can swap out if they don't fit preferences (Healthline review, possibly dated) — [Healthline](https://www.healthline.com/nutrition/platejoy)
- PlateJoy reviewer: "it can be hard cooking for one to not have a crazy amount of leftovers" — [Product Hunt reviews](https://www.producthunt.com/posts/platejoy-2/reviews)
- Prospre: only "customized meal plans tailored to nutrition/fitness goals and personal preferences" was found; no swap details — [AlternativeTo Strongr Fastr alternatives](https://alternativeto.net/software/strongr-fastr)

**Mealime**
- Flow: choose dietary preferences and dislikes, pick meals for the week, app auto-generates a grocery list grouped by store section; no pantry tracking — [Macaron blog (secondary, self-contradicting on overlap)](https://macaron.im/en/blog/meal-planner-and-grocery-list)
- Whether Mealime optimises ingredient overlap is contradicted between two pages of the same secondary source — [Macaron A](https://macaron.im/en/blog/meal-planner-and-grocery-list) vs [Macaron B](https://macaron.im/nl/blog/ai-meal-planner-and-shopping-list)
- Mealime reviewers: "many ingredients are not measured in the total Nutrition"; want nutrition shown up front — [JustUseApp Mealime reviews](https://justuseapp.com/en/app/1079999103/mealime-meal-plans-recipes/reviews)

**Ollie (AI family planner)**
- Tailors recipe ideas to mixed households (e.g. one non-vegetarian member, rest vegetarian, picky eaters); parent estimated ~5 hours/week saved; >50,000 families; $9.99/month for new sign-ups — [Daily Herald](https://www.dailyherald.com/?p=1331797)
- App Store ~4.8/5 (~930 ratings); Google Play aggregate lower (3.78) — [App Store](https://apps.apple.com/us/app/ollie-ai-family-meal-planner/id6480014476); [AppGoblin](https://appgoblin.info/apps/com.confabulation.ollie)
- No evidence found of a specific Ollie leftovers feature.

**MyFitnessPal Meal Planner (Intent acquisition)**
- MFP acquired Intent (announced Feb 2025) to build a Meal Planner: plans around goals, preferences and routines, automated grocery lists, streamlined meal logging; Premium+ at $99.99/year; US/UK/IE/CA/AU/NZ — [Android Authority](https://androidauthority.com/myfitnesspal-acquires-intent-3525696); [NutritionInsight](https://www.nutritioninsight.com/news/nutrition-tracker-meal-planner-diet-health-fitness-app-myfitnesspal-intent.html); [Bloomberg Law](https://news.bloomberglaw.com/private-equity/myfitnesspal-to-offer-ai-meal-plans-after-quietly-buying-startup)
- Intent app access ends April 2026 — [connectthewatts](https://connectthewatts.com/2025/02/14/myfitnesspal-acquires-intent-to-enhance-meal-planning-for-members/)

**Samsung Food (ex-Whisk)**
- Launch (IFA 2024): free users got 3 days of recommendations per week, Food+ ($6.99/mo) got a full week; Food+ plans track calories/macros with customisable targets — [Samsung Newsroom US](https://news.samsung.com/us/upgraded-samsung-food-raises-bar-for-food-experiences-ifa-2024/); [Ubergizmo](https://ubergizmo.com/2024/09/samsung-ai-food-platform)
- Plans built from the user's Food List (pantry), prioritising ingredients nearing use-by date; pantry items can be added by photo (Vision AI) — [Samsung Newsroom US](https://news.samsung.com/us/upgraded-samsung-food-raises-bar-for-food-experiences-ifa-2024/)
- Newer App Store copy: tailored plans for all users, full-week plan usable 2x free, subscription after — [App Store](https://apps.apple.com/app/whisk-recipes-grocery-list/id1133637674) (conflicts with launch materials; newer source likely current)

**Lifesum / Noom**
- Lifesum premium: 7–21 day meal plans, four pre-planned recipes a day, grocery list; plans "can be started, swapped or stopped whenever you want" — [Lifesum features](https://lifesum.com/features/); [Active.com review](https://www.active.com/nutrition/articles/lifesum-review)
- Lifesum reviewer: recipes cannot be edited; meal planning only works for Lifesum's recipes, not user-added ones; developer says plans are a short "kick-starter" — [AppsHunter Lifesum reviews](https://appshunter.io/ios/app/286906691/reviews/5)
- Noom: no current evidence found of a meal-plan generator with swaps; it centres on logging against a calorie range — [Feastgood Noom vs Lifesum](https://feastgood.com/?p=25597)

**HelloFresh-style menus**
- First ML menu feature ranks a pre-selected weekly menu by each customer's past choices; text analysis of feedback ties comments to recipes — [HelloFresh Group newsroom](https://hellofreshgroup.com/de/newsroom/stories/how-tech-and-big-data-enable-us-to-personalize-the-meal-kit-experience)
- Reported $70M AI investment to support up to 100 weekly menu choices — [WebProNews (Bloomberg-sourced)](https://www.webpronews.com/hellofresh-invests-70m-in-ai-for-100-weekly-menu-options)
- Employee posts (unverified): signals include cart adds/removes, stated tastes, actual choices, ratings; tags such as GLP-1 friendly, gluten-free, kid-friendly — [LinkedIn](https://de.linkedin.com/in/mark-fenderov)
- Reddit user: HelloFresh "still cannot auto select meals which they would actually choose" — [Reddit snapshot](https://reddit.sentinel-team.org/posts/1qhiyf7/snapshots/2026-01-20T07%3A41%3A31.042129Z)

**Cross-app review themes**
- Repetition after extended use is the most common complaint (Mob, family planners) — [Grand Screen Mob](https://grand-screen.com/apps/mob-delicious-meal-planning/)
- Unrealistic macros: MealPrepPro high-protein preset gave ~200 g protein/day even with custom settings — [AppsHunter MealPrepPro](https://appshunter.io/ios/app/1249805978/reviews)
- Users want to move meals between days and mark a day as "leftovers or eating out" — [AppsHunter Eat Together](https://appshunter.io/ios/app/1627955204/reviews)
- Moving a meal to another day should not break the grocery list — [Behixo blog](https://www.howto.behixo.com/how-to/how-to-find-a-meal-planning-tool-that-saves-time-not-work)

### Inferences
- The "shuffle one meal without touching the rest" + "regenerate the whole day/week" pair is the industry-standard edit model; Otto's conversational layer should map onto exactly these two primitives (plus add/remove/move).
- Lifesum's "planner only works with our recipes" complaint is a direct opportunity: Otto should let user recipes enter the plan as first-class candidates.
- Small-household leftover overload (PlateJoy) and "mark day as leftovers/eating out" (Eat Together) argue for servings-aware planning and non-recipe plan items — which Otto's free per-day list with custom labels already supports.

### Gaps
- No primary-source detail on how PlateJoy, Prospre, Noom or Ollie actually generate plans (algorithm or LLM).
- No reliable Reddit threads retrieved (search returned none); review evidence is thin and mostly single reviews.
- ChatGPT/Gemini as consumer planners: no product-level UX study found beyond the academic evaluations in section 2.
- Whether MFP Meal Planner shipped and how it performs was not confirmed.

## 2. Methods: optimisation, retrieval + ranking, pure LLM, hybrids — and evidence on LLM plan quality

### Takeaway
Pure LLM plans look plausible but repeatedly miss micronutrient/macro targets and occasionally include forbidden allergens; integer programming reliably satisfies hard constraints but scores worse on practicality. The best-evidenced 2025–2026 design is a hybrid: deterministic filtering + solver/ranker over a real catalogue, with the LLM interpreting the request and choosing/explaining among feasible candidates.

### Cited Findings
**Optimisation (diet problem / integer programming)**
- Recipe-based integer models restrict solutions to bundles forming real recipes rather than raw foods (Leung, Wanitprapha & Quinn, 1995) — [British Journal of Nutrition](https://cambridge.org/core/journals/british-journal-of-nutrition/article/recipebased-dietplanning-modelling-system/A582EB0B7B33754C4EEE25A6FCCE446F)
- MIT thesis (Kang, 2010) frames recipe-based diet planning as inventory management, starting from the classic MILP diet problem — [MIT DSpace](https://dspace.mit.edu/handle/1721.1/61895)
- A MILP thesis adds constraints on food-group frequency and ingredient repetition plus a Jaccard similarity index to keep meals varied — [Comillas repository](https://repositorio.comillas.edu/jspui/bitstream/11531/88809/1/TFG-ArduraCarnicero%2cElena.pdf)
- arXiv 2511.18483 (Nov 2025): binary integer programme selects a 15-week recipe schedule meeting nutritional thresholds while minimising expected cost for a nonprofit; uses LLM-aided data extraction — [arXiv 2511.18483](https://arxiv.org/abs/2511.18483v1)

**Hybrid LLM + solver**
- medRxiv preprint (Feb 2026): filter food items → MILP solver finds top-10 optimal solutions → LLM chooses the most appropriate plan. Standalone MILP scored best on Nutrient Accuracy (4.93) and Variety (4.10) but lagged MILP+LLM on Practicality and Personalization — [medRxiv 2026.02.14.26346312](https://www.medrxiv.org/content/10.64898/2026.02.14.26346312v1.full-text) (snippet-level; full text not read)
- LAPPI (arXiv 2512.14138, Dec 2025): LLM turns the user's request into a solver-ready instance passed to an existing optimiser; states LLMs alone cannot reliably enforce constraints or guarantee feasible/optimal solutions; meal planning is a motivating example (evaluated mostly on trip planning) — [arXiv 2512.14138](https://arxiv.org/pdf/2512.14138)
- Damette et al. (2025): hybrid-intelligence meal-planning assistant built on GPT-4o (Springer CCIS vol. 2471) — [LIST](https://www.list.lu/en/research/scientific-publication/enhancing-personalized-nutrition-towards-a-hybrid-intelligence-approach-with-llm-powered-meal-plann)

**Pure-LLM generators and evaluations**
- NutriGen (arXiv 2502.20601, 2025): LLM meal-plan generator grounded against USDA data; reported calorie mean absolute % errors as low as 1.55% (Llama 3.1 8B) and 3.68% (GPT-3.5 Turbo); one model had 10.45%; paper text is internally inconsistent about which models were best — [arXiv 2502.20601](https://arxiv.org/html/2502.20601v1)
- Allergy safety (Niszczota & Rybicka, *Nutrition* 2023): 56 diets for allergic personas; 4/56 (7.1%) contained a forbidden allergen (e.g. almond milk in a nut-free diet); portion/calorie errors more common; menus repetitive — [PubMed 37269717](https://pubmed.ncbi.nlm.nih.gov/37269717/); [News-Medical](https://www.news-medical.net/news/20230515/Robo-diets-can-ChatGPT-formulate-safe-dietary-advice.aspx)
- Obesity (Nutr Health 2025): dietitians reviewed GPT-4 and GPT-4o 1800 kcal menus; fell short of Turkish guidelines, under-delivered calcium and other micronutrients, unbalanced macros — [PubMed 40111941](https://pubmed.ncbi.nlm.nih.gov/40111941/)
- Simulated type 2 diabetes (J Eval Clin Pract 2025): ChatGPT-4.1 70.9% energy alignment (overestimated fat), Grok-3 83.1%; frequent hallucinations, weak clinical context — [Avesis record](https://avesis.uludag.edu.tr/yayin/0411c36b-a693-4848-a61f-c5c1c5893258/evaluating-ai-generated-meal-plans-for-simulated-diabetes-profiles-a-guideline-based-comparison-of-three-language-models)
- MASLD (2025): ChatGPT-4o menus averaged 1596.9 ± 141.5 kcal with 91.3 ± 11.0% energy accuracy but macro discrepancies — [Bilgi open access](https://openaccess.bilgi.edu.tr/items/b6d621e3-3a9e-48a3-8720-a95736e97d42/full)
- Pregnancy (Ernährungs Umschau 2025): 20 daily plans from GPT-4o mini and Gemini 1.5 Flash met most but not all DGE nutrient recommendations; weaknesses on critical nutrients — [Ernährungs Umschau PDF](https://www.ernaehrungs-umschau.de/fileadmin/Ernaehrungs-Umschau/pdfs/pdf_2025/12_25/EU12_2025_PR_Mo__ssinger_en.pdf)
- Adolescents (Frontiers in Nutrition 2026): five LLMs vs dietitian plans showed a clinically significant energy bias (reported +695 kcal) — [Frontiers in Nutrition](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2026.1765598/full)
- Nutrients 2026 compared Gemini, Copilot, ChatGPT-4 plans (1400–1800 kcal) with DQI-I diet quality index — [MDPI Nutrients 17(2):206](https://www.mdpi.com/2072-6643/17/2/206)

**Retrieval + ranking**
- Collaborative filtering works without heavy metadata but struggles with cold start; suits recipe communities that prompt for feedback — [Trattner & Elsweiler, food recommender survey](https://arxiv.org/pdf/1809.02862)
- Gousto uses content-based recipe embeddings to solve product cold start for weekly-changing menus, since item-based CF can't — [Gousto engineering blog](https://medium.com/gousto-engineering-techbrunch/gousto-r-series-vol-2-tackling-the-cold-start-problem-in-recipe-recommendation-engine-af92a434805f)

### Inferences
- For Otto (795-recipe catalogue, user recipes, strict allergy code), the evidence favours: code applies hard filters (allergens, dislikes, diet) → a deterministic selector/ranker assembles a plan from real recipes with variety and reuse scoring → the LLM interprets free text into structured constraints and writes the short "why" copy. The LLM never emits recipe IDs that weren't in the candidate list, and never decides allergen safety.
- Full MILP is likely overkill at 795 recipes with no cook times or (opt-in only) calorie targets; a greedy/beam search with a scoring function (variety, ingredient overlap, preference score, label fit) gives the same "feasible by construction" guarantee and is easier to make "swap just this one" fast. MILP becomes worth it only if Otto adds budget or nutrient targets.
- LLM-written new recipes should be reserved for gaps (no feasible catalogue recipe), then run through the same canonical-ingredient + allergen check as every other recipe before entering the plan.

### Gaps
- No study found evaluating current (2026) GPT-5-class models for allergen errors in meal plans; the main allergen figure (7.1%) is from January 2023 ChatGPT.
- Full MILP formulation and allergen results of the medRxiv hybrid preprint could not be read (host blocked).

## 3. Making plans practical: ingredient reuse, leftovers, batch prep, time, household, variety, seasonality/budget

### Takeaway
Practicality features that real apps ship are: leftovers as a plan item linked to a cooked recipe (and excluded from the shopping list), pantry/use-by awareness, servings scaling, and variety limits. Ingredient-overlap optimisation is often claimed but rarely documented.

### Cited Findings
- Plan to Eat: "Plan as Leftover" creates a leftover copy below the recipe that you drag to any date/mealtime — [Plan to Eat help](https://learn.plantoeat.com/doc/adding-leftovers-to-the-meal-planner)
- Member Kitchens: reuse a batch across the week (e.g. Monday lasagna → Wednesday lunch); leftovers automatically excluded from the shopping list — [Member Kitchens update](https://memberkitchens.com/updates/new-feature-plan-meals-around-leftovers-with-member-kitchens); [docs](https://docs.memberkitchens.com/en/articles/15461036-leftovers-and-prep-sessions)
- MealPlanned (UK): plans leftovers in so tonight's dinner covers tomorrow's lunch; one combined shopping list — [AlternativeTo](https://alternativeto.net/software/mealplanned/about/)
- MealEase: "Leftovers AI" turns cooked meals into next-day lunches or new dinners — [Indie Hackers](https://www.indiehackers.com/product/mealease-ai)
- BigOven "Use Up Leftovers" suggests recipes from ingredients on hand (pantry matching rather than scheduled reuse) — [MobileSyrup](https://mobilesyrup.com/2019/10/20/plan-your-next-meal-community-bigoven/)
- Samsung Food prioritises Food List items nearing use-by — [Samsung Newsroom](https://news.samsung.com/us/upgraded-samsung-food-raises-bar-for-food-experiences-ifa-2024/)
- Family guide advice: plan only 5–7 dinners a week to leave room for leftovers and takeout — [Nori blog](https://heynori.com/blog/family-operations-system/ai-meal-planning-families-guide)
- Variety in optimisation: ingredient-repetition constraints and Jaccard similarity between meals — [Comillas thesis](https://repositorio.comillas.edu/jspui/bitstream/11531/88809/1/TFG-ArduraCarnicero%2cElena.pdf); per-meal ingredient use bounded 0–2 in a notebook model — [Hoshino notebook](https://nbviewer.jupyter.org/github/richardhoshino/ProblemSolving/blob/master/Meal%20Planning.ipynb)
- Grocery-list merge pitfalls such as "chicken stock" vs "chicken broth" listed separately — [Macaron blog](https://macaron.im/en/blog/meal-planner-and-grocery-list)

### Inferences
- Otto's free per-day list fits leftovers naturally: a "Leftovers: <recipe>" item linked to the source recipe, zero shopping-list contribution, servings deducted from the cook day.
- Ingredient reuse should be a soft score over canonical ingredient keys (Otto already canonicalises to usdaTable keys) — e.g. reward perishable ingredients (herbs, cream, half a cabbage) used twice in a week; this directly shrinks the list and waste.
- Without cook times, "weekday vs weekend" and "something in 30 minutes" can't be honoured reliably; adding a `total_minutes` (even estimated, flagged) to the catalogue is a prerequisite.

### Gaps
- No quantitative evidence found on how much ingredient-overlap optimisation shrinks shopping lists or waste.
- No sources on handling different eaters in one household (e.g. one portion vegetarian) beyond Ollie's anecdote.
- Seasonal/budget planning: only the nonprofit cost-minimising IP paper; no consumer-app evidence found.

## 4. Personalisation signals and cold start; snacks and breakfast; conversational edits; health/ethics

### Takeaway
Explicit controls (favourite/block, diet, allergies, dislikes) plus implicit signals (what was kept vs swapped, cart edits, ratings, cooked history) drive personalisation in shipping products; cold start is handled with content features, not collaborative filtering. Calorie-first design carries documented eating-disorder risk, so numbers should be opt-in.

### Cited Findings
**Signals and cold start**
- Eat This Much uses favourite and block foods as primary preference controls — [Eat This Much Tutorial #3](https://blog.eatthismuch.com/eat-this-much-tutorial-3-getting-meals-you-like-part-1-how-to-regenerate-meals-favorite-and-block-foods/)
- HelloFresh ranks menu by past choices; employee posts cite cart add/remove, stated tastes, choices and high ratings as signals, with customers keeping more recommended meals instead of swapping — [HelloFresh newsroom](https://hellofreshgroup.com/de/newsroom/stories/how-tech-and-big-data-enable-us-to-personalize-the-meal-kit-experience); [LinkedIn (unverified)](https://de.linkedin.com/in/mark-fenderov)
- Cold start: content-based recipe embeddings (Gousto); ensemble topic modelling inferring preferences implicitly outperformed a content baseline in a 48-participant study — [Gousto](https://medium.com/gousto-engineering-techbrunch/gousto-r-series-vol-2-tackling-the-cold-start-problem-in-recipe-recommendation-engine-af92a434805f); [Khan et al., JIIS](https://link.springer.com/content/pdf/10.1007/s10844-021-00639-8.pdf)

**Snacks and breakfast**
- Lifesum premium plans include four pre-planned recipes per day (i.e. snacks/breakfasts are recipes there) — [Active.com review](https://www.active.com/nutrition/articles/lifesum-review)
- Eat This Much plans and swaps at the level of individual foods as well as meals (so snacks can be a single food item) — [Eat This Much how-to](https://www.eatthismuch.com/how-to/)
- Lifesum allows swapping to eat the same meal each day (repeat breakfast is an accepted pattern) — [AppsHunter Lifesum](https://appshunter.io/ios/app/286906691/reviews/5)

**Conversation**
- LAPPI: LLM maps natural language into a solver-ready problem rather than solving it — [arXiv 2512.14138](https://arxiv.org/pdf/2512.14138)
- Niszczota study ran no follow-up exchanges, so multi-turn editing quality of LLM planners is untested there — [News-Medical](https://www.news-medical.net/news/20230515/Robo-diets-can-ChatGPT-formulate-safe-dietary-advice.aspx)

**Health and ethics**
- 73.1% of MyFitnessPal users with eating disorders said the app contributed at least somewhat to their ED (retrospective self-report; not causal); weight/shape-motivated trackers reported more symptoms — [Frontiers/BJPsych-cited material via search](https://pmc.ncbi.nlm.nih.gov/articles/PMC8485346/table/tab03)
- Design suggestions (Eikey 2021, BJPsych Open): involve people with ED lived experience in design, replace purely numeric tracking with quicker non-numeric methods, avoid prompts pushing long-term consistent logging — [PMC8485346](https://pmc.ncbi.nlm.nih.gov/articles/PMC8485346/table/tab03)
- Expert evaluation of 10 free weight-loss apps: some passively allow, others actively encourage drastic weight loss through design — [Frontiers in Computer Science 2023](https://public-pages-files-2025.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2023.1215588/xml)
- 2025 study: perfectionism strongly predicted ED tendencies among calorie-tracking app users (β = 0.62; small Indonesian sample) — [Jurnal Psikologi UGM](https://jurnal.ugm.ac.id/jpsi/article/view/105333)
- Charity calls for ED screening at sign-up and regular check-ins — [Tyla](https://tyla.com/health/calorie-counting-apps-impact-eating-disorders-354995-20230403)
- LLM plans can contain forbidden allergens (7.1% in 2023 test) — [PubMed 37269717](https://pubmed.ncbi.nlm.nih.gov/37269717/)

### Inferences
**Recommended approach for Otto ("plan my week" / "plan my day")**
1. **Interpret (LLM, structured output):** turn the utterance + profile into a typed `PlanRequest` — date range, which labels to fill (default breakfast/lunch/dinner; snacks only if user has used them or asks), servings, per-day overrides ("Tuesday vegetarian", "Friday eating out"), max minutes (once cook times exist), "fewer dishes" → leftovers allowed / reuse weight up, exclusions.
2. **Filter (code, authoritative):** allergens, diet, dislikes, blocked recipes, label fit (breakfast-suitable tags). Nothing the LLM says can loosen this.
3. **Assemble (deterministic):** greedy/beam selection from catalogue + user recipes scoring preference (favourites, ratings, cooked history, past keeps vs swaps), variety (no same recipe within N days, cap protein/cuisine repeats), ingredient reuse of perishables, leftovers for lunch after a 4+ serving dinner. Same seed → same plan; "regenerate" changes the seed.
4. **Explain (LLM):** short reasons ("uses the rest of the coriander from Monday"), only over chosen items.
5. **Gap fill (LLM, rare):** if a slot has zero feasible candidates, generate a recipe, canonicalise ingredients, run the same allergen check, mark as AI-written (ADR-0014 image rules apply).
6. **Edit primitives** the conversation maps onto: `swap(item)`, `regenerate(day|week)`, `add(day,label,recipe|text)`, `remove(item)`, `move(item, day)`, `mark_leftovers(item, from)`, `set_day_constraint(day, {...})`. "Make Tuesday vegetarian" = set_day_constraint + regenerate(Tuesday) keeping locked items; "fewer dishes" = raise reuse/leftover weight + regenerate(week); "something in 30 minutes" = constraint on the referenced item + swap. Every edit returns a diff the user can undo; undos and swaps are logged as implicit negative feedback.
7. **Snacks/breakfast:** allow text-only "pantry items" (e.g. "Greek yoghurt + berries", "apple") as plan items with no recipe and no allergen guarantee beyond a keyword check; keep breakfast repeatable by default (users accept same breakfast daily).
8. **Safety:** calories/macros hidden by default and opt-in; no weight-loss targets forced; no medical claims ("good for diabetes"); allergy wording "filtered from your allergies — always check labels".

### Gaps
- No published evaluation found of multi-turn conversational meal-plan editing (accuracy of mapping utterances to edits).
- No evidence quantifying swaps/undos as implicit feedback in meal planners specifically (HelloFresh claim is from an employee post).
- No authoritative guidance found on snack handling across apps beyond Lifesum/Eat This Much patterns.
