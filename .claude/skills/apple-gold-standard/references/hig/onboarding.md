# Onboarding
URL: https://developer.apple.com/design/human-interface-guidelines/onboarding

## Summary
Onboarding helps people get started, but ideally the app is understandable just by using it. When needed, onboarding should be fast, fun, and optional, and it happens after launching completes. Prefer interactive, contextual teaching over long upfront flows.

## Best practices
- Teach by letting people actually perform tasks rather than read instructions.
- Prefer a set of context-specific tips shown near the relevant UI over one big upfront flow (see TipKit).
- If a required onboarding flow is necessary, keep it brief and enjoyable; don't make people memorize much.
- Make separate tutorials optional; if skipped, don't re-show on later launches, but keep them findable (help, account, or settings area).
- Focus on your app, not on teaching the system or device.
- Show a splash screen only briefly, just long enough to absorb at a glance.
- Bundle enough content so large downloads don't block first use.
- Leave licensing, agreements, and disclaimers to the App Store; if unavoidable, integrate them without disruption.
- Postpone nonessential setup; ship reasonable defaults so people can start immediately.
- If the app can't function without private data access, consider asking during onboarding to explain why and the benefit; otherwise ask when people first use the dependent feature.
- Let people experience the app before asking for ratings or purchases.

## iOS specifics
None stated ("No additional considerations" for any platform).

## Specs & numbers
- No numeric specs on this page.
- Change log: June 10, 2024; June 21, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: An interactive first card where the person taps to try the core action. / Don't: Five static swipe-through slides of feature text.
- Do: A small tip bubble pointing at a button the first time that screen appears. / Don't: A full-screen tutorial covering every feature up front.
- Do: A visible "Skip" control and a "Replay tutorial" row in Settings. / Don't: Re-show the tutorial on every launch.
- Do: Ask for camera access with an explanatory card when the person first taps "Scan". / Don't: Fire all permission prompts on first launch.
- Do: Start with sensible defaults and a single "Get started" button. / Don't: Require a multi-step preferences questionnaire before showing the app.
- Do: Ask for a rating after the person has used the app a while. / Don't: Put a paywall or rating prompt in the first onboarding screen.
