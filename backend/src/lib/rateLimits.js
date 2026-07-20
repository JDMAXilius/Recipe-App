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

// /api/content passthrough (the TheMealDB supporter key). Deliberately per-IP
// and NOT behind requireAuth: Discover is meant to be browsable before anyone
// makes an account, which is the whole point of the anonymous-guest flow. The
// limit is what protects the paid key from being farmed as a free proxy —
// generous for real browsing (a Discover load is ~8 calls), tight enough that
// scripted scraping hits a wall long before our quota does.
export const contentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests — give Otto a second to catch up" },
});

// Account deletion — irreversible and never a thing you do twice in a row.
// This is the one route where the reel's "5 per 15 min" bar is exactly right:
// no honest user hits it, and it caps the damage a stolen token can do.
export const destructiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.userId, // always mounted after requireAuth
  message: { error: "Too many requests — give it a few minutes and try again" },
});

// Public share pages (/r, /l, /hl). The token IS the membership, so guessing
// one is an unauthorized read — but the tokens are ~72 bits of CSPRNG, so
// this limiter isn't really about brute force (that's infeasible either way):
// it's about blunting scrapers walking links they've collected. Per-IP, and
// well above what a link-preview crawler storm needs, because a WhatsApp
// group opening the same list is a normal Tuesday.
export const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests — give Otto a second to catch up" },
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
