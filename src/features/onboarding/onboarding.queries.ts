// The catalogue shelf the first week is built from (R1.4). otto_recipes is
// readable without an account (RLS: anon select), so this runs before sign-up.
// Only the fields the builder needs; desserts, sides, breakfasts and starters
// stay on the server.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';
import type { CatalogueDish } from './firstWeek';

type Row = {
  id: string;
  title: string | null;
  category: string | null;
  area: string | null;
  image: string | null;
  ingredients: { name?: string | null; key?: string | null; original?: string | null }[] | null;
};

export async function fetchDinnerShelf(): Promise<CatalogueDish[]> {
  const { data, error } = await supabase
    .from('otto_recipes')
    .select('id, title:canonical->>title, category:canonical->>category, area:canonical->>area, image:canonical->media->>image, ingredients:canonical->ingredients')
    .not('canonical->>category', 'in', '(Dessert,Side,Breakfast,Starter)');
  if (error) throw error;
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.title)
    .map((r) => ({
      id: r.id,
      title: r.title as string,
      category: r.category,
      area: r.area,
      // put_in_plan takes https images only; anything else shows the category art.
      image: r.image?.startsWith('https://') ? r.image : null,
      ingredients: (r.ingredients ?? []).flatMap((i) => [i.name, i.key, i.original].filter((x): x is string => !!x)),
      items: (r.ingredients ?? []).map((i) => i.name ?? i.key ?? i.original ?? '').filter(Boolean),
    }));
}

/** `enabled`: false until a screen actually needs the shelf (it's large).
 *  meta.persist false: kept in memory, never written to the offline cache. */
export function useDinnerShelf(enabled = true) {
  return useQuery({ queryKey: ['dinner-shelf'], queryFn: fetchDinnerShelf, staleTime: 24 * 60 * 60 * 1000, enabled, meta: { persist: false } });
}
