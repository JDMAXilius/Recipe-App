# Otto v2 — Parity Gaps vs v1

Authoritative inventory of everything present in the **v1 app** (on `main`,
audited at `/tmp/otto-v1`) that is **ABSENT**, **PARTIAL**, or **CHANGED** in
the **v2 rebuild** (`rebuild/v2`). Produced by a 6-way parity audit + asset
inventory. Master punch-list for reaching feature parity before any cutover.

Legend: **ABSENT** = not in v2 · **PARTIAL** = started, pieces missing ·
**CHANGED** = behaves differently/worse.

---

## 0. Scale of the gap (read this first)

v2 nailed the **architecture + deterministic core** — one nutrition engine
(byte-identical), RLS, TanStack Query, TypeScript, one codebase, honest
nutrition. On **product experience it is a skeleton of v1**: the mascot, art,
animation, haptics, chat, onboarding, and the rich cook/planner/share/import
flows were deferred under the rebuild's "no new deps / one folder per agent"
packet constraints.

**Biggest buckets:**
- **Assets — 67 painted files, 0 in v2.** No `assets/` dir at all. Every Otto
  is a dashed placeholder box; the paw is a 🐾 emoji; category tiles use stock
  thumbnails; no splash, no onboarding art.
- **The whole "feel" layer is gone** — Bounceable press-springs, haptics,
  OttoIdle/Loading/Error mascot states, count-up rings, image fades, Lora font
  (never actually loads).
- **Whole features absent** — Ask-Otto chat, onboarding, animated splash,
  notifications engine, household live-sync, share actions, cook-mode entry.
- **Nothing persists** — AsyncStorage not installed; units/prefs/journal/
  shopping/onboarding-gate/**auth session** all reset on restart.
- **Anonymous/guest browsing is broken** — no onboarding → no
  `signInAnonymously` → the "browse before an account" promise doesn't work.

**Rough priority for closing it** (proposed, to discuss):
1. **Assets + Lora fonts** — copy the 67 files in, wire `OttoArt`/`PawMark`/
   food-art/splash. Biggest feel-restore for least effort/risk.
2. **The feel layer** — `Bounceable`, `expo-haptics`, OttoIdle/Loading/Error,
   ring/image animations.
3. **Persistence** — install AsyncStorage; restore session persistence, prefs,
   journal, shopping list, onboarding gate.
4. **Reachability/core flows** — cook-mode entry + seed cooking; onboarding +
   guest entry; native social OAuth.
5. **Rich features** — Ask-Otto chat + create flow, import modes (text/photo/
   photo-upload), notifications, household sync, share actions, filter sheet.
6. **Per-screen polish** — the CHANGED/PARTIAL items in each section below.

---

## 1. Assets (67 files — all ABSENT)

v1 `mobile/assets/` → v2 has no `assets/`. `OttoArt.tsx` and `PawMark.tsx`
render placeholders; comments admit "art assets don't exist in the v2 tree."

| Group | Files | Used for |
|---|--:|---|
| mascot | 28 | Otto expressions (happy/proud/sad/sleepy/thinking/excited/idle…), hero, badge |
| food | 14 | hand-painted category tile icons (getFoodIcon) |
| actions | 10 | cook-step art (chop/mix/sauté/simmer/bake/wait/season/pour/serve…) |
| onboarding | 4 | 3-screen onboarding illustrations |
| images | 4 | misc screen art |
| glyphs | 4 | paw / UI glyphs |
| paper | 3 | cream paper textures / surfaces |
| brands | 2 | Google / Facebook marks (social buttons) |
| splash | 2 | still + animated lid-lift video |
| sounds | 1 | timer-alarm.wav |

Restoring these is mostly **copy + wire**, not re-illustration.

---

## 2. Discover / Recipes / Nutrition

- [ABSENT] Cold-start loader `OttoLoading` (Sleepy Otto + rotating tips) → v2 empty FlatList while loading.
- [ABSENT] Error state `OttoError` (retry) → failed query silently yields empty grid.
- [ABSENT] Pull-to-refresh (RefreshControl) → none.
- [ABSENT] Greeting Otto mascot (`OttoIdle`, breathing + hops on save) → text only.
- [ABSENT] Filter button + **FilterSheet** (Category × Cuisine chips, live "Show N recipes" count, Clear all) + active-filter dot → gone entirely.
- [ABSENT] Search clear (X) button; search loading indicator ("Otto's looking…").
- [ABSENT] "WHAT'S COOKING TONIGHT?" band (first uncooked plan entry) + dinner-reminder sync.
- [ABSENT] Ask-Otto entry card between Tonight and Otto's pick.
- [ABSENT] Preference-aware Otto's pick (diet wins, cuisines narrow) → v2 pure random.
- [ABSENT] Diet-driven browse (start on diet category, hide meat tiles) + prefs re-seat on focus.
- [CHANGED] Otto's-pick card: v1 Bounceable image-overlay w/ icons + fade → v2 plain Pressable, caption below image, no bounce/fade.
- [CHANGED] Category tiles: v1 hand-painted food-art + Bounceable + haptic + "Misc" remap → v2 stock thumbnails, border ring, no haptic.
- [CHANGED] Empty states: v1 two distinct Otto states (thinking/sad + copy) → v2 one plain caption.
- **RecipeCard:** [ABSENT] calorie badge (batched, agrees with detail); macro dots; "By you"/imported ownership stamps. [CHANGED] Bounceable→Pressable; expo-image 300ms fade→none.
- **Recipe detail:** [CHANGED] hero share button (text-share + long-press card capture + link mint) → v2 inline static ShareCard section only. [ABSENT] hero edit button; scale reset chip; stepper haptics; per-serving/whole-recipe nutrition toggle; segmented macro bar + %-of-calories legend; CalorieRing count-up; method step enrichment (duration/temp tint + "uses:" line); per-step play→cook; **"Start cooking" button (cook unreachable)**. [CHANGED] weight-first/cups unit modes → Metric/US local segment; native video plays inline → v2 opens YouTube app. [PARTIAL] related caption; own-recipe focus-refetch; pinned-bar safe-area inset; add-to-week haptic.
- [ABSENT cross-cutting] Bounceable, the Otto mascot system, and all haptics on these screens.

---

## 3. Cook mode

- [ABSENT] **Entry from recipe detail** — no "Start cooking" button; `/recipe/cook/[id]` route exists but nothing navigates to it → **cook mode unreachable**.
- [ABSENT] Per-step play deep-link; no-steps→editor fallback.
- [ABSENT] **Cooking SEED recipes** — v2 loads only user recipes from the DB; TheMealDB seeds return null.
- [ABSENT] Timer alarm **sound** (timer-alarm.wav); **haptics** (all); vibration burst; **keep-awake**.
- [ABSENT] **Live ingredient rescaling by servings** + unit conversion + gram weights (stepper affects nothing in v2).
- [ABSENT] "Snap your plate" journal capture; "cook it again?" thumbs rating; timer auto-dismiss (4s); floating "+5" chip.
- [CHANGED] "Mark cooked" — v1 always records; v2 only flips `plan_entries.cooked` for rolling-week entries (unplanned/earlier cooks never recorded).
- [PARTIAL] Otto action art (placeholder); Proud-Otto finish (placeholder, no entrance, drops thumbs+plate, adds NutritionCard); loading art (placeholder).
- [CHANGED] step-advance animation (static); swipe nav (PanResponder vs gesture-handler).
- PRESENT (parity minus above): prep + checkable rows; big-type steps + timers; timer hub; undercooked modal; exit-protection; ingredients sheet; progress daubs.

---

## 4. Cookbook / Planner / Shopping / Household

**Cookbook:** [ABSENT] card calorie badge + macro dots; `?segment=`/`?cooked=1` stat-door deep links. [CHANGED] loading spinner→none; flame icon→text. PRESENT: segments, cooked filter, empty states, paw/source stamps.

**Planner:** [ABSENT] in-plan **recipe picker** ("What's cooking?", per-day +, browse cookbook); **leftovers** (cook once eat twice); **swap** + `suggest.js` preference pool; entry thumbnails; haptics. [PARTIAL] add-to-week moved to detail sheet (can't pick inside planner). [CHANGED] optimistic writes→round-trip; build-list nonce→plain push. PRESENT: 7-day view, cooked check-off, remove, empty-week.

**Shopping:** [ABSENT] **list persistence** (checked/custom/excluded reset); stale-week banner; removable source chips (exclude a recipe); **share as picture** (ShoppingListShareCard) + snapshot link; header actions (household/share); **ml/volume track** (thin liquids); missing-dish retry. [PARTIAL] seed-recipe support (only user recipes resolve); seasoning-floor semantics changed. [CHANGED] notepad chrome→plain header; custom items not persisted. PRESENT: summed grams, aisle sections, provenance, no-reorder check-off.

**Household/collab:** [ABSENT — entirely on-device stub] backend `CollabAPI` (create/get/check/add/remove/put-away); unguessable **invite links** + join-by-link; cross-device sync/polling; member avatars + per-item attribution; synced add/check/remove; revoke vs leave; recent-lists rejoin; seed-from-shopping; membership persistence. (`collab_*` tables/RPCs exist but are unused.)

---

## 5. Import / Create + Auth

**Import/Create:** [ABSENT] paste-**text** import; **photo/camera** import (OCR); **"Chat with Otto"** multi-turn AI create (the primary path — create tab just re-exports the editor); chat history + `?chat=` reopen + Recent chats; voice affordance; **photo upload to storage** (editor only takes a link URL); clipboard link detection; share-intent entry (TikTok/IG) + ShareCoachSheet; live weight-first ingredient preview. [PARTIAL] AI one-shot only (chat variant gone); servings passed but diet/cuisines never wired. [CHANGED] failure UX (sad-Otto + 3 recovery CTAs → one error line; failed URL not carried into manual entry); add surface (4-tile grid + Ask-Otto → one URL input + 2 buttons); no import/generate timeout/retry. PRESENT: editor (review-before-save, stepper, add/remove rows, delete, isDirty guard); draft hand-off.

**Auth:** [ABSENT] **native social OAuth** (Apple sheet, Google/FB via web-browser) — v2 throws on native, web-only; `fetchEnabledProviders`; **anonymous/guest entry** (`signInAnonymously` — nothing creates a guest session); **username editing UI** (helpers ported but no screen calls them); **native session persistence** (no AsyncStorage → logged out every restart); (auth) route guard + unauth→(auth) steering. [CHANGED] social buttons (brand marks→text); OAuth callback/redirectTo; hero art (placeholder). PRESENT: sign-in/up, forgot/reset/change password, anon-upgrade-in-place, onAuthStateChange, password toggle.

---

## 6. Profile / You / Settings

**Profile/You:** [ABSENT] inline editable display name (+ save to `user_metadata`); Otto avatar/badge in header; haptics; "Spread the word" (tell-a-friend + rate); "Report a bug"/"Privacy"/"Terms"/"About vX" rows. [CHANGED] "cooked" stat = lifetime → this-week-only; "yours" can show "—". [PARTIAL] journal row loses count badge; stat-door routes changed.

**Journal:** [ABSENT] photo grid (2-col plate photos, newest-first, tap→recipe); persistence — v2 is a hard-coded empty state.

**Preferences:** [CHANGED] units/food-prefs no longer persist (session-local; AsyncStorage absent); v1 diet actually filtered Discover, v2 has no downstream effect. [PARTIAL] cuisines hard-coded 17 vs live-fetched.

**Notifications:** [ABSENT — entirely] scheduling engine (tonight/Sunday reminders w/ dish name), permissions, denied-banner, prefs persistence — v2 toggles are cosmetic.

**Otto Club:** [PARTIAL] timeline 3→2 nodes; hero art + iconed benefits absent; waitlist not persisted. Pricing math correct. IAP frontend-only in both (parity).

**FAQ:** parity. **Household entry:** now linked from Preferences (see §4).

**Persistence summary:** v2 persists **none** of units/prefs/notifs/journal/club-waitlist/household across restart (AsyncStorage not installed). Only server-backed data survives.

---

## 7. Ask-Otto / Share / Onboarding / Splash / Shell

**Ask-Otto chat — FULLY ABSENT:** recent-chats screen; AskOtto entry card; chat history store (30-day/50-cap); chat summary/grouping; `ottoBus` event bus (+ Otto reactions); `/create?chat=` reopen. The entire conversational assistant is gone.

**Onboarding — FULLY ABSENT:** 3-screen painted flow; first-run gate (`otto.onboarded.v1`); end-anon account-wall timing (`signInAnonymously`→Discover); skip + haptics.

**Splash — FULLY ABSENT:** animated lid-lift video (fade+rise, 3s hold, dissolve); tap-to-skip; reduced-motion branch; "Otto" Lora wordmark; splashDone gate.

**Share — PARTIAL (card only, actions unwired):** ShareCard is an inline static preview (paw = placeholder); [ABSENT] image capture (viewShot→PNG→share sheet); tall-card capture; ShoppingListShareCard; ShareCoachSheet; native/web share-intent dispatch. [CHANGED] buildRecipeShareText signature + drops unit-scaling & seed attribution. [UNWIRED] create-link/copy hooks exist but no screen imports them; `mintToken` throws on device.

**App shell:** [CHANGED] provider stack dropped ThemeProvider/SavedProvider/NutritionProvider/GestureHandlerRootView. [ABSENT] **Lora font loading** (never loaded — serif falls back to system); share-intent receiving; iOS full-screen back gesture; ScreenHeader primitive; SafeScreen; **Bounceable**; global Otto mascot beats.

**Mascot/animation:** [ABSENT] OttoIdle (breathing/hop/entrance); OttoLoading/OttoError; LoadingSpinner. [PARTIAL] OttoArt = placeholder box. [CHANGED] **PawMark** = dumb emoji toggle (dropped spring-pop, haptics, first-save celebration, account-wall, ottoBus emit, undo toast, offline rollback, real paw art).

**Native infra:** [ABSENT] haptics; keep-awake; notifications scheduling; expo-share-intent. PRESENT: native video (ported).
