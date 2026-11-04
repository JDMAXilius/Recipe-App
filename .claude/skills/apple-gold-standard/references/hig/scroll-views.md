# Scroll views
URL: https://developer.apple.com/design/human-interface-guidelines/scroll-views

## Summary
A scroll view lets people move through content larger than its bounds. It has no appearance of its own beyond a translucent indicator that shows position. Support standard gestures, signal scrollability, avoid same-axis nesting, and use scroll edge effects only where content sits behind floating controls.

## Best practices
- Support default scrolling gestures and keyboard shortcuts; custom scrolling must keep elastic indicator behavior.
- Signal that content scrolls, e.g., show partial content cut off at the edge.
- Don't nest scroll views of the same orientation; horizontal-inside-vertical (or vice versa) is fine.
- Consider page-by-page scrolling; page size is typically the view's height or width, minus a small overlap unit (a line of text, a row) to keep context.
- Auto-scroll only to help people find their place: to show a new selection/search hit, to return to the insertion point when typing starts, to follow the pointer during a drag-select, or to bring a selection into view before acting on it.
- Auto-scroll only as much as needed; if part of a selection is visible, don't force the whole thing into view.
- If zoom is supported, set sensible min/max scale.
- Prefer the automatic scroll edge effect style.
- Use scroll edge effects only when content scrolls behind floating UI; they're functional, not decorative.
- Apply one scroll edge effect per view; in split views keep each pane's effect consistent in height.

## iOS specifics
- Consider a page control in page-by-page mode (e.g., Weather's locations).
- With a page control, hide the scroll indicator on the same axis to avoid redundancy.
- Scroll edge effects apply on iOS/iPadOS (and macOS); custom bars may need the effect added manually or switched from automatic to hard or soft.

## Specs & numbers
- Scroll edge effect styles: automatic (default), hard, soft.
- One scroll edge effect per view.
- Paging page size = view height/width minus an overlap unit.
- visionOS indicator: small fixed size, slightly thicker than iOS; vertically centered at trailing edge (vertical) or horizontally centered at bottom edge (horizontal).
- Change log: June 8, 2026 (scroll edge effects updated); March 24, 2026 (Look to Scroll); July 28, 2025 (scroll edge effects added); February 2, 2024; December 5, 2023; June 5, 2023.

## New in iOS 26 / Liquid Glass
- Scroll edge effects visually separate floating elements (toolbars) from content scrolling behind them on iOS, iPadOS, and macOS.
- Automatic style gives a more opaque separation for top toolbars with many controls, text outside Liquid Glass controls, and pinned table headers.
- Soft style requires thorough legibility testing across contexts.
- Effects don't block or darken like overlays; they keep controls visually distinct.
- Custom bars may need the effect added manually or adjusted to hard/soft.

## Do / Don't
- Do: A horizontal carousel of recipe cards with the last card cut off at the right edge. / Don't: Cards that end exactly at the screen edge, hiding that more exist.
- Do: Horizontal carousels inside a vertical feed. / Don't: A vertical list nested inside another vertical scroll view.
- Do: Paged onboarding with a page control and no horizontal scroll indicator. / Don't: Page dots plus a horizontal scroll bar on the same axis.
- Do: Content scrolling under a floating Liquid Glass toolbar with the automatic scroll edge effect. / Don't: A decorative dark gradient overlay where there's no floating UI.
- Do: When search finds a match below the fold, scroll just enough to reveal it. / Don't: Jump the view far past the match or leave it offscreen.
- Do: Pinned section headers legible via the automatic edge effect. / Don't: Soft edge effect with text becoming unreadable over busy photos.
