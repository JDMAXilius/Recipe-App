# Toggles
URL: https://developer.apple.com/design/human-interface-guidelines/toggles

## Summary
A toggle switches between two opposing states (such as on/off) and looks visibly different in each. Styles include the switch and the checkbox; every platform also supports buttons that act as toggles by changing appearance per state.

## Best practices
- Use a toggle only for choosing between two opposing values that change the state of content or a view.
- For other actions, such as picking from a list, use a different control (for example a pop-up button).
- Make clear which setting, view, or content the toggle affects; usually surrounding context is enough.
- For a button that acts as a toggle, use an interface icon that signals its purpose and change its appearance (typically the background) per state.
- Make the visual difference between states obvious: add/remove a fill, show/hide the background shape, or change inner details like a checkmark or dot.
- Don't rely on color alone to show state, since not everyone perceives color differences.
- (macOS context) Radio buttons usually come in groups of two to five; past about five options, use a pop-up button instead.
- (macOS context) Use a checkbox, with indentation and leading-edge alignment, to show a hierarchy of dependent settings; show a mixed state when sub-options differ.

## iOS specifics
- Use the switch style only inside a list row; no label is needed because the row content gives context.
- Change the switch's default green only if necessary, for example to your accent color; keep enough contrast against the off appearance.
- Outside a list, use a button that behaves like a toggle, not a switch (e.g., Phone app's filter button gets a blue highlight when active).
- Don't add a label explaining that toggle button's purpose; the icon plus the alternate background states communicate it.

## Specs & numbers
- Two opposing states per toggle.
- Default iOS switch color: green.
- Checkbox states: on, off, mixed (3).
- Radio buttons: typically groups of 2 to 5; consider a pop-up button beyond about 5 options.
- Change log: March 29, 2024; September 12, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Put a switch at the trailing edge of a Settings-style list row titled "Wi-Fi". / Don't: Float a standalone switch in the middle of a content screen outside any list.
- Do: Use a toolbar filter icon button that gains a tinted highlight background when active. / Don't: Use a switch in a toolbar or nav bar to turn a filter on.
- Do: Show on/off with fill plus knob position (or a checkmark). / Don't: Distinguish on/off only by a red vs. green color change.
- Do: Keep the default green or use a high-contrast accent tint for the on state. / Don't: Use a pale tint that barely differs from the off track.
- Do: Let the row label ("Notifications") explain the switch. / Don't: Add extra text like "Tap to turn on" next to the switch.
- Do: Use a list or menu to choose among several options. / Don't: Use a row of toggles to pick one item from a list.
