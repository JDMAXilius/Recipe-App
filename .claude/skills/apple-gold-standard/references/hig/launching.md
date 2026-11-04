# Launching
URL: https://developer.apple.com/design/human-interface-guidelines/launching

## Summary
Launching covers the span from opening the app (including the first download) until the first screen is ready. The goal is to feel instant: show a launch screen that mirrors the first screen, then restore where people left off. Splash screens and onboarding come after launch, not during it.

## Best practices
- Get people interacting right away; many won't wait more than a couple of seconds.
- Provide a launch screen where the platform requires one (iOS, iPadOS, tvOS); the system shows it immediately and swaps in the first screen.
- If you need a splash screen, place it at the start of onboarding, or right after launch completes if there's no onboarding.
- Restore prior state on relaunch so people continue where they left off, including granular details like scroll position.
- Treat the launch screen as a perception-of-speed device, not onboarding, a splash, or artistic expression.
- Make the launch screen nearly identical to the first screen to avoid a jarring flash.
- If the first screen starts as a solid color, make the launch screen just that solid color.
- Match the device's current orientation and appearance mode (light/dark).
- Keep text off the launch screen; it's static and won't be localized.
- Don't advertise: no logos or branding unless they're a fixed part of the first screen; avoid an "About"-window look.

## iOS specifics
- Launch in the device's current orientation if both portrait and landscape are supported.
- If only one orientation is supported, launch in it and let people rotate.
- A landscape-only UI must work whether the device is rotated left or right.

## Specs & numbers
- People may not wait "more than a couple of seconds" for launch.
- Change log: June 10, 2024 (splash screen guidance); June 21, 2023 (visionOS).

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Launch screen = the first screen's empty shell (same nav bar, tab bar, background color). / Don't: Launch screen with a big centered logo and tagline that then flashes to a different UI.
- Do: Blank launch screen with no text. / Don't: "Loading your recipes..." text baked into the launch image.
- Do: Dark launch screen when the device is in Dark Mode. / Don't: White launch screen flashing before a dark first screen.
- Do: Reopen the app scrolled to the same item the person last viewed. / Don't: Reset to the home tab top every relaunch.
- Do: Show a brand splash as the first onboarding card after launch. / Don't: Use the launch screen as the splash/ad.
