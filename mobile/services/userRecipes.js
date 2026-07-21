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
  // "Cook something up with Otto" — AI recipe creation. The server returns an
  // editor-ready draft (or an honest decline message as the error).
  // The AI seams run long on the server (Opus writing/reading takes 10–60s) —
  // each carries its own timeout budget instead of authFetch's 15s default.
  generate: async (payload) => {
    const res = await authFetch("/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      timeoutMs: 90000,
    });
    return parseOrThrow(res, "Otto couldn't finish that idea right now");
  },
  importFromText: async (text) => {
    const res = await authFetch("/import/text", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      timeoutMs: 60000,
    });
    return parseOrThrow(res, "Otto couldn't make sense of that text");
  },

  // Photo → recipe: a cookbook page, a recipe card, a screenshot.
  importFromPhoto: async ({ image, mediaType }) => {
    const res = await authFetch("/import/photo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image, mediaType }),
      timeoutMs: 120000,
    });
    return parseOrThrow(res, "Otto couldn't read that photo");
  },

  importFromUrl: async (url) => {
    const res = await authFetch("/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      timeoutMs: 60000,
    });
    return parseOrThrow(res, "Otto couldn't read that page");
  },
};

// Public share links (S2). Mint/revoke are owner-only; a mint on an
// already-shared recipe returns the same live link. Callers treat failures
// as "share text-only" — the share button never depends on the network.
// S3 — the household's live list. The token is the membership; display
// names ride along on writes for attribution.
export const CollabAPI = {
  create: async (displayName, items) => {
    const res = await authFetch("/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, items }),
    });
    return parseOrThrow(res, "Couldn't start a shared list");
  },
  get: async (token) => {
    const res = await authFetch(`/lists/${token}`);
    return parseOrThrow(res, "Couldn't reach the shared list");
  },
  addItem: async (token, { name, amount, displayName }) => {
    const res = await authFetch(`/lists/${token}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount, displayName }),
    });
    return parseOrThrow(res, "Couldn't add that");
  },
  check: async (token, id, checked, displayName) => {
    const res = await authFetch(`/lists/${token}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked, displayName }),
    });
    return parseOrThrow(res, "Couldn't mark that");
  },
  removeItem: async (token, id) => {
    const res = await authFetch(`/lists/${token}/items/${id}`, { method: "DELETE" });
    return parseOrThrow(res, "Couldn't remove that");
  },
  putAway: async (token) => {
    const res = await authFetch(`/lists/${token}`, { method: "DELETE" });
    return parseOrThrow(res, "Couldn't put the list away");
  },
};

export const ShareAPI = {
  recipeLink: async (id) => {
    const res = await authFetch(`/recipes/${userDbId(id)}/share`, { method: "POST" });
    return parseOrThrow(res, "Couldn't make a share link");
  },
  revokeRecipeLink: async (id) => {
    const res = await authFetch(`/recipes/${userDbId(id)}/share`, { method: "DELETE" });
    return parseOrThrow(res, "Couldn't turn the link off");
  },
  listSnapshot: async (items) => {
    const res = await authFetch("/share/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    return parseOrThrow(res, "Couldn't make a list link");
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
