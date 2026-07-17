import express from "express";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable, recipesTable, planEntriesTable, recipeSharesTable, listSharesTable } from "./db/schema.js";
import { and, eq, desc, asc, gte, lte, isNull } from "drizzle-orm";
import { importRecipeFromUrl } from "./lib/importRecipe.js";
import { detectSocialPlatform, importFromSocialUrl, SocialImportError } from "./lib/import/social.js";
import { requireAuth } from "./middleware/auth.js";
import { logger, reportError } from "./lib/logger.js";
import { validate, schemas } from "./lib/validate.js";
import { apiLimiter, costlyLimiter, seedReadLimiter } from "./lib/rateLimits.js";
import { backfillUserRecipeNutrition, seedNutritionFor, nutritionActive } from "./lib/nutrition/lifecycle.js";
import {
  makeShareToken,
  renderRecipePage,
  renderListPage,
  renderGonePage,
  renderNotFoundPage,
} from "./lib/sharePages.js";

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
    // TikTok/Instagram links route through the caption pipeline (I1a);
    // everything else stays on the deterministic JSON-LD importer.
    if (detectSocialPlatform(req.body.url)) {
      const draft = await importFromSocialUrl(req.body.url);
      return res.status(200).json(draft);
    }
    const draft = await importRecipeFromUrl(req.body.url);
    if (!draft) return res.status(422).json({ error: "No recipe found on that page" });
    res.status(200).json(draft);
  } catch (error) {
    if (error instanceof SocialImportError) {
      logger.warn({ url: req.body?.url, code: error.code }, "social import failed");
      return res.status(422).json({ error: error.message });
    }
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

// Seed (TheMealDB) nutrition — cache-first, compute-once-per-recipe. Browsing
// fires one of these per detail view, so it gets its own generous limiter —
// NEVER the import budget (QA P1-1); the compute-once cache guards the spend.
app.get("/api/nutrition/seed/:mealId", requireAuth, seedReadLimiter, async (req, res) => {
  try {
    const mealId = String(req.params.mealId).trim();
    if (!/^\d{1,10}$/.test(mealId)) return res.status(400).json({ error: "Bad id" });
    const nutrition = await seedNutritionFor(mealId);
    res.status(200).json({ recipeId: mealId, nutrition });
  } catch (error) {
    reportError(error, { msg: "seed nutrition failed", mealId: req.params.mealId });
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

// ---- Public share links (S2, IMPORT_SHARE_RESEARCH.md §3.3) ------------
// Capability URLs: unguessable CSPRNG slugs, owner-revocable, SSR pages
// with OG meta (crawlers run no JS). The client's text share upgrades to a
// link automatically when these succeed, and falls back to text when not.

const shareBase = (req) =>
  (ENV.SHARE_BASE_URL || "").replace(/\/+$/, "") ||
  `${ENV.NODE_ENV === "production" ? "https" : req.protocol}://${req.get("host")}`;

const TOKEN_SHAPE = /^[A-Za-z0-9_-]{8,24}$/;

// The painted paper texture behind the shopping-list share page (and its
// OG preview image). Committed asset; see mobile/assets/paper/README.md.
const PAPER_ASSET = fileURLToPath(new URL("./assets/paper-note.jpg", import.meta.url));
app.get("/share-assets/paper-note.jpg", (_req, res) => {
  res.set("Cache-Control", "public, max-age=86400");
  res.sendFile(PAPER_ASSET);
});

// Mint (or return the existing live) share link for a user recipe.
app.post("/api/recipes/:id/share", requireAuth, async (req, res) => {
  try {
    const recipeId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(recipeId)) return res.status(400).json({ error: "Bad id" });
    const [recipe] = await db
      .select({ id: recipesTable.id })
      .from(recipesTable)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.userId, req.userId)));
    if (!recipe) return res.status(404).json({ error: "Not found" });

    const [existing] = await db
      .select()
      .from(recipeSharesTable)
      .where(and(eq(recipeSharesTable.recipeId, recipeId), isNull(recipeSharesTable.revokedAt)));
    const slug = existing?.slug || makeShareToken();
    if (!existing) {
      await db.insert(recipeSharesTable).values({ slug, recipeId, userId: req.userId });
    }
    res.status(200).json({ slug, url: `${shareBase(req)}/r/${slug}` });
  } catch (error) {
    reportError(error, { msg: "share mint failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Turn a recipe's share link off — the page 410s from then on.
app.delete("/api/recipes/:id/share", requireAuth, async (req, res) => {
  try {
    const recipeId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(recipeId)) return res.status(400).json({ error: "Bad id" });
    await db
      .update(recipeSharesTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(recipeSharesTable.recipeId, recipeId),
          eq(recipeSharesTable.userId, req.userId),
          isNull(recipeSharesTable.revokedAt)
        )
      );
    res.status(200).json({ revoked: true });
  } catch (error) {
    reportError(error, { msg: "share revoke failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Shopping-list snapshot → read-only link (G2's "send my husband the list").
app.post("/api/share/list", requireAuth, costlyLimiter, validate(schemas.listShareBody), async (req, res) => {
  try {
    const token = makeShareToken();
    await db
      .insert(listSharesTable)
      .values({ token, userId: req.userId, payload: { items: req.body.items } });
    res.status(200).json({ token, url: `${shareBase(req)}/l/${token}` });
  } catch (error) {
    reportError(error, { msg: "list share failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/r/:slug", async (req, res) => {
  try {
    if (!TOKEN_SHAPE.test(req.params.slug)) return res.status(404).type("html").send(renderNotFoundPage());
    const [share] = await db
      .select()
      .from(recipeSharesTable)
      .where(eq(recipeSharesTable.slug, req.params.slug));
    if (!share) return res.status(404).type("html").send(renderNotFoundPage());
    if (share.revokedAt) return res.status(410).type("html").send(renderGonePage());
    const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, share.recipeId));
    if (!recipe) return res.status(404).type("html").send(renderNotFoundPage());
    res.status(200).type("html").send(renderRecipePage(recipe, `${shareBase(req)}/r/${share.slug}`));
  } catch (error) {
    reportError(error, { msg: "share page failed", slug: req.params.slug });
    res.status(500).type("html").send(renderNotFoundPage());
  }
});

app.get("/l/:token", async (req, res) => {
  try {
    if (!TOKEN_SHAPE.test(req.params.token)) return res.status(404).type("html").send(renderNotFoundPage());
    const [share] = await db
      .select()
      .from(listSharesTable)
      .where(eq(listSharesTable.token, req.params.token));
    if (!share) return res.status(404).type("html").send(renderNotFoundPage());
    if (share.revokedAt) return res.status(410).type("html").send(renderGonePage());
    res.status(200).type("html").send(renderListPage(share.payload, `${shareBase(req)}/l/${share.token}`));
  } catch (error) {
    reportError(error, { msg: "list page failed", token: req.params.token });
    res.status(500).type("html").send(renderNotFoundPage());
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "server listening");
});
