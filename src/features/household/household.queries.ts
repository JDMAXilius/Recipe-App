// All Supabase calls for the shared-kitchen (household) domain. A household is a
// small group that shares one shopping list: members join via an invite code,
// the list aggregates everyone's planned week, and check-offs + custom items
// live in household_list_state (realtime, so a tick on one phone shows on
// another). RLS confines every row to the caller's household.
import { supabase } from '@/shared/supabase/client';

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

export interface HouseholdMember {
  user_id: string;
  display_name: string | null;
  joined_at: string;
}

export interface ListStateRow {
  item_key: string;
  checked: boolean;
  custom_name: string | null;
}

// Unambiguous invite code — no O/0/I/1 to misread over text.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// The caller's household (a user is in at most one — the first membership wins).
export async function getMyHousehold(userId: string): Promise<Household | null> {
  const { data: mem } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (!mem) return null;
  const { data } = await supabase
    .from('households')
    .select('id, name, invite_code, created_by')
    .eq('id', mem.household_id)
    .maybeSingle();
  return data ?? null;
}

export async function getMembers(householdId: string): Promise<HouseholdMember[]> {
  const { data } = await supabase
    .from('household_members')
    .select('user_id, display_name, joined_at')
    .eq('household_id', householdId)
    .order('joined_at');
  return data ?? [];
}

export async function createHousehold(userId: string, displayName: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .insert({ created_by: userId, invite_code: newCode(), name: 'Our kitchen' })
    .select('id, name, invite_code, created_by')
    .single();
  if (error) throw error;
  const { error: memErr } = await supabase
    .from('household_members')
    .insert({ household_id: data.id, user_id: userId, display_name: displayName || null });
  if (memErr) throw memErr;
  return data;
}

// Join via invite code (SECURITY DEFINER RPC — the caller can't see the row
// until they're a member). Then stamp their display name on the membership.
export async function joinHousehold(userId: string, code: string, displayName: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_household', { code });
  if (error) throw error;
  const householdId = data as string;
  if (displayName) {
    await supabase
      .from('household_members')
      .update({ display_name: displayName })
      .eq('household_id', householdId)
      .eq('user_id', userId);
  }
  return householdId;
}

export async function leaveHousehold(householdId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);
  if (error) throw error;
}

export interface HouseholdDish {
  recipeId: string;
  title: string;
}

// Unique dishes (id + title) across EVERY member's planned week — the shared
// list's source recipes (the chips read the titles).
export async function getHouseholdWeekDishes(
  memberIds: string[],
  fromDay: string,
  toDay: string,
): Promise<HouseholdDish[]> {
  if (memberIds.length === 0) return [];
  const { data } = await supabase
    .from('plan_entries')
    .select('recipe_id, title')
    .in('user_id', memberIds)
    .gte('day', fromDay)
    .lte('day', toDay);
  const seen = new Map<string, string>();
  for (const r of data ?? []) if (r.recipe_id && !seen.has(r.recipe_id)) seen.set(r.recipe_id, r.title);
  return [...seen].map(([recipeId, title]) => ({ recipeId, title }));
}

export async function getListState(householdId: string): Promise<ListStateRow[]> {
  const { data } = await supabase
    .from('household_list_state')
    .select('item_key, checked, custom_name')
    .eq('household_id', householdId);
  return data ?? [];
}

export async function setChecked(
  householdId: string,
  itemKey: string,
  checked: boolean,
  userId: string,
): Promise<void> {
  await supabase
    .from('household_list_state')
    .upsert(
      { household_id: householdId, item_key: itemKey, checked, updated_by: userId, updated_at: new Date().toISOString() },
      { onConflict: 'household_id,item_key' },
    );
}

export async function addCustomItem(householdId: string, name: string, userId: string): Promise<void> {
  await supabase.from('household_list_state').insert({
    household_id: householdId,
    item_key: `custom-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    custom_name: name,
    checked: false,
    updated_by: userId,
  });
}

export async function removeCustomItem(householdId: string, itemKey: string): Promise<void> {
  await supabase
    .from('household_list_state')
    .delete()
    .eq('household_id', householdId)
    .eq('item_key', itemKey);
}
