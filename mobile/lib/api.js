import { supabase } from "./supabase";
import { API_URL } from "../constants/api";

// fetch() against the backend with the Supabase access token attached.
// The server derives the user from the token — never send a userId yourself.
export async function authFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
