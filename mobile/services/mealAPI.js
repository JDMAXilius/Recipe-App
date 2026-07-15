const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export const MealAPI = {
  // search meal by name
  searchMealsByName: async (query) => {
    try {
      const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error searching meals by name:", error);
      return [];
    }
  },

  // lookup full meal details by id
  getMealById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting meal by id:", error);
      return null;
    }
  },

  // lookup a single random meal
  getRandomMeal: async () => {
    try {
      const response = await fetch(`${BASE_URL}/random.php`);
      const data = await response.json();
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
      const response = await fetch(`${BASE_URL}/categories.php`);
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  },

  // filter by main ingredient
  filterByIngredient: async (ingredient) => {
    try {
      const response = await fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by ingredient:", error);
      return [];
    }
  },

  // list cuisines (areas)
  listAreas: async () => {
    try {
      const response = await fetch(`${BASE_URL}/list.php?a=list`);
      const data = await response.json();
      return (data.meals || []).map((m) => m.strArea).filter(Boolean);
    } catch (error) {
      console.error("Error listing areas:", error);
      return [];
    }
  },

  // filter by cuisine (area)
  filterByArea: async (area) => {
    try {
      const response = await fetch(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by area:", error);
      return [];
    }
  },

  // filter by category
  filterByCategory: async (category) => {
    try {
      const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
      const data = await response.json();
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
      ? meal.strInstructions.split(/\r?\n/).filter((step) => step.trim())
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
