# ADR-0007: One visual style: light only, no Dark Mode

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Juan (founder)

## Context
The Apple gaps audit listed Dark Mode as G16 (L effort: split `colors.white` into surface vs on-accent across 64 uses, a second palette, every screen and the mascot art checked twice).

## Decision
Otto keeps one style, the original cream look. `userInterfaceStyle` stays `"light"` in `app.json`. No dark palette tokens are added. Docs and published pages for Otto follow the same single style.

## Consequences
Good: every screen is designed and checked once; the mascot art is only tuned for cream. Bad: people who run their phone in dark mode get a light app (allowed by Apple; the system UI around it stays dark).

## Options considered
- Full Dark Mode (rejected 2026-11-04)
- Dark Mode for cook mode only (not considered further)

## Evidence
- `app.json` (`userInterfaceStyle: "light"`)
- `docs/tickets/TERMINAL_TICKET_GOLD_STANDARD_GAPS.md` G16
- `docs/tickets/REWORK_ROADMAP.md` D7
