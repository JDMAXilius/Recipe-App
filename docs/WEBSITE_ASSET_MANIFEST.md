# 🧾 Website Asset & Doc Manifest — what to carry into the new web repo

> **This is a packing list, not a website.** The Otto website lives in a **separate repo**. This file
> inventories the docs + assets *already in this app repo* that are worth copying over, so the new
> repo starts with the brand foundation and nothing else. Copy **Tier 1** for sure; **Tier 2** if
> useful; skip everything under "Do NOT copy."
>
> Strategy context already written: **`docs/WEBSITE_ARCHITECTURE.md`** (house-of-brands / Bending
> Spoons model). ⚠️ See "Open question" at the bottom — your latest description (Otto as one umbrella
> over 3 meal-plan products) may point at a *branded house* instead; worth settling before building.

---

## The product picture (for whoever builds the site)

**Otto** = the brand. Planned as **3 products**, all meal-plan flavored:
1. **Otto — Recipe & Meal Plans** (the current app; live on TestFlight, v1.0.6)
2. **Otto Lean** — lose-weight meal plans
3. **Otto Bulky** — muscle / bulk / shred meal plans (for people training)

The shared foundation below (design system, mascot, legal templates, voice) is **reusable across all
three** — copy it once. Each product then gets its own hero art, copy, and screenshots.

---

## Tier 1 — MUST copy (the foundation)

### A. Legal (required for App Store submission + every site footer)
| File | What / why |
|---|---|
| `docs/legal/privacy-policy.html` | Ready-to-host, brand-styled. Fill placeholders → this becomes `/privacy`. |
| `docs/legal/terms-of-service.html` | Same → `/terms`. Has the Apple-required EULA clauses + food/nutrition disclaimer. |
| `docs/legal/PRIVACY_POLICY.md` · `TERMS_OF_SERVICE.md` | Editable Markdown sources (keep in sync with the HTML). |

> These are **templates** — reusable for Lean and Bulky by swapping the app name and data map.

### B. Brand & design system (the visual DNA)
| File | What / why |
|---|---|
| `mobile/constants/colors.js` | The exact palette (light theme) — port to web CSS vars / Tailwind theme. |
| `mobile/constants/tokens.js` | Spacing, radius, and the **type scale** (Lora display/title + sans body). |
| `docs/DESIGN_SYSTEM.md` | The written system: color meaning, the "terracotta = interactive / ink = authored" rule, tone. |
| `docs/MASCOT.md` | Otto's character bible — how/where the mascot is used, personality, do/don'ts. |

Font: **Lora** (serif display/headings) — it's a free Google Font, so **reference it, don't copy
binaries**. Body copy uses the system sans stack.

### C. Brand assets (Otto the otter + marks)
| Path | What / why |
|---|---|
| `mobile/assets/splash/otto-splash.webp` | **Animated transparent Otto** (chef, lifting a lid) — perfect for a hero. |
| `mobile/assets/mascot/otto-hero.png` · `otto-hero-alt.png` | High-res hero renders of Otto. |
| `mobile/assets/mascot/otto-scene-*.png` | Scene illustrations (cooking, floating, empty, loading) — section art. |
| `mobile/assets/mascot/otto-*-cut.png` | Transparent cut-outs (happy, proud, excited, thinking, sleepy, sad, floating) — flexible spot art. |
| `mobile/assets/mascot/otto-expressions.png` · `otto-scenes.png` | Sprite sheets — reference for expression range. |
| `mobile/assets/mascot/otto-appicon-a.png` · `-b.png` | App-icon source art. |
| `mobile/assets/images/{icon,favicon,splash-icon}.png` | App icon + favicon (favicon → the site tab). |
| `mobile/assets/onboarding/onboarding-{1-collect,2-cook,3-plan}.png` | **The 3 value-prop illustrations** — these map straight to the site's three "what Otto does" sections. |
| `mobile/assets/food/` (14) · `glyphs/` (4) · `paper/` (3) | Supporting food art, UI glyphs, paper textures (the "cookbook" motif). |

### D. Product story / copy source (what the site says)
| File | What / why |
|---|---|
| `docs/OTTO_PRD.md` | Plain-language product story + roadmap (restaurant analogy) — mine for headlines & feature blurbs. |
| `docs/otto-feature-definition.md` | Canonical feature list — the "Features" section source of truth. |
| `docs/ONBOARDING_BRIEF.md` | The 3 onboarding value props → the hero/benefit sections (pairs with the onboarding art above). |
| `docs/PRE_LAUNCH_CHECKLIST.md` | App Store copy needs, **App Privacy answers**, support-URL requirement — the site must satisfy these. |

### E. Architecture
| File | What / why |
|---|---|
| `docs/WEBSITE_ARCHITECTURE.md` | The house-of-brands decision, Vercel monorepo layout, domains, phased rollout. Start here. |

---

## Tier 2 — Useful reference (copy only if it helps)

| File | Why it might help |
|---|---|
| `docs/OTTO_APP_DESIGN_DOCUMENT.md` | Full technical/app design doc — deep context on how the app works. |
| `docs/DESIGN_RESEARCH.md` · `MOBBIN_COMPARISON.md` | The visual research behind the app's look — informs a consistent site aesthetic. |
| `docs/REDESIGN_NOTES.md` | Decision log (C-numbered) — the "why" behind design calls; good for brand consistency. |
| `docs/SCREEN_MAP.md` | Map of every app screen — helpful for accurate screenshots/feature callouts. |
| `docs/OTTO_V2_ROADMAP.md` | Where the product is going — for a "what's next" / vision section. |
| `docs/OTTO_ANIMATION_PLAN.md` · `SPLASH_BRIEF.md` | Motion language — if the site uses animation, match it here. |

---

## Do NOT copy (stays in the app repo)

- **App source**: `mobile/app/`, `mobile/components/`, `mobile/services/`, `mobile/lib/`, `mobile/hooks/` — RN/Expo code, not web.
- **Backend**: `backend/` — the API; the marketing site is static, no DB.
- **Build/native config**: `eas.json`, `app.json`, `mobile/ios/…`, `node_modules/`, lockfiles.
- **App-ops tickets**: `TERMINAL_HANDOFF.md`, `TERMINAL_TICKET_*`, `SSO_SETUP.md`, `QA.md`, `AUDIT.md` — about shipping *this app*, irrelevant to the site.
- **Prompt/board docs**: `FIGMA_MASTER_BOARD_PROMPT.md`, `*_PROMPT*.md`, `TERMINAL_AGENT_PROMPT.md` — app-build scaffolding.

*(Exception: `docs/legal/`, `docs/WEBSITE_ARCHITECTURE.md`, and the brand assets above obviously DO come over — they're listed in Tier 1.)*

---

## Brand quick-reference (so the web repo has it without opening files)

**Palette (light):**
| Token | Hex | Use |
|---|---|---|
| accent (terracotta) | `#C4562E` | primary / interactive / CTAs |
| accentSoft | `#F3D9CD` | tints, chips |
| secondary (chestnut) | `#8A5A3B` | secondary marks |
| gold | `#E8B04B` | highlights, celebrations |
| bg (cream) | `#FAF4EA` | page background |
| surface | `#FFFFFF` | cards |
| surfaceWarm | `#F3E9DA` | wells, grouped rows |
| ink | `#2A211B` | primary text |
| inkSoft | `#6E6055` | secondary text |
| border | `#E8DECF` | hairlines |
| destructive | `#D64545` | delete/negative |
| splash parchment | `#FBF5E3` | Otto's artwork background |

**Type:** display/headings = **Lora** (700 Bold / 600 SemiBold, serif); body = system sans, ~15–16px.
**Look:** warm, papery "quiet cookbook" — cream backgrounds, terracotta accents, generous space, serif headlines.
**Mascot:** **Otto**, a chef otter. Appears at emotional beats, never crowding.
**Voice / tagline:** *"the quieter kind of cookbook"* — calm, honest, unhyped. No fake numbers or hype.
**Design law that must carry to the site:** honesty — no invented ratings/social proof; nutrition is always framed as an *estimate*.

---

## ⚠️ Open question to settle before building

`docs/WEBSITE_ARCHITECTURE.md` currently assumes a **house of brands** (each app its own brand on its
own domain, a hidden studio parent). Your latest framing — *"the website is Otto, and Otto has 3
apps: Recipe, Lean, Bulky"* — sounds more like a **branded house** (Otto is the umbrella; the three
are Otto sub-products). These lead to different **domains, navigation, and legal entities**:

- **Branded house:** one site `ottosapp.com`, three product pages (`/`, `/lean`, `/bulky`), one brand, shared legal. Simpler, cheaper, apps benefit from each other's trust.
- **House of brands:** three separate branded sites + a thin studio hub. More surface, more isolation.

**Recommendation to capture:** since all three are Otto meal-plan products sharing this exact design
system and mascot, a **branded house under `ottosapp.com`** is the lighter, more coherent fit — the
manifest above (one shared foundation, per-product hero/copy) is built for that. Decide, then update
`WEBSITE_ARCHITECTURE.md` to match.
