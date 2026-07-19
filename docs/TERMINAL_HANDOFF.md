# 🎟️ Terminal Handoff — Otto (master ticket / index)

> **Purpose:** one entry point for the terminal Claude (Mac + device + prod backend + Apple/Supabase
> consoles) to take over. It indexes every open item, ordered by priority, with owner + status + a
> pointer to the detailed ticket. The cloud (Linux) session did all repo-side work it could and
> verified everything reachable from web; what's left needs a device, the live DB, or a console.
>
> **Last updated:** 2026-07-19 (join-path fixes + account deletion) · **App:** Otto, **v1.0.6** (build 19 on TestFlight), Expo **SDK 54** (RN 0.81.5), on TestFlight.

---

## Current state (what's already shipped to `main`)

- **Build/TestFlight pipeline** live: EAS project linked, `eas.json` + `app.json` hardened, building
  to TestFlight (v1.0.5). See `TERMINAL_TICKET_TESTFLIGHT.md`.
- **SDK 54 upgrade** done; recipe **save works** (was a splash-crash on build #13, fixed #14).
- **Frontend fixes** in `main`: shared `ScreenHeader`; auth social row + aligned screens; recipe-detail
  equal-height buttons + "Share this recipe" label; shopping **pad frame redrawn with Views** (iOS
  seam fix); **splash** = transparent Otto on cream (matted alpha WebP, no box); **timer alarm**
  louder + 4s; YouTube **Error-153** fix; shopping-list **share card**.
- **Legal drafted** (fill + host): `docs/legal/{PRIVACY_POLICY,TERMS_OF_SERVICE}.{md,html}`.

## How to work here (repo cadence)

- Branch is kept in lockstep with `main`; **push to `main` fast-forward only**. A cloud co-pilot also
  pushes — **`git fetch && git pull --rebase` before every push.**
- **Verify twice:** web export (`cd mobile && EXPO_OFFLINE=1 npx expo export --platform web`) AND a
  device/simulator. Web can't catch native-only bugs (the pad frame + splash box were both web-clean
  but broke on iOS — don't trust web alone for native rendering).
- **⚠️ Schema gotcha (bit us THREE times):** the repo pushes DB schema via **idempotent scripts in
  `backend/scripts/`, not a live migration journal.** Any new table/column in `backend/src/db/schema.js`
  needs a matching script **run against prod**, or it works locally and silently 500s in production.
  Victims so far: `visibility`/`nutrition` (b0-hardening), `collab_lists`/`collab_items`
  (s3-collab-schema), and `recipe_shares`/`list_shares` (s2-share-schema, found 2026-07-19).
- **⚠️⚠️ Deploy gotcha (cost an hour on 2026-07-19):** **pushing to `main` does NOT deploy the
  backend.** There is no GitHub integration and no CI — deploys are a manual `railway up`. Production
  had been running a **2026-07-16 build for three days**, so S2 share links and S3 collab lists were
  *merged, documented as shipped, and completely absent from prod* — every route 404ing.
  **Deploy (note the `backend` path argument — this is the part that was wrong):**
  ```bash
  cd /Users/juan/Recipe-App && npx -y @railway/cli up backend --service Recipe-App --ci
  ```
  The service's **Root Directory** is now set to `backend` in the Railway console. Before that,
  Railpack read the repo-root `package.json` (which has **no scripts at all**), failed with "No start
  command detected", and uploaded 95 MB of monorepo each time. That empty root manifest is also why
  `railway.json`'s `watchPatterns: ["backend/**"]` had never done anything.
  **After ANY backend change: deploy, then verify the route actually exists** — an unauthenticated
  `GET /api/lists/<anything>` returns **401 JSON** when the code is live and **404 HTML** when prod is
  stale. Status codes alone lie here; check the body.

---

## Open items — priority order

### P0 — features broken/unverified on device

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 1 | ~~**Shared list dead in prod**~~ | Terminal + prod | ✅ **VERIFIED LIVE 2026-07-19** — and it was never really "done" before: the schema was applied on 07-18 but the **routes were not deployed**, so the feature could not have worked. After deploying, driven end to end against production: A creates a list, B joins and gets a canonical `url` back, B adds an item, A sees it, the public `/hl/` page renders. **UI still untested on a device** (paste box, rejoin row). | `TERMINAL_TICKET_FUNCTIONAL_FIXES.md` Task 4 + 4b |
| 1b | ~~**Recipe + shopping-list SHARE LINKS dead in prod**~~ | Terminal + prod | ✅ **FIXED + VERIFIED 2026-07-19** (found today, never previously reported) — `recipe_shares` and `list_shares` were missing from the live DB *and* the routes weren't deployed, so both share features 500'd and silently fell back to a plain-text share. Ran `s2-share-schema.mjs`, deployed; `/r/<slug>` and `/l/<token>` both render in production. | `backend/scripts/s2-share-schema.mjs`, commit `2f83b23d` |
| 2 | **Device-verify the v1.0.5 fixes**: shopping pad frame holds (no seam), splash shows Otto on cream (no box), timer alarm is loud + ~4s, YouTube video plays inline (no Error 153). | Terminal + device | Web-verified only | Functional-fixes Task 2; commits `822e3da`, `fc1fafb`, `4eecaaf` |

**P0.1 — done at the API level; what's left is the UI on a device:**
Household → **Start a shared list** → add an item → Share → on a 2nd account paste the link →
**Join it** → both see the same live list. Then the case that was silently broken until today:
**the person who JOINED shares the invite onward and a third account joins from it.**
Also worth a look: the new **"Lists you've been in"** rejoin row on the setup screen.

### P1 — blocks App Store submission / social login

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 3 | ~~**Supabase OAuth providers**~~ | Founder + consoles | ✅ **DONE 2026-07-18** — Apple + Google + Facebook all enabled on Supabase; verified `external.{apple,google,facebook}=true`. Apple = native (bundle id as client id, no secret); Google = web client (consent screen in Testing mode); Facebook = "Login for Business" app in Dev mode. Device tap-test pending on build 19. | `TERMINAL_TICKET_OAUTH_PROVIDERS.md` |
| 4 | ~~**`SUPABASE_SERVICE_ROLE_KEY` on the backend**~~ | Backend env | ✅ **DONE 2026-07-19** — set on Railway (using the new `sb_secret_` key; supabase-js 2.110.5 supports it). Verified backend healthy + key has GoTrue admin (admin/users → 200). Device-confirm the delete returns `authUserDeleted:true`. NOTE: key was pasted in chat — rotate it. | `PRE_LAUNCH_CHECKLIST.md` §A |
| 5 | **Host privacy policy + terms**, then set `PRIVACY_URL` / `TERMS_URL` in `mobile/app/(tabs)/profile.jsx` (rows light up automatically). Use `docs/legal/*.html`. | Founder host + 2-line edit | Drafted | `docs/legal/`, `PRE_LAUNCH_CHECKLIST.md` §B |
| 6 | **App Store Connect metadata**: screenshots (6.7"), description, keywords, category (Food & Drink), **App Privacy answers** (pre-filled table), support URL, demo account for review. | Founder + console | **Copy drafted** — name/subtitle/promo/keywords/description/What's New all written and character-counted; screenshots, demo credentials and the getotto.app URLs still needed | `docs/APP_STORE_LISTING.md`, `PRE_LAUNCH_CHECKLIST.md` §B |

### P2 — decisions / polish

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 7 | **Recipe photo: paste-a-link (current) vs device upload?** Founder decision; if upload → image picker + Supabase Storage → `recipe.image`. | Founder decision → Terminal | Awaiting decision | Functional-fixes Task 3 |
| 8 | ~~**Account-deletion completeness**~~ | Backend | ✅ **DONE + VERIFIED IN PROD 2026-07-19** — wipes `recipe_shares`, `list_shares`, owned `collab_lists`/`collab_items`, **inside one transaction**. A throwaway account seeded across all six tables deleted cleanly: `{dataDeleted:true, authUserDeleted:true}`, its `/hl/` link now 404s, DB sweep confirmed 0 rows. Owned shared lists die with the owner (no member registry to transfer to); joined lists untouched. | `PRE_LAUNCH_CHECKLIST.md` §C |
| 8b | ~~**Account deletion could destroy data and report failure**~~ | Backend | ✅ **FOUND + FIXED 2026-07-19** (`2f83b23d`) — the handler had **no transaction**, so when the sweep hit the missing `recipe_shares` table, favorites and recipes were already deleted, the caller got "Something went wrong", and the login still worked. Reproduced on a throwaway, then re-run after the fix: data survives a failed delete. Never reached users — prod was 3 days stale. | commit `2f83b23d` |
| 9 | `RATE_APP_URL` / `TELL_A_FRIEND_URL` in `profile.jsx` once the App Store listing URL exists (rows stay hidden until real). | Founder | Open | `PRE_LAUNCH_CHECKLIST.md` §C |
| 10 | ~~**Tidy unused splash assets**~~ | Optional | ✅ **DONE** — removed `otto-splash.{mp4,png,cut.png}`; only the matted `.webp` remains. | — |

---

## Suggested order for the terminal

Everything repo-side that can be done without a device or a console **is done**, and as of
2026-07-19 the backend is **deployed and verified against production** (shared lists, both share
link types, and full account deletion all exercised end to end). What remains is one device
session, one website, and console work:

0. **Connect GitHub in the Railway service** (Settings → Source) so the 3-day drift can't recur.
   Root Directory is now `backend`, so `railway.json`'s `watchPatterns` will finally apply.
1. **One device session, three things at once** (P0.1 UI + P0.2 + the OAuth tap-test): pull the next
   build, then — the shared-list UI *including the joiner re-sharing the invite* and the new
   "Lists you've been in" rejoin row; the four v1.0.5 fixes (pad frame, splash, alarm, YouTube);
   and each visible social button end to end. *(The API side of all of this is already proven —
   what's untested is the UI.)*
2. **P1 #5** — website `/privacy` + `/terms` live (separate repo/session), then set the two
   constants in `profile.jsx`. This is the actual critical path to submitting.
3. **P1 #6** — paste `APP_STORE_LISTING.md` into App Store Connect; add screenshots, a demo account,
   and the App Privacy answers from `PRE_LAUNCH_CHECKLIST.md` §B.
4. **Security, not launch-gated:** rotate `SUPABASE_SERVICE_ROLE_KEY` (it was pasted into a chat
   transcript and bypasses RLS).
5. **Two calls still open:** the photo decision (#7), and Facebook — take the app Live or disable
   the provider. A visible-but-broken social button is a rejection.
6. **Check `SHARE_BASE_URL` on Railway** — unset means every shared-list invite carries the Railway
   hostname instead of getotto.app.

## Ticket index

- `TERMINAL_HANDOFF.md` — **this file** (start here)
- `TERMINAL_TICKET_FUNCTIONAL_FIXES.md` — recipe save (resolved), video, photo (Task 3), **collab schema (Task 4)**
- `APP_STORE_LISTING.md` — App Store Connect copy, drafted + character-counted (paste-ready)
- `TERMINAL_TICKET_B0_B1.md` — ⛔ **SUPERSEDED in part**: B0 shipped, B1's Edamam path is dead (USDA replaced it)
- `TERMINAL_TICKET_SHARE_CARD.md` — install view-shot + expo-sharing, rebuild → share sends the card image not text
- `TERMINAL_TICKET_WEBSITE.md` — kick off the Otto website in a NEW repo (uses `WEBSITE_ASSET_MANIFEST.md`)
- `TERMINAL_TICKET_OAUTH_PROVIDERS.md` — Apple/Google/Facebook via Supabase
- `TERMINAL_TICKET_TESTFLIGHT.md` — build + submit + TestFlight internal testing
- `PRE_LAUNCH_CHECKLIST.md` — tiered, owner-tagged launch checklist (+ App Privacy answers)
- `docs/legal/` — privacy policy + terms (Markdown source + hostable HTML)
- `docs/REDESIGN_NOTES.md` — decision log (C-numbered), incl. every root cause found this session

## Facts the terminal will need

| | |
|---|---|
| Apple Team ID | `A6J6HGNWZK` |
| App bundle id | `com.otto.recipes` |
| Supabase project ref | `mepzfdefanfpnrvydyty` |
| Supabase OAuth callback | `https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback` |
| Native deep-link redirect | `mobile://auth/callback` |
| App version | `1.0.6` (build 19) (EAS auto-increments buildNumber) |
