// ONE data copy (engine.md Laws §3): engine/data/ is now the SOLE home of the
// nutrition tables — tools/ scripts are the only writers. Before the v1 cutover
// this test compared byte-for-byte against backend/src/lib/nutrition; with v1
// removed, it guards that the five tables are present, parseable, and non-empty
// (a truncated/corrupted write is caught here). tools/ regeneration updates the
// pinned counts below if the corpus legitimately changes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");

// Minimum entry counts — a truncated file (the failure this guards) drops well
// below these; a legitimate corpus edit via tools/ only ever grows them.
const FILES = {
  "usdaTable.json": 900,
  "usdaCookedTable.json": 1,
  "pieceWeights.json": 1,
  "cupWeights.json": 1,
  "recipeFacts.json": 1,
};

test("engine/data JSONs are present, parseable, and non-empty (the one copy)", () => {
  for (const [f, minKeys] of Object.entries(FILES)) {
    const raw = readFileSync(path.join(dataDir, f), "utf8");
    const parsed = JSON.parse(raw); // throws on corruption
    const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
    assert.ok(
      count >= minKeys,
      `${f} has ${count} entries, expected >= ${minKeys} — truncated or corrupted?`,
    );
  }
});
