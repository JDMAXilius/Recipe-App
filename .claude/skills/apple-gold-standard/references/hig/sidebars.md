# Sidebars
URL: https://developer.apple.com/design/human-interface-guidelines/sidebars
## Summary
A sidebar sits on the leading side and navigates between app areas or top-level collections like folders. It needs lots of space, so on iPhone-sized layouts a tab bar (or a tab bar that converts into a sidebar) is usually better.
## Best practices
- Extend rich content beneath the floating sidebar via horizontal scrolling or a background extension effect.
- Let people customize sidebar contents and order when possible.
- Use disclosure controls to group large hierarchies.
- Use familiar SF Symbols for items; custom symbols over bitmaps.
- Let people hide the sidebar with known gestures (iPad edge swipe), but don't hide it by default.
- Show at most two levels of hierarchy; deeper data needs a split view with a content list.
- With two levels, use short descriptive group titles.
- Icon colors default to the app accent; use fixed colors sparingly and with purpose.
## iOS specifics
- sidebarAdaptable tab view: choose sidebar or tab bar at launch, with a button to switch; adapts to rotation and resizing.
- For sidebar-only, use NavigationSplitView / UISplitViewController.
- Consider a tab bar first; its convertible sidebar form exposes less-used areas.
- Non-SwiftUI: use the .sidebar list appearance.
## Specs & numbers
- Hierarchy: no more than two levels.
- macOS sidebar sizes: small, medium, large (reference).
## New in iOS 26 / Liquid Glass
- Sidebars float above content in the Liquid Glass layer; extend content beneath with backgroundExtensionEffect().
## Do / Don't
- Do: iPad sidebar with "Recipes, Plan, Pantry" and one disclosure group. / Don't: four nested levels of folders.
- Do: hero image stretched under the glass sidebar. / Don't: hard-cut image ending at the sidebar edge.
- Do: sidebar visible by default with edge-swipe to hide. / Don't: hidden sidebar people must discover.
- Do: monochrome accent icons, one yellow star for Favorites. / Don't: rainbow icon colors with no meaning.
- Do: iPhone uses a tab bar. / Don't: a full sidebar squeezed onto iPhone.
