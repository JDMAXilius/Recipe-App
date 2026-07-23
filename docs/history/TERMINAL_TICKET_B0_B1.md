# 🎟️ Terminal Build Ticket — B0 + B1: Foundations & the Nutrition Pipeline

> ## ⛔ SUPERSEDED — read before following anything below
> **B0 shipped** (RLS, zod, pino, rate limits, both interface seams). **B1 did NOT ship as written.**
>
> Everything below prescribing **Edamam** is dead — killed on **licensing, not price**. Food DB
> Enterprise Basic permits caching *"FoodId, Food Label" only*, every plan forbids automated
> collection, and stored data needs explicit permission. Otto is a permanent per-recipe cache, so
> the terms don't allow it under $299/mo. The 252 cached rows and the backfill script were deleted
> in `edc1645`.
>
> **The live provider is USDA FoodData Central** (`backend/src/lib/nutrition/usdaProvider.js`) —
> public domain (CC0), $0, and `usdaTable.json` ships with the app so there are **zero runtime API
> calls**. Rebuild it with `USDA_API_KEY=... node scripts/build-usda-table.mjs` (~9 min).
>
> Still true below: B0 in full, the parser design (B1.1), the schema (B1.3), the lifecycle wiring
> (B1.4), and the honesty rules. Ignore B1.2 and every Edamam mention.
> **Lesson worth keeping: read a vendor's TERMS before building a cache on it.**

> Highest-leverage backend work from `BACKEND_ROADMAP.md`. **B0** makes the backend safe + truthful
> and adds the two interfaces everything else hangs off. **B1** is the hero: real, cached, per-serving
> nutrition — correct calories/macros/portions — validated against a trusted test batch.
> Build B0 first (it's non-breaking), then B1. All paths are under `backend/src/`.

**Honesty rules apply:** nutrition is always an **estimate** with a **confidence**; never a daily-goal
contract; degrade gracefully when the parser is unsure. Seed (TheMealDB) recipes get computed
nutrition too, but **never fake ratings** (that's a different feature).

---

## B0 — Foundations & truth (do first; no breaking changes)

### B0.1 Confirm the live DB + RLS (security boundary)
- Confirm which Supabase project the backend's `DATABASE_URL` actually points to (the MCP showed one
  project `supabase-orvenue` reading **INACTIVE** — verify this is the real app DB or find the right one).
- Ensure the Drizzle migrations in `src/db/migrations/` are actually applied to that DB (run
  `drizzle-kit`); the schema file is not proof the live DB matches.
- **Enable Row-Level Security** on `favorites`, `recipes`, `plan_entries` (+ every new table) as
  defense-in-depth. Note: the Express backend connects with a privileged `DATABASE_URL` and enforces
  scoping via `requireAuth` + `WHERE user_id = req.userId`, so RLS is belt-and-suspenders **today** —
  but it becomes the real boundary the moment the client touches Supabase directly (Storage, Realtime).
  Turn it on now so we're never one direct-call away from a leak.
- Run `get_advisors` (security + performance) and fix anything flagged.

### B0.2 Guardrails (non-breaking)
- **Input validation:** add a light validator (zod) on every write body (`/favorites`, `/recipes`,
  `/import`, `/plan`). Reject with 400 before the DB. (The int/day guards exist; extend to bodies.)
- **Logging:** replace `console.log` with a structured logger; wire **Sentry** (or equivalent) for
  error tracking. Keep messages user-safe.
- **Rate limiting:** add per-user + per-IP limits, especially on `/import` (and the new nutrition/LLM
  endpoints) — these call external services and cost money.
- **Do NOT** add the `/api/v1` prefix yet — it breaks `mobile/constants/api.js`. Track it as a
  coordinated change for when public share URLs land (B4).

### B0.3 The two interfaces (empty adapters, wire later)
- `src/lib/content/RecipeSource.js` — interface: `getById`, `search`, `filterByIngredient`,
  `randomBatch`. Implement a **TheMealDB adapter** behind it (move the client-side calls server-side over time).
- `src/lib/nutrition/NutritionProvider.js` — interface: `computeNutrition(ingredients, servings) →
  { kcal, protein_g, carbs_g, fat_g, fiber_g?, sugar_g?, sodium_mg?, basis_grams, confidence }`.
  B1 fills in the Edamam adapter.

**B0 acceptance:** live DB confirmed + migrations applied + RLS on + advisors clean; validated writes;
Sentry receiving errors; rate limits active; both interface files exist with TheMealDB adapter working.

---

## B1 — Nutrition correctness pipeline (the hero)

### B1.1 Ingredient parser — `src/lib/nutrition/parseIngredient.js`
Turn a line into structure: `"2 1/2 cups plain flour"` → `{ qty: 2.5, unit: "cup", item: "plain flour", grams: ~312 }`.
- Reuse the numeric/fraction/range/unit regex already in `importRecipe.js` (`splitIngredientLine`,
  `UNIT_WORDS`) — factor it out and extend:
  - normalize fractions (`2 1/2` → 2.5), ranges (`2–3` → midpoint or low, decide + document), unicode (`½`).
  - canonicalize units (tbsp/tablespoon → `tbsp`, etc.).
  - **unit → grams** conversion table (mass direct; volume needs a per-item density fallback — use a
    default density when unknown and mark lower confidence).
- Export `parseIngredientLine(line)` and `parseIngredients(list)`.
- **Confidence:** flag any line where qty or unit couldn't be resolved.

> Alternative allowed: call the LLM extraction service for structuring instead of//alongside the regex
> parser (one call per recipe, cached). Regex-first is cheaper; LLM is the fallback for messy lines.

### B1.2 Edamam adapter — fill `NutritionProvider`
- New env: `EDAMAM_APP_ID`, `EDAMAM_APP_KEY` (add to `config/env.js`). **Founder provides these.**
- Adapter POSTs the ingredient lines (Edamam Nutrition Analysis does parse+match+sum) → returns total
  nutrition + total weight; **we divide by `servings`** for per-serving + `basis_grams`.
- Keep our own parser output (B1.1) for **scaling + shopping**, and use Edamam for the **nutrition
  numbers** (turnkey correctness). Architecture stays swappable to a USDA-owned path later.
- **Budget guard:** cap calls; never call on read.

### B1.3 Schema — store + cache (new migration)
- Add to `recipes` (`src/db/schema.js`):
  - `nutrition jsonb` — `{ kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, per: "serving", basis_grams, source, computed_at, confidence }` (nullable until computed).
- New table `seed_nutrition` — cache for TheMealDB (and test-batch) recipes:
  - `(recipe_id text primary key, nutrition jsonb, computed_at timestamptz)`.
- Generate the Drizzle migration; apply it.

### B1.4 Wire compute into the lifecycle
- **On create/import save** (`POST /api/recipes`) and **on ingredient/serving edit** (`PUT /api/recipes/:id`):
  parse ingredients → `computeNutrition` → store `nutrition` on the row. Do it **async/non-blocking**
  if it slows the response (return the recipe, backfill nutrition, client re-fetches) — decide + document.
- **Return `nutrition` inline** on `GET /api/recipes` and `GET /api/recipes/:id` (already cached, no extra call).
- `POST /api/recipes/:id/nutrition/recompute` (owner) — force recompute.
- **Seed backfill job:** a script/cron that computes + caches nutrition for TheMealDB recipes into
  `seed_nutrition` (lazy on first view is fine too — compute-once, then cached).

### B1.5 The test batch (prove correctness end-to-end)
- One-off ingest script: pull **~50–100 recipes that already carry known-good nutrition** (Spoonacular
  `complexSearch?addRecipeNutrition=true`, free test tier — or Edamam) into `seed_nutrition` +
  a `seed_recipes` cache, tagged `source: "spoonacular_test"`, behind a flag.
- **Goal:** confirm the app's **NutritionCard renders correct kcal/macros/portion** against trusted
  data. Compare our computed numbers vs the vendor's on the same recipe; log the delta. This is the
  acceptance test for the whole pipeline — not a launch dependency.

### B1.6 Frontend touch (minimal, coordinate)
- `mobile/components/nutrition/NutritionCard.jsx` currently takes `calories/protein/carbs/fat/servings`
  props. Feed it the **real cached `nutrition`** from the recipe payload. Keep the existing estimate
  framing + scope toggle; add a **confidence-aware footnote** (already says "Otto's estimate… a guide,
  not a guarantee" — degrade copy further when `confidence` is low). Show `basis_grams` ("~per serving, ~310g").

**B1 acceptance:** a created/imported recipe shows **computed per-serving** kcal + macros + portion
weight, cached on the row, framed as an estimate with confidence; TheMealDB recipes show cached
nutrition; the **test-batch delta report** shows our numbers within a sane tolerance of the vendor's.

---

## Founder inputs needed to start B1
- **Edamam Nutrition Analysis** `EDAMAM_APP_ID` + `EDAMAM_APP_KEY` (+ tier/budget). *(Or say "use USDA-owned from day one" and we build the FDC path instead.)*
- **Spoonacular** key for the test batch (free tier is fine) — or "use Edamam for the batch too."
- Confirm: async nutrition compute on save (recommended) vs block the response until computed.

## Guardrails for the terminal
- Coordinate via git (fetch + rebase before push); repo commit-message trailers.
- **Non-breaking B0 first**, then B1. Don't change the client API base path.
- Cache-once-per-recipe everywhere; never call a paid API on a read.
- Keep honesty framing; never present nutrition as a guarantee or a daily-goal.

*Ticket scope = B0 + B1 of `BACKEND_ROADMAP.md §L`. Later phases (create+, import expansion, shopping/sharing, IAP, social/Health) get their own tickets.*
