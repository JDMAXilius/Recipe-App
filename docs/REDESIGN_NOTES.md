# 📓 Redesign Notes — Running Decision Log (autonomous run)

> Kept by the autonomous design+build lead per `docs/TERMINAL_AGENT_PROMPT.md`. Every call that
> the pack would normally route to the founder is decided here, with rationale, so the run never
> loops and the founder can review via git. Newest entries at the bottom of each phase section.

**Run started:** 2026-07-14 · **Mode:** full-auto (bypass permissions) · **Baseline commit:** `e6c685c`

---

## Phase 1 — Audit

- **A1. Audit scope:** graded all 7 shipped screens from captures + code (no live run needed for
  diagnosis — captures are from the live web build, code confirms behavior). Output: `docs/AUDIT.md`.
- **A2. Priority-order deviation (decision):** the pack's default screen order puts Auth at #2;
  the audit promotes **Recipe Detail** to #2 (after tab bar) and slides Auth to #4.
  *Rationale:* Detail fails its functional job (kitchen test) while Auth only fails brand; Detail
  also forces the paw-mark, motion signature, and nutrition-honesty decisions that every later
  screen inherits. Auth stays a cheap asset+copy swap whenever it lands. *Rejected alternative:*
  keeping pack order for auth-first identity impact — rejected because identity without a working
  core is lipstick.
- **A3. D6 reframed (finding):** the shipped `icon.png` (option B) is largely fine; the real crop
  bug is the **circular MascotBadge** slicing Otto's hat on Profile. Fix = badge-safe cropped
  asset + padded icon recompose, **not** a regeneration of the icon art.
- **A4. Stock Expo assets flagged:** `adaptive-icon.png`, `splash-icon.png`, `favicon.png` are
  still Expo defaults — added to Phase 4 asset work (Android adaptive + splash + favicon get Otto).

## Phase 2 — Mobbin research

Run as 7 parallel research subagents (nav, auth, home, account, saved, detail, supporting
states); ~50 searches, ~200 screens examined. Full output: `MOBBIN_COMPARISON.md` Part 2.

- **P2-1. NEW TAB STRUCTURE (D7 resolved): 3 tabs — `Discover · Saved · Account`.** Search
  merges into Discover as a persistent header search pill (its zero-state = the feed). *Why:*
  dedicated Search tabs only survive where Home is human-curated editorial; ours isn't —
  Crouton/Tasty/ReciMe/Yazio all embed search. *Rejected:* 2-tabs+header-avatar (buries the
  coming subscription; reads unfinished), 4-tabs with NYT-style Search-as-category-browser
  (still two tabs answering the same question from one data source).
- **P2-2. Saved tab named "Saved", NOT "Cookbook".** The nav researcher proposed "Cookbook"
  (storybook word); the saved-flow researcher proved the stronger rule: ONE word for the whole
  concept — verb Save, state Saved, screen Saved, mark = paw. Two words for one concept is the
  Kitchen Stories disease we're curing. Charm belongs to the paw-mark, not a second noun.
- **P2-3. Third tab named "Account", NOT "Otto's Pantry"/"More".** "Pantry" collides with a
  plausible future shopping-list/pantry feature and mislabels a settings surface; "More"
  signals junk drawer. Honest labels for utility surfaces.
- **P2-4. Save mark = Otto paw-print** (outline unsaved / inked saved) on cards, detail header,
  Saved tab icon. Heart AND bookmark both retired. "Favorites" removed from all v1 UI copy;
  the word is reserved as a possible future default-collection name (NYT pattern). Route/DB
  names (`favorites.jsx`, API) stay for v1 — rename is code churn with zero user value; noted
  for a later cleanup.
- **P2-5. COOK MODE ships in v1** (NEW feature; auto-approved here per operating mode). Scope:
  full-screen pager over the existing step strings — "Step N of M", ≥24pt text, giant Next,
  ingredients peek, keep-awake. No timers, no voice, no per-step images (v2). *Why:* it's the
  cheapest surface that actually wins the kitchen test; ReciMe proves the 3-screen version.
  The step-splitter improvement it needs benefits the detail page anyway.
- **P2-6. No serving-scaling of ingredient strings, ever** (TheMealDB measures are unstructured;
  "2.17 large eggs" is the category's own counter-example). ServingStepper stays but scales the
  nutrition estimate framing only.
- **P2-7. Nutrition honesty language:** "Estimated per serving" caption + rounded values
  ("~420 cal") + footnote. No %-of-daily-goals framing (that's a tracking-app contract our
  placeholder data can't sign).
- **P2-8. Otto state map:** full-screen (first-run empty, offline/error, milestone saves,
  Proud achievements) · small (search-empty = Thinking above keyboard, panel empties) · never
  (toasts, banners, dialogs, routine fetches). Sleepy Otto = cold start only, with a rotating
  cooking tip. Routine saves get a plain "Saved" toast + Undo.
- **P2-9. Badge crop spec (D6):** purpose-cut Otto BUST asset — hat peak 8–12% below circle top,
  head 60–70% of diameter, crop exits bottom only, flat warm disc behind. Fixes Profile badge;
  same logic recomposes the app icon padding.
- **P2-10. Auth copy directions locked:** sign-up "Pull up a stool." / "Save recipes, plan
  dinners — Otto remembers." · sign-in "Back to the kitchen?" / "Otto kept your place."
  Final strings settle in Phase 4 with the layout.
- **P2-11. Conflict with cloud co-pilot resolved (no silent overwrite).** While Phase 2 ran, a
  cloud session pushed a competing 4-tab recommendation (Home·Search·Cookbook·Account) to
  `MOBBIN_COMPARISON.md`. Its headline claim ("6 of 7 apps keep a Search tab") miscounts its own
  table (3 of 7 actually do). Pooled evidence across both sweeps: 3 of 11 verifiable tab bars
  have Search tabs — all editorial apps with human-curated Browse. **3-tab decision stands.**
  Adopted from it: no-Create/no-commerce traps, always-visible labels, future 4th-tab upgrade
  path (Cook/Plan hub), explicit Manage-subscription/Restore rows. Rejected: "Edit profile"
  (no editable fields exist), price on the upgrade card, generic bookmark tab icon for Saved.
  Full reasoning: MOBBIN_COMPARISON §2.1a.

## Phase 3 — Design system

- **P3-1. DESIGN_SYSTEM.md restructured:** Part A (v1) kept for token tables/traceability;
  **Part B appended as authoritative** (tokens incl. overlay scrims, typography, motion, haptic
  map, icon spec + 14-item food-icon set, Otto usage rules + voice, badge/app-icon fix,
  component deltas). D2 banner at top of file.
- **P3-2. Typography decision:** Part A specced New York + SF Pro Rounded — neither is
  reachable from RN without native font-descriptor work, and Figma already substituted Lora.
  **Display = bundled Lora (600/700), body = system font.** Aligns code with the Figma library
  exactly. *Rejected:* Georgia (reads dated), bundling a rounded body face (cost > benefit).
- **P3-3. Light-lock implemented:** `ThemeContext` pinned to `base.light` (same `useTheme()`
  read API — zero churn in consumers); `setNiche`/`setMode` removed (profile.jsx was the only
  caller); `app.json` `userInterfaceStyle: "light"`; Profile pickers stripped now (dead UI),
  full Account rebuild lands in Phase 4. THEMES dark/niche sets stay in colors.js per D2.
- **P3-4. New `constants/tokens.js`:** SPACING/RADIUS/OVERLAY/TYPE/SPRING/TIMING. Style
  factories migrate opportunistically in Phase 4 (no big-bang).
- **P3-5. Otto animation (D4) written as separate approve-first proposal:**
  `docs/OTTO_ANIMATION_PLAN.md` — recommends Rive; ships NOTHING now.
- **P3-6. Sign-out made web-safe** (`window.confirm` on web — Alert.alert no-ops there).
- **P3-7. Figma sync deferred to Phase 4's design pass** (one consolidated write session when
  the redesigned screens exist, instead of two half-syncs). **Library publish remains a manual
  founder step in the Figma UI** (noted since the DS build). Verified: app boots + renders on
  web with the lock + fonts (Chrome check).
- **P3-8. Deps added:** `@expo-google-fonts/lora`, `expo-keep-awake` (cook mode).

## Phase 4 — Screens

- **P4-0. Asset pack landed first** (gates everything): 14 food icons (512 webp, 332KB total),
  paw filled/outline (transparent, tintable), badge bust, padded icon/adaptive/splash/favicon.
  All committed; no expiring CDN links.
- **P4-1. TAB BAR + DISCOVER (one commit — the tab decision IS the merge).**
  *Plan:* 3 tabs (Discover restaurant-glyph / Saved paw / Account person), labels always on,
  selection haptics. Discover rhythm: greeting ("Good evening, chef" — no name data, "chef" is
  Otto's address) + small Otto → warm search pill → featured card (Otto's pick stamp, serif
  title, TRUE meta only: area+category) → illustrated category tiles → grid. Search-in-place:
  typing swaps grid to results (name→ingredient fallback kept), browse sections hide;
  Thinking-Otto empty state, no button (keyboard is the CTA). RecipeCard v2: photo ~70%,
  category pill (real fact — fabricated cookTime dropped from cards), title 2 lines, paw-mark
  with pop+haptics. NEW SavedContext: one favorites fetch, optimistic paw toggles everywhere.
  *Directions rejected:* pinned/sticky search header (fights the greeting moment; revisit if
  scroll-usage data demands); "Misc" tile dropped for a display-name map instead of renaming
  data. *Verified in Chrome:* sign-in → Discover render, search "tom yum" → 2 results, paw
  save → persisted through full reload ("Remove from saved"), tabs navigate. Capture:
  `docs/redesign/captures/01-discover.png`.
  *Grades:* Motion 3 (paw-pop signature in; entrance staggers deferred) · Illustration 5 ·
  Haptics 4 · Icons 4 · Taste 4 (strip test: painted tiles + serif + cream = ours) ·
  Token-purity 5.
  *Known gaps (for Phase 5):* no undo toast on unsave yet; deep-link /favorites lands on
  Discover after cold load (router redirect timing) — investigate in QA.
- **P4-2. RECIPE DETAIL + COOK MODE (one commit — cook mode is Detail's second surface).**
  *Plan:* §2.4 anatomy verbatim. Both fabricated stat cards deleted; badges = category+area
  (true). Ingredients = flat hairline rows, terracotta tabular quantities (new
  `ingredientPairs` in transformMealData), no checkboxes/numbers. Video = "See it made"
  tap-to-play thumbnail row (poster from img.youtube.com; web opens YouTube — also kills the
  RN-web WebView error banner); `getYouTubeId` now handles watch/youtu.be/shorts (gotcha #8
  closed). Method = plain numbered steps, 16/24 type, zero fake affordances. NutritionCard:
  "~420 EST./SERVING" + honesty footnote. Pinned bottom bar: paw + Start cooking.
  COOK MODE v1 (`recipe/cook/[id]`): progress segments, Step N of M, ≥24pt text, giant Next
  (56pt), ingredients peek panel, back-step, keep-awake, Medium impact per advance, finish =
  Proud Otto + "Dinner, done." + Success haptic.
  *Also:* transparent Otto cutouts generated for all six expressions (`*-cut.png`) — opaque
  cream plates no longer float on the bg; Discover greeting/search-empty and cook-finish now
  use cutouts.
  *Directions rejected:* NYT tabbed ingredients/prep sheet (hides half of a short recipe);
  hero-slot video (breaks messy-hands test; it's a YouTube link-out, not our player).
  *Verified in Chrome:* detail renders (Teriyaki Casserole), tinted quantities, video row,
  cook mode full run 6/6 steps → Proud Otto finish. Captures:
  `docs/redesign/captures/02-recipe-detail.png`, `03-cook-finish.png`.
  *Grades:* Motion 3 (paw pop + step transitions are instant-but-clean; ring sweep deferred) ·
  Illustration 4 (Proud Otto finish; detail itself correctly Otto-free) · Haptics 5 ·
  Icons 5 (rainbow gradients dead) · Taste 4 · Token-purity 5.
- **P4-3. SAVED + AUTH PAIR + ACCOUNT (one commit — three small screens sharing SavedContext
  and the new copy voice).**
  *Saved:* reads SavedContext (no per-screen fetch), count header, focus-refresh, Otto-Sad
  empty state with the paw-teaching line + one CTA. Vocabulary now Save/Saved everywhere.
  *Auth:* sign-up = framed Otto hero (mascot radius 24, top-anchored so the hat never crops) +
  "Pull up a stool." + value line + password hint + "Join Otto's kitchen"; sign-in = compact
  Otto vignette + "Back to the kitchen?" / "Otto kept your place."; inline error text replaces
  Alert.alert (which is invisible on web); Success haptic on auth. The 3D human chefs are gone.
  *Account:* badge-safe Otto bust in the circle (D6 FIXED — hat whole), reserved subscription
  slot (renders nothing until the paywall — one surface, no fake rows), Support→Contact us
  (mailto), Sign out (web-safe confirm), version footer. Rows we can't honor (Units — data
  can't convert; legal — no URLs exist; delete-account — ships with subscription per App
  Store timing) intentionally absent; logged for the paywall milestone.
  *Bug fixed en route:* cold-load deep links into (tabs) reset to Discover — the auth gate
  returned null before Tabs mounted. Guard now keeps Tabs mounted and replaces unauthed users
  after load. Verified: /profile and /favorites deep links land correctly.
  *Verified in Chrome:* Saved shows 1 test recipe + count; sign-out confirm → sign-in with new
  copy → sign-in succeeds → Discover; sign-up renders with hero. Captures 04–07.
  *Grades:* Saved: M2/I5/H4/Ic5/T4/TP5 · Auth: M2/I5/H3/Ic4/T5 (strip test: instantly ours) /
  TP5 · Account: M2/I4/H3/Ic4/T4/TP5. Motion 2s acceptable v1: these screens have no natural
  signature moment beyond the shared paw/haptics; entrance staggers deferred with reduced-
  motion support noted for Phase 5.

- **P4-4. FOUNDER REQUEST MID-RUN: "calories on the recipe cards."** This amends B8 (which had
  removed calorie badges from cards over placeholder-data honesty). Reconciliation that honors
  both the ask and the honesty rule (P2-7): a single **category-typical estimator**
  (`constants/nutritionEstimates.js` — per-serving values typical for each TheMealDB category)
  now feeds BOTH the card pill ("~450 cal", tilde always) and the detail NutritionCard (which
  stops showing a flat 420 for every recipe — strictly better than before). Cards show the
  calorie pill as their ONE on-photo metadata element (replacing the category pill; category
  remains on the detail). Grid results from filter.php get the category stamped client-side
  (the endpoint omits it). Saved-tab cards lack a category column → default estimate; noted.
  *Rejected:* per-recipe pseudo-random estimates (pure fabrication), uniform "~420" everywhere
  (reads broken on a grid).

## Post-run — Figma ↔ app one-to-one pass (founder request, 2026-07-14)

- **F1. NutritionCard:** app already matched the Figma component structurally (ring left /
  3 macro bars grams-right / stepper footer — MacroBar is 1:1 with the primitive). The v2
  estimate framing (~kcal, "EST. / SERVING", honesty footnote) was pushed INTO the Figma
  component + CalorieRing primitive so both sides now agree exactly.
- **F2. RecipeCard aligned to the Figma spec:** image 5:4, calorie badge top-right (surface
  pill + accent dot, "~450 cal"), title ≤2 lines + 3 macro dots restored; paw moved to
  bottom-right on the image. Deviation kept + documented in Figma: the "30 MIN" chip stays
  out (fabricated data). Figma component updated to match (chip removed, paw added).
- **F3. FilterSheet SHIPPED** (was specced-only): grab handle, Category + Cuisine chip groups,
  Clear all + live "Show N recipes" CTA, sheet radius, impactLight/selection haptics; opened
  from a filter button beside the Discover search pill; Category × Cuisine intersected
  client-side (TheMealDB can't combine). Deviation documented in Figma: Sort group omitted —
  no honest sort data. Verified: Japanese → "Show 9 recipes" → grid "Japanese · 9 RECIPES";
  Beef × Japanese honestly shows 0. Known quirk: list.php?a=list returns ~200 cuisines, many
  empty — long scroll; P2 backlog to prune to cuisines with results.
- **F4. Figma DS file updated to shipped v2:** all five component doc notes rewritten
  (Tab Bar, NutritionCard, primitives, RecipeCard, FilterSheet — deviations called out);
  Tab Bar v2 frame (3 tabs, paw, active states) added and v1 strips marked SUPERSEDED at 45%
  opacity; new page "📱 App Map & Wireframes v2" with app map, tab/top-bar spec, per-screen
  sections + text wireframe, design style, core features, interactions/animations (springs +
  haptic map as coded), plus 5 shipped-screen captures.

## Post-run 2 — P1 backlog cleared (2026-07-14, "anything else? lets do it")

- **B1. Toast system shipped** (`context/ToastContext.jsx`): warm-ink toast above the tab bar,
  200ms fade (plain RN Animated — reanimated *layout* animations proved unreliable on web and
  even stalled the renderer; springs/shared-values elsewhere are unaffected). Unsave → "Removed
  from Saved · Undo" (5s); failed save → "We dropped the pan…"; FIRST save ever → the one
  Excited-Otto toast (AsyncStorage flag). Routine saves stay silent — pop + haptic is the
  feedback (B6: no Otto in routine toasts).
- **B2. Undo stale-closure bug found & fixed:** the toast's Undo captured a `toggleSave` whose
  savedIds predated the unsave → it re-deleted instead of re-saving. SavedContext now reads
  current state through a ref; toggleSave is closure-safe. Verified: unsave → Undo → restored.
- **B3. favorites.category column** added via `drizzle-kit push` (additive; migrate journal was
  out of sync with the live DB — 0001 SQL kept for the record). POST + optimistic rows carry
  category; Saved cards now show real per-category estimates instead of the 420 default.
- **B4. CalorieRing count-up:** 0→~N over TIMING.sweep with ease-out, tilde preserved,
  reduced-motion → static. Verified ~400 for Chicken detail.
- **B5. Cuisine list ordering:** 30 known-stocked cuisines first, long tail after — nothing
  hidden, counts stay honest.

## Post-run 3 — Animations & interactions pass (founder: "lets go with the animations")

- **M1. `Bounceable`** (new): spring.snappy press-scale (1→0.97→1) on RecipeCard, featured
  card, category tiles, Start-cooking, cook-mode Next. Reduced motion → opacity dip.
- **M2. `OttoIdle`** (new) — **D4-lite, in code, no Rive**: a barely-there breathing loop
  (±1.5% scale, −2pt lift, ~4s cycle; optional sway; optional spring-pop entrance). Applied
  within B6 territory only: Discover greeting, sign-in vignette, Thinking search-empty (sway),
  Sad saved-empty, Sleepy cold-start, Proud cook-finish (entrance pop). Sad ERROR Otto stays
  still — errors don't wiggle. Reduced motion → static PNG. The full Rive plan
  (`OTTO_ANIMATION_PLAN.md`) remains open for interactive reactions.
- **M3. Cook-mode step transition:** incoming sentence fades + lifts 8pt over 220ms per
  advance (RN Animated — web-safe; reanimated core is fine, its LAYOUT animations are not,
  see B1).
- **M4.** All verified on web: cards still navigate via Pressable, cook run 6/6 → Proud pop,
  no console errors. Figma "Interactions / animations" frame updated to match.

## Post-run 4 — Interactive Otto, Phase A (founder: "lets do it !")

- **M5. Otto now REACTS (D4 Phase A, in code):** new `lib/ottoBus.js` (tiny pub/sub);
  PawMark emits "save" on every successful save; `OttoIdle` accepts `reactTo` +
  `reactionSource` — the Discover greeting Otto hops (−8pt + spring) and flashes to the
  Excited expression for 1.4s, then settles back to Happy + breathing. One reaction at a
  time; skipped entirely under reduced motion; uses only locked expression art (zero drift).
  Verified on web: happy → excited (during save) → happy (after revert).
- **M6. Rive scoped honestly as Phase B** in OTTO_ANIMATION_PLAN.md: editor-authored rigs +
  dev build required (rive-react-native is incompatible with Expo Go) — stays approve-first
  with a real art budget attached.

## Post-run 5 — Cooking surfaces remade 100% (founder directive, 2026-07-15)

Two Mobbin deep-dives (cook mode; ingredients/method/nutrition — ~20 searches) → blueprints
in the research transcripts; built same-day:

- **C1. Deterministic foundations:** `lib/ingredientParser` (qty/unit parse, kitchen-real
  fraction snapping — ¾ cup ×1.5 → 1⅛ cups, never 0.81 — US↔Metric with friendly rounding,
  unparseables stay honest), `lib/stepEnrich` (durations incl. ranges→upper bound + temps),
  `lib/cookSession` (sentence-boundary step splitting ≤220ch; per-step ingredient matching,
  all-significant-words rule after "the sauce"≠"soy sauce" bug).
- **C2. Ingredients v2:** header band + US/Metric text toggle (global AsyncStorage pref),
  "For N servings" + stepper (moved OUT of NutritionCard — one control, one mental model),
  ×N·Reset scale chip, live-scaled tinted qty column, pantry rows sink positionally, metric
  candor footnote. Tinting semantics everywhere: terracotta = computed, ink = authored.
- **C3. Method v2:** split steps share cook-mode numbering; duration chips ◷ + tinted dual-
  unit temps inline; scaled "uses:" recap per step; per-step play → cook mode at that step
  (+servings param).
- **C4. NutritionCard v2:** per-serving ◦ whole-recipe scope toggle + scope sentence in
  words, ONE segmented macro bar + grams/%-of-dish legend (never daily goals), footnote.
  Founder call: tilde dropped from all calorie numbers ("EST." caption + footnote carry the
  honesty).
- **C5. COOK MODE v2:** mise-en-place entry (Otto, servings, checkable scaled list) →
  step screens (serif Step N of M, tappable daub progress → jump sheet, You'll-need chips
  scaled, ≥24pt step text with TAPPABLE duration tokens) → NAMED timers ("Step 5 — 35
  minutes"): floating card +1/+5/✕, multi-timer hub with startable timers from every step,
  done modal = the undercooked escape hatch ("Otto sniffs the pan… A bit more (+1 min) /
  Done") → This-step/Everything ingredients sheet → swipe + Next + back → exit confirm when
  progress/timers live ("Your timers will stop.") → finish arc: Proud Otto + "Would you cook
  it again?" thumbs (persisted) + cooked-at logged (AsyncStorage until the DB column ships).
  NOT built, per blueprint: voice control, per-step video, in-cook AI chat.
- Verified end-to-end on web: scaling (×1.5, metric), timer start/extend/hub, jump sheet,
  chips, finish. Captures: `docs/redesign/captures/11-cookmode-v2-timers.png`.

## Phase 5 — QA

- **P5-1. Adversarial pass complete → `docs/QA.md`.** 10 findings: 4 P0s all FIXED in-pass
  (PawMark hardcoded shadow, silent save failure, sub-44pt eye/clear targets, deep-link reset),
  3 P1s + 3 P2s logged with dispositions. Light-only check, one-icon-family check, vocabulary
  check, kitchen test, strip test: all pass. No open P0s.

## Phase 6 — Detail v3 + Otto action art (2026-07-15)

- **C6. Recipe Detail v3** (Mobbin layout study: KS, NYT, Crouton, SideChef, Tasty, ReciMe,
  CREME, Alma, Cherrypick, Blue Apron; Yummly discontinued — full study in the task log):
  photo-only hero — title never sits on the art (9/11 apps set the title below the image;
  scrim dropped, floating buttons are self-legible chips) → title block on cream: terracotta
  small-caps eyebrow (category · area) → serif display title → **attribution chip** ("From
  Otto's kitchen", otto-badge) — the row is RESERVED so v2 imports swap in favicon + source
  domain ↗ without reflowing the page (ReciMe/CREME/Instacart pattern) → **computed meta row**
  (N servings · N ingredients · N steps — every number derived from real data; NYT authored-
  only-time spirit) → Ingredients → video (KS slot) → Method → Nutrition (Crouton/ReciMe
  placement) → **"More from the pantry" exit**: 2-up same-category RecipeCards — content apps
  never dead-end on a data card. Share ghost button added to the hero cluster (8/11 norm).
  Skipped deliberately: section tabs (Cherrypick — page is ~5 sections, not a catalog), a
  second cook entrance at the Method header (SideChef's mistake), tag chips (no search route
  yet — would be a dead end).
- **C7. Otto action art in cook mode:** 10 hand-painted action illustrations (chop, mix,
  saute, simmer, bake, wait, season, pour, serve + generic cook) generated in the locked
  Otto style (hero reference + lock phrase), flood-fill cutouts, 512px, in
  `assets/actions/`. `lib/stepAction.js` maps step text → action deterministically
  (earliest keyword wins; fallback "cook"). Step screen shows the matching art at 132pt
  under the step text — per-step *type* art at zero content cost (cook-mode blueprint).
  Verified web + iOS sim: preheat→bake art, sauce-thicken→cook art, action swaps per step.

## Phase 7 — v2 build-out: the pivot shipped (2026-07-15)

Founder calls honored: ALL premium functionality + frontend built now, ZERO gating
(no meters, no paywall, no RevenueCat — Phase 2 of the roadmap deliberately skipped);
Cookbook is ONE tab with in-screen segments.

- **C8. Backend v2** (Express+Drizzle+Neon): `recipes` (owner, source imported/manual,
  immutable source_url/source_name, ingredients JSONB {measure,name} pairs, steps JSONB,
  real servings), `plan_entries` (day buckets, snapshot title/image, cooked). POST
  /api/import = deterministic schema.org JSON-LD extraction (NO LLM): Recipe node
  discovery (incl. @graph), HowToStep/HowToSection flattening, ingredient-line splitting
  into pairs, publisher/author → attribution. Verified against AllRecipes end-to-end.
- **C9. Tab bar v2:** Discover · Cookbook(paw) · raised terracotta ＋ · Plan · Account.
  ＋ is an action (opens /add), never a destination — placeholder tab slot named `create`
  so the sheet route /add stays unshadowed (group segments are optional in expo-router!).
- **C10. Cookbook:** segments All · Saved · My recipes + Cooked chip (reads
  otto.cooked.* keys). One corner stamp per card: paw / "By you" / source-link pill.
  Per-segment Otto empty states; "Add a recipe" invitation on My-recipes-empty.
- **C11. Add flow:** clipboard link detection ("Otto spotted a recipe link"), parsing
  state in Otto's voice ("check his work"), failure = blame-free + tip + "Write it
  myself instead" carrying the URL; TikTok/IG share-in honestly labeled coming-soon
  (needs dev-build share extension). ONE editor, two fill states ("Check Otto's work"
  banner on imports); tokenized terracotta measure column; steps optional at save;
  delete = two-tap arm (Alert.alert is a web no-op).
- **C12. User recipes everywhere:** id convention u-<dbId> (`isUserRecipeId` is the only
  place that knows); detail + cook mode load either source into the SAME transformed
  shape; scaling uses real authored servings as base; attribution row swaps to
  source-domain ↗ (live link, immutable) or "By you"; edit pencil replaces the paw on
  own recipes (you don't "save" your own cooking).
- **C13. Otto's week:** rolling 7 days, loose buckets, today tinted, empty days are
  painted invitations ("Open — no plans, no guilt."), cookbook picker per day, flame
  cooked-toggle, optimistic updates w/ rollback. Detail bottom bar = Start cooking
  (primary) + calendar day-sheet (quiet) — SideChef dual-bar. Discover surfaces
  "What's cooking tonight?" (today's first uncooked entry) — payoff at 5pm, not Sunday.
- **C14. Shopping list:** built ONLY by explicit push; one row per ingredient, summed
  when units agree (parseMeasure canonical), honest side-by-side when they don't; aisle
  keyword sections (pantry phrases outrank meat: "chicken stock" ≠ chicken); provenance
  "for …" line; removable source chips; check-off never reorders; inline add-item;
  week-changed banner asks before rebuilding — never silent rewrites.
- **C15. Growth bits:** finish screen "Snap your plate" → private journal
  (otto.journal.<id>, camera on device / library fallback); Cooked filter chip.
- **Blocked on founder inputs (roadmap Phase 0 list):** Ask Otto needs an LLM API key +
  budget; share extension + Rive need the dev-build transition; IAP/RevenueCat whenever
  gating is wanted. Everything else from Phases 0/1/4/5-lite is LIVE.

## Phase 8 — Adversarial QA pass 2 + Account v3 + safe-area (2026-07-15)

- **QA sweep (17 findings, all dispositioned):** P1s fixed — cook-mode render-phase
  router.back on 0-step recipes (→ effect + detail CTA swap "Add steps to cook this");
  SSRF hardening on /api/import (DNS + private-range block re-checked per redirect hop,
  content-type gate, 3MB stream cap); deleted-recipe dead ends (detail renders "That page
  is gone" instead of a blank wall; delete pops the whole stack; focus-refetch treats 404
  as gone). P2s fixed — refresh no longer swaps a labeled category grid for random meals;
  shopping keeps the old list when fetches fail ("couldn't reach the pantry"), custom-item
  key collisions, plural dedup ("Tomatoes"="tomato") + word-boundary aisles (nutmeg≠nut);
  plan week recomputes on focus (midnight rollover); timer tick side-effect-free updaters;
  out-of-range ?step= clamped; backend 400-guards (intId, day regex, servings bounds);
  touch targets — hitSlop on serves steppers/unit+scope toggles/segments/day-add/cooked
  mark, taller timer chips. SKIPPED by founder decision: re-adding "~" to card calories
  (C4). Noted, not fixed: CORS left open (mobile Bearer API), Alert.alert in sign-out
  removed anyway.
- **C16. Account v3 — "You"** (Mobbin account study: KS, SideChef, Crouton, ReciMe, CREME,
  Cherrypick, Tasty, NYT, Yazio + Strava/Duolingo/AllTrails): warm header cold facts
  (Otto avatar, plain email caption); "Your kitchen so far" 3-stat card — cooked/saved/
  your-recipes, all EARNED, each a door (deep-links into Cookbook segments), honest zero
  note; Cooking journal row + new /journal screen (private grid of snapped plates);
  inline US/Metric segmented row (SideChef — no settings dungeon); "boring-but-important
  bits" (mailto, About+version; privacy/terms rows render only when founder provides
  URLs); quiet sign-out; **Delete my account visible below it** (never buried — NYT trap),
  two-tap arm → DELETE /api/account wipes all rows; auth-user deletion auto-activates
  when SUPABASE_SERVICE_ROLE_KEY is added. OMITTED as fabricated: followers, streaks,
  XP, badges, notification/appearance rows.
- Safe-area: tab bar 60pt+inset (labels clear the home indicator), ＋ ring; all pinned
  bars & sheets inset-aware.
- **Figma synced:** new DS page "🧭 v2 Build — shipped 2026-07-15" with 1:1 wireframes of
  Add sheet, Cookbook (segments + all three card stamps + 5-slot tab bar), Otto's week,
  Shopping list (banner/chips/aisles/check-off), and You (Account). File
  X1eGT54CTwtowHNve30vvE.
- **Discover remake:** Mobbin research complete (16 searches, 10 apps) — 3 candidate
  directions documented for founder discussion; NOT implemented by design. See the
  session summary / research output ("Tonight, sorted" recommended).

## Phase 9 — Otto Club frontend (2026-07-15)

- **C17. Otto Club paywall + membership card** (Mobbin paywall study: Blinkist dated
  timeline, Headspace plan-aware recompute, CREME both-directions price math, Kitchen
  Stories painted benefits + two-piece account entry, Duolingo/Strava state rules):
  `/otto-club` — floating-Otto hero (art bleeds off edge) → serif title → 4 painted
  benefit rows (incl. the CREME-style "keeps the lights on" honesty row) → "How your 5
  free days work" timeline with REAL computed dates (unlock today / reminder day 4 /
  charge day 5; rail fades after the charge node) → price radio cards, annual
  preselected, math shown both directions ($29.99/yr = $2.50/mo; $4.99/mo = $59.88/yr),
  SAVE % computed only against our own monthly price (no anchors, no strikethroughs,
  ever) → total-truth line → **ship-honest pre-IAP state**: CTA = "Otto Club opens soon"
  + "Notify me" (otto.clubWaitlist), NO Restore link (dead one = trust bug + App Store
  reject), no remind-me toggle yet, charge copy stays conditional ("you'd be charged") →
  inline "How do I cancel?" card with literal iOS steps. You-tab: MEMBERSHIP section =
  factual "Current plan — Free" row + painted Otto Club card (copy left, floating Otto
  breaking the card edge, "See how it works"). One card, three states designed (free /
  trial / member — trial+member ship with IAP; selling stops for members, Duolingo MAX
  rule). Prices are roadmap §6 placeholders — founder sets final.

## Phase 10 — Onboarding, splash, auth SSO, Discover-social (2026-07-15, cloud co-pilot)

- **P10-1. Onboarding = feature-showcase, NOT a quiz.** Founder shared 3 Kitchen Stories
  screens; agreed. 3 painted Otto screens (collect → cook → plan), no questions, no account
  wall, no "tailored just for you" (honesty). Full spec `docs/ONBOARDING_BRIEF.md`; screens
  `SCREEN_MAP.md §B`. Art generated (take 1) — manifest `mobile/assets/onboarding/README.md`.
- **P10-2. Auth SSO reversal.** Old rule (`MOBBIN_COMPARISON §2.2` "no fake SSO rows") was
  scoped to the pre-account app. v2 has real accounts → **real Apple + Google + Facebook
  OAuth (Supabase)** on both sign-up and sign-in. Apple listed first (App Store 4.8).
  **Facebook flagged optional** (Meta SDK + review cost, declining share) — include per
  founder ask, first to cut if scope tightens. `SCREEN_MAP §A3/A4`.
- **P10-3. Splash = still now, Otto video fast-follow.** Frame one is *always* a still
  (native splash paints before RN mounts) — so the still is permanent, video is a second
  stage that resolves INTO it. Still art generated; manifest `mobile/assets/splash/README.md`.
  Video deferred to terminal (seed = the approved still). Spec `docs/SPLASH_BRIEF.md`.
- **P10-4. Discover-social — reconciled + phased.** Old "no ratings ever" (`§2.9.1`) was
  scoped to read-only TheMealDB; **v2 UGC makes real ratings/comments honest.** Ruling:
  **v1 seeds author attribution + a `visibility` flag only; the public feed is Phase 2**
  (moderation kit per App Store 1.2 + cold-start make it a subsystem). Adopt the
  **cook-then-rate gate** ("★ from N cooks", rate only after Cook Mode) as the trust
  differentiator; **curated-first re-feature** ("From the Otto kitchen") before any
  algorithm. Full deep-think `docs/DISCOVER_SOCIAL_EXPLORATION.md`.

### Founder ruling (2026-07-15, "yes to all") — ratified
- **Plan IS in launch scope** (overturns the away-default of "fast-follow"). Onboarding stays
  **3 screens** (B1→B2→B3); Plan screens (`SCREEN_MAP §G`) are v1. **Ships ungated at launch**,
  then gates under Otto Club when IAP opens (don't block launch on IAP).
- **4 renders approved** (B1 `52c078e5`, B2 `44b0d5b4`, B3 `ce3750fb`, splash `3411c1ab`).
- **Facebook login:** confirmed kept (still flagged optional in-spec).
- **Discover-social:** phased plan + cook-then-rate + curated re-feature **adopted**; Phase 2
  build, v1 seeds attribution + `visibility` flag only.
- **Splash video:** approved to proceed (terminal, seeded from the approved still `3411c1ab`).
- **Handoff:** batch packaged as a terminal build ticket → `docs/TERMINAL_TICKET_P10.md`.

### Blocked in the cloud session (handed to terminal)
- CDN egress still 403 → generated PNGs (onboarding ×3, splash still) **not committable here**;
  IDs+URLs in the two asset manifests for the terminal to download + commit.
- Mobbin needs re-auth (OAuth, non-interactive) → 3 reference gaps flagged for a fresh pull:
  splash/launch screens, report/block flow, public-profile/cookbook layout.

## Phase 11 — Backend B0+B1 (2026-07-15, terminal, TERMINAL_TICKET_B0_B1)

- **C18. Live DB confirmed + RLS on.** `DATABASE_URL` and `SUPABASE_URL` both point at
  project `mepzfdefanfpnrvydyty` — one project, no drift. The MCP-visible
  `supabase-orvenue` (INACTIVE) is a different org entirely; the Supabase MCP is linked
  to the wrong account, so `get_advisors` can't run — equivalent checks done by hand
  (RLS + policies + user_id indexes). *Founder follow-up:* re-link the Supabase MCP to
  the real org to restore advisor coverage. Drizzle journal is empty (schema was pushed,
  never migrated) — kept the repo's `push` convention; `drizzle-kit push` hung in a
  non-interactive shell, so hardening is applied via idempotent SQL scripts
  (`backend/scripts/b0-hardening.mjs`, `b1-schema.mjs`) — rerunnable, reviewable.
- **C19. RLS policy shape.** Own-rows policies for `authenticated` on all three tables
  (`auth.uid()::text = user_id`), plus a `visibility='public'` SELECT policy on recipes
  as Phase-2 social groundwork. Express keeps full access via table-owner bypass —
  verified with an authed smoke test after enabling. `recipes.visibility` was
  schema-only (P10 §4 shipped the code, not the column) — now live.
- **C20. Nutrition compute is ASYNC on save.** Save returns instantly; nutrition
  backfills onto the row and the client picks it up on next fetch. Ingredient/serving
  edits null the cached numbers in the same UPDATE — the honest in-between state is
  "no numbers," never stale ones. Cache-once everywhere; compute never runs on read
  (budget guard). Range quantities parse to the midpoint ("2–3 tbsp" → 2.5, documented
  here so it never gets re-decided).
- **C21. Provider dormancy over local guessing.** No Edamam/Spoonacular keys in env
  (founder inputs, per ticket). Built the full pipeline — deterministic parser
  (qty/unit/grams + per-line confidence), Edamam adapter, seed cache, lifecycle wiring,
  test-batch delta script — all activating the moment `EDAMAM_APP_ID`/`EDAMAM_APP_KEY`
  land. REJECTED: shipping a hand-rolled local nutrient table so numbers appear sooner —
  unvetted numbers dressed as computed ones is exactly the fabrication the honesty laws
  ban. Dormant state verified end-to-end: seed endpoint → null, recompute → honest
  `queued:false`, NutritionCard keeps category-estimate framing untouched.
- **C22. NutritionCard confidence copy.** Computed numbers swap the footnote to "Otto
  worked this out from the ingredients — an estimate, not a guarantee." (low confidence
  degrades to "could only read some of these ingredients — a rough sketch"); category
  estimates keep the existing "from this kind of dish" line. Per-serving sentence gains
  "about ~Ng each" from `basis_grams`. No daily-goal framing, ever.
- **Coordination note:** a second agent session shares this working tree and commits
  in-flight files (e.g. `01dc56a`, `22e4c34` carry B0.2/B0.3 work authored here mixed
  with its splash batch). Nothing lost — history is linear — but commit-immediately is
  now the cadence, and mixed-authorship commits are a known artifact of this run.
- **C23. SSO rows are live-gated on Supabase settings** (P10 §3). The auth screens ask
  `/auth/v1/settings` which providers are actually configured and render only those —
  today none are (all three need founder-owned developer credentials; steps in
  `docs/SSO_SETUP.md`), so the UI is unchanged and honest. The moment a provider is
  enabled its row appears, Apple first (4.8). Anonymous guests link identities in place
  (`linkIdentity`) so guest data keeps its owner — same rule as the email upgrade path.
  Apple = native sheet via `signInWithIdToken` (iOS builds only; row hidden elsewhere);
  Google/Facebook = system browser → deep-link back → `setSession`. Caught in sim
  verification: top-level `expo-crypto` import crashed the existing dev build (module
  not in the old binary) — made native imports lazy inside `signInWithApple`. iOS dev
  build still needs one rebuild (plugin + `usesAppleSignIn` entitlement) before Apple's
  native sheet can work; web needed `detectSessionInUrl: true` (web only) for the
  redirect return.
- **C24. Figma Master Board shipped** (ticket `docs/FIGMA_MASTER_BOARD_PROMPT.md`, 2026-07-15).
  New file **"Otto — Master Board"**: https://www.figma.com/design/mM0uWkHod9rL1Ff1VJ64Au —
  2 pages. Page 1 "Otto · Design System": Variables (Color 15 · Spacing 6 · Radius 5, scoped,
  code-syntaxed to `theme.*`/`SPACING.*`/`RADIUS.*`), 6 text styles (Lora display + SF Pro),
  swatch/type/spacing/radius/overlay/motion spec cards, all 45 repo assets uploaded as labeled
  tiles (webp food icons converted to PNG — Figma placed webp fills blank), and 20 components
  with variants (TabBar ×4 actives, RecipeCard saved/unsaved, NutritionCard/CalorieRing/MacroBar/
  ServingStepper, PawMark, buttons/chips/inputs/segmented/dots/auth rows/list rows, FilterSheet,
  EmptyState, OttoStates ×6). Page 2: app map (entry flow + auth cloakroom + 5 tab zones),
  32 low-fi wireframes, and 28 full-length hi-fi screens grouped by flow — unbuilt surfaces
  (by-ingredient, scan-photo, video/IG, connected accounts) are dashed "PLACEHOLDER — not built"
  frames. Founder caught mid-run that images were cropping: root cause was upload placement
  frames landing at arbitrary fit-box sizes (e.g. 560×420) that don't match intrinsic aspect —
  fixed globally by resizing every IMAGE-fill node to its true ratio (42 nodes page 1, 10 page 2),
  then re-audited to zero. Recipe photos on the board are painted food icons on surfaceWarm —
  honest placeholders, no fabricated ratings/times anywhere; nutrition framed as estimate
  throughout. REJECTED: reusing the old DS file X1eGT54… as the base (ticket recommended a
  clean file; old file stays as history).
- **C25. Master Board round 2** (founder asks: glyphs + "any screens/components we need, even
  empty" + a strategy-review page). (1) **Painted tab glyphs generated** (B5 finally has assets):
  steam-pan / planner-leaf / apron-bow, hero style lock, 2 takes each, cutouts in
  `mobile/assets/glyphs/` — swapped into the board's Comp/TabBar (active = full ink, inactive =
  52% opacity; screen instances inherit). NOT wired into the app yet (Ionicons stay until founder
  approves the look — README in the glyphs dir has the wire-up note). (2) **Comp/Toast** added
  (Undo + the one FirstSave Excited card, per B6). (3) **"Future — not yet designed" row** on the
  screens page: Ask Otto, Collections, Membership-subscribed, Notifications-ask — labeled parking
  spots so scope stays visible. (4) **Page 3 "Otto · Mobile Strategy Review"**: 8 deck-style
  slides (cover/agenda/vision/quarter goals/research insights/how-we'll-win/design concepts/Q&A)
  mirroring the founder's Slides template structure but grounded in repo truth — no invented
  metrics; Q&A slide is the founder-inputs list. Mid-run image-crop bug from C24 stayed fixed
  (aspect audit re-run clean). Co-pilot's in-flight backend edits left uncommitted on purpose.
- **C26. Master Board grows to 6 pages** (founder picked all three proposals). **Page 4 · App
  Store Launch Kit:** five 6.7" (1290×2796) store screenshots — live clones of the Page-2 screens
  inside ink device mocks on alternating cream/warm fields, honest Lora captions (no ratings
  bait); listing-copy draft (name/subtitle/promo/description/keywords, Facebook-login note);
  icon-on-grid tile. Export frames @1x for App Store Connect; legacy 5.5" exports from the same
  frames. **Page 5 · User Flows:** the three carrying journeys as thumbnail lanes (first-run →
  first-save → cloakroom; import → review → cook → celebrate; plan → list → tonight band), gold
  chips = decision points, dashed chips = edge branches (parse-fail, offline mid-cook, dismiss,
  empty week). **Page 6 · Brand & Voice:** wordmark lockups (Lora Bold + badge, cream-on-ink
  rule), the five canonical voice specimens as cards + narrator rules, art-usage do/don't tiles
  (stretch/tint/photo-bg/rotate demos labeled as violations), app-icon anatomy w/ Android 66%
  safe-zone ring. Store screenshots note: clones are LIVE — regenerate captures after screen
  changes.
- **C27. Shipped account/club/add patterns DEFINED as kept** (founder review of sim screens,
  2026-07-15; board screens rebuilt to match — Screen/Account/You, Screen/Account/OttoClub,
  Screen/Add/AddToCookbook + flow thumb + map node refreshed).
  **"You" screen anatomy (Account v3):** page title "You" · identity card (badge 52 + "Chef" +
  email) · MEMBERSHIP section = "Current plan | Free" row + Otto Club promo card (warm field,
  terracotta stroke, "Everything Otto can do, one simple membership. Opening soon." + pill CTA
  "See how it works" + floating-Otto art right) · YOUR KITCHEN SO FAR stats row (cooked/saved/
  your-recipes, tappable into Cookbook segments) · Cooking journal row (count + chevron — the
  journal's entry point lives HERE, not in Plan) · PREFERENCES w/ inline US/Metric pill ·
  "THE BORING-BUT-IMPORTANT BITS" section label (kept verbatim — it's the voice) · Sign out ·
  Delete my account (two-tap).
  **Otto Club paywall anatomy:** floating-Otto hero (otto-floating-cut = THE membership art —
  add to B6 usage map) · "One membership. Everything Otto can do." · 4 perk rows incl. the
  honesty perk "Keeps the lights on — the Club is how Otto pays the cooks and the servers" ·
  "How your 5 free days work" 3-step dated timeline (unlock → reminder → charge, "cancel any
  time — it takes two taps") · two-tier pricing (Yearly $29.99 selected w/ SAVE 50%, Monthly
  $4.99 w/ full-year math shown) · dormant state = "Otto Club opens soon" band + "MEMBERSHIPS
  AREN'T ON SALE YET — THIS IS THE MENU, NOT THE BILL." + Notify-me link · "How do I cancel?"
  card spelling out the iOS Settings path. This is the honesty-laws paywall: full price math,
  no hidden tiers, cancel path documented on the sell screen.
  **Add to your cookbook (full screen, not sheet):** X top-left · happy-cut Otto · "Found
  something good? Otto will copy it down." · ONE primary path (Paste a link card w/ url field +
  Import it) · OR · Write it myself outline · footer "TIKTOK & INSTAGRAM SHARE-IN — COMING
  SOON." (honest future note replaces disabled rows).
  **C27 addendum (founder rule):** never replace board designs in place — earlier versions are
  restored under "2D · Alternates" on the screens page (Account home v1 · Otto Club v1 · Add
  bottom-sheet v1) and every future redesign duplicates first, edits the copy.
- **C28. Board synced 1:1 with the RUNNING APP; every superseded design kept as "Alternative
  version — [name]"** (founder ask, 2026-07-15). Method: e2e-authed headless-Chrome walk of all
  web routes at 393×852 (co-pilot session holds the shared MCP browser + sim deep links hit the
  "Open in Otto?" springboard prompt — headless Chrome sidesteps both), screen-by-screen diff
  vs the board, duplicate-then-rebuild per the C27b rule. **Real TheMealDB photos** (teriyaki/
  kefta/waterzooi/lasagne/spotted-dick/beef-pie) uploaded so cards/heroes are true to content.
  **Components resynced:** RecipeCard (photo + •CAL pill + paw-on-photo + macro dots + imported-
  source pill variant — spec-v1 card kept as alternative), NEW TextTabs (underline All·Saved·My
  recipes) replacing pill SegmentedControl (kept as alternative), NEW FilterChip (🔥 Cooked),
  CategoryTile v2 (label outside, Selected variant), TabBar back to shipped Ionicons-style
  glyphs (painted-glyph proposal kept as "Alternative version — TabBar"). **Screens resynced:**
  Splash (big hero low wordmark), Onboarding ×3 (full-bleed art, left-aligned copy, pill CTA),
  Discover (evening greeting + right Otto, filter+search row, outlined tonight band, photo
  Otto's-pick card w/ title-on-photo, selected category tile, "Beef · 93 RECIPES" grid),
  Cookbook (count header, text tabs + Cooked chip, new cards), Detail v4 (photo hero, category
  caption, "From Otto's kitchen" attribution, 4|9|9 divider meta, inline hairline ingredients,
  paw·calendar·Start-cooking bottom bar), NEW Screen/Recipe/MiseEnPlace ("Everything on the
  counter before the heat goes on" checklist), Planner (Build-my-list on top, Today card w/
  meal rows + flame/remove, "Open — no plans, no guilt."), Shopping list (basket count, source
  chips, inline aisle rows "for <recipe>"), Journal (shipped empty state; spec-v1 filled kept
  as alternative). Store-kit clones + 8 flow thumbnails re-captured. All 11 prior designs live
  in "2D · Alternates".
- **C29. Tab bar 1:1 + DS-page component sync.** Primary Comp/TabBar now uses the REAL glyphs:
  MIT-licensed Ionicons SVGs (restaurant/-outline, calendar/-outline, person/-outline, add) +
  the app's own paw PNGs — outline at rest, filled terracotta active (gotcha: createNodeFromSvg
  needs rescale(), resize() crops children to a solid square). Painted-glyph proposal (steam-pan
  Discover · planner-leaf Plan · apron-bow Account) stays as "Alternative version — TabBar",
  per founder. Remaining DS components resynced to shipped, spec-v1 kept as alternatives:
  Header (Greeting = "Good evening, chef" + Otto right; ScreenTitle = warm back circle +
  centered Lora title), ServingStepper ("For N servings" + warm square −/＋), Input (Kind=
  SearchPill / FieldWarm / FieldBordered), Button (PrimaryPill 🔥 / PrimaryRect ⬇ /
  SecondaryOutlinePill ✎ / DestructiveOutline). All "Alternative version — *" component sets
  gathered under a labeled block at the bottom of 1C.
- **C30. Search + Filters synced 1:1** (headless-browser interaction captures: typed query, tapped
  "Open filters"). Shipped search = results replace home modules IN PLACE — same greeting +
  filter/search header, field holds the query with an ⊗ clear, "Results for "query"" + N RECIPES,
  card grid; NO cancel button, NO recent-searches chips (spec-v1 kept as alternative). Shipped
  Filters sheet = grab handle, "Filters" Lora title, warm pill chips (solid terracotta + white
  when selected) for ALL 14 categories + full cuisine list, footer "Clear all" + "Show N recipes"
  pill. Comp/Chip + Comp/FilterSheet rebuilt to match (outlined spec-v1 chips kept as
  alternatives). Discover surface is now fully verified 1:1.

## Phase 12 — TestFlight prep: EAS build config (2026-07-18, cloud)

- **C24. Repo-side iOS release config, not a build.** The cloud box (Linux, no Apple/Expo
  interactive auth) can't run `eas login`/`eas init`/`eas build`/`eas submit` — all need a
  human at a Mac terminal. So this phase ships only what git *can* carry: `mobile/eas.json`
  (profiles `development`/`preview`/`production`, `appVersionSource: "remote"` so EAS owns the
  build number, `submit.production.ios.appleTeamId = A6J6HGNWZK`) and an `app.json` hardening
  pass. The interactive half is handed to the terminal via
  `docs/TERMINAL_TICKET_TESTFLIGHT.md` (ordered runbook: login → init → env vars → build →
  submit → TestFlight internal group).
- **C25. `ITSAppUsesNonExemptEncryption: false` baked into `app.json`.** Otto only uses standard
  HTTPS, so this is honest and skips the export-compliance prompt on every TestFlight upload.
- **C26. EXPO_PUBLIC_* env vars flagged as the #1 build gotcha.** They live in gitignored
  `mobile/.env`; EAS Build does NOT read `.env`, so the ticket makes registering all three
  (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_URL`) with `eas env:create` a hard step — otherwise
  the build ships pointing at localhost/undefined and white-screens. API URL must be the deployed
  Railway backend, not localhost. Team ID `A6J6HGNWZK` is the only membership fact committed;
  phone/address from the founder's screenshot were deliberately NOT written to the repo.
- **C27. Scope = internal testing only.** Internal (≤100 team testers, no App Review) is the
  first rung; external testing (Beta App Review + Test Info tab) is explicitly out of scope here.
- **C28. OAuth provider setup is its own ticket.** `docs/TERMINAL_TICKET_OAUTH_PROVIDERS.md`
  covers Apple/Google/Facebook dashboard config (all interactive console work — Apple Developer,
  Google Cloud, Meta, Supabase — not scriptable from the repo). Key facts pinned so they can't be
  re-derived wrong: native redirect `mobile://auth/callback` (scheme is "mobile"), Supabase callback
  `https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback`, and the most-missed step — the Apple
  provider's **Client IDs must include the bundle id `com.otto.recipes`** for the native
  signInWithIdToken sheet to validate. Buttons are honestly gated by `fetchEnabledProviders()`, so
  Apple-only is a valid first ship; Google/Facebook can follow with no dead UI.
- **C29. Pre-launch checklist, grounded in real state.** `docs/PRE_LAUNCH_CHECKLIST.md` — tiered
  (internal TestFlight / App Store review / polish), owner-tagged. Verified against code, not
  boilerplate: delete-account exists and is unburied (`profile.jsx:24`, `DELETE /api/account`) but
  only wipes the Supabase auth identity when `SUPABASE_SERVICE_ROLE_KEY` is set on the backend —
  flagged as a 5.1.1(v) blocker. Privacy/Terms/Rate/Tell-a-friend rows are honestly gated on null
  URLs (no dead links), so the checklist's job is turning them on. App Privacy "nutrition label"
  filled from what Otto actually collects (journal photos are on-device → NOT declared; no tracking
  SDKs → no ATT). Noted an account-deletion completeness gap: share links + collaborative lists
  aren't wiped on delete — decide before public.
