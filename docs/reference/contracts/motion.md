# Contract — Motion, Sound & Delight (`motion.md`)

Status: **draft awaiting founder sign-off on the three maps** (haptic, sound,
moment registry — taste calls). Everything else is law now. Owner: delight (once
created) + ui-systems for `tokens.ts`. Companion to `ui-components.md` §2–3 —
that contract says *where* motion lives (tokens → motion.ts hooks → components);
this one says *what it may say*.

**The thesis (from TERMINAL_TICKET_DELIGHT_POLISH research, 2026-07-25):**
Otto is **Tiimo-calm as the baseline with Duolingo-grade craft at a handful of
earned moments**. Motion and sound are *feedback*, or they are cut. The palette
is small enough to learn in one session. Celebrations are earned — *the plate
is the win*, never the tap. And the user holds the dial: every effect has three
off-ramps (reduced motion / Sounds toggle / silent switch).

---

## 1. Easing & duration scale ("intentional easing")

Durations are data → `tokens.ts` `timing`. Curves need reanimated's `Easing` →
they live beside the hooks in `motion.ts` (`easings`), role-named. Components
consume BOTH only through `motion.ts` hooks — an inline `withTiming(x, {duration:
300})` or a raw `Easing.*` in a component is a review failure.

| Role | Duration token | Curve (`easings.*`) | Meaning |
|---|---|---|---|
| `enter` | `timing.enter` = 260 | `Easing.out(Easing.cubic)` — decelerate | Something arriving: sheet, card, reveal. Arrives fast, lands soft. |
| `exit` | `timing.exit` = 180 | `Easing.in(Easing.cubic)` — accelerate | Something leaving. Leaves quicker than it arrived — the room doesn't watch the door. |
| `emphasis` | `timing.emphasis` = 420 | `Easing.inOut(Easing.cubic)` | A beat that carries meaning: a count resolving, a state change worth noticing. |
| `celebrate` | `timing.celebrate` = 900 | sequence (pop spring → settle) | The envelope of a registered moment (see §4). Not a curve so much as a budget: the whole beat fits inside it. |
| (existing) | `timing.sweep` = 500, `timing.fade` = 200 | ring count-up / fades | unchanged |

Springs are role-named too:

| Spring | Feel | Use |
|---|---|---|
| `gentle` | soft, slow settle | ambient movement |
| `snappy` | quick, damped | press feedback (`usePressSpring`, scale 0.97) |
| `pop` | bouncy | the paw / OttoIdle signature — a flourish, not a button |
| `sheet` | heavy, controlled | sheet present/dismiss |
| `press` | crisp, ~100ms, <2% overshoot | a button that MOVES YOU — the raised ＋ (`usePressPop`) |

`press` was added 2026-07-25 (founder: the ＋ should feel good and quick).
`pop` settles too slowly to read as a button, which is what made the ＋ feel
sluggish; the other half of that fix was moving the beat to `onPressIn` so it
lands on the touch instead of the release. New motion picks the closest role;
inventing a sixth spring needs a contract edit, not a component edit.

**Screen transitions** (Phase 4): push = `enter`, pop = `exit`, sheets =
`spring.sheet`. The navigator's defaults are not "chosen" — replacing them is
the G5 close-out.

## 2. The haptic map (G4)

One table. An event class not listed inherits the closest row — if none is
close, it gets **nothing** (silence is a valid weight).

| Event class | Call | Examples |
|---|---|---|
| Micro-selection: tabs, chips, steppers, toggles, check-offs | `haptics.select()` | shopping check-off, filter chip, day picker |
| Commit: an action that changes stored state | `haptics.impact('light')` | **save (PawMark)**, add dish to week, carry leftovers, add custom item |
| Physical pick-up / drag threshold | `haptics.impact('medium')` | HoldToRemoveRow arm ("in your hand") |
| **Flow completion** — a whole journey ends | `haptics.notify('success')` | **cook finished, timer done, week fully built, list completed, club joined, recipe-creation flow saved** |
| Something needs attention, recoverable | `haptics.notify('warning')` | sign-out confirm arm, destructive two-tap arm |
| Something failed | `haptics.notify('error')` | send failed, save failed |

`notify('success')` is RESERVED for flow completions. It firing on a
micro-action dilutes the only "you finished something" signal the hand ever
gets — the exact drift the review caught in PawMark (fixed 2026-07-25, same
commit as this contract: PawMark + PlanScreen add/carry → `impact('light')`).
EditRecipeScreen's save keeps `notify` — it completes the whole creation flow.

## 3. The sound map (G1) — awaiting founder sign-off

~6 events sound, ever. All soft, kitchen-warm, peak well under `timer-alarm.wav`.
Kit: `src/shared/sound.ts` (mirrors haptics.ts: typed events, preloaded,
fire-and-forget, web no-op). OFF-RAMPS, in precedence order: system silent
switch (respected by default — the kit never sets playsInSilentMode) → in-app
**Sounds toggle** (preferences, default ON) → reduced-motion ALSO mutes
celebration sounds (sensory flexibility: motion and its fanfare are one dial).

| Event | Sound | Character |
|---|---|---|
| Recipe saved (PawMark / editor) | `save` | soft pluck — a page settling |
| Chat send | `send` | barely-there tick (texture, not fanfare) |
| Cook step done | `step-done` | low wood-tap |
| Flow completion (cook done, list done, week built) | `all-done` | two-note warm chime — THE proud sound, one identity |
| Gentle error | `gentle-error` | soft descending thud — kind, no alarm |
| Timer alarm (existing) | `timer-alarm.wav` | unchanged — the only loud one, it has a job |

No other event sounds. A new sound = a contract edit + founder sign-off.

## 4. The moment registry (G3) — awaiting founder sign-off

The ONLY places a celebration (Otto reaction + `notify('success')` + `all-done`
sound + a warm line) may fire. Ranked by earnedness:

1. **Cook complete** — the biggest earned win in the app. Otto celebration
   state + the proud sound + "That's a meal, chef."
2. **Shopping list done** — last item checked: count line resolves ("All in
   the basket."), soft chime, Otto nod.
3. **First recipe saved** (once, EVER — `kv firstSaveCelebrated`) and **week
   fully planned** — smaller versions of the same pattern.
4. **Ask-Otto reply lands** — NOT a celebration: texture only (send tick).
   Listed here so nobody promotes it.
5. **Empty states** — one gentle invitation beat, motion only, no sound (G6).

Everything else is feedback, not celebration. A celebration outside this list
is a review failure regardless of how nice it looks. Duolingo's rule in Otto's
voice: *the plate is the win.*

## 5. Enforcement

- `/polish` (`.claude/skills/polish/SKILL.md`) sweeps a screen against this
  contract; findings become builder packets; the skill never edits code.
- Guard test (Phase 1): CI fails on raw `Haptics.*` / `useAudioPlayer` outside
  the kits, and inline spring/timing configs outside `motion.ts`.
- Every delight packet goes builder → critic (REFUTER, with the motion
  section: "does this violate the vocabulary, dilute a reserved signal, or
  break under reduced motion / silent switch?") → verifier.
- Reduced-motion parity is a BLOCKER, not a nice-to-have (`ui-components.md`
  §2 already says so; restated here because celebrations are the temptation).
