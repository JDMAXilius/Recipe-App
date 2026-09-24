# App Store screenshots — 6.9" (1320×2868)

Real simulator captures of the shipping app. **Not mockups.** These are the files uploaded to
App Store Connect on 2026-09-24 for version 1.0.19 (build 37).

Captured on the iPhone 17 Pro Max simulator · iOS 26.0 · **Release** configuration build ·
signed in as the e2e test account, with a seeded week plan so nothing shows an empty state.

| File | Screen | Caption (listing) |
|---|---|---|
| `1-bring-in-a-recipe.png` | `/add` | Paste a link. Otto reads the recipe. |
| `2-cook-one-step-at-a-time.png` | `/recipe/cook/52772` | Cook one step at a time. |
| `3-plan-the-week.png` | `/plan` (seeded: 3 dishes) | Plan the week you'll actually cook. |
| `4-shopping-list-builds-itself.png` | `/shopping` after "Build my shopping list" | The list builds itself from the plan. |
| `5-every-recipe-you-love.png` | Discover, with tonight's dish band | Every recipe you love, in one place. |
| `6-ask-otto.png` | Chat with Otto, empty prompt | Ask Otto while you cook. |
| `7-otto-club-paywall.png` | `/otto-club` | Review screenshot on both subscriptions (not a listing shot) |

Only the 6.9" set is required in 2026; App Store Connect scales it to smaller iPhones. The older
6.5" set (1290×2796, 2026-07-19) lives in `docs/history/captures/store-screenshots/`.

## Re-capturing

Everything is driven by deep link, so no touch automation is needed. The two things that matter:

1. **A Release build with env vars.** A dev-client build shows the expo-dev-client launcher, the
   dev-menu sheet, and RevenueCat's console-error toast — none of which can appear in a store shot.
   A local Release build only picks up `.env.production` (Expo loads `.env.<NODE_ENV>`), and that
   file is gitignored on purpose (`.gitignore` allow-lists only `.env.development`). Copy
   `.env.development` to `.env.production` locally first — same public values.
   ```bash
   cp .env.development .env.production
   npx expo run:ios --device "iPhone 17 Pro Max" --scheme Otto --configuration Release
   ```
2. **A seeded, signed-in session.** `docs/history/captures/store-screenshots/inject_session.py`
   writes a Supabase session straight into the simulator's AsyncStorage, skipping the sign-in
   UI (which is fragile to automate). It reads `session.json` from its own folder — a password-grant
   response for the e2e user, regenerated each time and gitignored:
   ```bash
   curl -s "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
     -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
     -d '{"email":"claude-e2e-a@example.com","password":"<see .claude/skills/otto-lead/SKILL.md>"}' \
     > docs/history/captures/store-screenshots/session.json
   ```
   The e2e account has 3 plan entries (Teriyaki Chicken Casserole, Apple Frangipan Tart,
   Pad See Ew) and 3 favorites seeded in production — enough for Plan, Shopping and Cookbook to
   render populated.

Then `bash docs/release/store-screenshots/capture.sh`.

The URL scheme is `otto://` (`app.json` → `scheme`), not the `mobile://` the July script used.

## Known limits

- The paywall shot shows the honest "Otto Club opens soon" fallback below the fold: the
  simulator has no StoreKit configuration, so RevenueCat can't fetch live offerings there. The
  visible top half (plans, prices, trial timeline) is accurate. A capture with the real purchase
  button needs a device sandbox purchase (roadmap APP-4).
- Chat shows the empty prompt, not a conversation: the composer's TextInput isn't reachable by
  Maestro's text matcher. Typing through the UI needs a coordinate tap; not worth it for one shot.
