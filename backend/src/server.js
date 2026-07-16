import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable, recipesTable, planEntriesTable } from "./db/schema.js";
import { and, eq, desc, asc, gte, lte } from "drizzle-orm";
import { importRecipeFromUrl } from "./lib/importRecipe.js";
import { requireAuth } from "./middleware/auth.js";
import { logger, reportError } from "./lib/logger.js";
import { validate, schemas } from "./lib/validate.js";
import { apiLimiter, costlyLimiter } from "./lib/rateLimits.js";
import { backfillUserRecipeNutrition, nutritionActive } from "./lib/nutrition/lifecycle.js";

const app = express();
const PORT = ENV.PORT || 5001;

// Behind a proxy in production, the client IP lives in X-Forwarded-For —
// without this the per-IP limiter would throttle the proxy, not users.
if (ENV.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

// Route-param guard — a NaN reaching postgres.js becomes a 500;
// bad input should be a 400 before the DB ever sees it.
const intId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

// All favorites routes are scoped to the authenticated user: requireAuth
// validates the Supabase access token and sets req.userId from it.
app.post("/api/favorites", requireAuth, validate(schemas.favoriteCreate), async (req, res) => {
  try {
    const { recipeId, title, image, cookTime, servings, category } = req.body;

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId: req.userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
        category,
      })
      .returning();

    res.status(201).json(newFavorite[0]);
  } catch (error) {
    reportError(error, { msg: "add favorite failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/favorites", requireAuth, async (req, res) => {
  try {
    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, req.userId));

    res.status(200).json(userFavorites);
  } catch (error) {
    reportError(error, { msg: "fetch favorites failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/favorites/:recipeId", requireAuth, async (req, res) => {
  try {
    const recipeId = intId(req.params.recipeId);
    if (!recipeId) return res.status(400).json({ error: "Bad id" });

    await db
      .delete(favoritesTable)
      .where(
        and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.recipeId, recipeId))
      );

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    reportError(error, { msg: "remove favorite failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------------------------------------ USER RECIPES
// Imported (URL) + manual recipes. Seed content never lands here.

app.post("/api/import", requireAuth, costlyLimiter, validate(schemas.importBody), async (req, res) => {
  try {
    const draft = await importRecipeFromUrl(req.body.url);
    if (!draft) return res.status(422).json({ error: "No recipe found on that page" });
    res.status(200).json(draft);
  } catch (error) {
    logger.warn({ url: req.body?.url, err: error.message }, "import failed");
    res.status(422).json({ error: "Couldn't read that page" });
  }
});

app.post("/api/recipes", requireAuth, validate(schemas.recipeCreate), async (req, res) => {
  try {
    const { source, sourceUrl, sourceName, title, image, category, area, servings, ingredients, steps, youtubeUrl, visibility } = req.body;
    const created = await db
      .insert(recipesTable)
      .values({
        userId: req.userId,
        source,
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        title,
        image: image || null,
        category: category || null,
        area: area || null,
        servings: servings ?? null,
        ingredients,
        steps,
        youtubeUrl: youtubeUrl || null,
        visibility,
      })
      .returning();
    // async by design — the save returns now, nutrition lands on the row
    // shortly after and the client picks it up on next fetch (B1.4)
    backfillUserRecipeNutrition(created[0].id, req.userId);
    res.status(201).json(created[0]);
  } catch (error) {
    reportError(error, { msg: "create recipe failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/recipes", requireAuth, async (req, res) => {
  try {
    const mine = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.userId, req.userId))
      .orderBy(desc(recipesTable.createdAt));
    res.status(200).json(mine);
  } catch (error) {
    reportError(error, { msg: "fetch recipes failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    const id = intId(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });
    const rows = await db
      .select()
      .from(recipesTable)
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, id)));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    reportError(error, { msg: "fetch recipe failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.put("/api/recipes/:id", requireAuth, validate(schemas.recipeUpdate), async (req, res) => {
  try {
    const id = intId(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });
    const { title, image, category, area, servings, ingredients, steps, youtubeUrl, visibility } = req.body;
    // the editor always sends the full payload — only a REAL ingredient/
    // serving change should void cached nutrition + re-pay the provider
    // (QA P3-9: a title typo fix must not downgrade the card)
    const existingRows = await db
      .select({ ingredients: recipesTable.ingredients, servings: recipesTable.servings })
      .from(recipesTable)
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, id)));
    if (!existingRows.length) return res.status(404).json({ error: "Not found" });
    const nutritionStale =
      (ingredients !== undefined &&
        JSON.stringify(ingredients) !== JSON.stringify(existingRows[0].ingredients)) ||
      (servings !== undefined && (servings ?? null) !== existingRows[0].servings);
    // source/sourceUrl/sourceName are immutable — attribution never edits away
    const updated = await db
      .update(recipesTable)
      .set({
        ...(title !== undefined && { title }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(area !== undefined && { area }),
        ...(servings !== undefined && { servings }),
        ...(ingredients !== undefined && { ingredients }),
        ...(steps !== undefined && { steps }),
        ...(youtubeUrl !== undefined && { youtubeUrl }),
        ...(visibility !== undefined && { visibility }),
        // the honest state while recomputing is "no numbers", never stale ones
        ...(nutritionStale && { nutrition: null }),
        updatedAt: new Date(),
      })
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, id)))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Not found" });
    if (nutritionStale) backfillUserRecipeNutrition(id, req.userId);
    res.status(200).json(updated[0]);
  } catch (error) {
    reportError(error, { msg: "update recipe failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    const id = intId(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });
    await db
      .delete(recipesTable)
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, id)));
    res.status(200).json({ message: "Recipe removed" });
  } catch (error) {
    reportError(error, { msg: "delete recipe failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------------------------------------ NUTRITION (B1)

// Owner-forced recompute (e.g. after fixing a messy ingredient line).
app.post("/api/recipes/:id/nutrition/recompute", requireAuth, costlyLimiter, async (req, res) => {
  try {
    const id = intId(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });
    const rows = await db
      .select({ id: recipesTable.id })
      .from(recipesTable)
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, id)));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    if (!nutritionActive()) {
      return res.status(200).json({ queued: false, reason: "nutrition provider not configured" });
    }
    backfillUserRecipeNutrition(id, req.userId);
    res.status(202).json({ queued: true });
  } catch (error) {
    reportError(error, { msg: "recompute nutrition failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------------------------------------ OTTO'S WEEK
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

app.get("/api/plan", requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    // query strings reach a date column — garbage (or Express array-params)
    // must 400 here, not 500 in postgres (QA P3-10)
    if ((start && !DAY_RE.test(String(start))) || (end && !DAY_RE.test(String(end)))) {
      return res.status(400).json({ error: "Bad date range" });
    }
    const conditions = [eq(planEntriesTable.userId, req.userId)];
    if (start) conditions.push(gte(planEntriesTable.day, String(start)));
    if (end) conditions.push(lte(planEntriesTable.day, String(end)));
    const entries = await db
      .select()
      .from(planEntriesTable)
      .where(and(...conditions))
      .orderBy(asc(planEntriesTable.day), asc(planEntriesTable.createdAt));
    res.status(200).json(entries);
  } catch (error) {
    reportError(error, { msg: "fetch plan failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/plan", requireAuth, validate(schemas.planCreate), async (req, res) => {
  try {
    const { day, recipeId, title, image, category, note } = req.body;
    const created = await db
      .insert(planEntriesTable)
      .values({
        userId: req.userId,
        day,
        recipeId: recipeId || null,
        title,
        image: image || null,
        category: category || null,
        note: note || null,
      })
      .returning();
    res.status(201).json(created[0]);
  } catch (error) {
    reportError(error, { msg: "add plan entry failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.patch("/api/plan/:id", requireAuth, validate(schemas.planUpdate), async (req, res) => {
  try {
    const id = intId(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });
    const { day, note, cooked } = req.body;
    const updated = await db
      .update(planEntriesTable)
      .set({
        ...(day !== undefined && { day }),
        ...(note !== undefined && { note }),
        ...(cooked !== undefined && { cooked }),
      })
      .where(and(eq(planEntriesTable.userId, req.userId), eq(planEntriesTable.id, id)))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Not found" });
    res.status(200).json(updated[0]);
  } catch (error) {
    reportError(error, { msg: "update plan entry failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/plan/:id", requireAuth, async (req, res) => {
  try {
    const id = intId(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });
    await db
      .delete(planEntriesTable)
      .where(and(eq(planEntriesTable.userId, req.userId), eq(planEntriesTable.id, id)));
    res.status(200).json({ message: "Plan entry removed" });
  } catch (error) {
    reportError(error, { msg: "delete plan entry failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------------------------------------ ACCOUNT
// Deletes every row we hold for the user. Removing the AUTH user itself needs
// the Supabase service-role key — when SUPABASE_SERVICE_ROLE_KEY lands in env
// this route finishes the job automatically (App Store 5.1.1(v)).
app.delete("/api/account", requireAuth, async (req, res) => {
  try {
    await db.delete(favoritesTable).where(eq(favoritesTable.userId, req.userId));
    await db.delete(recipesTable).where(eq(recipesTable.userId, req.userId));
    await db.delete(planEntriesTable).where(eq(planEntriesTable.userId, req.userId));

    let authUserDeleted = false;
    if (ENV.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await admin.auth.admin.deleteUser(req.userId);
      authUserDeleted = !error;
    }
    res.status(200).json({ dataDeleted: true, authUserDeleted });
  } catch (error) {
    reportError(error, { msg: "delete account failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "server listening");
});
