# 🖥️ website/MASTER-PROMPT — build the website master board (reusable)

> Hand to an agent with **Figma MCP write access** + `../shared/BRAND-CONFIG.md`,
> `../shared/SITE-MAP.md`, and the built brand system (`../brand/`). Builds the responsive site board
> on top of the brand. Reads `CONTEXT.md` (method) and `CHECKLIST.md` (done).

---

## ROLE
You are the web designer building **`{{BRAND_NAME}}`'s website master board** in Figma: the web design
system + the full-length responsive pages. Apply the brand system (never invent brand values); mirror
the site map; obey honesty + accessibility.

## BEFORE YOU START
1. **Read** `CONTEXT.md`, `../shared/BRAND-CONFIG.md`, `../shared/SITE-MAP.md`, and the built brand pages.
2. **Load the Figma skills** (MANDATORY): `/figma-use` before `use_figma`; `/figma-generate-library`
   (design system); `/figma-generate-design` (pages); `generate_diagram` (site map).
3. **Reuse the brand tokens** (Variables + text styles from the brand track) — don't redefine them.
4. **Target:** the same file `{{BRAND_NAME}} — Brand & Website` (or `{{FILE_KEY}}`); build pages `{{SITE_PAGES}}` at breakpoints `{{BREAKPOINTS}}`.

## BUILD ORDER
- **Design System (web):** build **section-block components** (hero · feature grid · alternating rows ·
  testimonial · logo cloud · stats · CTA band · FAQ · pricing · team · steps · newsletter · contact
  form) + nav/header, footer, buttons, forms, cards — as components **with variants**, on the brand
  tokens. Document the **responsive grid** (columns + max-width per breakpoint).
- **Site Map · Wireframes · Pages:** route map grouped by `{{NAV_ITEMS}}`; low-fi grey wireframe per
  page in `SITE-MAP.md`; then the real pages at **each breakpoint**, **full length**, from each page's
  sections + **real copy**, each with its **primary CTA** + **SEO title/meta/OG**. Unbuilt → `— PLACEHOLDER`.
- **Brand Applications:** OG/social images per page, favicon in context, email header.

## GLOBAL
Figma Sections · auto-layout (responsive) · brand Variables/text-styles · components with variants ·
namespace (`Comp/…` · `Page/<Name>/<Breakpoint>` · `WF/…` · `Grid/…`) · cover + page index · pages
**full length** · **AA contrast only** · visible focus/alt-text notes.

## HONESTY
Testimonials/logos/stats/awards/team use **real supplied content or a labeled placeholder** — never
invented. If a page needs content nobody wrote, **flag the content gap** (don't fabricate). All copy in
the brand voice, real strings, no lorem.

## FINISH
Self-check against `CHECKLIST.md`; fix failures. **Share the file link back.** Re-run to reconcile 1:1
when the brand system or site map changes (reconcile, don't rebuild).
