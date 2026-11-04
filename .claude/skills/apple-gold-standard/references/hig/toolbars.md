# Toolbars
URL: https://developer.apple.com/design/human-interface-guidelines/toolbars
## Summary
A toolbar is a horizontal set of controls along the top or bottom edge that holds the view title, navigation (back, search) and actions. In iOS the top toolbar is what used to be called the navigation bar. Unlike a tab bar, it acts on the current view rather than switching app areas.
## Best practices
- Choose items deliberately; too many become hard to tell apart and hit.
- Decide which items move to overflow as width shrinks; don't add an overflow menu manually (system does it on iPadOS/macOS).
- Use a More menu only when really needed, for lower-priority actions.
- Minimize custom bar backgrounds and tinted controls; let content color the bar and use a scroll edge effect to separate bar from content.
- Avoid item label colors similar to colorful content; prefer default monochrome.
- Prefer standard components; their corner radii are concentric with the bar. Custom components must match that concentricity.
- Consider hiding toolbars contextually for distraction-free reading, with a reliable way to bring them back.
- Title every view usefully; leave it empty if redundant. Never use the app name as title.
- Keep titles to a word or short phrase, under 15 characters.
- Use standard Back and Close buttons with standard symbols, not text saying "Back" or "Close".
- Prioritize actions people use most; make each control's meaning obvious.
- Prefer simple system symbols without borders (no outlined circles); text only for things like Edit.
- Use the .prominent style for one key action (Done, Submit), placed on the trailing side.
- Group items logically by function and frequency; aim for at most three groups.
- Put navigation and critical actions (Done, Close, Save) in their own distinct groups.
- Keep text-labeled actions separate from symbol actions; add fixed space between text buttons.
- Keep groupings consistent across platforms.
## iOS specifics
- Space is tight: include only essential items; put the rest in a More menu.
- Use a large title that collapses to a standard title on scroll and returns at the top (prefersLargeTitles).
- In iOS a navigation-focused top toolbar is called a navigation bar.
- iPadOS: a toolbar and tab bar can share the same horizontal space at the top.
## Specs & numbers
- Title: under 15 characters.
- Groups: maximum of three.
- Primary (.prominent) action: one, trailing side.
- Positions: leading edge, center, trailing edge.
## New in iOS 26 / Liquid Glass
- Use ScrollEdgeEffectStyle to separate bar from content instead of custom backgrounds.
- Standard controls are concentric with bar corners; customs must match.
- Borderless symbols: grouped sections provide the visible container.
- .prominent style tints the single key action.
- Liquid Glass color: avoid label colors matching content.
## Do / Don't
- Do: top bar with back chevron, title "Pasta", trailing tinted "Done". / Don't: a text button reading "Back" plus two tinted buttons.
- Do: three trailing symbols in one glass group (share, heart, more). / Don't: five outlined-circle icons each in their own group.
- Do: title "Groceries". / Don't: title "Otto Recipe App".
- Do: fixed space between "Edit" and "Select" text buttons. / Don't: "Edit Select" running together next to a symbol.
- Do: content-colored bar with scroll edge effect. / Don't: solid brand-colored opaque bar background.
- Do: large title "Recipes" collapsing to inline on scroll. / Don't: a permanently large title eating space while scrolling.
