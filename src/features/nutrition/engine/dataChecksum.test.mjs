// ONE data copy (engine.md Laws §3): engine/data/*.json must be byte-
// identical to the v1 backend copies until cutover — tools/ scripts are the
// only writers. A drifted byte here means someone edited one copy.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../..");
const v1Dir = path.join(repoRoot, "backend/src/lib/nutrition");
const dataDir = path.join(here, "data");

const FILES = [
  "usdaTable.json",
  "usdaCookedTable.json",
  "pieceWeights.json",
  "cupWeights.json",
  "recipeFacts.json",
];

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

test("engine/data JSONs are byte-identical to the v1 backend copies", () => {
  for (const f of FILES) {
    assert.equal(
      sha256(path.join(dataDir, f)),
      sha256(path.join(v1Dir, f)),
      `${f} differs from backend/src/lib/nutrition/${f} — the ONE-copy law`
    );
  }
});
