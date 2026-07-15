import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { authFetch } from "../lib/api";

// Single source of truth for the user's saved recipes, so the paw-mark can
// render (and toggle) on any card without each screen refetching.
// Optimistic toggles; state reconciles on refresh().

const SavedContext = createContext({
  savedIds: new Set(),
  savedList: [],
  loaded: false,
  isSaved: () => false,
  toggleSave: async () => {},
  refresh: async () => {},
});

export const SavedProvider = ({ children }) => {
  const { isSignedIn } = useAuth();
  const [savedList, setSavedList] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await authFetch(`/favorites`);
      if (!response.ok) throw new Error("Failed to fetch saved recipes");
      const favorites = await response.json();
      setSavedList(favorites);
    } catch (error) {
      console.log("Error loading saved recipes", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) refresh();
    else {
      setSavedList([]);
      setLoaded(false);
    }
  }, [isSignedIn, refresh]);

  const savedIds = useMemo(
    () => new Set(savedList.map((f) => parseInt(f.recipeId))),
    [savedList]
  );

  const isSaved = useCallback((recipeId) => savedIds.has(parseInt(recipeId)), [savedIds]);

  // Returns the new saved state, or null on failure (caller may show feedback).
  const toggleSave = useCallback(
    async (recipe) => {
      const id = parseInt(recipe.id);
      const currentlySaved = savedIds.has(id);
      // optimistic
      setSavedList((prev) =>
        currentlySaved
          ? prev.filter((f) => parseInt(f.recipeId) !== id)
          : [...prev, { recipeId: id, title: recipe.title, image: recipe.image, cookTime: recipe.cookTime, servings: recipe.servings }]
      );
      try {
        if (currentlySaved) {
          const res = await authFetch(`/favorites/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("unsave failed");
          return false;
        }
        const res = await authFetch(`/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeId: id,
            title: recipe.title,
            image: recipe.image,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        return true;
      } catch (error) {
        console.log("Error toggling save", error);
        refresh(); // roll back optimistic state to server truth
        return null;
      }
    },
    [savedIds, refresh]
  );

  return (
    <SavedContext.Provider value={{ savedIds, savedList, loaded, isSaved, toggleSave, refresh }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => useContext(SavedContext);
