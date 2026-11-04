# ADR-0008: Tab bar: Home · Plan · Cookbook · Account, with Otto AI in the trailing circle

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Juan (founder)

## Context
Today's bar has five JS tabs with a raised ＋ (Chat) in the centre, which reads as an action, not navigation (Apple 27 · Tab bars; gaps G15). iOS 26 gives the trailing, separate circle to Search. Talking with Otto is the app's big feature.

## Decision
Four tabs (Home = Tonight + This week + Discover, Plan, Cookbook, Account) plus **Otto** in the trailing circle, showing the otter face. Chat with Otto is a tab root (no close button). Search becomes a screen pushed from Discover's search field. ＋ Add a recipe moves to Cookbook's navigation bar. Built with `NativeTabs` (motion M7) after a spike confirms the trailing slot can host a non-search screen; otherwise a custom bar draws the same shape.

## Consequences
Good: the main feature is one tap from anywhere; no action disguised as a tab. Bad: the trailing slot is styled by the system for search, so the spike may force a custom bar; Search loses its tab.

## Options considered
- Search in the trailing circle and Ask Otto on Home (the Apple default; replaced 2026-11-04)
- Keep the raised ＋ (rejected)

## Evidence
- Figma `r9QxxN5qDQXjW473H7LKgM`, tab bar set `68:112`
- `docs/flow-maps/maps/otto-next.html`
- `docs/tickets/REWORK_ROADMAP.md` D4, R3.1–R3.4
