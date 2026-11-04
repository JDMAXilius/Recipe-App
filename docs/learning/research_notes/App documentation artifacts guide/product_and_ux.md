# Product-definition and UX-representation artifacts for a production consumer mobile app

Research conducted 2026-11-04. Method note: in this cloud session, direct page fetches to basecamp.com, nngroup.com and producttalk.org were blocked by the session network allowlist (DNS failure), so primary pages could not be read in full. Findings below come from web-search result summaries (which surface primary-site snippets where available) and secondary sources; each is labelled. Items marked "[prior knowledge, unverified this session]" are well-established canon the report writer may use, but they were not re-confirmed against a source here. Otto example lines are my own worked examples (inferences), not sourced facts.

Otto context used for examples: iOS meal-planning/recipe app, hard paywall (no free tier past onboarding; subscription required to use the app), AI chat assistant ("Ask Otto") that can suggest recipes / build plans.

---

## Q1. Product-definition artifacts: what each is, terminology, owner, timing, canonical format/author, contents, mistakes, links, Otto example

### Takeaway
Product artifacts form a funnel from "why/where" (vision, strategy, North Star) through "which problem" (JTBD, opportunity solution tree, Lean canvas) to "what we will build this time" (PR/FAQ, Shape Up pitch, one-pager/PRD, story map). The 2025–26 trend is shorter, problem-first, explicitly-bounded docs (non-goals / no-gos / appetite) plus prototypes, rather than long waterfall-style PRDs; each canonical format has a named originator whose definitions should be treated as authoritative over the many blurred secondary renditions.

### Cited Findings

**Product vision and product strategy (Marty Cagan / SVPG)**
- Cagan frames product vision as the shared goal the team works toward, defined in terms of the future you are trying to create; strategy breaks that vision into a sequence of market-focused steps — "a series of product-market fits." — [Mind the Product interview with Cagan](https://mindtheproduct.com/product-vision-and-strategy-marty-cagan-on-the-product-experience-part-1-of-2); [This Is Product Management episode](https://tipm.disqo.com/episodes/vision-and-strategy)
- Cagan places vision and strategy at the product-leadership level rather than with individual PMs ("product leadership topics rather than product management topics"). — [Mind the Product interview](https://mindtheproduct.com/product-vision-and-strategy-marty-cagan-on-the-product-experience-part-1-of-2)
- A summary of Cagan's talks attributes roughly 5% of PM work to vision/strategy/prioritisation and ~95% to discovery (secondary; treat as indicative). — [Antoine Buteau, Lessons from Marty Cagan](https://www.antoinebuteau.com/lessons-from-marty-cagan.md)
- Third-party summaries attribute to SVPG the views that strategy is largely about what to leave out and that vision stays stable while strategy adapts — could not be verified on svpg.com. — [Antoine Buteau summary](https://www.antoinebuteau.com/lessons-from-marty-cagan.md)
- Cagan's book *INSPIRED* (2nd ed., 2017, Wiley, ISBN 9781119387503) contains dedicated chapters on product vision and product strategy. — [O'Reilly listing](https://www.oreilly.com/library/view/inspired-2nd-edition/9781119387503/c25.xhtml)

**"Good strategy" kernel (Richard Rumelt)**
- Rumelt's *Good Strategy Bad Strategy* (2011) defines the strategy "kernel" as three parts: diagnosis (explains the nature of the challenge), guiding policy (overall approach that rules out a large range of possible actions), and coherent actions (steps that reinforce each other). — [NASA APPEL review](https://appel.nasa.gov/2012/01/23/5-1_good_bad_strategy-html/); [Actionable Books summary](https://actionablebooks.com/summaries/good-strategy-bad-strategy/)
- Bad strategy is "long on goals and short on policy or action"; a bad diagnosis is vague, circular, or absent. — [Actionable Books summary](https://actionablebooks.com/summaries/good-strategy-bad-strategy/); [dsebastien concept note](https://concepts.dsebastien.net/concept/kernel-of-good-strategy/)

**North Star metric and metric trees (Amplitude North Star Framework)**
- The North Star Metric is "a single critical rate, count, or ratio that represents your product strategy"; there is only one. — [Amplitude North Star Playbook](https://amplitude.com/books/north-star/about-north-star-framework)
- The framework is drawn as a tree "containing assumptions, beliefs, and causal relationships"; input metrics below it are controllable levers (sources say 3–6 or 3–5 — counts are secondary and vary). Business outcomes (revenue etc.) sit above and should correlate with the North Star, which should be more leading. — [Amplitude Playbook](https://amplitude.com/books/north-star/about-north-star-framework); [learningloop glossary](https://learningloop.io/glossary/northstar-metric); [Launchrock](https://www.launchrock.com/library/expert-advice/north-star-framework)
- Amplitude's blog worked example is a grocery ordering/delivery app tree tying "a dozen different product initiatives together." — [Amplitude blog: product north star metric](https://www.amplitude.com/blog/product-north-star-metric)
- John Cutler (ex-Amplitude): "If you can move your North Star directly, it's probably not a good North Star." — [Amplitude: good vs bad North Star](https://www.amplitude.com/blog/good-bad-north-star-metric.md)

**Amazon PR/FAQ ("Working Backwards")**
- A PR/FAQ is a press release for a not-yet-built product written as of a hypothetical future launch date, plus FAQs, written before building. — [Commoncog: Putting Amazon's PR/FAQ to practice](https://commoncog.com/putting-amazons-pr-faq-to-practice); [Product School](https://productschool.com/blog/product-fundamentals/prfaq)
- Structure: press release (~1 page), customer/external FAQ, internal FAQ (questions finance, legal, engineering will ask). Length figures differ across sources: one cites Amazon guidance of FAQs ≤5 pages; another describes ~6 pages total. — [Goodreads notes on *Working Backwards*](https://www.goodreads.com/notes/55297149-working-backwards/9985015-bryan?page=3); [Koji guide](https://www.koji.so/docs/working-backwards-pr-faq-guide)
- Authoritative source: Colin Bryar & Bill Carr, *Working Backwards* (2021). Repeated rewriting/review before code is described as a feature not a defect. — [Commoncog](https://commoncog.com/putting-amazons-pr-faq-to-practice)
- Anecdote: Echo's launch press release was reportedly nearly identical to the one written years earlier in its PR/FAQ. — [Opus Research](https://opusresearch.net/2021/04/09/the-secret-to-launching-great-sonic-products/)

**Product one-pager and PRD**
- Lenny Rachitsky's template roundup lists his own 1-pager and Kevin Yien's (Square) PRD template, singling out Yien's "Non-Goals" section and step-by-step flow. — [Lenny's Newsletter: My favorite templates](https://www.lennysnewsletter.com/p/my-favorite-templates-issue-37)
- Lenny's 1-pager is described as problem-first, ~six sections, one page; Lenny: nailing the problem statement is the single most important step. — [prodmgmt.world PRD template guide](https://www.prodmgmt.world/blog/prd-template-guide) (secondary)
- Across "elite" PRD templates, a Non-Goals / No-Gos section is the second most common element. — [prodmgmt.world](https://www.prodmgmt.world/blog/prd-template-guide) (secondary)
- 2025–26 debate: practitioners argue over whether a working prototype "replaces the PRD"; one argues it is the wrong question because an out-of-product prototype must be reconciled with the shipped product. — [elsesite field note](https://elsesite.pages.dev/resources/field-notes/prototype-is-the-product) (opinion)
- Cagan frames prototypes around four risks (value, usability, feasibility, viability) and says fidelity should match the risk being tested. — [secondary summary of Cagan article](https://product-management-case-studies.vercel.app/case-studies/the-purpose-of-prototypes)

**Shape Up pitch (Ryan Singer / Basecamp, 2019)**
- A pitch has five ingredients: Problem, Appetite, Solution, Rabbit holes, No-gos. Appetite = how much time we want to spend and how that constrains the solution; rabbit holes = solution details worth calling out to avoid problems; no-gos = functionality/use cases intentionally excluded to fit the appetite. — [Basecamp Shape Up ch. 6 "Write the Pitch"](https://basecamp.com/shapeup/1.5-chapter-06) (via search snippet)
- Appetite is set before designing the solution: small batch 1–2 weeks, big batch 6 weeks. Rabbit holes are technical unknowns, unsolved design problems or misunderstood interdependencies that blow up timelines. — [Basecamp Shape Up](https://basecamp.com/shapeup/1.5-chapter-06); [37signals podcast "Writing a Pitch"](https://37signals.com/podcast/writing-a-pitch/)
- Secondary sources often confuse rabbit holes with no-gos; Basecamp's text is authoritative. — [search result comparison incl. buildbetter.ai](https://blog.buildbetter.ai/shape-up-summary-how-to-run-it-with-ai/)

**Opportunity Solution Tree (Teresa Torres)**
- The OST, central to Torres's *Continuous Discovery Habits* (2021), has four levels: desired outcome → customer opportunities (needs, pain points, desires) → solutions → assumption tests. — [Product Talk glossary: OST](https://www.producttalk.org/glossary-discovery-opportunity-solution-tree/); [Ballpark glossary](https://ballparkhq.com/research-glossary/opportunity-solution-tree)
- Opportunities should be framed as customer needs, not features; a real opportunity admits several solutions — if only one is imaginable it's probably a solution in disguise. — [Mind the Product](https://www.mindtheproduct.com/reversing-teresa-torres-opportunity-solution-tree-to-find-the-why-behind-solutions/); [Whimsical template](https://whimsical.com/templates/opportunity-solution-tree)
- Common failures: no assumption tests (wishful thinking); static tree that isn't updated. Assumptions are often categorised as value / usability / viability / feasibility. — [Ballpark](https://ballparkhq.com/research-glossary/opportunity-solution-tree); [Whimsical](https://whimsical.com/templates/opportunity-solution-tree)

**Jobs To Be Done: job stories and switch interviews**
- Job stories originated at Intercom, best articulated by Alan Klement; template: "When [situation], I want to [motivation], so I can [expected outcome]." — [dsebastien: job story](https://concepts.dsebastien.net/concept/job-story/); [Mountain Goat Software](https://mountaingoatsoftware.com/blog/job-stories-offer-a-viable-alternative-to-user-stories)
- Mike Cohn: a job story is focused less on the user performing a function than on the job to be done. — [Mountain Goat Software](https://mountaingoatsoftware.com/blog/job-stories-offer-a-viable-alternative-to-user-stories)
- Switch interviews (Bob Moesta, Chris Spiek; Re-Wired Group) use the Four Forces: push (frustration with current situation) + pull (attraction of the new) must outweigh anxiety (of the new) + habit (of the present). — [jobstobedone.org: The Four Forces](https://jobstobedone.org/the-four-forces/); [Young Urban Project](https://www.youngurbanproject.com/customer-interviews-for-positioning/)
- The interview reconstructs a timeline from "first thought" through passive/active looking to the decision; teams over-focus on pull and under-address anxiety and habit (fixes: guarantees, trials, low-friction switching). — [koji switch-interviews guide](https://www.koji.so/docs/switch-interviews-jtbd-method); [jobstobedone.org](https://jobstobedone.org/?p=3423)

**Personas vs JTBD**
- NN/g: the two are compatible tools; JTBD focuses on problems and needs, while well-executed personas include that and add behavioural and attitudinal detail. — [NN/g: Personas vs Jobs-to-Be-Done](https://nngroup.com/articles/personas-jobs-be-done); [NN/g video](https://www.nngroup.com/videos/jobs-be-done-vs-personas/)
- Common blend: personas describe who; jobs describe situation and desired progress; core JTBD can be embedded in personas. — [CareerFoundry](https://careerfoundry.com/en/blog/ux-design/personas-vs-jtbd); [elezea](https://elezea.com/2017/08/personas-and-jobs-to-be-done/)

**User story mapping (Jeff Patton)**
- Concepts first described in 2005 ("It's All in How You Slice It") and 2008 ("The new user story backlog is a map"); book *User Story Mapping* (O'Reilly, 2014). — [Agile Alliance glossary](https://www.agilealliance.org/?p=5003329); [ProjectManagement.com wiki](https://www.projectmanagement.com/wikis/295468/Story-Maps)
- Anatomy: backbone (horizontal row of high-level user activities in narrative order), tasks/stories hanging below, horizontal release slices; the first thin slice across every backbone step is the walking skeleton (term from Alistair Cockburn). Each release should deliver a complete journey, not one column of features. — [koji story-mapping guide](https://www.koji.so/docs/user-story-mapping); [Rework](https://resources.rework.com/libraries/project-management/user-story-mapping) (secondary)

**Lean Canvas (Ash Maurya)**
- Introduced Aug 2010 ("How I Document My Business Model Hypotheses"), adapted from Osterwalder's Business Model Canvas; nine boxes: Problem, Customer Segments, Unique Value Proposition, Solution, Channels, Revenue Streams, Cost Structure, Key Metrics, Unfair Advantage. Framed as a riskiness map. — [Tability](https://www.tability.io/odt/articles/lean-canvas); [Rework](https://resources.rework.com/libraries/strategic-management/lean-canvas)
- Unfair advantage = something not easily copied or bought; Maurya advises leaving it blank rather than faking it. Sources disagree on exactly which BMC boxes were replaced and on *Running Lean* publication year (2010 vs 2012). — [Launchrock](https://www.launchrock.com/library/expert-advice/lean-canvas); [Rework](https://resources.rework.com/libraries/strategic-management/lean-canvas)

**GOV.UK user needs (content/service design)**
- GOV.UK user needs use "As a [who], I need/want [what], so that [why]," must be action-based, borrowed from user stories; GDS design principle #1 "Start with user needs." The old content-design manual page is no longer updated, replaced by new GOV.UK content and publishing guidance. — [GOV.UK: Identify user needs](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs); [GOV.UK content design](https://www.gov.uk/guidance/content-design); [GDS 2013 deck](https://speakerdeck.com/gds2013/sprint-go-why-we-use-user-needs)

### Inferences
Per-artifact reference cards (owner / timing / contents / mistakes / links / Otto line). Owner and timing columns are synthesised from the findings above plus [prior knowledge, unverified this session].

1. **Product vision** — Owner: product leader/founder (Cagan). Timing: before roadmap, horizon 2–10 yrs, revisited yearly. Contents: future state for the customer, why now, principles, often a "visiontype". Mistake: writing features or a mission slogan. Links: feeds strategy and North Star. *Otto:* "In 2029, nobody in an Otto household asks 'what's for dinner?' — the week is planned, the shop is listed, and Otto adapts when life changes."
2. **Product strategy (Rumelt kernel)** — Owner: product leadership. Timing: annual/half-yearly. Contents: diagnosis, guiding policy, coherent actions, explicit "not doing." Mistake: list of goals/OKRs masquerading as strategy. Links: justifies OST outcomes and roadmap. *Otto:* "Diagnosis: recipe apps are free and abundant, so people churn after browsing; planning, not discovery, is the unmet job. Guiding policy: charge from day one (hard paywall) and earn it with the plan + AI chat, not the catalogue."
3. **North Star + metric tree** — Owner: product + data. Timing: set with strategy, reviewed quarterly. Contents: one NSM, 3–6 inputs, business outcomes above. Mistake: picking revenue/MAU (directly movable or lagging). *Otto:* "NSM: weekly planned meals cooked per paying household. Inputs: plans created/week, % plan recipes cooked, chat-to-plan conversions, trial-to-paid rate."
4. **Lean canvas** — Owner: founder/PM. Timing: pre-product / pivot. Mistake: filling "unfair advantage" with fluff. *Otto line (Revenue Streams):* "Annual subscription after 7-day trial, no free tier."
5. **JTBD job story / switch interview** — Owner: PM + UX research. Timing: discovery, continuous. *Otto job story:* "When it's Sunday evening and I haven't thought about the week, I want a plan that fits what's already in my fridge, so I can shop once and stop deciding every night." *Switch forces:* push = "wasted groceries"; anxiety = "paying before I've tried it" (directly relevant to the hard paywall — anxiety must be countered by trial/onboarding value).
6. **Personas** — Owner: UX research. Mistake: demographic fiction not grounded in research. Pair with jobs rather than replace. *Otto:* "Priya, 34, plans for a family of four, cooks 5 nights/week, distrusts AI nutrition claims."
7. **Opportunity solution tree** — Owner: product trio (PM, design, eng lead). Timing: continuous discovery, updated weekly. *Otto branch:* Outcome "increase trial-to-paid" → Opportunity "I don't know if Otto will work for my diet before paying" → Solutions "dietary quiz that previews a real week plan pre-paywall"; "Ask Otto sample conversation in onboarding" → Assumption test "≥40% of quiz completers view the preview week."
8. **Amazon PR/FAQ** — Owner: PM (single-threaded leader). Timing: before funding a new product/major feature. *Otto headline:* "Otto launches 'Ask Otto': tell it what's in your fridge and it plans your week in 30 seconds." Internal FAQ must answer "What does each chat cost us per subscriber per month, and what stops abuse?"
9. **Shape Up pitch** — Owner: shaper (senior designer/PM/tech lead). Timing: betting table before a 6-week cycle. *Otto:* Appetite: "6 weeks, one designer + two engineers." Rabbit hole: "AI chat proposing recipes not in the catalogue — must constrain to catalogue IDs or we inherit nutrition-accuracy problems." No-go: "No voice input; no grocery-delivery integration this cycle."
10. **One-pager vs PRD vs product spec** — One-pager: problem-first alignment doc, pre-commitment. PRD: fuller requirements (goals, non-goals, user flows, requirements, metrics, launch plan, open questions) owned by PM. "Product spec" is often used for the design+behaviour specification (prototype, flows, states, copy) owned by design with eng. Cagan-school teams treat the high-fidelity prototype as the spec [prior knowledge, unverified this session]. *Otto PRD non-goal:* "Restoring purchases across Family Sharing is out of scope for v1."
11. **User story map** — Owner: PM with team. Timing: release planning after discovery. *Otto backbone:* Onboard → Subscribe → Set preferences → Plan week → Shop → Cook → Ask Otto → Review. Walking skeleton slice includes the paywall because the app is unusable without it.

Falling out of favour / older: long upfront PRDs (waterfall-era MRD/PRD pairs) are older practice; personas-only discovery is being supplemented by JTBD; Lean Canvas is most used pre-PMF and is less common in mature product orgs [prior knowledge, unverified this session]. PR/FAQ and Shape Up remain current but are company-specific operating models, not universal standards.

### Gaps
- Could not read SVPG primary articles (svpg.com) or Torres's full producttalk.org text due to network block; owner/timing statements rely on secondary sources and prior knowledge.
- No sourced data on how widely PRD vs PR/FAQ vs Shape Up are used in 2025–26.
- Exact canonical section list of Kevin Yien's and Lenny's templates not retrieved.
- Klement's book *When Coffee and Kale Compete* (2016) and Christensen's "milkshake" JTBD origin not verified here [prior knowledge].

---

## Q2. UX-representation artifacts: flows, journeys, blueprints, edge cases, statecharts, IA, content, screen inventory, copy, usability test plans

### Takeaway
NN/g draws the key line: journey maps describe the user's experience over time and across channels (actions, thoughts, feelings), while user flows describe in-product interactions (user actions + system responses), drawn as flowcharts, task diagrams or wireflows; service blueprints extend journeys downward into frontstage/backstage/support with Shostack's lines of visibility. For engineering-grade precision on UI behaviour, statecharts (Harel 1987, executable via XState) are the strongest artifact because they force every state, including unhappy paths, to be enumerated.

### Cited Findings

**Journey map vs user flow vs wireflow vs task flow**
- NN/g: a journey map captures the user's actions, thoughts and feelings over time and across channels; a user flow captures product-based interactions — key user actions and system responses. Artifacts: journey maps for journeys; wireflows, flowcharts or task diagrams for user flows. — [NN/g: User Journeys vs. User Flows](https://nngroup.com/articles/user-journeys-vs-user-flows)
- NN/g defines wireflows as a design-specification format combining wireframe-style screen layouts with a simplified flowchart of interactions; well-suited to mobile apps where a few screens update dynamically. — [NN/g: Wireflows](https://www.nngroup.com/articles/wireflows/); [Uxcel](https://uxcel.com/lessons/what-are-wireflows-804)
- Task flow vs user flow lacks a crisp canonical definition; one source: task flow = single ideal path for one task, no branches; another: task flow centres on a task, user flow on a specific user/entry point; a third says they barely differ. — [UX Planet glossary](https://uxplanet.org/ux-glossary-task-flows-user-flows-flowcharts-and-some-new-ish-stuff-2321044d837d); [Brianna Caikens, Medium](https://medium.com/@briannacaikens/flowcharts-user-flows-and-task-flows-oh-my-b866e7abf6a0)

**Service blueprint (G. Lynn Shostack, 1984)**
- Introduced by Shostack (a bank executive) in Harvard Business Review, 1984 ("Designing Services That Deliver"), intended as a planning tool to pose "what if?" — [Wikipedia: Service blueprint](https://en.wikipedia.org/wiki/Service_blueprint)
- Lines: line of interaction (direct customer–organisation contact), line of visibility (above = visible to customer; separates onstage/frontstage from backstage), line of internal interaction (customer-facing staff vs support processes). — [Wikipedia](https://en.wikipedia.org/wiki/Service_blueprint); [Strategic Management Insight](https://strategicmanagementinsight.com/tools/service-blueprinting-explained/)
- A secondary source credits NN/g with codifying the modern four-lane UX version; not verified against nngroup.com. — [koji service blueprint guide](https://www.koji.so/docs/service-blueprint-guide)

**Statecharts / state machines for UI**
- Statecharts: a visual formalism for complex reactive systems introduced by David Harel in 1987 extending state machines with hierarchy (nested states), concurrency (orthogonal regions) and history states. — [Recurse Center: Paper of the Week](https://www.recurse.com/blog/59-paper-of-the-week-statecharts-a-visual-formalism-for-complex-systems); [dsebastien: statechart](https://concepts.dsebastien.net/concept/statechart/)
- Benefits: impossible states eliminated by construction; writing down states surfaces missing loading/error/waiting states (statecharts.dev "all states explored"). — [statecharts.github.io: benefit-all-states-explored](https://redirect.github.com/statecharts/statecharts.github.io/blob/master/benefit-all-states-explored.md); [dsebastien](https://concepts.dsebastien.net/concept/statechart/)
- XState is a library for creating, interpreting and executing statecharts; machines are UI-framework agnostic. Trade-offs: learning curve; verbosity for 3–4-state components; diagrams drift from code unless executable. — [Tim Deschryver](https://timdeschryver.dev/blog/my-love-letter-to-xstate-and-statecharts); [wikidocs essay](https://wikidocs.net/blog/@jaehong/12380/)

**Content design / user needs** — GOV.UK requires action-based user needs ("As a… I need… so that…") before writing content. — [GOV.UK: Identify user needs](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs)

### Inferences
Reference cards (owner / timing / format / contents / mistakes / links / Otto line). Definitions beyond the cited ones are [prior knowledge, unverified this session].

1. **User journey map** — Owner: UX research/design. Timing: discovery and after launch for re-design. Format (NN/g): persona/actor, scenario + expectations, phases, actions/mindsets/emotions lane, opportunities, internal ownership. Mistake: built from assumptions, no research; confused with a flow. *Otto phase "Considering":* "Sees TikTok recipe → downloads Otto → hits paywall on screen 6 → emotion dips ('I haven't seen anything yet')."
2. **Service blueprint** — Owner: service design / product ops. Timing: when the experience crosses systems (App Store billing, push, backend AI). Lanes: physical/digital evidence, customer actions, frontstage, backstage, support processes; lines of interaction/visibility/internal interaction. *Otto row:* Customer taps "Start free trial" → frontstage: StoreKit sheet → backstage: receipt validation via server / RevenueCat webhook → support: entitlements table in Supabase updates; failure point: webhook delay leaves paid user locked behind paywall.
3. **User flow / flow map** — Owner: product designer. Timing: after problem framing, before high-fi. Format: flowchart with entry points, screens, decisions (diamonds), system actions, exits; a flow map (whole-app overview) connects all flows. Mistake: only the happy path; no entry points (deep links, push, widgets). *Otto:* "Entry: push notification 'Your week is ready' → if subscribed → Plan screen; else → paywall → on purchase success → Plan screen; on cancel → paywall stays (hard paywall: no dismiss to content)."
4. **Task flow** — single linear path for one task, used for usability tasks and estimates. *Otto:* "Add recipe to Tuesday dinner: Recipe → 'Add to plan' → pick day → pick meal → confirm toast."
5. **Wireflow** — Owner: designer; used for design spec of mobile interactions. *Otto:* three wireframes of Ask Otto chat (empty → streaming answer with recipe cards → card tapped opens recipe sheet) with arrows annotated by gesture.
6. **Scenario / edge-case matrix ("unhappy paths")** — Owner: design + eng + QA jointly. Format: rows = scenarios, columns = conditions (auth, entitlement, network, data volume, permissions, locale, a11y size) → expected behaviour. Mistake: written after build by QA only. *Otto rows:* "Subscription expired mid-session while chat streaming → finish current message, then show paywall"; "Offline + opens Ask Otto → disabled composer with 'You're offline' and cached plan still visible"; "AI returns recipe not in catalogue → drop card, show text only"; "Purchase pending (Ask to Buy) → pending state screen, not paywall loop"; "Restore purchases with no prior purchase → explanatory message."
7. **Statechart** — Owner: tech lead / eng with design review. Timing: once flows stabilise, before implementation of complex components (paywall/entitlement, chat session, onboarding). Can be executable (XState in JS/RN; Swift equivalents are hand-rolled enums/reducers, e.g. TCA) [prior knowledge]. *Otto entitlement statechart:* `unknown → checking → {subscribed | trial | expired | pending | error}`; `chat: idle → sending → streaming → {done | failed | rateLimited}`, with `expired` as a guard that blocks `sending`.
8. **Information architecture & sitemap** — Owner: designer/IA. For iOS the "sitemap" is essentially the tab bar + navigation stack hierarchy + modal/sheets inventory. Mistake: sitemap mirrors org chart or database tables. *Otto:* "Tabs: Plan | Recipes | Ask Otto | Shopping | Profile; Paywall and Onboarding are full-screen covers outside the tab hierarchy."
9. **Content model / content design doc** — Owner: content designer + eng (model maps to schema/CMS). Contents: content types, fields, constraints, relationships, who writes them. *Otto:* "Recipe: title (≤60 chars), hero image (4:3), servings (int), ingredients[] (canonical ingredient id + grams), steps[] (≤280 chars each), dietary tags (enum), source = otto | user | ai."
10. **UX copy / voice & tone doc** — Owner: content design. Contents: voice principles, tone by context, terminology glossary, string patterns (errors, empty states, CTAs), localisation notes. *Otto glossary line:* "Say 'plan', never 'schedule'; say 'Ask Otto', never 'chatbot'; paywall CTA: 'Start my free week'."
11. **Screen inventory** — Owner: design (with eng for parity). Format: table of every screen/sheet/modal with ID, name, entry points, states (empty/loading/error/populated/offline), Figma link, code file, status. Most valuable artifact for "is the build complete?" reviews. *Otto row:* "S-07 Paywall | entry: onboarding end, expired entitlement, deep link | states: loading products, products loaded, purchase in progress, pending, error, restored | Figma node … | PaywallView.swift | Ready for dev."
12. **Usability test plan** — Owner: UX researcher. Contents: objectives/research questions, method (moderated/unmoderated, remote), participants & screener, tasks with success criteria, metrics (task success, time, SEQ/SUS), script, logistics, analysis plan. *Otto task:* "Without help, plan three dinners for next week using only vegetarian recipes. Success = three vegetarian recipes on the plan in <3 min."

### Gaps
- NN/g primary articles on journey maps, service blueprints, usability test plans and their exact component lists could not be fetched; formats above for these are partly from prior knowledge.
- No sourced canonical definition of "screen inventory" or "flow map" (these are practitioner terms without a single originator).
- Stately's current (2025–26) product state (Stately Studio, XState v5) not verified this session.
- No source found for content-model canon (e.g., Kristina Halvorson / content strategy literature) in this session.

---

## Q3. Source of truth per decision, and keeping artifacts in sync

### Takeaway
No single artifact is the source of truth for everything; mature teams assign one owner-artifact per decision type (why → strategy/PR-FAQ; what problem → OST/JTBD; scope → pitch/PRD non-goals; behaviour → flows/statecharts/edge-case matrix; visuals → Figma "Ready for dev" frames + tokens; actual shipped behaviour → code/Storybook) and link rather than duplicate. Figma's own conventions offer only two official handoff statuses, and design-tokens-to-code sync is increasingly treated as the real source of truth for visuals.

### Cited Findings
- Figma Dev Mode has two official handoff statuses: "Ready for dev" (marks sections, frames, components ready to implement) and "Completed" (Organization/Enterprise plans); third-party tutorials listing Draft/In Progress statuses conflict with Figma's docs. — [Figma Help: Dev Mode statuses and notifications](https://help.figma.com/hc/en-us/articles/26781702258583-Dev-Mode-statuses-and-notifications)
- Figma: section statuses denote which screens are ready for dev partners. — [Figma design handoff page](https://figma.com/design-handoff/)
- A third-party handoff guide recommends "one file, one branch, one status per frame" and building against Storybook, with token files (synced from Figma Variables to code) as the source of truth. — [swift-engineer handoff guide](https://swift-engineer.pages.dev/03-design-hig/design-handoff) (secondary)
- Practitioners report confusion over handing off from branches vs main library; one team merges components after handoff and marks "IN DEV" on the component page (anecdotal). — [Reddit snapshot, Feb 2026](https://reddit.sentinel-team.org/posts/1qxob2v/snapshots/2026-02-07T01%3A30%3A38.086581Z)
- Static statechart diagrams drift from code unless they are executable. — [wikidocs essay on statecharts](https://wikidocs.net/blog/@jaehong/12380/)
- OSTs lose value if not continuously updated. — [Ballpark glossary](https://ballparkhq.com/research-glossary/opportunity-solution-tree)

### Inferences
Source-of-truth matrix (recommended for Otto; synthesised):

| Decision | Source of truth | Downstream that must link to it |
|---|---|---|
| Why we exist, who we serve | Vision + strategy (Rumelt kernel) | North Star, PR/FAQ |
| What we measure | North Star + metric tree | OST outcome, PRD success metrics, analytics event spec |
| Which problem next | OST / JTBD research repository | Pitch/PRD problem section |
| Scope & what's out | Shape Up pitch or PRD (appetite, non-goals/no-gos) | Story map slices, tickets |
| Sequence/releases | Story map | Backlog/tickets |
| Cross-system experience | Service blueprint | Flows, backend tech design |
| Screen-to-screen behaviour | Flow map + user flows | Screen inventory, tests |
| Behaviour of a complex component | Statechart + edge-case matrix | Code (ideally generated/executable), QA test cases |
| Visual design | Figma frames marked Ready for dev + Variables/tokens | Code tokens, Storybook/SwiftUI previews |
| Words | Copy doc / glossary + string catalogue (e.g. Xcode String Catalog) | Figma text, code strings |
| What actually shipped | Code + release notes | Everything above (retro-update) |

Sync practices (synthesised; partly [prior knowledge]):
- **One map, many lanes**: put the journey/backbone across the top of one canvas (FigJam/Miro) and hang lanes beneath: story-map tasks, flows, screens (inventory IDs), states, edge cases, analytics events, open questions. This is Patton's backbone generalised; it keeps artifacts aligned by sharing column identity.
- **Stable IDs**: give every screen (S-07), flow (F-03), state, and edge case (E-12) an ID used in Figma frame names, ticket titles, test names and code file headers — the cheapest anti-drift mechanism.
- **Link, don't copy**: PRD links to Figma section and statechart; doesn't paste screenshots that go stale.
- **Version and status**: Figma branches for in-flight work, "Ready for dev"/"Completed" statuses, a changelog page in the file; docs carry a status + last-reviewed date; decisions captured in ADR-style decision logs.
- **Executable where possible**: statecharts in code (XState or Swift enum reducers) and tokens synced from Figma Variables make the artifact and code the same thing.
- **Principal-engineer review checklist**: does every screen in the inventory have all states? does every edge case map to a state? does the paywall/entitlement statechart cover pending, expired, restored, refund? do non-goals appear in tickets? does the North Star have an instrumented event spec?

For Otto specifically, the highest-leverage engineering-owned artifacts are (1) the entitlement/paywall statechart with its edge-case matrix (hard paywall makes every entitlement bug a lockout or revenue leak), (2) the Ask Otto chat session statechart (streaming, rate limit, offline, expired mid-stream), and (3) the screen inventory with per-screen states linked to Figma frames.

### Gaps
- No authoritative published standard for "single map + lanes" found; it is practitioner convention.
- Figma's 2025–26 features beyond Dev Mode statuses (e.g., any newer spec/annotation products) not verified in this session.
- No sourced survey on how professional teams version product docs.
