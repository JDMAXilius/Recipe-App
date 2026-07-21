import express from "express";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import cors from "cors";
import helmet from "helmet";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable, recipesTable, planEntriesTable, recipeSharesTable, listSharesTable, collabListsTable, collabItemsTable } from "./db/schema.js";
import { and, eq, desc, asc, gte, lte, isNull, inArray, count } from "drizzle-orm";
import { importRecipeFromUrl } from "./lib/importRecipe.js";
import { detectSocialPlatform, importFromSocialUrl, SocialImportError } from "./lib/import/social.js";
import { extractionActive, extractRecipeFromText } from "./lib/import/extractRecipe.js";
import { generateRecipe, generationActive } from "./lib/generateRecipe.js";
import { requireAuth } from "./middleware/auth.js";
import { logger, reportError } from "./lib/logger.js";
import { validate, schemas } from "./lib/validate.js";
import { apiLimiter, costlyLimiter, seedReadLimiter, contentLimiter, destructiveLimiter, publicShareLimiter } from "./lib/rateLimits.js";
import { MEALDB_BASE_URL } from "./lib/content/RecipeSource.js";
import { backfillUserRecipeNutrition, seedNutritionFor, nutritionActive } from "./lib/nutrition/lifecycle.js";
import {
  makeShareToken,
  renderRecipePage,
  renderListPage,
  renderGonePage,
  renderNotFoundPage,
  renderJoinPage,
} from "./lib/sharePages.js";

const app = express();
const PORT = ENV.PORT || 5001;

// Behind a proxy in production, the client IP lives in X-Forwarded-For —
// without this the per-IP limiter would throttle the proxy, not users.
if (ENV.NODE_ENV === "production") app.set("trust proxy", 1);

// CORS was `*`. The API is bearer-token (no cookies), so `*` was never a
// session-riding risk — but it does let any page on the internet read a
// response if it ever gets hold of a token, so scope it to the origins that
// actually exist. The native app sends NO Origin header and is untouched by
// CORS entirely; this allowlist only governs browsers.
// WEB_ORIGINS (comma-separated) is the escape hatch: a new front end should be
// an env change, not a redeploy of this list.
const ALLOWED_ORIGINS = [
  ENV.SHARE_BASE_URL,
  ...(ENV.WEB_ORIGINS || "").split(","),
  // The marketing site (branded house, one site, three product pages).
  "https://ottosapp.com",
  "https://www.ottosapp.com",
  // Expo web / local dev only — never allowed in production.
  ...(ENV.NODE_ENV === "production" ? [] : ["http://localhost:8081", "http://localhost:19006"]),
]
  .map((origin) => (origin || "").trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin = native app, curl, or a link-preview crawler. Nothing to
      // police: CORS only protects browsers from other browsers' tabs.
      if (!origin) return callback(null, true);
      callback(null, ALLOWED_ORIGINS.includes(origin));
    },
  })
);

// Security headers. The CSP matters most on the public HTML share pages —
// defense-in-depth behind the escaping and the URL-scheme allowlist in
// sharePages.js, so a miss in either one still isn't a script execution.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        // Share pages ship one inline <style> block each (no external CSS).
        styleSrc: ["'self'", "'unsafe-inline'"],
        // Recipe images come from whatever site the recipe was imported from.
        imgSrc: ["'self'", "https:", "data:"],
        // No <script> anywhere on these pages, by design. Keep it that way.
        scriptSrc: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    // Link-preview crawlers (WhatsApp, iMessage, Slack) fetch og:image
    // cross-origin — same-origin CORP would break every rich preview we ship.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
// Request ids (API-2): every request gets a short random id, echoed as
// X-Request-Id and stamped on the log lines. When a founder screenshot says
// "it failed", the log line is findable. Only non-2xx completions are logged —
// healthy traffic stays quiet.
app.use((req, res, next) => {
  req.id = randomBytes(6).toString("base64url");
  res.set("X-Request-Id", req.id);
  const started = Date.now();
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      logger.info(
        { reqId: req.id, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started },
        "request failed"
      );
    }
  });
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

// Route-param guard — a NaN reaching postgres.js becomes a 500;
// bad input should be a 400 before the DB ever sees it.
const intId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// Deploy-provable health (API-1): the answer names the running build, so
// "is the deploy actually live" is one curl on this route — not probing a
// feature route and reading 401-vs-404 tea leaves. The sha comes from
// Railway's build env; locally it's null and that's honest too.
const pkg = createRequire(import.meta.url)("../package.json");
const BUILD_SHA = (process.env.RAILWAY_GIT_COMMIT_SHA || "").slice(0, 12) || null;
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, version: pkg.version, sha: BUILD_SHA });
});

// TheMealDB passthrough — the ONLY reason this exists is the supporter key.
// mobile/services/mealAPI.js used to call themealdb.com straight from the
// bundle on the test key "1", which their terms permit for "development or
// educational use" only: a public app store release is expected to hold a
// supporter key. A key in the bundle is extractable by anyone who unzips the
// IPA, so it has to be injected here instead.
//
// Shape is deliberately dumb: same endpoint names, same query params, response
// forwarded verbatim. That keeps mealAPI.js a one-line change (BASE_URL) rather
// than 8 bespoke routes with 8 response shapes to keep in sync.
//
// No requireAuth — Discover is meant to work before signup. contentLimiter is
// what stands between the paid key and someone using us as a free proxy.
const CONTENT_ENDPOINTS = new Set([
  "search.php", "lookup.php", "random.php", "categories.php", "filter.php", "list.php",
]);
// TheMealDB's whole query vocabulary: s=search, i=id/ingredient, a=area,
// c=category, f=first letter. Anything else is dropped rather than forwarded.
const CONTENT_PARAMS = ["s", "i", "a", "c", "f"];

// In-memory TTL cache (API-3). TheMealDB content is static-ish: a recipe by
// id or the category list changes rarely, searches a little more often, and
// random.php must NEVER be cached (same URL, different meal each call — it's
// deliberately absent from the table). Entries outlive their TTL so an
// upstream outage coasts on the last good answer instead of 502ing Discover.
// One Railway instance, so in-memory is the whole story.
const CONTENT_TTL_MS = {
  "lookup.php": 24 * 60 * 60 * 1000,
  "categories.php": 24 * 60 * 60 * 1000,
  "list.php": 24 * 60 * 60 * 1000,
  "search.php": 60 * 60 * 1000,
  "filter.php": 60 * 60 * 1000,
};
const CONTENT_CACHE_MAX = 500;
const contentCache = new Map(); // key → { freshUntil, body }; Map order = LRU

app.get("/api/content/:endpoint", contentLimiter, async (req, res) => {
  const { endpoint } = req.params;
  if (!CONTENT_ENDPOINTS.has(endpoint)) {
    return res.status(404).json({ error: "Unknown content endpoint" });
  }
  const query = new URLSearchParams();
  for (const p of CONTENT_PARAMS) {
    if (typeof req.query[p] === "string") query.set(p, req.query[p]);
  }
  const ttl = CONTENT_TTL_MS[endpoint];
  const key = `${endpoint}?${query}`;
  const cached = ttl ? contentCache.get(key) : null;
  if (cached && cached.freshUntil > Date.now()) {
    contentCache.delete(key);
    contentCache.set(key, cached); // re-insert = mark recently used
    return res.json(cached.body);
  }
  try {
    const upstream = await fetch(`${MEALDB_BASE_URL}/${endpoint}?${query}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) throw new Error(`TheMealDB answered ${upstream.status}`);
    const body = await upstream.json();
    if (ttl) {
      contentCache.delete(key);
      contentCache.set(key, { freshUntil: Date.now() + ttl, body });
      while (contentCache.size > CONTENT_CACHE_MAX) {
        contentCache.delete(contentCache.keys().next().value);
      }
    }
    res.json(body);
  } catch (error) {
    // Stale beats a spinner: an expired entry is yesterday's truth about a
    // near-static catalogue, which is better than an error screen.
    if (cached) return res.json(cached.body);
    reportError(error, { msg: "content passthrough failed", endpoint, reqId: req.id });
    res.status(502).json({ error: "Couldn't reach the recipe library" });
  }
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

// Paste-text import: any copied text (a DM, a note, grandma's email) runs
// through the same extraction pipeline as social captions. Same dormant
// gate — no key, no pretending.
app.post("/api/import/text", requireAuth, costlyLimiter, validate(schemas.importTextBody), async (req, res) => {
  if (!extractionActive()) {
    return res.status(503).json({
      error: "Otto can't read pasted text just yet — that part of the kitchen is still being wired up.",
    });
  }
  try {
    const extracted = await extractRecipeFromText({ text: req.body.text, platform: "pasted text", authorName: null });
    if (!extracted) {
      return res.status(422).json({ error: "Otto read it twice — that text doesn't seem to hold a recipe." });
    }
    res.status(200).json({ ...extracted, image: null, sourceUrl: null, sourceName: null });
  } catch (error) {
    logger.warn({ err: error.message }, "text import failed");
    res.status(502).json({ error: "Otto couldn't make sense of that text right now — try again in a moment." });
  }
});

// "Cook something up with Otto" — AI recipe creation (Claude API). Dormant
// without a key, per-user costlyLimiter (this is the most expensive endpoint),
// and every result goes through the review editor before it can be saved.
app.post("/api/generate", requireAuth, costlyLimiter, validate(schemas.generateBody), async (req, res) => {
  if (!generationActive()) {
    return res.status(503).json({
      error: "Otto can't cook ideas up just yet — that part of the kitchen is still being wired up.",
    });
  }
  try {
    const result = await generateRecipe(req.body);
    if (!result) {
      return res.status(502).json({ error: "Otto's idea burner wouldn't light — try again in a moment." });
    }
    if (result.declined) {
      return res.status(422).json({ error: result.declined });
    }
    res.status(200).json({ ...result.recipe, image: null, source: "otto", sourceUrl: null, sourceName: null });
  } catch (error) {
    reportError(error, { msg: "recipe generation failed", userId: req.userId });
    res.status(502).json({ error: "Otto couldn't finish that idea right now — try again in a moment." });
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

// Batch seed nutrition — one call for a whole grid of cards.
//
// Why this exists: RecipeCard showed a category-typical estimate (every beef
// dish "450 CAL") while the detail screen showed the computed figure, so the
// same recipe read 450 on the card and 255 on the page it opened. The rule in
// mobile/constants/nutritionEstimates.js is that one estimator feeds both "so
// numbers never disagree"; B1 broke it.
//
// Cards cannot compute for themselves — TheMealDB's filter.php returns only
// id/title/image, no ingredients — so the numbers have to come from here.
// Per-card requests would be ~20 round trips per screen; this is one.
//
// Reads are cache-first (seedNutritionFor), and a null value is meaningful:
// it means "honestly unknown" and the card keeps its ~estimate.
app.get("/api/nutrition/seed", requireAuth, seedReadLimiter, async (req, res) => {
  try {
    const raw = String(req.query.ids || "").trim();
    if (!raw) return res.status(400).json({ error: "Missing ids" });
    const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
    // Bounded so one request can't fan out into an unbounded compute job.
    if (ids.length > 40) return res.status(400).json({ error: "Too many ids (max 40)" });
    if (!ids.every((id) => /^\d{1,10}$/.test(id))) {
      return res.status(400).json({ error: "Bad id" });
    }
    const pairs = await Promise.all(
      ids.map(async (id) => {
        // One bad recipe must not fail the whole grid — null just means the
        // card keeps its estimate.
        const nutrition = await seedNutritionFor(id).catch(() => null);
        return [id, nutrition];
      })
    );
    res.status(200).json({ nutrition: Object.fromEntries(pairs) });
  } catch (error) {
    reportError(error, { msg: "batch seed nutrition failed" });
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
// Recipe photos are stored at `${userId}/${timestamp}.${ext}` (see
// mobile/lib/uploadRecipePhoto.js), so a user's whole library is one folder.
const PHOTO_BUCKET = "recipe-photos";

// Storage's list() pages at 100. A half-done cleanup here is exactly the
// failure this route already refuses elsewhere, so page until the folder is
// empty rather than deleting the first page and calling it done.
// ponytail: hard page cap as a runaway guard — raise it if anyone ever holds
// more than 5k photos, which would be a different problem anyway.
const MAX_PHOTO_PAGES = 50;
async function deleteUserPhotos(admin, userId) {
  let removed = 0;
  for (let page = 0; page < MAX_PHOTO_PAGES; page++) {
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).list(userId, { limit: 100 });
    // A storage failure must NOT fail the request: the user's data is already
    // gone and the account deletion genuinely succeeded. Report it and let the
    // count come back short — an honest number beats a false 500.
    if (error) {
      reportError(error, { msg: "photo cleanup: list failed", userId });
      break;
    }
    if (!data?.length) break;
    const { error: removeError } = await admin.storage
      .from(PHOTO_BUCKET)
      .remove(data.map((object) => `${userId}/${object.name}`));
    if (removeError) {
      reportError(removeError, { msg: "photo cleanup: remove failed", userId });
      break;
    }
    removed += data.length;
    if (data.length < 100) break;
  }
  return removed;
}

// Deletes every row we hold for the user. Removing the AUTH user itself needs
// the Supabase service-role key — when SUPABASE_SERVICE_ROLE_KEY lands in env
// this route finishes the job automatically (App Store 5.1.1(v)).
app.delete("/api/account", requireAuth, destructiveLimiter, async (req, res) => {
  try {
    // ONE transaction. Without it a mid-sequence failure leaves the account
    // half-deleted AND returns an error — which is exactly what happened when
    // recipe_shares turned out to be missing from prod: recipes and favorites
    // were already gone, the caller was told "something went wrong", and the
    // login still worked. Deleting someone's data is not a step to get wrong
    // by halves, so it all lands or none of it does.
    await db.transaction(async (tx) => {
      await tx.delete(favoritesTable).where(eq(favoritesTable.userId, req.userId));
      await tx.delete(recipesTable).where(eq(recipesTable.userId, req.userId));
      await tx.delete(planEntriesTable).where(eq(planEntriesTable.userId, req.userId));

      // Capability URLs outlive the row they point at, so deleting the recipes
      // above is NOT enough — an un-revoked slug would keep resolving for anyone
      // who saved it. Delete outright rather than setting revokedAt: the user
      // asked to be gone, and a revoked row still carries their user_id.
      await tx.delete(recipeSharesTable).where(eq(recipeSharesTable.userId, req.userId));
      await tx.delete(listSharesTable).where(eq(listSharesTable.userId, req.userId));

      // Collaborative lists they OWN. There is no member registry to hand these
      // to — collab_items carries only a display name — so ownership cannot be
      // transferred without a schema change, and an orphaned list is one nobody
      // can ever put away. So the list dies with its owner and its items go with
      // it. Lists they merely JOINED are untouched: those belong to someone else.
      const owned = await tx
        .select({ token: collabListsTable.token })
        .from(collabListsTable)
        .where(eq(collabListsTable.ownerUserId, req.userId));
      const tokens = owned.map((row) => row.token);
      if (tokens.length > 0) {
        await tx.delete(collabItemsTable).where(inArray(collabItemsTable.token, tokens));
        await tx.delete(collabListsTable).where(inArray(collabListsTable.token, tokens));
      }
    });

    // Only once the data is safely gone do we drop the login — the reverse
    // order would strand data no one can sign in to reach.
    let authUserDeleted = false;
    let photosDeleted = 0;
    if (ENV.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);

      // Photos live in Storage, not Postgres, so the transaction above never
      // touched them — and the bucket is PUBLIC, so anything left behind stays
      // fetchable by direct URL long after the account is gone. They go for the
      // same 5.1.1(v) reason the auth user does. Service-role only: the bucket
      // deliberately has no user-facing DELETE policy.
      photosDeleted = await deleteUserPhotos(admin, req.userId);

      const { error } = await admin.auth.admin.deleteUser(req.userId);
      authUserDeleted = !error;
    }
    res.status(200).json({ dataDeleted: true, authUserDeleted, photosDeleted });
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
const PAPER_ASSET = fileURLToPath(new URL("./assets/paper-note.png", import.meta.url));
app.get("/share-assets/paper-note.png", (_req, res) => {
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

app.get("/r/:slug", publicShareLimiter, async (req, res) => {
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

app.get("/l/:token", publicShareLimiter, async (req, res) => {
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

// ------------------------------------------------- S3 COLLABORATIVE LISTS
// One list, one unguessable token, everyone who holds it pitches in. The
// token is the membership; names travel on the items themselves. No
// websockets — clients poll while the screen is open, which is honest
// enough for a grocery run.

const loadLiveList = async (token) => {
  if (!TOKEN_SHAPE.test(token)) return { status: 404 };
  const [list] = await db.select().from(collabListsTable).where(eq(collabListsTable.token, token));
  if (!list) return { status: 404 };
  if (list.revokedAt) return { status: 410 };
  return { status: 200, list };
};

app.post("/api/lists", requireAuth, costlyLimiter, validate(schemas.collabCreate), async (req, res) => {
  try {
    const token = makeShareToken();
    await db.insert(collabListsTable).values({ token, ownerUserId: req.userId });
    const seed = (req.body.items || []).map((item) => ({
      token,
      name: item.name,
      amount: item.amount || null,
      addedByName: req.body.displayName,
    }));
    if (seed.length > 0) await db.insert(collabItemsTable).values(seed);
    res.status(200).json({ token, url: `${shareBase(req)}/hl/${token}` });
  } catch (error) {
    reportError(error, { msg: "collab create failed", userId: req.userId });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/lists/:token", requireAuth, async (req, res) => {
  try {
    const found = await loadLiveList(req.params.token);
    if (found.status === 404) return res.status(404).json({ error: "No list at that link" });
    if (found.status === 410) return res.status(410).json({ error: "That list was put away" });
    const items = await db
      .select()
      .from(collabItemsTable)
      .where(eq(collabItemsTable.token, found.list.token))
      .orderBy(collabItemsTable.id);
    res.status(200).json({
      token: found.list.token,
      url: `${shareBase(req)}/hl/${found.list.token}`,
      mine: found.list.ownerUserId === req.userId,
      items,
    });
  } catch (error) {
    reportError(error, { msg: "collab load failed" });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/lists/:token/items", requireAuth, validate(schemas.collabItemAdd), async (req, res) => {
  try {
    const found = await loadLiveList(req.params.token);
    if (found.status !== 200) return res.status(found.status).json({ error: "That list isn't taking items" });
    const [created] = await db
      .insert(collabItemsTable)
      .values({
        token: found.list.token,
        name: req.body.name,
        amount: req.body.amount || null,
        addedByName: req.body.displayName,
      })
      .returning();
    res.status(200).json(created);
  } catch (error) {
    reportError(error, { msg: "collab add failed" });
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.patch("/api/lists/:token/items/:id", requireAuth, validate(schemas.collabItemCheck), async (req, res) => {
  try {
    const found = await loadLiveList(req.params.token);
    if (found.status !== 200) return res.status(found.status).json({ error: "That list isn't live" });
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });
    const [updated] = await db
      .update(collabItemsTable)
      .set({
        checked: req.body.checked,
        checkedByName: req.body.checked ? req.body.displayName : null,
      })
      .where(and(eq(collabItemsTable.token, found.list.token), eq(collabItemsTable.id, id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.status(200).json(updated);
  } catch (error) {
    reportError(error, { msg: "collab check failed" });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Household trust model: anyone holding the list can erase a line — it's a
// fridge door, not a ledger.
app.delete("/api/lists/:token/items/:id", requireAuth, async (req, res) => {
  try {
    const found = await loadLiveList(req.params.token);
    if (found.status !== 200) return res.status(found.status).json({ error: "That list isn't live" });
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });
    await db
      .delete(collabItemsTable)
      .where(and(eq(collabItemsTable.token, found.list.token), eq(collabItemsTable.id, id)));
    res.status(200).json({ ok: true });
  } catch (error) {
    reportError(error, { msg: "collab delete failed" });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Only whoever started the list can put it away.
app.delete("/api/lists/:token", requireAuth, async (req, res) => {
  try {
    const found = await loadLiveList(req.params.token);
    if (found.status !== 200) return res.status(found.status).json({ error: "That list isn't live" });
    if (found.list.ownerUserId !== req.userId) return res.status(403).json({ error: "Only the list's starter can put it away" });
    await db
      .update(collabListsTable)
      .set({ revokedAt: new Date() })
      .where(eq(collabListsTable.token, found.list.token));
    res.status(200).json({ revoked: true });
  } catch (error) {
    reportError(error, { msg: "collab revoke failed" });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// The link's landing page — tells a browser visitor how to join in the app.
app.get("/hl/:token", publicShareLimiter, async (req, res) => {
  try {
    const found = await loadLiveList(req.params.token);
    if (found.status === 404) return res.status(404).type("html").send(renderNotFoundPage());
    if (found.status === 410) return res.status(410).type("html").send(renderGonePage());
    const [row] = await db
      .select({ n: count() })
      .from(collabItemsTable)
      .where(eq(collabItemsTable.token, found.list.token));
    res.status(200).type("html").send(renderJoinPage(Number(row?.n || 0), `${shareBase(req)}/hl/${found.list.token}`));
  } catch (error) {
    reportError(error, { msg: "join page failed", token: req.params.token });
    res.status(500).type("html").send(renderNotFoundPage());
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "server listening");
});
