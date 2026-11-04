# Specifying and Verifying Behaviour of a Production Mobile App: Specs, Test Strategy, Fixtures and Quality Artifacts

Running example throughout: **Otto**, a recipe / meal-planning iOS app (React Native / Expo), Supabase backend, subscriptions via RevenueCat (Otto Pro), and an AI chat assistant.

**Method / sourcing note (read first).** This session's network allowed github.com and web search, but blocked direct fetches of martinfowler.com, kentcdodds.com and kiro.dev (DNS refused). Claims tagged **[verified]** were confirmed from a fetched page or search result this session. Claims tagged **[canonical, not fetched]** cite the well-known primary URL from background knowledge. The definitions are long-established and stable, but the report writer should treat their exact wording as unverified in this session. Example lines for Otto are my own illustrations, not sourced facts.

---

## 1. Specifications: functional spec, technical spec, acceptance criteria, Definition of Done, spec-driven development, executable specs, BDD/Gherkin, example mapping

### Takeaway
These terms sit at different levels. A **functional spec** says *what* the product does for users. A **technical spec** (design doc) says *how* it is built. **Acceptance criteria** are pass/fail conditions for *one story*. The **Definition of Done** is a *team-wide* quality bar that applies to *every* item. BDD/Gherkin and Specification by Example turn acceptance criteria into concrete examples, and those examples become executable specs. Since 2025, "spec-driven development" (SDD) mostly means *structured Markdown specs that an AI coding agent works from* (GitHub Spec Kit, Kiro, Tessl). That is a different lineage from BDD's executable specs, though the two overlap.

### Cited Findings

**Term-by-term reference**

| Term | Precise meaning | Commonly confused with | Canonical source | Format | Otto one-liner |
|---|---|---|---|---|---|
| Functional spec (PRD / product spec) | Describes the externally observable behaviour and user-facing requirements of a feature: what it does, for whom, and why. Says nothing about implementation. | Technical spec | Industry convention (Joel Spolsky, "Painless Functional Specifications", joelonsoftware.com, 2000) [canonical, not fetched] | Prose doc + user stories + flows/wireframes | "Free users can save up to 10 recipes; on the 11th save they see the Otto Pro paywall." |
| Technical spec / design doc / RFC | Describes *how* it is built: architecture, data model, APIs, trade-offs, rejected alternatives, rollout. | Functional spec; ADR (an ADR records one decision) | Google-style design docs; ADRs (Michael Nygard) [canonical, not fetched] | Markdown doc with Context / Goals / Non-goals / Design / Alternatives / Risks | "Entitlement check reads `CustomerInfo.entitlements.active['pro']` from the RevenueCat SDK and caches it, with Supabase webhook mirroring as source of truth server-side." |
| Acceptance criteria (AC) | Story-specific conditions that must hold for *that* story to be accepted. Testable, binary. | DoD; test cases | Agile / Scrum practice; often written as Given/When/Then or as EARS (see Kiro) | Bullet list or Gherkin scenarios attached to a ticket | "Given a free user with 10 saved recipes, when they tap Save on another, then the paywall is shown and the recipe is not saved." |
| Definition of Done (DoD) | A formal description of the state the Increment is in when it meets the quality measures required for the product. Applies to *all* backlog items. | Acceptance criteria | The Scrum Guide (scrumguides.org, 2020 edition) [canonical, not fetched] | Team checklist | "Code reviewed; unit + component tests green; VoiceOver labels on new controls; no new Sentry errors in TestFlight for 24h; analytics event added." |
| Spec-driven development (2025 sense) | An AI-agent workflow in which a structured spec (requirements, then plan, then tasks) is written and reviewed *before* the agent writes code. The spec is the primary artifact. | BDD / executable specs; classic waterfall SRS | GitHub Spec Kit; AWS Kiro; Tessl; Böckeler (martinfowler.com, Oct 2025) | Markdown files in repo (`spec.md`, `plan.md`, `tasks.md`, or `requirements.md`/`design.md`/`tasks.md`) | `specs/012-meal-plan-share/spec.md` lists user stories + AC + `[NEEDS CLARIFICATION: can free users receive shared plans?]` |
| Executable specification | A spec written as concrete examples that are also run as automated tests, so it cannot drift from the code ("living documentation"). | SDD (an SDD spec is read by an agent; it is not itself executed as a test) | Gojko Adzic, *Specification by Example* (Manning, 2011) [canonical, not fetched]; cucumber.io | Gherkin `.feature` files, FitNesse tables, or plain test code with readable names | `paywall.feature` run by Cucumber/Maestro in CI |
| BDD | A collaborative practice: discover behaviour through conversations about examples, formulate them in domain language (Gherkin), then automate them. Tools are secondary. | "Using Cucumber" | Dan North, "Introducing BDD" (2006); cucumber.io/docs/bdd [canonical, not fetched] | Conversations, then `.feature` files, then step definitions | see Gherkin below |
| Gherkin | The structured plain-language grammar Cucumber uses: `Feature`, `Rule`, `Scenario`/`Example`, `Given` (context), `When` (event), `Then` (outcome), `And`/`But`, `Background`, `Scenario Outline` + `Examples` tables. | BDD itself | cucumber.io/docs/gherkin/reference [canonical, not fetched] | `.feature` text file | `Scenario: Lapsed subscriber loses AI chat` / `Given my Pro subscription expired yesterday` / `When I open Ask Otto` / `Then I see the upgrade prompt` |
| Example mapping | A ~25-minute workshop that slices a story into rules and examples before development, using colour-coded cards. | Story mapping (Jeff Patton, a backlog-level technique) | Matt Wynne / Cucumber [verified] | Index cards or a Miro board | Yellow "Share a meal plan", blue "Only Pro users can share", green "Free user taps Share, sees paywall", red "Can recipients without the app view it?" |

**Spec-driven development: 2025–2026 tooling**
- GitHub Spec Kit is an open-source toolkit that gives AI coding agents structured processes and templates, centred on SDD. Commands are run in the agent chat: `/speckit-constitution` (project principles, once per project), `/speckit-specify` (what and why), `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, and a newer `/speckit-converge` loop. The repo has ~147k stars, is MIT licensed, and needs Python 3.11+. A news item dated 16 Oct 2026 refers to "Spec Kit 1.0" [verified] — [github/spec-kit](https://github.com/github/spec-kit)
- Spec Kit philosophy: "Specifications don't serve code — code serves specifications." Maintaining software means evolving the spec. Per-feature artifacts are `spec.md` (user stories, requirements, AC), `plan.md` (technical plan), `research.md`, `data-model.md`, `contracts/` (API/event interfaces), `quickstart.md` (key validation scenarios) and `tasks.md` (tasks, with parallelisable ones marked) [verified] — [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- In Spec Kit, `memory/constitution.md` holds governing principles: nine articles including test-first and integration-first testing. `/speckit.analyze` checks the specs against it. Templates force the LLM to write `[NEEDS CLARIFICATION: specific question]` instead of guessing, and a spec is not complete while any such marker remains [verified] — [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- Note: the command spelling differs between the README (`/speckit-specify`) and the older spec-driven.md (`/speckit.specify`). The syntax has changed across versions [verified, both pages].
- Kiro (AWS) specs have three Markdown files. `requirements.md` holds user stories plus acceptance criteria in **EARS notation** (Easy Approach to Requirements Syntax). `design.md` holds architecture, sequence diagrams and implementation considerations. `tasks.md` holds discrete, trackable tasks with live status in the IDE [verified via search summary of official page] — [Kiro spec concepts](https://kiro.dev/docs/specs/concepts); [promptz Kiro rules](https://www.promptz.dev/rules/general/kiro-specs)
- EARS pattern: an event or condition, then a required system behaviour, e.g. `WHEN <trigger> THE SYSTEM SHALL <response>` [verified in outline; exact keyword set per Alistair Mavin's EARS, canonical, not fetched] — [promptz](https://www.promptz.dev/rules/general/kiro-specs). Otto: "WHEN a user with an expired Pro entitlement opens Ask Otto THE SYSTEM SHALL display the upgrade sheet and not send the message."
- Third-party guides mention a Kiro "Bugfix Spec" (`bugfix.md`) and a "Quick Spec" mode. These are not confirmed on the official page — [Verdent guide](https://www.verdent.ai/guides/agents/kiro-spec-driven-development)
- Birgitta Böckeler (Thoughtworks, martinfowler.com, Oct 2025) compared Kiro, spec-kit and Tessl. She distinguishes **spec-first**, **spec-anchored** and **spec-as-source**. All three tools are spec-first. Kiro is the lightest (about three files plus "steering" memory). spec-kit is the most customisable but heaviest (many files per spec). Tessl aims at spec-as-source. She notes the definition of SDD "is still in flux" [verified via secondary summaries; original not fetched] — [Böckeler, martinfowler.com](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html); [engineered.at summary](https://engineered.at/articles/understanding-spec-driven-development-kiro-spec-kit-and-tessl)

**Example mapping**
- Card colours: Yellow = story, Blue = rule (acceptance criterion), Green = example, Red = open question. Many red cards means the story is not ready. Many blue means the story is too big. Many green may mean the rules need sharpening. "The magic is in the conversation and not the colour of the cards" [verified] — [Cucumber: Example Mapping](https://www.cucumber.io/docs/bdd/example-mapping); [Agile Pain Relief](https://agilepainrelief.com/blog/example-mapping-your-secret-weapon-for-effective-acceptance-criteria/); [Xebia](https://xebia.com/blog/example-mapping-steering-the-conversation/)

### Inferences
- In practice, the flow runs: example mapping, then AC (Gherkin or EARS) in a Spec Kit `spec.md` / Kiro `requirements.md`, then the agent's `plan.md`/`design.md`, then tests that implement the AC. This joins the BDD and SDD lineages: the AI-era spec carries the AC, and the tests make them executable.
- For a solo or small team with Claude Code, Kiro-style three files (requirements in EARS, design, tasks) are probably the right weight. Spec Kit's full artifact set is heavier than a recipe app needs per feature.
- Spec Kit's `[NEEDS CLARIFICATION]` is the SDD counterpart of example mapping's red card.

### Gaps
- Could not fetch Scrum Guide, cucumber.io Gherkin reference or Adzic's book this session. Their definitions are from background knowledge.
- Official Kiro docs were not directly fetched (kiro.dev blocked), so the current command set and any 2026 changes to Kiro spec modes are unconfirmed.
- The full Spec Kit 1.0 (Oct 2026) changelog was not retrieved.

---

## 2. Test strategy vs. test plan; pyramid / trophy / honeycomb; layers for a React Native app

### Takeaway
A **test strategy** is the durable *approach*: which risks you test against, at which layers, with which tools and quality gates. A **test plan** is the time-boxed *operational* document for a release or project: scope, schedule, who, environments, entry/exit criteria. Pyramid, trophy and honeycomb are heuristics for *how to distribute effort* across layers, not laws. For an RN subscription app the practical answer is trophy-shaped. Static types and lint form the base. The bulk of tests are component/integration tests with React Native Testing Library. Contract tests sit on the API seam. A thin layer of Maestro (or Detox) E2E flows covers money and onboarding paths. Visual, accessibility and performance checks run as separate gates.

### Cited Findings

**Strategy vs plan**
- ISTQB (after ISO/IEC/IEEE 29119) defines *test strategy* both as an organisation- or project-level generic approach and as "part of the Test Plan that describes the approach to testing for a specific test project or sub-process." A *test plan* is the operational roadmap: what will be tested, how, when, by whom, with what resources. *Test planning* is "the activity of establishing or updating a test plan" [verified via secondary quotes of ISTQB glossary] — [imbus ISTQB glossary: test strategy](https://www.imbus.de/en/glossar/term/test-strategy); [softwaretestpilot ISTQB glossary](https://softwaretestpilot.com/istqb/glossary/test-strategy); [yrkan test plan vs strategy](https://yrkan.com/blog/test-plan-vs-strategy/)
- Authoritative glossary: glossary.istqb.org [canonical, not fetched].

| | Test strategy | Test plan |
|---|---|---|
| Horizon | Long-lived, per product/org | Per release / project / milestone |
| Answers | Why/what risks, which layers, tools, gates, ownership | Scope, schedule, environments, people, entry/exit criteria, deliverables |
| Otto example | "Purchase, restore and entitlement gating are P0 risks: covered by unit (entitlement mapper), integration (RevenueCat SDK mocked), StoreKit-config E2E in CI, and manual sandbox-device pass before every App Store submission." | "v2.3 (Meal-plan sharing): test 14–18 Nov on iPhone SE 3 / 15 Pro / 17 Pro Max, iOS 18 + 26; exit = 0 open P0/P1, crash-free sessions ≥ 99.5% in TestFlight." |

**Shapes**
- **Test pyramid**: popularised by Mike Cohn in *Succeeding with Agile* (2009). Many fast unit tests at the base, fewer service/integration tests, very few UI/E2E tests at the top [verified] — [O'Reilly: Succeeding with Agile](https://www.oreilly.com/library/view/succeeding-with-agile/9780321660534/h4_419.html); [CircleCI explainer](https://www.plushcap.com/content/circleci/blog/the-testing-pyramid-strategic-software-testing-for-agile-teams). Fowler's bliki: martinfowler.com/bliki/TestPyramid.html [canonical, not fetched].
- **The Practical Test Pyramid** (Ham Vocke, martinfowler.com, 2018) is the standard long-form treatment, covering unit, integration, contract (with Pact), UI and E2E tests, plus "test doubles" and the idea of writing tests at the lowest level that can catch the bug — [martinfowler.com/articles/practical-test-pyramid.html](https://martinfowler.com/articles/practical-test-pyramid.html) [canonical, not fetched; existence and link verified via search, authorship from background knowledge]
- **Testing trophy** (Kent C. Dodds, 2018): layers bottom-up are Static (TypeScript, ESLint), Unit, Integration (the largest), E2E. The motto, adapted from Guillermo Rauch: "Write tests. Not too many. Mostly integration." The reasoning is that confidence per cost peaks at integration level — [kentcdodds.com/blog/the-testing-trophy-and-testing-classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) [canonical, not fetched]
- **Testing honeycomb** (Spotify, Jan 2018): for microservices, focus on *integration* tests, keep a few *implementation-detail* tests, and have few or no *integrated* tests. An integrated test is one whose pass/fail depends on another system's correctness [verified] — [Spotify Engineering: Testing of Microservices](https://engineering.atspotify.com/2018/01/11/testing-of-microservices)

**Layers an RN/Expo app needs (with tools)**

| Layer | What it proves | 2025–26 tool | Otto one-liner |
|---|---|---|---|
| Static | Types, lint, dead code | TypeScript strict, ESLint | `tsc --noEmit` fails if `Recipe.servings` is typed string |
| Unit | Pure logic | Jest / Vitest | `scaleIngredients(recipe, 4)` doubles 2-serving grams |
| Component | One component renders/behaves correctly, queried by role/label | React Native Testing Library (RNTL) + Jest | `getByRole('button', {name: 'Save recipe'})` press calls `onSave` |
| Integration | Several units + state + mocked network | RNTL + MSW (Mock Service Worker) for fetch, mocked RevenueCat SDK | Paywall screen shows annual price from mocked `getOfferings()` |
| Contract | Client and server agree on API shape | Pact (consumer-driven), or schema checks against Supabase-generated types | Pact file: `GET /meal_plans?id=eq.42` returns `{id, days[], owner_id}` |
| E2E | Real built app on simulator/device, black-box user flows | Maestro (YAML, black-box) or Detox (gray-box, JS, in-process sync) | `maestro test flows/purchase_pro.yaml` taps Upgrade, confirms StoreKit sheet, and asserts "Pro" badge |
| Visual regression | Pixels didn't change unexpectedly | Storybook + Chromatic (web/RN-web), or device screenshot diffing (e.g. Maestro screenshots + diff, Emerge/Sentry snapshots) | RecipeCard in dark mode matches approved baseline |
| Accessibility | Labels, roles, contrast, Dynamic Type, touch targets | RNTL role queries, `eslint-plugin-react-native-a11y`, Xcode Accessibility Inspector, manual VoiceOver pass | Every icon-only button has `accessibilityLabel` |
| Performance budgets | Startup, JS bundle size, frame drops, memory stay under thresholds | Flashlight, Reassure (RN render perf regression), Xcode Instruments, bundle-size CI check | Cold start < 2.0 s on iPhone SE 3; Recipe list scroll holds 60 fps |
| Device matrix | Coverage across screen sizes, OS versions, locales | Simulators in CI + a small real-device set / device farm (BrowserStack, AWS Device Farm, Maestro Cloud) | SE (small), 15 Pro (notch/Dynamic Island), Pro Max (large); iOS N and N-1 |

- **Detox vs Maestro**: Detox runs in-process (gray-box) and syncs with RN's async work. It requires JS/TS, Jest and native build knowledge, and is tied to RN versions. Maestro is black-box, YAML-driven, needs no compile step to edit a flow, and supports iOS/Android/RN/Flutter/web. Common advice: Maestro for new or Expo projects and simpler CI; Detox if you have an existing suite or need deep RN sync; Appium for large cross-platform matrices. Speed and flakiness figures in these sources are vendor or single-team anecdotes (e.g. "70% faster" with Maestro 1.30 vs Detox 20.1) and are not independently verified [verified as claims] — [helpmetest Detox vs Maestro](https://helpmetest.com/blog/detox-vs-maestro/); [Jupiter QA](https://life.jupiter.money/choosing-between-maestro-and-detox-on-jupiter-qa-automation-7b94e6f8759d); [dev.to anecdote](https://dev.to/johalputt/we-cut-70-of-mobile-test-time-in-2026-by-ditching-detox-for-maestro-130-48kn); [OneUptime Maestro RN guide, Jan 2026](https://oneuptime.com/blog/post/2026-01-15-react-native-maestro-testing/view)
- **Pact / contract testing**: consumer-driven. The consumer's tests run against a Pact mock provider and record interactions into a JSON pact file. The provider replays them against the real implementation. It is an alternative to deploying everything for E2E, but does not replace E2E. Pact originated at realestate.com.au [verified, mostly secondary] — [docs.pact.io blog](https://docs.pact.io/blog/2018/07/10/welcome); [codecentric](https://blog.codecentric.de/consumer-driven-contract-testing-with-pact); [dev.to intro](https://dev.to/niklas_wortmann/an-introduction-to-pact-and-consumer-driven-contract-testing-4ea1)

### Inferences
- A Supabase + RN app has one owned API seam (PostgREST/Edge Functions) and several third-party seams (RevenueCat, the LLM provider). Full Pact is usually overkill when one team owns client and DB. Generated Supabase types plus a few schema/contract checks on Edge Functions give most of the value. Honeycomb-style integration tests (RNTL + MSW) are the sweet spot.
- E2E should be reserved for the critical journeys (onboarding, save recipe, generate plan, purchase/restore, AI chat send) because simulator E2E is the slowest and flakiest layer.
- AI chat output is non-deterministic. Test the *contract* (request shape, streaming handling, error/limit states) with recorded fixtures, and evaluate *quality* separately with an eval set graded by rubric or LLM-judge. Don't snapshot raw model text.

### Gaps
- No primary 2025–26 source fetched for Reassure, Flashlight, Chromatic RN support or Storybook RN versions. Tool names are from background knowledge and should be checked against current docs.
- Kent C. Dodds' and Vocke's pages could not be fetched (host blocked).

---

## 3. Test data and doubles: fixtures, factories, seeds, mocks/stubs/fakes/spies/dummies, golden files/approval tests, oracles, property-based testing, IAP sandbox, recorded API fixtures

### Takeaway
"Mock" is used loosely for everything. Meszaros' taxonomy is precise: **test double** is the umbrella term, and dummy, fake, stub, spy and mock are its kinds. A **fixture** is the fixed state or data a test runs against. A **factory** builds such data programmatically with defaults. A **seed** populates a whole environment database. **Golden files / approval tests / snapshots / characterization tests** are all "compare output to an approved recorded artefact." A **test oracle** is whatever tells you the expected result. For subscriptions there are three distinct test environments: Xcode StoreKit configuration files (local, no Apple servers), the App Store sandbox (sandbox Apple accounts on device), and TestFlight. RevenueCat adds its own Test Store.

### Cited Findings

**Test doubles (Meszaros, *xUnit Test Patterns*, 2007; Fowler, "Mocks Aren't Stubs", 2007)** — [martinfowler.com/articles/mocksArentStubs.html](https://martinfowler.com/articles/mocksArentStubs.html) [canonical, not fetched; definitions from background knowledge of the article]

| Double | Definition | Otto one-liner |
|---|---|---|
| Dummy | Passed around but never used; fills a parameter list | `new RecipeCard({ onShare: () => {} })` in a test that never shares |
| Fake | Has a working implementation but takes a shortcut unsuitable for production (e.g. in-memory DB) | In-memory `FakeRecipeRepo` backed by a `Map` instead of Supabase |
| Stub | Provides canned answers to calls made during the test | `Purchases.getCustomerInfo` stubbed to return `{entitlements:{active:{pro:{...}}}}` |
| Spy | A stub that also records how it was called, for later assertion | `analytics.track` spy: assert called once with `'paywall_viewed'` |
| Mock | Pre-programmed with *expectations* of calls; verifies behaviour itself | Mock `ChatClient` expects exactly one `send({model, messages})` call, else fails |

- Fowler's central distinction: **state verification** (assert on resulting state; uses stubs/fakes) vs **behaviour verification** (assert on interactions; uses mocks). It maps to **classicist** (Detroit) vs **mockist** (London) TDD [canonical, not fetched]. Jest's `jest.fn()` is technically a spy/stub hybrid. Calling everything a "mock" is the main source of confusion.

**Data artefacts**

| Term | Definition | Otto one-liner |
|---|---|---|
| Fixture | Fixed, known state or data a test starts from. Meszaros uses "test fixture" for *everything* needed to run the test, and many ecosystems (Rails, pytest, Playwright) use it for the data/setup itself | `fixtures/recipes/shakshuka.json` |
| Factory | Code that builds valid objects with sensible defaults plus per-test overrides (Factory Bot, fishery, @faker-js) | `recipeFactory.build({ servings: 6, tags: ['vegan'] })` |
| Seed | Script/data that populates a database for a dev, staging or demo environment. Not test-specific | `supabase/seed.sql` inserts 50 Otto catalogue recipes for local `supabase db reset` |
| Golden file / golden master | A recorded "known-good" output file. Tests diff current output against it. Updated deliberately | `__golden__/shopping_list_week1.txt` from `buildShoppingList(plan)` |
| Approval test | Framework form of golden master (Llewellyn Falco). Output is serialised, a human *approves* it, and any change fails until re-approved [verified] | `verify(renderNutritionPanel(recipe))` produces `.approved.txt` |
| Snapshot test | Jest's built-in approval variant (`toMatchSnapshot`). Same idea, auto-written on first run | `expect(tree).toMatchSnapshot()` on `<IngredientRow>` |
| Characterization test | Michael Feathers' term (*Working Effectively with Legacy Code*): pins down *actual* current behaviour before refactoring, not desired behaviour [verified] | Capture current `parseIngredientLine` outputs for 200 real lines before rewriting the parser |
| Test oracle | "A source to determine an expected result to compare with the actual result." It is the *source*, not the process. The "oracle problem" (no reliable oracle) is why experience-based testing is needed [verified via ISTQB quotes] | USDA FoodData Central values are the oracle for computed calories |
| Property-based test | Asserts invariants over many generated inputs (QuickCheck lineage; fast-check in JS) and shrinks failures to minimal cases | `fc.assert(fc.property(recipeArb, n => totalGrams(scale(r, n)) ≈ n/r.servings * totalGrams(r)))` |
| Recorded API fixture (VCR-style) | Real HTTP interactions recorded once to "cassettes" and replayed in tests (Ruby VCR, Polly.js, MSW handlers from HAR, nock recorder) | `cassettes/chat_suggest_dinner.json` replays an LLM streaming response deterministically |

- Approval/golden-master naming: Characterization Tests, Approval Tests, Golden Master, Snapshot Tests and Locking Tests all describe capturing existing behaviour into tests. "Golden master" comes from audio record mastering. Pitfalls: capturing output easily, getting *stable* output (timestamps, IDs), reviewing diffs, not overwriting the master by mistake. Don't use approvals for single scalar values [verified] — [Nicolas Carlo, dev.to](https://dev.to/nicoespeon/what-s-the-difference-between-regression-tests-characterization-tests-and-approval-tests-2jf3); [Packt: Approval tests by Llewellyn Falco](https://packtpub.com/en-us/product/agile-technical-practices-distilled-9781838980849/chapter/chapter-9-11/section/approval-tests-by-llewellyn-falco-ch11lvl1sec96); [Clare Macrae slides](https://de.slideshare.net/ClareMacrae/quickly-testing-legacy-code-accu-york-april-2019); [helpmetest approval guide](https://helpmetest.com/blog/approval-testing-guide/); official site approvaltests.com
- Test oracle definition [verified via secondary quotes] — [softwaretestpilot: test oracle](https://softwaretestpilot.com/istqb/glossary/test-oracle)

**In-app purchase / subscription test environments**
- **StoreKit configuration file (Xcode, local)**: a `.storekit` file defines products locally. You select it in the scheme. Renewal speed is set via *Editor > Subscription Renewal Rate* (e.g. "Monthly Renewal Every 30 Seconds"). WWDC23 says the rate ranges from real time to every 2 seconds, and Xcode 15 added static renewal rates independent of duration. In the simulator the config file's rate applies regardless of the sandbox tester's setting [verified] — [Apple: Testing In-App Purchases in Xcode](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-in-xcode.md); [WWDC23 10142 notes](https://wwdcnotes.com/documentation/wwdc23-10142-explore-testing-inapp-purchases/); [RevenueCat community](https://community.revenuecat.com/general-questions-7/how-to-force-sandbox-tester-to-have-a-faster-expiration-date-for-auto-renewable-subscriptions-3551)
- **App Store sandbox (device)**: sandbox testers are created in App Store Connect > Users and Access > Sandbox Testers. Set the tester's country/region to test storefronts. On device, *Settings > App Store > Sandbox Account > Manage* exposes Renewal Rate, Test Interrupted Purchases and Clear Purchase History. App Store Connect durations apply only to production [verified] — [RevenueCat: Apple App Store sandbox](https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store); [WWDC23 notes](https://wwdcnotes.com/documentation/wwdc23-10142-explore-testing-inapp-purchases/)
- **RevenueCat specifics**: (a) **Test Store**, a separate API key that allows purchase testing with no store setup; (b) automatic sandbox vs production detection; (c) StoreKit-config testing with RevenueCat requires exporting the StoreKit public certificate and uploading it under Project Settings > Apps > StoreKit testing. Products must exist in RevenueCat, though not necessarily in App Store Connect. StoreKit testing does not surface cancellation or refund events. RevenueCat recommends testing the *purchase flow* in sandbox, not product metadata [verified] — [RevenueCat sandbox docs](https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store); [docs.revenuecat.com/docs/sandbox](https://docs.revenuecat.com/docs/sandbox)
- Known issue: an Apple forum report describes StoreKit Testing randomly unsubscribing, with no confirmed cause [verified as report] — [Apple Developer Forums 706796](https://developer.apple.com/forums/thread/706796)

| Environment | Talks to Apple? | Use for | Otto one-liner |
|---|---|---|---|
| Mocked SDK (Jest) | No | Unit/integration of gating logic | Stub `getCustomerInfo` with expired entitlement and assert Ask Otto is locked |
| RevenueCat Test Store | No (RC only) | Quick dev purchase flows | Dev build uses Test Store key to buy Pro instantly |
| StoreKit config file | No (local Xcode) | Simulator E2E, renewal/expiry/interrupt scenarios, CI | `Otto.storekit` with monthly/annual + 7-day trial; 30-s renewal; Maestro flow asserts trial-to-paid |
| App Store sandbox | Yes (sandbox) | Real receipt/server notification path, RC webhooks to Supabase | Sandbox tester `otto.qa+uk@…` in UK storefront verifies £ pricing and webhook updates `profiles.is_pro` |
| TestFlight | Yes (sandbox purchases) | Beta testers, release candidate | External testers run release checklist on RC build |

### Inferences
- Keep fixtures small and named by scenario (`free_user_10_saves.json`), use factories for variation, and keep seeds for environments only. Mixing seed data into tests causes coupling.
- Snapshot tests of whole RN component trees tend to be rubber-stamped. Prefer targeted assertions, and keep snapshots for serialisable domain outputs (shopping list, nutrition summary), where they work like golden files.
- For AI chat, recorded fixtures (VCR-style) make UI and streaming tests deterministic. The fixtures should be re-recorded deliberately when the prompt or model changes, like re-approving a golden file.

### Gaps
- Fowler's and Meszaros' exact wording could not be fetched. Definitions are from background knowledge (long stable).
- No fetched source for fast-check, Polly.js or MSW docs. Current API spellings should be checked.
- Did not verify whether Apple added new StoreKit testing features in Xcode 26 / iOS 26 (e.g. new transaction-manager capabilities).

---

## 4. Quality artifacts: traceability matrix, risk-based testing, QA checklists, release checklists, bug report templates, exploratory test charters

### Takeaway
These are the lightweight documents that connect specs to tests and releases. Each has a specific job: traceability shows coverage, risk-based testing sets priority, checklists ensure repeatability, bug templates make reports reproducible, and charters focus exploration. In a small team they should live as Markdown in the repo or as ticket templates, not as heavyweight Word documents.

### Cited Findings

| Artifact | Definition | Format | Otto one-liner |
|---|---|---|---|
| Requirements Traceability Matrix (RTM) | Table mapping each requirement/AC to the tests (and defects) that cover it, both forward and backward. ISTQB: "traceability" = ability to establish relationships between test basis and testware [ISTQB, canonical, not fetched] | Table or spreadsheet; or implicit via test names/tags referencing requirement IDs | `REQ-PAY-03 (lapsed user loses chat) → chat.gating.test.tsx#lapsed, flows/lapsed_chat.yaml` |
| Risk-based testing | Selecting, prioritising and sizing tests by **likelihood × impact** of failure (ISTQB) [canonical, not fetched] | Risk register: risk, L, I, score, mitigating tests | "Charged but not unlocked: L=Med, I=Critical, so E2E + sandbox manual every release" |
| QA checklist | Reusable list of checks for a feature type (not step-by-step test cases) | Markdown checklist | "Every new screen: Dynamic Type XXL, VoiceOver order, dark mode, offline state, empty state" |
| Release checklist | Gate list for shipping a build: versioning, migrations, flags, store metadata, smoke tests, rollback | Markdown in repo / release ticket template | "Bump build number; run `supabase db push` on staging; sandbox purchase + restore on device; App Privacy labels unchanged?; phased release on" |
| Bug report template | Structured defect report: title, environment (app version/build, device, OS), steps to reproduce, expected vs actual, severity/priority, evidence, frequency | GitHub issue form (`.github/ISSUE_TEMPLATE/bug.yml`) | "Build 2.3 (412), iPhone 15 / iOS 26.1, Pro sandbox user: 1) open plan 2) tap Share; expected share sheet, actual crash; 3/3" |
| Exploratory test charter | Mission for a time-boxed exploratory session: **Explore** (target) **With** (resources) **To discover** (information). Popularised by Elisabeth Hendrickson, *Explore It!* (2013) [verified] | One-line charter + session notes + debrief | "Explore subscription restore With a sandbox account that purchased on another device To discover whether entitlements and saved-recipe limits resync" |

- Charter template wording, source book and example ("Explore editing profiles / With real usernames / To discover if … username constraints are not enforced"). Some practitioners prefer their own format, and others credit adaptations by Maaret Pyhäjärvi [verified] — [Ministry of Testing thread](https://club.ministryoftesting.com/t/what-do-you-put-in-your-exploratory-testing-charters/39983); [Xray: test charters](https://getxray.app/blog/test-charters-exploratory-testing); [Product Labs, Medium](https://medium.com/product-labs/charters-exploratory-testing-and-beyond-87315184f256); [helpmetest charters & debriefs](https://helpmetest.com/blog/exploratory-testing-charters-debriefs/); [ISTQB CTAL-TA charter concept](https://trustedinstitute.com/concept/istqb-ctal-ta/experience-based-testing/test-charter-missions-target-resources-and-information/)
- Session-Based Test Management (James & Jon Bach, 2000) is the classic framework that wraps charters with time-boxes and debriefs [canonical, not fetched].

### Inferences
- In a spec-driven repo, an explicit RTM spreadsheet can be replaced by convention. Give requirements IDs in `spec.md`/`requirements.md` (or EARS lines), and reference those IDs in test names or tags. Spec Kit's `quickstart.md` ("key validation scenarios") is effectively the acceptance-level slice of the RTM.
- A risk register for a subscription + AI app should rank at least: purchase/restore/entitlement correctness, data loss of user recipes/plans, AI chat safety/cost runaway, App Review rejection triggers (paywall disclosures, account deletion), and accessibility.

### Gaps
- No fetched primary source for an RTM or risk-based-testing definition (ISTQB glossary not directly reachable). Definitions are from background knowledge.
- No authoritative "standard" mobile release checklist exists. Items above are illustrative.

---

## 5. How a principal engineer sets and reviews a test strategy

### Takeaway
A principal engineer treats the test strategy as a **risk-driven, layered, explicitly owned agreement**. It is short, lives in the repo, and is reviewed against outcomes such as escaped defects, flakiness and feedback time, not coverage percentages. Their review questions are about whether the highest-impact risks are caught at the cheapest reliable layer, and whether the suite stays trustworthy and fast.

### Cited Findings
- The pyramid and its successors are guidelines to be filled in by context. Tooling and architecture changes alter their assumptions [verified] — [Subject7 "Rethinking the Testing Pyramid"](https://em360tech.com/sites/default/files/2021-06/Subject7%20-%20Rethinking%20the%20Testing%20Pyramid.pdf); [Gouchet "Demystifying the test pyramid"](https://sessionize.com/s/xavier-f--gouchet/demystifying-the-test-pyramid/99853)
- Spotify's honeycomb argues that the *shape follows architecture*: microservices have little internal logic and much integration, so integration tests should dominate [verified] — [Spotify Engineering](https://engineering.atspotify.com/2018/01/11/testing-of-microservices)
- Spec Kit's constitution includes test-first and integration-first articles, and `/speckit.analyze` checks plans against them. This shows strategy principles being codified as guardrails for AI agents [verified] — [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- ISTQB places strategy in the test plan / organisational policy hierarchy (ISO 29119) [verified via secondary] — [imbus glossary](https://www.imbus.de/en/glossar/term/test-strategy)

### Inferences (synthesis; no single source)
**Setting the strategy, a one-to-two-page `docs/testing-strategy.md`:**
1. **Context and risks**: rank product risks (likelihood × impact). For Otto: money (purchase/restore/entitlement), user data (recipes, plans), AI (cost, safety, latency), store compliance, accessibility.
2. **Layer map**: for each risk, the *lowest* layer that can reliably catch it, the tool, and the owner (the risk-to-layer table in §2).
3. **Test data policy**: fixtures vs factories vs seeds; recorded LLM cassettes; StoreKit config file checked in; named sandbox testers per storefront; no production data in tests.
4. **Environments**: local (StoreKit config, Supabase local), CI (simulators), staging (Supabase branch + sandbox), TestFlight.
5. **Quality gates**: what blocks a PR (static + unit + component + affected E2E smoke) vs what blocks a release (full E2E, sandbox manual pass, a11y pass, perf budget, crash-free threshold).
6. **Non-functional budgets**: cold start, bundle size, memory, frame rate, AI response p95 latency and per-user token cost.
7. **Ownership and flake policy**: every test has an owner. Flaky tests are quarantined within 24 h and fixed or deleted. Never retry silently.
8. **Exploratory and manual**: charters per release for risky areas. Device matrix defined explicitly.
9. **AI-agent rules**: in the constitution / CLAUDE.md, agents must write or adjust tests from the spec's acceptance criteria and may not delete or weaken assertions to go green.

**Review questions a principal asks:**
- Which P0 risks have *no* automated check, and which are only caught by E2E when a cheaper layer would do?
- Are tests asserting behaviour (user-visible, via roles/labels) or implementation details (state shape, internal calls via mocks)? Over-mocking is the usual smell.
- Feedback time: PR suite under ~10 min? E2E flake rate tracked?
- Escaped-defect analysis: for the last N production bugs, which layer *should* have caught each one, and was the strategy updated?
- Are snapshots/golden files reviewed, or rubber-stamped with `-u`?
- Is test data deterministic (fixed clocks, seeded randomness, recorded LLM output)?
- Is there traceability from spec AC to tests (IDs/tags), so a requirement change shows which tests to change?
- Coverage is used as a *signal* (find untested risky code), never as a target.

### Gaps
- Found no primary source (e.g. Google Testing Blog / *Software Engineering at Google* ch. 11–14) fetched this session that prescribes a principal-engineer review checklist. The list above is synthesis. *Software Engineering at Google* (O'Reilly, 2020, abseil.io/resources/swe-book) is the canonical reference to cite for test sizes (small/medium/large), flakiness and "Beyoncé rule" ideas [canonical, not fetched].
- Google Testing Blog "Just Say No to More End-to-End Tests" (Mike Wacker, 2015) is a canonical argument for few E2E tests [canonical, not fetched].
