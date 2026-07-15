// RecipeSource (B0.3) — the seam between Otto and wherever seed recipes come
// from. The app should never care that today's source is TheMealDB; swap the
// adapter and Discover keeps working. Shape mirrors mobile/services/mealAPI.js
// so the client-side calls can migrate server-side incrementally.
//
// Interface (every adapter implements):
//   getById(id)                → recipe | null
//   search(query)              → recipe[]
//   filterByIngredient(name)   → recipe[]  (summary rows: id/title/image)
//   randomBatch(count)         → recipe[]

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`TheMealDB answered ${response.status}`);
  return response.json();
}

// TheMealDB packs ingredients into strIngredient1..20 + strMeasure1..20;
// normalize to the [{ measure, name }] shape the whole app speaks.
function transformMeal(meal) {
  if (!meal) return null;
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || "").trim();
    if (!name) continue;
    ingredients.push({ measure: (meal[`strMeasure${i}`] || "").trim(), name });
  }
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory || null,
    area: meal.strArea || null,
    ingredients,
    steps: (meal.strInstructions || "")
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    youtubeUrl: meal.strYoutube || null,
    sourceUrl: meal.strSource || null,
  };
}

export const theMealDBSource = {
  async getById(id) {
    const data = await getJson(`${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`);
    return transformMeal(data.meals?.[0]);
  },

  async search(query) {
    const data = await getJson(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    return (data.meals || []).map(transformMeal);
  },

  // filter.php returns summaries only (no ingredients/steps) — callers needing
  // detail follow up with getById per row.
  async filterByIngredient(ingredient) {
    const data = await getJson(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
    return (data.meals || []).map((m) => ({
      id: m.idMeal,
      title: m.strMeal,
      image: m.strMealThumb,
    }));
  },

  async randomBatch(count) {
    const takes = Array.from({ length: Math.min(count, 12) }, () =>
      getJson(`${BASE_URL}/random.php`).then((d) => transformMeal(d.meals?.[0])).catch(() => null)
    );
    const meals = await Promise.all(takes);
    // random.php repeats — dedupe so a batch of 6 is 6 different dishes
    const seen = new Set();
    return meals.filter((m) => m && !seen.has(m.id) && seen.add(m.id));
  },
};

// The active source. Swapping providers = changing this one line.
export const recipeSource = theMealDBSource;
