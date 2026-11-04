# Buttons
URL: https://developer.apple.com/design/human-interface-guidelines/buttons
## Summary
A button triggers an immediate action and is defined by style, content (symbol and/or text) and role. Use prominence to signal the likely choice, keep hit targets generous, and assign roles carefully so destructive actions are never the default.
## Best practices
- Give buttons enough surrounding space to distinguish and hit them.
- Minimum hit region 44x44 pt.
- Always provide a press state for custom buttons.
- Use a prominent (accent-filled) style for the most likely action; limit to one or two per view.
- Distinguish the preferred option by style, not size; keep paired buttons the same size.
- Avoid label colors similar to colorful content; prefer monochrome labels.
- Make purpose clear via a familiar symbol, text, or both.
- Map familiar actions to familiar icons (e.g. square.and.arrow.up for share).
- Use text when clearer; title case, start with a verb ("Add to Cart").
- Roles: normal, primary, cancel, destructive. Primary uses accent color; destructive uses system red.
- Give the primary role to the most likely choice so Return confirms and temporary views close.
- Never give the primary role to a destructive action.
## iOS specifics
- Show an activity indicator inside a button for non-instant actions, optionally with an alternate label ("Checkout" to "Checking out…"); the indicator replaces the button image.
## Specs & numbers
- Hit region: at least 44x44 pt (visionOS 60x60 pt).
- Prominent buttons per view: one or two.
- Roles: 4 (normal, primary, cancel, destructive).
- visionOS sizes (reference): Mini 28 pt, Small 32 pt, Regular 44 pt, Large 52 pt, Extra large 64 pt; centers at least 60 pt apart; 4 pt padding for 60 pt+ buttons.
- macOS image buttons: about 10 px padding (reference).
## New in iOS 26 / Liquid Glass
- Liquid Glass color guidance: avoid button label colors that match content-layer backgrounds.
- watchOS toolbar buttons get the Liquid Glass appearance (reference).
## Do / Don't
- Do: one filled "Start Cooking" button plus a plain "Save" button, same size. / Don't: three filled accent buttons stacked.
- Do: preferred option via filled style. / Don't: preferred option shown by making it bigger than its neighbor.
- Do: 44x44 pt tap area around a small heart icon. / Don't: a 20 pt icon with no padding.
- Do: "Delete Recipe" in red, not default. / Don't: red Delete as the primary/default button.
- Do: "Import" turning into spinner + "Importing…". / Don't: a frozen button with no feedback.
- Do: share arrow icon for share. / Don't: a custom unfamiliar glyph for share.
