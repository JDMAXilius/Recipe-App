# TERMINAL TICKET — REBUILD 04 · M4 integration, review, cutover

**Goal:** assemble the 9 merged features into a booting app, close the M3
carry-over gaps, run L3 journeys for real, review-swarm, then device QA +
the single cutover PR to `main`. Last milestone.

**Kick-off:** M3 done (9 features, 163/163 @21c9e20a). Work branch: `rebuild/v2`.
Integration is COHESIVE (routes import every feature, providers wrap all) —
done in the main loop, not a fan-out. Verification is hands-on (Expo web boot).

## Phase A — foundation gaps (unblock clean wiring)
- `@/shared/ui` **Input** primitive (auth AuthInput + import RecipeInput adopt it)
- `Ring` **max-less variant** (nutrition CalorieRing drops the FDA-interim denominator)
- `@/types/ids` **UserId** brand + `toUserId()`; auth re-exports user.id as UserId
- add **expo-crypto** (share on-device tokens) + note native-social deps for device stage

## Phase B — routes + providers (app/ boots)
Thin route files per FRAMEWORK §2 (~24), each imports one feature screen:
- `app/_layout.tsx` — QueryClientProvider + AuthProvider (the one provider)
- `(tabs)/{_layout,index,cookbook,create,plan,profile}` · `recipe/[id]` ·
  `recipe/cook/[id]` · `recipe/edit` · `(auth)/{_layout,sign-in,sign-up,forgot-password}` ·
  `{add,shopping,onboarding,otto-club,journal,household,notifications,preferences,faq}` ·
  `auth/callback` · `{reset,change}-password`
- exit-guard, safe-area, fonts (Lora) loaded here

## Phase C — cross-feature wires
- cookbook Cooked filter → `useCookedState()` (allowlisted)
- cookbook exports my-recipes count → profile "yours" door shows a number

## Phase D — L3 journeys for real
Boot `expo start --web`, run the authored journeys (smoke + per-feature) via
Playwright/Chrome; ANY console error fails; assert recorded engine numbers
(garlic-butter-chicken 414 kcal / 2.7g carbs). Screenshots in the report.

## Phase E — review swarm
Parallel critics over the integrated app (correctness, honesty-law, RLS-at-rest,
a11y, dead code) → adversarial verify → fix → repeat until 2 dry rounds.

## Phase F — device QA + cutover (FOUNDER)
Terminal: `expo prebuild` + simulator/device walk of TESTING.md L4 checklist
(haptics, native video, sign-in, IAP-when-live, cook keep-awake, splash).
Then the final commit DELETES `mobile/` + `backend/`; open ONE PR
`rebuild/v2 → main`; founder approves → merge = cutover.

## Acceptance / Gate M4
App boots green on web; journeys pass; review loop dry ×2; device QA walked;
founder approves the cutover PR.
