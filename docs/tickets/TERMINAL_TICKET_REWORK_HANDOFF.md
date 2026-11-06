# Terminal ticket: what the cloud session can't do (rework handoff)

> Written 2026-11-06 by the cloud session. `main` is at the rework merge (flowV2 off). The cloud
> session keeps building the roadmap on `claude/new-session-izhr2i` and adds items here when they
> need a Mac, a device, a native module, a console or a secret. Tick items here and say so in
> `docs/tickets/REWORK_ROADMAP.md` → Log. House rules: `TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md`.

## URGENT — security (found by the 2026-11-06 audit; the GitHub repo is PUBLIC)
- [ ] **T16. Rotate what leaked into the public git history.** Do these before anything else.
  1. **Apple distribution certificate.** Commit `53b67ebb` removed `mobile/credentials/ios/dist.p12`
     and `mobile/credentials.json` (with the p12 password), but they are still in history and
     readable by anyone who clones the repo. Apple Developer → Certificates → revoke
     "iPhone Distribution: Juan Lugo (A6J6HGNWZK)" (expires 2027-07-18) and delete the profile
     "Otto AppStore v4". First run `eas credentials -p ios` and check EAS uses a different, newer
     distribution certificate (docs/history/TERMINAL_TICKET_TESTFLIGHT.md:106 says it made one);
     if it uses this one, let EAS make a new one, then revoke. Then a test `eas build` to prove
     signing still works.
  2. **RevenueCat webhook secret (`RC_WEBHOOK_SECRET`).** Its value was committed in two docs
     (now redacted; still in history). Make a new one on your machine (`openssl rand -hex 32`; never
     paste it into a ticket, a commit or chat), put it in RevenueCat → Project → Integrations →
     Webhooks → Authorization header, and in Supabase → Edge Functions → Secrets →
     `RC_WEBHOOK_SECRET` (one secret, by hand; not `--env-file`). Check: RevenueCat's "Send test
     event" gets 200; a request with the old value gets 401.
  3. **Auth settings in the dashboard** (Supabase → Authentication): turn on **Secure password
     change** (asks to re-authenticate), set the **minimum password length to 8** (the app already
     asks for 8). Leaked-password protection stays on hold (Pro plan).
  4. **Juan decides:** make the repo **private** (GitHub → Settings → Danger zone), and/or scrub
     the two files from history with `git filter-repo` + force-push. Rotating (1, 2) is what
     actually fixes it: forks and clones keep the old history either way.
  Tick each line here and say so in the roadmap Log.

## Now (release 1.0.24 and the device checkpoint)
- [x] **T1. Release build 1.0.24 (53).** *(built and on TestFlight 2026-11-06; review waits on T5)* Follow `docs/tickets/CHECKPOINT_1.md` §1. Privacy answers
  first (T5). `eas build -p ios --profile production`, then `eas submit -p ios --profile production`.
- [x] **T2. Rework preview build (switch on).** *(1.0.24 (54) on TestFlight, internal group only)* `eas build -p ios --profile rework` with a build
  number above the release (54). TestFlight **internal group only**, never sent for review.
- [ ] **T3. Device check with Juan.** `CHECKPOINT_1.md` §3 (20 min). Put each problem as a line
  under "Device findings" below; the cloud session fixes them. On the rework build (T2), also:
  Plan tab Week · Shopping segment (R4.5) — the list scrolls, ticks and shares as on `/shopping`;
  the meal picker's Find in Discover / Ask Otto doors (R4.3); quit on Plan, relaunch → opens on
  Plan; open a recipe link while quit → the recipe wins (R3.5). Home search field → Search screen;
  a nonsense word → Ask Otto opens with "Write me a recipe for …" in the box (R3.3). Fresh install:
  Cookbook ＋ → Snap a meal → Take photo shows Otto's primer before the iOS alert (R6.2/R6.3).
  Airplane mode (R8.3): cold start as a member → Home; as a lapsed member → Club ended; a fresh
  install → the paywall's Try again, never the app; Add → Snap a meal says it needs a connection.
- [x] **T4. Kitchen handover (A3).** *(applied 2026-11-06 by the terminal via the MCP as `20261106164254`; file renamed)* Run `supabase/migrations/20261106164254_household_owner_handover.sql`
  in the Supabase SQL editor (the MCP apply asks a confirmation that never reaches Juan). Then
  rename the file to the version Supabase records and remove its "NOT YET APPLIED" note.
- [ ] **T5. App Privacy answers + website policy (Juan, with you).** Exact changes in
  `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` → "2026-11-06 corrections": Product Interaction (events),
  meal photos to OpenAI, on-device dictation. Policy paragraphs go to the Otto_Website repo. Before
  the rework build ships (R10.3): allergies, foods to skip and the week's dish names go to OpenAI
  with each Ask Otto turn (B6) — truth table row 18 item 4.
- [ ] **T6. Console jobs.** Done: `canonicalize` deleted; `REQUIRE_CLUB=on` (Juan confirmed
  2026-11-06: keep it on). **Left for Terminal (Juan asked you to do it, Chrome is fine):** App Store
  Connect → the app → Subscriptions → Billing Grace Period → turn it on (16 days, all renewals,
  production + sandbox). Read the page back after saving and tick this. **On hold (Juan):**
  leaked-password protection needs the Supabase Pro plan; not now.

## Server
- [x] **T7a. Deploy `generate-recipe` first *(done 2026-11-06 by the cloud session: v23; anon → 401. The signed-in satay check is still T3)* (code ready on main, 2026-11-06).** Already switched to
  `rateLimitedDurable` and accepts the chat's new context (`allergies`, `skips`, `week`; B6). Deploy:
  `supabase functions deploy generate-recipe` (verify_jwt on). Smoke: anon → 401; a signed-in chat
  turn with `allergies: ["Peanuts"]` asking for satay must not use peanuts and should say so. Old
  apps send none of the new fields and see no change.
- [x] **T7. Redeploy the four functions *(done 2026-11-06 by the cloud session from main: generate-recipe v23, import-recipe v17, resolve-nutrition v14, delete-account v16; all four answer 401 to an anon call)* that still use the in-memory limiter** with
  `rateLimitedDurable` (R0.12): ~~`generate-recipe`~~ (T7a), `import-recipe`, `resolve-nutrition`,
  `delete-account`. Change `rateLimited(` → `await rateLimitedDurable(` in each `index.ts` (the
  import too), `npx deno check` each, deploy via the Supabase MCP with `_shared/*` included, and
  smoke-test: an anon call still answers 401. `verify_jwt` per `supabase/config.toml`.

## Native work (needs Xcode, a device or the iOS 26 SDK)
- [x] **T8. NativeTabs spike (G-8 / R3.1).** Can `expo-router/unstable-native-tabs` on the iOS 26
  SDK host the Otto circle as the trailing tab with the otter face and no search field? If yes,
  swap `app/(tabs)/_layout.tsx` under flowV2; if no, keep `TabBarOttoButton` (works today).
- [ ] **T9. Three scans before an account (R0.16, G-10 = A).** App Attest / DeviceCheck: a native
  module for the attestation token, a `scan_quota` table keyed by the attested device, and
  `scan-meal` accepting an unauthenticated call only with a valid attestation and quota left.
  The cloud session can write the table and function once the token format is known.
- [ ] **T10. Universal links (R8.1).** `associatedDomains: applinks:ottosapp.com` in `app.json`,
  the AASA file on the website, then routes `app/r/[slug].tsx` and `app/l/[token].tsx` (the cloud
  session can write the screens).
- [ ] **T11. Widget + Live Activity + Siri/App Intents (R8.5, R5.3, R8.6).** After T8's SDK
  upgrade. The actions they call already exist (`src/catalogue`, 22 actions).
- [ ] **T12. Sandbox purchase matrix (R10.2).** New install → trial; cancel; fail; Ask to Buy (a
  sandbox child: expect "Waiting for approval"); restore none / found; lapse; grace; reinstall.
  Rework build: a sandbox trial with a reminder on schedules "Your free trial ends in 2 days" (R2.8;
  sandbox trials are minutes long, so check it is scheduled, or skipped when too close); a billing
  failure shows Home's "Apple couldn't take your last payment" line → Update opens Apple's sheet
  (R2.7); tapping a dinner reminder opens that recipe, warm and from a quit app (R8.2); long-press it →
  Cooked it ticks that dinner and opens the week, Swap opens the week (both warm and quit). As a member:
  Account → Otto Club shows the plan and "Renews on …"; Request a refund opens Apple's sheet (R7.1).

- [ ] **T15. Native launch screen (R1.1, G18) — with the switch flip (R10.1), not in 1.0.24.** In
  `app.json` replace `"splash": null` with the `expo-splash-screen` plugin:
  `["expo-splash-screen", { "backgroundColor": "#FAF4EA" }]` (cream, no image, no text), run
  `npx expo prebuild --clean` or a fresh EAS build, and check on a device that the launch goes cream →
  Welcome (or Home) with no white flash and no otter. The in-app splash is already plain cream
  under flowV2.

## Batch jobs (need a secret on your machine)
- [ ] **T13. Cook times for the catalogue (R0.14).** A one-time script over the 795 `otto_recipes`
  that estimates total and active minutes from the steps (gpt-5-mini, strict schema), stored as
  `~` estimates with a 30-recipe sample checked by hand. Ask the cloud session for the script.
- [ ] **T14. AI recipe images (R0.15, ADR-0014).** Generated once per AI recipe, photoreal,
  tagged "AI image", stored in Storage. Needs the image model choice and its key.

## Terminal status (2026-11-06)
- T1: 1.0.24 (53) built (`e8bfabc1`), uploaded, VALID on TestFlight. Not sent for review: waits on T5.
- T2: rework 1.0.24 (54) built (`79b7d5a5`), VALID, reaches "Otto Team (auto)" (internal, 2 testers). TestFlight opens 54 by default; 53 is under Previous Builds. `app.json` stays at 53.
- T7: all four functions use `await rateLimitedDurable(` on main (`deno check` passes). Deployed by the cloud session from main (2026-11-06): generate-recipe v23, import-recipe v17, resolve-nutrition v14, delete-account v16; anon → 401 on all four.
- T4: applied (`20261106164254_household_owner_handover`). REQUIRE_CLUB: demo account `claude-e2e-a` has an active row to 2027-10-04, so it passes. Then via Chrome: `REQUIRE_CLUB=on` saved (digest matches `on`), `canonicalize` deleted from production (stub and config entry removed from the repo; the original is in git history). Leaked-password protection needs the Supabase **Pro plan**; the project is on Free, so it stays off.
- Typecheck on main failed once the typed routes were regenerated (`openOtto` took a hand-rolled router type that expo-router's `Router` doesn't match): now `Pick<Router, …>` with an `Href`. Cloud session: regenerate `.expo/types` (run `npx expo start` once) before trusting `tsc`.

- T8 answered: **no, keep `TabBarOttoButton`.** Read from the installed code (expo-router 6.0.24, react-native-screens 4.16, Xcode 26.0.1). The trailing circle exists only for `role="search"`, which makes `UITabBarItem(tabBarSystemItem: .search)` (`RNSBottomTabsScreenComponentView.mm` `updateTabBarItem`): its title is Apple's "Search" and can't be changed, so VoiceOver would say "Search" on Otto. And a custom image always goes in as `templateSource` (`NativeTabsView.js`, both the 4.16 and 4.18 paths), so the otter face would be a one-colour silhouette. Getting around either means patching expo-router and react-native-screens. Ask again when expo-router exposes `imageSource` and a custom title for the search slot.

## Device findings (T3)
_Add one line per problem: screen · what you did · what happened · screenshot name._
