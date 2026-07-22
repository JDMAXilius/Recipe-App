# Otto Rebuild — State Dashboard

> **Read me first, update me last.** Single shared memory for the cloud and
> terminal sessions. The cloud manager is the only writer; terminal
> report-backs land in ticket files and get folded in here. Keep this under
> ~60 lines — history belongs in git, details belong in tickets.

**Last updated:** 2026-07-21 · by cloud session (tickets issued, handed to terminal)

## Where we are

| | |
|---|---|
| Current milestone | **M0 kickoff** — tickets 00 + 01 issued; terminal executes ticket 00 next |
| Integration branch | pending (created by ticket 00) |
| Legacy snapshot | pending (`v1-legacy` + tag, by ticket 00) |
| Old-code archive | pending (mirror → Old-recipe-app.git, by ticket 00) |
| Last verified commit | cloud merge of branch → main |
| v1 app status | shippable from `main`; **one known-red test** (10 orphan foods — ticket 00 step 2) |

## Gates

| Gate | Status |
|---|---|
| M0 Contracts signed | ☐ not started |
| M1 Engine green | ☐ blocked on M0 |
| M2 Platform ready | ☐ blocked on M0 |
| M3 Features merged | ☐ blocked on M1+M2 |
| M4 Converged + device QA | ☐ blocked on M3 |

## Open packets / tickets

| Ticket | Status |
|---|---|
| REBUILD_00 source control | **issued — READY, terminal starts here** |
| REBUILD_01 M0 scaffold/crew/contracts | issued — blocked on 00 |
| REBUILD_02–04 | issued after their gate (see INDEX) |

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
