# 🗺️ Otto v2 — Roadmap (evidence-based)

> Synthesizes `~/Downloads/otto-feature-definition.md` + `otto-v2-direction-and-structure.md`
> against a fresh 5-agent Mobbin sweep (~45 searches: import/create flows, trial paywalls,
> planners+shopping, AI assistants in food apps, mixed-source libraries + share-out).
> Principles, not pixels. Full reference detail lives in the sections below; every claim links
> to a Mobbin screen. **Status: PROPOSAL for founder discussion — decision dials at the end.**

**Written:** 2026-07-14 · Companion to `MOBBIN_COMPARISON.md` (v1 research) and `REDESIGN_NOTES.md`

---

## 1. Verdict on the two direction docs

| Call in the docs | Verdict | Evidence |
|---|---|---|
| North star: Otto's voice + AI replaces ratings as the credibility engine | **ADOPT** | Julienne/CREME prove AI-as-recommender works; no reference needed stars ([Julienne Ask](https://mobbin.com/flows/7037c030-9502-444c-a95f-e2edc731797d)) |
| Freemium over hard trial-gate; never paywall cooking | **ADOPT** | Kitchen Stories keeps 7,500 recipes in the free column ([table](https://mobbin.com/screens/69690089-d01d-4918-a307-39642320e4b2)); Lex capping the core loop is the canonical rage pattern ([Lex](https://mobbin.com/screens/041aec93-c628-44da-8f52-80456d921236)) |
| Import/create pivot (URL, photo, share-in, manual) | **ADOPT** | It's ReciMe's entire category-winning core ([import loop](https://mobbin.com/flows/19d68d56-c76b-436a-847b-ee48b1568cbf)); Crouton/Kitchen Stories confirm |
| Center "＋ Add" slot | **ADOPT, with conditions** | Validated by ReciMe — but it must open a mode sheet, never claim a selected state, and **never be a paywall-only button** (see §3) |
| Membership-gated create/import | **AMEND** | Gate the *meter*, not the button: manual creation free forever, imports from a visible allowance ("3 of 5 left" — [ReciMe's ⚡5/5](https://mobbin.com/flows/a77744e6-eb6d-4134-8d89-b157856ab18e), [Otter's 3-free-imports modal](https://mobbin.com/screens/4e2aba0c-4b47-4a45-8510-610215eaa277)) |
| 15-save cap as the Pro nudge | **AMEND** | Evidence supports a cap ONLY meter-first + action-completing + never blocking viewing/cooking (NYT gates *organizing*, not *reading*). Cap the shelf, never the act. Dial in §6. |
| 5-day trial, single tier | **ADOPT** | One-tier + Free-vs-Plus comparison is the food-app norm (Kitchen Stories Plus, Julienne, ReciMe). Timeline paywall = the conversion pattern ([Blinkist](https://mobbin.com/screens/24f23d2d-d4cc-4e84-af13-20bb618cf1b0), [Vocabulary](https://mobbin.com/screens/32238af5-552f-4ac3-bede-16981f4c23d3), [Strava](https://mobbin.com/screens/40d104f8-8f25-4ae3-90eb-373e30e35acd)) |
| Instagram: share-OUT v1, pull-IN later | **ADOPT** | Meta API reality as stated; story-card anatomy well-proven ([Slopes](https://mobbin.com/screens/d3a22b7c-ad68-461d-9431-c945384e874f), [Beli](https://mobbin.com/flows/d77ff801-26fb-407e-a41-d2bde157913e)) |
| Ingredient parser early | **ADOPT** | Unlocks real scaling + by-ingredient + consolidated shopping ([Centr's summed quantities](https://mobbin.com/screens/a0a29ff5-6177-4395-bc61-37f166d9920b)) |
| TheMealDB now → Spoonacular later | **ADOPT + sharpen** | User imports ARE content growth; they may defer Spoonacular ($149/mo) indefinitely. Swap only if discovery-side analytics demand it. |
| Plan/shopping as first membership fast-follow | **ADOPT** | Strongest planning value driver; but design against the three abandonment traps (§5.4) |
| Tab "Cookbook" vs "Saved" | **REVERSAL P2-2** | With user-created recipes, "Saved" is inaccurate (your own recipes aren't "saved"). NYT precedent: verb **Save** + library tab (**Recipe Box**). → verb stays Save/Saved + paw; the TAB becomes **Cookbook** with segments All · Saved · My recipes. |

---

## 2. Canonical free / member line (reconciles the two docs)

**Free, forever:** browse, search, by-ingredient search, full recipe detail, **cook mode**,
share-out, manual recipe creation (unlimited), saves up to the shelf cap (meter-first),
Otto persona everywhere, 3 Ask-Otto answers/week, 1 collection.

**Otto Club (single tier, 5-day trial):** unlimited imports (URL/photo/video) · unlimited
saves + collections · meal plan + smart shopping list · unlimited Ask Otto + mid-cook help ·
personalized picks · offline cookbook.

**Never gated, ever:** viewing any recipe, cooking any recipe, the ＋ button opening,
manual entry, Otto's personality.

---

## 3. The five open decisions — answered

1. **Freemium vs hard gate → FREEMIUM.** (Evidence in §1.)
2. **Instagram → share-OUT v1** (link share + painted story card); pull-IN is a later social
   phase behind membership.
3. **Content → TheMealDB + user imports as the growth engine.** Architect the content
   interface now; hold Spoonacular until discovery data demands it.
4. **Ingredient parser → v1 of the pivot (Phase 0/1).** It is the load-bearing wall for
   scaling, by-ingredient, and shopping consolidation.
5. **Plan/shopping → first membership fast-follow (Phase 4),** shipped close behind the
   paywall so membership never sells a ghost.

---

## 4. Phased roadmap

### Phase 0 — Foundations (unblocks everything; no visible UI change)
- **Supabase schema v2:** `recipes` (owner nullable, `source` enum seed/imported/manual,
  `source_url`, `source_name`, structured `ingredients` JSONB `{qty,unit,item,note}`, steps,
  media, timings, servings, `cooked_at[]`), `saves` (user↔recipe refs — migrates `favorites`),
  `collections` stub. RLS per user.
- **Content interface layer:** one `RecipeSource` API; TheMealDB adapter behind it.
- **Ingredient parsing service** (backend endpoint → LLM structured extraction; parse
  TheMealDB prose lazily on first view; snap scaled amounts to kitchen-real fractions).
- Analytics events (save, import, cook-start/finish, paywall views) — the dials in §6 need data.
- **Founder inputs required:** Apple Developer + IAP products, RevenueCat account, LLM API
  key + monthly budget, support email, Privacy/Terms URLs (can be generated), price points.

### Phase 1 — The pivot: ＋ Add + Cookbook (free-led, the new heart)
- **Tab bar:** `Discover · ＋ · Cookbook · Account` — raised terracotta center action
  (opens sheet, no selected state).
- **Add sheet** (Otto-fronted, 4 intent modes): *Paste a link · Scan a page · Save from
  TikTok/Instagram · Write it myself* (manual below an "or" divider). Clipboard detection:
  "Otto spotted a recipe link — import it?" ([Crouton](https://mobbin.com/flows/24463139-4848-404d-a628-355680cdacae)).
- **Pipeline:** capture → input checkpoint (photo: Retake/Continue) → parsing state with
  honesty copy ("Otto's reading it — check his work") → **review/edit** → save to Cookbook.
  Failures: blame-free + one tip + "Write it myself instead" carrying over everything captured
  — no dead ends ([Instacart](https://mobbin.com/flows/da9cf0ac-db95-411d-88f7-25dca796abf6)/[IKEA](https://mobbin.com/screens/2ec2c58f-2df0-4ab3-b3df-1e50bc3213f8) triple).
- **One editor, two fill states** (AI-review = manual editor pre-filled;
  [Crouton](https://mobbin.com/flows/50cc937d-5c78-40dd-acd5-8a4bd8e375ed)): tokenized terracotta
  quantities, per-row delete/reorder, per-section re-scan, steps optional at save
  ([Yazio](https://mobbin.com/flows/ba3e0a46-62dd-4001-bb12-5acd1bc40474)), header "Did Otto get
  this right?" with source text quoted under low-confidence rows
  ([MyFitnessPal](https://mobbin.com/screens/fbfb02de-2388-4354-a88c-e761069da0b3)).
- **Cookbook tab:** segments **All · Saved · My recipes**; collection chips row below
  (later); one corner stamp per card: paw (saved) / source favicon (imported) / painted
  "By you" ribbon (created). Attribution rules: byline-slot credit, live link, non-deletable,
  "Adapted from…" when heavily edited, travels with shares
  ([Kitchen Stories](https://mobbin.com/screens/86533b7b-2d9c-4db3-bfa1-fc53a3f2351f)).
- **Real ingredient scaling** on structured recipes (parser-powered; prose-only recipes keep
  nutrition-only scaling).
- **Share-out v1:** share icon on detail → link + painted 9:16 story card (preview-first,
  2–3 variants, "Made with Otto" signature, attribution on its face;
  [Slopes anatomy](https://mobbin.com/screens/d3a22b7c-ad68-461d-9431-c945384e874f)).
- **Import meter live from day one** (free allowance visible in the Add sheet) — the wall
  arrives in Phase 2 but the meter teaches it first.
- ⚠️ **Dev-build transition:** the iOS share extension (share-IN from TikTok/IG) requires
  leaving Expo Go for a development build. Schedule it here; it also unlocks Rive later.
  Web/manual/URL/photo modes work before the extension lands.
- **Teaching share-in by doing:** deep-link into TikTok/IG to practice the share once, shown
  contextually after the first successful URL import ([ReciMe guides](https://mobbin.com/flows/aee9818c-e142-4225-a12e-7ead3fe18d5a)) — never banner-bomb Discover.

### Phase 2 — Otto Club (membership)
- RevenueCat + IAP products; **timeline paywall** in Otto's voice: benefits (4 rows, painted
  icons, above the fold) → Today/Day-4/Day-5 timeline with **real date + real total** →
  "Remind me before it ends" toggle default ON (wired to a real push) → annual-preselected
  price block → "Start my 5 free days" / "No charge today · Cancel in 2 taps" → Restore ·
  "How do I cancel?" answered inline ([Blinkist](https://mobbin.com/screens/24f23d2d-d4cc-4e84-af13-20bb618cf1b0)).
- **Trigger map:** skippable onboarding-end paywall ([Alma](https://mobbin.com/flows/afe2cc2a-7672-43f7-b75c-15c1f369a52)) · contextual mini-sheets on gated features ([Todoist](https://mobbin.com/screens/de2f0933-d78b-42f7-bdab-0e83b57ef03e)) · Account membership card (card free ↔ Manage/Restore rows paying) · meter-exhaustion walls that still complete the current action ([Otter](https://mobbin.com/screens/4e2aba0c-4b47-4a45-8510-610215eaa277)).
- Gates ON per §2. Delete-account + legal rows ship here (App Store requirement).
- Trial-reminder push (expo-notifications) — the Day-4 notification must actually fire.
- No shame-copy anywhere; dismiss = "Not today" (anti-pattern: [Waterllama's "IGNORE THIS FACT"](https://mobbin.com/screens/9c1a3f00-3584-49e3-a15f-7e643e25dac9)).

### Phase 3 — Ask Otto (the flagship)
- **Entry points ranked:** (1) contextual verbs sheet on every recipe — *Swap something ·
  Make it fit my diet · Make it easier · Ask Otto anything* + per-ingredient swap
  ([ReciMe tweaks](https://mobbin.com/screens/08a3b75e-ce2c-46de-9d0a-2446ea46ba66) ×
  [CREME pills](https://mobbin.com/screens/d2f83471-26e9-4d91-830e-c58327a643b9));
  (2) Otto on Home with fridge-photo input; (3) **cook-mode "paw raise"** — mid-cook help is
  genuine whitespace (no app on Mobbin does it); (4) chat-as-destination only later, packaged
  as named scenarios ([Duolingo Lily](https://mobbin.com/flows/7511e23c-104d-46e1-945a-ceb851f4fbe9)).
- **Results are objects, not paragraphs:** 1–2 sentence Otto bubble + real recipe cards with
  Save/Cook/Another idea; substitutions render as an edited recipe with a visible diff
  ([Julienne](https://mobbin.com/flows/7037c030-9502-444c-a95f-e2edc731797d)).
- **Deterministic stays deterministic:** scaling/units/timers = instant steppers, zero LLM.
- **Free taste:** 3 answers/week, full quality; the gate arrives as a message from Otto
  *inside the thread* ([Grok pattern](https://mobbin.com/flows/660988f4-77ed-4c5e-ad76-4c868171c5f8)) — never a modal over his face; never per-message coin-slots ([Replika anti-pattern](https://mobbin.com/flows/eb05d42b-2165-47e1-aa1d-4aa70fd6724b)).
- **Guardrails:** safety/allergens in plain UI (never in-bubble); numbers never in character;
  errors/limits = one Otto sentence then pure function. Server-side LLM proxy + fair-use cap.

### Phase 4 — Plan + shopping list (membership)
- 5th tab slot: `Discover · Cookbook · ＋ · Plan · Account`.
- **Plan:** vertical day cards, loose buckets (no meal slots; opt-in labels), notes allowed,
  assignment from plan (+ sheet) or detail ("Add to Otto's week"), today's card distinct,
  "What's cooking tonight?" surfaced on Discover, light "Cooked it" state
  ([Crouton](https://mobbin.com/flows/3d70e281-7384-4810-afb1-1c8385a2ae10) /
  [Cherrypick](https://mobbin.com/screens/bf3b0936-aafc-49d2-ab1a-327c4f73b697)).
- **Shopping list:** explicit push ("Build my list from this week" → toast + count), source
  recipes as removable chips, aisle sections + inline add-item, **one row per ingredient with
  summed quantities** + provenance line, whole-row check-off that never reorders mid-store,
  "Your week changed — update the list?" — never silent rewrites
  ([ReciMe](https://mobbin.com/screens/1a349865-19f7-4c7c-b862-1ed4a6a09c3c) /
  [Centr](https://mobbin.com/screens/a0a29ff5-6177-4395-bc61-37f166d9920b) /
  [Kitchen Stories](https://mobbin.com/flows/8c74a0f5-c330-413e-96c1-59a8487cdda2)).
- **Abandonment traps designed against:** no forced granularity (a 2-dinner week looks
  finished; empty days = painted invitations, not gray guilt) · first win in one tap (tonight
  + a list in 10 seconds) · no silent plan↔list desync.

### Phase 5 — Growth layer
- "I cooked this" photo at the **end of cook mode** (celebrate → snap → optional share;
  [Blue Apron](https://mobbin.com/screens/4ab90eb0-f61f-4a65-9e9e-5e37b9b07732)); private
  journal life before any public one. Cooked filter chip in Cookbook.
- Streaks/milestones (Proud Otto), home-screen widget ("Otto's pick"), collections sharing
  (links only for imported content — attribution travels), Instagram pull-IN (the social
  phase, membership), Spoonacular swap if discovery analytics demand scale.

---

## 5. Design rules bank (per surface — the caveats)

1. **Add flow:** the ＋ always succeeds at something; pretty parse-previews hide errors —
   review must surface them ("looks done, must be right" is the watercolor risk); educate the
   share-in habit by doing, once, contextually.
2. **Paywall:** dates and dollars, not adverbs; the reminder is a feature, not a promise;
   make leaving easy everywhere; benefits framed as additions, never free-tier deprivations.
3. **Caps:** the meter always precedes the wall; the wall never blocks viewing/cooking; the
   current action always completes when allowance remains.
4. **Planner:** structure is earned, not imposed; the payoff moment is 5pm, not Sunday;
   provenance is the sync model.
5. **AI:** output = objects that plug into existing verbs; personality is a garnish, never a
   preamble (especially mid-cook); character never delivers safety warnings or does math.
6. **Library/attribution:** source = author (byline slot, live link, immutable); one corner
   stamp per card; folders never hide food photography.

---

## 6. Decision dials (founder to confirm — defaults proposed)

| Dial | Proposed default | Notes |
|---|---|---|
| Save cap (free) | **15, meter from ~10** ("12 of 15 shelved") | Never blocks viewing/cooking; unlimited = Club |
| Import allowance (free) | **5 lifetime** (revisit vs 3/month with data) | Manual creation always unlimited |
| Ask Otto (free) | **3 answers/week** | Weekly refresh keeps the habit loop alive |
| Collections (free) | **1** | Structure is the member perk |
| Price | **$29.99/yr ($2.50/mo) · $4.99/mo** | Placeholder — founder sets; annual figure always shown at full size |
| Trial | **5 days**, reminder Day 4 | Timeline paywall prints the real charge date |
| Tab rename | **Saved → Cookbook** (paw icon stays; verb stays Save) | Reverses P2-2 on new information — needs founder sign-off |
| Plan timing | Phase 4, ≤6 weeks after paywall | Membership must not sell a ghost |

*End — Otto v2 roadmap.*
