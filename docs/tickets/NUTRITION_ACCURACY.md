# Nutrition accuracy — discussion + tickets (2026-07-23 handoff)

> **2026-07-23 (later): see `OWN_RECIPE_DB.md` — APPROVED** data-ownership migration (snapshot +
> canonicalize the seed recipes into Otto's own DB) that **absorbs** T1-data-curation,
> T2's per-recipe half, T4, T5-remainder, and T7 (closed-by-supersession; next step =
> `TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md`). Still live here: **T3** and **T2's weight-layer
> consolidation** (they guard user imports). T6 and the T1 mechanism are shipped and stay.

**Purpose:** capture a live design discussion so any Claude Code session (or Juan via phone)
can continue the work. Nothing below is *done* except the context + the one small fix noted.
Most execution is **terminal-only (Claude Code)** — flagged per item. Discussion/decisions can
happen on phone.

---

## 0. The system — read this first (context)

Otto computes recipe nutrition **deterministically, on-device, from USDA data** — no network, no
LLM in the arithmetic (the LLM only matches *unknown ingredient names*, via the `resolve-nutrition`
edge function). Three layers:

1. **`src/features/nutrition/engine/data/usdaTable.json`** — **964 ingredients, per-100g** USDA
   values (`{fdcId, usda, kcal, protein_g, fat_g, carbs_g, fiber_g, sugar_g, sodium_mg}`). The
   compute is `value × grams / 100` (see `compute.ts:195`). ✅ ~95% of TheMealDB's 985 ingredients
   covered; curated. **⚠️ It is per-100g, NOT per-serving. Do NOT convert it to "per serving" — the
   engine would double-scale and every recipe would read wildly low.**
2. **Weight layer** — `pieceWeights.json` (79), `cupWeights.json` (74), + the `DENSITY` / `PIECE_G`
   / `EACH_G` tables inside `parse.ts`. Turns "2 chicken breasts" / "1 cup rice" → grams. 🎯 **This
   is the real accuracy lever.**
3. **Servings + cooking model** — `recipeFacts.json` (per-recipe serving count) + `applyFryingMedium`
   / `applyBatchCondiment` in `guards.ts` (÷ servings, and count only *absorbed* frying oil).

**Proof it's per-100g:** a bolognese with 30 g parmesan (per-100g = 392 kcal) computes to
211 kcal/serving; the parmesan contributes only 29 kcal/serving (`392 × 30/100 ÷ 4`).

## 1. Key finding — "why does a recipe read too high?"

When a total is too high but the arithmetic doesn't match reality, it is **always layer 2/3, never
the per-100g table.** Traced **Irish Stew** (1135 kcal/serving), three culprits:

- **Cooking oil counted whole** — `120ml olive oil` (for browning) = 976 kcal. You don't eat 120 ml
  of oil; most stays in the pan. `applyFryingMedium` only triggers on a literal "for frying".
- **Fatty-cut + raw match** — `lamb` → "Lamb, loin chop, separable lean and fat" (298 kcal/100g);
  real stew lamb is leaner (~230), and 2 kg counted **raw** (fat renders out over 2 h of stewing).
- **Wrong match** — `300g soaked overnight in water …` matched to **flour** (almost certainly barley).

## 2. Industry validation (settled — don't relitigate)

This IS how recipe-nutrition apps work. Per-100g base + parse-line → grams → ÷ servings:
- **Edamam / Spoonacular / Nutritionix** — same pipeline; USDA per-100g is the universal base.
  Otto is a deterministic, on-device Edamam-style engine + honesty guards most apps lack.
- The cooking-yield problem is canonical: **USDA FNDDS yield & nutrient-retention factors** and
  **Edamam's `retainedWeight`** are the references. Otto already has the correct *absorbed-only*
  model for frying oil — it just needs better **detection** (see T1).
- **The right rule for oils/spices is NOT "exclude them" — it's "count only what's eaten."** Oil in
  a dressing/sauce IS eaten (count fully); oil as a browning medium is mostly not (count absorbed).
  Excluding wholesale flips the error to *under*-counting. Spices are already ~0 kcal and de-weighted
  (`isNegligible`); no need to exclude.

## 3. Open discussion — the MyFitnessPal / Cronometer / Yazio model

Those apps store foods **per-100g PLUS named serving weights** ("1 cup = X g", "1 medium = Y g")
the user picks from. **That is exactly Otto's `pieceWeights` + `cupWeights`** — just per-food and
much larger. **Takeaway:** the "MFP model" does NOT mean changing the per-100g table; it means
**growing the per-food serving-weight coverage** (= ticket T2). Logging apps (MFP/Cronometer) also
sidestep cooking yield because the user logs the *cooked* portion; Otto starts from *raw* ingredients
so it must model yield itself (T1/T3).
> **Decision for Juan:** how far to invest in named-portion / weight coverage (T2)?

---

## 4. Tickets (prioritized)

### T6 — Per-recipe breakdown diagnostic tool  ·  do this FIRST  ·  ✅ BUILT (2026-07-23)
`tools/nutrition-breakdown.mjs` is committed. Given a recipe (id/name/ingredients) it prints each
line's **parsed grams + kcal contribution + matched USDA record (with fdcId)**, sorted heaviest-first,
flagging outliers: `OIL_WHOLE` (frying medium counted as eaten — the T1 signal), `UNMATCHED`,
`HUGE_GRAMS`, `BIG_SHARE` (one line dominates the total), `low-conf`, `NO_GRAMS`, plus the guards that
*did* fire (`frying-absorbed`, `condiment-capped`, `typical-amt`, `cooked-record`). It reuses the
engine's own parse→lookup→guards path in compute.ts order, so the numbers match what the engine sums.

Run:
```
node --experimental-strip-types --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
     tools/nutrition-breakdown.mjs [--demo | --file <recipe.json> | --corpus <recipes.json>]
```
`--demo` reproduces the Irish Stew trace (surfaces all three culprits the ticket named);
`--demo-corpus` batch-scans a built-in 4-recipe sample that also documents the `--corpus` format.

**Remaining networked step (terminal w/ network):** generate the full seed corpus — call the `content`
edge function per TheMealDB recipe, write `[{ name, recipeId, servings, ingredients }]`, then
`--corpus` it to rank all 750+ worst-first. (USDA is blocked in cloud sessions, but the breakdown
itself runs fully offline — the table + engine ship locally.)

### T1 — Cooking-oil / medium detection  ·  HIGH impact  ·  ⚠️ ATTEMPTED + REVERTED — needs curated facts
A list-inference version was built and **reverted after an adversarial review found a BLOCKER.** Record
so nobody re-tries the same dead end:

**What was tried:** a second "browning-medium" tier in `applyFryingMedium` that fired when a substantial
**searable main** (meat/fish ≥ 150 g) was present AND the oil pour was large (≥ 50 g total, ≥ 20 g/serving),
reducing the oil to the film the seared food absorbs (Bognár ≈ 1 g/100 g).

**Why it fails (the ticket's own stated risk, realized):** the gate can only check that a searable main
*exists in the list* — it cannot check that the oil actually fried it, because the engine never reads
cooking steps (hard contract). So a **curry / braise / stir-fry** — where the oil blooms into a sauce
that IS eaten — has its oil gutted to the 10 g floor and ships as **confidence "high", basis "measured",
doubt ≈ 0** (the reduction hides its own uncertainty because doubt is mass-weighted). That is an
under-count laundered as a measured number — the exact honesty-law violation T1 was meant to prevent.
A grilled-chicken-salad-with-vinaigrette hits the same trap (≈ −360 kcal/serving of eaten oil). The
ticket's premise ("browning oil mostly stays in the pan, even in a stew") is itself contestable and is
**not decidable from the ingredient list.**

**Chosen path — curated `frying` flag. MECHANISM SHIPPED (2026-07-23); data curation is the follow-up.**
Done exactly like `servings`/`cooked`: `recipeFacts.json` entries may now carry an optional
`frying: string[]` naming the oil/fat lines that are a browning medium for that recipe. `buildContext`
(`compute.ts`) reads it into a `fryingSet` and marks each row `curatedFrying`; `applyFryingMedium`
(`guards.ts`) then counts only the film that line retains — `max(10 g, 4 g × servings)`, capped at the
oil present — with **no threshold and no list inference**, so there are zero false positives. Deep-fry
*baths* are still auto-detected for every recipe by the existing tier. Everything is gated on a human
having named the line, so **user/imported recipes are untouched** (oil counted whole — the honest
over-count, never a laundered under-count).

- **Behaviour change today: none.** Every `frying` array is absent/empty, so nothing reduces yet.
- **Tests:** `laws.test.mjs` pins the reduction + idempotence + the "uncurated oil is eaten whole"
  guarantee. Whole golden + laws suites green. Wiring verified end-to-end (a curated `frying` fact drops
  a stew's browning oil and lets it compute instead of hitting the plausibility cap).
- **Follow-up (networked / terminal):** curate the actual `frying` arrays. Use T6's `OIL_WHOLE` flag on
  the seed corpus to shortlist candidate recipes, read each one's TheMealDB **instructions**, and add
  the oil line to `frying` only where the steps say brown/sear/fry-then-discard (NOT where the oil
  becomes an eaten sauce — curry/braise/stir-fry). Needs TheMealDB (blocked in cloud). Then T7 recompute.
  - **Curator note (matches `cooked`'s convention):** the `frying` string must equal the recipe's raw
    ingredient **name** exactly (case-insensitive) — it is matched against `p.name`, not the parsed item.
    A near-miss silently no-ops. A curated line that is actually a deep-fry bath is safe (the bath tier
    still governs it); the flag is for the MODERATE browning pours the bath bar misses.

### T2 — Weight-layer audit + expand (the "MFP model")  ·  HIGH  ·  🟡 two parse/lookup bugs DONE (crew)
A full-corpus sweep (all 783 seeds) found the weight layer is mostly healthy — most zero-gram lines
are *correctly* negligible (garnish / to-taste). Two real, bounded bugs fixed via the crew ladder
(commit `d2f6e039`): **(A)** hyphenated mixed numbers `2-1/2 cups` were dropped entirely by the parser
(now parse as `2 + 1/2`, matching the space form; ranges `2-3` and compounds `1-inch` untouched);
**(B)** singular staples missed while plurals matched (`carrot`→NO MATCH, `carrots`→match) — added a
last-resort trailing-`s` fold (can only turn null→hit, never redirect), guarded against the `pepper`
homograph per the honesty law. **Still open:** the broader `pieceWeights`/`EACH_G` expansion (guards
user imports; remote doc keeps this "weight-layer consolidation" live).

> Also this session: **Irish stew (52781) curated** as the first `frying` example — `recipeFacts`
> now marks its "olive oil" as a browning medium, so the shipped T1 mechanism reduces it 1135→1048
> (film = `max(10, 4 g/serving)`). Demonstrates the curated path end-to-end. (An earlier crew-built
> *heuristic* T1 was retired at merge in favor of this curated design — inference produced false
> positives, e.g. Pastel de Papas, exactly as the mechanism's rationale predicts.)

### T5 — Better default protein matches  ·  MED  ·  🟡 lamb + chicken DONE (crew); beef/pork audited-clean
**Chicken fixed (2026-07-23, crew ladder):** a full-corpus protein audit found bare `chicken` (21 seeds)
wrongly resolved to **"Chicken, ground, raw"** (143/8.1) — the same wrong-cut class as lamb. First
re-pointed to skinless breast, but the critic showed that's the *leanest single cut* and breaks the
lamb/beef/pork "whole cut with its fat" convention (under-counts thigh/braise dishes). Final: added the
real whole-bird composite **"Chicken, broilers or fryers, meat only, raw" (fdcId 171052, 119/3.08)** and
pointed bare `chicken` there — sibling-consistent, semantically a composite not white-meat-only. Added
guard keys `ground/minced chicken`, `chicken mince`, **and the comma forms `chicken, minced`/`chicken,
ground`** → ground 171116 (the critic caught that `stripTrailingPrep` drags the comma spelling to the
lean default before mince-aliasing). `sirloin steak` (→ a DENNY'S branded row) left as a **T4** coverage
item (no generic raw sirloin in the table). Beef/pork re-confirmed clean.

**Lamb (prior session):** 
**Lamb fixed (2026-07-23, no network needed — re-pointed within the bundled table):** the bare `lamb`
key AND `lamb leg` both wrongly resolved to **"Lamb, ground, raw"** (282 kcal, 23.4 g fat) — a fatty
ground-meat default for what is usually a stew/roast cut. Both now point to the leanest realistic whole
cut already in the table, **"Lamb, foreshank, separable lean and fat, trimmed to 1/4″ fat" (fdcId
172481, 201 kcal, 13.4 g fat, 18.9 g protein)** — a real record, so provenance holds. Irish stew's
lamb line: 1410 → **1005 kcal/srv**.

**Ground lamb kept fatty across ALL spellings (fix from adversarial review):** re-pointing bare `lamb`
first regressed `minced lamb`/`ground lamb`, which have no own key and strip via QUALIFIER to `lamb` —
so they wrongly hit the lean foreshank (a fatty-item under-count). Added explicit `minced lamb` and
`ground lamb` keys → ground (174370, 282 kcal); with `lamb mince` that covers every common spelling.
Only bare/`diced`/`leg` lamb (real stew/roast cuts) now take the leaner default. (Beef/pork never had
this hole — they already carry explicit `minced …`/`ground …` keys, which is why their re-point was
safe and lamb's was not.) Known pre-existing gap, unrelated: `"leg of lamb"` word order resolves to
nothing (only `lamb leg` is keyed) — a coverage-ticket item, not this fix.
The gap to the ticket's ~230 target is in the honest (under-count) direction; a truly generic
"trimmed retail cuts" record (~230) isn't in the bundled table and would need a USDA lookup to add.

**beef / pork audited — already correct, no change:** `beef` → "Beef, chuck for stew" (124 kcal),
`pork` → "Pork, tenderloin" (120 kcal); their `minced …` keys correctly stay ground. Only lamb was wrong.

**Remaining (needs USDA):** add a generic "lamb, composite of trimmed retail cuts" record (~230) if the
foreshank proxy proves too lean once T7 recompute lands; re-audit any other proteins T6 flags.

### T3 — USDA FNDDS cooked-yield factors  ·  MED  ·  🟡 auto-detection DONE (crew); poison-row cleanup NEXT
**Shipped (crew ladder):** the `cooked` flag was set ONLY from curated `recipeFacts.cooked`, so an
UNCURATED user-import line "200g cooked rice" resolved to RAW rice (~3× over). Added AUTO-detection: a
literal cooked-state word in the line (`COOKED_WORD = /\b(cooked|boiled|steamed|par-?boiled|pre-?cooked)\b/i`,
excludes roasted/grilled/fried/baked) flips to the cooked record — but **gated by `hasCookedRecord` so it
only ever improves, never drops** (no cooked record → stays raw). Reading the literal word in the *line* is
not the instruction-inference the curated-frying design forbids. Curated path byte-unchanged (still drops to
null honestly). Added real boiled-potato record (fdcId 170438). `cooked rice` 720→260, `cooked chickpeas`
756→278, `boiled potatoes` null→174.
- *Critic ladder (BLOCK + revision):* v1 exposed a poisoned data row — `steamed rice` → "Sesbania flower"
  (21 kcal, 6× under-count) — now that ALL uncurated lines route through `usdaCookedTable`. Fixed by deleting
  the 2 flower rows (fall through to cooked rice 130) + a denylist for product-descriptor words (`boiled ham`,
  `boiled eggs` no longer flip to worse records). Final SHIP-WITH-CAVEAT.
- **T3-followup (NEXT):** the critic showed ~10 OTHER wrong-food cooked rows (bbq sauce→guava, marzipan→
  Almond Joy, christmas pudding→cereal, tortillas→chips, mincemeat→beef, egg rolls→fried egg, conchs→abalone,
  hotsauce/pico→pizza sauce, refried beans→beans-w-beef, mashed potatoes→sweet potato) are reachable on the
  auto path via *unnatural* phrasing only (LOW-MED). They contribute nothing correct → delete/repoint them.
  These are `tools/`-pipeline output data bugs; the OWN_RECIPE_DB migration would also resolve them.

### T4 — Coverage top-up  ·  LOW  ·  [terminal]
Add the ~5–10 **real** missing ingredients (nutella, doubanjiang, fermented black beans, a few more)
to `usdaTable.json` with real USDA fdcIds. **Skip** food colourings / spice blends / vague entries
(negligible; the runtime resolver handles misses anyway). Keep the `fdcId` provenance test passing —
proxy to the closest real record wholesale + a note (the `ackee`/`paneer` pattern) when USDA lacks it.

**Cooked-duck gap (from the 2026-07-24 servings audit):** Duck Confit (52907) reads
~1442 kcal/serving because 1400g raw skin-on `duck legs` @404 kcal/100g is counted whole,
but confit renders most of that fat OUT (instructions: "remove the legs from the fat"). The
honest fix is `cooked:true` on the duck line — BLOCKED because `usdaCookedTable.json` has no
duck record (only raw `duck`/`duck legs`). Add a `duck, meat+skin, roasted` (~337 kcal/100g,
real fdcId) cooked entry, then flip the flag → ~760 kcal/serving. Until then, left as-is (no
silent key swap). Only recipe still ≥1000 kcal that is a genuine over-count, not a big portion.

### T7 — `seed_nutrition` recompute  ·  OPTIONAL, do LAST  ·  [terminal + Supabase MCP]
The 6 ingredient fixes already shipped (parmesan/parmesan cheese/sesame seed/sour cream/paneer/
mascarpone — commit `28ced5cc`) and any T1–T5 fixes only affect **live** computes. The **777 cached
`seed_nutrition` rows** (which feed recipe **cards** via `useSeedCalories` AND the detail screen) still
show OLD values. Recompute = for each seed recipe: fetch ingredients (TheMealDB), run the engine,
upsert `seed_nutrition`. **Do this AFTER T1–T5 land** so it propagates everything at once. The row
stores only the computed result (no ingredient basis), so a recompute must re-fetch ingredients.

---

## 5. Terminal-only vs phone

**Terminal (Claude Code) ONLY** — needs a shell / file edits / DB:
- Editing engine files; running the TS engine (`node --experimental-strip-types --import
  src/features/nutrition/engine/ts-ext-resolve.mjs …`); running `npm test`.
- Querying USDA FoodData Central (`api.nal.usda.gov`, `DEMO_KEY`, rate-limited ~30/hr).
- Supabase MCP reads/writes (T7 recompute writes to `seed_nutrition`).
- `git commit` / `git push`; creating the `tools/` script.

**Phone (claude.ai)** — no shell, but great for:
- Reading/refining this doc, prioritizing, deciding scope (T2 depth, whether to run T7).
- Design discussion (cooking-yield rules, which cuts to default to, MFP-model tradeoffs).

## 6. Decisions needed from Juan
1. **Priority order** — suggested: **T6 → T1 → T2 → T5 → T3 → T4 → T7**.
2. **How far to invest in the weight/portion layer (T2 / the MFP model)** — a light audit, or a
   serious per-food serving-weight expansion?
3. **T7 recompute** — now, or after T1–T5 land (recommended: after).

## 7. Provenance
Discussion + the Irish-stew trace done 2026-07-23. The only code change shipped from it is the
6-ingredient USDA fix (`28ced5cc`). Engine files: `src/features/nutrition/engine/{compute,parse,
lookup,guards}.ts` + `data/{usdaTable,pieceWeights,cupWeights,usdaCookedTable,recipeFacts}.json`.
