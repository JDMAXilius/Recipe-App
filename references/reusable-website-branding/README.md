# 🎨 Reusable Website-Branding Kit — brand + site for any project

> **Portable:** copy this whole `reusable-website-branding/` folder into any repo (e.g. the Altavida
> site) and follow the 3 steps. It's the website/branding sibling of `reusable-app/` — same
> "two-tracks-meeting-at-a-seam" idea, retargeted from *app screens + data* to **brand identity +
> marketing website**.

## The core idea: two tracks, one brand system
```
                    ┌────────────────────────────────┐
                    │  shared/ (both tracks read)      │
                    │  • BRAND-CONFIG  (identity,      │
                    │    positioning, tokens, voice)   │
                    │  • SITE-MAP      (pages,         │
                    │    sections, SEO, CTAs)          │  ← the seam
                    └───────────┬──────────────────────┘
              ┌─────────────────┴──────────────────┐
     ┌────────▼─────────┐                  ┌────────▼─────────┐
     │   brand/         │  ── website ──▶  │   website/       │
     │  identity system │   applies the    │  design system + │
     │  + guidelines    │   brand system   │  responsive pages│
     └──────────────────┘                  └──────────────────┘
```
**Brand comes first; the website applies it.** The *brand track* formalizes the identity (logo,
color, type, voice, imagery, applications) and ships a **brand guidelines** deliverable. The *website
track* builds the responsive site design system + a full-length page master board **on top of** the
brand system. The two meet at `shared/` — never at each other's internals.

## Folder map
```
reusable-website-branding/
  README.md                    ← this file
  TERMINAL-AGENT-PROMPT.md     ← autonomous full-auto build lead (brand + site)
  EXAMPLE-altavida.md          ← a starter config skeleton for the Altavida site (fill from the brief)
  shared/
    BRAND-CONFIG.template.md   ← name · positioning · audience · tokens · voice · imagery · applications
    SITE-MAP.template.md       ← every page · sections/blocks · SEO/meta · primary CTA · content source
  brand/
    CONTEXT.md                 ← the brand-identity methodology (what a brand system is)
    MASTER-PROMPT.md           ← build the identity system + guidelines
    CHECKLIST.md
  website/
    CONTEXT.md                 ← the website design-system + master-board methodology (responsive, full-length)
    MASTER-PROMPT.md           ← build the website Figma master board
    CHECKLIST.md
```

## How to use it (per site)
1. **Fill `shared/BRAND-CONFIG.md`** — identity, positioning, audience, tokens, voice, imagery. *If the
   brand doesn't exist yet, the brand track's job is to create it — fill what you know, leave the rest
   for the brand agent to propose (and you approve via git).*
2. **Fill `shared/SITE-MAP.md`** — the pages, their sections, SEO, and primary CTA.
3. **Run the tracks** — brand first (it produces the system the site consumes), then website:
   - Brand: hand `brand/MASTER-PROMPT.md` + the shared files to a Figma-capable agent → identity + guidelines.
   - Website: hand `website/MASTER-PROMPT.md` + the shared files → the responsive page master board.
   - Or run the whole thing autonomously with `TERMINAL-AGENT-PROMPT.md`.
4. **QA** each track against its `CHECKLIST.md`. Re-run to keep the board 1:1 as the brand/site evolve.

## Why the separation "gets better results"
- **Brand can't drift** — every page pulls from one brand system; change a token once, the site follows.
- **The site can't outrun the brand** — no page invents a color/voice the brand didn't define.
- **Focused context** — a brand agent thinks identity; a website agent thinks layout/conversion/responsive.
- **Honest by construction** — one honesty law across both: **no invented proof** (no fake client logos,
  testimonials, case-study metrics, awards, or team) — real content or labeled placeholders only.
