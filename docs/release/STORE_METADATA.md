# Otto — App Store metadata (A9)

> Drafted 2026-07-25 against the shipping app (`app.json` v1.0.17 / build 35). Every claim below
> is traceable to code in `src/features/*`. Nothing here promises a feature Otto does not have —
> **no offline mode, no meal-plan AI beyond what ships, no nutrition guarantee.**
> Character counts are measured, not estimated. Field limits should be re-checked in App Store
> Connect at submission time; Apple changes them.

---

## 1. Name, subtitle, keywords

| Field | Value | Length |
|---|---|---|
| **App name** (≤30) | `Otto: Recipes & Meal Plans` | 26 |
| **Subtitle** (≤30) | `A quieter kind of cookbook` | 26 |
| **Keywords** (≤100) | `recipe,cookbook,meal plan,grocery,shopping list,cook mode,import,step by step,kitchen,no ads` | 92 |

**Name.** `Otto` alone is almost certainly unavailable and carries no search weight on its own.
The descriptor after the colon is the searchable half. If `Otto: Recipes & Meal Plans` is taken,
fall back to `Otto Recipes & Meal Plans` (25).

**Subtitle alternates**, if the founder wants the benefit stated flatter:
- `Save, cook, plan the week` (25)
- `Your recipes, ready to cook` (27)

**Keyword notes.** No word repeated from the name, subtitle, or the Food & Drink category — Apple
indexes those already, so repeating them wastes the field. No competitor names (Apple rejects
them, and it is not Otto's posture). `no ads` earns its 7 characters because it is both a real
differentiator and a phrase people type. Singular forms only; Apple stems plurals.

---

## 2. Promotional text (≤170, editable without a new build)

```
Otto keeps every recipe you save in one place, cooks with you a step at a time, and turns the week's plan into a shopping list. No ads. No feed.
```
144 characters.

This field is the one that can be changed without a review, so keep it for whatever is currently
true — a new feature, a seasonal note. It must never claim more than the build live at that moment.

---

## 3. Description

> Voice check: sentence case, plain verbs, no em dashes, third-person warm narrator, no first
> person, personality only at the emotional beats (`docs/reference/DESIGN_SYSTEM.md` B6). No
> marketing clichés, no awards, no download counts, no testimonials.

```
Otto is a cookbook for the recipes you actually cook.

Bring one in
Paste a link, a video, or the words themselves. Otto reads out the ingredients and steps, then
shows you what it found so you can fix anything before it saves. Recipes you import keep the
original creator's name and a live link back, permanently.

Cook it
One step at a time, in large type, with the timer where your hands can reach it. Change the
serving count and the quantities follow.

Plan the week
Drop dishes onto the days ahead. Otto builds the shopping list from the plan and groups it the
way a store is laid out. Share the list with your kitchen and it stays in step on everyone's
phone.

Ask Otto
A question about a substitution, a technique, or what to do with what's in the fridge. Otto
answers in the app, by typing or by voice.

Nutrition, honestly
Otto estimates calories and macros per serving from the ingredient list. They are estimates,
not measurements, and Otto says so rather than inventing precision it does not have.

What Otto does not do
No ads. No feed. No tracking across other apps. Nothing is sold to anyone. You can delete your
account, and everything in it, from inside the app.

Otto Club
Otto's core features are free and stay free. Otto Club is an optional membership that unlocks
the heavier features, $4.99 a month or $34.99 a year, with a 5-day free trial. Everything Otto
does today stays available whether or not you join.

Recipe data and photography from TheMealDB. Nutrition figures are computed from USDA FoodData
Central, which does not endorse Otto.

Otto needs iOS 15.1 or later.
```

**Claims audit** — every sentence above maps to shipping code:

| Claim | Backed by |
|---|---|
| paste a link / video / text, review before save | `src/features/import/AddSheet.tsx`, `RecipeInput.tsx`, `EditRecipeScreen.tsx`, `supabase/functions/import-recipe` |
| attribution is permanent | `src/features/recipes/RecipeDetailScreen.tsx` source link; honesty law in `.claude/skills/otto-lead/SKILL.md` |
| one step at a time, timer | `src/features/cook/CookScreen.tsx`, `session.ts`, `stepEnrich.ts` |
| servings rescale quantities | `src/features/recipes/recipe.scale.ts` |
| week plan → shopping list, grouped | `src/features/planner/{week.ts,shoppingList.ts,PlanScreen.tsx,ShoppingScreen.tsx}` |
| shared list stays in step | `src/features/household/household.queries.ts` (called a *kitchen* in user copy, never "household") |
| ask by typing or voice | `src/features/chat/{ChatScreen.tsx,useSpeechInput.ts}` |
| nutrition is an estimate | `src/features/nutrition/{estimates.ts,engine/}` |
| no ads, no tracking, delete account | `supabase/functions/delete-account`; live policy at ottosapp.com/privacy |
| club pricing | `src/features/profile/OttoClubScreen.tsx:27-28` (`PRICE_YEAR = 34.99`, `PRICE_MONTH = 4.99`) |
| iOS 15.1 | matches the deployment target on the live site |

**Deliberately absent** (do not add them back): offline use, "AI meal planning", accurate or
guaranteed nutrition, "thousands of recipes" or any count, personalisation the app does not do,
any number of users.

⚠️ **Pricing conflict to resolve before submission.** ottosapp.com's home page **and its
`/support` FAQ** both currently advertise **"$45 a year"**; the app charges **$34.99**
(`OttoClubScreen.tsx:27`). The store description, the paywall, and the website must all say the
same number, or the listing contradicts the product. Fix the site (two pages), not the app.

---

## 4. Category, URLs, and the flat fields

| Field | Value | Note |
|---|---|---|
| Primary category | **Food & Drink** | |
| Secondary category | **Lifestyle** | Not Health & Fitness. Otto estimates nutrition; it does not do health, and that category invites reviewer scrutiny Otto does not need. |
| Marketing URL | `https://ottosapp.com` | verified 2026-07-25: 200, real site |
| **Support URL** | `https://ottosapp.com/support` | verified 2026-07-25: **200, real FAQ page** with ~15 answered questions and a contact address. Use this. |
| Privacy Policy URL | `https://ottosapp.com/privacy` | verified 2026-07-25: 200, real policy |
| User-facing support address | `support@ottosapp.com` | goes in the app and on the support page |
| Copyright | `2026 Juan Diego Lugo` | matches the provider named in the policy and terms |
| Export compliance | `ITSAppUsesNonExemptEncryption: false` | already declared in `app.json` |
| Price tier | Free, with auto-renewable subscriptions | |

**On the support URL.** Apple's Support URL field requires a URL; an email address or a `mailto:`
is routinely rejected, so `juandiego@ottosapp.com` (`ProfileScreen.tsx:38`) cannot go in that
field. **Use `https://ottosapp.com/support`.** It resolves today (200) and is a genuine support
page, not a stub: "Help with Otto", roughly fifteen answered questions across *Before you install
/ About importing / …*, plus an "Email us" block. It is the right answer over `https://ottosapp.com`
on both counts a reviewer cares about: it is unambiguously a support destination, and it answers
questions rather than selling. No URL is invented here; the page was fetched and read.

**On the support address.** Three addresses are currently in play and only one should survive:

| Address | Where it appears now | Verdict |
|---|---|---|
| `support@ottosapp.com` | nowhere yet | **Use this everywhere the user can see it** — the app's Contact row, the support page's "Email us", and the Contact section of the Terms and the Privacy Policy. |
| `juandiego@ottosapp.com` | `ProfileScreen.tsx:38` | Founder's personal address. Replace it in the app; a personal mailbox in a shipping product does not survive contact with an App Store listing. |
| `noreply@ottosapp.com` | transactional sending | **Transactional only** — password resets, auth mail. Never printed as a contact route, never expected to receive. |
| `info@ottosapp.com` | — | Available; no need to surface it if `support@` is the one route. |

⚠️ **`hello@ottosapp.com` is published but is not one of the real mailboxes.** It is printed as
the contact address on the live `/support` page ("Email us — hello@ottosapp.com"), in the live
Terms §2 and §19, and in the Privacy Policy's Contact section. It does not appear in the founder's
list of actual addresses. Either alias it to `support@` or replace it on all three published
pages **before** submission. A reviewer who emails the address on your own support page and gets
a bounce is a support-URL rejection with the evidence already in hand.

---

## 5. Age rating questionnaire

Otto's honest landing spot is **4+**, but two answers are judgment calls and both are written out
so the founder makes them rather than inherits them.

| Question | Answer | Reasoning |
|---|---|---|
| Cartoon or fantasy violence | None | Otto the dog is a mascot at emotional beats. No conflict of any kind. |
| Realistic violence / prolonged graphic violence | None | |
| Sexual content or nudity | None | |
| Profanity or crude humour | None | Copy is audited against the anti-slop rules; no user-visible profanity. |
| Horror or fear themes | None | |
| Gambling, contests, simulated gambling | None | No random rewards, no contests. |
| Medical or treatment information | **None** | Otto prints estimated calories and macros. That is nutrition information about food, not medical or treatment information, and the app states in-product that figures are estimates and not dietary or medical advice (A8). If a reviewer disagrees, the fallback is *Infrequent/Mild* — it does not change the 4+ rating. |
| **Alcohol, tobacco, or drug use or references** | **Infrequent/Mild** | ⚠️ Not "None". 275 of the 795 recipes in `supabase/otto-recipes/canonical/recipes.json` name wine, beer, rum, brandy, sherry, or a liqueur as an ingredient. These are references in ingredient lists, never depictions of use or encouragement to drink, which is what *Infrequent/Mild* describes. Answering None here is the kind of small false declaration that gets caught and costs a review cycle. |
| Contests | No | |
| Unrestricted web access | **No** | ⚠️ Founder call. Otto has no browser and no address bar. Two paths reach the web: an in-card YouTube player (`src/features/recipes/components/VideoEmbed.tsx`, a WebView loading only a YouTube embed for that recipe's video) and `WebBrowser.openBrowserAsync` opening the recipe's own source link in the system browser sheet. Both are a single fixed destination the user asked for, not free navigation. Say exactly this in App Review Notes so it is disclosed rather than discovered. |
| User-generated content | **Yes, limited** | Users write their own recipes and share a shopping list with a kitchen they invite. Nothing is publicly visible and there is no public feed, no comments, no profiles, no discovery of other users. Follow-ups about moderation and reporting apply only to public UGC; Otto's answer is that sharing is invitation-only and scoped to people the user chose. |
| In-app purchases | Yes | Otto Club, auto-renewable, `src/features/profile/OttoClubScreen.tsx`. |
| Made for Kids | **No** | Do not tick this. The Terms set a 13+ minimum (`docs/legal/TERMS_OF_SERVICE.md` §1) and the Kids Category brings COPPA obligations Otto is not built for. A 4+ *rating* with a 13+ terms minimum is normal and not a contradiction — the rating describes content, the terms describe the contract. |
| AI-generated content | Disclose | Otto generates recipes and chat replies with an LLM (`supabase/functions/generate-recipe`, `src/features/chat`). Whether the questionnaire has a dedicated field by submission day, state it plainly in App Review Notes: AI output is a suggestion, the app says so in-product (A8), and allergens and food safety are the cook's call. |

**Expected result: 4+.** If the alcohol answer is escalated to Frequent/Intense — defensible at 35%
of the corpus, though these are ingredients, not drinking — the rating moves to 12+/13+ and the
listing loses reach for no honesty gained. Infrequent/Mild is the accurate answer.

---

## 6. Screenshot shot list

**Required sizes** (confirm in App Store Connect at upload; Apple now scales down from the largest):

- **iPhone 6.9"** — 1320 × 2868 (or 1290 × 2796). **Required.**
- **iPhone 6.5"** — 1242 × 2688. Upload only if the 6.9" scaling looks wrong on an SE-class device.
- **iPad 13"** — 2064 × 2752. **Required only if `supportsTablet` stays `true`** in `app.json`.
  This is gated on **A5** — if the founder ships iPhone-only, this whole row disappears. Do not
  shoot iPad frames until A5 is decided.

Ten slots are available; use **six**. Order matters more than count — slots 1–3 are what people
see without swiping.

| # | Screen (file) | What must be in frame | Caption |
|---|---|---|---|
| 1 | `src/features/import/AddSheet.tsx` → `RecipeInput.tsx`, mid-import with the parsed result showing | A pasted link and the ingredients and steps Otto pulled out of it, editable | Paste a link. Otto reads the recipe. |
| 2 | `src/features/cook/CookScreen.tsx` | One step in large type, step counter, the timer visible | Cook one step at a time. |
| 3 | `src/features/planner/PlanScreen.tsx` | A week with four or five days filled, not seven, not one | Plan the week you'll actually cook. |
| 4 | `src/features/planner/ShoppingScreen.tsx` | A grouped list with a few items already ticked | The list builds itself from the plan. |
| 5 | `src/features/recipes/DiscoverScreen.tsx` or `RecipeDetailScreen.tsx` | Real dishes with real photography; if detail, the nutrition card with its estimate wording legible | Every recipe you love, in one place. |
| 6 | `src/features/chat/ChatScreen.tsx` | A real question and a useful, short answer. No lorem, no "How can I help you today?" | Ask Otto while you cook. |

**Not screenshotted:** `OttoClubScreen` (a paywall as a screenshot converts badly and invites
reviewer questions), `ProfileScreen`, `JournalScreen`, onboarding, and any empty state.

**Rules for the capture session** (this is F5 and it is the difference between a listing that
looks finished and one that does not):

- Real content only. Real recipe titles, plausible quantities, a shopping list with things a
  person buys. Fabricated ratings, cook times, or "trending" markers violate the honesty law.
- Status bar clean: full signal, full battery, a sane time. `xcrun simctl status_bar` sets it.
- Same device, same session, same light. Six frames that do not match read as six apps.
- Nothing personal in frame: no real email address, no real name, no photo of a real person.
- Shoot from the App Review demo account (**A4**) once it is seeded — the same seed data makes
  the reviewer's app and the screenshots agree, which is one fewer thing for a reviewer to
  question.
- If a caption is burned into the image, it follows the same voice rules: sentence case, no em
  dashes, no exclamation marks.

---

## 7. App Review Notes (draft)

```
Otto requires an account to show anything, so please sign in with the demo credentials in the
Demo Account fields above. The account is seeded with saved recipes, a week plan, and a
shopping list, so no screen will be empty.

Otto Club (auto-renewable subscription) is reachable from Profile > Otto Club. [TODO: reviewer
path to the sandbox purchase, filled from A6 once Otto Club is live. Delete this paragraph if
the club ships hidden.]

Web access: Otto has no in-app browser. Recipe videos play in an embedded YouTube player inside
the recipe card, and a recipe's original source link opens in the system browser sheet. There
is no address bar and no free browsing.

AI: recipe generation and the in-app chat use a large language model on our server. The app
states in-product that AI recipes are suggestions and that nutrition figures are estimates,
not dietary or medical advice.

Sharing: a shopping list can be shared with people the user invites by code. Nothing in Otto
is publicly visible; there is no public feed, no comments, and no user profiles.

Account deletion is in Profile > Delete account and removes all server-side data.
```

---

## 8. Open before this can be submitted

- [ ] **A5** decided — iPad in or out. Gates the iPad screenshot row above. Note the live
      `/support` page already tells the public "Otto installs and runs on iPad, but ... an iPad
      layout hasn't been built", while `app.json` still sets `supportsTablet: true`. Apple will
      review on iPad and require iPad screenshots as long as that flag stays true, so the website
      is currently more honest than the build.
- [ ] **A6** decided — Otto Club live or hidden. Gates the description's Otto Club paragraph and
      the second App Review Notes paragraph.
- [ ] **A4** demo account seeded — gates both the notes and the screenshot session.
- [ ] Website pricing corrected to $34.99/yr on **both** the home page and `/support` (see §3).
- [ ] `support@ottosapp.com` swapped in for `juandiego@ottosapp.com` in `ProfileScreen.tsx:38`,
      and `hello@ottosapp.com` either aliased or replaced on the live support page, Terms, and
      Privacy Policy (see §4). One mailbox, monitored.
- [ ] Final character counts re-measured against the live App Store Connect limits before paste.
