# 🛍️ Bagged — Full Screen Map & Content Breakdown

> Every screen in the app, with the content on it, top → bottom. Grounded in the Figma
> canvas **"My Ideas"** (`Lpx5Pdgvy3Gx8l5ZSDS0JH`, node `61:950`) — 13 screens curated
> from five visual directions (F/G/H/I/J). **Your prices, not market prices. Show what
> is measured vs estimated. Location never leaves the phone.**

**Legend:** ✅ drawn in Figma (node id) · ⬜ to design · 🔒 Bagged Plus · ⚠️ open question / risk

**Count:** 9 sections · **55 screens** — 13 drawn, 42 to go.

**Tab bar:** `Shelf · List · ⊕ · Prices · Me` — `⊕` opens the capture sheet (C1).

**Money model** (from `J6`): Bagged Plus **$29.99/year, 7 days free**. The glance is free
forever. Free = shelf glance, manual list, one shop. Plus = receipt scan, price history,
multiple shops, extra surfaces. Invitees are free forever and need no account.

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
| 5 | Household sharing — link-based, guest needs no account | F |
| 6 | Places — geofence per shop, list wakes on arrival | G |
| 7 | Lock-screen & home widgets — tick without unlocking | G |
| 8 | Voice — on-device recognition, add by speaking, read aloud | D, H |
| 9 | Provenance — measured vs estimated, source per observation | E |
| 10 | Cheaper-elsewhere — same basket across your stores | D, E |
| 11 | Bagged Plus — subscription | H |
| 12 | Extra surfaces — Watch, Siri & Shortcuts, CarPlay | G |

---

## A · Launch & setup (6 screens)

### A1 · Splash ⬜
Warm paper ground, wordmark, no spinner chrome. Auto-advances to onboarding (first run)
or Shelf (returning).

### A2 · Value showcase ⬜
2–3 panels, no questions asked. The three claims worth making: *it fills itself from a
receipt* · *it knows what you actually pay* · *the glance is free forever*.

### A3 · Name your household ⬜
- Single text field, pre-filled from device name → "The Lugos"
- Sets the label used in F1/F2 and on shared lists

### A4 · Add your first shop ⬜
- Search or drop a pin; store name + branch ("Trader Joe's · Cesar Chavez")
- Location permission primer **before** the system dialog — carry `J5`'s line verbatim:
  "Location never leaves the phone. There is no server that knows where you shop."
- Skippable — a shop can be learned later from where you stop

### A5 · First fill ⬜
- Two paths: **Scan a receipt** (primary) or **Add a few things by hand**
- On success drops straight into B1 with a full shelf — the "aha" moment

### A6 · Sign in / restore ⬜ ⚠️
- ⚠️ **Account model undecided.** `I6` promises guests need no account; the household
  owner still needs one for the shelf to survive a lost phone. Decide before A3 is built.

---

## B · Shelf (7 screens) — *core feature 1*

### B1 · Shelf ✅ `61:1039` (G1)
The home screen. Warm paper ground, no chrome above the title.
- Title **"Your shelf"** + camera FAB (dark circle, top right → C1)
- Sub-line, three counts: "62 things in · 4 running low · 2 to eat soon"
- **"Eat me first"** card — gold tint, droplet icon, one line of detail
  ("Spinach and yoghurt turn in 2 days"), chevron → B5
- Sections by location: `FRIDGE` `PRODUCE` `CUPBOARD`, each with an item count right-aligned
- 3-column card grid. Each card: thin line icon · name · meter bar · one human sub-label
  - Meter colour is the only quantitative signal — green / amber / red
  - Sub-label is a **word, not a number** where possible: "plenty", "1 slice", "ripe now",
    "2 weeks", "~5 days", "eat in 2d" (red when urgent)
- Tab bar

### B2 · Item detail ✅ `61:1187` (G2)
- Back "‹ Shelf" · **Edit**
- Hero card: line icon, item name **"Whole milk"**, state line
  "About 72% left · runs out in ~5 days"
- Fact rows, label left / value right:
  - Bought — `12 Jul · Trader Joe's`
  - You go through — `1 gal every 9 days`
  - Paid last time — `$4.49`
  - Best price seen — `$4.29 · 12 Jul` 🔒
- Toggle row: **"Add to the list on Thursday"** / "That's when you normally run out"
- Buttons: **Add to list now** (dark, primary) · **Mark as used up** (outline)
- ⚠️ "You go through 1 gal every 9 days" needs either months of receipts or a depletion
  input the user never gives. This claim is the product's biggest modelling risk.

### B3 · Add item by hand ⬜
Name (autocomplete against catalog) · quantity · location · optional expiry. Voice input.

### B4 · Edit item ⬜
Same fields as B3 + delete. Reached from B2's "Edit".

### B5 · Eat me first ⬜
Flat list of everything turning, soonest first, with the same meter language as B1.

### B6 · Locations editor ⬜
Reorder / rename / add locations (Fridge, Produce, Cupboard, Freezer…).

### B7 · Shelf empty ⬜
Single call to action → C1. No illustration of an empty fridge; state the offer.

---

## C · Capture (7 screens) — *core feature 2*

### C1 · Capture sheet ✅ `61:1239` (G5)
Dark sheet over the shelf. **The one menu that matters.**
- Close · title **"Restock the shelf"** · Help
- Hero: receipt illustration, **"Point at your receipt"** / "The whole shop goes on the
  shelf at once — with an expiry guess for each thing"
- Row: **Scan a barcode** / "one thing at a time" ›
- Row: **Add by hand** / "type it in" ›
- Primary: **Capture receipt** (light pill, bottom)

### C2 · Receipt camera ✅ `61:1304` (H1)
- Close · **"Scan a receipt"** / "One photo · every line · about 6 seconds"
- Live frame with the detected receipt outlined
- Live status: **"8 lines found · all matched to your catalog"**
- **Capture** (teal, primary) · Choose a photo · Enter by hand

### C3 · Receipt review ⬜ ⚠️ **highest-risk screen in the product**
Where OCR output becomes truth. Undrawn.
- Store, date, total parsed from the receipt — each editable
- One row per line: raw text → matched item, quantity, price
- Confidence shown, not hidden — unmatched rows float to the top
- Commit action states the consequence: "Put 12 things on the shelf"

### C4 · Unmatched line resolver ⬜
- Raw receipt text (`MILK 2% GAL 4.49`) at the top
- Search your catalog · create a new item · ignore this line
- Remembers the mapping for next time — this is how the catalog learns

### C5 · Barcode scanner ⬜
Live scan → known product or C4-style resolver. Quantity stepper on hit.

### C6 · Enter by hand ⬜
Store, date, then repeatable line rows. The always-works fallback.

### C7 · Capture result ⬜
"12 things went on the shelf." Lists what changed, what the expiry guesses were, and a
single undo. Then → B1.

---

## D · List (7 screens) — *core feature 3*

### D1 · List ✅ `61:1908` (F/01)
- Title **"Weekly shop"** · sub-line "Trader Joe's · 5 of 7 left"
- Right: **≈ $30** with "3 est · 1 guessed" underneath — ⭑ the honesty rule in miniature
- Callout card: "4 of these are cheaper at Costco — about $6.20 less" › → D6 🔒
- Grouped by aisle: `PRODUCE` `DAIRY` `PANTRY`, each with a group subtotal
- Rows: checkbox · name · quantity chip (`×2`) · price right-aligned
  - Got-it rows strike through and grey out in place — they do not jump
  - A price with no history renders as an estimate, visibly distinct
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
"Nothing to buy." Offer: auto-add is watching *n* things that run out this week.

---

## E · Prices & spend (7 screens) — *core feature 4*

### E1 · Prices ✅ `61:1391` (H3)
Cool navy hero on a light ground — the analytic room.
- Title **"Prices"** · "212 items · 38 receipts · 3 stores"
- Dark hero card: `THE SAME BASKET, OVER TIME` · **$42.93** · pill `+8.1% since May`
  - Bar chart, latest bar highlighted teal
  - Footnote, verbatim: "Twelve trips of the same eight staples. Nothing here is a
    national average — it is what you paid."
- `WHAT MOVED` / "vs your own average"
- Rows: icon · item · `$3.99 → $4.99` · delta right-aligned, red up / green down

### E2 · Item price history ✅ `61:1509` (H6)
- Back "‹ List" · **Share**
- **Whole milk** · "1 gal · dairy & eggs · 12 observations"
- `YOU USUALLY PAY` **$4.42** · `RANGE` $4.29 – $5.19
- Bar chart per observation
- `EVERY OBSERVATION` / "newest first" — date · store · **source tag** (`receipt` /
  `typed`) · price · delta. ⭑ Provenance on every single data point.

### E3 · Trips ✅ `61:951` (F4)
- **Trips** · "38 trips · $2,940 tracked"
- Two stat tiles: `AVERAGE TRIP` **$79.20** · `UNDER BUDGET` **26 of 38**
- Bar chart, over-budget bars in orange
- Trip rows: date · store · budget · total · `under` / `over` tag → E5

### E4 · Month / spend ✅ `61:2047` (F/05)
- **July** · "4 trips · 3 stores"
- Black hero: `SPENT THIS MONTH` **$284.60** · "↓ $18 vs June"
- **Two tiles side by side: `FROM RECEIPTS 34%` (green) · `ESTIMATED 66%` (white)**
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

## F · House (4 screens) — *supporting feature 5*

### F1 · Invite ✅ `61:1604` (I6)
- Close · **Invite**
- Avatar stack (J S M +) — indigo/purple accent, the one screen that uses it
- **"Add someone to The Lugos"**
- "They just tap the link, offline or not. No account, no download wall, free for them forever."
- `YOUR LINK` — `bagged.app/j/7QK2M` · **Copy**
- Three share targets: Message · WhatsApp · More
- Three assurances, checkmarked:
  - Everyone edits the same list, offline or not.
  - They never see your payment details.
  - You can remove anyone at any time.
- **Share the link** (indigo, primary)

### F2 · Household home ⬜
Members, who added what, recent activity. Entry point for F1.

### F3 · Member detail ⬜
Remove, what they can see, what they've added.

### F4 · Guest view ⬜ ⚠️
The no-account experience the invite promises. Needs its own auth path — decide with A6.

---

## G · Ambient surfaces (7 screens) — *supporting features 6, 7, 12*

### G1 · Lock screen ✅ `61:1666` (J3)
True black, amber accent — the "never open the app" direction.
- **"On your lock screen"** / "Tick things off without unlocking, without opening anything"
- Live widget mock over a lock screen: `BAGGED · 8 LEFT` · `$41.90` · item rows with
  strikethrough · caption "tap a box right here"
- Setting rows, each with state right-aligned:
  - Lock screen widget — On
  - Home screen widget — Medium size
  - Show the running total — On
  - Wake when you reach a shop — On

### G2 · Places ✅ `61:1740` (J5)
- **Places** / "The list wakes up when you get there. Nothing to remember."
- Amber arrival card: **"You're at Trader Joe's"** / "arrived 12 minutes ago" /
  "Your aisle order for this shop is loaded and the widget is live"
- `YOUR SHOPS` — pin icon · name · "branch · n trips" · toggle. Active shop outlined amber.
- Dashed row: **Add a shop** / "or let it learn from where you stop"
  ⭑ Manual path and learned path in one control.
- Footer, verbatim: "Location never leaves the phone. There is no server that knows
  where you shop."

### G3 · Add / edit a shop ⬜
Name, branch, pin, radius, aisle order link, delete.

### G4 · Home screen widgets ⬜
S (count + total) · M (next 4 items) · L (full list, tickable).

### G5 · Watch app ⬜ 🔒
The list, tickable. Nothing else.

### G6 · Siri & Shortcuts ⬜
Phrase list ("4 phrases" per `J6`) — add to list, what's on the list, read it aloud.

### G7 · CarPlay ⬜ 🔒
Read-only list, large type.

---

## H · Me / Setup (6 screens)

### H1 · Setup ✅ `61:1823` (J6)
- **Setup** / "Bagged 1.0 · build 30"
- **BAGGED PLUS** card, amber: **$29.99 / year** · `7 days free` pill
  "Receipt scan, price history, more than one shop. The glance is free forever." → H2
- `SURFACES` — Lock screen widget `On` · Apple Watch `On` · Siri & shortcuts `4 phrases` ·
  CarPlay `On`
- `VOICE` — Recognition `On device` (amber, it's a promise) · Language `English (US)` ·
  Read the list aloud `On`
- `THE LIST` — Household `3 people` → F2

### H2 · Bagged Plus paywall ⬜ 🔒
Four lines, one price, one button, restore. Name what stays free.

### H3 · Voice settings ⬜
Recognition, language, read-aloud speed.

### H4 · Notifications ⬜
Arrival, running low, expiring, weekly summary — each independently off-able.

### H5 · Data & privacy ⬜
Export receipts + prices, delete household, what leaves the phone and what doesn't.

### H6 · About ⬜
Build, support, licences.

---

## I · System states (5 screens)

### I1 · Generic empty ⬜
One line of what goes here, one action.

### I2 · Offline ⬜
The list stays editable offline (promised in F1) — say so rather than blocking.

### I3 · Scan failed / nothing matched ⬜
Always ends in C6 (by hand), never in a dead end.

### I4 · Processing a receipt ⬜
6 seconds of honest progress: found lines → matching → done.

### I5 · Permission primers ⬜
Camera (before C2), location (before A4/G2), notifications (before H4).

---

## Menus

**Primary tab bar** — `Shelf · List · ⊕ · Prices · Me`; `⊕` → **C1**.

| Menu | Items |
|---|---|
| Shelf header `⋯` (B1) | Sort by location · by expiry · running low · Show used-up · Add item · Edit locations |
| Shelf item (B2) | Add to list now · Mark as used up · Change location · Edit expiry · Price history → · Delete |
| List row swipe (D1) | Got it · Not this trip · Change quantity · Price history · Remove |
| List header (D1) | Switch shop · Edit aisle order · Clear got-it items · Share list · Start a trip |
| Prices range (E1) | Month · 3 months · 6 months · Year · All |
| Trip (E3/E5) | View receipt image · Re-scan · Edit lines · Delete trip |
| App icon long-press | Scan a receipt · Open the list · Add to shelf |

---

## Visual direction — unresolved

The 13 screens come from five directions and carry **four different tab bars**
(`Shelf·List·Cook·Me` / `LIST·AISLES·PRICES·HOUSE` / `Scan·Prices·List·Me` /
`Now·Places·Setup`). This map assumes:

- **G (warm paper)** is the base skin — Shelf, List, Capture, Setup
- **H (cool navy)** is reserved for data surfaces — E1, E2, and charts anywhere
- **J (black + amber)** is the ambient layer only — widgets, Places, arrival states
- **I (indigo)** is the invite/social moment only — F1
- **F** contributes the number treatment (tabular numerals, black hero cards, treemap),
  not a separate skin

⚠️ Direction G's tab bar says **Cook**, which is Otto's territory
(`~/Recipe-App/docs/reference/SCREEN_MAP.md`). Decide whether Bagged is a standalone app
or Otto's pantry half before B1 is built — a shelf that knows what you have is the
missing input to a recipe app, and the two share a palette already.

---

## Traceability — Figma canvas "My Ideas" (`61:950`)

| Figma frame | Node | Screen |
|---|---|---|
| `G1 · Shelf` | `61:1039` | B1 |
| `G2 · Shelf item` | `61:1187` | B2 |
| `G5 · Restock scan` | `61:1239` | C1 |
| `H1 · Scan` | `61:1304` | C2 |
| `F/01 List` | `61:1908` | D1 |
| `H3 · Prices` | `61:1391` | E1 |
| `H6 · Item history` | `61:1509` | E2 |
| `F4 · Trips` | `61:951` | E3 |
| `F/05 Spend` | `61:2047` | E4 |
| `I6 · Invite` | `61:1604` | F1 |
| `J3 · Lock screen` | `61:1666` | G1 |
| `J5 · Places` | `61:1740` | G2 |
| `J6 · Setup` | `61:1823` | H1 |

## Open questions

1. **Account model** (A6, F4) — guests need none; owners need one for durability.
2. **Depletion model** (B2) — how "1 gal every 9 days" is actually computed.
3. **C3/C4** — receipt review and line matching are undrawn and carry the product.
4. **Bagged vs Otto** — one app or two.
