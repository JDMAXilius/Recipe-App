import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable, recipesTable, planEntriesTable } from "./db/schema.js";
import { and, eq, desc, asc, gte, lte } from "drizzle-orm";
import { importRecipeFromUrl } from "./lib/importRecipe.js";
import job from "./config/cron.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") job.start();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

// All favorites routes are scoped to the authenticated user: requireAuth
// validates the Supabase access token and sets req.userId from it.
app.post("/api/favorites", requireAuth, async (req, res) => {
  try {
    const { recipeId, title, image, cookTime, servings, category } = req.body;

    if (!recipeId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
    console.log("Error adding favorite", error);
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
    console.log("Error fetching the favorites", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/favorites/:recipeId", requireAuth, async (req, res) => {
  try {
    const { recipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.recipeId, parseInt(recipeId)))
      );

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing a favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------------------------------------ USER RECIPES
// Imported (URL) + manual recipes. Seed content never lands here.

app.post("/api/import", requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing url" });
    const draft = await importRecipeFromUrl(url);
    if (!draft) return res.status(422).json({ error: "No recipe found on that page" });
    res.status(200).json(draft);
  } catch (error) {
    console.log("Error importing recipe", error.message);
    res.status(422).json({ error: "Couldn't read that page" });
  }
});

app.post("/api/recipes", requireAuth, async (req, res) => {
  try {
    const { source, sourceUrl, sourceName, title, image, category, area, servings, ingredients, steps, youtubeUrl } = req.body;
    if (!title || !["imported", "manual"].includes(source)) {
      return res.status(400).json({ error: "Missing required fields" });
    }
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
        servings: servings || null,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        steps: Array.isArray(steps) ? steps : [],
        youtubeUrl: youtubeUrl || null,
      })
      .returning();
    res.status(201).json(created[0]);
  } catch (error) {
    console.log("Error creating recipe", error);
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
    console.log("Error fetching recipes", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(recipesTable)
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, parseInt(req.params.id))));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.log("Error fetching recipe", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.put("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    const { title, image, category, area, servings, ingredients, steps, youtubeUrl } = req.body;
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
        updatedAt: new Date(),
      })
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, parseInt(req.params.id))))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Not found" });
    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating recipe", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    await db
      .delete(recipesTable)
      .where(and(eq(recipesTable.userId, req.userId), eq(recipesTable.id, parseInt(req.params.id))));
    res.status(200).json({ message: "Recipe removed" });
  } catch (error) {
    console.log("Error deleting recipe", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------------------------------------ OTTO'S WEEK
app.get("/api/plan", requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const conditions = [eq(planEntriesTable.userId, req.userId)];
    if (start) conditions.push(gte(planEntriesTable.day, start));
    if (end) conditions.push(lte(planEntriesTable.day, end));
    const entries = await db
      .select()
      .from(planEntriesTable)
      .where(and(...conditions))
      .orderBy(asc(planEntriesTable.day), asc(planEntriesTable.createdAt));
    res.status(200).json(entries);
  } catch (error) {
    console.log("Error fetching plan", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/plan", requireAuth, async (req, res) => {
  try {
    const { day, recipeId, title, image, category, note } = req.body;
    if (!day || !title) return res.status(400).json({ error: "Missing required fields" });
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
    console.log("Error adding plan entry", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.patch("/api/plan/:id", requireAuth, async (req, res) => {
  try {
    const { day, note, cooked } = req.body;
    const updated = await db
      .update(planEntriesTable)
      .set({
        ...(day !== undefined && { day }),
        ...(note !== undefined && { note }),
        ...(cooked !== undefined && { cooked }),
      })
      .where(and(eq(planEntriesTable.userId, req.userId), eq(planEntriesTable.id, parseInt(req.params.id))))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Not found" });
    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating plan entry", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/plan/:id", requireAuth, async (req, res) => {
  try {
    await db
      .delete(planEntriesTable)
      .where(and(eq(planEntriesTable.userId, req.userId), eq(planEntriesTable.id, parseInt(req.params.id))));
    res.status(200).json({ message: "Plan entry removed" });
  } catch (error) {
    console.log("Error deleting plan entry", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});
