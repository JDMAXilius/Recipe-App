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

**BUILT 2026-10-01 for build 39** — this is what shipped. The copy lives in one place,
`src/shared/aiConsent.logic.ts` (`AI_CONSENT_COPY`, pinned by `aiConsent.logic.test.mjs`); the
store and hook are in `src/shared/aiConsent.ts`, and the sheet is `src/shared/ui/AiConsentHost.tsx`,
mounted once in `app/_layout.tsx`.

| Element | As built |
|---|---|
| **Trigger** | The person's own AI action: **Send** or a suggestion chip in Ask Otto, **Import it** (link), **Draft it** (pasted text), **Snap a photo** (asked *before* the camera opens). Once allowed, it isn't shown again. |
| **Title** | `Otto uses AI for this` |
| **Body** | `To write recipes, read what you paste or photograph, answer your questions and match ingredients to nutrition data, Otto sends that content through our server to Anthropic, the company that makes the Claude AI model.` / `Only what you give the feature goes: the words you type, the link, text or photo you share, and the ingredient names in your recipes. Your email and the rest of your account stay with us, and Anthropic doesn’t train its AI on what you send.` / `Change this anytime in Account › Otto and AI. Your cookbook, cook mode, plan and shopping list work either way.` |
| **Privacy link** | Under the buttons: `More in our Privacy Policy`. It opens ottosapp.com/privacy in the system browser sheet, and opening it doesn't answer the sheet. Runna, Liven, Starling, Structured and Tesla all link their policy from the card. |
| **Buttons** | `Allow` (primary) · `Not now` (ghost). Both are stored. Tapping outside the sheet is **not** a decision: nothing is stored, nothing is sent, and the next AI action asks again. |
| **Not now** | Stored as declined. That action stops, nothing leaves the phone, and what they typed stays in the box. A toast says `Otto's AI is off. Turn it on in Account › Otto and AI.` The next AI action asks again, so the way back is one tap, and Account › Otto and AI also turns it on. Browse, cookbook, cook mode, plan and list all keep working. |
| **Background AI** | Nutrition matching (`resolve-nutrition` sends **ingredient names** to Claude) never prompts. It runs only once consent is granted. Without consent, nutrition uses the on-device table only, so a few unusual ingredients may go unmatched. |
| **Revoke** | Account › Preferences › **Otto and AI**, a switch with the caption `Ask Otto, imports and nutrition matching use Anthropic's Claude.` |
| **Voice** | No extra caption. The disclosure is iOS's own speech prompt, whose string now reads: `Apple's speech recognition turns your words into text for Otto. Your voice is processed by Apple; Otto receives only the text.` Mic: `Otto listens only while Speak is on, to write down what you say.` Apple is first-party, not third-party AI. |
| **FAQ** | "Where does my data live?" now names Anthropic, the consent, the Account path, and Apple for voice. Both "your profile" mentions now say "the Account tab". |
| **Fail-closed** | If the sheet isn't mounted, `ensureAiConsent()` returns false, so nothing is sent. |
| **Honesty rule** | Say it once, plainly. Name the company and the data, nothing vaguer. |

**Then:** build 39 → TestFlight → record the video on 39 (the sheet must appear on camera in the
Ask Otto beat) → resubmit with 39. Cost: about a day. Saves: the one rejection cycle that is
written down in advance.

> **Fastest alternative:** reply today with build 38. Honest risk: a 5.1.2(i) rejection after
> the real review starts, which is the same day of work plus another queue wait.

### Asked 2026-10-01: "Can the AI permission live in the Terms of Service instead of the app?"
**No, not on its own. Keep the in-app sheet, and put the AI section in the Terms as well.**
- Apple's rule asks for **explicit permission before** the data is shared with third-party AI.
  Accepting the Terms at sign-up is bundled consent to everything at once, so it isn't explicit
  permission for this. A reviewer reading answer #4 looks for a prompt *in the app*.
- The precedent is the same provider. GymFusion had consent in its legal text and logic, and
  was rejected eight times with *"We were not presented with the consent prompt on launch or
  anywhere else in the app."*
- Sign in with Apple users never see a Terms checkbox, so a Terms-only approach misses them
  entirely.
- **What we do instead:** the website Terms get an "AI features" section too (website ticket W5),
  so the Terms, the Privacy Policy, the FAQ and the sheet all say the same thing. The sheet stays
  as light as Runna and Liven: once, at first use, one tap.

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

## 1c. What to change in the app itself (verified against the code, 2026-10-01)

Everything below was re-checked in `src/`, `app.json` and `supabase/` today — not inherited from the
July audit. Three tiers: **Must** (do in build 39 or the review can fail on it), **Should** (cheap,
closes a real gap), **Later** (not a review blocker).

### MUST — build 39
| # | Change | Where | Why |
|---|---|---|---|
| M1 | ✅ **DONE.** **AI consent sheet + "Otto and AI" row**, built as in §1. Gated: Ask Otto Send and chips (`ChatScreen.tsx`); Import it, Draft it and Snap a photo (`AddSheet.tsx`); nutrition matching silently (`nutrition.queries.ts`). The Account switch is in `ProfileScreen.tsx` Preferences. The store key `aiConsent` is registered in `storage.ts` and `contracts/persistence.md`. | `src/shared/aiConsent*.ts`, `src/shared/ui/AiConsentHost.tsx`, the features above | 5.1.2(i): the reply names Anthropic, so the app must show it. |
| M2 | ✅ **DONE, as permission strings only.** The `app.json` mic and speech strings were rewritten (see §1 Voice). No in-app caption: iOS's own prompt carries the disclosure, and a second caption would only repeat it. Recognition stays server-side at Apple (`requiresOnDeviceRecognition` unset). | `app.json` plugins | Reviewers read permission strings. Apple is first-party, not third-party AI. |
| M3 | ✅ **DONE.** The FAQ data answer names Anthropic, the consent, Account › Otto and AI, and Apple for voice. "Your profile" now reads "the Account tab" in both places. | `src/features/profile/FaqScreen.tsx` | Policy and app agree; the tab the reply points to is **Account**. |
| M5 | ✅ **DONE — real bug found while checking M4.** In production, recipe detail read Otto's `otto_recipes`, but **cook mode, the shopping list, Otto's pick and ingredient search still looked ids up in TheMealDB**. Otto's own originals (900001 Chicken Tikka Masala, 900002 Classic Minestrone, 900003 Banana Bread) therefore could not be cooked and were dropped from the list. For every other recipe, cook mode showed TheMealDB's raw text instead of the curated record. Now there is one seed loader (`src/features/recipes/seed.loader.ts`) that detail, cook and list all read through. Otto's pick picks from `otto_recipes`, and ingredient search keeps only ids that exist there. Prod data checked: all 795 records have steps and ingredients, and the originals have 6–7 steps each. | `seed.loader.ts`, `recipe.queries.ts`, `cook.queries.ts`, `plan.queries.ts` | A reviewer who taps "Start cooking" on Banana Bread would have hit an error screen, which is 2.1(a). |
| M4 | ~~**Recipe source flag**~~ **ALREADY DONE — no change.** `EXPO_PUBLIC_USE_OTTO_RECIPES=true` is set in EAS's `production` and `preview` environments since 2026-09-24 (ROADMAP APP-3, `eas env:list`), and Supabase logs on 2026-10-01 show build 38 (`Otto/38`) reading `otto_recipes` with zero TheMealDB-proxy calls. Prod catalogue: 795 recipes, 0 missing titles, 14 categories, public read policy. Original note, kept for the record: decide before answer #6. Either add `EXPO_PUBLIC_USE_OTTO_RECIPES=true` to `eas.json` (`preview` + `production`) so the app serves Otto's own canonical catalogue (795 recipes; makes the FAQ/listing copy true), **and/or** confirm a paid TheMealDB supporter key. Photos stay hotlinked from themealdb.com either way — keep the credit. Smoke-test Discover, search, detail, related, nutrition after flipping. | `eas.json`, `src/features/recipes/canonical.transform.ts:23` | Answer #6 says you're authorized. Today release builds read TheMealDB live (`eas.json` has no flag). |

### SHOULD — same build if cheap, otherwise the one after
| # | Change | Where | Why |
|---|---|---|---|
| S1 | ✅ **ALREADY DONE (APP-7), no change.** `src/shared/imagePicker.ts` already re-encodes picks to JPEG, which strips EXIF and GPS before upload. The July audit note was stale. | `src/shared/imagePicker.ts` | — |
| S2 | **Repo privacy policy is stale** — `docs/legal/PRIVACY_POLICY.md` names Railway and has **zero** mentions of Anthropic, RevenueCat, USDA or Apple speech. The live site is the authoritative copy (per the publish ticket) but could not be fetched from this session. Replace the repo file with the live text, or delete it. | `docs/legal/PRIVACY_POLICY.md` | Nobody should audit against the wrong document; the consent sheet relies on the policy backing it. |
| S3 | **`resolved_ingredients` is readable by `anon` and never deleted** — ingredient names users type become globally readable rows (`…_resolved_ingredients.sql:17-19`) that account deletion does not touch. Change the read policy to `authenticated` (one line). **Founder call, not changed:** the anon read is a documented named exception, the table has no user column, and the client never reads it, so it is not a review blocker. | `supabase/migrations` (new) | Ingredient names are rarely personal, but a user can type anything; "anyone can read it forever" is not what the policy promises. |

### LATER — not a review blocker
- The free-gate toasts (`club.limits.ts` `blockedMessage`) name Otto Club but not the path to it; add "Account > Otto Club".
- Voice: if you ever flip to on-device recognition, rewrite the `app.json` speech string, because it says Apple processes the voice. The two must agree.
- Without consent, a user recipe's nutrition is saved from the on-device table only. If they allow AI later, recipes saved earlier keep their first estimate until edited. Fine for review; revisit if anyone notices.
- Dev only: the web target crashes at start because RevenueCat rejects the `appl_` key on web. This has no effect on iOS; noted so nobody chases it during review.
- Free-tier gating could show the consent sheet first and then the limit toast. Order today: consent, then limit. That is deliberate (consent is about data, the limit is about plan) but worth a look on TestFlight.

### CHECKED IN A BROWSER — 2026-10-01 (web build, signed-in session faked, AI calls stubbed and counted)
Screens: the consent sheet on Ask Otto and on Import it; the toast after **Not now**; the Account switch on and off; the FAQ answer; Banana Bread detail, cook mode and shopping list. Results:
- No AI request while the sheet is up, and none after **Not now**. The draft is kept, and "declined" is stored.
- The next Send asks again. **Allow** sends exactly one `generate-recipe` call and stores "granted". The Account switch stores "declined".
- Import asks too, and sends nothing on **Not now**.
- Cook mode opens Banana Bread (10 ingredients), and the list builds from it.
- Fixed from the screenshots: the Account switch captions ran into the switch, so there's now a gap. "Not now" now shows the off toast.
- Noted, not changed: Discover's **category names and cuisine list** still come from TheMealDB (`categories.php`, `list.php` through the `content` function, with the paid key). Recipes come from `otto_recipes`. The tile art is Otto's own. This is consistent with answer #6 (photos credited, catalogue is Otto's).
- Recipe pages open at 1 serving by design (a founder decision), so the nutrition ring shows one serving.

### WEBSITE — handed to the terminal: `docs/tickets/TERMINAL_TICKET_WEBSITE_REVIEW_2_1.md`
(contact address, contact form, legal-page claims, repo legal sync, and the consent copy for build 39)

### VERIFY FROM YOUR PHONE (this session cannot reach ottosapp.com)
- **ottosapp.com/privacy** names **Anthropic, RevenueCat, Supabase, USDA FoodData Central, TheMealDB, Apple speech recognition** — answers #4 and #6 say so.
- **/privacy, /terms, /support contact address is a mailbox that receives mail** (**`juandiego@ottosapp.com`** — decided in APP-12). The July audit found `hello@ottosapp.com` published on all three and **not** a real mailbox. A reviewer who emails your support address and bounces is a rejection with the evidence in hand. Website repo, not this one.
- **/terms** says 13+ and states the Otto Club price, trial, auto-renewal and cancellation.
- Demo account signs in with saved recipes, plan and list present.
- Build 39 on TestFlight (the UI was not run in this session, so check it there):
  1. The consent sheet appears on the first Send, and also on Import it, Draft it and Snap a photo (before the camera opens).
  2. **Not now** stops the action and leaves Discover, Cookbook, Plan and List working.
  3. Tapping outside the sheet asks again next time.
  4. The Account › Otto and AI switch turns it on and off.
  5. **Discover → search "Banana Bread" → Start cooking** works, and adding it to the plan puts its ingredients on the list (the M5 fix).
  6. The iOS speech prompt shows the new string.

### NO CHANGE NEEDED — verified today
- Paywall carries every 3.1.2 element: titles, periods, prices, trial, auto-renew line, working Terms + Privacy links, Restore (`OttoClubScreen.tsx`).
- Account deletion is real and complete: two-tap in Account → `admin_delete_user_data` (favorites, recipes, plan entries, shares; kitchens and memberships cascade from the auth user) → storage photos paged and removed → RevenueCat subscriber deleted → auth user last. Fixed 2026-09-24 after a production 500.
- Permission strings are honest and specific (camera, photos, mic, speech) — `app.json` plugins.
- Privacy manifest = the published App Privacy label: Email, Name, User ID, Device ID, Purchase History, Photos/Videos, Other User Content; tracking **false**.
- Export compliance declared; screenshots don't lead with sign-in; `app.json` 1.0.19 = ASC.
- Published contact routes exist: support page + in-app "Report a bug" / "Send a thought" (mailto).
- No in-app browser: YouTube embed + system browser sheet only.

## 2. The rest of the gate — do before recording

| # | Check | Status | What to do |
|---|---|---|---|
| 1 | **TheMealDB photos** (answer #6 credits them) | ⚠️ Photos only | The catalogue is Otto's own (build 38 reads `otto_recipes`; verified in logs 2026-10-01), so no TheMealDB API key is used by the app. But 792/795 photos are still hotlinked from `themealdb.com`. Answer #6 now says only that the photos come from TheMealDB and are credited — true today. The open IP exposure is the hotlinked photos themselves (re-host or replace; a separate, non-review task). |
| 2 | **Demo account** | ✅ Verified 2026-09-29 | Re-check on a phone the day you record: sign out → `claude-e2e-a@example.com` → saved recipes, week plan and shopping list present. Password lives only in the ASC field. |
| 3 | **"Account", not "Profile"** | ⚠️ Current ASC notes wrong | The tab is **Account**. The notes in ASC say "Profile > …". Replace with §4 text. |
| 4 | **Screenshots don't lead with sign-in** (2.3.3) | ✅ | First shot is "Bring in a recipe". A reviewer on this same request flagged another app for exactly this. |
| 5 | **Version drift** | ✅ | `app.json` 1.0.19 = ASC 1.0.19. |
| 6 | **Paywall shows everything** (3.1.2 / Schedule 2) | ✅ build 38+ | Title, period, price, 1-week trial, auto-renew line, working **Terms** and **Privacy** links, **Restore** — all on `OttoClubScreen`. Listing has Terms link + renewal terms. Linger on this screen in the video. |
| 7 | **Free limits are visible to the reviewer** (2.1(b)) | ✅ by stating it | Free tier: 5 imports/month, 25 saved recipes, 5 asks/day. Answer #7 says so, so the gate reads as designed, not broken. |
| 8 | **A sandbox purchase has never completed** (2.1(b), 3.1.1) | ⏳ Covered by shot 4 of the recording | `memberships` has **0 rows** (checked 2026-10-01), and APP-4 is still open. Reviewers buy Otto Club with a sandbox account during review; a purchase that errors, or goes through without unlocking the Club, is one of the most common IAP rejections. On build 39 from TestFlight: Settings → App Store → Sandbox Account (create one in ASC → Users and Access → Sandbox if needed) → Account › Otto Club → Start free trial → confirm the Club unlocks → kill and relaunch → still unlocked → Restore works. Then check that RevenueCat → Customers shows the purchase and a `memberships` row exists. If the row doesn't land, the webhook is broken: fix it before resubmitting. |

---

## 3. The screen recording — script

**Setup (5 min):** physical iPhone on the **latest iOS**. Install **build 39** from TestFlight
(the Otto Insiders invite; the terminal ticket puts it there). Turn on **Do Not Disturb**. Delete
Otto first if it's installed, so the consent sheet and first-run screens appear. Then Control
Center → Screen Recording (mic off is fine; narration is optional). One continuous take is ideal;
two takes stitched are acceptable. Target **5–6 minutes**. You use **two accounts**: a throwaway
you create on camera, subscribe and then delete, and the demo account for the walkthrough.

**This take is also the purchase test (APP-4).** Purchases in a TestFlight build are sandbox
purchases: Apple's sheet says so, and **nothing is charged**. Buying Otto Club on the throwaway
account proves the purchase works end to end, shows Apple the whole subscription flow, and then
shows account deletion telling a subscriber how to cancel. Do it on the **throwaway**, never on the
demo account, so the reviewer can still buy it themselves.

> **Read-aloud overview (if you narrate, say this at the start — or paste it as the first line of
> the reply):**
> "This is Otto, a cookbook and weekly meal planner for home cooks, recorded on a physical iPhone
> running the current iOS. I'll start from the Home Screen, create an account, subscribe to Otto
> Club, and then delete the account. Then I'll sign in with the demo account and walk through the
> main features: discovering and cooking a recipe, asking Otto to write one (including the AI
> consent prompt), importing a recipe from a link, and planning the week into a shopping list."

| # | Time | On screen — do exactly this | Why Apple wants it |
|---|---|---|---|
| 1 | 0:00 | Home Screen → tap the **Otto** icon. Let the splash finish. | "must begin with launching the app" |
| 2 | 0:10 | Onboarding: swipe the 3 cards → **Start cooking** | first-run flow |
| 3 | 0:25 | **Sign up** with a throwaway email + password → land on Discover | account registration |
| 4 | 0:45 | **Account** → **Otto Club**: hold 3 s on the plans (**Monthly $4.99 / Yearly $39.99**, 1-week free trial, "then … /year", auto-renews) → tap **Terms** (page opens) → back → tap **Privacy** → back → point at **Restore purchases** (don't tap) → **Start free trial** → Apple's sheet (shows "Sandbox", no charge) → confirm → Otto shows you're in the Club. **If it doesn't unlock within ~10 s, stop and tell Claude**, because the purchase test failed. | subscription: title, length, price, trial, renewal, Terms of Use + Privacy links, Restore, a working purchase |
| 5 | 1:40 | **Account** → scroll to the bottom → **Delete my account** → the note appears ("Apple bills it… cancel it there too", **Manage subscription**); hold 2 s → tap again → back at sign-in | account deletion (5.1.1(v)), including the subscription notice. Never on the demo account. |
| 6 | 2:00 | **Sign in** with the demo account | login flow |
| 7 | 2:15 | **Discover**: scroll the categories → open a recipe → tap the serving **+** once (quantities change) → scroll to the nutrition card → **Start cooking** → swipe through 2 steps → back out | core: browse, scale, nutrition estimate, cook mode |
| 8 | 2:55 | **Create (＋)**: type *"a quick tomato pasta for two"* → Send → **the AI consent sheet appears; hold 3 s so Anthropic, the data and the Privacy Policy link can be read → tap Allow** → Otto writes the recipe → **Save to cookbook** → review editor → Save | AI feature **and** the 5.1.2(i) consent on camera |
| 9 | 3:40 | Still on Create: tap **Speak** once → iOS mic/speech prompts (pause on them; the speech prompt says Apple processes the voice) → Allow → say "pancakes" → stop | voice input disclosure |
| 10 | 3:55 | Create → **import icon** (top) → **Paste a link** → paste `https://www.bbcgoodfood.com/recipes/easy-pancakes` → **Import it** → review → Save | import flow, review-before-save |
| 11 | 4:25 | **Cookbook** tab: show the two saved recipes | |
| 12 | 4:35 | **Plan** tab: drop a recipe on a day → open the **shopping list** → check one item off | plan → list |
| 13 | 4:55 | **Account** → **Our shared list**: show the invite code and the **Leave this kitchen** button (don't tap) | user content is invite-only; members control membership |
| 14 | 5:10 | **Account** → **Otto and AI** row: show the switch (don't change it) | consent is revocable |
| 15 | 5:20 | Stop recording. | |

After recording: the TestFlight subscription stays on your Apple ID and renews in sandbox at no
cost. Cancel it anytime in Settings › your name › Subscriptions; it doesn't matter for review.

**Deliver — your only step:** AirDrop the recording to the Mac and save it as
`~/Desktop/otto-review-1.0.19.mov`, then tell either session "video ready". Nothing else. The
terminal ticket `TERMINAL_TICKET_RESUBMIT_2_1.md` takes it from there: it compresses the video,
attaches it and hosts a link, fills in the reply, posts it and resubmits.

---

## 4. The reply — paste into the App Review message AND into App Review Information → Notes

Plain text; ASC renders no markdown. Fill the `[brackets]`. Measured **under 4,000 characters**
(the Notes limit). The same text goes in both places so future submissions inherit it.

```
Answers below; the same text is in the Notes.

1. SCREEN RECORDING
[LINK or "attached"]. iPhone [model], iOS [version], build 1.0.19 (39). Starts at launch; shows registration, the Otto Club screen (plan names, lengths, prices, trial, auto-renewal terms, Terms of Use and Privacy links, Restore) and a sandbox purchase, account deletion, sign-in, the main features and the AI consent prompt.

2. PURPOSE AND AUDIENCE
Otto is a personal cookbook and weekly meal planner for home cooks (13+). Recipes end up scattered across websites, videos and screenshots, and people still have to decide what to cook and buy. Otto keeps recipes in one place, cooks them step by step with scaling quantities, turns the week's plan into an aisle-grouped shopping list, and estimates nutrition per serving. No ads, no public feed, no tracking.

3. SETUP AND ACCESS
An account is required. Please use the demo account in the Demo Account fields; it has saved recipes, a week plan and a shopping list. New accounts: email/password or Sign in with Apple.
- Discover: browse and search; a recipe shows ingredients, steps and a nutrition estimate; Start cooking opens cook mode.
- Create (the + tab): ask Otto for a recipe or a cooking question, typed or by voice. First use shows a consent prompt naming Anthropic; it can be switched off in Account > Otto and AI. The import icon at the top brings in an existing recipe: paste a link (e.g. https://www.bbcgoodfood.com/recipes/easy-pancakes), paste text, or photograph a recipe card. Every import and AI recipe opens in an editor for review before saving.
- Cookbook: saved and imported recipes.
- Plan: recipes on days; the shopping list builds from it.
- Account: Otto Club, Our shared list, Otto and AI, preferences, Delete my account.
User content: users write their own recipes and share a list only with people they invite by code, or by private link. Nothing is public: no feed, profiles, comments or discovery of other users. Members can leave a shared list anytime (Account > Our shared list > Leave this kitchen). Contact: juandiego@ottosapp.com.
Web: no in-app browser; YouTube videos play embedded, source links open in the system browser sheet.

4. EXTERNAL SERVICES
- Supabase: authentication (email/password), database, file storage, server functions.
- Sign in with Apple.
- Anthropic (Claude API), called from our server after in-app consent: writes recipes and chat replies, reads imported links, text and photos, matches ingredients to nutrition data. It receives only what the user submits to that feature.
- Apple speech recognition: voice input is transcribed by Apple; Otto receives the text only.
- Apple In-App Purchase, managed with RevenueCat: subscriptions.
- USDA FoodData Central: nutrition reference data.
- TheMealDB: most recipe photos (the catalogue is Otto's own).
- YouTube: embedded recipe videos.
- Pasted links: our server fetches that page or caption.

5. REGIONS
Features and content are identical in every territory. The interface is English; the App Store shows local prices.

6. REGULATION AND THIRD-PARTY MATERIAL
Not a regulated industry. Nutrition figures are estimates from USDA FoodData Central (public domain); the app says so, and that AI recipes are suggestions, not dietary or medical advice. The recipe catalogue is Otto's own database; most photographs come from TheMealDB, credited in the description, Terms and Privacy Policy. Imported recipes stay private to the user, with the creator's name and a permanent source link.

7. IN-APP PURCHASES
Subscription group Otto Club: Monthly $4.99/month and Yearly $39.99/year, auto-renewable, each with a 1-week free trial. Free accounts get 5 imports a month, 25 saved recipes and 5 asks a day; the Club lifts those limits. Cookbook, cook mode, plan and list stay free. Purchase: Account > Otto Club > choose a plan > Start free trial. Restore, Terms of Use and Privacy Policy are on that screen.
```

If you keep build 38 instead, delete the two consent sentences in #3 and #4 and change "(39)"
to "(38)" — never describe a prompt the build doesn't show.

---

## 5. Send and resubmit (App Store Connect)

> **Who does what (decided 2026-10-01):** Juan records the video, and that's his only step. The
> terminal does everything else: `docs/tickets/TERMINAL_TICKET_BUILD_39.md` (build, TestFlight,
> attach 39, website W1–W4), then `docs/tickets/TERMINAL_TICKET_RESUBMIT_2_1.md` once the video
> exists (check it, host it, reply, Notes, website W5, resubmit). The steps below are the reference.

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
- Don't describe the recipe catalogue as TheMealDB's — it is Otto's own; only most photos are TheMealDB's.
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
