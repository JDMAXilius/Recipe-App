import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // Observability (B0.2) — Sentry stays dormant until a DSN lands here.
  SENTRY_DSN: process.env.SENTRY_DSN,
  // Test-batch ingest (B1.5), optional.
  SPOONACULAR_KEY: process.env.SPOONACULAR_KEY,
};
