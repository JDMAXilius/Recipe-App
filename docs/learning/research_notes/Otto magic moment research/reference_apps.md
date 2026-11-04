# Reference apps: magic moment, core promise and retention hook

Status: draft · Research notes, web sources gathered 2026-11-04 · Onboarding screen facts come from the repo's Mobbin/Figma study (`docs/flow-maps/research/02_REFERENCE_APP_FLOWS.md`, cited as [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)).

Method note: web search worked, but page fetches failed for most hosts in this session (superwall.com, thegrocer.co.uk, blog.duolingo.com, irrationallabs.com, apps.apple.com could not be reached from the sandbox). Many findings below therefore come from search-result summaries of those pages, not full reads. Facts are labelled **[company]** (stated by the company or its staff), **[vendor]** (a vendor/partner with a commercial interest), **[press]**, or **[estimate]** (third-party analytics or blogs). Screen counts are from the local Mobbin/Figma study, where Mobbin samples about 5 screens per flow, so "~" counts are estimates.

## Duolingo: first lesson before sign-up, streaks and their documented effect

### Takeaway
Duolingo's magic moment is finishing a first lesson (and seeing a placement result) before any account or payment ask; the streak is the retention engine, called by its retention PM "our biggest growth lever", backed by more than 600 streak A/B tests and disclosed shareholder-letter figures. Its paywall is not in onboarding at all: it sits at friction points (ads, hearts) after the habit has formed.

### Cited Findings
**Promise and first run**
- Onboarding: welcome (Get started / I already have an account) → "Hi I'm Duo, 7 quick questions" → language, source, level, why, daily goal ("I'm committed") → "50 words in week 1" → notification primer + iOS alert → "what you can achieve in 3 months" → from scratch / find my level → placement result ("Start at Score 10") → **profile wall with "Later"** → name/SSO → find friends → path. About 24 screens in the Figma study. — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- No paywall in onboarding; Super is offered at friction (interstitial "Skip ads, 7 days free"). — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- **[company, via interview]** Duolingo's Gotthilf (growth) in a First Round interview, quoted by Taplytics: letting users "do a lesson, see the set of skills" without signing up raised sign-up metrics significantly, and "simply moving the sign-up screen back a few steps led to about a 20% increase in DAUs." — [Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding)
- **[estimate]** StriveCloud reframes the same change as a 20% jump in next-day retention and cites a 2012 baseline of 12% next-day retention; this is a different metric from the DAU quote and is secondary. — [StriveCloud](https://strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- **[estimate]** Appcues attributes an 8.9% free-to-paid conversion rate to Duolingo's onboarding system; I found no primary source for it. — [Appcues](https://www.appcues.com/blog/the-10-best-user-onboarding-experiences)

**Streaks: company-stated effects**
- **[company]** Learners who reach a 7-day streak are 2.4x more likely to use Duolingo the next day than learners without a streak. — [Duolingo blog: Improving the streak](https://blog.duolingo.com/improving-the-streak)
- **[company]** Learners who reach a 7-day streak are 3.6x more likely to complete their course. — [Duolingo blog: How the streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- Caveat: both are observational comparisons (committed learners both build streaks and stay), not causal estimates.
- **[company, experiments]** Streak Wager (bet to keep the streak 7 more days): day-7 retention +14%. Weekend Amulet: learners 4% more likely to return a week later, 5% less likely to lose their streak. Streak Freeze (equip up to two): +0.38% daily active learners. Decoupling the streak from the daily XP goal (any one lesson counts): +40% learners on a 7+ day streak; just over half of daily learners now hold a 7+ day streak vs about a third a year earlier. — [Duolingo blog: Improving the streak](https://blog.duolingo.com/improving-the-streak); [Making Duolingo: streaks](https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals) (figures surfaced via search summaries; verify exact wording on the posts)
- **[company, podcast]** Jackson Shuttleworth (Group PM, Retention) on Lenny's Podcast, 15 Dec 2024: 600+ streak A/B tests, about half fail; focus on the first 0–7 days; streak-referencing notifications drive DAU; streak freezes are a major DAU driver; changing the CTA from "Continue" to "Commit to my goal" was "a massive win"; streaks have been "our biggest growth lever". — [Lenny's Newsletter episode](https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks); summaries at [recall.it](https://www.recall.it/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team) (secondhand summaries)

**Shareholder-letter numbers**
- **[company]** Q4 2024: over 10 million users maintain streaks of one year or longer; one-third of DAUs have a Friend Streak. — [Duolingo Q4 FY24 8-K](https://www.sec.gov/Archives/edgar/data/1562088/000156208825000039/q4fy24duolingo12-31x24pres.htm)
- **[company]** CURR (Current User Retention Rate: share of current-user DAUs who return the next day) is Duolingo's main stickiness metric and was reported at an all-time high in 2025–2026. — [Duolingo Q3 FY25 8-K](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25press.htm); [CX Dive](https://www.customerexperiencedive.com/news/duolingos-user-retention-hits-all-time-high-as-app-boosts-stickiness/827499/)
- **[company]** Q4 2025: DAU growth decelerated through 2025; 2026 DAU growth guided to about 20%; management said extra monetization friction is part of why DAU growth slowed and chose to prioritise user growth over monetization. — [Duolingo investor materials](https://investors.duolingo.com/static-files/961ce633-3cee-49d0-bd7a-2c63731d45fb)
- **[company]** Q2 2026: "Streak Revival" one-time event (restore longest streak by completing three lessons): 15.4 million learners revived streaks, nearly 8 million of whom had no active streak; called one of its most successful campaigns; revived users retained better than a typical re-engaged cohort. DAU +23% YoY to 58.7M (per call transcript). — [Bullfincher Q2 FY26 call](https://bullfincher.io/companies/duolingo/earnings-call/fy2026-q2); [Longport](https://longportapp.cn/news/295028818)

### Inferences
- Time to magic moment is a few minutes: ~7 questions then a real lesson; account and money come after value.
- The 2025 "monetization friction slowed DAU" admission is a direct warning for any app that puts value behind a wall too early.
- Streak flexibility (freezes, one-unit-counts, revival) beats streak strictness; the streak unit should be the smallest meaningful action.

### Gaps
- No controlled company figure for "streak causes X% retention" beyond the individual experiment lifts.
- Q3 2026 letter not found. App Store subtitle not verified (apps.apple.com unreachable).
- Reviewer love/complaint themes for Duolingo not researched in this pass (time budget); widely known guilt-trip notification criticism is not sourced here.

## Cal AI: snap a photo → calories, plan reveal before paywall, revenue and conversion

### Takeaway
Cal AI front-loads a long (~30-screen) "investment" questionnaire, reveals a personalised calorie/macro plan, and puts a hard paywall immediately after the reveal; the in-app magic moment (photo → calories) comes only after paying. It is the most aggressive and most commercially successful (and most criticised) model in the set.

### Cited Findings
- Sequence (34 screens in Figma): gender, workouts, source, tried other apps, results chart, height/weight, DOB, goal, desired weight, "realistic" reassurance, speed slider, "2x vs on your own", obstacles, transition chart, "Thank you for trusting us", Apple Health (Not now), rollover, rate us, primed notifications, **Save your progress (Skip)** at screen 27, referral, "generating plan", **plan ready**, **hard paywall** (3-day trial), home. Mobbin variant adds "try for free / we'll remind you" and an 80%-off-forever offer after dismiss. Core loop: ＋ → camera → analyzing card → rings update. — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- **[company, founder]** Zach Yadegari: extra onboarding questions raised conversion because users invest more time; investment questions and animated screens each tested and kept only when they lifted conversion. — [Founderpath](https://founderpath.com/resources/zach-yadegari-cal-ai-onboarding-tests-and-influencer-marketing)
- **[vendor]** Superwall case study: 123 experiments across 46 trigger points; trial-to-paid conversion +31%; monthly revenue grew more than 3x in 10 months; onboarding paywall went through 61 meaningful experiments. — [Superwall case study](https://superwall.com/case-studies/cal-ai)
- **[company/estimate, conflicting]** Revenue: ~$9M collected as of May 2025, founder said "a little over 10" — [Latka interview](https://getlatka.com/interviews/cal-ai-zach-yadegari-2025); $40M annual revenue in March 2026 per Latka citing Yahoo Finance — [Latka](https://getlatka.com/companies/calai.app/team); 15M downloads and $30M annual revenue — [NetInfluencer](https://www.netinfluencer.com/cal-ai-founder-zach-yadegari-breaks-down-the-influencer-playbook-behind-his-apps-growth/); "$35M in one year" — [Latka blog](https://getlatka.com/blog/how-cal-ai-achieved-35-million-revenue-in-just-one-year).
- **[press]** MyFitnessPal acquired Cal AI in March 2026, undisclosed, reported nine-figure deal (NetInfluencer says December 2025; press around the April 2026 removal says March). — [9to5Mac](https://9to5mac.com/2026/04/21/popular-calorie-tracker-briefly-pulled-from-app-store-over-iap-and-billing-violations/); [Cult of Mac](https://www.cultofmac.com/news/why-app-store-pulled-cal-ai-app)
- **[press]** April 2026: Apple briefly pulled Cal AI for violating Guidelines 3.1.1, 3.1.2(c) and 5.6 — a Stripe payment flow without Apple's IAP option, and a paywall showing weekly pricing more prominently than the amount actually billed; reinstated after fixes and back to #4 in Health & Fitness. — [9to5Mac](https://9to5mac.com/2026/04/21/popular-calorie-tracker-briefly-pulled-from-app-store-over-iap-and-billing-violations/); [PiunikaWeb](https://piunikaweb.com/2026/04/16/cal-ai-removed-from-app-store-viral-payment-sheet-post/)
- **[estimate]** Pricing cited at $2.49/month or $29.99/year. — [eesel](https://www.eesel.ai/blog/cal-ai)
- **[estimate]** Review themes: main complaints are subscription/billing (unexpected costs, no upfront pricing, trial auto-billing, deleting app does not cancel); photo accuracy fine for simple whole foods, weaker on mixed dishes ("hallucinations"); lag/instability. Praise: effective for weight loss/gain goals. Company claims 90% accuracy. — [eesel pricing](https://www.eesel.ai/en/blog/cal-ai-pricing); [Kimola](https://kimola.com/reports/unveil-user-insights-on-cal-ai-calorie-tracker-app-store-us-155190); [myclaw](https://myclaw.ai/blog/cal-ai-reviews)

### Inferences
- The "plan reveal" is a proxy magic moment that is shown before payment; the real one (photo → numbers) is gated. It converts, but it is exactly what Apple and reviewers punish when pricing is unclear.
- For Otto: a personalised result before the paywall is effective; paywall pricing must show the billed amount at least as prominently as any per-week framing (3.1.2(c)).

### Gaps
- No company-disclosed trial-to-paid rate or retention numbers. App Store subtitle not verified.

## MyFitnessPal: calorie goal, barcode scan, why logging is the habit

### Takeaway
MFP's first value is the computed daily calorie goal at the end of a ~20-screen questionnaire plus account creation; its habit is daily food logging, and its 2022 move of barcode scanning behind Premium showed how much users treat the fastest logging path as the product.

### Cited Findings
- Sequence: value carousel (Sign up free / Log in) → "Let's customize" with Continue/Google/Apple at screen 4 → name, up to 3 goals, encouragement, habits, meal planning, activity, sex/age/country, height/weight/goal, weekly goal → data consents → **create account** → (24-screen version) **Premium, 1-month trial, ×** → Today. Logging: meal → search → detail → added. Tabs Today · Plan · ＋ · Progress · More. — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- **[press]** August 2022: barcode scanning moved to Premium ($19.99/month or $79.99/year); free users can still search the database; 50% off offered ahead of backlash; reviews "tanked". — [Droid Life](https://www.droid-life.com/2022/08/24/myfitnesspal-puts-barcode-scanner-behind-premium-paywall/); [Slashdot/The Verge](https://news.slashdot.org/story/22/08/25/1955238/myfitnesspal-paywalls-barcode-scanner-that-made-counting-calories-easy); [Digital Trends](https://digitaltrends.com/phones/myfitnesspal-barcode-scanning-not-free-premium-subscription)
- **[estimate]** 2026 analysis of 300 recent reviews: barcode scanner is the most-cited single feature in negative reviews (27 mentions). — [Unstar](https://unstar.app/blog/is-myfitnesspal-premium-worth-it-paywall-app-reviews-2026)
- **[vendor, competitor]** Nutrola "data report": 6-month retention by primary logging method — AI photo 58%, barcode 44%, manual 32%. Correlational, competitor marketing. — [Nutrola](https://nutrola.app/en/blog/ai-photo-vs-manual-vs-barcode-tracking-outcomes-250k-users-data-report-2026)
- **[academic]** Weeklong field study: users were less likely to keep using photo-based logging than text-based logging (counterpoint to the vendor claim). — cited in [SnappyMeal arXiv paper](https://arxiv.org/pdf/2511.03907) search context
- MFP now owns Cal AI (March 2026). — [9to5Mac](https://9to5mac.com/2026/04/21/popular-calorie-tracker-briefly-pulled-from-app-store-over-iap-and-billing-violations/)

### Inferences
- Logging is the habit because each log updates the "remaining today" number against the goal — a daily closing loop. Friction on the log action (paywalling the fastest input) is felt as taking the product away.
- For Otto: the equivalent "fast input" (adding a recipe to the plan, ticking a shopping item) should never feel paywalled once someone is in.

### Gaps
- No company-stated activation/retention figures found; subtitle not verified; no before/after retention data on the barcode paywall.

## Tiimo: visual planning for ADHD, when it clicks

### Takeaway
Tiimo's promise is a visual, colour-coded day for neurodivergent people; its click moment (by reviewer accounts) is seeing one's own day laid out visually and finding it the first planner that works for an ADHD brain. It asks for an account first, uses social proof then a soft paywall, and was Apple's iPhone App of the Year 2025.

### Cited Findings
- Sequence (16 screens): splash (ADA badge) → **sign up (Apple/email)** at screen 2 → marketing opt-in → biggest need → neurodivergent? → "500,000 happy users" → **paywall (annual 7-day trial, ×)** → notifications (Skip) → import calendar → Today. Newer variant moves reminders to a home "Get started" checklist. Only 2 questions. — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- **[company/Apple]** App Store listing: iPhone App of the Year 2025, Apple Design Awards finalist 2024, Neurodiversity Awards Best Assistive Technology 2022; colour-coded daily overview, drag-and-drop, brain-dump to-do with AI priority grouping, focus timer; designed for ADHD, autism, stress, anxiety; free tier = basic planner, limited AI chats, one profile. Listing names seen: "Tiimo: Daily To Do AI Planner", "Tiimo - Visual Daily Planner". — [App Store](https://apps.apple.com/app/tiimo/id1480220328); [AppFollow](https://apps.appfollow.io/ios/tiimo-to-do-list-planner/1480220328?country=us)
- **[press]** TWiT review: 2025 App of the Year for neurodiversity-focused design; learning curve, involved initial setup; visual, energetic interface may not suit people who want ultra-simple planners. — [TWiT](https://twit.tv/posts/tech/how-tiimo-makes-task-and-time-management-easier-neurodiverse-users)
- **[reviews]** ~4.6 stars; representative review: tried multiple focus apps and "this is the only one that has actually helped". — [AppFollow](https://apps.appfollow.io/ios/tiimo-to-do-list-planner/1480220328?country=us)
- **[estimate, conflicting]** Pricing: $54/yr or $12/mo after 30-day trial vs $11.99/mo or $45/yr. — search summaries; verify on store.

### Inferences
- The click is identity-based ("built for brains like mine") plus visual — the reveal is the user's own day rendered calmly. For Otto, the analogue is seeing *my* week of dinners laid out visually.

### Gaps
- No company retention numbers; no first-hand quotes of "the moment it clicked" beyond generic praise (App Store pages could not be fetched).

## Headspace: first meditation, streaks, mindful notifications

### Takeaway
Headspace's magic moment is the first completed meditation (a few minutes); the documented growth lever is getting new users to start that first session and nudging them with deep-linked, gentle pushes. Its paywall (trial timeline) sits before the course recommendation is revealed.

### Cited Findings
- Sequence (sampled 21 screens): "Breathe in" splash → **create account** → what's on your mind → quiz intro ("we'll reveal your course") → style quiz ×5 → **paywall with trial timeline (today / day 12 / day 14)** → result "For Calm Explorers like you" → Today. Cancel flow offers 50% off. — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- **[vendor]** Phiture: campaigns nudging new users to a first meditation with rich pushes deep-linking to popular packs → +14% first-meditation starts, +109% week-1 retention. — [Phiture](https://phiture.com/success-stories/headspace-retention/)
- **[vendor/research partner]** Irrational Labs + Purchasely redesigned free-trial onboarding (adding a quiz) and roughly doubled course starts, but the title states users "still didn't meditate more" — a start is not a habit. — [Irrational Labs](https://irrationallabs.com/case-studies/headspace-doubled-course-starts/); [Luma event](https://luma.com/qioatv6c)
- **[teardown]** Earlier onboarding asked experience level to set session length, then suggested a first meditation. — [Appcues GoodUX](https://goodux.appcues.com/blog/headspaces-mindful-onboarding-sequence)
- **[user account]** Sessions end with a reminder of the streak (days in a row). — [Jack Neary Substack](https://jackbneary.substack.com/p/what-we-give-up-when-we-give-in-to)

### Inferences
- Lesson for Otto: measure the habit (a second cook / second week planned), not the start; a quiz can inflate starts without changing behaviour.

### Gaps
- No primary Headspace source on "run streak" or notification philosophy found; subtitle not verified; review themes not researched.

## Cherrypick: meal plan + groceries in one tap, supermarket basket

### Takeaway
Cherrypick (the closest analogue to Otto) promises "Your meals & groceries, sorted": a taste swipe produces "Your meal matches are ready", then the week's plan converts into a real Tesco/Sainsbury's basket; the felt magic moment is the basket filling itself. No paywall in onboarding; a Pro trial auto-starts with a banner countdown.

### Cited Findings
- Sequence (22 screens): welcome ("Your weekly meals and groceries, sorted") → Plan/Cook/Shop value screens → what matters (testimonial) → video "26% less UPFs" → who you plan for → diet → "only show matching recipes?" → dislikes ×4 (allergy warning) → taste swipe → **"Your meal matches are ready — create account" (Skip)** → "meal-plan and shop in under 2 min" → Plan tab with "Pro trial ends in 7 days" banner. Tabs Plan · Shop · Cook · You. ~13 question screens. — [Local flows](../../../flow-maps/research/02_REFERENCE_APP_FLOWS.md)
- **[company/store]** App Store: "Cherrypick: Plan | Shop | Cook", "Your meals & groceries, sorted"; "your weekly meals and groceries, sorted in minutes from your favourite supermarket". ~3,135 ratings, 2,541 five-star (GB). — [App Store GB](https://apps.apple.com/gb/app/cherrypick-plan-shop-cook/id1567423761); [Sensor Tower](https://app.sensortower.com/api/ios/apps/1567423761?country=GB)
- **[press]** Partners with Sainsbury's and Tesco for products and fulfilment; baskets built in the app are bought at the supermarket's online store; 330,000+ households (2024); formerly Lollipop. Introduced Plus and Pro paid tiers while keeping a free option. — [FoodNavigator](https://www.foodnavigator.com/Article/2024/06/27/Cherrypick-A-new-recipe-box-competitor); [The Grocer: paid tiers](https://thegrocer.co.uk/news/shopping-platform-cherrypick-to-introduce-paid-for-tiers/692727.article); [The Grocer: rebrand](https://thegrocer.co.uk/news/meal-planning-and-shopping-platform-lollipop-rebrands-as-cherrypick/687537.article)
- **[company]** Analysis of 100,000+ orders: users cut ultra-processed food by 26%. — search summary of store/press material
- **[estimate, conflicting]** Funding ~$6.2M–$7.35M seed (2021–2022; Speedinvest). — [Speedinvest](https://speedinvest.com/portfolio/cherrypick); [CB Insights](https://cbinsights.com/company/lollipop)
- **[reviews]** Users praise mixing planned meals with ordinary shopping (toilet roll, cereal) and cooking at least three new meals a week. — [App Store GB](https://apps.apple.com/gb/app/id1567423761)
- **[press, context]** Tesco separately trialled its own in-app AI assistant that finds recipes and adds ingredients to the basket — a direct competitive threat to the model. — [The Grocer](https://www.thegrocer.co.uk/news/tesco-launches-meal-planning-basket-building-in-app-ai-assistant/717474.article)
- No source names Ocado as a partner.

### Inferences
- The magic moment has two beats: "these meals are for me" (taste swipe result) then "my shop is done" (basket). Both sit before any money ask.
- The weekly shop is a natural, non-gamified retention cadence: the habit is "plan + shop once a week", not a daily streak.

### Gaps
- No Cherrypick activation/retention/conversion numbers; Pro price not verified; full Grocer articles unreadable.

## Yazio: plan reveal and fasting timer

### Takeaway
Yazio follows the Cal AI/MFP questionnaire → plan → paywall pattern (with discount gimmicks during onboarding), and its free intermittent-fasting timer is the daily return hook. Data is thin and almost entirely third-party.

### Cited Findings
- **[estimate]** Free tier includes a basic fasting timer, fasting/eating reminders and a fasting quiz; guided fasting programs (schedule, eating-window reminders, education) are Pro. — [NutriScan](https://nutriscan.app/blog/posts/yazio-pricing-2026-free-vs-pro-what-pro-unlocks-33b26f8fc7)
- **[estimate]** Discounted annual $23.90 offered during onboarding or seasonal sales; a spin-to-win discount can appear in onboarding. — [NutriScan Pro worth it](https://nutriscan.app/blog/posts/yazio-pro-worth-it-2026-4f450da831)
- **[reviews]** Mixed on onboarding: "you will have to answer hundreds of onboarding questions before you use the app"; another calls it awful with an aggressive subscription pitch; a 2026 review calls it friendly rather than overwhelming. — [Nutrola review](https://nutrola.app/en/blog/is-yazio-still-good-2026); search summaries of App Store reviews
- **[estimate]** AppGoblin: ~1.3M MAU, ~$100K+/month revenue (42% IAP / 58% ads) — Android-only estimate, likely understates. — [AppGoblin](https://appgoblin.info/apps/com.yazio.android)

### Inferences
- The fasting timer is a "live countdown" hook: a running state that gives a reason to open the app several times a day, independent of logging.

### Gaps
- Yazio was not in the local Mobbin study, so screen-by-screen onboarding and the plan-reveal screen are unverified. No company metrics; subtitle unverified.

## Cross-app comparison and patterns for a subscription meal-planning app

### Takeaway
Every app shows a personalised result before the money ask; they split on whether the paywall gates the core action (Cal AI, Headspace: hard/near-hard) or the habit is allowed to form first (Duolingo, Cherrypick). Retention comes from a short, repeatable loop matched to the domain's natural cadence (daily for language/logging/meditation, weekly for meal planning).

### Cited Findings (table synthesised from sections above; see their sources)

| App | Core promise | Questions before value | Magic moment | Account wall | Paywall vs magic moment | Return hook | Best documented number |
|---|---|---|---|---|---|---|---|
| Duolingo | Learn a language, free, fun | ~7 | First lesson + placement result | After, "Later" | No onboarding paywall; at friction | Streak, streak-referencing push, friend streaks | Sign-up moved later → ~20% DAU [company, interview]; 7-day streak 3.6x course completion [company] |
| Cal AI | Photo → calories | ~25 screens | Plan reveal (proxy); photo scan after paying | Late, Skip | Hard, right after reveal; 3-day trial; 80% off on dismiss | Logging rings | Trial-to-paid +31% over 123 tests [vendor]; $30–40M ARR [estimate] |
| MyFitnessPal | Calorie goal + logging | ~15 | Daily calorie goal | Screen 4 intent, created at end | Soft, 1-month trial, after account | Daily food log vs goal | None found |
| Tiimo | Visual day for ADHD | 2 | My day, visual | First | Soft, after social proof | Visual Today, reminders, focus timer | App of the Year 2025 [Apple] |
| Headspace | Calmer mind | ~6 | First meditation | First | Soft trial timeline, before course result | Streak shown after session, reminders | +14% first meditations, +109% week-1 retention [vendor] |
| Cherrypick | Meals & groceries, sorted | ~13 | "Matches ready" → supermarket basket | After matches, Skip | None in onboarding; Pro trial auto-starts | Weekly plan + shop | 330k households; 26% less UPF [company] |
| Yazio | Calories + fasting | many (unverified) | Plan reveal / fasting timer start | unverified | In onboarding, with discount offers | Fasting countdown | None reliable |

### Inferences (patterns that generalise to Otto)
1. **Show the user's own result before any wall.** Duolingo's lesson, Cal AI's plan, Cherrypick's "matches ready". For Otto: a real, personalised week of dinners (and its shopping list) rendered before the Club paywall.
2. **Every question must visibly shape the reveal.** Cal AI proves "investment" questions lift conversion; Headspace shows a quiz can lift starts without lifting habit. Ask only what changes the plan.
3. **Account wall framed as saving the result, with Skip/Later**, beats account-first (Duolingo ~20% DAU). Otto requires an account (ADR-0005), so it should come right after the reveal as "Save your week", not first.
4. **Paywall straight after the reveal converts, but must be honest.** Cal AI's April 2026 removal (weekly price shown above billed amount, 3.1.2(c)) is the boundary.
5. **Don't paywall the fastest action once the habit exists** (MFP barcode backlash; Duolingo admitting monetization friction slowed DAU).
6. **Match the loop to the domain cadence.** Meal planning is weekly: the hook is "plan next week" + "shop" (Cherrypick), with smaller daily beats ("tonight's dinner", cooked check-off). A weekly streak with freezes is the Duolingo lesson translated.
7. **Make the streak forgiving and the unit small** (one lesson counts, freezes, revival) and reference it in notifications; prime notifications with a custom screen first (all apps).

### Gaps
- Activation/retention numbers are scarce outside Duolingo; most other figures are vendor or estimate grade.
- Several primary pages (Duolingo blog, Superwall, The Grocer, Irrational Labs, App Store listings) could not be fetched from this sandbox; their figures come from search summaries and should be spot-checked before quoting externally.
