// useMyRecipes() — the user's own recipes, one source shared by cookbook's
// "My recipes" segment and profile's "yours" stat door (feature-module.md
// allowlist: exported by cookbook, consumed by profile). Keeps the "my recipes"
// domain definition in ONE place — profile re-querying the recipes table would
// reintroduce the card-vs-detail drift the rebuild exists to kill.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { fetchMyRecipes } from './mine.queries';
import type { MyRecipe } from './cookbook.types';

export function myRecipesKey(userId: string | null) {
  return ['myRecipes', userId] as const;
}

export function useMyRecipes() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const query = useQuery({
    queryKey: myRecipesKey(userId),
    queryFn: () => fetchMyRecipes(userId as string),
    enabled: !!userId,
  });
  const recipes: MyRecipe[] = query.data ?? [];
  return { recipes, count: recipes.length, isLoading: query.isLoading };
}
