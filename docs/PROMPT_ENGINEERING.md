# 🎯 Prompt Engineering — Recipe App

> **Purpose.** A practical playbook for driving an AI coding agent to build features on *this* codebase safely and consistently. Pair it with [`CONTEXT_ENGINEERING.md`](./CONTEXT_ENGINEERING.md) — that file is the "what exists"; this file is the "how to ask for change." Includes a ready-to-use feature backlog with copy-paste prompts.

**Last updated:** 2026-07-14

---

## 1. How to prompt this repo (the operating rules)

Give every feature request this spine. The more of it you fill in, the less the agent guesses.

1. **Point at context first.** Start with: *"Read `docs/CONTEXT_ENGINEERING.md` before writing code."* This anchors the agent in the real architecture (Supabase auth, TheMealDB, favorites-only backend, hardcoded theme).
2. **State the user story**, not the implementation. *"As a signed-in user I want to…, so that…"*
3. **Name the surface area.** Which screen(s), component(s), route(s), endpoint(s), table(s). Use the "Where to make common changes" table in the context doc.
4. **Declare the constraints** (see §2). Match existing conventions unless you say otherwise.
5. **Define done.** Concrete acceptance criteria + how you'll verify (run on simulator, specific tap-through).
6. **Set scope boundaries.** *"Don't refactor unrelated files. Don't add new state libraries unless asked."*

**Golden rule:** ask for a **plan before code** on anything non-trivial. *"Propose a plan and the files you'll change; wait for my ok before editing."*

---

## 2. Constraints to hand the agent (project invariants)

Copy this block into feature prompts so output stays consistent with the codebase:

```
Project constraints:
- JavaScript + JSX only (no TypeScript files), React 19 function components + hooks.
- Navigation: expo-router file-based routing. New screens = new files under mobile/app.
- Auth is Supabase (email/password) via useAuth() from context/AuthContext. Never reintroduce Clerk.
- Recipe content comes from TheMealDB via services/mealAPI.js — extend that wrapper, don't fetch TheMealDB inline.
- The only backend data is the `favorites` table (Drizzle + Neon Postgres). Backend routes live in backend/src/server.js.
- Styling: per-screen StyleSheet modules in assets/styles/*.styles.js, reading COLORS from constants/colors.js. No inline style objects for anything reusable.
- Do NOT hardcode colors — always use COLORS tokens.
- Keep local useState/useEffect patterns; do not add Redux/Zustand/React Query unless I ask.
- Match existing loading (LoadingSpinner) and empty-state (ListEmptyComponent) patterns.
- Don't refactor unrelated code. Keep the diff scoped to the feature.
```

---

## 3. Reusable prompt templates

### 3a. New feature (screen or flow)
```
Read docs/CONTEXT_ENGINEERING.md first.

Feature: <name>
User story: As a <user>, I want <capability>, so that <benefit>.
Surface area: <screens/components/routes/endpoints/tables>.
Behavior:
- <bullet by bullet, including empty/loading/error states>
Data: <TheMealDB call? backend endpoint? new table/column? local storage?>
Constraints: <paste the block from §2>
Acceptance criteria:
- [ ] <observable outcome 1>
- [ ] <observable outcome 2>
Verification: <how I'll test — e.g. "run on iOS sim, sign in, tap X, expect Y">

First give me a short plan + file list. Wait for my approval before editing code.
```

### 3b. Backend endpoint / schema change
```
Read docs/CONTEXT_ENGINEERING.md (§5 data model, §6 flows) first.

Add/modify endpoint: <verb + path>
Purpose: <...>
Request/response shape: <...>
Schema impact: <new column/table? provide Drizzle changes + a migration via drizzle-kit>
Security: <should this verify the Supabase JWT? who can access whose data?>
Keep routes in backend/src/server.js. Update the context doc's data-model/flow tables if the shape changes.
```

### 3c. UI redesign of an existing screen
```
Read docs/CONTEXT_ENGINEERING.md (§8 theming, §9 conventions) first.

Redesign: <screen>
Goal / vibe: <e.g. "cleaner iOS-native feel, more whitespace, larger imagery">
References: <attach screenshots / Figma URL if available>
Rules:
- Use COLORS tokens only; keep it working across all 8 themes.
- Prefer the already-installed but unused libs where they help: expo-symbols (SF Symbols), expo-haptics (tactile feedback), expo-blur (frosted bars).
- Keep the data/logic untouched; this is presentational.
Show me before/after of the styles module and the JSX diff.
```

### 3d. Bug fix
```
Read docs/CONTEXT_ENGINEERING.md (§11 known gotchas) first — the cause may already be listed.
Bug: <what happens> / Expected: <what should happen> / Repro: <steps>.
Diagnose root cause before patching. Show the minimal fix. Note if it's one of the documented gotchas.
```

---

## 4. Anti-patterns to explicitly forbid

Tell the agent **not** to:
- Reintroduce Clerk or any auth other than Supabase.
- Fetch TheMealDB directly inside a screen (must go through `mealAPI.js`).
- Hardcode hex colors instead of `COLORS` tokens.
- Add a state-management or data-fetching library uninvited.
- Trust `userId` on the backend without noting the auth gap (see gotcha #2) if the feature touches favorites security.
- Convert files to TypeScript as a side effect.
- Do a "drive-by refactor" of files unrelated to the task.

---

## 5. Feature backlog (prioritized, with ready-to-use prompts)

Ranked by **value ÷ effort** for this specific codebase. Each item is scoped to the real architecture, so the prompts are close to copy-paste.

### 🥇 Tier 1 — high value, low effort (foundations already exist)

**F1 — Runtime theme switcher (8 themes already defined).**
> Why: `colors.js` already ships 8 palettes; only the *switch* is missing. Biggest visible win for least work.
```
Read docs/CONTEXT_ENGINEERING.md (§8). Add a runtime theme switcher.
- Create a ThemeContext that holds the active theme key and exposes setTheme().
- Persist the choice in AsyncStorage; load it on app start (before first paint if possible).
- Replace the static `export const COLORS = THEMES.purple` usage so screens react to changes.
  Recommend the least invasive migration path (e.g. a useTheme() hook returning colors) and list every file that imports COLORS so we can assess the blast radius before editing.
- Add a simple theme picker UI (swatches) — propose where it lives (new Settings screen vs. Favorites header).
Plan first, then wait for approval.
```

**F2 — Configurable API URL (fix hardcoded localhost).**
```
Replace the hardcoded API_URL in mobile/constants/api.js with process.env.EXPO_PUBLIC_API_URL,
falling back to http://localhost:5001/api. Document the new env var in README and the context doc.
```

**F3 — Profile / Settings screen.**
> Currently logout is buried in the Favorites header. A real account surface unlocks theme switching, sign-out, and future settings.
```
Read docs/CONTEXT_ENGINEERING.md. Add a "Profile" tab (or a settings route).
Show the user's email (from useAuth().user), a theme picker (depends on F1), and a Sign Out button.
Follow the (tabs) pattern; add the tab in (tabs)/_layout.jsx with an appropriate Ionicon.
```

### 🥈 Tier 2 — high value, moderate effort (new backend/data)

**F4 — Shopping list from recipe ingredients.**
> Natural extension of `ingredients[]`; high everyday utility.
```
Read docs/CONTEXT_ENGINEERING.md (§5, §6). Add a shopping list.
- New backend table `shopping_items` (user_id, ingredient text, checked boolean, created_at) + Drizzle migration.
- Endpoints in server.js: GET/POST/PATCH/DELETE scoped by userId (note the auth gap; add JWT check if we do F8).
- On recipe/[id], add an "Add ingredients to shopping list" action.
- New "Shopping List" screen: checkable rows, clear-completed.
Plan + file list first.
```

**F5 — Recipe ratings & personal notes.**
```
Add per-user rating (1–5) and a free-text note per recipe.
New table `recipe_meta` (user_id, recipe_id, rating int, note text, updated_at) + migration + endpoints.
Surface a star control + notes field on recipe/[id]; show the rating on saved cards in Favorites.
```

**F6 — Search filters (cuisine/area + category).**
> `mealAPI` already supports category & ingredient filters; area exists in `transformMealData`.
```
Enhance the Search screen with filter chips: by category and by area/cuisine.
Extend services/mealAPI.js with a filterByArea call (/filter.php?a=) and list.php?a=list for options.
Keep the debounced text search; filters compose with it. Match the existing CategoryFilter chip style.
```

**F7 — Meal planner (weekly calendar).**
```
Add a weekly meal planner: assign saved recipes to days/slots.
New table `meal_plan` (user_id, recipe_id, plan_date, slot) + migration + endpoints.
New "Planner" screen with a 7-day view; add "Add to plan" on recipe/[id] and Favorites.
Plan first — this is the largest item; propose an incremental rollout.
```

### 🥉 Tier 3 — polish, iOS-native feel, and hardening

**F8 — Secure the favorites backend (Supabase JWT).**
> Addresses gotcha #2. Do this before/with any feature adding user-owned data (F4–F7).
```
Read docs/CONTEXT_ENGINEERING.md (§7, gotcha #2). Verify the Supabase JWT on backend favorites routes.
Send the access token from the app (Authorization: Bearer). On the server, validate it and derive userId
from the token instead of trusting the path/body. Add cors() while we're in server.js.
```

**F9 — iOS-native feel pass (haptics, SF Symbols, blur).**
> `expo-haptics`, `expo-symbols`, `expo-blur` are already installed but unused.
```
Read docs/CONTEXT_ENGINEERING.md (§4, §9). Elevate the iOS feel WITHOUT changing logic:
- Add expo-haptics feedback on save/unsave and tab-relevant actions.
- Use expo-symbols (SF Symbols) on iOS where it beats Ionicons; keep Ionicons fallback on Android.
- Frosted tab bar / headers via expo-blur.
Keep all 8 themes working. Presentational only.
```

**F10 — Offline favorites cache.**
```
Cache the favorites list in AsyncStorage so Favorites renders instantly offline, then revalidates
against the backend. Handle the online/offline transition gracefully.
```

**F11 — Recently viewed recipes.**
```
Track the last N opened recipes in AsyncStorage; show a "Recently viewed" row on Home above the grid.
```

**F12 — Share a recipe.**
```
Add a native Share action on recipe/[id] using React Native Share, sharing title + TheMealDB link (or a deep link via the "mobile" scheme).
```

---

## 6. Definition of done (default checklist)

Unless a prompt says otherwise, "done" means:
- [ ] Runs on iOS simulator without redbox/warnings introduced by the change.
- [ ] Works across all 8 themes (no hardcoded colors).
- [ ] Loading + empty + error states handled (match existing patterns).
- [ ] No unrelated files touched; diff is scoped.
- [ ] If data model or flows changed, `CONTEXT_ENGINEERING.md` (§5/§6/§11) updated in the same PR.
- [ ] New env vars documented in README + context doc.

---

## 7. Quick-start snippet (paste at the top of any feature session)

```
You are working on the Recipe App (Expo RN + Express + Supabase + TheMealDB).
Before writing code, read docs/CONTEXT_ENGINEERING.md and honor docs/PROMPT_ENGINEERING.md §2 constraints.
For non-trivial work: propose a plan + file list and wait for my approval before editing.
Keep diffs scoped; update the context doc if you change data model or flows.
```
