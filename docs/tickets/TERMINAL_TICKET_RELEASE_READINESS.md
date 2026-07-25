# TERMINAL TICKET — release readiness audit (ship-ready)

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

## Section A — submission blockers `[gates everything]`

- [ ] **A1. The policy URLs must actually resolve.** `ProfileScreen.tsx:37-38` and
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
- [ ] **A3. Privacy manifest.** There is no `PrivacyInfo.xcprivacy` in the repo and no
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
- [ ] **A5. iPad.** `app.json` sets `"supportsTablet": true`, which means **App Review will test on
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
- [ ] **A7. Content rights.** Recipe text, images and video links still come from TheMealDB.
      `docs/tickets/TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md` **Phase 0** (terms + attribution +
      image re-hosting answers) is a *launch* gate, not just a migration gate — an app store
      listing is a commercial distribution of that content. Also confirm the in-app attribution
      the terms require actually renders somewhere a user can find (today: nowhere — the only
      mention of TheMealDB in the UI layer is a code comment in `CookScreen.tsx:294`). USDA data
      is public domain but its **attribution and "not endorsed" wording** should still appear
      wherever nutrition is explained.
- [ ] **A8. Health and AI disclaimers.** Otto prints calorie and macro numbers and generates
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

- [ ] **D1.** `mcp__Supabase_Otto__get_advisors` (security + performance) clean, or every finding
      triaged in the Log with a reason.
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
