import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// EXPO_PUBLIC_* vars are inlined by Expo at build time on web and native —
// the standard SDK 50+ pattern (no expo-constants indirection needed).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env',
  );
}

// ponytail: default (in-memory/localStorage) auth storage — native session
// persistence needs AsyncStorage, which isn't an installed dependency yet.
// Wire `auth.storage` when the auth feature packet adds it.
export const supabase = createClient<Database>(url, anonKey);
