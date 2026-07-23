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
app/       expo-router v6 routes (TypeScript): (auth) · (tabs) · recipe/ · shopping ·
           household · journal · otto-club · onboarding · …
src/       feature-first modules — everything the app does lives here
  features/  auth · recipes · cookbook · cook · planner · nutrition · import · chat ·
             household · share · journal · profile · onboarding · notifications
  shared/    theme (tokens + semantic-ink) · ui · supabase client · lib (engine) ·
             haptics · storage · motion
supabase/  Postgres schema as migrations/ + Edge Functions (functions/): import-recipe
           (schema.org JSON-LD, SSRF-guarded) · generate-recipe · resolve-nutrition ·
           content (TheMealDB proxy) · delete-account. RLS is the security boundary.
content    TheMealDB (seed recipes + ingredient lists) + user imports — behind a RecipeSource seam
nutrition  USDA FoodData Central (CC0) — usdaTable.json ships in the app, zero runtime calls
```

Expo SDK 54 · React Native 0.81 · TypeScript · expo-router v6 · TanStack Query ·
Supabase (Auth + Postgres + Edge Functions + Realtime). Native dev build:
`com.otto.recipes`. Tokens via the semantic-ink theme; reanimated core (no layout anims on web).

Deterministic libs do the heavy lifting (no LLM in the cook/scale path): `ingredientParser`
(kitchen-fraction scaling, US↔Metric), `stepEnrich` (durations/temps), `cookSession` (step
splitting + ingredient matching), `stepAction` (Otto art selection), `shoppingList` (summing +
aisles) — under `src/features/*/` and `src/shared/lib`.

## Run it

```bash
# app (web + Expo Go)
npm install && npx expo start                     # :8081

# native iOS dev build (needs the native modules — expo-audio/keep-awake/image-picker)
npx expo run:ios --device "iPhone 17 Pro Max"
```

Server-side logic lives in **Supabase Edge Functions** (`supabase/functions/`) and schema in
`supabase/migrations/` — deployed to the Supabase project, not a separate server.

> **CocoaPods on a stock Mac (no Homebrew, system Ruby 2.6):**
> `gem install --user-install activesupport -v 6.1.7.10 --no-document && gem install --user-install cocoapods --no-document`, then put `$HOME/.gem/ruby/2.6.0/bin` on PATH.
> `ios/` and `android/` are generated (`expo prebuild`) and gitignored. Splash/plugin changes need `expo prebuild -p ios --clean`.

### `.env`

```bash
# .env (root) — publishable client config, safe to expose; RLS is the security boundary
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

`EXPO_PUBLIC_*` vars are inlined at build time — restart Expo after changing them. Server-side
secrets (e.g. the service-role key that completes account deletion) live in Edge Function config,
never in the app bundle.

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

For the **v2 rebuild** the roles shift (cloud = manager + agent fleet, terminal = secrets/device/final eyes): see `docs/REBUILD_WORKFLOW.md`, with `docs/REBUILD_STATE.md` as the shared dashboard.

## Status & founder inputs

Shipped through tickets **P10** (onboarding, splash still+video, social seed) and **B0** in progress (RLS ✅, validation ✅, logging ✅). Waiting on founder to unlock:
- **SSO** — Apple Developer team + Google OAuth client (Supabase providers)
- **Anonymous sign-ins** toggle in Supabase Auth
- **Nutrition validation (B1.5)** — a permissively-licensed reference set (the pipeline itself runs key-free on bundled USDA data)
- **Otto Club IAP** — Apple IAP products + RevenueCat when gating should go live

Recipe content by [TheMealDB](https://www.themealdb.com/api.php). Nutrition from
[USDA FoodData Central](https://fdc.nal.usda.gov) (public domain, CC0). Built with free-tier tools throughout.

**Two sources, one job each:** TheMealDB supplies recipes and ingredient lines; USDA supplies the
per-ingredient nutrition those lines are costed against. TheMealDB carries no nutrition at any tier,
by design — it isn't the nutrition source.
