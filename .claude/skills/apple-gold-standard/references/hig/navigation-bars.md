# Navigation bars
URL: https://developer.apple.com/design/human-interface-guidelines/toolbars
Note: Merged into Toolbars. Apple folded navigation bar guidance into the Toolbars page (change log June 9, 2025: "incorporated navigation bar guidance"); the navigation-bars slug no longer exists.
## Summary
In iOS, the navigation bar is the top toolbar: it shows the current view's title, a Back button to retrace the hierarchy, optional search, and a few actions. All guidance now lives under Toolbars.
## Best practices
- Give each view a useful, concise title; leave it empty if content already makes context clear.
- Don't use the app name as the title.
- Keep titles under 15 characters to leave room for controls.
- Use the standard Back button (and Close for modals) with standard symbols; don't label them "Back"/"Close".
- Custom Back/Close must look and behave like the standard ones, consistently app-wide.
- Leading edge: back and sidebar controls, then title. Trailing edge: key actions, search, More menu, primary Done.
- One primary action, styled .prominent, on the trailing side.
- Search can live in the top bar as a button that expands into a field.
- Avoid custom backgrounds; let content show and use a scroll edge effect.
## iOS specifics
- Use a large title that shrinks to a standard title on scroll and returns at the top (prefersLargeTitles).
- Include only essential items; overflow to a More menu.
## Specs & numbers
- Title: under 15 characters.
- Toolbar groups: maximum of three.
- Primary action: one, trailing.
## New in iOS 26 / Liquid Glass
- Scroll edge effect (ScrollEdgeEffectStyle) replaces custom bar backgrounds.
- Controls concentric with bar corners; borderless symbols in grouped glass sections.
## Do / Don't
- Do: chevron back + "Pasta" title + trailing Done. / Don't: "< Back" text button.
- Do: large "Recipes" title collapsing on scroll. / Don't: app name as the title.
- Do: title "Shopping List". / Don't: a 30-character title truncating into the buttons.
- Do: transparent bar with edge effect over content. / Don't: opaque colored bar.
