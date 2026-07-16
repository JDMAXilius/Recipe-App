# 🎨 Altavida — BRAND-CONFIG

> Altavida's brand identity. **Status: PENDING population.** Fill via **Path A** (extracted from
> `source-html/` by `FIGMA_MASTER_BOARD_PROMPT--from-html.md`) or **Path B** (proposed by
> `FIGMA_MASTER_BOARD_PROMPT--greenfield.md`, labeled as a proposal). Do not hand-invent facts. Field
> spec: `../reusable-website-branding/shared/BRAND-CONFIG.template.md`.

`⟨from-html⟩` = extract from the provided HTML/CSS · `⟨propose⟩` = greenfield proposal · `⟨ask⟩` = needs founder input.

## 1. Positioning
- **Brand:** Altavida
- **One-liner:** ⟨ask⟩  *(what Altavida does + for whom)*
- **Offering / audience / positioning / personality:** ⟨ask⟩
- **Competitors / landscape:** ⟨ask⟩

## 2. Logo & marks
- **Primary logo / wordmark / favicon:** ⟨from-html: extract logo `<img>`/SVG + favicon `<link>`⟩ / ⟨propose⟩
- **Clear space · min size · misuse · on-light/dark:** ⟨propose from the extracted logo⟩

## 3. Design tokens
- **Color:** ⟨from-html: unique colors + `--custom-props`; name · hex · role; compute AA contrast pairs⟩ / ⟨propose⟩
- **Type:** ⟨from-html: font-families, sizes, weights, line-heights → display/heading/body scale + web-font source⟩ / ⟨propose⟩
- **Spacing / grid:** ⟨from-html: margins/paddings/gaps → scale; container max-width; column grid⟩
- **Radius / elevation:** ⟨from-html: border-radius + box-shadow values⟩
- **Motion:** ⟨from-html: transitions/animations⟩ / ⟨propose principles⟩
- **Breakpoints:** ⟨from-html: media-query widths⟩ (default desktop 1440 · tablet 768 · mobile 375)

## 4. Voice & tone
- **Voice principles + do/don't:** ⟨infer register from the real copy — do not rewrite the copy⟩ / ⟨propose⟩
- **Sample copy** (headline · subhead · CTA · error): ⟨from-html: real strings, verbatim⟩

## 5. Imagery & art direction
- **Photography / illustration / patterns:** ⟨from-html: catalog the real images + their treatment⟩ / ⟨propose⟩
- **Mascot / character:** ⟨ask⟩ (Altavida likely none)

## 6. Applications
- Favicon · OG image · social · email: ⟨from-html: existing `og:image`/favicon⟩ / ⟨propose⟩

## 7. Honesty constraints
- **No invented proof** — testimonials/logos/stats/awards/team = real (from HTML) or **labeled placeholder**.

## 8. Source of truth
- **Path A source:** `altavida/source-html/` · **assets:** ⟨from-html img paths⟩ · **content:** the HTML copy (verbatim).
- **Site map:** `altavida/SITE-MAP.md`

## 9. Deliverables
- **Brand pages:** Foundations + Guidelines + Applications (+ Strategy).
- **Website pages:** per `SITE-MAP.md`. **Breakpoints:** ⟨from-html⟩. **Figma:** new file `Altavida — Brand & Website`.
