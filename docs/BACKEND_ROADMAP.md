# 🛠️ Otto — Backend Roadmap (data & services spine)

> The **engineering** companion to `OTTO_V2_ROADMAP.md` (which is product/UX-phased with Mobbin
> evidence). This doc is the **backend truth**: what exists, what's missing, and the data
> pipelines + integrations we must build — with the **nutrition-correctness pipeline as the
> hero**. Deep-thought, opinionated, phased. Nothing here ships without founder go on the dials.

**Written:** 2026-07-15 (cloud co-pilot) · Stack: Express 5 + Drizzle + Postgres (Supabase) · Supabase Auth (JWT).

---

## 0. Current backend — honest inventory (what actually exists)

Read from `backend/src/` on 2026-07-15:

| Area | State | Notes |
|---|---|---|
| **Auth** | ✅ Supabase JWT via `requireAuth` → `req.userId` | All routes user-scoped. Solid. |
| **Saves (favorites)** | ✅ `favorites` table + CRUD | `recipeId` is an integer (TheMealDB id). |
| **User recipes** | ✅ `recipes` table + full CRUD | `source` = imported/manual; attribution (`sourceUrl`/`sourceName`) immutable. Ingredients = `[{measure, name}]` JSONB; steps = `[string]`. |
| **URL import** | ✅ `POST /api/import` → `importRecipe.js` | Deterministic schema.org JSON-LD parse, **SSRF-hardened** (DNS/redirect guards, byte cap). No LLM fallback. **Good foundation.** |
| **Plan (Otto's week)** | ✅ `plan_entries` table + CRUD | Loose day buckets, `cooked` flag, recipe snapshot. |
| **Account deletion** | ✅ `DELETE /api/account` | Deletes user rows; deletes auth user *if* `SUPABASE_SERVICE_ROLE_KEY` present (App Store 5.1.1(v)). |
| **Cron** | ✅ keep-alive job | Prod only. |

### What is NOT in the backend yet (the gap list)
- ❌ **Nutrition data of any kind.** No calories/macros/portion columns; the app's NutritionCard is fed **estimates, not computed truth.** ← the #1 ask.
- ❌ **Structured ingredient quantities.** `measure` is a *string* ("2 1/2 cups"); no `{qty, unit, item, grams}`. Blocks real scaling *and* nutrition.
- ❌ **Shopping list** — no table, no generation, no consolidation. (Plan exists; list does not.)
- ❌ **Reviews / ratings** — none.
- ❌ **Comments** — none (and no moderation kit).
- ❌ **Import beyond URL** — no photo OCR, no video/Instagram/TikTok extraction, no share-extension endpoint.
- ❌ **Recipe image upload** — `image` is a text URL; no Supabase Storage bucket for user photos.
- ❌ **Sharing** — no public share resolver, no story-card generation, no shopping-list share.
- ❌ **Apple Health (HealthKit) feed** — no "cooked → log nutrition" path (needs correct nutrition first).
- ❌ **Membership/IAP backend** — no RevenueCat webhook, no entitlement store, no server-side gate enforcement.
- ⚠️ **Content is TheMealDB-only** and lives entirely client-side (no `RecipeSource` adapter server-side). No bigger DB wired.
- ⚠️ **Live DB reality unknown** — the only linked Supabase project reads **INACTIVE** and oddly-named; **Phase B0 must confirm the real DB, run migrations, and verify RLS is ON** (Drizzle schema ≠ proof the live DB matches, and RLS is the actual per-user security boundary — `requireAuth` alone isn't).

---

## A. 🥇 Nutrition correctness pipeline (the hero)

**The problem:** "correct calories, macros, correct sizes, correct ingredients." Today none of
that is computed — it's guessed. Correct nutrition is a **pipeline**, not a column. The chain:

```
ingredient text ─▶ structured parse ─▶ food match + gram weight ─▶ per-ingredient nutrition
   {qty,unit,item}      (USDA/Edamam)                              ─▶ Σ ÷ servings ─▶ per-serving
                                                                   ─▶ confidence + honesty framing
                                                                   ─▶ cache on the recipe row
```

### A1. Ingredient parsing (the load-bearing wall)
Turn `"2 1/2 cups plain flour"` → `{ qty: 2.5, unit: "cup", item: "plain flour", grams: ~312 }`.
- Our `splitIngredientLine` already separates measure vs name — **extend it to a real parser**: numeric+fraction+range normalization (have the regex), unit canonicalization, and a **unit→grams** conversion table (density-aware for volume units).
- Options: open-source CRF **ingredient-parser** (NYT-style, self-host, free) or **LLM structured extraction** (Claude, one call per recipe, cached). **Recommend:** LLM extraction on save/import (we already lean on LLM elsewhere), cache the structured result on the row so it's a **one-time cost per recipe**, never per view.
- This single service unlocks **three** features: correct nutrition, **real ingredient scaling**, and **consolidated shopping lists**.

### A2. Nutrition data source — capability + cost (pick the turnkey path first)
| Source | What it gives | Cost | Fit |
|---|---|---|---|
| **Edamam Nutrition Analysis** | POST an ingredient list (natural language) → full nutrition + per-serving + total weight. Does parse+match+sum for you. | Metered, free dev tier, commercial gated | ✅ **Recommended for launch** — turnkey correctness, least code |
| **USDA FoodData Central** | Free per-food nutrition (350k+ items). You parse, match, convert to grams, sum yourself. | **Free**, gov | Best **cost-owned** path once volume grows; more engineering |
| **Spoonacular** | Recipes arrive **with nutrition attached**; also `analyzeRecipe` nutrition endpoint. | ~$149/mo+ at scale | Good if we also use it as a content source (§B) |

**Recommendation:** **Edamam Nutrition Analysis at launch** (compute once per recipe, cache), with the
architecture behind a `NutritionProvider` interface so we can swap to a **USDA-owned pipeline** later
for cost. For TheMealDB seed recipes: run each through the provider **once**, cache the result — never
live-call on view.

### A3. Storage + honesty
- New columns on `recipes` (and a parallel cache for seed recipes): `nutrition JSONB` =
  `{ kcal, protein_g, carbs_g, fat_g, fiber_g?, sugar_g?, sodium_mg?, per: "serving", basis_grams, source, computed_at, confidence }`.
- **Per-serving = total ÷ servings** (servings already on the row). "Correct sizes" = we store
  `basis_grams` (per-serving weight) so the card can say *"~420 kcal · per serving (~310g)"*.
- **Honesty (design system rule):** always framed as an **estimate** with a **confidence** signal.
  Low confidence when the parser hit unknown items → the card degrades gracefully ("Otto's rough
  estimate") instead of lying with false precision. Never a daily-goal contract (that's a diet app).
- **Recompute triggers:** on create, on ingredient/serving edit, and a backfill job for seed recipes.

### A4. Endpoints
- `POST /api/recipes/:id/nutrition/recompute` (owner) — force recompute.
- Nutrition returned **inline** on recipe GETs (cached) — no separate round-trip on view.
- Seed nutrition served via the content adapter (§B) with the same cache.

---

## B. Content / recipe data sources (more + correct data)

**Today:** TheMealDB only, client-side. **Goal:** more recipes, correct nutrition-bearing data, and a
clean seam to grow — without a rewrite.

### B1. The `RecipeSource` adapter (server-side)
Introduce one interface: `getById`, `search`, `filterByIngredient`, `randomBatch`. Adapters:
**TheMealDB** (now) → **Spoonacular/Edamam** (later). The app talks to *our* API, never a vendor —
so swapping/adding a source is a backend change only.

### B2. Capability matrix (what each can give us)
| Capability | TheMealDB | Spoonacular | Edamam Recipe |
|---|---|---|---|
| Catalog size | ~300 | 365k+ | 2.3M |
| Nutrition included | ❌ | ✅ | ✅ |
| Find by ingredient | basic (`filter.php?i=`) | ✅ `findByIngredients` | ✅ |
| Diets / intolerances | ❌ | ✅ | ✅ (health labels) |
| Meal-plan / shopping endpoints | ❌ | ✅ | ❌ |
| Cost | Free | ~$149/mo+ | Commercial gated |

### B3. Test-batch plan (validate the whole pipeline now)
Pull a **batch of ~50–100 recipes that already carry known-good nutrition** (Spoonacular or Edamam)
into a `seed_recipes` cache table, tagged `source: "spoonacular_test"`. Purpose: **prove the
NutritionCard renders correct calories/macros/portions end-to-end** against trusted data before we
commit to a paid tier. Keep it behind a flag; it's a correctness test-bed, not a launch dependency.
Define exactly which fields we ingest (title, image, servings, structured ingredients, steps,
nutrition, diet labels, source URL) — that field list becomes the `RecipeSource` contract.

**Recommendation:** stay TheMealDB + user imports as the growth engine (per v2 roadmap §1); wire the
adapter + run the **test batch** now to de-risk nutrition; defer paid content until discovery
analytics demand scale.

---

## C. Import — every channel (how each actually works)

Import is a **capture → extract → review → save** pipeline. URL already works; the others are new
extractors feeding the **same review/edit → save** path.

| Channel | Backend approach | Status |
|---|---|---|
| **URL** (web/blog) | schema.org JSON-LD parse (done) + **LLM fallback** on page text when no JSON-LD | ✅ core done; add LLM fallback |
| **Photo** (cookbook page, handwritten card) | Image upload → **OCR** (Apple Vision on-device *or* server OCR) → **LLM structuring** → draft | ❌ new |
| **Video / Instagram / TikTok** | **User-initiated via iOS share extension** (share post → Otto). Pull **caption + transcript** (+ a few frames) → LLM extraction. **Never scrape arbitrary accounts** (ToS/legal). | ❌ new; needs dev-build (leaves Expo Go) |
| **Manual** | Structured editor (see §D) | ✅ exists |

- **Every extractor returns a draft to the same `review/edit` screen** — extraction is never trusted
  blindly (honesty: "Otto's reading it — check his work").
- **LLM extraction service:** one server-side proxy, **rate-limited + budgeted**, structured-output
  (title, servings, `[{qty,unit,item}]`, steps, source). Feeds A1 parser for free.
- **Import meter** (free allowance) enforced server-side (§J) — manual creation always unlimited.
- ⚠️ **iOS share extension** is the gating dependency for social import — schedule the Expo→dev-build
  move (it also unlocks Rive for Otto animation).

---

## D. Create — improve on what we have

Current create is good (structured, attribution-safe). Upgrades:
- **Recipe photo upload** → **Supabase Storage** bucket (`recipe-images/{userId}/…`), not a pasted
  URL. Return a signed/public URL stored on the row. Add image validation (type, size, strip EXIF GPS).
- **Field parity so user recipes render like seed recipes:** enforce a shape of {title, image,
  servings, category, area, `[{qty,unit,item}]` ingredients, steps, optional time, optional video}.
  Nutrition auto-computes from ingredients (§A) so **user recipes get a real NutritionCard too**.
- **Structured ingredient rows** (qty/unit/item) in the editor — same shape the parser produces, so
  create and import converge on one schema.
- Draft autosave + validation (required: title + ≥1 ingredient; steps optional at save, per v2 §Phase1).

---

## E. Reviews & ratings

**Now honest (v2 UGC):** ratings on **user recipes** are real data — but **never on TheMealDB seed**
(no source data → don't invent stars). See `DISCOVER_SOCIAL_EXPLORATION.md`.

- **Schema:** `recipe_ratings (id, recipe_id, user_id, stars 1–5, created_at, unique(user_id, recipe_id))`.
- **The cook-then-rate gate (our differentiator):** a user may rate a recipe **only after** a `cooked`
  event exists for them on it (cook-mode finish / "I cooked this"). Display **"★ 4.6 from 12 cooks"** —
  meaningful + hard to game.
- **Aggregation:** store rolling `avg_stars` + `rating_count` on the recipe (or a materialized view);
  don't compute on every read.
- **Scope:** ratings visible only on **shared/public** recipes (needs the `visibility` flag, §G/social).
- **Moderation:** ratings are numbers (low abuse surface); the real moderation cost is comments (§F).

## F. Comments

- **Schema:** `recipe_comments (id, recipe_id, user_id, body, parent_id?, created_at, hidden_at?, hidden_reason?)`.
- **Moderation kit is NON-OPTIONAL (App Store Guideline 1.2 for UGC):** **report**, **block user**,
  **content filter** (profanity + an LLM/service pass on submit), and an admin action path. Ship the kit
  *with* comments or don't ship comments.
- **Phasing:** comments are **Phase 2 social** — they turn Otto into a social app and carry the
  moderation floor. v1 seeds identity only (author attribution + `visibility`), no public comments.
- Rate-limit writes; soft-delete (hide, keep for audit); notify on reply (later).

## G. Sharing (recipes + shopping lists)

Two very different shares.

### G1. Recipe share-out (to WhatsApp / Instagram / Messages)
- **Client** invokes the iOS share sheet — but the backend must provide a **shareable target**:
  - a **public share URL / resolver** (`/s/:token`) that renders an OG-tagged preview (title, image,
    "Made with Otto") so links unfurl in WhatsApp/iMessage;
  - **attribution travels** on the shared card (imported source stays credited);
  - only **user recipes the owner marked shareable** (or a deep link to a seed recipe) — respect `visibility`.
- **Story card (9:16):** generate a painted share card (preview-first, "Made with Otto" signature).
  Can be client-rendered or a small server image endpoint — decide in B-phase.

### G2. Shopping-list share (the wife→husband scenario)
Two models — **pick per the real use case:**
- **Snapshot link (recommended v1):** "Share list" → a **read-only** `/list/:token` snapshot (view +
  check-off locally, or "copy to my Otto"). Zero account needed for the recipient. Simple, no realtime.
- **Collaborative list (Phase later):** a shared list both accounts edit live (Supabase Realtime + a
  `list_members` table). Powerful (household sync) but adds realtime + conflict handling + invites.
- **Recommendation:** ship the **snapshot link first** (covers "send my husband the list"), design the
  schema so a `shared_with[]` upgrade to collaborative is additive.

---

## H. Shopping list (net-new subsystem)

Doesn't exist yet; it's the payoff of the ingredient parser (§A1).
- **Schema:** `shopping_lists (id, user_id, title, created_from, share_token?)` +
  `shopping_items (id, list_id, item, qty, unit, aisle, checked, source_recipe_ids[])`.
- **Generation:** "Build my list from this week/recipe" → gather structured ingredients →
  **consolidate** (sum same item across recipes: 2 + 3 cloves garlic = 5) → **group by aisle** →
  provenance line ("from Rigatoni + Curry"). Explicit push, never silent (v2 §Phase4).
- **Check-off** that never reorders mid-store; "your week changed — update the list?" (no silent rewrite).
- **Share** via §G2. **Membership-gated** (Otto Club) per the plan, but see the "Plan at launch" ruling.

---

## I. Apple Health (HealthKit) — *interpreting "Appy's Health"*

> **Interpretation flag:** I'm reading "Appy's Health" as **Apple Health / HealthKit**. Confirm — if
> you meant something else, this section retargets.

- **Value:** when a user **cooks** a recipe (cook-mode finish / "I cooked this"), offer to **log its
  nutrition to Apple Health** (energy, protein, carbs, fat). Turns Otto's nutrition into a real
  wellness signal and deepens retention.
- **Mostly a client integration** (HealthKit write happens on-device, needs entitlement + user
  permission, dev-build) — **but it depends entirely on the backend having correct per-serving
  nutrition (§A)**. Garbage nutrition → garbage Health data. So **§A is the prerequisite.**
- **Backend role:** expose correct per-serving nutrition + a **`cooked` event** (already have `cooked`
  on plan entries; add a general cooked-log so ratings + Health + "cooked" filter share one source of
  truth). Optionally read-back is not needed (write-only is the simple, private v1).
- **Scope:** Phase after nutrition is trustworthy; opt-in, write-only, per-serving portions the user
  actually cooked. Never write without explicit per-cook confirmation.

---

## J. Membership / IAP backend (enforcement)

Otto Club is frontend-only (pre-IAP waitlist). To actually charge + gate:
- **RevenueCat** (recommended) → **webhook** → `subscriptions (user_id, status, product, current_period_end, trial_end, updated_at)`; entitlement resolved server-side.
- **Server-side gate enforcement** for metered features (import allowance, save cap, Ask-Otto quota) —
  the client meter is UX; the **server is the source of truth** so limits can't be bypassed.
- **Trial reminder** (Day-4 push) wired to a real scheduled job (not a fake promise).
- Restore purchases, App Store server notifications, grace/billing-retry states.

---

## K. Cross-cutting backend concerns (the "above and beyond")

| Concern | What to do |
|---|---|
| **RLS** | Verify Row-Level Security is ON for every user table (defense-in-depth beneath `requireAuth`). Phase B0. |
| **Rate limiting** | Per-user + per-IP limits on import/LLM/nutrition/comment endpoints (cost + abuse). |
| **Cost governance** | Budget caps + caching for LLM extraction, nutrition API, content API. Cache-once-per-recipe everywhere. Alerting on spend. |
| **Storage** | Supabase Storage buckets (recipe images, share cards); size/type validation; **strip EXIF GPS**; signed URLs. |
| **Background jobs** | Nutrition backfill, seed refresh, rating aggregation, trial reminders, moderation queue. (cron infra exists.) |
| **Moderation** | Report/block/filter service for UGC (§F) — legal floor for launch of comments. |
| **Observability** | Structured logging (replace `console.log`), error tracking (Sentry), request tracing, per-endpoint metrics. |
| **Data / privacy** | Account deletion completeness (finish the service-role delete), GDPR export, data retention on soft-deletes. |
| **Idempotency & validation** | Zod-style validation on all writes; idempotency keys on import/create to avoid dupes on retry. |
| **API versioning** | `/api/v1` prefix before public share URLs exist (breaking-change safety). |

---

## L. Phased backend roadmap

Each phase is dependency-ordered. **B0 unblocks everything.**

- **B0 — Foundations & truth.** Confirm the live Supabase DB + run migrations + **verify RLS**;
  add `/api/v1` prefix; structured validation + logging/Sentry; the `RecipeSource` + `NutritionProvider`
  interfaces (empty adapters). *No user-visible change.*
- **B1 — Nutrition correctness (hero).** Ingredient parser (A1) → `NutritionProvider` (Edamam) →
  nutrition columns + cache (A3) → seed backfill + **the Spoonacular/Edamam test batch (B3)** to
  validate the card end-to-end. Real per-serving calories/macros/portions ship.
- **B2 — Create+ & structured ingredients.** Image upload (Supabase Storage), qty/unit/item editor,
  field parity, auto-nutrition on user recipes.
- **B3 — Import expansion.** LLM fallback for URL; **photo OCR**; then the **share-extension** +
  video/social extraction (dev-build). Import meter enforced server-side.
- **B4 — Shopping list + sharing.** Shopping schema + consolidation + aisle grouping; recipe share
  resolver/OG + story card; **shopping-list snapshot share** (wife→husband).
- **B5 — Membership backend.** RevenueCat webhook + entitlements + server-side gate enforcement +
  trial-reminder job.
- **B6 — Social + Health.** Ratings (cook-then-rate) → comments **with the moderation kit** →
  Apple Health write-on-cook. (Gated behind real UGC volume + the moderation floor.)

> Note the **"Plan at launch" ruling** (`REDESIGN_NOTES` Phase 10): Plan/shopping ships in v1
> **ungated**, so **B4's shopping list is pulled earlier** and gates under Club later (B5).

---

## M. Capabilities we need from each external service (checklist)

| Service | We need | Founder input |
|---|---|---|
| **Edamam Nutrition** | ingredient-list → nutrition + per-serving + weight | API id/key, plan tier, budget |
| **Spoonacular** (test/scale) | recipes w/ nutrition, findByIngredients | key (test tier free), budget if scaling |
| **USDA FDC** (later) | per-food nutrition (own the data) | free key |
| **LLM (Claude)** | extraction (URL fallback, photo, video) + Ask Otto | API key + monthly budget |
| **RevenueCat + Apple** | subscriptions/entitlements/webhooks | RevenueCat acct, IAP products, prices |
| **Supabase Storage** | recipe/share images | (already have Supabase) |
| **Apple HealthKit** | write nutrition on cook | dev-build + entitlement |
| **iOS Share Extension** | video/social import | dev-build (leave Expo Go) |

---

## N. Open decisions / dials (founder)

1. **Nutrition provider:** Edamam turnkey at launch (recommended) vs USDA-owned from day one?
2. **Run the paid-source test batch now** to validate correctness (recommended) — Spoonacular or Edamam?
3. **"Appy's Health" = Apple Health?** (assumed yes) — write-only nutrition on cook?
4. **Shopping-list share:** snapshot link first (recommended) vs collaborative realtime?
5. **Reviews scope:** cook-then-rate gate adopted (recommended) — v1 seed only, ratings in Phase B6?
6. **Content:** stay TheMealDB + imports, swap to Spoonacular only if analytics demand (recommended)?

*End — Otto backend roadmap. Pairs with `OTTO_V2_ROADMAP.md` (product) and `otto-v2-direction-and-structure.md` (data architecture origin).*
