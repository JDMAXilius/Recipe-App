# Lists and tables
URL: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
## Summary
Lists and tables present rows of mostly textual data, optionally grouped or hierarchical, with selection, adding, deleting and reordering. Keep rows succinct, pick a style that fits the data, and give clear selection feedback.
## Best practices
- Prefer lists for text; use a collection for varied-size items or many images.
- Allow editing (at least reordering) when sensible; iOS needs edit mode to select items.
- Navigation lists persistently highlight the selected row; option lists briefly highlight then show a checkmark.
- Keep row text short to avoid truncation; show long content in a detail view.
- Consider middle-truncation to keep the start and end of text recognizable.
- Multicolumn headings: nouns, title case, no ending punctuation; single-column lists get a header or label for context.
- Pick a list style that matches the data; iOS grouped style uses headers, footers and spacing.
- Use built-in row styles (UIListContentConfiguration) for image + label layouts.
## iOS specifics
- Info (detail disclosure) button only reveals more info about a row; use a disclosure indicator for drilling in.
- Don't add an alphabetical index to a table whose rows have trailing controls like disclosure indicators.
## Specs & numbers
None stated.
## New in iOS 26 / Liquid Glass
Not mentioned on this page.
## Do / Don't
- Do: chevron disclosure indicator on rows that push a detail view. / Don't: an (i) button used to navigate.
- Do: grouped list with "Breakfast" and "Dinner" headers. / Don't: one flat undifferentiated list.
- Do: tap a unit option, brief highlight, then checkmark. / Don't: no feedback on selection.
- Do: row title only, full text in detail. / Don't: rows with 6 lines of wrapped description.
- Do: A–Z index on a plain list of names. / Don't: A–Z index over rows ending in chevrons.
