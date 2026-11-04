# Live Activities
URL: https://developer.apple.com/design/human-interface-guidelines/live-activities

## Summary
A Live Activity lets people follow an ongoing task or event (delivery, match, workout, ride) at a glance, with frequent updates over a few hours and optional light interaction. It starts on iPhone/iPad and appears on the Lock Screen, in the Dynamic Island, StandBy, Mac menu bar, Apple Watch Smart Stack, and CarPlay, and must support compact, minimal, expanded, and Lock Screen presentations.

## Best practices
- Use for tasks/events with a defined start and end, ideally lasting no more than eight hours.
- Prioritize the few facts people need at a glance; tap opens the app for detail.
- Never show ads or promotions.
- Avoid sensitive info; show an innocuous summary or redact, and let people opt in to showing sensitive data.
- Match the app's look in light and dark; show a logo mark without a container, never the full app icon.
- Don't add app UI that points at the Dynamic Island.
- Use large, medium-or-heavier weight text; small text sparingly.
- Use only the space needed; adapt sizes and placement; grow/shrink height on Lock Screen/expanded as info changes (e.g., rideshare expands once a driver is found).
- Support limited-width contexts: compact/minimal must fit a 28 pt circle; use abbreviations or graphics; you may use only the leading view.
- Keep even, concentric margins; use a container-relative shape for rounded elements near corners; separate blocks with inset containers or thick lines; don't draw to the Dynamic Island edge.
- Dynamic Island background is black and opaque; use bold brand colors for text/objects; tint the key line to match.
- Animate updates (content-replace, numeric transitions, scale/opacity/move) up to two seconds; animate existing elements to new positions; avoid overlaps.
- Deep link taps to the right screen; limit interactivity to essential, ideally a single control (playback, workout pause, recording, contact driver).
- Start at expected moments; offer an in-app way to turn it off; consider an App Shortcut (e.g., Action button) to start it.
- Update only when content changes; alert only for essential updates; don't duplicate with push notifications.
- Prefer one Live Activity rotating through multiple events over many separate ones.
- End immediately when done; set a custom dismissal time proportional to duration (usually 15 to 30 minutes).

## iOS specifics
- Compact: one activity active; leading and trailing elements around the TrueDepth camera that read as one unit with consistent color/type; keep narrow, snug to the camera, no padding, balanced widths; both link to the same screen.
- Minimal: shown when multiple are active (up to three: one attached, others detached circle/oval); show live data (e.g., Timer's remaining time) rather than a static logo.
- Expanded: on touch and hold; enlarged version of compact keeping relative placement; wrap tightly around the camera.
- Lock Screen: banner at bottom; don't copy notification layout; use custom colors sparingly; check Dark Mode and Always-On; verify the auto-generated dismiss button color; on devices without Dynamic Island, alerts show it as a banner over other apps.
- StandBy: appears as minimal; tap scales Lock Screen presentation 2x full screen (custom background extends edge to edge); prefer default background; keep standard margins; check Night Mode red tint.
- Start with the iPhone design, then refine for StandBy, CarPlay, Watch.

## Specs & numbers
- Max recommended duration: 8 hours.
- Minimal presentation: up to 3 activities in the Dynamic Island.
- Limited-width fit: 28 pt diameter circle.
- Animation max: 2 seconds (no animation on reduced-luminance Always-On).
- Lock Screen standard margin: 14 pt.
- StandBy scale: 2x.
- After ending: stays up to 4 hours on Lock Screen, Mac menu bar, Watch Smart Stack; removed immediately from Dynamic Island and CarPlay. Custom dismissal usually 15 to 30 minutes (rideshare example: 30 minutes).

iOS dimensions (pt):

| Screen (portrait) | Compact (leading and trailing) | Minimal (width range) | Expanded (height range) | Lock Screen (height range) | Limited width |
|---|---|---|---|---|---|
| 430x932 | 62.33x36.67 | 36.67–45x36.67 | 408x84–160 | 408x84–160 | 28x28 |
| 393x852 | 52.33x36.67 | 36.67–45x36.67 | 371x84–160 | 371x84–160 | 28x28 |

iPadOS Lock Screen (pt): 1366x1024 → 500x84–160; 1194x834, 1012x834, 1080x810, 1024x768 → 425x84–160.

CarPlay Live Activity sizes (pt): 240x78, 240x100, 170x78. Test configs: Widescreen 1920x720, Portrait 900x1200, Standard 800x480.

watchOS Smart Stack (pt): 40mm 152x69.5; 41mm 165x72.5; 42mm 176x72.5; 44mm 173x76.5; 45mm 184x80.5; 46mm 194x80.5; 49mm (Ultra 3, 4) 198x81.5; 49mm (Ultra 1, 2) 191x81.5.

Change log: October 13, 2026 (limited width layouts); December 16, 2025; June 10, 2024; October 24, 2023; June 5, 2023; November 3, 2022; September 23, 2022 (new page).

## New in iOS 26 / Liquid Glass
Not mentioned on this page. (Concentric placement guidance: keep margins concentric with the Live Activity's outer rounded edge.)

## Do / Don't
- Do: Compact Dynamic Island with team logo left and "2–1" right, snug to the camera. / Don't: Compact view with a long text string truncated and padding next to the camera.
- Do: Lock Screen banner showing "Arriving in 8 min" with driver name and a single "Contact" button. / Don't: A banner that mimics a notification or has 4 buttons.
- Do: Minimal view showing "4:32" remaining. / Don't: Minimal view showing only a static app icon.
- Do: Medical result Live Activity says "Your results are ready" and opens the app. / Don't: Show private details on the Lock Screen.
- Do: One sports Live Activity cycling through scores across matches. / Don't: Five separate Live Activities for five games.
- Do: Logo mark placed directly in the layout, no container. / Don't: The full rounded app icon squeezed into the banner.
- Do: End when the ride completes and keep a summary for 30 minutes. / Don't: Leave a stale "Driver arriving" activity up for hours.
