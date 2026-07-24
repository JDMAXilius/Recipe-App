// deploy-recipes.mjs — SERVING-COPY deployer for the medallion catalogue.
// Phase 4 of docs/tickets/OWN_RECIPE_DB.md: silver → serving copy.
//   silver  = supabase/otto-recipes/canonical/recipes.json (THE source of truth)
//   serving = the `otto_recipes` table (id, canonical jsonb, provenance jsonb)
//
// This is the ONLY writer to `otto_recipes` (data-ownership Law 3 — the serving
// copy is a derived build artifact, regenerable any time from silver). Idempotent:
// upserts on the `id` primary key, so re-running just refreshes rows.
//
// Uses a SERVICE-ROLE client — writes bypass RLS (public read / no public write).
// The lead runs it; the key never lives in the repo.
//
// RUN:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/deploy-recipes.mjs
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/deploy-recipes.mjs --dry-run
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { createClient } from "@supabase/supabase-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolvePath(HERE, "..");
const SILVER_PATH = resolvePath(REPO, "supabase/otto-recipes/canonical/recipes.json");
const BATCH = 100;

const log = (...a) => process.stderr.write(a.join(" ") + "\n");
const dryRun = process.argv.includes("--dry-run");

// Silver → the exact row shape `otto_recipes` stores. The whole canonical record
// is the `canonical` column; `provenance` is lifted out so it can be indexed/read
// without unpacking the blob. A record missing an id is a corrupt silver row — fail
// loudly rather than upsert a null primary key.
function toRow(record) {
  if (!record || typeof record.id !== "string" || !record.id) {
    throw new Error(`silver record missing string id: ${JSON.stringify(record)?.slice(0, 120)}`);
  }
  return {
    id: record.id,
    canonical: record,
    provenance: record.provenance ?? null,
  };
}

async function deploy() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in the environment. " +
        "Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/deploy-recipes.mjs",
    );
  }

  const records = JSON.parse(readFileSync(SILVER_PATH, "utf8"));
  if (!Array.isArray(records)) {
    throw new Error(`expected an array in ${SILVER_PATH}, got ${typeof records}`);
  }
  const rows = records.map(toRow);
  log(`silver: ${rows.length} records from ${SILVER_PATH}`);

  if (dryRun) {
    log(`[dry-run] would upsert ${rows.length} rows to otto_recipes in ${Math.ceil(rows.length / BATCH)} batch(es).`);
    log(`[dry-run] no writes performed.`);
    return;
  }

  // Service-role client — bypasses RLS for the write. No auth session needed.
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("otto_recipes").upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`upsert batch @${i}: ${error.message}`);
    upserted += batch.length;
    log(`  upserted ${upserted}/${rows.length}`);
  }

  log(`\n===== DEPLOY COMPLETE =====`);
  log(`${upserted} upserted`);
}

// Offline check: the only real logic is toRow (shape + id guard).
function selfCheck() {
  const rec = { id: "52764", title: "X", provenance: { source: "themealdb" } };
  const row = toRow(rec);
  console.assert(row.id === "52764", "id mapping");
  console.assert(row.canonical === rec, "canonical is the whole record");
  console.assert(row.provenance.source === "themealdb", "provenance lifted");
  const noProv = toRow({ id: "1" });
  console.assert(noProv.provenance === null, "missing provenance → null");
  let threw = false;
  try { toRow({ title: "no id" }); } catch { threw = true; }
  console.assert(threw, "missing id throws");
  log("self-check OK");
}

if (process.argv.includes("--self-check")) {
  selfCheck();
} else {
  deploy().catch((err) => {
    log(`FATAL: ${err.message}`);
    process.exit(1);
  });
}
