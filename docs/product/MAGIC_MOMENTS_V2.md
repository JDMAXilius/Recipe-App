# Magic moments v2 — Snap any dish · Otto plans your week

Status: draft · planning only · written 2026-11-05 · source: Juan (2026-11-05), building on `docs/learning/reports/Otto magic moment research.md` and `docs/learning/reports/Otto AI agent research.md`. Decision record: ADR-0013 (Proposed).

## What changed
Juan's direction, 2026-11-05:
1. **The headline magic moment is "Snap any dish."** Take a picture of any meal and Otto breaks it down into a recipe: the dish, its ingredients, the steps, the servings and honest nutrition. It reconstructs the dish rather than copying anyone's recipe.
2. **The second magic moment is "Otto plans your week."** Otto builds the week from the 795 catalogue recipes or writes new ones, and answers requests like "something in 30 minutes".
3. **Meals are a free, dynamic list.** Nothing is fixed to breakfast, lunch or dinner up front. You add things to a day, and optional labels (breakfast, lunch, dinner, snack or your own) come later if you want them.
4. **AI recipes get an image.** Otto reuses a matching catalogue image when one exists, and otherwise generates one with OpenAI.
5. **Minimal and free.** Fewer required steps; Otto does it, then you adjust ("want to switch this?").

This **replaces** the earlier plan, in which "Tonight is answered" (no AI, before the paywall) was moment 1 and the photo came last in 1.4. "Tonight" survives as the Home card, not as the headline.

## The two moments, designed

### 1. Snap any dish
```
camera → "Otto sees: rice, black beans, grilled chicken, lime" (editable chips)
       → at most 2 questions: "about how much rice?" · "cooked with oil or butter?"
       → the recipe: title, servings, ingredients with amounts, steps, ~nutrition with a range
       → Save · Add to a day · Cook it
```
- **What the AI does:** OpenAI vision names the dish and its parts, then writes a plausible recipe for them (amounts, steps). It never writes the calories.
- **What Otto computes:** nutrition, on the phone, from the USDA engine and the ingredient list, shown as `~` with a range. This keeps the honesty law, and avoids the documented undercount: photo-only apps miss about a third of the calories.
- **What Otto checks first:** the closest of the 795 catalogue recipes ("This looks like Otto's chicken burrito bowl · Use it · Make my own").
- **The image:** the user's own photo becomes the recipe image, because it's their dish.
- **Rules:** consent naming OpenAI comes before the first scan. Photos are stripped of location and not kept on the server. A "hide numbers" setting is available.

### 2. Otto plans your week
- **Ask in any form:** typed or spoken. "Plan my week, nothing over 30 minutes, tacos on Friday."
- **What happens:**
  1. Otto picks from the catalogue first, using allergy and skip filters enforced in code.
  2. It writes a new recipe only where nothing fits.
  3. It shows the week as a preview card, which you commit with one tap.
- **Changes later:** single changes ("swap Thursday") happen at once, with Undo.
- **"30 minutes" needs real times.** The catalogue has none today (`canonical` has no time field). See ticket R0.14.

### Free meal lists
- A day holds an ordered list of items, not slots. Each item can carry an optional label: breakfast, lunch, dinner, snack or custom.
- Otto may suggest a label ("this looks like breakfast · label it?") but never requires one.
- **Tonight card:** shows today's item labelled dinner, or else the last item of the day.
- **Calendar export:** uses the label and an optional time when present, and otherwise makes an all-day item.

## Where the photo moment sits with a hard paywall
The photo needs AI, and the AI needs consent, a network call and a cost (about $0.002–0.02 per scan, estimated). Three options:

| Option | Flow | Trade-off |
|---|---|---|
| **A (recommended)** | Welcome → "Snap any dish" → consent → breakdown, before any account. Saving it needs Save your plan (account), then the paywall | The magic happens first, Cal AI–style but honest. Needs a device-scoped limit (3 scans before an account) checked by Apple's DeviceCheck/App Attest in the edge function, so the endpoint can't be abused the way `canonicalize` can today |
| B | The three questions → week reveal (no AI) → account → paywall → "You're all set · snap any dish" | No AI before payment; most trials still start that day. The photo is the first thing a new member does, not what sells the trial |
| C | Welcome offers both doors: "Snap a dish" and "Plan my week" | Most freedom, but two first impressions to build and measure |

ADR-0009 (value before the account) still holds under A and B. ADR-0005 (hard paywall) holds under all three: nothing is saved or used beyond the demo without an account and Otto Club.

## Two conflicts with earlier decisions, which Juan has to resolve
1. **AI food images.** The 2026-07-21 decision says: "no AI food photography presented as real, ever — Otto placeholder art for imageless recipes" (`docs/history/REDESIGN_NOTES.md:718`).
   - **Recommendation:** generated images are illustrations in Otto's painted style, the same look as `assets/food/cat-*`, labelled "Illustration".
   - Never photoreal, never shown as the user's dish. A real photo (the user's, or a catalogue photo) always wins.
   - This keeps the rule's intent and gives every recipe a picture.
2. **Breakfast and lunch.** The AI plan rejected breakfast and lunch planning for now, to keep "Tonight" sharp. Juan's free list replaces that: no fixed slots, optional labels. The `meal` column (G-9) becomes an optional `label`, and Tonight logic follows the label.

## What it means for the build
- **Moves earlier:**
  - Photo breakdown (R6.5) moves from 1.4 to the first-run release.
  - The image pipeline (R0.15) and cook times (R0.14) join Foundations.
  - Free lists change R0.10.
- **Merges:** "Otto plans your week" is the agent's `plan_week` tool with the preview card. It moves to the headline of 1.2.
- **New measures:**
  - `dish_snapped` → `recipe_from_photo_saved`: the photo moment.
  - `week_planned_by_otto` → `item_cooked`: the planning moment.
  - The North Star stays "planned items cooked per household per week".
