# 🎟️ Terminal Ticket — Weight-first ingredients: the parts the cloud can't do

> Context: the founder locked a **weight-first ingredient display** (Kitchen Stories style, done
> honestly). The engine is **built, tested, and on `main`**: `mobile/lib/foodScale.js` +
> `mobile/test/foodScale.test.mjs` (golden coverage test, 40/40 green). Locked rules, implemented:
> everything with a known weight → **grams** (produce, eggs, citrus, cans, honey — no count
> exceptions), thin pourables → **ml**, **decimals never fractions** ("166.7 g", "0.5 tsp", never
> "½"), sub-5 g spice amounts stay spoons, shopping totals roll to **kg**, no "≈" marks.
>
> Coverage was audited against the **real seed vocabulary** — all 920 canonical TheMealDB names in
> `backend/src/lib/nutrition/usdaTable.json`. 207 unresolvable names → **0**, pinned by the golden
> test.
>
> **The cloud session is doing the app wiring** (recipe detail, cook mode, shopping list, account
> toggle) — do NOT duplicate that; check `main` before starting. This ticket is only the three
> things the cloud box cannot do: it has no network route to TheMealDB/Railway (proxy 403s both)
> and no device.

---

## Task 1 — Line-level validation against the REAL recipes (needs network)

The cloud audit proved every ingredient NAME resolves. What it could not check: the actual
**measure strings** on all ~750 seed recipes, and whether any conversion is silently *wrong*
(a bad density is worse than an unresolved line — it prints a confident wrong number).

1. Pull the full corpus (26 requests, cache it into the repo for future audits):
   ```bash
   mkdir -p backend/scripts/corpus
   for l in {a..z}; do curl -s "https://www.themealdb.com/api/json/v1/1/search.php?f=$l" \
     > backend/scripts/corpus/$l.json; sleep 1; done
   ```
2. Write a one-off script (or extend `mobile/test/foodScale.test.mjs`) that runs **every
   `strMeasureN` + `strIngredientN` pair** through `formatIngredientLine(measure, name)` and
   reports:
   - lines whose kind is `count`/`volume-us` (fell through to raw display — fine, but list them);
   - **sanity outliers**: single-line results > 2 kg or > 2 l, and weighed results < 5 g
     (threshold bugs);
   - the ~20 heaviest ingredients per aisle, eyeballed against reality (a 1400 g "whole chicken"
     is right; a 1400 g "chicken breast" is a table bug).
3. Fix what's wrong **in the table** (`DENSITY` / `EACH_G` rows in `foodScale.js`), keep the
   golden test green, and note the final line-level % here.
4. Commit the cached corpus JSONs — the cloud can then re-audit at line level forever without
   network.

### ✅ Task 1 — DONE 2026-07-20 (Mac session, network available)

Corpus cached: `backend/scripts/corpus/{a..z}.json` (1.8 MB, **758 recipes / 7 892 ingredient
lines**). Auditor: **`backend/scripts/audit-foodscale.mjs`** (`--coverage`, `--cross`, or both) —
runs every `strMeasureN`/`strIngredientN` pair through `formatIngredientLine`. No network needed
from here on; the cloud can re-audit at line level forever.

**Line-level result (after the fixes below):**

| kind | lines | share |
|---|---|---|
| weight (g) | 4 216 | 53.4% |
| volume-ml | 1 064 | 13.5% |
| seasoning (spoons/count, by design) | 1 436 | 18.2% |
| asis ("to taste", "for frying") | 1 007 | 12.8% |
| **count — fell through unweighed** | **136** | **1.7%** |
| **volume-us — fell through unweighed** | **33** | **0.4%** |

→ **66.9% of all lines print a real g/ml number**; 31% are honestly unmeasurable or deliberate
spoons; **2.1% fall through** to a raw count (e.g. "4" Egg Plants, "1 whole" Chicken) — no fake
numbers anywhere.

**Bugs the line-level pass found (invisible to the name-only audit) and fixed in `foodScale.js`:**
- **Piece words were multiplied by the whole-item weight.** "20 slices Baguette" → **5 000 g**,
  "6 large Cabbage Leaves" → 5 400 g, "12 florets Broccoli" → 2 700 g, "8 slices Smoked Salmon"
  → 1 360 g. New `PIECE_G` table (leaf/floret/slice/stalk/knob × name) is consulted before the
  whole-item table. Existing per-slice rows (bacon, parma ham) are untouched.
- **A stated pack weight was multiplied by the count.** "4 (650g) Chicken Thighs" → 2 600 g. A
  parenthesized weight is the *line total* unless a pack noun or an "x" says otherwise
  ("2 (400g) cans", "2 x 400g tins" are per-unit). `embeddedGrams()` now returns `perUnit`.
- **"2 x 400g" never resolved at all** (no parenthesis → the branch was skipped) → 124 g instead
  of 800 g.
- **`tbls` wasn't a unit** in either parser (20 lines) — "1 tbls Black Treacle" was read as one
  whole treacle. Alias added to `ingredientParser.js` **and** `parseIngredient.js`.
- Table rows: Jersey Royal / new / baby potato 40 g, small potato 70 g, baby aubergine 60 g,
  lime 44 → **67 g** (USDA whole fruit), lemongrass stalk 20 g.

**Outliers now:** 6 lines > 2 kg and 1 > 2 l, **all of them literal** ("4kg Potatoes", "2.5kg Lamb
Shoulder", "4-5 pound Beef Brisket", "4 qt Chicken Stock") plus "6 Lobster" = 3 kg, which is right
for six whole lobsters. Regression cases pinned in `mobile/test/foodScale.test.mjs` (45 tests green).

### ✅ Task 3 — cross-check RUN 2026-07-20; the refactor is still a founder call

`node backend/scripts/audit-foodscale.mjs --cross` → **187 lines across 96 ingredients disagree by
> 25%** (display vs the nutrition parser). Read a sample and the pattern is one-sided: **the
display table is USDA/King-Arthur sourced and the nutrition table falls back to a water-like
default density (1.0 g/ml) or a coarse row.** Examples:

| line | display (g) | nutrition (g) | who's right |
|---|---|---|---|
| 1 cup Mushrooms | 70 | 144 | display (USDA sliced = 70 g/cup) |
| 1 cup Bean Sprouts | 104 | 240 | display (default density) |
| 2 tbsp Tomato Ketchup | 34.3 | 18 | display (USDA tbsp = 17 g) |
| 4 tbsp Breadcrumbs | 28.3 | 15 | display (KA 113 g/cup) |
| 1 head Cabbage | 900 | 600 | display (USDA head ≈ 908 g) |
| 6 Chicken Thighs | 540 | 780 | display for boneless (90 g), nutrition for bone-in (130 g) — ambiguous |
| 2 Plum Tomatoes | 124 | 240 | display (USDA plum = 62 g) |

So the *calories* are the side carrying the error in most of these, not the displayed grams.
**Not fixed here** — editing the nutrition table changes every cached calorie number and the
confidence thresholds, which the ticket says is a founder call. Two options, with the numbers now
in hand:
1. **Cheap:** port the ~15 worst rows from `foodScale.js` into `parseIngredient.js`'s `DENSITY`
   (mushroom, bean sprout, ketchup, breadcrumbs, cabbage head, plum tomato, avocado, sesame,
   starch, cornmeal, broccoli head) — calories only, no display change.
2. **Real:** one shared data module both import, with the cross-check script as the drift test in
   CI. Needs the "where does it live" decision (backend ships it to the app vs generated copy).

## Task 2 — Device verification (after the cloud wiring lands)

Once `main` carries the wired screens (recipe detail two-column amounts, cook-mode strip,
shopping list in g/kg, Weight ↔ US cups toggle on the account screen):

- On a real build: open several seed recipes + one imported + one hand-created; check amounts
  read like a food scale (`500 g`, `166.7 g` when scaled, `0.5 tsp`, ml for milk/stock), the
  serving stepper rescales live, and the toggle flips to cups and back.
- Shopping list: two recipes sharing an ingredient → one summed line; > 1000 g shows `1.2 kg`.
- Share text/card reflect whatever the founder decided for those surfaces.
- This is pure-JS work, so it rides the next normal build — **no native rebuild needed** for
  this feature specifically.

## Task 3 — (Decision) One density table, not two

`backend/src/lib/nutrition/parseIngredient.js` has its **own** DENSITY / piece-weight / bare-count
tables (powering calories), and now `mobile/lib/foodScale.js` has another (powering display).
Two sources of truth will drift: when they disagree on "1 cup X", either the calories or the
displayed grams are wrong.

- Quick win: a cross-check script that runs the corpus lines through both and prints
  disagreements > 25% — fix whichever side is wrong.
- Real fix (bigger, optional): extract one shared data module both import. Needs a decision on
  where it lives (backend ships to app? duplicate generated file with a sync check?). Founder
  call — don't refactor silently.

## Done when
- [x] Corpus cached in-repo; line-level report produced; outliers fixed; **66.9% measured** noted above.
- [ ] Weight-first verified on a real device across seed/imported/created recipes + shopping list.
- [x] Density cross-check run; **187 disagreements ticketed with numbers** (fix = founder call above).
