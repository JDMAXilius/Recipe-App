# ⚙️ APP-CONFIG (template) — fill one per app

> Copy to `APP-CONFIG.md` and replace every `{{…}}`. This is the **context** the master prompt
> consumes. Fill it from the app's real code + brand — the board mirrors this, so garbage in = garbage
> board. See `EXAMPLE-otto.md` for a completed one.

---

## 1. Identity
- **App name:** {{APP_NAME}}
- **One-liner:** {{TAGLINE}}  *(what it does, in one sentence)*
- **Platform:** {{PLATFORM}}  *(iOS / Android / web / RN-Expo …)*
- **Device frame width for screens:** {{DEVICE_WIDTH}}  *(default 393)*
- **Niche / category:** {{CATEGORY}}

## 2. Source of truth (paths in the repo — the board mirrors these)
- **Color tokens:** {{PATH_COLORS}}
- **Non-color tokens (spacing/radius/type/motion):** {{PATH_TOKENS}}
- **Screen map / IA doc:** {{PATH_SCREENMAP}}  *(if none, write one first)*
- **Components dir:** {{PATH_COMPONENTS}}
- **Assets dir:** {{PATH_ASSETS}}

## 3. Foundations (from the token files)
- **Color tokens** (name · hex · usage note), incl. any **fixed/functional** colors that never
  re-skin (e.g. data-viz):
  {{COLOR_TOKENS}}
- **Type scale** (role · family · size/line · usage): {{TYPE_SCALE}}
- **Spacing scale:** {{SPACING}}
- **Radius scale:** {{RADIUS}}
- **Elevation / overlay:** {{OVERLAY}}
- **Motion** (named springs/durations — documented, not animated): {{MOTION}}
- **Theming:** {{THEME_MODE}}  *(single light-only? light+dark? note which the board renders)*

## 4. Brand & voice
- **Logo / wordmark:** {{WORDMARK}}  *(files + lockup rules)*
- **Voice** (3–5 adjectives + do/don't): {{VOICE}}
- **Copy laws / honesty constraints** (app-specific — what the UI may NOT imply): {{HONESTY_LAWS}}
- **Conventions we deliberately break:** {{BROKEN_CONVENTIONS}}

## 5. Mascot / illustration (optional — delete block if none)
- **Character:** {{MASCOT_NAME}} — {{MASCOT_DESC}}
- **Locked reference / bible path:** {{MASCOT_BIBLE}}
- **Expression/scene → app-state map:** {{MASCOT_STATE_MAP}}
- **Placement rules:** {{MASCOT_PLACEMENT}}

## 6. Information architecture
- **Navigation model:** {{NAV_MODEL}}  *(e.g. 5-tab bar: … · … · … )*
- **Tabs / primary destinations:** {{TABS}}
- **Premium/gating note:** {{GATING}}  *(what's free vs paid, or "all ungated")*

## 7. Screen inventory (drives Pages 2's wireframes + screens)
For each screen: `Area · Name · built?/placeholder · content blocks top→bottom`.
Group by area (Launch/Auth, <core areas>, Account, Supporting states, Future).
{{SCREEN_LIST}}

## 8. Core features → screens (traceability, drives User Flows page)
{{FEATURE_MAP}}

## 9. Flows to diagram (Page 3)
List the 3–6 critical journeys (activation, core loop, money path, …):
{{FLOWS}}

## 10. Which pages to build
{{PAGES_TO_BUILD}}  *(default: all 6 — Design System · App Map+Wireframes+Screens · User Flows ·
App Store Kit · Brand & Voice · Strategy Review. Drop any you don't need.)*

## 11. Figma target
- **New file** named `{{APP_NAME}} — Master Board` (recommended), or existing file key {{FILE_KEY}}.
- **Existing library to reuse:** {{EXISTING_LIBRARY}}  *(or "none")*
