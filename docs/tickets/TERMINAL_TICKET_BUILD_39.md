# Terminal ticket: build 39 → TestFlight → attached to 1.0.19 (no submit)

> For a Claude Code terminal session on Juan's Mac in the **Recipe-App repo**, with EAS CLI logged
> in, `credentials/ios/` present (local signing + the ASC API key), and the **Chrome MCP** signed in
> to App Store Connect. Written 2026-10-01 by the cloud session, which has no Expo or Apple
> credentials. Read the whole ticket first, work top to bottom, verify each step, log at the bottom.

## Why

Apple sent 1.0.19 (build 38) back with a Guideline 2.1 *Information Needed* request. The answer
is a screen recording **on build 39** plus a written reply (`docs/release/APP_REVIEW_2.1_RESPONSE.md`).
Build 39 adds what that reply describes, and fixes a bug a reviewer would hit:

- **AI consent sheet** (5.1.2(i)): asks before Ask Otto, link/text/photo imports and nutrition
  matching send anything to Anthropic. Has a Privacy Policy link and the no-training line. "Not now"
  sends nothing and shows a toast. Account › Preferences › **Otto and AI** switch.
- **Account deletion** now tells subscribers Apple keeps billing until they cancel, with a
  **Manage subscription** link (Apple's deletion guidance for subscription apps).
- **Seed loader fix:** cook mode, the shopping list, Otto's pick and ingredient search read Otto's
  own catalogue. Before, Otto's originals (Banana Bread, etc.) couldn't be cooked or listed.
- Mic/speech permission strings and FAQ copy name what Apple and Anthropic receive.

Verified in the cloud: `tsc` clean, lint clean, 324/324 tests. The consent flow and cook/list fix
were also exercised in a browser build, with screenshots.

## Where things stand

| Item | State |
|---|---|
| App | ASC app id **6792195637**, bundle `com.otto.recipes`, team `A6J6HGNWZK` |
| Version | **1.0.19**, id `30c951a8-be14-4f8c-a4de-c3d5e29bfa5f`, returned by review (2.1 info request), build **38** attached |
| `app.json` on `main` | version `1.0.19`, `ios.buildNumber` **`39`**, `ITSAppUsesNonExemptEncryption: false` |
| Subscriptions | group "Otto Club" `22260300`: yearly `6794140476` ($39.99), monthly `6815805006` ($4.99), shown as **Ready for Review** |
| Review details | id `5f6b1060-346b-4ca7-80a3-5d7f4d546459` (contact + demo account set on 2026-09-29) |
| TestFlight | internal group **Otto Insiders** (Juan's device) |

## Tools
- `eas` CLI (build + submit). `eas.json` → `production` profile: EAS environment `production`,
  local credentials, `submit.production` has the ASC key.
- `node scripts/asc.mjs METHOD /path '[json]'` for the App Store Connect API.
- Chrome MCP only where the API can't do it. If ASC asks for sign-in, **stop and ask Juan**. Never
  type a password.

## Steps

### B0. Sync and check
1. `git fetch origin main && git checkout main && git merge --ff-only origin/main`. Never force-push main.
2. Confirm `app.json` → `expo.version` = `1.0.19`, `expo.ios.buildNumber` = `39`.
3. `npm ci && npx tsc --noEmit -p . && npm run lint && npm test` → expect 0 errors and 324 passing.
   If anything fails, stop and log it; don't build.

### B1. EAS environment (names only, never print values)
`eas env:list --environment production` must include `EXPO_PUBLIC_USE_OTTO_RECIPES` (= `true`),
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and the RevenueCat iOS key
(`appl_…`). A missing one is a stop: log which.

### B2. Build and upload
`eas build --platform ios --profile production --auto-submit --non-interactive`
- Wait for it to finish (typically 20–40 min). Log the EAS build URL.
- If the build fails: read the log, fix, commit with the session attribution lines, push, rebuild.
  Keep 39. Only if 39 was **uploaded** and then rejected by Apple processing do you bump to `40` (Apple
  never accepts a build number twice). Then use 40 everywhere this ticket and the resubmit ticket say 39.

### B3. Processing (API)
Poll `GET /v1/builds?filter[app]=6792195637&filter[version]=39` until `processingState` is
`VALID`. Record the build **id**. Confirm `usesNonExemptEncryption` is `false`. If ASC still asks
for export compliance, answer "None of the algorithms mentioned above" in Chrome.

### B4. TestFlight for Juan
1. `GET /v1/betaGroups?filter[app]=6792195637`, find **Otto Insiders**, then
   `POST /v1/betaGroups/{groupId}/relationships/builds` with `{"data":[{"type":"builds","id":"<buildId>"}]}`
   (skip this if automatic distribution already added it).
2. What to Test: `POST /v1/betaBuildLocalizations`, `locale` `en-US`, `whatsNew`:
   `Build 39 for the App Review video. New: AI consent prompt (Ask Otto, imports), Otto and AI switch in Account, cook mode and shopping list fixed for Otto's own recipes, subscription note on account deletion.`
3. Verify in Chrome (TestFlight → Otto Insiders) that build 39 shows **Testing** for Juan.

### B5. Attach build 39 to version 1.0.19 (do NOT submit)
`PATCH /v1/appStoreVersions/30c951a8-be14-4f8c-a4de-c3d5e29bfa5f/relationships/build` with
`{"data":{"type":"builds","id":"<buildId>"}}`, then `GET /v1/appStoreVersions/30c951a8-be14-4f8c-a4de-c3d5e29bfa5f/build`
and confirm version `39`. If the API refuses because of the version's state, do it in Chrome:
version page → Build → remove 38 → add 39 → Save. **Don't press Submit or Resubmit**, and don't
reply to Apple yet. Both wait for the video.

### B6. Business page — fix stale roadmap rows (Chrome, read-only)
`https://appstoreconnect.apple.com/business`: read Agreements (Paid Apps, Free Apps), Bank,
Tax (W-9) status. The submit ticket recorded Paid/Free/bank **Active** on 2026-09-29, but
`ROADMAP.md` still shows ASC-1/2/3 as todo. Update those rows to what the page says. If anything
is **not** Active, stop and tell Juan: a reviewer's sandbox purchase fails without the Paid Apps
Agreement.

### B7. Website fixes
Run `TERMINAL_TICKET_WEBSITE_REVIEW_2_1.md` W1–W4 now (website repo). Prepare W5 (Privacy Policy +
Terms "AI features" + FAQ) on a branch; it is deployed in the resubmit ticket, step R6.

### B8. Tell Juan, log, push
1. Tell Juan, in one message: **"Build 39 is on TestFlight. Delete Otto, install 39, and record
   using `docs/release/APP_REVIEW_2.1_RESPONSE.md` §3. Then AirDrop the video to the Mac as
   `~/Desktop/otto-review-1.0.19.mov` and say 'video ready'."**
2. Log below. Update `ROADMAP.md` (2026-10-01 section: build 39 status). Commit with the session
   attribution lines, `git fetch` + rebase, push to `main` (fast-forward only).
3. **Stop here.** The next ticket is `TERMINAL_TICKET_RESUBMIT_2_1.md`, which starts when the
   video exists.

## Don'ts
- Don't submit, resubmit, or reply in App Review. That's the next ticket, after the video.
- Don't change prices, trial, availability, metadata, or the subscriptions.
- Don't record anything for Juan or touch his device.
- No password typing, no account creation, no purchases, no force-push.

## Log
<!-- append: date/time, step, result, build id / URLs -->

- 2026-09-30 (terminal, Juan's Mac). All steps done; stopped before the video.
  - B0: version 1.0.19 / build 39; `tsc` clean, lint clean, 324/324 tests.
  - B1: EAS production has EXPO_PUBLIC_SUPABASE_URL, _ANON_KEY, _USE_OTTO_RECIPES=true. The RevenueCat `appl_` key isn't an EAS var; it's the public SDK key hard-coded in `src/features/profile/club.purchases.ts` (fine for a public key).
  - B2: EAS build https://expo.dev/accounts/black-360/projects/otto/builds/39fc013b-3b33-4044-9fe5-d614afa14979, auto-submitted.
  - B3: build id `cdaff286-5e99-41ca-85f2-526acae207f6`, VALID, usesNonExemptEncryption=false.
  - B4: attached to Otto Insiders (2 testers), internalBuildState IN_BETA_TESTING, What to Test set (PATCH; POST 409s because a localization already exists).
  - B5: attached to 1.0.19 via API (204); GET confirms build 39. Not submitted, no reply sent.
  - B6: Business page: Paid + Free Apps Active, bank Active, W-9 Active, DSA Active. ROADMAP ASC-1/2/3 → done.
  - B7: website W1 already clean live (only juandiego@); W2 + W3 fixes live (`Otto_Website` 1d29a23); W4 mirrors synced here; W5 on branch `w5-ai-consent` (22df8b9), deploys in R6.
