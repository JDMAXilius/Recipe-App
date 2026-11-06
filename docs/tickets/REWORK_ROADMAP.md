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

**2026-11-06 — Juan: yes to every recommendation below** (D1–D6; D7 and D8 were already decided). ADR-0009 and ADR-0010 accepted.

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
| R0.1 | **Launch state machine.** *(done 2026-11-06: `onboarding/launch.ts` replaces `gate.ts`; draft and Ask to Buy inputs wired as false until R0.3 / R2.2)* Replace `resolveRoute` with `resolveLaunch(input) → state` where state ∈ `loading · welcome · resumeDraft · signIn · needsPlan · paywall · pending · ended · app`. Keep it pure; `app/index.tsx` maps state → href. | M | Extend `gate.test.mjs` to every branch in the map's Entry column: first launch, returning member, returning ended, signed out with/without draft, offline (cached member answer), link entry |
| R0.2 | *(done 2026-11-06)* **Intent store.** `pendingHref` in kv: set when a door opens a guarded screen while signed out / not a member; consumed after sign-in or purchase. | S | One helper `withIntent(href)`; tests for expiry (24 h) and for ignoring auth routes |
| R0.3 | *(done 2026-11-06; nothing creates a draft until the question and week screens land, R1.3/R1.4)* **Onboarding draft.** `draft = { answers, week[], createdAt }` in kv with zod schema; `claimDraft(userId)` writes prefs + `plan_entries` once, idempotent (upsert on `user_id, day`), then clears. | M | Claim runs in `AuthProvider` after the session lands; failure keeps the draft and retries next launch |
| R0.4 | *(done 2026-11-06: `profiles` applied; synced under flowV2 until the App Privacy answers cover allergies)* **Preferences on the account** (D1). Migration: `profiles(user_id pk, household jsonb, diet text, allergies text[], skips text[], updated_at)` + RLS own row + `admin_delete_user_data` updated. `usePrefs` reads server, caches in kv. | M | Use the security-builder seat; add the RLS test in `supabase/migrations/tests` |
| R0.5 | *(done 2026-11-06, on the phone; R0.4 moves it to the account)* **Prefs model** grows: `household {adults, kids}`, `diet`, `allergies[]`, `skips[]`. `normalizePrefs` handles old `{diet, cuisines}` rows. | S | Unit tests for normalisation and the migration of old kv values |
| R0.6 | *(logic done 2026-11-06: `onboarding/firstWeek.ts`; reading the catalogue lands with the first-week screen R1.4)* **Week builder** without an account: `buildFirstWeek(prefs, catalogue) → 7 dinners` using `plan.pick`; respects allergies (hard filter) and skips; tonight first. | M | Pure + tested. Reads `otto_recipes` with the anon key (allowed today). Allergy filtering uses reviewed allergen tags on the ~970 ingredient keys; coverage checked in `docs/product/ALLERGEN_COVERAGE.md` (52+ dinners even for vegetarian + dairy- + gluten-free) |
| R0.7 | **Feature flag** `flow_v2` (EAS env, default off) so Phases 1–3 can merge before they ship. | S | Gate and tab layout read it once at launch |
| R0.8 | *(done 2026-11-06: table live, 13 events wired; privacy answers must be declared before the build ships)* **Events table + tracking plan** (`docs/product/TRACKING_PLAN.md`): `app_events` table with RLS insert-own, onboarding events buffered on the phone until Save your plan, ~13 events. Privacy answers updated first. | S | Measures the magic moment, activation and the North Star without an SDK |
| R0.9 | **Action catalogue** `src/shared/actions`: every manual action defined once (zod schema, risk level, runs on server or client, `execute`, `inverse` for undo); generates the AI tools; a test fails when a UI mutation has no action. *(done 2026-11-06: 22 actions across plan, cookbook, shared kitchen and list, own recipes and the personal list; manifest + coverage test. Device check of the Shopping screen still to do.)* | L | Serves the dish sheet, notification buttons, widgets, Siri and the agent |
| R0.10 | **Atomic `put_in_plan`** replaces swap's delete + insert with one update; plan days become an **ordered free list** with an optional `label` (breakfast, lunch, dinner, snack or custom; null by default), per ADR-0013. *(planned, from the AI plan; not started)* | S | Today: `usePlan.ts` swap is two calls |
| R0.11 | *(done 2026-11-06: `shopping_lists` applied as `20261106213429`; mirrored under flowV2)* **Shopping list as a hook + server state** for solo users (`useShoppingList`), lifted out of `ShoppingScreen.tsx`. *(planned, from the AI plan; not started)* | M | The agent and widgets need the list on the server |
| R0.12 | *(limiter live 2026-11-06 in every AI and destructive function: scan-meal, export-data, generate-recipe, import-recipe, resolve-nutrition, delete-account; REQUIRE_CLUB=on is Juan's call)* **Durable rate limiter** in Postgres and `requireClub` always on for AI functions. *(planned, from the AI plan; not started)* | S | Today's limiter is in memory and resets on cold start |
| R0.13 | *(done 2026-11-06: applied as `20261106213056`; consent synced under flowV2)* **`agent_actions` table** (RLS own-row; drives Undo and the "Otto did" log) and **AI consent on the account** (covers Siri and widgets; scenario S11). *(planned, from the AI plan; not started)* | M | ADR-0006 amendment |
| R0.14 | **Cook times for the catalogue**: estimate total and active time once for the 795 recipes from their steps, store as `~` estimates with a reviewed sample; powers "30 minutes" requests and filters. *(planned, from magic moments v2; not started)* | M | The catalogue has no time field today |
| R0.15 | **Recipe image pipeline**: the user's photo first; else the closest catalogue image; else a **photorealistic generated food image**, tagged "AI image", with "Snap your plate" to replace it. Stored in Storage, generated once per recipe. *(planned, from magic moments v2; not started)* | M | Amends the 2026-07-21 image rule (ADR-0014, gate G-11) |
| R0.16 | **Device-scoped scan limit** (3 scans before an account) verified with DeviceCheck/App Attest in the scan endpoint; needed (gate G-10 decided A, 2026-11-05). *(planned, from magic moments v2; not started)* | M | Avoids an open AI endpoint like `canonicalize` |

### Phase 1 — Getting in (Entry → Welcome → About you → Your plan → Save your plan)

| ID | Work | Size | Notes |
|---|---|---|---|
| R1.1 | *(in-app splash built 2026-11-06 behind flowV2; native config is Terminal T15 at the flip)* **Launch screen** = Welcome's empty cream shell: `expo-splash-screen` config, no logo, no text. Hide it when the gate resolves. Delete `Splash.tsx`'s otter. | S | Apple page 14. Same item as gaps **G18**. The otter + wordmark move onto Welcome |
| R1.2 | *(built 2026-11-06 behind flowV2; seen on the web build)* **Welcome** route `app/welcome.tsx`: one screen, painting hero, left-aligned title, Get started · I have an account. Replaces `onboarding.tsx` (3 paintings). | S | Keep the paintings as heroes elsewhere |
| R1.3 | *(built 2026-11-06 behind flowV2; seen on the web build)* **Three questions** `app/about/[step].tsx`: Who's eating · How do you eat (diet + allergies) · Anything to skip. "Question n of 3", Skip on each. Writes to the draft. | M | Allergy copy: "Otto will leave these out. Always check labels." |
| R1.4 | *(built 2026-11-06 behind flowV2; seen on the web build)* **Week preview** `app/first-week.tsx` (was the magic moment until ADR-0013; now the planning half of first run): opens on tonight's dinner (tomorrow's after ~8 pm) as a big card sized for the household with its source credited, the rest of the week below with a one-tap Swap per day, and a "Shopping list ready" row. Loads in place, no AI, no account. Save my week. Figma: page "v3 · Flow screens", row "v4 · Magic moment". | M | Target: median under 90 s from launch; `first_week_revealed` |
| R1.5 | *(built 2026-11-06 behind flowV2; seen on the web build)* **Save your plan** = today's sign-up, moved. The system “Continue with Apple” button already leads (G13); add Google / Facebook below at the same height and the email path. No Skip. After success → `claimDraft` → paywall. | S | `SignUpScreen.tsx` gets a `context="save-plan"` header; autofill already works (G5) |
| R1.6 | *(done 2026-11-06: the launch already routes a returning account; sign-in's "New to Otto?" opens Welcome under flowV2)* **Sign in** from Welcome: returning person who signs in skips questions (account already onboarded) → gate decides member / paywall. | S | `onboarded_at` stays the "skip questions" flag |
| R1.7 | *(done: `RootStack` has the signed-out and not-in-the-app groups)* Guards: new routes in a `!signedIn` group (welcome, about, first-week); `(auth)` stays signed-out only. | S | Every new route declared in `RootStack` — the existing rule |

### Phase 2 — Otto Club, no X, and every outcome

| ID | Work | Size | Notes |
|---|---|---|---|
| R2.1 | *(built 2026-11-06 behind flowV2, with the "Keep your week" A/B)* **Paywall content**: four benefit lines, yearly first, monthly second, dated trial terms (“Free until Nov 11, then $39.99/year…”). Already done by G4/G6: billed line at title size, Start free trial / Subscribe, Restore purchases · Terms · Privacy at 44 pt, Sign out. No close. | S | `trialEndDate(introTrialDays, now)` pure + tested; copy from `localizedPriceString` only. The gaps ticket said “change nothing else” for G4 only; this is the next step  Variant to test (R10 / tracking plan `paywall_viewed.variant`): **"Keep your week."** restating the person's own tonight + week instead of generic benefits; price line "$39.99 a year after your 7-day free trial" stays the most prominent. |
| R2.2 | *(built 2026-11-06 behind flowV2)* **Outcomes as screens**: cancelled → stay, no message; error → native alert "nothing was charged"; pending → `app/club/pending.tsx` (listens for the entitlement, opens on its own); unconfirmed → keep today's honest copy + retry sync. | M | `BuyResult` already returns all of these — this is UI wiring |
| R2.3 | *(built 2026-11-06 behind flowV2)* **Restore**: none → native alert, stay; ok → "Purchases restored" then Home. | S | `RestoreResult` exists |
| R2.4 | *(built 2026-11-06 behind flowV2)* **You're all set** `app/club/welcome.tsx`: names tonight's dinner and the list. | S | |
| R2.5 | *(built 2026-11-06 behind flowV2)* **Reminders primer** after "You're all set": Continue → system alert; Not now → skip. Remove the ask from anywhere earlier. | S | `ensurePermission` exists |
| R2.6 | *(built 2026-11-06 behind flowV2)* **Club ended** `app/club/ended.tsx`: "Everything is still here", Resubscribe → paywall. Gate state `ended` = had the entitlement before (`allExpirationDates` / `latestExpirationDate`), not now. | M | Data is never deleted on lapse |
| R2.7 | *(app side built 2026-11-06 behind flowV2; the ASC switch is T6)* **Grace period**: turn on Billing Grace Period in App Store Connect; in app, `entitlement.billingIssueDetectedAt` → quiet banner on Home "Update payment" → `openManageSubscriptions`. Access continues. | S | ASC setting is Juan's click |
| R2.8 | *(built 2026-11-06 behind flowV2)* **Trial ending reminder**: local notification 2 days before `expirationDate` while `periodType === 'TRIAL'`, only if reminders are on. Tap → Membership. | S | Rescheduled by `NotifSync` |

### Phase 3 — Tab bar: Home · Plan · Cookbook · Account + Otto

| ID | Work | Size | Notes |
|---|---|---|---|
| R3.1 | *(settled 2026-11-06 by T8: keep the custom bar with `TabBarOttoButton`; NativeTabs' search slot can't host the otter circle)* **NativeTabs** layout (D4) = motion **M7**: SF Symbols for the four tabs, the Otto circle at the trailing end with the otter face (`otto-happy` art) and the label “Otto” for VoiceOver; JS fallback for web/Android with the same 5 entries. The `Sheet` → `formSheet` route move (G7's deferred part) rides with it. | M | Spike first: Expo SDK 54 native tabs on EAS with Xcode 26, and whether the trailing slot accepts a non-search screen |
| R3.2 | *(built 2026-11-06 behind flowV2; not seen on a device: needs a signed-in member)* **Home** = Tonight (big card, Start cooking · Swap) + This week (date strip) + Discover (Otto's pick, categories, new). Merge `DiscoverScreen` sections; delete the Discover tab. | L | Tonight reads `plan_entries` for today; empty → "Pick tonight" |
| R3.3 | *(built 2026-11-06 behind flowV2)* **Search** as a screen pushed from Discover's search field (`app/search.tsx`, back to Home): browse by kind + recent; results with filters; nothing found → Ask Otto with the query prefilled. | S | Move the G11 search (clear, Cancel, recent 5) out of `DiscoverScreen` as is |
| R3.4 | *(built 2026-11-06 behind flowV2; not seen on a device: needs a signed-in member)* **Otto tab** replaces the ＋ Create tab: `app/(tabs)/otto.tsx` = `ChatScreen` as a tab root (no close button; history icon stays, new chat from the header). Home's Ask Otto card and Search's empty state switch to this tab with the prompt prefilled. `/chats` stays for history; `TabBarCreateButton` deleted. | M | Deep links to `/create` redirect to the Otto tab. AI consent still asks before the first message |
| R3.5 | *(built 2026-11-06 behind flowV2)* **Restore last tab** on relaunch (kv), Home on first run. | S | Old ticket F4 |
| R3.6 | *(done 2026-11-06)* Fix from the old ticket: Cookbook empty-state "Explore" pushes the Home tab, not `/`. Delete unreachable signed-out branch in `ChatScreen`. | S | F6 |

### Phase 4 — Plan tab (week by dates + shopping)

| ID | Work | Size | Notes |
|---|---|---|---|
| R4.1 | Week view *(built 2026-11-06 behind flowV2)*: date strip, tonight first, empty days read "Open. No plans, no guilt." | M | Dates exist (`weekDays`) |
| R4.2 | Dish actions sheet *(built 2026-11-06 behind flowV2)*: cooked · swap · move to another day · leftovers tomorrow · remove. | M | `move` = update `day`; leftovers = copy entry with a note |
| R4.3 | Open day → Pick a meal *(built 2026-11-06 behind flowV2)* (Saved · Discover · Ask Otto). | S | |
| R4.4 | Otto plans my week *(built 2026-11-06 behind flowV2)*: fill only empty days with `buildFirstWeek` rules. | S | Reuses R0.6 |
| R4.5 | Shopping list as a Plan segment *(built 2026-11-06 behind flowV2)* (by aisle, each item names its recipe); `/shopping` stays as a deep link target. | M | `shoppingList.ts` exists |
| R4.6 | *(built 2026-11-06 behind flowV2)* Share with household from the list (invite · join · one live list). | S | Household exists; move the entry point |

### Phase 5 — Recipe and cook

| ID | Work | Size | Notes |
|---|---|---|---|
| R5.1 | *(done 2026-11-06; flowV2 opens it sized for the household)* Recipe: servings, nutrition "Estimate" label, paw save, add to plan (date picker). | S | Mostly exists |
| R5.2 | *(already met: cook mode opens on Mise en place)* Mise en place step before step 1 (gather + check off). | M | |
| R5.3 | *(timers already met; Live Activity is Terminal T11)* Cook mode timers; **Live Activity** lock-screen timer later (D6). | M / L | |
| R5.4 | *(already met: thumbs, snap the plate → journal, review prompt once)* Dinner, done: thumbs, snap the plate, into the journal, rating prompt once. | S | `reviewPrompt` exists |
| R5.6 | *(built 2026-11-06 behind flowV2; not seen on a device: needs a signed-in member)* **"Cooked it" on the Tonight card** (Home): one tap marks tonight's planned dinner cooked without opening cook mode, so activation counts people who cook from memory; a quiet weekly count ("4 dinners this week") on Plan, no streak guilt. | S | Feeds `item_cooked`; Figma "v4 · Home · Tonight with Cooked it" |
| R5.5 | *(built 2026-11-06 behind flowV2)* **Recipe not found** state for dead links / removed recipes, with similar dishes. | S | |

### Phase 6 — Cookbook and Add

| ID | Work | Size | Notes |
|---|---|---|---|
| R6.1 | *(already met: All · Saved · My recipes + a Cooked filter and the paw empty state)* Saved · Mine · Cooked segments; empty: "Tap the paw on any recipe". | S | |
| R6.2 | *(built 2026-11-06 behind flowV2)* ＋ Add in the navigation bar (not a tab), four ways in (ADR-0015): **Snap a meal** (hero) · **Write or paste** (one free box) · **Say it** (voice fills the same box) · **Write it yourself** (the editor, made dynamic). Paste a link stays only if Juan keeps it. | S | `AddSheet` exists; all end in one review card |
| R6.3 | *(built 2026-11-06 behind flowV2)* **Camera primer** before the first system alert, for scanning a meal ("Snap your meal and Otto writes the recipe"), Continue / Not now. Choice sheet and denied → Open Settings already exist (G9). | S | No cookbook-page copy (ADR-0015) |
| R6.4 | Import review (source credited) and editor unchanged in function. | — | |
| R6.5 | **Snap any dish** (moment 1 per ADR-0013, release 1.1): vision names the dish and its parts and reconstructs a recipe (amounts, steps); the on-device USDA engine counts; ≤2 questions (portion, oil or butter); `~` with a range; closest Otto recipe first; the user's photo is the recipe image; review before save; hide-numbers setting; weighed calibration set before launch. *(planned, from the AI plan; not started)* | L | `docs/learning/research_notes/Otto AI agent research/photo_nutrition.md` |
| R6.6 | **Remove recipe-page photo transcription** (ADR-0015): the "Snap a photo" page tile, the transcription prompt and decline rules in `generate-recipe/imageMode.ts`, the page-transcription use of `useImportFromPhoto`, and "Snap a cookbook page" copy; replaced by the meal-scan pipeline (R6.5). *(planned; not started)* | S | Ship together with R6.5 so the camera never disappears |
| R6.7 | **Write or paste + Say it**: one free text box (type or paste anything) with a mic that dictates into it on the device; Otto structures it into the review card; the editor gains inline add, drag to reorder and "Otto, fill the gaps". *(built 2026-11-06 behind flowV2: box + Say it; editor inline add, move up/down, "Otto, fill the gaps")* | M | Reuses today's `{text}` mode and `useSpeechInput` |

### Phase 7 — Account and settings

| ID | Work | Size | Notes |
|---|---|---|---|
| R7.1 | *(built 2026-11-06 behind flowV2)* Membership: plan, renewal date, Manage (`showManageSubscriptions`), Restore, **Request a refund** (`beginRefundRequestForActiveEntitlement`, iOS 15+). | S | |
| R7.2 | *(built 2026-11-06 behind flowV2)* Preferences = the 3 questions, editable (R0.5 fields). | S | |
| R7.3 | Notifications: dinner + timer reminders; no marketing. | — | Exists |
| R7.4 | **Privacy & data** *(built 2026-11-06 behind flowV2: Download my data via `export-data` v1; AI switch, policy and delete were already on Account)* screen: AI toggle naming OpenAI (reads/writes `aiConsent`), Download my data, Privacy policy, Delete account. | M | Download = new edge function `export-data` returning JSON of the user's rows (security-builder) |
| R7.5 | **Delete flow** *(already met: Account → Delete with Apple's billing note and a destructive confirm; after it the launch opens Welcome)*: explain screen (what goes, download first, billing note) → native destructive confirm → "Your account is deleted" → Welcome. | S | Function exists |
| R7.6 | Sign out *(built 2026-11-06 behind flowV2)*: confirm → Welcome (not sign-in). | S | |
| R7.7 | **Calendar**: "Subscribe in Calendar" ICS feed of the plan from an Edge Function with a revocable per-user token, plus "Add tonight to Calendar" (`addEventWithForm`). *(planned, from the AI plan; not started)* | M | No Swift needed |

### Phase 8 — Doors and states

| ID | Work | Size | Notes |
|---|---|---|---|
| R8.1 | **Universal links**: `associatedDomains: applinks:ottosapp.com`, AASA file on the Vercel site, routes `app/r/[slug].tsx` (recipe share) and `app/l/[token].tsx` (list share) reading the existing DEFINER RPCs. Signed out → Welcome/Sign in with the intent kept (R0.2). | M | Share cards gain a URL. One AASA file on ottosapp.com serves both `applinks:` and the `webcredentials:` domain G5 left open |
| R8.2 | *(built 2026-11-06 behind flowV2)* **Notification taps** → href through the intent store (dinner → tonight's recipe, trial → Membership). | S | `addNotificationResponseReceivedListener` in `NotifSync` |
| R8.3 | *(code part done 2026-11-06 behind flowV2; the airplane-mode proof is Terminal T3)* **Offline launch**: in-app offline is done (G14), and `useMembership` reads `Purchases.getCustomerInfo()`, which RevenueCat answers from its on-device cache, so a returning member should already open offline (commit `db084fcd`: “RevenueCat's offline cache keeps returning members in”). Remaining: **prove it on a device** in airplane mode (cold start, member and lapsed), make AI actions say they need a connection, keep fail-closed for a fresh install with no cache. | S | Mostly a device check, not new code. `src/features/profile/club.purchases.ts:65` |
| R8.4 | *(built 2026-11-06 behind flowV2)* **What's new** sheet once per major version (kv `lastSeenVersion`). | S | |
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
| R10.1 | Turn on `flow_v2`; bump to 1.1.0; TestFlight build. Same commit: R6.6 (delete the page-scan path — `useImportRecipePage`, the "Snap a photo" tile, `generate-recipe/imageMode.ts` transcription), and every `flags.flowV2 ?` branch's old side | Claude |
| R10.2 | **Sandbox matrix** on device: new install → trial; cancel; fail; Ask to Buy; restore none; restore found; lapse (sandbox renews fast); grace (ASC test); reinstall as member; link while signed out | Juan (device) + Claude (checks rows in `memberships`) |
| R10.3 | App Privacy answers updated for server-side preferences (D2) | Juan |
| R10.4 | *(drafted 2026-11-06: `docs/release/STORE_METADATA.md` §7b)* Review notes: demo account (already onboarded → lands in Home), where Restore / Terms / Privacy are, AI provider named, delete path | Claude drafts |
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
- 2026-11-06 · R0.1 done: `resolveLaunch` (9 states) + `LAUNCH_HREF` (one table; a row changes when its screen lands) in `onboarding/launch.ts`; `gate.ts` and its test deleted; `membershipState` (unknown · member · ended · none, ended from RevenueCat `entitlements.all`) replaces `membershipAnswer`; index and the route guards read it. Docs that named `gate.ts` updated.
- 2026-11-06 · R0.5 + R0.6: prefs gain household {adults, kids}, allergies (big 9) and skips, old rows normalised; `servingsFor` (a kid = half). `shared/allergens.ts`: keyword allergens and diet fit from ingredients (a heuristic, shown with "Otto will leave these out. Always check labels."; the reviewed per-key tags stay the production path). `buildFirstWeek`: dinners only, hard allergy filter, diet, skips, no repeats, no two days running from one category, cuisines first, seeded; late evening opens on tomorrow. +9 tests.
- 2026-11-06 · R0.3 done: `onboarding.draft.ts` (versioned zod schema, 30-day expiry, `claimSteps`: today on, labelled dinner, skips what the plan already has, so a cut-off claim can run again), `useDraft` (kv through TanStack Query), `src/catalogue/claimDraft.ts` + `<DraftClaim/>` in the root layout: writes the week through `put_in_plan` and the answers through `savePrefs`, then clears; a failure keeps the draft for the next launch. The launch reads `hasDraft` (signed out → back to Save your plan; signed in → straight on while it's claimed). The claim runs in the catalogue, not AuthProvider: it spans onboarding, planner and profile.
- 2026-11-06 · R0.2 done: `shared/intent.ts` (link → in-app path, doors never remembered, 24 h life; +2 tests) and `useIntent` (kv 'intent'; remembers the link while the launch isn't `app`, hands it back once, then the launch opens it instead of Home).
- 2026-11-06 · Review fixes for R0.1/R0.3/R0.5/R0.6 (independent refuter): the draft and personal-list reads run offline (`networkMode: 'always'`; offline the launch hung on the splash) and the launch trusts only a read made on this visit; allergen lists widened from a scan of all 1,146 catalogue ingredient names (rigatoni, pecorino, hummus, pilchards, hake, ground nut oil, Thai curry pastes, hoisin… ) with a regression test on the raw catalogue; meat categories and more meat words rule out vegetarian, look-alikes (minced garlic, kidney beans) don't; skips match whole words with proper plurals and keep the cooking oil; a claimed draft marks the account onboarded; only a NEW account claims a draft (an existing one keeps its plan and prefs); one claim at a time; draft dishes use put_in_plan's limits; `ended` excludes a trial cancelled before it charged.
- 2026-11-06 · R1.2–R1.4 built behind flowV2: `WelcomeScreen`, `QuestionScreen` (steppers, diet + allergy chips with the labels note, skips with common ones), `FirstWeekScreen` (catalogue read without an account, tonight card sized for the household, Swap per day, shopping count, Save my week → draft → Save your plan). Routes `/welcome`, `/about/[step]`, `/first-week`, guarded; `launchHref` opens them when the flag is on. A dinner check (`looksLikeDinner`) keeps jams, dips and side dishes out (the catalogue's categories don't). New shared `Chip`; `week.ts` moved to `shared/`. Web build: RevenueCat setup no longer blanks the page. Not on a device yet; `first_week_revealed` waits for the events table (R0.8).
- 2026-11-06 · R1.5/R1.6: sign-up becomes "Save your plan" when a first week is saved (the route composes auth + onboarding: `SavePlanContext`), names the week, keeps Apple first, no Skip; after the account the launch claims the week and opens Otto Club. Sign-in's new-person link starts the questions under flowV2. Seen on the web build.
- 2026-11-06 · Juan: yes to all recommended answers. Applied to production: `20261106042712_recipe_size`, `20261106042714_plan_list` (files renamed to the applied versions); `scan-meal` deployed (v1, verify_jwt, smoke-tested: 401 without a user). G-3 on-device dictation where supported. ADR-0009/0010 accepted; Paste a link stays (ADR-0015).
- 2026-11-06 · Juan: removed "Change my answers" from Save your plan.
- 2026-11-06 · A2 applied in two parts (`household_join_attempts`, `household_join_limit`): 10 join tries per 15 min, a wrong code returns null so guesses are counted; app treats null as "No kitchen with that code". A3 (`household_owner_handover`) waits: the apply asks a confirmation that never reaches Juan (the function deletes rows); run it from the SQL editor.
- 2026-11-06 · R0.8 done: `app_events` applied (insert-own RLS, nothing readable by clients, cascades with the account); `shared/events.ts` (typed names/props, queue rules, +3 tests) and `shared/track.ts` (kv queue, batch insert once signed in, pre-account events written after sign-up, dropped on sign-out or after 30 days). Wired: paywall_viewed, purchase_result, plan_saved, tonight_card_viewed, shopping_list_opened, cooking_started, item_cooked (plan button + cook mode), dish_snapped, recipe_from_photo_saved, onboarding_started, question_answered, first_week_revealed, day_swapped. Truth table row 20 added (Product Interaction). The 14-day baseline starts with the first build that ships this.
- 2026-11-06 · S1 done: `shared/forget.ts` — sign-out, account deletion and an account switch remove the person's kv keys (prefs, journal, chats, cook ratings, AI consent, personal list, household) and reset the in-memory copies (prefs, AI consent); scheduled reminders are cancelled, reminder settings stay (the phone's); the pre-account draft and a remembered link go only when a signed-in person leaves. A test fails when a new kv key has no decision.
- 2026-11-06 · A5 done: CI job `rls` starts a local Supabase from the migrations and runs the attack suite (78 passed locally: every repo migration applies cleanly to a fresh database). Suite gained events + join-limit cases; public catalogue caches checked for readability, not row counts. B5: `supabase/config.toml` with each function's verify_jwt.
- 2026-11-06 · Juan: no GitHub CI, pushes go straight to main. The `rls` CI job is removed; the suite runs by hand with `npm run test:rls` (Docker).
- 2026-11-06 · B1 done: `src/types/database.ts` regenerated from a local stack built from the migrations (`supabase gen types --local`), not by hand; adds memberships, household_join_attempts, app_events. Stricter jsonb typing caught two writes that could send null to not-null columns (recipe ingredients, list share payload); typed as non-null.
- 2026-11-06 · B2/B3: Paste a link passes generate-recipe's 402/429/503 through (deployed import-recipe v16; anon still 401); stale vendor comments now say OpenAI.
- 2026-11-06 · S5 + S8 done: plain sign-in errors with the next step (`authErrors.ts`, +2 tests); kitchen join errors split; Leave confirms (`shared/confirm.ts`, reused by later delete/sign-out flows); a failed shared-list write shows a toast after the rollback.
- 2026-11-06 · G-2/B4: truth table names OpenAI and lists every change the App Store answers must cover (meal photos, product interaction, on-device dictation, coming allergies); the exact policy paragraphs are written for the website repo.
- 2026-11-06 · R2.2–R2.6 built behind flowV2: `ClubOutcomeScreens.tsx` (waiting for approval: opens on its own when the entitlement arrives, Check again, Choose another way; You're all set naming tonight's dinner, then the one reminders ask; Everything is still here → Rejoin), `club.pending.ts` (48 h Ask to Buy flag feeding the launch), routes `/club/pending|welcome|ended`; paywall: error → native alert "Nothing was charged", restore none → alert, ok → "Purchases restored". `ended` now opens its own screen. Not on a device.
- 2026-11-06 · R3.2/R3.4/R5.6 + R3.1 (JS fallback): under flowV2 the tabs are Home · Plan · Cookbook · Account + the Otto circle (`TabBarOttoButton`, otter face, ring when open); the ＋ tab is hidden with href:null, not removed. Home = `features/home` (TonightCard: Start cooking · Cooked it · Swap; empty "Open. No plans, no guilt."; This week `WeekStrip`) in Discover's new `top` slot. `ottoHref()` is the one route to Otto AI. NativeTabs (iOS 26 bar) waits for the SDK spike (G-8).
- 2026-11-06 · R4.1/R4.2/R4.4 built behind flowV2: open days read "Open. No plans, no guilt."; long-press opens one dish sheet (cooked · swap · move to another day · leftovers tomorrow · label · remove); remove offers Undo (`entryToInput`, +1 test); "Otto, plan my week" / "fill the open days" uses the first-week rules on the empty days only (`catalogue/usePlanMyWeek.ts`). R4.3 (picker with Discover · Ask Otto) and R4.5 (Shopping as a Plan segment) still to do.
- 2026-11-06 · R0.4 done: `profiles` (own row, cascades with the account) applied; usePrefs reads the account's copy after the kv cache (a new phone gets the answers) and pushes on every save, under flowV2. RLS suite +6 cases (84/84 local). R6.1 already met.
- 2026-11-06 · R7.2 built behind flowV2: Preferences gains who's eating (adjustable), allergies (chips + the labels note) and foods to skip; usePrefs gains setHousehold / toggleAllergy / addSkip / removeSkip, saved to the phone and the account.
- 2026-11-06 · Review fixes for R2–R4 (independent refuter): three changes had leaked into the flag-off build (Undo toast on remove, Plan loading the whole dinner shelf, "Purchases restored" toast) and are now gated; the shelf loads only when the button can show and is never written to the offline cache (`meta.persist: false`, honoured by the persister); the paywall error alert no longer claims "Nothing was charged"; the launch waits for the Ask to Buy flag before opening the paywall; "ended" reacts to a renewal and is replaced, not stacked; welcome sends a known non-member back; the tab buttons read react-navigation 7's aria-selected (ring + VoiceOver "selected" now work, also the old ＋); "Otto, plan my week" reads the person's answers fresh from the account and says a network failure instead of "nothing fits", and reports partial saves; WeekStrip labels from the date (every locale); Home's top hides during search; Cooked it is tracked after the write. Open: Android action sheets cap at 3 buttons (iOS-only app today).
- 2026-11-06 · R7.4/R7.6: Download my data (`export-data`, reads with the caller's token so RLS decides; deployed v1, verify_jwt). Sign-out confirms and a used, signed-out phone opens on Welcome under flowV2.
- 2026-11-06 · R0.12: `rate_limits` + `rate_limit_hit` applied (service role only, checked inside the function; RLS suite +3, 87/87; positive check locally: 2 allowed, 3rd refused). `rateLimitedDurable` in `_shared/http.ts`, used by scan-meal (v2) and export-data (v2); generate-recipe, import-recipe, resolve-nutrition and delete-account switch on their next deploy. REQUIRE_CLUB=on is Juan's switch (it blocks AI for anyone the membership mirror misses).
- 2026-11-06 · R4.3 built behind flowV2: the meal picker opens with two doors above the Saved list — Find in Discover (Home tab) and Ask Otto (`ottoHref()`); the sheet closes first.
- 2026-11-06 · R4.5 built behind flowV2: the Plan tab is `PlanTab` — Week · Shopping segment on top; Shopping is the same list (aisles, each row names its dishes) shown without a back button, and the week's "Shopping list" button switches the segment. `/shopping` stays as the deep link. Not checked on a device (needs a signed-in account; T3).
- 2026-11-06 · R3.5 built behind flowV2: the four main tabs are remembered (`shared/lastTab.ts`, +2 tests; kv `lastTab`, kept on sign-out) and a cold launch that lands on Home goes back to the last one once; a deep link wins, Otto is never restored. R3.6 done: Cookbook's empty-state Explore opens the Home tab (`/(tabs)`); Ask Otto's unreachable signed-out view is gone (the route guards keep signed-out people out; it renders nothing for the frame before the redirect).
- 2026-11-06 · R3.3 built behind flowV2: Home's search field opens `app/search.tsx` (`recipes/SearchScreen.tsx`): empty → recent 5 + browse by kind (category tiles); typing → results with kind chips (`search.logic.ts`, +2 tests); nothing found → "Ask Otto for …" puts the words in Otto's composer (the editor's one-slot hand-off, set by the route). Recent searches moved onto kv `recentSearches` (same stored name) and are now removed on sign-out — before, a person's searches stayed on the phone.
- 2026-11-06 · R5.5 built behind flowV2: a recipe that isn't there opens `RecipeGone` (plain words, Otto's pick in its place, Search · Ask Otto · Take me back — back works from a cold link); a failed read now shows the retry state instead of "Recipe not found". "Similar dishes" is Otto's pick: a missing recipe has no category to match.
- 2026-11-06 · R5.1–R5.4 checked against the code: servings stepper, nutrition "Estimate", paw, add to week, mise en place, timers, thumbs, plate → journal and the once-only review prompt were already there. One change behind flowV2: a recipe opens sized for the household (`servingsFor`, a kid = half), not at 1 serving — the founder's one-serving call holds in today's build; the rework asks who's eating, so the recipe should use it. Juan can veto.
- 2026-11-06 · R6.2/R6.3 built behind flowV2: Add opens on a Snap a meal hero, then Paste a link · Write or paste (with Say it) · Write it myself; the ＋ sits in Cookbook's bar. Before the first camera alert a primer says what the camera is for (Continue / Not now; Not now spends nothing; `imagePicker` `primer` option, only while the permission is unasked). R6.6 moves into R10.1: the old build still uses the page scan, so it goes when the switch flips.
- 2026-11-06 · R2.7/R2.8/R8.2 built behind flowV2. `clubDates` (+1 test) reads a renewing trial's end and Apple's billing-issue mark from the active entitlement; `useMembership` returns both. Trial: 2 days before the end at 10:00 local, only while a reminder is on and the trial will renew (a cancelled trial never charges), never in the past (`trialReminder`, +2 tests); the root layout composes it into NotifSync. Grace: Home shows "Apple couldn't take your last payment" → Update opens Apple's subscription sheet; access continues. Taps: every reminder carries an href (tonight → its first recipe, Sunday → Plan, trial → Otto Club); a warm tap opens it, a cold tap goes through the intent store so it never fights the launch (a cold trial tap opens Home: the Club screen is a door, not a destination).
- 2026-11-06 · R2.1 built behind flowV2: four benefit lines (plans your week · snap any dish · one shopping list by aisle, shared · ask Otto while you cook), and the fine print is dated from the plan on screen: "Free until Nov 11, then $39.99/year. Renews automatically. Cancel anytime in Settings." (`trialEndDate`, calendar units, +1 test). The trial is now read per plan, so a monthly plan without one no longer promises it (today's build reads the yearly trial for both). The billed price stays the biggest price on screen (3.1.2(c)).
- 2026-11-06 · R1.1: under flowV2 the in-app splash is Welcome's empty cream shell (no otter, no words). The native launch screen is build-level (`app.json`), so it goes to Terminal as T15 with the switch flip instead of changing 1.0.24. R1.7 was already met by the `Stack.Protected` groups.
- 2026-11-06 · Review fixes (independent refuter on R3.3–R6.3, no flag-off leaks found): Ask Otto from a screen pushed over the tabs (Search, Add, the editor, a dead recipe) mounted a SECOND tab navigator (second tab bar, back to the wrong screen) — `openOtto()` goes back to the open tabs first (`dismissTo`, flowV2); an ask now starts a fresh chat instead of landing in a reopened thread; Home's and the Sunday reminder's plan links say `?view=week`, so they never land on the Shopping segment; the last-tab restore checks where the person is when the read returns (a quick tap wins); a search sent before the recent list loads no longer replaces the saved five.
- 2026-11-06 · R7.1 built behind flowV2: a member's Otto Club screen shows the plan (· free trial) and "Renews on Dec 4, 2026" / "Ends on …" (`memberSummary`, +1 test), Manage subscription (Apple's sheet), Restore purchases and Request a refund (`beginRefundRequestForActiveEntitlement`; sent → "Apple has your request", failed → points to reportaproblem.apple.com).
- 2026-11-06 · R8.4 built behind flowV2: a What's new sheet on Home once per release (major.minor; a patch never repeats it — `shared/whatsNew.ts`, +2 tests; kv `lastSeenVersion`, kept on sign-out). Upgraders see it; a new install marks the release seen on Welcome. Notes exist for 1.1 only (four lines, each a thing 1.1 does), so nothing shows until the version is bumped at R10.1.
- 2026-11-06 · R4.6 built behind flowV2: under the list, "Shop together — invite someone and you both tick off one live list", or once shared "Shared with your kitchen · N people see this list as it changes"; both open the kitchen screen (invite · join · leave), which already does the work.
- 2026-11-06 · R8.3 code part behind flowV2: TanStack pauses (doesn't fail) a mutation while offline, so Snap a meal / Paste a link / Write or paste started offline spun on "Otto's reading it…" until the connection came back (also true in today's build). Add now checks first (`isOnline()` in `shared/online.ts`) and says "Otto needs a connection for that. Write it yourself works offline." — also after the camera closes. The airplane-mode launch proof (member, lapsed, fresh install) is on T3.
- 2026-11-06 · R3.4 v1 / B6 built behind flowV2: Ask Otto now cooks for this home — the Otto route sends servings (a kid = half), diet, cuisines, allergies as plain labels, foods to skip and this week's dish names; generate-recipe puts them in the context ("never use these… say so if a dish usually has one"). Options are read at send time (they were captured once at mount). Server code also moved to `rateLimitedDurable`; deploy is Terminal T7a (old apps unaffected: the new fields are optional). Privacy: added to the truth table and T5. Reading the roadmaps: 1.1 says the chat is told allergies; the 1.2 rule "allergies… are never visible to the AI" is read as the agent never *changing* them — Juan to confirm.
- 2026-11-06 · S4 behind flowV2: a failed Otto turn keeps the person's line and shows Try again (resends the transcript; `useChat.retry`, only when the last line is theirs); a turn that hasn't started answering in 60 s says "Otto took too long on that one"; a 429 says "20 chats in 15 minutes"; a failed snap keeps the photo — "Try again with this photo".
- 2026-11-06 · T7/T7a deployed from main by the cloud session (Terminal's classifier blocked deploys): generate-recipe v23 (durable limiter + the chat context, B6), import-recipe v17, resolve-nutrition v14, delete-account v16. Each anon call → 401. Every AI and destructive function is now on the Postgres rate limit (R0.12).
- 2026-11-06 · R3.1 settled (Terminal T8): NativeTabs' search slot has a fixed title and custom icons render as templates, so the Otto circle can't live there; the custom tab bar with `TabBarOttoButton` stays for 1.1.
- 2026-11-06 · R8.2 buttons behind flowV2: a dinner reminder for a one-dish day carries Cooked it · Swap (category `dinner`; a two-dish day opens the app, since a button can't say which dish). Both open Otto: Swap → the week; Cooked it marks that plan entry cooked once the plan has loaded (works from a quit app too), then opens the week. +1 test.
- 2026-11-06 · S10 behind flowV2: every empty list has one first action — Shopping "Plan a meal" (switches to the Week segment inside the Plan tab), Recent chats "Ask Otto", Journal "Find something to cook" (Cookbook). Scenario gaps S2, S3, S7, S11 ticked (already covered).
- 2026-11-06 · R2.1 A/B behind flowV2: half of accounts (stable FNV hash of the user id, `paywallVariant`, +1 test) see "Keep your week." with their own "Tonight: …" and "N more dinners planned, and the shopping list ready" in place of the benefit lines. An empty week falls back to generic, and `paywall_viewed.variant` records what was actually shown (it waits for the plan read to decide). Price, trial line and legal links are the same in both. Compare `purchase_result` by user after each `paywall_viewed`.
- 2026-11-06 · R6.7 editor behind flowV2: return on the last ingredient adds the next row, focused; every ingredient and step gets a reorder handle (tap or long-press → Move up / Move down; VoiceOver swipes up/down on it); Ask Otto reads "Otto, fill the gaps" and carries the half-written recipe as before. A drag gesture is left for later (it needs a gesture list and stable row ids). `editor.logic.ts`, +2 tests.
- 2026-11-06 · G19/G20 behind flowV2: body text is 17 pt (24 line height), Apple's default, read from the flag in `tokens.ts`; checked on the web build's question screens (no clipping). Recent chats now goes back with a chevron ("Go back") instead of an X, and cook mode's Previous step uses the chevron.
- 2026-11-06 · R10.4 drafted: 1.1 App Review Notes in `docs/release/STORE_METADATA.md` §7b (demo account lands on Home; the new-install path; Club terms, Restore, refund; OpenAI named for chat, Snap a meal and paste; camera = meals only; delete + download).
- 2026-11-06 · Review fixes (second independent refuter; no flag-off leaks): the chat timeout now runs until Otto's first word, not just the headers (the server streams headers at once); "Cooked it" from a reminder is held in state so it actually runs, ticks only if the entry still has the title and day the banner named (a delivered banner can outlive a swap), and a launch tap is handled once; the paywall event fires even when the plan read fails and logs `assigned` (the arm) beside `variant` (what showed) — analyse by `assigned`; editor rows have stable keys and moves are announced, so VoiceOver reorder works past one place; "Try again with this photo" only shows for that photo's error; the empty list's Plan a meal goes back to the tabs (no second tab bar); the 429 line says "20 requests" (chat and imports share the limit); blank plan titles and skips are dropped before they reach the server.
- 2026-11-06 · A3 applied by the terminal (MCP): `20261106164254_household_owner_handover`; account deletion hands a shared kitchen to its longest-standing other member.
- 2026-11-06 · T6 (terminal): `REQUIRE_CLUB=on` (server checks Otto Club on every AI call; demo account passes); `canonicalize` deleted from production and the repo; leaked-password protection needs the Pro plan, left off.
- 2026-11-06 · R0.13 done: `agent_actions` (own rows; only `undone_at` can change; a unique idempotency key per user) and AI consent on `profiles` (answer, provider, time), applied as `20261106213056` after the RLS suite passed 98/98 on a local stack (+11 cases). Under flowV2 the app writes the answer to the account and a phone with no answer reads it from there (update only, so it never creates a default-prefs row); sign-out leaves the next person unread rather than "unknown". ADR-0006 amended; ERD updated. Next for the agent (1.2): `export-data` should include `agent_actions` when something writes it, and the server checks account consent for Siri and widgets.
- 2026-11-06 · R0.11 done: `shopping_lists` (one row per person, own row only; RLS 104/104 locally, +6) applied as `20261106213429`. Under flowV2 the personal list's store stamps each save, mirrors it to the account (one push at a time, in order), and opening the list takes the newer copy (`newerCopy`, +2 tests). The pull runs inside the store's queue before a read, never in a write, gives up after 3 s and then writes nothing. The phone stays the offline truth; a new phone gets the list; Otto (1.2) can change it on the server.
- 2026-11-06 · Download my data (export-data v4) now includes `shopping_lists` and `agent_actions`; anon → 401.
- 2026-11-06 · 1.2 agent, server side written (not deployed yet, review first): `supabase/functions/otto-agent`. Function calling (≤6 rounds, 14 calls, 7 writes a turn) over the plan actions plus read_week and find_dinners; the person's token for every read and write; a dish must pass the household's allergies, diet and skips in code (`eligibleDinners`, the first week's filter, shared via a `.ts` import — `allowImportingTsExtensions` on, Metro checked), and days must be in the 7-day window; each write logged in `agent_actions` with its inverse; `{ undo: id }` replays it. Pure core `agent.ts` (+4 tests); `tools.json` is generated with the manifest.
- 2026-11-06 · 1.2 agent, app side (behind `flags.agent` = flowV2 + `EXPO_PUBLIC_OTTO_AGENT`): Plan → "Plan with Otto" opens a sheet; the person says what they want, Otto changes the plan, and an "Otto did" list shows each change with its own Undo. AI consent first, offline says so, the plan refreshes after each change, `week_planned_by_otto` tracked.
- 2026-11-06 · Juan's decisions: the AI sees allergies (and the rest of the person's context) — the 1.2 rule means the AI may never *change* allergies, diet, billing or the household; REQUIRE_CLUB stays on; Billing Grace Period goes to Terminal (T6); leaked-password protection is on hold (Pro plan). Next: the agent's personal context and memory design, and a full security audit (no keys or other people's data reachable from the app or the functions).
- 2026-11-06 · otto-agent review fixes (11 findings, none deployed yet): the allergy filter is the union of the account's and the phone's answers and a failed read plans nothing (never an empty filter); a replayed request returns what it already did and an unlogged write is reverted; Undo is claimed first, refuses when the row changed since, restores cooked; swap only recipe-for-recipe and keeps the note; a real per-request shuffle that skips dishes already planned; a 110 s deadline with partial results shown (the sheet keeps Undo rows from an error); id-based changes only inside the 7 days; positions worked out on the server; lists capped, not cut mid-JSON; stored args whitelisted. +1 test (guard, args, ids, shuffle).
