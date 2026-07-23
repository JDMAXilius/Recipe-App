# rebuild/v2 → main — cutover PR

**Title:**
`Rebuild v2: full v1 parity + shared kitchen, reviewed & native-verified`

**Body:**

Cuts the feature-first `rebuild/v2` over to `main`. 76 commits; the app now
matches the Figma master board across every screen, adds a real multi-user
feature, and is reviewed + native-verified. tsc · eslint · 210 tests green.

## What changed

### UI/UX fidelity restored to v1 / Figma
- **Wave F1** — icons→Ionicons, haptics re-wired (~60 sites), Otto mascot
  loading/empty/error states, nav shell (`fullScreenGestureEnabled`, back
  buttons, safe-area), and the Recipe Detail **nutrition card** rebuilt
  (scope toggle, segmented macro bar, % of cals).
- **Wave F2** — Discover (Ask-Otto band, Otto's-pick hero overlay, cuisine
  filter), Add (4-tile grid, paste-text import, device photo upload), Plan
  (dish thumbnails, inline icon actions), Shopping (notepad, persistence,
  source chips, share, cross-off), Account (editable name+avatar, sections),
  the ＋ tab → Chat-with-Otto (recent chats), Otto Club screen, Cookbook
  segments, and the settings/FAQ/Household/Journal screens.
- **Cards** — computed per-recipe calories (batched from `seed_nutrition`) +
  macro dots, on Discover and Cookbook.
- **Auth** — onboarding carousel + icon-row socials + centered titles, matched
  to Figma.

### Bugs fixed
- Email/password sign-in never navigated home (`(auth)` had no redirect guard).
- Recipe cards all showed a flat "~450" instead of the real figure.
- Shopping list stayed empty for a normal (seed-recipe) week; also fixed
  stale-on-empty and the notepad render.
- Cook: live ingredient scaling, cook-again rating, timer sound + vibration +
  keep-awake (native).

### New feature — Shared Kitchen (multi-user shared shopping list)
Households join by invite code; the shopping list aggregates every member's
week and check-offs + custom items sync in realtime. New tables
(`households`, `household_members`, `household_list_state`) under RLS +
`join_household` RPC + realtime. **Migrations included in
`supabase/migrations/` and already applied to the project.**

## Verification
- **Review swarm** (4-agent adversarial): caught + fixed the shared-list RLS
  not actually sharing, an invite-code bypass, non-finite scaling, and a
  title-centering regression. Cleared redirect loops, native guards, nutrition
  math, realtime cleanup as correct.
- **Device QA** (iOS sim): caught + fixed two native-only, ship-blocking bugs
  invisible on web — an `expo-asset` version conflict (unlinked `ExpoAsset`
  native module → launch crash) and a realtime channel-name collision (render
  error). App now builds + launches clean; Discover, Household, Shopping, and
  Cook all render natively.
- Zero new npm deps except the native cook modules (`expo-audio`,
  `expo-keep-awake`, with an `expo-asset` override pinning the SDK-54 version).

## Deploy notes
- ⚠️ `main` auto-deploys — merging this ships to production.
- Supabase migrations are already applied to the live project (via MCP);
  they're recorded in `supabase/migrations/` for history.
- Requires a **native rebuild** (new native modules): `expo-audio` +
  `expo-keep-awake`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
