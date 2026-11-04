# Layout
URL: https://developer.apple.com/design/human-interface-guidelines/layout

## Summary
A good layout orders content by importance, groups and aligns related items, and adapts gracefully across screen sizes, orientations, windows, and text sizes. Use size classes, safe areas, and system layout guides rather than device type, and separate controls from content with Liquid Glass and scroll edge effects.

## Best practices
- Put the most important content at the top and leading side (reading order); use system components so RTL layouts flip automatically.
- Align elements for scannability; indent to show subordination.
- Group related items with negative space, container shapes, or separators.
- Use progressive disclosure (disclosure triangles, menus, nested views, scrollable sections) to reduce initial clutter.
- Differentiate controls from content using Liquid Glass; extend full-screen backgrounds beneath sidebars, toolbars, and tab bars.
- Design layouts that adapt to rotation, resizing, extra displays, and device changes by respecting safe areas, margins, and guides.
- Even orientation-locked apps must resize well.
- Prepare for Dynamic Type: stack side-by-side views vertically, let rows grow, allow multiline text.
- Preview on multiple devices, size classes, localizations, and text sizes; test smallest and largest first (Device Hub helps catch clipping).
- Scale background art to fill rather than changing its aspect ratio; expect very wide/short or tall/narrow windows.
- Decide layout by size class, not device idiom or orientation.
- Consider every size-class combination in portrait and landscape.
- Keep functionality identical across size classes; only the amount visible changes (e.g., tab bar to sidebar in wider space).
- Keep layouts recognizable for the platform even when resized.
- Respect safe areas so the Dynamic Island, status bar, toolbars, and tab bars never cover content or controls.

## iOS specifics
- "No additional considerations for iOS or iPadOS."
- Size classes: horizontal compact (narrow) or regular (wide); vertical compact (short) or regular (tall). Set by device, window configuration, and multitasking (full screen, Slide Over, iPhone Mirroring on Mac).
- Characteristics to handle: size classes, screen sizes, orientations/aspect ratios, Dynamic Island, external displays, Display Zoom, resizable windows, text size, locale/RTL.

## Specs & numbers
- No iPhone device size / safe-area inset / margin table appears in this version of the page (change log notes device specs were added in earlier revisions through iPhone 17 family, Sept 9, 2025; page refreshed Sept 9, 2026 and the extracted text contains no device dimensions).
- tvOS safe area: inset content 60 pt top/bottom, 80 pt sides.
- tvOS grids (unfocused width / horizontal spacing / min vertical spacing): 2-col 860/40/100 pt; 3-col 560/40/100; 4-col 410/40/100; 5-col 320/40/100; 6-col 260/40/100; 7-col 217/40/100; 8-col 184/40/100; 9-col 160/40/100.
- visionOS: button centers at least 60 pt apart.
- watchOS: max 3 glyph buttons or 2 text buttons in a row.

## New in iOS 26 / Liquid Glass
- Use Liquid Glass to give controls a distinct appearance from content.
- Instead of a solid or semi-opaque fill under controls, use a scroll edge effect to lift controls above content.
- Extend full-screen background content under sidebars, toolbars, and tab bars.
- Background extension effect (backgroundExtensionEffect() / UIBackgroundExtensionView) mirrors and blurs an image under adjacent sidebars/inspectors so it appears to continue beneath them.

## Do / Don't
- Do: let a hero photo run edge to edge under the floating tab bar and nav bar. / Don't: stop the image at a solid bar background.
- Do: use a scroll edge effect behind the top toolbar as content scrolls. / Don't: put an opaque white strip behind the toolbar buttons.
- Do: stack the timestamp under the title at AX text sizes. / Don't: let a long title overlap a trailing timestamp.
- Do: keep the main title and primary action at the top leading area. / Don't: bury the primary action at the bottom of a long scroll.
- Do: switch from tab bar to sidebar in regular width with the same features. / Don't: drop features in compact width.
- Do: keep buttons inside the safe area clear of the Dynamic Island and home indicator. / Don't: place a tappable icon under the status bar.
