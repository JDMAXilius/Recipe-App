# 🛍️ App Store Connect — listing copy (draft to paste)

> Everything App Store Connect asks for in text form, written to Otto's voice and to what the app
> **actually does today**. Nothing here promises a feature that isn't shipped — no Otto Club, no
> ratings, no Instagram Stories share.
>
> **App Privacy answers are NOT here** — they're already filled in `PRE_LAUNCH_CHECKLIST.md` §B.
> Character counts below are Apple's hard limits and are verified in this file's footer.

---

## App name (30 max)

```
Otto — Recipes & Meal Plans
```

*Fallback if the em dash renders oddly in search:* `Otto: Recipes & Meal Plans`

## Subtitle (30 max)

```
A quieter kind of cookbook
```

## Promotional text (170 max — editable without a new build)

```
Cook without the noise. Browse 750+ recipes, keep your own, plan the week, and share one shopping list with the people you actually live with.
```

## Keywords (100 max, comma-separated, NO spaces after commas)

```
recipe,cookbook,meal plan,grocery,shopping list,cooking,kitchen,dinner,weekly menu,pantry,groceries
```

> Rules applied: no word repeated from the app name or subtitle (Apple indexes those already), no
> competitor names, singular forms only — Apple matches plurals automatically.

## Description (4000 max)

```
Otto is a recipe app that doesn't shout at you.

No five-star ratings. No comment sections. No algorithm deciding what dinner should be. Just a warm, hand-painted cookbook led by Otto the otter chef — and a set of tools for the part that's actually hard: deciding what to cook, and getting it on the table.

BROWSE AND COOK
Search 750+ recipes with painted category tiles and a daily pick from Otto. Every recipe opens to a clean page: real photo, ingredients that scale to your serving count, US or metric, and method steps written to be read with your hands full.

Cook Mode turns any recipe into big-type steps you can follow across the kitchen. Tap a duration and it becomes a named timer — run several at once. Otto shows up along the way with a bit of hand-painted encouragement.

KEEP YOUR OWN
Save what you like with a tap of Otto's paw. Add your own recipes by hand, or paste a link and let Otto pull in the ingredients and steps. Your recipes sit alongside the rest, marked as yours.

PLAN THE WEEK
Drop dishes onto loose day buckets — no rigid breakfast/lunch/dinner grid, because that's not how most weeks go. Your plan rolls up into a shopping list grouped by aisle, with each item showing which recipe asked for it.

ONE LIST, WHOLE HOUSEHOLD
Start a shared shopping list and send the link to whoever's going to the shop. Everyone adds, everyone checks things off, everyone sees the same list. No accounts to manage, no invites to approve — the link is the membership, and you can put the list away for everyone when you're done.

HONEST ABOUT NUTRITION
Otto estimates calories and macros from USDA public-domain food data, and tells you when it isn't confident. It's a guide, not a guarantee, and Otto will say so rather than pretend to a precision it doesn't have.

SNAP YOUR PLATE
Finished something you're proud of? Photograph it. Plate photos stay on your device — they're never uploaded anywhere.

WHAT OTTO DOESN'T DO
No ads. No cross-app tracking. No selling your data. You can browse without an account, and when you do make one, deleting it removes your recipes, your plans, your lists and your login — properly, not just hidden.

Recipe data comes from TheMealDB.
```

## What's New (first release)

```
Otto's first release. Browse, cook, save, plan the week, and share a shopping list with your household — quietly.
```

## Categories

- **Primary:** Food & Drink
- **Secondary:** Lifestyle

## Age rating

**4+.** No objectionable content. Flag in the questionnaire: user-generated content (a user's own
recipes) and web links (recipe video playback + link import). Otto has no public feed, no comments,
and no user-to-user discovery, so the UGC moderation requirements for social apps don't apply — say
so plainly if review asks.

## URLs

| Field | Value | Status |
|---|---|---|
| Support URL | `https://getotto.app/support` | ⛔ pending the website |
| Marketing URL | `https://getotto.app` | ⛔ pending the website |
| Privacy Policy URL | `https://getotto.app/privacy` | ⛔ **required to submit** |

## App Review notes (paste into "Notes")

```
Otto can be browsed without an account. Signing in is only required to save a recipe, plan a week, or use a shared shopping list.

Demo account:
  Email: [FILL IN]
  Password: [FILL IN]

Notes for testing:
- "Sign in with Apple" is live. Google and Facebook buttons appear only when those providers are enabled server-side, so you may see fewer buttons than the screenshots show — this is intentional, not a broken flow.
- Shared shopping lists work by invite link. To test both sides you'd need two accounts; the demo account above already owns a list with items in it.
- Plate photos in the cooking journal are stored on-device only and are never uploaded.
- Nutrition figures are estimates computed from USDA public-domain data, labelled as estimates in-app.
```

## Screenshot shot-list (6.7" required — 1290 x 2796)

Capture on a real device or the 6.7" simulator, in this order — the first two carry the most weight
in search results:

1. **Discover** — category tiles + Otto's pick hero. Caption: "A cookbook that doesn't shout."
2. **Recipe detail** — photo hero, scaled ingredients. Caption: "Scales to your table."
3. **Cook Mode** — big-type step with a running timer. Caption: "Big type. Real timers."
4. **Planner** — the week with dishes dropped in. Caption: "Plan the week, loosely."
5. **Shopping list** — aisle-grouped with provenance. Caption: "Sorted by aisle. Knows why."
6. **Shared list** — the household view. Caption: "One list, whole household."

> The Figma Master Board (page 4, App Store launch kit) holds live clones of these screens —
> **re-capture from the app**, not from Figma, if the screens have changed since.

---

## Character counts (verified)

| Field | Used | Limit |
|---|---|---|
| App name | 27 | 30 |
| Subtitle | 26 | 30 |
| Promotional text | 142 | 170 |
| Keywords | 99 | 100 |
| Description | 2188 | 4000 |
| What's New | 113 | 4000 |

> Counted by code, not by eye. Keywords sit 1 under the cap — if you edit that line, re-count.
