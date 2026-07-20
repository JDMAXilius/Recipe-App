// The name shown on the account screen. The interesting cases are all
// fallbacks: Sign in with Apple hands us relay addresses, and deriving a
// "name" from one produces gibberish that looks like a bug to the user.
import test from "node:test";
import assert from "node:assert/strict";
import { displayNameFor, hasUsername, cleanUsername, nameFromEmail } from "../lib/username.js";

const withName = (username) => ({ user_metadata: { username }, email: "juan.lugo@x.com" });

test("a chosen name always wins", () => {
  assert.equal(displayNameFor(withName("Juanito")), "Juanito");
  // even over a perfectly good email
  assert.equal(displayNameFor({ user_metadata: { username: "Chef Boy" }, email: "a@b.com" }), "Chef Boy");
});

test("no name falls back to the email's first word", () => {
  assert.equal(displayNameFor({ email: "juan.lugo@x.com" }), "Juan");
  assert.equal(displayNameFor({ email: "maria_perez@x.com" }), "Maria");
});

test("Apple relay addresses fall back to Chef, not gibberish", () => {
  // the whole reason this module exists
  assert.equal(displayNameFor({ email: "zrz2p6fhgc@privaterelay.appleid.com" }), "Chef");
  assert.equal(displayNameFor({ email: "ABC123@PrivateRelay.AppleID.com" }), "Chef");
});

test("never renders empty", () => {
  for (const user of [null, undefined, {}, { email: "" }, { email: "@x.com" }]) {
    assert.equal(displayNameFor(user), "Chef", `empty for ${JSON.stringify(user)}`);
  }
  assert.equal(displayNameFor({}, "Me"), "Me"); // household screen's fallback
});

test("whitespace-only metadata counts as no name", () => {
  assert.equal(hasUsername(withName("   ")), false);
  assert.equal(hasUsername(withName("Juan")), true);
  assert.equal(hasUsername({}), false);
  // and it must not shadow the email fallback
  assert.equal(displayNameFor(withName("   ")), "Juan");
});

test("cleanUsername trims, collapses, and caps", () => {
  assert.equal(cleanUsername("  Juan   Diego  "), "Juan Diego");
  assert.equal(cleanUsername("\n\tChef\n"), "Chef");
  assert.equal(cleanUsername("x".repeat(50)).length, 24);
  // "" is the clear-the-name signal, not an accident
  assert.equal(cleanUsername("   "), "");
  assert.equal(cleanUsername(null), "");
});

test("nameFromEmail returns empty (not 'Me') so callers pick the fallback", () => {
  assert.equal(nameFromEmail(""), "");
  assert.equal(nameFromEmail("juan@x.com"), "Juan");
});
