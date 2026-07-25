# Otto intro — build note (sprite route)

How to drive the painted frames from `src/shared/motion.ts` + Reanimated.
**Spec only — no app code was written in this pass.**

Contract: `SHOT_BREAKDOWN.md`. Board: `otto-intro-storyboard-v3.png`.
Beat sheet and the rules the intro obeys: `README.md`.

---

## 1 · Why sprites and not video

Three generative video attempts are logged in SHOT_BREAKDOWN §3. Pinning start
*and* end frames still produced the two failures the board cares most about — a
hat that engulfed the head, and a turn that showed his back. The model
interpolates plausibly, not faithfully, and it is a fresh dice roll at 36 credits
a throw.

So the *in-betweens are authored, not interpolated*. Nine painted stills, driven
by code. This buys frame-exact fidelity to the board, a trivial reduced-motion
fork, working web support, and no video in the bundle — which is what
README.md's route table already recommended.

**Cost: 12 credits** (6 stills at 2 each, one of which was a re-roll — the first
`BC1` came back with the apron missing). 34 of the 46-credit budget is unspent.

---

## 2 · The frames

All nine live in `keyframes/`, 768×1376, 9:16, painted against the hero character
lock `5f74831c-0126-44d0-9dd8-731d331fb75a`. Five were already approved; the four
marked NEW are this pass.

| # | file | beat | what it carries |
|---|---|---|---|
| 1 | `A-run.png` | A | stride: front paws reaching, hat streaming back |
| 2 | `A2-run-gather.png` **NEW** | A | opposite stride: legs gathered, paws tucked |
| 3 | `AB-plant.png` **NEW** | A→B | the plant. Hat has swung forward, **eyes still visible**. Dust starts, on the LEFT |
| 4 | `B-skid-hat-over-eyes.png` | B | the gag lands: hat down over the eyes, muzzle clear below the brim |
| 5 | `BC1-rising.png` **NEW** | B→C | pushing up onto all fours, hat still down |
| 6 | `BC2-stands-hat-down.png` **NEW** | B→C | upright, paw reaching the brim, hat still down |
| 7 | `C-pushes-hat-up.png` | C | the push. Eyes revealed, deadpan |
| 8 | `CD-lowers-paw.png` **NEW** | C→D | paw lowering, hat settled, turned to front, **still deadpan** |
| 9 | `D-turns-to-camera.png` | D | settled stand, faces the viewer |

Contact sheet of all nine in sequence: `frames/_contact-sheet.png`.

**Why only 3–4 poses a beat.** This is a sprite animation, not a 24fps run cycle.
Two alternating poses plus screen travel is how a run has read since sprites
existed; the gag beats each get the one missing extreme (`AB-plant` for the hat
swinging forward, `BC1`/`BC2` for the rise) because those are the moments where a
missing extreme is what made the video attempts fail.

---

## 3 · The scale problem, and the constants that fix it

**Read this before wiring anything.** The nine frames were generated
independently, so **the character is a different size in every one** — the head,
which is a rigid part and therefore the only honest ruler, varies by nearly 2×
between `A-run` and `C-pushes-hat-up`. Render them raw at full-bleed and the
intro reads as a slow camera creep-in, which SHOT_BREAKDOWN §2 invariant 3
forbids ("no camera movement except shot E's push-in").

The fix is per-frame `scale` + anchor offsets, calibrated by eye against the
contact sheet. They live in **`normalize.py`**, which is the single source of
truth — it regenerates `frames/_contact-sheet.png` so any change is verified by
looking:

```
python3 docs/design/intro/normalize.py
```

Port these to a `const INTRO_FRAMES` in the feature module. `cx` is the head's
horizontal landing point on a 768-wide frame — it is the left→right travel.

| frame | t (s) | scale | cx | ground anchor |
|---|---|---|---|---|
| `A-run` | 0.00–0.11 | 1.00 | 150 | 907 |
| `A2-run-gather` | 0.11–0.22 | 1.00 | 240 | 922 |
| `A-run` (2nd) | 0.22–0.33 | 1.00 | 330 | 907 |
| `A2-run-gather` (2nd) | 0.33–0.45 | 1.00 | 384 | 922 |
| `AB-plant` | 0.45–0.56 | 0.72 | 330 | 941 |
| `B-skid-hat-over-eyes` | 0.56–0.72 | 0.63 | 384 | 936 |
| `BC1-rising` | 0.72–0.82 | 0.66 | 384 | 1131 |
| `BC2-stands-hat-down` | 0.82–0.92 | 0.57 | 384 | 1172 |
| `C-pushes-hat-up` | 0.92–1.02 | 0.54 | 384 | 1202 |
| `CD-lowers-paw` | 1.02–1.14 | 0.68 | 384 | 1081 |
| `D-turns-to-camera` | 1.14–1.25 | 0.70 | 384 | 1068 |
| shot E | 1.25–1.70 | push-in, see §6 | — | — |

Shot A cycles `A ▸ A2 ▸ A ▸ A2` across 0.00–0.45 (~9 fps), and **`cx` keeps
advancing through the cycle** — the leg alternation sells the run, the travel
sells the speed. He starts partly off the left edge, as the board has him.

> `ponytail:` these scales are eyeball-calibrated against the contact sheet, not
> measured from a rig. They are the calibration knob — if the founder says he
> "grows" anywhere, nudge the offending row and re-run `normalize.py`. A/A2 are
> the loosest fit (they are also the fastest and most forgiving beat).

---

## 4 · Driving it

A frame swap is a **discrete cut**, not a tween — that is the whole point of the
route. So the driver is one shared value stepping an index, not nine animated
opacities.

- One `useSharedValue(0)` for elapsed time, run with a single
  `withTiming(TOTAL, { duration: TOTAL, easing: Easing.linear })`, and a
  `useDerivedValue` that maps elapsed → frame index off the table in §3.
- Render **all nine** `expo-image`s stacked and absolutely positioned, each with
  `useAnimatedStyle` returning `opacity: idx === i ? 1 : 0`. Mounting them all up
  front is what avoids a decode hitch mid-beat; `expo-image` is already the app's
  image component (`Splash.tsx` uses it).
- `scale`/`cx`/`ground` from the table become a static `transform:
  [{ translateX }, { translateY }, { scale }]` per frame — **static, not
  animated**. The camera is locked off; only the frame index changes.
- **New durations go in `tokens.ts` `timing`, curves in `motion.ts` `easings`,
  and the component consumes them only through a hook** — `motion.md` §1 makes an
  inline `withTiming(x, {duration: 300})` in a component a review failure. The
  intro's beats do not fit the existing `enter`/`exit`/`emphasis` roles, so add
  an `intro` group to `timing` and a `useIntroSequence()` hook to `motion.ts`
  rather than inlining 1700.
- Reanimated LAYOUT animations break web (otto-lead, design-system §): none are
  needed here — opacity + static transforms only, so this plays on web.

---

## 5 · Reduced motion is a hard fork

Not a faster version — a different thing, per `README.md` and `motion.md` §1.

`motion.ts` already imports `useReducedMotion`, and every hook in that file is
reduced-motion aware; `useIntroSequence()` must be too. When it returns true:

- **Skip the sequence entirely.** Do not step frames.
- Show `D-turns-to-camera` (settled, facing the viewer) — or `E-the-look` if the
  close-up is preferred — plus the `otto` wordmark, both already at final
  opacity.
- Cross-fade the whole thing in over `timing.fade` (200ms) and hold for the same
  elastic window as §7, then dismiss.

No travel, no frame cuts, no push-in. Same information, same duration budget,
zero motion.

---

## 6 · Shot E (1.25–1.70) — the one shot that stays generative

The push-in from full body to head-and-shoulders is **pure camera**, no character
business, and it is the one shot the video model got right (SHOT_BREAKDOWN §3).
`shotE-pushin.mp4` already exists and is approved.

Two options, in preference order:

1. **Code it, no new asset.** Animate `scale` on `D-turns-to-camera` from 0.70 up
   to ~2.6 with `easings.emphasis`, translating so the head stays centred, and
   cross-fade to `E-the-look.png` over the last ~150ms — the eyes closing into
   the smile *is* the payoff, so it wants to land as the push settles. Keeps the
   whole intro as stills, keeps the reduced-motion fork trivial, keeps web
   working. Risk: `D` scaled ~3.7× will be soft on the way in.
2. **Keep `shotE-pushin.mp4`.** Cinematically safest, but it re-introduces a
   video file into a route chosen specifically to avoid one, and needs a second
   asset for the reduced-motion fork.

**Recommendation: try option 1 first** and only fall back to the video if the
softness reads on device. If it does, ~2 credits buys a `D-closeup-eyes-open`
still at the E framing to cut to mid-push, which fixes the softness and keeps the
no-video property.

The `otto` wordmark fades in beside him over ~0.2s once the push settles, then
~0.25s to read it. **First and only appearance** — no title card, the intro
cold-opens on the run.

---

## 7 · Playback rules (from README, restated because they are easy to lose)

- **Not the native splash.** Expo's splash is a static pre-JS image. This plays
  after it as an in-app view — the pattern exists at
  `src/features/onboarding/Splash.tsx`.
- **Not every launch.** First launch after install, or once per calendar day.
  Gate it beside the existing first-run gate (`onboarding/gate.ts`).
- **Skippable and interruptible.** Any tap cuts to the app immediately. If the
  session restores to a real screen, the intro loses.
- **Elastic tail.** Beats A–D are fixed physical action; the shot E hold is the
  shock absorber. Hold while the app boots, cut the moment it is ready — fast
  phone ~1.5s, slow phone ~2.2s, neither waits *because of us*. Hard ceiling 2.0s
  of animation before the hold starts.
- **No sound. No haptic.** Nothing happened that the user did, and there is no
  brand sound in the map (`motion.md` §3). Adding one is a contract edit plus
  founder sign-off.

---

## 8 · What still needs a human eye

Honest list, so nobody discovers these on device:

1. **The §3 scales are calibrated by eye.** They hold up on the contact sheet.
   They have not been seen in motion, because nothing has been built yet.
2. **Shot A's cycle is 2 poses.** It will read as a run. It will not read as
   *beautiful* animation — a real animator would want 4–6 and a proper
   contact/passing/high-point breakdown. That is the honest ceiling of the
   sprite route at this budget, and it is the right trade for a 0.45s beat the
   viewer sees once a day.
3. **`AB-plant` → `B` is the money cut.** It is the beat all three video attempts
   dropped. If any single cut needs a re-time on device, it is this one — the hat
   must read as *swinging forward and down*, not as *popping to a new state*.
4. **Shot E option 1 is untested.** See §6.
