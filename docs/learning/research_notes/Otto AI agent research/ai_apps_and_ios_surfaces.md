# AI-first food apps and iOS ambient surfaces (research notes for Otto)

Status: draft · research notes, not verified against code · 2026-11-04
Scope: (A) how other products put AI at the centre of food/planning and "AI controls the app"; (B) iOS system surfaces (widgets, Live Activities, controls, notifications, calendar) and what Expo SDK 54/55 can reach.
Method note: ~24 web searches, most via search-result summaries; expo.dev could not be fetched from this session (host blocked), so Expo facts come from docs.expo.dev search snippets, GitHub and third-party write-ups. Treat secondary-source numbers as indicative.

## A1. AI-first food apps: what the AI actually does, praise/complaints, usage data

### Takeaway
The products that are winning commercially let AI *act on the object* (build the plan, fill the basket, log the meal from a photo), not just chat. Instacart (in ChatGPT, Dec 2025) and Tesco (in-app, April 2026) both go from "what's for dinner?" straight to a filled cart; Cal AI turned "photo → log" into a reported $30M+/year business that MyFitnessPal bought. Pure recipe-chat (Ask Instacart 2023, Yummly) did not create a durable product on its own.

### Cited Findings
**Ollie (AI family meal planner)**
- iOS app "Ollie AI: Family Meal Planner" (Confabulation Corp.), ~4.8 stars on ~900 ratings; subscription with free trial that requires a payment method — [App Store](https://apps.apple.com/us/app/ollie-ai-family-meal-planner/id6480014476)
- Directory descriptions: AI learns family preferences, builds weekly plans, auto grocery lists, Instacart / Amazon Fresh delivery hand-off; a separate broader "Ollie" assistant does schedule coordination, school-email monitoring and daily briefings (directory sources, not official) — [stork.ai](https://stork.ai/en/ollie); [Neil Patel AI tools](https://aitools.neilpatel.com/ai_tools/ollie-ai/); [AppAdvice](https://appadvice.com/app/ollie-ai-family-meal-planner/6480014476)

**Samsung Food (Food AI / Vision AI)**
- Vision AI added to paid tier Food+ (IFA 2024): photograph groceries with the phone, identified ingredients go to the Food List; recipe recommendations prioritise items near use-by date — [Samsung Newsroom UK](https://news.samsung.com/uk/upgraded-samsung-food-raises-the-bar-for-food-experiences-at-ifa-2024); [SamMobile](https://sammobile.com/news/samsung-food-update-scan-ingredients-using-phone)
- Food+ costs $6.99/month (noted as a possible deterrent) — [SamMobile](https://sammobile.com/news/samsung-food-update-scan-ingredients-using-phone)
- CES 2025: Samsung TVs recognise food on screen and generate a recipe for it — [TechRadar](https://techradar.com/computing/artificial-intelligence/samsungs-ai-tv-will-help-you-cook-that-delicious-dish-on-your-screen)
- Family Hub fridges get Instacart ordering — [Tom's Guide](https://tomsguide.com/home/smart-home/your-samsung-smart-fridge-can-soon-pester-you-to-order-groceries-from-instacart)

**Cal AI (photo calorie logging) → MyFitnessPal**
- TechCrunch-derived 2025 figures: retention above 30%, monthly revenue above $2M — [eesel.ai summary](https://www.eesel.ai/blog/cal-ai)
- Acquired by MyFitnessPal; reported ~$30M+ (or $30–40M) annual revenue; deal date reported inconsistently (Dec 2025 vs March 2026) — [Let's Data Science](https://letsdatascience.com/news/cal-ai-sells-to-myfitnesspal-after-rapid-growth-f789c949); [PrivSource](https://www.privsource.com/acquisitions/deal/myfitnesspal-acquires-cal-ai-JOSngD)
- Company claims ~90% accuracy on visible food, concedes hidden-ingredient dishes (soups, smoothies) are harder — [RaftLabs teardown](https://www.raftlabs.com/blog/cal-ai-product-teardown)
- Independent test of four photo-calorie apps published 2026 (HealthDay) — [HealthDay](https://www.healthday.com/health-news/nutrition/how-accurate-are-photo-based-calorie-apps-4-are-put-to-the-test)
- Recurring review complaints: wrong calories/portion sizes, free-trial billing friction — [Kimola review analysis](https://kimola.com/reports/unveil-user-insights-on-cal-ai-calorie-tracker-app-store-us-155190)

**MyFitnessPal AI meal planning**
- Acquired Intent (meal-planning startup) — announced 12 Feb 2025; "Meal Planner" creates plans for individuals and families from goals, preferences, dietary habits and routines; auto grocery lists + ingredient ordering from e-retailers; Premium+ at $99.99/yr in US/UK/IE/CA/AU/NZ, spring 2025 — [Fitt Insider press release](https://insider.fitt.co/press-release/myfitnesspal-aquires-intent-revolutionizing-personalized-meal-planning/); [Android Authority](https://androidauthority.com/myfitnesspal-acquires-intent-3525696); [Bloomberg Law](https://news.bloomberglaw.com/tech-and-telecom-law/myfitnesspal-to-offer-ai-meal-plans-after-quietly-buying-startup)

**Instacart**
- Ask Instacart (31 May 2023): ChatGPT-powered search bar returning meal ideas + recommended ingredients to add to cart — [TechCrunch](https://techcrunch.com/2023/05/31/instacart-in-app-ai-search-tool-powered-by-chatgpt/); [Instacart](https://instacart.com/company/updates/bringing-inspirational-ai-powered-search-to-the-instacart-app-with-ask-instacart)
- Instacart app in ChatGPT (Dec 2025): first app in ChatGPT with Instant Checkout — find items, build cart, pay without leaving chat; uses the Agentic Commerce Protocol + Stripe; invoked by starting a prompt with "Instacart", sign-in on first use; US Plus/Pro/logged-in free users — [Instacart investor release](https://investors.instacart.com/news-releases/news-release-details/instacart-app-launches-openai-chatgpt-first-company-offer-new); [TechRadar](https://techradar.com/ai-platforms-assistants/chatgpt/instacart-brings-instant-checkout-to-chatgpt); [Digital Commerce 360](https://www.digitalcommerce360.com/2025/12/12/instacart-debuts-its-new-chatgpt-app/)

**Tesco AI assistant (not 2025 — April 2026)**
- In-app trial: converse to get personalised recipe ideas, then it builds a basket from purchase history and preferences, accounting for ingredients already at home; first to 280,000 colleagues, all customers "later this year"; built with Tomoro AI in alliance with OpenAI — [The Grocer](https://www.thegrocer.co.uk/news/tesco-launches-meal-planning-basket-building-in-app-ai-assistant/717474.article); [Fruitnet](https://www.fruitnet.com/fresh-produce-journal/tesco-trials-ai-assistant-to-help-people-write-their-shopping-lists/271146.article); [Resultsense](https://www.resultsense.com/news/2026-04-09-tesco-ai-shopping-assistant-trial.html)
- Retailer pattern: Walmart, Tesco and Albertsons "turn dinner questions into instant carts" — [PYMNTS](https://www.pymnts.com/?p=3649597)
- 2024 controversy: CEO said Clubcard data could warn shoppers about unhealthy baskets; Tesco then said no plans to advise on eating habits — [ITV](https://itv.com/news/2024-09-18/tesco-could-use-ai-to-nudge-customers-towards-a-healthier-shopping-basket)

**Yummly (shut down)**
- Whirlpool laid off Yummly's entire team (~75) in April 2024 and shut the site/app by 20 Dec 2024; limited export (users told to PDF recipes); domain redirected to KitchenAid — [The Spoon](https://thespoon.tech/whirlpool-lays-off-entire-team-for-cooking-and-recipe-app-yummly); [Plan to Eat blog](https://www.plantoeat.com/blog/2024/12/yummly-is-closing-discover-the-best-meal-planning-alternative); [Wikipedia](https://en.wikipedia.org/wiki/Yummly)

**ChatGPT as platform**
- Apps SDK previewed at DevDay (6 Oct 2025): built on MCP; apps connect data, trigger actions and render interactive UI inside ChatGPT; invoked by name or suggested in context; launch partners Booking.com, Canva, Coursera, Figma, Expedia, Spotify, Zillow; submissions + directory later — [InfoQ](https://infoq.com/news/2025/10/openai-dev-day); [YourStory](https://yourstory.com/ai-story/openai-devday-2025-chatgpt-apps-agentkit-gpt5-api)

### Inferences
- "Act, don't chat" is the dividing line: every durable example ends in a state change (cart filled, plan written, meal logged). For Otto, AI that edits the Plan and the grocery list is the product; a free-text chat tab alone repeats Ask Instacart 2023.
- Big retailers and ChatGPT now own "dinner question → cart". Otto's defensible ground is the household-specific plan (allergens, who eats what, what was cooked) rather than shopping.
- Photo input is a proven "magic" moment (Cal AI, Samsung Vision AI) but accuracy complaints are the top review theme; any Otto photo feature (fridge scan, recipe-from-photo) needs an edit/confirm step.
- Yummly's closure shows recipe users punish lock-in: export is a trust feature.
- An Otto ChatGPT app (Apps SDK/MCP) is a plausible later distribution channel, but it moves the experience out of Otto's subscription surface.

### Gaps
- No sourced data found for Whisk (now part of Samsung Food), ChefGPT, DishGen, Mealime AI, HelloFresh AI, Google Gemini meal planning or Perplexity in this pass.
- No public retention/usage data for Ollie, Samsung Food AI or MyFitnessPal Meal Planner; launch of MFP Meal Planner not confirmed.
- No rigorous novelty-decay study of AI features in food apps found; the "magic vs gimmick" point is inference.

## A2. Non-food references for "AI controls the app"

### Takeaway
The 2025 pattern is agents that perform multi-step edits inside the product's own data (Notion 3.0) and AI that explains rather than replaces the core loop (Duolingo). Duolingo shows paid AI tiers stay small (Max ~5–8% of subscribers) and that a good AI explainer eventually becomes a free table-stakes feature.

### Cited Findings
- Notion 3.0 (18 Sep 2025): Agents that create docs, build/update databases and run multi-step workflows, "over 20 minutes of multi-step actions" with memory stored in Notion pages/databases; Custom Agents run on schedules/triggers — [Notion release 3.0](https://notion.com/releases/2025-09-18); [The Decoder](https://the-decoder.com/notion-3-0-introduces-ai-agents-for-documents-workflows-and-team-automation/)
- Duolingo Max share of subscribers: 5% (early 2025) → 7% (Q1 2025) → 8% (Q2 2025 call) — [Motley Fool](https://www.fool.com/investing/2025/08/08/duolingos-pushy-paywall-play-smart-or-risky/); [Q2 2025 transcript](https://www.insidermonkey.com/blog/duolingo-inc-nasdaqduol-q2-2025-earnings-call-transcript-1586291/)
- Video Call being A/B-tested for Super subscribers (~10× more Super than Max); Explain My Answer made free for all users Jan 2026 (secondary sources) — [Duolingo Guides](https://duolingoguides.com/?p=7254); [Sergey substack Q1 2025](https://sergeycyw.substack.com/p/duolingo-q1-2025-earnings-analysis)
- Todoist Quick Add recognises and highlights dates in the task text ("Buy milk tomorrow 9am"); parsing is aggressive (e.g. "monthly" read as a date) and the user can tap the highlight to revert it — [Todoist help](https://www.todoist.com/help/articles/introduction-to-dates-and-time-q7VobO); [Todoist Quick Add](https://todoist.com/help/articles/115001745265)
- App Intents are the shared action layer: the same intent powers widget buttons, Siri and Shortcuts — [Swiftjectivec](https://swiftjectivec.com/snip-create-a-basic-interactive-widget-using-app-intent-button)

### Inferences
- Todoist's "highlight what I parsed, tap to undo" is the right pattern for an Otto input like "tacos Thursday 7pm for 4": show the parsed day/time/servings as chips before committing.
- One App Intents layer (e.g. `SwapTonightIntent`, `MarkCookedIntent`, `AddToListIntent`) would serve widgets, controls, Siri/Apple Intelligence and notification actions at once — worth designing as Otto's "verbs" even before native work.
- Duolingo's numbers argue against a separate AI tier; Otto's single Otto Club tier (ADR-0005) fits.

### Gaps
- Not researched with sources this pass: Apple Intelligence + App Intents schemas (WWDC24/25), Shopify Sidekick, Klarna's assistant metrics, Fantastical's parser.

## A3. Dynamic, pressable cards and gesture discoverability

### Takeaway
Swipes and long-presses have no visual affordance, so they must be a shortcut, never the only path; every card action needs a visible fallback (button/menu).

### Cited Findings
- Hidden interactions (long press, swipe) are by definition gestures with no visual cue — [GhostUI paper, arXiv 2601.19258](https://arxiv.org/html/2601.19258)
- Norman & Tognazzini: gesture UIs lack discoverability; no way to see possible operations by looking at the screen — [ignorethecode summary](https://ignorethecode.net/blog/2015/11/12/usability_on_mobile_getting_worse/)
- Vendor guidance: give a small preview of the hidden state (peek) and always a non-gesture fallback (long-press menu, ⋯ button, edit mode); its "30–50% of first-time users miss swipes" figure is unsourced — [Dolfy blog](https://www.dolfy.ai/blog/swipe-to-delete-gesture-discoverability-mobile-apps)
- Multi-finger/complex gestures are hard for users with limited motor skills — [Create with Swift](https://www.createwithswift.com/navigating-pitfalls-the-dos-and-donts-of-gestural-interfaces)

### Inferences
- For Otto's Tonight/Plan cards: visible primary action ("Cook", "Swap"), long-press context menu duplicating swap/move/mark-cooked/dismiss, swipe as accelerator, and a one-time peek animation to teach the swipe.
- Tinder-style swipe fits a deck of *suggestions* (accept/reject) better than a plan (where moves need a target day).

### Gaps
- No NN/g article was returned by search; NN/g's gesture guidance and any quantified discoverability study remain unsourced here. iOS context-menu HIG and Apple Photos/Music Memories patterns not researched.

## B1. WidgetKit, Live Activities, Controls, Action button, iOS 26

### Takeaway
iOS 17+ widgets can run App Intents from buttons/toggles without opening the app; iOS 18 controls bring the same intents to Control Center, Lock Screen and the Action button; iOS 26 carries iPhone widgets to CarPlay. Live Activities suit a cook-timer session but are capped at ~8 hours active (+4 h on the Lock Screen).

### Cited Findings
- Interactive widgets (iOS/iPadOS 17): `Button(intent:)` runs the App Intent's `perform()` then iOS reloads the timeline; same intent reusable for Siri/Shortcuts — [TechCrunch](https://techcrunch.com/2023/06/06/yes-interactive-widgets-are-coming-to-iphone-too-in-ios-17/amp/); [Swiftjectivec](https://swiftjectivec.com/snip-create-a-basic-interactive-widget-using-app-intent-button); [Kodeco](https://raywenderlich.com/43771410-interactive-widgets-with-swiftui?page=2)
- Controls (iOS 18): WidgetKit `ControlWidget` (button/toggle) driven by App Intents; can run an action, open the app to a view, or launch a locked-camera capture extension; usable in Control Center, Lock Screen and Action button (iPhone 15 Pro+); no custom layouts — [Apple: Creating controls](https://developer.apple.com/tutorials/data/documentation/widgetkit/creating-controls-to-perform-actions-across-the-system.md); [WWDC24 10157](https://developer.apple.com/videos/play/wwdc2024/10157/?time=9); [MacStories](https://www.macstories.net/stories/ios-and-ipados-18-the-macstories-review/4/)
- iOS 26: iPhone widgets (incl. third-party) appear in CarPlay/CarPlay Ultra, with Liquid Glass and Live Activities in CarPlay; visionOS 26 spatial widgets — [TechCrunch](https://techcrunch.com/2025/06/09/apple-adds-widgets-and-message-tapbacks-to-carplay-with-ios-26); [Engadget](https://engadget.com/mobile/smartphones/apple-reveals-new-ios-26-features-and-its-liquid-glass-redesign-at-wwdc-2025-171650243.html)
- Live Activity limits: updates for ~8 hours, then can stay on Lock Screen up to 4 more hours (12 h total); Dynamic Island clears when it ends — [Apple Developer Forums](https://developer.apple.com/forums/thread/797676)

### Inferences
- Best-fit Otto surfaces: (1) "Tonight" home/Lock Screen widget with a Swap / Cooked button; (2) a Live Activity started from Cook mode for step + timer (well within 8 h); (3) a "What's for dinner" control/Action-button shortcut. StandBy reuses the small widget.
- Because ADR-0007 is light-only, widgets must still render correctly in system tinted/clear (Liquid Glass) modes — the system, not Otto, picks those.

### Gaps
- Accented/tinted rendering mode details for iOS 26 widgets and widgets on macOS not sourced in this pass; StandBy specifics not sourced.

## B2. Calendar: EventKit write-only vs ICS feed

### Takeaway
On iOS 17+ an app can add events with write-only access (or with no permission at all via the system event editor), but cannot read or later update what it wrote reliably; a backend ICS subscription feed (as Plan to Eat does) keeps the calendar in sync as the plan changes and works in Google/Outlook too, at the cost of an unguessable URL that must be treated like a secret.

### Cited Findings
- `requestWriteOnlyAccessToEvents` (iOS 17): asks once; needs `NSCalendarsWriteOnlyAccessUsageDescription`; apps on iOS 17 SDK without the new keys are auto-denied; old `requestAccess` throws — [Apple docs](https://developer.apple.com/documentation/eventkit/ekeventstore/requestwriteonlyaccesstoevents(completion:).md); [TN3152](https://developer.apple.com/documentation/technotes/tn3152-migrating-to-the-latest-calendar-access-levels.md)
- Under write-only, reads return no events; `EKEventEditViewController` lets users add an event with no store permission — [Apple: Accessing the event store](https://developer.apple.com/documentation/eventkit/accessing-the-event-store.md)
- expo-calendar: config-plugin option `writeOnlyCalendarPermission` sets the write-only key (iOS 17+); write-only can create events but not read/update/delete calendars; `addEventWithForm` presents the system dialog with at least write-only permission; there is also a newer `calendar-next` API — [Expo Calendar (latest)](https://docs.expo.dev/versions/latest/sdk/calendar/); [Expo Calendar next](https://docs.expo.dev/versions/latest/sdk/calendar-next/); [v52](https://docs.expo.dev/versions/v52.0.0/sdk/calendar/)
- Plan to Eat: "Share Planner with Calendar App" gives iCal URLs (All / Recipes / Ingredients / Notes); iOS "Add Subscription Calendar" gives real-time updates; Google Calendar/Outlook mobile can't add subscriptions — must use the web — [Plan to Eat help](https://learn.plantoeat.com/help/share-your-meal-plan-to-your-calendar-app); [Plan to Eat other calendars](https://learn.plantoeat.com/help/share-your-meal-plan-with-other-calendar-software)
- Paprika: drag-and-drop planner calendar; no evidence found of an ICS export feed — [Wikipedia](https://Www.wikipedia.org/wiki/Paprika_(app))

### Inferences
- Recommended for Otto: an ICS feed from a Supabase Edge Function (per-user random token, revocable, minimal content e.g. "Dinner: Lemon chicken" + deep link, no allergens/household data in the event body), offered as "Subscribe in Calendar" (webcal://). Optional one-off "Add to Calendar" via `addEventWithForm` needs no permission prompt.
- Dinner as a timed event (e.g. user-chosen dinner time, 30–60 min) gives a useful alert; breakfast/lunch are better all-day or omitted to avoid clutter — this is a design judgement, not sourced.
- Google subscriptions refresh slowly (commonly hours); verify before promising "instant".

### Gaps
- Refresh intervals for Google/Apple subscribed calendars not sourced; Mealime, Notion and sports-app calendar sync not researched.

## B3. Notifications and Expo feasibility

### Takeaway
Widgets, Live Activities and controls all require native Swift targets; Expo can host them via `@bacons/apple-targets` (experimental, works on SDK 54) or the new `expo-widgets` (SDK 55, alpha). Calendar and notification categories are reachable from JS today.

### Cited Findings
- Time-sensitive notifications: set `interruptionLevel = .timeSensitive` (or `interruption-level` in the APNs payload) and enable the capability in Xcode; levels passive/active/time-sensitive/critical — [WWDC21 10091](https://developer.apple.com/videos/play/wwdc2021/10091/); [WWDC Notes](https://wwdcnotes.com/documentation/wwdc21-10091-send-communication-and-time-sensitive-notifications/)
- Old Expo forum answer: time-sensitive not possible via expo-notifications at the time (may be outdated) — [Expo forums](https://forums.expo.dev/t/any-way-to-send-new-time-sensitive-ios-15-notifications-via-expo/58668)
- `@bacons/apple-targets` (expo-apple-targets): config plugin generating widget/App Clip etc. targets from `/targets`, outside `/ios`; "highly experimental, not part of any official Expo workflow"; mirrors app App Group entitlements; `ExtensionStorage` writes shared `UserDefaults` and `reloadWidget()` refreshes timelines; `npx create-target widget` — [GitHub](https://github.com/EvanBacon/expo-apple-targets); [Context7 docs](https://context7.com/evanbacon/expo-apple-targets)
- `expo-widgets` ships in SDK 55 as alpha; layouts authored with Expo UI components; Live Activity layouts for Lock Screen and Dynamic Island slots; `enablePushNotifications` for APNs Live Activity updates; dev build required (not Expo Go) — [Expo blog (via search)](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo); [React Native Relay guide](https://reactnativerelay.com/fr/article/widgets-ecran-accueil-live-activities-expo-widgets-guide-complet-react-native-2026); [ITNEXT](https://itnext.io/live-activities-in-react-native-expo-widgets-and-why-brownies-are-best-shared-with-friends-b9bba8a06ddc)

### Feasibility table (Otto on Expo SDK 54)

| Surface | Route in Expo | Native Swift needed? | Effort / risk |
|---|---|---|---|
| Home/Lock Screen "Tonight" widget (read-only) | `@bacons/apple-targets` + App Group `ExtensionStorage`; or `expo-widgets` after SDK 55 upgrade | Yes (SwiftUI) with apple-targets; JSX via Expo UI with expo-widgets | Medium; experimental tooling |
| Interactive widget buttons (Swap, Cooked) | Same, plus an App Intent in the target that writes shared state / calls backend | Yes (App Intent) | Medium–high; sync back to app/Supabase is the hard part |
| Live Activity cook timer + Dynamic Island | `expo-widgets` (SDK 55 alpha) or apple-targets + a native module to start it | Yes for apple-targets path | Medium; ≤8 h limit fine |
| Control Center / Action button control | apple-targets widget target with `ControlWidget` | Yes | Medium; iOS 18+ |
| Calendar one-off add | `expo-calendar` `addEventWithForm` | No | Low |
| Calendar write-only events | `expo-calendar` + `writeOnlyCalendarPermission` | No | Low; cannot read back/update |
| ICS subscription feed | Supabase Edge Function returning text/calendar; `webcal://` link | No (backend) | Low–medium; token privacy |
| Notification actions ("Cooked it", "Swap") | expo-notifications categories | No (per Expo API; method names not verified here) | Low |
| Time-sensitive dinner reminder | Entitlement + `interruption-level` in push payload | Possibly config plugin | Low–medium; Expo support unverified |

### Inferences
- Cheapest high-value sequence: ICS feed + notification actions (pure JS/backend) → read-only Tonight widget → interactive widget + cook-timer Live Activity → control.
- expo-widgets being alpha in SDK 55 suggests waiting for one more SDK before relying on it; apple-targets is the working path on SDK 54.

### Gaps
- expo.dev blog/docs pages could not be fetched (host not allowed in this session); `setNotificationCategoryAsync` signature and expo-notifications `interruptionLevel` support were not confirmed; react-native-widget-extension not researched.
