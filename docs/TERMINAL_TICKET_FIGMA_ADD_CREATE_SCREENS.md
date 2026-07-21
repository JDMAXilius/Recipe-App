# TERMINAL TICKET — Build the Add/Create redesign screens in Figma

The cloud session designed and web-verified the two Add/Create redesign screens, and wrote a
complete Figma Plugin-API build script for them. It could READ the Figma file but is blocked
from WRITING (the `use_figma` tool needs an interactive approval a headless cloud run can't
grant — every write returned MCP error -32003 "requires approval"). This terminal session HAS
Figma write access, so it just needs to run the script and eyeball the result.

- **Figma file:** `mM0uWkHod9rL1Ff1VJ64Au`  (name: "Otto · Design System" — the founder's
  master board; page `0:1` holds foundations + assets + components)
- **Founder-approved scope (do ONLY these two screens):** "Chat with Otto" (the ＋ tab) and
  "Bring in a recipe" (the import sheet). NOT the full app board.
- **Build script (ready to run, self-contained):** `docs/figma/build-add-create-screens.js`

## Task 1 — Run the build script via `use_figma`

Load `/figma-use` first (mandatory before `use_figma`). Then paste the BODY of
`docs/figma/build-add-create-screens.js` (everything below its header comment — it's written
for the tool: top-level `await` + `return`, no IIFE) into a single `use_figma` call:

- `fileKey`: `mM0uWkHod9rL1Ff1VJ64Au`
- `skillNames`: `figma-use`

It creates a new page **"2 · Screens — Add / Create"** with two 393×852 frames, reusing the DS
colours (`#FAF4EA` bg, `#C4562E` accent, `#FFFFFF` surface, `#E8DECF` border, `#2A211B`/
`#6E6055` ink) and the real Otto happy-cut art (node `7:9`). The script returns
`{ pageId, chatId, importId, mascotFound }` — confirm `mascotFound: true`.

If the script errors on code (not approval), fix incrementally per the figma-use skill
(atomic — a failed script makes no changes) rather than rerunning blindly. Re-running the whole
script creates ANOTHER page; delete the stale "2 · Screens — Add / Create" page first.

## Task 2 — Verify + report

- `get_screenshot` each frame (`chatId`, `importId`) and eyeball against the shipped app:
  - **Chat:** centered "Chat with Otto" + top-right import icon (NO X), minimal empty state
    (Otto art + "Tell me what you're hungry for. / I'll write you the recipe."), a rounded
    Speak/type pill (dark "Speak" button, mic glyph), bottom tab bar with the raised terracotta
    ＋. Mascot should render (not a blank warm square — that means the image hash didn't apply).
  - **Import sheet:** Close X top-left, Otto header, "Bring in a recipe" + subtitle, 2×2 tile
    grid (Paste a link · Paste text · Snap a photo · Write it myself, accent line icons),
    TikTok/Instagram row + chevron.
- Fidelity nits to fix if visible: mascot not rendering (re-check `7:9` fill hash), text
  clipping, tiles uneven, Speak pill overlapping the placeholder text.
- Reference (what the screens should match): the founder's device screenshots this session and
  the web-verified builds — `mobile/app/(tabs)/create.jsx` (chat) and `mobile/app/add.jsx`
  (import sheet).

## Done when

Both frames exist on page "2 · Screens — Add / Create", render correctly (mascot visible, no
clipping), and a screenshot is posted back. Then mark this ticket done (`/tickets done
FIGMA_ADD_CREATE_SCREENS`) so the cloud session knows not to re-hand it.
