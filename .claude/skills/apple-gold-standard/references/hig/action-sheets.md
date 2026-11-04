# Action sheets
URL: https://developer.apple.com/design/human-interface-guidelines/action-sheets
## Summary
An action sheet is a modal set of choices related to an action the person just started, like discarding or saving a draft. It differs from an alert, which is unexpected and reports a problem.
## Best practices
- Use an action sheet, not an alert, for choices tied to an intentional action.
- Use sparingly; it interrupts.
- Keep the title to one line.
- Add a message only if needed.
- Include Cancel when an action could destroy data; Cancel goes at the bottom (SwiftUI confirmation dialogs add it by default).
- Style destructive choices as destructive and put them at the top.
## iOS specifics
- Use an action sheet, not a menu, for choices that follow an action; menus appear only when people ask to reveal them.
- Avoid scrolling action sheets; keep the button count low.
## Specs & numbers
- Title: one line.
- watchOS (reference): no more than four buttons including Cancel, so at most three other choices.
- Button styles: Default, Destructive, Cancel.
## New in iOS 26 / Liquid Glass
Not mentioned on this page.
## Do / Don't
- Do: tap Cancel on an edited recipe, get "Delete Draft" (red, top), "Save Draft", "Cancel" (bottom). / Don't: an alert with only OK.
- Do: one-line title "Discard changes?". / Don't: a three-line title plus long message.
- Do: three choices plus Cancel. / Don't: eight choices that scroll.
- Do: action sheet after tapping trash. / Don't: a menu popping up automatically after an action.
