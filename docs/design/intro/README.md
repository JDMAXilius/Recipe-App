# Otto intro — beat sheet (v2)

Storyboard: **`otto-intro-storyboard-v2.png`** (current). `v1` kept as the
earlier direction — it opened on the wordmark alone; the founder cut that so the
name lands only on the final look.
Reference the founder gave: the Pixar/Luxo Jr. ident.

**What we're actually stealing from Luxo.** Not the lamp and not the length —
the *structure*. The character doesn't perform for you. It walks in doing its
own small physical task, the task has a consequence, and only at the very end
does it acknowledge you're there. That last look is the whole trick: it turns a
logo into someone saying hello. Otto's version is a run, a skid, a hat that
flops over his eyes, and then the look.

## The beats

| # | t | On screen | Notes |
|---|---|---|---|
| 1 | 0.00–0.45 | **Cold open on action.** He dashes in from the LEFT of an empty cream frame, body stretched low, hat streaming back | No wordmark, no held title card. Starting on movement is punchier than starting on a logo, and it buys back a quarter-second. |
| 2 | 0.45–0.72 | Skid to a stop, dust puff, hat flops over his eyes | The consequence — the squash-the-I beat. Fast; it's an accident, not a pose. |
| 3 | 0.72–1.02 | One paw pushes the hat back up, dust settling | The recovery. Deadpan, not mugging. |
| 4 | 1.02–1.25 | He turns to face the viewer | A separate beat from the look. Don't merge them — the turn is what makes the look land. |
| 5 | 1.25–1.70 | The hold: warm closed-eye smile, and **now** `otto` fades in beside him | The name and the look arrive together, so they read as one gesture: he says hello and tells you who he is. Wordmark fade ~0.2s, then ~0.25s to read it. |

## How long: **1.7s**, hard ceiling 2.0s

The number isn't taste — it's set by a constraint. **The intro should hide
inside the app's own cold start, so it costs the user nothing.** A React Native
cold start on a mid-tier phone is roughly 1.5–3s; at 1.7s the animation is
finished before the app would have been interactive anyway. Go past ~2s and you
stop masking a wait and start *being* one.

Pixar's ident is ~10s because it plays once, in a cinema, to a seated audience.
An app that makes a hungry person wait 10s to cook is hostile.

**Make the last beat elastic.** Beats 1–4 are fixed (they're physical action —
stretching them looks like slow motion). Beat 5, the hold, is the shock
absorber: hold it while the app finishes booting, and cut the moment it's ready.
That way a fast phone sees ~1.5s, a slow one sees ~2.2s, and neither ever waits
*because of us*.

## Rules this has to obey

- **It cannot be the native splash.** Expo's splash is a static image shown
  before JS boots — it is not animatable. This plays *after* it, as an in-app
  view (the pattern already exists: `features/onboarding/Splash` +
  `assets/splash/otto-splash.webp`).
- **Not on every launch.** Charming once a day, irritating three times an hour.
  Gate it: first launch after install, or once per calendar day. Anything else
  and the fifth cook of the week resents it.
- **Skippable and interruptible.** Any tap cuts to the app immediately, and if
  the session restores to a real screen, the intro loses.
- **Reduced motion is a hard fork**, not a faster version: show the static
  wordmark + Otto, cross-fade, done (motion.md §1 — reduced-motion parity is a
  blocker).
- **Sound: none, for now.** There is no brand/intro sound in the map
  (motion.md §3), and adding one is a contract edit plus founder sign-off — not
  a thing the intro gets to invent for itself. If we do add it, it is ONE soft
  texture on the skid, never a fanfare: the app has exactly one proud sound and
  it belongs to finishing a meal, not to opening an app.
- **No haptic.** Nothing happened that the user did.

## How we'd build it — three routes

| Route | Cost | Verdict |
|---|---|---|
| **Sprite frames + Reanimated** | ~8–12 painted frames, no new dependency | **Recommended.** Obeys the repo's no-new-dep law, plays on web, and the reduced-motion fork is trivial. Frames can be generated the same way `otto-pleased-cut.png` was. |
| **Short video file** (`expo-video`) | One 2s asset, easiest to make cinematic | Heaviest bundle, awkward on web, and a video can't fork for reduced motion without a second asset. Best kept for the **App Store preview video** (readiness A9/F5). |
| **Rive** | A real state machine | Already measured and recommended **no-go**: Otto is painted raster, so a Rive Otto means redrawing the character (see DELIGHT ticket, Phase 3). |

## Open questions for the founder

1. Wordmark: lowercase `otto` as sketched, or the full logo lockup?
2. Does he enter from the left, or drop in from the top (a wetter, more
   otter-ish entrance)?
3. Frequency: once per install, or once per day?
4. Is the hat-flop the right accident? With the wordmark gone from the early
   frames, the alternative is he skids past his mark and has to step back into
   it — a different joke, same length. (He can no longer bump the wordmark,
   since it isn't there yet.)

*Answered 2026-07-25: the wordmark appears only on the final hold — so no title
card, and the intro cold-opens on the run.*
