# Feedback
URL: https://developer.apple.com/design/human-interface-guidelines/feedback

## Summary
Feedback tells people what's happening, what they can do next, the result of their actions, and how to avoid mistakes. Match the delivery to the significance: passive status for routine info, interruptions only for critical or potentially destructive situations.

## Best practices
- Feedback can convey status, success/failure, warnings, and chances to correct mistakes.
- Match how feedback is delivered to how important it is.
- Make feedback accessible by combining color, text, sound, and haptics so it works when muted, looking away, or using VoiceOver.
- Integrate status near the items it describes (e.g., Mail shows last update and unread count in the toolbar).
- Use alerts for critical, ideally actionable, information; overuse dilutes them.
- Warn before unexpected, irreversible data loss.
- Don't warn when data loss is the expected result (e.g., deleting a file).
- Confirm completion of significant tasks (e.g., an Apple Pay transaction); otherwise people only need to know about failures.
- When a command can't be carried out, say so and explain why.

## iOS specifics
None stated (no additional considerations for iOS/iPadOS).

## Specs & numbers
- No numeric specs on this page.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: "Updated just now - 3 new" text in the toolbar/list header. / Don't: An alert announcing every successful sync.
- Do: Success shown with a checkmark, label, and haptic together. / Don't: A green color flash as the only signal.
- Do: Alert before "Clear all saved recipes" (irreversible, unexpected). / Don't: Confirmation alert every time a single item is swiped to delete (expected).
- Do: Confirmation screen after a completed purchase. / Don't: A "Saved!" toast for every trivial tap.
- Do: Inline message "Add at least one ingredient to continue". / Don't: A disabled button with no explanation of why.
