# Loading
URL: https://developer.apple.com/design/human-interface-guidelines/loading

## Summary
The best loading experience finishes before people notice it. Show content or placeholders immediately, let people do other things while loading happens in the background, and clearly communicate progress when waits are unavoidable.

## Best practices
- Show something as soon as possible; an empty screen reads as a bug.
- Use placeholder text, graphics, or animations and replace them as real content arrives.
- Load in the background so people can keep using other parts of the app.
- For unavoidably long loads, give people something worthwhile to look at (tips, hints, new features).
- Estimate remaining time accurately so placeholder content neither runs out nor repeats.
- Download large assets in the background (Background Assets framework) right after install, during updates, or at other nondisruptive times.
- Clearly show that content is loading and how long it may take, using system progress indicators.
- Use a determinate indicator when duration is known; indeterminate when it isn't.
- Games may use a custom loading view that matches their style.

## iOS specifics
None stated (no additional considerations for iOS/iPadOS).

## Specs & numbers
- Use progress indicators when loading takes "more than a moment or two".
- watchOS: if content needs "a second or two", a loading indicator beats a blank screen.
- Change log: June 9, 2025; June 10, 2024.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Skeleton rows/cards in the list while recipes load. / Don't: A blank white screen until all data arrives.
- Do: Keep tabs and search usable while a feed loads in the background. / Don't: A full-screen blocking spinner over the whole app.
- Do: A determinate progress bar with percent for a known-size download. / Don't: An endless spinner for a download whose size you know.
- Do: Show a helpful tip card during a long import. / Don't: Repeat the same tip three times during one wait.
- Do: Fade images in as they load into placeholder frames. / Don't: Let the layout jump as images pop in with no reserved space.
