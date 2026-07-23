# 🔍 Frontend Audit — Pre-Redesign (Phase 1)

> **Purpose.** Diagnosis of the shipped frontend, screen by screen, against the 6 quality bars
> (Motion · Illustration · Haptics · Icons · Taste · Token-purity). No solutions here — those are
> Phases 2–4. Extends the current-state map (`docs/current-state/`, Figma Current-State file).
>
> **Sources:** live captures in `docs/current-state/captures/`, code in `mobile/`, Figma
> current-state file. **Date:** 2026-07-14 · **Run:** autonomous (see `REDESIGN_NOTES.md`).

---

## Screen-by-screen

### Sign In
- **Job:** get a returning cook back into the app in <10 seconds, and make the brand's first impression.
- **Core features:** email + password, show/hide password, link to Sign Up.
- **Screenshot:** `captures/01-sign-in.png`
- **What works:** form is minimal (2 fields, 1 button); keyboard avoidance is handled; error paths exist; the terracotta button already reads on-palette.
- **What doesn't:** the hero is `assets/images/i1.png` — a **3D vinyl human chef in a purple apron**. It is the single most off-brand pixel in the app: wrong species, wrong medium (glossy 3D vs hand-painted), wrong palette (purple vs terracotta). "Welcome Back" is generic copy. No motion, no haptics. This is the first contact and the thesis statement — it currently states someone else's thesis.
- **Grades:** Motion **1** (none) · Illustration **1** (off-brand asset) · Haptics **1** (none) · Icons **3** (eye toggle fine) · Taste **1** (fails strip test — could be any template app) · Token-purity **4** (styles factory-driven).
- **Otto presence:** **absent** (replaced by an impostor chef).

### Sign Up
- **Job:** convert a curious visitor with zero friction.
- **Core features:** email + password (min 6), link back to Sign In.
- **Screenshot:** `captures/02-sign-up.png`
- **What works:** same minimal form; inline validation for password length.
- **What doesn't:** same off-brand 3D chef (`i2.png`); "Create Account" copy is generic; no promise of value (why sign up?). No motion/haptics.
- **Grades:** Motion **1** · Illustration **1** · Haptics **1** · Icons **3** · Taste **1** · Token-purity **4**.
- **Otto presence:** **absent**.

### Home ("Recipes" tab)
- **Job:** hand a hungry person one great answer fast, then let them browse.
- **Core features:** featured recipe card, category chips (TheMealDB thumbs), 2-col recipe grid, pull-to-refresh.
- **Screenshot:** `captures/03-home.png`, `captures/03-home-full.png`
- **What works:** featured card composition (image + overlay meta) is a solid concept (D9); category → grid flow is clear; grid density is right.
- **What doesn't:**
  - **The lamb/chicken/pig 3D renders** at the top (`lamb.png`, `chicken.png`, `pork.png`) are decoration with zero information, in a third visual style (3D-emoji) that clashes with both Otto and the food photography. Pure noise where a greeting/identity moment should live (D5 target).
  - Category chips use **TheMealDB photo thumbnails** — busy little photos inside pills; inconsistent crops; not ours (D5 target).
  - Featured meta shows fabricated cookTime/servings as fact.
  - Section title is just the raw category name ("Beef") — no voice.
  - Loading copy has a typo: **"Loading delicions recipes..."**.
  - No Otto anywhere on the app's front door.
- **Grades:** Motion **1** (static; only default pull-to-refresh) · Illustration **1** (wrong style×2) · Haptics **1** · Icons **3** (Ionicons consistent but generic) · Taste **2** (featured card saves it from a 1) · Token-purity **3** (inline `width:100` image styles; rgba overlays in styles).
- **Otto presence:** **absent**.

### Search
- **Job:** turn a specific craving or ingredient into results.
- **Core features:** debounced name search → ingredient fallback, results count, empty state.
- **Screenshot:** `captures/04-search.png`, `captures/05-search-results.png`
- **What works:** the name→ingredient fallback is genuinely good product thinking; debounce is right; results header gives feedback.
- **What doesn't:** visually it's Home minus the personality — same grid, no filters (category/cuisine exist in the API but aren't offered), "Popular Recipes" is actually random recipes (dishonest label). Empty state is a grey Ionicons magnifier — a dead end with no Otto and no suggested action. **Tab redundancy suspect #1** (see below).
- **Grades:** Motion **1** · Illustration **1** · Haptics **1** · Icons **3** · Taste **2** · Token-purity **4**.
- **Otto presence:** **absent** (his "Thinking" expression is literally designed for this screen and unused).

### Favorites ("Saved" tab)
- **Job:** re-find the recipes you already trust, instantly.
- **Core features:** grid of saved recipes, empty state with CTA.
- **Screenshot:** `captures/07-saved-empty.png`
- **What works:** empty state has a CTA ("Explore Recipes") that routes somewhere useful; grid reuses RecipeCard consistently.
- **What doesn't:** header says "Saved", empty state says "No **favorites** yet", detail button says "Add to **Favorites**", tab icon is a **heart** while detail-save is a **bookmark** — one concept, four vocabularies (see ledger). Empty state is a grey outline heart, not Otto-Sad (built for exactly this). No edit/remove affordance in the grid (must open each recipe). Alert.alert on load failure (no-ops on web).
- **Grades:** Motion **1** · Illustration **1** · Haptics **1** · Icons **2** (heart vs bookmark schism) · Taste **2** · Token-purity **4**.
- **Otto presence:** **absent**.

### Recipe Detail
- **Job:** a person with messy hands in a kitchen needs to know what to do next.
- **Core features:** hero image + gradient, back/save floating buttons, category/area badges, stat cards, NutritionCard (ring + macro bars + serving stepper), YouTube embed, ingredients list, numbered instructions, bottom save button.
- **Screenshot:** `captures/06-recipe-detail.png`, `captures/06-recipe-detail-full.png`
- **What works:** hero + gradient + serif-weight title moment is right; **NutritionCard is the best component in the app** (already on-system: ring, macro bars, stepper); ingredient/instruction content is complete.
- **What doesn't:**
  - **Redundant stat cards** (flagged by founder): "Prep Time 30 minutes" + "Servings 4" cards — both values are **fabricated** (`transformMealData` hardcodes them), duplicated by the featured card meta AND the NutritionCard stepper. Two cards of fake data above the fold.
  - **Rainbow gradient section icons** — four hardcoded gradient pairs (`#FF6B6B/#FF8E53` orange, `#4ECDC4/#44A08D` teal, `#FF0000/#CC0000` YouTube red, `#9C27B0/#673AB7` purple) that belong to no palette, ours least of all. Worst token-purity offense in the app (`app/recipe/[id].jsx:182–277`).
  - **Ingredient cards** are numbered (why?) with a decorative checkmark that isn't tappable — implies a checklist that doesn't exist. In a kitchen, that's a false affordance.
  - **Step cards**: "Step N" label appears twice per card (indicator + footer); the footer checkmark button does nothing.
  - Save is a **bookmark** icon up top but a **heart** + "Add to Favorites" below — same action, two icons, two words.
  - No serving-scaled ingredient quantities (stepper changes nutrition card only — ingredients don't scale).
  - `getYouTubeEmbedUrl` breaks on `youtu.be/` links (gotcha #8); WebView shows an error banner on web.
  - Kitchen test: tiny step text, no step-focus mode, checkmarks fake — fails "messy hands" hard.
- **Grades:** Motion **1** (no ring sweep, no transitions) · Illustration **1** · Haptics **1** (save has no feedback) · Icons **2** (bookmark/heart schism + rainbow gradients) · Taste **2** (NutritionCard alone earns the 2) · Token-purity **1** (worst in app).
- **Otto presence:** **absent** (save-success is his "Excited" moment, unused).

### Account ("Profile" tab)
- **Job:** confirm who I am, manage my session — and (soon) hold the subscription surface (D8).
- **Core features:** identity card (Otto badge + email), Appearance picker (Light/Dark/System), Theme picker (Otto/Lean/Keto/Bulk), Sign Out.
- **Screenshot:** `captures/08-profile.png`, `captures/09-profile-dark.png`
- **What works:** identity card structure (avatar + email + caption) is the right skeleton; grouped-card layout is on-pattern; haptics exist here (selection on pick) — the only screen with any.
- **What doesn't:**
  - **The entire Appearance section and Theme section must go (D2).** That's ~70% of the screen's content. What remains (email + sign out) is not a screen.
  - **MascotBadge crop cuts Otto's hat/head** (D6) — the circular crop beheads the chef hat, exactly the crop problem the founder flagged.
  - No subscription surface, no support/legal rows, no delete-account (App Store requirement when subscriptions arrive).
  - Sign Out uses `Alert.alert` — which no-ops on web (known RN-web quirk).
- **Grades:** Motion **1** · Illustration **2** (Otto present but badly cropped) · Haptics **3** (selection haptics exist) · Icons **3** · Taste **2** · Token-purity **4**.
- **Otto presence:** **decorative, damaged** (cropped badge).

---

## Cross-cutting flags (founder's specific asks)

### 1. Theme controls to remove (D2)
- `app/(tabs)/profile.jsx` — `APPEARANCE_OPTIONS`, `NICHE_OPTIONS`, both picker sections, `THEMES` import, `setNiche`/`setMode` usage.
- `context/ThemeContext.jsx` — runtime mode/niche switching + AsyncStorage persistence + system-appearance listener become dead paths at runtime (tokens stay in code per D2).
- `app.json` — `"userInterfaceStyle": "automatic"` must become light-locked or the OS will still flip system chrome.
- Dark captures (`09-profile-dark.png`, `10-home-dark.png`) document a mode that will no longer exist.

### 2. Tab redundancy (D7) — diagnosis only
- **Home vs Search:** both end in the same 2-col RecipeCard grid of TheMealDB results; Search's default state ("Popular Recipes") is literally Home's grid with a different random seed. Two tabs, one outcome.
- **Saved:** earns a place conceptually (different data source: user's own), but is a bare grid today.
- **Profile:** after D2 strips theming, it holds an email and a sign-out button — a screen with ~2 rows of content occupying 25% of the nav.
- Verdict to test in Phase 2: **4 tabs, ~2.5 earned.** Search-as-a-tab and Profile-as-a-tab are the weak claims; a merged Home+Search (search-in-home) and a slimmer Account are the obvious candidates — **Mobbin decides** (Phase 2).

### 3. Icon inventory (D5/D6)
**One family (Ionicons) but three visual languages on screen:** Ionicons glyphs + TheMealDB photo-thumbs (category chips) + 3D-render PNGs (farm animals, auth chefs). Mixed fill/outline within the family.

| Where | Icons in use | Verdict |
|---|---|---|
| Tab bar | `restaurant`, `search`, `heart`, `person` (all filled) | generic — replace per D7 outcome |
| Home | `time-outline`, `people-outline`, `location-outline`, `restaurant-outline` | meta icons OK for now; empty state generic |
| Home welcome | `lamb.png` `chicken.png` `pork.png` (3D renders) | **replace with Otto-style food art (D5)** |
| Category chips | TheMealDB photo thumbs | **replace with Otto-style food icons (D5)** |
| Search | `search`, `close-circle`, `search-outline` | fine, generic |
| RecipeCard | `time-outline`, `people-outline` | fine |
| Recipe detail | `arrow-back`, `bookmark(-outline)`, `hourglass`, `location`, `time`, `people`, `play`, `list`, `checkmark-circle-outline`, `book`, `checkmark`, `heart` | **12 icons, 2 metaphors for save, 4 rainbow gradients** — heaviest cleanup |
| Favorites | `heart-outline`, `search` | empty state should be Otto-Sad |
| Profile | `checkmark-circle`, `log-out-outline` | fine |
| Auth | `eye-outline`, `eye-off-outline` | fine |

**Custom-draw candidates (Phase 3):** favorite paw-mark (replaces heart/bookmark schism), macro glyphs, cooking-verb icons, 24px flat Otto for tab/nav (MASCOT.md §7.2 backlog).

### 4. Badge / app icon (D6)
- `assets/images/icon.png` (= appicon option B): Otto's face is whole and centered on terracotta — **acceptable base**, but the hat tip nearly touches the top edge; iOS corner masking will feel tight. Needs a padded recompose, not a regen.
- **The real crop bug is the Profile MascotBadge:** circular crop of `otto-happy.png` slices the hat clean off (visible in `08-profile.png`). Any circular use of the square portraits will do this — we need a badge-safe crop (face centered with headroom) as a distinct asset.
- `adaptive-icon.png`, `splash-icon.png`, `favicon.png` are **stock Expo placeholders** — not Otto at all.

### 5. Home emojis & Recipe Detail stat cards
Both confirmed above: farm-animal 3D renders (Home) and the two fabricated stat cards (Detail) are flagged for removal/replacement in Phase 4.

---

## Inconsistency ledger

| # | Inconsistency | Where |
|---|---|---|
| 1 | Save concept: heart (tab, bottom button, empty state) vs bookmark (detail top) vs "Saved" (tab label, favorites header) vs "Favorites" (empty copy, button copy, route name) | tabs, favorites, recipe detail |
| 2 | Three illustration styles: Otto watercolor / 3D vinyl chefs / 3D-emoji farm animals | auth, home, profile |
| 3 | Four rainbow gradients outside every token set | `recipe/[id].jsx:182–277` |
| 4 | Filled vs outline Ionicons mixed with no rule (tab bar filled; meta outline; detail both) | everywhere |
| 5 | Category chips = photo thumbs; every other chip = flat pill | home |
| 6 | Fake affordances: ingredient checkmarks + step "complete" buttons do nothing | recipe detail |
| 7 | Fabricated data presented as fact: "30 minutes", "4 servings" (×3 surfaces) | home featured, cards, detail stats |
| 8 | `rgba(0,0,0,…)` scrims/text-shadows hardcoded in style factories | home.styles, recipe-detail.styles |
| 9 | Typo "Loading delicions recipes..." | home loading |
| 10 | `Alert.alert` for errors/confirm — no-op on web | favorites, detail, profile, auth |
| 11 | Screen title styles vary (Profile/Saved have header titles; Home/Search have none) | tabs |
| 12 | `adaptive-icon`/`splash`/`favicon` still stock Expo | app.json assets |

## The 5 worst screens, ranked

1. **Recipe Detail** — the product's center of gravity and its worst screen: token-purity 1 (rainbow gradients), two fabricated stat cards, fake checklists, split save metaphor, no motion where motion matters most (ring sweep, save pop, step advance). Fails the kitchen test outright.
2. **Sign In / Sign Up** — first contact delegated to an off-brand 3D human chef. Cheapest fix, highest identity leverage (assets already exist in `mobile/assets/mascot/`).
3. **Home** — the front door: three visual languages (3D animals + photo chips + Ionicons), no greeting, no Otto, fabricated meta on the featured card.
4. **Account/Profile** — 70% of its content is scheduled for deletion (D2); what remains isn't a screen; the one Otto appearance in the whole app is a botched crop (D6); no subscription slot (D8).
5. **Search** — a redundant Home with less personality; dishonest "Popular" label; dead-end empty state; the tab whose existence Phase 2 must justify or fold.

## Priority order (argued)

1. **Tab bar / nav structure** — gates every other screen (D7); Phase 2's headline output. Nothing else can be final until the destinations are fixed.
2. **Recipe Detail** — worst screen × most-used screen = highest payoff; also forces the save-mark decision (paw), the motion spec's signature moment, and the nutrition-honesty rule into existence early, which every other screen then inherits.
3. **Home** — front door; receives the Otto food-icon set (D5), the greeting, and proves the design system at density.
4. **Auth pair** — identity thesis; near-pure asset+copy swap once the system exists; do both in one pass.
5. **Favorites** — inherits RecipeCard + paw-mark + Otto-Sad empty state; small delta after Detail.
6. **Account** — rebuild light-only + subscription slot (D2/D8); needs the Phase-2 account research.
7. **Search** (or its merged home) — whatever Phase 2 decides it becomes.
8. **Empty/error/success states** — swept last across all screens so Otto lands everywhere at once, consistently.

> Deviation from the pack's default order (auth #2): Recipe Detail is promoted above auth because it fails its job (kitchen test) while auth merely fails its brand. Function before face. Rationale logged in REDESIGN_NOTES.md.
