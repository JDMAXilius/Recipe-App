# Color
URL: https://developer.apple.com/design/human-interface-guidelines/color

## Summary
Color communicates status, hierarchy, brand, and interactivity, but must stay consistent and never be the only signal. Apple recommends dynamic system colors (which adapt to light, dark, Increase Contrast, and vibrancy) and, for custom colors, supplying all those variants; Liquid Glass adds rules for tinting controls sparingly.

## Best practices
- Don't let one color mean two things (e.g., brand tint for both interactive and static text).
- Make every color work in light, dark, and increased-contrast contexts; custom colors need light + dark + high-contrast versions of each.
- Provide light and dark colors even if the app ships in one appearance, to support Liquid Glass adaptivity.
- Test under bright sun and dim light, on True Tone and various displays/profiles.
- Watch how artwork and translucent bars shift nearby colors.
- Use system color pickers when people choose colors.
- Never rely on color alone; add labels or glyph shapes. Ensure contrast; consider cultural meanings (red = danger vs. luck).
- Don't hard-code system color values; they change between releases. Use the APIs.
- Use dynamic system colors for their semantic purpose only (don't use separator as text color, or secondaryLabel as a background).
- Embed color profiles; sRGB is accurate on most displays. Use Display P3 at 16 bits/channel exported as PNG for wide color; provide per-color-space variants if P3 colors clip or merge on sRGB.

## iOS specifics
- Two background sets, each with primary/secondary/tertiary: system (systemBackground, secondarySystemBackground, tertiarySystemBackground) and grouped (systemGroupedBackground, secondary..., tertiary...) for grouped table views.
- Primary = overall view; secondary = groups within it; tertiary = groups within secondary.
- Foreground dynamic colors: label, secondaryLabel, tertiaryLabel, quaternaryLabel, placeholderText, separator (lets content show through), opaqueSeparator, link.
- Gray scale systemGray through systemGray6 (SwiftUI `gray` = systemGray).

## Specs & numbers
System colors (RGB) - Default light / Default dark / Increased contrast light / Increased contrast dark:
| Name | Light | Dark | IC light | IC dark |
|---|---|---|---|---|
| Red | 255,56,60 | 255,66,69 | 233,21,45 | 255,97,101 |
| Orange | 255,141,40 | 255,146,48 | 197,83,0 | 255,160,86 |
| Yellow | 255,204,0 | 255,214,0 | 161,106,0 | 254,223,67 |
| Green | 52,199,89 | 48,209,88 | 0,137,50 | 74,217,104 |
| Mint | 0,200,179 | 0,218,195 | 0,133,117 | 84,223,203 |
| Teal | 0,195,208 | 0,210,224 | 0,129,152 | 59,221,236 |
| Cyan | 0,192,232 | 60,211,254 | 0,126,174 | 109,217,255 |
| Blue | 0,136,255 | 0,145,255 | 30,110,244 | 92,184,255 |
| Indigo | 97,85,245 | 109,124,255 | 86,74,222 | 167,170,255 |
| Purple | 203,48,224 | 219,52,242 | 176,47,194 | 234,141,255 |
| Pink | 255,45,85 | 255,55,95 | 231,18,77 | 255,138,196 |
| Brown | 172,127,94 | 183,138,102 | 149,109,81 | 219,166,121 |

iOS/iPadOS system grays:
| Name | Light | Dark | IC light | IC dark |
|---|---|---|---|---|
| systemGray | 142,142,147 | 142,142,147 | 108,108,112 | 174,174,178 |
| systemGray2 | 174,174,178 | 99,99,102 | 142,142,147 | 124,124,128 |
| systemGray3 | 199,199,204 | 72,72,74 | 174,174,178 | 84,84,86 |
| systemGray4 | 209,209,214 | 58,58,60 | 188,188,192 | 68,68,70 |
| systemGray5 | 229,229,234 | 44,44,46 | 216,216,220 | 54,54,56 |
| systemGray6 | 242,242,247 | 28,28,30 | 235,235,240 | 36,36,38 |
(RGB values taken from swatch alt text in the page JSON; the extracted text table had blank cells.) visionOS uses the default dark values. Wide color: Display P3, 16 bits per channel, PNG.

## New in iOS 26 / Liquid Glass
- Liquid Glass is colorless by default and picks up color from content behind it; you can tint some elements (stained-glass look), which is how prominent buttons are styled.
- Small elements (toolbars, tab bars) flip between light/dark glass based on content; their symbols/text are monochrome by default (dark over light content, light over dark). Larger elements like sidebars are more opaque.
- Tint sparingly: only status indicators or primary actions. Emphasize a primary action by tinting the background (as with Done), not its label. Don't tint the background of multiple controls.
- Over colorful content, prefer monochrome bars or a clearly distinct accent; in mostly monochrome apps, brand color as accent works well.
- Avoid similar colors overlapping between content and controls; ensure the resting state (top of scroll) is legible.

## Do / Don't
- Do: tint only the Done button's glass background with the accent color. / Don't: tint every toolbar button.
- Do: use systemGroupedBackground behind an inset grouped settings list. / Don't: use separator gray as body text color.
- Do: keep tab bar icons monochrome over a colorful photo feed. / Don't: use a red accent label over a red-heavy hero image.
- Do: show "Out of stock" text with a gray dot. / Don't: indicate stock state only with green vs. red dots.
- Do: supply light, dark, and high-contrast variants for a custom brand green. / Don't: hard-code one hex value everywhere.
- Do: keep the top of a scroll view legible under the floating bar. / Don't: start content with a bright banner the same color as the bar's labels.
