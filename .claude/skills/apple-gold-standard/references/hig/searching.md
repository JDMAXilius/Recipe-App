# Searching
URL: https://developer.apple.com/design/human-interface-guidelines/searching

## Summary
People search across the system, within apps, and inside documents. In-app search usually uses a search field, ideally in one prominent location, with clear scope, suggestions, and privacy-aware history. Index content for Spotlight so people can find it without opening the app.

## Best practices
- Use a search field for in-app search; personalize with recent searches, suggestions, completions, or corrections.
- Offer scoping/filtering (scope bars and tokens) when useful, e.g., by date, size, or type.
- Support find-in-page/window for documents on iOS, iPadOS, and macOS.
- If search matters, give it a primary position: e.g., bottom toolbar (Notes) or a dedicated tab in tab-bar apps (Photos, Apple TV).
- Make everything searchable from a single clearly identified location.
- For distinct sections, local search can act as a filter on the current view (iOS Music).
- Always show the current scope via descriptive placeholder, scope bar/tokens, or title (Mail names the mailbox).
- Show recent searches before typing and predictive suggestions while typing.
- Consider privacy before showing search history; offer a way to clear it.
- Index content for Spotlight with descriptive metadata.
- Define metadata for custom file types (Spotlight File Importer) and provide a Quick Look generator.
- Prefer system open/save views, which include built-in search.

## iOS specifics
None stated ("No additional considerations"); general guidance cites iOS examples (Notes bottom toolbar search, tab-bar search tab, Music local filtering, Mail scope).

## Specs & numbers
- No numeric specs on this page.
- Change log: June 8, 2026 (updated terminology, refined best practices); June 9, 2025.

## New in iOS 26 / Liquid Glass
Not mentioned on this page beyond search placement in the bottom toolbar or as a dedicated tab.

## Do / Don't
- Do: A dedicated Search tab in the tab bar for a content-heavy app. / Don't: Search hidden in an overflow menu three levels deep.
- Do: Placeholder "Search Saved Recipes" when scoped to Saved. / Don't: Generic "Search" placeholder that hides what's being searched.
- Do: Show recent searches with a "Clear" button when the field is focused. / Don't: Show history with no way to clear it.
- Do: Predictive suggestions as the person types "chi..." (chicken, chili). / Don't: An empty results area until Return is pressed.
- Do: Scope bar/tokens (All, Recipes, Ingredients) under the field. / Don't: Separate unrelated search boxes on every screen.
