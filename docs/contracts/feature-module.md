# Contract — Feature Modules (`src/features/*`)

Status: M0 draft · One builder per folder in M3 (two waves of 4–5,
founder decision 3). The 9 folders: recipes · nutrition · cook · cookbook ·
planner · import · auth · profile · share (FRAMEWORK.md §3).

## What every feature folder MUST export (via `index.ts`)

- Its screen component(s), named `<Thing>Screen` — the ONLY thing `app/`
  routes import.
- Its public hooks (`useSaved()`, `useNutrition()`, …) if other features
  legitimately consume them — otherwise nothing else leaks.

## Internal layout (convention, not ceremony)

```
features/<name>/
├── index.ts            public surface — screens + deliberately shared hooks
├── <Name>Screen.tsx    screen(s)
├── components/         feature-private components (no index, not exported)
├── <name>.queries.ts   ALL Supabase/TanStack Query code for the domain
├── <name>.types.ts     domain types (DB shapes come from @/types/database)
└── *.test.mjs          colocated unit tests for pure logic
```

## Rules

1. **Dependencies point one way:** features → `@/shared/*` + `@/types/*`.
   Never feature → feature, except through an exported hook listed in this
   contract's per-feature table (below). Never shared → features.
2. **Server state = TanStack Query only.** No useEffect-fetch, no module
   caches, no contexts for server data. Query keys: `[domain, ...params]`
   (e.g. `['saved', userId]`, `['recipe', id]`).
3. **All Supabase calls live in `*.queries.ts`**, typed via
   `Database` from `@/types/database`. Screens never import supabase-js.
4. **Routes stay thin:** an `app/` file imports one screen and renders it
   (~10 lines). Data loading lives in the feature.
5. **IDs:** `SeedId` / `UserRecipeId` branded types at every boundary;
   raw strings don't cross feature lines.
6. **Zod at trust boundaries only:** edge-function responses and external
   payloads (TheMealDB, import drafts) — not internal props.
7. **Tokens/primitives from `@/shared/ui` + `@/shared/theme`** — a feature
   defining its own colors/fonts/buttons is a review failure.

## Cross-feature hook allowlist

| Hook | Exported by | Consumed by |
|---|---|---|
| `useAuth()` | auth | all |
| `useSaved()` | cookbook | recipes, profile |
| `useNutrition(recipe)` | nutrition | recipes (detail), cook |
| `usePlan()` | planner | recipes (add-to-week), profile |

Anything not in this table = `contract_gap` first.
