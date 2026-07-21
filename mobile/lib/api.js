import { supabase } from "./supabase";
import { API_URL } from "../constants/api";

// fetch() against the backend with the Supabase access token attached.
// The server derives the user from the token — never send a userId yourself.
//
// Resilience (API-5): every call carries a 15s timeout, and idempotent GETs
// get ONE retry after a short pause. Writes never retry — an import or an
// Otto generation must not double-fire. Network failures throw in Otto's
// voice, because callers surface error.message straight to the toast.
const TIMEOUT_MS = 15000;

const offlineError = () =>
  new Error("Otto can't reach the kitchen — check your connection and try again.");

async function attemptFetch(path, options) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function authFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  try {
    return await attemptFetch(path, options);
  } catch {
    if (method !== "GET") throw offlineError();
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      return await attemptFetch(path, options);
    } catch {
      throw offlineError();
    }
  }
}
