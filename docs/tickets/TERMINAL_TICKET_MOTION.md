# Terminal ticket: make Otto feel alive — Apple-grade motion, haptics, Liquid Glass

> **Budget:** P1 in one PR, P2 in a second. Written 2026-11-03. Read `TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md` first.
> Source: `docs/motion/MOTION_RESEARCH.md` (148-entry catalog, Apple principles, 22 signature moments, token proposal).
> Visual, animated version: Figma "Apple Design Guidelines — Gold Standard" (`jWn55Rq4u6cbukA2JeqOaI`) page **49 · Motion & animation library**.
> Doctrine that already exists and still rules: `docs/reference/contracts/motion.md` (haptic/sound maps, moment registry, guard test). Extend it, don't fork it.

## Why
Juan wants motion to be what makes Otto feel "unique and live". The audit found:
- Otto's springs are bouncier than Apple's guidance: `snappy` ≈ 0.43 bounce, `press` ≈ 0.53, `pop` ≈ 0.60 (Apple: default 0, caution above ~0.4).
- Reanimated 4.1 `{duration, dampingRatio}` is not Apple's duration (real length ≈ 1.5×). Port Apple springs with physics configs.
- The Liquid Glass tab bar (`NativeTabs`, `minimizeBehavior`) is installed but unused; Otto renders a custom cream JS tab bar.
- Cook-mode StepCard ignores swipe velocity (fixed timing curve, no hand-off).
- `soft` and `rigid` haptics unused; no skeletons; no list layout animations.

## P1 — cheap, high impact (one PR)
- [ ] **M1. Spring tokens.** Add `appleSpring(d, bounce)` to `src/shared/theme/tokens.ts` and the proposed tokens (`smooth`, `snappy`, `bouncy`, `press`, `release`, `mascot`, `interactive`) from research §4. Re-point existing hooks in `src/shared/motion.ts`; keep `mascot` (0.45 s, 0.4) only for the otter. Verify feel on device before removing old tokens.
- [ ] **M2. Haptic vocabulary.** Add `impact('soft')` (landings) and `impact('rigid')` (boundaries/detents/timer start) to `src/shared/haptics.ts`; update the contract's haptic map; fire haptics on the landing frame.
- [ ] **M3. Cook pager with physics** (moment 1): pan tracks 1:1, momentum projection on release, `spring.release` with gesture velocity, rubber-band at ends, rigid tick per step boundary; RM = cross-fade, bounce 0.
- [ ] **M4. Ingredient check-off that draws** (moment 4): SVG stroke draw ~250 ms + selection tick; list glides with a layout spring; last item → existing "All in the basket" moment.
- [ ] **M5. Skeletons** for Discover and Cookbook matching layout (moment 15); static under RM; images fade 200 ms.
- [ ] **M6. Plan reveal choreography** (moment 5): staggered day cards (40 ms, `smooth`), one success haptic at the end, ≤ 900 ms, interruptible.

## P2 — bigger
- [ ] **M7. Liquid Glass tab bar** (moment 7): swap JS `Tabs` → `NativeTabs` with `minimizeBehavior="onScrollDown"`; cooking-now accessory. Check the raised ＋ Create button still fits HIG (tabs are navigation, not actions — move Create to a toolbar/glass button if needed).
- [ ] **M8. Add-to-plan fly-in** (moment 3), **servings rolling numbers** (8), **save heart/paw** (10), **error shake** (13), **week strip snapping** (16), **context menu preview** (17), **drag a meal between days** (18).
- [ ] **M9. Native work (needs a plan + Juan's OK):** timer Live Activity + Dynamic Island (moment 2), "Tonight's dinner" widget (20), recipe → detail zoom transition (6), SF Symbol Draw/Magic Replace effects.

## Rules (gold standard)
Every animation interruptible · springs for movement, timing only for opacity/colour · UI responses ≲ 0.5 s · one celebration per milestone (moment registry) · every motion has a Reduce Motion alternative (not just "off") · haptics only for meaningful events, on the landing frame · glass only on controls, never content · nothing blocks input.

## Done when
P1 merged with a short screen recording of each moment, RM verified on device, contract updated, guard test green. Update `ROADMAP.md`.

## Log
