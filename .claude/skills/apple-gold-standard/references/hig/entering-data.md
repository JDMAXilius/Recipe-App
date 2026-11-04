# Entering data
URL: https://developer.apple.com/design/human-interface-guidelines/entering-data

## Summary
Make it easy and error-free for people to give you information. Pre-gather what you can from the system, support every input method, prefer choices over typing, and validate as people go.

## Best practices
- Pre-gather information to minimize what people must supply.
- Support all available input methods so people can choose.
- Get data from the system (settings, location, calendar with permission) rather than asking.
- Be clear about what you need: placeholder (e.g., "username@company.com") or a label ("Email").
- Prefill reasonable defaults to speed entry.
- Use secure text entry for sensitive data; it shows a small filled circle per character.
- Never prepopulate a password field; use entry, biometrics, or keychain.
- Offer choices (picker, menu, selection) instead of free text when possible.
- Support drag and drop and paste.
- Validate values dynamically and give feedback as soon as a problem is detected.
- Use number formatters for numeric fields (numeric-only, decimals, percent, currency).
- Make required data obvious; enable Next/Continue only after required fields are filled.

## iOS specifics
None stated (no additional considerations for iOS/iPadOS; iOS/iPadOS apps running on Mac can use expansion tooltips for truncated text).

## Specs & numbers
- Secure fields display "a small filled circle symbol for each character".
- Change log: June 21, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Use location permission to fill in the person's city. / Don't: A required "City" text field.
- Do: Field labeled "Email" with placeholder "username@company.com". / Don't: An unlabeled empty field.
- Do: A picker for servings (1-12) or units (g, oz, cups). / Don't: Free-text "Unit" field.
- Do: Inline red hint "Enter a valid email" right after leaving the field. / Don't: Show all errors only after tapping Submit on a long form.
- Do: Continue button disabled until required fields are filled. / Don't: Let people tap Continue, then bounce them back.
- Do: Empty secure password field with Face ID/keychain option. / Don't: Password field pre-filled with dots.
- Do: Paste a recipe URL or drag in text. / Don't: Block paste in input fields.
