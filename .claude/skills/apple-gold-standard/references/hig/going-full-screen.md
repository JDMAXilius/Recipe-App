# Going full screen
URL: https://developer.apple.com/design/human-interface-guidelines/going-full-screen

## Summary
iPhone, iPad, and Mac offer full-screen modes that hide system controls for distraction-free focus on games, media, or deep tasks. Keep essential controls reachable, let people decide when to exit, resume state when they return, and avoid accidental exits.

## Best practices
- Offer full screen for games, media (videos, slideshows), or in-depth tasks.
- Adjust layout subtly for the larger space; don't programmatically resize the window or change which items appear.
- Keep essential controls available (e.g., persistent or easily revealed playback controls).
- Except in games, let people reveal the Dock on iPadOS/macOS.
- In games, you can have iPadOS ignore the first bottom-edge swipe to avoid accidental Dock reveals.
- Pause and resume where people left off when they switch away and return.
- Let people choose when to exit; don't auto-exit at the end of a movie or game.
- Temporarily hide toolbars and navigation when content is the focus (photos, reading).
- Restore hidden controls with familiar actions: tap, swipe down, or move the cursor to the top.
- Keep controls visible when they're essential for navigation or tasks.

## iOS specifics
- The Home Screen indicator auto-hides shortly after entering the app and reappears when the bottom area is touched; one swipe exits.
- Keep that default when possible; if it causes unexpected exits, defer system gestures to require two swipes (preferredScreenEdgesDeferringSystemGestures).

## Specs & numbers
- Default: one swipe to exit; deferred: two swipes.
- macOS: Control-Command-F enters full screen.
- Not supported in tvOS, visionOS, or watchOS.
- Change log: June 9, 2025 (hiding toolbars/navigation; deferring Home indicator gestures); June 10, 2024.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Full-screen step-by-step cooking view with controls that reappear on tap. / Don't: Hide the Next/Previous step buttons with no way to reveal them.
- Do: Hide the nav bar while viewing a full-screen photo; tap to bring it back. / Don't: Keep heavy toolbars covering the photo the whole time.
- Do: Pause the video when the person leaves and resume on return. / Don't: Keep playing in the background so they miss content.
- Do: Stay in full screen after a video ends until the person exits. / Don't: Snap back out of full screen automatically when playback ends.
- Do: Require two swipes to exit only in a game where accidental exits occur. / Don't: Override the Home indicator gesture in an ordinary app.
