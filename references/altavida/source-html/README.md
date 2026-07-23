# ⬇ Drop your Claude-design HTML here (Path A — from HTML)

Put the real Altavida design/site export in this folder, then run
`../FIGMA_MASTER_BOARD_PROMPT--from-html.md` (or ask me to extract it here in chat).

## What to add
- **`design-system.html`** — the design-system / style-guide page (the one showing colors, type,
  buttons, components). Include its CSS (inline `<style>`, a `<link>`ed stylesheet, or a `.css` file).
- **The full website** — one HTML file per page (`index.html`, `about.html`, `services.html`,
  `contact.html`, …) *or* a single-page site. Keep the real filenames — they seed the site map.
- **Assets** (optional) — logo, images referenced by the HTML (or leave them as the URLs in the markup).

## Conventions
- Keep **CSS custom properties** (`:root { --color-… }`) intact — they're the cleanest token source.
- Don't hand-edit the markup to "clean it up" — the extractor reads it **as-is** so the board mirrors
  what actually ships. Real copy stays verbatim (it's your content, not to be invented or paraphrased).
- If you have multiple breakpoints in the CSS (media queries), leave them — they define the responsive board.

## What gets extracted (→ see the from-html prompt)
tokens (color/type/spacing/radius/shadow/breakpoints) · components (nav/footer/buttons/forms/cards/
section blocks) · pages + their sections (top→bottom) · real copy + CTAs · `<title>`/`<meta>` for SEO ·
logo + image assets. These populate `../BRAND-CONFIG.md` + `../SITE-MAP.md`, then the Figma board.

*(This folder is intentionally empty until you add the HTML.)*
