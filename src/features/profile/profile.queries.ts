// Supabase calls for profile (feature-module.md §3: all Supabase access lives
// in *.queries.ts). Account deletion is the deployed `delete-account` edge
// function — App Store 5.1.1(v). The user id comes from the verified access
// token the client attaches, never the body; the function wipes owned rows,
// storage photos, then the auth user in that order.
import { supabase } from '@/shared/supabase/client';

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
}
