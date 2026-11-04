# Motion
URL: https://developer.apple.com/design/human-interface-guidelines/motion

## Summary
Motion conveys status, feedback, and instruction, and system components already include it, adjusting for accessibility settings and input method. Custom motion should be purposeful, brief, realistic, interruptible, and never the only way information is communicated.

## Best practices
- Add motion only when it supports the experience; gratuitous animation distracts and can cause discomfort.
- Make motion optional; back up visual feedback with haptics and audio.
- Keep feedback motion realistic and consistent with the gesture (a view pulled down from the top shouldn't dismiss sideways).
- Keep feedback animations brief and precise; small, tightly tied motion often communicates better than big animation.
- In apps, avoid adding motion to very frequent interactions; standard elements already animate subtly.
- Let people cancel or interrupt motion; don't force waiting for an animation, especially repeated ones.
- Use animated SF Symbols (SF Symbols 5+) where helpful.
- Games: look great by default on each platform; target a steady frame rate.
- Let players trade visual quality for performance or battery (e.g., power modes when plugged in).
- (Related, from Accessibility) honor Reduce Motion.

## iOS specifics
- "No additional considerations for iOS, iPadOS, macOS, or tvOS."

## Specs & numbers
- Games: consistent 30 to 60 fps.
- SF Symbols animations require SF Symbols 5 or later.
- visionOS: avoid sustained oscillation around 0.2 Hz.

## New in iOS 26 / Liquid Glass
- Liquid Glass motion responds to direct touch with more emphasis (tactile feel) and is more subdued with a trackpad.

## Do / Don't
- Do: a quick checkmark bounce when a recipe is saved. / Don't: a 2-second confetti sequence on every save.
- Do: dismiss a pulled-down sheet by swiping down. / Don't: require a sideways swipe to dismiss a top-down panel.
- Do: let a tap skip an intro animation. / Don't: block input until the onboarding animation ends.
- Do: pair a success animation with a haptic. / Don't: rely on a color pulse alone to confirm an action.
- Do: keep list row taps instant with standard highlight. / Don't: add a custom wobble to every row tap.
- Do: crossfade instead of zoom when Reduce Motion is on. / Don't: keep parallax and zoom transitions regardless.
