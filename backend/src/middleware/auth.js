import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env.js";

const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

// Verifies the Supabase access token and derives the user id from it,
// so routes never trust a client-supplied userId (gotcha #2 / backlog F8).
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }
    req.userId = data.user.id;
    next();
  } catch (error) {
    console.log("Error verifying access token", error);
    res.status(500).json({ error: "Something went wrong" });
  }
}
