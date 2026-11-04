# Scenario lanes: what each app really does in the 9 edge cases

Researched 2026-11-04. **Also in Figma:** every app page of the study file (`iEA3Aeu3ApmJdJabmAudXm`, 24 pages) has a new section **08 · Scenario lanes** placed right after its untouched 07 flow map, drawn from the same JSON. Builder: `build/figma-lanes.js` (paste into use_figma with buildLanes(P,L)).

Each map in `../maps/` now ends with nine **scenario lanes** (the edge cases from the Apple gold standard, Figma `jWn55Rq4u6cbukA2JeqOaI` page 48). Data: `../lanes/<app>.json`. Renderer: `../build/lanes.js`. Rebuild: `node docs/flow-maps/build/build.mjs`. Otto's map is hand-laid; only its lanes block is generated.

**Method.** One researcher per app. Sources, in order of trust: screens observed on Mobbin (and the PlanFuel Figma study file), the app's official help center or terms, App Store listing and version history, then user reports. Otto was traced from the code (`file:line` in each lane's sources). Every step carries its evidence, shown as a tag on the card:
- **seen**: screen observed (Mobbin flow/screen id cited)
- **help doc**: official help center, terms or App Store page
- **user report**: Reddit, forums, third-party directories only
- **unverified**: a labelled assumption with no source (dotted, faded card)
- **gap vs Apple**: observed deviation from Apple's standard (red card, source required)

A lane's verdict is **unknown** when there wasn't enough evidence. That's a finding, not a failure: none of these apps publish how they handle notification taps, billing grace periods or What's New.

## Verdicts (all 24 study-file apps + Otto, 14 scenarios)
Key: ✓ meets · ◐ partial · ✗ misses · ? unknown. Columns are the 14 scenarios (1 returning launch · 2 links/notifications · 3 permission denied · 4 purchases · 5 lapse · 6 restore · 7 delete account · 8 offline · 9 What's new · 10 AI/server errors · 11 consent · 12 sign-in/out · 13 devices/sharing · 14 empty states).

| App | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | seen / doc / report / unverified / gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| otto | ◐ | ✗ | ◐ | ◐ | ✗ | ✓ | ✓ | ◐ | ✗ | ◐ | ✓ | ◐ | ◐ | ◐ | 70 / 0 / 0 / 7 / 22 |
| duolingo | ✓ | ? | ? | ◐ | ◐ | ✓ | ◐ | ✓ | ? | ◐ | ? | ◐ | ✓ | ◐ | 39 / 15 / 9 / 19 / 6 |
| mfp | ? | ? | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ? | ◐ | ◐ | ◐ | ◐ | ◐ | 32 / 18 / 3 / 22 / 8 |
| calai | ? | ? | ◐ | ◐ | ? | ◐ | ◐ | ? | ? | ◐ | ? | ✓ | ◐ | ✓ | 46 / 12 / 1 / 21 / 6 |
| finch | ? | ? | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ? | ◐ | ◐ | ? | ◐ | ◐ | 34 / 18 / 0 / 20 / 7 |
| macrofactor | ? | ? | ? | ◐ | ◐ | ✓ | ✓ | ◐ | ? | ◐ | ? | ◐ | ◐ | ✓ | 28 / 19 / 0 / 23 / 1 |
| lifesum | ? | ? | ◐ | ◐ | ◐ | ✓ | ✓ | ✗ | ◐ | ? | ◐ | ◐ | ✗ | ◐ | 27 / 24 / 0 / 13 / 7 |
| tiimo | ? | ? | ◐ | ◐ | ? | ✓ | ✓ | ? | ? | ? | ? | ◐ | ✓ | ✓ | 36 / 13 / 1 / 15 / 0 |
| waterllama | ? | ? | ◐ | ◐ | ? | ✓ | ✓ | ? | ◐ | ◐ | ✓ | ✓ | ◐ | ◐ | 36 / 10 / 0 / 19 / 1 |
| headspace | ? | ? | ? | ◐ | ◐ | ✓ | ✓ | ◐ | ◐ | ? | ◐ | ◐ | ◐ | ◐ | 42 / 18 / 1 / 19 / 5 |
| oura | ? | ? | ◐ | ◐ | ◐ | ✓ | ✓ | ? | ✓ | ◐ | ✓ | ◐ | ◐ | ✓ | 46 / 16 / 2 / 16 / 1 |
| noom | ? | ? | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ? | ◐ | ◐ | ✗ | ✗ | ◐ | 33 / 13 / 1 / 19 / 9 |
| gentlerstreak | ? | ? | ◐ | ◐ | ? | ✓ | ✓ | ? | ? | ◐ | ◐ | ✓ | ◐ | ✓ | 34 / 11 / 1 / 23 / 1 |
| yazio | ? | ? | ? | ◐ | ? | ✓ | ◐ | ? | ? | ◐ | ◐ | ◐ | ◐ | ✓ | 27 / 18 / 2 / 21 / 6 |
| flo | ? | ? | ? | ◐ | ? | ◐ | ✓ | ? | ? | ? | ◐ | ◐ | ◐ | ? | 31 / 11 / 1 / 20 / 4 |
| carrot | ? | ? | ◐ | ◐ | ? | ✓ | ✓ | ◐ | ? | ? | ◐ | ✓ | ◐ | ◐ | 26 / 14 / 0 / 23 / 0 |
| crouton | ? | ? | ? | ◐ | ? | ✓ | ✓ | ? | ? | ◐ | ? | ◐ | ◐ | ◐ | 33 / 5 / 0 / 26 / 0 |
| bitepal | ? | ? | ◐ | ◐ | ? | ✓ | ◐ | ? | ? | ? | ✗ | ◐ | ◐ | ✓ | 31 / 6 / 5 / 18 / 3 |
| cherrypick | ? | ? | ? | ? | ? | ◐ | ◐ | ? | ◐ | ◐ | ✗ | ◐ | ? | ✓ | 38 / 7 / 1 / 21 / 2 |
| bevel | ? | ? | ◐ | ◐ | ◐ | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | 35 / 14 / 2 / 20 / 1 |
| amy | ? | ? | ◐ | ? | ✗ | ✓ | ✓ | ? | ? | ◐ | ◐ | ? | ◐ | ? | 0 / 33 / 0 / 19 / 1 |
| ellie | ◐ | ? | ? | ? | ? | ✓ | ◐ | ? | ? | ◐ | ◐ | ? | ◐ | ? | 0 / 33 / 0 / 22 / 1 |
| luna | ? | ◐ | ◐ | ? | ? | ? | ? | ? | ? | ? | ✗ | ? | ? | ? | 5 / 22 / 3 / 21 / 1 |
| mogul | ? | ◐ | ◐ | ? | ? | ◐ | ◐ | ? | ? | ? | ◐ | ? | ◐ | ? | 3 / 35 / 0 / 22 / 1 |
| pappai | ? | ◐ | ? | ? | ? | ✓ | ◐ | ? | ? | ◐ | ◐ | ◐ | ◐ | ? | 4 / 32 / 0 / 24 / 0 |

## Lanes 10–14 (added 2026-11-04)
Added after checking the 9 lanes against Apple's 23-scenario checklist and Otto's own features: **10** AI or server error, rate limit, timeout · **11** AI consent withdrawn · **12** sign-in edge cases and sign out · **13** second device and household sharing · **14** empty states on first use. They cover checklist items 5, 6, 12, 17, 18 and 20, which matter most for an AI app with households. Traced for Otto (code), written for Apple's standard (also drawn on gold-standard Figma page 48), and researched for all 24 reference apps (study-file 08 sections now hold 14 lanes). Apps without AI trace the closest consent in lane 11 (Health, tracking, cloud backup, analytics); no-account apps trace iCloud or local storage in lane 12. Otto's new gaps are tickets S1–S11 in `docs/tickets/TERMINAL_TICKET_SCENARIO_GAPS.md`.

Still not drawn as lanes (low risk for Otto today): onboarding skipped (Otto has Skip; covered by lane 1), paywall entry points other than onboarding (hard paywall has one door; revisit if F2 adds a free tier), trial ending / upgrade-downgrade (Apple's sheets), rating prompt (passes), one sheet at a time (G7).

## Notable findings (all sourced in the lane data)
- **Cal AI:** declining the paywall leads to a "Spin to unlock" wheel, then an "80% OFF FOREVER" one-time offer. Apple briefly pulled the app in April 2026 for this billing design and for a Stripe flow that skipped in-app purchase (MacRumors, 9to5Mac, 2026-04-21). Restore is only on the paywall, and the delete dialog doesn't mention that App Store billing continues.
- **Duolingo:** offline is a "YOU ARE OFFLINE" banner (seen). Restore Subscription sits in Settings. The delete button has a 4-second countdown, and deletion needs an email link to finish. Current builds show "Energy" instead of hearts.
- **MyFitnessPal:** Delete Account lives under More › Help, not Settings. No Restore button was seen on either paywall. Support describes a "subscription delay" of up to 6 hours after paying.
- **Tiimo:** delete is one alert ("deleted after three days… log in again… recovered"), then the signed-out screen. Settings has Restore purchase; the paywalls don't.
- **Headspace:** no free tier after a trial ends or a subscription lapses. Deletion timing disagrees (in app "within 30 days", help center "within 15 days"). Every release note is the same generic line.
- **Cherrypick:** no public help center. The trial length disagrees: terms say 14 days, the banner counts down 7, one screen says 24. The delete flow never mentions cancelling the App Store subscription.
- **Otto (code):**
  - Every launch lands on Discover (F4).
  - Notification taps have no destination, and links lose their target after sign-in or purchase (F5).
  - Pending purchases or Ask to Buy are locked behind the hard paywall (F2).
  - No billing-issue or grace-period message (F2/F5).
  - A denied microphone has no Settings link (`ChatScreen.tsx`).
  - No What's New.
  - Meets the standard on restore and delete account.

## Limits
- Mobbin samples about 5 screens per flow, and few flows cover failure states. That's why cancel, pending and failed purchases and grace periods are mostly unverified for every app.
- The MyFitnessPal and Headspace help centers block direct fetches. Headspace was read through its public Zendesk API; MyFitnessPal's "doc" steps rest on article URLs and search excerpts.
- Otto's lanes reflect main at commit `ac8fd38a`. Runtime behavior (RevenueCat cache, StoreKit, iOS) is marked unverified.
