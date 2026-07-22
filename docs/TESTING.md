# Otto — Testing Strategy

Permanent doc: written for the rebuild, outlives it as the app's testing
reference. The core idea from TestFlight QA 2026-07-21: **a kcal that looks
right can hide fabricated macros — assert on the breakdown, never the
headline number alone.** Every layer below inherits that lesson.

## The pyramid

| Layer | What | Runs where | When |
|---|---|---|---|
| **L1 Unit** | engine + pure libs: golden nutrition recipes, macro-split (P/C/F) regressions, parsers, scaling | cloud agents + terminal, `node --test` | every packet |
| **L2 Static** | tsc + eslint | cloud agents | every packet |
| **L3 Browser** | journey smoke on Expo **web** (`:8081`) | **both sessions** — cloud: headless Chromium/Playwright · terminal: Chrome MCP (visible, DevTools) | every feature packet + M3/M5 gates |
| **L4 Native** | simulator/device: everything web can't see | **terminal only** | M4 hard gate + spot checks |

L3 shrinks what L4 must check; it never replaces it. Nothing merges to main
without the L4 pass.

## L1 — the honesty-law suites

- Golden nutrition tests pin known recipes end-to-end.
- Macro-breakdown tests assert protein/carbs/fat ranges per recipe
  (`backend/test/macroBreakdown.test.mjs` today; ports with the engine).
- Rule for new tests: **any nutrition assertion must cover the macro split.**
  kcal-only assertions are rejected in review — that's the exact blind spot
  that shipped the phantom-carbs card.
- During the rebuild these suites run against BOTH trees: old code (source of
  truth) and the TS port (must match). Divergence = port bug, by definition.

## L3 — browser journeys

**Contract:** journey scripts live in `e2e/journeys/*.ts`, owned like any
other folder (one owner; changes via packet). One journey per feature packet
minimum, plus the full-app smoke:

```
browse → open recipe → save (paw) → plan week → build shopping list → check item → cook mode
```

**Harness split — same scripts, two drivers:**

- Cloud: boots `expo start --web` in the packet's worktree, drives headless
  Chromium (Playwright, preinstalled), collects
  `{console_errors[], failed_assertions[], screenshots[]}` into the
  report-back.
- Terminal: same journeys through Chrome MCP in a visible browser when a
  failure needs human-speed debugging (network tab, poking state).

**Rules:**

- **Any console error fails the journey** — not just broken assertions.
  Silent red consoles are how web bugs ship.
- Journeys assert real values from fixtures, not just element presence.
  Canonical example: the garlic-butter-chicken fixture must render
  **415 kcal · 2.7 g carbs** — if the category template's phantom 20 g ever
  returns, a browser test catches it on pixels, not in code review.
- Screenshots ride along in every report-back; failures are seen, not
  described.

**What L3 catches:** routing, data flow, Supabase queries under RLS, state
bugs, console errors, layout regressions, honest numbers on screen.

## L4 — native-only checklist (terminal, simulator + device)

Web cannot see these; every M4 pass walks this list:

- haptics · native video playback · share intents/sheet · push notifications
- Apple/Google sign-in · IAP (when live) · keep-awake in cook mode
- reanimated native-path behavior (web build skips layout anims by design)
- safe-area/notch quirks · cold-start splash (still + lid-lift video)
- real-device performance feel (scroll, cook-mode swipes)

Plus: `expo prebuild` clean, EAS build succeeds, TestFlight upload.

## Credentials policy

- **Publishable anon key** (`EXPO_PUBLIC_SUPABASE_URL` + anon key): designed
  by Supabase to ship in clients — it's in every IPA already; **RLS is the
  security boundary, not key secrecy.** Decision pending (REBUILD_STATE.md)
  to commit it in `.env.development` so cloud L3 runs anonymous journeys
  autonomously.
- **Test user** (`otto-e2e@…`): password lives ONLY in terminal/EAS secrets.
  Authed journeys (save/plan/shop) run on terminal; cloud runs them only if
  the founder later provides the secret to the cloud environment.
- **Service-role key: never** in the app, never in tests, never in cloud.
  Edge functions only.
- Test data: fixtures under `e2e/fixtures/`; the e2e user's rows are
  disposable and reset by journey setup.

## During the rebuild specifically

- v1 suites (backend 101 / mobile 53 today) keep running on `main` and on
  `rebuild/v2` until cutover — they are the pinning source for every port.
- A packet's verifier runs L1+L2 always, L3 when the packet has a screen.
- Gate M4 = review loop dry twice → this doc's L4 checklist → founder.
