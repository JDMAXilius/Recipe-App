// useSaved() — the cross-feature save-state hook (feature-module.md allowlist:
// exported by cookbook, consumed by recipes + profile). ALL saved server state
// flows through TanStack Query under key ['saved', userId]. Optimistic toggle
// replaces v1's hand-rolled sets + ref mirror.

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { deleteFavorite, fetchFavorites, insertFavorite } from './saved.queries';
import { applyOptimisticToggle, deriveSavedIds } from './cookbook.logic';
import type { SavedRecipe } from './cookbook.types';

export function savedKey(userId: string | null) {
  return ['saved', userId] as const;
}

export function useSaved() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: savedKey(userId),
    queryFn: () => fetchFavorites(userId as string),
    enabled: !!userId,
  });

  const saved = useMemo(() => query.data ?? [], [query.data]);
  const savedIds = useMemo(() => deriveSavedIds(saved), [saved]);
  const isSaved = useCallback((recipeId: number) => savedIds.has(recipeId), [savedIds]);

  const mutation = useMutation({
    mutationFn: async ({ recipe, wasSaved }: { recipe: SavedRecipe; wasSaved: boolean }) => {
      if (!userId) throw new Error('Sign in to save recipes');
      // Decide from the pre-toggle truth captured in toggle() — NOT from the
      // cache: React Query runs onMutate (which optimistically flips the cache)
      // BEFORE mutationFn, so reading the cache here inverts the DB op (a Save
      // would delete, an Unsave would insert a duplicate).
      if (wasSaved) await deleteFavorite(userId, recipe.recipeId);
      else await insertFavorite(userId, recipe);
    },
    onMutate: async ({ recipe }: { recipe: SavedRecipe; wasSaved: boolean }) => {
      const key = savedKey(userId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<SavedRecipe[]>(key) ?? [];
      qc.setQueryData<SavedRecipe[]>(key, applyOptimisticToggle(prev, recipe));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(savedKey(userId), ctx.prev); // roll back to server truth
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: savedKey(userId) });
    },
  });

  const toggle = useCallback(
    (recipe: SavedRecipe) => {
      // Read current truth from the cache at click time (fresh — works for the
      // toast Undo, a long-lived closure, too) and pass it so mutationFn doesn't
      // depend on the cache onMutate has already flipped.
      const wasSaved = deriveSavedIds(
        qc.getQueryData<SavedRecipe[]>(savedKey(userId)) ?? [],
      ).has(recipe.recipeId);
      mutation.mutate({ recipe, wasSaved });
    },
    [mutation, qc, userId],
  );

  return {
    saved,
    savedIds,
    isSaved,
    toggle,
    isLoading: query.isLoading,
    isSignedIn: !!userId,
  };
}
