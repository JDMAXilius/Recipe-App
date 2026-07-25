# Otto intro — beat sheet v1

Storyboard: `otto-intro-storyboard-v1.png` (low-fi, generated 2026-07-25).
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
| 1 | 0.00–0.25 | Cream frame, the `otto` wordmark alone, centred | The stage is set before anything happens. Stillness makes the entrance read. |
| 2 | 0.25–0.75 | He dashes in from the LEFT, body stretched low, hat streaming back | Fast. Cross the frame in ~0.5s; he should feel like he's late. |
| 3 | 0.75–1.05 | Skid to a stop beside the wordmark, dust puff, hat flops over his eyes | The consequence. This is the squash-the-I moment — a small physical accident. |
| 4 | 1.05–1.40 | One paw pushes the hat back up, dust settling | The recovery. Deadpan, not mugging. |
| 5 | 1.40–1.70 | He turns to face the viewer, small and calm beside the wordmark | The turn is a separate beat from the look. Don't merge them. |
| 6 | 1.70–2.10 | Hold: the warm closed-eye smile, then cross-fade to the app | The `pleased` expression already exists as art (`otto-pleased-cut.png`). |

**Total ~2.1s.** Pixar's ident is ~10s because it plays once in a cinema. An app
that makes a hungry person wait 10s to cook is hostile. Two seconds is the
ceiling, and it must never block first paint.

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
4. Is the hat-flop the right accident, or should he skid *into* the wordmark and
   nudge it — closer to Luxo squashing the I?
