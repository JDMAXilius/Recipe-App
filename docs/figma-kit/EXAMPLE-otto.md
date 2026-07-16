# 📎 EXAMPLE — APP-CONFIG filled for "Otto" (the recipe app)

> A completed `APP-CONFIG.md` for the Otto app, as a reference for filling the template. This is the
> input that produced the Otto master board. Trim/point paths to your own repo when adapting.

---

## 1. Identity
- **App name:** Otto
- **One-liner:** A warm recipe app — import/create recipes, cook with honest nutrition, plan the week.
- **Platform:** iOS (React Native / Expo)
- **Device frame width:** 393
- **Niche:** Recipes / cooking

## 2. Source of truth
- **Color tokens:** `mobile/constants/colors.js`
- **Non-color tokens:** `mobile/constants/tokens.js`
- **Screen map / IA doc:** `docs/SCREEN_MAP.md`
- **Components dir:** `mobile/components/`
- **Assets dir:** `mobile/assets/` (`mascot/`, `food/`, `actions/`, `onboarding/`, `splash/`)

## 3. Foundations
- **Color tokens:** accent `#C4562E` (terracotta — CTAs/active/computed ink) · accentSoft `#F3D9CD` ·
  secondary `#8A5A3B` (chestnut) · gold `#E8B04B` · bg `#FAF4EA` · surface `#FFFFFF` · surfaceWarm
  `#F3E9DA` · ink `#2A211B` · inkSoft `#6E6055` · border `#E8DECF` · gray `#B9A895` · destructive
  `#D64545`. **Fixed nutrition (never re-skin):** protein `#3B82F6` · carbs `#F0A020` · fat `#8B5CF6`.
- **Type scale:** display Lora700 30/34 · title Lora600 22/26 · body System 15/22 · label System600 13 ·
  caption System500 12 +0.5 UPPER tabular · step System 24/32.
- **Spacing:** 4·8·12·16·24·32. **Radius:** card 20 · sheet 24 · button 14 · pill 999 · mascot 24.
- **Overlay:** scrim `rgba(42,33,27,.35)` · scrimStrong `.65` · textShadow `.45` (warm ink, never black).
- **Motion:** springs gentle/snappy/pop(the paw-pop signature)/sheet; timing sweep 500 / fade 200.
- **Theming:** **light-only** (ThemeContext locked); board renders base/light exclusively.

## 4. Brand & voice
- **Wordmark:** "Otto" in Lora; lockups on cream + on black; badge = circle-crop bust.
- **Voice:** warm · capable · gently playful · trustworthy. Never hyperactive/babyish/sarcastic.
- **Honesty laws:** nutrition is always an **estimate** (never a daily-goal contract); **no fake
  ratings/counts** (ratings only on real UGC, cook-then-rate); no personalization we can't compute.
- **Broken conventions:** no ratings/social-proof on seed content; cutout mascot not stock photos;
  food photography rules (Otto never over a photo).

## 5. Mascot
- **Character:** Otto — a hand-painted river-otter chef (watercolor/gouache storybook style).
- **Bible path:** `docs/MASCOT.md` (hero ref id `5f74831c-…`).
- **State map:** Happy=home greeting · Excited=first-save (once) · Thinking=search-empty ·
  Sleepy=cold-start loading · Sad=empty/offline · Proud=cook-finish/onboarding finale.
- **Placement:** onboarding, headers (small badge), empty/loading/celebration, Account — never over
  food photos or crowding dense content; one Otto per screen.

## 6. Information architecture
- **Nav model:** 5-tab bar. **Tabs:** Discover · Cookbook · ＋ Add (center) · Plan · Account.
- **Gating:** all premium features shipped **ungated** at launch (Plan/shopping included).

## 7. Screen inventory (abbrev — full detail in `docs/SCREEN_MAP.md`)
- **Launch/Auth:** Splash · Onboarding B1/B2/B3 · Sign up (Apple/Google/Facebook) · Sign in
- **Discover:** Home · Search-active · Filter sheet · By-ingredient *(placeholder)*
- **Recipe:** Detail · Mise-en-place · Cook mode
- **Add/Create:** Add sheet · Import-URL review · Scan-photo review *(placeholder)* · Video-IG review
  *(placeholder)* · Manual editor · Edit recipe
- **Cookbook:** Home (Saved · My recipes) · Empty
- **Plan:** Planner · Shopping list · Journal
- **Account:** You · Otto Club paywall · Connected accounts *(placeholder)* · Confirm dialog
- **Supporting:** Celebration · Error/offline · Generic empty · Search-empty · Loading
- **Future *(placeholders)*:** Ask Otto · Collections · Membership-subscribed · Notifications-ask

## 8. Core features → screens
Import→(Add/Import-URL,Video-IG) · Create→(Manual editor,Edit) · Cook→(Cook mode,Mise-en-place) ·
Nutrition→(Recipe detail NutritionCard) · Plan→(Planner) · Shopping→(Shopping list) · Save→(Cookbook) ·
Membership→(Otto Club).

## 9. Flows to diagram
- First run → first save → account
- Import → review → cook → celebrate
- Plan the week → shopping list → tonight

## 10. Pages to build
All 6: Design System · App Map+Wireframes+Screens · User Flows · App Store Kit · Brand & Voice ·
Strategy Review.

## 11. Figma target
- New file `Otto — Master Board` (built; file key `mM0uWkHod9rL1Ff1VJ64Au`).
- Existing library to reuse: the Otto Design-System file if present.
