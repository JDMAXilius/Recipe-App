# Apple design file pass (2026-11-04)

Source: Figma `jWn55Rq4u6cbukA2JeqOaI` (read only), page 48 "Flow map — the standard iOS app flow" plus pages 01 (Liquid Glass & iOS 27), 14 Launching, 15 Onboarding, 27 Tab bars, 44 Apple In-App Purchase, 46 App Store Review. Otto matches the file's variant **"Subscription app · hard paywall": show value first; the paywall has no close, so Restore and Sign in must be on it.**

## What changes in Otto's flow

| # | Apple rule (page) | Otto today in the v3 map | Change |
|---|---|---|---|
| 1 | Launch screen = first screen's empty shell. No logo, no text. A splash, if any, is the first onboarding card (14) | Splash with otter + "Otto" | Launch screen is Welcome's cream shell; the otter + wordmark move onto Welcome |
| 2 | Onboarding: one Welcome screen of value, Get started / I have an account; bold, left-aligned titles in iOS 26 (15) | Welcome + 3-painting carousel | One Welcome (painting as hero, left-aligned title). Carousel removed; paintings reused as heroes |
| 3 | Personalize: 2–3 questions, one per screen, "Question n of 3", Skip always there (48) | 6 questions + taste swipe + building screen | 3 questions: Who's eating · How do you eat (diet + allergies) · Anything to skip. Taste swipe and "building" removed (the reveal loads in place) |
| 4 | Value moment before any ask: the plan reveal (48) | Your first week | Keep; add the summary line ("Built for 3 · 7 dinners · 18 ingredients · ~30 min a night") |
| 5 | Sign in with Apple first, no smaller than others; passkeys (43, 4.8) | Icon row Apple · Google · Facebook | Keep the row, Apple first, same size |
| 6 | Paywall: what you get, billed amount most prominent, dated trial terms, Restore · Terms · Privacy, Sign in on a no-close paywall (44, 3.1.2) | One-line benefit | Four benefit lines; "Free until Nov 11, then $39.99/year. Cancel anytime in Settings at least 24 hours before the trial ends." |
| 7 | Purchase outcomes: cancel is not an error; failed = alert, nothing charged; Ask to Buy = waiting screen; nothing to restore = alert; restored = confirmation (48, 44) | One "didn't finish" banner; restore toast | Cancel → back to paywall silently. New: Failed alert, Waiting for approval, Nothing to restore alert, Purchases restored |
| 8 | Success: "You're all set" with the next real thing (48) | Welcome to the Club | Copy names tonight's dinner and the list |
| 9 | Permissions in context, primer with one Continue, fallback + Settings link (12) | Reminders before the paywall | Reminders asked right after the purchase, when there is a plan to remind about. Camera gets a primer; fallback = paste a link |
| 10 | Grace period: keep access, banner to update payment; after it ends, never delete what people made (48, 3.1.2) | Not drawn | New: Payment problem banner; "Otto Club ended — everything is still here" then the paywall |
| 11 | Link / notification in every state: content missing explains itself; signed out → sign-in sheet with context behind, then the destination (48) | Shared link → Recipe | New: Not found state. Trial-ending reminder entry (2 days before the charge) |
| 12 | Update → What's new, once, dismissible, major releases only (48) | Not drawn | New entry + What's new sheet |
| 13 | Offline is a state: cached content + quiet banner; explain only network-only actions (22) | Banner | Copy: "You're offline. Your plan and list still work." |
| 14 | Tab bar floats on Liquid Glass; Search is a dedicated trailing tab; Add lives in a toolbar (27, 01) | Search inside Home | Tabs Home · Plan · Cookbook · Account + Search tab at the trailing end |
| 15 | Settings: Privacy & data (AI toggle naming OpenAI, download my data, Delete account in red); delete = explain → confirm → deleted (48, 5.1.1(v)) | AI data row; one alert | Privacy & data screen; Delete account explain screen → confirm → "Your account is deleted" |
| 16 | Subscription settings: plan, renewal date, Manage, Restore, refund help (44) | Membership | Add "Request a refund" |
| 17 | iOS 26 alerts: bolder, left-aligned (01, 15) | Centered alerts | Alerts restyled |
