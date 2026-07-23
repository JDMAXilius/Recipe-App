# 🎨 Recipe App — Full Frontend Redesign Prompt Pack (Otto)

> **How to use.** The VARIABLES are pre-filled for this repo. Paste **Phase 0 + one phase at a time** into a fresh **local** Claude Code session (full tool control — Figma writes, image downloads, Chrome, native run). Review each phase's artifact before pasting the next. Phases 1–3 **extend** the artifacts we already have — they do not regenerate them.

**Last updated:** 2026-07-14 · **Run location:** local terminal (see §Run notes at bottom)

---

## DECISIONS LOG (the founder's calls — treat as fixed unless changed here)

- **D1 — Redesign every screen.** Full visual redesign, screen by screen, all referenced to Mobbin.
- **D2 — LIGHT ONLY. No theme switcher, no dark mode, no niche picker in the UI.** The app ships the **base light** theme and the user cannot change it. Remove the Appearance/Theme controls from the account screen. Keep the `THEMES` tokens in code (unused at runtime) so future Lean/Keto/Bulk *builds* can re-skin — but the shipped app is base-light, period. *(This reverts the runtime-theming F1/F3 UI.)*
- **D3 — Otto is the face of the app.** He appears as the brand's recurring character and as icon motifs derived from him (e.g. a paw-print "favorite" mark). Full illustrations at emotional beats (onboarding, empty, success, home greeting); Otto-derived marks/icons elsewhere. He must NOT crowd dense content (recipe steps, long lists).
- **D4 — Otto, animated & interactive (scoped).** v1 = static placeholder. Enhancement = a subtle idle animation + reactions on real events (save, finish, empty). Needs its own mini-plan + tech choice (Rive for interactive rig / Lottie for loops). Build only after the plan is approved.
- **D5 — Replace generic icons with hand-painted food in Otto's style.** Category/welcome icons become food illustrations by the "same painter" as Otto (warm, hand-painted, soft light — Spirited-Away-of-food energy). GENERATE them from Otto's style. **Never name a studio in a generation prompt** — describe qualities only.
- **D6 — Fix the Otto badge / app icon.** Current crop cuts off his face. Recompose so his face is whole and centered.
- **D7 — Rethink the tab bar.** Current Home/Search/Favorites/Account is redundant. Mobbin research decides the new structure, screens, navigation, and icons.
- **D8 — Subscription is coming.** Account and possibly the tab/nav structure must leave room for a subscription/paywall surface. Design account with this in mind.
- **D9 — Keep what works on Home.** The featured recipe, the general recipe grid, and the category filters are good ideas — keep the concepts, redesign the execution.

---

## VARIABLES (pre-filled for this repo)

```
MASCOT_NAME      = Otto
APP_NAME         = (recipe app — name TBD)
REPO_PATH        = <your local absolute path to Recipe-App>
STACK            = Expo (React Native 0.79, React 19) + expo-router + react-native-reanimated
                   + react-native-gesture-handler + expo-haptics. Icons: Ionicons (incumbent);
                   expo-symbols (SF Symbols) available for iOS. NOT a web app.
FIGMA_DS         = https://www.figma.com/design/X1eGT54CTwtowHNve30vvE/Recipe-App-—-Design-System--Otto-
FIGMA_CURRENT    = https://www.figma.com/design/7wYg6693e6m3D9hwqVkPsA/Recipe-App-—-Current-State--App-Map---Wireframes-
OTTO_ASSETS      = mobile/assets/mascot/  (+ docs/MASCOT.md is the character bible)
DEV_URL          = http://localhost:8081  (Expo web preview — a PROXY, not truth; verify native on iOS sim)
```

---

## PHASE 0 — Context & ground rules (prepend to EVERY phase)

```
You are the design lead on {{APP_NAME}}, a recipe app — a lead with a point of view who
pushes back when my ideas are wrong, not an order-taker.

READ FIRST (source of truth, in order — do NOT regenerate these, EXTEND them):
1. docs/CONTEXT_ENGINEERING.md  — architecture, data flows, gotchas
2. docs/DESIGN_SYSTEM.md + mobile/constants/colors.js + mobile/context/ThemeContext.jsx — tokens (code leads)
3. docs/MASCOT.md + mobile/assets/mascot/  — Otto, LOCKED style + assets
4. docs/MOBBIN_COMPARISON.md    — Mobbin references already captured (extend this)
5. Figma: {{FIGMA_DS}} (design system) and {{FIGMA_CURRENT}} (current-state map + inventory)
6. docs/current-state/captures/  — live screenshots of the shipped app
If your work disagrees with one of these, FLAG the conflict — never silently overwrite.

THE PRODUCT
A recipe app. Each recipe carries ingredients+amounts, step-by-step instructions, calories,
macros, servings, and an embedded YouTube video. Core job: a person with messy hands in a
kitchen needs to know what to do next. Every decision is tested against that sentence.

THE IDENTITY
Otto (an otter chef) is the mascot and host — hand-painted, warm, soft natural light,
generous negative space, food rendered with reverence, motion with weight. His style is
LOCKED (docs/MASCOT.md). If a screen would look identical with Otto removed, it isn't done —
BUT he must not crowd dense content (recipe steps, lists). He's the face at emotional beats
and a motif (marks/icons) elsewhere.

PROJECT REALITIES (non-negotiable):
- LIGHT ONLY. Ship the base light theme. NO dark mode, NO theme switcher, NO niche picker in
  the UI. Remove the Appearance/Theme controls from the account screen. Keep THEMES tokens in
  code for future niche BUILDS, but never expose theme switching to the user.
- NUTRITION DATA IS PLACEHOLDER. TheMealDB has no nutrition; calories/macros are estimated and
  cookTime/servings are hardcoded. Make the nutrition UI beautiful but do NOT imply precision
  the data can't back, and do NOT invent a data source.
- OTTO'S STYLE IS LOCKED. New poses/illustrations/food-icons must be generated FROM his hero as
  an image reference to stay on-model. When generating art, describe QUALITIES (hand-painted,
  soft warm light, storybook) — NEVER name a studio in a generation prompt.
- SUBSCRIPTION IS COMING. Leave room in account/nav for a subscription/paywall surface.

SOURCES FOR DESIGN THINKING
- Mobbin (MCP) is INPUT, never OUTPUT. Study how the best apps solve a problem, then solve it
  in Otto's language. If a screen traces 1:1 to a Mobbin screen, you failed. Extend
  docs/MOBBIN_COMPARISON.md; if the Mobbin MCP isn't connected, tell me and use screenshots.

THE QUALITY BARS (grade every screen 1–5, with a specific fix for anything ≤3):
1. MOTION — reanimated spring physics, continuous/interruptible, gesture-driven where natural.
2. ILLUSTRATION — Otto + hand-painted food carry onboarding, auth, empty, error, completion.
3. HAPTICS — expo-haptics on meaningful state changes only (never on scroll, never decorative).
4. ICONS — ONE family, one stroke weight, optically sized; Otto-derived custom marks where a
   library icon can't carry our voice (favorite paw, macro glyphs, cooking verbs).
5. TASTE — identifiable as ours with the logo cropped (the "strip test").
6. TOKEN-PURE — zero hardcoded colors/spacing; everything from the light token set.

WORKING RULES
- No code before an approved plan for that screen. One screen at a time. No sweeping refactors.
- After every visual change: run the app, open {{DEV_URL}} in Chrome, screenshot, self-critique
  BEFORE showing me. Web is layout-only — verify motion/haptics/native feel on an iOS simulator.
- Quality floor (unannounced): 44px touch targets, AA contrast, screen-reader labels on icon
  buttons, AccessibilityInfo.isReduceMotionEnabled() respected, tablet layout sane.
- Append findings to docs/ (a REDESIGN_NOTES.md) so you don't loop.
```

---

## PHASE 1 — Audit (extend, don't restart)

```
[PHASE 0 BLOCK]

TASK: Audit the current frontend. Diagnosis only — no solutions, no code.
Start from docs/current-state/captures/ + the Current-State Figma file (they're your Phase-1
head start) and reconcile with the live app.

For EACH screen (Sign In, Sign Up, Home, Search, Favorites, Recipe Detail, Account/Profile):
  ## <Screen>
  - Job to be done (one sentence)
  - Core features
  - Screenshot path
  - What works (specific)
  - What doesn't (specific, blunt)
  - Grade vs the 6 bars, 1–5 each, one-line reason
  - Otto presence: absent / decorative / integral

Then, specifically flag:
  - THEME CONTROLS to remove (Account currently has Appearance + niche picker — per D2 these go).
  - TAB REDUNDANCY: analyze Home vs Search vs Favorites vs Account overlap (D7). Do NOT solve
    yet — just diagnose which tabs earn their place and which don't.
  - ICON INVENTORY: every icon in use, which are generic (candidates to replace with Otto-style
    food art per D5), and the badge/app-icon crop problem (D6).
  - The lamb/chicken/pig emojis on Home and the redundant stat cards on Recipe Detail.

End with: inconsistency ledger, the 5 worst screens ranked (why), and a priority order you argue for.
```

---

## PHASE 2 — Mobbin reference library (extend docs/MOBBIN_COMPARISON.md)

```
[PHASE 0 BLOCK]
Read docs/AUDIT (Phase 1 output) and docs/MOBBIN_COMPARISON.md first — EXTEND the latter.

TASK: Mine Mobbin for principles (not pixels) for every decision in this redesign.
Confirm the Mobbin MCP is connected; if not, tell me and fall back to screenshots.

Research these, pull the 3–5 strongest examples each, say WHY they're strong:
  TAB / NAVIGATION STRUCTURE (this gates everything — do it first)
   - tab bars for recipe / cooking / meal-planning apps: how many tabs, which ones, what merges
   - where "search" lives (own tab vs. in home), how "saved/cookbook" is handled
   - how subscription apps place account/upgrade in the nav
  AUTH & ONBOARDING — character/illustration-led sign in/up; food-app onboarding; preference setup
  HOME / DISCOVER — featured + browse + filter layouts (we keep these concepts, D9); mascot on home
  ACCOUNT / PROFILE — what a minimal, useful account actually contains; subscription/upgrade rows;
   settings that matter (NOT theme — we're light-only)
  FAVORITES / COOKBOOK — how saved recipes are organized
  RECIPE DETAIL — hero, ingredients+scaling, steps, inline video, nutrition that ISN'T a spreadsheet
  SUPPORTING — empty / error / completion states with illustration; app-icon & avatar/badge crops (D6)

For each reference in docs/MOBBIN_COMPARISON.md (append):
  - app + screen + Mobbin link
  - The principle (a transferable rule)
  - The trap (what NOT to copy)
  - Otto's version (one sentence, in our hand-painted warm language)

Synthesis section (append):
  - The recommended NEW tab structure + why (this is the big output of Phase 2).
  - 8–10 principles we adopt, ranked by impact.
  - 3 conventions we deliberately BREAK, justified.
Be skeptical — call out apps that are just polished defaults.
```

---

## PHASE 3 — Codify the design system (light-only truth)

```
[PHASE 0 BLOCK]
Read Phase 1 + 2 outputs. docs/DESIGN_SYSTEM.md + colors.js are ALREADY the source of truth —
reconcile and tighten, don't rebuild. Keep Figma in sync (and publish the Otto library so its
variables are usable in Dev Mode). Figma writes need approval — confirm it's connected.

Update docs/DESIGN_SYSTEM.md + code where needed:
1. TOKENS — confirm the light token set is complete and TOKEN-PURE; list every hardcoded value in
   the codebase that bypasses it (to fix during Phase 4). Dark/niche tokens stay in code, unused.
2. TYPOGRAPHY — display (serif), body (rounded), data face with TABULAR figures for macros/amounts.
3. MOTION SPEC — named reanimated spring configs (not durations) for: screen transition, sheet
   present, save/toggle, step advance, timer tick, celebration. Define the ONE signature moment.
4. HAPTIC MAP — expo-haptics table: event → type → rationale. Nothing off-table gets a haptic.
5. ICON SPEC — pick ONE family + justify vs Otto's warmth; list every icon by screen; identify the
   ones to CUSTOM-DRAW in Otto's hand: the favorite paw-mark (D3), macro glyphs, cooking verbs.
   Also spec the FOOD-ICON SET (D5): category/browse icons as hand-painted food in Otto's style —
   list each needed food, generate from Otto's hero reference, keep them a consistent set.
6. OTTO USAGE RULES (D3/D4) — where he appears (onboarding, empty, success, home greeting, auth),
   where he's forbidden (dense content), his pose inventory→screen map, his voice (5 real string
   specimens: error, empty, completion, sign-in headline, permission ask — plain verbs, sentence
   case). Export/size rules so he never scales to mush. Include the animated-Otto mini-plan (D4:
   Rive vs Lottie, idle + event reactions) as a SEPARATE approve-first proposal.
7. APP ICON + BADGE FIX (D6) — recompose so Otto's face is whole and centered at all sizes.

Deliver as spec first. I approve before component code.
```

---

## PHASE 4 — Redesign screen by screen (tag each REDESIGN vs NEW)

```
[PHASE 0 BLOCK]
Read Phase 1–3 outputs.

SCREEN: <name>   TYPE: [REDESIGN existing | NEW feature]
For NEW features (e.g. cooking mode, timers, onboarding, paywall), write a short functional-scope
note and get my sign-off BEFORE designing — those add product, not just polish.

PASS 1 — plan, not code:
1. The screen's single job (one sentence).
2. Which Mobbin principles apply (from docs/MOBBIN_COMPARISON.md).
3. ASCII wireframes of 2 genuinely DIFFERENT directions (not variations).
4. The signature element per direction — the one thing it's remembered by.
5. Motion / haptic / icon list / Otto role — each traced to the Phase-3 spec.
6. Real copy, written out. No lorem.
7. Self-critique: if a direction is what you'd give ANY recipe app from a generic prompt, throw it
   out. Then remove one element (kill your darling).
8. Recommend one and defend it.
Wait for approval. PASS 2 — build it: reuse sound components, replace what the audit flagged,
screenshot at phone + tablet widths, grade vs the 6 bars honestly, show before/after side by side.

SCREEN-SPECIFIC NOTES:
- TAB BAR / NAV: build the NEW structure from Phase 2 FIRST — it gates every other screen. New
  icons per D7. Redefine what each tab holds and how secondary screens are reached.
- AUTH: replace current art with Otto (mobile/assets/mascot). First contact = the thesis statement.
- HOME (D9): keep featured + recipe grid + filters as concepts; redesign layout; swap category/
  welcome icons for the Otto-style FOOD icons (D5); add a tasteful Otto greeting (static v1).
- ACCOUNT (D2/D8): NO theme/appearance/niche controls. Minimal + useful (from Phase 2 research);
  design a slot for subscription/upgrade.
- FAVORITES: reorganize per Phase 2; favorite action uses the Otto paw-mark (D3).
- RECIPE DETAIL: remove redundant stat cards; keep NutritionCard; steps/ingredients/video per
  Phase 2; nutrition must read as food, not a spec sheet.
```

**Screen order** (adjust if the audit argues otherwise):
1. **Tab bar / navigation structure** — gates everything (Phase 2 decides it)
2. Sign in / Sign up — the identity thesis
3. Home — keep-what-works + Otto food icons + greeting
4. Recipe detail — center of gravity
5. Favorites / Cookbook
6. Account — minimal, subscription-ready, NO theme controls
7. Search (or wherever Phase 2 relocates it)
8. Empty / error / completion states — where Otto earns his keep
9. NEW: onboarding, cooking mode/timers, paywall — scoped separately

---

## PHASE 5 — Adversarial QA

```
[PHASE 0 BLOCK]
TASK: You are the critic now. Walk every screen/flow via Chrome + iOS sim. Produce docs/QA.md:
- Consistency: any second icon family? hardcoded color? off-scale spacing? mismatched buttons?
- Vocabulary: same action, same word from button → toast → header ("Save" → "Saved").
- Motion: anything that snaps, animates for no reason, or ignores reduce-motion.
- Accessibility: contrast, touch targets, screen-reader labels on icon buttons.
- Light-only check: confirm NO theme switcher anywhere and NO stray dark-mode code paths.
- The kitchen test: usable with one greasy hand and a propped phone? Where does it fail?
- The strip test: crop the logo — still identifiably ours? Where did it revert to default?
Rank P0/P1/P2; fix P0s.
```

---

## Run notes

- **This pack + all docs:** edit here / in any Claude Code session (repo files).
- **Executing the redesign:** the **local terminal** — it needs Figma writes (approval-gated elsewhere), downloading generated Otto food-icons (blocked by remote egress policy), running the app + Chrome screenshots, and iOS-sim verification.
- **Prereqs to connect locally:** Figma MCP (writes), Mobbin MCP (auth per session), the image-gen MCP (for the food icons), Chrome MCP.
- **Taste practice (not a prompt):** keep a weekly teardown journal (one app → the *rule* + the *trap*); steal principles never pixels; maintain a rejection list next to the token file.
