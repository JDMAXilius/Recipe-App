<h1 align="center">🦦 Otto — the quieter kind of cookbook</h1>

<p align="center">
A warm, hand-painted recipe app led by <b>Otto the otter chef</b>.<br/>
750+ honest recipes, a place for yours, and nobody shouting five stars at you.
</p>

---

## What Otto does today

**Discover & cook**
- Browse and search 750+ seed recipes (TheMealDB) with painted category tiles and an "Otto's pick" hero
- Recipe detail v3: photo-only hero, serif title on cream, source attribution, computed meta (servings · ingredients · steps), live ingredient scaling with US/Metric conversion, inline video, semantic-ink method steps, nutrition estimate card, related-recipes exit
- **Cook mode**: mise-en-place → big-type steps with hand-painted Otto action art (chop/mix/sauté/simmer/bake/wait/season/pour/serve), tappable durations that start named timers, multi-timer hub, swipe navigation, exit protection, Proud-Otto finish with "Snap your plate" journal capture

**Your cookbook**
- Save any recipe with the **paw mark** (Otto's signature)
- **Import from any recipe site** — paste a URL, Otto reads the ingredients and steps (deterministic schema.org parsing, no AI), you review, it's on the shelf with the source credited forever
- **Write your own** recipes in the same editor; edit and delete freely
- Cookbook tab with All · Saved · My recipes segments and a Cooked filter

**Plan & shop**
- **Otto's week**: loose 7-day planner (no meal-slot guilt), add from any recipe or from the plan, cooked check-offs, "What's cooking tonight?" surfaced on Discover
- **Shopping list** built from the week on demand: one row per ingredient with summed quantities, aisle sections, provenance ("for World's Best Lasagna"), check-offs that never reorder mid-store, your own extras

**The rest**
- 3-screen painted onboarding (no quiz, no account wall) → anonymous browsing*, account asked at first save
- Splash: hand-painted still + 3s animated lid-lift video (tap-skip, reduced-motion aware)
- "You" tab: earned stats (cooked/saved/yours — each a door), private cooking journal, inline US/Metric, quiet sign-out, visible account deletion
- **Otto Club** membership surface (timeline paywall, honest pricing math) — frontend complete, purchases "open soon" until IAP lands

*Anonymous entry requires enabling **Anonymous sign-ins** in Supabase Auth.

## Design system

Light-only, token-pure. Terracotta `#C4562E` accent, cream paper surfaces, Lora serif display, warm ink. Semantic ink rule: **terracotta = computed/interactive, ink = authored**. Otto appears at emotional beats; the paw is the save mark everywhere. Honesty law: **no fabricated data** — no fake ratings, times, or precision the source doesn't have.

- `docs/DESIGN_SYSTEM.md` (Part B authoritative) · `docs/MASCOT.md` · `docs/SCREEN_MAP.md`
- Figma DS file: `X1eGT54CTwtowHNve30vvE` (includes the shipped v2/v3 wireframe pages)
- Every design decision is Mobbin-grounded and logged in `docs/REDESIGN_NOTES.md`

## Architecture

```
mobile/    Expo SDK 54 · React Native 0.81 · expo-router v6 · JS/JSX only
           tokens via useTheme() · reanimated core (no layout anims on web)
           native dev build: com.otto.recipes (expo-dev-client)
backend/   Express + Drizzle ORM + Supabase Postgres · Supabase Auth (JWT verify)
           tables: favorites · recipes (user imports/creations) · plan_entries
                   recipe_shares · list_shares · collab_lists · collab_items · seed_nutrition
           deterministic /api/import (schema.org JSON-LD, SSRF-guarded)
           RLS enabled · zod validation · rate limits · structured logging
content    TheMealDB (seed recipes) + user imports — behind a RecipeSource seam
```

Deterministic client libs do the heavy lifting (no LLM in the loop): `ingredientParser` (kitchen-fraction scaling, US↔Metric), `stepEnrich` (durations/temps), `cookSession` (step splitting + ingredient matching), `stepAction` (Otto art selection), `shoppingList` (summing + aisles).

## Run it

```bash
# backend
cd backend && npm install && npm run dev          # :5001

# app (web + Expo Go)
cd mobile && npm install && npx expo start        # :8081

# native iOS dev build (first time; see note below)
cd mobile && npx expo run:ios --device "iPhone 17 Pro Max"
```

> **CocoaPods on a stock Mac (no Homebrew, system Ruby 2.6):**
> `gem install --user-install activesupport -v 6.1.7.10 --no-document && gem install --user-install cocoapods --no-document`, then put `$HOME/.gem/ruby/2.6.0/bin` on PATH.
> `ios/` and `android/` are generated (`expo prebuild`) and gitignored. Splash/plugin changes need `expo prebuild -p ios --clean`.

### `.env`

```bash
# backend/.env
PORT=5001
DATABASE_URL=...            # Supabase (aws-0-us-east-1.pooler)
SUPABASE_URL=...            # same project as the app — token verification
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # completes account deletion (set in prod)

# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:5001/api   # LAN IP for devices
```

`EXPO_PUBLIC_*` vars are inlined at build time — restart Expo after changing them.

## Docs map

| Doc | What it holds |
|---|---|
| `docs/REDESIGN_NOTES.md` | The decision log — every call, with rationale (A1…C17, P-, B-series) |
| `docs/OTTO_V2_ROADMAP.md` | Evidence-based roadmap + founder decision dials |
| `docs/SCREEN_MAP.md` | All ~30 screens with per-screen content breakdown |
| `docs/MOBBIN_COMPARISON.md` + `MOBBIN_GAPS_*.md` | The research library |
| `docs/BACKEND_ROADMAP.md` + `TERMINAL_TICKET_*.md` | Backend spine + active build tickets |
| `docs/ONBOARDING_BRIEF.md` / `SPLASH_BRIEF.md` | Shipped onboarding + splash specs |
| `docs/QA.md` | Adversarial QA passes and dispositions |

## Workflow

Two Claude sessions collaborate on `main`: a **cloud co-pilot** (research, specs, tickets) and a **terminal lead** (code, assets, Figma writes, verification on Chrome + iOS simulator). Always `git pull --rebase` before pushing. The terminal's operating mode lives in `.claude/skills/otto-lead/` — invoke `/otto-lead`.

## Status & founder inputs

Shipped through tickets **P10** (onboarding, splash still+video, social seed) and **B0** in progress (RLS ✅, validation ✅, logging ✅). Waiting on founder to unlock:
- **SSO** — Apple Developer team + Google OAuth client (Supabase providers)
- **Anonymous sign-ins** toggle in Supabase Auth
- **Nutrition validation (B1.5)** — Spoonacular test key (the pipeline itself runs key-free on bundled USDA data)
- **Otto Club IAP** — Apple IAP products + RevenueCat when gating should go live

Recipe content by [TheMealDB](https://www.themealdb.com/api.php). Built with free-tier tools throughout.
