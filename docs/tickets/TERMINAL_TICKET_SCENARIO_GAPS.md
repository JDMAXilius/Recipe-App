# Terminal ticket: close the scenario gaps the flow map's lanes found

> **Budget:** S1 alone first (privacy, small PR, next build). S2–S7 in two PRs. S8–S11 with the flow redesign. Written 2026-11-04.
> Read `TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md` first.
> Source: the 14 scenario lanes traced from Otto's code, `docs/flow-maps/lanes/otto.json` (`file:line` evidence per step), drawn in `docs/flow-maps/maps/otto.html` and in Figma `r9QxxN5qDQXjW473H7LKgM` (page "Flow map — Otto next (current)", frame "Scenario lanes — Otto today vs Apple"). Apple's standard per lane: `docs/flow-maps/lanes/apple.json`.
> **Not here (owned elsewhere):** last-tab restore (F4), return to the link target after sign-in/purchase, lapsed → re-subscribe, offline launch (F5), paywall model (F2), Cookbook "Explore" → "/" (F6) in `TERMINAL_TICKET_FLOW_REDESIGN.md`; photo permission (G9, done); offline banner + cache (G14, done) in `TERMINAL_TICKET_GOLD_STANDARD_GAPS.md`.

## P1: privacy
- [x] **S1. Sign out and account deletion clear this device** *(done 2026-11-06: `src/shared/forget.ts`, called from the auth listener in `app/_layout.tsx`, so sign-out, delete and an account switch all get it; reminders cancelled; AI consent asked again; `forget.test.mjs` lists every key's decision)* (lane 12, also 7 and 11). Today `signOut()` only ends the Supabase session (`src/features/auth/auth.queries.ts:39`). Unscoped AsyncStorage keys survive for the next person on the phone: `chats`, `journal`, `shoppingState`, `prefs`, `household`, `householdRecent`, `cookRatings`, `aiConsentOpenAI`, `rcSynced` (`src/shared/storage.ts:8-23`). One `clearAccountData()` in `storage.ts` called from `signOut` (so delete-account gets it too). Keep device settings (`unitSystem`, `soundsEnabled`, `notifPrefs`, `reviewPrompt`, `onboarded` device flag if still used). Cancel scheduled reminders on sign out. Add a test listing which keys survive. AI consent must be asked again for a different account (5.1.2(i)).

## P1: lanes that miss Apple's standard and have no ticket
- [ ] **S2. Notification taps land somewhere** (lane 2). Reminders carry `data.url` (`otto://plan`, `otto://shopping`, `otto://recipe/<id>`) in `notifications.queries.ts:52-56`; one `useLastNotificationResponse` handler in the root layout routes it, through the same gate as links (F5 return-to).
- [ ] **S3. Mic denied → Open Settings** (lane 3). `ChatScreen.tsx:109-111`: give the toast the `actionLabel: 'Open Settings'` → `Linking.openSettings()`, same as the camera (G9).
- [ ] **S4. AI failures keep the work and offer Retry** (lane 10). Chat gets a Retry on the failed turn; a failed photo import keeps the photo for retry; a client timeout (about 60 s) with plain copy; state the limits (20 chats / 30 imports per 15 min) in the 429 message ("try again at 3:40"), not only "a few minutes".
- [x] **S5. Sign-in errors explain the fix** *(done 2026-11-06: `auth/authErrors.ts` in every auth screen, tested)* (lane 12). Map Supabase auth errors (invalid credentials, unconfirmed email, rate limit, network) to plain copy with the next step; network errors get Try again. Never show raw server text.
- [ ] **S6. Billing problem banner** (lane 5). When RevenueCat reports `billingIssueDetectedAt` / grace period, show a quiet banner "Apple couldn't renew Otto Club. Update payment" → Manage Subscriptions. Confirm the billing grace period is ON in App Store Connect (Juan).
- [ ] **S7. What's New, once** (lane 9). Store `lastSeenVersion`; on a meaningful release show one dismissible sheet (3 bullets), then the last state; skip for patch releases. Also change the query-cache `buster` from the app version to a cache-schema number so updates don't wipe the offline cache (lane 8).

## P2: rough edges
- [x] **S8. Household** *(done 2026-11-06: join errors split (wrong code, too many tries, no connection; there is no member cap to be "full"), Leave asks first via `shared/confirm.ts`, a failed shared write says so)* (lane 13). Distinct join errors (wrong code / full / network); confirm before Leave ("You'll lose the shared list on this phone"); surface a failed shared tick instead of dropping it.
- [ ] **S9. Chats and journal follow the account or say they don't** (lane 13). Today they are device-only. Decide (Juan): sync to Supabase, or label them "on this iPhone".
- [ ] **S10. Empty states with a first action** (lane 14). Shopping ("Plan a meal to build your list" → Plan), Recent chats (→ Create), Journal (→ Cookbook), Discover no results (clear filters / ask Otto).
- [ ] **S11. AI consent per account** (lane 11): store consent with the user (or clear on sign out per S1) so it never carries to another account.

## Rules
Fix the shared piece once (`storage.ts`, `Toast`, the root notification handler, one auth-error mapper). Don't touch the AI consent copy, account deletion flow or paywall layout beyond what an item says. `tsc`, lint, tests once per PR. After each PR, update the lane in `docs/flow-maps/lanes/otto.json` (flip the step's `ev` from "gap" to "seen", cite the new `file:line`), run `node docs/flow-maps/build/build.mjs`, and re-mark the verdict.

## Done when
Every Otto lane is "meets" or its remaining gap is a logged decision (F2 paywall model, S9). Update `ROADMAP.md`.

## Log
<!-- append: date, step, result, commit -->
