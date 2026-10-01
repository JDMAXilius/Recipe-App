# App Review response pack — Guideline 2.1 "Information Needed" (1.0.19)

> **Received 2026-10-01.** App Store Connect shows **Rejected — 2.1.0 Performance: App
> Completeness**, but the message is Apple's standard *information request* for developer
> accounts with a short review history. It asks for a demo video and seven written answers; it
> does not name a defect. The three Otto Club items are **Ready for Review** — not rejected, just
> held until the app version is resubmitted. **v2, 2026-10-01:** rebuilt on primary sources
> (Apple's guideline text) and four published developer runbooks for this exact request; every
> app fact re-verified in code (§10).

**Read in this order:** §1 the one decision → §2 the gate → §3 record the video → §4 send the
reply → §5 resubmit.

---

## 1. The one decision: ship the AI consent sheet first (build 39)

**Why this moved from "nice to have" to "do it before you reply."**

- Apple's rule, verbatim (5.1.2(i)): *"You must clearly disclose where personal data will be
  shared with third parties, including with third-party AI, and obtain explicit permission before
  doing so."* Not "in the privacy policy" — in the app, before the data leaves.
- **Otto has no such disclosure anywhere in the app.** `grep -ri "anthropic|AI provider" src/`
  returns no user-facing text. The publish log flagged this on 2026-09-28; build 38 shipped
  without it.
- **The precedent is the same provider.** GymFusion, an app sending user content to Anthropic's
  Claude, was rejected **eight times** under 5.1.1(i)/5.1.2(i). Apple's exact wording: *"We were
  not presented with the consent prompt on launch or anywhere else in the app."* The developer's
  consent logic existed but reviewers never saw it — the fix was to make it unmissable.
- **Answer #4 forces the issue.** You must tell Apple that typed text, pasted recipes and photos
  go to Anthropic. A reviewer who reads that and then finds no consent in the app has a 5.1.2(i)
  rejection written for them. The reply and the binary must agree.

**What to build (one-time consent sheet, the pattern other apps passed with):**

| Element | Spec |
|---|---|
| **Trigger** | First time the user starts any AI-backed action: send in Ask Otto, **Import it** (link), **Draft it** (pasted text), **Snap a photo**. Once accepted, never shown again. Voice has its own line (below). |
| **Title** | `Otto uses AI for this` |
| **Body** | `To write recipes, read what you paste or photograph, and answer your questions, Otto sends that content to Anthropic, the company behind the Claude AI model, through our server. Only what you give that feature is sent: the text you type, the link or recipe text you paste, or the photo you take. Nothing else from your account goes with it. You can switch this off any time in Account. Your cookbook, cook mode, plan and shopping list work without it.` |
| **Buttons** | `Allow` (primary) · `Not now` (secondary). Non-dismissible by swipe; a choice is required. |
| **Decline** | Only AI actions are blocked (toast: "Otto's AI is off. Turn it on in Account to ask him or import."). Browse, cookbook, cook mode, plan, list all keep working — Apple requires that declining doesn't gut the app. |
| **Revoke** | New Account-tab row **"Otto and AI"** with the same text and a toggle. Reviewer-visible, user-reversible. |
| **Voice** | iOS already asks for mic + speech permission. Add one caption under the first Speak tap: `Your voice is transcribed by Apple's speech service; Otto only receives the words.` |
| **FAQ** | Add to "Where does my data live?": `What you type, paste or photograph for Otto's AI features is sent to Anthropic to generate the answer; see Account > Otto and AI.` |
| **Honesty rule** | Say it once, plainly. No "we take your privacy seriously." Name the company and the data, nothing vaguer. |

**Then:** build 39 → TestFlight → record the video on 39 (the sheet must appear on camera in the
Ask Otto beat) → resubmit with 39. Cost: about a day. Saves: the one rejection cycle that is
written down in advance.

> **Fastest alternative:** reply today with build 38. Honest risk: a 5.1.2(i) rejection after
> the real review starts, which is the same day of work plus another queue wait.

---

## 1b. "But Cal AI doesn't show any AI prompt" — what other apps actually do (Mobbin, 2026-10-01)

**Correct: Cal AI shows none.** Its full 34-screen onboarding on Mobbin has no screen naming
OpenAI or any AI provider. The closest things are a "Your privacy and security matter to us"
reassurance card and the "By continuing you agree to Terms & Privacy" line at sign-in. The
provider appears only in the privacy policy, and even there as "AI Analysis Service / service
providers". Same tier: Yazio ("Get accurate tracking with AI" — marketing), BitePal (accuracy
disclaimer only), Ultrahuman ("Powered by ChatGPT" footer), Postmates ("powered by AI and may not
be accurate"). None of these name where the data goes, in the app.

**Why they get away with it, and why Otto can't copy them:**
1. Review happens only at submission, per reviewer. Apple's position is that guidelines apply to
   new *and* existing apps, but a reviewer has to trigger the AI feature on a fresh install and
   look for the consent. For an established app shipping routine updates that is a dice roll
   they keep winning. The stated failure mode: *"If the API call fires before the consent screen
   appears, the rejection is automatic."*
2. They are established accounts. Otto is a **new** account under explicit extra scrutiny — that
   is what the 2.1 request is.
3. They never had to write "we send photos to OpenAI" to a reviewer. **We do** (answer #4 names
   Anthropic). Cal AI's reviewer was never handed a sentence to go verify; ours will be, and then
   open the app looking for it.

**The apps that do it right don't use a legal wall — it's one friendly card, once:**
| App | What it says | Shape |
|---|---|---|
| [Runna](https://mobbin.com/screens/5876fe0a-be7c-45ac-9760-a59e7a6af7ba) | "Activate Workout Insights — please consent to sharing your Workout Data with our trusted third party AI provider (e.g., OpenAI)… not used for training" | first-use dialog, **Accept / Decline** |
| [Liven](https://mobbin.com/screens/af87d331-1fcd-438b-8573-07bc0dda2d7a) | "Get deeper guidance — Allow Liven's trusted AI partner to learn from your activity… You can continue without it" | one screen, **Yes, I consent / No, continue without** |
| [Structured](https://mobbin.com/screens/fd506bc7-2c02-4ba0-ab7c-85f42d286c8e) | "Structured AI uses OpenAI's ChatGPT… The following data may be sent to Structured's and OpenAI's servers: AI prompts, scanned images…" | one screen, data list, **Accept Terms** |
| [Perplexity Health](https://mobbin.com/screens/4597c7ea-99cf-40b1-81fa-9b0546b885db) | "Your queries are securely sent to trusted AI providers, contractually bound not to use your data for training" | one screen, **I consent** |
| [Meta AI](https://mobbin.com/screens/16d21c24-a888-4344-b561-338efbcc16f4) · [Gemini](https://mobbin.com/screens/0af6cc92-c3b9-460f-9a56-9049ed7cded0) · [CapCut](https://mobbin.com/screens/fb57f6f1-ea76-4b26-a5b6-2b6c073a0beb) | name the provider, say what's captured, link the privacy notice | **Enable / Don't enable** |

**The category, app by app (Mobbin sweep, 2026-10-01 — what each shows *in the app* about user
content going to an AI provider):**

| App | What the user actually sees | Names provider? | Real consent? |
|---|---|---|---|
| [Cal AI](https://mobbin.com/flows/579da5dd-453a-4e7c-9c11-d20708a4db82) | "Your privacy and security matter to us" card; Terms/Privacy line at sign-in | No | No |
| [MyFitnessPal](https://mobbin.com/screens/e8cac0cb-8702-4d5c-909d-11d2accb606e) | Meal Scan / Voice Log tiles; nothing about where the photo or audio goes | No | No |
| [Yazio](https://mobbin.com/screens/c8884255-7bd7-4a5a-8dd4-23fb7aa40f8d) | "Get accurate tracking anywhere with AI" marketing card; "Quick photo tips"; "Analyzing…" | No | No |
| [Noom](https://mobbin.com/screens/8181d60f-d89d-4b57-a7c9-b610b4fdd59a) | Chat footer: "virtual assistant uses an AI-based system… your chat session is recorded and may be monitored"; photo: "we'll break it down and analyze it" | No | Passive notice only |
| [Lifesum](https://mobbin.com/screens/031aee24-95f3-4e34-9c4b-7e3c34e8f62c) | "Try AI food tracking" banner; a **Track with AI** toggle in Diary Settings | No | No (but revocable) |
| [MacroFactor](https://mobbin.com/screens/ba123d07-7dc0-469f-ad8a-e02a4e660623) | First-use "Welcome to MacroFactor AI" sheet: photo tips + "Only upload content you have permission to use"; persistent "can make mistakes, always verify" | No | OK button only |
| [Wabi](https://mobbin.com/screens/bbd6abe7-cdfd-42bd-8361-99bf36e694c8) | Nothing | No | No |
| [Oura meals](https://mobbin.com/screens/15ea5364-e8dd-4c98-8144-d52f9975c671) | "Take a photo. Your meal items will be analyzed." | No | No |
| BitePal · Postmates · Ultrahuman | Accuracy/medical disclaimers; "Powered by ChatGPT" footer | Ultrahuman only, in a footer | No |
| [Garmin Connect](https://mobbin.com/screens/4b629844-7fde-4f09-87da-49974b4cfd0b) | Full AI agreement: data use, retention, opt-out, **Agree / Do Not Agree** | Own model | **Yes** |
| [Structured](https://mobbin.com/screens/fd506bc7-2c02-4ba0-ab7c-85f42d286c8e) | "Structured AI uses OpenAI's ChatGPT… data that may be sent" list, **Accept** | **Yes** | **Yes** |
| Runna · Liven · Perplexity · Meta AI · Gemini · CapCut | One card naming the provider/partner and the data, Accept / Decline | Yes (Liven: "AI partner") | **Yes** |

**Read of the category:** the calorie/recipe apps mostly show *nothing* or an accuracy line; the
apps with real consent are mostly outside the category (fitness, productivity, assistants) — i.e.
the ones that have been scrutinised. Lifesum's toggle and MacroFactor's first-use sheet are the
closest in-category patterns; neither names a provider. **The lightest version that actually
counts is "MacroFactor's welcome sheet, naming Anthropic, with a Not now"** — which is the Liven
card. That is the recommendation.

**Apple's own bar:** Siri asks permission before sending a request to ChatGPT (every time by
default; always for files). That is the standard a reviewer carries into your app.

**What "do it like them" means for Otto:** the Runna/Liven shape — one card, Otto's voice,
Anthropic named, the three data types named, a real "Not now", shown the first time the
reviewer taps Send in Ask Otto (they will; the notes send them there). Not a 3-checkbox wall.
A Cal AI-style "we care about privacy" card that doesn't name the provider does **not** satisfy
the rule and would be the worst of both: a prompt the user sees, with none of the protection.
Onboarding placement also passes, but onboarding is skippable — the first-use sheet is the one a
reviewer cannot miss.

## 2. The rest of the gate — do before recording

| # | Check | Status | What to do |
|---|---|---|---|
| 1 | **TheMealDB authorization** (answer #6 claims it) | ⚠️ Unverified | Release builds don't set `EXPO_PUBLIC_USE_OTTO_RECIPES` (`eas.json`), so the catalogue still reads from TheMealDB live, and 792/795 photos are hotlinked from `themealdb.com` either way. Their terms require a paid **supporter** key to ship on an app store. Confirm you are one (or become one) **before** sending answer #6. Don't claim it otherwise — delete the clause. |
| 2 | **Demo account** | ✅ Verified 2026-09-29 | Re-check on a phone the day you record: sign out → `claude-e2e-a@example.com` → saved recipes, week plan and shopping list present. Password lives only in the ASC field. |
| 3 | **"Account", not "Profile"** | ⚠️ Current ASC notes wrong | The tab is **Account**. The notes in ASC say "Profile > …". Replace with §4 text. |
| 4 | **Screenshots don't lead with sign-in** (2.3.3) | ✅ | First shot is "Bring in a recipe". A reviewer on this same request flagged another app for exactly this. |
| 5 | **Version drift** | ✅ | `app.json` 1.0.19 = ASC 1.0.19. |
| 6 | **Paywall shows everything** (3.1.2 / Schedule 2) | ✅ build 38+ | Title, period, price, 1-week trial, auto-renew line, working **Terms** and **Privacy** links, **Restore** — all on `OttoClubScreen`. Listing has Terms link + renewal terms. Linger on this screen in the video. |
| 7 | **Free limits are visible to the reviewer** (2.1(b)) | ✅ by stating it | Free tier: 5 imports/month, 25 saved recipes, 5 asks/day. Answer #7 says so, so the gate reads as designed, not broken. |

---

## 3. The screen recording — script

**Setup (5 min):** physical iPhone on the **latest iOS**; install build 39 from TestFlight;
**Do Not Disturb on**; delete any prior Otto data (or use a fresh device); force-quit Otto;
Control Center → Screen Recording (mic off is fine — narration is optional). One continuous take
is ideal; two takes stitched are acceptable. Target **4–6 minutes**. You will use **two accounts**:
a throwaway you create on camera and then delete, and the demo account for the walkthrough.

> **Read-aloud overview (if you narrate, say this at the start — or paste it as the first line of
> the reply):**
> "This is Otto, a cookbook and weekly meal planner for home cooks, recorded on a physical iPhone
> running the current iOS. I'll start from the Home Screen, create an account and then delete it,
> sign in with the demo account, and walk through the main features: discovering and cooking a
> recipe, asking Otto to write one, importing a recipe from a link, planning the week into a
> shopping list, the shared list, and the Otto Club subscription screen with its prices, trial,
> renewal terms, and links to the Terms of Use and Privacy Policy."

| # | Time | On screen — do exactly this | Why Apple wants it |
|---|---|---|---|
| 1 | 0:00 | Home Screen → tap the **Otto** icon. Let the splash finish. | "must begin with launching the app" |
| 2 | 0:10 | Onboarding: swipe the 3 cards → **Start cooking** | first-run flow |
| 3 | 0:25 | **Sign up** with a throwaway email + password → land on Discover | account registration |
| 4 | 0:45 | **Account** tab → scroll to the bottom → **Delete my account** → tap again ("Tap again. This is forever") → you're back at sign-in | account deletion (required). Never do this on the demo account. |
| 5 | 1:05 | **Sign in** with the demo account | login flow |
| 6 | 1:20 | **Discover**: scroll the categories → open a recipe → tap the serving **+** once (quantities change) → scroll to the nutrition card → **Start cooking** → swipe through 2 steps → back out | core: browse, scale, nutrition estimate, cook mode |
| 7 | 2:00 | **Create (＋)**: type *"a quick tomato pasta for two"* → Send → **the AI consent sheet appears → tap Allow** → Otto writes the recipe → **Save to cookbook** → review editor → Save | AI feature **and** the 5.1.2(i) consent on camera |
| 8 | 2:45 | Still on Create: tap **Speak** once → iOS mic/speech prompts → say "pancakes" → stop. (Shows the voice caption.) | voice input disclosure |
| 9 | 3:00 | Create → **import icon** (top) → **Paste a link** → paste `https://www.bbcgoodfood.com/recipes/easy-pancakes` → **Import it** → review → Save | import flow, review-before-save |
| 10 | 3:30 | **Cookbook** tab: show the two saved recipes | |
| 11 | 3:40 | **Plan** tab: drop a recipe on a day → open the **shopping list** → check one item off | plan → list |
| 12 | 4:00 | **Account** → **Our shared list**: show the invite code and the **Leave this kitchen** button (don't tap) | user content is invite-only; members control membership |
| 13 | 4:15 | **Account** → **Otto and AI** row: show the toggle (don't change it) | consent is revocable |
| 14 | 4:25 | **Account** → **Otto Club**: hold 3 s on the plans (**Monthly $4.99 / Yearly $39.99**, 1-week free trial, "then … /year", auto-renews) → tap **Terms** (page opens) → back → tap **Privacy** → back → show **Restore purchases** → tap **Start free trial** → Apple's sheet appears → **Cancel** | subscription: title, length, price, trial, renewal, Terms of Use + Privacy links, Restore |
| 15 | 5:10 | Stop recording. | |

**Deliver:** Apple's reply form accepts `.mp4`/`.mov` attachments. If the file is under a few
hundred MB attach it; otherwise upload to iCloud Drive / Google Drive / Dropbox / unlisted YouTube
as a **link that opens without signing in**, and put the link in both the reply and the Notes.
Test the link from a browser where you're logged out.

---

## 4. The reply — paste into the App Review message AND into App Review Information → Notes

Plain text; ASC renders no markdown. Fill the `[brackets]`. Measured **under 4,000 characters**
(the Notes limit). The same text goes in both places so future submissions inherit it.

```
Answers below; the same text is in App Review Notes.

1. SCREEN RECORDING
[LINK or "attached"]. iPhone [model], iOS [version], build 1.0.19 (39). Starts at launch; shows registration, deletion, sign-in, the main features, the AI consent prompt, and the Otto Club screen (plan names, lengths, prices, trial, auto-renewal terms, Terms of Use and Privacy links, Restore).

2. PURPOSE AND AUDIENCE
Otto is a personal cookbook and weekly meal planner for home cooks (13+). Recipes end up scattered across websites, videos and screenshots, and people still have to decide what to cook and buy. Otto keeps recipes in one place, cooks them step by step with quantities that scale to the servings, turns the week's plan into a shopping list grouped by aisle, and estimates nutrition per serving. No ads, no public feed, no tracking.

3. SETUP AND ACCESS
An account is required. Please use the demo account in the Demo Account fields; it has saved recipes, a week plan and a shopping list. New accounts: email and password, or Sign in with Apple. No sample files needed.
- Discover: browse and search; a recipe shows ingredients, steps and a nutrition estimate; Start cooking opens cook mode.
- Create (the + tab): ask Otto for a recipe or a cooking question, typed or by voice. First use shows a consent prompt naming Anthropic; it can be switched off in Account > Otto and AI. The import icon at the top brings in an existing recipe: paste a link (e.g. https://www.bbcgoodfood.com/recipes/easy-pancakes), paste text, or photograph a recipe card. Every import and AI recipe opens in an editor for review before saving.
- Cookbook: saved and imported recipes.
- Plan: put recipes on days; the shopping list builds from the plan.
- Account: Otto Club, Our shared list, Otto and AI, preferences, Delete my account.
User content: users write their own recipes and can share a shopping list only with people they invite by code, or send a private link. Nothing is public: no feed, profiles, comments or discovery of other users. Members can leave a shared list anytime (Account > Our shared list > Leave this kitchen). Contact: support@ottosapp.com.
Web: no in-app browser. Recipe videos play in an embedded YouTube player; a source link opens in the system browser sheet.

4. EXTERNAL SERVICES
- Supabase: authentication (email/password), database, file storage, server functions.
- Sign in with Apple.
- Anthropic (Claude API), called from our server after in-app consent: writes recipes and chat replies, reads imported links, text and photos, matches ingredients to nutrition data. It receives only what the user submits to that feature.
- Apple speech recognition: voice input is transcribed by Apple; Otto receives the text only.
- Apple In-App Purchase, managed with RevenueCat: subscriptions.
- USDA FoodData Central: nutrition reference data.
- TheMealDB: recipe catalogue and photos.
- YouTube: embedded recipe videos.
- Pasted links: our server fetches that public page or caption.

5. REGIONS
Features and content are identical in every territory offered. The interface is English; the App Store shows local prices.

6. REGULATION AND THIRD-PARTY MATERIAL
Not a regulated industry. Nutrition figures are estimates from USDA FoodData Central (public domain); the app says they are estimates, not dietary or medical advice, and that AI recipes are suggestions. Catalogue recipes and photos come from TheMealDB under its API terms, credited in the description, Terms and Privacy Policy. Imported recipes stay private to the user, with the creator's name and a permanent source link.

7. IN-APP PURCHASES
Subscription group Otto Club: Monthly $4.99/month and Yearly $39.99/year, auto-renewable, each with a 1-week free trial. Free accounts get 5 imports a month, 25 saved recipes and 5 asks a day; the Club lifts those limits. Cookbook, cook mode, plan and list stay free. Purchase: Account > Otto Club > choose a plan > Start free trial. Restore, Terms of Use and Privacy Policy are on that screen.
```

If you keep build 38 instead, delete the two consent sentences in #3 and #4 and change "(39)"
to "(38)" — never describe a prompt the build doesn't show.

---

## 5. Send and resubmit (App Store Connect)

1. **Reply:** ASC → Otto → **App Review** (messages) → Apple's message → paste §4 → attach the
   video or paste the link → **Send**. (Apple's help page calls this "corresponding in App Store
   Connect"; attachments accepted include .mp4, .png, .pdf.)
2. **Notes:** **1.0.19** version page → **App Review Information** → replace **Notes** with §4
   (keep the contact fields and Demo Account) → **Save**.
3. **Build:** same page → **Build** → remove 38 → select **39** → **Save**.
4. **Resubmit:** **Resubmit to App Review** via the banner's "make edits" path. Keep the three
   subscription items in the submission — Apple requires them bundled with this version.
5. Log date, build and outcome in `docs/tickets/TERMINAL_TICKET_PUBLISH.md`.

Expect 24–48 h, often longer for a new account. If Apple answers with a specific defect, it is a
normal fix-and-resubmit.

---

## 6. Don'ts (each one has cost a review somewhere)

- No user counts, recipe counts, ratings, "personalized", "AI meal planning", or any adjective
  the build can't prove.
- Don't call nutrition accurate, verified or medical.
- Don't claim TheMealDB authorization until §2.1 is settled.
- Don't claim report/block mechanisms Otto doesn't have; describe the controls it does have
  (invite-only, leave kitchen, delete own content, contact address).
- Don't describe the consent prompt unless the submitted build shows it.
- Don't bundle the AI consent with any other permission or hide it behind a "Got it" splash —
  it must be its own choice with a real decline.

---

## 7. What good answers look like (from the runbooks that passed)

- **Mirror Apple's numbering exactly**, one block per item, no marketing voice.
- **Ground every sentence in code.** One app named every vendor it actually calls (Clerk, AWS,
  OpenAI, RevenueCat, Sentry…); another updated its privacy policy to name the two services it
  had missed so the policy and the answer matched.
- **Two accounts in the video:** a throwaway for registration → deletion, the demo account for
  the walkthrough.
- **Same text into Notes** so the next submission starts from it.
- **Fix the adjacent rejection vectors in the same pass.** The reviewer re-inspects the app while
  reading: one team was flagged for a Register button that hit a closed backend, and for
  screenshots that led with a sign-in screen.
- Outcome when the pack was exact: *"No new build was required; Apple indicated no guideline
  breach."*

---

## 8. Sources

**Primary (Apple):** [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 2.1(a)/(b), 1.2, 3.1.2(a)/(c), 5.1.2(i) quoted verbatim above · [Reply to App Review messages (ASC Help)](https://www.developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages) · [App Review overview](https://developer.apple.com/distribute/app-review/) · [Guideline update news](https://developer.apple.com/news/?id=ey6d8onl)

**Same request, other developers (Sept 2026):** [athanor PR #897](https://github.com/anecoicastudio/athanor/pull/897) (passed, no new build) · [Kall PR #213](https://github.com/Skaldandstone/Kall/pull/213) (flagged Register + screenshots while answering) · [ttush_push #51](https://github.com/AndrewDongminYoo/ttush_push/issues/51) · [iOSSH #48](https://github.com/m96-chan/iOSSH/issues/48) · [Apple forum: 2.1 Information Needed](https://developer.apple.com/forums/thread/116044)

**5.1.2(i) third-party AI:** [Apple forum: Anthropic consent not seen, 8 rejections](https://developer.apple.com/forums/thread/820209) · [ordilo PR #195 — consent sheet implementation](https://github.com/christianerb/ordilo/pull/195) · [Stora implementation guide](https://stora.sh/blog/2026-05-06-apple-ai-consent-rule-5-1-2-i-implementation-guide) · [dev.to analysis](https://dev.to/arshtechpro/apples-guideline-512i-the-ai-data-sharing-rule-that-will-impact-every-ios-developer-1b0p) · [Cult of Mac](https://www.cultofmac.com/news/apple-app-review-guidelines-on-ai) · [TechCrunch, Nov 2025](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai/)

**3.1.2 subscriptions:** [AngularCorp — missing link blocked release](https://www.angularcorp.com/insights/apple-guideline-3-1-2-subscription-rejection-missing-links/) · [appclearance 3.1.2 guide](https://appclearance.com/guides/3-1-2-subscriptions) · [RevenueFlo paywall rejections](https://revenueflo.com/blog/common-ios-paywall-rejections-and-the-fixes-that-work) · [Apple forum 807082](https://developer.apple.com/forums/thread/807082)

**1.2 user content / invite-only:** [Apple forum 807358](https://developer.apple.com/forums/thread/807358) · [Invite-only submission thread](https://developer.apple.com/forums/thread/15591) · [Social-media declaration, Sept 2026](https://blakecrosley.com/blog/app-store-social-media-declaration-september-2026)

**Review notes / demo accounts:** [AppFollow guidelines 2026](https://appfollow.io/blog/app-store-review-guidelines) · [Crustlab best practices](https://crustlab.com/blog/ios-app-store-review-guidelines/) · [Twinr checklist](https://twinr.dev/blogs/app-store-review-checklist/)

## 9. Where each app fact comes from

| Fact | Source |
|---|---|
| No in-app AI disclosure today | `grep -ri "anthropic\|AI provider" src` → no user-facing hit; publish log 2026-09-28 |
| Anthropic receives chat text, pasted text, photos, ingredient names | `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` rows 7, 12, 13; `supabase/functions/{generate-recipe,resolve-nutrition}` |
| Voice audio goes to Apple, Otto gets text | `src/features/chat/useSpeechInput.ts:1-14`; truth table row 14 (`requiresOnDeviceRecognition` unset) |
| Email/password + Sign in with Apple | `src/features/auth/{auth.queries.ts,oauth.native.ts}` |
| Tabs Discover / Cookbook / Create / Plan / Account | `app/(tabs)/_layout.tsx` |
| Create = Ask Otto; import icon → `/add`; tile labels | `app/(tabs)/create.tsx`; `ChatScreen.tsx:206`; `AddSheet.tsx:185-193` |
| Onboarding → Start cooking → sign-up; Skip → sign-in | `src/features/onboarding/OnboardingScreen.tsx:24-61` |
| Prices, trial, Terms/Privacy, Restore, auto-renew line | `OttoClubScreen.tsx:27-31, 94, 223-232` |
| Free limits 5 / 25 / 5 | `src/features/profile/club.limits.ts:17-24` |
| Delete my account (two taps) | `ProfileScreen.tsx:138, 379-382`; `supabase/functions/delete-account` |
| Leave this kitchen | `HouseholdScreen.tsx:125` |
| RevenueCat prod key | `club.purchases.ts:14` (`appl_…`) |
| Recipe source flag absent from release config | `eas.json`; `canonical.transform.ts:23` |
| Screenshots start with "Bring in a recipe" | `docs/release/store-screenshots/1-bring-in-a-recipe.png` |
| App Privacy label as published | `TERMINAL_TICKET_PUBLISH.md` F3 (7 types, App Functionality) |
