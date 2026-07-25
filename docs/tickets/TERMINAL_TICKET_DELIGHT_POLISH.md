# TERMINAL TICKET — delight engineering: sound, motion, moments, and the /polish sweep

> STATUS: in-progress — terminal 2026-07-25 (09287cb2)
> STATUS: open — cut from cloud 2026-07-25. Founder directive: "Duolingo and Tiimo are doing
> it pretty, pretty good — animation, sounds, all kinds of stuff. Define how they actually do
> it, find the areas our app is lacking, and approach this as a context engineer / AI
> engineer: the correct skills, libraries, plugins, agents. Make a roadmap and integrate the
> crew." This is the ticket to work through properly.

**What this ticket is.** The research (how the best-feeling apps engineer delight), an honest
inventory of where Otto stands, the gap map, the *tooling* answer (one new skill, one new
contract, one new agent, two library decisions), and a phased roadmap the crew executes.

**Ordering law: Phase 0 (the vocabulary) gates every later phase.** Sprinkling sounds and
confetti without a written vocabulary produces noise, not delight — the exact failure Tiimo's
whole category demonstrates the escape from. And the C1 accessibility items in
`TERMINAL_TICKET_RELEASE_READINESS.md` outrank *everything* here: an app that celebrates a
saved recipe but can't tell a VoiceOver user who's speaking in chat has its priorities inverted.

---

## 1 · Research — how they actually do it (2026)

### Duolingo: delight as a *feedback loop*, not decoration

- **State-driven characters, not video.** The mascots run on **Rive state machines** — a
  real-time animation engine where the character's animation blends live in response to app
  state (idle → reacting → celebrating), with 20+ mouth shapes per character lip-synced to
  audio. Nothing is a pre-rendered clip; everything *responds*.
- **Animation is part of the answer.** Motion reflects progress and urgency; a correct answer
  gets its chirp + character reaction in the same beat. The animation layer sits in the same
  slot as haptics: it *is* feedback, or it's cut.
- **Sound has one identity.** Cute chirp = correct, playful boing = mistake, fanfare =
  streak/lesson complete. A tiny, meaningful palette a user learns in one session — not a
  soundboard.
- **Timing is craft.** The streak-milestone team does multiple rough passes just to tune
  rhythm and energy before polishing. Easing curves are *chosen*, not defaulted — the
  "intentional easing" rule.
- **They built a role for the handoff.** "Creative technologists" sit between designers and
  engineers so motion specs survive implementation. The org-shape lesson for a crew of
  agents: the handoff needs an owner, or polish dies in translation.

### Tiimo: the *calm* pole (Apple Design Award finalist for Inclusivity; iPhone App of the Year)

- Soft colors, rounded shapes, generous spacing; notifications are deliberately **gentle** —
  a nudge, never a demand. No punishment states: a missed task is met kindly.
- **Sensory flexibility is the design system**: calm/minimal when overstimulated, more visual
  engagement when understimulated — the *user* holds the dial (their sensory-regulation
  settings), and every effect degrades gracefully.
- The proof that polish ≠ maximalism: Tiimo won App of the Year on *restraint*.

### The synthesis for Otto

Otto's soul ("a quiet cookbook", the honesty law, the anti-slop voice) is **Tiimo-calm as the
baseline** — with **Duolingo-grade craft concentrated at a handful of true moments**. Otto the
otter is our Duo: he should *react*, not just breathe. The palette is small, soft, and kitchen-
warm; the celebrations are earned (a cooked meal, not a tapped button); and every effect has
three off-ramps (reduced motion, sounds toggle, silent switch) — sensory flexibility à la Tiimo.

Sources: [Duolingo streak animation](https://blog.duolingo.com/streak-milestone-design-animation/) ·
[How Duolingo uses Rive](https://elisawicki.blog/p/how-exactly-is-duolingo-using-rive) ·
[Rive mascot systems](https://dev.to/uianimation/how-duolingo-uses-rive-for-their-character-animation-and-how-you-can-build-a-similar-rive-mascot-5d19) ·
[Creative technologists](https://rive.app/blog/creative-technologists-duolingo-s-solution-to-the-designer-to-developer-handoff) ·
[Duolingo micro-interactions](https://medium.com/@Bundu/little-touches-big-impact-the-micro-interactions-on-duolingo-d8377876f682) ·
[Tiimo sensory-friendly design](https://www.tiimoapp.com/resource-hub/sensory-design-neurodivergent-accessibility) ·
[Lottie vs Rive performance](https://www.callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation) ·
[Rive vs Lottie 2026](https://unicornicons.com/learn/rive-vs-lottie) ·
[Haptics guide 2025](https://saropa.com/articles/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback/) ·
[Haptics in mobile apps](https://newly.app/articles/haptics-mobile-apps)

---

## 2 · Where Otto already stands (audited 2026-07-25 — do not re-discover)

**Real and good:**
- `src/shared/haptics.ts` — one typed wrapper (select/impact/notify), fire-and-forget,
  web-safe. 63 call sites across the app.
- `src/shared/motion.ts` — THE motion hook home; tokenized springs (`spring.snappy`,
  `timing.sweep/fade` in tokens.ts); **every hook reduced-motion aware by contract**.
- `Bounceable` — the single press-feedback wrapper (scale 0.97 spring; opacity dip under
  reduced motion). `usePressSpring`, `useBreathe` (the mascot's 4.2s breath), PawMark pop,
  Toast, ParallaxHero, HoldToRemoveRow lift, StepCard — 8 Reanimated components.
- A mascot with a *personality system*: `OttoArt`/`OttoIdle`/`OttoStates` painted states
  (happy, sleepy, sad, thinking…) used semantically across empty/error/loading.

**The gaps (the "areas lacking" the founder asked for):**

| # | Gap | Evidence |
|---|---|---|
| G1 | **Sound: one file in the whole app** (`timer-alarm.wav`). No save sound, no cook-complete, no send, no success anywhere. No sound kit, no settings toggle, no palette. | `assets/sounds/` has 1 file; `useAudioPlayer` appears once (CookScreen) |
| G2 | **The mascot is static PNGs.** Otto breathes (scale loop) but never *reacts* — no state transitions, no celebration pose change in-place, no blink, no stir. The Duolingo gap. | `OttoArt` = `Image` of pngs; `useBreathe` is the only life |
| G3 | **No celebration moments.** Finishing a cook, saving the first recipe, checking the last shopping item, building the week — all end in a plain state change. The app's biggest earned wins are silent. | CookScreen end = navigation; ShoppingScreen "all in basket" = a count line |
| G4 | **Haptic vocabulary is undefined.** 63 call sites but no written map of which event gets which weight; `notify(success)` fires from PawMark (a micro-action) — exactly what the guidelines reserve for *completed flows*. Meaning dilutes. | `PawMark.tsx:27` vs research: "reserve notifications for completing flows" |
| G5 | **Easing is inherited, not chosen.** Two timing tokens (`sweep`, `fade`) and two springs for the entire app; screen transitions are the navigator's defaults; nothing distinguishes enter from exit from emphasis. The "intentional easing" gap. | `tokens.ts:79-86` |
| G6 | **Empty/loading states are static art.** Otto stands there; nothing invites. Tiimo's lesson is these can stay *calm* and still feel alive. | `OttoStates.tsx` |
| G7 | **No systematic polish pass exists.** Nothing prevents the next feature from shipping with default easing, no haptic thought, missing pressed states — the review findings on chat (hand-rolled `opacity: 0.8`) prove the drift is live. | `Composer.tsx:119` |

---

## 3 · The tooling answer (context-engineering, the founder's ask)

Four artifacts, each owned by the crew. **Less is more: no new animation library for motion
(Reanimated 4 already does everything G3–G6 need), no Lottie** (playback-only, an After
Effects pipeline we don't have), **Rive only as a Phase-3 pilot behind its own gate**.

### 3a. `docs/reference/contracts/motion.md` — the delight contract *(new, Phase 0)*

The vocabulary everything else obeys. Contents:
- **Easing/duration scale** in `tokens.ts`: `timing.enter/exit/emphasis/celebrate` + curves
  (enter decelerates, exit accelerates — name the curve per role, "intentional easing").
- **The haptic map** — one table: event class → call. Micro-taps = `select`; commits =
  `impact('light'|'medium')`; **`notify(success)` reserved for flow completions only**
  (cook finished, week built, list completed, club joined). Fix G4's PawMark accordingly.
- **The sound map** — which of the ~6 events sounds, at what softness, and the three
  off-ramps: system silent switch (respected by default), in-app Sounds toggle, and
  "reduced motion mutes celebration effects too" (sensory flexibility).
- **The moment registry** — the ranked list of earned wins (see Phase 2) so nobody invents
  a celebration for a button tap. Duolingo's rule, Otto's voice: *the plate is the win.*

### 3b. `.claude/skills/polish/SKILL.md` — the `/polish` sweep *(new, Phase 0)*

The "run /polish before you ship" pattern, as a real skill:
1. Input: a screen (or `--all`). Reads the screen + `motion.md` + `ui-components.md`.
2. Sweeps a fixed checklist: easing tokens used (no defaults, no inline configs) · every
   tappable through `Bounceable` (no hand-rolled pressed styles) · haptic map obeyed ·
   sound map obeyed · reduced-motion path exists and was *read*, not assumed · empty/error/
   loading states use the mascot system · spacing/radius/ink from tokens · a11y basics
   (labels, 44pt, announce).
3. Output: a findings table (file:line · rule · fix), which becomes builder packets.
   **The skill never edits code** — it is the auditor half of the loop; the crew lands fixes.
4. Exit: re-run until the screen sweeps clean; record "swept @ <sha>" in the ticket Log.

### 3c. `.claude/agents/delight.md` — specialist builder *(new, Phase 1)*

The creative-technologist seat, translated to the crew (same frontmatter shape as
`ui-systems.md`): a builder whose owner_path is `src/shared/motion.ts`, `src/shared/sound.ts`,
`src/shared/haptics.ts`, `src/shared/ui/` motion components, and `assets/sounds/`. Doctrine
in the agent file: motion.md is law · reduced-motion parity is a blocker, not a nice-to-have ·
sounds ship soft (peak well under the timer alarm) · never a celebration outside the moment
registry · every packet still goes builder → **critic (REFUTER)** → **verifier** like all
crew work. The critic's packet template gains a motion section: "does this violate the
vocabulary, dilute a reserved signal, or break under reduced motion / silent switch?"

### 3d. Library decisions *(decided here so the terminal doesn't re-litigate)*

| Need | Decision | Why |
|---|---|---|
| Motion (G3, G5, G6) | **Reanimated 4.1 — already installed. No new dep.** | Everything in Phases 1–2 is springs/timing/sequences we already write |
| Sound (G1) | **expo-audio — already installed.** New `src/shared/sound.ts` kit mirroring `haptics.ts`: typed events, preloaded players, fire-and-forget, web no-op, silent-switch respect, Sounds toggle in preferences | One wrapper, contract-shaped, zero new native deps |
| Mascot v2 (G2) | **Pilot `rive-react-native` in Phase 3 — behind its own gate.** | Rive is the Duolingo engine: state machines, ~60fps native rendering, tiny files (~2KB vs 24KB Lottie). But it's a new native dep (needs a dev-client build) and real animation authoring work — prove it on ONE artboard before committing |
| Lottie | **No.** | Playback-only + an AE pipeline we don't have; Rive strictly better for a *stateful* mascot |
| Remotion (from the founder's clips) | **Not an in-app tool — it renders videos from React.** Park it for App Store preview videos (readiness ticket F5/A9). | Right tool, different job |
| Confetti/particle libs | **No.** A celebration is Otto + motion tokens + one soft sound; a canvas particle lib is off-voice and another dep | Tiimo's restraint lesson |

---

## 4 · Roadmap — phased, crew-integrated

### Phase 0 — the vocabulary `[one session, gates everything]`
- [ ] Write `docs/reference/contracts/motion.md` (3a) — **builder** drafts from this ticket +
      the existing §2/§6 of ui-components.md; **critic (JUDGE)** scores it against the
      research; founder approves the haptic/sound maps and the moment registry (taste call).
- [ ] Extend `tokens.ts` with the easing/duration scale — **ui-systems** (its owner_path).
- [ ] Write `.claude/skills/polish/SKILL.md` (3b) — **builder**; dry-run it on one already-
      polished screen (RecipeDetail) to calibrate false positives before trusting it.
- [ ] Fix G4's known violation as the first vocabulary commit: PawMark `notify(success)` →
      `impact('light')` (a save is a commit, not a completed flow).

### Phase 1 — infrastructure `[one session]`
- [ ] `src/shared/sound.ts` kit + `assets/sounds/` palette (~5 files, soft, kitchen-warm:
      save, send, step-done, all-done, gentle-error). Source/licence recorded in the Log —
      **delight** builds, **critic** refutes, **verifier** runs the ladder.
- [ ] Sounds toggle in preferences (default ON, honest copy), wired through the kit; system
      silent switch respected by default (verify `setAudioModeAsync` config on device).
- [ ] Create `.claude/agents/delight.md` (3c).
- [ ] CI-visible guard: a lint/test that fails on raw `Haptics.*`, raw `useAudioPlayer`
      outside the kits, and inline spring configs outside `motion.ts` (the drift stopper).

### Phase 2 — the moments `[the payoff; one moment = one packet]`
Ranked; each lands alone so the critic can refute it alone:
- [ ] **Cook complete** — the biggest earned win in the app. Otto celebration state +
      `notify(success)` + the one proud sound + a warm line ("That's a meal, chef."). This
      is the moment that would be Duolingo's lesson-complete.
- [ ] **Shopping list done** — last item checked: the count line resolves ("All in the
      basket."), soft chime, Otto nod. (Builds on BUILD34 ticket's screen — sequence after.)
- [ ] **First recipe saved** (once, ever) and **week fully planned** — small versions of the
      same pattern.
- [ ] **Ask-Otto reply lands** — no fanfare; this is a *texture* moment: the existing stream
      + a barely-there send sound. Restraint is the spec here.
- [ ] Empty states get one gentle invitation beat (G6) — motion only, no sound.

### Phase 3 — Otto reacts (Rive pilot) `[gated; its own go/no-go]`
- [ ] One artboard, one state machine: idle-breathe → happy → thinking → sad, driven by the
      same names `OttoStates` already uses. Keep the PNG system as the reduced-motion path
      and web fallback — **the pilot must not delete anything**.
- [ ] Measure: bundle delta, dev-client build required, fps on the oldest test device,
      authoring cost of one new state. Write the numbers in the Log.
- [ ] **Founder go/no-go** on rolling Otto-Rive across the app. No-go is a fine outcome —
      Phase 2 already shipped the delight; this phase is the ceiling, not the floor.

### Phase 4 — the sweep `[continuous]`
- [ ] `/polish --all`: every screen swept against the finished vocabulary; findings → packets
      → crew loop; "swept @ sha" per screen in the Log.
- [ ] Screen transitions pass (G5): chosen curves on push/sheet/tab, verified on device.
- [ ] Add `/polish` to the pre-release ritual in `TERMINAL_TICKET_RELEASE_READINESS.md` F1.

### Crew map (who does what — same law as every ticket: nothing lands unrefuted)

| Work | Agent |
|---|---|
| motion.md, polish skill, moment packets | **builder** / **delight** (once created) |
| tokens.ts easing scale | **ui-systems** (owner_path) |
| Every batch | **critic** REFUTER (motion section in the packet template) |
| Ladder V1 (tsc, eslint, suites, web export) | **verifier** |
| Design scoring where two motion options compete | **critic** JUDGE |
| On-device feel (haptics, sound softness, fps) | **founder** — the cloud cannot feel a haptic; this rung is human, always |

---

## Done when

- [ ] `motion.md` exists, founder-approved, and `tokens.ts` carries the easing scale
- [ ] `/polish` skill exists and has swept ≥3 screens with findings landed through the crew
- [ ] Sound kit live behind a preferences toggle; palette licensed and logged
- [ ] Haptic map enforced (PawMark fixed; guard test green)
- [ ] Cook-complete and shopping-done moments shipped and refuted by the critic
- [ ] Rive pilot measured with a written go/no-go
- [ ] Every effect verified against all three off-ramps (reduced motion / Sounds off / silent
      switch) — Tiimo rule: the user holds the dial

## Log

<!-- append dated findings here; this is the shared thread between terminal and cloud -->
