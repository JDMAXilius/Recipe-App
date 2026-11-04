# Progress indicators
URL: https://developer.apple.com/design/human-interface-guidelines/progress-indicators

## Summary
Progress indicators show that an app isn't stalled while it loads content or runs a long operation; they are transient and disappear when the task finishes. Determinate indicators fill a linear or circular track for tasks of known duration; indeterminate ones (activity indicators/spinners) animate for unknown durations.

## Best practices
- Prefer determinate indicators when possible; they let people decide whether to wait, restart later, or abandon.
- Report advancement accurately and even out the pace so the bar doesn't jump then stall.
- Keep indicators moving; a stationary one reads as frozen. If a process stalls, explain the problem and what people can do.
- Switch from indeterminate to determinate once the duration becomes known.
- Don't switch between the circular (spinner) style and the bar style; their shapes and sizes differ.
- Optionally add a short, accurate description; avoid vague words like "loading" or "authenticating".
- Show the indicator in a consistent location.
- Let people halt processing with a Cancel button when that's safe; add Pause if canceling would lose work.
- If canceling loses progress, show an alert to confirm cancellation or resume.
- Bars fill leading to trailing; circular tracks fill clockwise.

## iOS specifics
- Refresh control: a specialized activity indicator hidden by default, revealed by dragging down a view (e.g., Mail inbox).
- Still perform automatic periodic updates; don't make people trigger every refresh.
- Add a refresh-control title only if it adds value (e.g., Podcasts shows last update time); never use it to explain how to refresh.

## Specs & numbers
- 2 types: determinate and indeterminate.
- Pacing anti-example: 90 percent in five seconds, last 10 percent in 5 minutes.
- Change log: September 12, 2023; June 5, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Show a determinate bar "Downloading 3 of 10 photos" filling steadily. / Don't: Show an endless spinner for a task whose size you know.
- Do: Show a Cancel button under a download bar, plus Pause if cancel loses data. / Don't: Trap people in a non-cancelable progress screen.
- Do: Show an alert "Stop download? Progress will be lost" with Resume/Stop. / Don't: Silently discard progress on cancel.
- Do: Pull down a list to reveal a refresh spinner with "Updated 5 min ago". / Don't: Label the refresh control "Pull down to refresh".
- Do: Use a specific caption like "Importing 24 recipes". / Don't: Caption it just "Loading...".
- Do: Keep a spinner in one place for the whole operation. / Don't: Morph a spinner into a progress bar mid-task.
