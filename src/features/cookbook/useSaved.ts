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
    mutationFn: async (recipe: SavedRecipe) => {
      if (!userId) throw new Error('Sign in to save recipes');
      // Read current truth from cache so the toast Undo (a long-lived closure)
      // always toggles against the latest state, not a captured snapshot.
      const current = deriveSavedIds(qc.getQueryData<SavedRecipe[]>(savedKey(userId)) ?? []);
      if (current.has(recipe.recipeId)) await deleteFavorite(userId, recipe.recipeId);
      else await insertFavorite(userId, recipe);
    },
    onMutate: async (recipe: SavedRecipe) => {
      const key = savedKey(userId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<SavedRecipe[]>(key) ?? [];
      qc.setQueryData<SavedRecipe[]>(key, applyOptimisticToggle(prev, recipe));
      return { prev };
    },
    onError: (_err, _recipe, ctx) => {
      if (ctx) qc.setQueryData(savedKey(userId), ctx.prev); // roll back to server truth
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: savedKey(userId) });
    },
  });

  const toggle = useCallback(
    (recipe: SavedRecipe) => mutation.mutate(recipe),
    [mutation],
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
