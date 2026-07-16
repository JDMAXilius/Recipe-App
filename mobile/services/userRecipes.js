import { authFetch } from "../lib/api";

// User recipes (imported + written) — the second RecipeSource next to
// TheMealDB. App-wide id convention: seed ids are numeric strings ("52772"),
// user ids are "u-<dbId>". isUserRecipeId() is the only place that knows.

export const isUserRecipeId = (id) => String(id).startsWith("u-");
export const userDbId = (id) => parseInt(String(id).slice(2), 10);

// Same shape transformMealData produces, so detail/cook/cards need no branches.
export function transformUserRecipe(row) {
  if (!row) return null;
  const pairs = Array.isArray(row.ingredients) ? row.ingredients : [];
  return {
    id: `u-${row.id}`,
    title: row.title,
    image: row.image,
    category: row.category,
    area: row.area,
    servings: row.servings,
    ingredients: pairs.map((p) => `${p.measure ? `${p.measure} ` : ""}${p.name}`),
    ingredientPairs: pairs,
    instructions: Array.isArray(row.steps) ? row.steps : [],
    youtubeUrl: row.youtubeUrl || null,
    // provenance — drives the attribution row + card stamps
    source: row.source, // "imported" | "manual"
    sourceUrl: row.sourceUrl || null,
    sourceName: row.sourceName || null,
    // computed per-serving nutrition (B1) — null until the backend backfill
    // has run (or while the provider is dormant); the card falls back to the
    // honest category estimate
    nutrition: row.nutrition || null,
  };
}

async function parseOrThrow(response, fallback) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON error body
  }
  if (!response.ok) throw new Error(body?.error || fallback);
  return body;
}

export const UserRecipeAPI = {
  list: async () => {
    const res = await authFetch("/recipes");
    return parseOrThrow(res, "Couldn't load your recipes");
  },
  get: async (id) => {
    const res = await authFetch(`/recipes/${userDbId(id)}`);
    return parseOrThrow(res, "Couldn't load that recipe");
  },
  create: async (payload) => {
    const res = await authFetch("/recipes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseOrThrow(res, "Couldn't save the recipe");
  },
  update: async (id, payload) => {
    const res = await authFetch(`/recipes/${userDbId(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseOrThrow(res, "Couldn't save your changes");
  },
  remove: async (id) => {
    const res = await authFetch(`/recipes/${userDbId(id)}`, { method: "DELETE" });
    return parseOrThrow(res, "Couldn't remove the recipe");
  },
  importFromUrl: async (url) => {
    const res = await authFetch("/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return parseOrThrow(res, "Otto couldn't read that page");
  },
};

export const NutritionAPI = {
  // Seed (TheMealDB) nutrition — server computes once and caches; returns
  // { recipeId, nutrition } with nutrition null while the provider is dormant.
  seed: async (mealId) => {
    const res = await authFetch(`/nutrition/seed/${mealId}`);
    return parseOrThrow(res, "Couldn't load nutrition");
  },

  // Batch — one call for a grid of cards. Returns { nutrition: { id: obj|null } };
  // null means honestly unknown and the card keeps its ~category estimate.
  // Server caps at 40 ids per request.
  seedBatch: async (mealIds) => {
    const ids = (mealIds || []).filter(Boolean).slice(0, 40);
    if (!ids.length) return { nutrition: {} };
    const res = await authFetch(`/nutrition/seed?ids=${ids.join(",")}`);
    return parseOrThrow(res, "Couldn't load nutrition");
  },
};

export const PlanAPI = {
  list: async (start, end) => {
    const qs = start ? `?start=${start}&end=${end || start}` : "";
    const res = await authFetch(`/plan${qs}`);
    return parseOrThrow(res, "Couldn't load the week");
  },
  add: async (payload) => {
    const res = await authFetch("/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseOrThrow(res, "Couldn't add to the week");
  },
  update: async (id, payload) => {
    const res = await authFetch(`/plan/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseOrThrow(res, "Couldn't update that");
  },
  remove: async (id) => {
    const res = await authFetch(`/plan/${id}`, { method: "DELETE" });
    return parseOrThrow(res, "Couldn't remove that");
  },
};
