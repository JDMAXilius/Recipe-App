# Accessibility
URL: https://developer.apple.com/design/human-interface-guidelines/accessibility

## Summary
An accessible interface is intuitive, perceivable through more than one sense, and adapts to how each person uses their device. Apple frames the guidance around vision, hearing, mobility, speech, and cognition, and asks you to audit with Accessibility Inspector and declare support via Accessibility Nutrition Labels on the App Store.

## Best practices
- Let people enlarge text to at least 200%, ideally by adopting Dynamic Type.
- When using custom type, stick to the platform default/minimum sizes; thin weights need larger sizes.
- Meet WCAG AA contrast minimums (Accessibility Inspector uses them); if defaults fall short, ship a higher-contrast scheme for Increase Contrast. Check both light and dark.
- Prefer system colors, which have built-in accessible variants.
- Never rely on color alone: add shapes, icons, or labels (red-green and blue-orange pairs are hard for color-blind users). Consider customizable color schemes (e.g., chart colors).
- Describe all UI and content for VoiceOver.
- Offer captions, subtitles, audio descriptions, and transcripts; let people style the text.
- Pair audio cues with haptics and with visual cues.
- Size controls to the platform default and space them generously.
- Use the simplest gestures for frequent actions; avoid custom multi-finger gestures; always provide an onscreen alternative (e.g., a button as well as swipe-to-dismiss).
- Label elements so Voice Control, Switch Control, Full Keyboard Access, and AssistiveTouch work; don't override system keyboard shortcuts.
- Integrate with Siri and Shortcuts for voice-only task completion.
- Avoid time-boxed, auto-dismissing UI; prefer explicit dismissal.
- Never autoplay audio/video without discoverable stop controls; respect Dim Flashing Lights.
- Honor Reduce Motion: tighten springs, track gestures directly, avoid z-axis depth animation, swap x/y/z transitions for fades, avoid animating into/out of blurs.

## iOS specifics
- "No additional considerations" for iOS/iPadOS in platform section.
- Assistive Access (iOS/iPadOS): strip to core functionality, one interaction per screen, ask for confirmation twice before hard-to-undo actions (e.g., delete).
- Music Haptics and Audio graphs let people feel music and charts.

## Specs & numbers
| Platform | Default text | Minimum text |
|---|---|---|
| iOS, iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| tvOS | 29 pt | 23 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

Text enlargement target: at least 200% (140% on watchOS).

| Text size | Weight | Min contrast (WCAG AA) |
|---|---|---|
| Up to 17 pt | All | 4.5:1 |
| 18 pt | All | 3:1 |
| All | Bold | 3:1 |

| Platform | Default control | Minimum control |
|---|---|---|
| iOS, iPadOS | 44x44 pt | 28x28 pt |
| macOS | 28x28 pt | 20x20 pt |
| tvOS | 66x66 pt | 56x56 pt |
| visionOS | 60x60 pt | 28x28 pt |
| watchOS | 44x44 pt | 28x28 pt |

Spacing: about 12 pt padding around bezeled elements; about 24 pt around the visible edges of bezel-less elements.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: make a 44x44 pt tap target around a small glyph icon. / Don't: ship a 20x20 pt hit area for a toolbar icon.
- Do: show a red error icon plus the text "Payment failed". / Don't: signal failure only by turning a field border red.
- Do: put a visible Close button on a sheet that can also be swiped down. / Don't: make swipe the only way to dismiss.
- Do: reflow a recipe row to stack vertically at AX text sizes. / Don't: truncate body text to one line at 200% size.
- Do: keep a toast up until the user taps Dismiss. / Don't: auto-hide a critical message after 2 seconds.
- Do: provide play/pause controls on a hero video. / Don't: autoplay video with sound and no controls.
- Do: crossfade between screens when Reduce Motion is on. / Don't: zoom and slide on the z-axis regardless of the setting.
