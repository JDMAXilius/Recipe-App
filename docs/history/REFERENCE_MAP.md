# 🔎 Reference Map — grounding the design in professional apps

> **Purpose.** Every sitemap node, wireframe, and design-system decision in this project should trace back to a real, professional app — not be invented from scratch. This file maps each of our decisions to the apps that do it well and to **exactly what to pull from Mobbin** (or the App Store) as a direct reference. Use it as a checklist: pull the real screen, compare against our draft, adjust ours to match the professional pattern.

**Last updated:** 2026-07-14
**Pairs with:** [`DESIGN_RESEARCH.md`](./DESIGN_RESEARCH.md) (the direction) and the low-fi wireframe artifact.

---

## How to use this file

1. Open **Mobbin** (or the App Store screenshots) for the apps named in each row.
2. Pull the referenced screen/flow as a **screenshot**.
3. Compare it against our wireframe/component of the same name.
4. Adjust ours toward the professional pattern — or note a deliberate reason to differ.

> **Honest caveat.** The app/pattern mappings below come from working knowledge of these apps, not live Mobbin captures. That's exactly why pulling the real screens matters — this map tells you *what to fetch*, it does not replace fetching it. When Mobbin's MCP is authorized (see note at the bottom), these can be pulled and verified directly in-session.

---

## 1. Sitemap / information architecture

| Our decision | Direct reference (pro apps) | On Mobbin, pull |
|---|---|---|
| 4-tab bar: Recipes · Search · Saved · Profile | **Lifesum, MyFitnessPal, Kitchen Stories** | App → Home / tab-bar flows |
| Onboarding before auth | **Cal AI, Noom, Lifesum, Duolingo** | Screen category → *Onboarding* flows |
| Settings + logout live in Profile (not Saved) | **MyFitnessPal, Lifesum** (iOS grouped list) | App → Settings / Profile screens |
| Recipe Detail as full-screen push | **NYT Cooking, Tasty, Kitchen Stories** | App → recipe *Detail* screens |

## 2. Wireframes (per screen)

| Our screen | Direct reference | On Mobbin, pull |
|---|---|---|
| **Recipe Detail** (hero + nutrition card + steps) | **Kitchen Stories, Tasty, Samsung Food (Whisk)** | recipe detail + ingredients/nutrition flow |
| **Serving stepper / scaling** | **Tasty, NYT Cooking, Samsung Food, Kitchen Stories** | search "servings" / recipe-scaling flows |
| **Home** (featured + category chips + grid) | **Kitchen Stories, Yummly, Mealime** | App → Home / Discover |
| **Search + results** | **Yummly, NYT Cooking** | App → Search flows |
| **Filter bottom sheet** | **Airbnb (gold standard), Yummly** | search "filter sheet" pattern |
| **Saved / Favorites grid** | **Kitchen Stories, Pinterest** | App → Saved / Collections |
| **Empty & loading states** | **Duolingo, Headspace** (mascot-driven) | search "empty state" |

## 3. Design system (tokens & components)

| Our decision | Direct reference | On Mobbin, pull |
|---|---|---|
| **CalorieRing** | **MyFitnessPal, MacroFactor, Lifesum** | search "calorie ring / dashboard" |
| **MacroBars** (violet / amber / green) | **MacroFactor, Cronometer, Lifesum** | search "macros" — verify their exact color assignments |
| **RecipeCard** with calorie badge + macro dots | **Lifesum recipes, Samsung Food** | App → recipe cards / grid |
| **Mascot** (friendly, not childish) | **Yazio ("Yettie"), Duolingo ("Duo"), Noom** | App → *Yazio* / *Duolingo* onboarding |
| **Warm accent + calm neutral ground** | **Mealime, Kitchen Stories** (palettes) | App → any screen, sample the palette |
| **Native iOS feel** (SF Symbols, sheets, haptics) | **Apple's own apps, Things 3** | Apple HIG + app screens |

---

## Priority pulls (if you only grab four)

To validate the most important, highest-risk decisions first:
1. A **recipe Detail** screen — *Kitchen Stories* or *Tasty*
2. A **macro/nutrition dashboard** — *MyFitnessPal* or *MacroFactor* (confirm macro color convention)
3. A **serving-scaling** interaction — *NYT Cooking* or *Samsung Food*
4. A **filter bottom sheet** — *Airbnb*

Paste these and we do a side-by-side: our wireframe vs. the real screen, adjusting ours per decision.

---

## Note on pulling references directly (Mobbin MCP)

The Mobbin MCP is *registered* in the workspace but **requires OAuth authorization** before its tools can be used. That login must be completed interactively (a browser + a Mobbin account) via **claude.ai → Settings → Connectors** (or `/mcp` in a local terminal). A remote/non-interactive session cannot complete that flow. Once authorized, start a fresh session and the `mcp__mobbin__*` tools become available to pull flows directly. Until then, **screenshots are the reliable way** to feed Mobbin references into the design work.
