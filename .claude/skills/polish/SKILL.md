---
name: polish
description: Sweep an Otto screen (or --all) against the delight vocabulary (docs/reference/contracts/motion.md + ui-components.md) and report findings as a table — easing tokens, Bounceable, haptic/sound maps, reduced motion, mascot states, tokens, a11y basics. AUDIT ONLY — this skill never edits code; findings become builder packets. Invoke as /polish <ScreenName|path|--all>.
---

# /polish — the pre-ship delight sweep

Input: a screen name (e.g. `RecipeDetail`), a file path, or `--all` (every
`*Screen.tsx` under `src/features/`). Before sweeping, READ (not skim):
`docs/reference/contracts/motion.md`, `docs/reference/contracts/ui-components.md`
§2–3/§6, and the target file(s) IN FULL plus any motion/pressable component they
import locally.

## The checklist (fixed — every item, every sweep)

1. **Easing tokens.** Any inline `withTiming(x, {duration: N})`, raw
   `Easing.*`, inline spring config, or `duration:` literal outside
   `motion.ts`? Motion goes through `motion.ts` hooks + `timing`/`easings`
   roles. Navigator-default transitions count as findings only in a dedicated
   G5 pass — note, don't spam.
2. **Pressables.** Every tappable through `Bounceable` (or `usePressSpring`)?
   Hand-rolled pressed styles (`opacity: 0.8`, `style={({pressed})=>…}`) are
   findings. Exception: rows whose gesture layer owns feedback
   (HoldToRemoveRow) and text links inside prose.
3. **Haptic map** (motion.md §2). Each `haptics.*` call classified: is the
   weight right for the event class? Any `notify('success')` outside a flow
   completion? Any commit with no haptic at all?
4. **Sound map** (motion.md §3). Any `useAudioPlayer`/sound outside
   `src/shared/sound.ts` (once it exists) or event sounding that isn't in the
   map? Any mapped event silent that shouldn't be? (Until the kit ships,
   only flag raw audio usage.)
5. **Reduced motion.** For every animation in the file: what happens under
   `useReducedMotion()`? READ the hook it uses — don't assume. A file-local
   animation with no reduced path is a P1 finding.
6. **Mascot states.** Empty/error/loading states use the OttoArt/OttoStates
   system with a semantically right state (thinking/sad/sleepy)? Bare text
   empty states are findings.
7. **Tokens.** Hardcoded hex/spacing/radius/font-size that has a token.
8. **A11y basics.** Tappables ≥44pt (or hitSlop), accessibilityLabel/role,
   state changes announced or live-region'd, gesture-only interactions have an
   accessibilityAction equivalent.
9. **Moment registry** (motion.md §4). Any celebration-ish effect (confetti,
   fanfare, success art + sound) NOT in the registry? Flag regardless of taste.

## Output — a findings table, nothing else

| # | file:line | rule | severity | finding | suggested fix |

Severity: P1 = breaks an off-ramp/a11y/honesty; P2 = vocabulary violation;
P3 = drift/nice-to-have. End with a one-line verdict: `SWEEPS CLEAN` or
`N findings (aP1 bP2 cP3)`.

## Rules

- **Never edit code.** This skill is the auditor half of the loop — findings
  become builder packets executed through the crew (builder → critic →
  verifier). If invoked mid-session, hand the table back and stop.
- No taste findings: everything maps to a numbered checklist item and cites
  the contract line it violates. If it isn't in the contracts, it isn't a
  finding — propose a contract edit instead.
- False-positive discipline: if unsure whether an exception applies, read the
  imported component before flagging. Calibrated 2026-07-25 on RecipeDetail
  (see DELIGHT ticket Log).
- When the sweep is clean, record `swept @ <short sha>` in the active ticket's
  Log with the screen name.
