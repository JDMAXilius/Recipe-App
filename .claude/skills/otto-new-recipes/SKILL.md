---
name: otto-new-recipes
description: Create new Otto-original recipes and land them in the otto_recipes catalogue — author, canonicalize (usdaTable keys + grams), compute nutrition, upsert to Supabase, verify in the app. Use when asked to add, create, or expand recipes for the Otto catalogue (NOT for user recipes made in the app).
---

# Adding Otto-original recipes to the catalogue

The growth path after the OWN_RECIPE_DB migration: new recipes go through the SAME
medallion shape as the 792 snapshot recipes — silver (`supabase/otto-recipes/canonical/recipes.json`,
the source of truth, committed) → serving copy (`otto_recipes` table) + `seed_nutrition`.
Never insert into the tables without landing silver first.

## Legal rails (non-negotiable)

- **Recipe text**: author it fresh, or take only the *facts* (ingredients, quantities,
  procedure) from references — never copy prose. Instructions are written in Otto's voice.
- **Images**: `media.image` stays **null** (the app renders the painted category art —
  our own asset) unless a photo we OWN or GENERATED is available. **Never** hotlink or
  copy photos from recipe sites.
- **Videos**: linking a YouTube URL in `media.youtube` is fine (it's a link, not a copy).
- Existing snapshot recipes keep their TheMealDB images/videos AS-IS (founder directive).

## The pipeline

### 1. Author

Pick dishes NOT in the catalogue (check first — see step 5's search, or
`select id, canonical->>'title' from otto_recipes where canonical->>'title' ilike '%…%'`).

Each record needs:
- `id`: next free in the **9xxxxx** range (Otto originals; TheMealDB ids are 5xxxx).
  `select max(id) from otto_recipes where id like '9%'` to find the next one.
- `category`: one of the app's painted tiles — Beef, Breakfast, Chicken, Dessert, Goat,
  Lamb, Miscellaneous, Pasta, Pork, Seafood, Side, Starter, Vegan, Vegetarian.
- `area`: an existing cuisine (matches the FilterSheet list — e.g. Indian, Italian, American).
- `servings`: the recipe's real yield (integer).
- `instructions[]`: one step per entry, Otto's voice — warm, direct, no fluff.
- `ingredients[]`: per line `{ original, measure, name, key, grams, cooked, frying_medium, note }`
  where `original` = `"${measure} ${name}"`.

### 2. Canonicalize (the judgment — you do this, per the canonicalizer doctrine)

Full doctrine: `.claude/agents/canonicalizer.md`. The essentials:
- `key` must be an EXACT `usdaTable.json` key (the tool hard-fails otherwise). Check with:
  `node -e "const t=require('./src/features/nutrition/engine/data/usdaTable.json'); console.log(Object.keys(t).filter(k=>k.includes('SUBSTR')))"`
  A genuinely unmappable line gets `key: null` (it then counts against coverage).
- `grams` = the weight that actually enters the dish: cans → drained weight; "1 large
  onion" ≈ 150g, medium ≈ 110g; garlic clove ≈ 5g; eggs ≈ 50g; herbs-as-garnish ≈ 5g;
  1 tbsp oil/butter ≈ 14g; 1 tsp ground spice ≈ 2g; liquids ≈ 1g/ml (cream ~1.0).
- `cooked: true` ONLY when the line's weight is stated for the already-cooked food.
- `frying_medium: true` ONLY for oil that is largely discarded (deep-fry); oil that stays
  in the pot/sauce is `false`.
- Every judgment that isn't obvious gets a `note` (the honesty trail).

### 3. Land + compute

Write the records array to a JSON file, then:

```bash
node --experimental-strip-types \
     --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
     tools/add-otto-recipes.mjs <records.json>
```

It validates (shape, 9xxxxx ids, key allowlist), appends silver, computes per-serving
nutrition through the SAME engine as the 792, and writes `<records>.upsert.sql`.
Sanity-check the logged kcal/serving against common sense before applying.

### 4. Apply to Supabase

Run the emitted SQL via the **Supabase MCP `execute_sql`** tool (it upserts
`otto_recipes` + `seed_nutrition`). There is no service-role key on disk — the MCP is
the write path.

### 5. Verify in the app (web is enough)

- Search the title on Discover → the tile appears with the painted category art and a
  calorie pill.
- Open the detail → ingredients/steps render, the kcal figure matches the card
  (both are FDA-rounded), "Otto worked this out from the ingredients".
- The tile art comes from `foodIcon(category)` — if the category was misspelled the
  miscellaneous bowl shows instead of the right painting.

### 6. Commit

Commit the silver diff (and the records JSON if kept under `supabase/otto-recipes/`).
The tables are derived — regenerable from silver — but silver in git IS the catalogue.

## Gotchas learned the hard way

- The `canonicalize` edge function is RETIRED (410) — the judgment is done by the agent
  now, not an endpoint.
- `SeedId` must be numeric (`/^\d+$/`) — that's why ids are "900001", not "otto-1".
- Search finds Otto originals by TITLE only (`ottoSearchByTitle`); the ingredient-search
  fallback still queries TheMealDB and won't see them.
- Otto's pick (Discover hero) still draws from TheMealDB — originals won't be featured
  until that path is cut over.
- `seed_nutrition` is what the DISCOVER/COOKBOOK cards read (batched); without that row
  the card falls back to the labelled `~` category estimate.
