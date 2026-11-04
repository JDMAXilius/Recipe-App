# SF Symbols
URL: https://developer.apple.com/design/human-interface-guidelines/sf-symbols

## Summary
SF Symbols is Apple's library of thousands of configurable symbols that align with the San Francisco font in every weight and size. Symbols support multiple rendering modes, gradients, variable color, weights, scales, design variants, and a rich set of animations; custom symbols should follow the same templates.

## Best practices
- Use symbols for icons in toolbars, tab bars, menus, and inline text; check OS availability per symbol.
- Don't use symbols (or look-alikes) in app icons, logos, or trademarks.
- Pick a rendering mode per context and verify legibility; "automatic" gives the preferred mode but check it.
- Use system colors so symbols adapt to Dark Mode, vibrancy, and accessibility.
- Use variable color to show change (capacity, strength), not depth; use Hierarchical for depth.
- Match symbol weight to adjacent text weight; use scale to adjust emphasis without breaking weight matching.
- Outline variant suits toolbars, lists, and inline-with-text; fill gives emphasis (tab bars, swipe actions, selection); enclosed shapes aid legibility at small sizes; slash shows unavailability.
- Often the container picks the variant (iOS tab bar uses fill, toolbar uses outline).
- Apply animations judiciously and purposefully, aligned with your app's tone.
- Custom symbols: start from an exported template; match detail, optical weight, alignment, perspective; keep them simple, recognizable, inclusive, directly related.
- Use negative side margins for badged symbols (naming like "left-margin-Regular-M").
- Annotate layers for animation; draw whole shapes with erase layers rather than cutouts; test all animation presets.
- Use the component library for enclosures/badges rather than baking them in.
- Provide accessibility labels for custom symbols.
- Don't customize or replicate Apple product symbols.

## iOS specifics
- "No additional considerations" on any platform.
- iOS tab bars prefer the fill variant; toolbars take outline.

## Specs & numbers
- 4 rendering modes: monochrome, hierarchical, palette, multicolor.
- Example: cloud.sun.rain.fill has 3 layers (cloud, sun, raindrops).
- Palette with 2 colors on a 3-level symbol: secondary and tertiary share a color.
- Variable color thresholds between 0 and 100%.
- 9 weights (ultralight to black), 3 scales (small, medium default, large) relative to SF cap height.
- Gradients and Draw On/Off: SF Symbols 7+.
- Animations: Appear, Disappear, Bounce, Scale, Pulse, Variable color (cumulative or iterative; open vs. closed loop), Replace (down-up, up-up, off-up), Magic Replace (default replace), Wiggle, Breathe, Rotate (incl. By Layer), Draw On / Draw Off.
- Script variants include Latin, Arabic, Hebrew, Hindi, Thai, Chinese, Japanese, Korean, Cyrillic, Devanagari, Indic numerals.

## New in iOS 26 / Liquid Glass
Not mentioned on this page (SF Symbols 7 adds gradient rendering and Draw On/Off).

## Do / Don't
- Do: filled heart in the selected tab, outline heart in the toolbar. / Don't: mix filled and outline styles randomly in one toolbar.
- Do: match symbol weight to semibold label text. / Don't: pair an ultralight symbol with bold text.
- Do: use speaker.wave.3 variable color for volume levels. / Don't: use variable color to fake depth.
- Do: bell.slash to show notifications off. / Don't: a grayed-out bell with no other cue.
- Do: a single bounce when an item is added to the list. / Don't: pulse, wiggle, and rotate several icons at once.
- Do: add an accessibility label to a custom "whisk" symbol. / Don't: ship a custom symbol VoiceOver reads as "image".
