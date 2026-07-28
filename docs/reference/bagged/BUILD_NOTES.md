# Bagged — Figma build record

Companion to `SCREEN_MAP.md` (what to build) and `VISUAL_DIRECTION.md` (how it looks).
This file is what the build actually produced, what is wrong with it, and the traps that
cost four builders time.

**File:** `Lpx5Pdgvy3Gx8l5ZSDS0JH`
**Pages:** `Bagged · Foundations` (`72:2`) · `Bagged · Screens` (`74:16`)

---

## What exists

**Foundations** — 3 variable collections (`Bagged color` 44 · `Bagged space` 10 ·
`Bagged radius` 6), 13 text styles, 3 effect styles (`elev/1–3`; `elev/0` deliberately does
not exist, because "no shadow" is the default, not a style), 25 components/variant sets.

**Screens** — all 57, laid out in y-bands at x = index × 450:

| Band | y | Screens |
|---|---|---|
| A+I | 0 | A1–A6, I1–I5 (11) |
| B | 1000 | B1–B7 |
| C | 2000 | C1–C7 |
| D | 3000 | D1–D7 |
| E | 4000 | E1–E7 |
| F+G | 5000 | F1–F4, G1–G8 (12) |
| H | 6000 | H1–H6 |

---

## Known defects — fix before this is handed to engineering

| # | Screen | Defect | Fix |
|---|---|---|---|
| 1 | D1 | Prices render without `$` (`~3.50`, `4.30`) while E4 renders `$284.60`. Violates §2.3 rule 3. | Add `$` at the same size and weight as the digits |
| 2 | E4 | Content is 1090pt against an 844 viewport; the insight card is clipped mid-sentence by the floating tab bar | Reflow, or reserve the 56+16+safe-area bottom band per §3.1 |
| 3 | E5 | Same — 1099pt | Same |
| 4 | H1 | The `Widgets ›` row was cut for space, so **G4 has no entry point**. A navigation dead end. | Restore the row; settings screens scroll |
| 5 | All | Every `ItemMark` glyph is a placeholder ellipse | Draw the ~40-glyph set (SF Symbols cannot be inserted via the plugin API) |
| 6 | B2 | "Best price seen 🔒" renders as `Bagged Plus ›` per §4.4, but the Mobbin research argued for the real value **blurred** — and H2's entry rule says exactly that | Pick one and make §4.4 and H2 agree |
| 7 | C1 | Receipt facsimile totals $30.96; C2–C7 run a canonical $67.31 / 14 lines / 12 matched | Re-cut C1's facsimile, or accept it as pre-capture and say so |
| 8 | G2 | Shop rows lost their pin icon; the `at-this-shop` 8pt dot is missing | Needs a leading-glyph slot on `ToggleRow` |

---

## Accessibility audit — 1,315 text nodes measured against rendered pixels

**Verdict: does not conform** (WCAG 2.2 AA). 8 serious, 7 moderate. Every contrast ratio
claimed in `VISUAL_DIRECTION.md` §1.2–1.4 was verified against actual rendered pixels and
**all of them are correct**. `brand.mark` never lands on ink anywhere, so the 2.29:1 trap is
avoided in all 57 screens. Type floor holds absolutely — nothing below 11px, zero mixed-size
runs.

### Fixed in this pass

| Node | Was | Now |
|---|---|---|
| `75:45` StatTile overline | `ink/muted` on `bg/sunk` = **4.43:1** | `ink/secondary` = 6.38:1 — propagates to 10 tiles on 5 screens |
| `76:436` F1 second `✕` | `#F5F1E8` on `#F5F1E8` = **1.00:1**, invisible but present to VoiceOver at the exact top-right dismiss position | deleted |
| `77:817`, `77:827` D5 | empty TEXT nodes, announced as unlabelled elements | deleted |
| `76:296`, `76:2044` search placeholders | 4.43:1 | `ink/secondary` |
| `77:754` B6 "empty" | `ink/tint` used as text = 3.69:1 | `ink/muted` 5.33:1 |
| `76:789` D1 chevron | 4.40:1 on `clay/100` | `ink/secondary` |
| `77:626` E3 "over" tag | `clay/500` on `clay/100` = **4.25:1** — the redundant channel that saves the chart's colour encoding was itself failing | new `clay/600` `#8F4429` = 5.2:1 |
| B1, B7, F2 tab bars | y = 764 / 764 / 776 | y = 746, the §4.10 value |

### Not fixed — build-time acceptance criteria, not mockup defects

- **96pt bottom content inset** (`space.14` + gutter + safe area) on all 15 tab-bar screens.
  Without it the floating pill buries live rows: B1 covers **36pt of a 56pt row** (Avocados),
  E4 clips its insight card by 18pt, H1 loses 5pt. A static frame cannot express `contentInset`
  — this must be an engineering acceptance criterion. **WCAG 2.4.11 Focus Not Obscured.**
- **Tab slots are 20–35 × 38pt**, below even the 24×24 AA minimum (2.5.8). Each needs a fixed
  56×56 hit frame inside the pill — 5 × 56 = 280 fits the 358 pill with room to spare.
- **16 icon-only controls** (`⋯` at 13×22, `✕` at 12×18) need 44×44 wrappers. The nav/header
  parents are full-width but only 22–27pt tall, so **height is the failing axis** — widening
  does nothing. F1's `⋯` overflow is fine; its parent is already ≥44.
- **Checkbox sizes are inconsistent** — 22×22 in D1's rows but 20×20 in D1's collapsed row and
  D7. Normalise to 22.
- **47 freshness rails, 81 glyph TEXT nodes, 62 placeholder icon ellipses** need
  `isAccessibilityElement = false` with the label on the wrapper. As TEXT, `›` and `⋯` are
  announced literally ("greater-than sign", "horizontal ellipsis").
- **Tab bar Dynamic Type**: a fixed 358×56 pill with 11px labels sitting exactly on the type
  floor. At 1.6× the labels clip *vertically* because the height cannot grow. Either let the
  pill grow, or drop to icon-only above ~1.3× with the label moved to `accessibilityLabel`.
- **H (5 screens) and D (2 screens) use their own tab-bar wrappers** (390×80 and 390×72) rather
  than the `TabBar` component. One component, one y.

### Blocked until the SF Symbol set lands

**The active tab is signalled by colour alone.** Every tab icon is an identical 20×20
placeholder ellipse and the labels differ only in fill, so a deuteranope sees five identical
grey circles. §4.10 already specifies a *filled* icon for the active state — when the symbols
arrive, active must use the `.fill` variant **and** weight 600 on the label. Two channels.
This cannot be validated while the placeholders are in place.

### What the audit confirmed is genuinely good

- **23 of 23 `ShelfRow`s** carry state as a word, and the sub-label ink tracks the rail state in
  every case. Colour is never the sole channel on the home screen.
- **24 of 24 price deltas** carry `▲`/`▼` *and* an explicit sign. No bare coloured number anywhere.
- **Money is never coloured** — every price node is `#231F1A`.
- **C3's confidence is words** (`no match` / `sure` / `not sure`) plus the `~` prefix.
- **B1's "Peanut butter" renders no filled rail** — §7's "worst possible failure" is avoided.
- **Zero text nodes use `TRUNCATE` or fixed sizing** across all 57 screens. The Dynamic Type
  clipping risk I expected is simply not present.
- **E1 encodes "latest" as opacity 0.16 vs 1.0 on one hue** — a pure lightness channel, fully
  colourblind-safe. That is the pattern; **E3's over-budget bars should copy it** rather than
  relying on hue at 2.15:1 bar-to-bar separation.

---

## Certification review — verdict: NEEDS WORK

3,205 nodes scanned. **20 of the 22 §7 prohibitions are clean** — zero off-palette colours,
zero text below 11px, zero non-system fonts, zero gradients, no second page background, no
teal, no indigo, no terracotta. Six builders working blind and not one invented a colour.
That is why this is NEEDS WORK and not NOT CLOSE.

It fails on the three things a token audit cannot see: **navigation that dead-ends**, **data
that contradicts itself across bands**, and **six builders rendering the same component six
ways.**

### P0

1. **`H1 · Setup` is missing 6 of its 9 rows, which dead-ends 10 screens** — G1, G2, G3, G4,
   G5, G7, H3, H4, H5, H6 all have a back link to H1 and no forward link from it. G4's back
   link points at `‹ Surfaces`, which is a section header, not a screen.
2. **The 26 Jul receipt has two totals.** C says $67.31 (and C2→C3→C7 actually computes it);
   E5 and E3 say $78.40, with a line list that includes an olive oil appearing on no other
   screen. C1's facsimile carries the *same store, branch and date* with a third total, $30.96.
3. **I4 breaks the count mid-flow** — "12 found / 8 of 12" between C2's 14-found and C3's
   14-lines.
4. **E3 and E4 describe the same four July trips with different numbers.** E4 is internally
   consistent ($148.20 + $71.40 + $65.00 = $284.60, treemap sums exactly); E3 totals $303.30.
5. **Three different store rosters**, all claiming "3 stores": D5 has Safeway·Church St,
   G2 has Whole Foods·Silver Lake, E7 compares Walmart with no Costco.
6. **The Weekly shop list exists in three incompatible versions** — "4 of 9 left" (D1),
   "5 of 7 left" (F4, which then contradicts itself), "8 LEFT" (ambient). G7 says `8 LEFT`
   in its header and `7 to go` in its footer.
7. **Whole milk has four different current prices** across E1, E2 and B2.

### Fixed in this pass

| Finding | Fix |
|---|---|
| G8 printed an internal spec annotation as UI copy, including the screen ID "G1" | deleted |
| D4 showed the user the word `HOUSEHOLD` | → `KITCHEN` |
| C3 tagged a line lifted from a scanned receipt as `typed` | → `receipt` (this is the honesty channel; the one thing the product is about) |
| H2 "Restore purchase" | → "Restore purchases" |
| Tab bar at four different heights (746 / 764 / 772 / 776) | all 15 normalised to **y = 746** (§4.10: 358×56, 8pt above a 34pt safe area) |

D1 and D7 needed `layoutPositioning = 'ABSOLUTE'` first — their wrappers are auto-layout
children, so `y` was layout-controlled and silently ignored.

### P0 remediation — done

**The canonical dataset, now propagated across all bands:**

| | |
|---|---|
| Receipt | Trader Joe's · Cesar Chavez · 26 Jul 2026 · 14 lines · 12 matched · 2 unmatched · **$67.31** |
| July | 4 trips · 3 stores · **$284.60** — 26 Jul TJ $67.31 · 19 Jul Safeway $71.40 · 12 Jul Costco $65.00 · 5 Jul TJ $80.89 (over) |
| Roster | Trader Joe's · Cesar Chavez 24 · Costco · Novato 9 · Safeway · Church St 5 = **38** |
| Weekly shop | 7 things · **5 left** · **≈ $30.40** |
| Whole milk | 5 Jul TJ $4.29 → 12 Jul Costco ~$4.39 `seed` → 19 Jul Safeway $4.29 `typed` → 26 Jul TJ **$4.49** `receipt`; usual $4.42, range $4.29–$5.19 |

**H1 rebuilt with all 12 rows** — every one of G1, G2, G3, G4, G5, G6, G7, H3, H4, H5, H6 and
F2 now has a forward link. G4's back link retargeted to `‹ Setup`. Body hugs at 969pt inside
the 844 frame, the same overflow pattern E4 uses.

**Also fixed:** `$` on every row price, subtotal and delta across D1, D2, D3, D6, D7, F4, G4,
G7 (the only bare numbers left are receipt-facsimile lines, which are correct); 7 tab bars
retargeted to the right active tab; **I5 split into three screens** (`I5` camera, `I5b`
location, `I5c` notification), clearing the only §7.21 violation; C3's `NEEDS YOU` header to
`ink/muted`; C7's `~7 days` rail to `fresh/soon`; H2's fourth benefit row added; D2's
self-contradicting footnote fixed; C1's facsimile re-dated to 28 Jun so it reads as a prior
trip.

**A regression I introduced and then fixed.** Normalising the tab bar to y=746 pushed it up
into D1's sticky footer, half-hiding `≈ $30.40`. D1's scroll region is now 618pt so the
footer (618–674) and input bar (674–738) clear the pill with an 8pt gap. **Every other
tab-bar screen still needs the same treatment** — this is the 96pt bottom reserve, and D1 is
now the worked example.

**A claim that did not survive checking.** The fixer reported E3 rounds its bar corners at the
baseline (§7.16). All 12 bars measure `bl:0, br:0`. The certification review was right: no
builder rounded a baseline anywhere in the file. E3's actual defect is different — all 12 bars
render at opacity 1 where E1/E2/E6 correctly use 16% for idle.

### Still open after remediation

- **`I1 · Generic empty`** still highlights Shelf. No target tab was ever specified and its copy
  is Shelf language. Needs a decision, not a fix.
- **H1's `Language` and `Read the list aloud` rows were folded into a single `Voice ›`** that
  opens H3, which owns both. Restore them under the promise row if you want the old shape.
- **`D6`'s hero says `≈ $24.20` while its item rows sum to $14.39**, and its fourth cheaper item
  is `Rolled oats`, which is not one of the canonical 7.
- **`E3`'s header stats still disagree with themselves** — this is the contract bug below, not a
  build error.
- **`E2` draws 11 bars for "12 observations"** and does not hatch the estimated one.
- **The 96pt bottom reserve** on the remaining 14 tab-bar screens.
- **`×n` carries four meanings**, apostrophes are mixed, and "yoghurt"/"yogurt" both appear.
- **The 40 ItemMark glyphs** — still the largest genuinely new piece of design work.

### Contract bugs — fix the documents, not the screens

- **`SCREEN_MAP.md` §E3 specifies both "38 trips · $2,940 tracked" and "AVERAGE TRIP $79.20".**
  $2,940 ÷ 38 = $77.37. The builder rendered both faithfully.
- **E1's footnote is specified two ways.** `SCREEN_MAP.md` says "**This is** what you paid";
  `VISUAL_DIRECTION.md` §4.6 says "**It is** what you paid". A followed the map, E followed
  §4.6. Reconcile the documents first.
- **§4.9 section spacing** computes to a 28pt gap; only the E band matches. B and D render 16,
  H and G render 20, C and F render 22. Pick one and put it in the component.

### Also outstanding

- **`×n` carries four different meanings** in one visual slot: quantity (D1), units on a
  receipt line (E5), number of purchases (E6), trip count (E4).
- **Apostrophes split 18 straight / 13 curly / 3 mixed on the same screen** (D4, D5, B2).
- **"Greek yoghurt" vs "Greek yogurt"** — same product, two spellings.
- **F4 renders D1's states differently**: strikes the name but not the price (§4.3 says both),
  and draws the collapsed aisle as a 12px overline on bare paper rather than D1's white card.
- **E3's chart bars are 6× too bright** — all 12 at 100% where E1/E2/E6 correctly use 16% idle.
- **E2 draws 11 bars for "12 observations"** and doesn't hatch the estimated one, though E4
  does exactly that hatch correctly two screens away.

### What the review said not to touch

- **`E4`'s measured-vs-estimated bar is exactly §1.7** — one control, hue-free, 45° hatch,
  labelled at each end. "The hardest instruction in the document, executed literally." Ship it
  as the reference implementation and make E2's chart match it.
- **Bar geometry is unanimously correct** — all 47 bars are `TL8 / TR8 / BR0 / BL0`. Not one
  builder rounded a baseline.
- **`D6` is arithmetically perfect and agrees with D1**: −1.39 −1.35 −1.40 −2.06 = exactly the
  −$6.20 D1's callout claims, against "four of your nine things". The one cross-screen data
  chain that holds.
- **`E4`'s treemap reconciles to the cent** and E6's "SHARE OF MONTH 32%" = 92.40 / 284.60.
- **The `promise` ToggleRow variant is used correctly and only correctly** — never borrowed by
  an ordinary setting.

---

## Component debt — all one root cause

**Figma will not let you `appendChild` into an instance** (`Cannot move node. New parent is
an instance`). A slot missing from a component cannot be added at instance time. Three
builders independently hand-assembled rows because of this, which means those rows are not
instances and will not inherit component changes.

| Component | Missing | Who worked around it |
|---|---|---|
| `ToggleRow` | `state` and `promise` variants; leading-glyph slot | H (26 wrappers), F+G |
| `ListRow` | quantity-chip slot, checked-state variant, glyph in the mark | D (most of D1 hand-built) |
| `ShelfRow` | glyph slot inside `ItemMark` | B (19 absolutely-positioned overlays) |
| `HeroNumberCard` | bar heights are locked to the master — `resize()` on instance descendants silently no-ops | E hid the chart on E4/E5/E7 |
| `TabBar` | no active-tab variant property | E overrode slot fills by hand |

**Fix order:** add the variants and slots first, then re-instance the hand-built rows. Doing
it the other way round wastes the re-instancing.

⚠️ If a glyph slot is added to `ShelfRow`, **delete B's 19 overlay glyphs** or they will
double up.

---

## Plugin API traps — read this before the next Figma session

**1. `setBoundVariableForPaint` discards `opacity`.**
```js
// WRONG — opacity silently becomes 1
paint = figma.variables.setBoundVariableForPaint({type:'SOLID', color:c, opacity:0.16}, 'color', v)
```
It also proved unreliable to fix by spreading afterwards — `Object.assign` on a Figma paint
does not work, and even an explicit spread failed on some nodes while succeeding on others.
**What worked consistently:** build the paint literal *with* opacity, bind, then read
`node.fills[0].opacity` back in the same script to confirm. Where that still failed (frames),
use node-level `opacity` on a child tint rect, or assign `fills` twice.

This is not cosmetic. It made I4's progress track render identical to its fill, so a receipt
that was 8-of-12 matched looked 100% complete.

**2. `setBoundVariableForPaint` keeps the fallback `color` you hand it, and the canvas renders
*that*** for instance fill overrides — so seeding with `{r:0,g:0,b:0}` renders **black** even
though the binding is correct and `resolveForConsumer` reports the right value. Seed the paint
with the variable's own resolved RGB. Fresh nodes are unaffected; instance overrides are not.

**3. `visible = false` on an instance child removes it from `.children`** — do index-addressed
text overrides *before* hiding, or you get `cannot set property 'characters' of undefined`.

**4. `figma.createRectangle()` parents to the page immediately**, so a throw mid-helper leaves
orphans at (0,0). Two survived this build and were swept.

**5. A period is not legal in a variable name** — `space/0.5` throws; it shipped as `space/half`.

---

## Deviations from the spec, accepted

- **Ambient is separate variables, not a second mode.** A mode would have left 37 of 44
  variables empty in it.
- **§4.9 section spacing** (`space.5` below / `space.6` above) detached headers from their own
  groups. B used 8/24, H used 12. Worth amending the spec to match rather than "fixing" the
  screens.
- **C2's status line** reads "14 lines found · 12 matched to your catalog" rather than the map's
  "8 lines found · all matched" — "all matched" contradicts C3 existing at all. **The map should
  follow the screen here.**
- **C3's unsure matches carry `~` on the item name** (`~Sourdough loaf`), extending §1.7's
  estimated-value prefix from prices to the match itself. This is a good generalisation and
  should be adopted into `VISUAL_DIRECTION.md` §1.7.
- **H2 has no tab bar** and uses a `✕`. Correct — a paywall is modal, not a tab destination.

---

## Still open, and not solvable in Figma

1. **Account model** — guests need none, owners need one for the shelf to survive a lost phone.
   A6 is the most-invented screen in the set because of this.
2. **Depletion model** — how "1 gal every 9 days" is actually computed. C3 draws an interface to
   data whose derivation is not settled.
3. **Receipt-photo privacy** — the docs promise on-device handling for location and voice but
   **not** for receipt photos. A builder correctly refused to write a stronger claim on I5.
   Close this before the camera primer ships.
4. **`bagged.app`** — hardcoded into F1 and now drawn. Secure it.
5. **The "Bagged" word mark** — common English word, crowded class 9/42.
