# 🧩 Terminal Prompt — Build the Otto "Master Board" in Figma (everything on 1–2 pages)

> Paste this to the terminal (it has the Figma seat + write access; this cloud session can't approve
> Figma writes). Goal: **one Figma file, 2 pages, that hold the ENTIRE app at a glance** — design
> system, every component, every asset, an app map, low-fi wireframes, and the full-length
> (top-to-bottom) screens — instead of scattering it across many pages. Everything aligned, spaced
> on an 8-pt grid, and laid out like a professional design-system board.

---

## ROLE & GOAL
You are the design engineer building Otto's single source-of-truth board in Figma. Produce a clean,
navigable **2-page** file where the founder can scroll and *see the whole app* — tokens, components,
assets, the map, wireframes, and the real screens full-length. Optimize for **legibility at a glance**
and **craft** (alignment, spacing, consistent naming). This is a living reference, not a throwaway.

## BEFORE YOU START (read + load)
1. **Read the repo specs** so the board reflects the real app, not invention:
   `docs/SCREEN_MAP.md` (every screen + content), `docs/DESIGN_SYSTEM.md`, `docs/MASCOT.md`,
   `docs/ONBOARDING_BRIEF.md`, `docs/SPLASH_BRIEF.md`, `docs/BACKEND_ROADMAP.md` (feature context),
   and the token source: `mobile/constants/tokens.js` + `mobile/constants/colors.js`.
2. **Load the Figma skills first** (MANDATORY): `/figma-use` before any `use_figma`; then
   `/figma-generate-library` for the design-system page and `/figma-generate-design` for screens.
3. **Existing Figma files** (reuse styles/components if present): Design-System `X1eGT54CTwtowHNve30vvE`,
   Current-State `7wYg6693e6m3D9hwqVkPsA`. **Recommended:** create a NEW file **"Otto — Master Board"**
   with 2 pages (keeps this overview clean); pull in the existing library if it helps.
4. **Assets are in the repo** — upload these to Figma (`upload_assets`), don't redraw them:
   `mobile/assets/mascot/*` (Otto expressions, cut-outs, scenes, paws, app icons),
   `mobile/assets/onboarding/*` + `mobile/assets/splash/*` (download from the manifest URLs first if
   not yet committed), `mobile/constants/foodIcons.js` (the painted food-icon set).

## PROFESSIONAL APPROACH (how to structure a single-canvas overview — the research)
This is a known practice ("design-system overview board" + "userflow board" + "screen archive").
Apply these craft rules:
- **Figma Sections** (the built-in Section container) to carve each page into labeled zones — this is
  how pros keep one canvas navigable. Name them clearly (they show in the layers panel + minimap).
- **Auto-layout on everything** (frames, rows, cards) → alignment + spacing are automatic and consistent.
- **Figma Variables** for color/spacing/radius tokens; **Text styles** for the type scale; **Component
  + variants** for component states. Build tokens once, reference everywhere.
- **8-pt spacing grid.** All gaps/padding are multiples of 4/8. Consistent gutters: ~64px between
  cards, ~160–240px between Sections, ~120px between screen frames.
- **Consistent frame width** for phone screens: **393×852** (iPhone 15 logical); screen *height is
  variable* (full-length, below).
- **Naming convention:** `DS/Color/Accent`, `DS/Type/Title`, `Comp/RecipeCard`, `Asset/Otto/Happy`,
  `Screen/Discover`, `WF/Discover`, `Map/Node/Discover`. Predictable names = a usable file.
- **Top-left legend/cover frame** on each page: title, what the page is, the token legend, last-updated.
- **Left-aligned baseline** and horizontal rhythm; use grid/ruler guides so nothing floats.
> Mobbin/Dribbble references for board layout can be pulled when Mobbin is re-authed; the practices
> above are the standard and don't block you.

---

## PAGE 1 — "Otto · Design System" (foundations + components + assets)

### 1A · Foundations (Section)
Build real Figma **Variables + styles** from the repo tokens, then show swatch/spec cards:
- **Color** (base light — the app is **light-only**): `accent #C4562E`, `accentSoft #F3D9CD`,
  `secondary(chestnut) #8A5A3B`, `gold #E8B04B`, `bg #FAF4EA`, `surface #FFFFFF`,
  `surfaceWarm #F3E9DA`, `ink #2A211B`, `inkSoft #6E6055`, `border #E8DECF`, `gray #B9A895`,
  `destructive #D64545`. **Nutrition (fixed, never re-skinned):** `protein #3B82F6`, `carbs #F0A020`,
  `fat #8B5CF6`. *(Also stash the niche accents — lean/keto/bulk — as a small "future niches" note,
  but the board renders base/light only.)*
- **Type scale** (Lora display + system body): Display Lora700 30/34 · Title Lora600 22/26 ·
  Body 15/22 · Label 13/600 · Caption 12/500 UPPER (tabular) · Step 24/32.
- **Spacing:** 4·8·12·16·24·32. **Radius:** card 20 · sheet 24 · button 14 · pill 999 · mascot 24.
- **Elevation/overlay:** scrim `rgba(42,33,27,.35)`, strong `.65`, textShadow `.45` (warm ink, never
  pure black). **Motion spec card** (document only — Figma can't animate): springs gentle/snappy/pop/
  sheet, timing sweep 500 / fade 200, note the paw-pop signature + reduced-motion rule.

### 1B · Assets (Section)
Uploaded, labeled tiles — the real PNGs, not redraws:
- **Otto mascot:** hero, alt-hero, turnaround, expression sheet + each expression (happy, excited,
  thinking, sleepy, sad, proud) and their transparent cut-outs; scenes (cooking, floating, loading,
  empty); app icons A/B; **badge** (the circle-crop bust). Caption each with its **app-state mapping**
  (happy=home, excited=save, thinking=search-empty, sleepy=loading, sad=empty, proud=onboarding finale).
- **Paw mark:** outline (unsaved) + filled (saved).
- **Food-icon set** (from `foodIcons.js`) — the painted category icons, on one tint.
- **Onboarding art** (B1 collect / B2 cook / B3 plan) + **Splash still**.

### 1C · Components (Section) — every component, with variants
Build as real Figma components (auto-layout + variants). Cover **all** of these (from `mobile/components/`):
- **Top bar / header** (assume component) — greeting header variant + screen-title header variant.
- **Tab bar** — `Discover · Cookbook · ＋Add · Plan · Account`, labels on, outline→filled terracotta
  active, Cookbook uses the paw; center ＋Add is the raised action.
- **RecipeCard** (grid card: photo + time-pill + title; saved/unsaved paw states).
- **CategoryFilter** (chips row) · **FilterSheet** (bottom sheet).
- **Nutrition:** `NutritionCard` (scope toggle + calorie ring + segmented macro bar + 3-col legend +
  honesty footnote), `CalorieRing`, `MacroBar`, `ServingStepper`.
- **PawMark** · **Bounceable** (press-state wrapper — show default/pressed) · **LoadingSpinner** ·
  **NoFavoritesFound** (empty) · **OttoIdle** / **OttoStates** (the mascot-state component).
- **Buttons** (primary terracotta / secondary / destructive-outline), **input field**, **pill/chip**,
  **list row** (account rows), **segmented control**, **progress dots** (onboarding), **social auth row**
  (Apple/Google/Facebook). Every component: show its **states** as variants.

---

## PAGE 2 — "Otto · App Map, Wireframes & Screens"

### 2A · App Map (Section, top) — the sitemap/flow
A node-graph of the whole app (use `generate_diagram`/FigJam-style or auto-layout nodes + connectors):
- Entry: **Splash → Onboarding (B1·B2·B3) → Discover**; Auth as a **cloakroom** branch (Sign up / Sign
  in reached on first save).
- **Tab bar hub** (Discover · Cookbook · ＋Add · Plan · Account) with each tab's children.
- Flows: **Add** (menu → URL/photo/video/manual → review → save), **Recipe** (detail → cook mode →
  celebration), **Plan → Shopping list → share**, **Account → Otto Club paywall**.
- Connector arrows; group by tab with color-tinted zones. This is the "website sitemap, but app map."

### 2B · Wireframes (Section, middle) — low-fi, every screen
A tidy **grid of small low-fidelity wireframes** (grey boxes + labels, NO real art/color — this is for
ideation): one mini-frame per screen, same order as the map. Purpose: see structure + spot ideas fast.
Keep them uniform size (e.g., 240px wide) in a clean grid with captions.

### 2C · Full-length Screens (Section, bottom) — hi-fi, top-to-bottom
The real screens at **393 wide, full natural height** (NOT clipped to the viewport — many will be very
tall; show every section from top to bottom, scroll and all). Build from the real components (2C uses
Page 1's library) + the repo screen content. Arrange in **flow order**, grouped by tab with sub-section
labels. Include **every screen below** — build the ones that exist for real; for ones we *should* have
but don't yet, drop an **empty placeholder frame** (labeled "PLACEHOLDER — not built") so the set is complete.

**Screen list** (from `SCREEN_MAP.md` + real routes in `mobile/app/`):
- **Launch/Auth:** Splash · Onboarding B1 · B2 · B3 · Sign up (w/ Apple·Google·Facebook) · Sign in
- **Discover:** Discover/Home · Search active · Filter sheet · By-ingredient *(placeholder if unbuilt)*
- **Recipe:** Detail (`recipe/[id]`) · Cook mode (`recipe/cook/[id]`)
- **Add/Create:** Add menu (`add.jsx`) · Import-URL review · Scan-photo review *(placeholder)* ·
  Video/IG review *(placeholder)* · Manual editor (`create.jsx`) · Edit (`recipe/edit.jsx`)
- **Cookbook:** Cookbook (`cookbook.jsx`, segments Saved · My recipes) · Empty state
- **Plan:** Planner (`plan.jsx`) · Shopping list (`shopping.jsx`) · Journal (`journal.jsx`)
- **Account:** Account/Profile (`profile.jsx`) · Otto Club paywall (`otto-club.jsx`) ·
  Connected accounts *(placeholder)* · Confirm dialogs
- **Supporting states:** Celebration · Error/offline · Empty · Search-empty · Loading

---

## CRAFT ACCEPTANCE CRITERIA (check before done)
- ☑ **2 pages** only; each carved into labeled **Sections**; a cover/legend frame per page.
- ☑ Tokens are real **Variables + text styles**; components are real **components with variants**.
- ☑ Everything on the **8-pt grid**; consistent gutters; nothing visually floating or mis-aligned.
- ☑ **Light-only**; Otto used per the state-map; **honesty** respected (nutrition = estimate, no fake
  ratings/data on any screen).
- ☑ Full-length screens are **uncropped top-to-bottom**; wireframes are **low-fi grey**; the two are
  visually distinct.
- ☑ Naming convention applied throughout; the file is navigable from the layers panel + minimap.
- ☑ Every screen in the list is present (real or labeled placeholder).

## GUARDRAILS
- Don't invent screens/among content — pull from the repo specs. Placeholder = explicitly labeled.
- Reuse the committed asset PNGs (upload), don't regenerate Otto.
- If a Figma write needs approval, complete it in your interactive/terminal session (this is why the
  cloud co-pilot handed it to you).
- Coordinate via git if you commit any exported previews; otherwise the deliverable is the Figma file —
  **share its link back**.

*Source of truth for content: `docs/SCREEN_MAP.md`. Source of truth for tokens: `mobile/constants/`.
This board is the visual index of both.*
