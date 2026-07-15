// Rate limiting (B0.2). Two tiers:
//  - apiLimiter: per-IP ceiling on everything — high enough that a busy
//    single household never feels it, low enough to blunt scripted abuse.
//  - costlyLimiter: per-USER budget for endpoints that call external
//    services and cost money (/api/import today; nutrition/LLM next).
//    Mount AFTER requireAuth so req.userId exists.
import { rateLimit } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests — give Otto a second to catch up" },
});

export const costlyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.userId, // always mounted after requireAuth
  message: { error: "Too many requests — give it a few minutes and try again" },
});

// Seed-nutrition views are cache-first reads (browsing recipes fires one per
// detail view) — they must NEVER share the import budget (QA P1-1). Generous
// per-user ceiling; the compute path is additionally guarded by the
// compute-once cache itself.
export const seedReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.userId,
  message: { error: "Too many requests — give it a few minutes and try again" },
});
