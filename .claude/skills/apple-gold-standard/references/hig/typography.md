# Typography
URL: https://developer.apple.com/design/human-interface-guidelines/typography

## Summary
Typography should be legible, express hierarchy, and scale with Dynamic Type. Apple's SF (sans) and New York (serif) variable fonts with built-in text styles give you weight/size/leading combinations that scale automatically; custom fonts must match their legibility and accessibility behavior.

## Best practices
- Respect platform default and minimum sizes for system and custom fonts; go larger for thin weights.
- Test legibility in real contexts; fix with size, contrast, or more legible typefaces.
- Avoid Ultralight, Thin, and Light weights; prefer Regular, Medium, Semibold, Bold.
- Build hierarchy with weight, size, and color, and preserve it as text scales.
- Minimize the number of typefaces.
- Prioritize meaningful content when text grows (e.g., tab titles needn't grow).
- Use built-in text styles for automatic Dynamic Type and accessibility sizes.
- Modify styles with symbolic traits (bold, loose/tight leading); avoid tight leading for 3+ lines.
- Don't embed system fonts; access via Font.Design (default, serif).
- Adjust tracking in mockups to match the running system font (see tracking table).
- Custom fonts must support Dynamic Type and Bold Text.
- Verify layouts at all sizes, including Larger Accessibility Sizes.
- Scale meaningful icons with text (SF Symbols do this).
- Minimize truncation; show as much at the largest AX size as at the largest standard size; use multiline labels.
- At large sizes, stack text above secondary items and reduce column counts.
- Keep primary elements near the top at any size.

## iOS specifics
- System font: SF Pro; New York also available.
- Dynamic Type sizes xSmall through xxxLarge, plus AX1 to AX5; test via Settings > Accessibility > Display & Text Size > Larger Text.
- Emphasized variants via bold() (SwiftUI) or traitBold (UIKit).

## Specs & numbers
Default/minimum: iOS/iPadOS 17/11 pt; macOS 13/10; tvOS 29/23; visionOS 17/12; watchOS 16/12.

iOS/iPadOS Dynamic Type - Large (default):
| Style | Weight | Size (pt) | Leading (pt) | Emphasized |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

Body size/leading across sizes: xS 14/19, S 15/20, M 16/21, L 17/22, xL 19/24, xxL 21/26, xxxL 23/29, AX1 28/34, AX2 33/40, AX3 40/48, AX4 47/56, AX5 53/62.
Large Title across sizes: xS 31/38, S 32/39, M 33/40, L 34/41, xL 36/43, xxL 38/46, xxxL 40/48, AX1 44/52, AX2 48/57, AX3 52/61, AX4 56/66, AX5 60/70.
Caption 2 floor: 11/13 at xS-L; AX5 40/48.

SF Pro tracking (iOS) sample, size: 1/1000 em / pt: 11: +6/+0.06; 12: 0/0.0; 13: -6/-0.08; 15: -16/-0.23; 17: -26/-0.43; 20: -23/-0.45; 22: -12/-0.26; 24: +3/+0.07; 28: +14/+0.38; 34: +12/+0.40; 80+: 0.
Emphasized weights can be medium, semibold, bold, or heavy.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Large Title 34 pt for the screen title, Body 17 pt for content. / Don't: 12 pt body text.
- Do: Semibold Headline for section titles. / Don't: Ultralight 15 pt labels.
- Do: wrap a recipe title to multiple lines at AX sizes. / Don't: truncate it to "Chicken Tikka Ma..."
- Do: stack a timestamp below the title at large sizes. / Don't: squeeze both onto one row until they overlap.
- Do: custom display font for headlines, SF Pro for body. / Don't: four different typefaces on one screen.
- Do: loose leading for long instructions. / Don't: tight leading on a 5-line paragraph.
