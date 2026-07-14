import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// On web, let supabase-js pick its own storage (localStorage in the browser,
// memory during expo-router's static/server render — AsyncStorage references
// `window` at module scope and crashes Node SSR). Native keeps AsyncStorage.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== "web" && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
