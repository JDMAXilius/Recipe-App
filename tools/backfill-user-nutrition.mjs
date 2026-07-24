// Backfill recipes.nutrition + per-line grams for USER recipes — the same
// figure the app now computes at save (src/features/import/save.compute.ts +
// nutrition.queries.resolveNutrition), applied once to rows saved BEFORE that
// fix so their card and detail agree immediately instead of only after a re-save.
//
// One source of truth, exactly like the seed recompute (tools/recompute-nutrition.mjs):
//   local computeNutrition → resolve the names the bundled table missed via the
//   resolve-nutrition edge fn → recompute with the override → store nutrition +
//   grams. Degrades honestly: resolver unreachable or below the coverage floor →
//   null nutrition stored, and BOTH card and detail fall back to the same labelled
//   category estimate (still consistent; self-heals to a real number on next save).
//
// Run (lead provides service-role — user rows are RLS-protected, anon can't read):
//   SUPABASE_URL=https://mepzfdefanfpnrvydyty.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<key> \
//   node --import ./src/features/nutrition/engine/ts-ext-resolve.mjs \
//     tools/backfill-user-nutrition.mjs --dry-run   # then --apply
import { fileURLToPath } from "node:url";
import { resolve as resolvePath } from "node:path";
import { computeNutrition, unmatchedNames } from "../src/features/nutrition/engine/compute.ts";
import { parseIngredientLine } from "../src/features/nutrition/engine/parse.ts";
import { key } from "../src/features/nutrition/engine/lookup.ts";

const log = (m) => console.log(m);

function creds() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (user rows are RLS-protected)");
  }
  return { url, serviceKey };
}

// The resolver tail, mirroring resolve.queries.resolveIngredients — but authed by
// the service-role JWT instead of a user session. Never throws: any failure → the
// name stays unresolved and the engine keeps its coverage-vetted local result.
async function resolveMisses(supabase, names) {
  const out = new Map();
  const uniq = [...new Set(names.map(key))].filter((n) => n && n.length <= 120);
  if (!uniq.length) return out;
  for (let i = 0; i < uniq.length; i += 40) {
    const batch = uniq.slice(i, i + 40);
    const { data, error } = await supabase.functions.invoke("resolve-nutrition", { body: { names: batch } });
    if (error || !data?.resolved) {
      log(`    (resolver unavailable: ${error?.message ?? "no data"} — keeping local)`);
      continue;
    }
    for (const [name, row] of Object.entries(data.resolved)) out.set(key(name), row ?? null);
  }
  return out;
}

async function main(apply) {
  const { url, serviceKey } = creds();
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Real user recipes only: has ingredients (RLS-seed/test rows have 0).
  const { data: rows, error } = await supabase
    .from("recipes")
    .select("id, title, servings, ingredients, nutrition")
    .order("id");
  if (error) throw new Error(`read recipes: ${error.message}`);
  const real = (rows ?? []).filter((r) => Array.isArray(r.ingredients) && r.ingredients.length > 0);
  log(`${real.length} user recipes with ingredients (of ${rows?.length ?? 0} rows)\n`);

  let wrote = 0;
  for (const r of real) {
    const input = {
      ingredients: r.ingredients, // {name, measure} == IngredientPair
      servings: r.servings ?? 4,
      recipeId: `u-${r.id}`,
      steps: [],
    };
    const local = computeNutrition(input);
    const missing = unmatchedNames(input);
    let nutrition = local;
    if (missing.length) {
      const resolved = await resolveMisses(supabase, missing);
      if (resolved.size) nutrition = computeNutrition(input, resolved) ?? local;
    }
    const ingredients = r.ingredients.map((i) => ({ ...i, grams: parseIngredientLine(i).grams }));

    const before = typeof r.nutrition?.kcal === "number" ? `${Math.round(r.nutrition.kcal)}` : "null";
    const after = nutrition ? `${Math.round(nutrition.kcal)} (${nutrition.confidence})` : "null (below floor → estimate)";
    log(`  u-${r.id}  ${r.title}`);
    log(`      kcal/serving: ${before} → ${after}`);

    if (apply) {
      const { error: uerr } = await supabase
        .from("recipes")
        .update({ nutrition, ingredients })
        .eq("id", r.id);
      if (uerr) throw new Error(`update u-${r.id}: ${uerr.message}`);
      wrote++;
    }
  }
  log(apply ? `\n===== BACKFILL COMPLETE: ${wrote} recipes updated =====`
            : `\n(dry-run — re-run with --apply to write)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  main(process.argv.includes("--apply")).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
