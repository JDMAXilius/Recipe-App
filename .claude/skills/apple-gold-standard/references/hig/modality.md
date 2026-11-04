# Modality
URL: https://developer.apple.com/design/human-interface-guidelines/modality

## Summary
Modality presents content in a dedicated mode that blocks the parent view and requires an explicit action to dismiss. Use it only when it clearly helps people focus, confirm, or complete a narrow task; keep modal tasks short, clearly titled, and easy to dismiss without losing work.

## Best practices
- Use modals for critical info, confirming/modifying a recent action, a distinct scoped task, or immersive/complex focus.
- On iOS/iPadOS, distinct tasks typically use sheets or popovers; alerts, activity views, and action sheets/confirmation dialogs cover other cases.
- Present modally only when there's a clear benefit.
- Keep modal tasks simple, short, and streamlined.
- Avoid an "app within your app"; if subviews are needed, give a single path and no buttons that look like the dismiss button.
- Use full-screen modal style for in-depth content (video, photos, camera) or multistep tasks (markup, photo editing).
- Always provide an obvious dismissal: on iOS, a button in the top toolbar or swipe down.
- If dismissing would lose user content, confirm first and offer resolutions (e.g., an action sheet with Save).
- Title the modal with its task, optionally with guiding text.
- Let people dismiss one modal before presenting another; avoid stacked modals.
- Alerts may appear over everything, but never show more than one alert at once.

## iOS specifics
- People expect a dismiss button in the top toolbar or a swipe-down gesture.
- Use an action sheet with a save option to prevent data loss on dismiss.

## Specs & numbers
- Never more than one alert visible at a time.
- Change log: December 5, 2023; June 21, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: "New Recipe" sheet with Cancel (left) and Add (right) in its top bar. / Don't: A sheet with no visible close button and swipe-down disabled.
- Do: On Cancel with unsaved edits, show an action sheet: Save / Discard Changes / Keep Editing. / Don't: Silently discard a half-typed recipe on swipe-down.
- Do: Full-screen modal for the camera scanner or photo editor. / Don't: Full-screen modal for a simple two-field form.
- Do: Sheet titled "Edit Ingredients" so the task is clear. / Don't: An untitled sheet that looks like another tab.
- Do: Close the first sheet before opening the next. / Don't: A sheet on a sheet on a sheet, or two alerts stacked.
- Do: One linear step path inside a modal flow. / Don't: A full tab bar and nested navigation inside a modal.
