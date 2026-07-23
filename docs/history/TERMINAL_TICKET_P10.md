# 🎟️ Terminal Build Ticket — P10: Onboarding · Splash · Auth SSO · Discover-social seed

> Founder-approved batch (2026-07-15, "yes to all"). Build in this order. All specs already in
> the repo — this ticket is the checklist + the cloud-session handoffs (asset downloads, video gen)
> that couldn't complete remotely. Light-only · Otto locked to hero `5f74831c-0126-44d0-9dd8-731d331fb75a`
> · honesty rules apply (no fake data, estimate framing, real providers only).

## 0. First — pull the generated art (CDN was blocked in the cloud session)
Download each URL and commit at the path in the manifest, then `upscale_image`→2K optional.
- `mobile/assets/onboarding/README.md` → `onboarding-1-collect.png` (`52c078e5`), `onboarding-2-cook.png` (`44b0d5b4`), `onboarding-3-plan.png` (`ce3750fb`)
- `mobile/assets/splash/README.md` → `otto-splash.png` (`3411c1ab`)
- ⚠️ Links can expire — do this first. If any expired, regenerate with the briefs' prompts (pass the hero ref, 2 takes).

## 1. Onboarding — 3-screen showcase 🟢 (spec: `docs/ONBOARDING_BRIEF.md`, `SCREEN_MAP §B`)
- Swipeable carousel, 3 screens (B1 collect → B2 cook → B3 plan), 3 progress dots, **Skip** top-right, primary CTA (B3 = "Start cooking" → Discover).
- Real copy in the brief's copy table. Tokens only (`cream` bg, `terracotta` CTA, `ink`). Respect reduced-motion.
- **Plan confirmed at launch → keep all 3 screens.** No quiz, no account wall, no "tailored just for you."
- Ends anonymous in Discover; account is asked later, only on first save.

## 2. Splash 🟢 (spec: `docs/SPLASH_BRIEF.md`, `SCREEN_MAP §A1`)
- **Still (now):** set `otto-splash.png` as native splash — `app.json` `splash` = image, `backgroundColor:"#FAF4EA"`, `resizeMode:"contain"`; export the iOS sizes. Composite the "Otto" wordmark (Lora) in-app over the reserved lower third.
- **Video (fast-follow, approved):** `generate_video` image-to-video, **seed = `3411c1ab`**, storyboard + prompt in `SPLASH_BRIEF §7` ("lid-lift → steam becomes wordmark"). 2.5s, plays once after mount → dissolve to app; tap-skip + reduced-motion → still only. Last frame must match the still pixel-for-pixel. Commit + add a manifest row.

## 3. Auth — real social sign-in 🟢 (spec: `SCREEN_MAP §A3/A4`)
- Add **Apple · Google · Facebook** rows (brand icons), same order on sign-up + sign-in, above an "or" divider over the existing email/password form.
- **Wire for real in Supabase Auth** + Expo native config: `expo-apple-authentication` (Apple), `expo-auth-session`/native (Google), Facebook SDK (Meta). **Do not ship a button that isn't wired.**
- Apple **first** (App Store 4.8 requires it when offering Google/Facebook). Facebook is optional — build if in scope, it's the first to cut.
- Keep the approved auth copy ("Pull up a stool." / "Back to the kitchen?").

## 4. Discover-social — v1 SEED ONLY 🟢 (spec: `docs/DISCOVER_SOCIAL_EXPLORATION.md`)
**Build now (cheap seed):**
- Add a **`visibility`** field (private default) to user-created/imported recipes (Supabase).
- Show **author attribution** on user recipes: "By you" (later "By {name}") on detail + card.
**Do NOT build now:** public feed, ratings, comments, profiles — that's Phase 2 (needs the App Store 1.2 moderation kit + volume). Adopt for Phase 2: **cook-then-rate** ("★ from N cooks", rate only after Cook Mode) + **curated "From the Otto kitchen"** re-feature before any algorithm.

## 5. Plan at launch 🟢 (was 🟣)
- Founder confirmed Plan is v1. Planner + Shopping list (`SCREEN_MAP §G`) are in launch scope; **ship ungated**, gate under Otto Club when IAP opens. Don't block launch on IAP.

## Guardrails
- Coordinate via git (fetch + rebase before push). Commit-message trailers as per repo convention.
- Don't re-introduce the reverted rules: SSO rows and ratings-on-UGC are **now allowed** (v2), but ratings on TheMealDB seed recipes stay banned (no source data).
- When Mobbin is re-authed, pull the 3 gaps before their builds: splash/launch screens, report/block flow, public-profile/cookbook layout.

*Cloud co-pilot holds: research/specs/review. This ticket is the code/asset handoff.*
