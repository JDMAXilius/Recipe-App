# Sign in with Apple
URL: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple

## Summary
Sign in with Apple lets people sign in or sign up with their existing Apple Account, skipping forms, email verification, and passwords, with Face ID/Touch ID and built-in two-factor authentication. People can share a private relay email that forwards to their real address, and the system button guarantees an Apple-approved, localized, accessible appearance.

## Best practices
- Ask for sign-in only in exchange for clear value; briefly describe the benefits (personalization, features, sync).
- Delay sign-in as long as possible; let people explore first.
- If an account is required, explain why and set it up before offering sign-in options.
- Consider linking existing accounts (suggest it when the shared email matches, or in account settings).
- In commerce apps, offer account creation after purchase (e.g., on the Apple Pay order confirmation page); don't re-ask for name/email already provided.
- Welcome people right after sign-in; don't block with non-required questions.
- Show the current method, e.g., "Using Sign in with Apple" in account settings.
- Minimize data requests; label extra fields as required (legal/contractual) or optional, with benefits.
- Never ask for a password (unless they stopped using Sign in with Apple).
- Respect private relay addresses; don't ask for a personal email; show the relay address or use order/phone numbers instead.
- Ask for optional data later, in context; never gate features on it.
- Be transparent: greet people with the name/email they shared.
- Make the button prominent: no smaller than other sign-in buttons and visible without scrolling.
- Prefer system-provided buttons; choose a title variant and use it consistently.
- Styles: White on dark backgrounds; White with outline on white/light backgrounds (not on dark/saturated); Black on white/light (never on dark).
- Match corner radius to your other buttons (square to capsule allowed).
- Custom buttons must be instantly recognizable; App Review evaluates them. Use only Apple's downloadable logo art; never draw your own or use the logo alone as a button.
- Custom: keep titles (Sign in / Sign up / Continue with Apple), shape (logo+text rectangular; logo-only circular or rectangular), and black or white logo/title. You may change font, weight, size, all-caps, black/white background with subtle texture/gradient, corner radius, bezel, shadow.
- Keep default capitalization (first word and "Apple" capitalized) unless the UI is all caps; vertically center the title and match logo height to the button; inset the logo to align with other providers if needed.

## iOS specifics
- None stated (no additional platform considerations).
- iOS supports all three styles (white, white outline, black) and configurable corner radius.
- 44 pt is the default and recommended iOS button height.

## Specs & numbers
| Minimum width | Minimum height | Minimum margin |
|---|---|---|
| 140 pt (140 px @1x, 280 px @2x) | 30 pt (30 px @1x, 60 px @2x) | 1/10 of the button's height |

- Default/recommended iOS button height: 44 pt; PNG logo files only for 44 pt tall buttons (logo+text) or 44x44 pt (logo-only); SVG/PDF for any size.
- Title font size = 43% of button height (button height = 233% of font size, rounded to nearest integer).
- Margin between title and right edge: at least 8% of button width.
- Logo-only button: 1:1 aspect ratio; no extra horizontal padding; use a mask for circle/rounded shapes; margin at least 1/10 of height.
- Up to 3 appearances: white, white with outline, black. Logos in small, medium, large; PNG, SVG, PDF.
- Change log: September 14, 2022.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Let people browse content, then show a sign-in sheet explaining "Sign in to save recipes and sync". / Don't: Open the app on a mandatory sign-in wall.
- Do: Black "Sign in with Apple" button on a white screen, same size as other provider buttons, above the fold. / Don't: A small Apple button below the fold under larger Google/email buttons.
- Do: White button on a dark background. / Don't: Black button on a black background, or outlined white button on a saturated color.
- Do: After sign-in, show "Welcome, Alex" and the app immediately. / Don't: Follow sign-in with a form asking for a password and personal email.
- Do: Mark "Birthday (required by law)" vs. "Phone (optional, for text updates)". / Don't: Present unlabeled extra fields that look mandatory.
- Do: Account screen reading "Using Sign in with Apple" with the relay email visible. / Don't: Hide which method or email the account uses.
- Do: Custom logo-only circular button using Apple's artwork with a mask. / Don't: A cropped or redrawn Apple logo in a custom color.
