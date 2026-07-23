<h1 align="center">🦦 Otto — the quieter kind of cookbook</h1>

<p align="center">
A warm, hand-painted recipe app led by <b>Otto the otter chef</b>.<br/>
750+ honest recipes, a place for yours, and nobody shouting five stars at you.
</p>

---

## What Otto does today

**Discover & cook**
- Browse and search 750+ seed recipes (TheMealDB) with painted category tiles and an "Otto's pick" hero
- Recipe detail: photo-only hero, serif title on cream, source attribution, computed meta (servings · ingredients · steps), live ingredient scaling with US/Metric conversion, inline video, semantic-ink method steps, nutrition estimate card, related-recipes exit
- **Cook mode**: mise-en-place → big-type steps with hand-painted Otto action art (chop/mix/sauté/simmer/bake/wait/season/pour/serve), tappable durations that start named timers, a multi-timer hub, alarm sound + vibration, keep-awake, swipe navigation, exit protection, and a Proud-Otto finish with "Snap your plate" journal capture

**Your cookbook**
- Save any recipe with the **paw mark** (Otto's signature)
- **Import from any recipe site** — paste a URL, Otto reads the ingredients and steps (deterministic schema.org parsing, no AI), you review, it's on the shelf with the source credited forever
- **Ask Otto** — chat with Otto to generate a recipe, or snap a photo of one; **write your own** in the same editor; edit and delete freely
- Cookbook tab with All · Saved · My recipes segments and a Cooked filter

**Plan & shop**
- **Otto's week**: a loose 7-day planner (no meal-slot guilt), add from any recipe or from the plan, cooked check-offs, "What's cooking tonight?" surfaced on Discover
- **Shopping list** built from the week on demand: one row per ingredient with summed quantities, aisle sections, provenance ("for World's Best Lasagna"), check-offs that never reorder mid-store, your own extras
- **Shared kitchen**: start a household or join one with an invite code — everyone adds to and checks off the **same list in real time**

**The rest**
- 3-screen painted onboarding + splash (still image + animated lid-lift, reduced-motion aware)
- "You" tab: earned stats (cooked/saved/yours — each a door), a private cooking journal, inline US/Metric, editable name + avatar, quiet sign-out, visible account deletion
- **Otto Club** membership surface (honest pricing math) — frontend complete, purchases "open soon" until IAP lands

## Tech stack

**Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · expo-router v6 · TanStack Query v5 · zod v4 · Supabase (Auth + Postgres + Edge Functions + Realtime) · Lora (serif).**
No custom server — server-side logic runs as Supabase Edge Functions. RLS is the security boundary.

## Project structure

```
Recipe-App/
├── app/                    expo-router routes (file-based; a file = a screen)
│   ├── _layout.tsx           root: GestureHandler → ErrorBoundary → SafeArea →
│   │                         QueryClientProvider → AuthProvider → <Stack> (+ ToastHost, NotifSync)
│   ├── index.tsx             launch gate → onboarding / sign-in / tabs (resolveRoute)
│   ├── (auth)/               sign-in · sign-up · forgot-password (+ redirect guard)
│   ├── (tabs)/               Discover (index) · Cookbook · raised ＋ (create/chat) · Plan · Account
│   ├── recipe/[id].tsx       recipe detail
│   ├── recipe/cook/[id].tsx  Cook mode
│   ├── recipe/edit.tsx       recipe editor (write/edit your own)
│   ├── add.tsx               Add sheet (URL / paste / photo import)
│   ├── shopping.tsx          shopping list
│   ├── household.tsx         shared kitchen (create/join by code)
│   ├── journal.tsx           cooking journal
│   ├── otto-club.tsx         membership / paywall surface
│   ├── chats.tsx             recent Ask-Otto chats
│   └── onboarding · notifications · preferences · faq · auth/callback · *-password
│
├── src/
│   ├── features/           feature-first modules — each owns its screens, components,
│   │                       *.queries.ts (TanStack Query), pure logic (*.ts) + tests (*.test.mjs)
│   │   ├── auth/             session (AuthProvider), sign in/up, password reset,
│   │   │                     OAuth (Apple/Google/Facebook), social + username helpers
│   │   ├── recipes/          Discover, recipe detail, cards, filters, video embed,
│   │   │                     TheMealDB→recipe transform, ingredient scaling
│   │   ├── cookbook/         saved + "my recipes" with segments (All · Saved · Mine)
│   │   ├── cook/             Cook mode + engines: session (step split/match),
│   │   │                     stepEnrich (timers/temps), stepAction (which Otto art)
│   │   ├── nutrition/        the on-device nutrition engine (see below) +
│   │   │                     NutritionCard / CalorieRing + category estimates
│   │   ├── planner/          Otto's week + shopping list; week + shoppingList engines
│   │   ├── household/        shared kitchen: queries + realtime hooks (useHousehold)
│   │   ├── import/           Add sheet (URL/paste/photo) + recipe editor + draft hand-off
│   │   ├── chat/             "Ask Otto" chat → recipe generation
│   │   ├── share/            share cards + capability share links (recipe / list) + tokens
│   │   ├── journal/          private "snap your plate" cooking journal
│   │   ├── notifications/    reminder sync (NotifSync) + notification preferences
│   │   ├── profile/          Account, Preferences, Household screen, Otto Club, FAQ
│   │   └── onboarding/       carousel + splash + the onboarding/route gate
│   │
│   ├── shared/             cross-feature primitives
│   │   ├── theme/            design tokens + semantic-ink (terracotta = computed/interactive)
│   │   ├── ui/               shared components (Screen, buttons, mascot states, toast…)
│   │   ├── supabase/         the Supabase JS client
│   │   ├── lib/              fdaCalories (21 CFR 101.9 rounding), format helpers
│   │   ├── haptics.ts        haptic feedback wrapper
│   │   ├── storage.ts        AsyncStorage key-value store
│   │   ├── imagePicker.ts    camera / photo picker
│   │   ├── bus.ts            Otto event bus (mascot reacts to app events)
│   │   ├── assets.ts         asset registry (mascot/action/food art)
│   │   └── motion.ts         reanimated helpers (no layout anims on web)
│   │
│   └── types/database.ts   generated Supabase types (regenerate after each migration)
│
├── supabase/
│   ├── functions/          Edge Functions = the "backend" (Deno, deployed to Supabase)
│   │   ├── content/          TheMealDB proxy (key server-side; the app never sees it)
│   │   ├── import-recipe/    URL → recipe via schema.org JSON-LD (deterministic, SSRF-guarded)
│   │   ├── generate-recipe/  Ask Otto — Claude (opus) recipe gen: prompt · chat · photo modes
│   │   ├── resolve-nutrition/ Claude (haiku) picks a real USDA record for unseen ingredients
│   │   └── delete-account/   completes account deletion (auth user + storage)
│   └── migrations/         Postgres schema + RLS as timestamped SQL (source of truth)
│
├── assets/                 mascot art, Otto action paintings, food-category icons, app icons, sounds
├── docs/                   design system, decision log, roadmaps, tickets, contracts, these breakdowns
├── e2e/                    Playwright journeys (auth · cook · plan · share · …)
├── test/                   node --test unit suites (co-located *.test.mjs run here too)
├── eas.json                EAS Build profiles (production = native, no OTA channel)
├── app.json                Expo config (bundle id com.otto.recipes, plugins, scheme otto://)
└── reusable-app/ · reusable-website-branding/ · altavida/ · references/   (separate scaffolds/projects)
```

## Architecture & data flow

```
Your app (Expo / RN)
   │  Supabase JS client + TanStack Query
   ▼
Supabase
   ├─ Postgres  ── your data behind Row-Level Security (RLS is the security boundary)
   ├─ Auth      ── email/password + Apple/Google/Facebook OAuth
   ├─ Realtime  ── the shared shopping list syncs via postgres_changes
   └─ Edge Functions ── the few jobs that must run server-side:
        content → TheMealDB    import-recipe → schema.org    delete-account
        generate-recipe → Claude (opus)      resolve-nutrition → Claude (haiku) + USDA
```

- **No custom server.** The app queries Postgres directly through the Supabase client; RLS decides what each user can see. The five Edge Functions hold the only secrets (TheMealDB / Anthropic / USDA keys) so they never touch the app bundle.
- **Two content sources, one job each** — **TheMealDB** supplies recipes + ingredient lines (it carries no nutrition, by design); **USDA FoodData Central** (CC0) supplies the per-ingredient nutrition those lines are costed against.
- **Semantic ink** — terracotta = computed/interactive, ink = human-authored. **Honesty law** — never fabricate data; `null` beats a guess.

### The nutrition engine (`src/features/nutrition/engine/`)

Runs **on-device with zero network calls** — `usdaTable.json` ships in the app. An ingredient line is parsed to grams (`parse.ts`), looked up against the bundled USDA table (`lookup.ts`), and costed × per-100g ÷ servings with guards for raw/cooked, coverage, and kcal plausibility (`compute.ts` + `guards.ts`). Only an *unseen* ingredient falls back to the `resolve-nutrition` Edge Function (Claude picks a real USDA record), then caches forever. The cook/scale/shopping engines (`cook/session`, `stepEnrich`, `planner/shoppingList`, `recipes/recipe.scale`) are likewise pure, deterministic, and unit-tested — no LLM in the render path.

## Design system

Light-only, token-pure. Terracotta `#C4562E` accent, cream paper surfaces, Lora serif display, warm ink. Otto appears at emotional beats; the paw is the save mark everywhere.

- `docs/DESIGN_SYSTEM.md` (authoritative) · `docs/MASCOT.md` · `docs/SCREEN_MAP.md`
- Tokens: `src/shared/theme/`; mascot/action/food art under `assets/` via `src/shared/assets.ts`
- Figma DS file: `X1eGT54CTwtowHNve30vvE`; master board `mM0uWkHod9rL1Ff1VJ64Au`

## Run it

```bash
# app (web + Expo Go)
npm install && npx expo start                     # :8081

# native iOS dev build (needs the native modules — expo-audio/keep-awake/image-picker)
npx expo run:ios --device "iPhone 17 Pro Max"
```

Server-side logic (Edge Functions) and schema (migrations) live under `supabase/` and deploy to the
Supabase project — there is no separate server to run.

> **CocoaPods on a stock Mac (no Homebrew, system Ruby 2.6):**
> `gem install --user-install activesupport -v 6.1.7.10 --no-document && gem install --user-install cocoapods --no-document`, then put `$HOME/.gem/ruby/2.6.0/bin` on PATH.
> `ios/` and `android/` are generated (`expo prebuild`) and gitignored. Splash/plugin changes need `expo prebuild -p ios --clean`.

### `.env`

```bash
# .env (root) — publishable client config, safe to expose; RLS is the security boundary
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

`EXPO_PUBLIC_*` vars are inlined at build time — restart Expo after changing them. Server-side secrets
(`ANTHROPIC_API_KEY`, `THEMEALDB_KEY`, `USDA_API_KEY`, the service-role key for account deletion) live
in **Supabase Edge Function config**, never in the app bundle.

## Checks

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint app src test
npm test              # node --test (unit + engine + edge-function logic)
```

CI (`.github/workflows/ci.yml`) runs all three on every push to `main` and PRs into it.

## Docs map

| Doc | What it holds |
|---|---|
| `docs/ARCHITECTURE.md` | Full v2 codebase map (grounded in the source) |
| `docs/API_ARCHITECTURE.md` | The data-access model — RLS queries, Edge Functions, RPCs, Realtime |
| `docs/DESIGN_SYSTEM.md` | The authoritative design system |
| `docs/CONTEXT_ENGINEERING.md` | "How to navigate the tree" + task→file map |
| `docs/REDESIGN_NOTES.md` | The decision log — every call with rationale |
| `docs/contracts/` | Feature-module, database, engine, UI, persistence, testing contracts |

## Status

**v2 is live on `main`** (feature-first rebuild; the old RN-JS app + Express backend are archived in
the `v1-legacy` branch). Backend runs on Supabase — all Edge Functions active, Claude generation and
nutrition resolution working. Security advisors cleaned up.

**Remaining to ship:** a device smoke-test of the OS-level paths (Apple/Google/Facebook login, timer
audio, camera, push permission), then a **native EAS build** → TestFlight → App Store. Otto Club IAP
lands when gating should go live.

## Credits

Recipe content by [TheMealDB](https://www.themealdb.com/api.php). Nutrition from
[USDA FoodData Central](https://fdc.nal.usda.gov) (public domain, CC0). Built with free-tier tools
throughout — **two sources, one job each**: TheMealDB supplies recipes and ingredient lines; USDA
supplies the per-ingredient nutrition those lines are costed against.
