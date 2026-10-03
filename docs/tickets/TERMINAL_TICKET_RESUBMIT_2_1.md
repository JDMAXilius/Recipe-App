# Terminal ticket: answer App Review 2.1 and resubmit 1.0.19 (build 40)

> For a Claude Code terminal session on Juan's Mac (Recipe-App repo + website repo), with the
> **Chrome MCP** signed in to App Store Connect. Written 2026-10-01 by the cloud session.
> **Starts only when Juan says "video ready"** and `~/Desktop/otto-review-1.0.19.mov` exists.
> `TERMINAL_TICKET_BUILD_39.md` must be done first (build 39 VALID, attached to 1.0.19).
> **2026-10-01 update:** the first recording (on 39) exposed "Opening soon" on the Account Club card; **build 40** fixes it. Record and resubmit on **40**. Everything else in this ticket is unchanged.
> Read the whole ticket first. Work top to bottom, verify each step, log at the bottom.

The video is the **only** thing Juan provides. Everything below is yours.

Source of truth for every word sent to Apple: `docs/release/APP_REVIEW_2.1_RESPONSE.md`
(§3 the video script, §4 the reply, §5 send/resubmit, §6 don'ts).

## Steps

### R0. Check the video before anything is sent
1. `ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 ~/Desktop/otto-review-1.0.19.mov`
   → expect roughly 4–7 min, portrait (`brew install ffmpeg` if missing).
2. Pull one frame every 10 s
   (`mkdir -p /tmp/otto-frames && ffmpeg -i ~/Desktop/otto-review-1.0.19.mov -vf fps=1/10,scale=-2:900 /tmp/otto-frames/f%03d.jpg`)
   and **look at them**. Confirm each §3 beat is on screen:
   - launch from the Home Screen
   - sign-up
   - the **Otto Club** screen (prices, trial, Terms/Privacy, Restore)
   - Apple's purchase sheet, then Club unlocked
   - the **delete note** ("Apple bills it… Manage subscription")
   - back at sign-in
   - demo sign-in
   - Discover → cook mode
   - the **"Otto uses AI for this"** sheet
   - the iOS speech prompt
   - import → review
   - the Plan → shopping list
   - the shared list
   - the **Otto and AI** switch

   Extract denser frames (`fps=1/3`) around any beat you can't find.
3. Privacy pass: no password is readable, and no notification banners show personal content.
4. If a **required** beat is missing (launch, registration, deletion, the Otto Club screen with
   its links, the AI consent sheet), stop and tell Juan exactly which shot to re-record. Otherwise go on.
5. If the frames show the purchase **failed** or the Club **didn't unlock**, stop. That's a bug,
   not a re-record: tell Juan and log it for the cloud session.

### R1. Purchase plumbing check (doesn't block resubmit)
RevenueCat dashboard (Chrome) → Customers, sandbox: find the throwaway user's purchase from
today, then Integrations → Webhooks → event log: the `INITIAL_PURCHASE` delivery should be 2xx.
Log what you see. If the webhook failed, log it for the cloud session (`revenuecat-webhook` edge
function). The app's Club unlock comes from RevenueCat directly and free-tier limits are
client-side, so this doesn't block the resubmit.

### R2. Make a shareable copy
`ffmpeg -i ~/Desktop/otto-review-1.0.19.mov -vf "scale=-2:1280" -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 96k -movflags +faststart ~/Desktop/otto-review-1.0.19.mp4`
Aim for under 100 MB (raise `-crf` to 28 if it's bigger).

### R3. Host a link that opens without signing in
In this order, use the first that works:
1. **Website repo:** put the mp4 at `public/review/<16 random hex chars>/otto-review-1.0.19.mp4`
   (generate with `openssl rand -hex 8`). Add an `X-Robots-Tag: noindex` header for `/review/*`, and
   don't link it from any page. Deploy.
2. **GitHub release** on the app repo:
   `gh release create app-review-1.0.19 ~/Desktop/otto-review-1.0.19.mp4 --prerelease --title "App Review video 1.0.19" --notes "Screen recording for Apple App Review."`
   Use this only if the repo is public. Otherwise the link needs a sign-in, which is useless to Apple.

Verify from a logged-out context: `curl -sI <url>` → `200` with a `video/mp4` content type, and the
video plays in a Chrome incognito tab. Record the URL. Remove the hosted copy after approval
(logged as a follow-up).

### R4. Fill in the reply (§4)
Copy the §4 block exactly and replace:
- `[LINK or "attached"]` → the URL from R3 (add " (also attached)" if R5 attaches the file).
- `[model]`, `[version]` → Juan's iPhone model and iOS version. Read them from the video metadata
  (`ffprobe -show_format` may carry `com.apple.quicktime.model` and `software`). If that's absent,
  use ASC → TestFlight → Otto Insiders → Juan → device and OS for build 40.

Measure the final text: it must be **≤ 4,000 characters**. Plain text, no markdown.

### R5. Send it to Apple (Chrome)
1. **Reply in App Review:** App Store Connect → the app → **App Review** (the 1.0.19 submission's
   message from Apple) → Reply → paste the R4 text. Attach the mp4 if the form accepts it and the
   Chrome tools can set the file input; the link covers it if not. → **Send**. Screenshot the sent message.
2. **App Review Information → Notes:** the same R4 text. Via API:
   - `GET /v1/appStoreReviewDetails/5f6b1060-346b-4ca7-80a3-5d7f4d546459` first.
   - `PATCH` it with `notes` plus the existing contact fields (`contactFirstName`, `contactLastName`,
     `contactEmail`, `contactPhone`, `demoAccountRequired`, `demoAccountName`). ASC 409s a notes-only
     PATCH. Include `demoAccountPassword` only if the GET returned it.
   - Never print or log the password.
   - GET it back and confirm the notes saved.
   - Also attach the mp4 under App Review Information → **Attachment** in Chrome, if possible.

### R6. Website copy for build 39 (website repo)
Deploy W5 from `TERMINAL_TICKET_WEBSITE_REVIEW_2_1.md`: Privacy Policy consent section, Terms
"AI features" section, FAQ answer. Verify live.

### R7. Resubmit (Chrome)
1. Version 1.0.19 shows **build 40** (fix it if not, as in BUILD_39 step B5).
2. Subscriptions: on the **Otto Club group page**, make sure both are in the submission (**Add for
   Review** if they aren't). Learned 2026-09-29: the version page has no IAP section, and each
   sub must be added from its group page.
3. Resubmit / **Submit for Review**. Release option stays "Automatically release after review".
4. Verify via API: the version and both subscriptions are `WAITING_FOR_REVIEW`. Screenshot it.

### R8. Close out
1. Tell Juan: submitted, plus the date/time and what Apple now has.
2. Log below. Update `ROADMAP.md`: ASC row for the resubmission, APP-4 (sandbox purchase on
   camera, plus the R1 result), and the follow-up "remove the hosted review video after approval".
3. Commit with the session attribution lines, `git fetch` + rebase, push `main` (fast-forward only).

## Don'ts (from the pack §6)
- Don't describe anything the build doesn't do. The reply and build 40 must agree.
- Don't paste markdown into ASC, and don't go over 4,000 characters in the Notes.
- Don't use the demo account for the purchase or deletion shots (Juan's script already avoids it).
- Never type or print the demo password. No account creation, no real purchases, no force-push.

## Log
<!-- append: date/time, step, result, URLs, screenshots -->

- 2026-10-01 R0 on Juan's first recording (`~/Downloads/Otto App Overview.mp4`, 7:17, 396×858, build 39): **not sendable.**
  Missing required beats: launch from Home Screen (starts in the app switcher), registration (signed into Juan's own account), account deletion, and the AI consent sheet (consent was already granted on that device; it's device-local in AsyncStorage, so deleting the app resets it). The sandbox purchase sheet appeared but the Club didn't unlock and no error toast showed, so the sheet was most likely closed (the paywall toasts on 'error').
  Privacy: Juan's Gmail in the Passwords autofill bar (0:10), contacts in a share sheet (6:00). Content: Toy Story images on two of Juan's own recipes (2:20).
  Bug found: Account's Otto Club card said "Opening soon" and "Current plan: Free" was hard-coded → fixed in **build 40** (`15bf89d9`). Re-record on 40 per §3, from a fresh install, throwaway for sign-up/purchase/deletion, demo account for the walkthrough.
- 2026-10-02: second recording (`Otto app overview 2.mp4`, 8:20, build 40) passes R0: Home Screen launch, onboarding, registration, deletion (deleted login refused), demo login, recipe + nutrition, cook mode, AI consent sheet, speech prompts, AI recipe saved, plan + list, shared list, Otto and AI switch, Otto Club card (no "Opening soon"), paywall + Apple sheet (closed, no purchase; not required by Apple). Noted: "Couldn't save. Try again." toast on the first Save to cookbook (~5:05), second tap saved; investigate after review.
  R2: blurred Gmail autofill bar (1:10–2:15) and share-sheet contacts (6:30–6:40); `~/Desktop/otto-review-1.0.19.mp4` (30 MB) + `-small.mp4` (9.6 MB).
  R3 replaced: full video uploaded as App Review attachment via API (`appStoreReviewAttachments` c336bb0c…, COMPLETE); small copy attached to the reply. No public hosting needed.
  R4/R5: Notes PATCHed (3,988 chars, contact + demo intact). Reply filled + small video attached and **saved as DRAFT, not sent** (Juan reviews first). Regions answer now says 148 countries, not the EU.
  R6: W5 merged and live (website 4d6eb2c): Privacy "Asking before AI is used", Terms "AI features", Support "Does Otto use AI?".
  R7: preflight all PASS (build 40 VALID, both subs READY_TO_SUBMIT, demo login OK). **Waiting on Juan's go to Send reply + Resubmit.**
- 2026-10-02 (later): per Juan, **no blur, originals**. App Review Information attachment replaced with the untouched original `Otto app overview 2.mp4` (127 MB, COMPLETE; ASC allows max 1 attachment there). Reply draft now carries unedited compressed copies of both recordings (`Otto app overview 2 (compressed).mp4` 9.5 MB, `Otto App Overview (compressed).mp4` 8.5 MB) and text naming them (3,954 chars). Notes updated to the original file name (3,989 chars). Still a DRAFT; not sent, not resubmitted.
- 2026-10-02 22:28 EDT: **RESUBMITTED** on Juan's go. Reply sent to App Review (Messages 2) with both compressed recordings attached; version page Update Review → Resubmit to App Review. 4 items Waiting for Review: 1.0.19 (40), Otto Club Yearly, Otto Club Monthly, Otto Club group. Gotcha: the submission page's Resubmit button stays disabled until the version page's **Update Review** re-adds the rejected version.
- 2026-10-03: sandbox purchase on build 40 started Apple's trial but RevenueCat recorded nothing (RC config verified correct: club entitlement on both products, IDs match, IAP key valid, sandbox access Anybody, logIn alias OK). **Build 41** (`00dd4a8a`, `f964e95b`): purchase/restore verify + syncPurchasesForResult fallback, honest toasts with error codes, sync after logIn for non-members; first run reordered to sign up → onboarding → Otto Club trial offer (Not now) → app. Build 41 VALID (id e4bf723f…), in Otto Insiders. 1.0.19 (40) still WAITING_FOR_REVIEW; pull + resubmit with 41 only after Juan confirms the purchase unlocks on 41.
- 2026-10-03 15:06 EDT: **Swapped to build 41 and resubmitted** (Juan's go). Build 41 sandbox purchase verified end-to-end: paywall "You're in the Club", RevenueCat customer has sandbox purchases, memberships 0 → 1 (webhook OK). Cancelled submission 76f33d2d (API PATCH canceled:true → COMPLETE, version DEVELOPER_REJECTED), attached 41, Notes + build-41 line (3,977 chars), new submission f4a4d3c6 created via API with the version; group + both subs added in the browser (API 409s "no pending version" for subscriptionSubmissions); Submit → 4 items WAITING_FOR_REVIEW.
