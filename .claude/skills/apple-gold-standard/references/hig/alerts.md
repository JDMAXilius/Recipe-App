# Alerts
URL: https://developer.apple.com/design/human-interface-guidelines/alerts
## Summary
An alert interrupts with critical information that needs action now, such as a problem or an irreversible destructive step. Use them rarely, with specific titles and action-named buttons.
## Best practices
- Use alerts sparingly; each must be essential and actionable.
- Don't use an alert just to inform; show info in context instead.
- Skip alerts for common, undoable actions even if destructive; alert for rare, irreversible ones.
- Don't show an alert at app launch; use cached data and a quiet label for issues like no network.
- Content: title, optional message, up to three buttons; iOS can include a text field.
- Direct, neutral tone; don't hide severity or blame.
- Title: specific, describes what happened; no "Error"; no more than two lines.
- Sentence titles get sentence case and punctuation; fragments get title case, no punctuation.
- Add a message only if it adds value; don't explain buttons.
- Text field only if input is needed (e.g. password).
- Buttons: one or two words, verbs tied to the text ("Delete", "Reply"); sentence case, no punctuation.
- Use "OK" only for purely informational alerts; avoid "Yes"/"No".
- Default/likely button on trailing side of a row or top of a stack; Cancel on leading side or bottom.
- Destructive style only for destructive actions the person didn't deliberately choose.
- Include a button titled "Cancel" whenever there's a destructive action; never make Cancel the default.
- Single default button: use "Done", not "Cancel".
## iOS specifics
- Use an action sheet, not an alert, for choices related to an intentional action.
- Avoid scrolling alerts: short titles, brief message only when necessary.
- Alternate cancel: exit to Home Screen; Esc or Command-Period on a keyboard.
## Specs & numbers
- Buttons: up to three.
- Title: no more than two lines.
- Button titles: one or two words.
- visionOS accessory view (reference): max height 154 pt, 16 pt corner radius.
## New in iOS 26 / Liquid Glass
Not mentioned on this page.
## Do / Don't
- Do: "Delete 'Lasagna'? This can't be undone." with Cancel / Delete. / Don't: "Error 329347" with "OK".
- Do: undoable swipe-to-delete with no alert. / Don't: an alert every time a list item is deleted.
- Do: offline banner with cached recipes at launch. / Don't: "No connection" alert on app open.
- Do: buttons "Cancel" (leading) and "Delete" (trailing). / Don't: buttons "No" and "Yes".
- Do: two-line title max. / Don't: a long paragraph that makes the alert scroll.
