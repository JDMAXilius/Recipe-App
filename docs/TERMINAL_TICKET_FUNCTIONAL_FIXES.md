# 🎟️ Terminal Ticket — Functional fixes: recipe-save + video (device/backend)

> These are the items the cloud (Linux) session **could not finish from here** — they need a real
> device/simulator, the deployed backend, and Railway logs, none of which are reachable from the
> cloud box. The cloud session already did the frontend investigation and web-level verification, so
> **don't redo that** — start from "What's already proven" and go straight to the parts that need a
> Mac + the live backend.
>
> Context: the app is on **Expo SDK 54** (RN 0.81.5). The founder tested a TestFlight build and hit
> two functional issues; everything else in the frontend was verified working under SDK 54.

---

## What's already proven (do NOT re-investigate)

- **The recipe create → save → cookbook flow is correct in the frontend.** Verified in a clean SDK 54
  web build by driving the actual form against a stubbed backend: `POST /api/recipes` fires with the
  right payload, the app navigates to `/recipe/u-<id>`, and the recipe shows in the cookbook with the
  "BY YOU" badge. **Zero runtime errors.** So the save failure is **not** in:
  - `mobile/app/recipe/edit.jsx` `save()` (line ~130) — payload + navigation are correct
  - `mobile/services/userRecipes.js` `UserRecipeAPI.create` — correct POST
  - `mobile/app/(tabs)/cookbook.jsx` `loadMine()` — correctly lists user recipes
  - `mobile/lib/api.js` `authFetch` — correctly attaches the Supabase token
- **The YouTube "Error 153" root cause was fixed in code** (commit `a5f6a8c`, `mobile/app/recipe/[id].jsx`):
  the WebView now loads the embed inside an HTML doc with a real `baseUrl` origin instead of a bare
  `uri`. This could not be verified on the cloud box because the WebView path is native-only.

---

## Task 1 — Recipe save fails on device (HIGHEST PRIORITY)

**Symptom (founder):** create a recipe, tap "Save to my cookbook" → it doesn't save / isn't usable.
**Working theory:** since the frontend is proven correct, the failure is **backend or environment**
on the live `POST /api/recipes`. The shopping list works on device (plan data loads), so the backend
is reachable in general — this is specific to the create endpoint.

### 1a. Reproduce and capture the real error
- Run the app against the **real backend** (device or simulator on a dev build, or the TestFlight
  build). Create a recipe and tap Save.
- **Read the exact toast.** The app surfaces the server's message:
  - `"Something went wrong"` → backend threw a 500 (DB/exception). Go to 1b.
  - `"Network request failed"` / a connection error → the build can't reach the backend. Go to 1d.
  - A validation message → payload rejected. Go to 1c.

### 1b. Check the backend logs (the definitive step)
- The handler `backend/src/server.js:150` (`app.post("/api/recipes", ...)`) wraps the insert in
  try/catch and calls `reportError(error, { msg: "create recipe failed", userId })` on failure.
- **Pull the Railway logs** (or wherever the backend deploys) for that message at the time of the
  failed save. It contains the actual exception — the real root cause.
- **Prime suspect: the `visibility` column.** The insert writes `visibility` (schema at
  `backend/src/db/schema.js:35`). It's added to prod by the idempotent script
  `backend/scripts/b0-hardening.mjs` (`alter table recipes add column if not exists visibility ...`).
  If a Postgres error says **`column "visibility" does not exist`**, that script was never run
  against the current production DB → **run it against prod** (`node scripts/b0-hardening.mjs` with
  the prod `DATABASE_URL`), then retry. Also check `nutrition`/other newer columns the same way.
- If it's a different column/constraint, align the deployed DB with `schema.js` (the repo uses
  `drizzle-kit push --force` per the project convention; the migrations journal is known to be out of
  sync, so verify against the live table with `\d recipes`).

### 1c. If it's a validation 400
- The schema is `backend/src/lib/validate.js` → `schemas.recipeCreate`. It should accept the app's
  payload (nullable image/category/area, default steps/ingredients). Diff the **actual request body**
  (from the log) against the schema and fix whichever side is wrong. Don't loosen validation blindly —
  match it to what the app really sends.

### 1d. If it's "can't reach the backend"
- The production build's `EXPO_PUBLIC_API_URL` is wrong. Confirm the EAS env var points at the
  **deployed Railway URL**, NOT `http://localhost:5001/api` (the repo `.env` is a dev value):
  ```bash
  cd mobile && eas env:list --environment production
  ```
  Fix with `eas env:create/update` and rebuild. (This is the #1 gotcha from
  `TERMINAL_TICKET_TESTFLIGHT.md` Step 2.)

### 1e. Verify the fix end-to-end
- Create a recipe → confirm it saves, opens its detail, appears in the cookbook ("BY YOU"), and
  survives an app restart (it's persisted server-side, not just in memory).
- Confirm `GET /api/recipes` returns it and `GET /api/recipes/:id` loads it.

---

## Task 2 — Confirm the YouTube video fix on a real build

- The Error 153 fix is committed (`a5f6a8c`). **Verify it on a device/simulator:** open a recipe that
  has a video (the "See it made" section), tap play, confirm it **plays inline** with no "Error 153 /
  player configuration error."
- If 153 still appears on device, the fallback is to swap the inline WebView for the
  `react-native-youtube-iframe` library (it manages the origin/handshake internally). File location:
  `mobile/app/recipe/[id].jsx`, the `videoPlaying` WebView block. Keep the tap-to-play thumbnail and
  the "web opens YouTube directly" branch as-is.
- Also sanity-check that `react-native-webview` is on its SDK 54-compatible version (`npx expo install
  react-native-webview` reconciles it) — a mismatched webview can also break embeds after an SDK bump.

---

## Task 3 — (CONDITIONAL) Recipe photo: upload vs. link

Only do this if the founder confirms they want a **device photo upload** (they're deciding). Today the
create screen has a **"PHOTO LINK (OPTIONAL)"** URL field (`mobile/app/recipe/edit.jsx`), which works.
If real upload is wanted:
- Add an image picker (the app already depends on `expo-image-picker`, used by the cooking journal).
- Upload the picked image to storage (Supabase Storage is already in the stack) and store the public
  URL in the recipe's `image` field — the rest of the app already renders `recipe.image`, so no
  downstream changes.
- Keep the paste-a-link field too (both paths set the same `image` field). Add a backend upload/signed
  -URL endpoint if you don't want the client writing to Storage directly.
- Honesty/UX: show upload progress and a clear failure state; never a dead "uploading…" spinner.

---

## Done when
- [ ] Creating a recipe on a real build **saves and persists**, and the recipe is usable like any
      other (opens, plans, cooks, shares, appears in cookbook after restart).
- [ ] The root cause of the save failure is identified from the backend log and **fixed at the
      source** (not worked around in the client), with a one-line note here of what it was.
- [ ] A recipe video **plays** on device with no Error 153.
- [ ] (If requested) photo upload from the device works end-to-end.
