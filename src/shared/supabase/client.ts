import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// EXPO_PUBLIC_* vars are inlined by Expo at build time on web and native —
// the standard SDK 50+ pattern (no expo-constants indirection needed).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Do NOT throw at module eval — this file is imported by every feature, and a
// throw here white-screens the entire app (React error boundaries can't catch a
// module-evaluation throw) on any misconfigured deploy (review finding). Log
// loudly and build a client with harmless placeholders so the shell still
// renders; API calls then fail into normal query-error states, not a blank page.
if (!url || !anonKey) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env. ' +
      'The app will render but every Supabase call will fail until they are set.',
  );
}

// ponytail: default (in-memory/localStorage) auth storage — native session
// persistence needs AsyncStorage, which isn't an installed dependency yet.
// Wire `auth.storage` when the auth feature packet adds it.
export const supabase = createClient<Database>(
  url ?? 'https://missing-env.invalid',
  anonKey ?? 'missing-env',
);
