# Architecture decision records

One short record per decision that shapes Otto's architecture, flow or product model. Format: MADR-lite (`TEMPLATE.md`). Rules (ADR-0001): a record is never rewritten after it is accepted; a new record supersedes it and the old one's Status changes to `Superseded by ADR-NNNN`. Code comments that encode a decision link the ADR. Records marked *backfilled* were written on 2026-11-04 from the commit or log where the decision was made.

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-11-04 |
| [0002](0002-expo-react-native-with-expo-router-file-routes.md) | Expo + React Native with expo-router file routes | Accepted | 2026-07-15 (backfilled) |
| [0003](0003-supabase-as-the-backend-row-level-security-as-the-authorizat.md) | Supabase as the backend, row-level security as the authorization layer | Accepted | 2026-07-15 (backfilled) |
| [0004](0004-revenuecat-for-subscriptions-one-entitlement-named-club.md) | RevenueCat for subscriptions; one entitlement named `club` | Accepted | 2026-09-24 (backfilled) |
| [0005](0005-hard-paywall-an-account-and-an-active-otto-club-are-required.md) | Hard paywall: an account and an active Otto Club are required to use the app | Accepted | 2026-10-04 (backfilled) |
| [0006](0006-ai-runs-on-openai-behind-supabase-edge-functions-with-per-pr.md) | AI runs on OpenAI behind Supabase Edge Functions, with per-provider consent | Accepted | 2026-11-02 (backfilled) |
| [0007](0007-one-visual-style-light-only-no-dark-mode.md) | One visual style: light only, no Dark Mode | Accepted | 2026-11-04 |
| [0008](0008-tab-bar-home-plan-cookbook-account-with-otto-ai-in-the-trail.md) | Tab bar: Home · Plan · Cookbook · Account, with Otto AI in the trailing circle | Accepted | 2026-11-04 |
| [0009](0009-first-run-shows-value-before-the-account-questions-first-wee.md) | First run shows value before the account: questions → first week → save your plan → paywall | Proposed | 2026-11-04 |
| [0010](0010-preferences-live-on-the-account-not-only-on-the-phone.md) | Preferences live on the account, not only on the phone | Proposed | 2026-11-04 |
| [0011](0011-offline-persist-the-query-cache-never-sync-mutations.md) | Offline: persist the query cache, never sync mutations | Accepted | 2026-11-04 (backfilled) |

Proposed records wait for Juan. When one is accepted, change its Status and date, and update `docs/tickets/REWORK_ROADMAP.md` §3.
