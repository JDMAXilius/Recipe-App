# 🦦 Mascot — Character Bible

> **Purpose.** The single source of truth for the app's mascot: locked reference assets, personality, expression→app-state mapping, palette, and the exact prompts + technique used to generate every asset — so anyone (human or AI) can extend the character without drift.

**Status:** LOCKED (hero + turnaround + expressions approved)
**Name:** "Otto" (working placeholder — final name TBD)
**Last updated:** 2026-07-14

---

## 1. Who the character is

A small **river otter chef**. Warm, capable, quietly delighted by food. The story hook mirrors real otter behavior: otters carry a favorite rock and crack shellfish on their bellies — our otter **cradles ingredients against its belly** the same way. He is the app's host: greeting on Home, reacting to saves, napping through loads, moping at empty states.

**Personality words:** warm · capable · gently playful · trustworthy.
**Never:** hyperactive, babyish, sarcastic.

## 2. Locked assets (canonical references)

| Asset | Take | Generation job ID | URL |
|---|---|---|---|
| **Hero (canonical reference)** | Candidate B | `5f74831c-0126-44d0-9dd8-731d331fb75a` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_144110_5f74831c-0126-44d0-9dd8-731d331fb75a.png) |
| Alt hero (approved alternate) | Candidate C | `92cf0f1c-0bf3-41d8-99c1-9cb0bbe9f5b8` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_144111_92cf0f1c-0bf3-41d8-99c1-9cb0bbe9f5b8.png) |
| **Turnaround** (front/side/back) | Take 1 | `470c6b41-ee55-4ca8-8bec-6e7a30ded144` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_145709_470c6b41-ee55-4ca8-8bec-6e7a30ded144.png) |
| **Expression sheet** (6 states) | Take 1 | `90bb70d5-2c01-4d16-9cd9-c22cb0ac4c0a` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_145735_90bb70d5-2c01-4d16-9cd9-c22cb0ac4c0a.png) |

> ⚠️ These are CDN URLs from the generation service — **download and commit the PNGs into `mobile/assets/mascot/`** before relying on them long-term (CDN links can expire). Asset filenames: `otto-hero.png`, `otto-turnaround.png`, `otto-expressions.png`.

## 3. Visual definition

- **Species/build:** river otter; round head, chubby body, short limbs, thick tail
- **Fur:** warm chestnut brown; cream muzzle + belly patch
- **Face:** large dark eyes with tiny catchlights, small nose, gentle smile, fine whisker strokes
- **Wardrobe:** slightly oversized **white chef's hat flopped to one side** + small **terracotta apron (#C4562E)** tied with a bow
- **Art style:** hand-painted watercolor/gouache, visible brush texture, gentle hand-drawn linework, warm golden light. Storybook-naturalistic — **not** sticker-kawaii, **not** 3D vinyl
- **Signature trait:** holds ingredients against belly (otter-with-clam gesture)

## 4. Expression → app-state mapping

| Expression (sheet cell) | App usage |
|---|---|
| **Happy** | Home greeting, default presence |
| **Excited** | Recipe saved, success moments |
| **Thinking** | Search before query, suggestions |
| **Sleepy** | Loading states |
| **Sad** | Empty states, soft errors |
| **Proud** (wooden spoon) | Onboarding finale, achievements |

**Usage rules:** the mascot appears in **onboarding, headers (small), empty/loading states, and Profile** — never inside content cards or over food photography. One mascot per screen, max.

## 5. Palette (extracted — feeds the design system)

| Swatch | Hex (approx) | Role |
|---|---|---|
| Chestnut fur | `#8A5A3B` | secondary brand color |
| Cream belly / hat | `#F3E9DA` | surface tint family |
| Terracotta apron | `#C4562E` | **primary brand accent** |
| Warm ink (eyes/lines) | `#2A211B` | text/ink family |
| Golden light | `#E8B04B` | highlight accents |

See [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for the full token set derived from this palette.

## 6. Niche variants (Phase 2 — not yet generated)

Same character, recolored apron + prop, per the constellation strategy:
| App | Apron | Prop |
|---|---|---|
| Lean | teal `#10B3A3` | small green leaf |
| Keto | deep green `#2E8B4E` | halved avocado |
| Bulk | energetic orange `#F5793B` | tiny dumbbell |

## 7. How to generate new assets (the technique)

- **Model:** `nano_banana_pro` (Higgsfield MCP), 2K
- **Always pass the hero as reference:** `medias: [{role:"image", value:"5f74831c-0126-44d0-9dd8-731d331fb75a"}]`
- **Always open the prompt with the lock phrase:** *"…of the exact otter chef character from the reference image. Reproduce the character IDENTICALLY — same face, same proportions, same chestnut-brown fur and cream belly, same floppy white chef's hat, same terracotta apron, same hand-painted watercolor/gouache storybook style. DO NOT redesign, restyle, or simplify."*
- Generate **2 takes** of any multi-panel sheet (grids drift most); keep the tighter one
- **Never name a studio or artist** in prompts — describe qualities instead (watercolor, gouache, storybook, warm golden light)

### 7.1 Master hero prompt (v3, as approved)

```
Character illustration for a warm, cozy recipe app mascot.

CHARACTER: A small, endearing river otter chef. Round head, chubby body, short
limbs, thick tail. Warm chestnut-brown fur, cream muzzle and belly. Bright dark
eyes with tiny light catchlights, small nose, gentle smile, fine whisker strokes.
Wears a slightly oversized white chef's hat that flops to one side, and a small
terracotta apron (#C4562E) tied with a bow.

STYLE: Hand-painted 2D animation art — soft watercolor and gouache washes, visible
brush texture, gentle hand-drawn linework with slight wobble, warm golden daylight,
soft painted shadows. The wholesome, naturalistic storybook warmth of classic
Japanese animated films: cute through roundness and warmth, NOT sticker-kawaii
(no blush circles, no glossy vinyl). Muted-yet-warm natural palette.

SIGNATURE TRAIT: cradles ingredients against its belly the way real otters hold
clams — here, hugging a fresh tomato.

SCENE: standing on a simple warm cream background with a faint painted ground
shadow; a wisp of steam curling from something delicious nearby.

POSE: facing viewer, welcoming, one paw slightly raised.
COMPOSITION: centered, full body, generous margins, no text.

AVOID: 3D render, vinyl toy, cel-shaded flat vector, chibi proportions, blush
stickers, photorealism, neon colors, busy backgrounds, text, watermarks, any
studio's logo or named style.
```

### 7.2 Remaining asset backlog

- [ ] Scene set: cooking at a pot · floating on back holding a dish · napping on a ladle · staring at empty bowl
- [ ] Flat/simplified derivative for small UI (tab icon, favicon, app icon)
- [ ] App icon lockup (face crop on terracotta or cream field)
- [ ] Niche recolors (Phase 2)
