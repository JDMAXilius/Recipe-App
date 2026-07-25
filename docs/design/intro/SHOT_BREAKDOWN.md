# Otto intro — shot breakdown (production spec)

Board: `otto-intro-storyboard-v3.png` (founder-approved, panels 2–6).
Target: **1.7s**, ceiling 2.0s. Portrait **9:16**, phone splash.
This document is the contract. If a frame disagrees with the board, the board wins.

---

## 1 · The shots

Panel numbers are the board's. `t` is the final 1.7s cut, not the source footage.

### SHOT A — "he runs in" (board panel 2) · t 0.00–0.45
- **Camera:** locked off. No pan, no zoom, ever.
- **Frame:** he enters from the LEFT edge and travels right, ending near centre.
- **Character:** full body, side-on, low and stretched, front paws reaching, hind
  legs pushing, tail streaming straight out behind. Hat tipped BACK by the speed.
- **Scale:** small — he occupies roughly the middle third of frame height.
- **Direction of travel: LEFT → RIGHT. This never reverses in any later shot.**
- **Background:** empty warm cream. Nothing else. Ever.

### SHOT B — "skid, hat flops" (board panel 3) · t 0.45–0.72
- **Camera:** locked off.
- **Action:** he plants and SKIDS, body dropping low, front paws braced, hind
  legs sliding forward under him. Dust puff kicks up BEHIND him — i.e. on the
  LEFT, the side he came from.
- **The gag:** momentum carries the tall hat FORWARD and DOWN over his eyes.
  The hat stays hat-shaped and sits on his brow, covering the eyes only. His
  muzzle, cheeks and whiskers stay visible below the brim.
  **FAILURE MODE TO AVOID: the hat must not engulf his head or become a
  shapeless white mass. It is a hat sliding down, not a bag swallowing him.**
- **He still faces RIGHT.**

### SHOT C — "pushes hat up" (board panel 4) · t 0.72–1.02
- **Camera:** locked off.
- **Action:** he rises onto his feet, ONE paw goes to the brim and pushes the hat
  back up off his eyes. Eyes revealed underneath.
- **Expression:** deadpan, faintly annoyed. **Not smiling yet** — the smile is
  spent at the end or it lands twice and means nothing.
- Remaining dust settles low near his feet.

### SHOT D — "turns to camera" (board panel 5) · t 1.02–1.25
- **Camera:** locked off.
- **Action:** he lowers the paw, the hat settles upright, and he TURNS to face
  the viewer, settling into a calm still stand, paws at his sides.
- **FAILURE MODE TO AVOID: he must not turn AWAY from camera first. No back
  view, no full spin. He is angled right; he rotates the SHORT way to front.**
- **Scale:** full body, small in frame, generous space above and below.

### SHOT E — "the look, hold" (board panel 6) · t 1.25–1.70
- **Camera:** the ONLY camera move in the film — a smooth push-in from the full
  body to a tight head-and-shoulders close-up. The top of the hat crops off the
  top edge.
- **Action:** as the push settles, his eyes close into a warm contented smile.
  He holds, breathing softly.
- **Wordmark:** `otto` fades in beside him over ~0.2s, then ~0.25s to read it.
  **This is the first and only time the wordmark appears.**

---

## 2 · Invariants (true in every frame)

1. **Character lock.** Warm brown fur, tall white chef's hat, terracotta apron.
   Painted watercolour / coloured-pencil children's-book style, soft outlines.
   Reference: hero lock `5f74831c-0126-44d0-9dd8-731d331fb75a`.
2. **Background is empty cream.** No kitchen, no props, no floor line, no
   horizon, no text except the final wordmark.
3. **No camera movement except shot E's push-in.**
4. **Screen direction is left→right throughout.**
5. **One smile, at the end.** Everything before it is deadpan or effortful.
6. **Scale continuity.** A–D hold a consistent character size; only E changes it,
   and only by pushing in.

---

## 3 · What was tried, and what it proves

Three generations, all verified by extracting frames — not by looking at a
thumbnail and hoping.

| Attempt | Method | Result |
|---|---|---|
| 1 | `kling3_0_turbo`, one start frame + prose | Run and skid read. **Hat flop absent entirely.** Ended on a wide shot where the board says close-up. Portrait/landscape mismatch. |
| 2 | `seedance_2_0`, **start + end frames pinned**, per shot | **A:** run + skid good, **hat flop still absent** — it ignored the pinned end frame's hat-over-eyes. **B:** hat flop happened but the hat **engulfed his whole head as a white blob**. **C:** he **turned his back to camera** before facing front. **D (the push-in): correct, and genuinely good.** |

**The conclusion this forces.** Pinning both ends did not buy control of the
*in-between*. The model interpolates plausibly, not faithfully, and the two
beats it mangled are exactly the two that carry the character: the hat gag and
the turn. Three of five shots were wrong in ways a re-roll does not
systematically fix — it is a dice roll each time, at 36 credits a throw.

**Generative video is the wrong tool for shot-accurate character business.**
It is the right tool for the push-in (shot E), which is pure camera.

---

## 4 · The route that will actually work

The keyframes are **excellent and on-model** — they are the expensive part and
they already exist. Build the motion deterministically from them.

| Asset | Status |
|---|---|
| Run pose (A) | ✅ generated |
| Skid + hat over eyes (B) | ✅ generated (mirrored to face right) |
| Pushes hat up (C) | ✅ generated |
| Stands, faces camera (D) | ✅ generated |
| Close-up, closed-eye smile (E) | ✅ generated |

What is missing is **in-betweens**, and stills are 2 credits against video's 36.
Generate the handful of intermediate poses as stills, then drive them from code:
positions and timing in Reanimated, which the app already depends on. That gives
frame-exact fidelity to the board, a trivial reduced-motion fork, web support,
and no video file in the bundle.

Shot E's push-in can stay generative — it is the one shot that came out right.

**Budget note:** 46 credits remain of 198. That is ~1 more video shot, or ~23
stills. Spend it on stills.

### ✅ Done, 2026-07-25 — see `BUILD_NOTE.md`

Four in-between stills generated (`A2-run-gather`, `AB-plant`, `BC1-rising`,
`BC2-stands-hat-down`, `CD-lowers-paw` — five, one of which was a re-roll for a
missing apron). **12 credits spent, 34 remain.** The full nine-frame sequence is
in `frames/_contact-sheet.png`.

One thing this uncovered that the spec did not anticipate: the keyframes were
generated independently, so **the character is a different size in each one** —
up to 2× on head width, which is a rigid part. Rendering them raw would violate
§2 invariant 3 (no camera move) by reading as a creep-in. Per-frame scale and
anchor constants fix it in code at zero credit cost; they are calibrated in
`normalize.py` and tabulated in `BUILD_NOTE.md` §3.
