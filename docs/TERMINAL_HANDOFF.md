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
- **⚠️ Schema gotcha (bit us twice):** the repo pushes DB schema via **idempotent scripts in
  `backend/scripts/`, not a live migration journal.** Any new table/column in `backend/src/db/schema.js`
  needs a matching script **run against prod**, or it works locally and silently 500s in production.

---

## Open items — priority order

### P0 — features broken/unverified on device

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 1 | **Shared list** — schema + join path fixed, **device test outstanding** | Terminal + device | Schema ✅ (`s3-collab-schema.mjs` on prod). Join path ✅ (`bd3f2553`): the paste box rejected valid invites (trailing slash / `?utm_source=` / text after the link) and a joiner shared an invite with **no link in it**. Plus a local "Lists you've been in" rejoin row. **All unit/web-verified only — the two-account join has never run on a device.** | `TERMINAL_TICKET_FUNCTIONAL_FIXES.md` Task 4 + 4b |
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
| 3 | ~~**Supabase OAuth providers**~~ | Founder + consoles | ✅ **DONE 2026-07-18** — Apple + Google + Facebook all enabled on Supabase; verified `external.{apple,google,facebook}=true`. Apple = native (bundle id as client id, no secret); Google = web client (consent screen in Testing mode); Facebook = "Login for Business" app in Dev mode. Device tap-test pending on build 19. | `TERMINAL_TICKET_OAUTH_PROVIDERS.md` |
| 4 | ~~**`SUPABASE_SERVICE_ROLE_KEY` on the backend**~~ | Backend env | ✅ **DONE 2026-07-19** — set on Railway (using the new `sb_secret_` key; supabase-js 2.110.5 supports it). Verified backend healthy + key has GoTrue admin (admin/users → 200). Device-confirm the delete returns `authUserDeleted:true`. NOTE: key was pasted in chat — rotate it. | `PRE_LAUNCH_CHECKLIST.md` §A |
| 5 | **Host privacy policy + terms**, then set `PRIVACY_URL` / `TERMS_URL` in `mobile/app/(tabs)/profile.jsx` (rows light up automatically). Use `docs/legal/*.html`. | Founder host + 2-line edit | Drafted | `docs/legal/`, `PRE_LAUNCH_CHECKLIST.md` §B |
| 6 | **App Store Connect metadata**: screenshots (6.7"), description, keywords, category (Food & Drink), **App Privacy answers** (pre-filled table), support URL, demo account for review. | Founder + console | **Copy drafted** — name/subtitle/promo/keywords/description/What's New all written and character-counted; screenshots, demo credentials and the getotto.app URLs still needed | `docs/APP_STORE_LISTING.md`, `PRE_LAUNCH_CHECKLIST.md` §B |

### P2 — decisions / polish

| # | Item | Owner | Status | Detail |
|---|---|---|---|---|
| 7 | **Recipe photo: paste-a-link (current) vs device upload?** Founder decision; if upload → image picker + Supabase Storage → `recipe.image`. | Founder decision → Terminal | Awaiting decision | Functional-fixes Task 3 |
| 8 | ~~**Account-deletion completeness**~~ | Backend | ✅ **DONE 2026-07-19** — `DELETE /api/account` now also wipes `recipe_shares`, `list_shares`, and owned `collab_lists`/`collab_items`. Owned shared lists die with the owner (no member registry to transfer to); joined lists untouched. Source-level test guards against forgetting the next table. | `PRE_LAUNCH_CHECKLIST.md` §C |
| 9 | `RATE_APP_URL` / `TELL_A_FRIEND_URL` in `profile.jsx` once the App Store listing URL exists (rows stay hidden until real). | Founder | Open | `PRE_LAUNCH_CHECKLIST.md` §C |
| 10 | ~~**Tidy unused splash assets**~~ | Optional | ✅ **DONE** — removed `otto-splash.{mp4,png,cut.png}`; only the matted `.webp` remains. | — |

---

## Suggested order for the terminal

Everything repo-side that can be done without a device or a console **is done**. What remains is
one device session, one website, and console work:

1. **One device session, four things at once** (P0.1 + P0.2 + the OAuth tap-test): pull the next
   build, then — two-account shared-list join *including the joiner re-sharing the invite*; the four
   v1.0.5 fixes (pad frame, splash, alarm, YouTube); each visible social button end to end; and
   confirm delete-account returns `authUserDeleted: true`.
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
