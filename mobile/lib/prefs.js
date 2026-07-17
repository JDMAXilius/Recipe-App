// Food preferences (profile → Food preferences). Stored on-device, like the
// shopping list — no account needed, nothing leaves the phone.
//
// Honesty contract (the picker's copy states exactly this):
// - Prefs shape Otto's pick and where the Discover grid starts.
// - Search and the filter sheet stay fully user-driven; saved/own recipes
//   are never filtered.
// - Only diets TheMealDB can actually tag are offered (Vegetarian, Vegan) —
//   a Pescetarian toggle the data can't honor would be a lie. More diets
//   arrive with richer recipe data (Spoonacular key on the founder list).
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "otto.prefs.v1";

export const DEFAULT_PREFS = { diet: "none", cuisines: [] };

export const DIETS = [
  { key: "none", label: "None — I eat everything" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
];

// TheMealDB category that honestly expresses each diet.
export const DIET_CATEGORY = { vegetarian: "Vegetarian", vegan: "Vegan" };

// Category tiles Discover quietly puts away for a diet. Browsing filters and
// search are untouched — this only trims the default tile row.
export const DIET_HIDDEN_CATEGORIES = {
  vegetarian: ["Beef", "Chicken", "Lamb", "Pork", "Goat", "Seafood"],
  vegan: ["Beef", "Chicken", "Lamb", "Pork", "Goat", "Seafood"],
};

// TheMealDB's area vocabulary — used when the live list can't be fetched.
// Mirrors PRIORITY_AREAS in components/FilterSheet.jsx.
export const FALLBACK_AREAS = [
  "American", "British", "Canadian", "Chinese", "Croatian", "Dutch", "Egyptian",
  "Filipino", "French", "Greek", "Indian", "Irish", "Italian", "Jamaican",
  "Japanese", "Kenyan", "Malaysian", "Mexican", "Moroccan", "Norwegian",
  "Polish", "Portuguese", "Russian", "Spanish", "Thai", "Tunisian", "Turkish",
  "Ukrainian", "Uruguayan", "Vietnamese",
];

export async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PREFS };
    return {
      diet: DIETS.some((d) => d.key === parsed.diet) ? parsed.diet : "none",
      cuisines: Array.isArray(parsed.cuisines) ? parsed.cuisines.filter((c) => typeof c === "string") : [],
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(prefs) {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

export const hasPrefs = (prefs) => prefs.diet !== "none" || prefs.cuisines.length > 0;
