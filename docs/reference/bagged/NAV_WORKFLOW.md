# Bagged — navigation: V2, built

**Decided:** V2 · split pill with detached capture. Built and applied to all 15 tab-level screens.

**Components** (`Bagged · Foundations`, `72:2`)
- `NavBar` (`121:1274`) — variant set, `active = shelf | list | prices | me`
- `CaptureButton` (`121:1275`) — detached, 56pt
- `icon/{shelf,list,prices,me}-{outline,filled}` + `icon/capture` — real drawn vectors, not placeholders

---

## 1. Geometry

| | |
|---|---|
| Pill | 280 × 56, `surface/card`, `radius/pill`, `elev/2`, at **x=16, y=746** |
| Slot | **64 × 48** each, 4 slots — clears WCAG 2.5.8's 24×24 and is one row of the 44pt HIG target |
| Capture | **56 × 56** `surface/ink` disc at **x=318, y=746** — 22pt gap from the pill, 16pt from the right edge |
| Bottom reserve | content must end at **y ≤ 738** (56 pill + 8 gap + 42 safe area). D1 is the worked example |

## 2. The active state uses two channels, deliberately

The accessibility audit found the old bar signalled the active tab **by hue alone** — five identical
placeholder circles, labels differing only in fill. Deuteranopes could not tell which tab they were on.

V2 fixes it twice over:

1. **Shape** — the active slot gets a `brand/markTint` chip. Visible in greyscale.
2. **Weight** — the active icon swaps from `outline` to `filled`. Also visible in greyscale.

Colour (`brand/mark` vs `ink/muted`) is the *third* channel, not the only one.
**Neither channel may be dropped.** A filled icon with no chip, or a chip with an outline icon,
puts us back where we started.

## 3. Labels are gone, and what that costs

V2 is icon-only. This buys the 11px label problem going away — those labels sat exactly on the
type floor and clipped *vertically* at 1.6× Dynamic Type because the pill height could not grow.

It costs first-run legibility. Two mitigations, both required:
- **The four glyphs are drawn, not placeholders** — a cupboard, ticked rows, a bar chart, a person.
- **Each destination's screen title names it in `type/display`** — "Your shelf", "Weekly shop",
  "Prices", "Setup". The label moved from the chrome to the content.
- Every slot carries an `accessibilityLabel`; the icon vector itself is
  `isAccessibilityElement = false`.

## 4. What each destination owns

| Slot | Root | Owns | Reached by push |
|---|---|---|---|
| **Shelf** | B1 | the shelf, per-item detail, what's turning | B2, B3, B4, B5, B6, B7 |
| **List** | D1 | this trip's list, aisle order, which shop | D2, D3, D4, D5, D6, D7 |
| **Prices** | E1 | your price history, trips, monthly spend | E2, E3, E4, E5, E6, E7 |
| **Me** | H1 | subscription, surfaces, voice, kitchen, data | H2–H6, F1–F4, G1–G8 |

**Me carries 21 of the 57 screens.** That is why H1's row list is load-bearing — when six rows went
missing it dead-ended ten screens. Any screen added under G or H needs a row on H1 in the same commit.

## 5. Capture is not a destination

`CaptureButton` opens **C1**, a sheet, from anywhere. It does not change the active slot, does not
push, and does not appear in the back stack.

```
tap ⊕  →  C1 sheet  →  C2 camera  →  I4 processing  →  C3 review  →  C7 result  →  B1
                    ↘  C5 barcode  ↗
                    ↘  C6 by hand  ↗
```

Dismissing C1 returns to whatever was underneath, unchanged. **C7 always lands on Shelf**, because
the shelf is what just changed — this is the one place capture moves the active slot.

## 6. Back behaviour

- **Tab switch never pushes.** Each root is its own stack; switching away and back preserves depth.
- **Re-tapping the active slot** pops that stack to root, then scrolls to top. Standard iOS.
- **Every pushed screen shows a back row naming its parent** — `‹ Shelf`, `‹ List`, `‹ Setup`.
  A back label must name a *screen*, never a section header. G4 shipped as `‹ Surfaces`, which is a
  section, and it was fixed to `‹ Setup`.
- **Sheets** (C1, D5 shop switcher, sort/filter) dismiss down and never enter the stack.
- **F4 · Guest view has no nav at all** — no pill, no capture. A guest owns one list and nothing else.
  This is deliberate and must not be "fixed" for consistency.

## 7. Badges

One rule: **the List slot shows a 6pt `clay/500` dot when auto-add has queued something you have not
seen.** It clears on visiting D1.

No other slot ever badges. Prices badging would manufacture urgency about your own spending, which is
the opposite of what the app claims about itself.

## 8. Cross-tab links

Three, and only three, may jump between tabs:

1. B2 `Price history ›` → **E2** (Prices)
2. B2 `Add to list now` → stays on Shelf, toasts "Added to Weekly shop"; it does **not** jump
3. D1 row `Set what you paid` → sheet, stays on List

Everything else stays in its own tab. A cross-tab jump that isn't in this list is a bug.

## 9. Still open

- **`I1 · Generic empty` defaults to Shelf.** Its copy is Shelf language, but by definition it is
  reachable from anywhere. Either give it no bar, or pass the caller's active slot through.
- **The 96pt bottom reserve** is applied on D1 only. The other 14 tab screens still let content run
  under the pill — H1's `Places` row is currently bisected by it.
- **`⊕` on a guest device** — F4 has no capture, so a guest cannot add by receipt. Intended, but it
  is not stated anywhere in the product copy.
