# Delivery & Operations Artifacts, and Leadership Role Responsibilities (consumer iOS recipe app, 2025-2026)

Research method note: this session's network blocked direct fetches of dora.dev, sre.google and staffeng.com (DNS refusal). Apple's App Store Connect help could be fetched directly. Everything else is from web search result summaries (mostly secondary sources). Items marked "practitioner synthesis" in Inferences are the researcher's own knowledge/judgment and are NOT sourced; the report writer should present them as guidance, not cited fact. Running example throughout: "Otto", an iOS recipe app with a subscription (paywall, free trial), built by a founder plus AI coding agents.

## A1. Roadmaps and planning artifacts (now/next/later, outcome vs feature, timeline vs theme, OKRs, milestones, release plans/trains)

### Takeaway
Now/Next/Later (invented by Janna Bastow and co-founder Simon at ProdPad) is the dominant lightweight, outcome-oriented alternative to date-driven Gantt/timeline roadmaps; it can still carry dates where real commitments exist. For a solo founder, a single Now/Next/Later board whose items are framed as problems/outcomes, plus a quarterly OKR set and a per-release plan, covers all roadmap needs.

### Cited Findings
- Janna Bastow describes herself as having invented the Now-Next-Later roadmap and co-founded Mind the Product and ProdPad — [Product Hunt AMA](https://www.producthunt.com/discussions/ama-today-i-invented-the-now-next-later-roadmap-co-founded-mind-the-product-prodpad)
- The first version had three columns labelled "current - near term - future"; it was developed with co-founder Simon — [Melissa Perri podcast, "Mapping Out Now, Next, and Later"](https://melissaperri.substack.com/p/mapping-out-now-next-and-later-with-332)
- Her core critique of timeline roadmaps: the format lets you step away from "the problem of having dates for EVERYTHING, which is what a timeline roadmap has"; she also says it is "a fallacy that a Now-Next-Later roadmap CAN'T have dates on it" — [Product Hunt AMA](https://www.producthunt.com/discussions/ama-today-i-invented-the-now-next-later-roadmap-co-founded-mind-the-product-prodpad)
- Lenny's Podcast episode covers the limitations of timeline-based Gantt charts and building better roadmaps — [Lenny's Newsletter](https://www.lennysnewsletter.com/p/building-better-roadmaps-janna-bastow)

### Inferences
- Practitioner synthesis (unsourced) — artifact reference:
  - **Now/Next/Later roadmap.** Definition: horizon-based roadmap; certainty decreases left to right. Canonical source: ProdPad. Sections: Now (committed, in flight), Next (shaped, likely), Later (problems worth solving, not shaped); each card = problem/objective, target outcome/metric, linked ideas/experiments. Example: "Now: cut onboarding drop-off before first saved recipe (goal: 40% -> 55% save-in-session-1)."
  - **Outcome-based vs feature roadmap.** Outcome roadmap lists outcomes/problems (e.g., "increase trial-to-paid conversion"); feature roadmap lists deliverables ("ship meal planner"). Example: outcome "raise week-4 retention among trial users" vs feature "add grocery list export".
  - **Timeline/Gantt roadmap.** Bars on dates with dependencies; suited to fixed external dates (WWDC, holiday campaign, contractual launches). Example: "Holiday recipes pack: design Nov 3-14, build Nov 10-28, submit Dec 1."
  - **Theme roadmap.** Groups work by strategic themes (e.g., "Cook confidently", "Plan the week", "Monetize fairly"); often combined with now/next/later.
  - **OKRs.** Objective (qualitative) + 2-5 Key Results (measurable), quarterly. Example: "O: Make Otto the easiest way to cook tonight. KR1: D7 retention 25% -> 32%; KR2: trial-to-paid 8% -> 11%; KR3: crash-free sessions >= 99.8%."
  - **Milestones.** Dated checkpoints with exit criteria. Example: "M2 Paywall GA: StoreKit 2 purchase + restore, server receipt validation, 0 P1 bugs, App Review approved."
  - **Release plan.** Per-version doc: scope, flags, rollout steps, owners, go/no-go criteria, rollback. Example: "v2.4.0: meal planner (flag `meal_planner_v1`, 10% of new users), phased release on, go/no-go Thu."
  - **Release train.** Fixed cadence (e.g., weekly/biweekly cut) where whatever is merged and flagged rides the train; unfinished work stays behind flags. Large mobile teams commonly use weekly trains; a solo founder can use a lighter "ship when green, at most weekly" cadence to limit App Review overhead.
- For founder + AI agents: one living roadmap file (Now/Next/Later) in the repo is enough; OKRs give agents a measurable "why"; Gantt only for hard external dates.

### Gaps
- Could not fetch ProdPad's own Now/Next/Later template page (network) to quote its official card fields.
- No primary source retrieved for release-train practice at mobile companies.

## A2. Release mechanics: feature flags, phased rollout (App Store phased release, TestFlight), changelogs/release notes, versioning

### Takeaway
Apple's phased release spreads an update over 7 days (1/2/5/10/20/50/100%), only to auto-update users, pausable for up to 30 days total; TestFlight allows 100 internal and 10,000 external testers with builds expiring after 90 days. Because phased release cannot block manual downloads and cannot roll back a binary, server-side feature flags are the real kill switch for a mobile app.

### Cited Findings
- Phased release schedule over 7 days, cumulative: Day 1 1%, Day 2 2%, Day 3 5%, Day 4 10%, Day 5 20%, Day 6 50%, Day 7 100% — [Apple App Store Connect Help](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
- Pause for a total of 30 days, unlimited number of pauses within that total; resuming picks up on the paused day — [Apple](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
- Recipients are a random sample of users with automatic updates on, on eligible devices, not notified; users who manually download from the App Store can get the version at any time; "Release to All Users" ends the phase early — [Apple](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
- If the app is removed from sale, phased release stops and can't be reused for that version; to restart a controlled rollout you must submit a new version. Required role: Account Holder, Admin, or App Manager — [Apple](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
- TestFlight: builds available for up to 90 days — [Apple TestFlight overview](https://www.developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)
- TestFlight: up to 100 internal testers (App Store Connect users, no review), up to 10,000 external testers via email or public link; first external build of each version needs Beta App Review (turnaround reported variously as 24-48h / 1-2 days) — [Instabug TestFlight guide](https://instabug.com/blog/testflight-guide); [Thunkable docs](https://docs.thunkable.com/publish-to-app-store-ios/testflight-overview) (secondary; verify against Apple)

### Inferences
- Practitioner synthesis (unsourced):
  - **Feature flag strategy doc.** Sections: flag types (release, experiment, ops/kill-switch, permission/entitlement), naming convention, default values shipped in binary, owner, expiry date, cleanup policy, remote-config provider. Example: "`paywall_v3` (experiment, owner founder, expires 2026-12-31, default off, kill switch = revert to paywall_v2)." Critical for mobile because old binaries live for months.
  - **Versioning.** iOS has two fields: marketing version (CFBundleShortVersionString, e.g., 2.4.0, SemVer-like MAJOR.MINOR.PATCH) and build number (CFBundleVersion, monotonically increasing per upload). Example: "2.4.1 (412) — hotfix for crash on recipe import."
  - **Changelog vs release notes.** Changelog = engineering-facing, complete, per version (Keep a Changelog style: Added/Changed/Fixed/Removed/Security). App Store "What's New" = user-facing, short, benefit-led. Example What's New: "Plan your week: drag recipes into a 7-day planner. Plus faster search."
  - **Phased rollout plan.** Combine Apple phased release (binary) with flag ramp (feature) and monitor crash-free sessions + purchase success per stage; pause criteria pre-declared (e.g., crash-free sessions drop >0.3pp vs previous version or purchase errors spike).
- For a founder + AI agents: agents can generate changelog entries from commits/PRs; founder writes the user-facing What's New.

### Gaps
- Exact TestFlight limits came from secondary sources; Apple primary page summary only confirmed the 90-day expiry.

## A3. Operations: runbooks/playbooks, on-call, incident response, blameless postmortems, SLIs/SLOs/error budgets

### Takeaway
Google SRE's canonical artifacts are the SLO document, the error budget policy (freeze non-critical releases when the budget is spent) and the blameless postmortem; PagerDuty's open incident-response docs define roles (Incident Commander, Deputy, Scribe as "command staff", plus Subject Matter Experts). A solo founder needs a scaled-down version: 2-3 SLOs, a one-page severity table, runbooks for the top failure modes, and a short postmortem template.

### Cited Findings
- Google SRE Workbook has "Appendix B - Example Error Budget Policy" as the canonical template — [sre.google workbook](https://sre.google/workbook/error-budget-policy/) (page found via search; content not fetched)
- A widely copied version of the policy halts releases other than P0 issues and security fixes once the four-week budget is spent, lifting the freeze when the budget is positive again — [Real Python glossary](https://realpython.com/ref/software-engineering-glossary/error-budget/) (secondary)
- Workbook burn-rate alerting guidance: page when burn rate 14.4 is sustained for 1 hour (~2% of a 30-day budget consumed); multi-window, multi-burn-rate alerting — [Real Python](https://realpython.com/ref/software-engineering-glossary/error-budget/); [isdown.app](https://isdown.app/blog/error-budget-sre) (secondary)
- Blameless postmortems analyze failed processes and systems rather than people, use a shared template and a judgment-free review — [Jacar blog on SRE Workbook](https://jacar.es/en/the-site-reliability-workbook-patterns-we-still-use/) (secondary)
- PagerDuty: certain roles have one person per incident (e.g., IC) while others can have several (e.g., Subject Matter Expert); the IC picks the scribe at the start, often the Deputy — [PagerDuty Incident Response: Different Roles](https://response.pagerduty.com/before/different_roles/)
- PagerDuty glossary groups Incident Commander, Deputy and Scribe as the "Command Staff" — [PagerDuty glossary](https://response.pagerduty.com/training/glossary/)
- Severity schemes vary: a PagerDuty-derived mirror cites five levels (P1-P5) and advises starting high when impact is unclear; other frameworks use SEV0-SEV3 with staffing scaling by severity — [GitHub gist mirror](https://gist.github.com/jayar95/f0230a9d190ec80027f253524eecf95d); [Rootly](https://rootly.com/incident-response/team-roles) (not PagerDuty's official definitions)

### Inferences
- Practitioner synthesis (unsourced), artifact reference:
  - **SLI/SLO document.** Sections: service, user journeys, SLIs (good events / valid events), SLO targets + window, rationale, error budget, owners, review cadence. Example: "Recipe search API: 99.5% of requests succeed and return < 800 ms over 28 days" and "Purchase flow: 99.9% of StoreKit transactions verified server-side within 10 s."
  - **Error budget policy.** What happens when budget burns (freeze features, reliability work first), escalation, exceptions (security). Example: "If purchase SLO budget exhausted, no feature releases until 7 days green; only fixes ship."
  - **Runbook (procedure for one alert/failure) vs playbook (broader scenario response).** Sections: trigger/alert, impact, diagnosis steps, mitigation, rollback, escalation, verification. Example: "Runbook: Supabase edge function 5xx > 2% — check logs, roll back last deploy, flip `recipe_ai_suggest` flag off."
  - **On-call doc.** Rotation, hours, escalation, paging tools, handoff notes, compensation. For a solo founder: "on-call = founder, alerts only for SEV1/2 (purchases broken, app crash spike, auth outage) to phone; everything else to email digest."
  - **Incident response plan.** Severity table, roles, comms templates (status page, in-app banner, App Store reply), timeline log.
  - **Blameless postmortem.** Sections: summary, impact (users, revenue, duration), timeline, root cause(s)/contributing factors, detection, what went well/poorly, where we got lucky, action items with owners and dates. Example: "2.4.0 crash on iOS 17 when opening shared recipe link: 3.1% of sessions crashed for 9 h; fix: guard nil deep-link param; action: add deep-link UI test."
- For founder + AI agents: postmortems and runbooks are high-value inputs for agents (they become the "don't do this again" memory); keep them in the repo.

### Gaps
- Could not read Google SRE book's postmortem chapter or Appendix B directly (sre.google blocked); exact Google postmortem trigger list (e.g., user-visible downtime beyond threshold, data loss, on-call intervention, resolution time, monitoring failure) is from memory and unverified here.
- PagerDuty's official severity definitions were not retrieved.

## A4. DORA metrics (four keys plus 2024/2025 report changes)

### Takeaway
DORA now has five software delivery performance metrics: throughput (deployment frequency, change lead time, failed deployment recovery time) and instability (change failure rate, deployment rework rate, added 2024). The 2025 report, renamed "State of AI-assisted Software Development", replaced low/medium/high/elite tiers with seven team archetypes and introduced a DORA AI Capabilities Model; its headline is that AI is an amplifier of existing strengths and weaknesses.

### Cited Findings
- The 2024 report added deployment rework rate as a fifth metric: unplanned deployments made in response to production incidents divided by total deployments (e.g., 3 of 10 = 30%) — [Flagsmith](https://www.flagsmith.com/blog/dora-metrics); [Faros AI](https://www.faros.ai/blog/5th-dora-metric-rework-rate-track-it-now); [DORA history page](https://dora.dev/guides/dora-metrics/history/) (search snippet)
- Failed deployment recovery time moved from the stability group to throughput; change failure rate and rework rate together form an "instability" factor — [CD Foundation, "DORA 5 metrics"](https://cd.foundation/blog/2025/10/16/dora-5-metrics/); [Flagsmith](https://www.flagsmith.com/blog/dora-metrics)
- Conflict: some sources date the formal addition of rework rate to 2025 (when benchmarks for all five appeared); the 2024 introduction is better supported — [Coralogix](https://coralogix.com/guides/dora-metrics/) vs [Faros AI](https://www.faros.ai/blog/5th-dora-metric-rework-rate-track-it-now)
- Reliability was called a "fifth metric" in 2021 but DORA later clarified it is operational performance, not delivery performance — [dora.dev history](https://dora.dev/guides/dora-metrics/history/) (search snippet)
- 2025 DORA report announced Sept 23, 2025; ~5,000 respondents, 100+ hours of qualitative data; survey June 13 - July 21, 2025 — [Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)
- 2025 report uses cluster analysis to find seven team archetypes (e.g., "harmonious high-achievers", "legacy bottleneck") drawing on measures including throughput, stability, friction and burnout, replacing low/medium/high/elite clusters — [Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report); [Splunk review](https://www.splunk.com/en_us/blog/learn/state-of-devops)
- 2025 report introduces a DORA AI Capabilities Model of seven foundational practices; "AI is an amplifier" framing; AI adoption associated with increased instability — [Google blog](https://blog.google/technology/developers/dora-report-2025/); [RedMonk review](https://redmonk.com/rstephens/2025/12/18/dora2025/); [Full report PDF](https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf)

### Inferences
- Practitioner synthesis (unsourced): for a mobile app, "deployment" splits into (a) backend/edge-function deploys and (b) App Store binary releases plus remote-config/flag changes; measure DORA on backend deploys and on "changes reaching users" (flag flips count). Example metrics line for Otto: "Deploy frequency (backend): daily; App Store releases: weekly; change lead time: <1 day; CFR: 8%; rework rate: 1 hotfix per 6 releases; recovery: flag-off within 30 min."
- The AI-amplifier finding is directly relevant to founder + AI agents: high throughput from agents without tests/small batches tends to raise instability (rework rate) — track rework rate explicitly.

### Gaps
- Names of the seven AI capabilities and seven archetypes (full list) not retrieved; archetype population shares conflict between reviews (e.g., "Foundational challenges" 10% vs other figures) — check the PDF.
- dora.dev could not be fetched to quote current official definitions.

## A5. Mobile-specific metrics and observability plans (crash-free sessions, app start, ANR/hangs)

### Takeaway
On iOS, Xcode Organizer and MetricKit give launch time (time to first draw), hang rate, and crash/termination data; Android's equivalent quality bar is Google Play's 1.09% user-perceived crash rate and 0.47% user-perceived ANR rate thresholds. An observability plan should name each signal, its source (MetricKit/Organizer, crash SDK, backend logs), target, and alert.

### Cited Findings
- Google Play bad-behavior thresholds: 1.09% user-perceived crash rate, 0.47% user-perceived ANR rate (overall); 8% per phone model; exceeding can reduce store visibility; assessed on last 28 days — [Android vitals](https://developer.android.com/vitals); [Android Developers Blog, Oct 2022](https://android-developers.googleblog.com/2022/10/raising-bar-on-technical-quality-on-google-play.html)
- iOS launch time: Xcode Organizer Launch Time pane shows ms from icon tap until first screen drawn — [Apple: Reducing your app's launch time](https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time.md)
- MetricKit provides a time-to-first-draw histogram for launches (and an optimized-launch variant); reports delivered at most once per day with prior 24h data — [Apple MetricKit docs](https://developer.apple.com/documentation/metrickit.md); [NSHipster MetricKit](https://nshipster.com/metrickit)
- Hangs: UI unresponsive for >= 250 ms; hang rate expressed as seconds of hang per hour of use (WWDC 2026 example: 6 s/hour) — [WWDC21 notes](https://www.wwdcnotes.com/notes/wwdc21/10181); [WWDC 2026 session 222](https://developer.apple.com/videos/play/wwdc2026/222?time=1)

### Inferences
- Practitioner synthesis (unsourced): ANR is an Android concept; on iOS the analogues are hangs and watchdog terminations. Common industry targets: crash-free sessions >= 99.8-99.9%, crash-free users >= 99.5%; cold start p90 under ~1-2 s. (A "400 ms first frame" Apple target circulates, but no Apple source was found confirming it — don't cite.)
- **Observability plan** sections: signals (crash-free sessions/users, launch time, hang rate, network error rate, purchase success rate, backend latency/errors), source tool, dashboard, SLO/threshold, alert route, owner, retention/privacy. Example: "Purchase success rate (StoreKit transaction verified / purchase attempts) — source: server logs + analytics; alert if < 97% over 1h."

### Gaps
- No primary source for crash-free session benchmark targets (Crashlytics/Sentry benchmarks not retrieved).

## A6. Analytics tracking plans, experiment plans, launch checklists, App Store review readiness

### Takeaway
A tracking plan (event taxonomy doc) is a spec of events using object-action names (e.g., "Recipe Saved") with typed properties, owners and trigger definitions; Amplitude guidance suggests roughly 10-200 event types and no more than ~20 properties per event. Experiment plans, launch checklists and App Review readiness lists are standard but were not deeply sourced in this pass.

### Cited Findings
- Object-action naming is the common default across Mixpanel/Amplitude; describes the action that already happened, improves discoverability and reduces duplicates — [Donux tracking plan guide](https://donux.com/how-to-start-product-analytics-tracking-plan)
- Amplitude: pick objects first, then actions; Title Case events (e.g., "Song Played") with snake_case properties ("song_title"); separate event properties from user properties — [Amplitude blog](https://amplitude.com/blog/analytics-tracking-practices)
- Amplitude guidance cited as 10-200 event types per tracking plan, <= 20 properties per event — [Digital Applied 2026 guide](https://www.digitalapplied.com/blog/product-analytics-event-taxonomy-tracking-plan-2026) (secondary)
- PostHog-style alternative: `category:object_action` namespace — [Digital Applied](https://www.digitalapplied.com/blog/product-analytics-event-taxonomy-tracking-plan-2026)

### Inferences
- Practitioner synthesis (unsourced):
  - **Tracking plan** columns: event name, description/trigger, properties (name, type, allowed values, required), platform, owner, status, privacy class, linked metric. Example: "Trial Started | user taps Start Free Trial and StoreKit returns success | plan_id, price_tier, paywall_variant, source_screen."
  - **Experiment / A-B test plan** sections: hypothesis, primary metric, guardrail metrics (refunds, crash rate, retention), audience/allocation, minimum detectable effect + sample size + duration, flag key, decision rule, analysis owner. Example: "Paywall v3 annual-first layout raises trial start rate by 10% relative; guardrail: D7 retention not down >1pp; run 3 weeks or 4k users/arm." Small apps often lack traffic for significance — prefer big-swing tests or sequential testing.
  - **Launch checklist** sections: product (copy, screenshots, What's New), engineering (flags default, migrations, rollback plan), quality (crash-free in TestFlight, test matrix), analytics (events firing), ops (alerts, runbooks), marketing/support (FAQ, App Store reply templates), legal/privacy (privacy labels, ATT prompt).
  - **App Store review readiness** (subscription app): demo account, Restore Purchases, clear pricing/terms on paywall, links to Terms/Privacy, auto-renew disclosure, account deletion in-app, privacy nutrition labels and privacy manifest, no external payment links where disallowed, review notes explaining any hidden/flagged features.

### Gaps
- Apple App Review Guidelines (3.1.x subscriptions, 5.1.1 account deletion) not fetched this pass; the readiness list above is from memory and should be verified against current guidelines.
- No primary source retrieved for experiment plan templates.

## A7. Project/process artifacts: RACI/DACI, decision records, kickoff docs, retrospectives, risk and tech-debt registers, team charters, working agreements

### Takeaway
These are well-established templates (Atlassian Team Playbook popularized DACI, retros, working agreements), but this pass did not retrieve primary sources for them; the definitions below are practitioner synthesis.

### Cited Findings
- No sources retrieved in this pass (search budget spent on higher-uncertainty topics; Atlassian pages not fetched).

### Inferences
- Practitioner synthesis (unsourced):
  - **RACI**: per task/deliverable, who is Responsible, Accountable (one), Consulted, Informed. **DACI** (Atlassian/Intuit): Driver, Approver (one), Contributors, Informed — per decision. Example: "Paywall pricing change — Driver: founder; Approver: founder; Contributors: AI analyst agent, advisor; Informed: support."
  - **Decision record / ADR**: title, status, context, options, decision, consequences, date. Example: "ADR-012: Use StoreKit 2 + server-side App Store Server API verification instead of a third-party paywall SDK."
  - **Kickoff doc**: problem, goals/non-goals, success metrics, scope, milestones, risks, roles, open questions.
  - **Retrospective**: what went well / didn't / try next (or Start-Stop-Continue), action items with owner. Solo founder: a 15-minute weekly written retro, plus "agent retro" on prompts/process that failed.
  - **Risk register**: risk, likelihood, impact, score, owner, mitigation, trigger, status. Example: "Apple rejects paywall for unclear trial terms — L:M, I:H — mitigation: follow 3.1.2 checklist, submit early."
  - **Tech debt register**: item, location, interest (cost of not fixing), principal (effort), risk, proposed fix, priority. Example: "Recipe parsing duplicated in app and edge function — causes nutrition mismatches; fix: single shared parser."
  - **Team charter**: mission, scope, customers, metrics, members/roles, interfaces, decision rights.
  - **Working agreements**: norms (review SLAs, meeting hours, definition of done, how agents' PRs are reviewed/merged).
- For founder + AI agents: ADRs, working agreements (as agent instructions, e.g., CLAUDE.md), and the tech-debt register are the highest-leverage; RACI is mostly moot with one human but DACI still clarifies when external advisors/contractors are consulted.

### Gaps
- Atlassian Team Playbook DACI/retro/working agreement pages not retrieved; cite those directly in the final report if possible.

## B1. Principal engineer / Staff+ (Larson archetypes, Reilly's Staff Engineer's Path)

### Takeaway
Will Larson's Staff Engineer (2021) defines four archetypes — Tech Lead, Architect, Solver, Right Hand — and Tanya Reilly's The Staff Engineer's Path (O'Reilly, 2022) frames the job as three pillars (big-picture thinking, project execution, levelling up others) on a foundation of technical knowledge. Staff+ engineers own technical direction and quality of decisions; they write design docs/ADRs/strategy and review others' designs and postmortems.

### Cited Findings
- Four archetypes: Tech Lead (most common; guides approach and execution of one team or a cluster of teams), Architect (direction/quality of a critical area), Solver (digs into arbitrarily complex problems and finds a path forward; some stay long in an area, others move hotspot to hotspot as guided by leadership), Right Hand (extends an executive's attention; "an unofficial senior organizational leader without direct managerial responsibilities") — [Dan Lebrero book notes](https://danlebrero.com/2022/02/23/staff-engineering-leadership-beyond-the-management-track-book-summary/); [Candor](https://candor.co/articles/career-paths/engineer-archetypes-which-one-are-you); [AlgoDaily](https://algodaily.com/lessons/staff-engineer-vs-engineering-manager/staff-engineer-archetypes-common-patterns) (secondary; staffeng.com blocked)
- Architect and Right Hand archetypes tend to appear only in larger orgs (one summary: ~100 and ~1,000 engineers respectively — secondary, not verified in the book) — [Candor](https://candor.co/articles/career-paths/engineer-archetypes-which-one-are-you)
- Critique: archetypes can become anti-patterns, especially Right Hand (borrowed authority without clarity) — [Alex Ewerlof](https://blog.alexewerlof.com/p/staff-archetypes-are-anti-patterns)
- Reilly's three pillars: big-picture thinking, execution of projects, and levelling up the engineers around you, resting on technical knowledge and experience; all learnable — [O'Reilly preface](https://oreilly.com/library/view/the-staff-engineers/9781098118723/preface01.html)

### Inferences
- Practitioner synthesis (unsourced): Staff+ owns — technical strategy and architecture for an area, cross-team technical decisions, technical quality bar, de-risking big projects. Writes — design docs/RFCs, ADRs, technical strategy/vision docs, migration plans, postmortem analysis for complex incidents, SLO proposals. Reviews — others' design docs, critical PRs, incident postmortems, tech debt priorities, hiring loops. Rituals — architecture/design review, incident review, tech-lead syncs, mentoring 1:1s. Success measures — quality/durability of decisions, project outcomes landed, reduced incidents/toil, engineers grown, org-wide leverage (not personal output).
- For founder + AI agents: the founder is effectively a "tech lead + architect" for the agents; the staff-level artifacts (ADRs, design docs, coding standards) are what steer agents. Solver/Right Hand archetypes don't apply.

### Gaps
- Could not quote staffeng.com's exact archetype definitions; one search summary mis-attributed the "dive into a fire... next fire" description to Architect (it describes the Solver), so secondary summaries were cross-checked but not against the primary text.

## B2. Technical director / Director of Engineering / CTO at a small company

### Takeaway
Camille Fournier's The Manager's Path maps the ladder tech lead -> manager -> senior manager/director -> VP Engineering -> CTO, with the director mainly managing managers and the CTO owning technical strategy and executive/board-level technology decisions; at small companies these collapse into one person who is still close to tech-lead work (Fournier herself started at Rent the Runway as "director of engineering in name and something closer to a tech lead in practice"). In games, "technical director" means the senior technical owner aligning engineering with creative goals.

### Cited Findings
- Fournier joined Rent the Runway as "a manager without a team, a director of engineering in name and something closer to a tech lead in practice," growing into CTO over four years — [O'Reilly, The Manager's Path preface](https://www.oreilly.com/library/view/the-managers-path/9781491973882/preface02.html)
- The book's ladder spans IC -> tech lead -> manager -> senior manager/director -> VP Engineering -> CTO; director centered on managing managers, CTO on technical strategy and the board (summary) — [ClickUp summary](https://clickup.com/blog/the-managers-path-summary); [Welcome to the Jungle](https://www.welcometothejungle.com/en/articles/btc-manager-path-camille-fournier) (secondary)
- Games technical director postings: align engineering efforts with creative and business goals (Crytek); ensure technology strategy supports the team's creative ambitions (PlayStation/Guerrilla); build and lead cross-discipline engineering team — [PlayStation careers](https://careers.playstation.com/studio-technical-director/job/6102828004); [Built In job listing](https://builtin.com/job/technical-director/6648287)

### Inferences
- Practitioner synthesis (unsourced): Small-company CTO owns — architecture and build/buy, security and data protection, reliability (SLOs, incident process), hiring and team structure, engineering budget/vendors, technical due diligence, translating business strategy into technical roadmap. Writes — technical strategy, roadmap (engineering side), ADRs for major bets, security/incident policies, hiring plans. Reviews/approves — release go/no-go, postmortems, SLOs and error budget policy, risk register, vendor contracts. Rituals — weekly eng review/metrics (DORA, crash-free), planning, incident reviews, 1:1s, board/investor updates. Success — delivery predictability, reliability, cost, team health/retention, business outcomes enabled. Director of Engineering (mid/large co.) — owns execution and people across multiple teams, org design, hiring, cross-team planning; less hands-on code.
- For a founder + AI agents: the founder is CTO; "managing" agents resembles managing a team of fast but context-poor juniors — the job shifts to specs, review, guardrails (tests, flags, SLOs) and decision records.

### Gaps
- No primary-source text from the book's director/CTO chapters retrieved; no Dropbox/GitLab ladder pages retrieved this pass (progression.fyi not fetched).

## B3. Creative director, technical creative director, design director, head of product design

### Takeaway
Creative directors own brand vision, campaigns and the creative concept; design directors own execution quality and visual consistency of design work and manage designers; "head of design/product design" is often used interchangeably with design director but implies broader org responsibility. The "technical creative director" / creative technology director bridges creative and engineering, common in agencies (creative technology) and games (technical art/design director: pipelines, tools, shaders, cross-discipline translation). Sources here are thin and mostly secondary.

### Cited Findings
- Creative director leads broader brand vision, creative campaigns and cross-functional collaboration; typical background advertising/branding — [Index.dev](https://www.index.dev/blog/creative-director-vs-director-of-design-key-differences)
- Design director: unlike a creative director, responsible for the overall quality of final creative work and of design elements — [Wikipedia: Design director](https://en.wikipedia.org/wiki/Design_director)
- Design director focuses on design execution, team management and visual consistency — [Tech Behemoths](https://techbehemoths.com/blog/creative-director-vs-design-director-roles-skills-and-how-they-impact-your-projects)
- "Design Director" and "Head of Design" often used interchangeably; "Head of Design" typically implies broader organizational responsibility — [HireQuotient](https://www.hirequotient.com/blog/creative-director-vs-design-director) (secondary)
- Creative technology director serves as a bridge between technical and creative aspects of projects and manages technology professionals — [Yardstick job description](https://yardstick.team/job-description/creative-technology-director)
- Games technical art director: bridges programmers and artists; responsibilities include art production workflows, tools, pipelines, asset optimization, visual scripting and shader development — [EA Technical Art Director posting via Hitmarker](https://hitmarker.net/jobs/electronic-arts-technical-art-director-902329)
- Creative Technology Lead framed as the technical bridge between development environments and creative services — [Heart of the Dawn Games](https://sites.google.com/view/heartofthedawngames/careers/creative-technology-lead)

### Inferences
- Practitioner synthesis (unsourced):
  - **Creative director** — owns: brand idea, tone, campaign concepts, creative quality bar. Writes: creative brief, brand platform/guidelines, campaign concepts. Reviews/approves: brand assets, App Store screenshots/preview video, marketing campaigns, mascot/character usage, launch creative. Success: brand recognition, campaign performance, consistency.
  - **Technical creative director** — owns: feasibility and craft of creative ideas in tech (motion, interactive, shaders, AR), creative pipeline/tooling. Writes: creative-tech specs, prototypes, asset pipeline docs, motion/animation specs. Reviews: implementation fidelity vs. creative intent, performance budgets for creative assets. Success: ambitious creative shipped on time within performance budgets.
  - **Design director / head of product design** — owns: product UX/UI quality, design system, design process and team. Writes: design principles, design system docs, design strategy/vision, critique standards. Reviews/approves: UX specs, design QA before release, accessibility, paywall/onboarding UX. Success: usability/task success, conversion and retention impact, design-system adoption, team growth.
- For Otto: the founder holds all three hats; AI design/build agents need written creative briefs, motion contracts and design-system docs as their "creative director" substitute.

### Gaps
- No AIGA or design-leadership primary source retrieved; no published design career ladder (e.g., GitLab/Liferay handbook) read in detail.

## B4. Comparison: decisions owned, artifacts produced vs reviewed, sign-offs

### Takeaway
Across roles, sign-off follows decision ownership: engineering leaders (CTO/director) sign off release go/no-go, SLOs/error budget policy, incident postmortems and risk registers; staff+ engineers sign off technical designs/ADRs and architecture; design directors sign off UX/design QA and design system; creative directors sign off brand and marketing creative; technical creative directors sign off creative-tech feasibility/fidelity. This matrix is practitioner synthesis grounded in the role findings above.

### Cited Findings
- Role scope evidence: see B1 (Larson/Reilly), B2 (Fournier, games TD postings), B3 (creative/design director sources). No single source providing a cross-role artifact sign-off matrix was found.

### Inferences
- Practitioner synthesis (unsourced) sign-off matrix (A = approves/signs off, W = writes, R = reviews/consulted):
  - Roadmap (Now/Next/Later), OKRs: founder/PM W+A; CTO R; design dir R; creative dir R.
  - Release plan / go-no-go / phased rollout: CTO A; staff eng W/R; design dir R (design QA); creative dir R (What's New, screenshots).
  - Feature flag strategy: staff eng W; CTO A.
  - SLO doc, error budget policy, on-call, incident plan: staff eng W; CTO A.
  - Runbooks: owning engineers W; staff eng R.
  - Postmortems: incident owner W; staff eng R; CTO A (action items).
  - DORA/mobile quality dashboard: staff eng W; CTO owns targets.
  - Observability plan: staff eng W; CTO A.
  - Tracking plan: PM/analyst W; staff eng R (implementation); design dir R (naming of UI events); CTO A for privacy.
  - Experiment plan: PM W+A; design dir R (variants); staff eng R (flags); CTO R (guardrails).
  - Launch checklist and App Review readiness: PM/founder W; CTO A (tech), creative dir A (store creative), design dir A (UX).
  - ADRs/design docs: staff eng W+A for area; CTO A for org-wide bets.
  - Risk register / tech debt register: CTO A; staff eng W (tech debt).
  - Brand guidelines / campaign: creative dir W+A; design dir R.
  - Design system / UX specs: design dir W+A; staff eng R (feasibility); technical creative dir R (motion/assets).
  - Motion/creative-tech specs, asset pipeline: technical creative dir W+A; staff eng R.
  - Team charter / working agreements: CTO/director W+A; all R.
- Very small team (founder + AI agents) minimum viable set: Now/Next/Later roadmap + quarterly OKRs; per-release plan with flag + phased release + rollback; changelog generated by agents; 2-3 SLOs (crash-free sessions, purchase success, API availability); 1-page severity/incident plan and short postmortem template; runbooks for top 5 alerts; tracking plan; experiment template; launch + App Review checklist; ADR log; tech debt register; working agreements as agent instruction files. The founder signs everything; agents draft. Skip RACI, team charters, formal on-call rotations, release trains with fixed cut dates (until multiple contributors).

### Gaps
- No published cross-role sign-off matrix found; matrix is synthesis.
- Skill/competency matrices (progression.fyi, Dropbox, GitLab ladders) not retrieved this pass.
