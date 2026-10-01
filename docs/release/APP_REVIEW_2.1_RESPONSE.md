# App Review response — Guideline 2.1 "Information Needed" (1.0.19, build 38)

> Received 2026-10-01. Status in ASC reads **Rejected — 2.1.0 Performance: App Completeness**, but
> the message is an **information request**, not a bug report: Apple asks new developer accounts
> for a demo video and a written briefing before reviewing. The three subscription items (Otto Club
> group, Monthly, Yearly) are **Ready for Review** — not rejected, only blocked until the app
> version is resubmitted. A rejection is a resubmit, not a restart.
>
> Every fact below was checked against the code on 2026-10-01 (file refs in §6). Do not add a
> claim to the reply that is not in this document.

---

## 1. Before you resubmit — 4 checks (one is a real decision)

1. **DECISION — in-app AI data-sharing line (Guideline 5.1.2(i)).** Logged 2026-09-28 in
   `TERMINAL_TICKET_PUBLISH.md` and **still not fixed in build 38**: nothing in `src/` tells the
   user, at the point of use, that what they type, paste, photograph or say is sent to an AI
   provider (Anthropic). Apple requires that disclosure *in the app*, not only in the privacy
   policy. Once this info request is answered, the real review starts — and this is the live
   AI-specific rejection vector.
   - **Recommended:** add one line at each AI entry point (Ask Otto composer, import/paste, photo
     import, voice input) + the FAQ answer → **build 39** → record the video on build 39 →
     resubmit with 39. Costs ~a day; avoids a second rejection cycle.
   - **Fastest:** answer now with build 38 and accept the 5.1.2(i) risk.
2. **TheMealDB authorization (answer #6).** `eas.json` does not set `EXPO_PUBLIC_USE_OTTO_RECIPES`,
   so unless it's set as an EAS server env var, release builds read the recipe catalogue from
   TheMealDB live, and 792/795 photos are hotlinked from `themealdb.com` either way. TheMealDB's
   terms require becoming a **supporter** to ship on an app store. Confirm you are one (or become
   one) **before** sending answer #6 — it says you are authorized.
3. **Demo account still works.** Sign out on a phone, sign in with `claude-e2e-a@example.com`
   (password lives only in the ASC Demo Account field) and confirm recipes, plan and list are there.
4. **The app's tab is "Account", not "Profile".** The current ASC notes say "Profile > Otto Club"
   and "Profile > Delete account". The reply below uses the real labels — replace the notes.

---

## 2. Record the screen video (only you can do this — needs a physical iPhone)

**Setup:** iPhone on the **latest iOS**, build from TestFlight, **Do Not Disturb on**, force-quit
Otto, Control Center → Screen Recording. Target 3–5 minutes. Narration not needed.

| # | Show | Why Apple wants it |
|---|---|---|
| 1 | Start on the Home Screen → tap the Otto icon (cold launch) | "must begin with launching the app" |
| 2 | Sign up a **new throwaway account** (email + password) | registration flow |
| 3 | Account tab → scroll down → **Delete my account** → tap again to confirm → back at sign-in | account deletion — do it on the throwaway, **never the demo account** |
| 4 | Sign in with the **demo account** | login flow |
| 5 | Discover → open a recipe → change servings → scroll to nutrition → **Start cooking** → swipe 2 steps → exit | core flow |
| 6 | Create tab (＋) → type *"a quick tomato pasta for 2"* → Otto writes it → **Save to cookbook** → review screen → save | AI feature |
| 7 | Create tab → import icon (top) → **Paste a link** `https://www.bbcgoodfood.com/recipes/easy-pancakes` → review → save | import |
| 8 | Cookbook tab → the saved recipes | |
| 9 | Plan tab → add a recipe to a day → open the **shopping list** → check one item | plan → list |
| 10 | Account → **Our shared list** → show the invite code and **Leave this kitchen** | user content is invite-only; the user controls membership |
| 11 | Account → **Otto Club** → hold on both plans (name, **monthly / yearly**, **$4.99 / $39.99**, 1-week free trial, auto-renew line) → tap **Terms** → back → tap **Privacy** → back → show **Restore purchases** → tap **Start free trial** to show Apple's purchase sheet → cancel | subscription: title, length, price + Terms of Use + Privacy links |

**Upload:** attach it to the App Review reply if it fits; otherwise upload to iCloud Drive / Google
Drive / Dropbox (or unlisted YouTube) as a **link that opens without signing in**, and paste the
link in both the reply and the Notes field.

---

## 3. The reply — paste into the App Review message AND into App Review Information → Notes

Plain text (ASC renders no markdown). Fill the `[brackets]`. Measured under the 4,000-character Notes limit.

```
Thank you for the review. Answers below; the same text is in the App Review Notes.

1. SCREEN RECORDING
[VIDEO LINK OR "attached"]. iPhone [model], iOS [version], build 1.0.19 ([38/39]). Starts at app launch; shows registration, account deletion, sign-in, the main features, and the Otto Club screen (name, length and price of each plan, free trial, auto-renewal terms, Terms of Use and Privacy Policy links, Restore Purchases).

2. PURPOSE AND AUDIENCE
Otto is a personal cookbook and weekly meal planner for people who cook at home (13+). Recipes end up scattered across websites, social videos, screenshots and handwritten cards, and cooks still have to decide what to make and what to buy. Otto keeps recipes in one place, cooks them step by step with quantities that scale to the servings, turns the week's plan into a shopping list grouped by aisle, and estimates nutrition per serving. No ads, no public feed, no tracking.

3. SETUP AND ACCESS
An account is required. Please use the demo account in the Demo Account fields; it has saved recipes, a week plan and a shopping list. New accounts: email and password, or Sign in with Apple. No sample files needed.
- Discover: browse and search; open a recipe for ingredients, steps and a nutrition estimate; Start cooking opens step-by-step cook mode.
- Create (the + tab): ask Otto for a recipe or a cooking question, typed or by voice. The import icon at the top brings in an existing recipe: paste a link (e.g. https://www.bbcgoodfood.com/recipes/easy-pancakes), paste text, or photograph a recipe card. Every import and AI recipe opens in an editor for review before saving.
- Cookbook: saved and imported recipes.
- Plan: put recipes on days; the shopping list builds from the plan.
- Account: Otto Club, Our shared list, preferences, Delete my account.
User content: users write their own recipes and can share a shopping list only with people they invite by code, or send a private link. Nothing is public: no feed, profiles, comments or discovery of other users. Members can leave a shared list anytime (Account > Our shared list > Leave this kitchen).
Web: no in-app browser. Recipe videos play in an embedded YouTube player; source links open in the system browser sheet.

4. EXTERNAL SERVICES
- Supabase: authentication, database, server functions.
- Sign in with Apple.
- Anthropic (Claude API), called from our server: writes recipes and chat replies, reads imported recipes (links, text, photos), matches ingredients to nutrition data. It receives the content the user submits to that feature.
- Apple Speech Recognition: voice input.
- Apple In-App Purchase via RevenueCat: subscriptions.
- USDA FoodData Central: nutrition data.
- TheMealDB: recipe catalogue and photos.
- YouTube: embedded videos.
- Pasted links: our server fetches that public page or post caption.

5. REGIONS
Features and content are the same in every territory where Otto is offered. The interface is in English; the App Store shows local prices.

6. REGULATION AND THIRD-PARTY MATERIAL
Not a regulated industry. Nutrition figures are estimates from USDA FoodData Central (public domain); the app says they are estimates, not dietary or medical advice, and that AI recipes are suggestions. Catalogue recipes and photos come from TheMealDB under its API terms, credited in the description, Terms and Privacy Policy. Imported recipes stay in the user's private cookbook with the creator's name and a permanent source link.

7. IN-APP PURCHASES
Subscription group Otto Club: Monthly $4.99/month and Yearly $39.99/year, auto-renewable, each with a 1-week free trial. It unlocks unlimited saved recipes, imports and Ask Otto; cookbook, cook mode, plan and shopping list stay free. Purchase: Account > Otto Club > choose a plan > Start free trial. Restore Purchases, Terms of Use and Privacy Policy are on the same screen.
```

---

## 4. Send it and resubmit (App Store Connect)

1. **Reply:** ASC → Apps → Otto → **App Review** (messages) → open Apple's message → paste §3 →
   attach the video or include the link → **Send**.
2. **Notes:** open the **1.0.19** version page → **App Review Information** → replace the **Notes**
   with §3 (keep the contact and Demo Account fields) → **Save**.
3. **If you made build 39:** same page → **Build** → remove 38 → select 39 → **Save**.
4. **Resubmit:** **Resubmit to App Review** (the banner's "make edits" path). Keep the three
   subscription items in the submission — they must ship with this version.
5. Log the date, build and outcome in `docs/tickets/TERMINAL_TICKET_PUBLISH.md`.

Expect 24–48h (often longer for a new account). If Apple writes back with a specific defect, it is
a separate fix-and-resubmit.

---

## 5. Things NOT to say

- No user counts, recipe counts, ratings, "personalized" or "AI meal planning" — none are true.
- Do not claim nutrition is accurate, verified or medical.
- Do not claim TheMealDB authorization until check §1.2 is done.

## 6. Where each fact comes from

| Fact | Source |
|---|---|
| Email/password + Sign in with Apple only | `src/features/auth/{auth.queries.ts,oauth.native.ts}` |
| Tab names Discover / Cookbook / Create / Plan / Account | `app/(tabs)/_layout.tsx` |
| Create tab = Ask Otto; import icon → `/add` | `app/(tabs)/create.tsx`, `src/features/chat/ChatScreen.tsx:206` |
| Prices, trial, Terms/Privacy URLs, Restore, auto-renew line | `src/features/profile/OttoClubScreen.tsx:27-31, 94, 223-232` |
| Club benefits | `src/features/profile/OttoClubScreen.tsx:105-108` |
| Delete my account (two taps) | `src/features/profile/ProfileScreen.tsx:138, 379-382`, `supabase/functions/delete-account` |
| Leave this kitchen | `src/features/profile/HouseholdScreen.tsx:125` |
| RevenueCat (prod `appl_` key) | `react-native-purchases`, `club.purchases.ts:14` |
| Voice input | `expo-speech-recognition`, `src/features/chat/useSpeechInput.ts` |
| AI via server | `supabase/functions/{generate-recipe,import-recipe,resolve-nutrition}` |
| No in-app AI data-sharing line (5.1.2(i) gap) | `grep -ri "anthropic\|AI provider" src` → no user-facing hit |
| Recipe source flag not in release config | `eas.json` (no `EXPO_PUBLIC_USE_OTTO_RECIPES`), `canonical.transform.ts:23` |
| 148 territories, EU excluded | `TERMINAL_TICKET_SUBMIT.md` log, 2026-09-29 |
