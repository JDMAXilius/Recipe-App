# Terminal ticket: build and ship 1.0.23 (52)

> **Budget:** one build. Written 2026-11-03. Code is already on `main` (typecheck + unit tests passed locally).
> Use the `eas-ios-testflight` and `app-store-submit` skills.

## What's in it
Membership waits for RevenueCat `logIn` before the gate decides (`AuthProvider.tsx` `purchasesReady`, 5 s ceiling; `club.purchases.ts`/`club.logic.ts` `membershipAnswer`, tests in `club.membership.test.mjs`) · paywall back arrow and auto-leave for members, floating otter 280 (`OttoClubScreen.tsx`) · `OttoArt` true aspect ratio · auth hero otter (`AuthScreenLayout.tsx`) · AI consent names OpenAI, storage key `aiConsentOpenAI` forces re-consent (`aiConsent*.ts`, `storage.ts`, `FaqScreen.tsx`) · `docs/legal/PRIVACY_POLICY.md` · `app.json` 1.0.23 / build 52.

## Steps
- [ ] **R1. Check 1.0.22 (51) status** in App Store Connect (`asc.mjs`). If still waiting, ask Juan whether to withdraw it and submit 52 instead (recommended: 52 fixes the paid-member paywall bug).
- [ ] **R2. Live privacy policy (Otto_Website repo):** replace Anthropic with OpenAI to match `docs/legal/PRIVACY_POLICY.md`; deploy; check the live page. Must be live before 52 is reviewed (5.1.2(i)).
- [ ] **R3. Verify OpenAI data settings:** the app says AI data is not used for training — confirm in the OpenAI dashboard (Juan signs in; never type keys).
- [ ] **R4. Build + submit:** `EXPO_NO_CAPABILITY_SYNC=1 npx eas-cli build --platform ios --profile production --non-interactive`, then `eas submit --latest`, attach to "Otto Team (auto)".
- [ ] **R5. Device check on TestFlight:** paid account opens straight into the app (no paywall flash); consent sheet names OpenAI; otter sizes look right.
- [ ] **R6. Submit for review** with notes: AI provider changed to OpenAI, consent re-asked, privacy policy updated.

## Done when
52 is Waiting for Review, the live policy says OpenAI, R5 passed. Update `ROADMAP.md`, push `main`.

## Log
