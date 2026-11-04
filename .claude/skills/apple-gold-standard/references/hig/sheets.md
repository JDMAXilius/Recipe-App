# Sheets
URL: https://developer.apple.com/design/human-interface-guidelines/sheets
## Summary
A sheet handles a scoped task tied to the current context, then returns people to the parent view. In iOS a sheet can be modal or nonmodal and can rest at detents (medium, large or custom).
## Best practices
- For long or complex flows, use a full-screen modal instead of a sheet.
- Show only one sheet at a time; close one before opening another.
- Use a nonmodal sheet for supplementary controls that affect the parent (Notes formatting).
- Cancel/Close dismisses without saving; Done dismisses after completing or saving; Back goes to a previous step and doesn't dismiss.
- Always pair Done with Cancel (or Back in multi-step flows).
- Never show Cancel, Done and Back together.
## iOS specifics
- Single-view sheet: Cancel on the leading edge of the top toolbar, Done on the trailing edge.
- Multi-step sheets: button placement varies by step (first, subsequent, final).
- Detents: large (full) and medium (about half); custom detents allowed. Large is automatic; medium-only prevents full expansion.
- On iPhone consider the medium detent for progressive disclosure (share sheet); skip it for content needing full height (compose).
- Include a grabber on resizable sheets; tap cycles detents and it works with VoiceOver.
- Support swipe-down to dismiss; if there are unsaved changes, confirm with an action sheet.
- iPadOS: prefer page or form sheet styles, centered on a dimmed background.
## Specs & numbers
- System detents: 2 (large = full height, medium = about half).
- Buttons: never all 3 of Cancel/Done/Back together.
- Sheets visible at once: 1.
## New in iOS 26 / Liquid Glass
Not mentioned on this page.
## Do / Don't
- Do: "Add to Plan" sheet with Cancel top-left, Done top-right. / Don't: only a Done button and no way out.
- Do: medium-detent sheet with grabber showing top options. / Don't: a resizable sheet with no grabber.
- Do: swipe down with edits prompts "Discard Changes / Keep Editing" action sheet. / Don't: silently discard edits on swipe.
- Do: close sheet A, then open sheet B. / Don't: sheet stacked on sheet.
- Do: step 2 of a flow with Back top-left. / Don't: Back, Cancel and Done all in one bar.
- Do: full-screen modal for a multistep photo editor. / Don't: a sheet for a long multi-screen task.
