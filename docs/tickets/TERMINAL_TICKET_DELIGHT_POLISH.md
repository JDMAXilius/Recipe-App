# TERMINAL TICKET — delight engineering: sound, motion, moments, and the /polish sweep

> STATUS: in-progress — terminal 2026-07-25 (c21dac72). Phases 0-2 + 4 landed; Phase 3 measured (no-go recommended). Remaining boxes need the founder: three map sign-offs, the icon-button ruling, the Rive call, and on-device off-ramp checks.
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
- [x] Write `docs/reference/contracts/motion.md` (3a) — **builder** drafts from this ticket +
      the existing §2/§6 of ui-components.md; **critic (JUDGE)** scores it against the
      research; founder approves the haptic/sound maps and the moment registry (taste call).
- [x] Extend `tokens.ts` with the easing/duration scale — **ui-systems** (its owner_path).
- [x] Write `.claude/skills/polish/SKILL.md` (3b) — **builder**; dry-run it on one already-
      polished screen (RecipeDetail) to calibrate false positives before trusting it.
- [x] Fix G4's known violation as the first vocabulary commit: PawMark `notify(success)` →
      `impact('light')` (a save is a commit, not a completed flow).

### Phase 1 — infrastructure `[one session]`
- [x] `src/shared/sound.ts` kit + `assets/sounds/` palette (~5 files, soft, kitchen-warm:
      save, send, step-done, all-done, gentle-error). Source/licence recorded in the Log —
      **delight** builds, **critic** refutes, **verifier** runs the ladder.
- [x] Sounds toggle in preferences (default ON, honest copy), wired through the kit; system
      silent switch respected by default (verify `setAudioModeAsync` config on device).
- [x] Create `.claude/agents/delight.md` (3c).
- [x] CI-visible guard: a lint/test that fails on raw `Haptics.*`, raw `useAudioPlayer`
      outside the kits, and inline spring configs outside `motion.ts` (the drift stopper).

### Phase 2 — the moments `[the payoff; one moment = one packet]`
Ranked; each lands alone so the critic can refute it alone:
- [x] **Cook complete** — the biggest earned win in the app. Otto celebration state +
      `notify(success)` + the one proud sound + a warm line ("That's a meal, chef."). This
      is the moment that would be Duolingo's lesson-complete.
- [x] **Shopping list done** — last item checked: the count line resolves ("All in the
      basket."), soft chime, Otto nod. (Builds on BUILD34 ticket's screen — sequence after.)
- [x] **First recipe saved** (once, ever) and **week fully planned** — small versions of the
      same pattern.
- [x] **Ask-Otto reply lands** — no fanfare; this is a *texture* moment: the existing stream
      + a barely-there send sound. Restraint is the spec here.
- [x] Empty states get one gentle invitation beat (G6) — motion only, no sound.

### Phase 3 — Otto reacts (Rive pilot) `[gated; its own go/no-go]`
- [ ] One artboard, one state machine  *(no-go recommended — see Log Phase 3)*: idle-breathe → happy → thinking → sad, driven by the
      same names `OttoStates` already uses. Keep the PNG system as the reduced-motion path
      and web fallback — **the pilot must not delete anything**.
- [x] Measure: bundle delta, dev-client build required, fps on the oldest test device,
      authoring cost of one new state. Write the numbers in the Log.
- [ ] **Founder go/no-go** on rolling Otto-Rive across the app. No-go is a fine outcome —
      Phase 2 already shipped the delight; this phase is the ceiling, not the floor.

### Phase 4 — the sweep `[continuous]`
- [x] `/polish --all`: 5 screens swept (RecipeDetail, Shopping, Cook, Chat, Plan); findings → packets
      → crew loop; "swept @ sha" per screen in the Log.
- [x] Screen transitions pass (G5): push curve chosen (honest ceiling logged); **on-device verify = founder**.
- [x] Add `/polish` to the pre-release ritual in `TERMINAL_TICKET_RELEASE_READINESS.md` F1.

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

- [~] `motion.md` exists, founder-approved, and `tokens.ts` carries the easing scale
- [x] `/polish` skill exists and has swept ≥3 screens with findings landed through the crew
- [x] Sound kit live behind a preferences toggle; palette licensed and logged
- [x] Haptic map enforced (PawMark fixed; guard test green)
- [x] Cook-complete and shopping-done moments shipped and refuted by the critic
- [x] Rive pilot measured with a written go/no-go
- [ ] Every effect verified against all three off-ramps (reduced motion / Sounds off / silent
      switch) — Tiimo rule: the user holds the dial

## Log

<!-- append dated findings here; this is the shared thread between terminal and cloud -->

**2026-07-25 — terminal.** Phases 0–2 landed + Phase 3 measured. Commits:
`73117e30` (phase 0), `d5bb2cfd` (phase 1), `1c5fad0d` (phase 2 + critic fixes).

### Phase 0 — the vocabulary ✅
- `docs/reference/contracts/motion.md` written: easing/duration scale, haptic
  map, sound map, moment registry, enforcement. **Three maps await the
  founder's taste sign-off** — everything else is law now.
- `tokens.ts` `timing` gains `enter 260 / exit 180 / emphasis 420 /
  celebrate 900`; the CURVES live in `motion.ts` `easings` (tokens stays a
  pure-data module — reanimated's Easing can't live there).
- `.claude/skills/polish/SKILL.md` written and dry-run on RecipeDetail
  (below).
- G4's known violation fixed: PawMark + PlanScreen add/carry
  `notify('success')` → `impact('light')`. EditRecipeScreen keeps `notify` —
  it completes the whole creation flow.

### Phase 0 — /polish calibration dry-run (RecipeDetail, the "already polished" screen)
**15 findings (1 P1, 7 P2, 7 P3), ~2.5 false positives.** The FP lessons are
now in the skill's Exceptions section: frozen-8 primitive internals (Button's
pressed dip) are sanctioned; routine-fetch loading states may be quiet;
shared-primitive gaps are recorded ONCE against the component, never per
screen (or `--all` reports Sheet's default slide N times); prose/text links
are exempt from Bounceable.
Highest-value real findings (now packet input, not yet landed):
- `RecipeDetailScreen.tsx:144-158` — **addToWeek fires no haptic at all**
  while PlanScreen fires one for the same event: the vocabulary contradicts
  itself across screens.
- `RecipeDetailScreen.tsx:311-317` — servings stepper announces nothing
  (P1 a11y: every scaled quantity changes silently).
- `RecipeDetailScreen.tsx:412-421` — ShareCard announces `role="button"` but
  only has `onLongPress`: VoiceOver activate does nothing.
- Six icon tappables bypass Bounceable. **OPEN FOUNDER RULING**: do
  hero/toolbar icon buttons need press feedback? This one class decides
  whether a polished screen can ever sweep clean.
- Out-of-scope but real: `RecipeDetailScreen.tsx:95` — not-found's "Take me
  back" calls `router.back()` with no fallback; via deep link it does nothing.

### Phase 1 — infrastructure ✅
- `src/shared/sound.ts`: typed kit mirroring haptics.ts (lazy native players,
  fire-and-forget, web no-op). **Off-ramps**: silent switch respected by
  default (the kit never calls `setAudioModeAsync`), kv-backed Sounds toggle
  in Profile (default ON, honest copy: "Timers always ring"), and reduced
  motion mutes the celebration chime.
- **Palette: 5 sounds SYNTHESIZED IN-REPO** (`scratchpad/synth-sounds.py`,
  pure-tone envelopes) — save 220ms, send 70ms, step-done 140ms, all-done
  850ms two-note chime, gentle-error 300ms. **Licence: ours, no third-party
  samples, nothing to attribute.** Peaks 0.12–0.28 vs timer-alarm's ~1.0.
  They are honest placeholders in the right shapes — if the founder wants
  designed audio, these are the spec to hand a sound designer.
- `.claude/agents/delight.md` created (the creative-technologist seat).
- **CI guard** `src/shared/vocabulary.guard.test.mjs`: fails on raw
  `expo-haptics`, audio players outside the kit (CookScreen's alarm is the one
  documented exception), and inline spring/duration literals. **It caught two
  real drifts on its first run** — `TabBarCreateButton` calling raw
  `Haptics.impactAsync`, `StepCard` with `duration: 220` — both conformed.

### Phase 2 — the moments ✅ (all four, plus the two texture beats)
Each celebration is **armed on first observation, fired only on the crossing**,
so opening an already-finished state is a memory, not a moment.
- **Cook complete** (`CookScreen.finish`) — reserved haptic + all-done chime
  over the existing proud-Otto "Dinner, done." screen.
- **Shopping list done** — count line resolves to "All in the basket.",
  haptic + chime on the last check-off.
- **First recipe saved** (once ever, `kv firstSaveCelebrated`) — and while
  wiring it: `ottoBus.emit('save')` **had no emitter anywhere in the app**.
  DiscoverScreen's comment claimed the mascot hop was "wired by PawMark"; it
  wasn't. It is now, on every save.
- **Week fully planned** — every day has a dish.
- Texture (deliberately NOT celebrations): ask-Otto send tick, cook
  step-forward tap.
- **G6**: empty states breathe (`OttoIdle sway`) instead of standing still —
  motion only, no sound, reduced-motion static by contract.

### Phase 3 — Rive pilot: MEASURED, recommendation NO-GO for now
Measured without installing (an install means a prebuild + a dev-client cut;
the numbers below already decide it):
| Measure | Number |
|---|---|
| `rive-react-native` version / npm unpacked | 9.8.5 / **417 KB** JS+sources |
| Native runtimes pulled in | Rive iOS SDK **6.21.1** (CocoaPods), Android **11.7.2** (Gradle) — the real binary cost, several MB, is in these, not the npm package |
| Dev-client build required? | **Yes** — native module. Otto already ships `expo-dev-client ~6.0.21`, so the workflow exists; every contributor still needs a fresh dev build |
| New Architecture | **RISK: no `codegenConfig` in the package** — 9.8.5 is a legacy-arch (Paper) view manager, and `app.json` has `newArchEnabled: true`. It would run through the interop layer, unverified on this app |
| Authoring cost of one state | **The blocker.** Otto's art is *painted raster* (16 MB of PNGs; otto-hero alone is 5.9 MB). Rive is vector/mesh — a Rive Otto is a **re-authoring of the character in a different medium**, not an export. That is a designer engagement, not a build task |
| fps on oldest device | **NOT MEASURED — founder rung.** No physical device here |

**Recommendation: no-go for now**, which the ticket itself calls a fine
outcome ("Phase 2 already shipped the delight; this phase is the ceiling, not
the floor"). The gate isn't the dependency, it's that Otto would have to be
redrawn as vector art. Revisit if/when the mascot gets a vector redraw for
other reasons. > HANDOFF → founder: this is a go/no-go call, not a terminal
call — the numbers above are the input.

### Phase 4 — the sweep ✅ (5 screens swept, findings landed)
`swept @ c21dac72`: RecipeDetail (calibration), ShoppingScreen, CookScreen,
ChatScreen, PlanScreen. **~40 findings across five screens**; the P1s and every
vocabulary violation are FIXED (`d41fd6a9`), the rest are packet input below.

**P1s found and fixed:**
- **The shopping moment armed on kv, which resolves before the rows** — so a
  finished list chimed on open, and a partner-completed list always did. My
  own bug, one commit old. (Also fixed: it fired when the last *unchecked* row
  was thrown off the list — a removal is not an achievement.)
- **One cook voided the silent switch for the whole app.**
  `setAudioModeAsync({playsInSilentMode:true})` is process-global and had no
  cleanup, so after a single cook the save pluck played out loud on a silenced
  phone. Off-ramp #1 was a comment, not a behaviour.
- **A failed cook fetch was indistinguishable from an uncookable recipe** —
  the cook was dumped back with no error and no retry.
- **A failed week load rendered as seven empty days** — the app asserting you
  planned nothing when it knew nothing. (`usePlan.ts` warns about exactly this
  in writing; PlanScreen wasn't reading `isError` at all.)
- **PlanScreen's row actions were ~30pt targets** — including destructive
  remove, a thumb-width from "cooked".

**The root cause worth naming:** `Bounceable` accepted no `style`, so any
tappable needing layout (`flex: 1` rows, fixed circles, padding) *could not*
adopt it — which is why call sites kept hand-rolling `pressed && {opacity}`.
Six findings, one cause. It takes `style`/`hitSlop` now.

**Vocabulary drift found and fixed:** step navigation fired `impact('medium')`
(the pick-up weight) on the most frequent event in cook mode; step-done sounded
on pager jumps that skipped five steps; add/remove custom item, restore-hidden
and remove-planned-dish were commits with no haptic; the Speak toggle buzzed
*before* its availability guard ("coming soon" after telling the hand something
happened); error toasts were silent to hand and ear at six call sites; clarify
chips sent a turn with a different feel than the Send button.

### The refuter pass on the delight batch (9 findings, all fixed — `c21dac72`)
Worth recording because several were *fixes that didn't fix*:
- The **Sounds toggle was unread on every cold start's first sound** — the kv
  read was kicked off by the first `play()` and hadn't resolved. Reads at
  module load now.
- The **exclusion prune took the personal branch during the household
  round-trip** (`isShared` is false until membership resolves, and a warm plan
  cache makes `planSuccess` true immediately) — a housemate's dropped dish was
  pruned against my dishes only, and persisted. My F1 fix had missed this.
- **A failed background refetch blanked a working list.** TanStack keeps data
  through a failed refetch and this screen refetches on focus, so one bad poll
  in a shop basement replaced a full list with an error card.
- **The chat send-vs-load guard truncated threads.** Standing down left the
  send's one-message write as the entire stored thread — a reopened
  20-message thread lost 20 messages. It merges now.
- **The once-ever first-save flag was burned optimistically** — an offline tap
  spent the celebration on a save that rolled back.
- **The guard test passed three real violations** (double-quoted imports,
  `FadeIn.duration(320)`, raw `Easing.*`). Hardened and *verified by running
  the refuter's own violation file through it* — it fails, as it must.

### Standing packet input (not yet landed — needs the founder ruling or a contract edit)
- **OPEN FOUNDER RULING: do hero/toolbar icon buttons need `Bounceable`?**
  Named on every screen swept. One ruling closes ~6 findings; until then a
  "polished" screen cannot sweep clean.
- `contract_gap`: `Text` takes only `role` — no `align`, no `numberOfLines`,
  no `type.input`. That is *why* ~30 sites hand-roll `RNText` with literal
  font sizes. Fix the primitive, not the sites.
- `Sheet` ships `Modal animationType="slide"` where §6 specs `spring.sheet` +
  gesture-to-dismiss, with no reduced-motion path; three scrim values in the
  app (`overlay.scrim` and two hardcoded near-misses).
- `HoldToRemoveRow` consumes spring/timing configs directly (should be a
  `motion.ts` hook), and its fly-out uses `timing.fade` where the role is
  `exit`.
- Shopping's moment ships without its Otto beat (§4 says "Otto nod"); the
  completion isn't announced to VoiceOver.
- Remaining unfeedback'd tappables: recipe/picker/prep/timer rows, dish chips,
  the 48pt add button.

### Observations the sweeps surfaced (real bugs, outside this ticket's scope)
Logged so they aren't lost — each deserves its own ticket:
1. **Cook timers stop when the app backgrounds.** `setInterval` decrementing a
   counter, no wall-clock reconcile: a 10-minute timer with 4 minutes in the
   background thinks those 4 minutes never happened, and never alarms.
2. **Simultaneous timer finishes are swallowed** — only `finished[0]` alarms.
3. **The cook-again rating is write-only** — `kv 'cookRatings'` has a writer
   and no reader anywhere; the comment claims a re-cook remembers your call.
4. **PlanScreen's × is one-tap destructive** with no confirm and no undo,
   while the sibling shopping list uses hold-to-remove + undo for a *less*
   costly action.
5. **`Composer`'s keyboard send path is dead** — `onSubmitEditing` on a
   `multiline` input never fires; only the button sends.
6. **Shopping's share button vanishes at completion** — ticking the last item
   removes the share action, so a shopper who wants to send the finished list
   has to untick something.
7. **Mise-en-place ticks are component state** — leave cook and they're gone.
8. **RecipeDetail's "Take me back"** calls `router.back()` with no fallback;
   via deep link it does nothing.
9. **`CenterModal` has no `onRequestClose`** — Android hardware back does
   nothing on the exit-confirm and timer-done modals.
10. UNVERIFIED (needs a device): PlanScreen's `OttoLoading` may render
    collapsed — `flex: 1` inside a `contentContainerStyle` with no `flexGrow`.
