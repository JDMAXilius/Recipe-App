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

## Task 3 — Recipe photo upload (IMPLEMENTED in app — needs the Storage bucket)

The founder asked for a **device photo upload** on the create-recipe screen so a recipe can showcase
its own picture. **Done in the app** (cloud session, 2026-07-19):

- `mobile/app/recipe/edit.jsx`: the old "PHOTO LINK (OPTIONAL)" block is now a **PHOTO** section right
  under the title — a dashed "Upload a photo of the dish" drop zone (empty) / tappable preview +
  "Change photo" (filled), with an "Uploading…" state and honest failure toasts. The paste-a-link
  field stays underneath as an alternative ("Or paste a link"). Both paths set the same `image` field,
  which the whole app already renders.
- `mobile/lib/uploadRecipePhoto.js`: picks the image via `expo-image-picker` (`base64: true`,
  `quality: 0.6`, library only), decodes base64 → `Uint8Array` **without** `fetch(uri).blob()` (that
  uploads 0 bytes on RN) and **without** a new dependency, then `supabase.storage.from("recipe-photos")
  .upload(...)` and returns `getPublicUrl(...)`. Path is `${auth.uid()}/${timestamp}.<ext>`.

**What the terminal MUST do — the bucket + policies (cloud couldn't: the repo `.env` has a placeholder
`dummy.supabase.co`; the real project is injected at build time and isn't reachable from the cloud
box).** In the app's real Supabase project, create a **public** bucket named exactly `recipe-photos`
and allow authenticated users to write under their own folder:

```sql
-- 1. public bucket (Dashboard → Storage → New bucket → name: recipe-photos, Public: ON — or:)
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do update set public = true;

-- 2. authenticated users can upload into their own "<uid>/…" folder
create policy "recipe photos: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. public read (bucket is public, but make the read policy explicit)
create policy "recipe photos: public read"
  on storage.objects for select to public
  using (bucket_id = 'recipe-photos');
```

Then on a device build: New recipe → tap "Upload a photo of the dish" → pick one → confirm it uploads,
the preview shows, save, and the picture appears on the recipe detail + cards. **Can't be verified from
the cloud** (native picker + real Storage). If uploads 400 with "row-level security", the insert policy
above didn't apply. If the founder would rather not have the client write to Storage directly, the
alternative is a backend `POST /api/recipes/photo` (multipart → service-role upload → return URL); the
app change would just be swapping the one `supabase.storage…` call in `uploadRecipePhoto.js` for that
fetch. The bucket approach is what's wired now.

---

## Resolution (Mac session, v1.0.2)

- **Task 1 — recipe save:** NOT a backend bug. The live DB already has `visibility` + `nutrition`
  (checked `information_schema`), and `POST /api/recipes` was reproduced end-to-end against the
  deployed Railway backend with a real Supabase token → **201, recipe persisted**. The founder's
  "save fails" was on **build #13, which crashed on the splash screen** (missing
  `react-native-worklets` after the SDK 54 bump) and never reached the save flow. Fixed in build
  #14 (worklets + React Navigation aligned); create works once the app launches.
- **Task 2 — video:** `react-native-webview` already at the SDK-54 version (13.15.0); the Error-153
  fix is in `recipe/[id].jsx`. Play-on-device still to be eyeballed, but no version reconcile needed.
- **Task 3:** not requested — skipped.

---

## Task 4 — Shared list ("Our list") does nothing → missing DB tables (NEW, 2026-07-18)

**Symptom (founder):** "joining the shopping list cart is not really doing anything" — Household →
"Start a shared list" (or joining an invite) has no effect / silently shows "Shared lists aren't
switched on for this kitchen yet."

**Root cause (found from the cloud):** the collab tables **`collab_lists` and `collab_items`** are
defined in `backend/src/db/schema.js` but were **never created in the live DB** — there was no
migration or setup script for them (unlike `visibility`/`nutrition`, which had `b0-hardening.mjs`).
Every `/api/lists` route then 500s with `relation "collab_lists" does not exist`, and the app's
`start()` catch maps that to the "aren't switched on" toast. **The frontend is proven correct** —
driven in a SDK 54 web build against stubbed endpoints, "Start a shared list" creates the list and
transitions to the "Our list" view with zero errors.

**Fix (repo-side done — you just run it):** `backend/scripts/s3-collab-schema.mjs` is written to
create both tables idempotently (matching the Drizzle schema) + a `token` index + RLS on. Run it
against **prod**:
```bash
cd backend && node --env-file=.env scripts/s3-collab-schema.mjs   # .env must point DATABASE_URL at prod
# verify:  select to_regclass('public.collab_lists'), to_regclass('public.collab_items');
```
Then on device: Household → Start a shared list → confirm it opens the list, add an item, share the
link, and (second account/device) paste the link → **Join it** → both see the same list.

> Prevention: the repo pushes schema via scripts, not a live migration journal — any NEW table in
> `schema.js` needs a matching idempotent script run against prod, or it silently 500s in production
> while working locally.

### Task 4b — the join path itself was broken (found + fixed 2026-07-19, `bd3f2553`)

With the tables finally in place, tracing the join flow end to end turned up two bugs that would
have made "joining does nothing" look like it was *still* broken after the schema fix:

1. **Valid invites were rejected.** The paste box matched `/([A-Za-z0-9_-]{8,24})\s*$/` — the token
   had to be at the very END of the string. A trailing slash, a `?utm_source=` param added by a
   messaging app, or the sender typing anything after the link all failed with "that link doesn't
   look right." It also pulled a junk token out of unrelated URLs (`example.com/somepage` →
   `somepage`), which then surfaced as "couldn't find a live list" — the wrong error entirely.
   → `mobile/lib/inviteLink.mjs` `parseInviteToken()`: finds `/hl/<token>` anywhere in the text,
   accepts a bare token only when it is the whole input. Covered by `mobile/test/inviteLink.test.mjs`
   (`npm test` in `mobile/`, node's built-in runner).
2. **A joiner could not pass the invite on.** `join()` stored the pasted string as the membership
   URL, so anyone who joined by pasting a bare token got `url: null` — and Share then sent a message
   with **no link in it**. → `GET /api/lists/:token` now returns the canonical `url`; the client
   stores that and refuses to share a linkless invite.

Also added: a local **"Lists you've been in"** row (last 3, this device only, `otto.household.recent.v1`)
so losing the link isn't a dead end. Deliberately NOT a member search — the token IS the membership,
so a directory would mean a user index and a consent surface for the sake of a grocery list.

### Task 4c — the real reason it was dead: the backend was never deployed (2026-07-19)

Running the API against production from the Mac showed **every collab and share route 404ing** —
`/api/lists`, `/hl/`, `/l/`, `/r/`. The deployed container had been up since **2026-07-16**. So the
schema fix in Task 4 could never have worked: the tables existed, the code did not. Pushing to
`main` does not deploy the backend (see the deploy gotcha in `TERMINAL_HANDOFF.md`).

Also found in the same pass: **`recipe_shares` and `list_shares` were missing from the prod DB** —
the S2 share features had been silently falling back to plain-text shares. Fixed with the new
`backend/scripts/s2-share-schema.mjs`.

**After deploying + applying the schema, verified against production:**
- A creates a shared list → B joins → `GET /api/lists/:token` returns the canonical `url` → B adds
  an item → A sees it → public `/hl/` page renders "2 things". ✅
- `POST /api/recipes/:id/share` → `/r/<slug>` renders the recipe. ✅
- `POST /api/share/list` → `/l/<token>` renders the list. ✅
- Full account deletion across all six user-owned tables → `{dataDeleted:true, authUserDeleted:true}`,
  the deleted user's `/hl/` link 404s, DB sweep shows 0 rows. ✅

⚠️ **Still unverified:** the **UI**. The paste box, the "Lists you've been in" rejoin row, and the
share sheet have never run on a device — only the API beneath them.

⚠️ **`SHARE_BASE_URL` is still unset on Railway.** Confirmed live: invites currently read
`https://recipe-app-production-6cf5.up.railway.app/hl/...`. Functional, but it pins every invite to
the Railway host. Point it at getotto.app once the site is live.

---

## Done when
- [ ] Creating a recipe on a real build **saves and persists**, and the recipe is usable like any
      other (opens, plans, cooks, shares, appears in cookbook after restart).
- [ ] Shared list: after running `s3-collab-schema.mjs` on prod, "Start a shared list" and "Join it"
      both work on device — two people see the same live list. *(Schema ✅ applied; join-path bugs
      ✅ fixed in `bd3f2553` — Task 4b. The two-account device test is what's left.)*
- [ ] The person who JOINED can share the invite onward and a third account can join from it
      (this was silently broken — the joiner shared a message with no link).
- [ ] The root cause of the save failure is identified from the backend log and **fixed at the
      source** (not worked around in the client), with a one-line note here of what it was.
- [ ] A recipe video **plays** on device with no Error 153.
- [ ] Photo upload from the device works end-to-end (app side ✅ implemented — Task 3; bucket +
      policies ✅ applied to prod 2026-07-19; **device test is what's left**, on a build that
      actually contains the upload commit `22e9f784`).
