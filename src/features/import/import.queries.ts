// ALL Supabase + TanStack Query code for the import domain (feature-module.md
// §2/§3). Two halves:
//   • edge-function calls — URL import (import-recipe) and AI generation
//     (generate-recipe). Both parse arbitrary URLs / call the model SERVER-side
//     (SSRF guard + schema.org parsing live there); the client just posts and
//     zod-parses the reply (rule 6: zod at the trust boundary).
//   • recipes-table CRUD — typed via Database, owner-scoped by RLS. The editor
//     writes here directly; no backend REST hop (v1's /recipes is gone).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { z } from 'zod';
import { supabase } from '@/shared/supabase/client';
import { changed } from '@/shared/supabase/rows';
import { resolveNutrition, type NutritionValue } from '@/features/nutrition';
import type { Json, TablesInsert, Tables } from '@/types/database';
import {
  emptyIngredient,
  type CleanRecipe,
  type Draft,
  type IngredientPair,
  type RecipeSize,
  type RecipeSource,
  toSavePayload,
} from './draft';
import type { Runners } from '@/shared/actions/action';
import type { recipeActions } from './recipe.actions';
import { ingredientsWithGrams, retryOnTransportFailure } from './save.compute';
import { flags } from '@/shared/flags';

// --- edge functions -------------------------------------------------------

// The success shape both functions return (import-recipe adds source*; the
// one-shot generate adds them as nulls). A superset covers both.
const DraftResponseSchema = z.object({
  title: z.string(),
  image: z.string().nullable().optional(),
  servings: z.number().int().nullable().optional(),
  category: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  ingredients: z.array(z.object({ measure: z.string(), name: z.string() })),
  steps: z.array(z.string()),
  sourceUrl: z.string().nullable().optional(),
  sourceName: z.string().nullable().optional(),
});

// Invoke an edge function; on a non-2xx surface the {error} body verbatim (the
// functions write it in Otto's voice — callers put it straight on a toast).
async function invokeEdge(fn: string, body: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await error.context.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Otto couldn't finish that. Try again in a moment.");
    }
    throw new Error("Otto can't reach the kitchen. Check your connection and try again.");
  }
  return data;
}

function toDraft(parsed: z.infer<typeof DraftResponseSchema>, source: RecipeSource): Draft {
  return {
    mode: 'import',
    source,
    sourceUrl: parsed.sourceUrl ?? null,
    sourceName: parsed.sourceName ?? null,
    title: parsed.title,
    image: parsed.image ?? '',
    category: parsed.category ?? '',
    area: parsed.area ?? '',
    servings: parsed.servings ?? 1,
    ingredients: parsed.ingredients.length ? parsed.ingredients : [emptyIngredient()],
    steps: parsed.steps.length ? parsed.steps : [''],
  };
}

// URL → review-ready draft. The user reviews it in the editor before any save
// (deterministic import — the parse is server-side, never a silent AI guess).
export async function importFromUrl(url: string): Promise<Draft> {
  const data = await invokeEdge('import-recipe', { url });
  return toDraft(DraftResponseSchema.parse(data), 'imported');
}

export interface GenerateInput {
  prompt: string;
  servings?: number;
  diet?: string;
  cuisines?: string[];
}

// "Cook something up with Otto" — AI draft, same review-first editor flow.
export async function generateRecipe(input: GenerateInput): Promise<Draft> {
  const data = await invokeEdge('generate-recipe', { ...input });
  return toDraft(DraftResponseSchema.parse(data), 'otto');
}

// Pasted recipe text (a note, a message, a caption) → generate-recipe's {text}
// mode, which transcribes it faithfully instead of treating it as a request to
// invent something. 'manual': the words are someone else's, Otto tidied them.
export async function importFromText(text: string): Promise<Draft> {
  const data = await invokeEdge('generate-recipe', { text });
  return toDraft(DraftResponseSchema.parse(data), 'manual');
}

// LEGACY (ADR-0015): a photo of a recipe PAGE, transcribed by generate-recipe's
// vision mode. Shown only while flags.flowV2 is off, so the shipped app keeps
// a camera until Snap a meal ships; removed with R6.6.
export async function importRecipePage(image: string, mimeType: string): Promise<Draft> {
  const data = await invokeEdge('generate-recipe', { image, mimeType });
  return toDraft(DraftResponseSchema.parse(data), 'imported');
}

// Snap a meal (ADR-0013/0015): a photo of FOOD → the recipe of the whole dish,
// reviewed in the editor before any save. 'otto' because Otto reconstructed it.
const ScanResponseSchema = DraftResponseSchema.extend({
  scan: z.object({
    archetype: z.string(),
    seen: z.array(z.object({ name: z.string(), confident: z.boolean() })),
    portion: z.object({ count: z.number(), unit: z.string() }),
    yield: z.object({ qty: z.number(), unit: z.string() }),
    servingUnit: z.string(),
    questions: z.array(z.string()),
    assumptions: z.array(z.string()),
    checks: z.array(z.string()),
    closest: z.object({ id: z.string(), title: z.string() }).nullable(),
  }),
});

export async function scanMeal(image: string, mimeType: string): Promise<Draft> {
  const parsed = ScanResponseSchema.parse(await invokeEdge('scan-meal', { image, mimeType }));
  const { scan } = parsed;
  return {
    ...toDraft(parsed, 'otto'),
    // The user's own photo is the recipe image (ADR-0013). Kept as a data URI
    // for the review screen and uploaded only if they save (EditRecipeScreen).
    image: `data:${mimeType};base64,${image}`,
    size: { yield: scan.yield, servingUnit: scan.servingUnit },
    snap: {
      portion: scan.portion,
      seen: scan.seen,
      questions: scan.questions,
      assumptions: scan.assumptions,
      checks: scan.checks,
      closest: scan.closest,
    },
  };
}

// --- recipe-photo storage --------------------------------------------------

// The public bucket (migration 20260721090010) — objects live at
// `${userId}/${ts}.${ext}`; ownership is the first path segment (RLS INSERT).
const PHOTO_BUCKET = 'recipe-photos';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Decode base64 → bytes ourselves: supabase-js on React Native silently uploads
// a 0-byte file when handed a Blob from fetch(uri) (a long-standing RN quirk),
// and atob isn't guaranteed on every engine — so we go straight from the base64
// expo-image-picker already hands us to a Uint8Array (ported from v1).
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const bytes = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2]);
    const d = B64.indexOf(clean[i + 3]);
    bytes[p++] = (a << 2) | (b >> 4);
    if (c !== -1) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (d !== -1) bytes[p++] = ((c & 3) << 6) | d;
  }
  return p === bytes.length ? bytes : bytes.subarray(0, p);
}

// Upload a picked photo (base64 from imagePicker) to Storage, return its public
// URL — the string that goes into recipe.image, which the whole app renders.
// Owner-scoped path; throws on failure (unsigned users hit the RLS wall) so the
// caller can show an honest message.
export async function uploadRecipePhoto(base64: string, mimeType?: string | null): Promise<string> {
  const bytes = base64ToBytes(base64);
  if (!bytes.length) throw new Error('That photo came through empty. Try another.');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to add a photo from your library.');

  const ext = /png/i.test(mimeType ?? '')
    ? 'png'
    : /webp/i.test(mimeType ?? '')
      ? 'webp'
      : /heic/i.test(mimeType ?? '')
        ? 'heic'
        : 'jpg';
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  // SB-7: a random name, not Date.now() — the bucket is public with no list
  // policy, so the file name is the only thing standing between "you have the
  // link" and "you can guess it". A timestamp is guessable within a session;
  // a UUID isn't.
  const path = `${user.id}/${Crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Uploaded, but couldn't get a link back.");
  return data.publicUrl;
}

// --- recipes-table CRUD ---------------------------------------------------

function rowToDraft(row: Tables<'recipes'>): Draft {
  const pairs = (Array.isArray(row.ingredients) ? row.ingredients : []) as IngredientPair[];
  const steps = (Array.isArray(row.steps) ? row.steps : []) as string[];
  return {
    mode: 'edit',
    source: (row.source as RecipeSource) ?? 'manual',
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    title: row.title ?? '',
    image: row.image ?? '',
    category: row.category ?? '',
    area: row.area ?? '',
    servings: row.servings ?? 1,
    ingredients: pairs.length ? pairs : [emptyIngredient()],
    steps: steps.length ? steps : [''],
    size: sizeFromRow(row),
  };
}

// The size columns come from 20261106042712_recipe_size (applied 2026-11-06); an
// older database simply returns no such keys and the recipe reads as servings.
function sizeFromRow(row: Tables<'recipes'>): RecipeSize | null {
  if (!row.yield_qty || !row.yield_unit) return null;
  return { yield: { qty: Number(row.yield_qty), unit: row.yield_unit }, servingUnit: row.serving_unit ?? 'serving' };
}

// Written only when the flag is on, so a build pointed at a database without
// the migration never sends columns it doesn't have.
function sizeColumns(size: RecipeSize | null) {
  if (!flags.flowV2) return {};
  return {
    yield_qty: size?.yield.qty ?? null,
    yield_unit: size?.yield.unit ?? null,
    serving_unit: size?.servingUnit ?? null,
  };
}

function toInsert(userId: string, recipe: CleanRecipe): TablesInsert<'recipes'> {
  return {
    user_id: userId,
    source: recipe.source,
    source_url: recipe.sourceUrl,
    source_name: recipe.sourceName,
    title: recipe.title,
    image: recipe.image,
    category: recipe.category,
    area: recipe.area,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    ...sizeColumns(recipe.size),
  };
}

export async function getUserRecipe(id: number): Promise<Draft> {
  const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();
  if (error) throw error;
  return rowToDraft(data);
}

// Compute-at-save, in ONE place so create + edit persist identically: resolve
// per-line grams and the per-serving nutrition figure BEFORE the write, so
// recipes.nutrition (the previously-dead column) becomes the single source of
// truth both the card and the detail read — mirroring how seed recipes carry a
// precomputed figure. Robust by contract: resolveNutrition never throws and
// returns null below the coverage floor; a null is stored as null and the read
// path falls back to the labelled category estimate, so a save is never blocked
// on nutrition.
async function computeSaveExtras(
  recipe: CleanRecipe,
): Promise<{ ingredients: NonNullable<Json>; nutrition: Json }> {
  const nutrition = await resolveNutrition({
    ingredients: recipe.ingredients,
    servings: recipe.servings,
  });
  return {
    ingredients: ingredientsWithGrams(recipe.ingredients) as unknown as NonNullable<Json>, // the column is not null
    nutrition: (nutrition as NutritionValue | null) as unknown as Json,
  };
}

export async function createUserRecipe(userId: string, recipe: CleanRecipe): Promise<number> {
  const extras = await computeSaveExtras(recipe);
  const { data, error } = await retryOnTransportFailure(() =>
    supabase
      .from('recipes')
      .insert({ ...toInsert(userId, recipe), ...extras })
      .select('id')
      .single(),
  );
  if (error) throw error;
  return data.id;
}

export async function updateUserRecipe(id: number, recipe: CleanRecipe): Promise<void> {
  const extras = await computeSaveExtras(recipe);
  // user_id/source stay put; only editable content + the recomputed
  // grams/nutrition + updated_at move.
  const { data, error } = await retryOnTransportFailure(() =>
    supabase
      .from('recipes')
      .update({
        title: recipe.title,
        image: recipe.image,
        category: recipe.category,
        area: recipe.area,
        servings: recipe.servings,
        ingredients: extras.ingredients,
        nutrition: extras.nutrition,
        steps: recipe.steps,
        ...sizeColumns(recipe.size),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id'),
  );
  changed({ data, error }, 'That recipe');
}

export async function deleteUserRecipe(id: number): Promise<void> {
  changed(await supabase.from('recipes').delete().eq('id', id).select('id'), 'That recipe');
}

// --- actions (R0.9) --------------------------------------------------------
export const recipeRun = {
  save: async ({ id, recipe }, ctx) => {
    if (id == null) {
      const created = await createUserRecipe(ctx.userId, recipe);
      return { result: created, undo: { action: 'delete_my_recipe', input: { id: created } } };
    }
    const before = ctx.wantUndo ? toSavePayload(await getUserRecipe(id)) : null;
    await updateUserRecipe(id, recipe);
    return { result: id, undo: before?.ok ? { action: 'save_my_recipe', input: { id, recipe: before.recipe } } : null };
  },
  remove: async ({ id }, _ctx) => {
    await deleteUserRecipe(id);
    return { result: null, undo: null };
  },
} satisfies Runners<typeof recipeActions>;

// --- hooks (TanStack Query) ----------------------------------------------

export function useImportFromUrl() {
  // action-exempt: reads a link into a draft for review; saves nothing
  return useMutation({ mutationFn: (url: string) => importFromUrl(url) });
}

export function useGenerateRecipe() {
  // action-exempt: writes a draft for review; saves nothing
  return useMutation({ mutationFn: (input: GenerateInput) => generateRecipe(input) });
}

export function useImportFromText() {
  // action-exempt: reads text into a draft for review; saves nothing
  return useMutation({ mutationFn: (text: string) => importFromText(text) });
}

export function useImportRecipePage() {
  // action-exempt: reads a photo into a draft for review; saves nothing
  return useMutation({
    mutationFn: ({ image, mimeType }: { image: string; mimeType: string }) => importRecipePage(image, mimeType),
  });
}

export function useScanMeal() {
  // action-exempt: reads a meal photo into a draft for review; saves nothing
  return useMutation({
    mutationFn: ({ image, mimeType }: { image: string; mimeType: string }) => scanMeal(image, mimeType),
  });
}

export function useUploadRecipePhoto() {
  // action-exempt: stores the photo file; save_my_recipe records it on the recipe
  return useMutation({
    mutationFn: ({ base64, mimeType }: { base64: string; mimeType?: string | null }) =>
      uploadRecipePhoto(base64, mimeType),
  });
}

// Loads an existing user recipe into the editor. Namespaced key so it never
// collides with the recipes feature's detail cache.
export function useRecipeDraft(id: number | null) {
  return useQuery({
    queryKey: ['recipe', 'edit', id],
    enabled: id != null,
    queryFn: () => getUserRecipe(id as number),
  });
}

export interface SaveInput {
  id: number | null; // null → create, else update
  userId: string; // the signed-in user (from useAuth) — RLS owner on insert
  recipe: CleanRecipe;
}

// Invalidate every cache a written user recipe feeds, so no stale card/detail
// survives a save or delete (review: card-vs-detail drift after a write). The
// recipe is referenced as "u-<id>" on the detail/nutrition keys, and by the
// user's own-recipes list + the shopping list.
function invalidateUserRecipe(qc: ReturnType<typeof useQueryClient>, id: number, userId: string) {
  const ref = `u-${id}`;
  qc.invalidateQueries({ queryKey: ['recipe', 'edit', id] });
  qc.invalidateQueries({ queryKey: ['recipe', ref] });
  qc.invalidateQueries({ queryKey: ['nutrition', ref] });
  qc.invalidateQueries({ queryKey: ['myRecipes', userId] });
  qc.invalidateQueries({ queryKey: ['plan-list'] }); // ingredients may have changed
}

// Save returns the row id so the editor can route to the saved recipe.
export function useSaveRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, recipe }: SaveInput): Promise<number> =>
      recipeRun.save({ id: id ?? undefined, recipe }, { userId }).then((o) => o.result),
    onSuccess: (id, { userId }) => invalidateUserRecipe(qc, id, userId),
  });
}

export interface DeleteInput {
  id: number;
  userId: string;
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: DeleteInput) => recipeRun.remove({ id }, { userId }),
    onSuccess: (_r, { id, userId }) => invalidateUserRecipe(qc, id, userId),
  });
}
