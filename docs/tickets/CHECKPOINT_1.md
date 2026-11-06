# Checkpoint 1 — two builds and a 20-minute device check

Status: current · 2026-11-06 · `main` at the rework merge (71 commits, all behind `flowV2`, which is off).

## 1. The release build (1.0.24, switch off)
`app.json` is bumped to **1.0.24 (53)**. What changes for people today, with the switch off:
- Sign-out and account deletion clear the person's data from the phone (chats, journal, prefs, AI consent, the personal list); reminders are cancelled.
- Product events are recorded (`app_events`). **Update the App Privacy answers first**: Usage Data → Product Interaction, linked, not tracking (truth table row 20).
- Dictation stays on the phone where supported.
- Clearer sign-in and kitchen-join errors; Leave asks first; a failed shared-list tick says so.
- Paste a link shows the real reason when Otto refuses (Club, too many requests, AI off).

```
npm ci && npm run typecheck && npm run lint && npm test
eas build -p ios --profile production
eas submit -p ios --profile production
```

## 2. The rework preview (switch on, TestFlight internal only)
Same as production plus `EXPO_PUBLIC_FLOW_V2=true` (profile `rework`). Give it a **different build number** (e.g. 54 in `app.json` just for this build, or let EAS auto-increment), upload it, add it to the **internal testing group only**, and never send it for review.

```
eas build -p ios --profile rework
eas submit -p ios --profile production   # then pick the 54 build, internal group only
```

## 3. What to try on the preview (about 20 minutes)
Write down anything that looks, reads or feels wrong; a screenshot and one line is enough.

**First run** (delete the app first so it's a new install)
1. Welcome → Get started → the three questions (try Skip on one) → Your week.
2. Swap a day; check tonight is a real dinner and fits the allergy you chose.
3. Save my week → Save your plan → make a new account.
4. Paywall → start the trial (sandbox). Expect "You're all set" naming tonight, then the reminders ask.

**Every day**
5. Home: the Tonight card (Start cooking · Cooked it · Swap) and This week.
6. The Otto circle at the end of the tab bar; ask Otto something.
7. Plan: long-press a dish (cooked · swap · move · leftovers · label · remove); remove one and tap Undo; "Otto, fill the open days".
8. Add → Snap a meal: photograph a real plate; check the recipe, "Otto sees", the questions.
9. Account → Preferences: change the household, an allergy, a food to skip.
10. Account → Download my data; then Sign out (expect a confirm, then Welcome).

**Edge cases if you have time**
11. Airplane mode, then open the app (it must not hang on the splash).
12. Ask to Buy (a sandbox child account): expect "Waiting for approval".

## 4. Console jobs (one sitting)
- ~~Supabase SQL editor: A3 handover~~ applied 2026-11-06 (`20261106164254`).
- App Store Connect: privacy answers (above); website policy paragraphs in `docs/legal/APP_PRIVACY_TRUTH_TABLE.md`.
- Supabase dashboard: delete the retired `canonicalize` function; turn on leaked-password protection; decide `REQUIRE_CLUB=on`.
