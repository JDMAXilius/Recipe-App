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

*(pending)*

## Phase 5 — QA

*(pending)*
