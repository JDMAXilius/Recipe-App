# 🌐 Altavida — Brand & Website (Figma master board)

Altavida-specific instance of `reusable-website-branding/`. Two build paths — pick one (or run A then
refine): the deep methodology + checklists live in the kit; these docs are Altavida's concrete inputs.

## Two paths
| Path | Use when | Prompt | Fills |
|---|---|---|---|
| **A · From HTML (mirror current)** | You have the real Altavida design — you're providing the **Claude-design HTML** (design system + full website) | `FIGMA_MASTER_BOARD_PROMPT--from-html.md` | Extracts real tokens/components/pages/copy → populates `BRAND-CONFIG.md` + `SITE-MAP.md` → builds the board **1:1 with your HTML** |
| **B · Greenfield (invented)** | No brand yet / you want a fresh proposal | `FIGMA_MASTER_BOARD_PROMPT--greenfield.md` | Proposes identity (logo direction/palette/type/voice) for approval → builds the board |

Both produce the same **6-page master board** (Brand Foundations · Web Design System · Site Map +
Wireframes + full-length responsive Pages · Applications · Guidelines · Strategy) — see
`../reusable-website-branding/FIGMA_MASTER_BOARD_PROMPT.md` for the shared page anatomy.

## Files
```
altavida/
  README.md                                 ← this file
  source-html/                              ← ⬇ DROP YOUR CLAUDE-DESIGN HTML HERE (Path A)
    README.md
  BRAND-CONFIG.md                           ← Altavida identity (populated from HTML or proposal)
  SITE-MAP.md                               ← Altavida pages/sections (populated from full-site HTML)
  FIGMA_MASTER_BOARD_PROMPT--from-html.md   ← Path A: extract + mirror
  FIGMA_MASTER_BOARD_PROMPT--greenfield.md  ← Path B: propose + build
```

## How to run
### Path A — from your HTML
1. Put the HTML in `source-html/` (see its README — a `design-system.html` + the site pages).
2. Run `FIGMA_MASTER_BOARD_PROMPT--from-html.md` in a **Figma-write-authorized session** (the terminal).
   It extracts the design system + site map, fills `BRAND-CONFIG.md` + `SITE-MAP.md`, and builds the board.
   *(I can also do the extraction here in chat the moment you paste/commit the HTML — I just can't write
   the Figma file from this cloud session.)*
### Path B — greenfield
1. Give the positioning basics (or let the prompt propose). Run `FIGMA_MASTER_BOARD_PROMPT--greenfield.md`.

## Honesty (same law as the kit)
Path A **mirrors your real HTML** — everything traces to the source; nothing invented. Path B clearly
**labels proposals** as proposals. Neither fabricates testimonials/logos/stats/clients — real content
or labeled placeholders only. QA against `../reusable-website-branding/brand/CHECKLIST.md` +
`website/CHECKLIST.md`.

> Constraint: Figma **writes** need an authorized/interactive session (the terminal builds the file and
> returns the link) — this cloud session authors specs + can extract from HTML, but can't approve Figma writes.
