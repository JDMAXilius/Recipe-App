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
   never actually read). Record in `OWN_RECIPE_DB.md ## Log`: (a) may recipe data be stored
   in our own DB? (b) may IMAGE FILES be re-hosted? (c) what attribution is required?
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
9. Run the pilot on 10 recipes: the T6 worst-offenders first (Irish Stew included) — run
   `tools/nutrition-breakdown.mjs --corpus` over the canonical output and compare against
   the raw versions. Human-review all 10 in full.
10. Write pilot findings to `OWN_RECIPE_DB.md ## Log` (schema gaps, prompt fixes, cost/recipe,
    missing-ingredient count). **Stop for founder review before the full-750 run.**

## Done when

- [ ] Phase 0 answers (data storage / image re-hosting / attribution) recorded in the Log
- [ ] Supporter key confirmed active
- [ ] Bronze snapshot committed (`otto-recipes/raw/themealdb-2026-07.json`, all ~750 recipes)
- [ ] `otto_recipes` migration applied + RLS verified (user B cannot write; anon can read) +
      types regenerated
- [ ] Image decision executed (copied to Storage, or explicitly deferred with reason)
- [ ] Canonicalizer driver runs end-to-end; 10-recipe pilot canonicalized, T6-audited,
      human-reviewed
- [ ] Pilot findings + full-run go/no-go written to `OWN_RECIPE_DB.md ## Log`

## Notes

- Crew: security-builder (migration/RLS/storage) · builder (scripts) · canonicalizer + critic
  (pilot) — per the crew map in `OWN_RECIPE_DB.md`.
- Do NOT execute the old NUTRITION_ACCURACY items T2/T3/T4/T5-remainder/T7 piecemeal — they
  are absorbed by this migration (T6 tool and the T1 guard mechanism stay and are already
  shipped). If this migration is ever cancelled, they revive.
- The engine/parse/guards are untouched by this ticket; nothing here changes app behavior
  until Phase 4 (cutover), which is deliberately NOT in this ticket.

## Log

(append findings here, dated, per the tickets skill)
