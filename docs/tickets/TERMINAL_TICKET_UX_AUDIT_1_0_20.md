# UX audit → 1.0.20: trim, rework, fix (Claude Code ticket)

> **DONE 2026-10-04** in build 46 (shipped as version string 1.0.19 to replace build 41 in review, Juan's call). Not built: goal question (02), Household Copy button (no clipboard lib). F3: transport-failure retry; root cause inferred from logs, not reproduced.

> **Budget:** the copy and fixes are already decided below; implement, don't re-research.
> Open `plan.html` once for a screen you're on, not all of it. Read only the file each item
> names. Run `tsc`/lint/tests once at the end, not per item. Skip Mobbin.

Written 2026-10-04 from a full walk of the app on the simulator plus Mobbin references.
**Owner: Claude Code (implementation).** The visual plan with every screenshot, side by
side with the references, is `docs/ux-audit-2026-10-04/plan.html` (open in a browser) and
`docs/ux-audit-2026-10-04/img/`. Otto screens are `otto-*.jpg`; references are `ref-*.jpg`.
Published copy of the same page: https://claude.ai/artifact/Mn57Gajsg5YqYS8EWd4aEQ

**The rule behind every item (Juan, 2026-10-04):** professional, not chatty. Top apps
(Calm, Cal AI, ReciMe, Kitchen Stories, Duolingo) say one thing per screen, then get out of
the way. Delete explainer captions, mascot narration and repeated reassurance. Keep Otto's
voice in the art and the occasional headline, not in the fine print.

## Ground rules
- **Ships in 1.0.20**, on top of builds 43–44 (hard paywall). Do NOT touch 1.0.19 build 41
  (in review). Don't submit anything to App Review; Juan gives that go.
- Copy below is exact. Where it says "delete", delete the element, not just the string.
- Don't touch: the paywall (`OttoClubScreen.tsx`, verdict Keep — note the 2026-10-04 audit added an `OTTO CLUB` eyebrow and "Renews automatically" to the fine print for Apple 3.1.2; keep both), the SIWA
  `appleAuthorizationCode` flow in delete-account, the membership gate in
  `app/(tabs)/_layout.tsx`.
- Follow `docs/design/motion.md` and the delight vocabulary; no new effects in this ticket.
- Copy tests: update any snapshot or string test that pins old copy; don't delete tests.

## Defects first (F)
- [ ] **F1 Deep-link crash.** `otto://create` or `otto://chats` opened outside the tabs shows
      "Couldn't find the bottom tab bar height" (`src/features/chat/ChatScreen.tsx` ~73,
      `useBottomTabBarHeight`). Fix at the root: read the height through a safe fallback
      (e.g. `useContext(BottomTabBarHeightContext) ?? 0`) so every caller is covered. Repro:
      `xcrun simctl openurl booted otto://chats` while signed in.
- [x] **F2 RevenueCat logOut while anonymous.** DONE 2026-10-04 on `main` (audit): logOut only on a uid → none transition. `src/features/auth/AuthProvider.tsx` ~72 calls
      `Purchases.logOut()` at launch when uid is undefined → RC error log. Only log out when
      a previous uid existed (or `!(await Purchases.isAnonymous())`).
- [ ] **F3 First save fails.** Saving a recipe the first time after sign-in showed "Couldn't
      save. Try again." (review video, 5:05). Reproduce on a fresh account, find the cause
      (likely the profile/household row not existing yet, or a race with the session), fix
      it, and add a test.
- [ ] **F4 Account "Current plan" row** is stale. Covered by item 14.

## Screens (see plan.html for before / reference / mock-up)

### 01 Sign up / sign in — Trim (refs: ref-calm-signup, ref-calm-login)
Files: `src/features/auth/SignUpScreen.tsx`, `SignInScreen.tsx`, `ForgotPasswordScreen.tsx`.
- Sign up: title "Create your account", button "Create account".
- Sign in: title "Welcome back", footer link "New to Otto? Create account".
- Forgot: title "Reset password", body "We'll email you a reset link.", button "Send reset link".
- Smaller hero art (~half). One fine-print line under the buttons: "By continuing you agree to
  the Terms and Privacy Policy." (links: ottosapp.com/terms, /privacy).
- Delete every other caption / mascot line on these three screens.

### 02 Onboarding — Keep + one copy change (ref: ref-brilliant-goal)
File: `src/features/onboarding/OnboardingScreen.tsx`.
- Card 2 body → "Cook mode, scaling, nutrition. Every dish."
- **Do NOT build** the optional "What's Otto for?" goal question yet. Juan decides (hand-back).

### 03 Paywall — Keep. No changes.

### 04 Discover — Trim
- Ask Otto entry caption → "Write me a recipe →".
- Empty search → "No results for "{query}"" (nothing else).
- Delete the filter arity hints ("single choice" etc.).

### 05 Recipe detail + Nutrition — Rework (ref: ref-mfp-nutrition, ref-kitchenstories-recipe)
Files: `src/features/nutrition/components/NutritionCard.tsx` (~133–137, 182, 192–195),
`src/features/nutrition/estimates.ts` (69–80), `src/features/recipes/RecipeDetailScreen.tsx`,
`src/features/recipes/components/VideoEmbed.tsx`.
- Card header "Nutrition · Estimate" + (i) button → bottom sheet "About these numbers" holding
  the existing USDA / not-medical-advice text (moved, not rewritten).
- Low confidence: header reads "Rough estimate" + (i) instead.
- No estimate at all → hide the card (no empty-state text).
- Delete the video caption. Related recipes: title "More {category} recipes", no subtitle.
- Remove the inline Share block (share stays in the header action).
- 404 / missing recipe screen → "Recipe not found".

### 06 Cook mode — Trim (ref: ref-kitchenstories-step)
- Delete the mise-en-place line (`CookScreen.tsx` ~415), "Tap a time to start a timer"
  (`StepCard.tsx` ~107) and "Nothing specific for this step." (hide the section instead).

### 07 Add sheet — Trim (ref: ref-recime-import-picker)
File: `src/features/import/AddSheet.tsx`.
- Title "Add a recipe". No subtitle, no mascot.
- No caption per mode; put the hint in the input placeholder.
- Busy state: drop the subtitle (spinner + title only).
- One button "Ask Otto to write one" (replaces the duplicate Ask Otto entries). Photo mode
  button "Add photo".

### 08 Import review — Rework (ref: ref-recime-import-review)
File: `src/features/import/EditRecipeScreen.tsx`.
- Title "Review import". Meta line "AI-read · check amounts and temperatures" + (i) (sheet
  with the existing misread warning).
- Primary button "Looks right, save". Footer "Source: {domain}" (e.g. allrecipes.com).
- Delete "Cooked up with Otto…" and the "Checked and kept by you" / credit paragraphs.

### 09 Chat empty state — Rework (ref: ref-chatgpt-empty)
File: `src/features/chat/components/ChatEmptyState.tsx`.
- Three tappable chips that send as the first message: "20-min weeknight pasta",
  "Use up chicken thighs + spinach", "Something cozy, vegetarian".
- Mascot ~140pt. Hide the Speak button when speech isn't available (no "coming soon").

### 10 AI consent — Rework, ~55 words (ref: ref-spark-ai-consent, ref-notion-ai-toggle)
File: `src/shared/aiConsent.logic.ts` (`AI_CONSENT_COPY`).
- Title: "Otto uses Claude AI"
- Lead: "Imports, Ask Otto and nutrition matching run on Claude, made by Anthropic. Otto sends
  only what you give the feature:"
- Bullets: "Text, links and photos you share" / "Your questions" / "Ingredient names in your recipes"
- Caption: "Not used to train AI. Your account stays with Otto. Change anytime in Account › AI features."
- Buttons: "Allow" / "Not now". Keep the Privacy Policy link if the component has one.
- **5.1.2(i) must still hold:** explicit opt-in before any data is sent, names the provider.

### 11 Plan — Trim (ref: ref-recime-plan-empty)
File: `src/features/planner/PlanScreen.tsx`.
- Empty day: "Nothing planned" + "Add a dish to get started."
- "Shopping list" as an outlined (secondary) button; delete the old CTA copy.

### 12 Shopping — Trim (ref: ref-crouton-groceries-empty, ref-recime-plan-groceries)
File: `ShoppingScreen.tsx`.
- Empty: "Nothing to buy yet" + "Plan a dish and it lands here."
- All checked & hidden: "Everything's hidden."
- Counter: "{checked} of {total}".

### 13 Household — Trim
File: `src/features/profile/HouseholdScreen.tsx`.
- Subtitle "One shopping list for everyone in your kitchen." Delete the joined-state sentence
  and the "show up as" name line.
- Add a Copy button next to the code (expo-clipboard if installed, else the existing share).
- Invite text: "Join my Otto kitchen: otto://join/{code}".

### 14 Account — Rework (ref: ref-calai-settings, ref-duolingo-settings)
File: `src/features/profile/ProfileScreen.tsx`.
- One row "Otto Club · Active ›" → `Purchases.showManageSubscriptions()` (fallback the
  apps.apple.com subscriptions URL); non-member "Otto Club · Free ›" → `/otto-club`.
  Remove the Club art card and the old "Current plan" row.
- Delete captions: name hint, stats zero-state, Sounds caption.
- Sections: **Share**, **Support** = Help, Contact us (merges "Send a thought" + "Report a
  bug"), Privacy Policy, Terms. Delete "About Otto". App version as a small footer.

### 15 Preferences — Trim
File: `PreferencesScreen.tsx`.
- Delete both intro paragraphs and the save toast (save silently; error toast stays).
- AI switch: label "AI features", caption "Powered by Claude. Details in Privacy Policy."

### 16 Reminders / notifications — Trim (ref: ref-finch-notifications)
File: `src/features/notifications/NotificationsScreen.tsx`.
- Delete the top caption. Denied-permission card: "Notifications are off for Otto" + the
  existing Open Settings button.
- `app.json` speechRecognitionPermission → "Otto turns what you say into text with Apple
  speech recognition." (native string → needs a new build, which this ticket ends with).

### 17 FAQ — Trim
File: `FaqScreen.tsx`.
- Title "Help". 9 questions max, each answer ≤35 words. Must keep: subscription/trial &
  cancel, restore, delete account, AI & data, household. Footer "Still stuck? Contact us".

### 18 Delete account — Rework (ref: ref-pocket-delete)
- Replace the in-screen arm / "Tap again" 6-second timer with one native `Alert.alert`:
  title "Delete account?", message "Your recipes, saves and plan are erased. This can't be
  undone." Subscribers get an extra sentence: "Your Otto Club subscription is billed by Apple
  and continues until you cancel it."
- Buttons: "Manage subscription" (subscribers only) / "Delete" (destructive) / "Cancel".
- Keep the SIWA `appleAuthorizationCode` step and the edge function call exactly as they are.

## Done when
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm test` all clean.
- [ ] Screenshot every changed screen on the simulator (iPhone 17 Pro) and drop them in
      `docs/ux-audit-2026-10-04/after/` with the same names as `img/otto-*.jpg`.
- [ ] F1 deep links open without the crash; F3 first save works on a fresh account.
- [ ] Build to TestFlight (`EXPO_NO_CAPABILITY_SYNC=1 npx eas-cli build --platform ios
      --profile production --auto-submit --non-interactive`). Don't attach to a version.
- [ ] Add a dated line to `docs/tickets/ROADMAP.md` with the build number.

## Hand back to the main session (not Claude Code's)
- Juan's decision on the onboarding goal question (item 02).
- Anything in App Store Connect, RevenueCat or Supabase dashboards; App Review submit.
- Store description / What's New and the rest of `TERMINAL_TICKET_RELEASE_1_0_20.md`.
- Website copy that should mirror the new AI consent wording (Otto_Website repo).
