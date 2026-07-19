# App Store screenshots — 6.7" (1290×2796)

Real device captures from the shipping app. **Not mockups.**

Captured 2026-07-19 · iPhone 15 Pro Max simulator · iOS 26.0 · **Release** build · status bar
pinned to 9:41.

| File | Screen | Notes |
|---|---|---|
| `discover.png` | Discover feed | Signed in, plan populated so the "what's cooking tonight" band is live |
| `detail.png` | Recipe detail | 52772 Teriyaki Chicken Casserole, scrolled to Nutrition |
| `cook.png` | Cook mode | 52772, step 4 of 9, with Otto's per-step action art |
| `plan.png` | Otto's week | Two dishes today, showing the swap / leftovers / remove row |
| `signup.png` | Sign up | Signed out. Social row is three icon buttons, not stacked buttons |

Composited into the Master Board at
`figma.com/design/mM0uWkHod9rL1Ff1VJ64Au` → *Otto · App Store Launch Kit* → section 4B.
The previous Figma clones are kept there as **4B · ARCHIVE**.

## Why these replaced the old ones

The Master Board's five shots were **Figma clones of app screens**, not captures. Nothing linked
them to the code, so they drifted silently as the app changed. Twenty-five commits touched
`mobile/app` and `mobile/components` between the board being built (2026-07-15) and this recapture.

The clearest drift: the **sign-up screen was redesigned** from three stacked full-width
"Continue with Apple / Google / Facebook" buttons to a compact row of three brand icon buttons
(`2f970c57`, `cafaa196`, `07ff0d6a`). The old shot advertised a screen that no longer exists.

The plan screen also predated leftovers days and one-tap swap (`c043227e`), and headers changed
app-wide (`b78ee324`, `5ed6f474`).

## Re-capturing

```bash
cd mobile
npx expo run:ios --configuration Release --device "iPhone 15 Pro Max"
bash ../docs/store-screenshots/capture.sh
```

`capture.sh` drives the app by deep link and captures each screen. `inject_session.py` seeds
AsyncStorage so the simulator launches in a known state — onboarding skipped, and signed in or out
as each shot requires.

**Two things the script depends on:**

- **A Release build.** A dev build shows the expo-dev-client launcher and dev-menu modal, neither of
  which can appear in a store screenshot.
- **Being signed out for `signup`.** `app/(auth)/_layout.jsx` redirects fully-registered users to
  `/`, so deep-linking to `/sign-up` while signed in silently lands on Discover. The script captures
  it first, before injecting a session.

The session comes from `session.json` — a Supabase password-grant response for the E2E test user.
That file is **not committed**; regenerate it before running.

## Re-capture whenever a screen changes

That is the whole point. The old set was accurate on the day it was made and had no way to stay
accurate. These do not self-update either — but they take five minutes to redo, and the script
records exactly how.
