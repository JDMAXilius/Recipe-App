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
- [ ] Corpus cached in-repo; line-level report produced; outliers fixed; % noted here.
- [ ] Weight-first verified on a real device across seed/imported/created recipes + shopping list.
- [ ] Density cross-check run; disagreements resolved or ticketed with numbers.
