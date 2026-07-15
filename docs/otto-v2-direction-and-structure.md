# Otto v2 — Direction & Structure

Working through your open questions: monetization, Instagram, importing/creating recipes, the database, and how all of it reshapes the tab bar, screens, and per-page elements. Recommendations are opinionated; open decisions flagged at the end.

**The big shift:** importing + creating recipes means Otto is no longer a read-only TheMealDB browser. It becomes **curated seed content + the user's own recipes**. That reverses three earlier "no" calls (no Create tab, no UGC, no ingredient scaling) — noted in the ledger below.

---

## 1. Three decisions

### 1a. Money — membership + 5-day trial
- "Membership with a free trial" **is** a subscription — same App Store mechanics (auto-renewable subscription, 5-day intro free trial). The good news: **one tier, not a Free/Pro/Plus ladder** — simpler to build and message.
- **The real fork is freemium vs hard gate:**
  - **Freemium (recommended):** core cooking stays free (browse, search, cook mode, save a few). Membership unlocks **create/import, meal plan + shopping list, Ask Otto AI, unlimited saves + collections**. → organic free users, App Store reviews, word of mouth, higher lifetime funnel.
  - **Hard gate (5-day trial → must pay):** simpler, but you lose all free-user growth and reviews; risky for a solo/indie launch.
- **Recommendation:** freemium, single membership ("Otto Club"), 5-day free trial as the intro offer on the paywall. Never paywall *cooking a recipe* — that protects trust.

### 1b. Instagram — split it in two (they're very different)
- **Share OUT (easy, v1, free):** user shares a recipe or their finished dish TO Instagram (Stories/feed) via the iOS share sheet. No API, no review, trivial. Ship this.
- **Pull IN (later, heavier):** show a user's own Instagram meal photos inside Otto. Reality check from current Meta policy:
  - The old **Instagram Basic Display API was permanently shut down Dec 4, 2024** — it's off, not deprecated-but-working.
  - The replacement is **"Instagram API with Instagram Login"** (consumer read access to a user's *own* profile + media), via OAuth, with token refresh and App Review.
  - You **cannot pull arbitrary/public accounts' photos** through any official API — access is scoped to the account that authorizes you.
  - So the feature is: *"Connect your Instagram → show YOUR food photos on YOUR Otto profile."* That's doable, but it **turns Otto into a social app** (profiles, feeds, following) — a big scope jump. Treat as a later phase, behind membership.

### 1c. Import + Create recipes (the Kitchen-Stories move — biggest change)
This is squarely in your AI wheelhouse and very buildable:
- **From a web link:** `recipe-scrapers` (open-source, MIT, ~646 cooking sites, reads schema.org/JSON-LD, Microdata, OpenGraph). Clean structured import for most recipe blogs. Fallback: LLM extraction on the page text.
- **From a photo** (cookbook page / handwritten card): OCR → LLM structuring into your recipe schema. Very doable with your stack.
- **From video / Instagram / TikTok:** pull the caption + transcript (+ a few frames) → LLM extraction. Keep it **user-initiated via the share sheet** (user shares the post *to* Otto) — don't scrape arbitrary accounts (ToS + legal gray).
- **Write it yourself:** a manual editor (title, photo, ingredients, steps, time, servings, category).
- **Consequence:** a **"+ Add" surface returns to the nav** — legitimate now that content is user-owned. This reverses the old "no Create tab" trap (which only held because data was read-only).

---

## 2. Data & backend architecture

**System of record — your own DB (you already have Supabase connected):**
- **Supabase** (Postgres + Auth + Storage + Row-Level Security) = users, saved recipes, **user-created/imported recipes**, collections, meal plans, shopping lists, Instagram connection tokens. This is the backbone once UGC is in.

**Seed / discovery content (pick one to start, scale later):**
- **TheMealDB** — free, attribution, ~hundreds of recipes. Fine to *launch* and prototype; too small to be the whole product.
- **Spoonacular** — ~365k recipes, deep tags/diets, **findByIngredients**, meal-plan + shopping-list endpoints, nutrition attached; self-serve free→~$149/mo, higher tiers ~$300+. The best "all-in-one" backbone.
- **Edamam** — ~2.3M recipes + best-in-class **NLP nutrition analysis** (turns an ingredient list into nutrition); products priced separately, commercial use gated on higher tiers.
- **Recommendation:** launch on TheMealDB (free), architect the recipe layer behind an interface so you can swap in **Spoonacular** for scale + by-ingredient + shopping without rewrites.

**Nutrition (compute your estimates):**
- **USDA FoodData Central** — free, government, 350k+ items — compute per-ingredient nutrition yourself; or
- **Edamam Nutrition Analysis** — plug-and-play NLP from ingredient text (metered).
- Recommendation: USDA + a parsing layer (cheapest, owns the data); Edamam if you want it turnkey.

**Ingredient parsing (this unlocks real scaling):**
- Use an ingredient parser (e.g. open-source **ingredient-parser** / NYT-style CRF, or Zestful paid) to turn `"2 tbsp smoked paprika"` → `{qty:2, unit:tbsp, item:smoked paprika}`.
- **This removes the old "can't scale ingredients" constraint** — with structured quantities you *can* scale amounts (snap to kitchen-real fractions), not just the nutrition estimate.

**AI (Ask Otto + extraction):** your own LLM stack (Claude/Elyoun) — recipe extraction from photo/video, "what can I make with…", swaps, and the in-character assistant.

**Search by ingredient — YES, add it.** Three paths: Spoonacular `findByIngredients`, TheMealDB `filter.php?i=`, or your own Postgres query over parsed ingredients. It's the free "cook with what you have" hook.

---

## 3. Updated tab bar + screen map

**Tab bar — 4 destinations + a center Add (5 slots):**
```
[ Discover ]  [ Cookbook ]  [ ＋ Add ]  [ (Plan*) ]  [ Account ]
   home         saved +        import/     meal plan +    identity +
   search       my recipes     scan/create  shopping*      membership
```
- **v1:** Discover · Cookbook · ＋ Add · Account (4 slots; Add is the center action).
- **v2 (with membership Plan):** insert **Plan** → 5 slots. *(Plan/shopping is a fast-follow, membership-gated.)*
- Labels always on. Cookbook keeps the paw. "＋ Add" is a filled center button.

**Screen count — ~26 screens for v1:**
- Global (4): splash/loader · onboarding taste-pick · sign up · sign in
- Discover (4): home · search active · filter sheet · by-ingredient search
- Recipe detail (2): detail · cook mode
- Add/Create (5): add menu · import-from-URL + review · scan-photo + review · share-in review · manual editor
- Cookbook (2): saved + my-recipes · empty
- Account (4): account home · membership/paywall · connected accounts (Instagram) · confirm dialogs
- Supporting states (5): celebration · error/offline · empty · search-empty · loading
- *(Plan + shopping list = +2 when membership ships)*

---

## 4. Per-surface elements (what's new / moved)

### Home / Discover — sections (top→bottom)
- Greeting (Otto stamp)
- **Search pill** + **"By ingredient" entry** (new — "what's in your kitchen?")
- **Quick actions row (new):** *Import a recipe* · *Scan a photo* — pulls the Add power onto Home
- Otto's pick (featured, editorial voice)
- Category tiles (illustrated)
- Recipe grid
- **"From your kitchen" (new, conditional):** the user's recent created/imported recipes

### Recipe detail — sections (new/changed marked)
- Hero + back + **paw-save** + **Share (new)** + **overflow: Edit/Delete (new, if it's the user's own)**
- Title + category/area + **Source attribution (new):** "Imported from allrecipes.com" / "By you"
- Serving stepper + US/Metric — **now scales structured ingredient amounts too (upgraded)**
- Ingredients — structured, tinted quantities + **"Add to shopping list" action (new)**
- Video row (TheMealDB YouTube or the user's own)
- Numbered steps
- NutritionCard (estimate framing)
- Bottom bar: Save + Start cooking + **Add to plan (new, membership)**

### Account — elements
- Identity (Otto bust + email)
- **Membership card (new):** "Join Otto Club — 5 days free" ↔ collapses to **Manage membership / Restore** when subscribed
- **My recipes (new):** count + shortcut to created/imported
- **Connected accounts (new, later):** Instagram (for share/pull)
- Preferences: Units (US/Metric)
- Support: Contact us, Rate the app
- Legal footer: Privacy · Terms · version
- Sign out · Delete account (red, confirm) → ~8–9 rows

### ＋ Add — flow screens
- Add sheet: **Paste a link · Scan a photo · From a video/Instagram · Write it yourself**
- URL/photo/video → parse/extract → **review & edit** (fix ingredients/steps) → save to Cookbook
- Manual editor: title · photo · ingredients (structured rows) · steps · time · servings · category

### Cookbook
- Two segments: **Saved** (from Discover) + **My recipes** (created/imported)
- Collections chip row ("All · … · + New") — membership, later
- Empty state (Otto + book)

### Plan + shopping list (membership, fast-follow)
- Planner: assign recipes to days ("Otto's week")
- **Shopping list:** auto-built from a recipe or the week's plan; grouped by aisle; check off in-store
- **Shopping-list ruling: include it — but as a membership feature under Plan**, generated from ingredients (not a standalone tab). It's the strongest "planning" value driver behind the paywall.

---

## 5. Reversal ledger (what changed from the earlier spec, and why)
- **Create/Add tab: NO → YES** — content is now user-owned (import/create), so it's not a dead end.
- **UGC recipes: NO → YES** — the whole point of import/create.
- **Ingredient scaling: NO → YES** — a parser gives structured quantities; TheMealDB prose is no longer the only source.
- **Tabs: 3 → 4 (+Add), → 5 with Plan** — new real features earn the slots (the old rule: a tab must earn its place — now they do).
- **Data: TheMealDB-only → Supabase system-of-record + swappable content API (Spoonacular/Edamam) + USDA/Edamam nutrition.**
- Still holds: paw save vocabulary, estimate-framed nutrition, no fake ratings, Otto's voice as the recommender, cook mode in v1.

---

## 6. Open decisions to confirm
1. **Freemium vs hard trial-gate?** (I recommend freemium; cooking free, membership unlocks create/import + plan + AI.)
2. **Is Instagram v1 = share-OUT only, with pull-IN + profiles as a later social phase?** (Recommended — pull-IN makes Otto a social app.)
3. **Launch content: TheMealDB now, swap to Spoonacular at scale?** (Recommended.)
4. **Do we add the ingredient parser in v1** (enables real scaling + by-ingredient + shopping) or defer? (I'd do it early — it unlocks three features.)
5. **Is Plan/shopping v1 or fast-follow?** (I have it as the first membership feature after launch.)

*End — Otto v2 direction & structure.*
