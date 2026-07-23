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

- ~~Overall IA, 4-tab structure~~ — **superseded by Part 2 below (2026-07-14 redesign pass): 3-tab structure adopted.**
- Mascot direction, serving-scaling model — validated as-is.
- Base **paprika** accent — no reference contradicts it; it stays distinct from macro colors and reads "food."

---

# 🧭 Tab structure & Account — research + recommendation (2026-07-14, cloud co-pilot)

> ⚠️ **Reconciled:** this section arrived in parallel with the deeper Part 2 sweep below and
> the two disagree on the headline (4 tabs vs 3). Final ruling + rationale: **§2.1a in Part 2.**

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
- **Search** — ⚠️ **CORRECTION (see §2.1a):** my original claim here — "6 of 7 keep a dedicated Search tab" — miscounted my own table. It is **3 of 7** (Epicurious, NYT, Kitchen Stories), and all three are *editorial/human-curated* apps whose Browse is a genuinely different surface from Search. Our single undifferentiated TheMealDB pool can't supply two distinct jobs, so a browse-only Home + a Search tab render the *same grid* — the founder's redundancy. **The 3-tab decision (Discover · Saved · Account) is correct and supersedes the 4-tab recommendation below.**
- **A "Saved/Cookbook/Recipe Box" tab is universal.** → keep it, rename to something warmer than "Favorites."
- **4 tabs = clean browsers (Epicurious, NYT); 5 tabs = apps with a create/plan/commerce hub.** The 5th tab always earns its place with real function (Create, Shopping, For-Today, AI) — never filler.
- **Profile/Settings is the last tab and holds subscription.**

### Traps (what NOT to copy)
- **Center "⊕ Create"** (Kitchen Stories, Julienne, Mucho) — assumes user-generated recipes. **Our content is TheMealDB (read-only); a Create tab would be a dead end.** Skip it.
- **Commerce tabs** (Mucho Basket, Tasty My Bag) — we have no store. Skip.
- Icon-only bars (CREME) look sleek but hurt first-time clarity — keep labels.

## The real reason the current tabs feel redundant
It isn't that we have too many tabs — it's that **Home and Search overlap** (Home has browsing *and* the app also has a Search tab that browses), and **Favorites is thin**. Every 4-tab pro app avoids this by giving each tab a distinct job.

## ~~Recommended structure — 4 tabs~~ · SUPERSEDED → use the **3-tab** decision (Discover · Saved · Account), §2.1a
<!-- Kept for provenance. The 4-tab recommendation below was superseded after the count above was corrected (3/7, not 6/7). Build against the 3-tab decision in §2.1a. -->
### (historical) 4-tab recommendation

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

---

# Part 2 — Redesign pass (Phase 2, 2026-07-14)

> Second Mobbin sweep, run per-flow by parallel researchers for the full-frontend redesign
> (`docs/REDESIGN_PROMPT_PACK.md`). Principles, not pixels: every reference below is input.
> **Headline output: the new tab structure (§2.1).** Decisions logged in `REDESIGN_NOTES.md`.

## 2.1 THE HEADLINE — new tab structure: 3 tabs

**Decision: `Discover · Saved · Account` — Search merges into Discover; Profile becomes a
subscription-ready Account utility screen.**

The category evidence:

| App | Tabs | Search tab? | Saved | Account/sub |
|---|---|---|---|---|
| [Crouton](https://mobbin.com/screens/d4d42797-54ac-412b-a400-9b8441a91ebb) | 5 (Meal Plan·Recipes·Groceries·Discover·Settings) | No — field inside Recipes | "Recipes" IS the collection | Settings tab |
| [NYT Cooking](https://mobbin.com/screens/f96b49e6-64c1-4bc3-92f2-f94635f7a4e7) | 4 (Browse·Recipe Box·Recently Viewed·Search) | Yes (as category-grid screen) | Recipe Box tab | no tab at all |
| [Kitchen Stories](https://mobbin.com/screens/fd41b792-0f75-4213-9da2-b863d0502534) | 5 (Home·Search·Saved·Shopping list·Profile) | Yes | Saved tab (badged) | Profile tab |
| [Tasty](https://mobbin.com/screens/e2d0d450-0ed2-422a-b440-0091b38675f0) | 5 (Discover·Guides·My List·My Bag·Profile) | No — pill atop Discover | My List + Profile (dup = anti-pattern) | Profile |
| [ReciMe](https://mobbin.com/screens/72e23bee-94b6-443d-bde1-be8cbf025d5a) | 4+FAB (Cookbooks·Meal Plan·+·Groceries·More) | No — field inside Cookbooks | Cookbooks tab | More tab, crowned "Upgrade" top row |
| [Yazio](https://mobbin.com/screens/dfa3f35a-5d4c-4ca3-98c6-85226b9bee1a) | 4 | No — segments inside Recipes | segment of Recipes | Profile tab |

**Why 3 tabs:** dedicated Search tabs survive only in apps whose Home is human-curated editorial
(NYT, Kitchen Stories) — with TheMealDB our Home and Search collapse into the same grid, which is
exactly the founder-flagged redundancy (D7). Tool-like recipe apps embed search as a persistent
field (Crouton, Tasty, ReciMe, Yazio). Saved is a first-class tab in every recipe-first app.
Subscription needs a permanent, App-Store-compliant home → top row of Account (ReciMe's pattern).

**The three tabs:**
1. **Discover** (default) — greeting + persistent search pill + featured + illustrated category row + grid. Search's zero-state = the feed itself (Tasty pattern).
2. **Saved** — the cookbook. Named "Saved" not "Cookbook": one word, one mark, everywhere (§2.5 vocabulary). Badge for re-engagement later (Kitchen Stories).
3. **Account** — identity header, subscription slot top (card free / row subscribed), Units, support, legal, sign out. Named "Account", not "More"/"Otto's Pantry": honest label; "Pantry" collides with a plausible future shopping-list feature; "More" signals junk drawer (ReciMe's trap).

**Rejected:** (a) 2 tabs + header-avatar account (Lifesum/NYT) — buries the upcoming subscription
behind low-discoverability chrome and reads unfinished on iOS; (b) keeping 4 tabs with a
reimagined Search-as-category-browser (NYT) — still two tabs answering "find a recipe" from one
data source.

### 2.1a Reconciliation with the cloud co-pilot's 4-tab recommendation (above)

The co-pilot section above recommends **4 tabs (Home · Search · Cookbook · Account)** on the
principle "Search earns its own tab — 6 of 7 keep a dedicated Search tab." That count doesn't
hold against its own evidence table: of its 7 apps, only **Epicurious, NYT Cooking and Kitchen
Stories** actually show a Search tab; Julienne, Tasty, Mucho and CREME do not. Pooling both
sweeps (11 verifiable tab bars), dedicated Search tabs appear in **3 of 11** — and all three are
editorial apps whose human-curated Browse is genuinely a different surface from Search. We have
one undifferentiated TheMealDB pool: a browse-only Home and a Search tab would render the *same
grid*, which is precisely the founder-flagged redundancy (D7). "Distinct jobs per tab" is the
right principle — our data source just can't supply two distinct jobs. **The 3-tab structure
stands.**

Adopted from the co-pilot's pass (good calls): the **no-Create/no-commerce-tab traps**, keeping
**labels always visible**, the **documented upgrade path** (when a real plan/cook hub ships it
joins as a 4th tab: `Discover · [Cook/Plan] · Saved · Account` — never add it before the feature
exists), and explicit **Manage subscription / Restore purchases** rows in Account. Rejected from
it: "Edit profile" (we have no editable profile fields), price on the upgrade card (price is the
paywall's job — Julienne), and a generic book/bookmark tab icon for Saved — with always-on
labels, the paw-mark is disambiguated in the nav and reinforced by every recipe card.

**Tab icons:** custom watercolor-weight glyphs — outline at rest, filled terracotta active, labels
always on (category norm). Saved uses the **Otto paw-mark**. Personality through glyph shape
(Tasty's chef hat proves it), never through unreadable silhouettes.

## 2.2 Auth (flow research)

| Reference | Principle | Trap | Otto's version |
|---|---|---|---|
| [Duolingo welcome](https://mobbin.com/screens/fb4eda98-538d-4bc0-9ef6-bf06ed401c12) | Character carries the brand argument alone; copy = a promise + a fork (<10 words) | Quarter-height-mascot-on-white assumes fame; Otto needs one more sentence than Duo | Otto centered on warm cream, one value line, two buttons |
| [Alan "Hello!"](https://mobbin.com/screens/21080b03-a1f7-4113-8a57-b7dee60054d2) | Warmth = character scale × greeting gesture × brand-temperature background; re-pose per screen | At half-screen the character IS the layout — busy edges fight the form | Big waving Otto on terracotta-tinted wash for sign-UP only |
| [Mimo "You've been missed"](https://mobbin.com/screens/e855a5d0-c5b0-4017-90fd-bce3c7cbd62a) | Sign-in ≠ sign-up: returning users get smaller art + relationship copy | Heavy scenes on daily screens age fast | Small Otto vignette; headline does the warmth |
| [Cherrypick sign-up](https://mobbin.com/screens/47e648f7-cc2b-4338-9b4b-ff2f42e4109f) | Every auth screen states WHY in one concrete food sentence | Don't promise what the next screen doesn't deliver | "Otto will keep your recipes safe." |
| [Me+ peeking mascot](https://mobbin.com/screens/bc76fc99-0b0a-4213-a621-dbe955588cae) | Character-behind-the-sheet: present during entry, never competing | Peeking poses need purpose-drawn crops, not accidental clipping | Later idea; v1 uses vignette placement |

**Rules adopted:** two screens two scales (sign-up large Otto ~40%, sign-in small vignette); Otto
re-posed per screen never repeated; headlines = relationship + kitchen verb ≤7 words + one
reason-line (candidates: sign-up **"Pull up a stool."** / sub "Save recipes, plan dinners — Otto
remembers." · sign-in **"Back to the kitchen?"** / sub "Otto kept your place."); quiet filled
fields, exactly one saturated terracotta CTA; inline password hint not error-after-submit;
**design the keyboard-up state** — Otto either has a planned peek position above the keyboard
line ([Gentler Streak](https://mobbin.com/screens/542c5051-0737-4b34-b7fd-ca858571a6ee)) or exits
gracefully on focus ([Duolingo](https://mobbin.com/screens/45228113-e41b-4af3-b1d5-6b21f92b219b))
— never shoved half-offscreen; **one narrator voice across the whole pair** (mixing Otto's
first person with neutral system copy breaks the spell). **Not added:** social-proof counts,
speech bubbles on auth, fake SSO rows, name field, confetti.

## 2.3 Home / Discover (flow research)

| Reference | Principle | Trap | Otto's version |
|---|---|---|---|
| [Kitchen Stories greeting](https://mobbin.com/screens/14661437-d22a-45a6-9d49-5b451e314ed7) | Greeting = a moment (name + time-of-day + one warm beat), then the app serves food | Their greeting asks a question — a decision before value | "Good evening, Juan" serif + small Otto; no quiz |
| [Blinkit illustrated categories](https://mobbin.com/screens/c69b2710-70ee-46d4-b9bc-d221078385f1) | Illustrated category icons need: one unifying brand tint, art-scale size (~72-80pt), hard material contrast vs photo cards | Fixed 6-tile grid eats a viewport; icons at 24px chip scale lose the painting | Hand-painted food tiles, one warm tint, horizontal scroll row |
| [Epicurious featured](https://mobbin.com/screens/1dc6d7d5-4a4c-4cbd-bce5-8dc14237d442) | One editorial sentence under the hero = recommending, not enlarging; corner stamp = brand slot | Voice without personalization is decoration; don't mix caps-lock utility labels into a warm register | Otto stamp badge + "Otto's pick tonight" line |
| [SideChef grid cards](https://mobbin.com/screens/e3f9222e-1256-4477-b347-a48050c416b8) | One metadata layer ON the photo + one UNDER it; photo ≈70% of card | Five metadata elements per card = clutter at 2-col | Cream time-pill on photo corner + title below, nothing else |
| [Finch mascot band](https://mobbin.com/screens/529f7643-124b-4819-bb6a-34f941ab1816) / [Alan header](https://mobbin.com/screens/79e06348-ea2e-4666-85c2-5e1cc92a9f44) | Mascots live in reserved territory that content never enters; shrink as density rises | Finch spends 35% on the pet because the pet IS the product — food is ours | Otto band ≤15%, scrolls away; stamp-scale only below the fold |

**Rules adopted:** scroll rhythm greeting → search pill → featured → categories → grid (grid
filters in place, no navigation away); voiced sentence-case section headers in ONE register;
search pill styled warm ("What are we cooking today?"), not a grey utility bar.

## 2.4 Recipe Detail (flow research)

| Reference | Principle | Trap | Otto's version |
|---|---|---|---|
| [NYT recipe page](https://mobbin.com/screens/83f444f7-08a3-485a-ad7d-534f7fa699d6) + [nutrition note](https://mobbin.com/screens/d12c0dfd-a955-4508-a3e9-5e6220e52025) | Browsing and cooking are two modes/two surfaces; estimated nutrition says "estimate" in words at point of display | Tabbed sheets hide half a short recipe | One scroll; "Estimated per serving" caption on NutritionCard |
| [Crouton detail](https://mobbin.com/screens/fc2cd391-15e3-4072-bbb2-50247808e0ce) + [cook mode](https://mobbin.com/screens/d4f7df3b-0b48-4401-b10a-81fa1514dcff) | Emphasis via color on the DATA (quantities tinted), not container chrome; cook mode strips to the current sentence | Inline entity-tinting inside prose steps doesn't survive unstructured text | Flat ingredient list, terracotta quantities; cook mode pager |
| [Kitchen Stories scaling](https://mobbin.com/screens/5ea8f17e-de26-4717-9122-103b72e93c58) | Stepper scales in place; nutrition per serving as one quiet row is the "food not spreadsheet" baseline | "337½ ml" — recomputed fractions are false precision | Stepper scales nutrition estimate only; never ingredient strings |
| [ReciMe cook mode](https://mobbin.com/flows/430be35c-f111-45ca-bd89-d450071ffc77) | Cook mode can be just the step strings in a big-type pager with one Next button | "2.17 large eggs" — snap to kitchen-real or don't scale | v1 cook mode: Step N of M, 24pt+, giant Next, keep-awake |
| [Tasty video hero](https://mobbin.com/screens/3c5fff9f-11e2-4164-95b3-96024272da9a) vs [NYT inline row](https://mobbin.com/screens/b6d88612-9e8c-482b-8250-6dc53f579874) | Supplementary video = inline thumbnail row where doubt starts (above steps), sized to its importance | YouTube link-out in the hero slot breaks the messy-hands test; never autoplay | "Watch this recipe being made" thumb row between ingredients & steps |

**Anatomy adopted (top→bottom):** hero + scrim + back/paw-save → title + category/area (only TRUE
facts — both fabricated stat cards die) → ingredients (flat, tinted quantities, no checkboxes
while browsing, no numbers — no reference app numbers ingredients) → video thumb row → numbered
steps, generous type → NutritionCard with estimate framing (rounded "~420 cal") → persistent
bottom bar (Save + Start cooking). **Cook mode ships in v1** (decision logged — it is the
cheapest surface that actually wins the kitchen test).

## 2.5 Saved / Cookbook (flow research)

| Reference | Principle | Trap | Otto's version |
|---|---|---|---|
| [NYT Recipe Box](https://mobbin.com/screens/a9499b8c-8a22-4e53-b3f8-9ef5d1db1a99) | ONE verb ("Save"), one mark, everywhere; "Favorites" demoted to a folder inside Saved; organization offered AFTER the save | The full hub (carousel+folders+chips) before users have volume = empty-folder covers | Paw = the bookmark; folders later |
| [Pinterest Saved](https://mobbin.com/screens/6d5a71ca-8d1e-477c-a8a7-b312cda6ca8e) | Graduated organization: flat first, "All" preserved as system view, collections layered later | Three taxonomies of saved-nav = saving feels like filing | Flat grid v1; chip-row slot reserved |
| [MyFitnessPal Saved Recipes](https://mobbin.com/screens/cb979167-c4b2-43b2-a12f-a75329fb2515) | Flat grid works IF the card carries the mark (in-place unsave) + one metadata line | Instant unsave mis-taps need an undo toast, not a dialog | Filled paw on card corner; "Removed from Saved" + Undo |
| [Kitchen Stories Saved](https://mobbin.com/screens/9600552a-3d7a-465b-9467-f2580cf91399) | (cautionary) heart icon + "Saved" label + "favourites" folder = every surface re-teaches the metaphor | This is our current disease at scale | One word, one paw, zero exceptions |
| [Julienne chips-over-flat](https://mobbin.com/flows/939bfbfd-7b75-47fd-9344-4ebb400e5906) | Chips over a flat list = cheapest credible step toward collections | Only works if "All" stays first and default | Future: "All · <collections> · + New" in the reserved row |

**Vocabulary decision (kills ledger item #1):** verb **Save**, state **Saved**, screen **Saved**,
mark **Otto's paw-print** (outline=unsaved, inked=saved) on cards, detail, and tab. "Favorites"
retired from v1 UI entirely. Empty state: Otto + empty recipe book, "Nothing saved… yet" /
"Tap the paw on any recipe and Otto will keep it here." / one CTA "Explore recipes".

## 2.6 Account (flow research)

| Reference | Principle | Trap | Otto's version |
|---|---|---|---|
| [Julienne "Try Pro" card](https://mobbin.com/screens/edb1e117-85d7-437e-a488-ba374ca9cbf5) | One illustrated card at top of settings IS the marketing surface: one benefit line, no price (price = paywall's job) | The card must use the app's own palette/tone or it reads as adware | Otto-illustrated Pro card, terracotta, one line |
| [ReciMe crowned Upgrade row](https://mobbin.com/screens/72e23bee-94b6-443d-bde1-be8cbf025d5a) | Upsell as first row; position + one distinct icon carry all emphasis | Row upsell drowns if every row has colored icons | Only colored row on screen |
| [Duolingo subscription group](https://mobbin.com/screens/1eba1545-d0bb-4ba5-bbb7-a0f024acf4f3) | Named group whose contents swap by state: "Choose a plan" ↔ "Manage Subscription"; Restore purchases lives here; legal = footer links | Double-selling (banner + row) on one screen | State-swapped slot, single surface |
| [NYT Cooking settings](https://mobbin.com/screens/e05a5022-72da-4114-96e2-69956bb6cf95) | Email-as-identity + status word is enough; cancel is a quiet ordinary row | Log-out adjacent to cancel-subscription confuses destruction levels | Sign out separated from subscription group |
| [Fable footer identity](https://mobbin.com/screens/dea12ba1-6caf-4954-95a7-b46c3b93229c) | "Signed in with email" as passive text answers identity without faking a profile | Delete above Log Out invites fat-fingers | Sign out first, Delete last in red, confirm dialog |

**Row inventory adopted (v1):** Header = Otto bust badge + email + "SIGNED IN WITH EMAIL" (kept
from current) → [Subscription slot: hidden until paywall ships; layout reserves it] → Preferences:
Units (US/Metric) → Support: Contact us, Rate the app → Legal footer links: Privacy · Terms →
Account: Sign out, Delete account (red, confirm; ships with subscription per App Store rules) →
version footer. ~8 rows: minimal but legitimate.

## 2.7 Supporting states (flow research)

| Reference | Principle | Trap | Otto's version |
|---|---|---|---|
| [Finch streak takeover](https://mobbin.com/screens/aa4e5c2e-3cb5-48e5-8fa4-5441894d435a) | Celebration = character emotion + one big number + one exclamatory CTA, nothing else | Confetti as wallpaper; keep ~20 pieces at the edges | Proud Otto, sparse confetti, "Let's cook!" |
| [Duolingo loader](https://mobbin.com/screens/d06a7cb6-e99c-4f20-b99b-89fddc6fe44d) | Mascot loader = narrative device for once-per-flow waits, paired with a rotating tip | A mascot on every 300ms fetch becomes the most-resented asset | Sleepy Otto on cold start ONLY + cooking tip |
| [Hopper sad bunny error](https://mobbin.com/screens/765a7283-e069-4735-be22-eac25029b489) | Character takes blame physically, copy verbally; recovery action always present; characters NEVER in toasts | Sad mascot + guilt copy flips charm into blame | "We dropped the pan. Try again in a bit." |
| [Zomato search-empty](https://mobbin.com/screens/4d98c52d-4123-4353-ac8d-6abe5a586b8a) / [Telegram duck](https://mobbin.com/screens/e35cc22c-c770-4459-a4c8-691c4ad48095) | Search-empty fits above the keyboard; prop carries the joke; second sentence points forward; no button (keyboard IS the CTA) | Full-screen empty under an active keyboard | Thinking Otto (not Sad) above keyboard |
| [Waterllama circle chips](https://mobbin.com/screens/7bf86a04-c841-44d3-8710-4aa81476be90) + [LINE](https://mobbin.com/screens/dd8d61b5-98e1-4f0e-b28d-c845fe4d08d1) | Circle crops cut bodies, never headwear: bust asset, hat peak 8–12% below circle top, head 60–70% of diameter, crop exits bottom only, flat color disc behind | Center-cropping a full-body asset into a circle (our current bug) | Purpose-cut Otto bust badge asset |

**State→Otto map adopted:** full-screen Otto (25–35%) for first-run empties, offline/server
errors, milestone saves; small Otto (12–15%) for search-empty (Thinking) and in-panel empties;
NO Otto in toasts/snackbars/inline banners/confirm dialogs/routine fetch loading. Routine save =
plain "Saved" toast; Excited Otto reserved for the FIRST save.

## 2.8 Ten principles we adopt (ranked by impact)

1. **Merge Search into Discover; 3 tabs total** — kills the structural redundancy (Crouton/Tasty/ReciMe).
2. **One save vocabulary: Save/Saved + paw-mark everywhere** — kills ledger item #1 (NYT).
3. **Show only true facts; label estimates as estimates** — kills the fabricated stat cards and un-caveated nutrition (NYT).
4. **Cook mode v1 as a big-type step pager** — the cheapest surface that wins the kitchen test (ReciMe).
5. **Otto in reserved territory at two scales** — full at emotional beats, stamp elsewhere, never in toasts (Finch/Alan/Hopper).
6. **Illustrated category tiles at art scale with one unifying tint** — the D5 food-icon delivery vehicle (Blinkit).
7. **Grid cards: max one metadata element on photo + one below** (SideChef's trap inverted).
8. **Subscription = one state-swapped slot at the top of Account** — card free / quiet row paying (Julienne/Duolingo/ReciMe).
9. **Auth: two scales of Otto, headline does the relationship, one reason-line** (Alan/Mimo/Cherrypick).
10. **Emphasis via color on data (tinted quantities), not container chrome** (Crouton).

## 2.9 Three conventions we deliberately break

1. **No ratings/social proof anywhere** (every big app shows stars/hearts/counts): TheMealDB has no rating data and fake counts poison trust — our credibility device is Otto's editorial voice ("Otto's pick") instead.
2. **No ingredient checkboxes on the detail page** (SideChef/many): checkboxes while *browsing* are a mode lie; checking belongs to cook mode only (NYT agrees — sheet-gated).
3. **No serving-scaled ingredient quantities** (Kitchen Stories/Tasty/ReciMe all scale): TheMealDB measures are unstructured prose; "2.17 large eggs" is the industry's own counter-example. The stepper scales the nutrition estimate only, clearly framed.

## 2.10 Skeptics' corner (apps that are just polished defaults)

- **Yazio's recipe tab** — segmented Discover/Favorites inside a tracking app; fine, but its recipe browsing is a default grid with kcal badges — nothing to steal beyond what MFP already gave us.
- **Tasty's saved-in-two-places** (My List tab AND Profile segments) — polish over an unresolved IA; explicitly avoided.
- **Kitchen Stories' vocabulary** (heart icon / "Saved" label / "favourites" folder) — a great app shipping our exact current bug at scale; used above as the cautionary reference, not a source.
