# Apple + industry rules that shape an app's flow

Researched 2026-11-03. Apple text pulled from the HIG JSON endpoints
(`https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json`)
and the live App Store Review Guidelines. The `in-app-purchase` and `navigation-and-search` HIG
slugs did not load, so paywall rules below come from the Review Guidelines. Anything marked
**unverified** was not confirmed against a primary source.

## Launch and onboarding (HIG Launching, Onboarding)
- The launch screen looks like the app's first screen. No logo, no text, no ad. Onboarding happens after launch.
- On relaunch, restore the previous state so people continue where they left off. A returning user is its own entry.
- Onboarding is fast, fun and optional. Prefer context-specific tips over one big tour.
- If people skip onboarding, don't show it again; keep it findable in Help or Settings.
- Postpone non-essential setup; ship sensible defaults.
- Let people experience the app before asking for ratings or purchases (Apple's soft stance against a day-0 hard paywall).

## Accounts (HIG Managing accounts, Sign in with Apple · Review 4.8, 5.1.1)
- Ask for an account only if core functionality needs it. Delay sign-in as long as possible.
- After Sign in with Apple, welcome the person; don't ask for data that isn't required.
- The Sign in with Apple button is no smaller than other sign-in buttons, and needs no scrolling.
- 4.8: if you offer a third-party/social login, also offer an equivalent private option (Sign in with Apple).
- 5.1.1(v): apps without significant account features must work without login. Account deletion must be in the app (real deletion, not deactivation); tell people billing continues through Apple until they cancel; revoke Sign in with Apple tokens.

## Permissions (HIG Privacy · Review 5.1.1(iv), 5.1.2(i), 4.5.4)
- Ask when people use the feature, not up front, unless the app can't work without it.
- A pre-alert screen has one button ("Continue"/"Next"), no close or cancel.
- Provide a fallback when people decline. Push, location and tracking can't be required for functionality.
- Marketing push needs explicit opt-in and an in-app opt-out.
- Sending personal data to a third-party AI needs disclosure and explicit permission (5.1.2(i)).

## Subscriptions and paywall (Review 3.1.1, 3.1.2)
- Subscriptions give ongoing value, last at least 7 days, and work across the user's devices.
- 3.1.2(c): clearly describe what people get for the price before they subscribe. (From past Otto rejections: the billed amount must be the most prominent price; Terms and Privacy links must work.)
- No bait-and-switch; upgrades/downgrades must not double-charge.
- 3.1.1: a Restore mechanism is required.
- 3.2.2(x): never force a rating or review to unlock anything.

## Tab bar and modality (HIG Tab bars, Modality, Sheets · WWDC22 "Explore navigation design for iOS")
- Tabs are for navigation, not actions. Keep the tab bar visible. Never hide or disable tabs; explain empty states.
- Avoid a "More" overflow tab. Single-word labels. Five or fewer is the guidance (stated explicitly for iPadOS).
- Never switch tabs on people automatically. Avoid duplicating features across tabs.
- Use a modal only when there's a clear benefit; one sheet at a time; confirm before discarding content.
- Push for moving down a hierarchy; full-screen modal for multistep tasks or media/camera.

## Notation for a flow map
- NN/g wireflows: screens plus arrows from the exact tapped element; show feedback states; a "result" can be the same screen in a new state.
- Working convention (unverified, standard flowchart practice): entry pills labelled with the trigger (cold start, resume, push, link, widget), screens, decision diamonds phrased as state questions (signed in? entitled? permission granted? online?), system events drawn differently (iOS alert, StoreKit sheet), and outcomes. One lane or map per scenario.

## Evidence on order and conversion
- RevenueCat 2026 (observational): hard paywalls convert ~10.7% of trials to paid by day 35 vs 2.1% freemium. 55.4% of 3-day-trial cancellations happen on day 0. Trials of 17–32 days convert better than trials under 4 days.
- Superwall (~40M opens, vendor data): multi-page paywalls 12.41% vs single-page 9.07%.
- Conflict to resolve per app: conversion data favours a paywall inside onboarding; the HIG favours experience first. Common compromise (unverified): a dismissible paywall at the end of onboarding plus contextual paywalls at gated features.

## Scenario checklist (every complete flow map covers these)
1. First launch, fresh install. 2. Onboarding skipped. 3. Returning, signed in, entitled → previous state.
4. Returning, signed out. 5. Sign in: new, existing, cancelled, error. 6. Sign out.
7. Paywall entry points (onboarding, gated feature, settings, promo link) × outcomes (dismiss, success, cancelled, failed, Ask to Buy pending).
8. Trial active / ending / converted / cancelled. 9. Subscription lapsed or billing retry → free tier without data loss.
10. Upgrade/downgrade, Manage Subscriptions. 11. Restore on new device / reinstall. 12. Second device.
13. Deep link / push / widget entry in every state (cold vs warm, signed out, not entitled, content gone).
14. Permission granted / denied / limited / revoked later → fallback + Settings link.
15. Notification opt-in at a feature moment; marketing opt-out. 16. Offline / slow network.
17. Server or AI error, quota, rate limit. 18. Empty state on every tab.
19. Account deletion (in app, confirm, billing note, token revoke). 20. Consent withdrawal (AI data sharing).
21. Rating prompt after engagement. 22. App update / what's new. 23. One sheet at a time; confirm before discarding.
