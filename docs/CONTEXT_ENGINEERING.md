# 🧠 Context Engineering — Recipe App

> **Purpose of this file.** This is the single source of truth an AI coding agent (or a new developer) should read *before* touching the codebase. It captures the app map, architecture, data flows, conventions, and known gotchas so any change is made with full context. Keep it updated as the app evolves.

**Last updated:** 2026-07-14
**Stack in one line:** React Native (Expo) + Express + PostgreSQL, with Supabase Auth and TheMealDB as the recipe source.

---

## 1. What this app is

A cross-platform mobile **recipe app**. Users sign up, browse and search recipes, view full details (ingredients, steps, YouTube tutorial), and save favorites. All recipe *content* comes from the free public **TheMealDB** API; the app's own backend + database store **only each user's favorites**. Authentication is **Supabase** (email + password).

---

## 2. Repository map

```
Recipe-App/
├── README.md
├── docs/
│   ├── CONTEXT_ENGINEERING.md      ← you are here
│   └── PROMPT_ENGINEERING.md       ← how to prompt for new features
│
├── backend/                        Express API (favorites only)
│   ├── package.json                type: module, Express 5
│   ├── drizzle.config.js
│   └── src/
│       ├── server.js               all routes live here (no router split yet)
│       ├── config/
│       │   ├── env.js              reads PORT, DATABASE_URL, NODE_ENV
│       │   ├── db.js               Drizzle + Neon serverless client
│       │   └── cron.js             14-min self-ping (keep-alive on Render)
│       └── db/
│           ├── schema.js           `favorites` table (the only table)
│           └── migrations/         Drizzle SQL migrations
│
└── mobile/                         Expo React Native app
    ├── app.json                    Expo config (new arch enabled, typed routes)
    ├── app/                        expo-router file-based routes
    │   ├── _layout.jsx             root: AuthProvider + SafeScreen + Slot
    │   ├── (auth)/
    │   │   ├── _layout.jsx         redirects to "/" if already signed in
    │   │   ├── sign-in.jsx
    │   │   └── sign-up.jsx
    │   ├── (tabs)/
    │   │   ├── _layout.jsx         tab bar; guards unauthenticated → sign-in
    │   │   ├── index.jsx           Home (featured + categories + grid)
    │   │   ├── search.jsx          Search by name → fallback ingredient
    │   │   └── favorites.jsx       User's saved recipes + logout
    │   └── recipe/
    │       └── [id].jsx            Recipe detail (dynamic route)
    │
    ├── components/
    │   ├── SafeScreen.jsx          safe-area wrapper (uses COLORS.background)
    │   ├── RecipeCard.jsx          grid card → pushes /recipe/[id]
    │   ├── CategoryFilter.jsx      horizontal category chips
    │   ├── LoadingSpinner.jsx
    │   └── NoFavoritesFound.jsx
    │
    ├── context/
    │   └── AuthContext.jsx         Supabase session provider + useAuth()
    ├── lib/
    │   └── supabase.js             Supabase client (AsyncStorage-backed)
    ├── services/
    │   └── mealAPI.js              TheMealDB wrapper + transformMealData()
    ├── hooks/
    │   └── useDebounce.js          300ms debounce for search
    ├── constants/
    │   ├── api.js                  API_URL (backend base) — hardcoded localhost
    │   └── colors.js               8 themes; COLORS = active theme
    └── assets/
        ├── styles/*.styles.js      per-screen StyleSheet modules
        ├── images/                 icons, animal png's, screenshots
        └── fonts/SpaceMono-Regular.ttf
```

---

## 3. Sitemap / navigation graph

```
Root (_layout: AuthProvider → SafeScreen → Slot)
│
├── (auth)   [shown only when NOT signed in]
│   ├── sign-in   ──"Sign up"──▶ sign-up
│   └── sign-up   ──"Sign In"──▶ back
│
└── (tabs)   [guarded: redirect → (auth)/sign-in if not signed in]
    ├── index      "Recipes"   (tab: restaurant icon)
    │     ├── Featured recipe card ─────▶ recipe/[id]
    │     ├── CategoryFilter chips ─────▶ re-filters grid in place
    │     └── RecipeCard grid ──────────▶ recipe/[id]
    ├── search      "Search"    (tab: search icon)
    │     └── RecipeCard grid ──────────▶ recipe/[id]
    └── favorites   "Favorites" (tab: heart icon)
          ├── RecipeCard grid ──────────▶ recipe/[id]
          └── Logout button ───────────▶ signOut() → (auth)/sign-in

recipe/[id]  [outside tabs, full-screen]
      ├── Save / unsave  ─────▶ backend POST/DELETE /favorites
      ├── YouTube tutorial (WebView embed)
      └── Back ──────────────▶ previous screen
```

**Auth gating.** Two guards work together:
- `(tabs)/_layout.jsx` → if `!isSignedIn`, `<Redirect href="/(auth)/sign-in" />`.
- `(auth)/_layout.jsx` → if `isSignedIn`, `<Redirect href="/" />`.
- Both wait on `isLoaded` from `useAuth()` before deciding.

---

## 4. Tech stack & key dependencies

### Mobile
| Concern | Choice |
|---|---|
| Framework | Expo SDK ~53, React Native 0.79, React 19 |
| Navigation | `expo-router` ~5 (file-based, typed routes on) |
| Auth | `@supabase/supabase-js` + `AsyncStorage` for session persistence |
| Images | `expo-image` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Video | `react-native-webview` (YouTube embed) |
| Gradients / blur | `expo-linear-gradient`, `expo-blur` |
| Animation | `react-native-reanimated`, `react-native-gesture-handler` |
| Available but UNUSED | `expo-haptics`, `expo-symbols` (SF Symbols), `expo-blur` — ready to elevate the iOS feel |

### Backend
| Concern | Choice |
|---|---|
| Runtime | Node (ESM, `"type": "module"`) |
| Framework | Express 5 |
| ORM | Drizzle ORM + `drizzle-kit` |
| Database | PostgreSQL via Neon serverless driver |
| Scheduling | `cron` (self-ping keep-alive) |
| Dev | `nodemon` |

---

## 5. Data model

### `favorites` table (`backend/src/db/schema.js`) — the ONLY table
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `user_id` | text, not null | Supabase user id (`user.id`) |
| `recipe_id` | integer, not null | TheMealDB `idMeal` (as int) |
| `title` | text, not null | |
| `image` | text | |
| `cook_time` | text | |
| `servings` | text | ⚠️ stored as text, but app sends a number — see gotchas |
| `created_at` | timestamp | defaults to now |

There is **no users table** — user identity lives entirely in Supabase Auth. The backend trusts whatever `userId` it receives.

---

## 6. External + internal data flows

### Recipe content → TheMealDB (`services/mealAPI.js`)
Base URL: `https://www.themealdb.com/api/json/v1/1`
| Method | Endpoint | Used by |
|---|---|---|
| `searchMealsByName(q)` | `/search.php?s=` | Search |
| `getMealById(id)` | `/lookup.php?i=` | Recipe detail |
| `getRandomMeal()` / `getRandomMeals(n)` | `/random.php` (n parallel calls) | Home, Search default |
| `getCategories()` | `/categories.php` | Home category filter |
| `filterByCategory(c)` | `/filter.php?c=` | Home category select |
| `filterByIngredient(i)` | `/filter.php?i=` | Search fallback |

`transformMealData(meal)` normalizes TheMealDB's awkward shape into the app's canonical recipe object:
```js
{ id, title, description, image, cookTime, servings, category, area, ingredients[], instructions[], originalData }
```
- Flattens `strIngredient1..20` + `strMeasure1..20` → `ingredients[]` strings.
- Splits `strInstructions` on newlines → `instructions[]`.
- ⚠️ `cookTime` and `servings` are **hardcoded** (`"30 minutes"`, `4`) — TheMealDB doesn't provide them.

### Favorites → own backend (`lib/api.js` → Express)
Base URL: `API_URL` (env-driven, default `http://localhost:5001/api`).
All favorites routes **require** `Authorization: Bearer <supabase access token>`;
the server validates it via `supabase.auth.getUser(token)` (`src/middleware/auth.js`)
and derives the user id from the token — client-supplied userIds are ignored.
| Verb | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | health check (public) |
| `POST` | `/api/favorites` | add favorite for the authenticated user (body: recipeId, title, image, cookTime, servings) |
| `GET` | `/api/favorites` | list the authenticated user's favorites |
| `DELETE` | `/api/favorites/:recipeId` | remove one of the authenticated user's favorites |

**Client callers** (via `lib/api.js` → `authFetch()`, which attaches the session token):
- `recipe/[id].jsx` — checks saved state on load; POST/DELETE on toggle.
- `favorites.jsx` — GET on mount, maps `recipeId` → `id` for `RecipeCard`.

---

## 7. Auth flow (Supabase)

1. `lib/supabase.js` creates the client with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, persisting the session in `AsyncStorage`.
2. `context/AuthContext.jsx` (`AuthProvider`) calls `getSession()` on mount and subscribes to `onAuthStateChange`. Exposes `{ session, user, isLoaded, isSignedIn, signOut }` via `useAuth()`.
3. `sign-up.jsx` → `supabase.auth.signUp({ email, password })` (min 6 chars; email auto-confirm assumed → immediate session).
4. `sign-in.jsx` → `supabase.auth.signInWithPassword({ email, password })`.
5. On success, the session propagates through `AuthProvider`; route-group guards redirect into the app. No manual navigation needed after auth.

> The README once described Clerk + 6-digit verification — that's **historical**. The code is Supabase email/password. If you see Clerk anywhere, it's stale.

---

## 8. Theming

`constants/colors.js` defines the **Otto design system** (see `docs/DESIGN_SYSTEM.md`): `THEMES = { base, lean, keto, bulk }`, each with `{ light, dark }` token sets (legacy keys `primary/background/text/…` AND design-system keys `accent/bg/surface/ink/…`), plus `NUTRITION_COLORS` (fixed, never themed).

**Theming is reactive.** `context/ThemeContext.jsx` provides `useTheme()` → `{ colors, nutrition, niche, mode, isDark, setNiche, setMode }`, persisted in AsyncStorage, with `mode: "system"` following the OS appearance.

**Styling convention:** each screen has a matching `assets/styles/<name>.styles.js` module exporting a **factory** — `createXStyles(colors) => StyleSheet.create({...})`. Consumers do:

```js
const { colors } = useTheme();
const homeStyles = useMemo(() => createHomeStyles(colors), [colors]);
```

`RecipeCard` and `CategoryFilter` both pull factories from `home.styles.js`. The static `COLORS` export still exists for back-compat but **must not be imported in app code** — new code always goes through `useTheme()`. A theme-picker UI (F1's last piece / F3 Profile screen) is not built yet; themes currently switch via `setNiche`/`setMode` callers.

---

## 9. Conventions & patterns

- **Language:** JavaScript + JSX (not TypeScript, despite a `tsconfig.json` present). React 19 function components, hooks only.
- **File naming:** screens/components in PascalCase `.jsx`; utilities/hooks/config in camelCase `.js`.
- **Imports:** relative paths (`../../components/...`). `@/` alias exists (used once in root layout) but relative is the norm.
- **State:** local `useState` + `useEffect`. Global state limited to `AuthContext`. No Redux/Zustand/React Query.
- **Data fetching:** raw `fetch`, per-screen, with `try/catch` + `console.log`/`Alert` on error. No shared fetch layer for the backend (only TheMealDB is wrapped in `mealAPI`).
- **Loading/empty states:** `LoadingSpinner` for loading; each list supplies a `ListEmptyComponent` (`NoFavoritesFound`, inline `NoResultsFound`).
- **Lists:** `FlatList` with `numColumns={2}`, `columnWrapperStyle`, often `scrollEnabled={false}` inside a parent `ScrollView`.

---

## 10. Environment / configuration

**Backend `.env`**
```
PORT=5001
DATABASE_URL=<neon_postgres_url>
NODE_ENV=development
API_URL=<self_url_for_cron_keepalive>   # used by cron.js in production
```

**Mobile `.env`**
```
EXPO_PUBLIC_SUPABASE_URL=<supabase_project_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
EXPO_PUBLIC_API_URL=<backend_base_url>   # optional; defaults to http://localhost:5001/api
```
Backend base URL comes from `EXPO_PUBLIC_API_URL` (read in `mobile/constants/api.js`,
localhost fallback). `EXPO_PUBLIC_*` vars are inlined at build time — restart Expo after edits.

**Run**
```bash
# backend
cd backend && npm install && npm run dev
# mobile
cd mobile && npm install && npx expo start
```

---

## 11. Known gotchas / tech debt (read before "fixing" things)

1. ~~**`API_URL` hardcoded to `http://localhost:5001/api`.**~~ **Fixed (F2):** now env-driven via `EXPO_PUBLIC_API_URL` with the localhost fallback (see §10).
2. ~~**Backend has zero auth/authorization.**~~ **Fixed (F8):** favorites routes now require a Supabase access token (`Authorization: Bearer`), verified server-side via `auth.getUser(token)`; userId is derived from the token (see §6).
3. ~~**No runtime theme switching.**~~ **Fixed (F1, mostly):** all screens/components read colors via `useTheme()` and re-render on change (see §8). Remaining: a user-facing theme-picker UI (pairs with F3 Profile screen).
4. **`cookTime`/`servings` are fabricated** in `transformMealData` (`"30 minutes"`, `4`). Any "prep time" shown is not real data.
5. **`servings` type mismatch:** DB column is `text`, but the client POSTs a number. Postgres coerces, but favorites read back as strings — keep in mind for sorting/formatting.
6. **Two Postgres drivers** in `backend/package.json` (`@neondatabase/serverless` **and** `postgres`); likely only one is used.
7. ~~**`cors` is a dependency but not applied**~~ **Fixed (with F8):** `app.use(cors())` is applied in `server.js`.
8. **`recipe/[id].jsx` `getYouTubeEmbedUrl`** naively splits on `v=`; non-standard YouTube URLs (e.g. `youtu.be/...`) would break the embed.
9. **No tests, no linting in CI.** `expo lint` exists; nothing enforced.
10. **TypeScript half-configured:** `tsconfig.json` present but all code is `.jsx`/`.js`.

---

## 12. Where to make common changes

| I want to… | Touch this |
|---|---|
| Add a screen | new file under `mobile/app/...` (expo-router auto-registers) |
| Add a tab | `mobile/app/(tabs)/_layout.jsx` + new `(tabs)/<name>.jsx` |
| Change recipe fetching / add a TheMealDB call | `mobile/services/mealAPI.js` |
| Add a favorites/backend endpoint | `backend/src/server.js` (+ `schema.js` if new data) |
| Change DB shape | `backend/src/db/schema.js` → `npx drizzle-kit generate` → migrate |
| Restyle a screen | `mobile/assets/styles/<screen>.styles.js` |
| Add/switch theme colors | `mobile/constants/colors.js` |
| Change auth behavior | `mobile/context/AuthContext.jsx`, `(auth)/*`, `lib/supabase.js` |
| Add global state | wrap in `mobile/app/_layout.jsx` (like `AuthProvider`) |
```
