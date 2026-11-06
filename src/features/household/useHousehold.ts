// Cross-feature hooks for the shared kitchen. useHousehold() owns membership
// (profile's Household screen + the shopping list read it); useSharedList()
// owns the realtime shared check/custom state for the list. Server state is
// TanStack Query; realtime pushes just invalidate the relevant key.
import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/features/auth';
import {
  getListState,
  getMembers,
  getMyHousehold,
  householdRun,
  type Household,
  type HouseholdMember,
  type ListStateRow,
} from './household.queries';

// A process-unique suffix per hook instance. Two mounts of the same hook (e.g.
// the Household screen + the Shopping screen both reading useHousehold) must NOT
// share a realtime channel name — supabase.channel(name) returns the EXISTING,
// already-subscribed channel, and calling .on() on it throws "cannot add
// postgres_changes callbacks after subscribe()". A per-instance id keeps names
// distinct so each mount owns its own channel.
let channelSeq = 0;
function useChannelId(): number {
  const ref = useRef<number>(-1);
  if (ref.current < 0) ref.current = channelSeq++;
  return ref.current;
}

export interface UseHousehold {
  household: Household | null;
  members: HouseholdMember[];
  memberIds: string[];
  isLoading: boolean;
  create: (displayName: string) => Promise<void>;
  join: (code: string, displayName: string) => Promise<void>;
  leave: () => Promise<void>;
}

export function useHousehold(): UseHousehold {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const cid = useChannelId();
  const key = ['household', userId] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const household = await getMyHousehold(userId as string);
      const members = household ? await getMembers(household.id) : [];
      return { household, members };
    },
  });

  const household = query.data?.household ?? null;
  const members = query.data?.members ?? [];

  // A member joining/leaving is a membership-table change — refetch on it.
  useEffect(() => {
    if (!household) return;
    const ch = supabase
      .channel(`household-members-${household.id}-${cid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'household_members', filter: `household_id=eq.${household.id}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [household?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const createMut = useMutation({
    mutationFn: (displayName: string) => householdRun.create({ displayName }, { userId: userId as string }),
    onSuccess: invalidate,
  });
  const joinMut = useMutation({
    mutationFn: (v: { code: string; displayName: string }) => householdRun.join(v, { userId: userId as string }),
    onSuccess: invalidate,
  });
  const leaveMut = useMutation({
    mutationFn: () => householdRun.leave({ householdId: household?.id }, { userId: userId as string }),
    onSuccess: invalidate,
  });

  return {
    household,
    members,
    memberIds: members.map((m) => m.user_id),
    isLoading: query.isLoading,
    create: async (displayName) => void (await createMut.mutateAsync(displayName)),
    join: async (code, displayName) => void (await joinMut.mutateAsync({ code, displayName })),
    leave: async () => void (await leaveMut.mutateAsync()),
  };
}

export interface UseSharedList {
  rows: ListStateRow[];
  isLoading: boolean;
  toggle: (itemKey: string, checked: boolean) => void;
  addCustom: (name: string) => void;
  removeCustom: (itemKey: string) => void;
  /** Hand-removal sync: removed=true hides the row on every member's phone;
   *  removed=false is the restore/undo path. `sources` are recipe ids. */
  setRemoved: (itemKey: string, removed: boolean, sources: string[] | null) => void;
}

// The realtime shared check/custom state for a household's list. Null household
// → inert (personal list handles its own local state).
/** onError: a shared write failed and was rolled back (S8: say so, don't drop it). */
export function useSharedList(householdId: string | null, onError?: () => void): UseSharedList {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const cid = useChannelId();
  const key = ['household-list', householdId] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!householdId,
    queryFn: () => getListState(householdId as string),
  });

  useEffect(() => {
    if (!householdId) return;
    const ch = supabase
      .channel(`household-list-${householdId}-${cid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'household_list_state', filter: `household_id=eq.${householdId}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [householdId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimistic writes — the shared list must react instantly like the personal
  // list (local useState) and like usePlan. Without them, a check-off/add/remove
  // waited a full Supabase write + refetch/realtime round-trip and felt dead.
  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: key });
    const prev = qc.getQueryData<ListStateRow[]>(key) ?? [];
    return prev;
  };
  const rollback = (_e: unknown, _v: unknown, ctx: { prev: ListStateRow[] } | undefined) => {
    if (ctx) qc.setQueryData(key, ctx.prev);
    onError?.();
  };
  const settle = () => qc.invalidateQueries({ queryKey: key });
  // Writes go through the action runners (R0.9), the same calls Otto makes.
  const ctx = () => ({ userId: userId as string });
  // Never fall back to a lookup here: the screen only writes with a household.
  const hid = () => {
    if (!householdId) throw new Error('No shared kitchen.');
    return householdId;
  };

  const toggleMut = useMutation({
    mutationFn: (v: { itemKey: string; checked: boolean }) => householdRun.check({ ...v, householdId: hid() }, ctx()),
    onMutate: async (v) => {
      const prev = await snapshot();
      const next = prev.some((r) => r.item_key === v.itemKey)
        ? prev.map((r) => (r.item_key === v.itemKey ? { ...r, checked: v.checked } : r))
        : [
            ...prev,
            {
              item_key: v.itemKey,
              checked: v.checked,
              custom_name: null,
              removed: false,
              removed_sources: null,
              removed_at: null,
            },
          ];
      qc.setQueryData<ListStateRow[]>(key, next);
      return { prev };
    },
    onError: rollback,
    onSettled: settle,
  });
  const addMut = useMutation({
    mutationFn: (name: string) => householdRun.addItem({ householdId: hid(), name }, ctx()),
    onMutate: async (name) => {
      const prev = await snapshot();
      qc.setQueryData<ListStateRow[]>(key, [
        ...prev,
        {
          item_key: `tmp-${prev.length}-${name}`,
          checked: false,
          custom_name: name,
          removed: false,
          removed_sources: null,
          removed_at: null,
        },
      ]);
      return { prev };
    },
    onError: rollback,
    onSettled: settle,
  });
  const removeMut = useMutation({
    mutationFn: (itemKey: string) => householdRun.removeItem({ householdId: hid(), itemKey }, ctx()),
    onMutate: async (itemKey) => {
      const prev = await snapshot();
      qc.setQueryData<ListStateRow[]>(key, prev.filter((r) => r.item_key !== itemKey));
      return { prev };
    },
    onError: rollback,
    onSettled: settle,
  });
  const setRemovedMut = useMutation({
    mutationFn: (v: { itemKey: string; removed: boolean; sources: string[] | null }) =>
      householdRun.hideItem({ ...v, householdId: hid() }, ctx()),
    onMutate: async (v) => {
      const prev = await snapshot();
      const patch = {
        removed: v.removed,
        removed_sources: v.removed ? v.sources : null,
        removed_at: v.removed ? new Date().toISOString() : null,
      };
      const next = prev.some((r) => r.item_key === v.itemKey)
        ? prev.map((r) => (r.item_key === v.itemKey ? { ...r, ...patch } : r))
        : [...prev, { item_key: v.itemKey, checked: false, custom_name: null, ...patch }];
      qc.setQueryData<ListStateRow[]>(key, next);
      return { prev };
    },
    onError: rollback,
    onSettled: settle,
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    toggle: (itemKey, checked) => toggleMut.mutate({ itemKey, checked }),
    addCustom: (name) => addMut.mutate(name),
    removeCustom: (itemKey) => removeMut.mutate(itemKey),
    setRemoved: (itemKey, removed, sources) => setRemovedMut.mutate({ itemKey, removed, sources }),
  };
}
