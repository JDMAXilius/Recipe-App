# 🛍️ Bagged — Full Screen Map & Content Breakdown

> Every screen in the app, with the content on it, top → bottom. Grounded in the Figma
> canvas **"My Ideas"** (`Lpx5Pdgvy3Gx8l5ZSDS0JH`, node `61:950`), where 13 frames were
> drawn across five explorations (F/G/H/I/J) and are kept here as **visual reference only**.

**Positioning:** **Knows what you have. Remembers what you paid.**

**Three promises:** your prices, not market prices · what is measured is marked as measured ·
location never leaves the phone.

**Legend:** ✅ drawn in Figma (node id) · ⬜ to design · 🔒 Bagged Plus · ⚠️ open question / risk

**Count:** 9 sections · **57 screens** — 13 drawn as visual reference, **0 shippable as-is**,
44 never drawn.

> **Why 0 shippable.** All 13 drawn frames carry one of four different tab bars
> (`Shelf·List·Cook·Me` / `LIST·AISLES·PRICES·HOUSE` / `Scan·Prices·List·Me` /
> `Now·Places·Setup`), and none of them is the canonical bar below. Every drawn frame needs its
> chrome replaced before it ships, so "13 drawn" measures reference art, not progress.

**Tab bar:** `Shelf · List · ⊕ · Prices · Me` — `⊕` opens the capture sheet (C1).

**Money model** (from `J6`): Bagged Plus **$29.99/year, 7 days free**. The glance is free
forever. Free = shelf glance, manual list, one shop. Plus = receipt scan, price history,
multiple shops, extra surfaces. Invitees are free forever and need no account.

---

## Copy rules

- **Plain verbs.** "Scan a receipt", not "Initiate receipt capture".
- **Sentence case**, except the small-caps section labels (`YOUR SHOPS`, `WHAT MOVED`).
- **Two short sentences maximum** per block. If it needs three, the screen is doing two jobs.
- **No em dashes in product copy.** Split into two sentences, or use a `·` separator. (This
  document's own editorial prose is exempt; every quoted string in it is not.)
- **Kitchen, never household.** Audited house rule
  (`~/Recipe-App/docs/reference/DESIGN_SYSTEM.md` §B6). The schema may say household; the user
  never sees that word.
- **The "X, not Y" honesty reversal: once per surface, maximum.** It is the default cadence
  across these screens right now, and at volume it reads machine-written. Pick the one place on
  each screen where the reversal earns its keep and write everything else flat.

## Conventions

Five cross-cutting rules. Where a screen below is silent on one, the rule still applies.

1. **Show the surface, then the steps.** Setup screens render the thing first (the widget, the
   Live Activity, the lock screen), **using the user's real data wherever data exists**.
   Instructions sit under it, never before it.
2. **Scope → control → proof.** Every permission, share and payment screen says what it wants,
   then what the user controls, then what changed. In that order, once.
3. **Right-aligned state on every row, as one shared component.** `On` · `$4.49` · `Invited` ·
   `×2` · `Medium size` — same slot, same type, same alignment, every list in the app.
4. **Problems float to the top, in place.** Unmatched receipt lines, items with no price, an
   over-budget trip. They rise to the top of their own list. They are never hidden behind a
   filter or a disclosure.
5. **Every ambient promise needs a manual twin, and every guess needs a one-tap "no, actually."**
   Geofence declined → the arrival row (A4/G2). Scan failed → enter by hand (I3 → C6). Price
   guessed → "tap to set what you paid" (D1). This is not politeness: each correction is a new
   measured observation, and measured observations are the product.

---

## Core features

| # | Feature | Sections |
|---|---------|----------|
| 1 | **The Shelf** — what you have, and how long it lasts | B |
| 2 | **Capture** — the shelf fills itself from a receipt | C |
| 3 | **The List** — what to buy, built without you | D |
| 4 | **Your Prices** — what it actually cost you | E |

## Supporting features

| # | Feature | Sections |
|---|---------|----------|
| 5 | Kitchen sharing — link-based, guest needs no account | F |
| 6 | Places — geofence per shop, list wakes on arrival | G |
| 7 | Lock-screen widgets, home widgets & Live Activity — tick without unlocking | G |
| 8 | Voice — on-device recognition, add by speaking, read aloud | D, H |
| 9 | Provenance — measured vs estimated, source per observation | E |
| 10 | Cheaper-elsewhere — same basket across your stores | D, E |
| 11 | Bagged Plus — subscription | H |
| 12 | Extra surfaces — Watch, Siri & Shortcuts, CarPlay | G |

---

## A · Launch & setup (6 screens)

### A1 · Splash ⬜
`paper`. Wordmark, no spinner chrome. Auto-advances to onboarding (first run) or Shelf
(returning).

### A2 · Value showcase ⬜
2–3 panels, no questions asked. The three claims worth making: *it fills itself from a
receipt* · *it knows what you actually pay* · *the glance is free forever*.

### A3 · Name your kitchen ⬜
- Single text field, pre-filled from device name → "The Lugos"
- Sets the label used in F1/F2 and on shared lists

### A4 · Add your first shop ⬜
Scope → control → proof, in that order, then a receipt.
- Search or drop a pin; store name + branch ("Trader Joe's · Cesar Chavez")
- **Scope** — "Your list wakes up where you shop."
- **Control** — "Location never leaves the phone. There is no server that knows where you shop."
- **Proof** — "You're in control." Turn any shop's geofence off in Places, or skip this now.
- **Ask for while-using only.** "Always" is never requested here. It is asked for at the moment
  the user turns on `Wake when you reach a shop` in G1, which is the only thing that needs it.
- A real **`Skip for now`**, at button weight, not a grey word in a corner
- Closes on a receipt screen naming what just started working: "Trader Joe's is saved. Your list
  will wake up there."
- **Manual twin** ⭑ — if location is declined, the shop still saves. Bagged asks instead of
  watching: G2's arrival card is replaced by a tappable row **`At Trader Joe's? · Yes / Not now`**.
  Bagged still gets the trip, the aisle order and the price observation, with zero location access.

### A5 · First fill ⬜
- Two paths: **Scan a receipt** (primary) or **Add a few things by hand**
- On success drops straight into B1 with a full shelf — the "aha" moment

### A6 · Sign in / restore ⬜ ⚠️
- ⚠️ **Account model undecided.** `I6` promises guests need no account; the kitchen owner still
  needs one for the shelf to survive a lost phone. Decide before A3 is built.

---

## B · Shelf (7 screens) — *core feature 1*

### B1 · Shelf ✅ `61:1039` (G1) — `paper`
The home screen. No chrome above the title.
- Title **"Your shelf"** + camera FAB (top right → C1)
- Sub-line, three counts: "62 things in · 4 running low · 2 to eat soon"
- **"Eat me first"** card — droplet icon, one line of detail ("Spinach and yoghurt turn in
  2 days"), chevron → B5
- **Sectioned list, not the drawn card grid.** Sticky headers by location: `FRIDGE` `PRODUCE`
  `CUPBOARD`, each with an item count right-aligned (Convention 3)
- Each row (`ShelfRow`, `VISUAL_DIRECTION.md` §4.1): freshness rail · ItemMark · name ·
  sub-label
  - The **rail** is a 3pt colour column down the left edge, so "what's turning" scans without
    reading a word
  - The **name is full width and never truncates** — this is why the grid lost. "Extra virgin
    olive oil" fits; in a 114pt card it did not
  - Sub-label is a **word, not a number** where possible: "plenty", "1 slice", "ripe now",
    "2 weeks", "~5 days", "eat in 2d". It carries the same state as the rail, so **colour is
    never the only channel**
- Sort (overflow menu) re-groups the sections: by location · by expiry · running low ·
  show used-up. A list expresses all four; the grid expressed one
- Tab bar

### B2 · Item detail ✅ `61:1187` (G2) — `paper` screen, `ink` hero card
- Back "‹ Shelf" · **Edit**
- Hero card (`ink`): line icon, item name **"Whole milk"**, state line
  "About 72% left · runs out in ~5 days"
- Fact rows, label left / value right:
  - Bought — `12 Jul · Trader Joe's`
  - You go through — `1 gal every 9 days`
  - Paid last time — `$4.49`
  - Best price seen — `$4.29 · 12 Jul` 🔒
- Toggle row: **"Add to the list on Thursday"** / "That's when you normally run out"
- Buttons: **Add to list now** (primary) · **Mark as used up** (outline)
- ⚠️ "You go through 1 gal every 9 days" needs either months of receipts or a depletion
  input the user never gives. This claim is the product's biggest modelling risk.

### B3 · Add item by hand ⬜
Name (autocomplete against catalog) · quantity · location · optional expiry. Voice input.

### B4 · Edit item ⬜
Same fields as B3 + delete. Reached from B2's "Edit".

### B5 · Eat me first ⬜
Flat list of everything turning, soonest first, with the same meter language as B1.
- One deep-link row at the bottom: **"Cook something with this"** → Otto. The only cooking
  affordance anywhere in Bagged (see *Brand architecture*).

### B6 · Locations editor ⬜
Reorder / rename / add locations (Fridge, Produce, Cupboard, Freezer…).

### B7 · Shelf empty ⬜
Single call to action → C1. No illustration of an empty fridge; state the offer.

---

## C · Capture (7 screens) — *core feature 2*

### C1 · Capture sheet ✅ `61:1239` (G5) — `paper` sheet
**The one menu that matters.** (Drawn dark; that is direction art, not a token.)
- Close · title **"Restock the shelf"** · Help
- Hero: receipt illustration, **"Point at your receipt"** / "The whole shop goes on the shelf at
  once. Every thing gets an expiry guess."
- Row: **Scan a barcode** / "one thing at a time" ›
- Row: **Add by hand** / "type it in" ›
- Primary: **Capture receipt** (bottom, brand accent)

### C2 · Receipt camera ✅ `61:1304` (H1) — `paper` chrome over the live camera
- Close · **"Scan a receipt"** / "One photo · every line · about 6 seconds"
- Live frame with the detected receipt outlined
- Live status: **"8 lines found · all matched to your catalog"**
- **Capture** (brand accent, primary) · Choose a photo · Enter by hand

### C3 · Receipt review ⬜ ⚠️ **highest-risk screen in the product**
Where OCR output becomes truth. Undrawn.
- Store, date, total parsed from the receipt — each editable
- One row per line: raw text → matched item, quantity, price
- Confidence shown, not hidden. Unmatched rows float to the top, in place (Conventions 4)
- Commit action states the consequence: "Put 12 things on the shelf"

### C4 · Unmatched line resolver ⬜
- Raw receipt text (`MILK 2% GAL 4.49`) at the top
- Search your catalog · create a new item · ignore this line
- Remembers the mapping for next time — this is how the catalog learns

### C5 · Barcode scanner ⬜
Live scan → known product or C4-style resolver. Quantity stepper on hit.

### C6 · Enter by hand ⬜
Store, date, then repeatable line rows. The always-works fallback, and the manual twin for the
whole of section C (Conventions 5).

### C7 · Capture result ⬜
"12 things went on the shelf." Lists what changed, what the expiry guesses were, and a
single undo. Then → B1.

---

## D · List (7 screens) — *core feature 3*

### D1 · List ✅ `61:1908` (F/01) — `paper`
- Title **"Weekly shop"** · sub-line "Trader Joe's · 5 of 7 left"
- **`NO PRICE YET`** group, pinned **above** every aisle group — the things Bagged is guessing on
  - Each row: name · the guess, greyed · affordance **"tap to set what you paid"**
  - ⭑ The guess is the ask. Every correction here becomes a new measured observation and lands in
    E2's observation list with source `typed`.
- Callout card: "4 of these are cheaper at Costco. About $6.20 less." › → D6 🔒
- Then the aisle groups: `PRODUCE` `DAIRY` `PANTRY`, each with a group subtotal
- Rows: checkbox · name · quantity chip (`×2`) · price right-aligned (the shared right-aligned
  state component, Conventions 3)
  - Got-it rows strike through and grey out **inside their own aisle**. They do not jump, and
    they do not sink to a "done" bucket.
  - When every row in an aisle is struck, the aisle collapses to one line:
    **`PRODUCE · done (4)`**, tappable to re-expand
  - A price with no history renders as an estimate, visibly distinct
- **Sticky two-line footer**, above the input, not in the header:
  **`≈ $30.40`** / "3 estimated · 1 guessed"
  ⭑ The total is read one-handed, in a cart, with the phone low. A header cannot be read there.
- Bottom bar: **"Add an item, or just say it…"** with `＋` and a **Speak** button

### D2 · Item row detail ⬜
Quantity, note, which aisle, price history link, remove.

### D3 · Add item ⬜
Typed with catalog autocomplete, plus the voice sheet (on-device, per `J6`).

### D4 · Aisle order editor ⬜
Drag to match the physical store. Per shop — this is what "AISLES" earns.

### D5 · Shop switcher ⬜
Which store this list is for; changes prices, aisle order, and the geofence that wakes it.

### D6 · Cheaper elsewhere ⬜ 🔒
The same basket priced at each of your stores, item by item, with the delta.

### D7 · List empty / all done ⬜
The natural end of D1's aisle collapse: when the last aisle collapses, this is what is left.
"Nothing to buy." Offer: auto-add is watching *n* things that run out this week.

---

## E · Prices & spend (7 screens) — *core feature 4*

All four drawn frames in this section use the same component: a hero card on the `ink` surface,
sitting on a `paper` screen. E1/E2 were drawn navy and E3/E4 black; they are one card with one
token, so Prices → Trips does not change colour mid-tab.

### E1 · Prices ✅ `61:1391` (H3) — `paper` screen, `ink` hero card
- Title **"Prices"** · "212 items · 38 receipts · 3 stores"
- Hero card (`ink`): `THE SAME BASKET, OVER TIME` · **$42.93** · pill `+8.1% since May`
  - Bar chart, latest bar highlighted in the brand accent
  - Footnote, verbatim: "Twelve trips of the same eight staples. Nothing here is a national
    average. This is what you paid."
- `WHAT MOVED` / "vs your own average"
- Rows: icon · item · `$3.99 → $4.99` · delta right-aligned, red up / green down

### E2 · Item price history ✅ `61:1509` (H6) — `paper` screen, `ink` chart card
- Back "‹ List" · **Share**
- **Whole milk** · "1 gal · dairy & eggs · 12 observations"
- `YOU USUALLY PAY` **$4.42** · `RANGE` $4.29 – $5.19
- Bar chart per observation (`ink` card)
- `EVERY OBSERVATION` / "newest first" — date · store · **source tag** (`receipt` /
  `typed`) · price · delta. ⭑ Provenance on every single data point.
- ⭑ This list is where D1's `NO PRICE YET` corrections arrive, tagged `typed`.

### E3 · Trips ✅ `61:951` (F4) — `paper` screen, `ink` hero card
- **Trips** · "38 trips · $2,940 tracked"
- Two stat tiles: `AVERAGE TRIP` **$79.20** · `UNDER BUDGET` **26 of 38**
- Bar chart, over-budget bars in orange
- Trip rows: date · store · budget · total · `under` / `over` tag → E5

### E4 · Month / spend ✅ `61:2047` (F/05) — `paper` screen, `ink` hero card
- **July** · "4 trips · 3 stores"
- Hero card (`ink`): `SPENT THIS MONTH` **$284.60** · "↓ $18 vs June"
- **Two tiles side by side: `FROM RECEIPTS 34%` · `ESTIMATED 66%`**
  ⭑ The strongest idea in the file — the app states how much of its own number is measured.
- `BY STORE` / "avg per trip" — store avatar · name · trip-count chip · total
- Insight card: "Same basket at Walmart would have run about $31 less across July."
- `WHERE IT WENT` / "tile = spend" — pastel treemap (Produce, Dairy, Pantry, Meat…),
  tile area proportional to spend → E6

### E5 · Trip detail ⬜
One receipt: store, date, total, every line, budget delta, the receipt image, re-scan.

### E6 · Category detail ⬜
One treemap tile drilled in: items, trend, share of month.

### E7 · Store comparison ⬜ 🔒
The engine behind D6 and E4's insight card, as its own screen.

---

## F · Kitchen (4 screens) — *supporting feature 5*

### F1 · Invite ✅ `61:1604` (I6) — `paper`
- Close · **Invite**
- Avatar stack (J S M +)
- **"Add someone to The Lugos"**
- "They just tap the link, offline or not. No account, no download wall, free for them forever."
- `YOUR LINK` — the link sits in an **inset field** (`bagged.app/j/7QK2M`) with a `⋯` overflow:
  **Copy · New link · QR code**
  - ⭑ "New link" is how a link gets revoked. A no-account invite has exactly one failure mode, a
    forwarded link, and revocation is currently absent from the screen that creates it.
  - Copy fires a toast: "Link copied."
- Three share targets: Message · WhatsApp · More
- Three assurances, checkmarked:
  - Everyone edits the same list, offline or not.
  - They never see your payment details.
  - You can remove anyone at any time.
- **Share the link** (`ink` primary)
- One grey line directly under the button, stating scope: "Anyone with this link can edit your list."

### F2 · Kitchen ⬜
A roster, not a dashboard.
- Kitchen name header ("The Lugos")
- Avatar row across the top; unfilled slots render as placeholders — `e.g. Mom` / `e.g. Dad`
- **`Invite someone new ›`** is the **first row**, above the members, not buried under them → F1
- Member rows: avatar · name · right-aligned state
  - Not yet joined: ghosted, sub-label **`Invited`**
  - Joined without an account: sub-label **`Guest · no account`**
- Recent activity below the roster: who added what

### F3 · Member detail ⬜
Remove, what they can see, what they've added.

### F4 · Guest view ⬜ ⚠️
The list. That is the entire screen.
- **No tab bar.** No Shelf, no Prices, no Me.
- Persistent header chip: **`Guest of The Lugos · your changes save here`**
- Same rows, same got-it behaviour, same aisle collapse as D1
- **`Get Bagged`** lives in the header overflow, once. Never a wall, never a sheet, never on open.
- ⚠️ Still needs its own auth path — decide with A6.

---

## G · Ambient surfaces (8 screens) — *supporting features 6, 7, 12*

### G1 · Lock screen ✅ `61:1666` (J3) — `paper` screen, `black` widget mock
- **"On your lock screen"** / "Tick things off without unlocking, without opening anything"
- **`Lock screen | Home screen`** segmented control, directly above the mock. One screen covers
  both surfaces; the mock swaps, the instructions swap with it.
- Widget mock over a lock screen, rendered with the user's real list: `BAGGED · 8 LEFT` ·
  `$41.90` · item rows with strikethrough · caption "tap a box right here"
- **Three instruction rows** under the mock, each with an icon tile that mimics the actual iOS
  control the user is about to touch: the jiggling icon, the `+` button, the widget picker row
- Setting rows, each with state right-aligned:
  - Lock screen widget — On
  - Home screen widget — Medium size
  - Show the running total — On
  - Wake when you reach a shop — On
    ⭑ This row, not A4, is where "always" location is requested. Turning it on triggers the ask.

### G2 · Places ✅ `61:1740` (J5) — `paper`
- **Places** / "The list wakes up when you get there. Nothing to remember."
- Arrival card: **"You're at Trader Joe's"** / "arrived 12 minutes ago" /
  "Your aisle order for this shop is loaded and the widget is live"
- **Manual twin** ⭑ — with location declined, the arrival card is replaced by a tappable row:
  **`At Trader Joe's? · Yes / Not now`**. Yes starts the trip, loads the aisle order, and opens
  the price observation. Same outcome, zero location access.
- `YOUR SHOPS` — pin icon · name · "branch · n trips" · toggle. Active shop outlined.
- Dashed row: **Add a shop** / "or let it learn from where you stop"
  ⭑ Manual path and learned path in one control.
- Footer, verbatim: "Location never leaves the phone. There is no server that knows
  where you shop."

### G3 · Add / edit a shop ⬜
Name, branch, pin, radius, aisle order link, delete.

### G4 · Widgets ⬜
A **permanent settings page** at `Me → Surfaces → Widgets`. Not an onboarding modal that fires
once and is then unreachable.
- S (count + total) · M (next 4 items) · L (full list, tickable)
- Every preview rendered with the user's **real list**, never placeholder items
- Each preview sits directly above **its own** instruction block — surface first, then the steps
  (Conventions 1)

### G5 · Watch app ⬜ 🔒
The list, tickable. Nothing else. `black`.

### G6 · Siri & Shortcuts ⬜
Phrase list ("4 phrases" per `J6`) — add to list, what's on the list, read it aloud.

### G7 · CarPlay ⬜ 🔒
Read-only list, large type. `black`.

### G8 · Live Activity / Dynamic Island ⬜
`black`. Starts on G2 arrival (or on `Yes` in the manual twin), ends when the trip is closed.
- **Lock-screen activity carries exactly four tokens:**
  - Store name, left
  - **`8 LEFT`**, right
  - A completion bar under both
  - **`$41.90`** running total
- **Dynamic Island, compact:** cart glyph + `8` leading, `$41.90` trailing. Nothing else.
- ⭑ Four tokens is the budget, not a starting point. Anything that wants a fifth belongs on G1.

---

## H · Me / Setup (6 screens)

### H1 · Setup ✅ `61:1823` (J6) — `paper`
- **Setup** / "Bagged 1.0 · build 30"
- **BAGGED PLUS** card: **$29.99 / year** · `7 days free` pill
  "Receipt scan, price history, more than one shop. The glance is free forever." → H2
- `SURFACES` — Lock screen widget `On` · Apple Watch `On` · Siri & shortcuts `4 phrases` ·
  CarPlay `On` · Widgets `›` (G4)
- `VOICE` — Recognition `On device` · Language `English (US)` · Read the list aloud `On`
- `THE LIST` — Kitchen `3 people` → F2

### H2 · Bagged Plus paywall ⬜ 🔒
One price. **No monthly**, no plan picker, no comparison table.
- First benefit row, with a **left arrow** where every other row has a checkmark:
  **`← Everything that's free stays free`**
- Then the checkmarked rows: receipt scan · price history · more than one shop · extra surfaces
- CTA **`Start 7 days free`**, with one grey line under it: "Then $29.99 a year. Cancel any time."
- Restore purchases
- ⭑ **Entry rule.** Every entry point into H2 shows the real feature **blurred, with the user's
  own data** — their basket priced across their stores, their own price history for the item they
  just tapped. Never a lock icon and a description of something they have not seen.

### H3 · Voice settings ⬜
Recognition, language, read-aloud speed.

### H4 · Notifications ⬜
Arrival, running low, expiring, weekly summary — each independently off-able.

### H5 · Data & privacy ⬜
`paper` — rows of settings, so `paper`, like every other settings screen.
Export receipts + prices, delete kitchen, what leaves the phone and what doesn't.

### H6 · About ⬜
Build, support, licences.

---

## I · System states (5 screens)

### I1 · Generic empty ⬜
One line of what goes here, one action.

### I2 · Offline ⬜
The list stays editable offline (promised in F1) — say so rather than blocking.

### I3 · Scan failed / nothing matched ⬜
`paper` — the user reads it and acts on it, so it is a `paper` screen with the failure in a card.
Always ends in C6 (by hand), never in a dead end.

### I4 · Processing a receipt ⬜
6 seconds of honest progress: found lines → matching → done.

### I5 · Permission primers ⬜
Camera (before C2), location (before A4/G2), notifications (before H4). Each one follows
scope → control → proof (Conventions 2) and each names its manual twin (Conventions 5).

---

## Menus

**Primary tab bar** — `Shelf · List · ⊕ · Prices · Me`; `⊕` → **C1**.

| Menu | Items |
|---|---|
| Shelf header `⋯` (B1) | Sort by location · by expiry · running low · Show used-up · Add item · Edit locations |
| Shelf item (B2) | Add to list now · Mark as used up · Change location · Edit expiry · Price history → · Delete |
| List row swipe (D1) | Got it · Not this trip · Change quantity · Set what you paid · Price history · Remove |
| List header (D1) | Switch shop · Edit aisle order · Clear got-it items · Share list · Start a trip |
| Invite link `⋯` (F1) | Copy · New link · QR code |
| Guest header `⋯` (F4) | Get Bagged · Leave this list |
| Prices range (E1) | Month · 3 months · 6 months · Year · All |
| Trip (E3/E5) | View receipt image · Re-scan · Edit lines · Delete trip |
| App icon long-press | Scan a receipt · Open the list · Add to shelf |

---

## Visual direction — one skin, three surfaces

There is **one skin**. Surfaces are assigned by **structural role**, not by emotional register.

| Token | Where it goes | The test |
|---|---|---|
| `paper` | Every default screen: lists, forms, settings, sheets, empties, errors | Is this a screen of content the user reads or edits? → `paper` |
| `ink` | Chart cards and hero cards. A card, never a whole screen. | Is this a card whose job is to carry a number or a chart? → `ink` |
| `black` | Ambient surfaces only: widgets, lock screen, Live Activity, Watch, CarPlay | Does this render **outside** the app? → `black` |

Plus **one brand accent** (primary actions, and the single active state on a screen), and
There is **no accent exception**. Direction I is dead: one modal in a different accent is
decoration, and F1's job is trust and share, which the ink primary already does.

The rule is decidable by looking at the screen:
- `I3 · Scan failed` → a screen the user reads and acts on → **`paper`**, with the failure in a card.
- `H5 · Data & privacy` → rows of settings → **`paper`**.
- `E1`'s basket card → a card carrying a chart → **`ink`**, sitting on a `paper` screen.
- `G8`'s Live Activity → renders outside the app → **`black`**.

**F's tabular numerals are a type style, not a direction.** `numeric.tabular` applies to every
price, delta, subtotal and total in the app, on any surface. It implies nothing about colour.

Two contradictions this resolves:
- **D1.** The only drawn List is `61:1908`, an F frame, which the old "G is the base skin" claim
  made illegal. Under surface tokens there is nothing to resolve: D1 is a `paper` screen that uses
  the tabular numerals.
- **Section E.** E1/E2 were drawn with a navy hero and E3/E4 with a black one. Both are the same
  component: one hero card, one `ink` token. Prices → Trips does not change colour mid-tab.

---

## Brand architecture — decided

**Two apps, endorsed sibling.** Otto 1.0 ships first and alone.

- **Accounts.** One Supabase project, one `auth.users`. Bagged's data lives in its own schema
  with its own RLS.
- **What Otto can read.** Exactly one narrow view: item name + a have/low boolean. No prices, no
  stores, no receipt rows, ever. Enforced as a view, not as a convention.
- **Three seams, and no others:**
  1. B5 → Otto recipes (one deep-link row)
  2. Otto's shopping list → **"Send to Bagged"**
  3. Otto's by-ingredient search, pre-filled from the shelf
- **No banners. No home-screen cross-promo.** A seam is in the flow or it does not exist.
- **Bundle: Kitchen Pass, $49.99/yr.** Always presented as the delta from what the user already
  pays — "Add Bagged for $15 a year" — never as a new price.
- **Bagged has no mascot.** Otto does; Bagged does not. Bagged makes numeric claims about money,
  and a character standing next to "+8.1% since May" converts a measurement into an opinion.
  Warmth comes from the receipt as an artifact instead.

Cooking is Otto's territory. There is no Cook tab in Bagged, and the only cooking affordance
anywhere in the app is the single deep-link row on B5.

---

## Traceability — Figma canvas "My Ideas" (`61:950`)

All 13 frames are reference art: each needs its tab bar replaced with
`Shelf · List · ⊕ · Prices · Me` before it can ship.

| Figma frame | Node | Screen | Surface |
|---|---|---|---|
| `G1 · Shelf` | `61:1039` | B1 | `paper` |
| `G2 · Shelf item` | `61:1187` | B2 | `paper` + `ink` hero card |
| `G5 · Restock scan` | `61:1239` | C1 | `paper` (drawn dark) |
| `H1 · Scan` | `61:1304` | C2 | `paper` chrome over camera |
| `F/01 List` | `61:1908` | D1 | `paper` (tabular numerals) |
| `H3 · Prices` | `61:1391` | E1 | `paper` + `ink` hero card |
| `H6 · Item history` | `61:1509` | E2 | `paper` + `ink` chart card |
| `F4 · Trips` | `61:951` | E3 | `paper` + `ink` hero card |
| `F/05 Spend` | `61:2047` | E4 | `paper` + `ink` hero card |
| `I6 · Invite` | `61:1604` | F1 | `paper` (indigo dropped) |
| `J3 · Lock screen` | `61:1666` | G1 | `paper` screen, `black` widget mock |
| `J5 · Places` | `61:1740` | G2 | `paper` |
| `J6 · Setup` | `61:1823` | H1 | `paper` |

## Open questions

1. **Account model** (A6, F4) — guests need none; owners need one for durability.
2. **Depletion model** (B2) — how "1 gal every 9 days" is actually computed.
3. **C3/C4** — receipt review and line matching are undrawn and carry the product.
4. **Secure `bagged.app` before F1 is built.** The domain is hardcoded into the invite screen and
   the link format `bagged.app/j/7QK2M` is already drawn.
5. **File the "Bagged" word mark.** Common English word, crowded in classes 9 and 42.
