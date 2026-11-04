# Dark Mode
URL: https://developer.apple.com/design/human-interface-guidelines/dark-mode

## Summary
Dark Mode is a systemwide setting people expect every app to respect, using dimmer backgrounds and brighter foregrounds rather than a simple inversion. Use semantic, adaptive colors and assets so your app looks right in light, dark, and Auto, including with Increase Contrast and Reduce Transparency.

## Best practices
- Don't offer an in-app appearance toggle; follow the system setting.
- Look good in both modes, and handle Auto switching while running.
- Test legibility in Dark Mode with Increase Contrast and Reduce Transparency, separately and combined.
- Only in rare cases (e.g., immersive media viewing) use a permanently dark UI.
- Dark palette colors are not necessarily inversions of light ones.
- Use semantic colors that adapt; for custom colors, add a Color Set with light and dark variants; avoid hard-coded values.
- Contrast: never below 4.5:1; aim for 7:1 for custom colors, especially small text.
- Slightly darken content images with white backgrounds so they don't glow.
- Use SF Symbols with dynamic colors or vibrancy.
- Make separate light/dark interface icons when needed (e.g., a full moon needing an outline on light backgrounds; an oil drop needing a border on dark).
- Use one asset if it works in both modes; otherwise provide both in one named asset-catalog image.
- Use system label colors (primary through quaternary) and system text views/fields so vibrancy is handled.

## iOS specifics
- Two background sets in Dark Mode: base (dimmer, recedes) and elevated (brighter, advances).
- The system automatically switches to elevated for foreground UI like popovers and modal sheets, and for multitasking/multiwindow separation.
- Prefer system background colors; custom backgrounds hide these depth cues.

## Specs & numbers
- Minimum contrast ratio 4.5:1; target 7:1 for custom foreground/background, especially small text.
- Dark Mode not supported on visionOS or watchOS.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: follow the system appearance automatically. / Don't: add a "Dark theme" switch in your app's settings.
- Do: present a sheet using the elevated dark background so it reads above the base screen. / Don't: paint sheets and base screens the same custom black.
- Do: dim a white-background product photo a little in dark mode. / Don't: show a glaring pure-white image block on a black screen.
- Do: use secondaryLabel for metadata text. / Don't: hard-code #666666 gray that disappears on dark backgrounds.
- Do: add a thin outline to a dark icon shown on dark backgrounds. / Don't: let a black glyph vanish on a near-black surface.
- Do: test with Increase Contrast + Reduce Transparency on. / Don't: ship dark text on dark glass untested.
