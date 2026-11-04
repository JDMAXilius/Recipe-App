# Images
URL: https://developer.apple.com/design/human-interface-guidelines/images

## Summary
Deliver artwork at the right scale factors and formats so it stays sharp on every display. Points are abstract units that map to pixels by scale factor; supply @2x/@3x bitmaps on iOS, prefer vectors where possible, embed color profiles, and test on real devices.

## Best practices
- Provide high-resolution bitmap assets for every supported device, suffixed @1x/@2x/@3x in the asset catalog.
- Design at the lowest resolution and scale up; place vector control points on whole values so they align at 1x, 2x, 3x.
- Use de-interlaced PNG for bitmaps; 8-bit palette PNG when 24-bit color isn't needed.
- Use JPEG (optimized) or HEIC for photos; stereo HEIC for stereo/spatial photos.
- Use PDF or SVG for flat icons and artwork needing high-res scaling.
- Embed a color profile in every image.
- Test images on a range of actual devices for pixelation, stretching, compression.

## iOS specifics
- "No additional considerations for iOS, iPadOS, or macOS."
- iOS needs @2x and @3x; iPadOS @2x.

## Specs & numbers
| Platform | Scale factors |
|---|---|
| iPadOS, watchOS | @2x |
| iOS | @2x and @3x |
| visionOS | @2x or higher |
| macOS, tvOS | @1x and @2x |
- @1x = 1:1 pixel per point; @2x = 2:1; @3x = 3:1.
- tvOS layered images: 2 to 5 layers. visionOS app icons: 2 to 3 layers. visionOS: performance cost rises especially above @6x.
- watchOS autoscaling PDFs (design for 40mm and 42mm at 2x): 38mm 90%, 40mm 100%, 41mm 106%, 42mm 100%, 44mm 110%, 45mm 119%, 49mm 119%.
- Spatial photos: captured on iPhone 15 Pro or later; spatial scenes take up to several seconds to generate.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: ship recipe thumbnails at @2x and @3x. / Don't: ship a single @1x PNG that blurs on iPhone.
- Do: use SVG/PDF for interface icons. / Don't: use a small raster icon scaled up 3x.
- Do: use JPEG or HEIC for food photos. / Don't: use huge 24-bit PNGs for photography.
- Do: embed an sRGB or P3 profile. / Don't: strip color profiles so colors shift.
- Do: check images on an actual small and large iPhone. / Don't: approve art only from a desktop mockup.
