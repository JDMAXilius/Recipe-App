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
  setCooked: (id: number, cooked: boolean) => Promise<void>;
}

// Cross-feature hook (feature-module.md allowlist): recipes' add-to-week and
// profile consume this. Server state is TanStack Query only, keyed
// ['plan', userId] — no contexts, no module caches.
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

  const addMut = useMutation({
    mutationFn: (input: AddPlanInput) => addPlanEntry(userId as string, input),
    onSuccess: invalidate,
  });
  const removeMut = useMutation({
    mutationFn: (id: number) => removePlanEntry(id),
    onSuccess: invalidate,
  });
  const cookedMut = useMutation({
    mutationFn: ({ id, cooked }: { id: number; cooked: boolean }) =>
      setPlanEntryCooked(id, cooked),
    onSuccess: invalidate,
  });

  return {
    entries: query.data ?? [],
    days,
    isLoading: query.isLoading,
    add: (input) => addMut.mutateAsync(input),
    remove: (id) => removeMut.mutateAsync(id),
    setCooked: (id, cooked) => cookedMut.mutateAsync({ id, cooked }),
  };
}
