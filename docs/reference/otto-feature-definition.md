# Otto — Feature Set, Redefined From Scratch

Built by taking the strongest core features across the 43 reference apps, filtering them through Otto's real constraints, and keeping only what earns its place. Opinionated. Assumptions flagged where they change the shape.

---

## 1. Best features across the references (distilled + ranked)

**Table-stakes (nearly every recipe app has them):**
- Browse/discover feed with a featured/editorial pick — *Epicurious, Kitchen Stories*
- Search + filter (category, time, ingredient) with a live-count sheet — *Beli, eBay, Vivino, Tasty*
- Recipe detail: photo → ingredients → steps → nutrition — *all*
- Save → a "cookbook/recipe box" — *universal (NYT, MFP, SideChef)*
- Serving stepper + US/Metric — *Kitchen Stories, SideChef, MFP*
- Account + subscription slot — *Julienne, ReciMe, ElevenLabs, Runna*

**Differentiators worth stealing:**
- Guided **cook mode** (big-type, one step at a time, keep-awake) — *Crouton, ReciMe, SideChef*
- **Estimated nutrition per serving**, framed as an estimate — *MyFitnessPal, NYT*
- Inline **video** where doubt starts — *Tasty*
- **"Cook with what you have"** ingredient search — *SmartThings Food, Blinkit*
- **Shopping list** built from a recipe's ingredients — *Crouton, ReciMe, Kitchen Stories, Tasty*
- **Meal planner / "for tonight"** hub — *Crouton, ReciMe, Tasty*
- **AI "Ask"** assistant — *Julienne, CREME*
- Graduated **collections** inside Saved — *Pinterest, SideChef, Julienne*
- **Mascot personality** across onboarding, celebration, error, empty, loader — *Duolingo, Yazio, Finch, Hopper, Alan*
- Subscription **upgrade card + Manage/Restore** — *Julienne, ElevenLabs, Duolingo*

**Traps (popular but wrong for Otto):**
- Ratings / social proof — no data → fake counts poison trust
- User-created recipes / Create tab — data is read-only
- In-app store / commerce tabs — no store
- Serving-scaled ingredient quantities — prose measures ("2.17 eggs")
- Full calorie **diary/tracker** — that's a different app (don't become MFP)

---

## 2. Otto's filters (what the data allows)

TheMealDB decides half the feature set:
- **Read-only, ~300 recipes** → no UGC, no ratings, no user recipes.
- **Has per recipe:** photo, category, area/cuisine, tags, ingredient+measure list (prose), instructions, one **YouTube link**.
- **No nutrition** natively → must be **estimated/computed** and labeled as such.
- **Filter endpoints exist** for category, area, and **by ingredient** → "cook with what you have" is genuinely buildable.
- **Prose measures** → scale the **nutrition estimate only**, never ingredient strings.

---

## 3. North star (the one differentiator)

**Otto's editorial voice + an AI cooking companion is the personalization & credibility engine that ratings/social-proof are for everyone else.**

Every other app leans on stars, hearts, and crowd counts to say "this is good / this is for you." Otto has none of that data — so the mascot *becomes* the recommender: "Otto's pick tonight," "Otto thinks you'll like this," and (Pro) **"Ask Otto"** — a chat that suggests recipes, swaps ingredients, and answers cooking questions in-character. That's the spine the whole feature set hangs on.

---

## 4. The feature set — redefined

### Core (v1, free)
1. **Discover** — greeting, persistent search pill, **Otto's pick** (editorial featured), illustrated category tiles, recipe grid.
2. **Search + filter** — query + category/area/time/ingredient chips, live-count sheet, Clear all.
3. **Cook with what you have** — pick ingredients → Otto finds matching recipes (uses the by-ingredient endpoint). *The free hook.*
4. **Recipe detail** — hero, flat ingredients (tinted quantities), inline video row, numbered steps, **estimated NutritionCard**, serving stepper (nutrition only) + US/Metric.
5. **Cook mode** — big-type step pager, keep-awake, swipe/Next.
6. **Save → Saved cookbook** — one paw vocabulary, flat grid, undo. (Free cap: e.g. 15 saves — the Pro nudge.)
7. **Account + subscription slot** — identity, reserved upgrade card, Units, support, legal.
8. **Otto mascot system** — onboarding (light taste pick), first-save celebration, error, empty, cold-start loader.

### Otto Pro (subscription)
1. **Ask Otto (AI)** — recipe suggestions, "what can I make with…", ingredient swaps, scaling help, dietary tweaks — in Otto's voice. *The flagship Pro feature.*
2. **Meal planner** — assign recipes to days ("Otto's week"); the natural 4th tab.
3. **Smart shopping list** — auto-built from a recipe or a week's plan; check off in-store.
4. **Unlimited saves + Collections** — folders inside Saved (chips over flat).
5. **Personalized picks** — "Otto's picks for you" tuned by taste pick + save history.
6. **Offline / cook-anywhere** — saved recipes + cook mode without signal.

### Roadmap (later, not v1)
- Cooking **streak** / "I cooked this" log + milestone celebrations (Finch/Duolingo) — engagement layer.
- **Timers** inside cook-mode steps.
- Collections **sharing**.
- **Widget** — "Otto's pick" on the home screen.

### Cut (and why)
- Ratings / reviews / hearts — no data.
- Create-your-own-recipe tab — read-only source.
- Commerce / store — no inventory.
- Serving-scaled ingredient amounts — unstructured measures.
- Full macro **diary/tracker** — scope creep into a different product; Otto shows per-recipe estimates, it doesn't log your day.
- Theme/appearance settings — light only.

---

## 5. Feature → tab map (how the app grows)

- **v1 (3 tabs):** `Discover · Saved · Account`
  - "Cook with what you have" lives **inside Discover** (a mode of search).
  - Shopping list (if it ships early) lives **inside a recipe / Saved**, not its own tab.
- **v2 (4 tabs), once planning ships:** `Discover · Plan · Saved · Account`
  - **Plan** absorbs meal planner + shopping list + "Ask Otto" entry.
  - This is the documented upgrade path — add only when the feature exists.

---

## 6. Free vs Pro line (the paywall)

- **Free:** browse, search, cook-with-what-you-have, full recipe detail, **cook mode**, save up to the cap. *(Cooking is never paywalled — that protects trust and reviews.)*
- **Pro:** Ask Otto AI · meal planner · smart shopping list · unlimited saves + collections · personalized picks · offline.
- **Paywall placement:** upgrade card at top of Account (free) → collapses to Manage/Restore rows (paying). Price lives on the paywall only.

**Assumptions to confirm:** (a) Otto is a *recipe & cooking companion*, not a nutrition tracker — nutrition stays per-recipe and estimated; (b) the paywall sits on *planning + AI + organization*, leaving core cooking free; (c) "Ask Otto" is the flagship Pro driver and worth the build. Change any of these and sections 4–6 shift.

*End — Otto feature definition.*
