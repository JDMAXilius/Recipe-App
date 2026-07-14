# 📸 Mobbin Comparison — our design vs. real professional apps

> **Purpose.** A side-by-side of every screen and component in our design against real, shipping iOS apps pulled directly from Mobbin. Each row: what we drew, the professional references (with Mobbin links), a verdict (validated / adjust), and the concrete change. This is the "direct references" pass — our design now traces to real patterns, not invention.

**Last updated:** 2026-07-14 · **Platform:** iOS · **Source:** Mobbin (pulled live via MCP)
**Pairs with:** [`REFERENCE_MAP.md`](./REFERENCE_MAP.md), [`DESIGN_RESEARCH.md`](./DESIGN_RESEARCH.md), and the wireframe artifact (v4).

---

## Headline takeaways

1. **Our core structure is validated.** Nutrition card, serving stepper, calorie-annotated cards, filter sheet, mascot onboarding, grouped Profile — all match what shipping apps do.
2. **Serving-scaling correction confirmed.** Kitchen Stories shows a serving stepper *and* a separate "Nutrition per serving" — exactly our v3 model (stepper scales ingredients; per-serving nutrition stays constant).
3. **Macro colors: no universal standard exists.** We must *choose* deliberately. Decision below.
4. **A few concrete tweaks** (filter "Clear all", US/Metric toggle on ingredients, calorie shown as number not just badge) pulled straight from the references.

---

## 1. Recipe Detail + NutritionCard

**Our design:** hero photo → NutritionCard (calorie ring + 3 macro bars) → serving stepper → ingredients → instructions.

**References:**
- [MyFitnessPal — recipe w/ "Nutrition Per Serving"](https://mobbin.com/screens/d7116fe0-5bed-4092-a095-78d6571ed3f4) — calorie ring (309 cal) + macros as **% and grams** (Carbs/Fat/Protein), "SHOW NUTRITION" expander, ingredients below. **Nearly identical to our card.**
- [BitePal — calories & macros card](https://mobbin.com/screens/1ac5fda3-e96e-45c7-aa0c-b2df907e3fd7) — big "306 kcal" + a single **segmented macro bar** + colored dots.
- [Alma — recipe with macros row](https://mobbin.com/screens/613b19b6-97a7-457d-838b-85daa967fd26) — Cals/Protein/Carbs/Fat as a 4-stat row with colored letter chips.
- [Yazio — recipe nutrition](https://mobbin.com/screens/1a739003-3276-4202-b928-60c7491a35d3) — calories + macros as a clean 4-column stat row + serving selector.

**Verdict:** ✅ Validated. **Adjust:** show the calorie **number** prominently (all refs do), and add **% of calories** next to macro grams (MyFitnessPal, Yazio). Consider an expandable "Show full nutrition" for detail-seekers without cluttering the default.

## 2. Serving stepper / scaling

**Our design:** `Serves [− 4 +]` scales ingredient quantities + recipe total; per-serving nutrition constant.

**References:**
- [Kitchen Stories — "4 Servings" stepper + "Nutrition per serving"](https://mobbin.com/screens/1e04386d-385e-4207-af18-7ef9a73cdba8) — **confirms our exact model.** Stepper scales ingredients; nutrition is labeled per serving.
- [SideChef — "⊖ Serves 4 ⊕" + US/METRIC toggle](https://mobbin.com/screens/7ac8d2d6-091c-4b4c-978d-39ed5819fd8e) — stepper with a **unit toggle** and ingredient thumbnails.
- [Tasty — "Ingredients for 4 servings [− 4 +]"](https://mobbin.com/screens/56114dae-eacd-45f0-8e05-d7853d4b3248) — quantities update inline.
- [Cherrypick — "2 servings · £0.89 per serving"](https://mobbin.com/screens/8ee90d9b-82ac-4d81-a51a-43f7299d40f5) — per-serving framing.

**Verdict:** ✅ Strongly validated. **Adjust:** add a **US / Metric** toggle beside the stepper (SideChef, MyFitnessPal both have it).

## 3. Nutrition dashboard (macro colors decision)

**References:**
- [MyFitnessPal — macros stacked bars](https://mobbin.com/screens/d6f582ef-f707-4442-b394-81b20edf29b7) — **Carbs teal · Fat purple · Protein amber.**
- [Lifesum — daily intake bars + donut](https://mobbin.com/screens/90c2998a-343d-4ac3-87c6-a5a3bf5d4dd0) — donut: **Carbs orange · Protein blue · Fat purple.**
- [MacroFactor — nutrition targets](https://mobbin.com/screens/dcab9c97-1282-4e5c-9321-04a4178b8846) — **Protein, Fat, Carbs** each a distinct color, near-black theme.
- [Lifesum — nutrient distribution](https://mobbin.com/screens/86e3fefc-23e0-4072-94ef-9ab90af96c82) — protein/carbs/fat progress bars with on/off-track states.

**Finding:** **No universal macro-color standard.** The only near-consistent mapping is **Fat = purple** (MyFitnessPal + Lifesum both).

**Decision (adopted in v4):** align to the market and to our accent constraints —
| Macro | v3 (old) | **v4 (new)** | Why |
|---|---|---|---|
| Protein | violet | **blue `#3B82F6`** | matches Lifesum; distinct from paprika accent |
| Carbs | amber | **amber `#F0A020`** | common carbs color; unchanged |
| Fat | green | **purple `#8B5CF6`** | the one consistent real convention (MFP + Lifesum) |

Bonus: freeing **green** from "fat" lets green stay the **Keto** niche accent later without collision.

## 4. Home / Discover

**Our design:** mascot greeting → featured card (calorie badge) → category chips → 2-col annotated grid.

**References:**
- [Epicurious — "Featured Recipe" badge + hero + Recently Viewed](https://mobbin.com/screens/a9d5ee7a-4fab-46a3-9dba-54b96c3901a9) — **our featured pattern, confirmed.**
- [Kitchen Stories — "Most loved" cards w/ heart count + cook-time overlay](https://mobbin.com/screens/056d0128-ca21-4cb4-bf93-dc3675268d5f) — time badge on the image corner.
- [SmartThings Food — ingredient chips + warm illustration + horizontal cards](https://mobbin.com/screens/551eea06-bf93-4f3c-a046-6161ff67db7d) — "Cook with your ingredients" chips.
- [CREME — dark editorial recipe home](https://mobbin.com/screens/7072129c-7408-4575-8cf4-523b55368b2c) — a bolder aesthetic reference.

**Verdict:** ✅ Validated. **Adjust:** put **cook-time** as a small overlay on the card image (Kitchen Stories) in addition to calories.

## 5. Search + results (RecipeCard)

**References:**
- [Lifesum — search results with KCAL on every card](https://mobbin.com/screens/1c3c7dfd-bda9-4d65-9676-29b2a7eaab98) — **direct proof of our calorie-on-card idea** ("521 KCAL" under each).
- [Lifesum — recipes w/ "Healthy Eating / Healthy Fat" filter chips + kcal](https://mobbin.com/screens/5639803f-e6df-4f2f-bed9-62d582adec83).
- [Kitchen Stories — search + 2-col grid, heart + time overlay](https://mobbin.com/screens/2205ec6b-3699-471e-9efc-474e2d6eaad5).
- [Tasty — search w/ active filter chips ("Easy", "Dinner")](https://mobbin.com/screens/59fc284b-16a5-4e5f-bbd1-e53bef93e985).

**Verdict:** ✅ Validated. Our RecipeCard (calorie badge + macro dots) is well-supported; Lifesum shows calories can also sit as plain text under the title — either works.

## 6. Filter bottom sheet

**References:**
- [Beli — Category chips + "Sort by" segmented + filter rows + Clear all / Apply](https://mobbin.com/screens/c27fe90f-0cb3-47c8-86a6-add751526cee).
- [eBay — "Filters · 302 results" + chips + Clear all / Show results](https://mobbin.com/screens/53a7dde4-d8f7-49d1-8652-5be4d7b5b321).
- [Vivino — type chips + sliders + "Show 151 wines"](https://mobbin.com/screens/0fae75cc-f2e2-4a60-81f0-5ecacb1d2947).
- [eBay — sort + rating chips + toggle + "Show 9 results"](https://mobbin.com/screens/361b7444-343f-4e91-95cc-86ab23313c8c).

**Verdict:** ✅ Validated (our sheet already has chips + sort + live-count button). **Adjust:** add a **"Clear all"** action beside the Show button (every reference has it).

## 7. Onboarding + mascot

**References:**
- [Yazio — friendly green monster mascot + "Let's get your fit just right!"](https://mobbin.com/screens/9a6efc5b-a666-4afb-9364-8461cf84c44e) — **the closest to our concept** (soft creature, holding a measuring tape).
- [Alan — 3D blue bear mascot, "Time to warm up!"](https://mobbin.com/screens/71e53214-cb50-4566-aa9e-de155a561011).
- [Gentler Streak — heart character "Yorhart"](https://mobbin.com/screens/442e3bd8-7503-4976-937f-a1e5d8e43939).
- [Waterllama — illustrated bear, "Track your intake"](https://mobbin.com/screens/fd27a132-eaf0-4018-b32a-6c62e0749dab).

**Verdict:** ✅ Validated. The friendly-mascot direction is exactly what leading health apps do. Big centered character + headline + single primary button = the shared template.

## 8. Saved / Favorites

**References:**
- [MyFitnessPal — "Saved Recipes", 2-col, **calorie + bookmark per card**](https://mobbin.com/screens/cb979167-c4b2-43b2-a12f-a75329fb2515) — **matches our Saved wireframe directly.**
- [Blinkit — "Bookmarked Recipes" w/ category tags + cook time + bookmark](https://mobbin.com/screens/79aa1c32-5a42-4562-b60e-93f78f1f50e6).
- [SideChef — "My Saved Recipes" w/ Favorites/Collections/Meal Plans tabs](https://mobbin.com/screens/23e5088b-6e81-4c29-b0a3-3d3823811e27) — a richer organization idea for later.
- [NYT Cooking — "All Saved" w/ search + filter chips + ratings](https://mobbin.com/screens/304d5760-05ce-487a-8604-4c4f3e45fc1b).

**Verdict:** ✅ Validated. **Later idea:** SideChef-style sub-tabs (Favorites / Collections) if Saved grows.

## 9. Profile / Settings

**References:**
- [Viator — avatar + name + email, grouped "Account Settings" rows w/ chevrons](https://mobbin.com/screens/c08a2831-0812-43ca-b66b-a05f01280e67) — **our Profile layout.**
- [ChatGPT — Settings: avatar, Edit profile, grouped Account list](https://mobbin.com/screens/cb1e2e78-a7f7-4e76-a1e2-67d509361235).
- [Mimo — "Appearance", "Sound effects" toggle, "App icon" rows](https://mobbin.com/screens/7a3279ab-d654-423d-9114-fffbed248245) — confirms an **Appearance** row for theme.
- [Freenow — grouped Contact / More + "Change password", "Delete account"](https://mobbin.com/screens/d4e84caf-eee8-4988-aa95-8d851686cb9b).

**Verdict:** ✅ Validated. iOS grouped-list is the norm. Our Profile (avatar + email + Appearance/Units/Show-macros + Sign out) is on-pattern.

---

## Adjustments applied to the wireframe (v4)

1. **Macro colors** → Protein **blue**, Carbs **amber**, Fat **purple** (market-aligned; frees green for Keto).
2. **Filter sheet** → added **"Clear all"** beside the Show-results button.
3. Notes captured for next fidelity pass: calorie **number** + **% of calories** on the NutritionCard; **US/Metric** toggle on the serving stepper; **cook-time overlay** on card images.

## Not changed (deliberately)

- Overall IA, 4-tab structure, mascot direction, serving-scaling model — all validated as-is.
- Base **paprika** accent — no reference contradicts it; it stays distinct from macro colors and reads "food."

---

# 🧭 Tab structure & Account — research + recommendation (2026-07-14, cloud co-pilot)

> Focused Mobbin pull to settle the redesign's pivot: **what tabs should this app have?** (redesign pack D7) and **how does the Account tab hold subscription?** (D8). This section is the recommendation the terminal should build the navigation against.

## Evidence — real recipe/cooking-app tab bars

| App | Tabs (left→right) | Notes |
|---|---|---|
| [Epicurious](https://mobbin.com/screens/a9d5ee7a-4fab-46a3-9dba-54b96c3901a9) | **Home · Search · My Saved Recipes · Settings** | 4 tabs, no center action. The cleanest match to us. |
| [NYT Cooking](https://mobbin.com/screens/f70fda63-0996-4f66-b91d-2c11a5484912) | **Browse · Recipe Box · Recently Viewed · Search** | 4 tabs; "Recipe Box" = saved. |
| [Kitchen Stories](https://mobbin.com/screens/93270eaf-8b78-4e31-9250-ae0668b7e3da) | **Today · Search · ⊕ Create · Shopping · Profile** | 5 tabs, center "Create" (they support user recipes — we don't). |
| [Julienne](https://mobbin.com/screens/91185201-65b7-4062-8670-0c0e9c5e60c1) | **Discover · Recipes · ⊕ Add · Ask · Settings** | 5 tabs + "Pro ☀️" badge (subscription) top-right; "Ask" = AI. |
| [Tasty](https://mobbin.com/screens/8d50cb31-1687-423e-a520-7ee7b70f823d) | **Discover · Guides · My List · My Bag · Profile** | 5 tabs; shopping (My List/Bag). |
| [Mucho](https://mobbin.com/screens/323f8a15-a321-4967-ad31-a0f7c9330571) | **Profile · Recipes · ⬤ For Today · Products · Basket** | 5 tabs, commerce-heavy. |
| [CREME](https://mobbin.com/screens/715a96fa-90bc-4180-b8ba-1342b060bd0f) | **Home · Browse · ✦ · Cart · Profile** | 5 tabs, icon-only, center AI/remix. |

### Principles (what transfers)
- **Search earns its own tab** — 6 of 7 keep a dedicated Search tab. → *Do NOT merge Search into Home.* (This overrides the founder's "Search feels redundant" hunch — the redundancy is real but the fix is scoping, not removal; see below.)
- **A "Saved/Cookbook/Recipe Box" tab is universal.** → keep it, rename to something warmer than "Favorites."
- **4 tabs = clean browsers (Epicurious, NYT); 5 tabs = apps with a create/plan/commerce hub.** The 5th tab always earns its place with real function (Create, Shopping, For-Today, AI) — never filler.
- **Profile/Settings is the last tab and holds subscription.**

### Traps (what NOT to copy)
- **Center "⊕ Create"** (Kitchen Stories, Julienne, Mucho) — assumes user-generated recipes. **Our content is TheMealDB (read-only); a Create tab would be a dead end.** Skip it.
- **Commerce tabs** (Mucho Basket, Tasty My Bag) — we have no store. Skip.
- Icon-only bars (CREME) look sleek but hurt first-time clarity — keep labels.

## The real reason the current tabs feel redundant
It isn't that we have too many tabs — it's that **Home and Search overlap** (Home has browsing *and* the app also has a Search tab that browses), and **Favorites is thin**. Every 4-tab pro app avoids this by giving each tab a distinct job.

## ✅ Recommended structure — 4 tabs

**Home · Search · Cookbook · Account**

| Tab | Job (distinct, no overlap) | Ionicon | Otto |
|---|---|---|---|
| **Home** | *Browse/discover only* — Otto greeting, featured recipe, category filters, curated rows. **No search box here** (that's the Search tab's job). Keeps D9's featured+grid+filters. | `home` / `restaurant` | greeting (happy) |
| **Search** | *Intent-driven find* — query + filters + results. The dedicated tab the research demands. | `search` | thinking (empty query) |
| **Cookbook** | Saved recipes, richer than today's Favorites (collections later). "Cookbook"/"Recipe Box" reads warmer + more premium than "Favorites." | `book` / `bookmarks` | sad (empty state) |
| **Account** | Profile + **subscription** + settings (NO theme controls — light-only). | `person` | happy (badge) |

**Why 4, not 5:** we have no user-created recipes, no store, no shopping list *yet*. A 5th tab today would be filler — and the research says the 5th tab must earn its place. **Documented 5-tab upgrade path:** when we ship a **meal planner / "For You" personalized hub** (a natural subscription value-driver) or a **guided Cook mode**, add it as the center/4th tab → `Home · Search · [Plan/Cook] · Cookbook · Account`. Don't add it before the feature exists.

**Save action = Otto paw mark (D3)**, but the **Cookbook tab icon stays a standard book/bookmark** (recognizability > cleverness on nav).

## Account tab — contents + subscription (D8)

Evidence (near-universal pattern across [Slopes](https://mobbin.com/screens/df9c89b7-6093-4480-b454-fd7261dc3ebd), [Runna](https://mobbin.com/screens/27e968a9-ce87-4e7b-ac11-742fc3febb26), [ElevenLabs](https://mobbin.com/screens/3d335c1f-c269-4328-9c7a-503e52c6a0d3), [MS Copilot](https://mobbin.com/screens/a2da43d2-6ca3-4ba3-995c-28ec9356ceee), [Coffee Meets Bagel](https://mobbin.com/screens/298b5ad8-0f91-448a-953d-7cff2624d3d8)):

1. **Identity block** — Otto avatar + email + "Edit profile".
2. **Upgrade card** (the subscription hook) — right under identity: "Try Otto Pro" + CTA + price ("then $X/yr"). Slopes/Runna/ElevenLabs all lead the account with this. A small **"Pro" pill** can also sit on Home (Julienne).
3. **Settings rows** (grouped, chevrons) — Notifications, Units (metric/imperial), About, Help, **Manage subscription / Restore purchases** (ElevenLabs). **No Appearance/Theme/Niche row** (D2, light-only).
4. **Sign out** (destructive, near bottom).
5. **Footer** — Privacy · Terms · FAQ (Copilot).

## → Copy-paste for the terminal (build against this)

```
Navigation decision (from docs/MOBBIN_COMPARISON.md tab-structure research):
Ship a 4-tab bar: Home · Search · Cookbook · Account (Ionicons: home/restaurant, search,
book/bookmarks, person). Each tab has ONE distinct job — Home is browse-only (no search box;
keep featured+categories+grid+Otto greeting), Search owns querying+filters, Cookbook is the
renamed+richer Favorites, Account holds profile + a subscription Upgrade card + settings (NO
theme controls — light only). Do NOT add a center "Create"/commerce tab (our content is
read-only TheMealDB). The save/favorite ACTION uses the Otto paw mark, but the Cookbook tab
icon stays a standard book/bookmark. Account layout: identity → Upgrade-to-Pro card → settings
rows (Notifications, Units, Manage subscription, About/Help) → Sign out → Privacy/Terms footer.
Future 5-tab path (only once the feature exists): add a Plan/Cook hub as the center tab.
```
