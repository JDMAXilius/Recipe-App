# Terminal ticket 00: get up to speed on Otto before taking tasks — START HERE

> **Budget:** reading only, no code changes. About 30–45 min of reading. Written 2026-11-03.
> When done, reply to Juan with a 10-line summary of what you understood and the open questions.

## What Otto is
Otto is an iOS recipe + meal-plan app (Expo / React Native, Expo Router, Supabase, RevenueCat).
A hard paywall (Otto Club subscription) gates the app. AI features (Create chat, recipe import,
nutrition resolve) run in Supabase Edge Functions, **now on OpenAI** (switched from Anthropic in 1.0.22).

## Read in this order
1. `docs/README.md` — how docs are organized (tickets / reference / history).
2. `docs/reference/ARCHITECTURE.md`, `CONTEXT_ENGINEERING.md`, `DESIGN_SYSTEM.md`, `SCREEN_MAP.md` — the codebase map, task→file map, tokens, screens.
3. `app/_layout.tsx` (route guards: signed out → auth only; signed in non-member → onboarding + paywall; members → app) and `src/features/onboarding/launch.ts` (`resolveLaunch`, `LAUNCH_HREF`, `canUseApp`).
4. `docs/flow-maps/README.md` then open `docs/flow-maps/maps/otto.html` (today's app) and `apple.html` (the target model). Skim `research/01` and `research/02`.
5. `docs/redesign-2026-11/README.md` + `docs/redesign-2026-11/docs/02_WHAT_JUAN_WANTS.md` — what Juan wants from the redesign.
6. `docs/tickets/ROADMAP.md` — release history and current state.
7. Project skills in `.claude/skills/` (notably `otto-lead`, `tickets`) and agents in `.claude/agents/`.

## Current state (2026-11-06)
- **`main` = 1.0.24 (53) + the rework, switch off.** 71 commits merged from `claude/new-session-izhr2i`:
  Snap a meal, the action catalogue, first run (Welcome, 3 questions, first week, Save your plan),
  paywall outcomes, Home + Otto tab, Plan actions, prefs on the account, events, security fixes.
  Everything new is behind `EXPO_PUBLIC_FLOW_V2` (`src/shared/flags.ts`), off in shipped builds.
- **Your list:** `TERMINAL_TICKET_REWORK_HANDOFF.md` (builds, device check, SQL, native work).
  **The device checklist:** `CHECKPOINT_1.md`.
- **Roadmaps:** `PRODUCT_ROADMAP.md` (releases), `REWORK_ROADMAP.md` (tickets + Log),
  `DESIGN_ROADMAP.md`, the file plan `docs/architecture/TARGET_TREE.md`.
- **Checks:** `npm run typecheck`, `npm run lint`, `npm test`; database rules: `npm run test:rls`
  (Docker; a throwaway local Supabase, never production). There is no GitHub CI; pushes go to main.

## House rules (non-negotiable)
- Never print, log or commit secrets. Never type API keys into third-party sites.
- Never run `supabase secrets set --env-file` with the local `.env` (empty values overwrite live secrets). Deploy functions via the Supabase MCP (`deploy_edge_function`); `npx supabase` works for local stacks (`npm run test:rls`).
- `gh` CLI isn't installed; use the GitHub API with the git credential token.
- Never edit the original Otto Figma file `mM0uWkHod9rL1Ff1VJ64Au` or the study file `iEA3Aeu3ApmJdJabmAudXm`. Work in `r9QxxN5qDQXjW473H7LKgM` or a new file.
- Before committing: `npx tsc --noEmit` and the unit tests (`npm test`) must pass. Commit only when Juan asks; branch off `main` for code work.
- Apple rules that already caused rejections: 3.1.2(c) (billed amount most prominent, working Terms/Privacy), 5.1.2(i) (consent before any data goes to a third-party AI), 4.8 (Sign in with Apple alongside Google/Facebook), 5.1.1(v) (in-app account deletion).

## Done when
You can answer, without looking: how a new user gets from launch to Discover; which file decides it;
what 1.0.23 changes; what the flow redesign must decide first. Reply to Juan with the summary.
