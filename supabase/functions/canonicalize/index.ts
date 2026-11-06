// canonicalize — RETIRED 2026-11-06 (architecture finding A1, Juan's go-ahead).
// It was the one-time endpoint for the 792-recipe catalogue batch, which has
// shipped. It had no user check (the anon key that ships in the app was its
// only boundary), so anyone could spend OpenAI tokens through it. This stub
// replaces it in production and spends nothing; delete the function from the
// Supabase dashboard when convenient. The original is in git history
// (before this commit); `tools/canonicalize-recipes.mjs --run-batch` needs it
// redeployed, the offline modes do not.
Deno.serve(() =>
  new Response(JSON.stringify({ error: "This endpoint is retired." }), {
    status: 410,
    headers: { "content-type": "application/json" },
  })
);
