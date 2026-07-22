# Rebuild Tickets — Index & Sequence

Handoff from the cloud planning sessions to the terminal. The full design is in
`docs/REBUILD_WORKFLOW.md` (plan), `REBUILD_PACKETS.md` (packet law),
`REBUILD_STATE.md` (live dashboard), `TESTING.md`, `FRAMEWORK.md` (target),
`ARCHITECTURE.md` (current).

**Execution owner:** the terminal drives the rebuild. Tickets are issued in
order; a ticket is not started until its predecessor's Report-back is committed
(the kick-off pattern — REBUILD_PACKETS.md §1). Later milestone tickets are
deliberately NOT pre-written in full: they are issued after their gate, when
their inputs exist as contracts (re-decomposition discipline, WORKFLOW §8).

## Sequence

| # | Ticket | Covers | Status |
|---|---|---|---|
| 00 | `TERMINAL_TICKET_REBUILD_00_SOURCE_CONTROL.md` | green baseline · archive old code to Old-recipe-app.git · branch creation (`v1-legacy` + tag, `rebuild/v2`) | **READY — start here** |
| 01 | `TERMINAL_TICKET_REBUILD_01_M0_SCAFFOLD.md` | M0: scaffold `rebuild/v2` (Expo+TS) · write the 7-agent crew · write & sign off contracts | READY (blocked on 00) |
| 02 | _issued after M0_ | M1 engine port + M2 platform (RLS, 5 functions, shared/ui) — parallel tracks | pending gate M0 |
| 03 | _issued after M1+M2_ | M3 feature fan-out (9 folders) | pending gate M1+M2 |
| 04 | _issued after M3_ | M4 integration · review swarm · device QA · cutover PR to `main` | pending gate M3 |

## Two repositories

| Repo | Role |
|---|---|
| `https://github.com/JDMAXilius/Recipe-App.git` | **The working repo — this one.** All rebuild work happens here on `rebuild/v2`. |
| `https://github.com/JDMAXilius/Old-recipe-app.git` | **Archive only.** A one-time mirror of the pre-rebuild code (ticket 00). Never worked in after that. |

After archiving to Old-recipe-app, **come back to Recipe-App** and stay there —
the archive is a safety copy, not a working remote.

## Ground rules (from REBUILD_PACKETS.md)

- `git pull --rebase` before acting; the manager treats a ticket without a
  Report-back commit as not-run.
- Update `docs/REBUILD_STATE.md` last on every ticket (flip gates only when the
  exit condition validated).
- Done tickets move to `docs/archive/`.
- `main` keeps building the v1 app until the M4 cutover PR — never push rebuild
  code straight to `main`.
