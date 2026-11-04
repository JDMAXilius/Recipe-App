# Materials
URL: https://developer.apple.com/design/human-interface-guidelines/materials

## Summary
Materials create depth and hierarchy by letting background color pass through foreground layers. Apple platforms have two kinds: Liquid Glass, a floating functional layer for controls and navigation, and standard materials (blur and vibrancy) for structure within the content layer.

## Best practices
- Reserve Liquid Glass for the control/navigation layer (tab bars, sidebars, toolbars) that floats above content.
- Don't use Liquid Glass in the content layer; use standard materials there (e.g., app backgrounds). Exception: transient controls like sliders and toggles take on glass while active.
- Apply glass to custom controls sparingly, only the most important functional elements.
- Use the regular glass variant by default and when there's lots of text (alerts, sidebars, popovers) or legibility risk.
- Use clear glass only over visually rich media (photos, video).
- With clear glass over bright content, add a dark dimming layer; skip it over dark content or AVKit controls that already dim.
- Choose standard materials by semantic purpose, not the color they appear to impart.
- Always place vibrant (system-defined) colors on top of materials.
- Thicker = more opaque, better for fine text; thinner = more translucent, keeps context visible.

## iOS specifics
- Four standard materials for the content layer: ultraThin, thin, regular (default), thick.
- Vibrant label levels (any material): label (default), secondaryLabel, tertiaryLabel, quaternaryLabel. Avoid quaternary on thin and ultraThin (too low contrast).
- Vibrant fills (all materials): fill (default), secondaryFill, tertiaryFill.
- One separator vibrancy value, works on all materials.
- Default level = highest contrast; quaternary = lowest.

## Specs & numbers
- Clear Liquid Glass dimming layer over bright content: dark, 35% opacity.
- iOS: 4 standard materials; label vibrancy 4 levels; fill vibrancy 3 levels; separator 1 level.
- Liquid Glass: 2 variants (regular, clear).
- visionOS vibrancy: 3 values (label, secondaryLabel, tertiaryLabel).

## New in iOS 26 / Liquid Glass
- Liquid Glass forms a distinct layer above content; content scrolls and peeks through beneath.
- Regular variant blurs and adjusts luminosity of background; scroll edge effects further blur and fade content underneath for legibility. Most system components use regular.
- Clear variant is highly translucent for media-heavy screens.
- Appearance can change with the user's preferred Liquid Glass look and with Reduce Transparency / Increase Contrast.
- System components adopt glass automatically.

## Do / Don't
- Do: put a floating glass tab bar above a scrolling recipe feed. / Don't: make each recipe card a glass panel.
- Do: use clear glass playback controls over a full-screen video with a 35% dark dim when the frame is bright. / Don't: put clear glass with white text over a bright sky without dimming.
- Do: use regular glass for an alert with paragraphs of text. / Don't: use clear glass for a text-heavy popover.
- Do: use a thin standard material behind a content-layer header. / Don't: choose a material because it "looks blue".
- Do: use secondaryLabel vibrancy on a thick material. / Don't: use quaternaryLabel text on ultraThin.
- Do: glass only the one key floating action. / Don't: apply glass to every custom button.
