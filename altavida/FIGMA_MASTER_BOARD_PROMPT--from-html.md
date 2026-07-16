# 🧩 Altavida Master-Board Prompt — PATH A: from HTML (mirror the current site)

> Extract Altavida's **real** design system + full website from the Claude-design HTML in
> `altavida/source-html/`, populate `BRAND-CONFIG.md` + `SITE-MAP.md`, and build a 6-page Figma master
> board **1:1 with that HTML**. Everything traces to the source — **nothing invented**. Run in a
> **Figma-write-authorized session** (the terminal). Shares the file link back.

---

## ROLE & GOAL
You are the design engineer **reverse-engineering Altavida's design system from its HTML** and
building `Altavida — Brand & Website` in Figma as a faithful mirror. You do not redesign or "improve"
— you capture what ships. Real copy stays **verbatim**; real proof stays; gaps are labeled placeholders.

## BEFORE YOU START
1. **Read** `altavida/source-html/` (the `design-system.html` + every page HTML + CSS), plus
   `../reusable-website-branding/website/CONTEXT.md` (method) and both `CHECKLIST.md`s (done).
2. **Load the Figma skills:** `/figma-use` before `use_figma`; `/figma-generate-library` (foundations +
   components); `/figma-generate-design` (pages); `generate_diagram` (site map).

## STEP 1 — EXTRACT the design system (from CSS + markup)
Parse the HTML/CSS and record findings into `altavida/BRAND-CONFIG.md`:
- **Color tokens** — collect every distinct color + all CSS custom props (`:root { --… }`); name each
  by role (from where it's used: bg/surface/text/primary/accent/border/semantic); **compute the WCAG
  contrast ratio for each text/background pair** and flag any that fail AA.
- **Type** — font-families (+ `@font-face`/Google Fonts links), the distinct font-size / weight /
  line-height / letter-spacing combos → a display/heading/body **scale**.
- **Spacing** — the recurring margin/padding/gap values → a spacing scale; the container **max-width**;
  the **column grid**.
- **Shape** — border-radius + box-shadow values → radius/elevation tokens.
- **Breakpoints** — the `@media` widths → the responsive set (desktop/tablet/mobile).
- **Motion** — transitions/animations/durations/easings.
- **Assets** — logo (`<img>`/inline SVG), favicon `<link>`, `og:image`, and referenced images.
> Read the markup **as-is**; do not normalize or "fix" values — the board must mirror what ships.

## STEP 2 — EXTRACT components
Catalog the repeated markup patterns as components (with variants): nav/header (+ mobile/hamburger),
footer, buttons (by class/state), links, form fields, cards, and the **section blocks** actually
present (hero · feature grid · alternating rows · testimonial · logo cloud · stats · CTA band · FAQ ·
pricing · team · steps · newsletter · contact). Note each block's real structure.

## STEP 3 — EXTRACT the site map + pages → `altavida/SITE-MAP.md`
For each page HTML file: record its **sections top→bottom** (semantic blocks in real order), the
**real copy** (headings/body/CTAs, **verbatim**), the **primary CTA**, and the `<title>` +
`<meta description>` + `og:*` for SEO. Build the nav/footer link map. Keep real filenames.

## STEP 4 — BUILD the 6-page Figma master board (mirror)
Follow the shared anatomy in `../reusable-website-branding/FIGMA_MASTER_BOARD_PROMPT.md`, but every
value comes from STEPS 1–3:
1. **Brand Foundations** — the extracted logo/color(+contrast)/type/spacing/imagery/motion.
2. **Web Design System** — the extracted components + section blocks (variants) + the real grid/breakpoints.
3. **Site Map · Wireframes · Pages** — extracted site map; low-fi wireframe per page; then the real
   pages at **each extracted breakpoint**, **full length, uncropped**, from the real sections + **verbatim
   copy**. Show the real responsive transforms from the media queries.
4. **Brand Applications** — the real favicon/OG + social/email derived from the system.
5. **Brand Guidelines** — assemble the extracted rules into the shareable rulebook.
6. **Brand Strategy** (optional) — only if positioning is supplied; otherwise skip (don't invent it).

## GLOBAL & HONESTY
Figma Sections · auto-layout · **Variables/text-styles from the extracted tokens** · components with
variants · namespace (`Brand/…`·`Comp/…`·`Page/<Name>/<bp>`·`WF/…`·`Map/…`) · cover + page index ·
pages **full length** · **AA contrast stated** (flag failures found in the source — note them, don't
silently "fix" the brand) · **verbatim real copy** · **no invented proof** (keep real testimonials/
logos/stats; stub sections → labeled placeholder).

## FINISH
- Fill `BRAND-CONFIG.md` + `SITE-MAP.md` with the extracted values (replacing the `⟨from-html⟩` markers).
- Self-check against both `CHECKLIST.md`s. **Share the Figma file link back.**
- Report: tokens found, components found, pages built, any **contrast failures** or **stub sections**
  discovered in the source (as findings, not silent edits).

*Source of truth: the HTML in `altavida/source-html/`. The board is its faithful mirror.*
