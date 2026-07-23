# TERMINAL TICKET — REBUILD 01 · M0 scaffold, crew & contracts

**Goal:** stand up `rebuild/v2` as a real Expo+TypeScript project skeleton,
write the 7-agent crew, and write the contracts everything else codes against.
This is milestone **M0** (REBUILD_WORKFLOW.md §3). Exit = founder signs off the
contracts and the crew is merged.

**Kick-off:** ticket 00's Report-back committed; `rebuild/v2` exists.
**Work branch:** `rebuild/v2` (and short-lived `rebuild/<task>` per packet).

---

## Blocking decisions (answer in REBUILD_STATE.md before the parts they gate)

1. Commit the publishable Supabase anon key in `.env.development`? → gates the
   testing contract + cloud L3.
2. Authed E2E terminal-only? → gates the testing contract.
3. Feature fan-out one wave (6–8) or two (4–5)? → gates ticket 03 sizing.
4. `v1-legacy` pointer README? → cosmetic, decide anytime.

Parts of this ticket not touching those can proceed immediately.

## Part A — Scaffold (task T1.0)

On `rebuild/v2`, create the target tree from FRAMEWORK.md §1 alongside the
existing `mobile/` + `backend/` (they stay until the M4 cutover):

```
app/ · src/{features,shared,types} · supabase/{migrations,functions} · tools/
```

- Expo + TypeScript app config (tsconfig strict, expo-router, path aliases
  `@/features`, `@/shared`).
- Install the agreed libraries: TanStack Query, zod, @supabase/supabase-js.
- Add `.env.example`; decision-1 result governs `.env.development`.
- CI: a GitHub Action running L1+L2 (tsc, lint, `node --test`) on every push to
  `rebuild/v2` — gates must not depend on which session pushed.

## Part B — The crew (task T0.5)

Write the **7** agent definitions in `.claude/agents/` exactly per
REBUILD_WORKFLOW.md §4.2:

`builder · verifier · critic · scout · engine-porter · security-builder · ui-systems`

Each: frontmatter (`name`, `description`, `tools`) + IDENTITY · DOCTRINE · I/O
(prompt = packet, final message = report-back) · STOP RULES (§4 skeleton).
Enforce role separation via the `tools` field — verifier and critic get NO
Write/Edit. Then run a critic panel over the definitions (find the prompt-hole)
before merging.

## Part C — Contracts (tasks T1.1–T1.4)

Write to `docs/contracts/`, then a critic panel review, then **founder sign-off**:

- `database.md` + generated `src/types/database.ts` (Supabase schema is law).
- `engine.md` — the nutrition engine's public API + JSON data shapes (the port
  target for M1; behavior pinned by the existing golden + macro suites).
- `feature-module.md` — what every `features/*` folder must export.
- `ui-components.md` — `shared/ui` component props + tokens.
- `testing.md` — realise TESTING.md as concrete journey-script + fixture
  contracts (`e2e/journeys/`, `e2e/fixtures/`); credentials per decisions 1–2.
- Carry over the advanced-practice additions agreed in discussion: property
  tests for the engine, zod runtime contracts shared client↔edge, branded ID
  types (`SeedId`/`UserRecipeId`).

## Acceptance

- [ ] `rebuild/v2` scaffold builds (tsc clean, app boots to a blank shell)
- [ ] CI green on `rebuild/v2`
- [ ] 7 agent definitions merged, critic-panel-reviewed
- [ ] all contract files written and **founder-approved** (M0 gate)

## Report-back (commit on `rebuild/v2`)

```
scaffold:   builds? Y (tsc/lint/test/web-export clean) · CI green? Y (81e5d6db)
crew:       7 definitions @ 5ead2ce2 · panel: 24 findings, all folded @ 81e5d6db
            (biggest: share-link enumeration via anon SELECT → SECURITY
            DEFINER fns; engine API mismatch vs v1 → realigned flat shape)
contracts:  database · engine · feature-module · ui-components · testing
            + src/types/database.ts generated · founder sign-off? Y (2026-07-21)
open decisions resolved: 1 YES (key committed) · 2 YES (terminal-only)
            · 3 two waves · 4 YES (README done @ c54b1293)
notes:      executed by terminal (founder-directed), not cloud. WORKFLOW §4.4
            ownership addendum + §10 resolution and PACKETS §2 amendments
            made at the M0 gate — manager should fold into next re-read.
```
Flip M0 in `docs/REBUILD_STATE.md`; move this ticket to `docs/archive/`. On M0
sign-off, request ticket 02 (M1 engine + M2 platform) from the manager.
