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
  message: { error: "That's a lot of imports at once — try again in a few minutes" },
});
