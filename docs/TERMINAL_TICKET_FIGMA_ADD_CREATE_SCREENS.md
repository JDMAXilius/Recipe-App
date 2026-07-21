# TERMINAL TICKET — Build the Add/Create redesign screens in Figma

> STATUS: done — terminal 2026-07-21

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

## Assets — the Otto mascot (the only bitmap the screens need)

Everything else (import/mic/tab/tile icons) is drawn as SVG inside the script — no assets.
The two screens need ONE bitmap: the Otto **happy-cut** mascot. Two sources, in priority order:

1. **Primary (automatic, zero setup):** the art is already in this Figma file at node `7:9`
   (`Asset/Otto/Happy-cut`, DS Assets section). The script reads its image hash and reuses it —
   this is why `mascotFound` should return `true`. Nothing to do.
2. **Fallback (only if `mascotFound:false` or the mascot renders as a blank warm square):**
   upload the committed PNG onto the two mascot frames. The repo asset is
   **`mobile/assets/mascot/otto-happy-cut.png`** (859 KB, transparent cutout, < 10 MB limit).
   The script returns `mascotNodeIds: [chatMascotId, importMascotId]`. For EACH id, call the
   `upload_assets` tool with `fileKey` `mM0uWkHod9rL1Ff1VJ64Au`, `count: 1`, `nodeId: <that id>`,
   `scaleMode: "FIT"`, then POST the PNG bytes to the returned upload URL with
   `Content-Type: image/png`. (Two calls — `upload_assets` disallows `nodeId` when `count > 1`.)

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

## Log

**2026-07-21 — terminal.** Ticket executed end to end; page **"2 · Screens — Add / Create"**
= `195:17` (section `195:18`).

- Read-only preflight first (fonts + mascot fill) — Lora Bold and Inter Regular/Medium/
  Semi Bold/Bold all present, node `7:9` carries image hash `976b16ba…`. That's why the
  build ran atomically on the first try with no error-recovery cycle.
- Task 1: build script ran in ONE `use_figma` call. Chat frame `195:19`, Import frame
  `195:54`, **`mascotFound: true`** → the `upload_assets` PNG fallback was NOT needed.
- Task 2: both frames screenshot-verified against the shipped app. Mascot renders (no
  blank warm square), no text clipping, tiles even, Speak pill clear of the placeholder.
  Import row copy matches `mobile/app/add.jsx:414` verbatim. None of the listed nits hit.

**Follow-on the same session (founder asked in-session; BEYOND the approved two-screen
scope — these are proposals, not approved):**

- `198:17` **Chat — in use (example thread)**: you bubble → Otto clarify bubble + chips →
  you reply → recipe card (title/meta/6 ingredient lines/"+3 more"/Save to cookbook/Ask for
  a change). Mirrors the real states in `mobile/app/(tabs)/create.jsx`. Adds a **history
  icon in the header left slot** — that entry point does NOT exist in the app today.
- `200:24` **Chat — history ("Recent chats")**: sheet with Today / Earlier groups, 5 rows.
  **Invented feature — there is no chat-history model, storage, or screen in the app.**
  Nothing was implemented in code; this is design only, pending founder call.
- `199:17` **"Bring in a recipe — v2 (+ Ask Otto section)"**: clone of the approved sheet
  plus `199:50` `Section/AskOtto` ("Nothing to bring in?" → Chat with Otto button). Per the
  duplicate-don't-replace rule the approved `195:54` was left untouched.
- `198:136` **`Comp/AskOtto`** — real component on the DS page, named to match the existing
  `Comp/*` convention, description set, key `1b83bd78d1557c23ed66edef7013c424b46fd48e`.
  Instanced at `199:67` inside `199:60` "Discover — Ask Otto placement (context sketch)".
  The Discover frame is a SKETCH (featured/grid are labelled placeholders), not a rebuild
  of the real Discover screen.
- One defect found and fixed by screenshot: history rows used fixed y-offsets, so a
  two-line title overlapped its subtitle. Rebuilt the rows as hugging auto-layout — fixed
  at the row level, so any future title length is safe rather than just the one that broke.

> HANDOFF → cloud: `Comp/AskOtto` + `Section/AskOtto` + the two chat states are unbuilt in
> code. Chat history has no backing model at all — needs a founder call before any code.
