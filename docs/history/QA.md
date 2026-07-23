# 🔎 Adversarial QA — Redesign v2 (Phase 5)

> Walked every screen/flow in Chrome (390×844) and on the iOS 26 simulator (iPhone 17 Pro Max,
> Expo Go). Static sweeps via grep across `mobile/`. **P0s fixed in this pass; P1/P2 logged.**
> Date: 2026-07-14 · Run: autonomous (see REDESIGN_NOTES.md).

## Flows walked

| Flow | Web | iOS sim | Result |
|---|---|---|---|
| Sign up screen render | ✅ | — | new copy + framed Otto (hat un-cropped after contentPosition fix) |
| Sign in → Discover | ✅ | ✅ (restored session) | success haptic path; inline errors |
| Discover browse + category filter | ✅ | ✅ | tiles filter in place; ~cal pills match category |
| Search-in-place ("tom yum" → 2 results; gibberish → Thinking Otto) | ✅ | — | browse hides/restores |
| Paw save → persists across full reload | ✅ | — | POST/DELETE verified against live backend |
| Recipe detail (52772) | ✅ | ✅ | true facts only; tinted quantities; video row |
| Cook mode full run (6/6 steps → Proud Otto) | ✅ | — | keep-awake, haptic cadence |
| Saved tab with 1 recipe + count | ✅ | — | in-place unsave available |
| Account → sign out (confirm) → sign in | ✅ | — | web-safe confirm |
| Deep links /profile, /favorites, /recipe/:id after cold load | ✅ | ✅ (expo deep link) | fixed this run (tabs auth-gate kept mounted) |

## Consistency
- **Icon family:** one (Ionicons) + the two Otto marks (paw, food tiles). All glyphs outline at
  rest; filled variants only as active states (tab bar). No second library. ✅
- **Hardcoded colors:** repo-wide grep → **1 found** (PawMark shadow `#2A211B`) → **FIXED**
  (now `colors.shadow`). All scrims/shadows via `OVERLAY.*`. ✅
- **Spacing/radius:** all rewritten factories use `tokens.js` scales. Legacy `LoadingSpinner`
  uses literal 16/32 padding — P2, harmless. Buttons: one primary style (accent fill, radius 14);
  destructive = outline. Screen titles: Lora display on Discover/Saved/Account/Auth/Detail. ✅

## Vocabulary
- **Save → Saved everywhere:** button/tab/screen/empty state one word; "Favorites" appears in
  ZERO user-facing strings (grep-verified — only the route filename `favorites.jsx` and API
  paths remain, per P2-4). Heart and bookmark icons: gone. ✅
- One narrator voice (warm third-person Otto): greeting, empty, error, finish, auth all match.
  ✅

## Motion
- Paw-pop = the signature; springs from named `SPRING.*` configs; `useReducedMotion()`
  respected in PawMark. Nothing animates on scroll; no decorative loops. CalorieRing sweep
  (timing.sweep) **not implemented** — P1 backlog, ring is currently static (acceptable: no
  false motion, just absent).

## Accessibility
- Icon-only buttons all have `accessibilityLabel` + role (paw, back, close, eye, clear, play,
  tabs via labels). Paw exposes `accessibilityState.selected`. ✅
- Touch targets: paw 36pt + 10 hitSlop (56 effective), cook-mode Next 56pt, eye/clear buttons
  **FIXED** this pass with hitSlop ≥40pt effective. ✅
- Contrast: ink on bg 12.9:1; inkSoft on bg 4.6:1; white on accent 4.29:1 — used at ≥15pt
  bold only (buttons/labels) per DS note. Caption-on-photo sits on scrim. ✅
- Dynamic Type: no `allowFontScaling` disabling anywhere. ✅

## Light-only check (D2)
- No theme switcher, appearance row, or niche picker anywhere in UI (grep + walkthrough). ✅
- `useColorScheme`/`isDark` consumers: **zero** outside the locked ThemeContext. ✅
- `app.json` `userInterfaceStyle: "light"`; splash/adaptive colors pinned to palette. ✅
- THEMES dark/niche sets remain in `colors.js` unused — by design (D2). ✅

## The kitchen test
Cook mode: one thumb-sized Next (56pt), one sentence per screen at 24/32, screen stays awake,
ingredients one tap away, progress visible. **Passes** for the first time in this app's life.
Detail page fallback (no cook mode): quantities tinted + 16/24 body — readable at arm's length.

## The strip test
Logo cropped out: hand-painted food tiles + watercolor otter + paw marks + Lora serif on cream +
terracotta = identifiable in any single viewport. Weakest screen: Account (mostly neutral rows —
but the Otto badge + serif title carry it). **Passes.**

## Findings & dispositions

| # | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | P0 | PawMark hardcoded shadow hex | **FIXED** → `colors.shadow` |
| 2 | P0 | Failed save was silent (offline) | **FIXED** → error haptic + optimistic rollback (was already rolling back) |
| 3 | P0 | Eye/clear-search touch targets < 44pt | **FIXED** → hitSlop |
| 4 | P0 | Cold-load deep links reset to Discover | **FIXED** in P4-3 (tabs gate kept mounted) |
| 5 | P1 | No undo affordance after unsave (mis-tap loses a recipe silently) | **FIXED** (post-QA pass): ToastProvider + "Removed from Saved · Undo"; stale-closure bug in Undo found & fixed (SavedContext reads state via ref); verified end-to-end on web |
| 6 | P1 | CalorieRing sweep + entrance staggers unimplemented | **FIXED** (partial): ring now counts 0→~N over 500ms ease-out, reduced-motion safe; entrance staggers still backlog |
| 7 | P1 | Saved-tab cards show default ~420 est. (no category column in DB) | **FIXED**: `category` column added (drizzle push, additive), POST/optimistic rows carry it; Saved cards now estimate by real category |
| 8 | P2 | LoadingSpinner literal paddings | Cosmetic; migrate on next touch |
| 9 | P2 | `youtu.be` fix untested against a live shorts URL | Regex unit-verified only; no shorts URLs in TheMealDB sample |
| 10 | P2 | Haptics no-op on web (expected) — no web fallback feedback for save | Acceptable: web is a preview surface, not truth |

## Verdict
No open P0s. The four release-blocking classes the founder flagged — theme switcher remnants,
stray dark-mode paths, second icon family, hardcoded colors — are all **clean**.

## Round 3 — Adversarial QA on the B0/B1/SSO batch (2026-07-15, terminal)

Read-only QA subagent over the backend hardening + nutrition pipeline + social
sign-in diff. 12 findings, all dispositioned same-session; suite + live smoke
green after fixes.

| # | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | P1 | Seed-nutrition views shared the import rate budget — browsing ~20 recipes 429'd `/api/import` | **FIXED** → dedicated `seedReadLimiter` (120/15min); generic 429 copy |
| 2 | P2 | Backfill stale-write race: overlapping edits could pair old nutrition with new ingredients | **FIXED** → conditional UPDATE guarded on `updated_at` captured at read |
| 3 | P2 | `null/servings === 0` fabricated `0g` macros when Edamam omitted a nutrient | **FIXED** → null-preserving `per()` helper ("null beats a guess") |
| 4 | P2 | Import could emit drafts its own save schema rejects (>2000-char steps, >200-char names) | **FIXED** → clamps + sentence-boundary step splitting in `importRecipeFromUrl` |
| 5 | P2 | Editor return didn't refresh computed nutrition → pre-edit numbers on new ingredients | **FIXED** → focus refetch also sets `computedNutrition` + `servings` |
| 6 | P2 | Anonymous guest on SIGN-IN got `linkIdentity` → "already linked" dead end for returning users | **FIXED** → mode split: sign-in switches accounts (email parity), sign-up links |
| 7 | P3 | Anonymous check was a network call — transient failure could mint a fresh user | **FIXED** → local `getSession()` read |
| 8 | P3 | Unanalyzable seed recipes re-paid the provider on every view (no negative cache) | **FIXED** → `{unavailable:true}` sentinel row; dormant state never caches |
| 9 | P3 | Any PUT (even a title typo) voided nutrition + burned an Edamam call | **FIXED** → invalidate only when ingredients/servings actually differ |
| 10 | P3 | `/api/plan?start=garbage` reached postgres → 500 | **FIXED** → DAY-regex 400 |
| 11 | P3 | Web OAuth fell back to dashboard Site URL → session stranded on wrong origin | **FIXED** → `redirectTo: window.location.origin` |
| 12 | P3 | OAuth deep link flashed Unmatched Route (no `/auth/callback` screen) | **FIXED** → redirect stub route |

Clean areas confirmed by the same pass: all zod schemas vs. every live mobile
call site, Apple nonce handling, lazy native imports, RecipeSource, parser math,
NutritionCard partial-object rendering.
