# 🖥️ website/CONTEXT — the website design-system + master-board methodology (reusable)

> The website track's *why/what*; `MASTER-PROMPT.md` is *how*. It builds **on** the brand system
> (`../brand/`) and mirrors `../shared/SITE-MAP.md`. It never invents brand values — it applies them.

---

## 1. What the Website Board is
A **single Figma file that holds the whole marketing site at a glance** — the design system (brand
applied to web components), the site map, wireframes, and the **full-length responsive pages** — plus
brand applications. A mirror of the brand system + site map, kept 1:1.

## 2. The page anatomy (build in order)
1. **Design System (web)** — the brand tokens realized as web components: nav/header, footer, buttons,
   links, forms, cards, and **section blocks** (hero, feature grid, alternating rows, testimonial,
   logo cloud, stats, CTA band, FAQ, pricing table, team, steps, newsletter). Variants + states +
   the responsive **layout grid** (columns + max content width per breakpoint).
2. **Site Map · Wireframes · Pages** — a route map grouped by nav; one **low-fi grey** wireframe per
   page; the real hi-fi pages at each breakpoint, **full natural height (uncropped, top-to-bottom)**,
   grouped by section of the site. Unbuilt-but-planned pages → **labeled placeholders**.
3. **Brand Applications** — OG/social share images, favicon in context, email header, any collateral.

## 3. Responsive is first-class
- Design each page at **desktop + mobile** minimum (`{{BREAKPOINTS}}` — default 1440 / 375), tablet
  (768) where layout materially changes.
- Show the **real transforms**: multi-column → stacked, nav → hamburger, hero reflow. Don't just scale.
- One column grid + max-width per breakpoint, documented on the design-system page.

## 4. Craft laws (Figma)
- **Figma Sections** per zone; **auto-layout** everywhere (essential for responsive); brand
  **Variables + text styles**; **components with variants** for every block/state.
- 8-pt rhythm; consistent gutters; pages **full length, never viewport-cropped**.
- Namespace: `Comp/<Block>` · `Page/<Name>/<Breakpoint>` · `WF/<Name>` · `Map/Zone/*` · `Grid/*`.
- A cover/legend + page index.

## 5. Conversion & SEO & a11y (web-specific)
- Each page names its **one primary CTA**; the hero states the value prop (the 5-second test).
- Each page carries a real **SEO title + meta description + OG image** (from `SITE-MAP`).
- **Accessibility:** brand contrast pairs only; visible focus states; alt-text notes on media; forms
  have labels + error states.

## 6. Honesty law (shared with brand)
- **No invented proof:** testimonial/logo-cloud/stats/awards/team sections use **real supplied** content
  or a **labeled placeholder** — never fabricated. A page that needs content nobody wrote = a **content
  gap** to flag, not fill with fiction.

## 7. Lessons baked in
- **Full-length beats hero-only crops** — reviewers must see the whole page.
- **Placeholders keep the set honest and complete.**
- **Mobile is not an afterthought** — design it beside desktop, not "later."
- **Re-sync, don't rebuild** — reconcile to the brand system + site map after changes.

## 8. Definition of done → `CHECKLIST.md`.
