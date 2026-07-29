# Bagged — five navigation directions

Figma page **`Bagged · Nav directions`** (`118:2`). Each version is built into a real `B1 · Shelf`
so they compare on content, not on a strip in isolation.

These differ in **destination set, structure and style** — not five paint jobs on one bar.
Grounded in Mobbin: [BeReal](https://mobbin.com/screens/b83a2290-0e42-457c-b7c1-8768a1cb1bef),
[Lapse](https://mobbin.com/screens/e735449e-4c90-4055-b8c1-2f416d3f9399),
[Snapchat](https://mobbin.com/screens/49417f30-35dd-436b-8383-f1790062eb11),
[Linear](https://mobbin.com/screens/1d6b3350-2ad6-4be7-aee2-001e19dbcb6d),
[Apple Photos](https://mobbin.com/screens/27f28cbe-b863-496e-9e8b-a2947866f057),
[ElevenLabs](https://mobbin.com/screens/84b4c2ce-7b32-4595-b59f-005f5ed09e87),
[Play](https://mobbin.com/screens/5a796023-ef12-4dc2-bf87-59a9c3c6daf9),
[Goodreads](https://mobbin.com/screens/dc7b431e-f747-47c3-b789-bac7b5f7c2b0),
[CVS](https://mobbin.com/screens/966a6c3c-74a4-46ed-ae08-8ba990bf4ecf),
[Obsidian](https://mobbin.com/screens/93c23c06-f037-4143-a56d-e2a4d91ab315).

---

## V1 · Floating pill + centre capture — `118:870`

**Menu** `Shelf · List · ⊕ · Prices · Me` — 5 slots, icon + 11px label.
**Structure** 358×56 pill, `surface/card`, `elev/2`, 16pt inset, y=746. Capture is a 44pt
`surface/ink` disc in the centre slot.
**Style** light, quiet, label-led. Closest to BeReal and Goodreads.

**For** every destination is named and one tap away; capture sits under the thumb.
**Against** five destinations on a 20-second-session app is a lot. The centre disc competes
with the `Eat me first` card for "the thing to press". Labels at 11px are on the type floor,
and at 1.6× Dynamic Type they clip vertically before they clip horizontally.

---

## V2 · Split pill, detached capture — `118:1013`

**Menu** `Shelf · List · Prices · Me` icon-only in the pill; **capture is a separate 56pt disc**
to its right.
**Structure** 280×56 pill + a detached `surface/ink` circle. Active destination gets a
`brand/markTint` chip behind the icon rather than a colour change.
**Style** Linear / ElevenLabs / Apple Photos. The most contemporary of the five.

**For** the tinted chip is a **shape** channel, not a hue channel — it fixes the audit's
"active tab is colour alone" finding without waiting for the SF Symbol set. Capture stops
competing with navigation because it stops being *in* the navigation.
**Against** icon-only demands that the 40-glyph set be genuinely legible; Bagged has none drawn
yet. Two floating objects is more chrome, not less.

---

## V3 · Three verbs — `118:1156`

**Menu** `Have · Buy · Paid` — the app's three jobs, named as verbs. **Prices folds into Paid,
Me moves to a header avatar, capture moves to the header FAB** already on B1.
**Structure** 266×56 pill, centred, active gets a `brand/markTint` rounded chip with icon + label.
**Style** Play / Apple Photos minimal.

**For** it matches what the product actually is. The map's own core features are exactly three,
and a 20-second session doesn't need five doors. The names are the positioning line said out
loud — *knows what you have, remembers what you paid*.
**Against** "Paid" has to carry Prices, Trips, Month and Item history — four screens under one
word. Losing a Me tab means Setup lives behind an avatar, which is less discoverable, and H1
already dead-ended ten screens once.

---

## V4 · Full-width bar, raised capture — `118:1299`

**Menu** `Shelf · List · ⊕ · Prices · Me` — same set as V1, opposite treatment.
**Structure** edge-to-edge 390×88 `surface/ink` bar with 20pt top corners, and a 60pt capture
disc **raised above the bar's top edge** with a 4pt ink ring cutting it out of the bar.
**Style** Lapse / Snapchat. The heaviest and most confident.

**For** the strongest possible capture affordance, and capture *is* the product — a shelf that
doesn't fill itself is a chore list. The ink bar anchors the warm paper ground.
**Against** 88pt of permanent dark chrome on a paper-ground app, and it inverts the palette's
own logic: `surface/ink` is specified for *data* surfaces, not chrome. Least distinctive
against Mint and Copilot.

---

## V5 · Contextual toolbar — `118:1442`

**Menu** none. The bar holds **actions for the current screen** — `Sort · Search · ⊕ · Filter` —
plus a `Shelf ⌄` chip that opens a destination sheet.
**Structure** 358×56 pill, same shell as V1, entirely different contents. Actions change per
screen; the chip is the only constant.
**Style** Obsidian's toolbar, adapted.

**For** the honest bet on the product's actual job. Nobody browses a grocery app — they arrive
with one intent. It gives B1's four sort options a home, which the sectioned-list decision
needs and no other version provides. Scales to 57 screens without a five-door ceiling.
**Against** it is the riskiest by a distance. Destinations behind a chip means Prices gets
visited less, and Prices is what Bagged Plus sells. Every screen must define its own action
set — that is 57 decisions, not one.

---

## Recommendation

**V2 for the build, V3 as the one to test.**

V2 keeps all four destinations addressable, fixes a real accessibility finding with a shape
channel instead of a hue, and un-couples capture from navigation. It is the lowest-risk
improvement on what is already built.

V3 is the more interesting product bet and the only version whose menu says what the app is —
but it hides Setup and overloads "Paid", so it needs testing before it earns the build.

**V4 is the one to reject.** It spends 88pt of permanent dark chrome and contradicts the
palette's own rule that ink means data, not furniture.

**V5 should not be decided in Figma.** It is a bet about session intent, and the way to settle
it is to look at what people actually open Bagged to do.
