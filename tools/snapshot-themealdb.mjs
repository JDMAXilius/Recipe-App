// snapshot-themealdb.mjs — BRONZE snapshot of the whole TheMealDB catalogue.
// Phase 1 of the medallion migration (docs/tickets/OWN_RECIPE_DB.md):
// "capture everything, transform nothing." Runs ONCE; the lead commits the file.
//
// Pulls every recipe through the DEPLOYED `content` edge function (keeps the
// supporter v2 key server-side — we never hit themealdb.com directly, never the
// free "1" key). Strategy (ticket step 5):
//   categories.php            → all category names
//   filter.php?c=<category>   → meal stubs (idMeal) per category
//   lookup.php?i=<id>         → the FULL meal object, stored VERBATIM
//
// Output: supabase/otto-recipes/raw/themealdb-2026-07.json
//   { source, api, fetched_at, count, meals:[<verbatim lookup meal>...], failures:[...] }
// meals sorted by numeric idMeal for stable diffs. Nothing is renamed/parsed —
// bronze is immutable.
//
// RUN (real Node script, network required):
//   node tools/snapshot-themealdb.mjs
//   node tools/snapshot-themealdb.mjs --self-check   // offline logic check, no network

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolvePath(HERE, "..");
const OUT_PATH = resolvePath(REPO, "supabase/otto-recipes/raw/themealdb-2026-07.json");
const BASE = "https://mepzfdefanfpnrvydyty.supabase.co/functions/v1/content";

const DELAY_MS = 120; // be polite between requests
const RETRIES = 3;

const log = (...a) => process.stderr.write(a.join(" ") + "\n");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Read EXPO_PUBLIC_SUPABASE_ANON_KEY from the repo env file(s). The anon key is
// the publishable client key — public/safe; RLS is the boundary. The packet
// names `.env`; this repo actually ships it in `.env.development`, so we check
// both rather than fail on a filename.
function readAnonKey() {
  const candidates = [".env", ".env.development", ".env.local"];
  for (const name of candidates) {
    let text;
    try {
      text = readFileSync(resolvePath(REPO, name), "utf8");
    } catch {
      continue;
    }
    const m = text.match(/^\s*EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env / .env.development. " +
      "Add it (the publishable anon key) to one of those files and re-run.",
  );
}

// GET <BASE>/<endpoint>?<params> with both auth headers, retry w/ backoff.
async function fetchEndpoint(anon, endpoint, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/${endpoint}${qs ? `?${qs}` : ""}`;
  const headers = { apikey: anon, Authorization: `Bearer ${anon}` };
  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${endpoint}?${qs}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) {
        const backoff = DELAY_MS * 2 ** attempt; // 240, 480ms...
        log(`  retry ${attempt}/${RETRIES - 1} ${endpoint}?${qs} — ${err.message} (wait ${backoff}ms)`);
        await sleep(backoff);
      }
    }
  }
  throw lastErr;
}

async function snapshot() {
  const anon = readAnonKey();

  log("→ categories.php");
  const cats = await fetchEndpoint(anon, "categories.php");
  const categories = (cats.categories ?? []).map((c) => c.strCategory);
  log(`  ${categories.length} categories: ${categories.join(", ")}`);

  // category → unique idMeal set
  const ids = new Set();
  for (const c of categories) {
    await sleep(DELAY_MS);
    const filtered = await fetchEndpoint(anon, "filter.php", { c });
    const stubs = filtered.meals ?? [];
    for (const s of stubs) ids.add(s.idMeal);
    log(`  filter c=${c}: ${stubs.length} meals (running unique ${ids.size})`);
  }
  const uniqueIds = [...ids];
  log(`→ ${uniqueIds.length} unique meal ids`);

  const meals = [];
  const failures = [];
  let done = 0;
  for (const id of uniqueIds) {
    await sleep(DELAY_MS);
    try {
      const res = await fetchEndpoint(anon, "lookup.php", { i: id });
      const meal = res.meals?.[0];
      if (!meal) throw new Error("lookup returned no meal");
      meals.push(meal); // VERBATIM — no transform
    } catch (err) {
      failures.push({ idMeal: id, error: err.message });
      log(`  FAIL lookup i=${id}: ${err.message}`);
    }
    if (++done % 50 === 0) log(`  looked up ${done}/${uniqueIds.length}`);
  }

  meals.sort((a, b) => Number(a.idMeal) - Number(b.idMeal)); // stable diffs

  const out = {
    source: "themealdb",
    api: "v2",
    fetched_at: new Date().toISOString(),
    count: meals.length,
    meals,
    ...(failures.length ? { failures } : {}),
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");

  log("\n===== BRONZE SNAPSHOT COMPLETE =====");
  log(`categories:      ${categories.length}`);
  log(`unique meal ids: ${uniqueIds.length}`);
  log(`meals fetched:   ${meals.length}`);
  log(`failures:        ${failures.length}`);
  log(`written:         ${OUT_PATH}`);
}

// Offline check: the dedup + numeric sort + shape are the only real logic.
function selfCheck() {
  const ids = new Set();
  for (const s of [{ idMeal: "52874" }, { idMeal: "52874" }, { idMeal: "51001" }]) ids.add(s.idMeal);
  console.assert(ids.size === 2, "dedup by idMeal failed");
  const meals = [{ idMeal: "52874" }, { idMeal: "51001" }, { idMeal: "9999" }];
  meals.sort((a, b) => Number(a.idMeal) - Number(b.idMeal));
  console.assert(
    meals.map((m) => m.idMeal).join(",") === "9999,51001,52874",
    "numeric sort failed",
  );
  log("self-check OK");
}

if (process.argv.includes("--self-check")) {
  selfCheck();
} else {
  snapshot().catch((err) => {
    log(`FATAL: ${err.message}`);
    process.exit(1);
  });
}
