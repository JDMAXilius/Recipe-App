# Text fields
URL: https://developer.apple.com/design/human-interface-guidelines/text-fields

## Summary
A text field is a rectangular area for entering or editing small, specific pieces of text such as a name or email. For larger amounts of text, use a text view.

## Best practices
- Use text fields for small amounts of information; use a text view for longer input.
- Show placeholder hint text (e.g., "Email", "Password") when empty; since it vanishes on typing, consider a separate label too.
- Always use a secure text field for sensitive data such as passwords.
- Size the field to match the expected amount of text.
- Space multiple fields evenly, stack them vertically when possible, and use consistent widths.
- Make tab/focus order move in a logical sequence (the system usually handles this).
- Validate at the right time: email on leaving the field; user name/password before leaving the field.
- Alert people when input doesn't match an allowed format (e.g., non-digits in a digits-only field).
- Use a number formatter for numeric data (decimals, percent, currency), and don't assume presentation; it varies by locale.
- Choose line-break behavior: clip (default), wrap at character/word, or truncate with an ellipsis at beginning, middle, or end.
- Consider an expansion tooltip to reveal clipped text on pointer hover.
- Show the keyboard type that fits the content (numbers, URLs, etc.).

## iOS specifics
- Show a Clear button at the trailing end so people can erase input in one tap.
- Use images and buttons inside fields: leading end indicates purpose, trailing end offers extra features (e.g., the system Bookmarks button).
- Show the appropriate virtual keyboard type for the content.

## Specs & numbers
- No numeric specs stated on this page.
- Truncation positions: beginning, middle, end (3).
- Change log: June 5, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Use a masked secure field for "Password". / Don't: Show the password in plain text in a regular field.
- Do: Show a label "Email" above a field with placeholder "name@example.com". / Don't: Rely only on placeholder text that disappears once typing starts.
- Do: Show the email keyboard (with @) for an email field and the number pad for a ZIP code. / Don't: Show the default alphabetic keyboard for a numeric code.
- Do: Include a trailing clear (x) button in a search or name field. / Don't: Make people hold Delete to erase a long entry.
- Do: Stack form fields vertically with even spacing and consistent widths. / Don't: Scatter fields at random widths and gaps.
- Do: Make a ZIP field short and an address field wide. / Don't: Make a 5-digit field span the full width like a paragraph box.
- Do: Show an inline error when the email field loses focus with an invalid address. / Don't: Wait until form submission to flag every error at once.
