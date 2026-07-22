# Contract — Feature Modules (`src/features/*`)

Status: M0 draft · One builder per folder in M3 (two waves of 4–5,
founder decision 3). The 9 folders: recipes · nutrition · cook · cookbook ·
planner · import · auth · profile · share (FRAMEWORK.md §3).

## What every feature folder MUST export (via `index.ts`)

- Its screen component(s), named `<Thing>Screen` — what `app/` routes import.
- Its allowlisted shared components (table below) — e.g. `AddSheet` (a sheet,
  not a screen, mounted by the add route) and `ShareCard` (rendered inside
  the recipe detail).
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

## Cross-feature allowlist (hooks AND components)

| Export | Kind | Exported by | Consumed by |
|---|---|---|---|
| `useAuth()` | hook | auth | all |
| `useSaved()` | hook | cookbook | recipes, profile |
| `useNutrition(recipe)` | hook | nutrition | recipes (detail), cook |
| `usePlan()` | hook | planner | recipes (add-to-week), profile |
| `useCookedState()` | hook | cook | cookbook (Cooked filter) |
| `useMyRecipes()` | hook | cookbook | profile ("yours" stat) |
| `NutritionCard` | component | nutrition | recipes (detail) |
| `ShareCard` | component | share | recipes (detail) |
| `AddSheet` | component | import | app add route |
| `PawMark` wiring: use `useSaved()` + `@/shared/ui` PawMark | — | — | — |

Anything not in this table = `contract_gap` first.

## Owner-path boundaries (mechanical merge checks depend on these)

- The M3 `features/nutrition` packet's owner_path **EXCLUDES
  `features/nutrition/engine/`** — the engine is frozen at M1 and owned by
  engine-porter; it appears in every nutrition-feature packet's Don't-touch
  list (code AND data).
- Each feature packet's owner_path is `src/features/<name>/` **PLUS
  `e2e/journeys/<name>.ts` and `e2e/fixtures/<name>.json`** — the journey
  is the packet's acceptance artifact, it must be writable by its builder.
- `owner_path` values must match a row of REBUILD_WORKFLOW §4.4 (as amended
  at M0) or a boundary defined here. A packet with a broader path (e.g.
  `src/`) is invalid — the manager rejects it before spawn.
