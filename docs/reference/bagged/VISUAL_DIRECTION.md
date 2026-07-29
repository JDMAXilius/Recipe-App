# 🛍️ Bagged — Visual Direction v1

> The locked visual system. Every screen in `SCREEN_MAP.md` is built from these tokens and
> components. Values are either **sampled** from the 13 curated frames on canvas `61:950`
> (`Lpx5Pdgvy3Gx8l5ZSDS0JH`) or **contrast-verified** against the ground they sit on.
> No value here is a guess.

**Positioning:** Knows what you have. Remembers what you paid.

---

## 0. The decision

**One skin.** Warm paper ground, warm-ink black as the primary colour, three semantic hues,
one categorical ramp. The "four skins" hypothesis is dead.

What the frames actually showed when sampled:

- **F and G are the same direction.** G's ground is `#F5F1E8`; F's is `#F7F4EE`. Two points
  apart. F *is* G with a black hero card on it. So F doesn't "contribute number treatment" —
  F is already the base skin.
- **H must not own a background.** H's ground is `#F2F5F8`, a cool grey-blue. Prices is a
  *tab*, not a modal, so the user flips warm → cool inside one tap and reads it as a bug.
  H's real value was never its ground — it was *dark hero card carries the chart, every
  observation carries a source tag*, and F/05 already runs that pattern on warm paper.
  So H's navy demotes from a skin to one token: `surface.ink`. That single value also
  absorbs G5's `#171310` capture sheet and F's `#191713` hero. **Three near-black surfaces
  from three "directions" collapse to one.**
- **I is killed.** Indigo on lilac for one modal is decoration. F1's job is trust and share;
  ink does both. Kept from I6: the avatar stack and the checkmarked assurance list.
- **J is half-killed.** Full-black *in-app* screens have no justification — Places is an
  ordinary settings-shaped screen. But widgets and the lock screen are rendered by iOS on
  black whether we like it or not, so J survives as `ambient.*` tokens — deliberately not
  named `dark.*` so nobody mistakes them for a theme.

**One deliberate change the frames don't say.** F/05 encodes `FROM RECEIPTS 34%` in sage
green and `ESTIMATED 66%` in white. That is the best idea in the file rendered in the wrong
channel — green means *good*, and 34% measured isn't good, it's just true. Measured-vs-estimated
becomes an **ink-weight + border channel with zero hue** (§2.7). Honest, colourblind-safe, and
it stops the app congratulating itself for a low number.

### 0.1 Two open conflicts, and how they're resolved

| Axis | Brand call | Visual system | Resolution |
|---|---|---|---|
| **Brand accent** | teal `#0C6E60` | teal killed; **warm ink primary + olive `#4E5D33` mark** | **Ink + olive ships.** Teal's justification was H1's capture button and E1's highlighted bar — both belong to direction H, whose skin is killed, so teal loses its home. Every primary already drawn in Bagged is black (G1's FAB, G2's button, F/05's active tab). ⚠️ This is the one call worth revisiting — see below. |
| **Shadows** | "zero shadow anywhere" | `elev.0` default, `elev.1–3` for floating things | **Visual system ships.** The intent was identical (nothing resting on paper gets a shadow); the disagreement was scope. Shadows survive only for things that genuinely float: FAB, tab pill, toasts, sheets. |
| Ground | desaturate to `~#F4F2EC` | `#F5F1E8` (sampled) | Sampled value ships — it is already measurably greyer/greener than Otto's `#FAF4EA`. |
| Card radius | 12 | 16 (`radius.lg`), buttons pill | Visual system ships; pill buttons carry the silhouette difference from Otto instead. |

> ⚠️ **The accent is a one-line change.** Every colour below is bound to a Figma variable and
> a code token, so swapping ink-primary for teal later is a token remap, not a redesign.
> It is recorded here as decided-but-reversible rather than left open, so the build isn't blocked.

### 0.2 Divergence from Otto — explicit

Bagged shares Otto's token **architecture** (same names, same 4-pt scale shape, same named-spring
vocabulary) and shares **zero values** except space and radius steps. A future merge is a re-map,
not a rewrite.

| Axis | Otto | Bagged | Why |
|---|---|---|---|
| Ground | cream `#FAF4EA` | paper `#F5F1E8` | same family, measurably greyer — paper, not butter |
| Primary | terracotta `#C4562E` | **warm ink `#231F1A`** | the fastest read-difference. Terracotta is **banned** in Bagged. |
| Display face | Lora (serif) | **none** — SF Pro, tight tracking | serif = cookbook. Bagged is a ledger. |
| Numeric face | system + tabular-nums | **IBM Plex Mono, bundled** | numbers are Bagged's content, not its metadata |
| Button radius | 14 | **999 (pill)** | silhouette difference at a glance |
| Signature moment | paw-pop on save | **the tick** on a list row | |
| Illustration | hand-painted mascot | **none, ever** | a character next to "+8.1% since May" converts a measurement into an opinion |
| Dark mode | none | none in-app; a permanent dark **ambient** layer | §2.10 |

---

## 1. Color tokens

One flat namespace. Every text pair states its measured contrast ratio.

### 1.1 Ground & surfaces

| Token | Hex | Usage |
|---|---|---|
| `bg.paper` | `#F5F1E8` | the one app background. **There is no second page background.** |
| `bg.sunk` | `#EDEAE1` | chart plot areas, meter tracks, inset wells, disabled fills |
| `surface.card` | `#FFFFFF` | cards, row groups, sheets on light |
| `surface.ink` | `#231F1A` | hero number cards, capture sheet, primary button, camera FAB, active tab slot |
| `surface.inkRaised` | `#332C25` | rows and wells inside `surface.ink` |
| `border.hairline` | `#E3DCCE` | card borders, row dividers, section rules |
| `border.strong` | `#D2C8B6` | outline buttons, estimated-tag border, unselected shop outline |
| `overlay.scrim` | `rgba(35,31,26,0.45)` | behind sheets — warm ink, never pure black |

### 1.2 Ink (text)

| Token | Hex | On paper | Usage |
|---|---|---|---|
| `ink.primary` | `#231F1A` | **14.53:1** | all primary text, all money |
| `ink.secondary` | `#5A5249` | **6.80:1** | sub-lines, fact-row labels, estimated values |
| `ink.muted` | `#726A5F` | **4.73:1** | meta, counts, timestamps. **Never on `bg.sunk`** (4.43 — fails) |
| `ink.tint` | `#8C8479` | 3.27:1 | **non-text only** — gridlines, glyph strokes, decorative rules |
| `ink.onInk` | `#F5F1E8` | 14.53:1 on ink | text on ink surfaces |
| `ink.onInkSecondary` | `#A9A29A` | 6.49:1 on ink | sub-lines on ink surfaces |

### 1.3 Brand

| Token | Hex | Role |
|---|---|---|
| `brand.primary` | = `surface.ink` `#231F1A` | **Bagged's primary colour is warm ink.** Primary buttons, FAB, active tab, wordmark. |
| `brand.mark` | `#4E5D33` | olive: active tab glyph, selection, inline links, the `⊕`. 7.15:1 white / 6.34:1 paper |
| `brand.markTint` | `#E4E8DA` | selected chip fill, olive well on paper |
| `brand.markOnInk` | `#9CB86B` | olive lifted for ink — 7.39:1. **Never** `brand.mark` on ink (2.29:1) |

### 1.4 Semantic — one green, one clay, one amber, each with exactly one meaning

Green = *in your favour*. Clay = *against you / act now*. Amber = *attention, not yet a problem*.

| Token | Hex | Contrast | Meaning |
|---|---|---|---|
| `green.500` | `#4E5D33` | 7.15 / white | price down, under budget, got-it fill, savings figure |
| `green.400` | `#5C6B3C` | non-text | fresh meter, under-budget bars, checked box |
| `green.100` | `#E4E8DA` | — | positive tint card (E4 insight) |
| `green.onInk` | `#9CB86B` | 7.39 / ink | green on ink |
| `clay.500` | `#A9563A` | 5.15 / white · 4.57 / paper | price up, over budget, urgent freshness, destructive |
| `clay.100` | `#F4E7DF` | — | negative tint card (D1's "cheaper at Costco") |
| `clay.onInk` | `#E88A6A` | 6.45 / ink | negative on ink |
| `amber.500` | `#D9A441` | non-text | "soon" meter, Eat-first icon disc, Plus card accent |
| `amber.100` | `#FBF0DC` | — | Eat-first card ground |
| `amber.text` | `#8A5A0B` | 5.92 / white | **amber as text or icon** — `amber.500` is never text |

### 1.5 Freshness meter — semantic + thresholds

| Token | Value | Trigger |
|---|---|---|
| `fresh.good` | `green.400` | ≥40% of estimated life, or plentiful with no expiry |
| `fresh.soon` | `amber.500` | 15–39% remaining, **or** expiry in 3–7 days |
| `fresh.urgent` | `clay.500` | <15% remaining, **or** expiry ≤2 days, **or** out of stock |
| `fresh.track` | `bg.sunk` | the unfilled remainder of every meter |
| `fresh.unknown` | `ink.tint` @40% | **2px dashed hairline, not a filled bar** |

The three states are *also* carried by the sub-label word (`plenty` / `~6 days` / `eat in 2d`)
and by that label's ink colour, so colour is never the sole channel.

### 1.6 Price direction

| Token | Rule |
|---|---|
| `price.up` | `clay.500` + `▲` + explicit `+` — never colour alone |
| `price.down` | `green.500` + `▼` + explicit `−` |
| `price.flat` | `ink.muted` + `—` |
| **money itself** | **always `ink.primary`. Money is never coloured.** `$4.99` is ink; `+25%` is clay. |

### 1.7 Measured vs estimated — the honesty channel, no hue

| Token | Value text | Tag pill |
|---|---|---|
| `data.measured` | `ink.primary`, 600, no prefix | solid `ink.primary` fill, `ink.onInk` label |
| `data.estimated` | `ink.secondary`, 500, prefix `~` (aggregate `≈`) | 1px solid `border.strong`, transparent |
| `data.seed` | `ink.muted`, 400, prefix `~` | 1px **dashed** `border.strong` |

Hue implies valence; provenance has none. Works in greyscale, in a screenshot, and for a
deuteranope. **E4's split becomes one control, not two tiles** — a single horizontal bar,
measured portion solid `ink.primary`, estimated portion `ink.primary` @12% with a 45° hatch.

### 1.8 Categorical — stores, categories, treemap, chart series

Six pastels sampled from F/05. **Always carry `ink.primary` text; never carry a delta; never
sit next to a semantic fill in the same control.**

| Token | Hex | ink contrast | Fixed binding |
|---|---|---|---|
| `cat.sage` | `#B9CDA8` | 9.64 | produce |
| `cat.butter` | `#F1DCA4` | 12.10 | dairy & eggs |
| `cat.tan` | `#DDC5AA` | 9.86 | pantry, bakery |
| `cat.blush` | `#EFC2B4` | 10.17 | meat & fish |
| `cat.sky` | `#B7CCDD` | 9.90 | frozen, drinks |
| `cat.lilac` | `#CFC3E4` | 9.81 | household, other |

**Store accents** are `cat[hash(store_id) % 6]`, pinned on first save so a store never changes
colour. Used for its avatar, its bars, its rows. **No retailer logos or trade dress, ever** —
it implies partnership and puts two near-identical blues adjacent.

### 1.9 Ambient — the always-dark layer

Not a theme. iOS renders these surfaces on black regardless.

| Token | Hex | On `ambient.bg` |
|---|---|---|
| `ambient.bg` | `#000000` | — |
| `ambient.surface` | `#121212` | — |
| `ambient.raised` | `#1F1F1F` | — |
| `ambient.ink` | `#FFFFFF` | 21.0 |
| `ambient.inkSoft` | `#8E8E8E` | 6.41 |
| `ambient.accent` | `#FFB020` | 11.48 |
| `ambient.positive` | `#33D17A` | non-text |

Applies to G1's widget mock, G4, G8 Live Activity, the arrival card, Watch, CarPlay. **Nothing
else.** Places and Setup are ordinary light screens — they were only black because J drew them so.

### 1.10 The light/dark rule

**Bagged ships light-only in v1.** No theme switcher, no appearance picker,
`"userInterfaceStyle": "light"`. Three reasons in order: the paper ground *is* the brand;
the peak-value moment is read in a supermarket under fluorescent light; and the one context
where dark genuinely matters is already permanently dark via `ambient.*`.

**Not a one-way door.** `surface.ink`, `ink.onInk`, `green.onInk`, `clay.onInk`,
`brand.markOnInk` already exist and are already contrast-verified. A dark build is a re-map
of eight tokens.

---

## 2. Typography

### 2.1 Two families, both shippable

| Family | Licence | Delivery | Scope |
|---|---|---|---|
| **SF Pro** | Apple system | free, zero bundle, Dynamic Type native | all UI text |
| **IBM Plex Mono** 400/500/600 | SIL OFL 1.1 | `@expo-google-fonts/ibm-plex-mono`, ≈90 KB | every number, every receipt block, the invite link |

No third family. **No serif** — that's Otto's voice. The typographic identity isn't a display
face; it's *the mono on every number*.

### 2.2 Scale

| Role | Face | px | Wt | LH | Tracking | Used for |
|---|---|---|---|---|---|---|
| `type.display` | SF Pro | 34 | 700 | 38 | −0.02em | screen titles |
| `type.title` | SF Pro | 22 | 700 | 27 | −0.01em | hero item name, sheet titles |
| `type.headline` | SF Pro | 17 | 600 | 22 | 0 | row primary, item names, buttons |
| `type.body` | SF Pro | 15 | 400 | 22 | 0 | sub-lines, honesty footnotes |
| `type.bodyStrong` | SF Pro | 15 | 600 | 22 | 0 | non-numeric fact values |
| `type.caption` | SF Pro | 13 | 400 | 18 | 0 | item sub-labels, meta, axis words |
| `type.overline` | SF Pro | 12 | 600 | 16 | **+0.08em** UPPER | section headers |
| `type.micro` | SF Pro | 11 | 600 | 14 | +0.01em | tab labels, tags, chips. **Hard floor.** |
| `num.hero` | Plex Mono | 40 | 600 | 44 | −0.01em | `$284.60`, `$42.93` |
| `num.title` | Plex Mono | 28 | 600 | 32 | −0.01em | stat-tile values |
| `num.body` | Plex Mono | 17 | 500 | 22 | 0 | row prices, numeric fact values |
| `num.caption` | Plex Mono | 13 | 400 | 18 | 0 | deltas, chart labels, `×2` chips |
| `type.receipt` | Plex Mono | 12 | 400 | 18 | 0 | receipt facsimiles |

### 2.3 The tabular-numeral rule

1. **Mono-or-tabular test.** If a string is *mostly* a number (`$4.49`, `+25%`, `×2`, `26 Jul`,
   `26 of 38`) the whole string is Plex Mono. If it's a sentence *containing* a number
   ("62 things in · 4 running low") it's SF Pro. There is no third case.
2. **SF Pro always runs `fontVariant: ['tabular-nums']`**, set once on the shared `Text`
   primitive, so embedded numbers don't jitter on update.
3. **`$` is the same size, weight and colour as its digits.** Never superscripted or tinted.
4. **Cents never dropped, never raised.** `≈ $30` is legal only because `≈` carries the
   imprecision; an exact computed figure is `$30.00`.
5. **Any column of ≥2 prices right-aligns on the decimal.** The mono makes this free.
6. **Money is never coloured.** Its delta may be.
7. **Estimated money carries `~` or `≈`** at `ink.secondary`. There is no bare estimated price.
8. **Dynamic Type:** everything scales. Mono caps at 1.6× then the price column stacks under
   the name; `num.hero` caps at 1.4× and reflows to two lines. Scaling is never disabled.

---

## 3. Space, radius, elevation

### 3.1 Space — 4-pt base

`space.0.5` 2 · `space.1` 4 · `space.2` 8 · `space.3` 12 · **`space.4` 16 (screen gutter, every
screen)** · `space.5` 20 (header → first row) · `space.6` 24 (between sections) · `space.8` 32 ·
`space.10` 40 (hero padding-y) · `space.14` 56 (tab pill height; bottom reserve = 56+16+safe area)

### 3.2 Radius

`radius.sm` 8 · `radius.md` 12 · **`radius.lg` 16 — the card radius** · `radius.xl` 20 (hero
cards, stat tiles, treemap) · `radius.sheet` 28 (top corners only) · `radius.pill` 999

**All buttons are pills.** Otto's are 14. This is the second-fastest read-difference after the
black primary.

### 3.3 Elevation — warm ink, three steps, one rule

| Token | Value | Applies to |
|---|---|---|
| `elev.0` | none | **default.** Anything resting on paper. Cards separate by radius + hairline. |
| `elev.1` | `0 1px 3px rgba(35,31,26,0.06)` | white card overlapping another surface |
| `elev.2` | `0 4px 16px rgba(35,31,26,0.10)` | camera FAB, tab pill, toasts |
| `elev.3` | `0 -8px 32px rgba(35,31,26,0.18)` | sheets, upward, over the scrim |

**A shadow means "this floats above the page." Nothing else earns one.** Never a hard or black
drop shadow; shadow colour is always warm ink.

---

## 4. Components

### 4.1 ShelfRow (B1) — **decided: sectioned list, not a card grid**

The 3-column grid is dead. It cost ~35% less scroll and made the best screenshot, but it
truncated names at ~12 characters (`Extra virgin olive oil` → `Extra virg…` in a 114pt card),
and three of B1's four sort options — expiry, running low, used-up — have no structure in a
grid. A ledger of 62 items is a list.

**Anatomy (left → right):** freshness rail · ItemMark 32 · name · spacer · sub-label.
**Sizes:** height **56**, padding-x 16. Grouped by location in a `surface.card`, `radius.lg`,
1px hairline dividers inset 56 from the left, `elev.0`.

- **Freshness rail** — 3pt wide, full row height minus 8pt, `radius.pill`, at x=0 of the row.
  Colour per §1.5. This replaces the horizontal meter: it reads as a continuous colour column
  down the left edge, so "what's turning" is scannable without reading a single word.
- **ItemMark** 32×32 `radius.sm`, category tint + filled glyph (§5.2), 12pt after the rail.
- **Name** `type.headline`, `ink.primary`, **full width, never truncated.** This is the whole
  reason the grid lost.
- **Sub-label** `type.caption`, right-aligned, coloured to match the rail state
  (`ink.muted` / `amber.text` / `clay.500`): "plenty", "~5 days", "4 left", "eat in 2d".

**Section headers** are sticky (`SectionHeader`, §4.9) so the location stays visible while
scrolling 62 items. When sorted by expiry or running-low, headers become the sort's own
groups (`THIS WEEK`, `RUNNING LOW`) — a list can express all four sorts; a grid could express one.

**States:** default · pressed (`bg.sunk`) · urgent (sub-label `clay.500`/600, rail `fresh.urgent`)
· low stock (quantity chip before the sub-label) · used up (45% opacity, collapses into a
`USED UP · 6` group at the bottom) · loading (skeleton bars) · no data (rail renders
`fresh.unknown` dashed, sub-label "no estimate" in `ink.muted`).

**A11y:** the rail is decorative and `accessibilityElementsHidden`; the row's label is
"Whole milk, about 5 days left, fridge". Colour is never the sole channel — the sub-label
word carries the same state.

### 4.2 FreshnessMeter
Track + fill, one piece. `radius.pill`, **min visible fill 4pt** — never render zero width.
Sizes `sm` 4 (rows, widgets) · **`md` 6 (default)** · `lg` 8 (B2 hero).
Unknown → 2px dashed `ink.tint`@40%, no fill. Animates on mount only (`timing.meter`), never on
scroll. **A11y:** `progressbar`, value text is the human sub-label ("about 5 days left"), never a
raw percentage.

### 4.3 ListRow + Checkbox (D1)
Checkbox · mark 32 · name · qty chip · leader dots · price. Height **56**; checkbox is 22pt with
44×44 hit slop. In a `surface.card` group, `radius.lg`, dividers inset 56 from the left.
Checkbox unchecked = 1.5px `border.strong`; checked = `green.400` + 12pt white tick. Leader dots
1px dotted hairline — **this is what makes the price read as a column.** Price `num.body`,
right-aligned on the decimal.
**States:** default · estimated (`~4.00` in `ink.secondary`) · no price (`—` in `ink.muted`) ·
**got it (in place, no reorder** — strikethrough, both → `ink.muted`, mark 45%, box fills) ·
pressed · swiped · added by someone else (4pt store-accent bar at the left edge + member initial).

### 4.4 FactRow (B2)
Label left / value right. Height 44, padding-x 16, grouped in a card with inset dividers. Label
`type.body` `ink.secondary`; value `num.body` if numeric else `type.bodyStrong`, right-aligned.
**States:** default · estimated · **locked** (value → "Bagged Plus" in `amber.text`, row → H2) ·
pressed · linked (chevron, value shifts left 8).

### 4.5 StatTile (E3, E4)
Overline · value · optional delta. Two per row, gap 12 → **173 × 96**, `radius.xl`, padding 16.
Variants `plain` (`bg.sunk`) · `positive` (`green.100`) · `attention` (`amber.100`) · `ink`.
**Empty renders `—`; never hide a tile because it has no data.**

### 4.6 HeroNumberCard (E1, E4) — the most important control in the app
Overline · big number · delta pill · bar chart · footnote. Full-bleed to the gutter,
`radius.xl`, padding 20/24, `surface.ink`, `elev.0` (it *is* the page).
Number `num.hero` `ink.onInk`. Delta pill height 24, fill `clay.onInk`/`green.onInk` @18%.
Chart 64pt. Footnote `type.body` 13px, max 2 lines.
**The footnote is not decoration.** E1's "Nothing here is a national average. It is what you
paid." is the product thesis; the component reserves permanent space for it and it ships verbatim.

### 4.7 BarChart
Height 64 (in hero) or 96 (E2). Gap = 25% of bar width, min bar 6, **`radius.sm` on the top two
corners only** — bars grow from a baseline, and rounding the bottom lies about the zero line.
On ink: idle `#FFF`@16%, highlight `ink.onInk`. On card: idle `bg.sunk`, highlight `ink.primary`.
Semantic bars only where the bar *means* something. **Never more than one encoding per chart** —
highlight-latest *or* semantic *or* categorical, never two.
Estimated bar = 50% fill + 45° hatch. **A11y:** one summary label for the chart, each bar
individually focusable with "26 Jul, Trader Joe's, $4.49, from receipt".

### 4.8 TreemapTile (E4)
Glyph · name · amount. Gap 8, `radius.xl`, padding 12. **Min tile 72×64, max 6 tiles** — the 7th+
merge into `Other`. Fill = `cat.*`. Tile *area* proportional to spend, stated in the section
header ("tile = spend"). No 3D, no gradients, no borders.

### 4.9 SectionHeader
Overline · spacer · right meta. Height 32, `space.5` below, `space.6` above.
**The right-meta slot is where Bagged discloses its own axes** — "newest first", "tile = spend",
"vs your own average". Every section header showing derived data must fill it.

### 4.10 NavBar + CaptureButton — **decided: V2, split pill with detached capture**

Replaces the five-slot centre-capture bar. Full spec and flows in `NAV_WORKFLOW.md`.

**NavBar** — 280×56 pill, `surface/card`, `radius/pill`, `elev/2`, at x=16, y=746. Four
**64×48** slots, icon-only, `active = shelf | list | prices | me`.

**CaptureButton** — a detached 56×56 `surface/ink` disc at x=318, y=746. Capture is *not* a
destination: it opens C1 as a sheet from anywhere, never changes the active slot, never enters
the back stack.

**The active state carries three channels and may not drop two of them:**
1. **Shape** — `brand/markTint` chip behind the slot
2. **Weight** — the icon swaps `outline` → `filled`
3. Colour — `brand/mark` vs `ink/muted`

The old bar signalled active by hue alone, which the accessibility audit flagged as unusable for
deuteranopes. Chip and fill both survive greyscale; colour is the third channel, not the only one.

**Labels are gone.** They sat exactly on the 11px type floor and clipped *vertically* at 1.6×
Dynamic Type because the pill height could not grow. The label moves to the screen title in
`type/display` — "Your shelf", "Weekly shop", "Prices", "Setup" — and to `accessibilityLabel` on
each slot.

**Badging:** the List slot only, a 6pt `clay/500` dot when auto-add has queued something unseen.
Prices must never badge — manufacturing urgency about someone's own spending is the opposite of
what this app claims about itself.

**Bottom reserve:** content ends at y ≤ 738 on every tab-level screen.

### 4.11 CaptureSheet (C1)
Handle · Close/title/Help · receipt hero · option rows · primary. ~78% height, `surface.ink`,
`radius.sheet` top only, `elev.3` over the scrim.
Hero = dashed 1.5px `#FFF`@18%, containing the receipt facsimile in `type.receipt`. **The
facsimile is the illustration; there is no drawn artwork.**
Option rows `surface.inkRaised`, `radius.lg`, height 68. Primary is **inverted**: `surface.card`
fill, `ink.primary` label.
Permission-not-granted → primary reads "Allow camera" and runs the I5 primer, never the raw
system dialog.

### 4.12 ToggleRow (B2, G1, G2)
Height 56 with sub-line / 48 without. Switch on-tint `green.400`.
Variants: `switch` · `state` (right-aligned value + chevron — "On", "Medium size", "4 phrases") ·
**`promise`** (right value in `amber.text` — reserved for privacy claims like `On device`, which
is a promise and must not read as an ordinary setting).

### 4.13 Button

| | On light | On ink |
|---|---|---|
| primary | fill `surface.ink`, label `ink.onInk` | fill `surface.card`, label `ink.primary` |
| secondary | 1.5px `border.strong`, transparent | 1.5px `#FFF`@25%, transparent |
| destructive | 1.5px `clay.500`, label `clay.500` | — |

`lg` 56 (screen primary, full width) · `md` 44 · `sm` 32. All `radius.pill`.
**Exactly one `lg` primary per screen.**

### 4.14 StoreAvatar
Tinted circle + 1–2 letter monogram. `sm` 24 · **`md` 32** · `lg` 40 · `xl` 56. Fill = the store's
pinned `cat.*`. **No retailer logos, ever.**
**States:** default · active shop (2px `brand.mark` ring) · **at-this-shop (2px `amber.500` ring +
8pt dot at 4 o'clock — the geofence-arrival state)** · disabled · unknown (`cat.lilac`, `?`).

### 4.15 SourceTag — provenance
Height 20, padding-x 8, `radius.pill`, `type.micro`.

| Variant | Label | Fill | Border |
|---|---|---|---|
| `receipt` | `receipt` | `ink.primary` | — |
| `typed` | `typed` | transparent | 1px `border.strong` |
| `seed` | `seed` | transparent | 1px **dashed** |
| `barcode` | `barcode` | `ink.primary` | — |

**E2's `EVERY OBSERVATION` renders a SourceTag on every row, no exceptions, no truncation.**
Unknown provenance gets a `seed` tag — it never gets no tag.

---

## 5. Iconography

### 5.1 The 62-item question — line icons lose, and photos are also wrong

**Why G's thin line icons break.** G1 gets away with them by showing nine items from nine
*different* categories. A real 62-item shelf has six dairy items — whole milk, oat milk,
half-and-half, yogurt, sour cream and cream cheese all resolve to the same 1.5pt carton
outline at small sizes. The icon stops identifying and becomes noise.

**Why photographic thumbnails are also wrong.** Mucho/SideChef/CREME use photos because they're
*discovery* products where the photo is appetite appeal — it's content. Bagged's shelf is a
ledger of *your* stock, and a stock photo of the wrong carton of milk is a small lie in an app
whose pitch is "your prices, not market prices." It's also real licensing cost, and it flattens
the paper ground into a shopping app.

**The resolution — D1 already drew it.** F/01's rows carry a **tinted rounded square with a
filled glyph**. That control solves what G1's bare line icon doesn't, and it's already in the file.

### 5.2 ItemMark — three layers, in scanning order

1. **Category tint field** (`cat.*`) — this does the 62-item work. You scan colour blocks, not
   glyphs: the dairy shelf is a band of butter, produce a band of sage. Six-way discrimination
   at any size, at any distance.
2. **Filled glyph** 18–20pt, `ink.primary` @70%, **solid not line.** Coarse type only —
   bottle vs box vs leaf vs loaf. ~40 glyphs total, one per category-shape, not one per item.
3. **The item's name** — always visible, never truncated below 12 characters. This is the actual
   identifier and it always wins.

**Optional user photo** from C4/C5 may replace the glyph, cropped to the same tinted square.
Never required, never auto-fetched, **never stock**.

### 5.3 Everything else
**SF Symbols only.** Outline at rest, filled only as the active state of the same glyph.
Tab 24 · inline 18 · meta 14. Weight `.regular` ≤18pt, `.medium` at 24pt — never `.thin` or
`.ultraLight`, they disappear on paper. Never a second icon library, never multicolour.

---

## 6. Motion & haptics

### 6.1 Named springs

| Name | Config | Used for |
|---|---|---|
| `spring.gentle` | damping 18, stiffness 120, mass 1 | entrances, layout shifts, expand/collapse |
| `spring.snappy` | damping 15, stiffness 220, mass 0.8 | chips, toggles, tab indicator, press scales |
| `spring.tick` | damping 14, stiffness 340, mass 0.6; box `1 → 0.88 → 1.06 → 1`, tick draws over the overshoot | **THE SIGNATURE — checking a list row.** The app's one earned moment. |
| `spring.sheet` | damping 22, stiffness 260, mass 1 | capture sheet, modals, shop switcher |
| `timing.meter` | 420ms ease-out | meter fill, **once per mount** |
| `timing.count` | 600ms ease-out | hero-number roll-up — legible only because the mono fixes digit widths |
| `timing.fade` | 180ms | crossfades, skeletons, the reduced-motion substitute for everything above |

**The receipt-commit stagger (C7)** is the second and last signature: rows land at 40ms intervals,
first 8 staggered, remainder together. It's the payoff of the core promise and gets a full second.

**Rules.** Everything interruptible. **Nothing animates on scroll** — not the meter, not the
charts, not the treemap. One signature per screen maximum. Reduce Motion swaps every spring for
`timing.fade` and **keeps every haptic**.

### 6.2 Haptics

| Event | Call |
|---|---|
| Tick a list row | `selectionAsync()` — done 30× a shop, must be the cheapest feedback there is |
| Untick | — (undo is not an event) |
| Receipt commit lands | `notificationAsync(Success)` |
| Geofence arrival, foregrounded | `notificationAsync(Success)`, once per arrival |
| Capture shutter | `impactAsync(Medium)` |
| Unmatched line resolved | `selectionAsync()` |
| Mark used up / delete / remove member | `notificationAsync(Warning)` |
| Scan failed | `notificationAsync(Error)` |
| **Never** | scroll, chart render, screen appear, keyboard, **tab switch** |

**Tab switch is deliberately silent** — a divergence from Otto. Bagged is used one-handed in an
aisle where the tick fires constantly; a tab haptic competes with it and dilutes the one signal
that means "I got that item."

---

## 7. What this system forbids

1. **A second page background.** No cool-grey Prices tab, no white List. A temperature flip inside a tap sequence reads as a bug.
2. **Full-black in-app screens.** Black is `ambient.*` only.
3. **Teal and indigo.** Both dead.
4. **Terracotta `#C4562E`, and any serif.** Both are Otto's.
5. **Colour as the only carrier of measured-vs-estimated.** Never a hue. Never green.
6. **Green or red on anything that isn't a delta or a freshness state.**
7. **Coloured money.**
8. **Superscript cents, dropped cents, a shrunk `$`,** or a price without provenance treatment.
9. **An approximate number without `~` / `≈`.**
10. **A filled freshness meter with no data.** The worst possible failure in a product about honesty.
11. **A thin line icon as an item's sole identifier.**
12. **Photographic or illustrated food imagery in chrome. No mascot, ever.**
13. **Retailer logos or trade dress.**
14. **More than 6 treemap tiles, tiles under 72×64, 3D, gradients, legend-only encoding.**
15. **Two encodings in one chart.**
16. **Bar corners rounded at the baseline.**
17. **Shadows on paper for things that don't float.**
18. **Text below 11px, uppercase micro-labels, or disabled font scaling.**
19. **A spinner as the only feedback while a receipt processes.** I4 shows counts: lines found → matching → done. Six honest seconds beat an opaque two.
20. **Blur or glass over `bg.paper`.**
21. **More than one `lg` primary button per screen.**
22. **A `Cook` tab.**

---

## 8. Figma build order

Collections in this order:

1. `color` — §1.1–1.9, one mode `light`, plus a second mode `ambient` populated only for §1.9
2. `type` — §2.2, 14 text styles
3. `space` — §3.1, 10 steps
4. `radius` — §3.2, 6 steps
5. `elevation` — §3.3, 4 effect styles

Then components in §4 order, then screens by section.

**Pages:** `Bagged · Foundations` · `A+I Launch & States` · `B Shelf` · `C Capture` ·
`D List` · `E Prices` · `F+G Kitchen & Ambient` · `H Me`
