# Undo and redo
URL: https://developer.apple.com/design/human-interface-guidelines/undo-and-redo

## Summary
Undo and redo let people reverse actions and experiment safely. Make the outcome predictable, visibly show what changed, allow many levels of undo, and rely on system-standard ways to invoke it.

## Best practices
- Help people predict results: describe the action in the iPhone shake-to-undo alert, with options to undo or cancel.
- Label menu items with the result (e.g., "Undo Typing", "Redo Bold").
- Show the result of each undo/redo, scrolling to offscreen content if needed.
- Allow multiple undos without unnecessary limits, back to a logical point like opening or saving.
- Consider batch-undo for related incremental changes, or "undo all since open/save".
- Provide dedicated buttons only when necessary; then use standard system symbols in a toolbar.

## iOS specifics
- Don't redefine standard gestures: three-finger swipe and shake-to-undo.
- Alert titles get an automatic "Undo " or "Redo " prefix (with trailing space); add a word or two, e.g., "Undo Name", "Redo Address Change".

## Specs & numbers
- Gestures: three-finger swipe; shake iPhone.
- Alert title prefix: "Undo " / "Redo " plus 1-2 words.
- macOS: Command-Z (undo), Shift-Command-Z (redo); at top of the Edit menu.
- Not supported in tvOS or watchOS.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Shake alert titled "Undo Delete Step" with Undo / Cancel. / Don't: Shake alert reading just "Undo?".
- Do: After undoing a deleted ingredient offscreen, scroll to it and briefly highlight it. / Don't: Restore it offscreen with no visible change.
- Do: Undo/redo buttons with standard arrow symbols in the editor toolbar when needed. / Don't: Custom-drawn undo icons floating over content.
- Do: Support many undo steps back to when editing began. / Don't: Limit undo to only the last action.
- Do: Keep three-finger swipe for undo. / Don't: Map three-finger swipe to a custom action.
