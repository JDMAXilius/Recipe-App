# Popovers
URL: https://developer.apple.com/design/human-interface-guidelines/popovers
## Summary
A popover is a transient view that appears above content from a control, showing a small amount of info or functionality. On iPhone-size compact layouts, use a sheet instead.
## Best practices
- Keep content to a few related tasks.
- Use popovers for temporary content to save space versus sidebars/panels.
- Point the arrow directly at the source; don't cover it or essential content.
- Include Close/Cancel/Done only for clarity (e.g. save vs. discard); otherwise dismiss on outside tap or selection.
- Stay open for multi-select until explicitly dismissed or tapped outside.
- Always save work when a nonmodal popover auto-closes; discard only on explicit Cancel.
- One popover at a time; never cascade.
- Nothing over a popover except an alert.
- Let one tap close one popover and open another.
- Size to content; animate size changes.
- Don't say "popover" in help text.
- Don't use a popover for warnings; use an alert.
## iOS specifics
- Avoid popovers in compact views; use a sheet or other full-screen modal there. Reserve popovers for wide views.
## Specs & numbers
None stated.
## New in iOS 26 / Liquid Glass
Not mentioned on this page.
## Do / Don't
- Do: on iPhone, tapping "Servings" opens a sheet. / Don't: a tiny popover on iPhone.
- Do: iPad popover arrow pointing at the tapped toolbar button. / Don't: arrow pointing at empty space, covering the button.
- Do: tap another bar button switches popovers in one tap. / Don't: popover opening a second popover.
- Do: outside tap saves the edited note. / Don't: outside tap discards edits.
- Do: alert for "Storage full". / Don't: a popover warning that's easy to miss.
