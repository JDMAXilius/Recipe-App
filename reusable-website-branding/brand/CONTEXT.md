# 🎨 brand/CONTEXT — the brand-identity methodology (reusable)

> The brand track's *why/what*; `MASTER-PROMPT.md` is *how*. App specifics live in
> `../shared/BRAND-CONFIG.md`. The brand track produces the **identity system** the website track
> consumes — it comes first.

---

## 1. What a brand system is
A **coherent identity** — logo, color, type, voice, imagery, motion — plus the **guidelines** that
keep it consistent everywhere it appears. It is the source the website (and every future touchpoint)
draws from. Strategy first: identity is the *expression* of positioning, not decoration.

## 2. Anatomy (build in order — each layer grounds the next)
1. **Strategy** — positioning, audience, personality, differentiator (from `BRAND-CONFIG §1`). Every
   visual choice traces back to this.
2. **Logo & marks** — primary lockup, symbol/monogram, wordmark; clear space, min size, **misuse
   list**, on-light/on-dark, favicon + OG derivations.
3. **Color** — a disciplined palette (primary · secondary · accent · neutrals · semantic) with
   **documented AA contrast pairs** (WCAG 4.5:1 body / 3:1 large). Accessibility is part of the system.
4. **Type** — a display/heading/body pairing with a modular scale + real web-font loading + fallbacks.
5. **Voice & tone** — principles + do/don't + real example copy per context (headline, CTA, error).
6. **Imagery & art direction** — photography style, illustration/iconography, patterns/textures,
   mascot (if any) — with do/don't examples.
7. **Motion** — brand motion principles (easing, duration, restraint), documented (not necessarily animated).
8. **Applications** — the identity applied: favicon, OG/social image, social templates, email, collateral.

## 3. The deliverable: a Brand Guidelines page
A shareable page/section that *is* the rulebook: logo do/don't, palette + contrast, type scale, voice
examples, imagery direction. This is what keeps the brand consistent when other people (or agents) use it.

## 4. Craft laws (Figma)
- Tokens as **Variables**; type as **text styles**; every asset uploaded (never redrawn).
- **Figma Sections** per system area; **auto-layout**; an 8-pt-based spacing rhythm; consistent gutters.
- Namespace: `Brand/Logo/*` · `Brand/Color/*` · `Brand/Type/*` · `Brand/Voice/*` · `Brand/Imagery/*` ·
  `Brand/Motion/*` · `Brand/Application/*`.
- A cover/legend + a page index.

## 5. Honesty & accessibility laws (hard)
- **No invented proof** (shared with the website track): no fabricated logos/testimonials/metrics/awards.
- **Contrast is non-negotiable** — every foreground/background pair states its ratio; failing pairs are
  fixed, not shipped.
- **State only true positioning** — claims in voice examples must be defensible, not aspirational fiction.

## 6. If the brand doesn't exist yet
The brand track's job is to **create** it: propose a logo direction, a palette, a type pairing, a voice
— present options, pick the strongest with a one-line rationale, and log the call. Ground proposals in
the strategy (§1) and any references in `BRAND-CONFIG`; never copy a competitor's identity.

## 7. Definition of done → `CHECKLIST.md`.
