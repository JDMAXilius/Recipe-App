// Preference-aware "Otto suggests" pick from the community shelf — used by
// the plan's swap action. Mirrors Discover's featured-pick rules: diet
// always wins, cuisines narrow within it when the sets overlap, any gap
// returns null so callers fall back honestly instead of serving a vegan a
// beef stew.
import { MealAPI } from "../services/mealAPI";
import { DIET_CATEGORY } from "./prefs";

export async function pickPreferredMeal(prefs, { excludeId } = {}) {
  try {
    let pool = [];
    const dietCategory = DIET_CATEGORY[prefs.diet];
    if (dietCategory) {
      pool = await MealAPI.filterByCategory(dietCategory);
      if (prefs.cuisines.length > 0 && pool.length > 0) {
        const areaLists = await Promise.all(prefs.cuisines.map((a) => MealAPI.filterByArea(a)));
        const areaIds = new Set(areaLists.flat().map((m) => m.idMeal));
        const both = pool.filter((m) => areaIds.has(m.idMeal));
        if (both.length > 0) pool = both;
      }
    } else if (prefs.cuisines.length > 0) {
      const area = prefs.cuisines[Math.floor(Math.random() * prefs.cuisines.length)];
      pool = await MealAPI.filterByArea(area);
    } else {
      const meal = await MealAPI.getRandomMeal();
      if (!meal || String(meal.idMeal) === String(excludeId)) return null;
      return MealAPI.transformMealData(meal);
    }
    const candidates = pool.filter((m) => String(m.idMeal) !== String(excludeId));
    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    // filter.php rows are id/name/thumb only — fetch the full record so the
    // plan entry carries an honest category
    const full = await MealAPI.getMealById(pick.idMeal);
    return full ? MealAPI.transformMealData(full) : null;
  } catch {
    return null;
  }
}
