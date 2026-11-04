# Otto repo: inventory of existing documentation and representation artifacts (what exists vs. what is missing)

Scope: local repo `/home/user/Recipe-App` only, read-only, at `main` (last commit 2026-11-04, "docs: renumber Apple design pass to 05"). App at `app.json` version 1.0.23, iOS build 52. Sources are repo-relative paths. "git date" = last commit touching the file; many `docs/reference/*` files show 2026-09-30 because of a bulk move, so the "Last updated" line inside the file is the better currency signal where it exists. About 391 files under `docs/`.

## 1. Inventory of existing artifacts, by type

### Takeaway
Otto has unusually rich documentation for a one-founder app: product direction, screen maps, flow maps with scenario lanes, a design-system spec plus code tokens, architecture and API maps, eight module "contracts", a testing strategy with golden nutrition suites and RLS attack tests, CI, release tickets, store metadata, legal and privacy truth tables, and a documented multi-agent operating model. Most of it is either very fresh (Nov 2026 flow/redesign/motion work) or dated mid-2026 and partly stale against the shipped app.

### Cited Findings

**Product / strategy**
- `README.md` (251 lines, git 2026-11-02): product pitch ("the quieter kind of cookbook", 750+ recipes), "What Otto does today", tech stack, structure, architecture and data flow, run/checks/release steps, docs map, status. Current. — [README.md](README.md)
- `docs/reference/otto-feature-definition.md` (112 lines): feature set "redefined from scratch" from 43 reference apps, ranked table-stakes vs differentiators; mentions a north star. Strategy-grade, mid-2026. — [otto-feature-definition.md](docs/reference/otto-feature-definition.md)
- `docs/reference/otto-v2-direction-and-structure.md` (158 lines): v2 decisions on money (membership + 5-day trial), Instagram, import/create, database, tab structure. Decision memo, mid-2026. — [otto-v2-direction-and-structure.md](docs/reference/otto-v2-direction-and-structure.md)
- `docs/history/OTTO_PRD.md` (170 lines): a plain-language PRD ("like opening a restaurant"). Archived in history/, so not current. — [OTTO_PRD.md](docs/history/OTTO_PRD.md)
- `docs/history/OTTO_APP_DESIGN_DOCUMENT.md` (309 lines): "App Design Document", GDD-style living doc holding vision, pillars, features, design system, technical shape. Archived. — [OTTO_APP_DESIGN_DOCUMENT.md](docs/history/OTTO_APP_DESIGN_DOCUMENT.md)
- `docs/history/OTTO_V2_ROADMAP.md`, `BACKEND_ROADMAP.md` (404 lines, "engineering companion"), `NUTRITION_FRAMEWORK_ROADMAP.md`: earlier roadmaps. Archived. — [docs/history/](docs/history/)
- `docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md` (product, store link, platform, business model: Otto Club subscription with free trial and hard paywall) and `02_WHAT_JUAN_WANTS.md` (founder must-haves, e.g. Apple/Google/Facebook sign-in pills in one row, date-based meal plan). Current (2026-11-03). — [01_PROJECT_BRIEF.md](docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md), [02_WHAT_JUAN_WANTS.md](docs/redesign-2026-11/docs/02_WHAT_JUAN_WANTS.md)
- `docs/tickets/ROADMAP.md` (335 lines, 2026-11-04): "Otto Launch Roadmap", top section current as of 2026-11-04, below it the 2026-09/10 launch record; living copy published as a claude.ai artifact. — [ROADMAP.md](docs/tickets/ROADMAP.md)
- `docs/tickets/REWORK_ROADMAP.md` (258 lines, 2026-11-04) + generator `build_rework_roadmap.py` + `rework-roadmap.html`: order of work from today's app to the Apple-checked flow; explicitly "a plan, not shipped code". — [REWORK_ROADMAP.md](docs/tickets/REWORK_ROADMAP.md)
- `docs/history/WEBSITE_ARCHITECTURE.md`: "House of Brands" web strategy (decided, not built). — [WEBSITE_ARCHITECTURE.md](docs/history/WEBSITE_ARCHITECTURE.md)

**UX / flow**
- `docs/reference/SCREEN_MAP.md` (289 lines): "every screen in the app, with the content on it, top to bottom"; build checklist for the redesign with honesty rules (light-only, nutrition is an estimate, no fake ratings). Mid-2026. — [SCREEN_MAP.md](docs/reference/SCREEN_MAP.md)
- `docs/redesign-2026-11/docs/04_SCREEN_INVENTORY.md`: table of every screen to design (Area, Screen, Now, Must cover). Current. — [04_SCREEN_INVENTORY.md](docs/redesign-2026-11/docs/04_SCREEN_INVENTORY.md)
- `docs/redesign-2026-11/SCREEN_REFERENCES.md` (451 lines, 2026-11-04): per-screen redesign decisions vs reference apps, tied to Figma file `r9QxxN5qDQXjW473H7LKgM`; "input for design, not approved". — [SCREEN_REFERENCES.md](docs/redesign-2026-11/SCREEN_REFERENCES.md)
- `docs/redesign-2026-11/tickets/T01..T10`: per-area design tickets (deep study, direction, getting in, paywall, today/plan, shopping/household, discover/recipe, cook/otto/add, account system, build in Figma). — [tickets/](docs/redesign-2026-11/tickets/)
- `docs/flow-maps/` (README 2026-11-04): interactive HTML maps `maps/otto.html` ("Otto today", every route, guards in `app/_layout.tsx`, every navigation call), `otto-next*.html` (v1/v2/current target flow), `apple.html`, six-plus reference apps (Cal AI, Cherrypick, Duolingo, Headspace, MFP, Tiimo) and `field-guide.html`; data-driven by `lanes/*.json` (27 apps incl. `otto.json`) and `build/build.mjs`, `lanes.js`, `figma-lanes.js`. — [flow-maps/README.md](docs/flow-maps/README.md)
- Scenario lanes: `docs/flow-maps/research/04_SCENARIO_LANES.md` ("what each app really does in the 9 edge cases"; evidence graded seen / help doc / ...); Otto's 14 scenario lanes traced from code with `file:line` evidence in `lanes/otto.json`. — [04_SCENARIO_LANES.md](docs/flow-maps/research/04_SCENARIO_LANES.md), [TERMINAL_TICKET_SCENARIO_GAPS.md](docs/tickets/TERMINAL_TICKET_SCENARIO_GAPS.md)
- Flow research: `01_APPLE_AND_INDUSTRY_RULES.md`, `02_REFERENCE_APP_FLOWS.md`, `03_FIGMA_STUDY_FILE.md`, `05_APPLE_DESIGN_FILE_PASS.md` (Apple rule -> Otto today -> change table). All 2026-11-03/04. — [flow-maps/research/](docs/flow-maps/research/)
- UX audits: `docs/ux-audit-2026-10-04/plan.html` ("Otto Screen Plan"), `after.html` ("Otto After Check") + screenshots; `docs/tickets/TERMINAL_TICKET_UX_AUDIT_1_0_20.md` (DONE 2026-10-04); `docs/gold-standard/OTTO_GAP_AUDIT.md` (243 lines, 2026-11-03, read-only audit of `app/`+`src/` at 1.0.23 vs Apple HIG with `file:line` evidence and contrast table); `docs/history/AUDIT.md`, `QA.md` (July 2026). — [OTTO_GAP_AUDIT.md](docs/gold-standard/OTTO_GAP_AUDIT.md)
- Onboarding / splash: `docs/history/ONBOARDING_BRIEF.md`, `SPLASH_BRIEF.md`; `docs/design/intro/README.md` (beat sheet), `SHOT_BREAKDOWN.md` (1.7s intro production spec), `BUILD_NOTE.md`, plus reproducible scripts `rebuild-v3.py`, `normalize.py`. — [docs/design/intro/](docs/design/intro/)
- Route tree in code: `app/` expo-router routes `(auth)/` sign-in, sign-up, forgot-password; `(tabs)/` index, cookbook, create, plan, profile; `recipe/[id]`, `recipe/edit`, `recipe/cook`; plus add, chats, faq, household, journal, notifications, onboarding, otto-club, preferences, shopping, change/reset-password, `auth/callback`. — [app/](app/)

**Design system**
- `docs/reference/DESIGN_SYSTEM.md` (360 lines): "canonical token + component spec", v2 light-only (decision D2), last updated 2026-07-14; Part B authoritative over Part A. — [DESIGN_SYSTEM.md](docs/reference/DESIGN_SYSTEM.md)
- `docs/reference/contracts/ui-components.md` (210 lines): law for `src/shared/ui/` + `src/shared/theme/`; semantic-ink rule "terracotta = computed/interactive, ink = authored"; status "parity draft". — [ui-components.md](docs/reference/contracts/ui-components.md)
- `docs/reference/contracts/motion.md` (122 lines): motion, sound and delight contract; haptic map, sound map, moment registry still "draft awaiting founder sign-off". — [motion.md](docs/reference/contracts/motion.md)
- `docs/motion/MOTION_RESEARCH.md` (488 lines, 2026-11-03): Apple primary sources to Otto, 148-entry catalogue, current motion inventory with HAVE/PARTIAL/ADD status. — [MOTION_RESEARCH.md](docs/motion/MOTION_RESEARCH.md)
- `docs/reference/MASCOT.md` (120 lines): mascot character bible, LOCKED, expression-to-app-state map, generation prompts. — [MASCOT.md](docs/reference/MASCOT.md)
- Voice: `docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md` (palette hex values, macro colours, Lora + SF Pro); `07_IMAGE_AND_FIGMA_RULES.md`. — [05_BRAND_AND_VOICE.md](docs/redesign-2026-11/docs/05_BRAND_AND_VOICE.md)
- Code-side: `src/shared/theme/tokens.ts` + `tokens.contrast.test.mjs` (contrast guarded by a test); 18 primitives in `src/shared/ui/` (Button, Input, Sheet, Toast, Screen, SegmentBar, Bounceable, OttoStates, ErrorBoundary, OfflineBanner...); `src/shared/{motion,haptics,sound}.ts`; `src/shared/vocabulary.guard.test.mjs`. — [src/shared/](src/shared/)
- Legacy/adjacent: `docs/history/V1_DESIGN_SPEC.md` (518 lines, v1 pixel/token spec), `DESIGN_RESEARCH.md`; `docs/reference/bagged/*` is a different product ("Bagged", grocery/prices) with its own SCREEN_MAP, VISUAL_DIRECTION, NAV docs, filed under Otto's reference folder. — [bagged/](docs/reference/bagged/)
- Skills that encode design law: `.claude/skills/apple-gold-standard/` (HIG digests, motion catalogue, flows-and-scenarios, App Store guidelines), `.claude/skills/polish/` (audit-only screen sweep). — [.claude/skills/](.claude/skills/)

**Architecture**
- `docs/reference/ARCHITECTURE.md` (301 lines): "definitive map of the codebase... grounded in the actual source tree". — [ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)
- `docs/reference/FRAMEWORK.md` (181 lines): target framework/rebuild blueprint, status "agreed direction, not yet applied" (2026-07-21) though the rebuild has since shipped. — [FRAMEWORK.md](docs/reference/FRAMEWORK.md)
- `docs/reference/CONTEXT_ENGINEERING.md` (220 lines): single source of truth for an AI agent before touching code: app map, data flows, conventions, gotchas, task-to-file map. — [CONTEXT_ENGINEERING.md](docs/reference/CONTEXT_ENGINEERING.md)
- `docs/reference/PROMPT_ENGINEERING.md` (238 lines): playbook for prompting a coding agent on this repo. — [PROMPT_ENGINEERING.md](docs/reference/PROMPT_ENGINEERING.md)
- `docs/reference/contracts/feature-module.md` (what every `src/features/*` folder must export), `persistence.md`, `engine.md` (nutrition engine laws), `data-ownership.md` ("data lives in data files"). — [contracts/](docs/reference/contracts/)
- Code structure: 14 feature modules in `src/features/` (auth, chat, cook, cookbook, household, import, journal, notifications, nutrition, onboarding, planner, profile, recipes, share). — [src/features/](src/features/)
- `references/reusable-app/` (frontend/backend/shared templates with `EXAMPLE-otto.md`), `references/reusable-website-branding/`, `references/companies/tiimo.md`, `references/altavida/`: reusable cross-project templates. — [references/](references/)

**Data / API**
- `docs/reference/API_ARCHITECTURE.md` (162 lines): "authoritative map of how the app talks to the outside world in v2"; no Express backend; table of Edge Functions with method, auth, rate limit; RPCs (`get_recipe_share`, `get_list_share`, `get_collab_list`) with status vocabulary; HTTP error vocabulary. — [API_ARCHITECTURE.md](docs/reference/API_ARCHITECTURE.md)
- `docs/reference/contracts/database.md` (67 lines): "Supabase schema is law"; regenerate `src/types/database.ts` after every migration; table list "The 9 tables". — [database.md](docs/reference/contracts/database.md)
- `docs/reference/RECIPE_DATA_MODEL.md` (136 lines, 2026-07-23): serving size, metric weight, nutrition, ingredients target schema and phased roadmap. — [RECIPE_DATA_MODEL.md](docs/reference/RECIPE_DATA_MODEL.md)
- `docs/history/OWN_RECIPE_DB.md`: data-ownership migration verdict, medallion architecture, agent-crew map. — [OWN_RECIPE_DB.md](docs/history/OWN_RECIPE_DB.md)
- Schema as code: 25 SQL migrations in `supabase/migrations/` (favorites, recipes, plan_entries, seed_nutrition, shares, collab lists, resolved_ingredients, storage policies, households, otto_recipes, memberships, security-definer hardening, RLS initplan optimisation...); generated types `src/types/database.ts`. — [supabase/migrations/](supabase/migrations/)
- Edge functions: `canonicalize`, `content`, `delete-account`, `generate-recipe`, `import-recipe`, `resolve-nutrition`, `revenuecat-webhook`, plus `_shared/{http,membership,openai}.ts`. — [supabase/functions/](supabase/functions/)
- Data pipeline artefacts: `supabase/otto-recipes/raw/themealdb-2026-07.json`, `canonical/recipes.json`, `media/`; nutrition reference data `src/features/nutrition/engine/data/{usdaTable,usdaCookedTable,cupWeights,pieceWeights,recipeFacts}.json`; scripts in `tools/` (canonicalize, deploy, recompute nutrition, backfill, snapshot TheMealDB). — [tools/](tools/)

**Security / privacy**
- `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` (207 lines, audit 2026-07-25 at 1.0.17 build 35): every App Privacy row cites `file:line`, UNKNOWN where code can't settle it. This is effectively a privacy data inventory. — [APP_PRIVACY_TRUTH_TABLE.md](docs/legal/APP_PRIVACY_TRUTH_TABLE.md)
- `docs/legal/PRIVACY_POLICY.md` / `TERMS_OF_SERVICE.md` (+ HTML): mirrors of the website repo, marked DRAFT, "not legal advice". — [legal/](docs/legal/)
- `docs/audit/2026-10-04-AUDIT.md` (59 lines): full audit of backend (25 migrations, 7 edge functions, live advisors), payments/entitlements, auth, AI consent, client config, release readiness. — [2026-10-04-AUDIT.md](docs/audit/2026-10-04-AUDIT.md)
- `docs/history/TERMINAL_TICKET_SECURITY_HARDENING.md` (375 lines): 4-point security hardening pass mapped to Otto's codebase. — [TERMINAL_TICKET_SECURITY_HARDENING.md](docs/history/TERMINAL_TICKET_SECURITY_HARDENING.md)
- `docs/reference/SSO_SETUP.md`: social sign-in setup. `.claude/agents/security-builder.md`: security doctrine for migrations/edge functions. — [SSO_SETUP.md](docs/reference/SSO_SETUP.md)
- Code: `src/shared/aiConsent*.ts` + test (AI consent gate); `supabase/migrations/tests/rls-attacks.test.mjs` (user B attempts CRUD on user A's rows across every table). — [rls-attacks.test.mjs](supabase/migrations/tests/rls-attacks.test.mjs)
- Stated security stance: committed publishable anon key in `.env.development` "by founder decision — RLS is the security boundary, not key secrecy". — [.github/workflows/keepalive.yml](.github/workflows/keepalive.yml)

**Quality / testing**
- `docs/reference/TESTING.md` (96 lines): testing strategy with a pyramid L1 Unit / L2 Static / L3 Browser journeys on Expo web / L4 Native; rule "any nutrition assertion must cover the macro split". — [TESTING.md](docs/reference/TESTING.md)
- `docs/reference/contracts/testing.md`: layers mapped to concrete commands. — [testing.md](docs/reference/contracts/testing.md)
- 45 `*.test.mjs` unit suites under `src/` plus tests in `supabase/functions/` and `test/smoke.test.mjs`, run by `npm test` (`node --test`). — [package.json](package.json)
- Golden files: `src/features/nutrition/engine/golden.test.mjs` ("GOLDEN NUTRITION CORPUS", pinned kcal ranges are LAW), plus `macroBreakdown`, `laws`, `dataChecksum`, `carbCeiling`, `schemas` suites and `fixtures/seedNutritionRows.json`. — [golden.test.mjs](src/features/nutrition/engine/golden.test.mjs)
- E2E: `e2e/journeys/*.ts` (auth, cook, cookbook, import, nutrition, planner, profile, recipes, share) with JSON fixtures; the header says "AUTHORED NOW, EXECUTES AT SG5", harness-agnostic, with no Playwright/Detox/Maestro dependency in `package.json`. So they are authored but not wired to a runner. — [e2e/journeys/auth.ts](e2e/journeys/auth.ts), [package.json](package.json)
- CI: `.github/workflows/ci.yml` runs `npm ci`, typecheck, lint, test on pushes/PRs to main; `keepalive.yml` pings Supabase every 3 days. — [ci.yml](.github/workflows/ci.yml)

**Delivery / ops / release**
- `README.md` "Release (TestFlight)" steps (bump buildNumber, EAS build, submit, attach to internal group). — [README.md](README.md)
- `eas.json` profiles: build development / preview / production; submit production. — [eas.json](eas.json)
- Release checklists as tickets: `TERMINAL_TICKET_RELEASE_1_0_20.md` ("Release checklist"), `RELEASE_1_0_23.md`, `BUILD_39.md`, `SUBMIT.md`, `PUBLISH.md` (263 lines), `RESUBMIT_2_1.md`, `PURCHASE_TRANSFER_FIX.md` (urgent RevenueCat code 7). History: `PRE_LAUNCH_CHECKLIST.md` (owner-tagged), `TERMINAL_TICKET_RELEASE_READINESS.md`, `TESTFLIGHT.md`, `SUBMISSION.md`. — [docs/tickets/](docs/tickets/)
- Store: `docs/release/STORE_METADATA.md` (every claim traceable to code), `STORE_METADATA_LOCALIZED.md`, `APP_REVIEW_2.1_RESPONSE.md` (409 lines response pack), `store-screenshots/capture.sh`; `scripts/asc.mjs`. — [docs/release/](docs/release/)

**Process / tickets / operating model**
- `docs/README.md`: docs organised into tickets/ (active), reference/, history/, legal/ + Nov 2026 research. — [docs/README.md](docs/README.md)
- `docs/tickets/TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md`: onboarding read for a new session (30-45 min). — [TERMINAL_TICKET_00](docs/tickets/TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md)
- `.claude/skills/tickets/SKILL.md`: cloud-to-terminal handoff loop; "git is the channel"; status derived from `- [ ]` checklists and `> STATUS:` lines; tickets move to `docs/history/` when shipped. — [tickets/SKILL.md](.claude/skills/tickets/SKILL.md)
- `.claude/skills/otto-lead/SKILL.md`: operating mode, honesty laws, locked design system, asset pipeline, verification recipe, key code map, "merged is NOT live", settled data architecture. — [otto-lead/SKILL.md](.claude/skills/otto-lead/SKILL.md)
- `.claude/agents/`: builder (one packet, never verifies own work), verifier (runs ladder V1, read-only), critic (JUDGE/REFUTER, rung V2), security-builder, ui-systems, delight, engine-porter, canonicalizer. — [.claude/agents/](.claude/agents/)
- `docs/history/REBUILD_WORKFLOW.md` (orchestration plan: phases, agents, branches, cloud/terminal split), `REBUILD_PACKETS.md`, `REBUILD_STATE.md`, `TERMINAL_HANDOFF.md` (master index), `TICKET_SESSION_HANDOFF.md`, `TERMINAL_AGENT_PROMPT.md`. — [docs/history/](docs/history/)
- Decision log: `docs/history/REDESIGN_NOTES.md` "Running Decision Log" (autonomous run from 2026-07-14, every call with rationale); founder decisions are also scattered as "D2", "founder decision 3", "do not re-litigate" inside other docs. — [REDESIGN_NOTES.md](docs/history/REDESIGN_NOTES.md)

**Research**
- Competitive / reference: `docs/history/MOBBIN_COMPARISON.md`, `MOBBIN_GAPS_*`, `DISCOVER_SOCIAL_EXPLORATION.md`, `IMPORT_SHARE_RESEARCH.md`, `NUTRITION_INDUSTRY_RESEARCH.md`, `DESIGN_RESEARCH.md`; Nov 2026 flow research and `MOTION_RESEARCH.md`; flow lanes for 27 apps. — [docs/history/](docs/history/), [flow-maps/lanes/](docs/flow-maps/lanes/)
- Nutrition accuracy research: `NUTRITION_ACCURACY.md`, `NUTRITION_BREAKDOWN*.md`, `SERVING_SIZES.md`, `NOT_HIGH_RECIPES.md`. — [docs/history/](docs/history/)

### Inferences
- Otto's documentation leans heavily toward agent-readable law (contracts, skills, honesty laws, golden tests) and toward UX research. The "how we work" layer is stronger than a typical small team's.
- Many artifacts are HTML or JSON rather than Markdown: flow maps, lane data, roadmap pages. A report should count them as first-class representations, not as attachments.

### Gaps
- I did not open every history/ doc fully; completeness ratings for those rest on headers only.
- I did not render the HTML maps visually. Their descriptions come from titles and the flow-maps README.

## 2. Which standard artifact types exist, which are partial, which are missing

### Takeaway
Present: flow maps, scenario lanes, screen inventory, design-system docs, architecture overview, API map, migrations-as-schema, privacy data inventory, test strategy, golden fixtures, CI, release checklists, roadmaps. Partial or stale: PRD/vision (archived), decision log (archived, informal), data model (no ERD, contract table out of date), E2E (no runner). Missing: ADRs, C4/system diagram, threat model, analytics/tracking plan, observability/crash reporting, runbooks, incident/postmortem docs, personas/JTBD, metrics/KPIs, CHANGELOG, root CLAUDE.md, glossary, CONTRIBUTING.

### Cited Findings
- **ADRs**: no `adr/` or `decisions/` folder; the whole-word search for "ADR" and "architecture decision" in docs/, README, .claude returned 0 files. Decisions live in `docs/history/REDESIGN_NOTES.md` (45 headings/entries) and inline "founder decision" notes. — [REDESIGN_NOTES.md](docs/history/REDESIGN_NOTES.md), [otto-lead/SKILL.md](.claude/skills/otto-lead/SKILL.md) ("settled, founder 2026-07-19 — do not re-litigate")
- **C4 / system diagram**: "C4" matches are ticket or decision IDs, not diagrams. The only system diagram is an ASCII box diagram in `API_ARCHITECTURE.md` (app to Supabase to AI/USDA). — [API_ARCHITECTURE.md](docs/reference/API_ARCHITECTURE.md)
- **ERD / data model diagram**: 0 hits for "ERD" or "entity relationship". `contracts/database.md` claims "The 9 tables" with 0 mentions of `otto_recipes`, `memberships` or `households`, even though migrations `20260723140000_otto_recipes.sql`, `20260723150000_memberships.sql` and `20260722120000_households_*` exist. It is stale. — [database.md](docs/reference/contracts/database.md), [supabase/migrations/](supabase/migrations/)
- **API / edge-function contracts**: `API_ARCHITECTURE.md` documents generate-recipe, resolve-nutrition, content and others, but has 0 mentions of `revenuecat-webhook` or `canonicalize`. It also describes the AI calls as Claude (`claude-opus-4-8`, `claude-haiku-4-5`, `api.anthropic.com`), while `canonicalize`, `generate-recipe` and `resolve-nutrition` import OpenAI (`_shared/openai.ts`) and no function references Anthropic. The redesign brief says "The AI features use OpenAI". So the contract is stale. There is no OpenAPI or JSON-schema spec file (the one "OpenAPI" hit is in the archived pre-launch checklist). — [API_ARCHITECTURE.md](docs/reference/API_ARCHITECTURE.md), [supabase/functions/_shared/openai.ts](supabase/functions/_shared/openai.ts), [01_PROJECT_BRIEF.md](docs/redesign-2026-11/docs/01_PROJECT_BRIEF.md)
- **Threat model**: 0 hits for "threat model"; the single "STRIDE" hit is the word "stride" in an animation note. Security is covered by audits, a hardening ticket and RLS attack tests, not a threat model. — [2026-10-04-AUDIT.md](docs/audit/2026-10-04-AUDIT.md), [TERMINAL_TICKET_SECURITY_HARDENING.md](docs/history/TERMINAL_TICKET_SECURITY_HARDENING.md)
- **Privacy data inventory**: present as `APP_PRIVACY_TRUTH_TABLE.md`, but it was audited at 1.0.17 build 35 (2026-07-25) while the app is at 1.0.23 build 52, with chat, speech recognition, notifications, households and RevenueCat added or changed since. "data retention" is only covered in the privacy policy and the archived BACKEND_ROADMAP. — [APP_PRIVACY_TRUTH_TABLE.md](docs/legal/APP_PRIVACY_TRUTH_TABLE.md), [app.json](app.json)
- **Analytics / tracking plan**: 0 hits for "tracking plan", "KPI", "OKR", "SLO"; "analytics", "posthog" and "amplitude" appear only in the archived release-readiness ticket, the privacy truth table and motion research. `package.json` has no analytics SDK (no PostHog, Amplitude, Mixpanel, Firebase, Segment). — [package.json](package.json)
- **Observability / crash reporting**: "sentry" appears in 11 docs (mostly history tickets) but no Sentry or Crashlytics package is in dependencies; there is an in-app `ErrorBoundary.tsx` only. — [package.json](package.json), [src/shared/ui/ErrorBoundary.tsx](src/shared/ui/ErrorBoundary.tsx)
- **Runbooks / incidents**: "runbook" appears only as a word inside history/ticket docs; 0 hits for "incident" or "postmortem". The closest thing is `TERMINAL_TICKET_PURCHASE_TRANSFER_FIX.md`, an urgent fix ticket for RevenueCat code 7 with no postmortem format. — [TERMINAL_TICKET_PURCHASE_TRANSFER_FIX.md](docs/tickets/TERMINAL_TICKET_PURCHASE_TRANSFER_FIX.md)
- **Personas / JTBD**: 0 hits for "JTBD" or "jobs to be done"; a single "persona" hit in archived `OTTO_V2_ROADMAP.md`. SCREEN_MAP and ONBOARDING_BRIEF use a "job" per screen (via `SCREEN_DECISION_PROMPT.md`), not user personas. — [ONBOARDING_BRIEF.md](docs/history/ONBOARDING_BRIEF.md)
- **User research**: all research is competitive or desk research (Mobbin, help centres, Apple HIG). No user-interview notes, usability-test reports or survey synthesis were found. Feedback is founder feedback (`02_WHAT_JUAN_WANTS.md`) and App Review correspondence. — [02_WHAT_JUAN_WANTS.md](docs/redesign-2026-11/docs/02_WHAT_JUAN_WANTS.md), [APP_REVIEW_2.1_RESPONSE.md](docs/release/APP_REVIEW_2.1_RESPONSE.md)
- **Accessibility**: no Otto accessibility audit doc ("accessibility audit" hits are only in `reference/bagged/*`). A11y is partly covered by `tokens.contrast.test.mjs`, the contrast table in OTTO_GAP_AUDIT and the polish skill's "a11y basics". — [OTTO_GAP_AUDIT.md](docs/gold-standard/OTTO_GAP_AUDIT.md), [tokens.contrast.test.mjs](src/shared/theme/tokens.contrast.test.mjs)
- **CHANGELOG / release notes**: no CHANGELOG file for the app; version history lives in ticket names and the ROADMAP launch record. — [ROADMAP.md](docs/tickets/ROADMAP.md)
- **Root CLAUDE.md**: none in the repo (`git ls-files | grep -i claude.md` is empty). Agent context is carried by `.claude/skills/otto-lead`, `CONTEXT_ENGINEERING.md` and ticket 00. — [CONTEXT_ENGINEERING.md](docs/reference/CONTEXT_ENGINEERING.md)
- **Glossary / CONTRIBUTING / component catalogue**: 0 hits for "glossary", "CONTRIBUTING", "onboarding guide"; no Storybook or component gallery in code (the "storybook" hits mean the illustration style). — searched docs/, README.md, .claude/
- **Feature flags**: no flag system documented; mentioned only in REWORK_ROADMAP and an archived ticket. — [REWORK_ROADMAP.md](docs/tickets/REWORK_ROADMAP.md)
- **E2E execution**: journeys and fixtures exist, but no browser runner dependency and no CI step runs them. CI runs typecheck, lint and unit tests only. The RLS attack test is a manual node script ("Runnable ONLY after the ... migrations are applied"). — [ci.yml](.github/workflows/ci.yml), [rls-attacks.test.mjs](supabase/migrations/tests/rls-attacks.test.mjs)

### Inferences
- The biggest gaps for the "map what exists vs missing" report are the **observability chain** (tracking plan, analytics, crash reporting, runbooks, incident/postmortem), **formal decision records** (ADRs), the **current-state data model** (an ERD, or at least an updated `database.md`), and a **threat model**. Each has a partial substitute in the repo (REDESIGN_NOTES, migrations, audits).
- The second-tier gap is **user-centred product artifacts**: personas, JTBD, user research and success metrics. Product direction comes from the founder plus competitive research.
- Stale "authoritative" docs (API_ARCHITECTURE's AI provider, database.md's table count, FRAMEWORK's "not yet applied", the privacy truth table version) are a risk of their own. A doc-freshness owner or "last verified at commit" convention would address it. Some newer docs (OTTO_GAP_AUDIT, REWORK_ROADMAP) already pin a commit SHA, which suggests the convention exists informally.

### Gaps
- I could not confirm whether analytics or crash reporting is configured outside `package.json` (for example in the EAS or website repo). The privacy truth table mentions PostHog/Amplitude, but I did not read the context.
- Whether the "eas-ios-testflight" and "app-store-submit" skills named in `TERMINAL_TICKET_RELEASE_1_0_23.md` exist elsewhere (they are not in `.claude/skills/`): unknown, probably on the founder's Mac.

## 3. How current and coherent the docs are, and how the team's operating model is documented

### Takeaway
The operating model is well documented: a founder (Juan) plus Claude sessions split into a "cloud" session (no Apple/Expo credentials) and a "terminal" session on the Mac, handing off through `TERMINAL_TICKET_*.md` files in git, with role-specialised subagents and a validation ladder. Currency is mixed. The Nov 2026 artifacts are fresh, the mid-2026 reference docs have drifted, and the docs index itself contains stale pointers.

### Cited Findings
- Handoff loop: active tickets in `docs/tickets/`, archived to `docs/history/` when shipped; "Git is the channel: the cloud session and this terminal both push to main"; ticket status derived from checklist boxes / `> STATUS:` lines. — [tickets/SKILL.md](.claude/skills/tickets/SKILL.md)
- Tickets are written by one session for the other with explicit preconditions and budgets, e.g. "For a Claude Code terminal session on Juan's Mac... with EAS CLI logged in... Written 2026-10-01 by the cloud session, which has no Expo or Apple credentials." — [TERMINAL_TICKET_BUILD_39.md](docs/tickets/TERMINAL_TICKET_BUILD_39.md)
- Agent roles: builder writes one packet in its `owner_path` worktree and "never verifies its own work, never merges"; verifier runs rung V1 (tsc, eslint, unit suites, L3 journeys) read-only; critic is rung V2 (JUDGE or REFUTER); specialist builders for security, UI systems, delight, nutrition engine; canonicalizer is a read-only data curator. — [.claude/agents/](.claude/agents/)
- `otto-lead` skill sets "full-auto operating mode", honesty laws, the "merged is NOT live (learned the hard way, 2026-07-19)" rule and a "do not re-litigate" data architecture. — [otto-lead/SKILL.md](.claude/skills/otto-lead/SKILL.md)
- Rebuild orchestration plan: phases, agents, branches, cloud/terminal split. — [REBUILD_WORKFLOW.md](docs/history/REBUILD_WORKFLOW.md)
- Stale index: `docs/README.md` lists `TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md`, `OWN_RECIPE_DB.md` and `NUTRITION_ACCURACY.md` under `tickets/` (active), but all three are in `docs/history/`. It also omits several active tickets (SCENARIO_GAPS, GOLD_STANDARD_GAPS, PURCHASE_TRANSFER_FIX, REWORK_ROADMAP). `CONTEXT_ENGINEERING.md` likewise says "Active initiatives live in docs/tickets/ — NUTRITION_ACCURACY.md". — [docs/README.md](docs/README.md), [CONTEXT_ENGINEERING.md](docs/reference/CONTEXT_ENGINEERING.md)
- Supersession is marked inline: `TERMINAL_TICKET_FLOW_REDESIGN.md` says "2026-11-04: superseded by REWORK_ROADMAP.md"; `TERMINAL_TICKET_UX_AUDIT_1_0_20.md` says "DONE 2026-10-04" but still sits in `tickets/`. — [TERMINAL_TICKET_FLOW_REDESIGN.md](docs/tickets/TERMINAL_TICKET_FLOW_REDESIGN.md), [TERMINAL_TICKET_UX_AUDIT_1_0_20.md](docs/tickets/TERMINAL_TICKET_UX_AUDIT_1_0_20.md)
- Contract statuses are still "M0 draft" or "parity draft" (database, engine, feature-module, testing, ui-components, persistence), and motion's three maps are "awaiting founder sign-off", even though the app has shipped 1.0.23. — [contracts/](docs/reference/contracts/)
- Mascot doc is "LOCKED" but says name "Otto (working placeholder — final name TBD)", last updated 2026-07-14. — [MASCOT.md](docs/reference/MASCOT.md)
- Off-product content in reference: `docs/reference/bagged/` (5 docs, about 1,700 lines) describes a different app ("Bagged — Knows what you have. Remembers what you paid."). — [bagged/SCREEN_MAP.md](docs/reference/bagged/SCREEN_MAP.md)
- The history folder holds about 80 docs, including the PRD, ADD, QA, pre-launch checklist and decision log. The index calls them "kept, not current... may point at paths that have since moved". — [docs/README.md](docs/README.md)
- Dual sources of truth exist for some artifacts: ROADMAP and REWORK_ROADMAP each have a published claude.ai artifact copy; legal docs are mirrors of the website repo ("Edit there, not here"). — [ROADMAP.md](docs/tickets/ROADMAP.md), [PRIVACY_POLICY.md](docs/legal/PRIVACY_POLICY.md)

### Inferences
- The ticket-as-handoff model doubles as the team's backlog, release checklist and incident record. That is efficient, but it means no stable artifact owns "how to release", "what happened in incident X" or "why we decided Y". The knowledge sits in time-stamped tickets that get archived.
- A good recommendation for the report: promote recurring ticket content into durable docs (a release runbook from the RELEASE/BUILD/SUBMIT tickets, ADRs from REDESIGN_NOTES and "founder decision" lines, a refreshed DB contract or ERD from the migrations), and fix the docs index.

### Gaps
- I did not verify whether ARCHITECTURE.md's tree matches `src/` exactly (for example whether it lists all 14 feature folders; `feature-module.md` names only 9: recipes, nutrition, cook, cookbook, planner, import, auth, profile, share). Chat, household, journal, notifications and onboarding appear to be newer than that contract.
- I found no evidence about who reviews docs for freshness, or about any scheduled doc-review process.
