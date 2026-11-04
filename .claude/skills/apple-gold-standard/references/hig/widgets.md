# Widgets
URL: https://developer.apple.com/design/human-interface-guidelines/widgets

## Summary
Widgets surface timely, glanceable content and focused actions from an app in places like the iPhone Home Screen, Lock Screen, StandBy, and CarPlay. They come in system family sizes (small to extra large) and accessory sizes (circular, inline, rectangular), and the system adapts their appearance (full-color, tinted, clear/Liquid Glass, vibrant) to context and the person's customization.

## Best practices
- Build around one simple idea tied to the app's main purpose, with timely content and relevant actions.
- Give quick access to meaningful content, actions, and deep links; a widget that just repeats the app icon adds little.
- Prefer content that changes through the day so people keep the widget visible.
- Look for moments to delight (e.g., special calendar treatment on birthdays/holidays).
- Offer multiple sizes only when they add value; don't just stretch small content to fill a larger size.
- Balance density: essential info at a glance, more detail on a longer look; go bigger or use graphics if too dense.
- Show only data tied to the main purpose; larger sizes expand range, not topic.
- Use brand colors/type/glyphs thoughtfully; a logo is rarely needed, and if needed, keep it small in the top-right corner.
- Decide between auto-displayed content and person-configured content (Stocks vs. Podcasts).
- Don't mirror the widget's look inside the app.
- If sign-in unlocks more, say so (e.g., "Sign in to view reservations").
- Keep content fresh; if people check more often than you can update, show "last updated" text. Let the system refresh dates/times.
- Don't hide stale data behind placeholders; animate updates (up to two seconds).
- Interactivity: buttons and toggles for simple tasks; any other tap opens the app at the right deep-linked location. Avoid app-like layouts; keep targets confidently tappable.
- Use standard margins; match content corner radius to the widget via a container shape.
- Prefer system font, text styles, and SF Symbols; custom fonts sparingly (often big text custom, small text SF Pro). Don't rasterize text.
- Use color without competing with content; don't encode meaning in color alone; reserve full-color images for media like album art, sized smaller than the widget.
- Previews: realistic (real or simulated data). Placeholders: static UI plus semi-opaque shapes (bars for text, circles/squares for images).
- Gallery description: start with an action verb, no "This widget shows...", sentence case; group sizes under one description; optionally color the Add button.

## iOS specifics
- Lock Screen widgets follow complication principles; provide information, not just another app launcher. Design complications and Lock Screen widgets together.
- Three Lock Screen styles: inline text above the clock; circular and rectangular below the clock.
- Support Always-On display (reduced luminance): use grays with enough contrast.
- Use Live Activities for real-time, time-limited tracking; widgets don't show real-time info. Build both together.
- StandBy: two small widgets side-by-side, scaled up, background removed; supporting StandBy also covers CarPlay. Mark the background removable. Scale and rearrange text instead of relying on rich images/color. Low light renders monochrome red tint.
- Home Screen appearances: light, dark, clear (desaturated + translucency + Liquid Glass), tinted (desaturated + person's tint).
- Rendering modes on iPhone: Full-color (Home Screen, Today view, StandBy and CarPlay with background removed); Accented (Home Screen, Today view); Vibrant (Lock Screen, StandBy in Night Mode).
- Accented mode: split views into accent and primary groups; on iPhone both are tinted white.
- Vibrant mode: render content at full opacity; white/light gray for primary, darker grays for secondary; use opaque grays, not white with opacity.
- Dynamic Type supported from Large to AX5 with system or custom fonts.

## Specs & numbers
- Standard margin: 16 pt for most widgets; tighter margin: 11 pt. Smaller margins on Lock Screen (incl. StandBy) and Mac desktop.
- Minimum text size: 11 pt.
- Update animation: up to 2 seconds.
- Inline accessory widgets: only 1 tap target.
- StandBy: 2 small widgets side by side.
- HomeView Modular face: up to 4 widgets; 1 Modular face per household.
- visionOS scaling: 75 to 125 percent.

System family support:

| Widget size | iPhone | iPad |
|---|---|---|
| System small | Home Screen, Today View, StandBy, CarPlay, Apple HomeView | Home Screen, Today View, Lock Screen |
| System medium | Home Screen, Today View | Home Screen, Today View |
| System large | Home Screen, Today View | Home Screen, Today View |
| System extra large | Not supported | Home Screen, Today View |
| Extra large portrait | Not supported | Not supported |

Accessory support (iPhone/iPad): circular, inline, rectangular on Lock Screen; corner not supported (Watch only).

iOS dimensions (pt):

| Screen (portrait) | Small | Medium | Large | Circular | Rectangular | Inline |
|---|---|---|---|---|---|---|
| 430×932 | 170x170 | 364x170 | 364x382 | 76x76 | 172x76 | 257x26 |
| 428x926 | 170x170 | 364x170 | 364x382 | 76x76 | 172x76 | 257x26 |
| 414x896 | 169x169 | 360x169 | 360x379 | 76x76 | 160x72 | 248x26 |
| 414x736 | 159x159 | 348x157 | 348x357 | 76x76 | 170x76 | 248x26 |
| 393x852 | 158x158 | 338x158 | 338x354 | 72x72 | 160x72 | 234x26 |
| 390x844 | 158x158 | 338x158 | 338x354 | 72x72 | 160x72 | 234x26 |
| 375x812 | 155x155 | 329x155 | 329x345 | 72x72 | 157x72 | 225x26 |
| 375x667 | 148x148 | 321x148 | 321x324 | 68x68 | 153x68 | 225x26 |
| 360x780 | 155x155 | 329x155 | 329x345 | 72x72 | 157x72 | 225x26 |
| 320x568 | 141x141 | 292x141 | 292x311 | N/A | N/A | N/A |

iPadOS (selected, pt): 1024x1366 canvas small 170x170 / medium 378.5x170 / large 378.5x378.5 / XL 795x378.5 (device 160x160 / 356x160 / 356x356 / 748x356); 820x1180 and 834x1194 canvas 155x155 / 342x155 / 342x342 / 715.5x342 (device 136x136 / 300x136 / 300x300 / 628x300); 768x1024 and 744x1133 canvas 141x141 / 305.5x141 / 305.5x305.5 / 634.5x305.5 (device 120x120 / 260x120 / 260x260 / 540x260). Full table on source page.

Change log: October 13, 2026 (Apple HomeView, watchOS specs); December 16, 2025; January 17, 2025; June 10, 2024 (accented widgets iOS 18); June 5, 2023; November 3, 2022.

## New in iOS 26 / Liquid Glass
- Clear appearance: the system desaturates the widget and adds translucency, highlights, and the Liquid Glass material.
- Accented rendering mode replaces the background with a tinted effect (tinted appearance) or a Liquid Glass background (clear appearance).
- Full-color images in tinted/clear appearances are desaturated by default; forcing full color can look out of place in clear mode.

## Do / Don't
- Do: Small weather widget showing current temp, high/low, and a condition symbol. / Don't: A widget that is just the app logo on a colored square.
- Do: Medium widget expands the same content (more events/days). / Don't: Medium widget that is the small layout stretched with empty space.
- Do: Reminders-style widget with a checkbox toggle per task. / Don't: An app-like widget crammed with tabs, forms, and many tiny buttons.
- Do: Placeholder of gray rounded bars and circles while loading. / Don't: A spinner or blank card hiding stale data.
- Do: Text at 11 pt or larger with 16 pt margins. / Don't: Tiny 8 pt text crowding the widget edges.
- Do: Show "Updated 10:00 AM" when data may lag. / Don't: Present old data as if live with no timestamp.
- Do: StandBy version with large, rearranged text and removable background. / Don't: StandBy widget relying on a rich photo or red/green color to convey status.
