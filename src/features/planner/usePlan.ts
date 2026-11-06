import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { weekDays, type WeekDay } from './week';
import { listPlan, planRun } from './plan.queries';
import { positionAtEnd } from './plan.list';
import { flags } from '@/shared/flags';
import type { PlanEntry, AddPlanInput } from './plan.types';

export interface UsePlan {
  entries: PlanEntry[];
  days: WeekDay[];
  isLoading: boolean;
  /** The week LOADED — not merely "not loading". An errored or disabled query
   *  also reports isLoading false while `entries` is [], and consumers that
   *  prune state against the week must not treat that as "the week is empty". */
  isSuccess: boolean;
  isError: boolean;
  refetch: () => void;
  add: (input: AddPlanInput) => Promise<PlanEntry>;
  remove: (id: number) => Promise<void>;
  swap: (oldId: number, input: AddPlanInput) => Promise<void>;
  setCooked: (id: number, cooked: boolean) => Promise<void>;
  /** Free-list (ADR-0013); only call when flags.flowV2 is on. */
  setLabel: (id: number, label: string | null) => Promise<void>;
  move: (id: number, day: string, position: number) => Promise<void>;
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
    label: input.label ?? null,
    kind: input.kind ?? 'recipe',
    position: input.position ?? null,
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

  // Writes go through the action runners (R0.9), the same calls Otto makes.
  const ctx = () => ({ userId: userId as string });
  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: key });
    return { prev: qc.getQueryData<PlanEntry[]>(key) ?? [] };
  };
  const rollback = (ctx?: { prev: PlanEntry[] }) => {
    if (ctx) qc.setQueryData(key, ctx.prev);
  };

  // A new item lands at the end of its day (free list). Position comes from
  // the cached week, so it's computed once, here, for both the optimistic row
  // and the write.
  const withPosition = (input: AddPlanInput): AddPlanInput => {
    if (!flags.flowV2 || input.position != null) return input;
    const day = (qc.getQueryData<PlanEntry[]>(key) ?? []).filter((e) => e.day === input.day);
    return { ...input, position: positionAtEnd(day) };
  };

  const addMut = useMutation({
    mutationFn: (input: AddPlanInput) => planRun.add(input, ctx()).then((o) => o.result),
    onMutate: async (input: AddPlanInput) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, [...ctx.prev, tempEntry(userId as string, input)]);
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => planRun.remove({ id }, ctx()).then(() => undefined),
    onMutate: async (id: number) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, ctx.prev.filter((e) => e.id !== id));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  // Swap = one update of the slot (replacePlanEntry): it keeps its id, day,
  // label and position. Optimistic: the dish changes on tap, a failure rolls back.
  const swapMut = useMutation({
    mutationFn: ({ oldId, input }: { oldId: number; input: AddPlanInput }) => planRun.swap({ ...input, id: oldId }, ctx()),
    onMutate: async ({ oldId, input }: { oldId: number; input: AddPlanInput }) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, ctx.prev.map((e) =>
        e.id === oldId
          ? { ...e, recipe_id: input.recipeId, title: input.title, image: input.image ?? null, category: input.category ?? null, note: input.note ?? null, cooked: false }
          : e,
      ));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const labelMut = useMutation({
    mutationFn: (v: { id: number; label: string | null }) => planRun.setLabel(v, ctx()).then(() => undefined),
    onMutate: async ({ id, label }: { id: number; label: string | null }) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, ctx.prev.map((e) => (e.id === id ? { ...e, label } : e)));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const moveMut = useMutation({
    mutationFn: (v: { id: number; day: string; position: number }) => planRun.move(v, ctx()).then(() => undefined),
    onMutate: async ({ id, day, position }: { id: number; day: string; position: number }) => {
      const ctx = await snapshot();
      qc.setQueryData<PlanEntry[]>(key, ctx.prev.map((e) => (e.id === id ? { ...e, day, position } : e)));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const cookedMut = useMutation({
    mutationFn: (v: { id: number; cooked: boolean }) => planRun.setCooked(v, ctx()).then(() => undefined),
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
    isSuccess: query.isSuccess,
    isError: query.isError,
    refetch: () => void query.refetch(),
    add: (input) => addMut.mutateAsync(withPosition(input)),
    remove: (id) => removeMut.mutateAsync(id),
    swap: (oldId, input) => swapMut.mutateAsync({ oldId, input }).then(() => undefined),
    setCooked: (id, cooked) => cookedMut.mutateAsync({ id, cooked }),
    setLabel: (id, label) => labelMut.mutateAsync({ id, label }),
    move: (id, day, position) => moveMut.mutateAsync({ id, day, position }),
  };
}
