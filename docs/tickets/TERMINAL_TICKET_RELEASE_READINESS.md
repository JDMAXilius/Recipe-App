# TERMINAL TICKET — release readiness audit (ship-ready)

> STATUS: in-progress — terminal 2026-07-25 (06a7f5dc). Section A first, per the ordering law.
> STATUS: open — cut from cloud 2026-07-25. Founder directive: "the app is pretty much almost
> finished and ready to publish — define and audit everything necessary, research what other
> companies do before releasing, polish as much as possible."

**What this ticket is.** A full pre-submission audit of Otto, split into what will get the app
**rejected**, what will get it **uninstalled**, and what will make it feel **finished**. Every
item names the evidence already in the repo so the terminal audits rather than re-discovers.

**How to work it.** Evidence, not opinion: each box is closed by a *result* written to this
ticket's `## Log` (a screenshot path, a command's output, a URL that resolved, a label filled
in). "Looks fine" doesn't close a box. Anything found that needs code lands as a normal
packet through the crew (builder → critic → verifier); this ticket stays the audit trail.

**Ordering law: Section A gates submission; Section B gates the beta; C–F are the polish.**
Do not spend a session on motion polish while the App Privacy label is unfilled.

---

## What the industry actually does (research, 2026)

Grounding for the shape of this ticket — the practices below are what the checklists converge on:

- **Rejections cluster in compliance plumbing, not features.** Three guideline numbers dominate
  rejection letters — 2.1 (incomplete/broken), 4.3 (spam/duplicate), 5.1.1 (privacy) — and most
  *first-submission* rejections come from five items: support URL, privacy policy, App Privacy
  disclosure, account deletion, privacy manifest. Otto has 2 of the 5 genuinely done.
- **Treat the App Privacy label and the code as one source of truth.** The recommended method is
  to fill the label first, then audit the code against it — *every mismatch is a rejection
  waiting to happen*. This is the single highest-leverage item in Section A.
- **Crash-free targets are numeric, not vibes.** ≥99.5% sessions crash-free on iOS; a crash rate
  above 1% during TestFlight is treated as a launch blocker; a 0.3% sustained drop halts a
  rollout. **Otto cannot measure any of this today** — there is no crash SDK (Section B).
- **Cold start p95 under ~2s on mid-tier devices.** Start-up regressions drive uninstalls faster
  than crashes do.
- **Ship staged.** Apple's Phased Release trickles an update over 7 days and can be paused; the
  paired practice is a **kill switch / feature flag** so a bad path is toggled off rather than
  re-submitted (Otto already has the pattern in `USE_OTTO_RECIPES`).
- **Beta before store.** A TestFlight external round with real testers precedes submission by
  ~1–3 weeks; store metadata and screenshots are prepared *before* the beta, not after.
- **Day-1 dashboard before launch, not after.** Activation, first-session completion, onboarding
  drop-off and crashes are watched from hour one, with a patch branch ready.

Sources: [App Store submission checklist 2026](https://appbuilder.academy/blog/app-store-submission-checklist) ·
[Rejection reasons index 2026](https://pushmyapp.ai/blog/app-store-rejection-reasons) ·
[Rejection reasons (QAwerk)](https://qawerk.com/blog/app-store-rejection-reasons/) ·
[Launch checklist (LaunchList)](https://getlaunchlist.com/checklists/app-launch) ·
[2026 launch execution guide](https://www.assuresoft.com/blog/2026-guide-launching-mobile-app-strategic-execution-checklist) ·
[Expo privacy manifests](https://docs.expo.dev/guides/apple-privacy/)

---

## Section 0 — already solid, do NOT re-audit

Confirmed in the repo; spend no session time here unless something below contradicts it.

- **Account deletion** (Apple 5.1.1(v)) is properly built: `supabase/functions/delete-account/index.ts`
  deletes rows in one transaction (`admin_delete_user_data`), then pages storage photos, then the
  auth user, in that order, with a destructive-tier rate limit and the user id taken only from the
  verified token. Reachable from `ProfileScreen`.
- **Paywall furniture** exists: Restore, Terms and Privacy links are on `OttoClubScreen` (:88, :252, :260).
- **RLS posture** has an attack suite (`supabase/migrations/tests/rls-attacks.test.mjs`) across 17 migrations.
- **CI gate** runs typecheck + lint + 42 test files on every push and PR (`.github/workflows/ci.yml`).
- **Legal drafts** exist and were written against the code (`docs/legal/PRIVACY_POLICY.md`,
  `TERMS_OF_SERVICE.md`, plus `.html` builds) — drafted, not reviewed, not published (A1).
- **Permission strings** are configured for photos, camera, microphone and speech in `app.json` plugins.

---

## Section A′ — the decided path (founder calls, 2026-07-28)

Four questions that changed the shape of Section A were answered on 2026-07-28. Recorded here
because each one closes or reopens boxes below, and a later reader needs the *why*, not just the
tick.

| Decision | Call | What it does to this ticket |
|---|---|---|
| **Otto Club in 1.0** | **Ship it live.** Not a free 1.0. | A6 stays a blocker in full, and it is now the **long pole** — the Paid Applications Agreement is signed by the Account Holder (jdmaxinius@gmail.com) and nothing else in the chain can start until it is active. Feature gating is real work: `useClub()` is referenced by exactly one screen today (the paywall), so **no Club feature is gated anywhere**. |
| **iPad** | **iPhone only for 1.0.** | A5 **closed** — `app.json` now sets `supportsTablet: false` (2026-07-28). Takes the iPad device matrix, the 13" screenshot set, and the stretched-layout rejection risk off the table in one line. Revisit as a deliberate release. |
| **Support mailbox** | **`juandiego@ottosapp.com`** everywhere. | The only address with verified live DNS and a real sending path. `support@` and `hello@` were both aspirational, and an aspirational support address is a bounce in front of a reviewer. `ProfileScreen.tsx` and all 8 references across Otto_Website + both legal documents were changed to match on 2026-07-28. |
| **Crash reporting** | **Sentry before the external beta.** | B1 is in scope for 1.0. It lands **after** the App Privacy label (A2) is filled, because it adds Diagnostics as a collected type and a new data recipient — the label and `app.json`'s privacy manifest must both be updated when it does. |

**One conflict this audit surfaced and closed:** the website advertised Otto Club at **$45/year**
(copy written 2026-07-20) while the app's launch pricing is **$34.99/year** (`e8ffae2a`,
2026-07-24). A price on the marketing site that disagrees with the price in the purchase sheet is
a 3.1.2 problem and an honesty-law problem. The site was corrected to $34.99 on 2026-07-28 — the
app was already right. **The ASC products must be created at $4.99/mo and $34.99/yr**, or all
three disagree again.

---

## Section A — submission blockers `[gates everything]`

- [x] **A1. The policy URLs must actually resolve.** *(2026-07-25: all four 200 with real content; /support exists — see Log.)* `ProfileScreen.tsx:37-38` and
      `OttoClubScreen.tsx:30-31` point at `https://ottosapp.com/privacy` and `/terms`. From the
      cloud session both returned 403 through the proxy — **unverified, not confirmed broken**.
      Open both in a browser. A 404 or placeholder at a URL you also typed into App Store Connect
      is a straight 5.1.1 rejection. Publish `docs/legal/*.html` if they aren't live, and record
      the resolved URLs in the Log.
- [ ] **A2. Fill the App Privacy label, then audit the code against it.** Do it in that order.
      Build a truth table in the Log — *data type · collected? · linked to identity? · used for
      tracking? · where in code · which third party*. Sources to walk: Supabase auth (email, name
      from provider) and every table in `supabase/migrations`; `recipe-photos` storage; RevenueCat
      (`react-native-purchases` — purchase + a user id); `expo-notifications` (device token);
      `expo-speech-recognition` (on-device vs server — **state which, explicitly**); the AI edge
      functions (`generate-recipe`, `import-recipe`, `canonicalize`) and what leaves the device in
      a prompt. Cross-check the finished table against `docs/legal/PRIVACY_POLICY.md` — where they
      disagree, one of them is wrong and both get fixed.
- [x] **A3. Privacy manifest.** *(2026-07-28: `expo.ios.privacyManifests` now declared in `app.json`
      with all seven collected data types copied from the A2 truth table — email, name, user id,
      device id, purchase history, photos/videos, other user content; every one Linked, none
      Tracking, all App Functionality. Verified through `expo config --type public`. Takes effect
      on the next prebuild. **Two things still gate it:** Location is deliberately absent pending
      the EXIF test (truth-table row 9), and Diagnostics must be added the day Sentry lands.)*
      There is no `PrivacyInfo.xcprivacy` in the repo and no
      `expo.ios.privacyManifests` in `app.json`. This is expected under CNG — `@expo/config-plugins`
      writes one during prebuild on SDK 50+ — but Apple does not always parse manifests supplied by
      static pods, so **verify rather than assume**: unzip the built `.ipa` (or inspect the prebuild
      output) and confirm a manifest exists and declares reasons for the required-reason APIs in
      use (UserDefaults is the one that always applies — AsyncStorage). If it's short, declare
      `expo.ios.privacyManifests` in `app.json` explicitly. Builds 32/33 uploaded, which is
      evidence the *upload* gate passes; it is not evidence the declarations are complete.
- [ ] **A4. App Review demo account.** Otto redirects signed-out users straight to sign-in
      (`app/(tabs)/_layout.tsx:31`), so a reviewer cannot see the app without credentials.
      Provision a **stable** review account (never the founder's), seed it with a few saved
      recipes, a week plan and a shopping list so the reviewed app isn't all empty states, and put
      the credentials plus a short walkthrough in App Review Notes. Include how to reach the paid
      tier for review (see A6). Record the account in the Log — not the password.
- [x] **A5. iPad.** *(2026-07-28: founder call — iPhone only for 1.0. `app.json` now sets
      `supportsTablet: false`. No iPad screenshots, no iPad device matrix, no stretched-layout
      rejection. Takes effect on the next prebuild.)* `app.json` set `"supportsTablet": true`, which means **App Review will test on
      an iPad and iPad screenshots are required**. Either run the whole app on an iPad and fix what
      breaks (the recipe grid is `maxWidth: '50%'` per card — on a 1024pt-wide canvas that's two
      enormous tiles), or set `supportsTablet: false` and ship iPhone-only. This is a founder call
      with real scope attached: make the call first, then execute. Do not submit with it `true`
      and untested.
- [ ] **A6. Otto Club must be real, not the Test Store.** `app/_layout.tsx:28` still gates
      `Purchases.configure` on `__DEV__ || !RC_TEST_STORE`. Shipping a paid tier means real
      products, real prices ($34.99/yr · $4.99/mo · 5-day trial per the founder call), the
      subscription metadata Apple requires, and a reviewer path to test it. Work
      `docs/tickets/OTTO_CLUB_GOLIVE.md` to completion — **or** ship v1 with the club hidden. Both
      are legitimate; shipping a half-live paywall is not.
- [x] **A7. Content rights.** *(2026-07-28: TheMealDB is now credited in the UI — a linked "Recipe data from TheMealDB" line on every seed recipe's detail, plus a rewritten FAQ answer naming them. USDA attribution + the non-endorsement wording render under every nutrition card. Still open: the Phase 0 terms/image-re-hosting answers in TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md.)* Recipe text, images and video links still come from TheMealDB.
      `docs/tickets/TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md` **Phase 0** (terms + attribution +
      image re-hosting answers) is a *launch* gate, not just a migration gate — an app store
      listing is a commercial distribution of that content. Also confirm the in-app attribution
      the terms require actually renders somewhere a user can find (today: nowhere — the only
      mention of TheMealDB in the UI layer is a code comment in `CookScreen.tsx:294`). USDA data
      is public domain but its **attribution and "not endorsed" wording** should still appear
      wherever nutrition is explained.
- [x] **A8. Health and AI disclaimers.** *(2026-07-28: nutrition card carries "an estimate isn't dietary or medical advice"; the import/generate review screen carries the allergen + temperature line where the AI's work is actually reviewed; two new FAQ answers cover both. Wording kept in Otto's voice, and the engine's null-beats-a-guess rule is untouched.)* Otto prints calorie and macro numbers and generates
      recipes with an LLM. Add, in the app (not only in the ToS): nutrition figures are estimates,
      not dietary or medical advice; AI-generated recipes are suggestions a human must judge —
      **allergens and food safety are the cook's call**. This protects the listing under 1.4.1
      (physical harm) and is what every nutrition-adjacent app ships. Keep the wording in Otto's
      voice, and honour the honesty law already in the engine (null beats a guess).
- [ ] **A9. Store metadata + assets.** Name, subtitle, keywords, description, promotional text,
      support URL (`juandiego@ottosapp.com` exists as a support *email* — Apple wants a URL),
      marketing URL, category (Food & Drink), **age rating questionnaire**, export compliance
      (`ITSAppUsesNonExemptEncryption: false` is already declared), and screenshots for every
      required device size (+ iPad if A5 stays true). Copy passes the anti-slop rules like the app
      does.

---

## Section B — instrumentation `[gates the beta]`

Otto currently ships with **no crash reporting and no analytics** — `grep -rn "Sentry\|analytics\|posthog\|amplitude"` returns nothing. Every number in the research above is unmeasurable today, and a TestFlight round with no crash telemetry produces opinions instead of a crash-free rate.

- [ ] **B1. Crash + error reporting.** Add one SDK (Sentry has a first-class Expo config plugin;
      any equivalent is fine). Requirements: source maps uploaded per build so stacks are readable,
      release/build tagging that matches `app.json`, and **no PII in breadcrumbs** — Otto's whole
      posture is minimum collection, so scrub message bodies, recipe text and emails. Wire it to
      the existing `ErrorBoundary` (`app/_layout.tsx:37`) so caught crashes are reported, not just
      swallowed.
- [ ] **B2. The smallest honest funnel.** Not product surveillance — the five events that tell you
      whether the app works: install → sign-in complete → first recipe saved → first cook started →
      paywall viewed → purchase. Plus onboarding drop-off. Anything beyond that needs a reason.
- [ ] **B3. Adding B1/B2 changes A2.** A new SDK is a new data recipient: update the App Privacy
      label *and* the privacy policy in the same commit. Do not let the label go stale the week it
      was filled in.
- [ ] **B4. Kill switch.** Decide what you can turn off without shipping a build: the AI features
      (cost or abuse), Otto Club, `USE_OTTO_RECIPES`. Today `USE_OTTO_RECIPES` is a build-time
      constant — a remote-config flag (a `public.app_config` row read at launch, RLS public-select)
      turns "submit a hotfix and wait for review" into "flip a row".
- [ ] **B5. Backend alarms.** Supabase advisors clean (`get_advisors`), edge-function error rates
      and the AI spend per day visible somewhere you'll actually look — `docs/tickets/AI_COST_DIET.md`
      already owns the cost work; this is just the alarm.

---

## Section C — quality sweeps `[the polish, evidence-producing]`

- [ ] **C1. Accessibility pass, screen by screen.** VoiceOver on every screen; Dynamic Type at the
      largest accessibility size; a 44pt hit-target sweep; contrast on every state (the filter chip
      contrast bug is the precedent — a selected chip was 1:1); reduced-motion honoured. **Known
      violations already confirmed by review, start here:** `ChatScreen.tsx:44` HeaderButton is
      40×40; `Transcript.tsx:65` clarify chips ~40pt; `Transcript.tsx:47` **chat bubbles never
      announce who is speaking**; `HoldToRemoveRow.tsx:165` signals "held" with scale + shadow only
      (WCAG 1.4.1) and its removal is silent on iOS (`Toast.tsx:64` uses `accessibilityLiveRegion`,
      which is Android-only); `OttoArt` announces the developer string "Otto illustration: happy"
      as the first element of a screen.
- [ ] **C2. Device matrix.** Smallest supported iPhone (SE/mini) through Pro Max, plus iPad if A5
      stays true. The small-screen pass has a known target: `ChatScreen.tsx:180`'s unconditional
      `onContentSizeChange` auto-scroll pushes the 220pt hero off the top on a 667pt window.
      Also: notch/Dynamic Island insets, the keyboard over every text input, and rotation (the app
      declares `"orientation": "portrait"` — confirm nothing assumes otherwise).
- [ ] **C3. Performance budget.** Cold start p95 < 2s on a mid-tier device; scrolling Discover with
      95 cards; image decode on the recipe grid (`expo-image` is in use — confirm caching policy);
      time-to-first-token on an Otto reply; memory over a long cook session with the screen awake.
      Record the numbers in the Log so the next release has a baseline to regress against.
- [ ] **C4. Offline and failure states.** There is **no** connectivity library in the dependency
      list, and TanStack is configured `retry: 1` (`app/_layout.tsx:18`). Walk the app in airplane
      mode and write down every screen that lies. One liar is already confirmed:
      `household.queries.ts:114` discards the query error, so a failed plan fetch renders
      "Nothing to buy yet" to a shopper whose week is full. Decide the pattern (a global offline
      banner vs per-screen honest errors) and apply it once, everywhere.
- [ ] **C5. Deep links.** `scheme: "otto"` is set; there are **no `associatedDomains`**, so nothing
      opens Otto from a web link. Two live paths depend on links working: OAuth callback and
      password reset (`auth.queries.ts:42`), plus sharing — `RecipeDetailScreen.tsx:137` records
      that the `/s/<slug>` resolver page doesn't exist. Either build universal links + the resolver
      or confirm the share sheet never mints a URL that leads nowhere.
- [ ] **C6. Notifications.** Permission is requested at a moment the user understands why; the
      reminders fire at the right local time; nothing arrives for a plan the user deleted; turning
      them off actually stops them (`NotifSync` at `app/_layout.tsx:53`).
- [ ] **C7. Content QA.** Longest recipe title, a recipe with no image, a category with one result,
      an ingredient list of 30, a 12-hour cook time, an empty cookbook, an empty week, a 3-word
      chat reply and a 900-word one. Screenshot the ugly ones.
- [ ] **C8. Close `TERMINAL_TICKET_BUILD34_LIST_SYNC.md` first.** Its section 4 holds 14 confirmed
      defects in shipping code (silent under-buying on the shopping list, a dead Undo, a scroll
      lock, a lying empty state). Those are launch-quality bugs, not backlog.

---

## Section D — security and data `[before external testers]`

- [x] **D1.** `mcp__Supabase_Otto__get_advisors` (security + performance) clean, or every finding
      triaged in the Log with a reason. *(2026-07-25: 0 errors; 3 FK indexes fixed, rest triaged;
      one founder action — leaked-password protection.)*
- [ ] **D2.** Run `supabase/migrations/tests/rls-attacks.test.mjs` against the **production**
      project (not just local) and confirm user B cannot read or write user A's rows — recipes,
      photos, plans, households, shares.
- [ ] **D3.** No service-role key reachable from the client; every edge function verifies the token
      like `delete-account` does; rate limits present on the expensive ones
      (`generate-recipe`, `import-recipe`, `canonicalize`, `content`).
- [ ] **D4.** `.env.development` is not committed with anything sensitive, and the anon key's
      posture is deliberate (it is public by design — say so in the Log so nobody "fixes" it later).
- [ ] **D5.** Backups: point-in-time recovery on, and a rehearsed answer to "a user emails asking
      for their data" (GDPR export) and "delete everything" (already built — verify end to end on
      a throwaway account).

---

## Section E — release mechanics `[the last week]`

- [ ] **E1. TestFlight external round.** ≥8–10 testers who are not you, ≥5 days, with the crash SDK
      live. Exit criteria in the Log: crash-free ≥99.5%, zero P1 bugs open, every tester completed
      sign-in → save a recipe → cook a step → build a shopping list.
- [ ] **E2. Phased release ON** for the App Store submission, with a written rollback plan (what
      you flip via B4, what needs a build, who decides).
- [ ] **E3. Support path.** A support **URL** (A9), a monitored inbox, and a first-response habit
      for App Store reviews — the first week's reviews set the listing's tone.
- [ ] **E4. Day-1 dashboard** open before the release goes live: installs, activation, crash-free,
      AI spend, edge-function errors.
- [ ] **E5. Version discipline.** `expo.version` is the marketing version, `ios.buildNumber` the
      upload counter; bump deliberately, tag the release commit, and keep `app.json` and the tag in
      step (`e01443f` is the pattern).

---

## Section F — the finish pass `[what makes it feel done]`

- [ ] **F1. One design sweep, whole app.** Every screen against `docs/reference/DESIGN_SYSTEM.md`
      and `contracts/ui-components.md`: the semantic ink rule (terracotta = computed/interactive,
      ink = authored), `Bounceable` as the only press-feedback wrapper (`Composer.tsx:119, 140`
      currently hand-rolls `opacity: 0.8`), spacing from tokens, no raw hex, one loading pattern,
      one error pattern, one empty-state pattern.
      **The sweep is now a command, not a habit: run `/polish <Screen>` (or `--all`)** —
      `.claude/skills/polish/SKILL.md`, shipped 2026-07-25 with the delight vocabulary
      (`docs/reference/contracts/motion.md`). It audits this exact checklist plus the
      haptic/sound maps and reduced-motion paths, and emits findings as builder packets.
      Calibrated on RecipeDetail (15 findings on an "already polished" screen), then run
      over ShoppingScreen, CookScreen, ChatScreen and PlanScreen — see the DELIGHT ticket's
      Log for the standing findings and the one open founder ruling (do hero/toolbar icon
      buttons need `Bounceable`?). **Pre-release ritual: no screen ships unswept.**
- [ ] **F2. Copy pass.** Every string in Otto's voice, no slop, no placeholder, no developer
      language leaking into the UI (see the `OttoArt` a11y string in C1).
- [ ] **F3. Motion + haptics** consistent and reduced-motion aware; nothing janky on the oldest
      supported device.
- [ ] **F4. First-run experience.** Onboarding → first value in under a minute; the app is never
      an empty room on day one (this is also what makes A4's review account convincing).
- [ ] **F5. App Store screenshots that show the app doing its job** — the cook flow, the shopping
      list, Otto answering — not a hero shot of an empty screen.

---

## Crew — how this ticket is actually run (added 2026-07-25)

Same law as every ticket: audits produce findings, findings become packets, and **nothing
lands unrefuted**. This ticket is the audit trail; the crew does the work.

| Section | Who audits | Who fixes | Who refutes/verifies |
|---|---|---|---|
| A1, A9 (URLs, metadata, copy) | **builder** (research + drafts) | builder | **critic** REFUTER on every claim ("this URL resolves" gets *checked*, not asserted) |
| A2, A3 (privacy label, manifest) | **security-builder** walks tables/functions/SDKs and drafts the truth table | security-builder | critic REFUTER — every label row cross-examined against code |
| A4 (review account) | **security-builder** (seeding via service role) | — | founder holds the credentials |
| A5, C1, C2, C7, F1–F5 (iPad, a11y, devices, content QA, finish) | `/polish` skill once it exists (`TERMINAL_TICKET_DELIGHT_POLISH.md` 3b) + **builder** sweeps | builder / **ui-systems** (tokens, primitives) / **delight** (motion, sound) | critic REFUTER per batch; **verifier** runs the ladder; founder does the on-device rung |
| A6 (Otto Club) | per `OTTO_CLUB_GOLIVE.md` | builder + security-builder (webhook) | critic + a real sandbox purchase (founder) |
| A7, A8 (rights, disclaimers) | **builder** research; wording in Otto's voice | builder | critic JUDGE on the wording, REFUTER on the claims |
| B1–B5 (crash SDK, funnel, kill switch, alarms) | **builder** (SDK) + **security-builder** (app_config flag, RLS) | same | critic REFUTER (PII-in-breadcrumbs hunt is a named packet), verifier |
| C4, C8 (offline honesty, BUILD34 defects) | already-confirmed findings | builder per packet | critic REFUTER re-run on the fix (the shopping fix that "fixed" 5f9fdcd is the cautionary tale) |
| D1–D5 (security) | **security-builder** + advisors | security-builder | critic REFUTER attacks the fix; RLS attack suite extended, not just re-run |
| E1–E5 (release mechanics) | founder + terminal together | — | exit criteria written in the Log before the round starts, judged after |

Rule of the ladder, restated for this ticket: **verifier** closes nothing by itself — green
tsc/eslint/suites is rung V1; the critic's refutation is V2; the founder's on-device pass is
the rung the cloud can never do (haptics, sound, feel, App Store panels). A box in this
ticket closes only when the highest rung that can observe it has passed.

## Done when

- [ ] Every Section A box closed, with the App Privacy truth table (A2) written into the Log
- [ ] Crash reporting live in a TestFlight build and a crash-free number recorded (B1, E1)
- [ ] The accessibility sweep (C1) done screen by screen, with the known violations fixed
- [ ] `TERMINAL_TICKET_BUILD34_LIST_SYNC.md` closed (C8)
- [ ] iPad decision made and executed (A5); Otto Club decision made and executed (A6)
- [ ] Phased release configured, rollback plan written, day-1 dashboard open (E2, E4)
- [ ] A dated "ship / don't ship" call written at the bottom of the Log, with the open risks
      listed honestly — a launch with known, named gaps is a decision; a launch with unknown
      gaps is an accident

## Log

<!-- append dated findings here; this is the shared thread between terminal and cloud -->

**2026-07-25 — terminal. D1 (Supabase advisors) — audited, triaged, partly fixed.**

Security advisors: **0 ERROR, 6 WARN.** Triage:

| Finding | Verdict |
|---|---|
| `get_list_share` / `get_recipe_share` executable by **anon** (SECURITY DEFINER) | **BY DESIGN — accepted.** A share link must resolve for someone who is not signed in; that is the whole feature. Both take an unguessable token/slug and are the intended public door. Not a leak: they return one row keyed by the secret, and revocation is checked inside the function. |
| Same two + `join_household` executable by **authenticated** | **BY DESIGN — accepted.** `join_household` is SECURITY DEFINER precisely so a joiner cannot read the household row until they are a member; it was already hardened (`revoke execute … from public`, `grant … to authenticated`) in `20260723120000_harden_security_definer_functions.sql`. |
| **Leaked password protection DISABLED** | **REAL FINDING — founder action, see below.** Supabase can check new passwords against HaveIBeenPwned. It is off. This is a dashboard setting; the MCP cannot flip it. |

Performance advisors: **0 ERROR.** Triage:

| Finding | Verdict |
|---|---|
| 3× unindexed FK (`household_list_state.updated_by`, `household_members.user_id`, `households.created_by`) | **FIXED** — migration `20260725140000_household_fk_covering_indexes.sql`, applied to prod. Matters most on ACCOUNT DELETION, which is shipped: an unindexed FK makes each cascade a sequential scan. |
| 5× `auth_rls_initplan` (households / household_members policies re-evaluate `auth.uid()` per row) | **DEFERRED with reason.** The fix (wrapping in `(select auth.uid())`) is well-known and safe in principle, but it is a rewrite of live RLS policies, and per this ticket's own crew law an RLS change needs security-builder + a re-run and extension of the attack suite — not a drive-by. At current row counts the cost is unmeasurable. Revisit when a household has real volume, or bundle it with the next RLS packet. |
| 2× multiple permissive policies (`plan_entries`, `recipes` — `*_select_own` + `*_household_read`) | **BY DESIGN — accepted.** Two readers, two reasons: your own rows, and a co-member's rows in a shared kitchen. Merging them into one policy would save a policy evaluation and cost clarity in the exact place clarity protects people. |
| Unused index `favorites_user_id_idx` | **Accepted, leave.** "Never used" reflects a two-tester dataset, not a useless index. |

**2026-07-25 — terminal. C1 (accessibility) — first batch + its refutation. NOT closed.**

Landed: chat bubbles announce their speaker; `OttoArt` is decorative by default
(it used to read the developer string "Otto illustration: happy" as the first
thing on a screen — that was also an F2 copy violation); clarify chips and the
chat header doors reach a real 44pt; the streaming bubble names Otto too (its
attribution used to flicker on when the turn settled); a failed send now
announces on iOS.

**The finding worth carrying forward — `hitSlop` is often decoration.** The
critic pass proved it from the RN source: slop only reaches a child when an
ANCESTOR's bounds already contain the touch. Where a parent hugs its children,
Fabric computes `overflowInset {0,0,0,0}`, treats the parent as clipping, and
returns nil before the child's `hitTestEdgeInsets` are consulted. Three targets
"fixed" earlier the same day were unchanged in reality — including PlanScreen's
**destructive remove at ~18pt**. Fixed by growing the box (or the parent's
padding), not the slop. **There are ~20 more `hitSlop` call sites in the repo
and each is suspect until its parent geometry is checked** — that is a packet,
not a box tick.

**Still open in C1, do not tick it:**
- **Contrast, and it is bigger than one chip.** `Text role="computed"` is
  terracotta `#C4562E`; on cream `#FAF4EA` that measures **4.07:1**, under the
  4.5:1 floor, and at 15px/600 it does not qualify for the large-text relief.
  This is the semantic-ink rule itself failing AA wherever computed text sits on
  cream — a ui-systems decision (darker terracotta for text? filled chip? bolder
  and larger?), not a per-screen patch. **Founder + ui-systems call.**
- Bubble boundaries are invisible: white on cream is 1.09:1, creamDeep on cream
  1.10:1, the hairline 1.22:1 against a 3:1 floor. Alignment is doing all the
  work for sighted low-vision users.
- Dynamic Type at AX5 and reduced motion: not swept yet.
- Web: `accessible={false}` is a no-op in react-native-web, so the mascot now
  renders `<img>` with NO alt and screen readers read the filename. Decorative
  images need `alt=""`, which is a different value from absent. P3 (the release
  target is the App Store) but it is a regression on web.

**2026-07-25 — terminal. A3 (privacy manifest) — verified against the real prebuild output, one gap found.**

Verified rather than assumed, per the item. `expo prebuild` DOES emit an
app-level manifest: **`ios/Otto/PrivacyInfo.xcprivacy` exists** (ios/ is
gitignored — CNG, so this is generated, not committed). 28 manifests in the
tree; the third-party SDKs that matter ship their own (`RevenueCat`,
`SDWebImage`).

What the app manifest declares today:

| Key | Value | Verdict |
|---|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` | ✅ present — this is the AsyncStorage one the ticket named as always-applicable |
| `…FileTimestamp` | `C617.1, 0A2A.1, 3B52.1` | ✅ |
| `…DiskSpace` | `E174.1, 85F4.1` | ✅ |
| `…SystemBootTime` | `35F9.1` | ✅ |
| `NSPrivacyTracking` | `false` | ✅ matches reality — no ATT, no ad SDK |
| **`NSPrivacyCollectedDataTypes`** | **empty array** | ⚠️ **THE GAP** |

**The gap:** the required-reason API declarations are complete, but the
collected-data-types array is empty while Otto plainly collects email, user
content (recipes, photos, chat) and purchase data. Expo generates the array
empty by design — it cannot know what your app collects; the developer fills
it. So A3 is **blocked on A2**: the truth table is exactly the input needed,
and filling this from anything else would be guessing.

Close-out when A2 lands: declare `expo.ios.privacyManifests` in `app.json`
(so it survives every prebuild rather than being hand-edited into generated
output), with the collected types copied from the A2 table — same source of
truth as the App Store Connect label, which is the whole point of doing them
in that order.

> HANDOFF → founder (D1, 2 min): enable leaked-password protection.
> 1. Open https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/auth/providers
> 2. Under **Email** → find **Prevent use of leaked passwords** → turn it ON. Save.
> Nothing in the app changes; Supabase starts rejecting passwords that appear in
> known breach corpora at sign-up and password-change.

**2026-07-28 — cloud. Section A′ decisions executed in code; the console work that is left, in order.**

Landed in code today (all verified, none of it needs a decision from anyone):

| Change | Where | Verified by |
|---|---|---|
| `supportsTablet: false` (A5) | `app.json` | `expo config --type public` |
| Privacy manifest, 7 collected types (A3) | `app.json` → `ios.privacyManifests` | `expo config --type public`; key spellings checked against RevenueCat's own shipped `PrivacyInfo.xcprivacy`, not from memory |
| Support mailbox unified on `juandiego@ottosapp.com` | `ProfileScreen.tsx`, and 8 references + both legal docs in `Otto_Website` | grep, and `npm run build` on the site |
| Otto Club yearly price corrected to $34.99 site-wide | `Otto_Website` (10 places) | `npm run build`, `npm run seo:check` |

**Both changes to `app.json` are inert until the next prebuild + build.** Nothing in TestFlight
build 36 has them.

---

### What is actually left, in the order it has to happen

**The long pole is money, and it is not code.** Steps 1→3 are Apple's and RevenueCat's clocks, not
ours; everything else can happen in parallel with them.

**1. [You · blocks everything paid] Paid Applications Agreement + banking + tax.**
Only the Account Holder (jdmaxinius@gmail.com) can sign. Nothing charges, and no subscription
product can even be created, until it reads **Active**.
→ https://appstoreconnect.apple.com/business
Sign the agreement, then complete **Bank Account** and **Tax Forms** (US W-9 at minimum). Expect
Apple to take 24–48h to flip it to Active, longer if banking details need verifying.

**2. [You · after 1 is Active] Create the subscription products.**
→ https://appstoreconnect.apple.com/apps → Otto → **Monetization → Subscriptions**
Create one group (suggested reference name `Otto Club`), then two products **at exactly these
prices — the app and the website both now say them out loud**:

```
Otto Club Monthly   product id: otto.club.monthly   $4.99 / month
Otto Club Yearly    product id: otto.club.yearly    $34.99 / year
Introductory offer: Free trial, 5 days, on BOTH products, for new subscribers
Localization (both): display name "Otto Club", description of what it unlocks
Review screenshot: the paywall (OttoClubScreen) — Apple rejects products without one
```

**3. [You · after 2] Connect RevenueCat to App Store Connect.**
→ https://app.revenuecat.com/projects/proj68c735d9
Upload the In-App Purchase key `SubscriptionKey_HTA6549CWG.p8` (Key ID `HTA6549CWG`, in
`~/Downloads`), import both products, attach them to an entitlement whose identifier is **exactly**
`club` (the app checks that string), put both in an Offering marked **Current**, then copy the
**public Apple SDK key** — it starts `appl_`.

**4. [You · 2 min, unrelated to money, still open from 2026-07-25] Leaked-password protection.**
→ https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/auth/providers
**Email** → **Prevent use of leaked passwords** → ON → Save.

**5. [You · 2 min] Supabase function secrets for the RevenueCat webhook.**
→ https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/settings/functions
Add both, or the webhook rejects every event and memberships never sync:

```
RC_WEBHOOK_SECRET=6b7978fdb54ba6333bf32285c57612a1ac4068eb051dc47f
REVENUECAT_SECRET_KEY=<the sk_… key from RevenueCat → API keys>
```

**6. [You · 5 min] Vercel env for the website contact form.**
Today `lib/contact.ts` logs submissions and drops them — the sender still sees a thank-you. Resend's
free tier only has `juandlugo.com` verified, so the **From** must use that domain while the **To**
is the Otto mailbox. That combination is allowed.
→ https://vercel.com/dashboard → Otto_Website → **Settings → Environment Variables** → Production:

```
RESEND_API_KEY=<from https://resend.com/api-keys>
CONTACT_TO_EMAIL=juandiego@ottosapp.com
CONTACT_FROM_EMAIL=Otto Website <otto@juandlugo.com>
```
Then redeploy and send yourself one message through https://ottosapp.com/contact.

**7. [You · 10 min] App Privacy label (A2).** The truth table in
`docs/legal/APP_PRIVACY_TRUTH_TABLE.md` is the input; the manifest landed today declares the same
seven types. Answer the label to match it exactly — every mismatch is a rejection waiting.
→ App Store Connect → Otto → **App Privacy**. Data Used to Track You: **none**. Data Linked to You:
Email Address, Name, User ID, Device ID, Purchase History, Photos or Videos, Other User Content —
all **App Functionality** only. Do **not** tick Diagnostics until Sentry actually ships.

---

### Code packets still open (terminal/crew work, not console)

| # | Packet | Why it blocks |
|---|---|---|
| P1 | **Swap `RC_API_KEY` test_ → appl_** (`club.purchases.ts:16`, one line) plus flip the paywall's "you'd be charged" copy to "you'll" | Shipping the Test Store key in a release build is a paid tier that cannot take money |
| P2 | **Gate Club features on the entitlement.** `useClub()` is imported by one screen today. Unlimited imports, unlimited saves/collections, meal plan + smart list, unlimited Ask Otto, offline cookbook — none are gated | A subscription that unlocks nothing is 3.1.2 *and* a refund queue |
| P3 | **`resolved_ingredients` survives account deletion** (truth-table row 13) — a free-text ingredient name a user typed becomes a globally readable row that `delete-account` never touches | Not a hard blocker, but it contradicts "delete removes everything", which the Privacy Policy says out loud. Either scrub it on delete or stop storing the raw typed string |
| P4 | **Sentry** (config plugin, rebuild), then update the label + `privacyManifests` with Diagnostics | B1; gates the external beta |
| P5 | **EXIF test, then strip if it survives** (truth-table row 9) | A geotagged HEIC lands in a **public** bucket. Test first: upload a geotagged photo, `curl` the public URL, `exiftool` it. Only add a dependency if GPS actually survives |
| P6 | **Demo account for review (A4)** — stable, seeded with recipes + a week plan + a list, credentials in Review Notes, and a note on how to see the paid tier | A reviewer who cannot sign in files a 2.1 |
| P7 | **Screenshots (A9)** — 6.9" and 6.5" iPhone sets, cook flow + shopping list + import. Copy is drafted in `docs/release/STORE_METADATA.md`; the images are not shot | Cannot submit without them |
| P8 | **TheMealDB attribution (A7)** and **health/AI disclaimers (A8)** | Content rights and 1.4.1 |
