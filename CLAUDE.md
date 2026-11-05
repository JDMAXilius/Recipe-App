# Otto (Recipe-App)

Otto is an iOS recipe and meal-planning app: Expo SDK 54 + React Native 0.81 + expo-router, Supabase (Postgres + RLS, Auth, Edge Functions), RevenueCat (Otto Club, entitlement `club`), OpenAI behind Edge Functions. Subscription-only: an account and an active Otto Club are required (ADR-0005).

## Start here
- New session: `docs/tickets/TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md`, then the skill `otto-lead` (operating mode, honesty laws, verification).
- Active work board: `docs/tickets/` (cloud ↔ terminal handoff, skill `tickets`). Finished tickets live in `docs/history/`.

## Which doc is the authority for what
When two docs disagree, the one listed here wins; when a doc disagrees with the code, the code wins and the doc gets fixed.

| Question | Authority |
|---|---|
| Why is it built this way? | `docs/adr/` (decision records; Status says if a record still holds) |
| What the app's flow should be | `docs/flow-maps/maps/otto-next.html` + Figma `r9QxxN5qDQXjW473H7LKgM` (page "Flow map — Otto next (current)") |
| What the app does today, screen by screen and edge case by edge case | `docs/flow-maps/maps/otto.html` + `docs/flow-maps/lanes/otto.json` (traced from code) |
| Order of work (releases, gates) | `docs/tickets/PRODUCT_ROADMAP.md` (planning only) |
| Rework and AI tickets (catalogue) | `docs/tickets/REWORK_ROADMAP.md` |
| Launch and store operations | `docs/tickets/ROADMAP.md` |
| System shape, data model, edge-function contracts | `docs/architecture/` (C4, ERD, EDGE_FUNCTIONS) |
| Design system | `docs/reference/DESIGN_SYSTEM.md` + `src/shared/theme/tokens.ts` (tokens are tested) |
| Apple guidelines | skill `apple-gold-standard`; gaps in `docs/tickets/TERMINAL_TICKET_GOLD_STANDARD_GAPS.md` |
| Privacy answers given to Apple | `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` (check its Status line before a submission) |
| Magic moment, North Star, tracking plan | `docs/learning/reports/Otto magic moment research.md`, `docs/product/TRACKING_PLAN.md` |
| How to document things | `docs/learning/reports/App documentation artifacts guide.md` |

`docs/history/` is a record, not instructions. `docs/reference/bagged/` describes a different product.

## Doc freshness
A doc that states facts about the code carries a line under its title:
`Status: current | draft | needs re-audit | superseded · Last verified against code at commit <sha> · <date>`.
If you change code a doc describes, update the doc in the same commit or set its Status to `needs re-audit`.

## Fixed decisions (see the ADRs before reopening)
- One visual style, light only; no Dark Mode (ADR-0007).
- Tab bar: Home · Plan · Cookbook · Account + Otto AI in the trailing circle (ADR-0008).
- AI consent names the provider and is asked before the first AI call (ADR-0006).

## Hard rules
- Never edit the original Otto Figma file `mM0uWkHod9rL1Ff1VJ64Au` or the study file `iEA3Aeu3ApmJdJabmAudXm`; work in `r9QxxN5qDQXjW473H7LKgM`.
- Never print, log or commit secrets. Don't run `supabase secrets set --env-file`.
- Checks before a push: `npm run typecheck`, `npm run lint`, `npm test`.
