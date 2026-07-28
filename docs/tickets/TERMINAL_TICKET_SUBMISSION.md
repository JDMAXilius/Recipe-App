# TICKET — everything left before Otto is on the App Store

> Cut 2026-07-28 from a full audit of both repos (`Recipe-App` + `Otto_Website`). This is the
> **work list**, split by who can actually do each item. The reasoning, the evidence and the
> audit trail live in `TERMINAL_TICKET_RELEASE_READINESS.md` — this file does not repeat them,
> it links to them. Otto Club go-live detail: `OTTO_CLUB_GOLIVE.md`.
>
> **Owners:** **[You]** = founder, in a console, nobody else can do it · **[Terminal]** = code,
> build or device work · **[Decide]** = a call only you can make, blocking someone else.
>
> Ordering law: **F1 gates every paid item.** T1/T2 gate the honesty of the store listing.
> Everything else runs in parallel.

---

## Landed 2026-07-28 — do not re-do

| Done | Where |
|---|---|
| iPhone-only (`supportsTablet: false`) | `app.json` |
| Privacy manifest, 7 collected data types from the truth table | `app.json` → `ios.privacyManifests` |
| Support mailbox unified on `juandiego@ottosapp.com` | app + website + both legal docs |
| Otto Club price aligned to **$34.99/yr · $4.99/mo** | website (was advertising $45/yr) |
| **Free-tier gating** — 5 imports/mo, 25-recipe shelf, 5 asks/day | `club.limits.ts` + 3 enforcement points |
| Health + AI disclaimers (nutrition card, AI review screen, FAQ) | app |
| App never names TheMealDB — "Otto's own recipe database" | app copy |

**Both `app.json` changes are inert until the next prebuild.** Build 36 has neither.

---

## F — [You] console work

### F1. Paid Applications Agreement + banking + tax `[blocks F2, F3, T3 — do it first]`
Only the Account Holder (jdmaxinius@gmail.com) can sign. Nothing charges until it says **Active**;
allow 24–48h, longer if banking needs verifying.
→ https://appstoreconnect.apple.com/business
Sign the agreement, then complete **Bank Account** and **Tax Forms** (US W-9 minimum).

### F2. Subscription products `[after F1 is Active]`
→ https://appstoreconnect.apple.com/apps → Otto → **Monetization → Subscriptions**
One group, two products, **at exactly these prices — the app and the website both say them out
loud now**:

```
Group reference name: Otto Club
otto.club.monthly    $4.99 / month
otto.club.yearly     $34.99 / year
Introductory offer:  Free trial, 5 days, BOTH products, new subscribers
Localization (both): display name "Otto Club" + what it unlocks
Review screenshot:   the paywall — Apple rejects a product without one
```

### F3. Connect RevenueCat `[after F2]`
→ https://app.revenuecat.com/projects/proj68c735d9
Upload the In-App Purchase key `SubscriptionKey_HTA6549CWG.p8` (Key ID `HTA6549CWG`, in
`~/Downloads`) · import both products · attach them to an entitlement whose identifier is exactly
**`club`** · put both in an Offering marked **Current** · copy the public **`appl_`** SDK key and
hand it to the terminal for **T3**.

### F4. Supabase function secrets `[2 min, independent]`
Without these the RevenueCat webhook rejects every event and `memberships` never syncs.
→ https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/settings/functions

```
RC_WEBHOOK_SECRET=6b7978fdb54ba6333bf32285c57612a1ac4068eb051dc47f
REVENUECAT_SECRET_KEY=<the sk_… key from RevenueCat → API keys>
```

### F5. Leaked-password protection `[2 min, open since 2026-07-25]`
→ https://supabase.com/dashboard/project/mepzfdefanfpnrvydyty/auth/providers
**Email** → **Prevent use of leaked passwords** → ON → Save.

### F6. Contact form delivery `[5 min]`
`lib/contact.ts` currently logs a submission and drops it — the sender still sees a thank-you.
Resend has only `juandlugo.com` verified, so **From** uses that domain, **To** is the Otto mailbox.
→ Vercel → Otto_Website → **Settings → Environment Variables** → Production:

```
RESEND_API_KEY=<https://resend.com/api-keys>
CONTACT_TO_EMAIL=juandiego@ottosapp.com
CONTACT_FROM_EMAIL=Otto Website <otto@juandlugo.com>
```
Redeploy, then send yourself one message through https://ottosapp.com/contact.

### F7. Prove the support mailbox receives `[2 min]`
Email `juandiego@ottosapp.com` from an outside address and confirm it lands. It is printed in the
app, on `/support`, on `/careers` and in both legal documents — a reviewer who bounces off it
files a rejection.

### F8. App Privacy label `[10 min]`
Input is `docs/legal/APP_PRIVACY_TRUTH_TABLE.md`; the manifest shipped 2026-07-28 declares the
same seven. Every mismatch is a rejection waiting.
→ App Store Connect → Otto → **App Privacy**

```
Data Used to Track You:  NONE
Data Linked to You:      Email Address · Name · User ID · Device ID ·
                         Purchase History · Photos or Videos · Other User Content
Purpose for all seven:   App Functionality
Diagnostics:             DO NOT tick until Sentry actually ships (T4)
```

### F9. Age rating + store metadata `[30 min]`
Copy is drafted and measured in `docs/release/STORE_METADATA.md` — name, subtitle, keywords,
promotional text, description. Paste it, then:

```
Age rating:    4+ (declare user-generated content + links to the web)
Category:      Food & Drink
Support URL:   https://ottosapp.com/support
Marketing URL: https://ottosapp.com
Privacy URL:   https://ottosapp.com/privacy
```

### F10. App Review notes `[after T5]`
Demo account credentials, a three-line walkthrough, and how to reach the paywall. A reviewer who
cannot sign in files a 2.1 — Otto sends signed-out users straight to sign-in.

---

## T — [Terminal] code, build and device work

### T1. Put release builds on Otto's own database `[gates the copy being true]`
`EXPO_PUBLIC_USE_OTTO_RECIPES` lives only in `.env.development`; the flag defaults OFF
(`canonical.transform.ts:23`), so **preview and production builds still query TheMealDB live**
through the `content` edge function — while the FAQ now describes Otto's own database. Data is
ready: 795 canonical records, 8,212 ingredient rows, `missing_name: 0`, 42 ingredients (0.5%)
without a USDA key. Add the env to `eas.json` for `preview` + `production`, build, and smoke-test
Discover, search, detail, related and nutrition against the new path.

### T2. The images `[the real content-rights item]`
**792 of 795 `otto_recipes` records hotlink their photograph from `themealdb.com`;
`media.image_storage_path` is null on all 795.** The recipe text is Otto's, the photographs are
not, and they are served from someone else's CDN inside a paid app. Pick one:
(a) log the Phase 0 terms answer in `TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md` confirming
hotlinking without attribution is permitted, (b) re-host with whatever attribution the terms
require, or (c) replace them with Otto's own. **Until this closes, the website keeps its
"Recipe data and photography from TheMealDB" credit and both legal documents keep naming them —
those pages are still factually correct and must not be edited to match the app's new copy.**

### T3. Swap the RevenueCat key `[after F3 — one line]`
`club.purchases.ts:16` `test_…` → the `appl_…` key, and flip the paywall's "you'd be charged" to
"you'll" (it keys off live mode). Shipping the Test Store key in a release build is a paid tier
that cannot take money.

### T4. Sentry `[gates the external beta]`
Config plugin + native rebuild. Then, and only then, add **Diagnostics** to both the App Privacy
label (F8) and `app.json`'s `privacyManifests` — a new SDK is a new data recipient.

### T5. Demo account for review
A stable account that is not the founder's, seeded with a few saved recipes, a week plan and a
shopping list so the reviewed app is not all empty states. Record the account in the Log, never
the password.

### T6. Screenshots
6.9" and 6.5" iPhone sets only — iPad is out (2026-07-28 call). Show the app doing its job: the
cook flow, the shopping list, an import. Copy already drafted in `STORE_METADATA.md`.

### T7. EXIF test, then strip if it survives
Truth-table row 9. Upload a geotagged HEIC as a recipe photo, `curl` the resulting public URL,
`exiftool` it. GPS surviving into a **public** bucket means either stripping metadata on upload or
declaring Precise Location on the label. Test first — do not add a dependency on a guess.

### T8. Prebuild + build 37
`app.json`'s `supportsTablet: false` and the privacy manifest are inert until a new native build.
Version discipline: bump `expo.version` and `ios.buildNumber` together.

### T9. `resolved_ingredients` survives account deletion
The published privacy policy was updated 2026-07-28 to disclose it honestly (an anonymous
ingredient-name cache with no account attached). If you would rather it be deleted than disclosed,
that is a `delete-account` packet — but the row carries nothing linking it to a person.

### T10. Server-side enforcement of the free tier `[before the free tier is public, not before TestFlight]`
Gate counters are client-side today: clearing app storage resets imports and asks. That is a cost
exposure, not a revenue one (the AI functions already carry a 20-call/15-min guard). The fix is
counting spend in the edge functions against `public.memberships`.

### T11. Still-open quality items from the audit
Carried from `TERMINAL_TICKET_RELEASE_READINESS.md` §C — not submission blockers, but the ones
with evidence already attached: the **`Text role="computed"` terracotta-on-cream contrast failure
(4.07:1, under AA)**, the ~20 unaudited `hitSlop` call sites where slop is decoration, and the
Dynamic Type AX5 / reduced-motion sweep.

### T12. Website, on listing day
`APP_STORE_URL` and `APP_STORE_ID` in `Otto_Website/lib/metadata.ts` — both `null` today, which
leaves `StoreBadge` unlinked on seven pages and the Smart App Banner off. Two constants, then the
whole site wires up at once. Never guess an ID.

---

## D — [Decide] blocking calls only you can make

| # | Decision | Who is blocked |
|---|---|---|
| **D1** | **Planner + smart shopping list: gated or free?** `OTTO_CLUB_GOLIVE.md` §5 lists them as Club features, but gating them removes a whole tab from a free user rather than capping a count — that needs a design, not a code packet. They are currently **free**. | The Club value story; F2's product description |
| **D2** | **The images (T2)** — terms answer, re-host, or replace. | T2, and whether the website copy can ever drop the credit |
| **D3** | **Free-tier numbers.** 5 imports/month · 25 saves · 5 asks/day are a starting point I chose, all three in `club.limits.ts`. | Nothing — but they are what people will feel |
| **D4** | **External TestFlight round** — ≥8–10 real testers for ≥5 days before submitting, or straight to review? | The whole timeline |

---

## Done when

- [ ] F1 Active, F2 products live, F3 entitlement `club` returning offerings
- [ ] T3 shipped and a real sandbox purchase unlocks the entitlement, with a `memberships` row
- [ ] T1 shipped and Discover verifiably serving `otto_recipes` in a release build
- [ ] T2 closed in writing, whichever way
- [ ] F8 label matches the manifest exactly; F9 metadata complete; F10 notes with a working demo account
- [ ] Build 37 on TestFlight, crash-free number recorded (T4)
- [ ] A dated ship / don't-ship call written at the bottom of the READINESS Log
