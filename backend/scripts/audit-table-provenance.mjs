// Full provenance audit: does every usdaTable row's fdcId actually point at the
// food the row claims, with the numbers the row carries?
//
// Why: `chicken thighs` claimed fdcId 171077 with "Chicken, thigh, meat and
// skin, raw" @211 kcal. Fetching 171077 returns "Chicken, breast, skinless,
// boneless, meat only, raw" @120 kcal. The description and numbers were right,
// the id was borrowed from another row — so an id alone proves nothing, and the
// earlier null-fdcId backfill assumed descriptions were authoritative.
//
// Verdicts per row:
//   ok         — id resolves and both description and kcal agree
//   id-wrong   — description+numbers agree with each other but not with the id
//                (the id is the broken part; re-point it by searching the desc)
//   data-stale — id and description agree but our stored kcal drifted from USDA
//   identity   — the id's food is a DIFFERENT food from the description
//   missing    — no fdcId, or USDA has no such record
//
// Results stream to a cache file so a crash or rate-limit resumes for free.
//
//   USDA_API_KEY=... node scripts/audit-table-provenance.mjs [--table cooked] [--limit N]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detail, macrosOf, sleep } from "./usdaClient.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const which = process.argv.includes("--table") ? process.argv[process.argv.indexOf("--table") + 1] : "main";
const file = which === "cooked" ? "usdaCookedTable.json" : "usdaTable.json";
const tablePath = path.join(here, "..", "src", "lib", "nutrition", file);
const cachePath = path.join(here, `provenance-cache-${which}.json`);
const table = JSON.parse(fs.readFileSync(tablePath, "utf8"));
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

// Distinct fdcIds — many keys share one record, so audit ids, not keys.
const byId = new Map();
for (const [key, row] of Object.entries(table)) {
  if (!row?.fdcId) continue;
  if (!byId.has(row.fdcId)) byId.set(row.fdcId, []);
  byId.get(row.fdcId).push(key);
}

// Two descriptions describe the same food if the distinctive words survive.
const STOP = new Set(["raw","fresh","all","commercial","varieties","includes","and","or","with","without","the","of","year","round","average","unprepared","prepared","food","foods","usda","distribution","program","nfs","ns","to","type","commercially","plain"]);
const words = (s) =>
  new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const overlap = (a, b) => {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size);
};

const ids = [...byId.keys()].filter((id) => !cache[id]).slice(0, limit);
console.log(`${byId.size} distinct fdcIds; ${Object.keys(cache).length} cached; auditing ${ids.length} now\n`);

let done = 0;
for (const id of ids) {
  const keys = byId.get(id);
  const row = table[keys[0]];
  let usda;
  try {
    usda = await detail(id);
  } catch (e) {
    cache[id] = { verdict: "missing", keys, stored: row.usda, note: e.message };
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
    done++;
    continue;
  }
  const live = macrosOf(usda);
  const sim = overlap(row.usda, usda.description || "");
  const kcalDrift =
    Number.isFinite(live.kcal) && Number.isFinite(row.kcal)
      ? Math.abs(live.kcal - row.kcal) / Math.max(1, row.kcal)
      : 1;

  let verdict;
  if (sim >= 0.6 && kcalDrift <= 0.02) verdict = "ok";
  else if (sim >= 0.6) verdict = "data-stale";
  else if (kcalDrift <= 0.02) verdict = "identity"; // numbers coincide, food does not
  else verdict = "id-wrong";

  cache[id] = {
    verdict,
    keys,
    stored: row.usda,
    storedKcal: row.kcal,
    liveDesc: usda.description,
    liveKcal: live.kcal,
    sim: +sim.toFixed(2),
  };
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
  done++;
  if (done % 25 === 0) console.log(`  …${done}/${ids.length}`);
  await sleep(1000);
}

const all = Object.values(cache);
const tally = all.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] || 0) + 1), a), {});
console.log(`\nverdicts over ${all.length} ids:`, JSON.stringify(tally));
for (const v of ["id-wrong", "identity", "data-stale", "missing"]) {
  const rows = all.filter((r) => r.verdict === v);
  if (!rows.length) continue;
  console.log(`\n${v.toUpperCase()} (${rows.length}):`);
  for (const r of rows.slice(0, 30)) {
    console.log(`  ${r.keys.slice(0, 3).join("/")}\n     stored: ${r.stored} (${r.storedKcal} kcal)\n     usda:   ${r.liveDesc ?? r.note} (${r.liveKcal ?? "?"} kcal)`);
  }
  if (rows.length > 30) console.log(`  …and ${rows.length - 30} more (see ${path.basename(cachePath)})`);
}
