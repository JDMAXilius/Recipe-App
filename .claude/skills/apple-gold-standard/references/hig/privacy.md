# Privacy
URL: https://developer.apple.com/design/human-interface-guidelines/privacy

## Summary
Be transparent about the data and resources you need, ask only when needed, and protect what people share. App Store product pages show your declared privacy practices, and permission requests use standard system alerts with your purpose string.

## Best practices
- Request only data you actually need, as specifically as possible.
- Be transparent about collection and use; respect Hide My Email, Mail Privacy Protection, and tracking obligations.
- Process data on device where possible (Neural Engine, Create ML).
- Adopt system protections (e.g., CloudKit encryption on iOS 15+).
- Ask for permission only when a feature clearly needs it, ideally when the person first uses it.
- Avoid launch-time permission requests unless the app can't function without it (e.g., navigation needing location).
- Purpose strings: brief, complete, specific sentence; sentence case; active voice; end with a period.
- Pre-alert screens: optional, only if context isn't enough; exactly one button, titled "Continue" or "Next" (not "Allow"), that opens the system alert; no close/cancel or other actions unless legally required.
- Tracking: show the system ATT alert before collecting any tracking data. Never precede it with misleading screens: no incentives, fake request screens, images of the alert, or annotations behind it (App Review rejects). Legal consent screens before/after ATT are allowed.
- Use the location button for one-time, in-the-moment location sharing.
- Customize the location button only via title choice, filled/outlined glyph, background/foreground colors, corner radius; text must fit at all accessibility sizes and languages.
- Prefer passkeys; if passwords remain, add two-factor; use Face ID / Touch ID for kept-signed-in apps.
- Store secrets in the keychain, never plain-text files; avoid custom auth schemes (use passkeys, Sign in with Apple, Password AutoFill).

## iOS specifics
- No additional platform considerations for iOS/iPadOS.
- Location button is available on iOS, iPadOS, watchOS. First tap shows an explanatory alert; later taps grant one-time access. With no authorization status, a tap equals Allow Once; if already While Using the App, status doesn't change.
- If the system detects persistent problems with a customized location button (low contrast, too much translucency), it won't grant location.

## Specs & numbers
- Requires permission: personal data (location, health, financial, contacts), user content (email, messages, calendar, photos, media, HomeKit, Apple Music), protected resources (Bluetooth, local network, Wi-Fi, home automation), camera/microphone, advertising identifier, visionOS ARKit data.
- iOS 15+: CloudKit encryption for strings, numbers, dates.
- App Review Guidelines 5.1.1 (iv) referenced for tracking.
- Purpose string examples: good - "The app records during the night to detect snoring sounds." Bad - "Microphone access is needed for a better experience." (passive, vague); "Turn on microphone access." (no reason).

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: ask for photo access when the user taps "Add photo" to a recipe. / Don't: fire camera, photos, and notification prompts on first launch.
- Do: a pre-alert screen with one "Continue" button. / Don't: a pre-alert screen with "Allow" plus "Maybe later".
- Do: purpose string "The app uses your camera to scan recipe cards." / Don't: "Camera access is required for a better experience."
- Do: show the plain system ATT alert. / Don't: overlay an arrow pointing at "Allow" or offer coins for allowing tracking.
- Do: a "Current Location" location button next to "Find stores". / Don't: request Always location for a one-off store search.
- Do: offer passkey / Sign in with Apple. / Don't: invent a custom PIN scheme stored in a plain file.
