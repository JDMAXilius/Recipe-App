# ADR-0013: Magic moments are "Snap any dish" and "Otto plans your week"; meals are a free list

- **Status:** Accepted (Juan, 2026-11-05: painted illustrations; photo option A)
- **Date:** 2026-11-05
- **Deciders:** Juan (founder) · drafted by Claude

## Context
The 2026-11-04 recommendation (rework roadmap D8) made "Tonight is answered", with no AI and before the paywall, the first magic moment, and put the photo feature last (1.4). On 2026-11-05 Juan set a different direction. The headline is a photo of any dish broken down into a recipe. The second moment is Otto AI planning the week from the catalogue or new recipes. Meals are a free list with optional labels instead of fixed breakfast/lunch/dinner slots. AI-written recipes get an image. Full memo: `docs/product/MAGIC_MOMENTS_V2.md`.

## Decision
1. Moment 1 is **Snap any dish**. Vision names the dish and writes the recipe. Nutrition is computed by the on-device USDA engine as `~` with a range, never by the model. The closest catalogue recipe is offered first, and the user's photo is the recipe image.
2. Moment 2 is **Otto plans your week**. The agent's `plan_week` picks catalogue recipes first and writes new ones only where none fit. Allergies are enforced in code, and the plan comes back as a preview the user commits.
3. **A plan day is an ordered list of items** with an optional label (breakfast, lunch, dinner, snack or custom). No slot is required.
4. **Images for AI-written recipes.** Reuse a matching catalogue image. Otherwise generate an illustration in Otto's painted style, labelled "Illustration", never photoreal and never presented as the user's dish.
5. **The photo comes before the account (option A).** Welcome offers Snap any dish; consent naming OpenAI comes first; up to **3 scans per device** before an account, checked with Apple DeviceCheck/App Attest in the scan endpoint. Saving the recipe needs Save your plan (account), then Otto Club.

## Consequences
- **Supersedes** rework roadmap D8 as the headline. "Tonight" becomes the Home card.
- **Amends** the 2026-07-21 "no AI food photography presented as real" rule. Generated images become allowed only as labelled painted illustrations.
- **Replaces** the planned `meal` column (G-9) with an optional `label`.
- **Needs** cook times in the catalogue for "30 minutes" requests (R0.14), an image pipeline (R0.15), and a device-scoped scan limit if scans happen before the account.
- **Moves** the photo from release 1.4 to the first-run release in `PRODUCT_ROADMAP.md`.
- **Keeps** ADR-0005 (hard paywall), ADR-0006 (consent before AI) and ADR-0009 (value before account).

## Options considered
- Keep "Tonight is answered" as moment 1 and the photo in 1.4 (the 2026-11-04 plan; replaced by Juan's direction).
- Photo moment for calorie logging (Cal AI's framing; rejected: the undercount, and Otto is a recipe app).
- Photoreal generated food images (rejected: they'd break the honesty rule).

## Evidence
- `docs/product/MAGIC_MOMENTS_V2.md`
- `docs/learning/research_notes/Otto AI agent research/photo_nutrition.md` (accuracy, design)
- `docs/history/REDESIGN_NOTES.md:718` (image rule)
- `docs/product/ALLERGEN_COVERAGE.md` (catalogue has no cook times)
- Decided 2026-11-05 by Juan: generated recipe images are labelled painted illustrations; the photo moment uses option A.
