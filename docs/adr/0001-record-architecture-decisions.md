# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Juan (founder) · written by Claude

## Context
Otto's decisions live in a 1,271-line running log (`docs/history/REDESIGN_NOTES.md`), in ticket logs and in inline "founder decision" code comments. Agents load whatever doc they find; a superseded decision that is still written down gets acted on. The 2026-11-04 documentation guide (`docs/learning/reports/App documentation artifacts guide.md`) found no ADRs at all.

## Decision
Keep one short record per architecturally significant decision in `docs/adr/`, numbered, using the MADR-lite template in `TEMPLATE.md`. Records are never edited after acceptance except to change **Status** to `Superseded by ADR-NNNN`. A code comment that encodes a decision links its ADR.

## Consequences
Good: one place to answer "why is it like this?", for people and agents alike. Cost: a few minutes per decision. Older decisions are backfilled from evidence (commits, logs) and say so.

## Options considered
- Keep using REDESIGN_NOTES.md only (rejected: append-only log, no status, no supersession)
- Put decisions in ticket logs (rejected: tickets move to history/ when done)

## Evidence
- `docs/learning/reports/App documentation artifacts guide.md`
- Michael Nygard, "Documenting Architecture Decisions" (2011); MADR (adr.github.io/madr)
