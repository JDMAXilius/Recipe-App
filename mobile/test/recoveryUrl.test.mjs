// Parsing the recovery link. Supabase returns the session two different ways
// depending on flow type, and getting this wrong means a user who clicked a
// valid link sees "that link has expired" — the most demoralizing possible lie.
// Mirrors the parsing in app/reset-password.jsx.
import test from "node:test";
import assert from "node:assert/strict";

// The shape under test, extracted so it can run without expo-linking.
function parseRecoveryUrl(url) {
  if (!url) return null;
  const queryStart = url.indexOf("?");
  const hashStart = url.indexOf("#");
  const query = queryStart !== -1 ? url.slice(queryStart + 1, hashStart === -1 ? undefined : hashStart) : "";
  const code = new URLSearchParams(query).get("code");
  if (code) return { kind: "pkce", code };
  const fragment = hashStart !== -1 ? url.slice(hashStart + 1) : "";
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) return { kind: "implicit", access_token, refresh_token };
  return null;
}

test("implicit flow: tokens arrive in the fragment", () => {
  const r = parseRecoveryUrl(
    "mobile://reset-password#access_token=abc123&refresh_token=ref456&type=recovery&expires_in=3600"
  );
  assert.deepEqual(r, { kind: "implicit", access_token: "abc123", refresh_token: "ref456" });
});

test("PKCE flow: a code arrives in the query", () => {
  const r = parseRecoveryUrl("mobile://reset-password?code=pkce-code-789");
  assert.deepEqual(r, { kind: "pkce", code: "pkce-code-789" });
});

test("a code wins over a fragment when both somehow appear", () => {
  const r = parseRecoveryUrl("mobile://reset-password?code=xyz#access_token=a&refresh_token=b");
  assert.equal(r.kind, "pkce");
});

test("half a fragment is not a session", () => {
  // an access_token with no refresh_token cannot restore a session — treating
  // it as valid would strand the user on a form that can never save
  assert.equal(parseRecoveryUrl("mobile://reset-password#access_token=only"), null);
  assert.equal(parseRecoveryUrl("mobile://reset-password#refresh_token=only"), null);
});

test("plain and empty URLs yield nothing rather than throwing", () => {
  for (const url of ["mobile://reset-password", "", null, undefined]) {
    assert.equal(parseRecoveryUrl(url), null, `for ${JSON.stringify(url)}`);
  }
});

test("https redirect (web) parses the same way", () => {
  const r = parseRecoveryUrl(
    "https://ottosapp.com/reset-password#access_token=t1&refresh_token=t2&type=recovery"
  );
  assert.equal(r.kind, "implicit");
  assert.equal(r.access_token, "t1");
});
