# TICKET — publish Otto on the App Store

> STATUS: open — cut from cloud 2026-09-11. **This is the only live ticket.** Everything else
> was archived to `docs/history/` on the founder's call: "the only thing we carry is publishing."
>
> Nothing in here is hygiene, backlog, or polish. Every item is something Apple blocks on, or
> something that makes a rejection likely. If an item can be done after Otto is live, it is not
> in this file.
>
> Evidence and reasoning for items already closed live in the archived
> `docs/history/TERMINAL_TICKET_RELEASE_READINESS.md` and `…_SUBMISSION.md`. This ticket does not
> repeat them.

**Reality check on "today":** Apple's review is **24–48h for most apps, 2–5 days for a brand-new
app**, and roughly **40% of first submissions are rejected** — usually for a broken link, missing
metadata, or a reviewer who cannot sign in. So the goal today is **submitted tonight, complete
and correct on the first try**. Live is Apple's clock, not ours.

---

## STEP 0 — the one decision, 2 minutes `[everything branches here]`

Open → https://appstoreconnect.apple.com/business and read the **Paid Applications Agreement** status.

| | **Path A — ship free (RECOMMENDED)** | **Path B — ship with Otto Club** |
|---|---|---|
| When | Agreement is *not* Active, or you want out today | Agreement already says **Active** |
| Code | `T1` turns the three free-tier gates OFF and hides the Club door | `T2` swaps the RevenueCat key |
| Console | Skip F7–F9 entirely | F7, F8, F9 required (+24–48h if the agreement isn't Active) |
| Risk | **Zero IAP surface = zero IAP rejection risk** | A product mis-set is a rejection |
| Club ships | v1.0.19, days later, to users you already have | v1 |

**Why A is recommended.** The free tier is currently *enforced* (`club.limits.ts`: 5 imports/mo,
25 saves, 5 asks/day) while the paywall renders "Otto Club opens soon" — no purchase possible.
A reviewer who asks Otto six questions hits a wall with no way through. **That is a Guideline 2.1
rejection, and it is live in the build today.** Path A removes the wall. Path B opens the door.
Shipping as-is does neither and is the one outcome to avoid.

- [ ] **Path chosen:** ☐ A ☐ B — write it here, then follow only that column below.

---

## F — founder, in a console

### F1. EU trader status `[NEW since the last ticket — required]`
Apple asks every developer to declare trader status under the EU Digital Services Act. You will be
asked at submission; undeclared apps are not distributed in the EU.
→ App Store Connect → **Business** → *Digital Services Act* → declare trader / non-trader and
complete the address + contact fields it asks for.

### F2. Age rating — the NEW questionnaire `[required since 31 Jan 2026]`
The old "4+ and done" flow is gone; the system now runs 4+ / 9+ / 13+ / 16+ / 18+ with new
sensitive-content questions. Answer them fresh — a stale rating blocks submission.
→ App Store Connect → Otto → **Age Rating** → Edit.
Otto's honest answers: no violence, no mature themes, no gambling. **Do declare** that the app
contains user-generated content (recipes people write and share by link) and links to the web.
Expected outcome **4+**. If a UGC answer pushes it higher, take the higher rating — do not
re-answer to get the number you want.

### F3. App Privacy label `[10 min]`
Source of truth is `docs/legal/APP_PRIVACY_TRUTH_TABLE.md`; the shipping privacy manifest declares
the same seven. Every mismatch is a rejection waiting.
→ App Store Connect → Otto → **App Privacy**
```
Data Used to Track You:  NONE
Data Linked to You:      Email Address · Name · User ID · Device ID ·
                         Purchase History · Photos or Videos · Other User Content
Purpose for all seven:   App Functionality
Diagnostics:             DO NOT tick — no crash SDK ships in this build
```

### F4. Store metadata `[30 min]`
Copy is drafted and character-counted in `docs/release/STORE_METADATA.md` — paste it.
```
Name:          Otto: Recipes & Meal Plans      Subtitle: A quieter kind of cookbook
Category:      Food & Drink
Support URL:   https://ottosapp.com/support
Marketing URL: https://ottosapp.com
Privacy URL:   https://ottosapp.com/privacy
```
Open all three URLs in a browser before you paste them. A dead link is the single most common
first-submission rejection, and the reviewer *will* click them.

### F5. Screenshots `[upload what T5 produces]`
**Only the 6.9" iPhone set is required in 2026** (1320×2868 or 1290×2796) — Apple auto-scales it to
every smaller iPhone. Ignore the 6.5" set; the old ticket's "6.9 and 6.5" is out of date. iPad is
not a question: the app is iPhone-only (`supportsTablet: false`).

### F6. App Review notes + demo account `[after T4 — the highest-value 5 minutes here]`
Otto sends signed-out users straight to sign-in, so **a reviewer who cannot log in files a 2.1
automatically.** In the notes field: the demo credentials from T4, three lines on what to try
(open a recipe → cook a step → build a shopping list), and — Path B only — how to reach the paywall.

### F7–F9. **Path B only** — the membership
- **F7.** Paid Applications Agreement signed and **Active** (only the Account Holder,
  jdmaxinius@gmail.com, can sign) + Bank Account + Tax forms.
- **F8.** Subscriptions → group **Otto Club**, two products at exactly the prices the app and the
  website both print: `otto.club.monthly` **$4.99/mo** · `otto.club.yearly` **$34.99/yr**,
  introductory offer **5-day free trial on both, new subscribers**. Localized display name +
  description on both. **Attach a review screenshot of the paywall** — Apple rejects a product
  without one.
- **F9.** RevenueCat → upload the In-App Purchase key `SubscriptionKey_HTA6549CWG.p8`, import both
  products, entitlement identifier exactly **`club`**, both products in an Offering marked
  **Current**. Copy the public `appl_…` SDK key and hand it to the terminal for **T2**.

---

## T — terminal: code, build, submit

### T1. **Path A only** — close the paywall cleanly `[one packet]`
One flag, two effects: the three `FREE_LIMITS` gates stop blocking (`useClubGate.ts`,
`useSaved.ts`), and the Otto Club row in `ProfileScreen.tsx:205-226` is hidden. v1 is then simply a
free app with no in-app purchase — nothing to mis-declare, nothing to reject. Leave
`club.purchases.ts`, `OttoClubScreen` and the entitlement plumbing in place, unreferenced, so
1.0.19 is a flag flip plus the key swap. Crew: **builder → critic (REFUTER) → verifier**.

### T2. **Path B only** — swap the RevenueCat key `[one line]`
`club.purchases.ts:16` `test_oSJcFKqwFPgFgcamzVtQcfdrYrV` → the `appl_…` key from F9. `RC_TEST_STORE`
derives from the prefix, so the paywall's "you'd be charged" flips to "you'll" on its own. Then
make one **real sandbox purchase** and confirm the `club` entitlement unlocks before submitting.

### T3. Serve recipes from Otto's own database `[makes the app's copy true]`
`EXPO_PUBLIC_USE_OTTO_RECIPES` exists only in `.env.development` and defaults **off**
(`canonical.transform.ts:23`), so release builds still query TheMealDB live — while the app's FAQ
and copy now say "Otto's own recipe database." Add the env to `eas.json` for `preview` and
`production`, then smoke-test Discover, search, detail, related and nutrition against the new path.
Data is ready: 795 canonical records, 8,212 ingredient rows, `missing_name: 0`.

### T4. Demo account for review
A stable account that is **not** the founder's, seeded with a few saved recipes, a week plan and a
shopping list so the reviewed app is not a row of empty states. Put the account in this ticket's
Log; never the password.

### T5. Screenshots at 6.9"
Six frames max, showing the app doing its job — Discover, a recipe, cook mode, the shopping list,
Ask Otto. Caption copy is already drafted in `STORE_METADATA.md`. No mockup frames that show a
feature Otto does not have; a misleading screenshot is its own rejection reason.

### T6. **Build 37 — mandatory, this is not optional** `[gates the submit]`
Verified with `git merge-base`: commit `54ffe886` (iPhone-only + the privacy manifest) is **NOT** an
ancestor of `dffabf67` (build 36). **Build 36 would ship as an iPad-supporting app with no declared
privacy manifest.** Bump `expo.version` and `ios.buildNumber` together, prebuild, build, upload.
(The Xcode 26 / iOS 26 SDK floor that took effect 28 Apr 2026 is already satisfied — build 36
uploaded after it.)

### T7. Submit
`eas submit --platform ios --profile production` (`appleTeamId A6J6HGNWZK`,
`ascAppId 6792195637`), then in App Store Connect attach build 37, complete F1–F6, and
**Submit for Review**. Release option: *Automatically release after review* — phased release is for
updates, not a first listing.

---

## Deliberately dropped — not before launch

Each of these was a live ticket item this morning. None of them blocks Apple, so none of them is
in the way today. Archived reasoning in `docs/history/`.

| Dropped | Why it can wait |
|---|---|
| Sentry / crash reporting | Was gating an external beta; no beta, no gate. Costs a native rebuild we do not have time for. Add in 1.0.19 — then, and only then, tick **Diagnostics** on the privacy label. |
| Supabase leaked-password protection, function secrets, key hygiene | Founder call 2026-09-11: single-operator app, not an Apple requirement. |
| Website contact-form delivery | Not Apple-checked. The support **email** is checked — that is the 2-minute test in F4's URL pass. |
| Server-side free-tier enforcement | Cost exposure, not a launch blocker — and under Path A there is no tier to enforce. |
| EXIF/GPS strip test | Real privacy-label truth item; do it in the first week. Low risk on a 4+ recipe app. |
| Contrast, hitSlop, Dynamic Type sweep | Quality, not compliance. Nothing here fails review. |
| Delight/motion phases, Rive, Bagged navigation, recipe-DB expansion, AI cost diet | Product work. Not publishing. |
| Website store badges + Smart App Banner | Needs the App Store ID, which **only exists after approval**. Listing-day work by definition. |

---

## Honest risks we are choosing to carry

1. **792 of 795 recipe photographs are hotlinked from `themealdb.com`.** The recipe text is Otto's;
   the photographs are not, and they are served from someone else's CDN. App Review will not catch
   this. It stays a real IP exposure until re-hosted or replaced. **Mitigation we are keeping:** the
   website and both legal documents still carry the "Recipe data and photography from TheMealDB"
   credit — those pages are factually correct and **must not be edited** to match the app's copy.
2. **No crash telemetry in v1.** If something crashes for real users in week one, we find out from
   reviews, not from a dashboard. Accepted to ship today.
3. **~40% of first submissions get rejected.** The three that actually bite us are covered — demo
   account (F6/T4), dead links (F4), privacy-label mismatch (F3). A rejection is a resubmit, not a
   restart.

## Done when

- [ ] Path chosen and its column complete
- [ ] F1 trader status declared · F2 new age rating answered · F3 label matches the manifest
- [ ] All three URLs opened and confirmed live, and the support mailbox receives from outside
- [ ] Build **37** uploaded (not 36), with iPhone-only + privacy manifest actually in it
- [ ] Demo account works from a signed-out device, credentials in the review notes
- [ ] **Submitted for Review**, with the date and the build number written in the Log below

## Log

<!-- append: date, what happened, Apple's response. This is the only thread that matters now. -->
