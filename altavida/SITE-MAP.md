# 🗺️ Altavida — SITE-MAP

> Altavida's pages + sections. **Status: PENDING population.** Fill via **Path A** (extracted from the
> full-website HTML in `source-html/`) or **Path B** (proposed). Field spec:
> `../reusable-website-branding/shared/SITE-MAP.template.md`.

## Global chrome
- **Header / nav:** ⟨from-html: nav `<a>` items + the header CTA⟩
- **Footer:** ⟨from-html: footer columns · social links · legal · newsletter⟩

## Page inventory
Populate one row per HTML page (real filename → real sections + copy). `built` = exists in the HTML ·
`PLACEHOLDER` = planned but absent.

| Page (file) | State | Sections (top → bottom) | Primary CTA | SEO `<title>` / meta | Notes |
|---|---|---|---|---|---|
| ⟨from-html: index.html⟩ | built | ⟨from-html: semantic sections in order⟩ | ⟨from-html: hero CTA⟩ | ⟨from-html: `<title>`/`<meta name=description>`⟩ | — |
| ⟨…each page…⟩ | | | | | |

## Reusable section blocks (build once in the web design system)
⟨from-html: catalog the repeated section patterns — hero · feature grid · alternating rows ·
testimonial · logo cloud · stats · CTA band · FAQ · pricing · team · steps · newsletter · contact form⟩

## Rules
- Mirror the HTML exactly — **real copy verbatim**, sections in real order. Nothing invented.
- Any **proof** section (testimonial/logos/stats/awards/team) present in the HTML is **real** → keep it;
  if a page's section is a stub in the HTML, mark it a **labeled placeholder** (don't fill with fiction).
- Note pages whose layout **changes on mobile** (media queries) so those breakpoints get built explicitly.

## SEO/OG
⟨from-html: per-page `<title>`, `<meta name=description>`, `og:*` tags⟩.
