# App icons
URL: https://developer.apple.com/design/human-interface-guidelines/app-icons

## Summary
Your app icon is a core brand asset that appears on the Home Screen, in Search, notifications, Settings, and share sheets. On iOS, iPadOS, macOS, and watchOS icons are built from a background layer plus foreground layers that the system renders with Liquid Glass effects, ideally authored in Icon Composer.

## Best practices
- Supply the icon as a layered Icon Composer file for maximum control; a flat bitmap gets auto-segmented into two layers.
- Give foreground layers crisp, defined edges, not soft/feathered ones, so system highlights and shadows look right.
- Vary opacity across foreground layers for depth; import opaque layers and tune transparency in Icon Composer.
- Use a background (solid or gradient) that makes the foreground pop; an imported background must be full-bleed and opaque.
- Prefer vector layers (SVG/PDF); outline text; use PNG for mesh gradients and raster art.
- Provide square, unmasked layers; the system applies the rounded mask. Pre-masked layers break highlights and look jagged.
- Keep primary content centered so masking doesn't truncate it; use Apple's production template grids.
- Embrace simplicity: one core idea, minimal shapes, simple background; you don't need to fill the canvas.
- Keep the design consistent across all platforms you ship on.
- Filled, overlapping shapes with transparency and blur read as depth.
- Avoid text unless essential; never words like "Watch", "Play", "New".
- Prefer illustration to photos; avoid very thin lines, sharp corners, replicated UI, or screenshots.
- Don't depict Apple hardware.
- Don't bake in highlights, drop shadows, bevels, blurs, or glows; the system adds dynamic ones. Group layers to apply effects together.
- Keep core features identical across default, dark, clear, and tinted variants; base the dark icon on the light one with complementary colors and avoid excessive brightness.
- Alternate icons are allowed but must stay clearly related to your app.

## iOS specifics
- No additional platform considerations for iOS/iPadOS.
- iOS/iPadOS/macOS Home Screen appearances: default, dark, clear, tinted; system generates any variant you omit.
- Alternate app icons on iOS/iPadOS need their own dark, clear, and tinted variants and pass App Review.

## Specs & numbers
| Platform | Layout shape | After masking | Layout size | Style | Appearances |
|---|---|---|---|---|---|
| iOS, iPadOS, macOS | Square | Rounded rectangle | 1024x1024 px | Layered | Default, dark, clear light, clear dark, tinted light, tinted dark |
| tvOS | Rectangle (landscape) | Rounded rectangle | 800x480 px | Layered (Parallax) | N/A |
| visionOS | Square | Circular | 1024x1024 px | Layered (3D) | N/A |
| watchOS | Square | Circular | 1088x1088 px | Layered | N/A |
- tvOS: 2 to 5 layers; visionOS: background + 1 or 2 layers.
- Color spaces: sRGB, Gray Gamma 2.2, Display P3 (not visionOS).
- System scales down the 1024 px source for Settings, notifications, etc.

## New in iOS 26 / Liquid Glass
- Icons take on Liquid Glass: specular highlights, refraction, translucency, adapting with icon size and possibly across OS versions.
- Auto-segmented bitmaps only get Liquid Glass on large simple shapes, not text or thin lines; use Icon Composer to choose which elements get glass.
- Icon Composer group settings let you tune specular, refraction, translucency per group.
- Clear (light/dark) appearances exist alongside dark and tinted.

## Do / Don't
- Do: a single bold glyph on a solid or gradient background. / Don't: a busy photo collage filling the canvas.
- Do: supply a square, unmasked 1024x1024 layer. / Don't: export with rounded corners already cut.
- Do: let the system add gloss and shadow. / Don't: paint your own drop shadow and bevel.
- Do: keep the same mark in dark and tinted variants. / Don't: swap the mascot for a different symbol in dark mode.
- Do: use a letterform mnemonic if needed. / Don't: write "Play Now" or the full app name in the icon.
- Do: keep content centered with breathing room. / Don't: push art to the edges where the mask clips it.
