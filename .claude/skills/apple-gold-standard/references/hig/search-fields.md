# Search fields
URL: https://developer.apple.com/design/human-interface-guidelines/search-fields
## Summary
A search field is a text field with a search icon, clear button and placeholder for finding content. In iOS, search can live as a tab, in a top or bottom toolbar, or inline; scope bars and tokens narrow results.
## Best practices
- Use placeholder text to show what can be searched.
- Search as people type when possible.
- Show suggestions: recents before typing, predictions while typing.
- Put the most relevant results first; consider categorizing.
- Consider filtering results with a scope bar.
- Scope bar: filter among clearly defined categories; default to the broader scope.
- Tokens: encapsulate common terms/items as selectable, editable filters; pair with suggestions so people discover them.
## iOS specifics
- Three entry points: tab in tab bar, toolbar (bottom or top), inline with content.
- Search tab styles: standard tab (landing page with field on top, good for discovery) or button appearance (opens keyboard immediately, returns to previous tab after).
- Bottom toolbar: expanded field or button that animates into a field above the keyboard. Prefer the bottom when there's room (Settings, Mail, Notes).
- Top toolbar (navigation bar): appears as a button that expands into a field. Use when content at the bottom matters (Wallet) or no bottom toolbar.
- Inline field: when search applies to one view (Music library); place above the list and consider pinning to the top toolbar on scroll.
- iPadOS: search at trailing side of toolbar, top of sidebar for filtering, or a dedicated sidebar/tab area; don't auto-focus on iPad with only a virtual keyboard.
## Specs & numbers
- Entry points in iOS: 3.
- Search tab styles: 2.
## New in iOS 26 / Liquid Glass
Not mentioned on this page.
## Do / Don't
- Do: placeholder "Search recipes or ingredients". / Don't: placeholder just "Search…" with no scope hint.
- Do: recent searches listed before typing. / Don't: blank screen until Return is pressed.
- Do: scope bar "All / Saved / Mine" defaulting to All. / Don't: defaulting to the narrowest scope.
- Do: bottom search field above the keyboard. / Don't: search hidden in a top-corner menu when bottom space exists.
- Do: token "Vegetarian" chip in the field. / Don't: forcing users to type "vegetarian" every time.
- Do: inline field pinned above a saved-recipes list. / Don't: an inline field floating far from the list it filters.
