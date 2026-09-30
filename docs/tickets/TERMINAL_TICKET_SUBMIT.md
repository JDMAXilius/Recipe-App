# Terminal ticket: get Otto 1.0.19 into App Review

> For a Claude Code terminal session with the **Chrome MCP** (claude-in-chrome) connected and
> Chrome **signed in to App Store Connect** as Juan. Written 2026-09-29. Read the whole ticket
> before starting. Work top to bottom, verify each step, and log what happened at the bottom.

## Where things stand (verified 2026-09-29)

| Item | State |
|---|---|
| App | "Otto: Recipes & Meal Plans", ASC app id **6792195637**, bundle `com.otto.recipes` |
| Version | **1.0.19**, `PREPARE_FOR_SUBMISSION`, id `30c951a8-be14-4f8c-a4de-c3d5e29bfa5f` |
| Build | **38** attached (id `912fff31-ef36-463c-b75d-ca4695944035`, VALID, no non-exempt encryption) |
| Subscriptions | group "Otto Club" `22260300`: `otto_club_yearly` (`6794140476`, $39.99) and `otto_club_monthly` (`6815805006`, $4.99), both **READY_TO_SUBMIT**, 1-week free trial, 175 territories |
| Description | updated via API: renewal terms plus Terms/Privacy links |
| Agreements | Paid Apps **Active**, Free Apps **Active**, bank account **Active** |
| DSA | answered **"not a trader"** on 2026-09-29, so the EU must come off availability (step 1) |
| Review details | id `5f6b1060-346b-4ca7-80a3-5d7f4d546459`; contact + demo account **empty** (step 4) |
| App Privacy | answers saved, **not published** (step 2) |

## Tools

- **Chrome MCP** for the web-only steps (1, 2, 3). Start with `tabs_context_mcp`, then open your
  own tab. If ASC redirects to sign-in, **stop and ask Juan to sign in in Chrome**. Never type a
  password.
- **ASC API** for everything else: `node scripts/asc.mjs METHOD /path '[json]'` (prints status,
  then body). It signs with the gitignored key `credentials/ios/AuthKey_NTMZWLG54S.p8`. Note: the
  app's availability is **not** readable through `/v2/appAvailabilities` (404), so step 1 is Chrome only.

## Steps

### 1. Remove the 27 EU countries (Chrome)
Why: Juan declared "not a trader" under the EU Digital Services Act. Otto sells subscriptions, so
it must not be offered in the EU until he registers as a trader (a later, separate task).

`https://appstoreconnect.apple.com/apps/6792195637/distribution/pricing`, then App Availability →
**Edit** → uncheck exactly these, and nothing else:
Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany,
Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland,
Portugal, Romania, Slovakia, Slovenia, Spain, Sweden. → **Done** → **Save**.
Verify: the count drops from 175 to **148**, and the United States is still checked. Screenshot it.
Subscriptions follow app availability; don't edit them.

### 2. Publish App Privacy (Chrome, needs Juan's go-ahead in chat)
`https://appstoreconnect.apple.com/apps/6792195637/distribution/privacy`. Confirm the saved
answers match `docs/legal/APP_PRIVACY_TRUTH_TABLE.md`: Name, Email, User ID, Purchase History,
Photos or Videos, Other User Content; all App Functionality, linked to the user, **no tracking**.
If anything differs, stop and report. Publishing is Juan's accuracy attestation, so ask him
"publish?" in chat and click **Publish** only after he says yes.

### 3. Tax form check (Chrome, read-only)
`https://appstoreconnect.apple.com/business` → Tax Forms. Report the U.S. W-9 status. If it isn't
Active or Complete, **Juan fills it in** (tax ID entry is his to do). Don't type it.

### 4. Review contact, demo account, notes (API)
**Needs from Juan in chat first:** his phone number in `+1 …` format, and a yes to the demo
account `claude-e2e-a@example.com` (a seeded, non-founder test account: 3 favorites, 3 planned
dishes, the shopping list builds). The password is in `.claude/skills/otto-lead/SKILL.md`. Put it
only in the ASC field, never in chat or a commit.

ASC rejects a notes-only PATCH (409): contact first name, last name, email and phone are all
required in the same request. Build the body with Python so the notes keep their newlines:
`contactFirstName: "Juan Diego"`, `contactLastName: "Lugo"`, `contactEmail: "juandiego@ottosapp.com"`,
`contactPhone: <Juan's>`, `demoAccountRequired: true`, `demoAccountName`, `demoAccountPassword`,
and `notes` = the §7 text in `docs/release/STORE_METADATA.md` with two edits: the Otto Club
paragraph stays as it reads in ASC today (it names the prices and the sandbox purchase), and the
delete line says "Profile > Delete my account (tap it twice to confirm)".
`PATCH /v1/appStoreReviewDetails/5f6b1060-346b-4ca7-80a3-5d7f4d546459`, then GET it back and confirm.

### 5. Pre-flight (API + Chrome)
- Version still has build **38** attached: `GET /v1/apps/6792195637/appStoreVersions?filter[platform]=IOS&include=build`.
- Both subscriptions still `READY_TO_SUBMIT`.
- On the version page in Chrome (`/apps/6792195637/distribution/ios/version/inflight`), no red
  warnings. The **In-App Purchases and Subscriptions** section lists both subscriptions.
- Screenshot the page and show Juan.

### 6. Submit (Chrome, ONLY after Juan types "submit")
On the version page: tick **both** subscriptions under In-App Purchases and Subscriptions → **Add
for Review** → **Submit to App Review**. These are Otto's first subscriptions, so Apple requires
them bundled with this version. Verify the state becomes **Waiting for Review**. Don't answer
any new dialog about encryption, ads, or content rights without checking: build 38 has
`usesNonExemptEncryption: false`, there are no ads and no third-party content beyond TheMealDB.

## After submitting
- Log the date and time, build 38, and "subscriptions included" in the Log below, and in
  `docs/tickets/TERMINAL_TICKET_PUBLISH.md`.
- Update `docs/tickets/ROADMAP.md` ASC-13 to done, and the roadmap Claude Doc
  (https://claude.ai/artifact/6HXbQRc9X1nfWpeiHAABRE, status dropdown → Done).
- Commit with the session's attribution lines and push to main.

## Don'ts
- No password or tax ID typing, no account creation, no purchases.
- Don't touch pricing, the trial, the build, or the description (all already correct).
- Don't re-add the EU. That needs trader registration first (a separate ticket).

## Log
<!-- append: date, step, result, screenshot/response notes -->

- 2026-09-29 21:18 EDT: all steps done, submitted. Findings vs. the runbook:
  - Step 1: availability had never been set ("Set Up Availability"); set to 148 = all minus the 27 EU. Declaring "not a trader" does NOT remove the EU by itself.
  - Step 2: App Privacy published after checking it against the truth table.
  - Step 3: W-9 Active.
  - Step 4: contact + demo account PATCHed (200); the existing notes were kept. Demo login verified against prod Supabase.
  - Step 6: the version page has NO In-App Purchases section. The flow is: **Add for Review** on each subscription, on the **subscription group** page (otherwise "must be submitted with its subscription group"), and on the version, then Submit. 4 items submitted; version + both subs WAITING_FOR_REVIEW via API.
