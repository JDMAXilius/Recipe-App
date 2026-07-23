# V2 Parity Gaps — Round 2 (UI/UX fidelity + missing features)

Authoritative "what's still left" after P0–P4. Built from a 4-scout read-only
audit diffing v1 (`main:mobile/…`) against v2 (`rebuild/v2:src/…`), 2026-07-22.
The rebuild is functionally rich but **the visual/interaction fidelity drifted**
and a set of **whole features were dropped**. Everything below is v1↔v2 verified.

**The pattern:** v2 kept the *libraries* (motion.ts, haptics.ts, Screen.tsx,
NutritionCard, OttoStates) but lost the *wiring* — icons became text glyphs,
mascots were stripped from loading/empty/error states, haptics went from ~60
sites to 4, the nav shell fragmented, and several v1 features never got ported.

Severity: **P0** = founder-reported or core-feel · **P1** = clear regression ·
**P2** = polish / lower-traffic.

---

## A. CROSS-CUTTING — fix once, fixes many screens (HIGHEST LEVERAGE)

These four account for most of "it doesn't look/feel the same."

### A1 · Icons → text glyphs everywhere  **[P0]**
v2 replaced Ionicons with Unicode glyphs (`◷ ☰ ‹ × ◉ ○ ▷ ✕ ›`) across Cook, Plan,
Shopping, Editor, Account, Detail. This *is* the "cook buttons UI wrong" issue.
`@expo/vector-icons` (Ionicons) is already installed (tab bar uses it).
**Fix:** sweep those glyphs → Ionicons (`time-outline`, `list`, `arrow-back`,
`close`, `checkmark-circle`/`ellipse-outline`, `play`, `close-circle`, chevrons).

### A2 · Otto mascots stripped from loading / empty / error / finish states  **[P0]**
`OttoLoading` / `OttoError` (`src/shared/ui/OttoStates.tsx`) are faithfully
ported but **rendered nowhere**; `OttoIdle` appears in exactly 1 place (v1: many).
Screens have no loading/error branch — data just pops in; empty states are a bare
text line. The Duolingo-style cooking-tip loader + sad-Otto error never appear.
**Fix:** render `<OttoLoading>`/`<OttoError>` from every query's loading/error
state; put `OttoIdle`/`OttoArt name="scene-empty"` in every empty component
(Discover grid, Cookbook, Plan, Add parsing, cook finish).

### A3 · Haptics gutted — ~60 sites → 4  **[P0]**
v1 fired haptics in ~30 files; v2 fires them in 3 (save, ＋, share). `haptics.ts`
wrapper is fine — just uncalled. Missing: tab switches, auth success, plan add /
shopping check-off / selection taps everywhere, and the **entire cook flow**
(step advance, timer done, toggles).
**Fix:** re-add `haptics.select()/impact()/notify()` at those interaction sites.

### A4 · Navigation shell fragmented  **[P0]**
- `fullScreenGestureEnabled` dropped app-wide → only thin edge-swipe (nothing on
  Android). v1 had drag-anywhere back. **Fix:** add to root Stack `screenOptions`
  (`app/_layout.tsx:29`), opt cook + onboarding out.
- **No back/close on Recipe Detail, Edit/New-recipe, Shopping** (the "no X" bug).
  **Fix:** route them through `src/shared/ui/Screen.tsx` (has back + safe-area) or
  add a floating hero back on Detail.
- Cook lost `gestureEnabled:false` → native back-swipe races its step-swipe.
  **Fix:** `<Stack.Screen name="recipe/cook/[id]" options={{gestureEnabled:false}}/>`.
- Three back treatments (`Screen.tsx` glyph, profile `Frame.tsx` "‹ Back" text,
  and nothing) vs v1's one back-pill header. **Fix:** standardize on `Screen.tsx`,
  retire `Frame.tsx`; restore the 44×44 back-pill look.
- Global safe-area top inset dropped; some screens sit under the notch.
  **Fix:** insets via `Screen.tsx` on Shopping / Edit / profile Frame screens.

---

## B. RECIPE DETAIL (the founder's epicenter)  `RecipeDetailScreen.tsx`

### B1 · Nutrition card reverted  **[P0]**
v2 `NutritionCard.tsx` is a stripped shell of v1. Restore:
- Bordered **card chrome** (radii.card, padding, creamDeep/white) — v2 is bare text.
- The proportional **macro segmented bar** (protein/carbs/fat by calorie share).
- **Macro colors** — blue/amber/purple (`tokens.macro`, present but unused) + dots.
- The **per-serving ↔ whole-recipe scope toggle** + scope sentence ("about Xg each").
- **"% of cals" per macro** (v2 shows grams only).
- Ring label `est. kcal` (v2 dropped "est.").

### B2 · Metric/US toggle should not be here  **[P0]**
v1 has NO unit toggle on detail — units are a **global weight-first pref** set only
in Account. v2 *added* a US/Metric `SegmentBar` on Ingredients. **Fix:** remove it;
drive `scaleIngredients` from the global pref (`usePrefs().unitSystem`).

### B3 · Nutrition not updating/loading  **[P0]**  *(root cause)*
`useNutrition` keys `['nutrition', id]` only + 60s staleTime + no focus-refetch, so
after an edit it serves pre-edit numbers. **Fix:** invalidate `['nutrition', id]`
on edit (or hash ingredients into the key) + refetch the recipe on focus for own recipes.

### B4 · Pinned bar buttons wrong  **[P0]**
v1: compact **calendar-icon** add-to-week (54×54 outlined) + **flame-icon
`Bounceable`** "Start cooking" (`Bounceable` exists in v2). v2: two plain
full-width text buttons. Also lost the **"Add steps to cook this"** fallback (no
path to add steps when a recipe has none), and the bar has no bottom safe-area inset.

### B5 · Other detail regressions  **[P1]**
- **User recipes have no edit button** at all (v1 hero pencil → `/recipe/edit`).
- Attribution collapsed to one plain line — lost the **tappable source link**,
  Otto badge, "By you" author framing (3-state).
- Method stripped to a numbered list — lost **duration chips, temperature
  highlighting, "uses: a·b·c" matched-ingredient line, per-step play** into cook.
- Hero has no back button + no top safe-area inset (PawMark collides with notch).
- Eyebrow lost uppercase-terracotta styling; meta row lost its framed band+dividers;
  ingredient rows lost the trailing gram weight, the reset/scale chip, hairlines,
  and stepper haptic; related lost its subtitle; share moved from a hero icon to an
  inline section (+ public share-link minting for own recipes may be dropped — verify).

---

## C. DISCOVER  `DiscoverScreen.tsx`
- **[P1] Cuisine/area filter removed** — v1 `FilterSheet` intersects Category AND
  Cuisine server-side; v2 only filters already-loaded categories (search results).
- **[P1] "Ask Otto" band removed** (CTA between Tonight and Otto's pick).
- **[P1] Otto's-pick hero** — v1 overlays title/badge on the image w/ gradient +
  meta icons; v2 puts a plain text block below, no icons.
- **[P1] Empty & search-loading lost mascots** (see A2).
- **[P2] Category tiles lost selection haptic** (see A3).
- *(Pref-aware pick + Tonight band were added in P4 — those are done.)*

## D. RECIPECARD (grid tile, used everywhere)
- **[P1] Cookbook card lost the calorie badge + macro dots entirely** (nutrition
  hook "not allowlisted to cookbook") — saved/my tiles show no calories.
- **[P1] Macro dots removed** from all cards (v1 had 3 colored dots under title).
- **[P2] Discover card calories are estimate-only** (v1 showed computed when
  available so card+detail agree).

## E. COOKBOOK  `CookbookScreen.tsx`
- **[P1] Deep-link params dropped** (`?segment=` / `?cooked=1`) — Account stat
  tiles won't open the right filtered view.
- **[P2] Segment control** restyled (v1 painted terracotta-daub underline →
  generic pill SegmentBar); "Cooked" chip lost its flame icon.

## F. PLAN / WEEK  `PlanScreen.tsx`
- **[P1] Planned-dish thumbnails removed** (rows are text-only; v1 showed images).
- **[P1] Row action icons → text labels** (add `+`, swap shuffle, cooked flame,
  remove close, leftovers refresh → text); cooked title no longer strikes through.
- **[P2] Swap/leftovers mechanics changed** (v1 swap auto-picks from pref pool +
  "cook once eat twice" any-day leftovers section; v2 swap opens picker, leftovers
  = "+ tomorrow" only). Picker sheet lost thumbnails.

## G. SHOPPING  `ShoppingScreen.tsx`
- **[P0] Check/custom state no longer persists** — v1 → AsyncStorage; v2 `useState`
  only, so ticks + extras vanish on unmount. **Fix:** persist to `kv('shoppingState')`.
- **[P1] "Notepad" treatment gone** (paper pad, double-rule frame, banner flag →
  plain list).
- **[P1] Share-the-list removed** (picture card / text / snapshot-link).
- **[P1] No back button** (see A4).
- **[P2] Removable source-recipe chips, "week changed — update?" banner, household
  door** all removed; add-item round `+` → text button.

## H. ACCOUNT  `ProfileScreen.tsx`
- **[P1] Editable name + Otto avatar removed** (v1 badge + tap-to-edit name → plain
  text, no avatar, not editable).
- **[P1] Settings rows lost their icons** (lock/restaurant/bell/scale/camera → "›").
- **[P1] Whole sections missing:** "Spread the word" (tell-a-friend + rate) and the
  boring-but-important rows (report-a-bug w/ version+platform, Privacy, Terms,
  About/version). v2 keeps only FAQ + Send-a-thought.
- **[P2] Membership club card flattened**; journal row lost photo-count+camera;
  sign-out lost destructive styling.

## I. COOK MODE  `CookScreen.tsx` + StepCard + TimerHub
- **[P0] Timer alarm sound + vibration removed** — timers fire silently (miss-able).
- **[P0] Keep-awake removed** — screen sleeps mid-cook (v1 `useKeepAwake`).
- **[P0] Live ingredient scaling + unit conversion removed** — changing servings in
  prep does nothing; the Units pref is ignored (raw `pair.measure` shown).
- **[P0] Icons → text glyphs** (see A1) + **cook flow has zero haptics** (see A3) +
  **step-advance fade/slide animation removed** (steps snap in).
- **[P1] "Would you cook it again?" thumbs rating gone** from finish (v2 added a
  NutritionCard there instead — keep both).
- **[P2] Floating timer lost "+5"** (only +1).
- *(Preserved: mise-en-place, pager, progress daubs, timer hub, action-art,
  exit-protection, snap-your-plate.)*

## J. CREATE (＋) / CHAT FLOW
- **[P1] The ＋ tab does a different thing** — v1 `create` tab = **Chat with Otto**
  (chat-first creation, import as a header action); v2 `create` tab = blank
  `EditRecipeScreen`, chat demoted to `/ask` behind the Add sheet. **Decide intent.**
- **[P1] Recent-chats history gone** (`/chats` 30-day threads); `useChat` doesn't
  persist. Chat lost its header doors (recent + import).

## K. ADD / IMPORT  `AddSheet.tsx`
- **[P1] "Paste text" import removed** (paste a DM/note → Otto sorts it).
- **[P1] Clipboard-link detection removed** ("Otto spotted a link — tap to paste").
- **[P1] Failure UX flattened** — v1 Sad-Otto "that one got away" screen w/ tips +
  3 recovery CTAs → one inline error line; parsing lost its thinking-Otto.
- **[P2] 4-tile grid → button stack; share-in coach (`ShareCoachSheet`) removed.**

## L. RECIPE EDITOR  `EditRecipeScreen.tsx`
- **[P1] Device photo upload removed** — only a "PHOTO LINK" text field; can't add a
  picture from the phone. (`expo-image-picker` + `uploadRecipePhoto` now exist —
  wire library pick → storage upload.)
- **[P1] Icons/badges → text** (step badges, remove ✕, delete/save bars) + no
  back/close (see A4).
- **[P2] "reads as 240 g" live weight preview removed; generate panel no longer
  collapsible.**

---

## M. WHOLLY-MISSING FEATURES (higher effort, separate from fidelity)
1. **Recent chats** screen + chat-history persistence.
2. **Shopping-list sharing** + shopping-state persistence.
3. **Paste-text import** + clipboard detection + share-in coach.
4. **Editable username + Otto avatar**; Tell-a-friend / Rate / Report-a-bug /
   Privacy / Terms / About-version rows.
5. **Cook: timer sound + vibration + keep-awake**, cook-again rating, **live
   ingredient scaling / unit conversion**.
6. **Device photo upload** in the editor.
7. **Cuisine/area filtering** + fuller preference-aware Discover (diet-hidden tiles,
   diet start-category).

---

## PROPOSED REMEDIATION WAVES (prioritized)

**Wave F1 — Fidelity sweep (P0, highest perceived value, mostly mechanical):**
A1 icons→Ionicons · A2 mascot states · A3 haptics · A4 nav shell (gesture + backs +
safe-area) · B1 nutrition card · B2 remove metric/us · B3 nutrition refetch · B4
cook/plan buttons. Fixes the bulk of "it doesn't look/feel the same."

**Wave F2 — Screen regressions (P1):** B5 detail (edit btn, attribution, method) ·
C Discover (cuisine filter, Ask-Otto band, hero) · D/E cards+cookbook · F plan
thumbnails/icons · G shopping (persist + notepad + share + back) · H account
(name/avatar/icons/sections) · I cook (sound/keep-awake/scaling) · J create-flow ·
K/L add+editor (paste-text, photo upload).

**Wave F3 — Missing features (P2, scoped):** the M-list, sized individually.

Same methodology as P0–P4: contracts where needed, builder/verifier crews per
wave, device-verify the feel. `main` (v1) is the visual source of truth — diff the
exact `mobile/…` file when building each fix.
