# 🗺️ shared/SITE-MAP (template) — every page, its sections, its content

> Copy to `SITE-MAP.md` and fill. Drives the wireframes + full-length pages. Ties each page to its
> real content + primary CTA so the site can't design a page nobody wrote copy for. See
> `../EXAMPLE-altavida.md`.

## Global chrome (shared across pages)
- **Header / nav:** {{NAV_ITEMS}} + primary CTA {{HEADER_CTA}} (logo left, links, CTA right).
- **Footer:** {{FOOTER}}  *(sitemap columns · social · legal · newsletter)*

## Page inventory
`built` = designed · `PLACEHOLDER` = should exist, not built (labeled empty frame).
For each page fill a row:

| Page | State | Sections (top → bottom) | Primary CTA | SEO title / meta | Content source |
|---|---|---|---|---|---|
| {{page}} | built/PLACEHOLDER | {{hero · … · CTA band}} | {{cta}} | {{title / description}} | {{real copy path or "TBD"}} |

**Typical marketing-site pages (adapt to the project):**
- **Home** — hero · value props/features · social proof · how it works · CTA band · FAQ.
- **About** — story · mission/values · team · CTA.
- **Product / Services** — offering detail · benefits · use cases · pricing teaser.
- **Pricing** — tiers · comparison · FAQ (only if pricing is public + real).
- **Case studies / Portfolio / Work** — index + detail (only with real, permitted content).
- **Blog / Resources** — index + article template.
- **Contact** — form · details · map/booking.
- **Legal** — Privacy · Terms.

## Reusable section blocks (build once in the website design system)
hero · feature grid · alternating feature rows · testimonial/quote · logo cloud · stats/metrics ·
CTA band · FAQ accordion · pricing table · team grid · steps/how-it-works · newsletter · contact form.

## Rules
- Every page is **built** or **PLACEHOLDER** — no fake mockups.
- **Sections** are the real top-to-bottom blocks (drives full-length page height + which section
  components are needed).
- **Honesty:** any section that shows proof (testimonials, logos, stats, awards) must use **real,
  supplied** content or a **labeled placeholder** — never invented. Flag those sections here.
- **SEO:** each page has a real title + meta description + an OG image plan.
- **Conversion:** each page names its **one** primary CTA.

## Responsive notes
List pages whose layout **changes materially** on mobile (e.g. multi-column → stacked, nav → hamburger)
so the board author builds those breakpoints explicitly.
