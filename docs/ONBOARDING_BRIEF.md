# 🎬 Onboarding Brief — the 3-screen showcase (build + art)

> Everything the terminal needs to build **B1–B3** (see `SCREEN_MAP.md §B`): the job, real
> copy, per-screen wireframe, and the **art-generation prompts** for the three painted
> illustrations. Follows `SCREEN_DECISION_PROMPT.md` (job → lean → rejection → wireframe → copy)
> and the Otto lock technique in `MASCOT.md §7`.

**Status:** v1 brief (cloud co-pilot). Light-only · Otto is the face · no fake personalization.
**Reference to pass to every art gen:** hero id `5f74831c-0126-44d0-9dd8-731d331fb75a`.

---

## Job (one sentence)
*Teach what Otto is in three swipes — collect → cook → plan — then get out of the way.*
A **trailer, not a quiz.** No questions, no account wall, no "tailored just for you."

## Why showcase, not quiz (the decision)
A quiz only earns its friction if the answers change the next screen. On a single recipe pool they
don't — "pick 3" personalizes nothing we can compute, and units is one setting we ask once in
Account. So the three swipes go to **teaching the differentiators** (import, cook mode, plan)
instead of harvesting dead data. Matches the Kitchen Stories feature-carousel the founder shared.

## Rejection list (required — what we deliberately cut)
- ❌ **Taste quiz / "pick 3 you like"** — seeds no real personalization; if we ever want it, it belongs *inside* an empty Cookbook where the taps produce a visible shelf, not on a marketing screen.
- ❌ **"Tailored just for you" copy** (Kitchen Stories' words) — implies an ML recommender we don't have. Honesty clause.
- ❌ **Account/sign-in screen inside onboarding** — account is a cloakroom, asked only on first save. Onboarding ends in Discover, anonymous.
- ❌ **"My photos"/Instagram screen** — not built; would over-promise. (See `SCREEN_MAP` traceability.)
- ❌ **A 4th "nutrition" screen** — nutrition is a supporting detail folded into B2, not a headline.
- ❌ **Animated video per screen in v1** — static painted stills ship now; motion is a fast-follow (fork B, prior turn).

## Shared chrome (all 3 screens)
Painted Otto illustration (top ~⅔) · headline (Lora display) · one-line subhead (system) ·
3 progress dots · primary button · **Skip** (top-right, quiet). Swipeable. Tokens only
(`cream` bg, `terracotta` CTA, `ink` text). Respect reduced-motion on the dot/slide transitions.

---

## B1 · "Every recipe you love — in one place"
- **Subhead:** "Import from any site or video, or write your own — Otto keeps them all together."
- **Bundles:** Import · Create · Share
- **Button:** Continue

```
┌──────────────────────────────┐
│                    Skip →     │
│      [ painted illustration ] │  Otto at a table, ribbons of
│      link · 📷 · ▶  ⇢  📖     │  recipes (a web link, a photo,
│                               │  a video) flowing into one
│                               │  open cookbook he hugs
├──────────────────────────────┤
│  Every recipe you love —      │  Lora, 2 lines
│  in one place                 │
│  Import from any site or      │  subhead
│  video, or write your own.    │
│  ● ○ ○                        │
│  [        Continue        ]   │  terracotta
└──────────────────────────────┘
```

**🎨 Art prompt (B1):**
```
[LOCK PHRASE — MASCOT.md §7: "…of the exact otter chef character from the reference
image. Reproduce the character IDENTICALLY — same face, same proportions, same
chestnut-brown fur and cream belly, same floppy white chef's hat, same terracotta
apron, same hand-painted watercolor/gouache storybook style. DO NOT redesign, restyle,
or simplify."]

SCENE: Otto sitting at a warm wooden kitchen table, gently gathering several recipes
toward one open cookbook hugged against his belly (his signature clam-hold). The
incoming recipes are painted as soft floating cards — one a website page, one a phone
photo of a dish, one a little video frame — drifting in on painted ribbons of steam
toward the book. Warm golden light, faint painted ground shadow, cream background.
MOOD: welcoming, capable, "everything in one place."
COMPOSITION: vertical, Otto lower-center, cards arcing in from upper corners, generous
top margin and clear lower third left calm for text. No text in the image.
AVOID: 3D render, vinyl toy, flat vector, neon, busy background, logos, UI chrome, words.
```

## B2 · "Cook it right, every time"
- **Subhead:** "Step-by-step cook mode, serving sizes that scale, and a nutrition estimate for every dish."
- **Bundles:** Cook Mode · Nutrition (estimate) · serving scaling
- **Button:** Continue

```
┌──────────────────────────────┐
│                    Skip →     │
│      [ painted illustration ] │  Otto tasting from a pot; a
│    ①──②──③   (− 3 +)          │  big numbered step ribbon +
│                               │  a serving stepper motif
├──────────────────────────────┤
│  Cook it right, every time    │
│  Step-by-step cook mode,      │
│  sizes that scale, and a      │
│  nutrition estimate for       │
│  every dish.                  │
│  ○ ● ○                        │
│  [        Continue        ]   │
└──────────────────────────────┘
```
⭑ Honesty: the nutrition motif reads "estimate" — no daily-goal rings, no precise macro promise.

**🎨 Art prompt (B2):**
```
[LOCK PHRASE — as above]

SCENE: Otto mid-cook, standing on a stool at the stove, tasting from a wooden spoon
over a gently steaming pot, eyes happy. Around him, painted as soft storybook props
(not UI): a ribbon of big hand-numbered steps 1-2-3 curving beside him, and a little
"serves 3" motif with a plus/minus. Warm golden kitchen light, cream background,
painted shadow.
MOOD: confident, unhurried, "you've got this."
COMPOSITION: vertical, Otto center, step ribbon along one side, lower third calm for
text. No real UI, no text in the image.
AVOID: 3D render, vinyl toy, flat vector, neon, busy background, logos, screenshots, words.
```

## B3 · "Plan the week, shop in one tap" 🟣
- **Subhead:** "Plan your meals and Otto builds the shopping list for you."
- **Bundles:** Meal Plan · Shopping list (membership)
- **Button:** **Start cooking** (last screen → Discover)

```
┌──────────────────────────────┐
│                    Skip →     │
│      [ painted illustration ] │  Otto with a 7-day week board
│    M T W T F S S              │  turning into a checkable
│    ☑ ☑ ☐  grocery basket      │  grocery list / basket
├──────────────────────────────┤
│  Plan the week,               │
│  shop in one tap              │
│  Plan your meals and Otto     │
│  builds the shopping list.    │
│  ○ ○ ●                        │
│  [      Start cooking     ]   │
└──────────────────────────────┘
```
⭑ **Membership-dependent.** If Plan is NOT in the launch build, delete B3 → **2-screen**
onboarding (B1 → B2, dots become 2, B2's button becomes "Start cooking"). Add B3 back when Plan ships.

**🎨 Art prompt (B3):**
```
[LOCK PHRASE — as above]

SCENE: Otto beside a painted seven-day week board (days as little food thumbnails
pinned across the week), one paw gesturing as the week's ingredients gather into a
woven market basket with a small checklist tag. Warm golden light, cream background,
painted shadow.
MOOD: organized, generous, "Otto's got the list."
COMPOSITION: vertical, Otto to one side, week board and basket balanced across, lower
third calm for text. No real UI, no text in the image.
AVOID: 3D render, vinyl toy, flat vector, neon, busy background, logos, screenshots, words.
```

---

## Generation notes (technique)
- **Model:** `nano_banana_pro` (Higgsfield MCP), 2K, vertical (portrait) aspect for phone.
- **Always pass the hero** as reference image: `5f74831c-0126-44d0-9dd8-731d331fb75a`.
- Generate **2 takes** per screen; keep the one closest to the hero (grids/scenes drift).
- Keep the **lower third visually calm** in every image so headline + button sit on clean space (or plan to place them on a solid cream band below the art).
- Never name a studio/artist — describe qualities (watercolor, gouache, storybook, golden light).
- ⚠️ **CDN egress:** generated PNGs come from the blocked cloudfront CDN — this session can't download them. Generate + review in the **terminal**, then commit to `mobile/assets/onboarding/` (mirror the `mobile/assets/mascot/README.md` manifest pattern).

## Copy (final strings, real)
| Screen | Headline | Subhead | Button |
|---|---|---|---|
| B1 | Every recipe you love — in one place | Import from any site or video, or write your own — Otto keeps them all together. | Continue |
| B2 | Cook it right, every time | Step-by-step cook mode, serving sizes that scale, and a nutrition estimate for every dish. | Continue |
| B3 | Plan the week, shop in one tap | Plan your meals and Otto builds the shopping list for you. | Start cooking |
| Skip (all) | — | — | Skip |

*End — onboarding brief. Pairs with `SPLASH_BRIEF.md` (the screen right before this).*
