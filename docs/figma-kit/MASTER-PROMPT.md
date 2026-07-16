# 🧩 MASTER-PROMPT — build the Master Board (reusable)

> Hand this to an agent with **Figma MCP write access**, together with a filled `APP-CONFIG.md`.
> It builds the 6-page master board for `{{APP_NAME}}` by mirroring the app's real tokens + screen
> map. Reads `CONTEXT.md` for the methodology and `CHECKLIST.md` for done. All `{{…}}` come from
> `APP-CONFIG.md`.

---

## ROLE
You are the design engineer building **`{{APP_NAME}}` — Master Board**: one Figma file that holds the
entire app at a glance. Optimize for legibility-at-a-glance and craft. The board **mirrors the app's
code** (tokens + screen map) — never invent; unbuilt screens are labeled placeholders.

## BEFORE YOU START
1. **Read** `CONTEXT.md` (methodology + craft laws + naming + honesty laws) and the app's source of
   truth: `{{PATH_COLORS}}`, `{{PATH_TOKENS}}`, `{{PATH_SCREENMAP}}`, `{{PATH_COMPONENTS}}`, `{{PATH_ASSETS}}`.
2. **Load the Figma skills** (MANDATORY): `/figma-use` before any `use_figma`; `/figma-generate-library`
   for the Design System page; `/figma-generate-design` for screens; `/figma-use-figjam` / `generate_diagram`
   for the app map + flows.
3. **Upload real assets** (`upload_assets`) from `{{PATH_ASSETS}}` — never redraw logos/mascot/icons.
4. **Target:** create `{{APP_NAME}} — Master Board` (or use file key `{{FILE_KEY}}`); reuse `{{EXISTING_LIBRARY}}` if given.
   Build **only** the pages listed in `{{PAGES_TO_BUILD}}`.

## GLOBAL CRAFT RULES (apply on every page — from CONTEXT §3–4)
- Carve each page into **Figma Sections**; **auto-layout** everything; **8-pt grid**; consistent gutters.
- Tokens → **Variables**; type → **text styles**; components → **components with variants**.
- Phone screens at **{{DEVICE_WIDTH}}** wide, **full natural height (uncropped)**.
- **Namespace** every layer (`DS/…`, `Asset/…`, `Comp/…`, `Screen/<Area>/…`, `WF/…`, `Map/…`).
- Each page opens with a **cover/legend** frame (title · purpose · legend · "last updated · built from repo @ main").
- Obey the **honesty laws** `{{HONESTY_LAWS}}`: state only true facts; label estimates; no invented data.
- Theme: render `{{THEME_MODE}}` only; keep other themes as a note.

## BUILD ORDER

### Page 1 — Design System
- **Foundations Section:** build real Variables + swatch cards for `{{COLOR_TOKENS}}` (mark fixed/functional
  colors); text-style specimens for `{{TYPE_SCALE}}` (real sentences, not lorem); spacing bars `{{SPACING}}`;
  radius cards `{{RADIUS}}`; overlay swatches `{{OVERLAY}}`; a **motion spec card** documenting `{{MOTION}}`
  (Figma can't animate — document values + rules). Add a "future/unused themes" note if any.
- **Assets Section:** upload + label every asset from `{{PATH_ASSETS}}`. If a mascot exists (`{{MASCOT_NAME}}`),
  show its states/scenes each **captioned with its app-state** per `{{MASCOT_STATE_MAP}}`; show marks, icons,
  onboarding/marketing art, app icons.
- **Components Section:** build **every** component in `{{PATH_COMPONENTS}}` as a real component with
  **variants** for each state (buttons, inputs, chips, nav/tab bar, cards, the domain components, sheets,
  empty/loading/toast, mascot-state component). Namespace + document each.

### Page 2 — App Map · Wireframes · Screens
- **2A App Map:** a route diagram grouped by `{{NAV_MODEL}}` / `{{TABS}}`, incl. entry + auth flows
  (`Map/Zone/*` → `Map/Node/*`, connectors).
- **2B Wireframes:** a uniform grid of **low-fi grey** wireframes, one per screen in `{{SCREEN_LIST}}`.
- **2C Screens:** the real hi-fi screens (from the Page 1 library) at `{{DEVICE_WIDTH}}` wide, **full
  length**, grouped by area, each built from the content blocks in `{{SCREEN_LIST}}`. Unbuilt →
  `Screen/<Area>/<Name> — PLACEHOLDER`.
- **2D Alternates (only if needed):** any superseded designs go here, under one labeled section — never scattered.

### Page 3 — User Flows
Diagram each journey in `{{FLOWS}}` as a thumbnail strip (screen thumbs + arrows + decision chips).

### Page 4 — App Store / Launch Kit
The store marketing screenshots (device mockup + headline) for the app's hero moments (derive from
`{{FEATURE_MAP}}`), plus any launch collateral. Skip if not in `{{PAGES_TO_BUILD}}`.

### Page 5 — Brand & Voice
`{{WORDMARK}}` lockups (on light + on dark), the `{{VOICE}}` with **real copy examples per state**,
`{{BROKEN_CONVENTIONS}}`, and the app-icon spec.

### Page 6 — Strategy Review (optional)
A stakeholder deck: vision · goals · research insights · design concepts · Q&A. Build only if listed.

## FINISH
- Add a **page index** to Page 1's cover (list every page by name — some Figma surfaces under-list pages).
- Self-check against `CHECKLIST.md`. Fix anything failing.
- **Share the file link back.** If Figma writes require approval, complete them in an authorized session.

## KEEPING IT ALIVE
This board is a **mirror**. When the app's tokens/screens change, **re-run this prompt** to reconcile
1:1 — reconcile, don't rebuild. Correct the board to match code; if the board reveals a code problem,
raise it — never silently diverge.
