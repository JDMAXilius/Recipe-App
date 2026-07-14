# 📓 Redesign Notes — Running Decision Log (autonomous run)

> Kept by the autonomous design+build lead per `docs/TERMINAL_AGENT_PROMPT.md`. Every call that
> the pack would normally route to the founder is decided here, with rationale, so the run never
> loops and the founder can review via git. Newest entries at the bottom of each phase section.

**Run started:** 2026-07-14 · **Mode:** full-auto (bypass permissions) · **Baseline commit:** `e6c685c`

---

## Phase 1 — Audit

- **A1. Audit scope:** graded all 7 shipped screens from captures + code (no live run needed for
  diagnosis — captures are from the live web build, code confirms behavior). Output: `docs/AUDIT.md`.
- **A2. Priority-order deviation (decision):** the pack's default screen order puts Auth at #2;
  the audit promotes **Recipe Detail** to #2 (after tab bar) and slides Auth to #4.
  *Rationale:* Detail fails its functional job (kitchen test) while Auth only fails brand; Detail
  also forces the paw-mark, motion signature, and nutrition-honesty decisions that every later
  screen inherits. Auth stays a cheap asset+copy swap whenever it lands. *Rejected alternative:*
  keeping pack order for auth-first identity impact — rejected because identity without a working
  core is lipstick.
- **A3. D6 reframed (finding):** the shipped `icon.png` (option B) is largely fine; the real crop
  bug is the **circular MascotBadge** slicing Otto's hat on Profile. Fix = badge-safe cropped
  asset + padded icon recompose, **not** a regeneration of the icon art.
- **A4. Stock Expo assets flagged:** `adaptive-icon.png`, `splash-icon.png`, `favicon.png` are
  still Expo defaults — added to Phase 4 asset work (Android adaptive + splash + favicon get Otto).

## Phase 2 — Mobbin research

*(pending)*

## Phase 3 — Design system

*(pending)*

## Phase 4 — Screens

*(pending)*

## Phase 5 — QA

*(pending)*
