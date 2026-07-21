import { API_URL } from "../constants/api";

// Recipes come through OUR backend, not themealdb.com directly. The supporter
// key we pay for is injected server-side by the /api/content passthrough — it
// cannot live here, because anything bundled into the app (EXPO_PUBLIC_* very
// much included) can be read straight out of the IPA. The endpoint names,
// query params and response shapes are unchanged, so everything below still
// parses data.meals / data.categories exactly as it did.
const BASE_URL = `${API_URL}/content`;

// Stale-while-revalidate memory cache for Discover reads (API-5). Content is
// near-static, so a five-minute cache makes tab switches instant and lets a
// flaky connection coast on the last good answer instead of emptying the
// screen. random.php calls skip this by name — same URL, different meal each
// time, caching it would freeze the "surprise me" row.
const contentCache = new Map(); // url → { at, data }
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 150;

async function getJSON(url) {
  const cacheable = !url.includes("random.php");
  const hit = cacheable ? contentCache.get(url) : null;
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (cacheable) {
      contentCache.delete(url);
      contentCache.set(url, { at: Date.now(), data });
      while (contentCache.size > CACHE_MAX) {
        contentCache.delete(contentCache.keys().next().value);
      }
    }
    return data;
  } catch (error) {
    if (hit) return hit.data; // stale beats a spinner
    throw error;
  }
}

// Some TheMealDB entries carry their own headers — "STEP 1" on its own line
// above the actual instruction (52982 Carbonara is one). Kept as-is they become
// steps with a number and no body, so cook mode shows a blank screen and the
// step count roughly doubles. Drop the label; the line below it is the step.
const isStepLabel = (line) =>
  /^\s*(step\s*)?\d+\s*[:.)\-]?\s*$/i.test(line);

export const MealAPI = {
  // search meal by name
  searchMealsByName: async (query) => {
    try {
      const data = await getJSON(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      return data.meals || [];
    } catch (error) {
      console.error("Error searching meals by name:", error);
      return [];
    }
  },

  // lookup full meal details by id
  getMealById: async (id) => {
    try {
      const data = await getJSON(`${BASE_URL}/lookup.php?i=${id}`);
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting meal by id:", error);
      return null;
    }
  },

  // lookup a single random meal
  getRandomMeal: async () => {
    try {
      const data = await getJSON(`${BASE_URL}/random.php`);
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting random meal:", error);
      return null;
    }
  },

  // get multiple random meals
  getRandomMeals: async (count = 6) => {
    try {
      const promises = Array(count)
        .fill()
        .map(() => MealAPI.getRandomMeal());
      const meals = await Promise.all(promises);
      return meals.filter((meal) => meal !== null);
    } catch (error) {
      console.error("Error getting random meals:", error);
      return [];
    }
  },

  // list all meal categories
  getCategories: async () => {
    try {
      const data = await getJSON(`${BASE_URL}/categories.php`);
      return data.categories || [];
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  },

  // filter by main ingredient
  filterByIngredient: async (ingredient) => {
    try {
      const data = await getJSON(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by ingredient:", error);
      return [];
    }
  },

  // list cuisines (areas)
  listAreas: async () => {
    try {
      const data = await getJSON(`${BASE_URL}/list.php?a=list`);
      return (data.meals || []).map((m) => m.strArea).filter(Boolean);
    } catch (error) {
      console.error("Error listing areas:", error);
      return [];
    }
  },

  // filter by cuisine (area)
  filterByArea: async (area) => {
    try {
      const data = await getJSON(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by area:", error);
      return [];
    }
  },

  // filter by category
  filterByCategory: async (category) => {
    try {
      const data = await getJSON(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by category:", error);
      return [];
    }
  },

  // transform TheMealDB meal data to our app format
  transformMealData: (meal) => {
    if (!meal) return null;

    // extract ingredients from the meal object
    const ingredients = [];
    const ingredientPairs = []; // { measure, name } — lets the UI tint quantities
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const measureText = measure && measure.trim() ? `${measure.trim()} ` : "";
        ingredients.push(`${measureText}${ingredient.trim()}`);
        ingredientPairs.push({
          measure: measure && measure.trim() ? measure.trim() : "",
          name: ingredient.trim(),
        });
      }
    }

    // extract instructions
    const instructions = meal.strInstructions
      ? meal.strInstructions
          .split(/\r?\n/)
          .map((step) => step.trim())
          .filter((step) => step && !isStepLabel(step))
      : [];

    return {
      id: meal.idMeal,
      title: meal.strMeal,
      description: meal.strInstructions
        ? meal.strInstructions.substring(0, 120) + "..."
        : "Delicious meal from TheMealDB",
      image: meal.strMealThumb,
      cookTime: "30 minutes",
      servings: 4,
      category: meal.strCategory || "Main Course",
      area: meal.strArea,
      ingredients,
      ingredientPairs,
      instructions,
      originalData: meal,
    };
  },
};
