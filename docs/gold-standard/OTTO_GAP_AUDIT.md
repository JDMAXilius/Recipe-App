# Otto vs the Apple gold standard: gap audit

Read-only code audit of `app/` + `src/` at commit `6674c82a` (1.0.23 build 52), 2026-11-03.
Gold standard: Apple HIG digests (iOS 27 cycle, Liquid Glass baseline), App Store Review Guidelines,
`docs/flow-maps/research/01_APPLE_AND_INDUSTRY_RULES.md`, and the Figma file
**"Apple Design Guidelines — Gold Standard"** (`jWn55Rq4u6cbukA2JeqOaI`). Page names below are that file's pages.

**Out of scope here (owned elsewhere, linked rather than repeated):**
- Flow order, hard paywall placement, state restore, deep links, lapsed subscription, offline launch: `docs/tickets/TERMINAL_TICKET_FLOW_REDESIGN.md` (F1–F7).
- Springs, haptic vocabulary, skeletons, Liquid Glass `NativeTabs`, Live Activity, widget: `docs/tickets/TERMINAL_TICKET_MOTION.md` (M1–M9) and `docs/motion/MOTION_RESEARCH.md`.

Method: read every shared primitive (`src/shared/ui/*`), the tab layout, root stack, auth, onboarding, paywall,
profile, permissions, notifications, cook, import and search code; grep sweeps for accessibility props, font
scaling, autofill, fixed heights, haptics and permissions; WCAG contrast computed from `src/shared/theme/tokens.ts`.
Nothing was run on a device. Items marked **verify** need a device check.

## Contrast (computed from `tokens.ts`, WCAG 2.x)

| Pair (where used) | Ratio | Needed | Result |
|---|---|---|---|
| ink `#2A211B` on cream `#FAF4EA` (all body text) | 14.41 | 4.5 | Pass |
| ink on white / creamDeep | 15.77 / 13.12 | 4.5 | Pass |
| inkSoft `#6E6055` on cream / white / creamDeep (captions, placeholders) | 5.54 / 6.06 / 5.04 | 4.5 | Pass |
| inkSoft on accentSoft `#F3D9CD` (chips) | 4.50 | 4.5 | Borderline |
| **terracotta `#C4562E` on cream** (`Text role="computed"`, ghost buttons, links, active tab label 12 pt) | **4.07** | 4.5 | **Fail** |
| **terracotta on creamDeep** (computed text on inset surfaces) | **3.70** | 4.5 | **Fail** |
| **terracotta on accentSoft** | **3.31** | 4.5 | **Fail** |
| terracotta on white (segment selected label 14 pt) | 4.45 | 4.5 | Fail (by a hair) |
| **white on terracotta** (primary `Button` label, 16 pt semibold, not "large") | **4.45** | 4.5 | **Fail (by a hair)** |
| **danger `#D64545` on cream** (`Input` error text 13 pt) | **4.00** | 4.5 | **Fail** |
| white on danger (error toast, destructive button) | 4.38 | 4.5 | Fail |
| white on success `#5A7A4F` (success toast) | 4.85 | 4.5 | Pass |
| secondary `#8A5A3B` on cream | 5.32 | 4.5 | Pass |
| **gray `#B9A895` on white / cream** (unselected radio on paywall, checkbox borders: non-text, needs 3:1) | **2.31 / 2.11** | 3.0 | **Fail** |
| gold `#E8B04B` on cream (ratings/streak marks, non-text) | 1.79 | 3.0 | Fail if it carries meaning |

Proposed replacements (computed): terracotta `#AE4A26` → 5.04 on cream, 4.59 on creamDeep, white-on 5.52. danger `#BE3A3A` → 4.98 on cream, white-on 5.45. gray (for meaningful borders/icons) `#8C7B69` → 4.08 on white. Keep the current terracotta only for large fills and decoration.

## Scorecard

| Area | Status | Evidence | Reference |
|---|---|---|---|
| Tab bar | Fail | JS `Tabs` with custom cream background + hairline `app/(tabs)/_layout.tsx:36-40`; raised ＋ "Create" with hidden label `:59-62`, `src/shared/ui/TabBarCreateButton.tsx:21-22`; haptic on every tab press `_layout.tsx:30` | 27 · Tab bars; Liquid Glass bars rules |
| Toolbars / headers | Partial | Custom 44 pt header, Material `arrow-back` glyph `src/shared/ui/Screen.tsx:26,51`; other screens use `chevron-back` (`EditRecipeScreen.tsx:254`, `OttoClubScreen.tsx:94`); no large titles, no scroll edge effect | 28 · Toolbars & navigation bars |
| Sheets & modality | Partial | One RN `Modal` sheet for everything, no swipe-down, no detents, grabber is decorative `src/shared/ui/Sheet.tsx:35-46`; editor back has no discard guard `EditRecipeScreen.tsx:248` | 34 · Sheets; 19 · Modality |
| Alerts / confirmations | Partial | Only one native alert (account delete, correct roles) `useDeleteAccount.ts:57-61`; recipe delete is "tap again within 4 s" via toast `EditRecipeScreen.tsx:215-221` | 35 · Alerts & action sheets |
| Buttons / hit targets | Partial | `Button` min 44/52 `Button.tsx:57` good; text links with no min size: `SignInScreen.tsx:64-76`, paywall Terms/Privacy `OttoClubScreen.tsx:164-170` (no hitSlop), inline legal links `AuthScreenLayout.tsx:91-95` | 30 · Buttons; 02 · Accessibility |
| Lists | Partial | FlatList on 4 screens; no pull-to-refresh anywhere (0 `RefreshControl`); no context menus or swipe actions except Shopping hold-to-remove | 32 · Lists & tables; 31 · Menus |
| Search | Partial | Bare `TextInput`, no clear button, no cancel, no recents `DiscoverScreen.tsx:173-180` | 37 · Search fields; 20 · Searching |
| Forms / text fields | Fail | Zero `textContentType`/`autoComplete` in the codebase; no return-key chaining on auth `AuthInput.tsx:41-53`, `Input.tsx:50-58` | 39 · Text fields; 23 · Entering data |
| Dynamic Type | Fail | Scaling is on (0 `allowFontScaling={false}`), but fixed heights clip at AX sizes: `Screen.tsx:26`, `OnboardingScreen.tsx:136,144`, `SocialAuthButtons.tsx:23`, `RecipeDetailScreen.tsx:470,490`, `ProfileScreen.tsx:413`; body is 15 pt not 17 `tokens.ts:42` | 10 · Typography; 02 · Accessibility |
| VoiceOver | Partial | 100/114 pressables labelled, rest have text children; only 3 header roles in the app (tab screen titles are not headings) `Text.tsx:36-37`; OttoArt decorative by default (good) `OttoArt.tsx:76`; onboarding page dots silent `OnboardingScreen.tsx:121-133` | 02 · Accessibility |
| Color contrast | Fail | See table above, `tokens.ts:9,21,22` | 04 · Color; 02 · Accessibility |
| Dark Mode | Fail | Forced light `app.json:8`; tokens light-only `tokens.ts:1`; dark palette already designed in `docs/reference/DESIGN_SYSTEM.md` §1.2 | 05 · Dark Mode |
| Reduce Motion | Pass | Hooks in `src/shared/motion.ts` honor `useReducedMotion`; onboarding, cook, parallax too. Gap: RN Modal `slide` ignores it `Sheet.tsx:46` | 08 · Motion (+ motion ticket) |
| Reduce Transparency | Pass (N/A) | No blur/glass in use today; becomes system-handled once M7 lands | 07 · Materials |
| Haptics | Partial | 75 haptic calls, 52 of them `select()` on ordinary taps; warning haptic on sign out `ProfileScreen.tsx:141` | 08 · Motion; 22 · Feedback (+ motion M2) |
| Loading / empty / error | Partial | Error + retry exist (`OttoStates.tsx`, `PlanScreen.tsx:145-150`); no skeletons (motion M5) | 16 · Loading; 22 · Feedback |
| Offline | Fail | No network detection (no NetInfo / `onlineManager`); offline = generic error toasts | 16 · Loading; flow F5 |
| Toasts / undo | Fail | 3 s / 5 s auto-dismiss, Undo only lives in the toast `Toast.tsx:73`; positioned `bottom: 48` with no tab bar / safe-area inset `Toast.tsx:87` (**verify** overlap) | 22 · Feedback; 26 · Undo & redo |
| Permissions | Partial | Notifications: just-in-time + Settings fallback (good) `NotificationsScreen.tsx:44-53`. Photos: full-library permission requested before PHPicker, which needs none `imagePicker.ts:21`; cancelling the camera silently opens the library `CookScreen.tsx:103`, `AddSheet.tsx:116`; photo/camera denial has no Settings path | 12 · Privacy |
| Info.plist purpose strings | Pass | Camera, photos, mic, speech in `app.json:100-117` | 12 · Privacy |
| Onboarding | Partial | 3 pages, Skip, never repeats (good) `OnboardingScreen.tsx:29-66`; but runs after forced sign-up (flow F1) and the text block is a fixed 132 pt | 15 · Onboarding |
| Sign in / SIWA (4.8) | Partial | Apple first, same size as Google/Facebook (passes 4.8) `social.ts:13`; custom Ionicons glyph tile instead of the system button `SocialAuthButtons.tsx:21-30,56`; no password autofill | 43 · Sign in with Apple; 17 · Managing accounts |
| Account deletion (5.1.1(v)) | Pass | Account tab + paywall, destructive alert, billing note, Apple token revoke `useDeleteAccount.ts:13-61` | 17 · Managing accounts; 46 · App Store Review |
| Paywall (3.1.2) | Partial | Billed amount, trial terms, Restore, Terms, Privacy present `OttoClubScreen.tsx:100-170`; billed line is only 15 pt body-bold `:266`, CTA reads "Continue" `:157`, Terms/Privacy/Restore targets ~18 pt tall | 44 · Apple In-App Purchase; 46 · App Store Review |
| AI consent (5.1.2(i)) | Pass | Named provider, data list, real "Not now", asked before camera opens, silent check for background nutrition `AiConsentHost.tsx`, `AddSheet.tsx:114`, `nutrition.queries.ts:64` | 12 · Privacy; 46 · App Store Review |
| Notifications | Pass | Local reminders, opt-in per type, denial fallback `notifications.queries.ts:27-38`. Priming moment is a flow item (F1) | 18 · Managing notifications; 42 · Notifications (component) |
| Launch screen | Partial | No `splash` key in `app.json` (Expo default) + JS splash shows otter art `Splash.tsx:21-26`: a logo screen, not the first screen | 14 · Launching |
| App icon | Fail | Single 1024 PNG, no dark / clear / tinted variants (`app.json:9`; generated `AppIcon.appiconset` has one image) | 03 · App icons |
| Widgets / Live Activities | Fail (absent) | None. Owned by motion M9 (timer Live Activity, "Tonight's dinner" widget) | 41 · Widgets & Live Activities |
| iPad | Fail (by choice) | `supportsTablet: false` `app.json:14` | 06 · Layout; 29 · Sidebars & split views |
| Localization readiness | Fail | All strings hardcoded English; no `expo-localization`; currency uses `Intl` (good) `OttoClubScreen.tsx:57-58` | 11 · Writing |
| Ratings prompt | Pass | System prompt after 3rd finished cook, 90-day cooldown, never from a button `reviewPrompt.ts`, `reviewPrompt.logic.ts:8-14` | 25 · Ratings & reviews |

> **Update 2026-11-04:** G1–G14 fixed in code (see the ticket log); rows for contrast, Dynamic Type, toasts, paywall, forms, buttons, sheets, alerts, permissions, VoiceOver, search, offline, SIWA should be re-marked after the device check.

Totals: 7 Pass, 14 Partial, 11 Fail (of which widgets, iPad and localization are absent by choice). Findings: 4 P0, 12 P1, 8 P2.

---

## P0: App Review risk or broken accessibility

### P0-1. Brand terracotta, danger and gray fail contrast
- **Wrong:** every "computed" number, link, ghost button, active tab label and selected segment is terracotta on cream at 4.07:1 (3.70 on creamDeep). Primary button labels are white on terracotta at 4.45. Error text is 4.00. The paywall's unselected radio and checkbox borders are 2.1–2.3 (non-text needs 3:1).
- **Evidence:** `src/shared/theme/tokens.ts:9,21,22`; consumers `src/shared/ui/Text.tsx:32`, `Button.tsx:23,32`, `app/(tabs)/_layout.tsx:33`, `SegmentBar.tsx:43`, `Input.tsx:71`, `Toast.tsx:39`, `OttoClubScreen.tsx:221`, `ShoppingScreen.tsx:1031`.
- **Rule:** 02 · Accessibility, 04 · Color: 4.5:1 for text up to 17 pt, 3:1 for 18 pt+/bold and for meaningful non-text marks.
- **Fix:** add `terracottaText: '#AE4A26'` (or retune `terracotta` itself) for text, links, tab tint and button fills; `danger: '#BE3A3A'`; add `grayStrong: '#8C7B69'` for meaningful borders/icons. Keep the bright terracotta for big fills/decoration only. Re-run the ratio table; add a tiny `tokens.contrast.test.mjs` that asserts the pairs above stay ≥ 4.5 / 3.0.
- **Effort:** S (tokens) + M (visual check of every screen).

### P0-2. Dynamic Type clips at accessibility sizes
- **Wrong:** text scales (good, nothing disables it) but the boxes around it don't. At AX3–AX5 the shared header title overflows its 44 pt bar, the onboarding title/body overflow a fixed 132 pt block onto the CTA, CTA labels overflow 54 pt pills, social buttons are 50 pt. Base body is 15 pt (HIG default 17).
- **Evidence:** `src/shared/ui/Screen.tsx:26` (header `height: 44`, title absolutely positioned), `src/features/onboarding/OnboardingScreen.tsx:136` (`height: 132`), `:144` (`height: 54`), `SocialAuthButtons.tsx:23`, `RecipeDetailScreen.tsx:470,490`, `ProfileScreen.tsx:413`, `app/(tabs)/_layout.tsx:35` (tab label 12 pt), `tokens.ts:42`.
- **Rule:** 10 · Typography, 02 · Accessibility: support Dynamic Type through AX sizes without truncation; layouts reflow (stack horizontally arranged content vertically at AX sizes).
- **Fix:** `height` → `minHeight` + vertical padding on every text container listed; onboarding text block `minHeight` inside a ScrollView (or let it grow and shrink the art); header: `minHeight: 44`, title `numberOfLines={1}` + `adjustsFontSizeToFit` only for the nav title, `maxFontSizeMultiplier` ≈ 1.6 on tab labels and nav titles only (Apple's own bars cap). Use `useWindowDimensions().fontScale > 1.5` to switch rows (plan cards, paywall plan cards, social row) to vertical stacks. Walk every screen at AX5 in the simulator's Accessibility Inspector and screenshot.
- **Effort:** M.

### P0-3. Timed toasts carry the only Undo and the recipe-delete confirmation
- **Wrong:** Undo for shopping removals lives only in a toast that vanishes after 5 s; recipe delete is "tap Delete, then tap again within 4 s" with the instruction in a toast. VoiceOver/Switch Control users often can't reach a transient control in time. Non-standard destructive confirmation.
- **Evidence:** `src/shared/ui/Toast.tsx:73` (3 s / 5 s), `ShoppingScreen.tsx:361,408,436`, `EditRecipeScreen.tsx:215-221`.
- **Rule:** 35 · Alerts & action sheets (destructive actions confirmed with a clearly marked destructive button), 26 · Undo & redo, 02 · Accessibility (WCAG 2.2.1 timing adjustable).
- **Fix:** recipe delete → `ActionSheetIOS.showActionSheetWithOptions` (destructive "Delete recipe" + Cancel; `Alert` fallback on Android, `confirm()` on web like `useDeleteAccount.ts:53`). Toasts: when `AccessibilityInfo.isScreenReaderEnabled()` is true, don't auto-dismiss toasts that have an action (dismiss on action or next toast); otherwise ≥ 6 s with action. Also offer Shopping undo via shake-to-undo or a "Recently removed" row so undo isn't toast-only.
- **Effort:** M.

### P0-4. Harden the paywall against another 3.1.2 rejection
- **Wrong:** compliant in content, weak in hierarchy and targets. The billed line is 15 pt body-bold, the same size as body copy and smaller than the 16 pt CTA label; the yearly plan card's right-hand `priceString/yr` is 13 pt `label`. The CTA says "Continue" (doesn't say it starts a subscription/trial). Terms and Privacy links have no hit slop (~18 pt tall); Restore is caption-sized.
- **Evidence:** `src/features/profile/OttoClubScreen.tsx:154-157,266` (billed style), `:141,147` (plan card prices), `:157` ("Continue"), `:164-170` (Terms/Privacy, no hitSlop), `:100-102` (Restore).
- **Rule:** 44 · Apple In-App Purchase, 46 · App Store Review (3.1.2(c): billed amount most clear and conspicuous; trial/per-month subordinate in size and position; Otto's 1.0.21 rejection).
- **Fix:** billed line → `type.title` (22 pt) ink; plan cards show billed amount as the larger figure and per-month as caption (already mostly true); CTA "Start free trial" when `trialDays`, else "Subscribe"; Terms/Privacy/Restore `minHeight: 44` + `hitSlop`; add `accessibilityLabel` "Restore purchases". Keep everything else (it's the approved shape).
- **Effort:** S.

## P1: clear HIG violations users feel

### P1-1. Tab bar is a custom JS bar with an action-styled tab
- **Wrong:** cream background + hairline border on a JS tab bar (not Liquid Glass); the centre "Create" tab is a raised 58 pt terracotta disc with no visible label that looks like an action button (it's actually the chat screen); selection haptic on every tab press (system tab bars don't).
- **Evidence:** `app/(tabs)/_layout.tsx:30,36-40,59-62`; `src/shared/ui/TabBarCreateButton.tsx:21-22,37`.
- **Rule:** 27 · Tab bars (tabs navigate, never act; labels on every tab; no custom bar backgrounds on iOS 26).
- **Fix:** do this together with motion **M7** (`NativeTabs`), don't do it twice. Decision for Juan: keep chat as a normal labelled tab ("Ask" with a symbol), and move "add a recipe" to a tinted toolbar button on Cookbook/Discover. Drop `screenListeners.tabPress` haptic.
- **Effort:** M (with M7).

### P1-2. No password autofill or keyboard flow on any form
- **Wrong:** no `textContentType`/`autoComplete` anywhere, so no Passwords app/Keychain fill, no strong-password suggestion on sign-up, no one-time-code fill; return key doesn't move email → password → submit.
- **Evidence:** `src/features/auth/components/AuthInput.tsx:41-53`, `src/shared/ui/Input.tsx:50-58`, `SignInScreen.tsx:41-54`, `SignUpScreen.tsx:63-76`, `ChangePasswordScreen.tsx`, `ResetPasswordScreen.tsx`.
- **Rule:** 39 · Text fields, 23 · Entering data (use the right content type and keyboard; let the system fill).
- **Fix:** add `textContentType` + `autoComplete` props to `AuthInput`/`Input`: email `emailAddress`/`email`, sign-in password `password`/`current-password`, sign-up & reset `newPassword`/`new-password` (+ `passwordRules="minlength: 8;"`; align sign-up's `MIN_PASSWORD = 6` in `SignUpScreen.tsx:11` with change-password's 8 in `ChangePasswordScreen.tsx:14`), profile name `name`, household invite code `autoComplete="off"`. `returnKeyType="next"` with `onSubmitEditing` focusing the next ref, `"go"` on the last field calling submit. Add associated domains `webcredentials:ottosapp.com` (needs an AASA file) so saved passwords match.
- **Effort:** S (+ S for AASA).

### P1-3. Text links and small controls under 44 pt
- **Wrong:** auth links are bare `Pressable`s wrapping one line of text (~22 pt tall); inline legal links are `Text onPress` (tiny targets); paywall links ~18 pt.
- **Evidence:** `SignInScreen.tsx:64-76`, `SignUpScreen.tsx:86`, `ForgotPasswordScreen.tsx:76`, `ChangePasswordScreen.tsx:76`, `AuthScreenLayout.tsx:91-95`, `OttoClubScreen.tsx:100,164-177`, `CookScreen.tsx:513-519` and `TimerHub.tsx:25,79` (40 pt + 8 slop: fine).
- **Rule:** 30 · Buttons, 02 · Accessibility (44×44 pt).
- **Fix:** a `TextLink` primitive in `src/shared/ui` (`minHeight: 44`, `justifyContent: 'center'`, `hitSlop`, `accessibilityRole="link"|"button"`), used everywhere above; split the inline legal sentence into two `TextLink`s on their own line.
- **Effort:** S.

### P1-4. One custom sheet for every task: no swipe, no detents
- **Wrong:** `Sheet` is an RN `Modal` with a decorative grabber; it can't be dragged down, has no medium/large detent, and slides in regardless of Reduce Motion. Ten call sites (filters, add-to-plan, timers, ingredients, jump-to-step, AI consent, nutrition info).
- **Evidence:** `src/shared/ui/Sheet.tsx:35-46`; call sites `RecipeDetailScreen.tsx:508`, `FilterSheet.tsx:178`, `CookScreen.tsx:556,592`, `TimerHub.tsx:36`, `AiConsentHost.tsx:45`.
- **Rule:** 34 · Sheets (grabber means draggable; medium/large detents; iOS 26 inset floating sheet), 19 · Modality.
- **Fix:** move sheets to expo-router routes with `presentation: 'formSheet'`, `sheetAllowedDetents: [0.5, 1]`, `sheetGrabberVisible: true` (react-native-screens 4.16 supports it), which also gets the iOS 26 glass sheet and Reduce Motion for free. Keep the AI consent sheet non-dismissable-by-drag (`gestureEnabled: false`) only if "Not now" is visible.
- **Effort:** M.

### P1-5. Editor discards changes without asking
- **Wrong:** `isDirty` exists ("drives the discard guard") but nothing guards: back button and edge-swipe leave the recipe editor and lose edits.
- **Evidence:** `src/features/import/EditRecipeScreen.tsx:146,248`; `src/features/import/draft.ts:230-233`.
- **Rule:** 19 · Modality, 35 · Alerts & action sheets (confirm before discarding user content; action sheet "Discard changes" / "Keep editing").
- **Fix:** `usePreventRemove(dirty, ...)` from `@react-navigation/native` showing an action sheet; same for the Add screen's pasted text.
- **Effort:** S.

### P1-6. Photo permission over-asked; camera cancel opens the library; no denial path
- **Wrong:** `requestMediaLibraryPermissionsAsync()` before the system picker (PHPicker needs no permission), which triggers a scary full-library prompt; cancelling the camera immediately launches the library (`takePhoto() ?? pickFromLibrary()`); a denied camera returns null with no "Open Settings".
- **Evidence:** `src/shared/imagePicker.ts:21,39`; `CookScreen.tsx:103`; `AddSheet.tsx:116`.
- **Rule:** 12 · Privacy (ask only for what you need, at the moment of use; provide a fallback when denied).
- **Fix:** drop the library permission request (and `photosPermission` stays only if you ever read the library directly). Replace the `??` chain with a choice: action sheet "Take photo / Choose from library" (or two tiles in AddSheet). Return `'denied' | 'cancelled' | PickedImage` from `imagePicker` and show a toast with "Open Settings" (`Linking.openSettings()`) on denied.
- **Effort:** S.

### P1-7. No Dark Mode — won't do
- **Decision (Juan, 2026-11-04, ADR-0007):** Otto keeps one light style; this item is closed and the fix below is not planned.
- **Wrong:** app forced to light; at night the cream UI is the brightest thing on the phone.
- **Evidence:** `app.json:8` (`"userInterfaceStyle": "light"`), `tokens.ts:1` ("light-only, plain module"). The warm-dark palette is already specced in `docs/reference/DESIGN_SYSTEM.md` §1.2.
- **Rule:** 05 · Dark Mode (people expect every app to respect the system setting).
- **Fix:** `userInterfaceStyle: "automatic"`; `colors` becomes `useColors()` (via `useColorScheme`) or a `PlatformColor`/`DynamicColorIOS` map; contrast-check the dark pairs (inkSoft `#B9A895` on `#1E1712` etc.) with the same test as P0-1; mascot art checked on espresso. Gate behind a QA pass of every screen.
- **Effort:** L.

### P1-8. Tab-screen titles aren't headings; onboarding progress is silent
- **Wrong:** VoiceOver's Headings rotor finds only 3 headings in the app; display/title text isn't marked as a header. Onboarding page dots convey position visually only.
- **Evidence:** `src/shared/ui/Text.tsx:36-37` (no role); headers only at `Screen.tsx:29`, `ChatScreen.tsx:193`, `ShareListCard.tsx:36`; `OnboardingScreen.tsx:121-133`.
- **Rule:** 02 · Accessibility (VoiceOver: headings, labels, traits; don't convey state by visuals alone).
- **Fix:** `Text` sets `accessibilityRole="header"` for `display` and `title`. Onboarding: wrap dots in a View with `accessibilityLabel={`Page ${page+1} of 3`}` and announce on page change; use `useWindowDimensions` instead of the static `Dimensions.get` (`:27`).
- **Effort:** S.

### P1-9. Search field is a bare text input
- **Wrong:** no clear (×) button, no Cancel, no recent searches, no search-tab placement.
- **Evidence:** `src/features/recipes/DiscoverScreen.tsx:165-180`.
- **Rule:** 37 · Search fields, 20 · Searching (clear button, placeholder, Cancel; iOS 26 search as a trailing tab).
- **Fix:** `clearButtonMode="while-editing"`, `enablesReturnKeyAutomatically`, a "Cancel" text button while focused that clears + blurs; store last 5 queries locally and show them on focus. Search tab placement is decided with P1-1/M7.
- **Effort:** S.

### P1-10. Toast placement and haptic noise
- **Wrong:** toasts sit at a fixed `bottom: 48` with no tab-bar or safe-area offset (**verify**: likely overlapping the tab bar on Face ID phones). 52 `haptics.select()` calls fire on ordinary taps; sign-out plays a *warning* haptic (warning = something went wrong).
- **Evidence:** `src/shared/ui/Toast.tsx:84-88`; `grep -rn "haptics.select" src app` (52); `ProfileScreen.tsx:141`.
- **Rule:** 22 · Feedback; 08 · Motion (haptics for meaningful events only).
- **Fix:** offset toasts by `useSafeAreaInsets().bottom` + tab bar height (`useBottomTabBarHeight` where available, or a bus value). Haptic trim is part of motion **M2**: remove select() from plain navigation taps and the tab bar, keep it for toggles/pickers/selection changes; sign out → no haptic.
- **Effort:** S.

### P1-11. Sign in with Apple uses a custom glyph tile
- **Wrong:** passes 4.8 (first, equal size), but the button is an Ionicons `logo-apple` in a white bordered tile rather than Apple's button.
- **Evidence:** `src/features/auth/components/SocialAuthButtons.tsx:21-30,56,63-72`.
- **Rule:** 43 · Sign in with Apple (prefer the system-provided button; custom logo-only buttons must use Apple's logo artwork and proportions).
- **Fix:** render `AppleAuthentication.AppleAuthenticationButton` (`buttonType SIGN_IN/CONTINUE`, `buttonStyle WHITE_OUTLINE`, `cornerRadius: radii.button`) on iOS; full-width "Continue with Apple" above the Google/Facebook row is the stronger option and matches flow F1 ("Sign in with Apple first").
- **Effort:** S.

### P1-12. No offline state
- **Wrong:** no connectivity awareness; offline produces generic "Couldn't…" error toasts and empty screens.
- **Evidence:** no NetInfo/`onlineManager` in `src/` or `package.json`; query client `app/_layout.tsx:18-20`.
- **Rule:** 16 · Loading, 22 · Feedback (explain what happened and what to do). Offline *launch* routing is flow **F5**; this item is the in-app state.
- **Fix:** add `@react-native-community/netinfo`, wire TanStack `onlineManager`, show one quiet "You're offline. Showing saved recipes." banner; persist the query cache (`@tanstack/query-async-storage-persister`) so Cookbook/Plan/Shopping read offline.
- **Effort:** M.

## P2: polish and above-and-beyond

### P2-1. App icon has no iOS 26 appearances
- **Evidence:** `app.json:9` single PNG; generated `ios/Otto/Images.xcassets/AppIcon.appiconset/Contents.json` has one 1024 image.
- **Rule:** 03 · App icons (layered icon; default, dark, clear, tinted).
- **Fix:** build a layered `.icon` in Icon Composer (otter foreground, cream background layer) and set `ios.icon` to it (Expo SDK 54 supports `.icon`), or at least supply dark + tinted PNG variants. **Effort:** M.

### P2-2. Launch screen is a logo splash
- **Evidence:** no `splash` key in `app.json`; JS splash `src/features/onboarding/Splash.tsx:21-26` shows otter art while fonts/auth resolve.
- **Rule:** 14 · Launching (launch screen looks like the first screen; no logo or text).
- **Fix:** `expo-splash-screen` plugin with plain cream background and no image; replace the JS `Splash` art with an empty cream frame of the destination (or a skeleton). Keep the otter for real empty states. **Effort:** S.

### P2-3. Type scale isn't Apple's
- **Evidence:** `tokens.ts:39-54` (body 15, caption/label 13, meta 12).
- **Rule:** 10 · Typography (body 17 default, minimum 11; map roles to text styles).
- **Fix:** body 17/22, callout 16, caption 13 stays, meta 12 stays; check layouts after P0-2. **Effort:** M.

### P2-4. Headers aren't native
- **Evidence:** `Screen.tsx:18-63` (custom bar, Material back arrow `:51`), mixed `chevron-back` elsewhere.
- **Rule:** 28 · Toolbars & navigation bars (back chevron with long-press history, large title on top-level screens, scroll edge effect instead of hairlines).
- **Fix:** short term: `chevron-back` everywhere via `Screen`. Long term: native stack headers (`headerLargeTitle`, `headerTransparent`, `headerBlurEffect`) once M7 lands so bars become glass. **Effort:** S / M.

### P2-5. Lists lack refresh, menus and swipe actions
- **Evidence:** 0 `RefreshControl`; no context menus on recipe cards (`CookbookScreen.tsx`, `DiscoverScreen.tsx`); motion M8 plans a context-menu preview.
- **Rule:** 32 · Lists & tables, 31 · Menus.
- **Fix:** pull-to-refresh on Discover/Cookbook/Plan; long-press menu on a recipe card (Add to plan, Share, Remove) via `react-native-ios-context-menu` or `zeego`; swipe-to-remove on plan entries. **Effort:** M.

### P2-6. Localization readiness
- **Evidence:** hardcoded English in every screen; no `expo-localization`; currency formatting already uses `Intl` (`OttoClubScreen.tsx:57-58`).
- **Rule:** 11 · Writing; 06 · Layout (right-to-left, longer strings).
- **Fix:** extract strings to a `src/shared/i18n/en.ts` map with a `t()` helper as screens are touched; `expo-localization` for locale; set `CFBundleLocalizations`. Not needed until a second language is planned. **Effort:** L.

### P2-7. iPad
- **Evidence:** `app.json:14`.
- **Rule:** 06 · Layout, 29 · Sidebars & split views.
- **Fix:** leave off until Dynamic Type is done (Dark Mode is not planned, ADR-0007); then a two-column Cookbook/Recipe and Plan layout. **Effort:** L.

### P2-8. Widgets and Live Activities
- **Evidence:** none in the project.
- **Rule:** 41 · Widgets & Live Activities.
- **Fix:** already scoped in motion **M9** (cook timer Live Activity + Dynamic Island, "Tonight's dinner" widget). No separate work here. **Effort:** L.

---

## What already meets the bar (don't regress)
Account deletion in both doors with Apple token revoke and billing note; AI consent sheet (named provider, data list, real decline, asked before the camera); notifications just-in-time with a Settings fallback; ratings prompt rules; Reduce Motion handling in the motion hooks; decorative-by-default mascot art; `Button`/`Input`/`SegmentBar` 44 pt floors; cook mode keeps the screen awake and offers buttons alongside swipe; paywall content (billed amount, trial terms, Restore, Terms, Privacy, sign out + delete for non-members).
