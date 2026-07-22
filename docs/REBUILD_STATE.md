# Otto Rebuild — State Dashboard

> **Read me first, update me last.** Single shared memory for the cloud and
> terminal sessions. The cloud manager is the only writer; terminal
> report-backs land in ticket files and get folded in here. Keep this under
> ~60 lines — history belongs in git, details belong in tickets.

**Last updated:** 2026-07-21 · by cloud session (docs created, execution not started)

## Where we are

| | |
|---|---|
| Current milestone | **pre-M0** — blueprint + docs approved, execution NOT started |
| Integration branch | not yet created (`rebuild/v2` pending kickoff) |
| Legacy snapshot | not yet created (`v1-legacy` + tag pending kickoff) |
| Last verified commit | — |
| v1 app status | untouched, shippable from `main` |

## Gates

| Gate | Status |
|---|---|
| M0 Contracts signed | ☐ not started |
| M1 Engine green | ☐ blocked on M0 |
| M2 Platform ready | ☐ blocked on M0 |
| M3 Features merged | ☐ blocked on M1+M2 |
| M4 Converged + device QA | ☐ blocked on M3 |

## Open packets / tickets

_None issued yet._

## Blockers

_None._

## Open decisions (founder)

1. Commit publishable Supabase anon key (`.env.development`) so cloud L3 runs autonomously? — **pending**
2. Authed E2E terminal-only until stabilization? — **lean yes, unconfirmed**
3. SG4 feature fan-out: one wave (6–8) vs two waves (4–5)? — **pending**
4. Add pointer README on `v1-legacy` branch? — **pending**

## How to update this file

- Flip a gate checkbox only when its exit condition in `REBUILD_WORKFLOW.md §3` validated.
- New packet issued → add one line under Open packets (id · owner_path · status).
- Packet merged → remove its line; bump "Last verified commit".
- Never append history here — this is a dashboard, not a log.
