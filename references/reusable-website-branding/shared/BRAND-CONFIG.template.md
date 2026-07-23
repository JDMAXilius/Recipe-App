# 🎨 shared/BRAND-CONFIG (template) — the brand identity (both tracks read this)

> Copy to `BRAND-CONFIG.md` and fill every `{{…}}`. If the brand doesn't exist yet, the **brand track
> creates it** — fill what you know, leave the rest for the brand agent to propose (you approve via
> git). Pair with `SITE-MAP.md`. See `../EXAMPLE-altavida.md`.

## 1. Positioning (the strategy the identity expresses)
- **Brand / site name:** {{BRAND_NAME}}
- **One-liner:** {{TAGLINE}}  *(what you do + for whom, in one sentence)*
- **What we do / offer:** {{OFFERING}}
- **Audience:** {{AUDIENCE}}  *(who it's for; their goal/pain)*
- **Positioning / differentiator:** {{POSITIONING}}  *(why us, not the alternative)*
- **Personality (3–5 adjectives):** {{PERSONALITY}}
- **Competitors / brand landscape to differentiate from:** {{COMPETITORS}}

## 2. Logo & marks
- **Primary logo / wordmark:** {{LOGO}}  *(file path, or "to be designed")*
- **Symbol / monogram / favicon:** {{MARK}}
- **Clear space · min size · misuse rules:** {{LOGO_RULES}}
- **On-light / on-dark lockups:** {{LOGO_VARIANTS}}

## 3. Design tokens
- **Color** (name · hex · role; include neutrals + semantic success/warn/error; note **AA contrast**
  pairs): {{COLORS}}
- **Type** (display/heading/body/mono · web font + fallback · scale): {{TYPE}}
- **Spacing / layout grid** (scale + column grid + max content width): {{SPACING_GRID}}
- **Radius / elevation / borders:** {{SHAPE}}
- **Motion** (brand motion principles — easing, duration, "feel"): {{MOTION}}

## 4. Voice & tone
- **Voice principles + do/don't:** {{VOICE}}
- **Sample copy** (a headline, a subhead, a CTA, an error — in-voice): {{VOICE_SAMPLES}}
- **Reading level / formality:** {{TONE}}

## 5. Imagery & art direction
- **Photography style:** {{PHOTO}}  *(mood, color grade, subjects, do/don't)*
- **Illustration / iconography:** {{ILLUSTRATION}}
- **Patterns / textures / graphic devices:** {{GRAPHICS}}
- **Mascot / character (or "none"):** {{MASCOT}}

## 6. Applications (brand in the wild)
- Favicon · OG/social share image · social templates · email header · business collateral: {{APPLICATIONS}}

## 7. Honesty constraints (the shared law — both tracks obey)
- **No invented proof:** no fabricated client logos, testimonials, reviews, metrics, awards, certs,
  team, or partners. Real content or a **labeled placeholder** only.
- Any additional claims that must NOT appear unverified: {{CLAIM_LIMITS}}

## 8. Source of truth (repo paths — the boards mirror these)
- **Brand assets dir:** {{PATH_ASSETS}} · **Token/CSS/theme file (if coded):** {{PATH_TOKENS}}
- **Content / copy source (CMS, brief, doc):** {{PATH_CONTENT}}
- **Site map doc:** `shared/SITE-MAP.md`

## 9. Deliverables to build
- **Brand pages:** {{BRAND_PAGES}}  *(default: Foundations + Guidelines + Applications)*
- **Website pages:** {{SITE_PAGES}}  *(default: all in SITE-MAP)*
- **Breakpoints:** {{BREAKPOINTS}}  *(default desktop 1440 · mobile 375; tablet 768 where it changes)*
- **Figma target:** new file `{{BRAND_NAME}} — Brand & Website` or file key {{FILE_KEY}}.
