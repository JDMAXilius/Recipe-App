# ADR-0009: First run shows value before the account: questions → first week → save your plan → paywall

- **Status:** Proposed
- **Date:** 2026-11-04
- **Deciders:** Juan reviews · drafted by Claude

## Context
Today's first run is sign-up → three painted scenes → paywall, so nothing of value is shown before the account and the money ask. The researched flow (Apple's standard iOS flow, hard-paywall variant; Cal AI, Duolingo, Cherrypick) puts a result first.

## Decision
Launch screen → Welcome → three questions, each with Skip → Your first week (built on the device from `otto_recipes`, which `anon` can read) → Save your plan (account) → Otto Club → App Store sheet → You're all set → reminders → tabs. Answers and the week live in a local draft and are claimed into the account after sign-up.

## Consequences
Good: the paywall follows a real result. Bad: a draft store and a claim step are new moving parts (rework roadmap R0.3), and the gate gains states. Keeps ADR-0005 intact: still no use without account + Club.

## Options considered
- Keep account first (today)
- Free trial without account (rejected: the trial needs an account, ADR-0005)

## Evidence
- `docs/flow-maps/maps/otto-next.html`
- `docs/tickets/REWORK_ROADMAP.md` Phase 0–2
- main's `docs/tickets/ROADMAP.md` draft section ("not approved")
