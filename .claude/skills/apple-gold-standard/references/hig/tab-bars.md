# Tab bars
URL: https://developer.apple.com/design/human-interface-guidelines/tab-bars
## Summary
A tab bar switches between an app's top-level sections while keeping each section's navigation state intact. It is for navigation only; actions on the current view belong in a toolbar. In iOS it floats over content on Liquid Glass.
## Best practices
- Use tabs to navigate, never to trigger actions; put view actions in a toolbar.
- Keep the tab bar visible across sections; only a modal may cover it.
- Use the fewest tabs that serve the hierarchy; fewer tabs are easier to navigate.
- For complex structures, consider a sidebar or a tab bar that adapts into a sidebar.
- Avoid overflow: when space runs out, the trailing tab becomes a "More" tab that hides content.
- Never disable or hide a tab button when its content is unavailable; explain the empty state instead.
- Always include tab labels, ideally a single word each.
- Prefer SF Symbols (filled variants) so icons adapt between compact and regular layouts.
- Compact views: icon above label. Regular views: icon and label side by side.
- Reserve badges (red oval, white number or "!") for critical new information.
- Don't tint tab labels a color close to colorful content behind them; prefer monochrome or a clearly distinct accent.
- Custom tab icons: use Apple Design Resources for dimensions.
## iOS specifics
- Tab bar floats above content at the bottom of the screen on a Liquid Glass background that lets content show through.
- A tab bar with an attached accessory (e.g. Music's MiniPlayer) can minimize on scroll-down, moving the accessory inline; tapping a tab or scrolling to top restores it (TabBarMinimizeBehavior).
- A dedicated search tab can sit at the trailing end.
- iPadOS: tab bar sits near the top; can be fixed or convertible to a sidebar (tabBarOnly / sidebarAdaptable).
- iPadOS: let people customize tabs; keep the default list to five or fewer for continuity between compact and regular sizes.
## Specs & numbers
- Default customizable tab list: five or fewer (iPadOS).
- Badge: red oval with white text, a number or exclamation point.
- tvOS (reference only): tab bar height 68 pt, top edge 46 pt from screen top, both fixed.
## New in iOS 26 / Liquid Glass
- Bar floats over content on Liquid Glass; content peeks through.
- Minimize-on-scroll behavior with a bottom accessory inline.
- Trailing search tab.
- Color guidance references Liquid Glass color: avoid label colors similar to content-layer colors.
## Do / Don't
- Do: 4 tabs (Home, Recipes, Plan, Search) each with filled symbol + one-word label. / Don't: 7 tabs where the 5th becomes "More".
- Do: keep "Plan" tab tappable and show an empty state explaining why there's nothing yet. / Don't: grey out or remove the "Plan" tab.
- Do: put a "+ Add" button in the nav toolbar. / Don't: make "+" a tab that triggers an action.
- Do: keep the tab bar visible when drilling into a recipe detail. / Don't: hide the tab bar on push navigation (modal sheets excepted).
- Do: badge only for something urgent (e.g. 1 expiring item). / Don't: badge every tab with counts.
- Do: monochrome tab bar over a colorful food photo. / Don't: orange labels floating over orange food imagery.
