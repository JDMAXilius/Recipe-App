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
- **Images** (founder policy 2026-07-24), in priority order:
  1. **Real photo with a permissive license** — Pexels is the proven source (their
     license: free commercial use, no attribution). Their site Cloudflare-blocks the
     automated browser, but WebSearch surfaces photo ids and the CDN is curl-able:
     `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&w=1200`.
     **View the photo (Read tool) before using it — it must actually BE the dish**
     (a "minestrone" search returned a poke bowl).
  2. **Generated photorealistic** — Higgsfield `marketing_studio_image`, 1:1, ~2 credits;
     editorial food-photography prompt, warm light to match the catalogue. Owned outright.
  3. Neither → leave `media.image` null; the app shows the painted category art.
  **Never** hotlink or copy photos from recipe sites/blogs.
  Hosting: compress (`sips -s format jpeg -s formatOptions 72 -Z 1024`), commit to
  `supabase/otto-recipes/media/otto-<id>.jpg`, push, then use the raw URL
  `https://raw.githubusercontent.com/JDMAXilius/Recipe-App/main/supabase/otto-recipes/media/otto-<id>.jpg`
  (repo is public; upgrade path is a Supabase storage `catalog/` folder).
  Record the origin in `provenance.image_origin` (generated job id, or Pexels photo id + license).
- **Videos**: LINKS ONLY, never generated, never downloaded — a YouTube watch URL in
  `media.youtube` (WebSearch `"<dish> recipe video youtube.com/watch"`; prefer
  well-known cooking channels; it renders in the detail's VideoEmbed).
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

### 3. Media (EVERY record, before landing — this is what makes a recipe feel finished)

For each recipe, produce all three:
- **Image** — follow the priority order in Legal rails: real Pexels photo (WebSearch →
  curl the CDN → **Read the file to confirm it's actually the dish**) else generate
  (Higgsfield `marketing_studio_image`, 1:1, editorial food-photo prompt, warm light).
  Compress, commit to `supabase/otto-recipes/media/otto-<id>.jpg`, push, use the raw URL.
- **Video** — WebSearch a YouTube how-to for the dish; put the watch URL in `media.youtube`.
- **Origin** — set `image_origin` (generated job id, or Pexels photo id + license).
  The tool REFUSES a record that has an image without an origin, and warns on any
  null image/video so nothing ships bare by accident.

Then include in each record:
```json
"media": { "image": "https://raw.githubusercontent.com/JDMAXilius/Recipe-App/main/supabase/otto-recipes/media/otto-<id>.jpg", "youtube": "https://www.youtube.com/watch?v=…", "source": null },
"image_origin": "generated (Higgsfield, owned) — job <id>"
```

### 4. Land + compute

Write the records array to a JSON file, then:

```bash
node --experimental-strip-types \
     --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
     tools/add-otto-recipes.mjs <records.json>
```

It validates (shape, 9xxxxx ids, key allowlist), appends silver, computes per-serving
nutrition through the SAME engine as the 792, and writes `<records>.upsert.sql`.
Sanity-check the logged kcal/serving against common sense before applying.

### 5. Apply to Supabase

Run the emitted SQL via the **Supabase MCP `execute_sql`** tool (it upserts
`otto_recipes` + `seed_nutrition`). There is no service-role key on disk — the MCP is
the write path.

### 6. Verify in the app (web is enough)

- Search the title on Discover → the tile appears with ITS PHOTO (curl the raw URL for
  a 200 first) and a calorie pill.
- Open the detail → the photo hero renders (parallax), ingredients/steps render, the
  kcal figure matches the card (both are FDA-rounded), and the how-to video embed shows.
- A null-image record falls back to `foodIcon(category)` painted art — if the wrong
  painting shows, the category was misspelled.

### 7. Commit

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
