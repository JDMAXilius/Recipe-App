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
  // Caption/photo → recipe extraction (I1b) — founder-provided; the
  // extraction seam stays dormant (honest error copy) without it.
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  // Optional "appid|appsecret" Meta app token — raises IG oEmbed rate
  // limits; the tokenless endpoint works without it (I1a).
  META_OEMBED_TOKEN: process.env.META_OEMBED_TOKEN,
  // Public origin for share links (S2), e.g. https://ottosapp.com — falls back
  // to the request host so Railway works with zero config.
  SHARE_BASE_URL: process.env.SHARE_BASE_URL,
  // Extra browser origins allowed through CORS, comma-separated. The marketing
  // site and localhost are already built in; this is for anything new (a
  // preview deploy, a second front end) without a code change.
  WEB_ORIGINS: process.env.WEB_ORIGINS,
  // TheMealDB supporter key. Serves /api/content and lib/content/RecipeSource;
  // absent, both fall back to the test key "1" (v1), which their terms allow
  // for development only. SERVER-SIDE ONLY — never EXPO_PUBLIC_*, a key in the
  // app bundle can be read straight out of the IPA.
  THEMEALDB_KEY: process.env.THEMEALDB_KEY,
};
