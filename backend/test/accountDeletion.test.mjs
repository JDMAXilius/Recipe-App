import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The real failure mode here isn't a wrong query — it's a table nobody
// remembered. DELETE /api/account shipped covering three tables while five
// carried user-owned rows, so a deleted user's share links kept resolving.
// Rather than stand up a database, read the source: every table with a
// user_id (or owner_user_id) column must be named in the deletion handler.
// A new user-owned table then fails this test the day it's added.

const src = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const schema = src("../src/db/schema.js");
const server = src("../src/server.js");

const userOwnedTables = [...schema.matchAll(/export const (\w+) = pgTable\("([^"]+)",\s*\{([\s\S]*?)\n\}\);/g)]
  .filter(([, , , body]) => /"(?:owner_)?user_id"/.test(body))
  .map(([, constName, tableName]) => ({ constName, tableName }));

const handler = server.slice(
  server.indexOf('app.delete("/api/account"'),
  server.indexOf("\napp.", server.indexOf('app.delete("/api/account"') + 1)
);

test("the schema still has user-owned tables to check", () => {
  assert.ok(userOwnedTables.length >= 5, `found only ${userOwnedTables.length}`);
  assert.ok(handler.length > 0, "could not locate the DELETE /api/account handler");
});

test("account deletion touches every table that stores user-owned rows", () => {
  const missed = userOwnedTables.filter(({ constName }) => !handler.includes(constName));
  assert.deepEqual(
    missed.map((t) => t.tableName),
    [],
    "these tables keep a deleted user's rows — add them to DELETE /api/account"
  );
});

test("collab items go with the list they hang off", () => {
  // No user_id of their own, so the check above can't catch them: they are
  // reachable only by the owning list's token.
  assert.ok(handler.includes("collabItemsTable"), "orphaned collab_items rows survive deletion");
});
