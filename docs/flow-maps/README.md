# Flow maps

Researched and built 2026-11-03. Open any `.html` in a browser (they need internet for Google Fonts only).

## Maps (`maps/`)
| File | What |
|---|---|
| `otto.html` | **Otto today** — every route, who can open it (guards in `app/_layout.tsx`), every navigation call. Branch `fix/1.0.23`. |
| `otto-next.html` | **Otto, redesigned — current (2026-11-04).** one canvas drawn like the Yazio study map (PlanFuel file, page 13, “07 · Flow map”): a card per screen with a wireframe thumb, one column per stage, labelled dashed branches, returning people and tab links in their own lanes. Entry → Welcome · sign in → About you → Your plan → Account + reminders → Otto Club (no X) → Tab bar (4) → Home · Recipe + cook · Plan · Cookbook · Account. Plus why / every state / what changes. Standalone. Also in Figma: “Otto — App Redesign” → page “Flow map — Otto next (current)” (https://www.figma.com/design/r9QxxN5qDQXjW473H7LKgM?node-id=40-9), built from a `Flow card` component + 20 `Thumb/*` components. |
| `otto-next-v2.html` | **Otto, redesigned — previous, kept for comparison.** The version before the Yazio-style rework: two maps (launch + first run, the app) with a “Club active?” decision box, reminders after the purchase, account before the plan reveal. Also in Figma: page “Flow map — Otto next (previous)” (https://www.figma.com/design/r9QxxN5qDQXjW473H7LKgM?node-id=49-7). |
| `apple.html` | The flow Apple's HIG + Review Guidelines describe: three entry points, launch, onboarding, permission, paywall, tabs, later asks |
| `duolingo.html` · `calai.html` · `mfp.html` · `tiimo.html` · `headspace.html` · `cherrypick.html` | Real first-run flows of reference apps, screen by screen |
| `field-guide.html` | One page with tabs: overview strip comparing where each app puts account / paywall / permissions, the scenario lanes, and smaller per-app maps |

Each canvas map: columns are stages in that app's own order, solid arrow = next screen, dashed = optional / skip / back. Tap a screen to trace its paths.

Published copies (private to Juan): Otto https://claude.ai/artifact/BugVkXp1u6y3Xp38oWvRZL · Apple https://claude.ai/artifact/KpcdiUs2LQXAdyzA942dQ2 · Duolingo https://claude.ai/artifact/JV8XKGyCDPGkjEccB9EEq6 · Cal AI https://claude.ai/artifact/Vht8aTMb2R78tdm1PXwbp1 · MyFitnessPal https://claude.ai/artifact/E7JLFtWwk9h1axMcsCpRch · Tiimo https://claude.ai/artifact/VEsHW2qiEosWnyv4BfANeA · Headspace https://claude.ai/artifact/WrAhTKT9rsDtcBmVBQXoMA · Cherrypick https://claude.ai/artifact/KK3MWf9VUCy4LJTxBxmnUE · Field guide https://claude.ai/artifact/JSuzN3ThPSfQ8aHAs667ti

## Research (`research/`)
1. `01_APPLE_AND_INDUSTRY_RULES.md` — HIG + Review Guideline rules that shape a flow, notation, conversion evidence, the 23-scenario checklist
2. `02_REFERENCE_APP_FLOWS.md` — screen-by-screen sequences + cross-app comparison table
3. `03_FIGMA_STUDY_FILE.md` — inventory of the PlanFuel Mobbin study file with node ids

## Regenerating the reference maps (`build/`)
`node docs/flow-maps/build/build.mjs` rewrites `maps/{apple,duolingo,…}.html` from the data in `build.mjs` + `template.html`. `otto.html` and `field-guide.html` are standalone.

## Known limits
Mobbin returns ~5 sampled screens per flow, so Headspace positions are approximate. MyFitnessPal's Premium screen is from a newer version than the rest of its flow. No core-action loop was captured for Tiimo, Headspace or Cherrypick.
