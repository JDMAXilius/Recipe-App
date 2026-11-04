# HealthKit
URL: https://developer.apple.com/design/human-interface-guidelines/healthkit

## Summary
HealthKit is the central store for health and fitness data on iPhone, iPad, and Apple Watch; apps can ask permission to read and write it (e.g., a nutrition app reading weight/activity and writing logged calories). Only apps with real health/fitness functionality should request access, and the page also governs Activity rings, the Apple Health icon, and how to name the Health app.

## Best practices
- Don't request health data if your app has no health or fitness functionality.
- Provide a clear privacy policy URL at App Store submission.
- Request access only when needed and in context (e.g., when logging weight, not at launch); request each time access is needed since permissions can change.
- Add a few succinct sentences to the standard permission screen explaining why and the benefit; don't build custom screens that replicate it.
- Manage sharing only through system privacy settings; don't build in-app screens that control health data flow.
- Activity rings: only for Move, Exercise, and Stand; never show that progress in another ring-like element.
- Rings show a single person's progress; label whose (name, photo, avatar).
- Never use rings as ornamentation, labels, backgrounds, branding, app icon, or marketing.
- Never alter ring or background colors, filters, or opacity; design the surrounding UI to blend (e.g., enclose in a circle) and scale rings appropriately.
- Keep an outer margin at least the gap between rings; nothing may crop or encroach; to show in a circle, adjust the container's corner radius rather than a circular mask.
- Separate other ring-like elements with padding, lines, labels, color, and scale.
- Activity notifications: only app-specific info; never show a ring element in notifications or repeat system progress updates.
- Apple Health icon: use only Apple's artwork; show "Apple Health" name near it; no smaller than other app icons in the view.
- Don't use the icon as a button, alter it (masking, circles, borders, overlays, gradients, shadows), composite it, or use it in place of words.
- Don't show Health app images or screenshots.
- Say "Apple Health" or "the Apple Health app"; never "HealthKit" in user-facing text (e.g., "works with the Apple Health app").
- Capitalize "Apple Health" (two words, capital A and H); all caps only for an established all-caps style; use the system translation of "Health".

## iOS specifics
- None stated (no additional iOS/iPadOS considerations). Supported on iOS, iPadOS, watchOS; not macOS, tvOS, visionOS.
- People manage health access globally in Settings > Privacy.

## Specs & numbers
- Activity ring goals: 3 (Move, Exercise, Stand).
- Activity ring outer margin: no less than the distance between rings.
- Apple Health icon clear space: at least 1/10 of its height.
- No change log entries listed.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Show the system Health permission sheet when the user taps "Log weight", with a one-line purpose. / Don't: Trigger the Health permission sheet on first launch.
- Do: Display one person's Activity rings with their avatar and name. / Don't: Overlay rings for two friends in one graphic.
- Do: Enclose unaltered rings in a black circle with proper margin. / Don't: Recolor rings to brand colors or crop them with a mask.
- Do: Use your own progress bar/ring style for "water intake", clearly separated by labels. / Don't: Use Activity-ring look-alikes for water or calories.
- Do: Settings row "Works with the Apple Health app" with the Apple Health icon and name. / Don't: Write "Sync with HealthKit" or use the icon as a tappable button.
- Do: Notification "You logged 3 healthy meals today". / Don't: Notification showing a ring graphic and "Close your Move ring".
