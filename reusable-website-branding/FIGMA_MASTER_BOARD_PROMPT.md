# 🧩 Figma Master-Board Prompt — WEBSITE version (paste-ready)

> The website analog of an app's `FIGMA_MASTER_BOARD_PROMPT.md`. Paste to an agent with **Figma
> write access** to build one Figma file, **6 pages**, that hold the entire brand + marketing site at
> a glance: brand foundations, web design system, site map, wireframes, **full-length responsive
> pages**, brand applications, and a guidelines page.
>
> **Reads brand facts from the config — never invents them.** Every `{{…}}` and every "from
> BRAND-CONFIG/SITE-MAP" reference is pulled from `shared/BRAND-CONFIG.md` + `shared/SITE-MAP.md`
> (fill those first). If a value is missing, the brand track **proposes** it and logs the call — it is
> never fabricated as fact (no invented logos, testimonials, stats, or clients).
>
> **Figma writes need an authorized/interactive session** — run this in the terminal, not a headless
> cloud session; it returns the file link.

---

## ROLE & GOAL
You are the design engineer building **`{{BRAND_NAME}}` — Brand & Website**, one Figma file that holds
the whole brand and marketing site at a glance. Optimize for legibility-at-a-glance and craft. The
board **mirrors the brand system + site map** — it applies real brand tokens and real copy; unbuilt
pages are labeled placeholders; unverifiable proof is a labeled placeholder, never invented.

## BEFORE YOU START
1. **Read** `shared/BRAND-CONFIG.md` (identity · positioning · tokens · voice · imagery · applications),
   `shared/SITE-MAP.md` (pages · sections · SEO · CTAs), and `brand/CONTEXT.md` + `website/CONTEXT.md`.
2. **Load the Figma skills** (MANDATORY): `/figma-use` before any `use_figma`; `/figma-generate-library`
   (foundations + components); `/figma-generate-design` (pages); `generate_diagram` / `/figma-use-figjam`
   (site map).
3. **Upload real assets** (`upload_assets`) from `{{PATH_ASSETS}}` — logos, photography, any supplied art.
   Never redraw a supplied logo.
4. **Target:** create **`{{BRAND_NAME}} — Brand & Website`** (or file key `{{FILE_KEY}}`). Build the
   pages listed in `{{BRAND_PAGES}}` + `{{SITE_PAGES}}` at breakpoints `{{BREAKPOINTS}}` (default
   desktop 1440 · mobile 375 · tablet 768 where layout changes).

## PROFESSIONAL APPROACH (craft — apply on every page)
- **Figma Sections** carve each page into labeled zones (navigable via layers + minimap).
- **Auto-layout on everything** — essential for responsive; alignment/spacing become automatic.
- **Variables** for color/spacing tokens; **text styles** for the type scale; **components + variants**
  for every block/state. Define once, reference everywhere.
- **8-pt grid**; consistent gutters (≈64px within, ≈160–240px between Sections, ≈120px between page frames).
- **Full natural height** — pages are **never clipped to the viewport**; show the whole scroll.
- **Naming:** `Brand/…` · `Comp/<Block>` · `Grid/<bp>` · `Page/<Name>/<Breakpoint>` · `WF/<Name>` ·
  `Map/Zone/*` · `Alternative version — <Name>`.
- Each page opens with a **cover/legend** frame (title · purpose · legend · "last updated · built from `BRAND-CONFIG`/`SITE-MAP`").
- **Honesty + a11y (hard):** no invented proof; **WCAG AA** contrast on every text/bg pair (state the ratio); real copy, no lorem.

---

## PAGE 1 — Brand Foundations
Build real Variables + text styles from `BRAND-CONFIG`, shown as spec cards:
- **Logo & marks** — primary lockup, symbol/wordmark, favicon, on-light/on-dark, **clear space + min
  size + misuse** tiles. (If the logo doesn't exist yet, show the 2–3 proposed directions + the chosen one.)
- **Color** — a swatch per token (`{{COLORS}}`: primary · secondary · accent · neutrals · semantic),
  each labeled name · hex · role **and its AA contrast pair + ratio**. Fix any failing pair.
- **Type** — text-style specimens for `{{TYPE}}` (display/heading/body) with a modular scale + web-font
  + fallback note; real specimen copy.
- **Spacing / layout grid** — the scale + the column grid + max content width per breakpoint.
- **Imagery & art direction** — photography/illustration/pattern do & don't tiles.
- **Motion spec card** — document `{{MOTION}}` (easing · duration · feel); Figma can't animate — document it.

## PAGE 2 — Web Design System (components)
Build every web component as a real component **with variants**, on the brand tokens:
- **Global:** nav/header (logo · links · CTA · mobile hamburger variant), footer.
- **Atoms:** buttons (primary/secondary/ghost/link · hover/focus/disabled), inputs + form fields (with
  label/error/focus), links, tags/badges, breadcrumbs, pagination.
- **Section blocks (the heart):** hero · feature grid · alternating feature rows · testimonial/quote ·
  logo cloud · stats/metrics band · CTA band · FAQ accordion · pricing table · team grid · steps /
  how-it-works · newsletter signup · contact form · blog/article card.
- Document the **responsive grid** (columns + gutter + max-width) for each breakpoint.

## PAGE 3 — Site Map · Wireframes · Pages
- **3A Site Map:** a route diagram grouped by nav (`Map/Zone/*` → nodes + connectors), incl. header/footer links.
- **3B Wireframes:** a uniform grid of **low-fi grey** wireframes, one per page in `SITE-MAP.md`.
- **3C Pages:** the real hi-fi pages at **each breakpoint** (desktop + mobile min; tablet where it
  changes), **full length, uncropped**, built from each page's sections in `SITE-MAP.md` with **real
  copy** + the page's **one primary CTA** + a **SEO title/meta/OG** note. Show the real responsive
  **transforms** (columns→stacked, nav→hamburger), not just scaling. Unbuilt → `Page/<Name> — PLACEHOLDER`.
  Any proof section (testimonial/logo cloud/stats/awards/team) uses **real supplied content or a labeled placeholder**.
- **3D Alternates (only if kept):** superseded designs under one labeled section.

## PAGE 4 — Brand Applications
OG/social share images per page, favicon in context, social post templates, email header — from the
brand system.

## PAGE 5 — Brand Guidelines
Assemble the shareable rulebook: logo do/don't · palette + contrast · type scale · voice with **real
example copy** · imagery direction · spacing/grid. This is the deliverable that keeps the brand consistent.

## PAGE 6 — Brand Strategy (optional)
Positioning · audience · personality · differentiator (from `BRAND-CONFIG §1`) + competitive framing —
so reviewers see the *why* behind the identity. Build only if listed in `{{BRAND_PAGES}}`.

---

## CRAFT ACCEPTANCE (check before done — see brand/CHECKLIST.md + website/CHECKLIST.md)
- ☑ **6 pages**, each carved into named **Sections**; a cover/legend + a **page index** on Page 1.
- ☑ Tokens are real **Variables + text styles**; components are real **components with variants**.
- ☑ Everything on the **8-pt grid**; pages **full length**; responsive **transforms shown**.
- ☑ **WCAG AA** contrast stated + passing on every pair; visible focus states; alt-text notes.
- ☑ Real copy (no lorem); every page has one primary CTA + SEO/OG.
- ☑ **No invented proof** — real content or labeled placeholders; content gaps flagged, not fabricated.
- ☑ Naming convention throughout; unbuilt pages labeled `— PLACEHOLDER`.

## GUARDRAILS
- Don't invent brand facts, clients, testimonials, stats, or logos — pull from `BRAND-CONFIG`/`SITE-MAP`
  or use a **labeled placeholder**; if the brand is incomplete, **propose + log**, don't fabricate.
- Reuse committed asset files (upload); don't redraw supplied logos.
- Figma writes stay **sequential** (never two `use_figma` in parallel); complete writes in an authorized session.
- Coordinate via git for any exported previews; the deliverable is the Figma file — **share its link back**.
- The board is a **mirror** — re-run to reconcile 1:1 when the brand system or site map changes.

*Source of truth for tokens/voice: `shared/BRAND-CONFIG.md`. Source of truth for pages/content:
`shared/SITE-MAP.md`. This board is the visual index of both.*
