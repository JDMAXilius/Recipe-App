import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Session persistence (persistence contract §2): AsyncStorage is the session
// store on every platform (it proxies localStorage on web), so a session
// survives restart instead of resetting each launch — v1 parity. Anonymous
// guest sessions persist the same way. detectSessionInUrl only on web, where
// the OAuth redirect lands back in the browser with the token in the URL.
export const supabase = createClient<Database>(
  url ?? 'https://missing-env.invalid',
  anonKey ?? 'missing-env',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
