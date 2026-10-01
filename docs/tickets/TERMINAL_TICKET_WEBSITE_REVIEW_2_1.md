# Terminal ticket: website fixes for the App Review 2.1 resubmission

> For a Claude Code terminal session with the **ottosapp.com website repo** checked out (Next.js,
> deployed on Vercel). Written 2026-10-01 by the cloud session, which cannot reach ottosapp.com
> (egress-blocked) or the website repo. Read the whole ticket first. Work top to bottom, verify each
> step against the **live** site after deploy, and log what happened at the bottom.

## Why this exists

Apple returned 1.0.19 (build 38) with a Guideline 2.1 *Information Needed* request (demo video +
seven written answers). Full context: `docs/release/APP_REVIEW_2.1_RESPONSE.md` in the app repo.
The reviewer will read our answers, then open our Privacy Policy, Terms and Support pages and may
email the address printed there. **Build 39 adds an in-app AI consent sheet** (Guideline 5.1.2(i))
and the legal pages must describe exactly what that build does. App, answers and website must say
the same thing — a mismatch is a rejection.

**Order:** do W1–W4 now. Prepare W5 on a branch now and deploy it in step R6 of
`TERMINAL_TICKET_RESUBMIT_2_1.md` (the same day build 39 is submitted), because the live site must
never describe behaviour the build under review lacks. Build 39 (consent sheet, Privacy Policy link,
no-training line) is built by `TERMINAL_TICKET_BUILD_39.md`.

## W1. Contact address — P0, 10 min

The decided address is **`juandiego@ottosapp.com`** (ROADMAP APP-12, 2026-09-24). The July privacy
audit found **`hello@ottosapp.com`** printed on `/support`, Terms §2 and §19, and the Privacy
Policy's Contact section; `hello@` is **not** a real mailbox. WEB-5 fixed some copy since; confirm
nothing else survived.

1. `grep -rn "hello@\|support@\|info@" .` across the website repo (pages, `legal/`, components,
   `llms.txt`, metadata). Every user-facing contact address → `juandiego@ottosapp.com`.
   `noreply@` stays transactional-only, never printed as a contact.
2. Deploy, then open `/support`, `/terms`, `/privacy` live and read each contact line.
3. **WEB-2:** send a test email from an outside account to `juandiego@ottosapp.com` and confirm it
   arrives. Ask Juan to do this if no outside account is available. Log the result.

**Done when:** the only contact address on all three live pages is `juandiego@ottosapp.com`, and a
test email to it arrived.

## W2. Contact form must not fake success — P1 (ROADMAP WEB-3)

Without `RESEND_API_KEY` and `CONTACT_TO_EMAIL` on Vercel, a contact-form message is only logged
while the sender sees "sent". A reviewer who uses it gets a false confirmation. **Juan decides:**
add the two env vars (needs a Resend account), or replace the form with a `mailto:juandiego@ottosapp.com`
link. If no decision today, do the mailto swap — it is honest and reversible. Verify live.

## W3. Dead-link and claims pass — P0, 15 min

Open live, as a logged-out browser, and click every link:
- `/privacy`, `/terms`, `/support` all 200, real content.
- From `/terms`: Otto Club price **$4.99/month and $39.99/year**, **1-week free trial**,
  auto-renews unless cancelled at least 24 hours before the period ends, how to cancel (App Store
  account settings), minimum age **13+**.
- From `/privacy`, confirm it names every recipient in the app's answer #4: **Anthropic, RevenueCat,
  Supabase, USDA FoodData Central, TheMealDB, Apple (speech recognition), YouTube (embedded
  videos)**. LEG-2 (done) added Anthropic, RevenueCat, USDA and voice input — check the voice
  section says the **audio is processed by Apple's speech service and Otto receives only the text**
  (that is what the app does: `src/features/chat/useSpeechInput.ts`, `requiresOnDeviceRecognition`
  unset). Fix any gap.
- Credit line "Recipe data and photography from TheMealDB" still present (keep it — the photos are
  hotlinked from themealdb.com regardless of which catalogue the app serves).

## W4. Sync the app repo's stale legal copy — P1, 5 min

The app repo's `docs/legal/PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` are pre-LEG-2 drafts (names
Railway, no AI section). The website repo's `legal/` is authoritative. Copy the website's current
`legal/PRIVACY_POLICY.md` and `legal/TERMS_OF_SERVICE.md` over the app repo's files (and the
`.html` renders if they are generated from them), add a one-line header in each:
`> Mirror of the ottosapp.com website repo's legal/<file>, synced <date>. Edit there, not here.`
Commit to the app repo's `main` with the session's attribution lines.

## W5. Describe the build-39 AI consent — P0, ships when build 39 is confirmed

Add to the Privacy Policy's AI section (adapt to its voice; keep the facts):

> **Asking before AI is used.** The first time you use one of Otto's AI features (Ask Otto, importing
> a recipe from a link, pasted text or a photo), Otto shows you what will be sent and to whom, and
> asks your permission. If you choose "Not now", nothing is sent, the AI features stay off and the
> rest of Otto works as usual. You can change your choice any time in the app under
> **Account > Otto and AI**.
>
> **What is sent.** Only the content you give that feature: the words you type, the link, text or
> photo you share, and the ingredient names in your recipes (used to match them to nutrition data).
> It is sent through our server to Anthropic, the company that makes the Claude AI model, to produce
> the answer. Your email, name and the rest of your account are not sent with it. Under Anthropic's commercial terms, Anthropic does not use what Otto sends to train its models. Ingredient names
> are only sent after you allow it. Until then, nutrition is estimated from Otto's built-in table.

The app's own wording is in `src/shared/aiConsent.logic.ts` (`AI_CONSENT_COPY`). If the site and
the app ever differ, change the site to match the app.

Add to the **Terms of Service** a short "AI features" section with the same facts (who
processes it: Anthropic; what is sent; that it only happens after the user allows it in the app;
that it can be switched off in Account > Otto and AI; that AI recipes and nutrition are suggestions
and estimates, not dietary or medical advice). This complements the in-app prompt; **it does not
replace it**. Apple requires explicit in-app permission (see `docs/release/APP_REVIEW_2.1_RESPONSE.md`
§1, "Asked 2026-10-01").

Also, on `/support` (the FAQ), add or update a "Does Otto use AI?" answer with the same two facts
and the Account > Otto and AI path.

**Done when:** the live Privacy Policy (which the app's consent sheet now links to directly) and the Support page describe the consent, the toggle and the no-training point, using
the same words the app uses ("Otto and AI", "Not now"), and the build-39 behaviour on TestFlight
matches the text.

## Don'ts
- Don't change prices, trial length, the minimum age, or the TheMealDB credit.
- Don't describe the consent sheet on the live site before build 39 is confirmed — the live site
  must never claim behaviour the shipped build lacks. (W5 copy can be prepared on a branch.)
- Don't use `support@` or `hello@` anywhere; the decision is `juandiego@ottosapp.com`.
- No counsel-level rewrites of the Terms (that's LEG-6, a founder decision).

## After finishing
- Log each step below with date, commit hash and what the live page shows.
- Update `docs/tickets/ROADMAP.md` in the app repo: WEB-2, WEB-3 status; add a row for this ticket.
- Commit with the session's attribution lines and push to `main`.

## Log
<!-- append: date, step, result, commit, live-page check -->
