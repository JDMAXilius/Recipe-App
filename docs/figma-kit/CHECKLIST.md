# ✅ CHECKLIST — Master-Board acceptance (reusable)

Run before calling a board done. Every box must be true (for the pages built).

## Structure
- ☐ File named `<App> — Master Board`; a **page index** exists in Page 1's cover.
- ☐ Each page opens with a **cover/legend** (title · purpose · legend · last-updated · built-from-repo).
- ☐ Each page is carved into **Figma Sections** with clear names (navigable from layers + minimap).

## Foundations (Page 1)
- ☐ Colors are real **Variables**; each swatch labeled name · hex · usage; fixed/functional colors marked.
- ☐ Type scale uses real **text styles** with real specimen copy (no lorem).
- ☐ Spacing, radius, overlay, and a **motion spec card** present and match the token files.
- ☐ Theming rendered matches `{{THEME_MODE}}`; other themes only as a note.

## Assets (Page 1)
- ☐ Every asset is the **real uploaded file** (no redraws); logos/mascot/icons included.
- ☐ Mascot states (if any) captioned with their **app-state mapping**.

## Components (Page 1)
- ☐ **Every** component from the components dir exists as a real **component with variants** for its states.
- ☐ Nav/tab bar, cards, inputs, sheets, empty/loading/toast, and domain components all present + namespaced.

## App Map · Wireframes · Screens (Page 2)
- ☐ App map grouped by the real nav model; entry + auth flows included.
- ☐ One **low-fi grey** wireframe per screen; visually distinct from hi-fi.
- ☐ Hi-fi screens at device width, **full length (uncropped top-to-bottom)**, grouped by area.
- ☐ Every screen in the inventory is present — real or **labeled `— PLACEHOLDER`**.
- ☐ Superseded designs (if kept) live under **one** `Alternates` section, clearly labeled.

## Flows / Store / Brand (Pages 3–5, if built)
- ☐ Each critical journey is a thumbnail strip with arrows + decision points.
- ☐ Store screenshots pair a device mockup with a headline for each hero moment.
- ☐ Wordmark lockups (light + dark), voice with **real copy per state**, broken-conventions, icon spec.

## Craft
- ☐ Everything on the **8-pt grid**; consistent gutters; nothing floating/misaligned.
- ☐ Auto-layout used throughout; naming convention applied everywhere.

## Honesty (hard gate — CONTEXT §5)
- ☐ No invented data anywhere (no fake ratings/counts/reviews/personalization).
- ☐ Estimates are **labeled** as estimates.
- ☐ Every screen traces to the screen-map or is a labeled placeholder; every token traces to code.

## Sync
- ☐ The board matches the running app **1:1** (re-run reconciled, not rebuilt from memory).
