# Rules for generated images and Figma

## Generating screens
- Portrait iPhone frame, 393 x 852 points, with realistic status bar and safe areas
- Attach the real art from `assets/` as references for every screen with Otto
- Keep Otto identical: chef hat, terracotta apron, painted storybook style
- Attach `assets/brand_icons/` for sign-in logos. Do not redraw brand logos
- Use the exact copy you intend to ship, and check every word in the image, because image models garble text
- If text comes out wrong, fix it in Figma rather than accepting it
- Use real-looking food. `assets/sample_food_photos/` has samples from TheMealDB, the app's recipe source
- Keep a consistent system across screens: type, spacing, corners, tab bar
- Do not copy any study app's screens or brand. Learn patterns only
- Name each file by area and state, such as `plan_week_filled.png`

## Building in Figma
- File: Otto — App Redesign. New pages only, named `ChatGPT · 01 Getting in` and so on
- Follow the layout of the existing pages: a header, numbered sections, labeled rows of screens, and a short note on why
- Reuse art already on the `Assets` page, or take it from this zip
- Generated images are concepts. Rebuild final screens with editable text, auto layout and components wherever possible
- If a screen stays as a flat image, label it **CONCEPT ONLY**
- Define colors and type as variables and styles

## Handing back to Juan
For each area: the images, the Figma link, what changed and why, and which study app or Apple rule informed it. Include anything you skipped or could not verify.
