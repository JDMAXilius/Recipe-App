# Offering help
URL: https://developer.apple.com/design/human-interface-guidelines/offering-help

## Summary
The best experiences are intuitive, but contextual help fills the gaps. Match help to the task (inline for simple, tutorials for complex), keep language platform-correct and inclusive, and use short, targeted TipKit tips for simple or less obvious features.

## Best practices
- Let the task shape the help: an inline view for one- or two-step tasks, a tutorial for complex multistep goals.
- Tie help to what the person is doing right now; make it easy to dismiss or skip.
- Use consistent, context-appropriate language and images (say "tap" on iPhone, not "click").
- Make help inclusive.
- Don't explain standard components; describe what they do in your app.
- For unique controls or unusual input, orient people quickly with animation or graphics rather than long text.
- Tips are small, transient views teaching new, less obvious, or faster ways to do things (TipKit).
- Use a popover tip to preserve content flow; an inline tip to keep surrounding info visible.
- Inline tips: annotation style when pointing at a UI element; hint style when not tied to one.
- Use tips only for simple features; more than three actions is too complex for a tip.
- Keep tips to one or two sentences, direct and action-oriented, with no promotional or off-context content.
- Use parameter- or event-based eligibility rules; don't show tips for features already used.
- Throttle multiple tips (e.g., once every 24 hours).
- Include a related symbol, preferably the filled variant (e.g., a star for favorites).
- Don't repeat the same image in the tip and the UI it points to.
- Add a button to jump to settings or a learn-more/setup flow when helpful.

## iOS specifics
None stated (no additional considerations for iOS/iPadOS; iPhone/iPad apps running on Mac can show tooltips).

## Specs & numbers
- Tips: max "one or two sentences".
- Tip complexity limit: more than three actions is too complicated.
- Example tip cadence: once every 24 hours.
- Tooltips (Mac/visionOS): 60 to 75 characters max; sentence case; start with a verb.
- Change log: December 5, 2023; September 12, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Popover tip pointing at the heart icon: "Tap to save recipes to Favorites." / Don't: A tip explaining how a standard back button works.
- Do: Tip with a filled star symbol for a favorites feature. / Don't: A tip that repeats the exact same icon right next to that icon.
- Do: One-sentence tip with a "Customize" button linking to settings. / Don't: A three-paragraph tip describing a five-step workflow.
- Do: Show the tip only to people who haven't used the feature. / Don't: Show the same tip to everyone on every launch.
- Do: Inline hint tip at the top of a list explaining a swipe action. / Don't: A tip promoting your premium subscription.
- Do: Copy saying "tap" on iPhone. / Don't: Copy saying "click" on iPhone.
