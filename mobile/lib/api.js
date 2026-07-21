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

async function attemptFetch(path, options, timeoutMs) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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

// options.timeoutMs overrides the default budget — the AI seams (generate,
// photo/text import) legitimately run 10–60s on the server and must not be
// cut off by the 15s default meant for ordinary reads and writes.
export async function authFetch(path, options = {}) {
  const { timeoutMs = TIMEOUT_MS, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  try {
    return await attemptFetch(path, fetchOptions, timeoutMs);
  } catch {
    if (method !== "GET") throw offlineError();
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      return await attemptFetch(path, fetchOptions, timeoutMs);
    } catch {
      throw offlineError();
    }
  }
}
