# Settings
URL: https://developer.apple.com/design/human-interface-guidelines/settings

## Summary
Apps should just work with great defaults, offering only a minimal set of customizations. Put general, rarely changed options in a custom settings area, keep task-specific options in the screens they affect, and don't duplicate systemwide settings.

## Best practices
- Choose defaults that give the best experience to the most people.
- Minimize the number of settings; too many hurt approachability and findability.
- Make settings available where people expect (e.g., Command-Comma with a keyboard; Esc in games).
- Don't ask for setup info you can detect (Dark Mode, connected controllers).
- Respect systemwide settings; don't replicate accessibility, scrolling, or authentication options in-app.
- Put general, infrequently changed options (account, saving behavior) in the custom settings area.
- Keep task-specific options (show/hide parts of a view, reorder, filter) in the screens they affect.
- Add only the most rarely changed options to the system Settings app.
- If you use system Settings, consider a button that opens it directly from your UI.

## iOS specifics
None stated (no additional considerations for iOS/iPadOS).

## Specs & numbers
- Keyboard shortcut: Command-Comma (,) opens settings; Esc in games.
- macOS single-pane window title: "App Name Settings".
- Change log: June 10, 2024.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Sort/filter controls in the recipe list's toolbar. / Don't: A "Sort order" option buried in the Settings screen.
- Do: Follow the system appearance automatically. / Don't: A setup question "Do you use Dark Mode?".
- Do: A short Settings list (Account, Notifications, Units). / Don't: Dozens of toggles across many sections.
- Do: Rely on system Dynamic Type and Reduce Motion. / Don't: Custom in-app "Text size" and "Reduce motion" toggles duplicating system settings.
- Do: "Open Settings" button for permissions managed by iOS. / Don't: Telling people to find your app in iOS Settings with no link.
