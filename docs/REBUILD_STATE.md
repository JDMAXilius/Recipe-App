# Otto Rebuild — State Dashboard

> **Read me first, update me last.** Single shared memory for the cloud and
> terminal sessions. The cloud manager is the only writer; terminal
> report-backs land in ticket files and get folded in here. Keep this under
> ~60 lines — history belongs in git, details belong in tickets.

**Last updated:** 2026-07-21 · by terminal (M0 complete, founder signed off)

## Where we are

| | |
|---|---|
| Current milestone | **M0 DONE → M1+M2 open** (ticket 02, parallel tracks) |
| Integration branch | `rebuild/v2` @ 81e5d6db — scaffold + crew + contracts, CI green |
| Legacy snapshot | `v1-legacy` @ c54b1293 · tag `v1.0-legacy` |
| Old-code archive | **pending founder** — classifier blocks mirror push from terminal |
| Last verified commit | 81e5d6db (rebuild/v2, CI green) · main @ 88315a43 green |
| v1 app status | shippable from `main`; both suites green |

## Gates

| Gate | Status |
|---|---|
| M0 Contracts signed | ☑ **founder sign-off 2026-07-21** (critic panel: 24 findings folded) |
| M1 Engine green | ▶ in progress (ticket 02) |
| M2 Platform ready | ▶ in progress (ticket 02) |
| M3 Features merged | ☐ blocked on M1+M2 |
| M4 Converged + device QA | ☐ blocked on M3 |

## Open packets / tickets

| Ticket | Status |
|---|---|
| REBUILD_00 source control | **done** (archive mirror still pending founder) |
| REBUILD_01 M0 scaffold/crew/contracts | **done** (report-back in docs/archive/) |
| REBUILD_02 M1 engine + M2 platform | **issued — in progress, terminal** |
| REBUILD_03–04 | issued after their gate (see INDEX) |

## Blockers

- Old-code archive: founder must run `git clone --mirror` + `git push --mirror`
  to Old-recipe-app.git (terminal permission classifier blocks both).

## Open decisions (founder) — ALL RESOLVED 2026-07-21

1. Commit publishable Supabase anon key (`.env.development`)? — **YES**
2. Authed E2E terminal-only until stabilization? — **YES, terminal-only**
3. SG4 feature fan-out? — **two waves of 4–5**
4. Pointer README on `v1-legacy`? — **YES**

## How to update this file

- Flip a gate checkbox only when its exit condition in `REBUILD_WORKFLOW.md §3` validated.
- New packet issued → add one line under Open packets (id · owner_path · status).
- Packet merged → remove its line; bump "Last verified commit".
- Never append history here — this is a dashboard, not a log.
