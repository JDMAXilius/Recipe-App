# Screen references: redesign decisions

> Written 2026-11-04. Figma: Otto file `r9QxxN5qDQXjW473H7LKgM`, page **"Screen references — redesign decisions"** (15 sections). Each section shows Otto's v3 screen first, then the reference apps' real screens, then the takeaways. Concept options for Today, the Recipes hub and Create a recipe are on page **"Concepts — redesign options"**, and a first full draft of the reworked app (100 screens in four areas) is on page **"v4 · First draft (rework)"**. Reference screens come from the study file `iEA3Aeu3ApmJdJabmAudXm` (Mobbin captures) unless marked Mobbin.
> **Status: input for design, not approved.** The decisions at the end of each section are Juan's.
> ChatGPT package (images + one ticket per screen): `Otto_Screen_References.zip`.

## How to use this as a ticket (for ChatGPT or a designer)
Pick one section. Read the decision and look at the Figma section (or the matching zip folder), then propose 2 versions of the Otto screen that answer the open decisions. Use Otto's design system (`docs/reference/DESIGN_SYSTEM.md`: cream `#FAF4EA`, ink `#2A211B`, terracotta `#AE4A26`, Lora titles, SF Pro body, 44 pt targets, the otter mascot) and Apple's rules (`docs/flow-maps/research/01_APPLE_AND_INDUSTRY_RULES.md`). Say which reference patterns you used and why.

## Contents
1. Questionnaire: personalization questions
2. Onboarding: show value before the account and paywall
3. Today
4. Recipes hub: Discover + Cookbook in one tab
5. Create a recipe
6. Recipe detail
7. Weekly meal plan
8. Shopping list
9. Cook mode
10. Paywall and purchase outcomes
11. Talking to the AI
12. Sign up / sign in
13. Account & settings
14. System states
15. Search

## 1. Questionnaire: personalization questions

**Decision:** How many questions, which ones, and how does each answer visibly pay off before the plan is built?

**Otto today (v3 frames):** Who is Otto cooking for?, How do you eat?, Any allergies?, Anything Otto should skip?, Weeknight time, What matters most?, Does this look good?.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| MyFitnessPal | Creating a meal plan | 2, 6, 10–16, 17, 19–21 | The closest match to Otto. Multi-select 'What are your goals?' (incl. 'Meal prep every week'), a photo grid for 'Which diet plan do you prefer?', 'Allergies' checklist, 'Restrictions and dislikes' as search + chips ('Common dislikes'), thumbs up/down for 'Are there any cuisines you really love—or really don't love?', a hearted photo grid for 'Which of these cooked veggies would you like in your meal plans?', Like/Dislike cards for 'Rate a few recipes so we can learn more about what you like', steppers for Lunch/Dinner in 'How many people would you like each meal to feed?', and sliders for 'How important are these factors to your meal plans?' (Delicious, Easy, Quick, Budget-friendly). | study `37:598` |
| Cherrypick | Onboarding | 6–7, 9–13, 14–17, 18–19 | Meal-planner questionnaire. Single-select 'What's most important to you when planning meals?' is answered with a review card ('Keeping it healthy' → 5-star quote). Then Adults/Children/Infants steppers in 'Who are you planning for?', an icon grid for 'Are there any dietary requirements?' followed by 'Would you like to only see recipes matching these diets?', 'Tell us your dislikes for more tailored meal suggestions' with an ingredient chip sheet plus an 'Allergies?' warning, and a Tinder-style swipe 'Do these meals make your tastebuds tingle?' | study `28:1830` |
| Cal AI | Onboarding | 3–20, 29–31 | The long, single-question-per-screen standard. Each screen has a progress bar, one big question and a 'This will be used to calibrate your custom plan.' subline. Every few questions a payoff card appears: 'Cal AI creates long-term results' chart, 'Gaining 6 kg is a realistic target. It's not hard at all!', 'You have great potential to crush your goal'. It ends 'Time to generate your custom plan!' → '18% We're setting everything up for you' → 'Congratulations your custom plan is ready!' | study `41:105` |
| Yazio | Onboarding | 4–12, 13–14 | Short and warm. 'What's your main goal?', then 'Pick the name that suits you best' and the mascot replies 'Nice to meet you, Alex!'. A multi-select 'Is there anything else you want to achieve?' (incl. 'Learn how to cook healthily') leads to a full-screen 'You're crushing it already!' reward, a 'Say hello to simple, sustainable weight loss!' chart, and 'Let's get your fit just right!' as a section divider. | study `28:2691` |
| MacroFactor | Onboarding | 2, 11–12, 15–17, 21 | A chaptered questionnaire. A 'LET'S GET STARTED / Your personalized program awaits' checklist (Basics → Goal → Program) comes back ticked between chapters. Questions explain themselves inline ('Your weight history can impact your current metabolism'). The estimate is shown as a chat: '2720 kcal' with reply chips 'Got it' / 'How did you calculate that?' / 'Is 2720 kcal right then?' | study `43:13` |
| BitePal | Onboarding | 3–6, 12–15, 17–19 | Mascot-led personality setup. 'What is your main goal?', then a multi-select 'Any additional goals?' with a 'No additional goals' escape. You name the raccoon ('Name your raccoon') and pick its voice for 'How should I talk to you?' (Cheerleader / Gentle & kind / Straight talker / Mindful guide), and it replies in its chosen voice ('You showed up again today. That's the whole thing.'). It finishes with 'When would you like to receive reminders' and 'Now let's talk about your eating habits'. | study `33:13` |
| Lifesum | Taking a meal plan test | 5–10, 11, 16 | An optional quiz inside the app ('Need recommendations? … TAKE THE TEST') with an explicit counter ('PLAN TEST · QUESTION 1 OF 7'): 'What is your food preference?', 'Do you have any specific dietary requirement?', 'Do you do your own cooking?' ('Yes, I do cause I have to' / 'Yes, and I enjoy it'). It lands on a concrete plan, 'Keto Maintain … START PLAN', with 'HERE'S WHAT YOU GET' (3 Week Plan, 4 recipes per day, Shopping list). | study `45:2145` |
| Duolingo | Onboarding | 3–5, 12–16, 18–20, 23–24 | The mascot asks every question in a speech bubble. Expectations are set up front: 'Just 7 quick questions before we start your first lesson!'. Each answer gets a reaction ('Okay, we'll start fresh!', 'Let's ace those tests!', 'That's 50 words in your first week!'), and the commitment pick ('What's your daily learning goal?' 5/10/15/20 min, button 'I'M COMMITTED') leads to 'Here's what you can achieve in 3 months!' | study `46:121` |

**Patterns across apps**
- One question per screen with a progress bar. The best ones also say how many questions there are ('Just 7 quick questions', 'QUESTION 1 OF 7').
- Answer, then react: a mascot line, review card or stat after an answer ('Nice to meet you, Alex!', 'You're crushing it already!', Cherrypick's review card after a priority pick) keeps a long quiz feeling short.
- Food apps ask about taste with pictures, not labels: photo grids (MFP veggies, diet types), swipe cards (Cherrypick), Like/Dislike recipe cards (MFP), cuisine thumbs.
- Dislikes and allergies are kept separate. Dislikes are a search + common-chips sheet (MFP, Cherrypick); allergies get a warning ('Always double-check the product details').
- Explaining why you're asking ('This will be used to calibrate your custom plan', 'Your weight history can impact…') and breaking the quiz into chapters (MacroFactor Basics → Goal → Program) make it easier to finish.

**Options for Otto**
- Keep Otto's 7 questions but say the count up front ('7 quick questions, then Otto plans your week'). Otto's progress bar currently reads 'QUESTION 1 OF 3', which needs reconciling with 7 screens.
- Swap one text question for a taste signal with pictures: 3–4 Like/Dislike dish cards or a cuisine thumbs list (MFP 17–18, 13–14). That data improves the first week more than another label pick.
- Make 'Anything Otto should skip?' a search + 'Common dislikes' chip sheet (MFP 11–12, Cherrypick 15–16), and keep 'Any allergies?' a separate, safety-worded screen.
- Give Otto a one-line reaction after key answers (household size, weeknight time) that echoes the answer back, the way Duolingo and Yazio do, e.g. 'Dinners for 3, ready in about 30 minutes.'
- For 'What matters most?' consider MFP-style importance sliders or a single pick with a payoff card (Cherrypick 6–7) rather than a plain list.

**Juan's decisions**
- [ ] Number of questions: stay at ~7, or cut to 3–4 and ask the rest later inside the app (like Lifesum's optional 'TAKE THE TEST')?
- [ ] Should the otter mascot ask the questions (Duolingo, BitePal style) or stay decorative?
- [ ] Swipe or Like/Dislike dish cards in onboarding: worth the extra screens and image cost?
- [ ] Does 'Does this look good?' (summary/confirm) earn its place, or should edits happen directly on the first-week reveal?

## 2. Onboarding: show value before the account and paywall

**Decision:** What does the user see and get (a real plan, a demo, a promise) before Otto asks for an account and then money, and in what order?

**Otto today (v3 frames):** Welcome to Otto, Onboarding 1, Otto’s building your week, Otto's first week.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Cal AI | Generating a custom plan | 3, 7–11 | Social proof ('Join over 10 million people like you'), then 'Time to generate your custom plan!' → '100% We're setting everything up for you' with a ticking 'Daily recommendation for' checklist → 'Goal: maintain your current weight … Your daily recommendation … You can edit this anytime' plus 'Why Cal AI?' Without/With lists. Only then 'Save your progress' (Sign in with Apple). | study `41:289` |
| Noom | Completing a personalized plan set | 5–8, 10–13 | A theatrical build: 'Analyzing Demographic Profile..' → 'Cross-checking with User Database..' → 'Predicting Future Results.' with category bars filling to 100%, and a question popping up mid-build. Then 'Based on your answers, Sam…' / 'we've created a personalized plan', a forecast chart ('WE PREDICT YOU'LL BE 57 kg by 31 Aug'), and 'Start Your 7-Day Trial' with 'PERSONALIZED PLAN RESERVED … EXPIRES IN 14:59'. | study `35:31` |
| Lifesum | Onboarding | 3–5, 13, 16–17 | Account offered on screen 3 but skippable. Value carousel ('Nutrition is your superpower for change', 'Millions are choosing steady progress'), questions with an interstitial 'Great—we've got your starting point. Now we can make your plan smarter and more personal.', a 'BUILD MY PLAN' button, '100% Finalizing your plan', then 'Your personalized plan is ready / Create an account to begin your progress' as the sign-up screen. | study `45:13` |
| Cherrypick | Onboarding | 1–4, 18–22 | Promise carousel ('Your weekly meals and groceries, sorted in minutes.', big 'plan' / 'cook' type). After a swipe-to-rate taste test comes 'Your meal matches are ready! Create an account to save your answers and your personalised recommendations' (with Skip), then 'Meal-plan and shop in under 2 mins!' (3 steps, 'Start 2 min shop'), and you land on 'Plan it' with 'Top picks for you' and a 'Your Pro trial ends in 7 days' banner. | study `28:1830` |
| MyFitnessPal | Creating a meal plan | 7, 22–28 | Plan reveal followed by an upsell. 'High protein' plan card ('Select plan'), 'Calculating traits...', 'MyFitnessPal Meal Planner could help you save an average of 40 hours a year', 'We'll also take into account everything else you've mentioned…' (Macros / Recipe variety 'Chinese and Mexican' / No more busywork), an Instacart offer, then 'Hungry yet? Your meal plan is ready. Get Premium+ and dig in today.' → '$149.98 Billed Annually'. | study `37:598` |
| Headspace | Onboarding | 2–4, 11–16, 19, 23 | The opposite order. Breathing demo ('Breathe in' / 'Breathe out'), then account creation right away ('Welcome to Headspace … Create an account'), ONE question ('What's on your mind? Choose one option for now. You can explore others later.'), 'Let's create your meditation practice.', the paywall ('Try Headspace … Start your free trial'), and only afterwards the value: 'Let's start with a short exercise to help you get settled. Begin'. | study `28:8159` |
| Tiimo | Onboarding | 2–3, 8–13, 15 | Account first ('Sign in with Apple' / 'Sign up with email … to keep your data safe'), two questions ('What's your biggest need right now?'), a social-proof interstitial ('You're part of more than 500,000 happy Tiimo users'), then a mid-onboarding paywall ('Carefully crafted for neurodivergent people … Start 7 days free trial'). Calendar import ('Import your calendar for a quick start') comes after the paywall. | study `42:13` |
| Lifesum | Starting a recommended meal plan | 1–3, 5–9 | How a chosen plan turns into a first day. Plan page ('Keto Maintain … START PLAN', 'HERE'S WHAT YOU GET'), a 'Your focus' summary with 'DOS AND DON'TS', then a 3-card coach-mark over the real first meal ('You'll find your day's meals under the Today tab…', '…simply find it and Swap it!', 'Import an entire meal's ingredients straight to your Shopping List') before landing on Today. | study `45:2823` |
| Crouton | Onboarding | 1–3 | A minimal baseline: 'Hello, Welcome / Crouton is a simple tool for storing all of your favourite recipes in one place. Get Started', then straight into an empty 'All Recipes' with an 'Add More Recipes' card and an empty 'Meal Plan' (Monday… 'No recipes'). No questions, account or paywall in the flow. | study `28:3978` |

**Patterns across apps**
- Questions → 'building' interstitial → plan reveal → account, with the reveal used as the reason to sign up ('Your personalized plan is ready / Create an account to begin', 'Your meal matches are ready! Create an account to save…', 'Save your progress').
- The build moment is staged on purpose: percent counters and ticking checklists (Cal AI, Lifesum '100% Finalizing your plan'), or named analysis steps (Noom). It makes the result feel earned.
- The paywall comes straight after the reveal and points back to it ('Hungry yet? Your meal plan is ready. Get Premium+', Noom's 'PERSONALIZED PLAN RESERVED … EXPIRES IN 14:59').
- Account-first apps (Headspace, Tiimo, Bevel) give the value after signup/paywall ('Let's start with a short exercise'); recipe/meal apps lead with the plan.
- The reveal is concrete and editable ('You can edit this anytime', 'Swap any meal later'). Food apps show real dishes, not just numbers.

**Options for Otto**
- Otto already follows the Cal AI / Lifesum / Cherrypick order (questions → 'Otto’s building your week' → 'Otto's got your week' with real dishes → 'Save my week'). Keep it, and make 'Save my week' the account trigger, worded like Lifesum's 'Create an account to begin'.
- Stage 'Otto’s building your week' with steps that echo the user's answers (e.g. 'Skipping peanuts ✓', 'Dinners under 30 min ✓', 'Sizing for 3 ✓'), as in the Cal AI checklist and Noom bars, instead of a plain spinner.
- On 'Otto's first week', add a short 'We took into account…' block (MFP 24): 3 rows tying the plan to the household, allergies and weeknight time already in the header ('BUILT FOR 3 · EVERYTHING · NO PEANUTS').
- If the paywall follows, point it back to the week ('Your week is ready. Start your free trial to cook it'), and consider letting users see Monday's recipe before paying, like Cherrypick showing 'Top picks for you' with a trial banner.
- After purchase, use a Lifesum-style 3-step coach-mark on the real Today/Plan (Track, Swap, add to Shopping) instead of more intro screens.

**Juan's decisions**
- [ ] Order after the reveal: account → paywall (Cal AI, Lifesum) or paywall → account, and can the user skip the account entirely (Cherrypick has 'Skip')?
- [ ] Is the paywall hard or soft? Cherrypick and Lifesum let you in with a trial banner; Noom/MFP gate the plan.
- [ ] Does 'Welcome to Otto' + 'Onboarding 1' need a promise carousel (Cherrypick 'plan'/'cook', Lifesum), or should it go straight to question 1?
- [ ] Use urgency like Noom's 15-minute 'plan reserved' timer, or stay calm and on-brand?

## 3. Today

**Decision:** What leads Today: tonight's dinner as the one task, a short checklist of today's kitchen to-dos, or Otto's AI suggestions, and how much of each fits above the fold?

**Otto today (v3 frames):** Today.

v3 Today (68:358): 'Good evening, chef' greeting, hero card 'TONIGHT · 35 MIN Teriyaki chicken casserole' with 'Start cooking', one Otto nudge card 'Otto says defrost the salmon / It's on for tomorrow', then a 'Coming up' row (Wed Honey salmon, Thu Shakshuka). No checklist, no done-state, no way to ask Otto from here except the tab-bar circle.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Headspace | Today | 1–4 | Today is a vertical timeline by part of day ('Start your day', 'Your afternoon lift', 'At night'); each item is a card with a radio dot that turns into a green check when done, under a 'Good Afternoon, James' greeting and a featured program card. | study `28:8291` |
| Noom | Home | 1, 17 | 'Today's plan' checklist under a calorie bar ('Continue learning · Prepare your scale', 'Log your meals', 'Weigh in', 'Start a Challenge'), and further down a swipeable 'New for you today' row with a 'Next in 9h' refresh timer (e.g. 'Sweet potato burgers recipe'). | study `35:427` |
| Noom | Hiding today's insights | 1–3 | AI coach card 'Insights from Welli BETA' with a suggestion chip 'Make my morning snack better' and 'Great snack choice! I have a suggestion for you… Interested?', thumbs up/down, and a ••• menu 'Hide for today' → toast 'Insights are hidden for today.' | study `35:741` |
| Gentler Streak | Today's recommendations | 1–3 | Home headline is the advice itself ('Be Mindful With Your Approach') with 'Today's Recommendations' chips (Rest, Active Recovery); tapping opens 'Go Gentler — Today calls for a rest day' with swipeable options and a commit button 'Today I Choose Rest'. | study `32:95` |
| Bevel | Home | 3–6 | Data rings (Strain, Recovery, Sleep) followed by short AI-written insight cards ('Your body needs a reset — Recovery is 58% after just 4h 35m of Sleep…', 'Efficient strength start'), with a persistent 'Ask Bevel anything' input pinned above the tab bar. | study `36:165` |
| Flo | Today | 1–3 | Big status hero ('Period in 14 days', 'Log period') then a horizontal 'My daily insights · Today' row of small story-like cards personalised to cycle day, with a '+' card to log first. | study `28:299` |
| Tiimo | Reviewing today's task | 1–6 | Evening 'Review today' card on the day view → 'This happened — You completed (2) tasks' with confetti → 'Remaining tasks… Move 1 to tomorrow?' ('Move to tomorrow (1)') → 'Review done — Everything is handled for today. Time to rest and recharge.' | study `42:1075` |
| Tiimo | AI co-planner start | — | AI screen asks 'What's the plan today?' with tappable prompt chips ('Create a morning routine', 'Add a task', 'What do I have time for?') above an 'Ask anything' field with 'Speak'. | [Mobbin](https://mobbin.com/screens/ed164b6c-6952-48e5-b56b-32a747e08c73) |
| Wabi | Home | — | Meal-plan home: 'Hello there! Ready to cook something delicious?' + 'Plan New Week' button, 'This Week's Meals' photo carousel ('MONDAY · BREAKFAST Mango turmeric smoothie bowl'), then 'Suggested Recipes' with 'Get More'. | [Mobbin](https://mobbin.com/screens/519dfbd2-73c3-47cb-a3f6-4684800d0c05) |

**Patterns across apps**
- Today = a short ordered checklist with visible done-state (Headspace dots→checks, Noom 'Today's plan'), not a feed.
- AI shows up as one small, dismissible card with a concrete suggestion and feedback (Noom Welli 'Hide for today', thumbs), or as an always-there input bar (Bevel 'Ask Bevel anything').
- Recommendations are phrased as a single decision the user can commit to ('Today I Choose Rest'), not a list of options.
- Fresh personalised content is rationed and time-boxed ('New for you today · Next in 9h', Flo 'My daily insights · Today').
- The day has an ending: an evening review closes the loop and rolls leftovers forward (Tiimo 'Move 1 to tomorrow?').

**Options for Otto**
- Keep tonight's dinner as the hero, but add a 2–4 item 'Today' checklist under it (defrost salmon, buy limes, prep rice at 5) with Headspace-style tick-off, so Otto's nudge becomes a task, not just a message.
- Turn 'Otto says…' into a Noom-style Otto card: one concrete suggestion with an action ('Swap to 20-min version', 'Add to list') plus 'Not today' to hide it for the day.
- Add prompt chips that open Otto chat pre-filled (Tiimo pattern): 'What can I make with what's left?', 'Make tonight faster', 'Swap tomorrow' — keeps the tab-bar Otto circle but gives Today an entry.
- Ration 'New from Otto today' to 1–3 recipe ideas with a refresh time, below 'Coming up', rather than an endless Discover-style feed.
- After dinner, flip Today into a done state ('Dinner, done') with a one-tap 'Move anything to tomorrow?' close-out.

**Juan's decisions**
- [ ] Is Today's first job 'cook tonight' (hero) or 'get through today's to-dos' (checklist first)?
- [ ] Where do AI suggestions live: a card inside Today, chips into chat, or a persistent 'Ask Otto' bar like Bevel?
- [ ] Can Otto's suggestions change the plan directly (swap tomorrow's dinner) or only propose and wait for a tap?
- [ ] How many AI items per day before it feels like noise — one card, or a 'New for you today' row?
- [ ] Does Today show anything when no dinner is planned (empty state = 'Let Otto pick tonight')?

## 4. Recipes hub: Discover + Cookbook in one tab

**Decision:** Should Discover (new recipes) and Cookbook (saved/mine) share one Recipes tab behind an inner switch, and what does each side and its empty state show?

**Otto today (v3 frames):** Discover, Cookbook, Search + filters.

v3 has them apart: tab bar Home / Plan / Cookbook / Account. Discover sits under Home, with a search field 'What are we cooking today?', an 'OTTO'S PICK' Shakshuka hero, category tiles (Beef, Chicken, Dessert, Pasta) and a calorie-tagged grid. Cookbook is its own tab with chips 'All / Saved / My recipes / Cooked'. Search reuses the Discover layout with query 'quick dinners'.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Yazio | Recipes | 2–8 | Recipes tab with underline tabs 'Discover / My Favorites'. Discover stacks 'Popular Categories', 'Recipes by Calorie Range', 'Pick Your Meal', 'Pick Your Diet', 'Around the World' (e.g. 'Mexican Meals 58 recipes') and 'Our Favorites'. Empty My Favorites: 'No favorite recipes yet? Browse to find new inspiration!' above a Breakfast/Lunch/Dinner list. Filled: starred photo cards. | study `28:3635` |
| Yazio | Filtering recipes | 2–7 | Full-screen 'Filter' sheet: 'Popular Filters' photo tiles, a 'Favorites Only' toggle, an 'Energy Value' slider and Meals / Preparation Method / Diets chips. The CTA shows a live count ('See 921 Recipes' → 'See 681 Recipes' → 'See 94 Recipes'). Results show removable chips 'Low Carb ×', 'Quickly Prepared ×'. | study `28:3543` |
| Lifesum | Recipes | 2–5 | One scrolling feed with no inner tabs: a 'Find recipes' search with filter icon, a 'WHAT'S HOT' carousel ('Summer Recipes', 'Smoothie'), meal rows ('BREAKFAST', 'SNACK') with 'See all', and a 'FAVORITES' shelf in the same feed. Every card has a heart. | study `45:2429` |
| Cherrypick | Saved | 1–4 | Pills at the top of 'Plan it' ('Search', 'Saved', 'Created by you') filter the same page in place, with an × to clear. Empty Saved: 'Your saved recipes — Save recipes by tapping the bookmark icon. Your saved recipes will appear here.' Filled: author cards ('By Meliz Berg'), rating and time, and 'Add to shop'. | study `28:2324` |
| Cherrypick | Created by you | 1–3 | The same pill row with 'Created by you' and 'Loved by you'. Empty state: 'Got some go-to meals you want to shop quickly? Easily add family favourites to your weekly shop by creating recipes in your Cookbook.' with a pinned 'Create a recipe' button. Filled cards are tagged 'Added by you'. | study `28:2076` |
| Crouton | Recipes | 2–6 | Personal library 'All Recipes': a photo grid with servings and time, plus search 'Recipes, Ingredients and More'. The root 'Collections' page shows Folders ('All Recipes 9 recipes', 'Baking', 'Dessert', 'Dinner', 'Unsorted 7 recipes') and Tags ('High-Protein', 'Main dish', 'Meal Prep'). Discover is a separate tab of RSS feeds (28:4454: 'Add RSS feeds to discover new recipes'). | study `28:4536` |
| MacroFactor | Sorting recipes | 1–3 | Library pane with a 'Recipes / Foods' pill switch, a '+' and a sort control 'Created'. The sort sheet offers 'A-Z', 'Z-A', 'Created — Starts with most recently created.' and 'Modified — Starts with most recently modified.' A 'Filter recipes' field sits at the bottom next to 'Log Foods'. Dense list rows show macros. | study `43:1889` |
| Noom | Saved recipes | 1–3 | Saved is a bookmark toggle beside 'Search by ingredient' and the filter icon, on the same Recipes grid. With filters and no match: 'We couldn't find any matching recipes. Try removing one or more of your selected filters' followed by 'Other recipes you might like'. With saved items, it shows the saved ones first, then 'Other recipes you might like'. | study `35:507` |
| MyFitnessPal | Saved Recipes | 1–4 | Curated Recipes page ('Immune Support', 'Pantry Staples', 'Post-Workout' rows with 'View More'). Saved sits behind a bookmark icon in the nav bar and pushes 'Saved Recipes'. Empty: 'No Saved Recipes — Tap the bookmark icon to save recipes and keep them all in one place here.' A skeleton grid shows while loading. | study `37:2078` |

**Patterns across apps**
- Two-way switch at the top of one Recipes tab: Yazio 'Discover | My Favorites' underline tabs, MacroFactor 'Recipes | Foods' pills.
- Saved as a filter, not a place: Cherrypick pills ('Saved', 'Created by you', 'Loved by you'), Noom's bookmark toggle, Yazio's 'Favorites Only' switch, Lifesum's FAVORITES shelf in the feed.
- Discover is editorial shelves: category tiles, calorie or diet rails, themed collections with counts ('58 recipes'), and 'See all' / 'View More'.
- Filters live in a full sheet with a live result count ('See 94 Recipes'), then show as removable chips on the results.
- Empty saved states teach the gesture ('tap the bookmark icon') or pivot to a CTA ('Create a recipe') or to suggestions ('Other recipes you might like').

**Options for Otto**
- Option A, the founder's idea, closest to Yazio: Recipes tab with a segmented 'Discover | Cookbook' at the top. Keep v3's Cookbook chips ('All / Saved / My recipes / Cooked') inside the Cookbook side, and share one search field across both sides.
- Option B, closest to Cherrypick and Noom: one feed where Saved / My recipes / Cooked are filter pills over the same grid. Fewer layers, but 'Cookbook' stops being a place you own.
- Cookbook empty state: pair the save gesture with a 'Bring in a recipe' CTA, as Cherrypick does with 'Create a recipe', so the first saved item can be your own.
- Move v3 'Search + filters' to Yazio's filter sheet: Favorites-only toggle, diet and time chips, and a live 'See N recipes' button. Removable chips on results. Noom-style 'Other recipes you might like' when nothing matches.
- If the Cookbook grows, offer Crouton-style collections or tags, and a MacroFactor-style sort ('Recently added / A-Z / Most cooked').

**Juan's decisions**
- [ ] Does Discover move out of Home into the Recipes tab, and what does Home/Today keep (Otto's Pick only)?
- [ ] Inner switch (Discover | Cookbook) or filter pills on one feed?
- [ ] Is 'Cooked' history part of the Cookbook or a separate journal (v3 also has 'Cooking journal')?
- [ ] Search scope: one search across Discover and Cookbook, or per side?
- [ ] Do folders and collections ship in v1, or only system chips (Saved / Mine / Cooked)?

## 5. Create a recipe

**Decision:** Should you add a recipe by picking an input method first, or from one box that takes anything (link, text, photo), with an editable review screen before saving?

**Otto today (v3 frames):** Bring in a recipe, Chat, start, Chat, answer, Camera, Import review, Editor.

'Bring in a recipe': a 2x2 grid ('Paste a link' Any site or video, 'Paste text' Otto tidies it up, 'Snap a photo' Card or cookbook, 'Write it myself' From scratch) plus a 'Nothing to bring in?' card with a 'Chat with Otto' button.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Yazio | Creating a recipe | 1, 2, 4, 6–9, 12 | All manual. It starts with a 'What would you like to create?' menu (Quick Add, New food with barcode, New meal, 'New recipe'), then a single form: photo, 'Recipe name', 'Number of servings', '+ Add ingredient', 'Instructions (optional)' '+ Add step'. Ingredients are picked from food-database search ('Frequent / Recent / Favorites', 'Created by me'). Steps are typed one at a time ('Step 1 Type your step here'). It ends on the recipe detail with 'Add to List' / 'Add to Diary'. Mobbin's copy of this flow is the same 12 screens, and there is no AI or import path. | study `28:3451` |
| MacroFactor | Adding a recipe (link) | 1, 3–4, 6, 9–10 | Asks 'How would you like to build your recipe?' with three radio cards: 'Build from scratch', 'Import from Link' (Import a recipe from the web or social media) and 'Import with AI'. Link screen: 'Which link would you like to import from?' (shows a 'MacroFactor pasted from Safari' toast), then 'Build your recipe' with matched ingredients and macros, then 'Preparation (optional)' with steps and 'Create & Add' / 'Create'. | study `43:333` |
| MacroFactor | Adding a recipe (AI) | 2–3, 6–8 | 'Import with AI' (a photo, text, or both). One screen takes a 'Photo of recipe' (0/3, Upload or camera) plus a free 'Description' box ('Describe recipe or add supporting details'), then 'Analyze'. That lands on the same 'Build your recipe' review (Chickpea Salad, ingredients with grams) and then 'Preparation (optional)'. | study `43:827` |
| Crouton | Importing a recipe (link) | 1–2, 4–8 | A '+' menu: 'Add Manually', 'From Link...', 'From Code...', then a 'Smart Import' group: 'From Camera...', 'From Image...', 'From Text...', 'From PDF'. A 'Recipe URL' alert opens an in-app browser with a 'Save Recipe' button. Next is an editable 'Add Recipe' review (ingredients with tappable quantities, 'Original Website' / 'Re-import'), then a 'Feed Available' prompt. The library shows a 'Website Available On your clipboard [Import]' banner. | study `28:4226` |
| Crouton | Importing a recipe (image) | 1–4 | Photo import with honest AI copy. 'Importing Photos...', then a card 'Importing / Locating recipe... AI is used to locate the recipe. Check the results to ensure the details are copied correctly', then the same editable 'Add Recipe' sheet (Servings, Prep/Cook Time, Ingredients with 'Add Ingredient' / 'Scan', Method). | study `28:4484` |
| Cherrypick | Creating a recipe (text input) | 1–2, 4, 6–7, 11–12 | One screen for every input: 'Recipes to hand?' 'Type your ingredients below, paste the URL link or take a photo of your cookbook and we'll match the ingredients for you', with tabs 'Use text / Use photo / Use link'. Then 'Identifying ingredients', a parsed list ('Click to edit any ingredients that look wrong', 'This looks correct'), 'Make your recipe shoppable for later' (pick a supermarket product per ingredient), and 'The finishing touches' (image, name, 'Paste multiple steps in one go'), 'Save my recipe'. | study `28:2338` |
| Bevel | Importing a recipe | 2–7 | 'Import recipe' in a small menu opens a bare paste field: 'Import your recipe / Write out or paste your recipe details', with 'Capture instead' / 'Import photo instead' as quiet secondary links. Then 'Importing recipe. Just a moment as we find your ingredients and create your recipe.', and a review screen (Caprese Salad, servings, kcal ring, ingredient list) with 'Redo' / 'Save'. | study `36:2125` |
| MyFitnessPal | Creating a recipe | 1–5, 7 | Empty state 'Mom's Meatloaf Isn't In The Database (Yet).' with 'Create a Recipe' / 'Discover Recipes'. The 'Add Recipe' form has an optional 'Bulk Import Ingredients' toggle that turns ingredients into one plain-text box. Then 'Matching Ingredients This shouldn't take long.', 'Do these matches look right?' (each line shows the original text it matched), and 'Save' / 'Save & Log it'. | study `37:2118` |
| Yazio | Logging a food (AI camera) | 2–5 | A photo-AI reference (this logs a meal, it does not save a recipe). 'Quick photo tips' first ('Fit the whole meal in the frame', 'Show each item clearly', 'Use good lighting'), then the camera ('Make sure your meal is well lit and fully within the frame', Photos / Flash), 'Analyzing...' with a scan line and skeleton, and 'Meal Summary' with 'Add or edit details' and 'Confirm and Track'. | study `28:2847` |

**Patterns across apps**
- Pick-a-method first: MacroFactor (3 radio cards then Next), Crouton (a 7-item menu), Yazio (a 5-item create menu). Simple to read, but it costs a decision before any value, and Yazio has no import at all.
- One box takes anything: Cherrypick ('Use text / Use photo / Use link' tabs on one screen) and Bevel (a paste field with 'Capture instead' / 'Import photo instead' as fallbacks) both lead with text and demote the other inputs.
- Every import path (MacroFactor, Crouton, MFP, Bevel, Cherrypick) lands on the same editable review screen; parsing is never trusted blindly ('Do these matches look right?', 'This looks correct', 'Redo / Save', 'Re-import').
- The waiting state says what is happening and admits it's AI: 'Matching Ingredients This shouldn't take long.', 'Just a moment as we find your ingredients', Crouton's 'AI is used to locate the recipe. Check the results…'.
- Zero-typing shortcuts: MacroFactor's 'pasted from Safari' toast and Crouton's 'Website Available On your clipboard [Import]' banner pick up a link the user already copied. Steps are optional or bulk ('Instructions (optional)', 'Paste multiple steps in one go').

**Options for Otto**
- Option A, one box: replace the 2x2 grid with a single 'Paste a link or recipe text' field that detects link vs text, with 'Snap a photo' and 'Write it myself' as secondary actions (Bevel/Cherrypick model). 'Chat with Otto' stays as the 'nothing to bring in' path.
- Option B, keep the grid but auto-fill: when the clipboard holds a URL, show a 'Link on your clipboard, bring it in?' card on top of the grid (Crouton/MacroFactor) so the most common case takes one tap.
- Make 'Import review' the single landing screen for link, text, photo and chat. Pick one consistent pair of actions (Bevel's 'Redo / Save' or MFP's 'Save' / 'Save & add to plan') and flag low-confidence lines like MFP's matched-to-original text.
- Steal the honest waiting copy ('Otto's reading the recipe… check the amounts after') and Yazio's 'Quick photo tips' before the first camera use.
- For 'Write it myself', copy Yazio's single-form shape (photo, name, servings, ingredients, optional steps) but add a bulk-paste mode for ingredients and steps (MFP's 'Bulk Import Ingredients', Cherrypick's 'Paste multiple steps in one go').

**Juan's decisions**
- [ ] One smart input box vs the 4-option grid: is speed for the common case (link) worth hiding the other options one level down?
- [ ] Where does AI 'create from scratch' live: in Bring in a recipe ('Chat with Otto') or as its own entry point on Recipes/Today?
- [ ] Does Otto map ingredients to a food database (MFP/MacroFactor matching, nutrition), or keep the parsed text as-is (Crouton) and skip match-confirmation?
- [ ] After saving, where does the recipe go: Cookbook only, or Cookbook plus 'Add to this week' (MFP 'Save & Log it', MacroFactor 'Create & Add', Yazio 'Add to Diary')?

## 6. Recipe detail

**Decision:** What sits above the fold on a recipe (hero, servings, ingredients, nutrition) and which one action leads: Start cooking, Add to the week, or Add to list?

**Otto today (v3 frames):** Recipe detail, Search + filters.

v3 Recipe detail (68:1051): kicker 'CHICKEN · JAPANESE', title 'Teriyaki Chicken Casserole', 'Ingredients' with a 'For 3' chip and metric amounts (135 ml soy sauce, 41 g brown sugar, 261 g chicken breasts, 414 g brown rice), a 'Nutrition · Estimate' block (450, 30g protein, 71g carbs, 4g fat) and one primary 'Start cooking'. No visible save, no 'Add to the week', no 'Add to list', no steps preview on the frame.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Recipe detail | 2–7 | The cleanest recipe page. Photo-title hero card, then a row with a green 'Start' plus round buttons for groceries and share, servings '12' and 'Prep 10 min' tiles, 'Ingredients' with a 'Scale' pill, numbered 'Method' cards with tappable temperatures ('350°F (175°C)' converts to '350°F → 176°C'), then 'Notes', 'Images', 'Nutrition 150 kcal' and 'Tags' ('High-Protein', 'Main dish') at the bottom. | study `28:4698` |
| Crouton | Changing ingredients amount | 2–5 | The most flexible scaler. 'Scale' opens a sheet with three modes, amount / serving / ingredient, a slider and a '× 3.5' field. Every amount recalculates in blue ('3 ½ cups unsalted butter'). In 'ingredient' mode you 'Select' one ingredient ('5 cups granulated sugar') and the whole recipe scales around it. | study `28:4324` |
| MyFitnessPal | Recipe detail | 2–4 | Nutrition-first. Photo hero, 'Shawarma-Spiced Chickpea Bowls / Serves 2', meal chips (Dinner, Lunch, Vegetarian, Gluten-free), 'Nutrition Per Serving' ring '444 cal' with Carbs/Fat/Protein, a 'SHOW NUTRITION' expander into 'Percent of Daily Goals' bars, then Ingredients and Directions. A sticky blue 'LOG TO DIARY' is the only action. | study `37:2282` |
| Noom | Recipe detail | 2, 4–5 | Two light buttons under the title, 'Save' and '+ Log this recipe', with the summary '30 minutes • 2,228 calories • 4 servings. 35% green'. Nutrition is per ingredient (Chicken Sausage 140 cal …) with color rings (Green / Yellow / Orange), and a final 'Log this recipe' + 'Share'. | study `35:899` |
| Yazio | Recipe detail | 3–5 | Three icon stats under the title ('286 Cal', '185 minutes', 'Easy'), a short blurb and tag chips. Ingredients have a '−/+' serving stepper ('For 1 serving'); 'Instructions / Ready in 185 minutes' and 'Nutrition Facts' follow. A dark bottom bar holds two actions: 'Add to List' and 'Add to Diary'. | study `28:2921` |
| Cherrypick | Ingredients | 1–2 | Tabs 'Ingredients / Method / Nutrition' and a '2 regular servings · £0.89 per serving' stepper. Each ingredient is a product with a tick box and 'Swap'; 'Unticked items are not included in health scores.' 'Optional extras…' sit apart, ending in 'Add to my shop'. | study `28:2202` |
| Recime | Recipe detail (ingredients) | — | 'Mark as Cooked' with a 5-star rating and a note ('Delicious and easy to make') sit right on the recipe. 'INGREDIENTS' has a '− 13 + servings' stepper and 'Convert', icon rows (192 ml superfine sugar…), an 'Add to groceries' button, and 'INSTRUCTIONS' opens with 'Cook step-by-step'. | [Mobbin](https://mobbin.com/screens/76b7f726-05fc-41a6-bdab-aaa2024eb745) |
| Kitchen Stories | Recipe detail (ingredients) | — | '2 Servings' with a − 2 + stepper, a two-column amount/name ingredient table, a full-width 'Add to shopping list', 'Utensils', then 'Nutrition per serving'. A floating 'Start cooking!' pill stays on screen while you scroll. | [Mobbin](https://mobbin.com/screens/6a2dec2a-8492-4e64-bcda-12ac62d57c30) |

**Patterns across apps**
- Servings is a stepper right above the ingredient list, and amounts recalculate in place (Kitchen Stories, Recime, Yazio, Cherrypick). Crouton goes further with amount / serving / ingredient scaling.
- One floating or sticky primary action. Cooking apps make it 'Start cooking!' (Kitchen Stories, Crouton 'Start'); trackers make it 'LOG TO DIARY' / 'TRACK'. Secondary actions (groceries, share, save) are icon buttons near the title.
- 'Add to list' sits next to the ingredients, not in a menu (Kitchen Stories 'Add to shopping list', Recime 'Add to groceries', Yazio 'Add to List', Cherrypick 'Add to my shop').
- Nutrition is summarized in one line or ring near the top (MFP '444 cal' ring, Yazio three stats, Noom summary line), with full detail pushed below the steps.
- Steps are numbered cards with tappable quantities, temperatures and times (Crouton highlights ingredients and converts °F/°C inline).

**Options for Otto**
- Keep 'Start cooking' as the one primary, and make it float (Kitchen Stories) so it is reachable from the steps.
- Turn the 'For 3' chip into a real − 3 + stepper that rescales the metric amounts in place, as Kitchen Stories and Recime do.
- Add two quiet secondaries by the title: a save (bookmark) and 'Add to the week'. Put 'Add to list' under the ingredients like Kitchen Stories / Recime.
- Keep 'Nutrition · Estimate' as one line (450 cal · 30g protein …) under the title and move the full block below the steps.
- Show a short steps preview below ingredients with tappable times that pre-arm Cook step timers (Crouton's 'Start Timer' chip).

**Juan's decisions**
- [ ] Which secondary earns the title row: Save, Add to the week, or Share?
- [ ] Do we scale by servings only, or also 'by ingredient' like Crouton (e.g. 'I have 450 g chicken')?
- [ ] Should 'Mark as cooked' plus rating live on the recipe (Recime) or only after cook mode ('Dinner, done')?

## 7. Weekly meal plan

**Decision:** How does a week read at a glance, how do you add, swap or move a dish, and what does 'Otto plans the week' hand back before it commits?

**Otto today (v3 frames):** Plan, day filled, Plan, open day, Plan, dish actions, Otto plans the week.

v3 Plan is a day-at-a-time view: header 'NOVEMBER 2 TO 8 / Otto's week' and a M–S day strip, then that day's meals ('DINNER · 35 MIN Teriyaki chicken casserole · For 3 · Start cooking', 'LUNCH Lasagne · Leftovers from Monday', 'BREAKFAST Add breakfast'). Empty day: 'Open. No plans, no guilt. Otto's happy to improvise.' with 'Pick something for Saturday'. Long-press sheet: 'Mark as cooked / Swap this dish / Move to another day / Leftovers tomorrow / Take it off the week'. 'Otto plans the week' lists MON–SAT dinners with times and 'Put these on the week'. A separate 'This week' frame (83:324) shows the whole week as a list.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Generating a plan for a week | 1–3 | The whole week as stacked day cards ('Monday Jun 8 … No recipes', each with + and ⋯). The ⋯ menu offers 'Add to Groceries', 'Generate Plan for Week', 'Clear Current Week', 'Show Weather'. Generating fills one recipe per day (Grandma's Famous Salmon Cakes, Sesame Grilled Salmon …) in place, no review step. | study `28:4312` |
| Crouton | Meal Plan | 1–3 | A day with sections: 'Breakfast' (Sloppy Joe Casserole, Simple Lemon Herb Chicken), a free-text note 'Defrost the chicken', 'Lunch', 'Dinner'. Days without meals collapse to 'No recipes' with a dashed outline when dragging. | study `28:4748` |
| Cherrypick | Reordering meal plan | 1–3 | Week rows Mon–Sun with a pink 'Meals arriving / Hold & Drag meals to plan your week' tray. Drag 'Pickled Blackberry and Ricotta Salad' onto Wed and it shows 'Arriving Mon, 18 August'. Planning is tied to grocery delivery. | study `28:2050` |
| Lifesum | Swapping a meal | 1–4 | Every meal card has 'TRACK' and 'SWAP'. Swap opens a same-slot list ('LUNCH Pizza with bresaola and arugula', 'Roast beef and avocado salad' …). The detail has 'SELECT' and 'EAT THIS EVERY DAY', and the card is replaced in place. | study `45:2131` |
| BitePal | Swapping a meal | 2–4 | Swap shows 'Current meal' (Protein power plate 795 kcal) above 'Recommended' alternatives with similar kcal, then 'All meals'. Picking one and tapping 'Swap' returns to the plan with a 'Meal swapped successfully' toast. | study `33:859` |
| BitePal | Meal plan | 2–3 | A week strip 'Sep 28 – Oct 4' (M 28 … S 4) with a 'Grocery list' pill. The selected day is grouped Breakfasts / Meals / Snacks with kcal and minutes per dish. | study `33:763` |
| Lifesum | Daily meal planner | 1–2, 5–6 | Today / Planner tabs. Today is 'Day 1 of 21' with big photo cards and TRACK / SWAP; Planner is a compact list per day ('TODAY, OCT 11 · DAY 1 OF 21', 'TOMORROW, OCT 12 · DAY 2 OF 21') with a cart icon per dish and SWAP under each. | study `45:2641` |
| Centr | Weekly meals | — | A 'MARCH 2025' day strip (Tue 4 selected), a 'SHOPPING LIST' button, then the day's meals as photo cards with a meal label (Breakfast, Lunch, Post-Workout Meal, Dinner), minutes, a done tick and a swap icon on each card. | [Mobbin](https://mobbin.com/screens/705eaf3c-a294-402a-abd2-870d1eb06136) |

**Patterns across apps**
- Two densities: a whole-week list of days (Crouton, Cherrypick, Lifesum Planner, Otto 'This week') and a single day with a day strip (BitePal, Centr, Otto 'Plan, day filled'). Most apps offer both.
- Swap is one tap on the card (Lifesum 'SWAP', Centr icon) and shows the current dish next to similar alternatives (BitePal 'Current meal' → 'Recommended'), then confirms with a toast.
- Drag and drop between days (Cherrypick 'Hold & Drag meals to plan your week', Crouton drag outline) is the move pattern; menus are the fallback.
- Auto-plan lives in the week menu (Crouton 'Generate Plan for Week') and usually fills in place. None of the references show a review screen first, so Otto's 'Swap anything that sounds wrong' step is ahead.
- The shopping list is one tap from the week (Crouton 'Add to Groceries', BitePal 'Grocery list', Centr 'SHOPPING LIST', Recime 'Add to groceries').

**Options for Otto**
- Keep 'Otto plans the week' as a review screen, but let each row swap inline (BitePal-style Current vs Recommended) before 'Put these on the week'.
- Add a 'Shopping list' pill in the Plan header (BitePal, Centr) so plan → list is one tap.
- Make swap a visible control on the dinner card, not only in the long-press sheet (Lifesum 'SWAP').
- Show leftovers as a linked card ('Lasagne · Leftovers from Monday' already does), and let 'Leftovers tomorrow' create it automatically, like Cherrypick's 'Duplicate as leftovers'.
- Allow a free-text note on a day ('Defrost the salmon') as Crouton does, which feeds Today's Otto nudge.

**Juan's decisions**
- [ ] Default view for Plan: today with a day strip, or the whole week ('This week')?
- [ ] Should 'Otto plans the week' fill only dinners, or lunches and breakfasts too?
- [ ] Drag between days, or keep 'Move to another day' in the sheet only?
- [ ] Does a swap offer 3 'Otto suggests' picks or open full search?

## 8. Shopping list

**Decision:** How is the list built from the week, how is it grouped, and how does a household share and tick it off together?

**Otto today (v3 frames):** Shopping pad, Share with household, Mise en place.

v3 Shopping pad (68:759): '4 of 12 in the basket', 'SHOPPING LIST' grouped by aisle (PRODUCE, MEAT & FISH, PANTRY), each line 'amount · item · for <recipe>' (450 g chicken for Teriyaki casserole), and a 'Something else? Coffee…' add field. 'Share with household' sheet: 'Share this list / Everyone in your household sees the same list, live. Tick it off at the store and it updates at home.' with 'Invite with a link' and 'Join with a code instead'. No pantry ('already have') control on the frame.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Adding items to groceries | 2–5 | From a recipe, the groceries button opens 'Add to Groceries' with every ingredient pre-ticked and 'Deselect All' / 'Add 9 Items'. Untick what you have ('Add 6 Items'), a 'Groceries · Added 6 items' banner confirms, and the list shows them with amounts. | study `28:4468` |
| Cherrypick | Generating a shopping list | 1–3 | 'Shop it' with Online / In-store. Empty state 'Your basket is empty', then an AI sheet 'Fill your basket using the AI Shopping List / Using your regulars and order frequency…' with 'Generate my list'. The result 'Auto-generated Shop' lists products with prices and ticks, then 'Add selected items to basket'. | study `28:2172` |
| Cherrypick | Shop | 3–5 | Built from the plan: 'Basket Health' (Plants 7/30, UPFs 7%), '1 Meal £22.93 per serving', then '13 Ingredients' as products with 'In 1 recipe', quantity steppers and 'Swap', '1 Grocery' extras, 'Add more items', 'Clear basket' and 'Checkout with Sainsbury's £24.93'. | study `28:2136` |
| Noom | Marking grocery items as bought | 1–2 | 'Your grocery list has 1 green foods', 'Clear list', check rows with a color square per item (Tater Tots, Turkey Bacon, Egg). Ticked items gray out and strike through but stay in place. 'Noom auto-saves your grocery list' and an Instacart 'Shop now' card sit below. | study `35:1909` |
| Yazio | Adding to grocery list | 1–2 | 'Add to List' on the recipe makes a recipe-titled 'Grocery List' section ('Overnight Raspberry & Almond Oats · For 1 serving') with square checkboxes, and 'Delete List', 'Delete Completed', 'Share List' in the bottom bar. | study `28:3337` |
| Recime | Grocery List | — | 'Grocery List' with the source recipes as removable cards at the top ('World's Best La…' · View recipe), '21 items' with a sort pill 'Aisle', then aisle sections ('FRESH PRODUCE': dried basil leaves 1 1/2 tsp, fresh parsley 4 tbsp) with emoji icons and checkboxes. Share and add in the header. | [Mobbin](https://mobbin.com/screens/fed50738-683f-4bed-b3a8-fc1309fe0db5) |
| Centr | Shopping list | — | Source meals as round photos at the top (Choc Caramel Super Sm…, Grab & Go Broccoli Quinoa Sal…), then collapsible aisle cards ('Dairy & Eggs': Fresh ricotta 14 ⅓ oz, Parmesan 2 ⅛ oz) each with its own '+ Add custom item' field. | [Mobbin](https://mobbin.com/screens/a4b9ad4e-b96c-4929-bd47-db7069693e30) |
| Amazon Alexa | Shopping (household) | — | Household-aware list: a banner 'Going to the store? Remind your household to add to the shopping list.' with 'Announce', 'Share' in the header, 'Group by: Store' and aisle sections (PRODUCE (1), BAKING & COOKING (5)) showing 'Added a few seconds ago' per item. | [Mobbin](https://mobbin.com/screens/33112b25-7376-48e4-ba8b-956e27fc6207) |

**Patterns across apps**
- Built from recipes with a pre-ticked review step: everything is selected, you untick what you have (Crouton 'Deselect All / Add 9 Items', Cherrypick 'Add selected items to basket'). That review is the de facto pantry check.
- Group by aisle with collapsible sections (Recime 'Aisle' sort, Centr 'Dairy & Eggs', Alexa 'Group by: Store'). Flat lists (Crouton, Noom) get long fast.
- Show where an item came from: source recipe cards at the top (Recime, Centr) or 'In 1 recipe' per line (Cherrypick). Otto's 'for Teriyaki casserole' line is the same idea.
- Checked items stay in place, grayed and struck through (Noom, Yazio), so you can undo. Bulk 'Delete Completed' / 'Clear list' clean up later.
- Household sharing is rare in the references. Yazio has 'Share List', Alexa adds 'Announce' and per-item 'Added …' stamps.

**Options for Otto**
- Keep Otto's aisle grouping and 'for <recipe>' lines; add the source dishes as a small row at the top of the list (Recime, Centr) so you can drop a whole recipe.
- When the week is put on the list, show a pre-ticked review sheet ('Already have it? Untick.'), like Crouton 'Add to Groceries'. That is the simplest pantry step.
- Keep ticked items in place, struck through, with 'Clear ticked' at the end of the list (Noom, Yazio).
- For the household, show who added or ticked an item ('Maya ticked lemons'), as Alexa's 'Added a few seconds ago' does. It makes 'live' believable.
- Let each aisle take its own quick add (Centr '+ Add custom item') in addition to the bottom 'Something else? Coffee…' field.

**Juan's decisions**
- [ ] Pantry: a review step only, or a persistent 'always have' list (salt, oil) that is never added?
- [ ] Show 'for <recipe>' on every line, or only when tapped?
- [ ] Household invite at first share, or in Account → Household?
- [ ] Should ticked items fall to a 'In the basket' section at the bottom or stay in place?

## 9. Cook mode

**Decision:** How does cook mode show one step, its timers and its ingredients, keep the screen awake, and close with a 'done' moment that feeds the plan?

**Otto today (v3 frames):** Mise en place, Cook step, Dinner, done.

v3 'Mise en place' (76:617): '3 of 9 gathered · Teriyaki chicken casserole', a GATHER checklist by aisle, 'All set? Start cooking →'. 'Cook step' (68:1118): 'Step 5 of 9', 'STEP 5 · 35 MINUTES', a big timer '34:51' with '+1 min' and '+5', the step text 'Place the chicken in the pan, pour over the sauce and bake 35 minutes.' and 'Next step'. 'Dinner, done': 'Dinner, done. Otto's proud of you.', 'Would you cook it again?', 'Snap your plate', 'Back to the recipe'. No screen-awake cue and no per-step ingredients shown.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Starting steps preview | 2–4 | Full-screen steps. Top bar with list, a hand icon (keep screen awake), timer and +. 'Step 1' small label, the step text with highlighted temperatures and ingredients, page dots and round back/next arrows. The last step is 'Step 10 · Serve and enjoy!'. | study `28:4198` |
| Crouton | Starting a timer | 2–6 | Timer icon opens 'Create Timer' with a keypad and +1 / +10 / +15 quick-adds. Running timers float as a small card titled with the step ('Step 1: Chocolate Chip Co… 00:58') with +1, +5, restart and ✕, and turn green at '00:00' with a tick. | study `28:4094` |
| Crouton | Switching to current step | 1–4 | The ingredients sheet in cook mode switches between 'All Ingredients' and 'Current Step'. Current Step shows only what this step uses ('1 cup unsalted butter, softened', '1 cup granulated sugar') or 'No ingredients for current step'. | study `28:4564` |
| Crouton | Marking off ingredients | 2–4 | The 'All Ingredients' sheet slides up under the step with checkboxes; ticked ingredients gray out, so the list doubles as a gather check. | study `28:4150` |
| Cherrypick | Marking as cooked | 1–2 | After cooking, the planned card's menu offers 'Order again', 'More like this', 'Rate Recipe', 'Duplicate as leftovers', 'Mark as cooked'. Marked, the card gets a 'Cooked' tag in 'This week'. | study `28:2314` |
| Kitchen Stories | Cook mode step | — | Step video/photo up top with a running timer badge '00:02:59', this step's ingredients and utensils ('½ lemon', 'whisk · food thermometer'), large step text with tappable '30 min.' and '10 min.' timers, and numbered step tabs (01, 02, 03, flag for finish) at the bottom. | [Mobbin](https://mobbin.com/screens/85a4ace6-390e-40b5-a231-14f134af1752) |
| HelloFresh | Cook mode step | — | 'Step 2 of 6' with dots, a mic icon (voice control) and a timer icon, the step photo, then named one-tap timers 'Start "Cook Pasta" 09:00' and 'Start "Cook Pepper" 04:00', and a bottom drawer listing this step's ingredients ('Long Green Pepper, Cavatappi Pasta, Sa…'). | [Mobbin](https://mobbin.com/screens/a8ce2bb8-cecc-423b-aaaf-53e3e00e333a) |
| CREME | Cook mode step list | — | Dark mode steps as a scrolling list with the current step highlighted and an inline '10m' timer chip, a floating step video, and bottom actions '+ Help', '+ Bite', 'Ingredients'. | [Mobbin](https://mobbin.com/screens/805d87ef-7066-46e0-9421-fd36a5694189) |

**Patterns across apps**
- One step per screen with a large type size and a clear position ('Step 2 of 6' with dots, Kitchen Stories 01/02/03 tabs). Otto's 'Step 5 of 9' matches.
- Timers come from the step text: tappable times (Kitchen Stories '30 min.', Crouton 'Start Timer') or named buttons ('Start "Cook Pasta" 09:00'). Running timers are named for their step and survive moving to the next step.
- Per-step ingredients: a drawer (HelloFresh), an inline row (Kitchen Stories) or a sheet that toggles 'All Ingredients / Current Step' (Crouton).
- A keep-awake control is visible (Crouton's hand icon in the toolbar); HelloFresh adds voice control.
- The end feeds the plan: Cherrypick 'Mark as cooked', 'Rate Recipe', 'Duplicate as leftovers'; Recime puts rating on the recipe.

**Options for Otto**
- Keep 'Mise en place' as the gather step, but also give each Cook step its ingredients line (Kitchen Stories, HelloFresh) so you don't need to go back.
- Make the timer named and persistent: 'Bake · 34:51' as a small floating chip when you go to the next step (Crouton), and start it from the step's '35 minutes' text.
- Show a keep-screen-awake cue ('Screen stays on while you cook') once, plus a toolbar toggle like Crouton's.
- On 'Dinner, done', add 'Leftovers tomorrow' and a one-tap rating next to 'Would you cook it again?', and mark the plan card 'Cooked' (Cherrypick).
- Consider numbered step tabs at the bottom (Kitchen Stories) instead of only 'Next step', for jumping back.

**Juan's decisions**
- [ ] Are multiple timers in scope for launch, or one at a time?
- [ ] Voice ('Next') or hands-free gestures: now or later?
- [ ] Rating: a thumbs 'cook it again?' only, or stars that feed recommendations?
- [ ] Should 'Mise en place' be skippable straight into Step 1?

## 10. Paywall and purchase outcomes

**Decision:** How does Otto Club show the trial timeline and plans with the billed amount as the most prominent price, and what do success, failure and restore look like? (Otto was rejected under 3.1.2(c) for price prominence.)

**Otto today (v3 frames):** Paywall, Apple purchase sheet, Welcome to the Club, Purchase couldn’t be completed, No purchases to restore, Purchases restored.

v3 Paywall (68:329): 'Restore' top-right, 'OTTO CLUB / Cook more. Plan less.', four benefit lines, then plan tiles: 'Yearly' with '$3.33/mo' (13 pt regular) and '$39.99/yr' (15 pt semibold), 'Monthly' with '$4.99/mo' (15 pt) and a '$39.99/year' line set at 20 pt bold, 'Continue', and 12 pt fine print 'Free until Nov 11, then $39.99/year. Cancel anytime in Settings at least 24 hours before the trial ends.' The billed yearly amount is now larger than the per-month figure, which is the right direction. Check: the Monthly tile carries a '$39.99/year' label, the trial wording differs between frames ('Free until Nov 11' vs 'Free for 7 days, then billed $39.99/year'), and there is no trial timeline. Outcomes exist: 'Welcome to the Club' ('Your 7-day trial has started. Tonight: teriyaki chicken casserole, 35 min. Your list has 18 items.'), 'Purchase couldn’t be completed' ('Nothing was charged. Check your connection and try again.'), 'No purchases to restore', 'Purchases restored. Otto Club is active.'

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Headspace | Subscribing to premium | 1–2, 3–4, 7 | The safest model for 3.1.2(c). 'How your trial works' with the billed amount in the subline ('First 14 days free, then $69.99 ($5.83/month)'), an Annual / Monthly toggle that rewrites it ('First 7 days free, then $12.99/month'), a timeline 'Today / In 5 days We'll send you a reminder / In 7 days You'll be charged on March 28, cancel anytime before', 'Restore Purchase' and 'Start my free trial'. After purchase: 'Your 7 day trial has started' with 'Remind me' (notification permission). | study `28:10145` |
| MacroFactor | Subscribing to MacroFactor | 1, 3–4, 9 | 'What you get' list with 'Try 1 Week for Free' and 'Restore Subscription', then 'Choose a plan for after your 1-week free trial': '1 Month $11.99 / mo', '12 Months $143.88 $71.99 … $5.99 / mo' with 'Billed annually after trial', '6 Months $47.98'. The total is bold on the left and per-month on the right; 'Subscribe & Start Trial'. LOW-MEDIUM RISK: per-month and total are similar weight. | study `43:2681` |
| Duolingo | Subscribing to Super | 2–6, 7–12, 18 | 'Progress faster…' FREE vs SUPER table, 'We'll remind you 2 days before your trial ends' with the bell, then 'Choose a plan': 'Individual $6.99 / MO' large on the right with '12 mo • $83.99' small underneath, 'START MY FREE WEEK'. Success: 'Welcome to Super Duolingo!', a setup checklist, and 'Your 7-day free trial has started! We'll remind you 2 days before it ends'. RISK for 3.1.2(c): the monthly equivalent is the biggest price; the billed $83.99 is secondary. | study `46:5413` |
| Cal AI | Subscribing to Cal AI | 1–3 | Photo hero 'Start your 3-day FREE trial to continue', a '3 DAYS FREE' selected tile 'Start for free & save 75% / $39.98 billed annually' with '$3.33/mo' small at the right, 'Monthly $14.98/mo', 'Continue', and '3 days free, then $39.98 per year. Billed annually and renews automatically…'. Success is the system alert 'You're all set. Your purchase was successful.' over a spinner. | study `41:1709` |
| Yazio | Subscribing to Yazio Pro | 1–4 | A 'Special Offer' card on Today: '$99.92 $24.98/year', a huge '75% OFF $2.08/month' badge and a '00:59:19' countdown, 'Unlock all'. The plan sheet: '12 months $99.92 $49.98 … $4.16/month', '3 months · $24.98 $8.33/month'. Success: confetti 'Welcome to the Club! You're officially a YAZIO Pro member!' with 'Get Started'. HIGH RISK: per-month and discount badge dominate, plus a countdown. | study `28:3833` |
| Lifesum | Subscribing to Lifesum Premium | 1–2, 5 | 'Alex, be 5x more likely to achieve lasting results with Premium' FREE vs PREMIUM table, '50% off Premium' bar and three tiles '1 month $7.48', '12 months $36.98 (~~$73.96~~) $3.08 / month', '3 months $18.48'; 'RESTORE PURCHASE · REDEEM CODE'. Success: 'Your journey has begun! Lifesum Premium activated' and 'EXPLORE THE APP'. MEDIUM RISK: the total and per-month share a tile, total is larger. | study `45:3275` |
| Crouton | Subscribing to Discover plan | 2–5 | Indie and honest. 'Upgrade' compares 'Plus $24.99 $17.99 One time purchase' with 'Discover $14.99/year Subscription'. The Discover page lists features and one button 'Continue / 3 Day Free Trial • $14.99/year' with the billed amount inside the button, '$1.99/Monthly' and 'Restore Purchase' under it. Afterwards: 'Subscription Active. Thank you for the support! Renews on: Jun 14, 2026 · Manage Subscription'. | study `28:5012` |
| foodpanda | Start your free trial (payment failed) | — | Failure handled inline on the plan screen: 'pandapro Free for 90 days' with a timeline 'Today Free trial starts / Day 89 Billing reminder – cancel anytime / Day 91 Plan starts and billing begins · S$ 5.99 every 1 month(s) after trial ends', a red card 'We couldn't process your request. Please try again', and a footer 'Total Free for 90 days · then S$ 5.99 for 1 mo.' | [Mobbin](https://mobbin.com/screens/7dc2fce8-0335-4322-9fba-06a547929179) |

**Patterns across apps**
- Safe layouts put the billed amount in the sentence that explains the trial ('First 7 days free, then $12.99/month', '3 days free, then $39.98 per year') and make that the largest price. Per-month equivalents are small, gray, secondary.
- Risky layouts (Yazio, Duolingo) make the per-month or discount the biggest number, with the billed amount small; Yazio adds a countdown. This is what 3.1.2(c) rejects.
- A trial timeline (Headspace, foodpanda: Today → reminder → charge date) answers 'when will I be charged' and pairs with a reminder promise ('We'll remind you 2 days before').
- Restore is always visible, either top-right (Otto) or under the CTA (Headspace, Crouton, Cal AI).
- Success is a branded welcome ('Welcome to the Club!', 'Your journey has begun!') that hands you back to the app, often asking for notifications to deliver the reminder (Headspace 'Remind me'). Failure is rarely designed; foodpanda shows it inline without losing the plan.

**Options for Otto**
- Make the billed amount the biggest price on each tile ('$39.99/year', '$4.99/month') and drop '$3.33/mo' to secondary gray, or remove it. Fix the Monthly tile so it never shows '$39.99/year'.
- Use one trial sentence everywhere, matching the Apple sheet: 'Free for 7 days, then $39.99/year. Cancel anytime in Settings.' Put it above Continue at body size, not 12 pt.
- Add a 3-row timeline like Headspace: 'Today: full access · Nov 9: Otto reminds you · Nov 11: $39.99 billed'. Otto already designs the 'Trial ending reminder' notification.
- Keep 'Purchase couldn’t be completed / Nothing was charged' but leave the plan selection visible behind it (foodpanda), with 'Try again' as the action, not just OK.
- 'Welcome to the Club' is already stronger than every reference (it names tonight's dinner and the list); add a notification ask there for the trial reminder (Headspace).

**Juan's decisions**
- [ ] Show the monthly-equivalent price at all ('$3.33/mo'), or only 'Save 33%' against monthly?
- [ ] Trial on Yearly only, or on both plans?
- [ ] Do we add a FREE vs CLUB table (Duolingo, Lifesum) or keep the four benefit lines?
- [ ] Notification ask on 'Welcome to the Club', or keep 'Dinner reminders?' as the only ask?

## 11. Talking to the AI

**Decision:** What does the empty chat offer, how do answers become actions (save, add to week, add to list), and where does consent for sending data to OpenAI appear?

**Otto today (v3 frames):** Chat, start, AI consent, Otto’s thinking, Chat, answer.

v3 'Chat, start' (68:1187): 'Chat with Otto / What are you hungry for?' with three prompt cards ('Use up my salmon · On your week for Wednesday', '20-minute weeknight pasta · Otto knows a few', 'Plan my whole week · Six dinners, one list'), a 'Tell Otto what you're after…' field and 'Speak'. 'AI consent' is a sheet over it: 'Otto’s AI is powered by OpenAI / When you ask Otto or bring in a recipe, what you type or snap is sent to OpenAI to write it up. OpenAI doesn’t use it to train its models. Change this anytime in Account → AI data.' with 'Allow' / 'Not now'. 'Otto’s thinking…' shows 'Checking your kitchen: 3 people, no peanuts, skip cilantro.' with Cancel. 'Chat, answer' returns a recipe card 'Spinach chicken rice skillet · 28 min · For 3 · about 480 cal, an estimate' with 'Add to the week' and 'Keep it', and 'Ask a follow-up…'.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Tiimo | Chatting with AI | 2–3, 7–8 | Empty state 'What's the plan today?' with a mascot and two rows of chips ('Move unfinished tasks', 'Create a morning routine', 'Add a task', 'What do I have time for?'), 'Ask anything' and 'Speak'. The AI asks a clarifying question ('What would you like the task to be called?'), shows the result as a task card ('Reading books · To-do · 30m') and an action button 'Create tasks (1)', then confirms 'Got it, your task … is set up.' | study `42:993` |
| Bevel | Chatting with Bevel AI | 1, 3, 6–9 | Opens with a long intro and three tappable goals ('I want to build strength…'). Answers show a collapsible 'Thought for 5 seconds' trace with steps, copy / thumbs controls, and result cards that are real objects: 'Hydration Check-in · Every day at 2:00 PM', '30-Minute Full Body Foundation · 8 exercises', 'Review cart · 471 kcal'. A failed answer: 'Something Went Wrong / We couldn't load this right now… Retry'. | study `36:527` |
| Bevel | Setting up Bevel AI | 2–5, 8–9 | AI intro before first use: 'Introducing the new Bevel Intelligence', a capability list ('Create check ins', 'Log food', 'Create a training plan'), 'Select a personality' (Friend / Guardian), then the empty chat 'How are you feeling, Alex?' with suggestion cards 'Check-in with me', 'Create a training plan', 'Log food'. | study `36:775` |
| Oura | Chatting with Oura Advisor | 1, 3–6 | Dark chat with 'Hey! What's on your mind?' and three question chips. Answers are long formatted text with follow-up chips ('Why did stress get flagged', 'Explain wind-down') and inline data cards (Trends: Activity Score 84). A persistent footer: 'Advisor can make mistakes.' | study `34:2009` |
| Flo | Chatting with Flo Health Assistant | 4–5, 7–8, 11 | Consent inside the chat. Before a health self-assessment the bot shows a card 'Start self-assessment · Created in collaboration with Barbara Levy, MD', a warning 'This self-assessment is not a substitute for professional medical advice…', 'About this chat', and the user must tap 'I understand and accept'. Answers use quick-reply chips and an end-of-chat satisfaction scale. | study `28:701` |
| Lifesum | Chatting with AI (photo) | 1, 3 | Meal logging as chat: 'Good afternoon, Alex!' with 'Often tracked for breakfast' chips, a 'What do you want to track?' field with camera and mic. The answer is a card 'Lunch: Tuna melt sandwich · 784 kcal' with an edit pencil, 'Does this look right?' thumbs, 'DONE TRACKING' and 'Want to adjust anything?'. | study `45:793` |
| Julienne | Ask Julienne | — | The closest recipe-app match. 'Ask Julienne / Hey, Sam! Looking for something a little different? Tell us what you're in the mood for…'. The user asks 'Please make me a recipe with steak, mushrooms, and potatoes.' and gets one recipe card ('Steak with Garlic Mushrooms and Herb Roasted Potatoes · 50m Cook Time, 10 ingredients') with three actions: 'Try again', 'Save', 'Make'. | [Mobbin](https://mobbin.com/screens/d9ed0e2b-75c9-4f85-91fc-31f22a6608d3) |
| Recime | Recipe chat (Make it easier) | — | AI scoped to one recipe: the chat is titled 'Easy Vanilla Cupcakes', a suggested prompt '👌 Make it easier' is sent as a bubble, typing dots, and 'Ask a question' at the bottom. | [Mobbin](https://mobbin.com/screens/0c1bc1ea-830a-45e3-947f-e07809e54e9d) |

**Patterns across apps**
- Empty states lead with 3–6 tappable prompts close to the input (Tiimo chips, Bevel cards, Oura questions). The best ones are specific to the user's data.
- Answers become objects with buttons: a recipe card with 'Try again / Save / Make' (Julienne), a task card with 'Create tasks (1)' (Tiimo), 'Hydration Check-in' or 'Review cart' cards (Bevel), 'DONE TRACKING' (Lifesum).
- Working state is explicit: Bevel's 'Thought for 5 seconds' trace, Tiimo's 'Hold on just a sec'. Errors get 'Something Went Wrong … Retry' (Bevel).
- Honesty lines sit in the chat chrome ('Advisor can make mistakes.' Oura; 'MacroFactor AI can make mistakes, so always verify its results.').
- Consent and disclaimers are shown before first use and need an explicit tap (Flo 'I understand and accept'; Bevel's intro screens).

**Options for Otto**
- Otto's 'Chat, answer' card already has the Julienne shape; add a third action 'Try another' and keep 'Add to the week' as the primary.
- Make one prompt card come from the user's data each time (Otto's 'Use up my salmon · On your week for Wednesday' does this). Keep it that way.
- Keep 'Otto’s thinking… Checking your kitchen: 3 people, no peanuts, skip cilantro.' It is clearer than Bevel's trace. Add a 'Something went wrong · Try again' state.
- Put a quiet 'Otto can get things wrong; nutrition is an estimate' line in the chat footer (Oura, MacroFactor).
- Keep AI consent as a one-time sheet before the first send, with the OpenAI disclosure (5.1.2(i)); consider showing it only when the user first taps a chip or Send, not on open.

**Juan's decisions**
- [ ] Should chat open from the tab circle with the chips, or start on a recipe ('Make it easier', Recime) too?
- [ ] After 'Add to the week', does Otto ask which day, or pick the next open dinner?
- [ ] 'Not now' on consent: is chat disabled, or does Otto offer non-AI search instead?
- [ ] Show a thinking trace, or just the one-line 'Checking your kitchen' summary?

## 12. Sign up / sign in

**Decision:** How loud is Sign in with Apple, and how do email, errors, forgot password and 'I have an account' sit around it?

**Otto today (v3 frames):** Sign up, Sign in, Forgot password, Sign up with email.

v3 Sign up (68:135): 'Pull up a stool.' / 'Save recipes, plan dinners. Otto remembers.', a row of three equal 76×44 icon buttons (Apple, Google, Facebook), 'or', Email + Password, 'Join Otto's kitchen', 'Already have an account? Sign in'. Sign in (68:170): 'Back to the kitchen?' / 'Otto kept your place.', same icon row, 'Sign in', 'Forgot your password?', 'New here? Pull up a stool'. Forgot password (68:206): 'Happens to everyone. Otto will email you a link to set a new one.', 'Send me a link', 'Remembered it? Sign in'. Sign up with email (70:301): 'Use any email. Otto saves your first week to it.' No error state on any frame; Apple is an icon, not a full-width button.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Creating an account | 4–9 | Apple next to email from the first screen. 'Sign In' shows Email/Password, a blue 'Sign in', 'Forgot password' and a full-width black 'Sign in with Apple', with 'Create Account' at the bottom. 'Create Account' leads with 'Continue with Email' over 'Sign in with Apple', then 'Enter Details' (Email, Password, Confirm new password, 'Passwords must be at least 6 characters long', 'Create') with a spinner on the button while it saves. | study `28:4006` |
| MacroFactor | Creating an account | 1–6 | Three stacked full-width buttons under 'YOU'RE IN. CREATE YOUR ACCOUNT TO CONTINUE.': black 'Continue with Apple', then 'Continue with Google' and 'Continue with Email'. Email is its own screen ('Continue with Email', Email, Password with an eye, 'Create Account'), followed by 'FIRST 30 DAYS' and two consent toggles ('I agree to the terms of the Health Disclaimer') before 'Accept and Continue'. | study `43:147` |
| Yazio | Creating account | 1–3 | 'Sign in to start your journey with Yazio!' with three equal outlined buttons: 'Sign Up With Apple', 'Continue With Google', 'Sign Up With E-mail'. 'Get Started' is a plain two-row form (E-mail Address, Password) whose 'Sign up' button stays grey until both are filled. | study `28:2761` |
| Cherrypick | Creating an account | 1–3 | The account ask comes after onboarding: 'Your meal matches are ready! Create an account to save your answers and your personalised recommendations.' Fields First name, Email, Password ('12 characters minimum', eye toggle), 'Invite code (optional)', an email opt-in Yes/No, and 'Create Account'. 'Skip' sits top right. | study `28:1880` |
| MyFitnessPal | Forgot password | 1–5 | 'Log In' has Email/Password, 'Forgot password?', 'OR' and three social buttons ('Continue with Google', 'Continue with Apple', 'Continue with Facebook'). 'Forgot Password' is one field and 'Submit' with an 'Email not recognized?' link. The reset finishes on the web: 'Password reset' then 'Password reset!' / 'RETURN TO LOGIN'. | study `37:368` |
| Headspace | Resetting password | 1–4 | 'Log in' with 'Forgot password?' in blue and round social icons (Apple, Facebook, Google, Spotify) under 'or'. 'Reset Password' is one field, 'Send', and 'We'll email you a link to reset your password'. The confirmation never says whether the account exists: 'If your account is associated with this email address you will receive an email…' plus 'Back to Login'. | study `28:8243` |
| Kraken | Sign in (invalid credentials) | — | Error as one pink card under the fields: 'Invalid credentials / Please check your credentials and try again.' The email stays filled, 'Forgot password or username?' sits above 'Continue', and 'Create an account' is the second button. | [Mobbin](https://mobbin.com/screens/298c6c1f-d996-45ad-9ee2-59ec7d26d9d8) |
| Navan | Sign in (wrong password) | — | Inline field error: the Password field turns red with '⊘ Wrong username or password' under it, the email shows with a 'Change' link, then 'Forgot password?', 'Continue', 'OR' and 'Login with Google'. | [Mobbin](https://mobbin.com/screens/201389d9-c8a3-42d4-ac48-d48e1c2cf474) |

**Patterns across apps**
- Sign in with Apple is a full-width black button, first or right under the email form (Crouton 'Sign in with Apple', MacroFactor 'Continue with Apple', Yazio 'Sign Up With Apple'). Nobody shrinks it to an icon.
- Email is a separate step or a secondary button ('Continue with Email' in Crouton and MacroFactor, 'Sign Up With E-mail' in Yazio), so the first screen is three stacked choices, not a form.
- Password rules sit under the field before you fail ('Passwords must be at least 6 characters long', Cherrypick '12 characters minimum').
- Errors are inline and specific: a red field plus one line ('Wrong username or password' in Navan), or one card above the button ('Invalid credentials / Please check your credentials and try again.' in Kraken).
- Forgot password is a single field and a privacy-safe confirmation ('If your account is associated with this email address you will receive an email…' in Headspace; MFP adds 'Email not recognized?').

**Options for Otto**
- Make Sign in with Apple a full-width black button at the top of Sign up and Sign in (Crouton/MacroFactor order: Apple, then 'Continue with email'), and drop the three equal icons. Keep Google as a quiet second row if we keep it at all; Facebook can go.
- Move Email + Password to 'Sign up with email' only, so the first screen is two buttons plus 'Already have an account? Sign in'.
- Add the hint 'At least 8 characters' under Password and an inline error state for Sign in ('That email and password don’t match.') with 'Forgot your password?' right under it.
- Forgot password: after 'Send me a link', show Headspace's neutral 'If there’s an Otto account for this email, a link is on its way.' with 'Back to sign in'.

**Juan's decisions**
- [ ] Do we keep Google sign-in at all on iOS, or Apple + email only?
- [ ] Does 'Sign up with email' need a confirm-password field (Crouton) or a show/hide eye (MacroFactor, Cherrypick)?
- [ ] Account before or after onboarding answers? Cherrypick asks after ('Your meal matches are ready! Create an account to save your answers').

## 13. Account & settings

**Decision:** What lives on the Account screen, and how do household join/leave, notifications, AI/data, subscription, sign out and delete account work?

**Otto today (v3 frames):** Account, Preferences, Notifications, Privacy & data, Membership, Share with household, Sign out, Delete account, Delete account · explain, Account deleted.

v3 Account (76:188): 'Your kitchen' with '2 adults · 1 kid · Otto Club', rows Otto Club (Yearly), Household (Our list), Cooking journal (12 dishes), Preferences, Notifications, Privacy & data, Help & FAQ, Sign out, Delete account. Sign out (76:273) is an alert: 'Your recipes and plans stay saved to your account.' Delete account (76:369) alert: 'This deletes your recipes, plans and lists. Apple keeps billing Otto Club until you cancel it in Settings.' Delete account · explain (84:739) lists 'WHAT GETS DELETED' plus 'Download your data first'; Account deleted (84:764) closes it. Privacy & data (84:687) has one AI toggle 'Use Otto’s AI for chat and imports' with plain OpenAI copy. Notifications (76:526): Dinner reminder · 5:00 pm, Cook timers, Plan your week · Sundays, 'Never marketing.' Membership (76:422): $39.99/year, renews Nov 4, 2027, Manage subscription / Restore purchases / Request a refund. Household join is only 'Invite with a link' / 'Join with a code instead' on Share with household (76:695); there is no leave-household or member list.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Adding a household | 1–5 | Empty state 'No Household / Add a household to share your recipes and meal plan' with a green 'Add Household' button. 'Add Household' is a sheet with one Name field and 'Add'. A 'Household Sync' alert explains the wait ('…need to be resynced. This may take several minutes. Please do not close Crouton.'), then a 'Household' card: 'Alex · 1 member', 'Edit', 'Add Members'. | study `28:4778` |
| Crouton | Removing a household | 1–4 | The household card's ⋯ opens a popover: 'Resyncing will associate all of your recipes and meal plan with the household', 'Resync with Household' and a red 'Remove Household'. A 'Removing…' HUD, then back to 'No Household'. | study `28:4878` |
| Cherrypick | Household | 1–3 | 'You' tab: 'Alex / You're set to Sainsbury's change', a 'Your Pro trial ends in 7 days' banner, Preferences tiles (Diets, Dislikes 3, Goals 2) and Account rows (Orders, Invite friends, Household, Health Settings). Household is 'How many servings do you usually need?' (− 1 servings +) plus 'Who's at home?' steppers for Adults, Children and Infants, and 'Done'. | study `28:2236` |
| Flo | Stop sharing with a partner | 1–6 | 'Flo for Partners / You’re always in control' with 'Stop sharing'. A sheet 'What will happen when I stop sharing?' splits 'If you paid:' / 'If your partner paid:' with red ✕ lines ('Your partner won’t see your data.'), then 'What next for your partner?', 'Yes, stop sharing' or 'I want to keep sharing my data', a spinner 'Cancelling his access to your data', and 'You’ve stopped sharing … You can share it again anytime.' | study `28:747` |
| Duolingo | Deleting an account | 1–6 | 'Profile' with a red 'DELETE ACCOUNT' at the bottom. 'Delete Account' is a full page of consequences ('erase all of your personal data… cannot be undone… 7 day grace period') and 'This action will NOT cancel an existing Duolingo subscription.' The button counts down 'DELETE ACCOUNT (5)'…(3) before it unlocks, a sheet asks 'Do you wish to delete your account?', and it ends on 'Check your email'. | study `46:4833` |
| Bevel | Bevel AI settings | 2–6 | 'Bevel Intelligence' sheet: master toggle, 'Personality · Guardian', a medical disclaimer, 'Weekly limits 5% used' and 'Extra credits', toggles for 'Expanded thinking steps' and 'Suggested follow-ups', 'Ghost mode' ('Default to ghost mode', 'Persistent knowledge', 'Chat history · 1 hour'), 'Data Sharing · Reproductive health', 'Model selection · Standard', 'Beta features', and destructive 'Delete all chats' / 'Delete all files' / 'Delete all data'. | study `36:3107` |
| Nike | Notifications | — | Four toggles, each with a one-line reason: 'Notify Me / Never miss a drop…' (with 'Edit Schedule'), 'Articles, Events & Training Tips', 'Nike Member Rewards & Promos', 'Latest Products & Bestsellers'. | [Mobbin](https://mobbin.com/screens/a3b3002a-4e23-4c8b-9361-51b6d804825d) |
| Quicken | Notification Preferences | — | A master card 'Pause all notification / Take a break, pause all notification.' sits above 'Customize notifications'. With it on, every row below ('Achievement badge earned', 'Bill paid'…) greys out and reads 'Disabled'. | [Mobbin](https://mobbin.com/screens/a67919a5-de03-4df3-b275-71e4fb6fa930) |

**Patterns across apps**
- Household is an object you can see: a name, '1 member', 'Edit' and 'Add Members', with a ⋯ menu holding 'Remove Household' (Crouton). The empty state says why to have one ('Add a household to share your recipes and meal plan').
- Leaving or stopping sharing explains consequences first, in a sheet, with a keep option as the second button (Flo 'What will happen when I stop sharing?', 'Yes, stop sharing' / 'I want to keep sharing my data', then 'You’ve stopped sharing … You can share it again anytime.').
- Delete account is two steps: a full page that states what is lost and that the subscription isn't cancelled (Duolingo 'This action will NOT cancel an existing Duolingo subscription'), then a destructive confirm. Duolingo adds a short countdown on the button and a 7-day grace period.
- AI settings get their own page with plain toggles and usage (Bevel Intelligence: on/off, 'Weekly limits 5% used', 'Ghost mode', 'Delete all chats').
- Notification settings are one toggle per kind with a one-line description (Nike), and some add a master 'Pause all notification' (Quicken).

**Options for Otto**
- Give Household its own screen behind the Account row: household name, members with avatars, 'Invite' and a ⋯ with 'Leave household' (or 'Remove household' for the owner), like Crouton.
- Leaving the household gets a Flo-style sheet: 'What happens when you leave' (you stop seeing Our list and the shared plan; your own recipes stay) with 'Leave household' and 'Stay'.
- Keep the current two-step delete (explain page, then confirm) and keep the Apple billing line, as Duolingo does; consider a 7-day 'changed your mind' window.
- Add a one-line description under each Notifications toggle (Nike) and keep 'Never marketing.' as the footer.
- Privacy & data already matches Bevel's plain-toggle approach; add 'Delete my chats with Otto' under the AI toggle.

**Juan's decisions**
- [ ] Can a member leave a household, or only the owner removes them? What happens to Our list for the person who leaves?
- [ ] Delete account: immediate, or a 7-day grace period like Duolingo?
- [ ] Does Account show the household members inline under 'Your kitchen', or only on the Household screen?

## 14. System states

**Decision:** How do offline, errors, billing problems, What's New, permission-denied and empty states look, and where do they appear (banner, toast, full screen, sheet)?

**Otto today (v3 frames):** Offline launch, Payment problem, Club ended, What’s new, Camera primer, Not found, Purchase couldn’t be completed.

v3 Offline launch (73:364): Home stays usable with a strip 'You’re offline. Your plan and list still work.' Payment problem (84:416): Home with 'Apple couldn’t renew Otto Club. You keep access for now.' and 'Update'. Club ended (84:477): 'Your Otto Club has ended. Every recipe, plan and list is still here, waiting for you.' with 'Resubscribe' / 'Restore purchases'. What’s new (84:557): a sheet over Home with three items ('Ask Otto by voice', 'Plan by dates', 'Search, its own tab') and 'Continue'. Camera primer (84:676): 'Snap a cookbook page … The photo isn’t kept.' with 'Continue' / 'Paste a link instead'. Not found (83:605): 'Otto couldn’t find that one. This recipe was removed. Here are a few like it.' There is no camera-denied fallback and no generic empty state.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Finch | Notifications | 2–3 | An empty notifications sheet that just says 'You're all caught up!'. With items it lists cards ('Baby Minty & Alex sent you Encouragement! · 1m ago') and a 'Clear all' pill. | study `44:2819` |
| Qantas Airways | Trips (offline) | — | Full-page offline state inside the tab: a crossed-out wifi icon, 'You’re not connected / You’re offline. Please check your connection. [IN01]', a red 'Try again', and a dark toast above the tab bar 'Unable to update. Please make sure you have an internet connection and try again.' | [Mobbin](https://mobbin.com/screens/18f77caf-19d5-4199-98b4-a36f34096d23) |
| Particle News | Home (offline) | — | An orange 'No Internet Connection' pill drops over the header while the page below shows 'There was an issue / A network error occurred: cannot parse response'. | [Mobbin](https://mobbin.com/screens/fa68f741-7d4e-4962-9c7e-15e3bf70d084) |
| Facebook | Feed error | — | The error replaces only the broken module: gear icons, 'Feed isn't available right now / There may be a technical problem. Refresh to try again.' and a blue 'Reload page', while stories and 'People you may know' still load around it. | [Mobbin](https://mobbin.com/screens/4ecaa84d-2715-42a5-acb7-47b550651e00) |
| Warby Parker | Order (payment declined) | — | An 'Error' tag over the order, then one red-bordered card: 'Please update your payment method for order no. 546203419 / When we tried to bill your order, your card was declined.' with a blue 'Update card info'. | [Mobbin](https://mobbin.com/screens/1011a84c-072f-494a-ae2e-66691a7c22cf) |
| Brink | Latest Changes | — | A What's New sheet: app icon, 'Latest Changes in Brink', 'Version 1.2.33', five icon rows with a bold title and one line ('Short Clips Control', 'Smarter Up Next', 'Bug Fixes and Polish'), and one black 'Continue'. | [Mobbin](https://mobbin.com/screens/6ce682e7-7484-4653-b71d-262d30544ea7) |
| DICK’S Sporting Goods | Scanner (camera permission) | — | The scanner stays black with the line 'Please allow camera permissions to begin scanning products.' and a full-width 'GO TO SETTINGS', shown behind the system alert '“DICK'S” Would Like to Access the Camera'. | [Mobbin](https://mobbin.com/screens/aef99718-d836-4d09-a1a4-529bb2bcdcdf) |
| Walmart | Scanner (camera primer) | — | A pre-permission sheet over the scanner: phone-camera illustration, 'Camera access required / We'll need permission to access your camera when the app is in use to scan barcodes, QR codes and more.' and 'Continue'. | [Mobbin](https://mobbin.com/screens/00dc50a7-3c1b-4eb2-9def-cee8e3ee111c) |

**Patterns across apps**
- Offline keeps the screen and adds one strip or toast; a full-screen error is only used when there is truly nothing to show (Qantas 'You’re not connected … Try again' plus a toast; Particle 'No Internet Connection' pill on top of the page).
- Errors say what happened in plain words and give one action ('Feed isn't available right now … Reload page' in Facebook, 'Connection error … Retry' in Opera).
- Billing problems are one bordered card with one button, not a modal ('Please update your payment method … your card was declined' / 'Update card info' in Warby Parker).
- What's New is a short sheet: version, three to five icon rows with a bold title and one line, and one 'Continue' (Brink 'Latest Changes in Brink · Version 1.2.33').
- Permission denied keeps the camera space and says why with a 'GO TO SETTINGS' button (DICK'S 'Please allow camera permissions to begin scanning products.'); the good pre-prompt explains before iOS asks (Walmart 'Camera access required … Continue').
- Empty states are friendly and short ('You're all caught up!' in Finch).

**Options for Otto**
- Keep the offline strip on Home and reuse it on Plan, Cookbook and Shopping. Use a toast for failed actions ('Couldn’t save. Otto will try again when you’re back online.').
- Payment problem already matches Warby Parker's one-card pattern; add the grace end date ('You keep access until Nov 18').
- What’s new matches Brink; add the version line and an icon per row.
- Add a 'Camera off' fallback after Camera primer when access is denied: 'Otto can’t see the page. Turn on Camera in Settings.' with 'Open Settings' and 'Paste a link instead', like DICK'S.
- Add a generic error screen for 'Otto can’t reach the kitchen' with 'Try again' (Opera/Facebook) for when there is no cached data.

**Juan's decisions**
- [ ] Should offline be a persistent strip or a toast that fades?
- [ ] Is the payment banner dismissible, or does it stay until Apple resolves billing?
- [ ] Does What's New show on every update or only for big releases?

## 15. Search

**Decision:** What does Search show before you type (recent, suggestions), how do filters and no-results work, and is voice a first-class input?

**Otto today (v3 frames):** Search, Search results, Search + filters.

v3 Search (83:407): '‹ Home', field 'Recipes, ingredients, what’s in the fridge', 'Browse by kind' chips (Beef, Chicken, Seafood, Vegetarian, Pasta, Soup, Breakfast, Dessert) and 'Recent' (teriyaki, quick dinners, salmon). Search results (83:476): 'teriyaki', filter chips 'Under 30 min', 'Family size', 'Vegetarian', '3 recipes' rows (Teriyaki chicken casserole · 35 min · about 450 cal · for 3 …), and 'Not what you’re after? Ask Otto for it.' Search + filters (73:281): 'quick dinners' with an 'OTTO'S PICK' card (Shakshuka · 30 min · Vegetarian · 720 CAL) and a filter icon. No mic in the field, no filters sheet, no no-results frame, no 'Clear' on Recent.

| App | Flow | Look at | What they do | Source |
|---|---|---|---|---|
| Crouton | Searching Crouton | 2–4 | Search over the library, grouped by kind. Empty field 'Folders, Recipes and More' shows Tags (High-Protein, Main dish, Meal Prep), Folders and Recipes. Typing 'Chicken' narrows to two recipe rows that show the matched ingredient ('Ingredients: 4 cups unsalted chicken stock or broth + 1 more'), and tags can be toggled on as outlined chips. | study `28:4248` |
| Cherrypick | Searching Cherrypick | 2–4 | 'Search for meals' with 'Filters' and 'Sort by Relevance' under the field. Results are two-column photo cards with author ('By Cherrypick'), rating and time ('4.8 · 55 mins'), a 'Vegetarian' tag, a bookmark and an 'Add to shop' button on every card. | study `28:1922` |
| Yazio | Filtering recipes | 2–7 | A 'Filter' sheet with 'Reset': 'Popular Filters' photo tiles (Breakfast, Low Carb, High Protein, Quickly Prepared), 'Favorites Only', an 'Energy Value' slider and grouped chips (Meals, Preparation Method, Diets). The blue button counts live: 'See 921 Recipes' → 'See 681' → 'See 94'. Results keep 'Low Carb ×' and 'Quickly Prepared ×' as chips under the field. | study `28:3543` |
| Noom | Searching for recipe | 1–3 | Field 'Try searching “Chicken”' with a 'FILTER' button. A partial word ('Chice') shows a stacked-books illustration and 'We couldn't find any matching recipes / Try searching for a more generic name, or browse all recipes.' 'Chicken' returns rows with calories and a '% of daily calorie budget' line. | study `35:2391` |
| Lifesum | Searching recipes | 1–4 | 'Find recipes' sits over the browse page (BREAKFAST, LUNCH with See all). Typing dims the page, and the search turns into a green 'STEAK ×' chip with a count badge '1' and two results with kcal and a heart. | study `45:1323` |
| MyFitnessPal | Logging a meal (voice input) | 2–5 | Voice inside search. 'Search Food' has All / My Meals / My Recipes / My Foods tabs and a row of tools (Barcode scan, Voice log, Meal scan, Quick add). 'Voice log' shows an example '"I had 1 cup of Kirkland Greek yogurt, honey, and some grapes."', 'Start Voice Logging', a listening animation, then 'Your breakfast' (Egg 72 cal, Bacon 77 cal) with 'Try Again' / 'Log' and a 'Foods Logged!' toast. | study `37:1136` |
| Keeta | Search (recent + popular) | — | Before typing: 'Recent searches' as chips (Kiyo, Japanese Restaurant · Kooyas · Japanese · Sushi) with a trash icon and an expand chevron, 'Popular searches' chips (Burgers, Pizza, Bakery, Cakes) and 'Popular brands' logos, with a mic on the keyboard. | [Mobbin](https://mobbin.com/screens/7e41c973-187c-4adc-b4c6-ada4a86e1705) |
| CREME | Search (recent) | — | Recipe-app search in dark mode: field 'What’s cooking?' with a filter button and ✕, 'Recent' as recipe rows with thumbnail and creator ('Ricotta Girella with Raw Tomato Sauce · Francesco Sarvonio'), and the keyboard mic for dictation. | [Mobbin](https://mobbin.com/screens/81c1a9c1-6a37-44fe-a2bc-557a58ee9b1b) |

**Patterns across apps**
- Before typing: recent searches with 'Clear all' plus a few suggestions (Keeta 'Recent searches' chips with a trash icon and 'Popular searches'; CREME 'Recent' as recipe rows with thumbnails).
- Results are grouped by type with tags first (Crouton: Tags, Folders, Recipes), and picked tags become selected chips you can tap off (Crouton, Lifesum 'STEAK ×').
- Filters are one sheet with grouped chips and a live count on the button ('See 921 Recipes' → 'See 94 Recipes' in Yazio, with 'Reset' top right). Applied filters come back as removable chips over the results ('Low Carb ×', 'Quickly Prepared ×').
- No results has a picture, a plain line and a next step ('We couldn't find any matching recipes / Try searching for a more generic name, or browse all recipes.' in Noom).
- Voice is a mic on the search screen that turns speech into structured items you can fix before saving (MFP 'Voice log': '"I had 1 cup of Kirkland Greek yogurt…"' → 'Your breakfast' list with 'Try Again' / 'Log').

**Options for Otto**
- Add a mic in the Search field. Voice goes to Ask Otto ('Say what’s in the fridge') and comes back as recipe matches, like MFP's voice log.
- Give 'Recent' a 'Clear' and add one row of suggestions under it (Keeta).
- Add a filters sheet behind the filter icon with grouped chips (Time, Diet, Course, Cuisine) and a live 'Show 12 recipes' button (Yazio). Applied filters stay as the chips on Search results.
- Design a no-results state: 'Otto couldn’t find “…”', 'Try a simpler word, or ask Otto to make it', with 'Ask Otto' as the button. Keep the existing 'Not what you’re after?' line as the bottom row of normal results.

**Juan's decisions**
- [ ] Does voice search go to Ask Otto (a written recipe) or only filter the library?
- [ ] Recent searches: on-device only, or synced across household members?
- [ ] Is 'Search + filters' (Otto's pick card) its own screen, or the same as Search results?

## v4 first draft (Figma page "v4 · First draft (rework)")

Four areas, 100 phones, each row with a note card (what changed vs v3, references used, Apple rule, scenario gap closed):
- **A · Getting in** (26): launch shell, Welcome (Sign in with Apple first), 7 questions with a correct "QUESTION n OF 7" count, building + first-week reveal, account with error states, paywall (billed amount largest, Monthly $4.99/month, dated trial timeline) with success / cancelled / failed / Ask to Buy, reminders primer + denial fallback.
- **B · Today, Plan & Shopping** (21): Dinner-first Today with checklist, Otto's idea card, empty and after-dinner states, billing-problem banner; week plan with swap, leftovers and an AI plan review before it commits; shopping by aisle, shared live with the household, "Always have" pantry; reminder tap opening tonight's recipe.
- **C · Recipes, Cook & Create** (25): Recipes tab with Discover | Cookbook, shared search, filters, no-results and empty states; recipe detail with servings scaler and "Add to this week"; cook mode with keep-screen-on notice, named timers, Live Activity idea, "Dinner, done"; one-box Create with camera primer/denial, write-it-myself, ask Otto, waiting, shared review, AI error that keeps the photo, limit state.
- **D · Otto, Account & system states** (28): chat with consent at first send, answer card → Add to this week / Save / Cook, error with retry, mic fallback; Account sheet (preferences, notifications, AI data off, Otto Club, household join/leave); sign out that clears this iPhone; delete account; offline, What's New, Club ended ("Your 42 recipes are safe"), returning paywall, last-tab restore.

Draft decisions to confirm (from the designers' notes): 7 questions (roadmap R1.3 says 3); building screen kept only while the real plan call runs; no paywall close (no free tier); trial on both plans (check App Store Connect); Shopping as its own tab (roadmap R4.5 has it inside Plan); one shared search on Recipes; AI consent at first send; "Add to this week" picks the next open dinner with Undo; sign-out copy says chats and journal leave with sign-out (S9).
