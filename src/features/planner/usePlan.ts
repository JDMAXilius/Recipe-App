import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { weekDays, type WeekDay } from './week';
import {
  listPlan,
  addPlanEntry,
  removePlanEntry,
  setPlanEntryCooked,
} from './plan.queries';
import type { PlanEntry, AddPlanInput } from './plan.types';

export interface UsePlan {
  entries: PlanEntry[];
  days: WeekDay[];
  isLoading: boolean;
  add: (input: AddPlanInput) => Promise<PlanEntry>;
  remove: (id: number) => Promise<void>;
  swap: (oldId: number, input: AddPlanInput) => Promise<void>;
  setCooked: (id: number, cooked: boolean) => Promise<void>;
}

// An optimistic placeholder row so a picked/swapped dish appears instantly.
// Negative id (never collides with a serial) is replaced on the settle refetch.
function tempEntry(userId: string, input: AddPlanInput): PlanEntry {
  return {
    id: -Date.now(),
    user_id: userId,
    day: input.day,
    recipe_id: input.recipeId,
    title: input.title,
    image: input.image ?? null,
    category: input.category ?? null,
    note: input.note ?? null,
    cooked: false,
    created_at: new Date().toISOString(),
  };
}

// Cross-feature hook (feature-module.md allowlist): recipes' add-to-week and
// profile consume this. Server state is TanStack Query only, keyed
// ['plan', userId] — no contexts, no module caches. Writes are optimistic with
// rollback (the useSaved pattern): the week reacts to a tap before the round-trip.
export function usePlan(): UsePlan {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  // Recomputed per mount — an app left open past midnight must not keep
  // calling yesterday "Today". weekDays() is cheap and stable within a mount.
  const days = useMemo(() => weekDays(), []);
  const key = ['plan', userId] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: () => listPlan(userId as string, days[0].key, days[6].key),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: key });
    return { prev: qc.getQueryData<PlanEntry[]>(key) ?? [] };
  };
  const rollback = (ctx?: { prev: PlanEntry[] }) => {
    if (ctx) qc.setQueryData(key, ctx.prev);
  };

  const addMut = useMutation({
    mutationFn: (input: AddPlanInput) => addPlanEntry(userId as string, input),
    onMutate: async (input: AddPlanInput) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, [...ctx.prev, tempEntry(userId as string, input)]);
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => removePlanEntry(id),
    onMutate: async (id: number) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, ctx.prev.filter((e) => e.id !== id));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  // Swap = remove the old entry + add the replacement, one gesture. Optimistic:
  // the slot's dish changes on tap; a failed round-trip rolls the whole swap back.
  const swapMut = useMutation({
    mutationFn: async ({ oldId, input }: { oldId: number; input: AddPlanInput }) => {
      await removePlanEntry(oldId);
      await addPlanEntry(userId as string, input);
    },
    onMutate: async ({ oldId, input }: { oldId: number; input: AddPlanInput }) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, [
        ...ctx.prev.filter((e) => e.id !== oldId),
        tempEntry(userId as string, input),
      ]);
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const cookedMut = useMutation({
    mutationFn: ({ id, cooked }: { id: number; cooked: boolean }) =>
      setPlanEntryCooked(id, cooked),
    // Optimistic like add/remove/swap — the flame + strike-through must flip on
    // tap, not after the round-trip (that lag read as "cooked doesn't work").
    onMutate: async ({ id, cooked }: { id: number; cooked: boolean }) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, ctx.prev.map((e) => (e.id === id ? { ...e, cooked } : e)));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  return {
    entries: query.data ?? [],
    days,
    isLoading: query.isLoading,
    add: (input) => addMut.mutateAsync(input),
    remove: (id) => removeMut.mutateAsync(id),
    swap: (oldId, input) => swapMut.mutateAsync({ oldId, input }).then(() => undefined),
    setCooked: (id, cooked) => cookedMut.mutateAsync({ id, cooked }),
  };
}
