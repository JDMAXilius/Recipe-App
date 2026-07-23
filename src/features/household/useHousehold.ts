// Cross-feature hooks for the shared kitchen. useHousehold() owns membership
// (profile's Household screen + the shopping list read it); useSharedList()
// owns the realtime shared check/custom state for the list. Server state is
// TanStack Query; realtime pushes just invalidate the relevant key.
import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/features/auth';
import {
  addCustomItem,
  createHousehold,
  getListState,
  getMembers,
  getMyHousehold,
  joinHousehold,
  leaveHousehold,
  removeCustomItem,
  setChecked,
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
    mutationFn: (displayName: string) => createHousehold(userId as string, displayName),
    onSuccess: invalidate,
  });
  const joinMut = useMutation({
    mutationFn: (v: { code: string; displayName: string }) =>
      joinHousehold(userId as string, v.code, v.displayName),
    onSuccess: invalidate,
  });
  const leaveMut = useMutation({
    mutationFn: () => leaveHousehold(household?.id ?? '', userId as string),
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
}

// The realtime shared check/custom state for a household's list. Null household
// → inert (personal list handles its own local state).
export function useSharedList(householdId: string | null): UseSharedList {
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

  const toggleMut = useMutation({
    mutationFn: (v: { itemKey: string; checked: boolean }) =>
      setChecked(householdId as string, v.itemKey, v.checked, userId as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const addMut = useMutation({
    mutationFn: (name: string) => addCustomItem(householdId as string, name, userId as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const removeMut = useMutation({
    mutationFn: (itemKey: string) => removeCustomItem(householdId as string, itemKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    toggle: (itemKey, checked) => toggleMut.mutate({ itemKey, checked }),
    addCustom: (name) => addMut.mutate(name),
    removeCustom: (itemKey) => removeMut.mutate(itemKey),
  };
}
