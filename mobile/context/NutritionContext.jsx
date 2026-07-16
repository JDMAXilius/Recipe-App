import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NutritionAPI, isUserRecipeId } from "../services/userRecipes";
import { useAuth } from "./AuthContext";

// NutritionContext — shared per-recipe nutrition for CARDS.
//
// Why: RecipeCard showed a category-typical estimate (every beef dish "450
// CAL") while the detail screen showed the computed figure — the same recipe
// read 450 on the card and 255 on the page it opened. nutritionEstimates.js
// says one estimator must feed both "so numbers never disagree"; B1 broke that.
//
// Cards can't compute for themselves: TheMealDB's filter.php returns only
// id/title/image, no ingredients. So ids are collected from whatever cards
// mount, coalesced into ONE batched request per frame, and cached in memory for
// the session. Server-side it's cache-first, so this is cheap.
//
// A null entry is meaningful and is NOT retried: it means the backend honestly
// can't compute this recipe (dormant provider, unresolved ingredients, or a
// volume-measured grain whose raw/cooked ambiguity would make the number ~2x
// wrong). The card then keeps its ~estimate, which is the honest fallback.

const NutritionContext = createContext({ getNutrition: () => undefined, request: () => {} });

export function NutritionProvider({ children }) {
  const { session } = useAuth();
  const [map, setMap] = useState({}); // id -> nutrition | null
  const pending = useRef(new Set());
  const inflight = useRef(false);
  const known = useRef(new Set()); // ids already fetched (incl. nulls)

  // Coalesce every card that mounted this frame into one request.
  const flush = useCallback(async () => {
    if (inflight.current || !pending.current.size) return;
    const ids = [...pending.current].slice(0, 40);
    pending.current = new Set([...pending.current].slice(40));
    inflight.current = true;
    try {
      const { nutrition } = await NutritionAPI.seedBatch(ids);
      ids.forEach((id) => known.current.add(id));
      setMap((prev) => ({ ...prev, ...nutrition }));
    } catch {
      // Silent: the card keeps its estimate. Nutrition is never load-bearing.
      ids.forEach((id) => known.current.add(id));
    } finally {
      inflight.current = false;
      if (pending.current.size) setTimeout(flush, 0);
    }
  }, []);

  const request = useCallback(
    (id) => {
      // Seed recipes only — user recipes carry nutrition on their own row.
      if (!session || !id || isUserRecipeId(id)) return;
      const key = String(id);
      if (known.current.has(key) || pending.current.has(key)) return;
      pending.current.add(key);
      setTimeout(flush, 50); // let a whole grid mount before firing
    },
    [session, flush]
  );

  // A signed-out visitor has no token; drop everything so a later sign-in
  // refetches rather than showing the previous account's cache.
  useEffect(() => {
    if (!session) {
      known.current = new Set();
      pending.current = new Set();
      setMap({});
    }
  }, [session]);

  const getNutrition = useCallback((id) => map[String(id)], [map]);

  return (
    <NutritionContext.Provider value={{ getNutrition, request }}>
      {children}
    </NutritionContext.Provider>
  );
}

export const useNutrition = () => useContext(NutritionContext);
