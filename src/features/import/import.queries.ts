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
import { z } from 'zod';
import { supabase } from '@/shared/supabase/client';
import { resolveNutrition, type NutritionValue } from '@/features/nutrition';
import type { Json, TablesInsert, Tables } from '@/types/database';
import {
  emptyIngredient,
  type CleanRecipe,
  type Draft,
  type IngredientPair,
  type RecipeSource,
} from './draft';
import { ingredientsWithGrams } from './save.compute';

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
      throw new Error(payload?.error ?? "Otto couldn't finish that — try again in a moment.");
    }
    throw new Error("Otto can't reach the kitchen — check your connection and try again.");
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

// Photo → review-ready draft. Claude reads the shot (cookbook page, card,
// screenshot) via generate-recipe's vision mode; the user reviews the
// transcription in the editor before any save. 'imported' (not 'otto') — Otto
// copied down someone else's recipe, he didn't dream it up.
export async function importFromPhoto(image: string, mimeType: string): Promise<Draft> {
  const data = await invokeEdge('generate-recipe', { image, mimeType });
  return toDraft(DraftResponseSchema.parse(data), 'imported');
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
  if (!bytes.length) throw new Error('That photo came through empty — try another.');

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
  const path = `${user.id}/${Date.now()}.${ext}`;

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
): Promise<{ ingredients: Json; nutrition: Json }> {
  const nutrition = await resolveNutrition({
    ingredients: recipe.ingredients,
    servings: recipe.servings,
  });
  return {
    ingredients: ingredientsWithGrams(recipe.ingredients) as unknown as Json,
    nutrition: (nutrition as NutritionValue | null) as unknown as Json,
  };
}

export async function createUserRecipe(userId: string, recipe: CleanRecipe): Promise<number> {
  const extras = await computeSaveExtras(recipe);
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...toInsert(userId, recipe), ...extras })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateUserRecipe(id: number, recipe: CleanRecipe): Promise<void> {
  const extras = await computeSaveExtras(recipe);
  // user_id/source stay put; only editable content + the recomputed
  // grams/nutrition + updated_at move.
  const { error } = await supabase
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteUserRecipe(id: number): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

// --- hooks (TanStack Query) ----------------------------------------------

export function useImportFromUrl() {
  return useMutation({ mutationFn: (url: string) => importFromUrl(url) });
}

export function useGenerateRecipe() {
  return useMutation({ mutationFn: (input: GenerateInput) => generateRecipe(input) });
}

export function useImportFromPhoto() {
  return useMutation({
    mutationFn: ({ image, mimeType }: { image: string; mimeType: string }) =>
      importFromPhoto(image, mimeType),
  });
}

export function useUploadRecipePhoto() {
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
    mutationFn: async ({ id, userId, recipe }: SaveInput): Promise<number> => {
      if (id != null) {
        await updateUserRecipe(id, recipe);
        return id;
      }
      return createUserRecipe(userId, recipe);
    },
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
    mutationFn: ({ id }: DeleteInput) => deleteUserRecipe(id),
    onSuccess: (_r, { id, userId }) => invalidateUserRecipe(qc, id, userId),
  });
}
