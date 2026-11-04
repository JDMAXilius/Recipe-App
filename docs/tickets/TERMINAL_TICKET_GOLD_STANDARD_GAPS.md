# Terminal ticket: close Otto's gaps against the Apple gold standard

> **Budget:** P0 in one PR (small, ships in the next build), P1 in two or three PRs, P2 only after Juan picks. Written 2026-11-03.
> Read `TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md` first.
> Source: `docs/gold-standard/OTTO_GAP_AUDIT.md` (scorecard, evidence `file:line`, contrast table, the fix for each item). Read the item there before you build it; this ticket doesn't repeat the evidence.
> Visual reference: Figma "Apple Design Guidelines — Gold Standard" (`jWn55Rq4u6cbukA2JeqOaI`), page named in each step.
> **Not in this ticket (linked, don't duplicate):** flow order, paywall placement, state restore, deep links, offline *launch* → `TERMINAL_TICKET_FLOW_REDESIGN.md`. Springs, haptic vocabulary, skeletons, `NativeTabs`/Liquid Glass, Live Activity, widget → `TERMINAL_TICKET_MOTION.md`.

## Why
The audit scored 32 areas: 7 Pass, 14 Partial, 11 Fail. What works today: account deletion, AI consent, notification permission, ratings prompt, Reduce Motion.
The failures users and App Review will notice: brand terracotta text fails contrast (4.07:1), layouts clip at large Dynamic Type sizes, Undo and recipe-delete depend on timed toasts, the paywall's billed amount is only body-size (Otto was already rejected once under 3.1.2(c)), there's no password autofill, no Dark Mode, and the tab bar uses a raised action-looking ＋ in a custom bar.

## P0 — App Review risk / broken accessibility (one PR)
- [ ] **G1. Contrast tokens** (02 · Accessibility, 04 · Color). Add `terracottaText` `#AE4A26` (or retune `terracotta`), `danger` `#BE3A3A`, `grayStrong` `#8C7B69` in `src/shared/theme/tokens.ts`; point `Text` `computed`, `Button` primary/ghost, tab tint, `SegmentBar`, `Input` error, error toast, paywall radio, checkbox borders at them. Add `tokens.contrast.test.mjs` asserting every pair in the audit table (≥ 4.5 text, ≥ 3.0 non-text).
- [ ] **G2. Dynamic Type survives AX5** (10 · Typography). `height` → `minHeight` + padding at every place listed in audit P0-2 (`Screen` header, onboarding text block + CTA, social buttons, recipe detail CTAs, Profile sign-out). Cap `maxFontSizeMultiplier` only on tab labels and the nav title. Switch horizontal rows to vertical stacks when `fontScale > 1.5`. Screenshot every screen at AX5.
- [ ] **G3. No action hides in a timed toast** (35 · Alerts & action sheets, 26 · Undo & redo). Recipe delete → native action sheet with destructive "Delete recipe" + Cancel (web keeps `confirm()`). Toasts with an action don't auto-dismiss while a screen reader is on, ≥ 6 s otherwise.
- [ ] **G4. Paywall hierarchy + targets** (44 · Apple In-App Purchase, 46 · App Store Review). In `OttoClubScreen.tsx`: billed line at `type.title`; CTA "Start free trial" (trial) / "Subscribe" (no trial); Terms, Privacy, Restore at 44 pt with `hitSlop`; Restore labelled "Restore purchases". Change nothing else on that screen.

## P1 — HIG violations users feel
- [ ] **G5. Forms autofill + keyboard flow** (39 · Text fields). `textContentType` + `autoComplete` + `returnKeyType`/focus chain in `AuthInput` and `Input`; align sign-up min password (6) with change-password (8); `webcredentials:` associated domain + AASA (ask Juan before touching the website).
- [ ] **G6. `TextLink` primitive, 44 pt** (30 · Buttons). Replace the bare text `Pressable`s in auth screens, `AuthLegal` inline links and the paywall links.
- [ ] **G7. Native sheets** (34 · Sheets). Move the ten `Sheet` call sites to expo-router `presentation: 'formSheet'` with detents and a working grabber; delete `src/shared/ui/Sheet.tsx` when the last one moves.
- [ ] **G8. Discard guard in the editor** (19 · Modality). `usePreventRemove(dirty)` in `EditRecipeScreen.tsx` + action sheet "Discard changes / Keep editing"; same for pasted text on Add.
- [ ] **G9. Photo permissions done right** (12 · Privacy). Drop the library permission request in `src/shared/imagePicker.ts`; "Take photo / Choose from library" choice instead of `takePhoto() ?? pickFromLibrary()`; denied → toast with "Open Settings".
- [ ] **G10. VoiceOver structure** (02 · Accessibility). `Text` `display`/`title` get `accessibilityRole="header"`; onboarding announces "Page n of 3"; `useWindowDimensions` instead of `Dimensions.get`.
- [ ] **G11. Search field** (37 · Search fields). Clear button, Cancel while focused, last 5 queries on focus in `DiscoverScreen.tsx`.
- [ ] **G12. Toast placement** (22 · Feedback). Offset by safe area + tab bar height; verify on a Face ID phone first. Haptic trimming is **M2** in the motion ticket: do it there.
- [ ] **G13. Sign in with Apple button** (43 · Sign in with Apple). System `AppleAuthenticationButton` on iOS, ideally full-width "Continue with Apple" above the other providers (matches flow F1).
- [ ] **G14. In-app offline state** (16 · Loading). NetInfo + TanStack `onlineManager`, one offline banner, persisted query cache so Cookbook/Plan/Shopping read offline. Offline *launch* routing stays in flow F5.
- [ ] **G15. Tab bar decision** (27 · Tab bars). Ask Juan: chat as a normal labelled tab and "add recipe" as a toolbar button, or keep the raised ＋. Build it inside motion **M7** (`NativeTabs`); drop the tab-press haptic.
- [ ] **G16. Dark Mode** (05 · Dark Mode). Needs Juan's OK (L effort). `userInterfaceStyle: "automatic"`, tokens via `useColorScheme` using the warm-dark palette in `DESIGN_SYSTEM.md` §1.2, extend the G1 contrast test to dark pairs, check the mascot art on espresso.

## P2 — polish (Juan picks)
- [ ] **G17.** Layered app icon with dark / clear / tinted appearances (03 · App icons).
- [ ] **G18.** Plain cream launch screen, no otter art (14 · Launching).
- [ ] **G19.** Type scale to Apple defaults: body 17 (10 · Typography). Do it after G2.
- [ ] **G20.** `chevron-back` everywhere now; native large-title headers after M7 (28 · Toolbars & navigation bars).
- [ ] **G21.** Pull-to-refresh, recipe-card context menu, swipe-to-remove on plan entries (32 · Lists & tables, 31 · Menus). Coordinate the menu preview with motion M8.
- [ ] **G22.** Localization scaffolding (`t()` + `expo-localization`), only when a second language is planned (11 · Writing).
- [ ] **G23.** iPad layouts, after G2 and G16 (06 · Layout). Widgets / Live Activities stay in motion **M9**.

## Rules
Fix the shared primitive, not each call site (`Text`, `Button`, `Input`, `AuthInput`, `Screen`, `Toast`, `imagePicker`). Don't touch the AI consent flow, account deletion or the ratings prompt; they pass. Don't change the paywall beyond G4. Run `tsc`, lint and the test suites once per PR, not per item. Check every visual change at default size and at AX5, plus with VoiceOver on.

## Done when
P0 merged and in a TestFlight build, with screenshots at AX5 and the contrast test green. P1 items merged or turned into decisions logged below (G15, G16). Audit scorecard rows re-marked in `docs/gold-standard/OTTO_GAP_AUDIT.md`. Update `ROADMAP.md`.

## Log
<!-- append: date, step, result, commit -->
