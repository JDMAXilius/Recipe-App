// Supabase calls for profile (feature-module.md §3: all Supabase access lives
// in *.queries.ts). Account deletion is the deployed `delete-account` edge
// function — App Store 5.1.1(v). The user id comes from the verified access
// token the client attaches, never the body; the function wipes owned rows,
// storage photos, then the auth user in that order.
import { supabase } from '@/shared/supabase/client';

export async function deleteAccount(appleAuthorizationCode?: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: appleAuthorizationCode ? { appleAuthorizationCode } : {},
  });
  if (error) throw error;
}

// --- preferences on the account (R0.4, ADR-0010) ---------------------------
// Own row only (RLS). Null when signed out or when the account has no row yet.
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function fetchAccountPrefs(): Promise<Record<string, unknown> | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('household, diet, allergies, skips, cuisines')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

export async function pushAccountPrefs(prefs: {
  household: { adults: number; kids: number };
  diet: string;
  allergies: string[];
  skips: string[];
  cuisines: string[];
}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Download my data (R7.4): the caller's own rows as JSON (export-data). */
export async function exportMyData(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('export-data', { method: 'POST', body: {} });
  if (error) throw error;
  return JSON.stringify(data, null, 2);
}
