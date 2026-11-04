# Architecture & Technical Design Documentation Artifacts (mobile client + BaaS + third-party services)

Research context: production iOS recipe/meal-planning app (Otto) = SwiftUI client + Supabase (Postgres, Auth, Storage, Edge Functions, RLS) + RevenueCat (subscriptions/webhooks) + OpenAI (LLM calls via edge functions). Researched 2026-11-04.

**Method note / limitation:** In this session WebFetch could not reach primary sites (c4model.com, arc42.org, adr.github.io, industrialempathy.com all failed DNS under the session network allowlist). Findings below come from WebSearch result summaries, which sometimes point to primary pages (Oxide RFD 1, mas.owasp.org, industrialempathy.com, Apple developer news, OAI GitHub) and sometimes only to secondary blogs. Items marked **[background, unverified this session]** are from well-established prior knowledge and were NOT confirmed against a source here. The report writer should treat them as lower-confidence or verify them.

---

## 1. Design docs, RFCs, one-pagers, system overviews

### Takeaway
A design doc (Google style) is an informal, relatively short document written *before* coding a non-trivial change. It records context/scope, goals/non-goals, the design, alternatives considered, and cross-cutting concerns (security, privacy, observability), and peers review it. RFC/RFD processes (Rust, Oxide, Uber) wrap the same document in a lifecycle with explicit states and PR-based discussion. For a 1–3 person app team, a lightweight one-pager or design doc per significant feature is current practice. A heavy RFC process is overkill.

### Cited Findings
- Malte Ubl's Google design-doc template has these sections: context and scope, goals and non-goals, the actual design (overview plus detail), "cross-cutting" chapters, and alternatives considered. His 2015 draft was later published as "Design Docs at Google" on Industrial Empathy. — [Industrial Empathy: Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/); [Medium mirror](https://medium.com/@cramforce/a152f4484c6b); [2015 draft (Google Doc)](https://docs.google.com/document/d/1B7Hwe93GasGd0pODJZ2kT6UkmJO6uUD-qGzLTVPY3aI/export?format=pdf)
- The doc lists goals and non-goals explicitly. Non-goals are things that could reasonably be goals but are deliberately excluded. — [2015 draft](https://docs.google.com/document/d/1B7Hwe93GasGd0pODJZ2kT6UkmJO6uUD-qGzLTVPY3aI/export?format=pdf); [handbook summary (secondary)](https://handbook-hld.pages.dev/curriculum/interview-framework/design-doc-authoring/)
- Cross-cutting sections cover privacy, security, scalability, and monitoring, so those concerns get addressed and not just kept in mind. A secondary summary says Google requires a dedicated privacy design doc and runs dedicated privacy/security reviews. — [2015 draft](https://docs.google.com/document/d/1B7Hwe93GasGd0pODJZ2kT6UkmJO6uUD-qGzLTVPY3aI/export?format=pdf); [Ted Neward notes (secondary)](https://research.tedneward.com/architecture/design-docs)
- "Alternatives considered" is a fixed section. It makes authors consider other options that could have met the goals and explain why they were rejected. — [2015 draft](https://docs.google.com/document/d/1B7Hwe93GasGd0pODJZ2kT6UkmJO6uUD-qGzLTVPY3aI/export?format=pdf)
- Oxide RFD (Request for Discussion) states, from RFD 1:
  - **prediscussion**: author iterates on a branch, "a collaborative extension of an engineer's notebook"
  - **ideation**: only a clear, narrowly defined topic description
  - **discussion**: discussion happens in a Pull Request
  - **published**: discussion converged, set before merge, still revisable
  - **committed**: idea fully implemented
  - **abandoned**: listed as a state, but the snippets did not define it
  — [Oxide RFD 1](https://rfd.shared.oxide.computer/rfd/0001); [Oxide blog, RFD 1 (2020)](https://oxide.computer/blog/rfd-1-requests-for-discussion)
- The Oxide blog (2020) says the RFD process "has evolved" since it was written, so the current process may differ. Oxide later built dedicated tooling for RFDs. — [Oxide blog 2020](https://oxide.computer/blog/rfd-1-requests-for-discussion); [Oxide: A Tool for Discussion (2023)](https://oxide.computer/blog/a-tool-for-discussion)

### Inferences
- **Design doc** (Google style). **[structure cited above; the rest is background]**
  - *Author:* the engineer leading the work.
  - *Format:* Google Doc or Markdown in the repo.
  - *Sections:* Context & Scope → Goals / Non-goals → Design (system-context diagram, APIs, data storage, code/pseudo-code only where novel, degree of constraint) → Alternatives Considered → Cross-cutting concerns (security, privacy, observability, cost).
  - *When:* the change is ambiguous, cross-team, or hard to reverse.
  - *Reviewers:* peers and tech lead; privacy/security reviewers for sensitive data.
  - *Common mistakes:* writing it after implementation, turning it into an implementation manual, omitting non-goals and alternatives, never updating status.
  - *Example (Otto):* "Design: AI meal-plan generation. An edge function calls OpenAI with the user's pantry and diet prefs. Non-goal: real-time chat."
- **RFC/RFD** (Rust RFCs, Oxide RFDs, Uber-style RFCs). **[background]**
  - *What it adds:* the same content plus a public lifecycle (states, PR discussion, final comment period in Rust's case).
  - *When:* org-wide or user-visible changes that need broad consensus.
  - *Reviewers:* a wide audience; in Rust, a sub-team decides.
  - *Common mistakes:* process theatre for small teams, and RFCs that stall in "discussion" indefinitely.
  - *Example (Otto):* "RFD 7: Move recipe images from Supabase Storage to a CDN. State: discussion."
- **Engineering one-pager.** **[background]**
  - *What it is:* a single page with problem, proposed solution, scope, risks, and open questions.
  - *When:* used before a full design doc to check whether the work is worth doing.
  - *Reviewers:* the tech lead and the PM.
  - *Example (Otto):* "One-pager: offline caching of saved recipes with SwiftData."
- **Technical / system overview doc.** **[background]**
  - *What it is:* a living "how the system works today" description, with a C4 context + container diagram, the key flows, and links to ADRs.
  - *Who owns it:* the architecture owner; it is updated on major changes.
  - *Common mistake:* letting it rot. Mitigate by keeping it in the repo next to the code (docs-as-code).
  - *Example (Otto):* "System overview: SwiftUI app → Supabase (Auth/Postgres/Storage/Edge Fns) → OpenAI, RevenueCat."
- For a solo or small team, a Markdown design doc per epic plus ADRs for each decision is probably the right weight. A full RFD state machine is likely unnecessary.

### Gaps
- Could not fetch Ubl's article to confirm the exact recommended length (often cited as ~10–20 pages, with a "mini design doc" of 1–3 pages) or his "when not to write a design doc" guidance. Both need verification.
- Rust RFC process (FCP, sub-team approval) and Uber's RFC practice were not verified this session.

---

## 2. Architecture Decision Records (ADRs)

### Takeaway
An ADR is a short, immutable record of one architecturally significant decision: context, decision, consequences. Michael Nygard popularised it in 2011. MADR (Markdown Architectural Decision Records) is the most common richer template today. Its current major version, 4.x, adds "Decision Drivers", "Considered Options" with pros/cons, and a "Confirmation" section that says how compliance is checked. ADRs are superseded by new ADRs, never edited to reverse a decision.

### Cited Findings
- The MADR full-template section order is:
  1. Title
  2. Status
  3. Context and problem statement
  4. Decision drivers
  5. Considered options
  6. Decision outcome
  7. Consequences
  8. Confirmation
  9. Pros and cons of the options
  10. More information

  — [MADR reference notes (secondary, npm package)](https://cdn.jsdelivr.net/npm/@harness-forge/cli@1.5.5/skills/madr-decision-log/references/madr-reference.md); [Semantic Anchors: MADR](https://llm-coding.github.io/Semantic-Anchors/anchor/madr)
- "Decision Outcome" follows the pattern "Chosen option: …, because …". "Confirmation" describes how compliance with the decision will be verified. — [tomevault MADR format](https://tomevault.io/tome/zircote/adr/adr-format-madr); [claudepluginhub adr-format-madr](https://claudepluginhub.com/skills/zircote-adr/adr-format-madr)
- One informal source says "Confirmation" was introduced in MADR 3.x/4.x and that Consequences was merged into the outcome. This is a single secondary claim. Some projects use "Validation" instead. — [Semantic Anchors: MADR](https://llm-coding.github.io/Semantic-Anchors/anchor/madr); [Paxman ADR index](https://paxman.readthedocs.io/en/latest/adr/)
- Third-party guides describe MADR 4.0 as the current release. — [search summary of MADR guides, e.g. Microsoft hve-core adr-author](https://skills.cat/skills/microsoft/hve-core/adr-author)

### Inferences
- **Nygard ADR (2011).** **[background, unverified: post "Documenting Architecture Decisions", cognitect.com]**
  - *Sections:* Title, Status, Context, Decision, Consequences. Written in full sentences, 1–2 pages.
  - *Statuses:* proposed, accepted, deprecated, superseded (with a link to the superseding ADR). MADR also commonly uses "rejected".
- **Tooling** **[background]**:
  - `adr-tools` (Nat Pryce, a shell CLI: `adr new`, `adr new -s 3` to supersede). It is old and little maintained but still works.
  - `log4brains` (ADR static site).
  - Store ADRs as `docs/decisions/NNNN-title.md`; MADR's convention is `docs/decisions`.
- **When to write an ADR:**
  - the decision is costly to reverse, affects structure, NFRs, dependencies, interfaces, or construction techniques (the "architecturally significant" test); or
  - someone will later ask "why did we do this?"
- **Reviewers:** the team or tech lead via PR. Merging the PR = accepted.
- **Common mistakes:**
  - recording decisions after the fact with no alternatives
  - editing accepted ADRs in place instead of superseding them
  - giant ADRs that are really design docs
  - recording trivial choices
  - no index
- **Diagrams:** usually none, or a small Mermaid diagram if one helps.
- **Example (Otto):** "ADR-0004: Use RevenueCat (not raw StoreKit 2) for entitlements. Status: accepted. Consequence: webhook → Supabase `entitlements` table is the source of truth server-side."

### Gaps
- Could not open adr.github.io or the MADR GitHub repo to confirm the exact MADR 4.0.0 release date, the official status list, or whether "Consequences" is a separate heading in 4.0. Verify there before quoting.
- Nygard's original post was not fetched.

---

## 3. Architecture models: C4, arc42, 4+1, UML subset, diagrams-as-code

### Takeaway
Current mainstream practice (2025–26) pairs **C4** for diagrams, **arc42** as an optional document skeleton, and **diagrams-as-code** (Structurizr DSL, Mermaid, PlantUML, D2) kept in the repo.
- From UML, only sequence, state machine, and deployment diagrams still earn regular use.
- 4+1 is mainly of historical and conceptual value.
- arc42 v9.0 (July 2025) is the current template.
- Mermaid 11.1+ added an `architecture-beta` diagram type.

### Cited Findings
- C4 has four hierarchical levels:
  - **System Context**: people plus external systems around your system.
  - **Container**: separately deployable or runnable units such as an API server, a database, or a client app. These are not Docker containers.
  - **Component**: the internals of one container.
  - **Code**: optional.

  — [Baeldung: C4 abstraction levels](https://www.baeldung.com/cs/c4-model-abstraction-levels); [dev.to: documentation as code with C4/Structurizr](https://dev.to/dorneanu/documentation-as-code-for-cloud-c4-model-structurizr-1ipe); [dandoescode: C4 with Structurizr](https://www.dandoescode.com/blog/c4-models-with-structurizr)
- Supplementary views: System Landscape (all systems), Dynamic (a runtime flow such as login), and Deployment. — [freeCodeCamp: C4 diagrams](https://www.freecodecamp.org/news/how-to-create-software-architecture-diagrams-using-the-c4-model/)
- Structurizr defines one model in a text DSL and renders many views from it. structurizr-cli and a GitHub Action can render diagrams in CI, and Structurizr Lite runs locally in Docker. — [dornea.nu: documentation as code](https://hn.jakechampion.name/reader/https://blog.dornea.nu/2023/11/02/documentation-as-code-for-cloud-c4-model-structurizr)
- arc42 proposes 12 sections ("compartments") organised top-down:
  1. Introduction & Goals
  2. Constraints
  3. Context & Scope
  4. Solution Strategy
  5. Building Block View
  6. Runtime View
  7. Deployment View
  8. Crosscutting Concepts
  9. Architecture Decisions
  10. Quality Requirements
  11. Risks & Technical Debt
  12. Glossary

  — [docs.arc42.org](https://docs.arc42.org/home/); [INNOQ intro to arc42](https://www.innoq.com/de/blog/brief-introduction-to-arc42); [arc42.org documentation](https://arc42.org/documentation/)
- arc42 template v9.0 is reported as the current release (July 2025). It splits section 10 into a quality-requirements overview and detailed quality scenarios. This comes from a single secondary summary. — [arc42 search summary / interlusion blog](https://interlusion-website.pages.dev/blog/arc42-the-architecture-doc-template-worth-keeping)
- Mermaid `architecture-beta` arrived in Mermaid 11.1.0 (September 2024):
  - It uses `group` and `service` declarations, `in` for nesting, and edges such as `db:R -- L:api`.
  - Icons come from iconify packs (e.g. `logos:`) once registered.
  - Tools pinned to Mermaid 10.x (some Docusaurus setups) cannot render it.

  — [Joplin forum thread](https://discourse.joplinapp.org/t/mermaid-architecture-diagrams-support/42814); [EventCatalog Mermaid docs](https://eventcatalog.dev/docs/development/components/diagram-syntax/mermaid); [Docusaurus discussion](https://github.com/meta/docusaurus/discussions/10508)

### Inferences
- **C4** (Simon Brown). **[levels cited; notation details are background]**
  - *Notation:* notation-independent, but every element needs a name, type (Person / Software System / Container [tech] / Component), short description, and technology. Every relationship needs a labelled, directional arrow saying intent and protocol. Every diagram needs a title and legend.
  - *Author:* the architect or lead dev.
  - *When:* Context + Container early, and keep them current. Write Component diagrams only for complex containers. Code-level diagrams are generally not worth maintaining.
  - *Common mistakes:* mixing abstraction levels in one diagram, unlabelled arrows, no legend, calling microservices "components", drawing Code level by hand.
  - *Mermaid support:* Mermaid has a `C4Context`/`C4Container` syntax (marked experimental for years) **[background]**.
  - *Example (Otto), Container:* "iOS app (SwiftUI) → Supabase Auth [HTTPS/JWT]; → PostgREST [HTTPS]; → Edge Function `generate-plan` [HTTPS] → OpenAI API; RevenueCat → Edge Function `rc-webhook` [HTTPS webhook]."
- **arc42.** *Format:* AsciiDoc/Markdown/Confluence, CC-licensed. Use only the sections you need. For a small app, sections 1, 3, 4, 5, 9 (pointing to ADRs), 10, and 11 cover most value.
  - *Example (Otto), §11:* "Risk: OpenAI latency >10 s on plan generation. Mitigation: stream + cache."
- **4+1** (Kruchten, 1995). **[background, unverified]**
  - *Views:* Logical (functional decomposition), Process (concurrency/runtime), Development (code/module organisation), Physical (deployment to hardware), plus Scenarios (use cases) that tie the four together.
  - *Status:* largely superseded in day-to-day practice by C4 plus arc42 views, though its concepts map directly: Building Block ≈ Logical/Development, Runtime ≈ Process, Deployment ≈ Physical.
  - Flag as older practice.
- **UML subset still used** **[background]**:
  - *Sequence diagrams:* auth flow, purchase → RevenueCat webhook → entitlement refresh.
  - *State machine diagrams:* subscription state: trial → active → grace → billing-retry → expired. Meal-plan generation job: queued/running/succeeded/failed.
  - *Deployment diagrams:* now usually drawn as C4 Deployment diagrams instead.
  - Class/package/use-case diagrams have mostly fallen out of use outside regulated or enterprise contexts.
- **Diagrams-as-code choices** **[partly background]**:
  - *Mermaid:* renders natively in GitHub/GitLab Markdown. Best default for a repo-based small team. Covers sequence, state, ER, flowchart, C4 (experimental), and architecture-beta.
  - *PlantUML:* richest UML, with a C4-PlantUML library. Needs a Java/Graphviz or server render.
  - *D2* (Terrastruct): modern syntax with good auto-layout (ELK/TALA).
  - *Structurizr DSL:* model-first, one model producing many views. Best when the C4 model is the source of truth.
  - *Common mistake:* screenshots of whiteboard diagrams that can't be diffed or updated.

### Gaps
- c4model.com was not reachable, so the official notation checklist and any 2024–25 site or book updates (Simon Brown's "The C4 model" book, 2025?) are unverified.
- The arc42 v9.0 date and the §10 split come from one secondary source.
- Mermaid's current C4 status (still experimental?) was not verified.

---

## 4. Data artifacts: data models, ERDs, data dictionaries, DFDs, privacy inventory

### Takeaway
For a Supabase app, the **physical data model is the migration SQL itself**. Docs add three things: an ERD generated from the schema, a data dictionary (column meaning, PII flag, retention, RLS policy), and a privacy data inventory. The inventory maps each data type to collection purpose, third-party recipients, and tracking status. That mapping feeds Apple's App Store privacy "nutrition label" and the `PrivacyInfo.xcprivacy` manifest.

### Cited Findings
- Privacy manifests (`PrivacyInfo.xcprivacy`, a plist) describe:
  - the data types collected by the app or a third-party SDK
  - tracking domains
  - the "required reason" APIs accessed

  Xcode merges the app and SDK manifests into one report to help build accurate privacy labels. — [Apple Developer News: What's new in privacy on the App Store](https://developer.apple.com/news/?id=av1nevon); [Singular: privacy manifests](https://www.singular.net/blog/privacy-manifests/)
- Apps must declare an approved reason for each required-reason API and may use it only for those reasons. Since 1 May 2024, App Store Connect rejects new apps and updates that don't describe required-reason API use. Apps that include listed "privacy-impacting SDKs" need those SDKs' privacy manifests, and the SDKs must be signed when shipped as binary frameworks. — [Apple Developer News](https://developer.apple.com/news/?id=av1nevon); [SoftTeco](https://softteco.com/blog/apple-privacy-changes); [Singular FAQ](https://support.singular.net/hc/en-us/articles/24045392537243)

### Inferences
- **Conceptual → logical → physical models** **[background]**:
  - *Conceptual:* entities and relationships in business terms (User, Recipe, Ingredient, MealPlan, Subscription).
  - *Logical:* attributes, keys, normalised relations, cardinalities; DB-agnostic.
  - *Physical:* actual Postgres tables, types, indexes, constraints, RLS policies, triggers.
  - Small teams usually keep only the conceptual sketch plus the physical schema.
- **ERD** **[background]**:
  - *Notation:* crow's-foot (Information Engineering) is the de facto standard. Mermaid `erDiagram` uses crow's-foot.
  - *Generation:* from the live schema, using Supabase Studio's schema visualiser or tools like `dbdiagram`/`DBML`/SchemaSpy. Hand-drawn ERDs drift.
  - *Example (Otto):* "`users 1──< meal_plans 1──< meal_plan_items >──1 recipes`".
- **Data dictionary.** *Columns:* table, column, type, nullable, description, PII class, source, retention, RLS/visibility, owner.
  - *Example (Otto):* "`profiles.dietary_prefs` jsonb, user-entered, PII: health-adjacent, sent to OpenAI: yes."
- **DFD** (Yourdon/DeMarco or Gane-Sarson). *Elements:* external entity, process, data store, data flow. Add trust boundaries for threat modelling (see §6).
- **Privacy / data inventory (RoPA-lite).**
  - *Rows:* each data type.
  - *Columns:* Apple label category, purpose (App Functionality / Analytics / Product Personalisation…), linked to identity?, used for tracking?, processors (Supabase, OpenAI, RevenueCat, analytics SDK), retention, deletion path.
  - *When:* before first submission and on every SDK/data change.
  - *Reviewer:* whoever owns App Store Connect submission plus legal/privacy if available.
  - *Common mistake:* forgetting data sent to OpenAI or collected by RevenueCat (purchase history, user ID) when filling labels. Note that RevenueCat publishes its own privacy-label guidance **[background]**.

### Gaps
- Apple's primary documentation pages on label categories and the required-reason API list were not fetched. Category names and the current list of "commonly used SDKs" should be checked on developer.apple.com.
- No 2025–26 changes to the privacy label rules were found or verified.

---

## 5. Interfaces: API contracts, event schemas, webhooks, edge-function contracts

### Takeaway
- **Synchronous HTTP APIs:** OpenAPI. 3.1 is the widely tooled baseline; 3.2.0 was released 19 Sep 2025 as a non-breaking feature release. 3.1 aligned fully with JSON Schema 2020-12 and added top-level `webhooks`.
- **Event-driven / message APIs:** AsyncAPI (3.0 is current per background knowledge; not verified here).
- **Payloads:** JSON Schema.

For a Supabase app, PostgREST auto-exposes an OpenAPI description of tables. The valuable hand-written contracts are for **edge functions** (inputs, outputs, auth, errors, idempotency) and **inbound webhooks** (RevenueCat events).

### Cited Findings
- OpenAPI 3.2.0 was released 2025-09-19. 3.3.0 is listed as TBD. — [OAI OpenAPI-Specification GitHub PR/changelog](https://github.com/OAI/OpenAPI-Specification/pull/5044/files); [Speakeasy OpenAPI release notes](https://www.speakeasy.com/openapi/release-notes)
- OpenAPI 3.1.0 (16 Feb 2021) achieved full JSON Schema 2020-12 compliance and added webhooks support. 3.2.0 builds on that alignment. — [Speakeasy release notes](https://www.speakeasy.com/openapi/release-notes); [Bump.sh: OpenAPI 3.2 what to expect](https://bump.sh/blog/openapi-3-2-what-to-expect/)
- One blog credits 3.2 with adding top-level webhooks. That conflicts with the sources above, and the 3.1 attribution is more reliable. — [anakin.ai blog](https://anakin.ai/blog/10-openapi-3-2-vs-3-1-vs-3-0)
- 3.2 is non-breaking: existing 3.1 descriptions keep working, and it adds ergonomics for documentation, streaming, and security. — [Bump.sh](https://bump.sh/blog/openapi-3-2-what-to-expect/)

### Inferences
- **API contract** (OpenAPI YAML in repo).
  - *Sections:* info, servers, paths/operations, components (schemas, securitySchemes), webhooks.
  - *Author:* backend owner.
  - *Reviewers:* client dev plus a security reviewer.
  - *When:* design-first, before implementing a new endpoint.
  - *Common mistakes:* spec generated after the fact and never validated; no error schemas; missing auth description; no versioning policy.
  - *Diagram:* sequence diagram per non-trivial flow.
- **Edge-function contract** (per function, Markdown or an OpenAPI fragment).
  - *Fields:* name, trigger (HTTP / cron / DB webhook), auth (user JWT vs service role vs signature), request schema, response schema, error codes, timeouts, idempotency key, rate limits, secrets used, downstream calls (OpenAI model, cost per call), logging/PII rules.
  - *Example (Otto):* "`POST /functions/v1/generate-plan`. Auth: user JWT. Body `{days:int, diet:string[]}` → `{plan_id}`. 429 if free tier >3/day. Calls OpenAI with a structured-output JSON Schema."
- **Webhook / event schema.**
  - *Contents:* source, event types, payload schema, signature/authorization verification, retry semantics, ordering, idempotency (dedupe by event id), and replay handling.
  - *Example (Otto):* "RevenueCat → `rc-webhook`: verify the Authorization header secret; upsert `entitlements` by `app_user_id`; dedupe on `event.id`."
  - Exact RevenueCat payload fields: **[background; verify in RevenueCat docs]**.
- **AsyncAPI 3.0** (released Dec 2023 **[background]**). Relevant only if the app adds queues/realtime channels (Supabase Realtime, pg queues). JSON Schema 2020-12 is the shared payload language for OpenAPI 3.1+, AsyncAPI, and OpenAI structured outputs.
- **Outdated flag:** Swagger 2.0 and OpenAPI 3.0 are legacy. New specs should target 3.1 (best tool support) or 3.2.

### Gaps
- AsyncAPI 3.0 release details were not returned by search.
- The specifics of Supabase's auto-generated OpenAPI and of RevenueCat's webhook auth mechanism were not verified this session.

---

## 6. Risk & quality attributes: NFRs, ISO 25010, ATAM, threat modelling (STRIDE), OWASP MASVS

### Takeaway
- **NFRs:** written as measurable *quality attribute scenarios* (SEI style: source, stimulus, artifact, environment, response, response measure) and organised by **ISO/IEC 25010:2023**. The 2023 edition has nine characteristics and renamed Usability → Interaction Capability and Portability → Flexibility, adding Safety. Quoting the 2011 eight-characteristic list is outdated.
- **Threat model:** a DFD with trust boundaries analysed per element with **STRIDE**.
- **Mobile verification baseline:** OWASP **MASVS v2.x** (8 control groups), tested via MASTG.

### Cited Findings
- ISO/IEC 25010:2023 product quality characteristics (9):
  1. functional suitability
  2. performance efficiency
  3. compatibility
  4. interaction capability (replaces usability)
  5. reliability
  6. security
  7. maintainability
  8. flexibility (replaces portability)
  9. safety (new)

  New subcharacteristics: inclusivity and self-descriptiveness (interaction capability), resistance (security), scalability (flexibility). — [quality.arc42.org: ISO 25010](https://quality.arc42.org/standards/iso-25010); [quality.arc42.org: 2023 update](https://quality.arc42.org/articles/iso-25010-update-2023); [ISO/IEC 25010:2023 preview (iTeh)](https://standards.iteh.ai/catalog/standards/iso/8c5bd63e-9e67-4b55-90e3-8cb2b10a2030/iso-iec-25010-2023)
- STRIDE was developed at Microsoft (Praerit Garg, Loren Kohnfelder, late 1990s). It stands for Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege. — [MSDN Magazine: Threat Modeling](https://msdn.microsoft.com/en-us/magazine/cc163519.aspx); [Microsoft Learn: threat modeling module](https://learn.microsoft.com/en-us/training/modules/design-solutions-secure-applications/4-evaluate-application-threats-threat-modeling)
- Microsoft's DFD threat modelling uses processes, data stores, data flows (and external entities) plus **trust boundaries**, the points where the level of trust changes. Every flow crossing a boundary needs authentication, authorization, and validation. The process is: model the architecture and data flows, then apply STRIDE to each element. The Microsoft Threat Modeling Tool generates threats from templates; OWASP Threat Dragon and IriusRisk are alternatives. — [MSDN Magazine](https://msdn.microsoft.com/en-us/magazine/cc163519.aspx); [Microsoft Learn](https://learn.microsoft.com/en-us/training/modules/design-solutions-secure-applications/4-evaluate-application-threats-threat-modeling); [InventiveHQ (secondary)](https://inventivehq.com/knowledge-base/security-compliance/how-to-build-a-stride-threat-model)
- OWASP MASVS v2 has 8 control groups:
  - **STORAGE**: data at rest (cut to 2 controls in v2.0)
  - **CRYPTO**
  - **AUTH**: server-side auth delegated to ASVS
  - **NETWORK**: data in transit
  - **PLATFORM**: OS/IPC/WebView interaction
  - **CODE**: code quality, build config, keeping dependencies updated
  - **RESILIENCE**: anti-reverse-engineering/tampering, typically only for high-value apps
  - **PRIVACY**

  Controls are numbered MASVS-STORAGE-1 and so on. One mapping lists 24 controls in v2.1. — [OWASP MASVS](https://mas.owasp.org/MASVS/); [Using the MASVS](https://mas.owasp.org/MASVS/03-Using_the_MASVS/); [Guardsquare on MASVS v2](https://guardsquare.com/blog/supporting-owasp-masvs-v2-appsweep); [Approov guide](https://blog.approov.io/a-practical-guide-to-owasp-masvs-v2); [OSA v2.1 controls](https://opensecurityarchitecture.org/frameworks/owasp-masvs-v2/controls)

### Inferences
- **NFR / quality attribute scenarios.** **[SEI six-part form: background]**
  - *Example (Otto):* "Source: user; Stimulus: taps 'Generate week plan'; Environment: normal load, 4G; Artifact: generate-plan edge fn; Response: plan shown; Measure: first items streamed ≤3 s p95, complete ≤15 s p95."
  - *Lives in:* arc42 §10 / design doc.
  - *Reviewer:* tech lead plus product.
  - *Common mistake:* untestable adjectives ("fast", "secure").
- **ATAM** (SEI Architecture Tradeoff Analysis Method) **[background, unverified]**:
  - *What it is:* a stakeholder workshop that builds a *utility tree* of prioritised scenarios and identifies sensitivity points, trade-offs, risks, and non-risks.
  - Heavyweight. For a small app team, a lightweight "mini-ATAM" (utility tree + risk list) is the realistic adaptation. Flag full ATAM as enterprise/legacy practice.
- **Threat model doc.**
  - *Sections:* scope; DFD with trust boundaries; assets; threats per element (STRIDE table: element, threat, mitigation, status); assumptions; residual risk.
  - *Author:* the dev.
  - *Reviewer:* a security-minded peer.
  - *When:* new trust boundary (new third party, new edge function, new data type), and annually.
  - *Example trust boundaries (Otto):* device ↔ Supabase; edge fn ↔ OpenAI; RevenueCat ↔ webhook endpoint.
  - *Example threats (Otto):*
    - S: forged RevenueCat webhook → free premium
    - T: client edits `is_premium` column without RLS
    - I: prompt injection leaking other users' data via the OpenAI call
    - D: OpenAI cost-exhaustion by script
    - E: service-role key shipped in the app bundle
  - *Common mistakes:* done once and never updated, no trust boundaries drawn, threats listed without owners or mitigations.
- **Security review checklist.** Map MASVS groups to concrete checks:
  - STORAGE: Keychain for tokens, no PII in logs
  - NETWORK: ATS on, no custom trust
  - AUTH: server-side RLS, JWT validation in edge fns
  - PLATFORM: deep-link validation
  - CODE: dependency updates
  - PRIVACY: data minimisation, matches privacy label
  - For backend (Supabase), use OWASP ASVS plus Supabase's security advisors.

### Gaps
- The MASTG test-case structure and the MASVS-PRIVACY control text were not fetched. The exact current MASVS version (2.1.0?) is unconfirmed from the primary site.
- No primary SEI source was fetched for ATAM or quality attribute scenarios.
- No primary source verified "Microsoft Learn STRIDE definitions" word for word.

---

## 7. Technical strategy docs, engineering roadmaps, tech-debt registers

### Takeaway
Will Larson's model (lethain.com, now the book *Crafting Engineering Strategy*, O'Reilly, Oct 2025) frames a complete engineering strategy as five components: **explore → diagnose → refine → policy → operation**. Policies are high-level choices that address the diagnosis. Operations are the concrete mechanisms that enforce them. This supersedes his earlier, simpler "write five design docs, synthesise a strategy" framing.

### Cited Findings
- Larson's *Crafting Engineering Strategy* (O'Reilly, Oct 2025, ~310 pp.) defines a complete strategy as explore, diagnose, refine, set policy, operate. — [O'Reilly ch. 11](https://www.oreilly.com/library/view/crafting-engineering-strategy/9798341645516/ch11.html); [O'Reilly book page](https://www.oreilly.com/library/view/crafting-engineering-strategy/9798341645516)
- Diagnosis = understanding the current status quo. Guiding policies are high-level choices that leave details to supporting documents and must not contradict one another. Operation = coherent actions under those policies. — [Substack summary](https://stephmifsud.substack.com/p/part-2-whats-your-strategy); [Lenny's Podcast summary](https://rosetta.to/u/lennyspodcast/the-engineering-mindset-will-larson-carta-stripe-uber-calm-digg); [First Round summary](https://rosetta.to/u/firstroundcapital/a-masterclass-in-engineering-leadership-from-carta-stripe-and-uber-will-larson-c)

### Inferences
- **Strategy doc.**
  - *Author:* tech lead / staff engineer.
  - *Reviewers:* engineering leadership and the affected teams.
  - *When:* recurring decisions keep being re-litigated, or a platform choice spans many features.
  - *Common mistakes:* a vision with no diagnosis, policies that are really goals, no operational mechanism.
  - *Example (Otto):* "Diagnosis: AI cost scales with free users. Policy: all OpenAI calls go through edge functions with per-tier quotas; no direct client→OpenAI. Operation: CI check bans the OpenAI SDK in the iOS target; weekly cost dashboard review."
- Larson's earlier essays ("Writing an engineering strategy", 2020; *Staff Engineer*, 2021) used "write five design docs → synthesise into strategy → extrapolate five strategies → vision" **[background, unverified this session]**.
- **Engineering roadmap.**
  - *What it is:* a time-sequenced list of technical initiatives (now/next/later) linked to strategy and product goals.
  - *Common mistake:* a feature list with no technical enablers or debt work.
- **Tech-debt register.**
  - *Columns:* item, location, type (code/architecture/test/doc/dependency/security), impact, interest (cost of delay), effort, owner, decision (fix/accept/monitor), linked ADR.
  - *Where it lives:* arc42 §11 explicitly hosts "Risks and Technical Debt" (cited in §3).
  - *Example (Otto):* "Debt: recipe nutrition computed client-side and server-side with different rounding. Impact: mismatched macros. Fix: single SQL function."

### Gaps
- Could not fetch lethain.com to confirm the original 2020 post's steps or definitions of the "explore" and "refine" stages.
- No primary source checked for staffeng.com guidance on design docs.

---

## 8. Documentation structure: Diátaxis and docs-as-code

### Takeaway
Diátaxis (Daniele Procida, diataxis.fr) is the dominant 2025–26 framework for organising docs. It defines four types by user need on two axes, action vs cognition and acquisition vs application:
- **Tutorials**: learning-oriented.
- **How-to guides**: task-oriented.
- **Reference**: information-oriented.
- **Explanation**: understanding-oriented.

Architecture artifacts mostly sit in *Explanation* (design docs, ADR context, overview) and *Reference* (API contracts, data dictionary, C4 diagrams). Runbooks are *How-to*.

### Cited Findings
- Diátaxis separates documentation into four types based on the user's goal, not subject matter. The types sit on two axes: "what we do vs. what we know" and "acquiring vs. applying knowledge". — [Semantic Anchors: Diátaxis](https://llm-coding.github.io/Semantic-Anchors/anchor/diataxis-framework); [tslateman: Diátaxis explained](https://tslateman.github.io/docs/explanation/diataxis-framework-explained)
- Diátaxis grew from the earlier "Divio documentation system". Its author is Procida (Django core dev, later at Canonical). It is licensed CC-BY-SA 4.0 at diataxis.fr. Adopters cited include Django, Canonical (which officially adopted it), Cloudflare, and Gatsby. — [Diátaxis README (GitHub)](https://github-redirect.dependabot.com/evildmp/diataxis-documentation-framework/blob/main/README.rst); [ecosistemastartup](https://ecosistemastartup.com/diataxis-4-categorias-que-transforman-tu-documentacion-saas/); [pasqualepillitteri](https://pasqualepillitteri.it/news/5527/diataxis-framework-documentazione-ai)
- Docs-as-code for architecture: Structurizr CLI + GitHub Action render C4 diagrams in CI from a DSL checked into the repo. — [dornea.nu](https://hn.jakechampion.name/reader/https://blog.dornea.nu/2023/11/02/documentation-as-code-for-cloud-c4-model-structurizr)

### Inferences
- **Suggested repo layout (Otto)**, mapped to Diátaxis:

  ```
  docs/
    tutorials/      (onboarding: "run the app locally against Supabase")
    how-to/         (runbooks: rotate OpenAI key, replay RevenueCat webhook)
    reference/      (OpenAPI/edge-fn contracts, data dictionary, ERD, privacy inventory, C4 diagrams)
    explanation/    (system overview, design docs, strategy)
    decisions/      (ADRs, MADR)
  ```

  The repo's existing `docs/reference/contracts/` already follows the reference pattern.
- **Docs-as-code practice** **[background]**:
  - Markdown/AsciiDoc in git, reviewed in PRs with the code.
  - Diagrams in Mermaid/D2/Structurizr text.
  - CI lint and link-check (Vale, markdownlint).
  - Optional static-site generation (MkDocs Material, Docusaurus, Astro Starlight).
- *Common mistakes:* mixing tutorial and reference content on one page, and docs living in a wiki disconnected from code changes. Both lead to rot.

### Gaps
- diataxis.fr was not fetched directly. The axis wording comes from secondary sources.
- Current static-site generator recommendations were not researched.

---

### Cross-cutting summary table (for report writer; content synthesised from sections above)

| Artifact | Canonical source/format | Write when | Reviewed by | Diagram notation | Otto one-liner |
|---|---|---|---|---|---|
| Design doc | Ubl/Google; Markdown/Doc | Non-trivial, ambiguous, hard-to-reverse feature | Peers, TL, privacy/security | C4 context/container + sequence | AI meal-plan generation via edge fn → OpenAI |
| RFC/RFD | Rust RFCs, Oxide RFD 1 | Broad-consensus changes | Wide audience / sub-team | As design doc | RFD: move images to CDN |
| One-pager | Informal | Before investing in a design doc | TL + PM | Optional | Offline caching of saved recipes |
| System overview | arc42 subset / C4 | Once, then on major change | Architecture owner | C4 L1–L2, deployment | App → Supabase → OpenAI/RevenueCat |
| ADR | Nygard 2011; MADR 4.x | Each architecturally significant decision | Team via PR | Rarely | ADR-0004 RevenueCat over raw StoreKit |
| C4 diagrams | Simon Brown; Structurizr/Mermaid/PlantUML | Context+Container always; Component if complex | TL | C4 boxes + labelled arrows | Container diagram of app + Supabase + 3rd parties |
| arc42 | arc42 v9 (12 sections) | When a single architecture doc is wanted | TL | Mixed | §11 risk: OpenAI latency |
| UML sequence/state | UML 2.x via Mermaid | Multi-party flows, lifecycle states | Devs | Sequence / state | Purchase → webhook → entitlement |
| ERD / data dictionary | Crow's-foot; generated from schema | Schema changes | Backend owner | `erDiagram` | users─<meal_plans─<items>─recipes |
| Privacy inventory | Apple labels + PrivacyInfo.xcprivacy | Before submission; each SDK/data change | Submitter / privacy | Table (+DFD) | dietary_prefs → OpenAI, linked, not tracking |
| API / edge-fn contract | OpenAPI 3.1/3.2, JSON Schema 2020-12 | Design-first per endpoint | Client dev + security | Sequence | POST generate-plan contract |
| Webhook/event schema | OpenAPI `webhooks` / AsyncAPI 3 | Each inbound/outbound event | Backend + security | Sequence | RevenueCat → rc-webhook, dedupe event.id |
| NFR / QA scenarios | ISO/IEC 25010:2023, SEI scenarios | Design phase; release gates | TL + product | Utility tree | Plan streamed ≤3 s p95 |
| Threat model | STRIDE on DFD with trust boundaries | New trust boundary / annually | Security peer | DFD + boundaries | Forged webhook → free premium |
| Mobile security checklist | OWASP MASVS v2 / MASTG | Pre-release | Security peer | — | Tokens in Keychain; no service key in bundle |
| Strategy | Larson (explore/diagnose/refine/policy/operate) | Recurring re-litigated decisions | Eng leadership | — | All OpenAI via edge fns with quotas |
| Tech-debt register | arc42 §11 / table | Continuously | TL | — | Dual nutrition rounding |
| Docs structure | Diátaxis; docs-as-code | Repo setup | Docs owner | — | docs/{tutorials,how-to,reference,explanation,decisions} |
