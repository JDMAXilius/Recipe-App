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

## Phase 5 — QA

- **P5-1. Adversarial pass complete → `docs/QA.md`.** 10 findings: 4 P0s all FIXED in-pass
  (PawMark hardcoded shadow, silent save failure, sub-44pt eye/clear targets, deep-link reset),
  3 P1s + 3 P2s logged with dispositions. Light-only check, one-icon-family check, vocabulary
  check, kitchen test, strip test: all pass. No open P0s.
