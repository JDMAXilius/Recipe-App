# Terminal ticket: what the cloud session can't do (rework handoff)

> Written 2026-11-06 by the cloud session. `main` is at the rework merge (flowV2 off). The cloud
> session keeps building the roadmap on `claude/new-session-izhr2i` and adds items here when they
> need a Mac, a device, a native module, a console or a secret. Tick items here and say so in
> `docs/tickets/REWORK_ROADMAP.md` → Log. House rules: `TERMINAL_TICKET_00_START_HERE_CLAUDE_CODE.md`.

## Now (release 1.0.24 and the device checkpoint)
- [ ] **T1. Release build 1.0.24 (53).** Follow `docs/tickets/CHECKPOINT_1.md` §1. Privacy answers
  first (T5). `eas build -p ios --profile production`, then `eas submit -p ios --profile production`.
- [ ] **T2. Rework preview build (switch on).** `eas build -p ios --profile rework` with a build
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
- [ ] **T4. Kitchen handover (A3).** Run `supabase/migrations/20261106060000_household_owner_handover.sql`
  in the Supabase SQL editor (the MCP apply asks a confirmation that never reaches Juan). Then
  rename the file to the version Supabase records and remove its "NOT YET APPLIED" note.
- [ ] **T5. App Privacy answers + website policy (Juan, with you).** Exact changes in
  `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` → "2026-11-06 corrections": Product Interaction (events),
  meal photos to OpenAI, on-device dictation. Policy paragraphs go to the Otto_Website repo.
- [ ] **T6. Console jobs (Juan).** App Store Connect: turn on Billing Grace Period (R2.7). Supabase: delete the retired `canonicalize` function (it answers
  410 today); turn on leaked-password protection. Decide `REQUIRE_CLUB=on` (server checks Otto Club
  on every AI call; verify the demo account still gets 200 first).

## Server
- [ ] **T7. Redeploy the four functions that still use the in-memory limiter** with
  `rateLimitedDurable` (R0.12): `generate-recipe`, `import-recipe`, `resolve-nutrition`,
  `delete-account`. Change `rateLimited(` → `await rateLimitedDurable(` in each `index.ts` (the
  import too), `npx deno check` each, deploy via the Supabase MCP with `_shared/*` included, and
  smoke-test: an anon call still answers 401. `verify_jwt` per `supabase/config.toml`.

## Native work (needs Xcode, a device or the iOS 26 SDK)
- [ ] **T8. NativeTabs spike (G-8 / R3.1).** Can `expo-router/unstable-native-tabs` on the iOS 26
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
  (R2.7); tapping a dinner reminder opens that recipe, warm and from a quit app (R8.2). As a member:
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

## Device findings (T3)
_Add one line per problem: screen · what you did · what happened · screenshot name._
