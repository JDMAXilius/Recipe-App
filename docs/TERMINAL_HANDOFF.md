# 🎟️ Terminal Handoff — Otto (master ticket / index)

> **Purpose:** one entry point for the terminal Claude (Mac + device + prod backend + Apple/Supabase
> consoles) to take over. It indexes every open item, ordered by priority, with owner + status + a
> pointer to the detailed ticket. The cloud (Linux) session did all repo-side work it could and
> verified everything reachable from web; what's left needs a device, the live DB, or a console.
>
> **Last updated:** 2026-07-18 · **App:** Otto, **v1.0.5**, Expo **SDK 54** (RN 0.81.5), on TestFlight.

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
- **⚠️ Schema gotcha (bit us twice):** the repo pushes DB schema via **idempotent scripts in
  `backend/scripts/`, not a live migration journal.** Any new table/column in `backend/src/db/schema.js`
  needs a matching script **run against prod**, or it works locally and silently 500s in production.

---

## Open items — priority order

### P0 — features broken/unverified on device

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 1 | **Shared list dead in prod** — run `backend/scripts/s3-collab-schema.mjs` against prod (creates `collab_lists`/`collab_items`; they were never created). Frontend proven correct. | Terminal + prod DB | **Script written, NOT run** | `TERMINAL_TICKET_FUNCTIONAL_FIXES.md` Task 4 |
| 2 | **Device-verify the v1.0.5 fixes**: shopping pad frame holds (no seam), splash shows Otto on cream (no box), timer alarm is loud + ~4s, YouTube video plays inline (no Error 153). | Terminal + device | Web-verified only | Functional-fixes Task 2; commits `822e3da`, `fc1fafb`, `4eecaaf` |

**P0.1 exact steps:**
```bash
cd backend && node --env-file=.env scripts/s3-collab-schema.mjs   # .env → prod DATABASE_URL
# verify: select to_regclass('public.collab_lists'), to_regclass('public.collab_items');
```
Then on device: Household → **Start a shared list** → add an item → share link → on a 2nd account
paste link → **Join it** → both see the same live list.

### P1 — blocks App Store submission / social login

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 3 | **Supabase OAuth providers** (at least Apple; the buttons are honestly gated so Apple-only ships fine). Redirect + Client-ID (bundle id!) setup. | Founder + consoles | Not started | `TERMINAL_TICKET_OAUTH_PROVIDERS.md` |
| 4 | **`SUPABASE_SERVICE_ROLE_KEY` on the backend** so account deletion removes the auth identity, not just data (Apple 5.1.1(v)). Verify `DELETE /api/account` returns `authUserDeleted: true`. | Backend env | Not started | `PRE_LAUNCH_CHECKLIST.md` §A |
| 5 | **Host privacy policy + terms**, then set `PRIVACY_URL` / `TERMS_URL` in `mobile/app/(tabs)/profile.jsx` (rows light up automatically). Use `docs/legal/*.html`. | Founder host + 2-line edit | Drafted | `docs/legal/`, `PRE_LAUNCH_CHECKLIST.md` §B |
| 6 | **App Store Connect metadata**: screenshots (6.7"), description, keywords, category (Food & Drink), **App Privacy answers** (pre-filled table), support URL, demo account for review. | Founder + console | Not started | `PRE_LAUNCH_CHECKLIST.md` §B |

### P2 — decisions / polish

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 7 | **Recipe photo: paste-a-link (current) vs device upload?** Founder decision; if upload → image picker + Supabase Storage → `recipe.image`. | Founder decision → Terminal | Awaiting decision | Functional-fixes Task 3 |
| 8 | **Account-deletion completeness**: `DELETE /api/account` doesn't yet revoke the user's public **share links** or **collaborative lists** — decide + implement before public launch. | Backend | Open | `PRE_LAUNCH_CHECKLIST.md` §C |
| 9 | `RATE_APP_URL` / `TELL_A_FRIEND_URL` in `profile.jsx` once the App Store listing URL exists (rows stay hidden until real). | Founder | Open | `PRE_LAUNCH_CHECKLIST.md` §C |
| 10 | **Tidy unused splash assets**: `mobile/assets/splash/otto-splash.{mp4,png}` are no longer referenced (the matted `.webp` + cutout replaced them). Remove if desired. | Optional | Open | — |

---

## Suggested order for the terminal

1. **P0.1** — run `s3-collab-schema.mjs` on prod (2 min) → shared list works. Highest value, lowest effort.
2. **P0.2** — pull the next TestFlight build, eyeball the four v1.0.5 fixes on device; note any that need a nudge (pad-frame insets, splash size/animation, alarm volume).
3. **P1 #4** — set `SUPABASE_SERVICE_ROLE_KEY` (quick, unblocks the account-deletion requirement).
4. **P1 #3** — Supabase Apple provider (unblocks the sign-in button).
5. **P1 #5–6** — legal pages hosted + URLs set, then App Store Connect metadata → submittable.
6. **P2** — resolve the photo decision (#7) and the deletion-completeness call (#8) before public.

## Ticket index

- `TERMINAL_HANDOFF.md` — **this file** (start here)
- `TERMINAL_TICKET_FUNCTIONAL_FIXES.md` — recipe save (resolved), video, photo (Task 3), **collab schema (Task 4)**
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
| App version | `1.0.5` (EAS auto-increments buildNumber) |
