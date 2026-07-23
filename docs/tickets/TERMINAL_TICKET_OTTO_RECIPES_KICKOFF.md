# TERMINAL TICKET — otto-recipes migration kickoff (Phase 0 → 1 → 2-pilot)

> STATUS: open — cut from cloud 2026-07-23; everything below needs network/DB access the
> cloud session doesn't have. Full plan + architecture: `OWN_RECIPE_DB.md` (same folder).

Founder directive (2026-07-23): own the recipe data — snapshot TheMealDB's ~750 into Otto's
own catalogue (`otto-recipes`), canonicalize once at the source, grow to 2,000+ Otto originals.
Keep existing images/videos/sources AS-IS (never replace/regenerate). Zero runtime dependency
on TheMealDB when done.

**Ordering law: Phase 0 gates everything.** Do not snapshot, and especially do not copy image
files, before the terms answers are written down.

## Phase 0 — legal gate `[~30 min + an email]`

1. Read https://www.themealdb.com/terms_of_use.php directly (403'd through the cloud proxy —
   never actually read). Record in **this ticket's `## Log`** (the single Log for this work,
   per the tickets skill): (a) may recipe data be stored in our own DB? (b) may IMAGE FILES
   be re-hosted? (c) what attribution is required?
2. Confirm the supporter/Patreon key status on the account (the `content` function already
   uses a v2 supporter key — verify it's active).
3. If image re-hosting is unclear from the terms, email TheMealDB asking permission to
   self-host the image files with attribution. Snapshot can proceed meanwhile; the image-copy
   step waits for the answer.
4. Flag to founder: Phase 7 (data-asset) ToS/privacy language should go to counsel EARLY —
   consent only covers recipes created after it ships (see `OWN_RECIPE_DB.md` Phase 7 gates).

## Phase 1 — snapshot `[one session]`

5. `tools/snapshot-themealdb.mjs`: pull every recipe (list categories → list meals → lookup
   each id) through the existing `content` edge function (keeps the key server-side). Write
   `supabase/otto-recipes/raw/themealdb-2026-07.json` — the verbatim API responses, one
   entry per recipe, plus `fetched_at`. Commit it (bronze = immutable; never edited after).
6. Migration: `otto_recipes` table (id, canonical jsonb, provenance jsonb, created_at,
   updated_at) + RLS **enabled** with public SELECT only (mirror `seed_nutrition`'s posture);
   no client INSERT/UPDATE (deploy script uses service role). Regenerate
   `src/types/database.ts` after (database.md contract).
7. Image files: ONLY if Phase 0 cleared re-hosting → copy the existing files as-is into a
   Supabase Storage bucket (public-read), recording per-recipe `media.image_storage_path`
   alongside the original URL. If not cleared yet: skip — hotlink + attribution stays.

## Phase 2 pilot — canonicalize 10, not 750 `[one session]`

8. `tools/canonicalize-recipes.mjs` driver: for each recipe, spawn the **canonicalizer**
   agent (`.claude/agents/canonicalizer.md`) with the recipe + the current `usdaTable` key
   list; zod-validate the structured output (schema per `OWN_RECIPE_DB.md` silver shape);
   every batch refuted by the **critic** before landing. Land results in
   `supabase/otto-recipes/canonical/recipes.json`.
9. Pick the pilot 10 by ranking first (this needs the corpus that doesn't exist yet):
   a. Derive a T6 corpus file from the BRONZE snapshot — `[{name, recipeId, servings,
      ingredients:[{measure,name}]}]` via the same shape `mealdb.transform.ts` reads — and
      run `tools/nutrition-breakdown.mjs --corpus` over it. Worst-first ranking = the pilot
      list (Irish Stew will be in it).
   b. Canonicalize those 10 (step 8), then re-run T6 over the CANONICAL versions to compare.
      Adapter: canonical lines are already resolved — emit `{measure: "<grams> g", name:
      original}` per line (grams-as-text parses exactly; T6 needs no code change).
   c. Human-review all 10 in full.
10. Write pilot findings to **this ticket's `## Log`** (schema gaps, prompt fixes, cost/recipe,
    missing-ingredient count). **Stop for founder review before the full-750 run.**

## Done when

- [ ] Phase 0 answers (data storage / image re-hosting / attribution) recorded in this
      ticket's Log
- [ ] Supporter key confirmed active
- [ ] Bronze snapshot committed (`otto-recipes/raw/themealdb-2026-07.json`) — EVERY recipe
      the API returns, exact count recorded in the Log (docs float between ~750 and 777;
      the snapshot settles the true number)
- [ ] `otto_recipes` migration applied + RLS verified (user B cannot write; anon can read) +
      types regenerated
- [ ] Image decision executed (copied to Storage, or explicitly deferred with reason)
- [ ] Canonicalizer driver runs end-to-end; 10-recipe pilot canonicalized, T6-audited,
      human-reviewed
- [ ] Pilot findings + full-run go/no-go written to this ticket's Log

## Notes

- Crew: security-builder (migration/RLS/storage) · builder (scripts) · canonicalizer + critic
  (pilot) — per the crew map in `OWN_RECIPE_DB.md`.
- Do NOT execute these NUTRITION_ACCURACY items piecemeal — absorbed by this migration:
  **T1-data-curation, T2's per-recipe half, T4, T5-remainder, T7** (authoritative list:
  `OWN_RECIPE_DB.md` § "Relationship to NUTRITION_ACCURACY.md"). **Still live and NOT
  absorbed: T3 (cooked-yield) and T2's weight-layer consolidation** — they guard
  user-imported recipes, which this migration doesn't touch. T6 tool + T1 guard mechanism
  are already shipped and stay.
- The engine/parse/guards are untouched by this ticket; nothing here changes app behavior
  until Phase 4 (cutover), which is deliberately NOT in this ticket.

## Log

### 2026-07-23 — Phase 0 legal read (terms fetched successfully; the cloud 403 did not recur)
Read https://www.themealdb.com/terms_of_use.php directly. Answers to the three gate questions:
- **(a) May recipe DATA be stored in our own DB?** ✅ **YES.** Verbatim: *"You can scrape, copy and
  modify any content returned from the API, as long as you use the official end points."* Ingredient
  lists / measures / instructions may be snapshotted + canonicalized. (Instructions get rewritten in
  Otto's voice anyway; ingredient lists are facts, non-copyrightable.)
- **(b) May IMAGE FILES be re-hosted?** ⚠️ **NOT cleared.** No explicit permission; artwork is
  user-created custom work — *"you must not pass it off as your own"* — and per-image licensing is
  signalled by the `strCreativeCommons` tag. → **Default per the roadmap fallback: keep HOTLINKING
  the CDN image + attribution (never replace/regenerate — founder law).** Re-hosting the bytes needs
  either a per-image CC-clear check or an email to TheMealDB for blanket permission. FOUNDER call.
- **(c) Attribution required?** ✅ Yes — link back; for paid use, credit as the data source. Otto
  already credits (README/credits + "source credited forever" law). No change needed.
- **Compliance flag:** *"cannot publish apps to an appstore unless you are a paid subscriber."* Otto
  ships to TestFlight/App Store → the supporter/Patreon key MUST be the PAID tier. Pre-existing
  requirement; verify the account is active (the `content` fn's `THEMEALDB_KEY` secret is a v2 key —
  confirm it's the paid one). FOUNDER to confirm.

**Gate resolution:** DATA snapshot is CLEARED → Phase 1 (migration + bronze snapshot) may proceed.
IMAGE-copy sub-step (Phase 1 step 7) is DEFERRED (hotlink + attribution) pending the founder image
call / a permission email. Supporter-key confirmation is a founder item (app-store compliance),
independent of snapshotting.

**Founder decision (2026-07-23):** image strategy = **keep hotlinking + attribution** (re-host not
pursued). Phase 1 image-copy step is closed as "hotlink, no copy." (Supporter-key paid-tier
confirmation still open — founder to verify the account; not a snapshot blocker.)

### 2026-07-23 — Phase 1 DONE (crew ladder: security-builder + builder → lead-verify → critic SHIP)
- **`otto_recipes` migration applied** (`supabase/migrations/20260723140000_otto_recipes.sql`): `id text pk,
  canonical jsonb, provenance jsonb, created_at, updated_at`. RLS mirrors `seed_nutrition` — one SELECT
  policy for anon/authenticated `using(true)`, no write policy. **RLS verified LIVE:** anon SELECT → `200 []`,
  anon INSERT → `401 / 42501 "violates row-level security policy"`. Types regenerated (`src/types/database.ts`,
  `tsc` clean).
- **Bronze snapshot committed** (`supabase/otto-recipes/raw/themealdb-2026-07.json`, 2.2 MB): pulled via the
  `content` edge function (v2 supporter key server-side) by categories→filter→lookup. **TRUE RECIPE COUNT
  = 792** (settles the ~750/777 float). 14 categories, 0 failures, verbatim (54 fields/meal), sorted, deduped,
  zero transformation leak. Image URLs hotlinked (per founder call).
- **Critic (REFUTER) = SHIP:** completeness proven by an independent letter-search index (snapshot is a strict
  superset, 0 real recipes missing; category-filter even catches leading-space/non-ASCII names letter-search
  misses — `52885` " Bubble & Squeak", `53120` "Æbleskiver"). Verbatim + RLS: no findings.
- Script `tools/snapshot-themealdb.mjs` is re-runnable (`--self-check` for offline logic). Bronze is IMMUTABLE
  from here (never edited — provenance).
- **NEXT: Phase 2 pilot** — canonicalize 10 (ranked worst-first via T6 over the bronze), critic-refute each,
  human-review, then STOP for founder go/no-go before the full 792.
