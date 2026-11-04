# Allergen coverage of the Otto catalogue

Status: current · Last verified against the production `otto_recipes` table at commit 1ade6183 · 2026-11-04

**Question:** if the first week is built from `otto_recipes` and strict allergy filters apply (rework roadmap R0.6, magic-moment report "Tonight is answered"), are there enough dinners left to fill a week and still offer swaps?

**Answer: yes, for every single allergen and the common combinations.** The tightest realistic filter tested (vegetarian + dairy-free + gluten-free) still leaves 52 recipes, so 7 dinners plus about 7 swaps per slot is possible.

## Method
- Read-only SQL on production `otto_recipes` (795 rows) through the Supabase management API.
- "Dinner" = every category except Dessert (168), Side (84), Breakfast (19) and Starter (14): **510 recipes**.
- Each recipe is flagged for an allergen when any ingredient's canonical `key` or `name` matches a keyword list (for example dairy = milk, cream, butter, cheese, yogurt, ghee, parmesan…, excluding coconut milk, almond milk, peanut butter, butternut, butter beans). The lists cover the US "big 9": peanut, tree nuts, milk, egg, wheat/gluten, shellfish, fish, soy, sesame.

## Results (dinner recipes, of 510)

| Filter | Recipes left |
|---|---|
| Nut-free (peanut + tree nuts) | 472 |
| Sesame-free | 476 |
| Shellfish-free | 449 |
| Soy-free | 440 |
| Fish- and shellfish-free | 384 |
| Egg-free | 373 |
| Dairy-free | 333 |
| Gluten-free | 277 |
| Dairy- **and** gluten-free | 201 |
| Free of all 9 | 117 |

Vegetarian + Vegan categories (108 recipes):

| Filter | Recipes left |
|---|---|
| Nut-free | 97 |
| Gluten-free | 73 |
| No dairy, no egg | 55 |
| Dairy- and gluten-free | 52 |

## Limits (read before building on this)
- **This is a keyword heuristic, not a safety check.** It can miss hidden sources (stock cubes with wheat, "seasoning" with soy, cross-contact) and can over-flag. It answers "is there enough variety?", not "is this recipe safe?".
- **Product rule:** Otto filters as a convenience and always says so: "Otto leaves these out. Always check labels." (copy already in rework roadmap R1.3). Otto never shows "allergen-free" or "safe for".
- **Production path:** tag the finite ingredient vocabulary (the ~970 `usdaTable` keys) with allergens once, reviewed by a person, and filter on those tags; keep this keyword list only as a lint that flags new keys. Ticket: rework roadmap R0.6.
- No cook times exist in the catalogue (`canonical` has no time field; `recipeFacts.json` holds only servings and cooked flags), so "weeknight time" can't filter today. The first-run question about time stays out until times exist.
