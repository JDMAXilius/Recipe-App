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

## Actions (R0.9)

Every change a person can make by hand is an **action**, defined once
(`src/shared/actions/action.ts`), so the screen, Otto, notification buttons,
widgets and Siri all call the same thing.

- **Spec** in `features/<name>/<name>.actions.ts`: `name` (snake_case tool
  name), one-sentence `summary`, `risk` (`safe` | `confirm`), `touches` (query
  domains to refresh), zod `input`, optional `flag`. Pure, relative imports
  only, so `node --test` loads it.
- **Runner** in the feature's `*.queries.ts` as `<name>Run`, typed
  `satisfies Runners<typeof <name>Actions>`. It returns `{ result, undo }`;
  it reads the state an undo needs only when `ctx.wantUndo` is set.
- **Hooks** call runners in `mutationFn` and keep their own optimistic cache.
  Untrusted callers go through `dispatch()`, which validates the input.
- **Catalogue** `src/catalogue/`: `specs.ts` lists every spec (pure);
  `index.ts` binds them to runners. It is the one place besides `app/` that
  reads several features.
- `npm run actions:manifest` writes `supabase/functions/_shared/actions.json`
  (the tools the server can offer the model). `src/catalogue/catalogue.test.mjs`
  fails when that file is stale, when a name is invalid or repeated, or when
  a `useMutation` call neither calls a runner nor carries an
  `// action-exempt: <reason>` comment just above it (AI drafts, photo
  upload and share links are exempt: they change nothing in the app).

## Cross-feature allowlist (hooks AND components)

| Export | Kind | Exported by | Consumed by |
|---|---|---|---|
| `useAuth()` | hook | auth | all |
| `useSaved()` | hook | cookbook | recipes, profile |
| `useNutrition(recipe)` | hook | nutrition | recipes (detail), cook |
| `usePlan()` | hook | planner | recipes (add-to-week), profile, cook (cooked-state), planner shopping |
| `useCookedState()` | hook | cook | cookbook (Cooked filter) |
| `useMyRecipes()` | hook | cookbook | profile ("yours" stat) |
| `NutritionCard` | component | nutrition | recipes (detail), cook (finish screen) |
| `ShareCard` | component | share | recipes (detail) |
| `AddSheet` | component | import | app add route |
| `useMembership()` | hook | profile | app/index + app/_layout (hard paywall gate) |
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
