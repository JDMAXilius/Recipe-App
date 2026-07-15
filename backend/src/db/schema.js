import { pgTable, serial, text, timestamp, integer, jsonb, boolean, date } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  recipeId: integer("recipe_id").notNull(),
  title: text("title").notNull(),
  image: text("image"),
  cookTime: text("cook_time"),
  servings: text("servings"),
  category: text("category"), // TheMealDB category — drives calorie estimates on Saved cards
  createdAt: timestamp("created_at").defaultNow(),
});

// User recipes — imported (URL) or written by hand. Seed content (TheMealDB)
// never lands here; it stays behind the RecipeSource adapter.
export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  source: text("source").notNull(), // "imported" | "manual"
  sourceUrl: text("source_url"), // attribution: live link, immutable in UI
  sourceName: text("source_name"), // site/author name for the byline slot
  title: text("title").notNull(),
  image: text("image"),
  category: text("category"),
  area: text("area"),
  servings: integer("servings"),
  // [{ measure, name }] — the same pair shape the whole app parses/scales
  ingredients: jsonb("ingredients").notNull().default([]),
  // [string]
  steps: jsonb("steps").notNull().default([]),
  youtubeUrl: text("youtube_url"),
  // Discover-social seed (ticket P10 §4): private by default; the public
  // feed/profiles are Phase 2 (needs the moderation kit first).
  visibility: text("visibility").notNull().default("private"), // "private" | "public"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Otto's week — loose buckets, one row per planned dish. Recipe fields are a
// snapshot so seed/user recipes plan identically (and survive deletions).
export const planEntriesTable = pgTable("plan_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  day: date("day").notNull(), // the bucket — no meal slots (roadmap: structure is earned)
  recipeId: text("recipe_id"), // "52772" (seed) or "u-12" (user); null = note-only row
  title: text("title").notNull(),
  image: text("image"),
  category: text("category"),
  note: text("note"),
  cooked: boolean("cooked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
