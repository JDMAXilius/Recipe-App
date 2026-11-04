# Otto's real assets and positioning (from the repository only)

Sources are repo paths with line numbers, relative to `/home/user/Recipe-App`, read at commit `4de70fb0` on 2026-11-04. No web sources were used.

## 1. How does Otto describe itself?

### Takeaway
Otto calls itself "the quieter kind of cookbook". It is a warm, hand-painted recipe app with an otter chef as host, and it positions itself by what it leaves out: no ads, no feed, no fake stars, no invented precision. The store copy focuses on four verbs: bring a recipe in, cook it, plan the week, ask Otto. It does not lead with a single magic moment.

### Cited Findings
- README tagline: "Otto — the quieter kind of cookbook … A warm, hand-painted recipe app led by Otto the otter chef. 750+ honest recipes, a place for yours, and nobody shouting five stars at you." — [README.md:1-6](README.md)
- App Store name: `Otto: Recipes & Meal Plans`. Subtitle: `A quieter kind of cookbook`. Keywords: `recipe,cookbook,meal plan,grocery,shopping list,cook mode,import,step by step,kitchen,no ads`. — [docs/release/STORE_METADATA.md:15-17](docs/release/STORE_METADATA.md)
- Other subtitles considered: "Save, cook, plan the week" and "Your recipes, ready to cook". — [STORE_METADATA.md:23-25](docs/release/STORE_METADATA.md)
- Promotional text: "Otto keeps every recipe you save in one place, cooks with you a step at a time, and turns the week's plan into a shopping list. No ads. No feed." — [STORE_METADATA.md:36-38](docs/release/STORE_METADATA.md)
- Description sections: "Otto is a cookbook for the recipes you actually cook." Then "Bring one in" (link, video or words, reviewed before saving, creator credited permanently), "Cook it" (one step at a time, timer within reach, servings rescale), "Plan the week" (shopping list grouped like a store, shared list "stays in step on everyone's phone"), "Ask Otto" (typing or voice), "Nutrition, honestly", "What Otto does not do" (no ads, no feed, no tracking), and "Otto Club". — [STORE_METADATA.md:52-94](docs/release/STORE_METADATA.md)
- Store-copy rules: no clichés, awards, download counts or testimonials. Never claim offline use, "AI meal planning", accurate nutrition, a recipe count, personalisation the app does not do, or a user count. — [STORE_METADATA.md:48-50, 117-119](docs/release/STORE_METADATA.md)
- Project brief: "Otto: Recipes & Meal Plans, live on the App Store." Hard paywall plus free trial. The problem: "Juan says the app feels dead, simple and like AI slop. It works, but it needs to feel alive and modern." The meal plan is "the main complaint: it is seven stacked cards, not built around dates." — [docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md:3-19](docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md)
- Voice: "One narrator, third person and warm. Otto never says 'I'. … Honesty beats charm." Reference lines: "Back to the kitchen?" / "Otto kept your place.", "Pull up a stool.", "Dinner, done. Otto's proud of you.", "Otto worked this out from the ingredients. An estimate.", "Found something good? Otto will copy it down.", "Open. No plans, no guilt." — [05_BRAND_AND_VOICE.md:91-102](docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md)
- Brand-doc warning: "Warm cream, serif and terracotta is also a common AI-generated look. The painted otter and real food are what make it Otto's." — [05_BRAND_AND_VOICE.md:79](docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md)
- Share message: "I've been cooking with Otto, the easiest way to cook: meal recipes and meal planning in one place." — [05_BRAND_AND_VOICE.md:104-105](docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md)
- Mascot: "A small river otter chef. Warm, capable, quietly delighted by food." He holds ingredients against his belly the way otters hold clams. He is "the app's host: greeting on Home, reacting to saves, napping through loads, moping at empty states." Never "hyperactive, babyish, sarcastic." — [docs/reference/MASCOT.md:13-16](docs/reference/MASCOT.md)
- Mascot expression mapping: Happy (greeting), Excited (saved, success), Thinking (search), Sleepy (loading), Sad (empty, soft error), Proud (onboarding finale, achievements). One mascot per screen. — [MASCOT.md:43-52](docs/reference/MASCOT.md)
- The early feature definition named the north star: "Otto's editorial voice + an AI cooking companion is the personalization & credibility engine that ratings/social-proof are for everyone else … the mascot becomes the recommender." — [docs/reference/otto-feature-definition.md:49-51](docs/reference/otto-feature-definition.md). This document is outdated: it assumes read-only TheMealDB data, no user-created recipes and a free tier ([otto-feature-definition.md:37-41, 106-110](docs/reference/otto-feature-definition.md)). The v2 memo reverses those calls ([otto-v2-direction-and-structure.md:5](docs/reference/otto-v2-direction-and-structure.md)), and ADR-0005 removed the free tier ([docs/adr/0005-…md:8](docs/adr/0005-hard-paywall-an-account-and-an-active-otto-club-are-required.md)).

### Inferences
- The store positioning ("quieter", "no ads, no feed", "honest") is a calm, trustworthy anti-feed stance. That stance is a mood, not a moment. Nothing in the current listing promises the user one concrete payoff such as "your week, planned in a minute".
- The founder's main complaint ("dead, simple, AI slop") points at feel and aliveness, not missing features. Any magic moment needs motion, the mascot and responsiveness, not another capability.

### Gaps
- No website copy is in this repo. The store copy links ottosapp.com ([STORE_METADATA.md:92-93](docs/release/STORE_METADATA.md)), and ROADMAP rows WEB-* refer to a `brief/AUDIT_SELF.md` that is not here ([docs/tickets/ROADMAP.md:187](docs/tickets/ROADMAP.md)).
- I did not open `STORE_METADATA_LOCALIZED.md` in detail.

## 2. Which features work today? (code evidence)

### Takeaway
The shipped app (1.0.23, build 52) is broad and real. It has import from link, social caption, pasted text and photo; streamed AI chat with voice input; a date-keyed week plan; a store-grouped shopping list that syncs live across a household; a full cook mode with timers and a "Dinner, done" finish; an on-device USDA nutrition engine with golden tests; a cooked journal; share cards; dinner reminders; and mascot states with sound and haptics. The catalogue in production holds 795 recipes.

### Cited Findings
- **Version and test baseline:** app at 1.0.23 (build 52). 351 `node --test` tests on main. No device journey suite. — [docs/tickets/REWORK_ROADMAP.md:3, 32](docs/tickets/REWORK_ROADMAP.md)
- **Import (link):** "import-recipe — URL → recipe draft via schema.org JSON-LD. Deterministic, no LLM on that path." — [supabase/functions/import-recipe/index.ts:1-2](supabase/functions/import-recipe/index.ts)
- **Import (social):** for TikTok it reads the official oEmbed caption, and for Instagram and others the og:description. It deliberately drops the image ("social CDN image URLs expire; no photo beats one that breaks next week"). — [import-recipe/index.ts:237-257, 282, 295-319](supabase/functions/import-recipe/index.ts)
- **Import (photo):** `generate-recipe` has a vision mode (photo → transcribed recipe) on gpt-5.1, with the friendly error "That photo's a bit big for Otto. Try a smaller, clearer shot." — [supabase/functions/generate-recipe/index.ts:15, 350-356](supabase/functions/generate-recipe/index.ts)
- **Import (review before save):** the Add sheet takes a URL, pasted text or a photo, and the result opens in the editor for review. Attribution stays permanent. — [README.md:20, 75](README.md); claims table [STORE_METADATA.md:105-106](docs/release/STORE_METADATA.md)
- **Ask Otto chat with streaming:** "Chat mode with stream:true … relayed as our own SSE: {"type":"delta","text"}". — [generate-recipe/index.ts:196-197](supabase/functions/generate-recipe/index.ts). Voice input through expo-speech-recognition streams interim transcripts into the composer. — [src/features/chat/useSpeechInput.ts:1-2](src/features/chat/useSpeechInput.ts). The recipe editor's "Ask-Otto row" hands a half-written recipe to the chat. — [README.md:21](README.md)
- **AI consent:** asked once per provider and names OpenAI, before the first AI call. **Exists.** — [REWORK_ROADMAP.md:24](docs/tickets/REWORK_ROADMAP.md)
- **Plan:** `plan_entries` are keyed by real dates (`YYYY-MM-DD`). "Dates already exist". The UI still shows 7 stacked cards, which is the founder's main complaint. — [REWORK_ROADMAP.md:21](docs/tickets/REWORK_ROADMAP.md); [01_PROJECT_BRIEF.md:19](docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md). README: "Otto's week: a loose 7-day planner (no meal-slot guilt) … 'What's cooking tonight?' surfaced on Discover." — [README.md:25](README.md)
- **Shopping list:** "one row per ingredient with summed quantities, aisle sections, provenance ('for World's Best Lasagna'), check-offs that never reorder mid-store, your own extras." — [README.md:26](README.md)
- **Household live list:** Supabase Realtime `postgres_changes` channels for members and for the list. — [src/features/household/useHousehold.ts:72-74, 140](src/features/household/useHousehold.ts). README: "everyone adds to and checks off the same list in real time". — [README.md:27](README.md)
- **Cook mode:** mise en place, big-type steps with painted Otto action art (chop, mix, sauté and so on), tappable durations that start named timers, a timer hub, alarm sound and vibration, keep-awake, swipe navigation, exit protection, and a Proud-Otto finish with "Snap your plate". — [README.md:13](README.md). The finish screen reads "Dinner, done." — [src/features/cook/CookScreen.tsx:345](src/features/cook/CookScreen.tsx). "Snap your plate" button — [CookScreen.tsx:401](src/features/cook/CookScreen.tsx); dismissal toast "No worries. Snap your plate any time." — [CookScreen.tsx:112](src/features/cook/CookScreen.tsx)
- **Ratings prompt tied to a cooking moment:** the system review sheet fires about 1.5 s after the 3rd lifetime finished cook, with a 90-day cooldown, "so the sheet lands after the 'Dinner, done.' beat". Planned triggers not yet built: "B (5th clean import) and C (shared-list payoff)". — [src/features/cook/reviewPrompt.ts:1-14](src/features/cook/reviewPrompt.ts); [docs/tickets/ROADMAP.md:212](docs/tickets/ROADMAP.md)
- **Nutrition engine:** runs "on-device with zero network calls". A bundled USDA table, a parse to grams, a lookup, and a compute step with guards for raw versus cooked, coverage and kcal plausibility. Only an unseen ingredient goes to `resolve-nutrition` (an OpenAI model picks a real USDA record), and the answer is cached forever. "no LLM in the render path." — [README.md:61-63](README.md). The guards return null rather than a guess and fall back to a category estimate; serving plausibility is capped at 700 g. — [src/features/nutrition/engine/guards.ts:27, 182](src/features/nutrition/engine/guards.ts). There is a golden test file with 12 `test(` cases. — [src/features/nutrition/engine/golden.test.mjs](src/features/nutrition/engine/golden.test.mjs)
- **Nutrition coverage:** computed figures exist for 675 of 755 seed recipes. The rest show a category estimate marked `~`. — [.claude/skills/otto-lead/SKILL.md:32-37](.claude/skills/otto-lead/SKILL.md)
- **Catalogue size:** "Prod catalogue: 795 recipes, 0 missing titles, 14 categories, public read policy." Build 38 reads `otto_recipes` with zero TheMealDB proxy calls. — [docs/release/APP_REVIEW_2.1_RESPONSE.md:157](docs/release/APP_REVIEW_2.1_RESPONSE.md). The README says "750+". — [README.md:5, 12](README.md)
- **Anonymous read:** `otto_recipes` is readable by `anon`, "So a first week can be built before the account." — [REWORK_ROADMAP.md:20](docs/tickets/REWORK_ROADMAP.md)
- **Reminders:** local notifications "Tonight in your kitchen" / "{dish}. Ready to start cooking?" and "Plan your week" / "A fresh week ahead. What are you cooking?" — [src/features/notifications/notifications.logic.ts:80-92](src/features/notifications/notifications.logic.ts). Permission is requested from the Notifications screen. — [REWORK_ROADMAP.md:25](docs/tickets/REWORK_ROADMAP.md)
- **Share:** `ShareCard.tsx`, `ShareListCard.tsx`, capability tokens (`token.ts`) and a rendered share image (`shareImage.native.ts`). — `src/features/share/`. There are no universal links yet. "Share cards are images/text." — [REWORK_ROADMAP.md:27](docs/tickets/REWORK_ROADMAP.md)
- **Journal:** a private "snap your plate" cooking journal (`src/features/journal/JournalScreen.tsx`, `journal.logic.ts`). — [README.md:31](README.md)
- **Mascot states in code:** a `MascotMood` set that includes thinking, excited, proud and sleepy, with cut-out PNGs. — [src/shared/assets.ts:9-14, 34-42](src/shared/assets.ts). Shared components `OttoLoading` ("Warming up the kitchen…" with tips) and `OttoError` ("We dropped the pan.") — [src/shared/ui/OttoStates.tsx:20-51](src/shared/ui/OttoStates.tsx)
- **Sound and haptics:** sound events `save | send | stepDone | allDone | gentleError`. — [src/shared/sound.ts:21](src/shared/sound.ts). Haptics wrap success, warning and error notification feedback. — [src/shared/haptics.ts:11-28](src/shared/haptics.ts). Motion is a single `src/shared/motion.ts` (reanimated helpers), not a folder. Native tabs (motion M7) are installed but not used. — [REWORK_ROADMAP.md:23](docs/tickets/REWORK_ROADMAP.md)
- **Offline:** the query cache persists for a week (Cookbook, Plan and Shopping work offline). — [REWORK_ROADMAP.md:28](docs/tickets/REWORK_ROADMAP.md)

### Inferences
- The "aha" beats already in code are mostly at the end of a task: the cook-mode finish ("Dinner, done. Otto's proud of you." plus the proud otter and the allDone sound), a clean import, and the shared list updating on another phone. The ratings-prompt design (triggers A, B, C) already treats those three as the app's happiest moments.
- All of these moments sit behind the hard paywall. A new user meets none of them before paying (see section 4).

### Gaps
- I did not run the app or the tests, so "works today" rests on code and docs, not on a device check.
- I did not confirm the exact count of OttoStates variants (empty states and so on) beyond loading and error.
- The cooked-history stats ("earned stats (cooked/saved/yours)") were confirmed in the README only. — [README.md:31](README.md)

## 3. What is unique or unusually polished, and what is table stakes?

### Takeaway
The table-stakes features are browse, save, the recipe detail screen, cook mode, the planner, the shopping list and AI chat. Several pieces stand out: honest nutrition computed on the device from USDA data, with no LLM in the render path and one `~` glyph for estimates; permanent credit for imported recipes, including TikTok and Instagram captions; a household list that syncs live; a store-aisle list that never reorders mid-shop; painted action art in cook mode; and a consistent third-person otter voice. "Open. No plans, no guilt." exists as a voice line in the brand doc, but I did not find it in the app code.

### Cited Findings
- The reference-app study lists browse, search, recipe detail, save, the serving stepper and the subscription slot as "table-stakes". It lists cook mode, estimated nutrition, video, cook-with-what-you-have, the shopping list, the planner, AI Ask and the mascot as differentiators that other apps (Crouton, ReciMe, SideChef, MFP, Duolingo, Finch) already have. — [otto-feature-definition.md:9-31](docs/reference/otto-feature-definition.md)
- Honesty laws: "Never fabricate data: no fake ratings, cook times, social proof, trending, or precision the source lacks." "Attribution is immutable." "No dead-end or unwired UI." "Never bury delete-account." — [.claude/skills/otto-lead/SKILL.md:29-40](.claude/skills/otto-lead/SKILL.md)
- Founder decision (2026-07-19): repeating the estimate caveat "reads as anxiety, not honesty", so one `~` glyph carries it. — [SKILL.md:35-37](.claude/skills/otto-lead/SKILL.md)
- Semantic ink: terracotta marks computed or interactive content, ink marks what people wrote. "null beats a guess." — [README.md:59](README.md)
- Store copy treats "no ads" as "both a real differentiator and a phrase people type". — [STORE_METADATA.md:29-30](docs/release/STORE_METADATA.md)
- What Juan liked in the original: the painted onboarding scenes and category art, the warm voice lines, the paw save, the calorie pill, the macro dots, the nutrition ring and the shopping notepad. — [02_WHAT_JUAN_WANTS.md:47-51](docs/redesign-2026-11/docs/02_WHAT_JUAN_WANTS.md)
- "Open. No plans, no guilt." appears only as a voice reference line. — [05_BRAND_AND_VOICE.md:102](docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md). A grep for "no guilt" in `src/` and `app/` found nothing. The README describes the planner as "no meal-slot guilt". — [README.md:25](README.md)

### Inferences
- The most defensible differentiators are trust and calm: honest numbers, credited sources, no feed. The most emotional asset is the painted otter, together with the cook-finish beat. The household live list is the most "magical" thing technically, because a change shows up on another phone, but it needs two people.
- Chat, import and planning are table stakes among AI recipe apps. Otto's edge there is tone and honesty, not the capability itself.

### Gaps
- There is no competitor benchmark in this repo beyond the reference-app lists. Other researchers should check uniqueness against the market.

## 4. The new flow: what is the first value moment today, and what is planned?

### Takeaway
Today the first run is splash → sign-up → three paintings → hard paywall → tabs. Nothing of value appears before the account and the money ask. The first real value comes after the trial starts, and it is whatever the user does first (browse, import, chat). The planned flow moves value ahead of the account: three questions, a taste swipe, a "Building" step and then **"Your first week"**, a plan built on the device from `otto_recipes`. Only after that come "Save your plan" (the account), the paywall with no X and reminders. Otto AI becomes the trailing circle in the tab bar. ADR-0009 is still only **Proposed**.

### Cited Findings
- "today: splash → sign up → 3 paintings → paywall → 5 tabs / next: launch shell → Welcome → 3 questions → your first week → save your plan (account) → Otto Club (no X) → App Store sheet → you're all set → reminders → 4 tabs + Otto". "The new flow moves value before the account." — [REWORK_ROADMAP.md:40-46](docs/tickets/REWORK_ROADMAP.md)
- ADR-0009 (Status: **Proposed**, 2026-11-04): "Today's first run is sign-up → three painted scenes → paywall, so nothing of value is shown before the account and the money ask." The decision is the questions, then your first week (built on the device from `otto_recipes`), then save your plan, then Otto Club. It "Keeps ADR-0005 intact". — [docs/adr/0009-…md:1-20](docs/adr/0009-first-run-shows-value-before-the-account-questions-first-wee.md)
- Flow map (otto-next.html): "Splash → Welcome → Paintings → Questions → Taste → Building → Your first week → Save your plan → Reminders → Otto Club · no X → Welcome to the Club → Home". "Show the plan, take the account, then the paywall." "New: Taste swipe · Building · Your first week: the plan reveal before the account and the paywall." It borrows "The plan reveal right before a paywall with no ×" from Cal AI and "the food questions and the taste swipe" from Cherrypick. — [docs/flow-maps/maps/otto-next.html](docs/flow-maps/maps/otto-next.html) (text extracted from the HTML; I did not record line numbers)
- The order of reminders and paywall is inconsistent. The map's summary line puts reminders before the paywall ("Dinner reminders: Once, after Save your plan and before the paywall (Yazio's and Cal AI's spot)"). The roadmap says "reminders move to after the purchase" and its flow string puts reminders after "you're all set". — [otto-next.html](docs/flow-maps/maps/otto-next.html) versus [REWORK_ROADMAP.md:44-45, 53](docs/tickets/REWORK_ROADMAP.md)
- Otto AI: "Otto, the AI, as the separate circle at the trailing end … (Juan, 2026-11-04: talking with Otto is the app's big feature)". The ＋ Create tab goes away. — [REWORK_ROADMAP.md:55-57](docs/tickets/REWORK_ROADMAP.md); ADR-0008 (`docs/adr/0008-…md`)
- Juan's list of "ideas worth evaluating": a Today home built around tonight's dinner, a week date strip, "A short personal setup that produces a real first week before the paywall", chat answers as real recipe cards, widgets and a lock-screen timer, "Animated, reactive otter moments". — [02_WHAT_JUAN_WANTS.md:56-64](docs/redesign-2026-11/docs/02_WHAT_JUAN_WANTS.md)
- Preferences are diet and cuisines only, stored on the phone. ADR-0010 moves them to the account. — [REWORK_ROADMAP.md:19, 68](docs/tickets/REWORK_ROADMAP.md)

### Inferences
- The planned first-week reveal is the only candidate magic moment that comes before the paywall. Under ADR-0005 it has to sell the trial alone. Everything else (cook finish, import, live list, chat) happens after payment, so those moments drive retention, not conversion.
- The founder said talking with Otto is the big feature. Yet the reveal as designed is deterministic and built on the device, with no AI. A version that uses chat (for example, Otto explains the week in his voice) would need AI consent before the account and is not in the plan.

### Gaps
- There are no screen specs here for the "Building" animation or the "Your first week" reveal; they live in Figma `r9QxxN5qDQXjW473H7LKgM`, which I did not open.

## 5. Evidence of what users love (metrics, reviews, TestFlight, founder)

### Takeaway
I found no user metrics, App Store reviews, TestFlight tester quotes or analytics in the repo. The only "what people love" signal is the founder's own feedback: he likes the painted art, the warm voice lines and the original sign-in, and he says the app feels "dead" and the plan is "the main complaint". He also says talking with Otto is the big feature.

### Cited Findings
- A grep across `docs/` for love, aha, magic, wow, delight combined with user, tester, feedback or review found no user feedback. The only hits were reference-study and motion-research text (for example HIG: "Don't mistake delight for decoration"). — [docs/motion/MOTION_RESEARCH.md:49](docs/motion/MOTION_RESEARCH.md)
- No analytics SDK (posthog, amplitude, mixpanel) appears in `package.json` (grep returned nothing).
- The ratings-prompt follow-up triggers "wait until there are ratings to compare against", so no ratings data exists yet. — [reviewPrompt.ts:6-8](src/features/cook/reviewPrompt.ts)
- The TestFlight group "Otto Insiders" exists, but the docs only mention it for sandbox purchase tests. — [docs/tickets/ROADMAP.md:131](docs/tickets/ROADMAP.md)
- Founder statements: "feels dead, simple and like AI slop" — [01_PROJECT_BRIEF.md:19](docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md). The current flow "is not the worst, but it's definitely not there" — [docs/tickets/TERMINAL_TICKET_FLOW_REDESIGN.md:8](docs/tickets/TERMINAL_TICKET_FLOW_REDESIGN.md). "talking with Otto is the app's big feature" — [REWORK_ROADMAP.md:56-57](docs/tickets/REWORK_ROADMAP.md). What he liked — [02_WHAT_JUAN_WANTS.md:47-51](docs/redesign-2026-11/docs/02_WHAT_JUAN_WANTS.md)

### Inferences
- Any claim that users love a given moment would be invented. The report should frame magic-moment candidates as hypotheses to test, for example with the Otto Insiders TestFlight group or by instrumenting the trial-to-paid step.

### Gaps
- There are no conversion, retention or trial-start numbers. Nothing in the repo says how many people use the app.

## 6. Constraints that bound any magic moment

### Takeaway
A hard paywall means no use without an account and an active Club; the trial counts as active. The trial lasts one week, and the price is $39.99/yr or $4.99/mo. The app is light only, with one style. AI consent names the provider and comes before the first AI call. The honesty laws forbid fake social proof, invented precision and dead UI. The mascot rules allow one Otto per screen, never over food photos, never stretched.

### Cited Findings
- ADR-0005 (Accepted): "subscription-only: nobody uses Otto without an account and the `club` entitlement (the free trial counts)." — [docs/adr/0005-…md:3-8](docs/adr/0005-hard-paywall-an-account-and-an-active-otto-club-are-required.md)
- The paywall has no X and no "Not now": "can't use Otto without starting the trial". — [src/features/profile/OttoClubScreen.tsx:23](src/features/profile/OttoClubScreen.tsx). Prices `PRICE_YEAR = 39.99`, `PRICE_MONTH = 4.99`. — [STORE_METADATA.md:114](docs/release/STORE_METADATA.md) citing `OttoClubScreen.tsx:27-28`. "1-week free trial". — [STORE_METADATA.md:82-83](docs/release/STORE_METADATA.md); [README.md:33](README.md). The trial length comes from the store (`club.trialDays`). — [OttoClubScreen.tsx:55](src/features/profile/OttoClubScreen.tsx)
- Still missing on the paywall: purchase outcomes are toasts instead of screens, there is no one-line benefit and the trial terms carry no dates. — [REWORK_ROADMAP.md:22](docs/tickets/REWORK_ROADMAP.md)
- Light only, no Dark Mode (D7, ADR-0007). — [REWORK_ROADMAP.md:74](docs/tickets/REWORK_ROADMAP.md)
- Mascot art rules: cut-outs on cream, at least 48 pt, never stretched or tinted, never over food photography, one Otto per screen. "Juan's latest request to make Otto feel alive may require changing some rules, such as animation. Flag those changes." — [05_BRAND_AND_VOICE.md:81-89](docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md)
- Honesty laws. — [SKILL.md:29-40](.claude/skills/otto-lead/SKILL.md)
- Lock-screen timer (Live Activity) is deferred to P2. — [REWORK_ROADMAP.md:73](docs/tickets/REWORK_ROADMAP.md)

### Inferences
- A magic moment before the paywall must run without an account and, in the current plan, without AI. The first-week reveal from `otto_recipes` fits both. It also must not use fake social proof ("10,000 cooks love this") or a fake "AI personalising…" step that implies more than the code does, because "Building" would mislead if nothing is being built.

### Gaps
- Whether the founder would allow one AI call before the account, after consent, is not decided anywhere in the repo.
