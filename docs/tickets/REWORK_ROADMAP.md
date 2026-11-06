# Otto rework roadmap — from today's app to the Apple-checked flow

Written 2026-11-04 · updated the same day against `main` at `ac8fd38a` (gold-standard gaps G1–G14 merged) · app at 1.0.23 (build 52).
Published page: https://claude.ai/artifact/YVGJMYoY6UFK19fKoSK2sa (regenerate with `python3 docs/tickets/build_rework_roadmap.py`).
Target: `docs/flow-maps/maps/otto-next.html` (current) and Figma "Otto — App Redesign" → page
"v3 · Flow screens" + "Flow map — Otto next (current)". Apple pass: `docs/flow-maps/research/05_APPLE_DESIGN_FILE_PASS.md`.

This file is the **ticket catalogue**. The **order of work** (releases 1.0.24 → 1.4, decision gates, critical path) now lives in `docs/tickets/PRODUCT_ROADMAP.md`. It is a plan, not shipped code: nothing below exists yet unless it says **exists**.

---

## 1. Where the code is today (read again after G1–G14, 2026-11-04)

| Area | What the code does now | File(s) |
|---|---|---|
| Launch decision | One pure function. Signed out → sign-up (new phone) or sign-in. Signed in, not onboarded → onboarding. Then member → tabs, else paywall. Unit tested. **Exists.** | `src/features/onboarding/gate.ts`, `gate.test.mjs`, `app/index.tsx` |
| Route guards | `Stack.Protected` in three groups: signed out → `(auth)`; signed in → `onboarding`, `otto-club`; member → everything else. **Exists, keep the pattern.** | `app/_layout.tsx` |
| Onboarding | 3 painted scenes, then hands off to sign-up / sign-in. No questions. "Onboarded" is stored per account (`user_metadata.onboarded_at`) plus a device list. | `OnboardingScreen.tsx`, `useOnboarded.ts` |
| Preferences | Diet + cuisines only, **on the phone only** (kv). Not per account, not synced. | `profile.prefs.ts`, `usePrefs.ts` |
| Recipes before sign-in | `otto_recipes` is readable by `anon` (policy `otto_recipes_read_all`). So a first week **can** be built before the account. | migration `…otto_recipes…` |
| Plan | `plan_entries` keyed by real dates (`YYYY-MM-DD`), RLS per user. Shopping list is its own route. **Dates already exist.** | `src/features/planner/*`, `app/shopping.tsx` |
| Purchases | RevenueCat hook with `buy()` → ok · unconfirmed · pending · cancelled · error, and `restore()` → ok · none · error. **Exists.** Paywall (G4, G6): billed line at title size, CTA “Start free trial” / “Subscribe”, Restore purchases · Terms · Privacy as 44 pt `TextLink`s, Sign out and Delete account on it. **Still missing:** the outcomes are toasts, not the screens the map draws; one-line benefit; no dated trial terms. | `club.purchases.ts`, `club.logic.ts`, `OttoClubScreen.tsx` |
| Tabs | 5 JS tabs: Discover · Cookbook · raised ＋ (Chat) · Plan · Account. Tab-press haptic removed (G15). Gaps decision G15: the ＋ stays until `NativeTabs` (motion M7) replaces the bar. `NativeTabs` is installed but unused. | `app/(tabs)/_layout.tsx` |
| AI consent | Per-provider stored answer naming OpenAI; one host sheet asks before the first AI call. **Exists.** | `src/shared/aiConsent.ts`, `AiConsentHost.tsx` |
| Permissions | Notifications asked from the Notifications screen. Photos (G9): no library permission, an explicit “Take photo / Choose from library” action sheet, denied camera → toast with Open Settings. **Still missing:** a primer before the first camera alert. | `notifications.queries.ts`, `src/shared/imagePicker.ts`, `src/shared/actionSheet.ts` |
| Delete account | One confirm, then the `delete-account` edge function (revokes Apple token). **Exists.** | `useDeleteAccount.ts`, `supabase/functions/delete-account` |
| Links | Scheme `otto://` and `auth/callback` only. No universal links, no route that opens a shared recipe in the app. Share cards are images/text. | `app.json`, `src/features/share/*` |
| Offline | **Exists in-app (G14):** NetInfo → TanStack `onlineManager`, one `OfflineBanner`, query cache persisted to AsyncStorage for a week (Cookbook, Plan, Shopping read offline), cleared on sign-out or account switch. **Still missing:** offline *launch*: the gate still fails closed to the paywall when RevenueCat can't answer. | `app/_layout.tsx`, `src/shared/online.ts`, `OfflineBanner.tsx` |
| Search | Inside Discover. Clear button, Cancel while focused, last 5 queries (G11). | `DiscoverScreen.tsx`, `src/shared/recentSearches.ts` |
| Sign-in forms | System “Continue with Apple” button on iOS (G13), autofill + return-key chain, minimum password 8 (G5). No `webcredentials:` domain yet. | `src/features/auth/*` |
| Shared UI | Contrast-checked tokens (terracotta `#AE4A26`, test in `tokens.contrast.test.mjs`), Dynamic Type `minHeight` layouts, header roles, toasts that wait for VoiceOver, `Sheet` with drag-to-dismiss, native destructive confirms, editor discard guard (G1–G3, G7, G8, G10, G12). One style only: light, no Dark Mode (D7). | `src/shared/ui/*`, `src/shared/theme/tokens.ts` |
| Tests | `node --test` over `*.test.mjs` (351 on main per the G1–G14 log), `tsc`, `eslint`. No device journey suite. | `package.json` |

Stack: Expo SDK 54, expo-router 6, RN 0.81 (new arch), Supabase, RevenueCat, OpenAI via edge functions.

---

## 2. The shape of the change

The new flow moves **value before the account**. That single change drives most of the code work:

```
today:   splash → sign up → 3 paintings → paywall → 5 tabs
next:    launch shell → Welcome → 3 questions → your first week → save your plan (account)
         → Otto Club (no X) → App Store sheet → you're all set → reminders → 4 tabs + Otto
```

What that means in code, in one breath:

1. **A draft lives on the phone before there is an account.** The answers and the generated week are
   held locally, then *claimed* into the account the moment sign-up finishes.
2. **The gate learns more states.** Welcome (not sign-up) is the signed-out door; "has a draft" sends
   a returning signed-out person back to Save your plan; lapsed and pending get their own screens.
3. **The paywall turns outcomes into screens**, and reminders move to after the purchase.
4. **The tab bar is rebuilt**: Home (Tonight + This week + Discover), Plan (with the list), Cookbook,
   Account, and **Otto, the AI, as the separate circle at the trailing end** (the spot iOS 26 gives Search; Juan,
   2026-11-04: talking with Otto is the app's big feature). The ＋ Create tab goes away. Search becomes a
   screen pushed from Discover's search field.
5. **Doors get wired**: universal links, notification taps, What's new, offline, not found — all
   through one "where was this person going" intent that survives sign-in and purchase.

---

## 3. Decisions for Juan before Phase 1

| # | Decision | Recommendation | Why it matters to code |
|---|---|---|---|
| D1 | Where preferences live | **On the account** (new `profiles` row, RLS own-row), kv as offline cache | Today they're phone-only; a new phone loses diet/allergies. The 3 answers need a home the draft can be claimed into |
| D2 | Allergies stored server-side? | Yes, as a plain list, labelled "Preferences" in the privacy answers | Changes the App Privacy answers (Other user content) — must be updated before release |
| D3 | Signed-out person with a draft who closes the app | Reopen on **Save your plan**, the week still there | Draft must persist in kv, not memory |
| D4 | Tab bar tech | **NativeTabs** (`expo-router/unstable-native-tabs`, already installed) for the iOS 26 floating bar; the Otto circle is the trailing slot iOS reserves for Search (`role="search"` without a search field), JS tabs as fallback. This answers gaps **G15** and is built as motion **M7** | The trailing circle is styled by the system for search. Spike: confirm it can host a chat screen with an otter icon and no search field; if not, a custom bar draws the same shape |
| D5 | Version | **1.1.0** for the new flow | A flow change this size deserves What's new and a clean review note |
| D6 | Lock-screen timer (Live Activity) | **Later (P2)** | Needs a native widget extension; not needed for the flow |
| D7 | Dark Mode (gaps G16) | **Decided (Juan, 2026-11-04): no Dark Mode.** Otto keeps one style, the original cream look. `userInterfaceStyle` stays `"light"` (already set in `app.json`) | No second palette, no `colors.white` split, no dark QA pass. Every new screen is designed and checked once |
| D8 | The magic moment *(superseded by ADR-0013, 2026-11-05: Snap any dish + Otto plans your week)* | **"Tonight is answered"**: the reveal opens on tonight's dinner before the account and paywall; Otto AI is how you change the plan, not the first impression | `docs/learning/reports/Otto magic moment research.md`; depends on ADR-0009 |

---

## 4. Phases

Each phase is a set of small PRs that keep `main` shippable. Phases 0–3 are the flow; 4–8 the tabs
and features; 9 is the Apple polish pass; 10 is release. Sizes are rough: S ≤ ½ day, M ≈ 1–2 days, L ≈ 3–5 days.

### Phase 0 — Foundations (no visible change)

| ID | Work | Size | Notes |
|---|---|---|---|
| R0.1 | **Launch state machine.** Replace `resolveRoute` with `resolveLaunch(input) → state` where state ∈ `loading · welcome · resumeDraft · signIn · needsPlan · paywall · pending · ended · app`. Keep it pure; `app/index.tsx` maps state → href. | M | Extend `gate.test.mjs` to every branch in the map's Entry column: first launch, returning member, returning ended, signed out with/without draft, offline (cached member answer), link entry |
| R0.2 | **Intent store.** `pendingHref` in kv: set when a door opens a guarded screen while signed out / not a member; consumed after sign-in or purchase. | S | One helper `withIntent(href)`; tests for expiry (24 h) and for ignoring auth routes |
| R0.3 | **Onboarding draft.** `draft = { answers, week[], createdAt }` in kv with zod schema; `claimDraft(userId)` writes prefs + `plan_entries` once, idempotent (upsert on `user_id, day`), then clears. | M | Claim runs in `AuthProvider` after the session lands; failure keeps the draft and retries next launch |
| R0.4 | **Preferences on the account** (D1). Migration: `profiles(user_id pk, household jsonb, diet text, allergies text[], skips text[], updated_at)` + RLS own row + `admin_delete_user_data` updated. `usePrefs` reads server, caches in kv. | M | Use the security-builder seat; add the RLS test in `supabase/migrations/tests` |
| R0.5 | **Prefs model** grows: `household {adults, kids}`, `diet`, `allergies[]`, `skips[]`. `normalizePrefs` handles old `{diet, cuisines}` rows. | S | Unit tests for normalisation and the migration of old kv values |
| R0.6 | **Week builder** without an account: `buildFirstWeek(prefs, catalogue) → 7 dinners` using `plan.pick`; respects allergies (hard filter) and skips; tonight first. | M | Pure + tested. Reads `otto_recipes` with the anon key (allowed today). Allergy filtering uses reviewed allergen tags on the ~970 ingredient keys; coverage checked in `docs/product/ALLERGEN_COVERAGE.md` (52+ dinners even for vegetarian + dairy- + gluten-free) |
| R0.7 | **Feature flag** `flow_v2` (EAS env, default off) so Phases 1–3 can merge before they ship. | S | Gate and tab layout read it once at launch |
| R0.8 | **Events table + tracking plan** (`docs/product/TRACKING_PLAN.md`): `app_events` table with RLS insert-own, onboarding events buffered on the phone until Save your plan, ~13 events. Privacy answers updated first. | S | Measures the magic moment, activation and the North Star without an SDK |
| R0.9 | **Action catalogue** `src/shared/actions`: every manual action defined once (zod schema, risk level, runs on server or client, `execute`, `inverse` for undo); generates the AI tools; a test fails when a UI mutation has no action. *(done 2026-11-06: 22 actions across plan, cookbook, shared kitchen and list, own recipes and the personal list; manifest + coverage test. Device check of the Shopping screen still to do.)* | L | Serves the dish sheet, notification buttons, widgets, Siri and the agent |
| R0.10 | **Atomic `put_in_plan`** replaces swap's delete + insert with one update; plan days become an **ordered free list** with an optional `label` (breakfast, lunch, dinner, snack or custom; null by default), per ADR-0013. *(planned, from the AI plan; not started)* | S | Today: `usePlan.ts` swap is two calls |
| R0.11 | **Shopping list as a hook + server state** for solo users (`useShoppingList`), lifted out of `ShoppingScreen.tsx`. *(planned, from the AI plan; not started)* | M | The agent and widgets need the list on the server |
| R0.12 | **Durable rate limiter** in Postgres and `requireClub` always on for AI functions. *(planned, from the AI plan; not started)* | S | Today's limiter is in memory and resets on cold start |
| R0.13 | **`agent_actions` table** (RLS own-row; drives Undo and the "Otto did" log) and **AI consent on the account** (covers Siri and widgets; scenario S11). *(planned, from the AI plan; not started)* | M | ADR-0006 amendment |
| R0.14 | **Cook times for the catalogue**: estimate total and active time once for the 795 recipes from their steps, store as `~` estimates with a reviewed sample; powers "30 minutes" requests and filters. *(planned, from magic moments v2; not started)* | M | The catalogue has no time field today |
| R0.15 | **Recipe image pipeline**: the user's photo first; else the closest catalogue image; else a **photorealistic generated food image**, tagged "AI image", with "Snap your plate" to replace it. Stored in Storage, generated once per recipe. *(planned, from magic moments v2; not started)* | M | Amends the 2026-07-21 image rule (ADR-0014, gate G-11) |
| R0.16 | **Device-scoped scan limit** (3 scans before an account) verified with DeviceCheck/App Attest in the scan endpoint; needed (gate G-10 decided A, 2026-11-05). *(planned, from magic moments v2; not started)* | M | Avoids an open AI endpoint like `canonicalize` |

### Phase 1 — Getting in (Entry → Welcome → About you → Your plan → Save your plan)

| ID | Work | Size | Notes |
|---|---|---|---|
| R1.1 | **Launch screen** = Welcome's empty cream shell: `expo-splash-screen` config, no logo, no text. Hide it when the gate resolves. Delete `Splash.tsx`'s otter. | S | Apple page 14. Same item as gaps **G18**. The otter + wordmark move onto Welcome |
| R1.2 | **Welcome** route `app/welcome.tsx`: one screen, painting hero, left-aligned title, Get started · I have an account. Replaces `onboarding.tsx` (3 paintings). | S | Keep the paintings as heroes elsewhere |
| R1.3 | **Three questions** `app/about/[step].tsx`: Who's eating · How do you eat (diet + allergies) · Anything to skip. "Question n of 3", Skip on each. Writes to the draft. | M | Allergy copy: "Otto will leave these out. Always check labels." |
| R1.4 | **Week preview** `app/first-week.tsx` (was the magic moment until ADR-0013; now the planning half of first run): opens on tonight's dinner (tomorrow's after ~8 pm) as a big card sized for the household with its source credited, the rest of the week below with a one-tap Swap per day, and a "Shopping list ready" row. Loads in place, no AI, no account. Save my week. Figma: page "v3 · Flow screens", row "v4 · Magic moment". | M | Target: median under 90 s from launch; `first_week_revealed` |
| R1.5 | **Save your plan** = today's sign-up, moved. The system “Continue with Apple” button already leads (G13); add Google / Facebook below at the same height and the email path. No Skip. After success → `claimDraft` → paywall. | S | `SignUpScreen.tsx` gets a `context="save-plan"` header; autofill already works (G5) |
| R1.6 | **Sign in** from Welcome: returning person who signs in skips questions (account already onboarded) → gate decides member / paywall. | S | `onboarded_at` stays the "skip questions" flag |
| R1.7 | Guards: new routes in a `!signedIn` group (welcome, about, first-week); `(auth)` stays signed-out only. | S | Every new route declared in `RootStack` — the existing rule |

### Phase 2 — Otto Club, no X, and every outcome

| ID | Work | Size | Notes |
|---|---|---|---|
| R2.1 | **Paywall content**: four benefit lines, yearly first, monthly second, dated trial terms (“Free until Nov 11, then $39.99/year…”). Already done by G4/G6: billed line at title size, Start free trial / Subscribe, Restore purchases · Terms · Privacy at 44 pt, Sign out. No close. | S | `trialEndDate(introTrialDays, now)` pure + tested; copy from `localizedPriceString` only. The gaps ticket said “change nothing else” for G4 only; this is the next step  Variant to test (R10 / tracking plan `paywall_viewed.variant`): **"Keep your week."** restating the person's own tonight + week instead of generic benefits; price line "$39.99 a year after your 7-day free trial" stays the most prominent. |
| R2.2 | **Outcomes as screens**: cancelled → stay, no message; error → native alert "nothing was charged"; pending → `app/club/pending.tsx` (listens for the entitlement, opens on its own); unconfirmed → keep today's honest copy + retry sync. | M | `BuyResult` already returns all of these — this is UI wiring |
| R2.3 | **Restore**: none → native alert, stay; ok → "Purchases restored" then Home. | S | `RestoreResult` exists |
| R2.4 | **You're all set** `app/club/welcome.tsx`: names tonight's dinner and the list. | S | |
| R2.5 | **Reminders primer** after "You're all set": Continue → system alert; Not now → skip. Remove the ask from anywhere earlier. | S | `ensurePermission` exists |
| R2.6 | **Club ended** `app/club/ended.tsx`: "Everything is still here", Resubscribe → paywall. Gate state `ended` = had the entitlement before (`allExpirationDates` / `latestExpirationDate`), not now. | M | Data is never deleted on lapse |
| R2.7 | **Grace period**: turn on Billing Grace Period in App Store Connect; in app, `entitlement.billingIssueDetectedAt` → quiet banner on Home "Update payment" → `openManageSubscriptions`. Access continues. | S | ASC setting is Juan's click |
| R2.8 | **Trial ending reminder**: local notification 2 days before `expirationDate` while `periodType === 'TRIAL'`, only if reminders are on. Tap → Membership. | S | Rescheduled by `NotifSync` |

### Phase 3 — Tab bar: Home · Plan · Cookbook · Account + Otto

| ID | Work | Size | Notes |
|---|---|---|---|
| R3.1 | **NativeTabs** layout (D4) = motion **M7**: SF Symbols for the four tabs, the Otto circle at the trailing end with the otter face (`otto-happy` art) and the label “Otto” for VoiceOver; JS fallback for web/Android with the same 5 entries. The `Sheet` → `formSheet` route move (G7's deferred part) rides with it. | M | Spike first: Expo SDK 54 native tabs on EAS with Xcode 26, and whether the trailing slot accepts a non-search screen |
| R3.2 | **Home** = Tonight (big card, Start cooking · Swap) + This week (date strip) + Discover (Otto's pick, categories, new). Merge `DiscoverScreen` sections; delete the Discover tab. | L | Tonight reads `plan_entries` for today; empty → "Pick tonight" |
| R3.3 | **Search** as a screen pushed from Discover's search field (`app/search.tsx`, back to Home): browse by kind + recent; results with filters; nothing found → Ask Otto with the query prefilled. | S | Move the G11 search (clear, Cancel, recent 5) out of `DiscoverScreen` as is |
| R3.4 | **Otto tab** replaces the ＋ Create tab: `app/(tabs)/otto.tsx` = `ChatScreen` as a tab root (no close button; history icon stays, new chat from the header). Home's Ask Otto card and Search's empty state switch to this tab with the prompt prefilled. `/chats` stays for history; `TabBarCreateButton` deleted. | M | Deep links to `/create` redirect to the Otto tab. AI consent still asks before the first message |
| R3.5 | **Restore last tab** on relaunch (kv), Home on first run. | S | Old ticket F4 |
| R3.6 | Fix from the old ticket: Cookbook empty-state "Explore" pushes the Home tab, not `/`. Delete unreachable signed-out branch in `ChatScreen`. | S | F6 |

### Phase 4 — Plan tab (week by dates + shopping)

| ID | Work | Size | Notes |
|---|---|---|---|
| R4.1 | Week view: date strip, tonight first, empty days read "Open. No plans, no guilt." | M | Dates exist (`weekDays`) |
| R4.2 | Dish actions sheet: cooked · swap · move to another day · leftovers tomorrow · remove. | M | `move` = update `day`; leftovers = copy entry with a note |
| R4.3 | Open day → Pick a meal (Saved · Discover · Ask Otto). | S | |
| R4.4 | Otto plans my week: fill only empty days with `buildFirstWeek` rules. | S | Reuses R0.6 |
| R4.5 | Shopping list as a Plan segment (by aisle, each item names its recipe); `/shopping` stays as a deep link target. | M | `shoppingList.ts` exists |
| R4.6 | Share with household from the list (invite · join · one live list). | S | Household exists; move the entry point |

### Phase 5 — Recipe and cook

| ID | Work | Size | Notes |
|---|---|---|---|
| R5.1 | Recipe: servings, nutrition "Estimate" label, paw save, add to plan (date picker). | S | Mostly exists |
| R5.2 | Mise en place step before step 1 (gather + check off). | M | |
| R5.3 | Cook mode timers; **Live Activity** lock-screen timer later (D6). | M / L | |
| R5.4 | Dinner, done: thumbs, snap the plate, into the journal, rating prompt once. | S | `reviewPrompt` exists |
| R5.6 | **"Cooked it" on the Tonight card** (Home): one tap marks tonight's planned dinner cooked without opening cook mode, so activation counts people who cook from memory; a quiet weekly count ("4 dinners this week") on Plan, no streak guilt. | S | Feeds `item_cooked`; Figma "v4 · Home · Tonight with Cooked it" |
| R5.5 | **Recipe not found** state for dead links / removed recipes, with similar dishes. | S | |

### Phase 6 — Cookbook and Add

| ID | Work | Size | Notes |
|---|---|---|---|
| R6.1 | Saved · Mine · Cooked segments; empty: "Tap the paw on any recipe". | S | |
| R6.2 | ＋ Add in the navigation bar (not a tab), four ways in (ADR-0015): **Snap a meal** (hero) · **Write or paste** (one free box) · **Say it** (voice fills the same box) · **Write it yourself** (the editor, made dynamic). Paste a link stays only if Juan keeps it. | S | `AddSheet` exists; all end in one review card |
| R6.3 | **Camera primer** before the first system alert, for scanning a meal ("Snap your meal and Otto writes the recipe"), Continue / Not now. Choice sheet and denied → Open Settings already exist (G9). | S | No cookbook-page copy (ADR-0015) |
| R6.4 | Import review (source credited) and editor unchanged in function. | — | |
| R6.5 | **Snap any dish** (moment 1 per ADR-0013, release 1.1): vision names the dish and its parts and reconstructs a recipe (amounts, steps); the on-device USDA engine counts; ≤2 questions (portion, oil or butter); `~` with a range; closest Otto recipe first; the user's photo is the recipe image; review before save; hide-numbers setting; weighed calibration set before launch. *(planned, from the AI plan; not started)* | L | `docs/learning/research_notes/Otto AI agent research/photo_nutrition.md` |
| R6.6 | **Remove recipe-page photo transcription** (ADR-0015): the "Snap a photo" page tile, the transcription prompt and decline rules in `generate-recipe/imageMode.ts`, the page-transcription use of `useImportFromPhoto`, and "Snap a cookbook page" copy; replaced by the meal-scan pipeline (R6.5). *(planned; not started)* | S | Ship together with R6.5 so the camera never disappears |
| R6.7 | **Write or paste + Say it**: one free text box (type or paste anything) with a mic that dictates into it on the device; Otto structures it into the review card; the editor gains inline add, drag to reorder and "Otto, fill the gaps". *(planned; not started)* | M | Reuses today's `{text}` mode and `useSpeechInput` |

### Phase 7 — Account and settings

| ID | Work | Size | Notes |
|---|---|---|---|
| R7.1 | Membership: plan, renewal date, Manage (`showManageSubscriptions`), Restore, **Request a refund** (`beginRefundRequestForActiveEntitlement`, iOS 15+). | S | |
| R7.2 | Preferences = the 3 questions, editable (R0.5 fields). | S | |
| R7.3 | Notifications: dinner + timer reminders; no marketing. | — | Exists |
| R7.4 | **Privacy & data** screen: AI toggle naming OpenAI (reads/writes `aiConsent`), Download my data, Privacy policy, Delete account. | M | Download = new edge function `export-data` returning JSON of the user's rows (security-builder) |
| R7.5 | **Delete flow**: explain screen (what goes, download first, billing note) → native destructive confirm → "Your account is deleted" → Welcome. | S | Function exists |
| R7.6 | Sign out: confirm → Welcome (not sign-in). | S | |
| R7.7 | **Calendar**: "Subscribe in Calendar" ICS feed of the plan from an Edge Function with a revocable per-user token, plus "Add tonight to Calendar" (`addEventWithForm`). *(planned, from the AI plan; not started)* | M | No Swift needed |

### Phase 8 — Doors and states

| ID | Work | Size | Notes |
|---|---|---|---|
| R8.1 | **Universal links**: `associatedDomains: applinks:ottosapp.com`, AASA file on the Vercel site, routes `app/r/[slug].tsx` (recipe share) and `app/l/[token].tsx` (list share) reading the existing DEFINER RPCs. Signed out → Welcome/Sign in with the intent kept (R0.2). | M | Share cards gain a URL. One AASA file on ottosapp.com serves both `applinks:` and the `webcredentials:` domain G5 left open |
| R8.2 | **Notification taps** → href through the intent store (dinner → tonight's recipe, trial → Membership). | S | `addNotificationResponseReceivedListener` in `NotifSync` |
| R8.3 | **Offline launch**: in-app offline is done (G14), and `useMembership` reads `Purchases.getCustomerInfo()`, which RevenueCat answers from its on-device cache, so a returning member should already open offline (commit `db084fcd`: “RevenueCat's offline cache keeps returning members in”). Remaining: **prove it on a device** in airplane mode (cold start, member and lapsed), make AI actions say they need a connection, keep fail-closed for a fresh install with no cache. | S | Mostly a device check, not new code. `src/features/profile/club.purchases.ts:65` |
| R8.4 | **What's new** sheet once per major version (kv `lastSeenVersion`). | S | |
| R8.5 | **Widget** (dinner tonight) — later, with Live Activity. | L | P2 |
| R8.6 | **Siri and Shortcuts** (App Intents: What's for dinner, Mark cooked, Add to list, Next step) after the SDK-upgrade spike. *(planned, from the AI plan; not started)* | M | Same actions as R0.9 |

### Phase 9 — Apple design pass (from `05_APPLE_DESIGN_FILE_PASS.md`)

| ID | Work | Notes |
|---|---|---|
| R9.1 | Build with **Xcode 26 / iOS 26 SDK** on EAS: native alerts, sheets, nav bars and the tab bar pick up Liquid Glass and the left-aligned alert style for free. | Check the EAS image; most of rows 14 and 17 come from this alone |
| R9.2 | Custom `Sheet` already upgraded (G7: drag to dismiss, grabber, Reduce Motion). Remaining: no fake glass, no centred alert clones in the new screens. | |
| R9.3 | Already done: contrast tokens, Dynamic Type layouts, header roles (G1, G2, G10). Remaining from the gaps ticket: layered app icon (G17), body 17 type scale (G19), native large titles (G20), list gestures and context menus (G21). | Track them there, not here. G16 Dark Mode is dropped (D7) |
| R9.4 | Remove: logo splash, painting carousel, 3 of 6 questions, taste swipe, building screen, ＋ tab. | Already out of the design |

### Phase 10 — Release 1.1.0

| ID | Work | Owner |
|---|---|---|
| R10.1 | Turn on `flow_v2`; bump to 1.1.0; TestFlight build | Claude |
| R10.2 | **Sandbox matrix** on device: new install → trial; cancel; fail; Ask to Buy; restore none; restore found; lapse (sandbox renews fast); grace (ASC test); reinstall as member; link while signed out | Juan (device) + Claude (checks rows in `memberships`) |
| R10.3 | App Privacy answers updated for server-side preferences (D2) | Juan |
| R10.4 | Review notes: demo account (already onboarded → lands in Home), where Restore / Terms / Privacy are, AI provider named, delete path | Claude drafts |
| R10.5 | Screenshots: Welcome, first week, Home, Plan, Cook, paywall | Claude |
| R10.6 | Regenerate `otto.html` from the shipped routes; it should match `otto-next.html` | Claude |

---

## 5. How this fits the other tickets

| Ticket | Relationship |
|---|---|
| `TERMINAL_TICKET_GOLD_STANDARD_GAPS.md` | G1–G14 done on main (2026-11-04) and reflected above. G15 is answered by D4 (Otto circle). G16 (Dark Mode) is dropped by D7. G17–G23 stay there; R9.3 points to them. |
| `TERMINAL_TICKET_MOTION.md` | M7 (NativeTabs) **is** R3.1. M9 (Live Activity, widget) is D6 / R5.3 / R8.5. |
| `TERMINAL_TICKET_FLOW_REDESIGN.md` | Superseded by this roadmap. |

## 6. Order and what can run in parallel

```
P0 foundations ──► P1 getting in ──► P2 paywall ──┐
        │                                         ├──► P10 release 1.1.0
        └──► P3 tab bar ──► P4 plan ─┐            │
                    ├──► P5 recipe   ├──► P8 doors ┘
                    ├──► P6 cookbook ┘
                    └──► P7 account
P9 Apple pass runs across P3–P8 (build image first, polish at the end).
```

- P1 and P3 touch different files and can be built side by side once P0 lands.
- P2 depends on P1 only for the "after sign-up" entry; the outcome screens can start on day one.
- Everything behind `flow_v2` until P10, so 1.0.x hotfixes keep shipping from `main`.

## 7. Tests

| Layer | What | Where |
|---|---|---|
| Pure logic | `resolveLaunch` (every Entry row), intent store, draft claim idempotency, `buildFirstWeek` (allergies never appear), `trialEndDate`, prefs normalisation, what's-new version compare, offline member fallback | `*.test.mjs`, `npm test` |
| Types / lint | `tsc --noEmit`, `eslint` on every PR | CI |
| Database | RLS for `profiles` (own row only; anon none), export function returns only the caller's rows, delete removes `profiles` | `supabase/migrations/tests` |
| Journeys | Web build + Playwright for the signed-out path (Welcome → questions → first week → Save your plan) and tab navigation; device sandbox matrix (R10.2) for purchases | new `test/journeys/` |

## 8. Risks

| Risk | Mitigation |
|---|---|
| Draft lost between the week and the account (app killed, sign-up fails) | Draft in kv from the first answer; resume state in the gate (D3); claim is idempotent and retried |
| Paying member sent to the paywall while RevenueCat is slow | Keep today's rule: unknown → splash, never the paywall; offline uses the last known answer |
| NativeTabs is "unstable" in SDK 54 | Spike first (R3.1); JS tabs fallback behind the same route names |
| Review: account before purchase | Today's shipped build already requires an account before the paywall; the plan now comes first, which only strengthens the case. Review note explains the account holds the plan and household list |
| Review: hard paywall | Value shown before it; Restore, Terms, Privacy, Sign out on it; billed amount most prominent; trial dated (3.1.2) |
| Allergy filter wrong → a dish with an allergen | Hard filter on canonical ingredients + label copy; unit tests per allergen |
| Universal links need the website | AASA + routes ship together; until then share stays image/text |

## 9. Done when

The shipped 1.1.0 app, regenerated into `otto.html`, matches `otto-next.html` card for card; the sandbox
matrix passes on a device; every new pure function has tests; `ROADMAP.md` and
`TERMINAL_TICKET_FLOW_REDESIGN.md` point here.

## Log
<!-- append: date, phase/ID, result, commit -->
- 2026-11-04 · roadmap · re-read against main `ac8fd38a` (G1–G14): offline in-app, photo choice, search, paywall hierarchy, Apple button and shared UI marked done; R2.1, R3.3, R6.3, R8.3 shrunk; D7 added; section 5 links the gaps and motion tickets.
- 2026-11-04 · D7 · Juan: one style only, the original look; no Dark Mode. G16 closed as won't do.
- 2026-11-04 · R8.3 · corrected: RevenueCat's cache already covers offline member launch (db084fcd); the ticket is now a device check. ADR log started in `docs/adr/` (ADR-0001…0011).
- 2026-11-04 · magic moment · D8 added; R1.4 reshaped to Tonight-first; R0.8 events + tracking plan; R2.1 paywall variant; R5.6 Cooked it; allergen coverage checked.
- 2026-11-05 · AI plan tickets added as *planned*: R0.9–R0.13, R6.5, R7.7, R8.6. Sequencing moved to PRODUCT_ROADMAP.md.
- 2026-11-05 · Magic moments v2: R0.10 free lists with labels; R0.14 cook times, R0.15 images, R0.16 scan limit added; R6.5 is moment 1; D8 superseded by ADR-0013.
- 2026-11-05 · ADR-0015: scan = meals only; R6.2/R6.3 rewritten; R6.6 remove recipe-page photo path; R6.7 write/paste/say it.
- 2026-11-06 · **Build started.** Slice 1 (Snap a meal): `src/shared/yield.ts` (+tests), `src/shared/flags.ts` (R0.7, `flowV2`), `scan-meal` edge function + `scan.ts` contract and checks + fixtures (R6.5 part), `_shared/image.ts`, `useScanMeal` and the "Snap a meal" tile replacing the recipe-page snap on the Add screen (R6.6 client side), editor `SnapSummary` + serving unit, migration `20261106120000_recipe_size` (not applied). Not deployed; flag off by default.
- 2026-11-06 · Slice 2 (free-list plan): `plan.list.ts` (fractional positions, rebalance, labels, leftovers; +7 tests), migration `20261106130000_plan_list` (not applied), swap is one `UPDATE` (R0.10 atomic part, live on today's schema), label via long-press and Tonight prefers the dinner label (flag on). 
- 2026-11-06 · Slice 1 review fixes: servings cap 200 everywhere (app, cook mode, scan, DB check) and never silent; units stored singular with proper plurals; a whole pie in the photo counts all its servings; the snapped photo is uploaded on save; editor gets Makes / Served as fields; flag-off build keeps its photo snap (legacy path); retry failure keeps the first answer; catalogue lookup uses the anon client.
- 2026-11-06 · R0.9 started: `src/shared/actions` (spec/runner split, `dispatch` validates untrusted calls, undo steps, tool manifest), `src/catalogue`, 8 actions (plan: put/remove/swap/mark cooked/label/move; cookbook: save/unsave) with `usePlan` and `useSaved` writing through them; `supabase/functions/_shared/actions.json` generated; a test fails on any new `mutationFn` that skips an action.
- 2026-11-06 · R0.9: household actions (shared list tick/add/delete/hide, create/join, leave = confirm), 15 actions in the manifest; shared-list writes that swallowed errors now throw, so the optimistic tick rolls back.
- 2026-11-06 · R0.9: own-recipe actions (`save_my_recipe`, `delete_my_recipe` = confirm); the coverage test now balances parens over every `useMutation` and accepts `// action-exempt: <reason>` for AI drafts, photo upload and share links. 17 actions.
- 2026-11-06 · R0.9 review fixes (independent refuter): a write that matches no row now throws (`shared/supabase/rows.ts` `changed`), so a partner's row or a stale id is never reported done; undos are null when nothing changed (re-save, re-tick, re-cook); undo reads only the caller's own row; swap undo restores kind and the cooked tick; a shared-list restore's undo re-hides with the original recipes, and a hide needs its recipes; `remove_own_list_item` deletes only custom items; `dispatch` refuses flagged actions unless the flag is on; image URLs are https only; labels can't be empty. Open: the agent (release 1.3) should have the server fill title and image from the recipe id instead of trusting the model.
- 2026-11-06 · R0.9 done: the personal shopping list moved out of ShoppingScreen state into `shopping.store.ts` (kv truth, query key `['shopping-local']`, queued reads/writes) with pure edits in `shopping.local.ts` (+5 tests); the screen's unmount write-through code is gone (the state is app-level now). 5 personal-list actions; 22 in the manifest. Not yet checked on a device.
- 2026-11-06 · R0.9 shopping review fixes (independent refuter): an extra's key was made inside the edit, which runs on two copies, so its tick and delete were lost on reload (fixed: keys, times and toggle targets are decided before the edit; the rule is written in the store). The store no longer cancels reads; the last write hands the cache kv's truth (Otto's changes included). Hydrated means read on this visit (no all-done chime for an old list). Personal-list actions check the live list, refuse no-op calls, and are blocked in a shared kitchen. The personal list is cleared on sign-out like the cache. Store mechanics are pure and tested (+3).
